import type { AbsoluteAnalysis } from "./analysis";

export interface AnalysisComparison {
  label: string;
  decision: string;
  confidence: number;
  dataQuality: number;
  judge: string;
  contradiction: string;
  score: number;
}

export function compareAnalyses(items: readonly { label:string; analysis:AbsoluteAnalysis }[]): AnalysisComparison[] {
  return items.map(({label,analysis}) => ({
    label,
    decision:analysis.traditionalVerdict.decision,
    confidence:analysis.traditionalVerdict.confidence,
    dataQuality:analysis.dataQuality,
    judge:analysis.shield.judge.latin,
    contradiction:analysis.contradiction.severity,
    score:analysis.traditionalVerdict.score
  })).sort((a,b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.dataQuality - a.dataQuality;
  });
}
