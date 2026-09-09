import type { AbsoluteAnalysis } from "./analysis";
import type { FinalVerdictObject } from "./finalVerdict";

export type DirectResponseMode = "SOVEREIGN" | "SCHOLAR" | "CLIENT" | "MUSA" | "RESEARCHER";

function percent(value: number): string {
  return value.toFixed(value % 1 === 0 ? 0 : 1) + "%";
}

export function renderDirectResponse(
  mode: DirectResponseMode,
  verdict: FinalVerdictObject,
  analysis: AbsoluteAnalysis
): string {
  const judge=analysis.shield.judge.latin;
  const houses=verdict.relevantHouses.map((house)=>"H"+house).join(", ");
  if (mode==="MUSA") {
    const objection=verdict.strongestObjection ? " Objection: " + verdict.strongestObjection + "." : "";
    return `${verdict.verdictText} — ${percent(verdict.confidence)}. ${houses || "No fixed house"}; Judge ${judge}.${objection}`;
  }
  if (mode==="CLIENT") {
    return `${verdict.verdictText}. Traditional confidence: ${percent(verdict.confidence)}. The main symbolic indicators are ${verdict.primaryEvidence.slice(0,2).join(" and ") || "not strong enough to isolate"}. ${verdict.epistemicBoundary ?? ""}`.trim();
  }
  if (mode==="SCHOLAR") {
    return [
      `${verdict.verdictText} — ${verdict.verdictClass} (${percent(verdict.confidence)})`,
      `Judge: ${judge}; relevant houses: ${houses || "open-set"}.`,
      `Primary: ${verdict.primaryEvidence.join("; ") || "none"}.`,
      `Contrary: ${verdict.contraryEvidence.join("; ") || "none"}.`,
      `Contradiction: ${verdict.contradictionSeverity}; data quality: ${verdict.dataQualityScore}/100.`
    ].join("\n");
  }
  if (mode==="RESEARCHER") {
    return JSON.stringify(verdict,null,2);
  }
  return `${verdict.verdictText} — ${verdict.verdictClass}. Confidence ${percent(verdict.confidence)}. ${verdict.strongestObjection ? "Strongest objection: "+verdict.strongestObjection+"." : "No stronger contrary finding outranked the lead testimony."}`;
}
