import { moduloAnalysis } from "./abjad";
import type { AbsoluteAnalysis } from "./analysis";
import { housePlacements } from "./chart";
import type { CaseState } from "./cases";
import { similarCases } from "./caseSearch";
import { resolveTestimonyCollisions } from "./collision";
import { identifySignificators } from "./significators";
import { flattenAncestry, traceAllJudgeLines } from "./reverse";
import { evaluateRules, type VersionedRule } from "./rules";
import { analyzeSchools, schoolDisagreements, type TraditionSchool } from "./traditions";

export type DeepFindingCategory =
  | "testimony" | "repetition" | "migration" | "elements" | "opposition" | "turned-house"
  | "significator" | "judge-ancestry" | "witness-ancestry" | "line-dependency" | "correlation"
  | "planetary" | "lunar" | "abjad" | "custom-rule" | "school" | "historical-case"
  | "contradiction" | "timing" | "manuscript";

export interface DeepFinding {
  id: string;
  category: DeepFindingCategory;
  label: string;
  detail: string;
  direction: -1 | 0 | 1;
  strength: number;
  independenceKey: string;
  provenance: readonly string[];
  evidenceIds: readonly string[];
}

export interface ManuscriptParallel {
  sourceId: string;
  title: string;
  locator?: string;
  similarity: number;
}

export interface DeepSearchInput {
  analysis: AbsoluteAnalysis;
  rules?: readonly VersionedRule[];
  schools?: readonly TraditionSchool[];
  cases?: readonly CaseState[];
  currentCaseId?: string;
  manuscriptParallels?: readonly ManuscriptParallel[];
  testimonyCalibration?: Readonly<Record<string,number>>;
}

export interface DeepSearchResult {
  findings: readonly DeepFinding[];
  searchedDimensions: readonly DeepFindingCategory[];
  unavailableDimensions: readonly DeepFindingCategory[];
  collision: ReturnType<typeof resolveTestimonyCollisions>;
  summary: {
    directionalScore: number;
    strongest: DeepFinding | null;
    strongestContrary: DeepFinding | null;
    independentSignalCount: number;
  };
}

const ALL_DIMENSIONS: readonly DeepFindingCategory[] = [
  "testimony","repetition","migration","elements","opposition","turned-house","significator",
  "judge-ancestry","witness-ancestry","line-dependency","correlation","planetary","lunar",
  "abjad","custom-rule","school","historical-case","contradiction","timing","manuscript"
];

function clamp(value: number): number {
  return Math.max(0,Math.min(1,value));
}

function directionFromQuality(quality: string): -1 | 0 | 1 {
  return quality === "favorable" ? 1 : quality === "unfavorable" ? -1 : 0;
}

function finding(
  id: string,category: DeepFindingCategory,label: string,detail: string,
  direction: -1 | 0 | 1,strength: number,independenceKey: string,
  provenance: readonly string[],evidenceIds: readonly string[] = []
): DeepFinding {
  return {id,category,label,detail,direction,strength:clamp(strength),independenceKey,provenance,evidenceIds};
}

