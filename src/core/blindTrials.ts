import { lockPrediction, verifyPredictionLock, type BlindLock } from "./experiments";

export interface BlindPrediction<T> {
  trialId: string;
  questionHash: string;
  prediction: T;
  lock: BlindLock;
  revealed: false;
}

export interface RevealedBlindTrial<T,U> extends Omit<BlindPrediction<T>,"revealed"> {
  revealed: true;
  outcome: U;
  integrityVerified: boolean;
  score?: number;
}

export async function createBlindPrediction<T>(
  trialId: string,
  questionHash: string,
  prediction: T,
  createdAt?: string
): Promise<BlindPrediction<T>> {
  const lock = await lockPrediction({ trialId,questionHash,prediction },createdAt);
  return { trialId,questionHash,prediction,lock,revealed:false };
}

export async function revealBlindPrediction<T,U>(
  record: BlindPrediction<T>,
  outcome: U,
  scorer?: (prediction:T,outcome:U) => number
): Promise<RevealedBlindTrial<T,U>> {
  const integrityVerified = await verifyPredictionLock(
    { trialId:record.trialId,questionHash:record.questionHash,prediction:record.prediction },
    record.lock
  );
  return {
    ...record,
    revealed:true,
    outcome,
    integrityVerified,
    score:scorer ? scorer(record.prediction,outcome) : undefined
  };
}
