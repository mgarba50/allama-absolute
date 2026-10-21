import type { AbsoluteAnalysis } from "./analysis";
import type { AnalyticalCouncilResult } from "./council";
import type { DeepSearchResult } from "./deepSearch";
import type { FinalVerdictObject } from "./finalVerdict";

export type PractitionerRisk = "LOW" | "MODERATE" | "HIGH" | "UNRESOLVED";

export interface PractitionerAnswer {
  verdict: "YES" | "NO" | "CONDITIONAL" | "UNRESOLVED";
  headline: string;
  directAnswer: string;
  action: string;
  risk: PractitionerRisk;
  timing: string;
  reasons: readonly string[];
  cautions: readonly string[];
  finalJudgment: string;
  confidence: number;
  domain: string;
}

function cleanFinding(text: string): string {
  return text.replace(/\s+/g," ").trim().replace(/[.;]+$/,".");
}

function verdictLabel(finalVerdict: FinalVerdictObject): PractitionerAnswer["verdict"] {
  if (finalVerdict.decision === "YES") return "YES";
  if (finalVerdict.decision === "NO") return "NO";
  if (finalVerdict.decision === "MIXED") return "CONDITIONAL";
  return "UNRESOLVED";
}

function riskFrom(
  finalVerdict: FinalVerdictObject,
  analysis: AbsoluteAnalysis,
  council: AnalyticalCouncilResult
): PractitionerRisk {
  if (finalVerdict.decision === "UNKNOWN") return "UNRESOLVED";
  const contradiction = analysis.contradiction.severity.toLowerCase();
  const disagreement = council.disagreement;
  if (contradiction === "high" || disagreement >= 0.9 || finalVerdict.confidence < 45) return "HIGH";
  if (contradiction === "medium" || disagreement >= 0.55 || finalVerdict.confidence < 70) return "MODERATE";
  return "LOW";
}

function directFor(verdict: PractitionerAnswer["verdict"], domain: string): string {
  if (verdict === "YES") return `Yes. The active testimony favors the matter as asked in the ${domain.toLowerCase()} domain.`;
  if (verdict === "NO") return `No. The active testimony weighs against the matter as presently framed in the ${domain.toLowerCase()} domain.`;
  if (verdict === "CONDITIONAL") return "Not cleanly yes or no. The matter is conditional: favorable and unfavorable indications are both materially present.";
  return "No reliable judgment should be forced from this casting. The testimony is too weak, conflicted, or incomplete.";
}

function actionFor(verdict: PractitionerAnswer["verdict"], objection: string | null): string {
  const objectionText = objection ? ` First address this objection: ${cleanFinding(objection)}` : "";
  if (verdict === "YES") return `Proceed, but preserve control over the decisive condition and do not ignore contrary testimony.${objectionText}`;
  if (verdict === "NO") return `Do not proceed on the present terms. Change the condition, timing, counterpart, or structure before reconsidering.${objectionText}`;
  if (verdict === "CONDITIONAL") return `Pause commitment until the strongest contrary condition is resolved, then reassess the same question without changing its meaning.${objectionText}`;
  return "Clarify the question or missing context before relying on a new casting. Do not repeat-cast merely to obtain a preferred answer.";
}

function timingFor(analysis: AbsoluteAnalysis, deep: DeepSearchResult): string {
  const directionalTiming = deep.findings.find((finding) => finding.category === "timing" && finding.direction !== 0);
  if (directionalTiming) return cleanFinding(directionalTiming.detail);
  const hour = analysis.celestial?.planetaryHour;
  if (hour) {
    return `Current timing context: ${hour.planet} planetary hour (${hour.daylight ? "day" : "night"}), ${hour.start.toLocaleTimeString()}–${hour.end.toLocaleTimeString()}. No favorable/unfavorable timing claim is added unless an active rule supports it.`;
  }
  return "No directional timing rule is active for this analysis.";
}

export function buildPractitionerAnswer(
  analysis: AbsoluteAnalysis,
  deep: DeepSearchResult,
  council: AnalyticalCouncilResult,
  finalVerdict: FinalVerdictObject
): PractitionerAnswer {
  const verdict = verdictLabel(finalVerdict);
  const reasons = deep.findings
    .filter((finding) => finding.direction !== 0)
    .sort((a,b) => b.strength - a.strength)
    .slice(0,4)
    .map((finding) => cleanFinding(`${finding.label}: ${finding.detail}`));

  const cautions = [
    ...(finalVerdict.strongestObjection ? [cleanFinding(finalVerdict.strongestObjection)] : []),
    ...(analysis.validationErrors.length ? analysis.validationErrors.map(cleanFinding) : []),
    ...(analysis.decisionBoundary ? [cleanFinding(analysis.decisionBoundary)] : [])
  ].slice(0,3);

  const confidence = Math.max(0,Math.min(100,finalVerdict.confidence));
  const risk = riskFrom(finalVerdict,analysis,council);
  const directAnswer = directFor(verdict,analysis.question.domain);
  const action = actionFor(verdict,finalVerdict.strongestObjection);
  const headline = verdict === "YES" ? "PROCEED" : verdict === "NO" ? "DO NOT PROCEED" : verdict === "CONDITIONAL" ? "PROCEED ONLY CONDITIONALLY" : "NO RELIABLE VERDICT";
  const finalJudgment = `${headline}. ${directAnswer} Confidence ${confidence.toFixed(0)}/100; risk ${risk.toLowerCase()}.`;

  return {
    verdict,
    headline,
    directAnswer,
    action,
    risk,
    timing:timingFor(analysis,deep),
    reasons:reasons.length ? reasons : ["No directional finding independently outranked the rest of the testimony."],
    cautions,
    finalJudgment,
    confidence,
    domain:analysis.question.domain
  };
}
