import type { Evidence } from "./types";
import type { OutcomeComparison, PredictionSnapshot } from "./outcomes";

export interface ErrorAutopsy {
  required: boolean;
  frozenMethodologyVersion: string;
  strongestDirectionalEvidence: readonly Evidence[];
  contraryEvidence: readonly Evidence[];
  suspectedFailureModes: readonly string[];
}

export function buildErrorAutopsy(prediction: PredictionSnapshot,comparison: OutcomeComparison): ErrorAutopsy {
  if (!comparison.scorable || comparison.correct !== false) {
    return {
      required:false,
      frozenMethodologyVersion:prediction.methodologyVersion,
      strongestDirectionalEvidence:[],
      contraryEvidence:[],
      suspectedFailureModes:[]
    };
  }

  const sorted = [...prediction.evidence].sort((a,b) => Math.abs(b.weight*b.reliability) - Math.abs(a.weight*a.reliability));
  const predictedDirection = prediction.verdict.decision === "YES" ? 1 : -1;

  return {
    required:true,
    frozenMethodologyVersion:prediction.methodologyVersion,
    strongestDirectionalEvidence:sorted.filter((item) => item.direction === predictedDirection).slice(0,5),
    contraryEvidence:sorted.filter((item) => item.direction === -predictedDirection).slice(0,5),
    suspectedFailureModes:[
      "Inspect whether contrary testimony was underweighted.",
      "Inspect whether the selected question domain/significators were wrong.",
      "Inspect whether input data or outcome labeling was incomplete.",
      "Do not edit the historical prediction or methodology version retroactively."
    ]
  };
}
