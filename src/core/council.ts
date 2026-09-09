import type { AbsoluteAnalysis } from "./analysis";
import type { DeepFinding, DeepFindingCategory, DeepSearchResult } from "./deepSearch";

export interface CouncilPerspective {
  id: string;
  label: string;
  school?: string;
  direction: -1 | 0 | 1;
  confidence: number;
  rationale: string;
  evidenceIds: readonly string[];
}

export interface CouncilResult {
  perspectives: readonly CouncilPerspective[];
  weightedScore: number;
  disagreement: number;
  majority: "support" | "oppose" | "split";
  dissent: readonly CouncilPerspective[];
}

export interface AnalyticalLens {
  id: string;
  label: string;
  priorities: Partial<Record<DeepFindingCategory,number>>;
  minimumStrength?: number;
  skeptical?: boolean;
  description: string;
}

export interface AnalyticalCouncilResult extends CouncilResult {
  verdict: "SUPPORT" | "OPPOSE" | "SPLIT";
  evidence: readonly DeepFinding[];
  contradiction: number;
  confidence: number;
  minorityOpinion: string | null;
  consensus: string;
  strongestObjection: DeepFinding | null;
}

export const CORE_ANALYTICAL_LENSES: readonly AnalyticalLens[] = [
  {id:"traditionalist",label:"Traditionalist",priorities:{testimony:1.5,"custom-rule":1.3,school:1.2},description:"Prioritizes configured traditional testimony and sourced rules."},
  {id:"house-master",label:"House Master",priorities:{significator:1.5,"turned-house":1.5,opposition:1.2},description:"Prioritizes house, significator and turned-house relationships."},
  {id:"elementalist",label:"Elementalist",priorities:{elements:1.6,migration:1.1},description:"Prioritizes elemental distributions and chains without inventing unstored correspondences."},
  {id:"numerist",label:"Numerist",priorities:{abjad:1.7,correlation:0.8},description:"Prioritizes deterministic Abjad and numeric intersections."},
  {id:"celestial",label:"Celestial Analyst",priorities:{planetary:1.5,lunar:1.5,timing:1.4},description:"Prioritizes calculated planetary/lunar timing context."},
  {id:"pattern-hunter",label:"Pattern Hunter",priorities:{repetition:1.5,migration:1.4,"judge-ancestry":1.3,"line-dependency":1.3,opposition:1.2},description:"Searches structural repetition, ancestry and migration."},
  {id:"skeptic",label:"Skeptic",priorities:{contradiction:1.8,correlation:1.6,testimony:1.1},skeptical:true,description:"Challenges the dominant reading and penalizes correlated evidence."},
  {id:"minimalist",label:"Minimalist",priorities:{testimony:1.4,significator:1.2},minimumStrength:0.5,description:"Uses only the strongest findings and discards weak signals."},
  {id:"historian",label:"Historian",priorities:{manuscript:1.8,school:1.4,"custom-rule":1.2},description:"Uses only supplied manuscript/source precedent and sourced rules; invents no authorities."},
  {id:"empiricist",label:"Empiricist",priorities:{"historical-case":1.8,contradiction:1.3,correlation:1.4},description:"Prioritizes resolved case evidence and calibration-oriented signals."}
];

function clamp(value: number): number {
  return Math.max(0,Math.min(1,value));
}

