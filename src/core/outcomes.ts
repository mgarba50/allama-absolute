import type { Evidence, Verdict } from "./types";

export interface RecordedOutcome {
  caseId: string;
  recordedAt: string;
  resolved: boolean;
  binaryOutcome?: boolean;
  notes?: string;
  evidenceSource?: string;
}

export interface PredictionSnapshot {
  caseId: string;
  createdAt: string;
  methodologyVersion: string;
  verdict: Verdict;
  evidence: readonly Evidence[];
}

export interface OutcomeComparison {
  scorable: boolean;
  predictedBinary: boolean | null;
  actualBinary: boolean | null;
  correct: boolean | null;
  explanation: string;
}

export function comparePredictionOutcome(prediction: PredictionSnapshot,outcome: RecordedOutcome): OutcomeComparison {
  if (!outcome.resolved || typeof outcome.binaryOutcome !== "boolean") {
    return { scorable:false, predictedBinary:null, actualBinary:null, correct:null, explanation:"Outcome is not resolved as a binary event." };
  }

  const predictedBinary =
    prediction.verdict.decision === "YES" ? true :
    prediction.verdict.decision === "NO" ? false :
    null;

  if (predictedBinary === null) {
    return {
      scorable:false,
      predictedBinary:null,
      actualBinary:outcome.binaryOutcome,
      correct:null,
      explanation:"Prediction did not make a binary YES/NO decision."
    };
  }

  return {
    scorable:true,
    predictedBinary,
    actualBinary:outcome.binaryOutcome,
    correct:predictedBinary === outcome.binaryOutcome,
    explanation:predictedBinary === outcome.binaryOutcome ? "Prediction matched the recorded outcome." : "Prediction differed from the recorded outcome."
  };
}
