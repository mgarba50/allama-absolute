import type { AbsoluteAnalysis } from "./analysis";
import type { AnalyticalCouncilResult } from "./council";
import type { DeepSearchResult } from "./deepSearch";
import type { Verdict } from "./types";

export interface FinalVerdictObject {
  verdictClass: string;
  verdictText: string;
  decision: Verdict["decision"];
  confidence: number;
  primaryEvidence: readonly string[];
  contraryEvidence: readonly string[];
  contradictionSeverity: string;
  timing: string | null;
  locationHypothesis: string | null;
  relevantHouses: readonly number[];
  decisiveRules: readonly string[];
  supportingSchools: readonly string[];
  personalCalibration: {sampleSize:number;accuracy:number} | null;
  similarCasePerformance: {sampleSize:number;accuracy:number} | null;
  dataQualityScore: number;
  councilConsensus: string | null;
  strongestObjection: string | null;
  epistemicBoundary: string | null;
}

export interface FinalVerdictContext {
  deepSearch?: DeepSearchResult;
  council?: AnalyticalCouncilResult;
  decisiveRules?: readonly string[];
  supportingSchools?: readonly string[];
  personalCalibration?: {sampleSize:number;accuracy:number} | null;
  similarCasePerformance?: {sampleSize:number;accuracy:number} | null;
  locationHypothesis?: string | null;
}

export function buildFinalVerdict(
  analysis: AbsoluteAnalysis,
  context: FinalVerdictContext = {}
): FinalVerdictObject {
  const verdict=analysis.traditionalVerdict;
  const primary=context.deepSearch
    ? context.deepSearch.findings.filter((item)=>item.direction === (verdict.decision==="YES"?1:verdict.decision==="NO"?-1:0)).slice(0,6).map((item)=>item.label)
    : verdict.supporting.slice(0,6).map((item)=>item.label);
  const contrary=context.deepSearch
    ? context.deepSearch.findings.filter((item)=>item.direction === (verdict.decision==="YES"?-1:verdict.decision==="NO"?1:0)).slice(0,6).map((item)=>item.label)
    : verdict.contrary.slice(0,6).map((item)=>item.label);
  const planetary=analysis.celestial?.planetaryHour;
  const timing=planetary
    ? `${planetary.planet} hour ${planetary.ordinal}: ${planetary.start.toISOString()} — ${planetary.end.toISOString()}`
    : null;

  return {
    verdictClass:verdict.confidenceClass,
    verdictText:verdict.decision==="UNKNOWN" ? "NO RELIABLE VERDICT" : verdict.decision,
    decision:verdict.decision,
    confidence:verdict.confidence,
    primaryEvidence:primary,
    contraryEvidence:contrary,
    contradictionSeverity:analysis.contradiction.severity,
    timing,
    locationHypothesis:context.locationHypothesis ?? null,
    relevantHouses:[...analysis.question.houses],
    decisiveRules:[...(context.decisiveRules ?? [])],
    supportingSchools:[...(context.supportingSchools ?? [])],
    personalCalibration:context.personalCalibration ?? null,
    similarCasePerformance:context.similarCasePerformance ?? null,
    dataQualityScore:analysis.dataQuality,
    councilConsensus:context.council?.consensus ?? null,
    strongestObjection:context.council?.strongestObjection?.label ?? context.deepSearch?.summary.strongestContrary?.label ?? null,
    epistemicBoundary:analysis.decisionBoundary
  };
}
