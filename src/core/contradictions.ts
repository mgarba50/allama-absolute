import type { Evidence } from "./types";

export interface ContradictionReport {
  supportingWeight: number;
  contraryWeight: number;
  neutralWeight: number;
  severity: "none" | "low" | "moderate" | "high";
  strongestSupport?: Evidence;
  strongestContrary?: Evidence;
}

function strength(evidence: Evidence): number {
  return Math.abs(evidence.weight * evidence.reliability);
}

export function analyzeContradictions(evidence: readonly Evidence[]): ContradictionReport {
  const supporting = evidence.filter((item) => item.direction > 0);
  const contrary = evidence.filter((item) => item.direction < 0);
  const neutral = evidence.filter((item) => item.direction === 0);

  const supportingWeight = supporting.reduce((sum,item) => sum + strength(item),0);
  const contraryWeight = contrary.reduce((sum,item) => sum + strength(item),0);
  const neutralWeight = neutral.reduce((sum,item) => sum + strength(item),0);
  const totalDirectional = supportingWeight + contraryWeight;
  const ratio = totalDirectional === 0 ? 0 : Math.min(supportingWeight,contraryWeight) / Math.max(supportingWeight,contraryWeight,0.0001);

  let severity: ContradictionReport["severity"] = "none";
  if (supportingWeight > 0 && contraryWeight > 0) {
    severity = ratio >= 0.65 ? "high" : ratio >= 0.35 ? "moderate" : "low";
  }

  return {
    supportingWeight,
    contraryWeight,
    neutralWeight,
    severity,
    strongestSupport:[...supporting].sort((a,b) => strength(b) - strength(a))[0],
    strongestContrary:[...contrary].sort((a,b) => strength(b) - strength(a))[0]
  };
}