export function runDeepSearch(input: DeepSearchInput): DeepSearchResult {
  const {analysis} = input;
  const raw: DeepFinding[] = [];
  const searched = new Set<DeepFindingCategory>([
    "testimony","repetition","migration","elements","opposition","turned-house","significator",
    "judge-ancestry","witness-ancestry","line-dependency","correlation","contradiction"
  ]);

  const independenceGroup = Object.fromEntries(analysis.evidence.map((item) => [
    item.id,item.id.includes("witness") ? "witness-layer" : item.id
  ]));
  const collision = resolveTestimonyCollisions(analysis.evidence,{
    historicalCalibration:input.testimonyCalibration,
    independenceGroup,
    questionType:analysis.question.domain,
    preferredSourcesByQuestionType:{[analysis.question.domain]:["traditional","empirical"]}
  });

  for (const ranked of collision.ranked) {
    raw.push(finding(
      "testimony-" + ranked.evidence.id,"testimony",ranked.evidence.label,
      ranked.explanation,ranked.evidence.direction,Math.min(1,ranked.effectiveStrength / 1.5),
      independenceGroup[ranked.evidence.id] ?? ranked.evidence.id,
      ["analysis.evidence",`evidence:${ranked.evidence.id}`],[ranked.evidence.id]
    ));
  }

  const placements = housePlacements(analysis.shield);
  const figureCounts = new Map<string,{name:string;houses:number[];quality:string}>();
  for (const placement of placements) {
    const current = figureCounts.get(placement.figure.id) ?? {name:placement.figure.latin,houses:[],quality:placement.figure.quality};
    current.houses.push(placement.house);
    figureCounts.set(placement.figure.id,current);
  }
  for (const [id,group] of figureCounts) {
    if (group.houses.length < 2) continue;
    raw.push(finding(
      "repeat-" + id,"repetition",group.name + " repeats",
      `Appears in houses ${group.houses.join(", ")} (${group.houses.length} placements).`,
      directionFromQuality(group.quality),Math.min(1,group.houses.length / 4),"figure-" + id,
      ["shield house placements",`figure:${id}`]
    ));
  }

  for (const item of analysis.migration) {
    raw.push(finding(
      "migration-" + item.figure.id,"migration",item.figure.latin + " migration",
      `Migration chain across houses ${item.houses.join(" → ")}.`,
      directionFromQuality(item.figure.quality),Math.min(1,item.count / 4),"figure-" + item.figure.id,
      ["analysis.migration",`figure:${item.figure.id}`]
    ));
  }

  const distribution = analysis.elements.distribution;
  const totalElements = Object.values(distribution).reduce((sum,value) => sum + value,0);
  for (const element of analysis.elements.dominant) {
    raw.push(finding(
      "element-dominant-" + element,"elements","Dominant element: " + element,
      `${distribution[element]} of ${totalElements} shield figures carry ${element}.`,0,
      totalElements ? distribution[element]/totalElements : 0,"element-" + element,
      ["analysis.elements.distribution"]
    ));
  }
  for (const element of analysis.elements.deficient) {
    raw.push(finding(
      "element-deficient-" + element,"elements","Deficient element: " + element,
      `${distribution[element]} of ${totalElements} shield figures carry ${element}.`,0,
      totalElements ? 1-(distribution[element]/totalElements) : 0,"element-" + element,
      ["analysis.elements.distribution"]
    ));
  }

  for (const mirror of analysis.mirrors) {
    if (!mirror.sameFigure && !mirror.sameElement && !mirror.qualityAgreement) continue;
    const strength = (mirror.sameFigure ? 0.5 : 0) + (mirror.sameElement ? 0.25 : 0) + (mirror.qualityAgreement ? 0.15 : 0);
    const direction = mirror.qualityAgreement ? directionFromQuality(mirror.figures[0].quality) : 0;
    raw.push(finding(
      `opposition-${mirror.houses.join("-")}`,"opposition",`House opposition ${mirror.houses[0]} ↔ ${mirror.houses[1]}`,
      [
        mirror.sameFigure ? "same figure" : "",
        mirror.sameElement ? "same element" : "",
        mirror.qualityAgreement ? "same quality" : ""
      ].filter(Boolean).join("; "),direction,strength,`mirror-${mirror.houses.join("-")}`,
      ["analysis.mirrors"]
    ));
  }

  const significators = identifySignificators(analysis.question);
  for (const sig of significators) {
    const placement = placements[sig.house-1];
    if (!placement) continue;
    raw.push(finding(
      `sig-${sig.house}-${sig.role}`,"significator",sig.role,
      `H${sig.house} carries ${placement.figure.latin} (${placement.figure.quality}); ${sig.reason}.`,
      directionFromQuality(placement.figure.quality),0.55,`house-${sig.house}`,
      ["question significator routing",`house:${sig.house}`,`figure:${placement.figure.id}`]
    ));
  }

  if (analysis.question.houses.length > 1) {
    for (const house of analysis.question.houses.slice(1)) {
      raw.push(finding(
        `turned-${house}`,"turned-house",`Relevant derived relationship at H${house}`,
        `Question routing marks H${house} as relationally relevant; turned-house derivation must preserve the identified actor as base.`,
        0,0.35,`house-${house}`,["question.houses","turned-house discipline"]
      ));
    }
  }

  const ancestryRows = traceAllJudgeLines(analysis.shield).flatMap(flattenAncestry);
  const origins = ancestryRows.filter((row) => row.node.startsWith("M"));
  const originCounts = new Map<string,number>();
  for (const row of origins) originCounts.set(row.node,(originCounts.get(row.node) ?? 0)+1);
  const totalOrigins = origins.length || 1;
  for (const [node,count] of originCounts) {
    raw.push(finding(
      "judge-origin-" + node,"judge-ancestry","Judge ancestry: " + node,
      `${count} of ${totalOrigins} terminal ancestry contributions resolve to ${node}.`,0,
      count/totalOrigins,"judge-ancestry",["reverse Judge derivation",node]
    ));
  }

  for (const [label,witness] of [["RW",analysis.shield.rightWitness],["LW",analysis.shield.leftWitness]] as const) {
    raw.push(finding(
      "witness-" + label,"witness-ancestry",label + " " + witness.latin,
      `${label} is ${witness.latin}, quality ${witness.quality}.`,
      directionFromQuality(witness.quality),0.6,"witness-layer",["shield witness",label]
    ));
  }

  const dependencyCounts = new Map<string,number>();
  for (const step of analysis.shield.lineage) {
    for (const source of step.sources) dependencyCounts.set(source,(dependencyCounts.get(source) ?? 0)+1);
  }
  for (const [source,count] of [...dependencyCounts].sort((a,b)=>b[1]-a[1]).slice(0,6)) {
    raw.push(finding(
      "dependency-" + source,"line-dependency","High-use derivation node: " + source,
      `${source} is referenced by ${count} downstream derivation operations.`,0,
      Math.min(1,count/4),"derivation-" + source,["shield.lineage"]
    ));
  }

  const repeatedIndependence = new Map<string,number>();
  for (const item of raw) repeatedIndependence.set(item.independenceKey,(repeatedIndependence.get(item.independenceKey) ?? 0)+1);
  for (const [key,count] of repeatedIndependence) {
    if (count < 2) continue;
    raw.push(finding(
      "correlation-" + key,"correlation","Correlated evidence cluster",
      `${count} findings share dependency group "${key}" and must not be treated as ${count} independent confirmations.`,
      0,Math.min(1,count/5),key,["deep-search independence analysis"]
    ));
  }

  if (analysis.celestial) {
    searched.add("planetary"); searched.add("lunar"); searched.add("timing");
    raw.push(finding(
      "planetary-hour","planetary","Current planetary hour: " + analysis.celestial.planetaryHour.planet,
      `Hour ${analysis.celestial.planetaryHour.ordinal}; ${analysis.celestial.planetaryHour.daylight ? "day" : "night"} period. No directional meaning is assigned without configured correspondence rules.`,
      0,0.35,"celestial-hour",["deterministic planetary-hour calculation"]
    ));
    raw.push(finding(
      "lunar-phase","lunar","Lunar illumination context",
      `Illuminated fraction ${(analysis.celestial.moon.fraction*100).toFixed(1)}%; phase index ${analysis.celestial.moon.phase.toFixed(3)}. Interpretive direction remains unassigned unless a rule supplies it.`,
      0,0.3,"lunar-context",["deterministic lunar calculation"]
    ));
    raw.push(finding(
      "timing-context","timing","Timing context available",
      "The analysis includes a resolved planetary-hour interval that can be compared with configured electional criteria.",
      0,0.3,"celestial-hour",["analysis.celestial.planetaryHour"]
    ));
  }

  if (analysis.abjad.length) {
    searched.add("abjad");
    const residues = analysis.abjad.map((item) => ({text:item.original,total:item.total,mod:moduloAnalysis(item.total)}));
    for (const modulus of [4,7,12,16] as const) {
      const values = residues.map((item) => item.mod[modulus]);
      const same = new Set(values).size === 1 && values.length > 1;
      raw.push(finding(
        "abjad-mod-" + modulus,"abjad",`Abjad modulo ${modulus}`,
        residues.map((item) => `${item.text}=${item.total}→${item.mod[modulus]}`).join("; "),
        0,same ? 0.65 : 0.3,`abjad-mod-${modulus}`,["deterministic Abjad calculation"]
      ));
    }
  }

  if (input.rules?.length) {
    searched.add("custom-rule");
    for (const result of evaluateRules(input.rules,analysis)) {
      if (!result.matched) continue;
      const rule = input.rules.find((item) => item.id === result.ruleId);
      raw.push(finding(
        "rule-" + result.ruleId,"custom-rule",result.label,
        `Matched configured rule ${result.ruleId}; contribution ${result.contribution.toFixed(3)}.`,
        result.contribution > 0 ? 1 : result.contribution < 0 ? -1 : 0,
        Math.min(1,Math.abs(result.contribution)),`rule-${result.ruleId}`,
        [rule?.provenance ? `source:${rule.provenance}` : "configured practitioner rule",`rule:${result.ruleId}`]
      ));
    }
  }

  if (input.schools?.length && input.rules?.length) {
    searched.add("school");
    const analyses = analyzeSchools(input.schools,input.rules,analysis);
    const disagreement = schoolDisagreements(analyses);
    for (const school of analyses) {
      raw.push(finding(
        "school-" + school.school.id,"school",school.school.name,
        `School score ${school.score.toFixed(3)}; direction ${school.direction}.`,
        school.direction,Math.min(1,Math.abs(school.score)),`school-${school.school.id}`,
        [`school:${school.school.id}`,...school.evaluations.filter((item)=>item.matched).map((item)=>`rule:${item.ruleId}`)]
      ));
    }
    if (disagreement.hasDisagreement) {
      raw.push(finding(
        "school-disagreement","contradiction","School disagreement",
        `Favorable: ${disagreement.favorable.join(", ") || "none"}; unfavorable: ${disagreement.unfavorable.join(", ") || "none"}.`,
        0,0.7,"school-disagreement",["school-specific rule evaluation"]
      ));
    }
  }

  if (input.cases?.length && input.currentCaseId) {
    const current = input.cases.find((item) => item.id === input.currentCaseId);
    if (current) {
      searched.add("historical-case");
      for (const hit of similarCases(input.cases,current,8)) {
        raw.push(finding(
          "case-" + hit.case.id,"historical-case","Similar historical case",
          `${hit.case.id}: ${hit.case.question}`,0,hit.score,`case-${hit.case.id}`,
          [`case:${hit.case.id}`]
        ));
      }
    }
  }

  if (analysis.contradiction.severity !== "none") {
    raw.push(finding(
      "contradiction-core","contradiction","Directional contradiction",
      `Severity ${analysis.contradiction.severity}; support weight ${analysis.contradiction.supportingWeight.toFixed(2)}, contrary weight ${analysis.contradiction.contraryWeight.toFixed(2)}.`,
      0,collision.contradictionStrength,"core-contradiction",["analysis.contradiction"]
    ));
  }

  if (input.manuscriptParallels?.length) {
    searched.add("manuscript");
    for (const item of input.manuscriptParallels) {
      raw.push(finding(
        "manuscript-" + item.sourceId,"manuscript",item.title,
        `${item.locator ? item.locator + "; " : ""}similarity ${(item.similarity*100).toFixed(1)}%.`,
        0,item.similarity,`source-${item.sourceId}`,[`source:${item.sourceId}`]
      ));
    }
  }

  const groupSeen = new Map<string,number>();
  const findings = raw.map((item) => {
    const seen = groupSeen.get(item.independenceKey) ?? 0;
    groupSeen.set(item.independenceKey,seen+1);
    if (!seen) return item;
    return {...item,strength:item.strength * Math.max(0.35,1/(seen+1))};
  }).sort((a,b) => b.strength-a.strength || a.id.localeCompare(b.id));

  const directional = findings.filter((item) => item.direction !== 0);
  const directionalWeight = directional.reduce((sum,item) => sum + item.strength,0);
  const directionalScore = directionalWeight
    ? directional.reduce((sum,item) => sum + item.direction*item.strength,0)/directionalWeight
    : 0;
  const strongest = directional[0] ?? findings[0] ?? null;
  const dominantDirection = directionalScore > 0.1 ? 1 : directionalScore < -0.1 ? -1 : 0;
  const strongestContrary = dominantDirection === 0
    ? directional[1] ?? null
    : directional.find((item) => item.direction === -dominantDirection) ?? null;

  return {
    findings,
    searchedDimensions:[...searched],
    unavailableDimensions:ALL_DIMENSIONS.filter((dimension) => !searched.has(dimension)),
    collision,
    summary:{
      directionalScore,
      strongest,
      strongestContrary,
      independentSignalCount:new Set(findings.map((item) => item.independenceKey)).size
    }
  };
}
