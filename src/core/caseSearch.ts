import type { CaseState } from "./cases";

export interface CaseSearchHit {
  case: CaseState;
  score: number;
  sharedTokens: readonly string[];
}

const STOP = new Set(["the","and","for","with","will","this","that","from","what","when","where","does","have","has","was","were"]);

function tokens(value: string): Set<string> {
  return new Set(
    value.toLowerCase()
      .replace(/[^\p{L}\p{N}\s]+/gu," ")
      .split(/\s+/)
      .filter((token) => token.length > 2 && !STOP.has(token))
  );
}

function similarity(left: Set<string>,right: Set<string>): { score:number; shared:string[] } {
  const shared = [...left].filter((token) => right.has(token));
  const union = new Set([...left,...right]);
  return { score:union.size ? shared.length / union.size : 0, shared };
}

export function searchCases(cases: readonly CaseState[],query: string,limit = 20): CaseSearchHit[] {
  const needle = tokens(query);
  if (!needle.size) return [];
  return cases.map((record) => {
    const haystack = tokens(record.question + " " + record.timeline.map((item) => item.detail).join(" "));
    const match = similarity(needle,haystack);
    return { case:record,score:match.score,sharedTokens:match.shared };
  }).filter((hit) => hit.score > 0).sort((a,b) => b.score - a.score).slice(0,limit);
}

export function similarCases(cases: readonly CaseState[],target: CaseState,limit = 10): CaseSearchHit[] {
  const needle = tokens(target.question);
  return cases.filter((record) => record.id !== target.id).map((record) => {
    const match = similarity(needle,tokens(record.question));
    return { case:record,score:match.score,sharedTokens:match.shared };
  }).filter((hit) => hit.score > 0).sort((a,b) => b.score - a.score).slice(0,limit);
}
