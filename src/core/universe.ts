import universeDocument from "../../ABSOLUTE_777_UNIVERSE.json";

export interface UniverseQuestion {
  id: string;
  difficulty: string;
  category: string;
  question: string;
  core_burden: readonly string[];
}

export interface UniverseMatch {
  entry: UniverseQuestion;
  score: number;
  sharedTokens: readonly string[];
}

const document = universeDocument as {
  engine: string;
  question_count: number;
  questions: UniverseQuestion[];
};

const STOP = new Set([
  "a","an","the","this","that","is","are","was","were","will","would","should","could",
  "to","of","in","on","for","with","from","and","or","but","me","my","i","it","be",
  "whether","determine","person","matter","likely"
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]+/g, " ")
    .split(/[\s/-]+/)
    .filter((token) => token.length > 2 && !STOP.has(token));
}

function tokenSet(entry: UniverseQuestion): Set<string> {
  return new Set(tokens([entry.category, entry.question, ...entry.core_burden].join(" ")));
}

const indexed = document.questions.map((entry) => ({ entry, tokens: tokenSet(entry) }));

export function universeQuestions(): readonly UniverseQuestion[] {
  return document.questions;
}

export function validateUniverse(): string[] {
  const errors: string[] = [];
  if (document.question_count !== document.questions.length) {
    errors.push("Declared question_count does not match questions length.");
  }
  const ids = new Set<string>();
  for (const entry of document.questions) {
    if (ids.has(entry.id)) errors.push("Duplicate question id: " + entry.id);
    ids.add(entry.id);
    if (!entry.category || !entry.question) errors.push("Incomplete question: " + entry.id);
  }
  return errors;
}

export function matchUniverseQuestion(query: string, topN = 5): UniverseMatch[] {
  const queryTokens = new Set(tokens(query));
  if (!queryTokens.size) return [];

  return indexed
    .map(({ entry, tokens: candidateTokens }) => {
      const shared = [...queryTokens].filter((token) => candidateTokens.has(token));
      const union = new Set([...queryTokens, ...candidateTokens]);
      const score = union.size ? shared.length / union.size : 0;
      return { entry, score, sharedTokens: shared };
    })
    .filter((result) => result.score > 0)
    .sort((a,b) => b.score - a.score)
    .slice(0, Math.max(1, topN));
}

export function routeUniverseCategory(category: string): { houses: number[]; modules: string[]; decisionType: "YES_NO" | "COMPARISON" | "TIMING" | "LOCATION" | "OPEN" } {
  const lower = category.toLowerCase();
  if (lower.includes("debt") || lower.includes("money")) return { houses:[1,2,7,8], modules:["raml","houses","timing"], decisionType:"YES_NO" };
  if (lower.includes("marriage") || lower.includes("relationship") || lower.includes("partner")) return { houses:[1,5,7], modules:["raml","houses","abjad"], decisionType:"YES_NO" };
  if (lower.includes("business") || lower.includes("trade") || lower.includes("contract")) return { houses:[1,2,7,10], modules:["raml","houses","timing"], decisionType:"YES_NO" };
  if (lower.includes("employment") || lower.includes("career")) return { houses:[1,2,6,10], modules:["raml","houses","timing"], decisionType:"YES_NO" };
  if (lower.includes("travel") || lower.includes("return")) return { houses:[1,3,9], modules:["raml","houses","timing","celestial"], decisionType:"TIMING" };
  if (lower.includes("location") || lower.includes("remote") || lower.includes("lost")) return { houses:[1,2,4,7,9], modules:["raml","houses","remote-lab"], decisionType:"LOCATION" };
  if (lower.includes("timing") || lower.includes("electional")) return { houses:[1], modules:["raml","timing","celestial"], decisionType:"TIMING" };
  if (lower.includes("comparison") || lower.includes("candidate") || lower.includes("multiple choice") || lower.includes("competition")) return { houses:[1,7,10], modules:["raml","comparison"], decisionType:"COMPARISON" };
  if (lower.includes("health") || lower.includes("pregnancy")) return { houses:[1,5,6,8], modules:["raml","houses"], decisionType:"OPEN" };
  if (lower.includes("legal")) return { houses:[1,7,9,10], modules:["raml","houses"], decisionType:"OPEN" };
  return { houses:[1], modules:["raml","houses"], decisionType:"OPEN" };
}