function perspectiveForLens(lens: AnalyticalLens,deep: DeepSearchResult): CouncilPerspective {
  const candidates = deep.findings.filter((item) => item.strength >= (lens.minimumStrength ?? 0));
  const weighted = candidates.map((item) => ({
    item,
    weight:item.strength * (lens.priorities[item.category] ?? 0.45)
  })).filter((item) => item.weight > 0);

  if (!weighted.length) {
    return {
      id:lens.id,label:lens.label,direction:0,confidence:0,
      rationale:lens.description + " No applicable evidence was available in this case.",
      evidenceIds:[]
    };
  }

  const directional = weighted.filter(({item}) => item.direction !== 0);
  if (!directional.length) {
    const top=[...weighted].sort((a,b)=>b.weight-a.weight).slice(0,3);
    return {
      id:lens.id,label:lens.label,direction:0,confidence:Math.min(0.45,top[0]?.weight ?? 0),
      rationale:lens.description + " Available findings are contextual rather than directional.",
      evidenceIds:top.map(({item})=>item.id)
    };
  }

  let signed = directional.reduce((sum,{item,weight}) => sum + item.direction*weight,0);
  const total = directional.reduce((sum,{weight}) => sum + weight,0);
  if (lens.skeptical) {
    const dominant = signed >= 0 ? 1 : -1;
    const objection = directional.filter(({item}) => item.direction === -dominant).sort((a,b)=>b.weight-a.weight)[0];
    if (objection) signed = objection.item.direction * Math.max(Math.abs(signed)*0.55,objection.weight);
    else signed *= 0.25;
  }
  const normalized = total ? signed/total : 0;
  const direction: -1 | 0 | 1 = normalized > 0.08 ? 1 : normalized < -0.08 ? -1 : 0;
  const top=[...directional].sort((a,b)=>b.weight-a.weight).slice(0,4);
  return {
    id:lens.id,label:lens.label,direction,confidence:clamp(Math.abs(normalized)),
    rationale:`${lens.description} Weighted directional score ${normalized.toFixed(3)} from ${directional.length} directional findings.`,
    evidenceIds:top.map(({item})=>item.id)
  };
}

export function deliberateCouncil(perspectives: readonly CouncilPerspective[]): CouncilResult {
  if (!perspectives.length) return { perspectives:[],weightedScore:0,disagreement:0,majority:"split",dissent:[] };

  const normalized = perspectives.map((item) => ({
    ...item,
    confidence:Math.max(0,Math.min(1,item.confidence))
  }));

  const totalWeight = normalized.reduce((sum,item) => sum + item.confidence,0);
  const weightedScore = totalWeight
    ? normalized.reduce((sum,item) => sum + item.direction * item.confidence,0) / totalWeight
    : 0;

  const majority = weightedScore > 0.1 ? "support" : weightedScore < -0.1 ? "oppose" : "split";
  const majorityDirection = majority === "support" ? 1 : majority === "oppose" ? -1 : 0;
  const dissent = majorityDirection === 0
    ? normalized.filter((item) => item.direction !== 0)
    : normalized.filter((item) => item.direction !== 0 && item.direction !== majorityDirection);

  const mean = normalized.reduce((sum,item) => sum + item.direction,0) / normalized.length;
  const disagreement = Math.sqrt(normalized.reduce((sum,item) => sum + (item.direction - mean) ** 2,0) / normalized.length);

  return { perspectives:normalized,weightedScore,disagreement,majority,dissent };
}

export function runAnalyticalCouncil(
  analysis: AbsoluteAnalysis,
  deep: DeepSearchResult,
  additionalLenses: readonly AnalyticalLens[] = []
): AnalyticalCouncilResult {
  void analysis;
  const lenses = [...CORE_ANALYTICAL_LENSES,...additionalLenses];
  const perspectives = lenses.map((lens) => perspectiveForLens(lens,deep));
  const base = deliberateCouncil(perspectives);
  const verdict = base.majority === "support" ? "SUPPORT" : base.majority === "oppose" ? "OPPOSE" : "SPLIT";
  const confidence = Math.min(1,Math.abs(base.weightedScore) * (1 - Math.min(0.75,base.disagreement/2)));
  const dominantDirection = base.majority === "support" ? 1 : base.majority === "oppose" ? -1 : 0;
  const strongestObjection = dominantDirection === 0
    ? deep.summary.strongestContrary
    : deep.findings.filter((item) => item.direction === -dominantDirection).sort((a,b)=>b.strength-a.strength)[0] ?? null;
  const evidence = deep.findings.slice(0,12);
  const minorityOpinion = base.dissent.length
    ? base.dissent.map((item) => `${item.label}: ${item.rationale}`).join(" | ")
    : null;
  const consensus = `${perspectives.filter((item)=>item.direction===dominantDirection && dominantDirection!==0).length}/${perspectives.length} lenses align with ${verdict}; ${perspectives.filter((item)=>item.direction===0).length} remain neutral.`;

  return {
    ...base,verdict,evidence,contradiction:deep.collision.contradictionStrength,confidence,
    minorityOpinion,consensus,strongestObjection
  };
}
