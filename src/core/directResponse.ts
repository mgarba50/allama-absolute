import type { AbsoluteAnalysis } from "./analysis";
import type { FinalVerdictObject } from "./finalVerdict";
import type { Locale } from "./i18n";

export type DirectResponseMode = "SOVEREIGN" | "SCHOLAR" | "CLIENT" | "MUSA" | "RESEARCHER";

function percent(value: number): string {
  return value.toFixed(value % 1 === 0 ? 0 : 1) + "%";
}

export function renderDirectResponse(
  mode: DirectResponseMode,
  verdict: FinalVerdictObject,
  analysis: AbsoluteAnalysis,
  locale: Locale = "en"
): string {
  const ar=locale==="ar";
  const t=(en:string,a:string)=>ar?a:en;
  const judge=analysis.shield.judge.latin;
  const houses=verdict.relevantHouses.map((house)=>"H"+house).join(", ");
  if (mode==="MUSA") {
    const objection=verdict.strongestObjection ? " Objection: " + verdict.strongestObjection + "." : "";
    return `${verdict.verdictText} — ${percent(verdict.confidence)}. ${houses || t("No fixed house","لا بيت ثابت")}; ${t("Judge","الحاكم")} ${judge}.${objection}`;
  }
  if (mode==="CLIENT") {
    return ar ? `${verdict.verdictText}. الثقة التقليدية: ${percent(verdict.confidence)}. أبرز المؤشرات الرمزية: ${verdict.primaryEvidence.slice(0,2).join("، ") || "لا توجد إشارة منفردة كافية"}. ${verdict.epistemicBoundary ?? ""}`.trim() : `${verdict.verdictText}. Traditional confidence: ${percent(verdict.confidence)}. The main symbolic indicators are ${verdict.primaryEvidence.slice(0,2).join(" and ") || "not strong enough to isolate"}. ${verdict.epistemicBoundary ?? ""}`.trim();
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
