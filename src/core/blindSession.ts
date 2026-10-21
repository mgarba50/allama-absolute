import { runAbsoluteAnalysis, type AbsoluteAnalysis } from "./analysis";
import { analysisMessages, type AiMessage } from "./ai";
import { lockPrediction, verifyPredictionLock, type BlindLock } from "./experiments";

export interface BlindCaseInput {
  motherIds: readonly string[];
  timestamp: string;
  latitude?: number;
  longitude?: number;
  abjadTexts?: readonly string[];
}

export interface DontTellAbsoluteSession {
  id: string;
  createdAt: string;
  state: "sealed";
  input: BlindCaseInput;
  analysis: AbsoluteAnalysis;
  lock: BlindLock;
}

export interface BlindReveal {
  question: string;
  claim?: string;
  context?: string;
  revealedAt: string;
}

export interface RevealedDontTellAbsoluteSession {
  sealed: DontTellAbsoluteSession;
  reveal: BlindReveal;
  integrityVerified: boolean;
}

function blindQuestion(): string {
  return "Blind question withheld from the analytical engine.";
}

export async function createDontTellAbsoluteSession(
  id: string,
  input: Omit<BlindCaseInput,"timestamp"> & { timestamp?: string }
): Promise<DontTellAbsoluteSession> {
  const timestamp=input.timestamp ?? new Date().toISOString();
  const sealedInput: BlindCaseInput={
    motherIds:[...input.motherIds],timestamp,latitude:input.latitude,longitude:input.longitude,
    abjadTexts:input.abjadTexts ? [...input.abjadTexts] : undefined
  };
  const analysis=runAbsoluteAnalysis({
    question:blindQuestion(),motherIds:sealedInput.motherIds,timestamp,
    latitude:sealedInput.latitude,longitude:sealedInput.longitude,abjadTexts:sealedInput.abjadTexts
  });
  const lock=await lockPrediction({id,input:sealedInput,analysis});
  return {id,createdAt:timestamp,state:"sealed",input:sealedInput,analysis,lock};
}

export function blindAiMessages(session: DontTellAbsoluteSession): AiMessage[] {
  return analysisMessages(session.analysis);
}

export async function revealDontTellAbsoluteSession(
  session: DontTellAbsoluteSession,
  reveal: Omit<BlindReveal,"revealedAt"> & { revealedAt?: string }
): Promise<RevealedDontTellAbsoluteSession> {
  const integrityVerified=await verifyPredictionLock({id:session.id,input:session.input,analysis:session.analysis},session.lock);
  return {
    sealed:session,
    reveal:{...reveal,revealedAt:reveal.revealedAt ?? new Date().toISOString()},
    integrityVerified
  };
}

export function preRevealPayload(session: RevealedDontTellAbsoluteSession | DontTellAbsoluteSession) {
  const sealed="sealed" in session ? session.sealed : session;
  return {
    id:sealed.id,createdAt:sealed.createdAt,input:sealed.input,analysis:sealed.analysis,lock:sealed.lock
  };
}
