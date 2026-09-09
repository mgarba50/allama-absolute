import type { AbsoluteAnalysis } from "./analysis";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g,(character) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  })[character] as string);
}

export function renderScholarMarkdown(analysis: AbsoluteAnalysis): string {
  const lines = [
    "# ALLAMA ABSOLUTE — Scholar Report",
    "",
    "Generated: " + analysis.generatedAt,
    "Question: " + analysis.question.normalized,
    "Domain: " + analysis.question.domain,
    "Relevant houses: " + analysis.question.houses.join(", "),
    "",
    "## Shield",
    "Mothers: " + analysis.shield.mothers.map((f) => f.latin + " " + f.pattern.join("")).join(" | "),
    "Witnesses: " + analysis.shield.rightWitness.latin + " / " + analysis.shield.leftWitness.latin,
    "Judge: " + analysis.shield.judge.latin + " " + analysis.shield.judge.pattern.join(""),
    "Reconciler: " + analysis.shield.reconciler.latin,
    "",
    "## Structural validation",
    analysis.validationErrors.length ? analysis.validationErrors.join("; ") : "Passed.",
    "",
    "## Traditional verdict",
    "Decision: " + analysis.traditionalVerdict.decision,
    "Traditional confidence class: " + analysis.traditionalVerdict.confidenceClass,
    "Traditional confidence score: " + analysis.traditionalVerdict.confidence.toFixed(2),
    "Contradiction severity: " + analysis.contradiction.severity,
    "",
    "## Elemental distribution",
    JSON.stringify(analysis.elements.distribution),
    "Dominant: " + analysis.elements.dominant.join(", "),
    "Deficient: " + analysis.elements.deficient.join(", "),
    "",
    "## Evidence classification",
    ...analysis.evidence.map((e) => "- [" + e.source + "] " + e.label + " (weight " + e.weight + ")"),
    "",
    "## Data quality",
    analysis.dataQuality.toFixed(0) + "/100",
    analysis.decisionBoundary ? "Boundary: " + analysis.decisionBoundary : ""
  ];
  return lines.join("\n");
}

export function renderClientHtml(analysis: AbsoluteAnalysis): string {
  const boundary = analysis.decisionBoundary ? "<p class=\"boundary\">" + escapeHtml(analysis.decisionBoundary) + "</p>" : "";
  return "<!doctype html><html><head><meta charset=\"utf-8\"><title>ALLAMA ABSOLUTE Report</title>" +
    "<style>body{font-family:Georgia,serif;max-width:760px;margin:40px auto;padding:0 20px;color:#1b1813}h1{letter-spacing:.08em}.card{border:1px solid #aa9368;padding:18px;margin:16px 0}.boundary{border-left:4px solid #9a6b25;padding:10px;background:#f7f0e3}</style></head><body>" +
    "<h1>ALLAMA ABSOLUTE</h1><p>" + escapeHtml(analysis.question.normalized) + "</p>" +
    "<div class=\"card\"><strong>Traditional verdict:</strong> " + escapeHtml(analysis.traditionalVerdict.decision) +
    "<br><strong>Class:</strong> " + escapeHtml(analysis.traditionalVerdict.confidenceClass) +
    "<br><strong>Judge:</strong> " + escapeHtml(analysis.shield.judge.latin) + "</div>" +
    boundary +
    "<p><small>Symbolic/traditional analysis is kept separate from deterministic calculation and empirical evidence.</small></p>" +
    "</body></html>";
}
