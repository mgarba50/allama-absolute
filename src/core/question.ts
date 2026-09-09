import type { QuestionProfile } from "./types";
import { matchUniverseQuestion, routeUniverseCategory } from "./universe";

type Rule = {
  domain: string;
  words: readonly string[];
  houses: readonly number[];
  modules: readonly string[];
  decisionType?: QuestionProfile["decisionType"];
  highStakes?: boolean;
};

const RULES: readonly Rule[] = [
  { domain:"Debt", words:["debt","owe","repay","payment","debtor"], houses:[1,2,7,8], modules:["raml","houses","timing"], decisionType:"YES_NO" },
  { domain:"Marriage", words:["marry","marriage","proposal","spouse","wife","husband"], houses:[1,7], modules:["raml","houses","compatibility","abjad"], decisionType:"YES_NO" },
  { domain:"Business", words:["business","contract","profit","trade","client","supplier"], houses:[1,2,7,10], modules:["raml","houses","timing"], decisionType:"YES_NO" },
  { domain:"Employment", words:["job","employment","promotion","career","salary"], houses:[1,2,6,10], modules:["raml","houses","timing"], decisionType:"YES_NO" },
  { domain:"Travel", words:["travel","journey","flight","trip","shipment"], houses:[1,3,9], modules:["raml","houses","timing","celestial"], decisionType:"YES_NO" },
  { domain:"Lost Object", words:["lost","missing item","stolen","misplaced"], houses:[1,2,4,7], modules:["raml","houses","location"], decisionType:"LOCATION" },
  { domain:"Location", words:["where is","location","indoors","outdoors","direction","nearby"], houses:[1,3,4,7,9], modules:["raml","houses","remote-lab"], decisionType:"LOCATION" },
  { domain:"Timing", words:["when","how soon","delay","date","timing"], houses:[1], modules:["raml","timing","celestial"], decisionType:"TIMING" },
  { domain:"Comparison", words:["which of","better","best option","compare"], houses:[1,7,10], modules:["raml","comparison"], decisionType:"COMPARISON" },
  { domain:"Health Symbolism", words:["sick","illness","disease","health","doctor","pregnant","pregnancy"], houses:[1,5,6,8], modules:["raml","houses"], highStakes:true, decisionType:"OPEN" },
  { domain:"Legal", words:["court","legal","judge","police","lawsuit"], houses:[1,7,9,10], modules:["raml","houses"], highStakes:true, decisionType:"OPEN" }
];

export function normalizeQuestion(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

export function classifyQuestion(input: string): QuestionProfile {
  const normalized = normalizeQuestion(input);
  const lower = normalized.toLowerCase();
  const ranked = RULES.map((rule) => ({
    rule,
    hits: rule.words.filter((word) => lower.includes(word)).length
  })).sort((a,b) => b.hits - a.hits);

  const winner = ranked[0]?.hits ? ranked[0].rule : null;
  const notes: string[] = [];

  if (winner) {
    if (winner.highStakes) notes.push("Traditional symbolic analysis must not replace medical, legal, financial, or safety-critical professional judgment.");
    return {
      raw: input,
      normalized,
      domain: winner.domain,
      houses: winner.houses,
      modules: winner.modules,
      decisionType: winner.decisionType ?? "OPEN",
      highStakes: Boolean(winner.highStakes),
      notes
    };
  }

  const universeMatch = matchUniverseQuestion(normalized, 1)[0];
  if (universeMatch && universeMatch.score >= 0.08) {
    const route = routeUniverseCategory(universeMatch.entry.category);
    const highStakes = /health|legal|pregnancy/i.test(universeMatch.entry.category);
    notes.push("Matched against 777-question universe: " + universeMatch.entry.id + " at lexical score " + universeMatch.score.toFixed(3) + ".");
    if (highStakes) notes.push("Traditional symbolic analysis must not replace medical, legal, financial, or safety-critical professional judgment.");
    return {
      raw: input,
      normalized,
      domain: universeMatch.entry.category,
      houses: route.houses,
      modules: route.modules,
      decisionType: route.decisionType,
      highStakes,
      notes
    };
  }

  notes.push("No deterministic domain rule or 777-universe match was strong enough; practitioner review is required.");
  return {
    raw: input,
    normalized,
    domain: "General / Unclassified",
    houses: [1],
    modules: ["raml","houses"],
    decisionType: "OPEN",
    highStakes: false,
    notes
  };
}
