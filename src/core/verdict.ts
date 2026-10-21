import type { Evidence, Verdict } from "./types";

export function confidenceClass(confidence: number): string {
  if (confidence >= 95) return "ABSOLUTE / OVERWHELMING";
  if (confidence >= 90) return "DECISIVE";
  if (confidence >= 80) return "STRONG";
  if (confidence >= 70) return "PROBABLE";
  if (confidence >= 60) return "LEANING";
  if (confidence >= 50) return "UNRESOLVED";
  return "NO RELIABLE VERDICT";
}

export function synthesizeVerdict(evidence: readonly Evidence[]): Verdict {
  if (!evidence.length) return { decision:"UNKNOWN", confidence:0, confidenceClass:"NO RELIABLE VERDICT", supporting:[], contrary:[], score:0 };
  const weighted = evidence.map((e) => ({ ...e, contribution: e.direction * e.weight * e.reliability }));
  const absoluteWeight = weighted.reduce((sum, e) => sum + Math.abs(e.weight * e.reliability), 0);
  const score = absoluteWeight === 0 ? 0 : weighted.reduce((sum, e) => sum + e.contribution, 0) / absoluteWeight;
  const supporting = evidence.filter((e) => e.direction > 0);
  const contrary = evidence.filter((e) => e.direction < 0);
  const contradictionPenalty = Math.min(supporting.length, contrary.length) * 4;
  const baseConfidence = Math.abs(score) * 100;
  const confidence = Math.max(0, Math.min(100, baseConfidence - contradictionPenalty));
  const decision = confidence < 50 ? "UNKNOWN" : score > 0.1 ? "YES" : score < -0.1 ? "NO" : "MIXED";
  return { decision, confidence, confidenceClass: confidenceClass(confidence), supporting, contrary, score };
}
