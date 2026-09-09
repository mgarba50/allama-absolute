import universeDocument from "../../ABSOLUTE_777_UNIVERSE.json";
import { protocolCoverageForQuestion } from "./protocolCoverage";

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
  const synthetic: UniverseQuestion = { id:"CATEGORY",difficulty:"STANDARD/ADVANCED",category,question:category,core_burden:[] };
  const coverage = protocolCoverageForQuestion(synthetic);
  const decisionType =
    coverage.outputShape === "comparison" ? "COMPARISON" :
    coverage.outputShape === "timing-windows" ? "TIMING" :
    coverage.outputShape === "ranked-hypotheses" && coverage.id === "location-lost-remote" ? "LOCATION" :
    coverage.outputShape === "binary" ? "YES_NO" : "OPEN";
  return { houses:[...coverage.houses],modules:[...coverage.requiredModules,...coverage.optionalModules],decisionType };
}
