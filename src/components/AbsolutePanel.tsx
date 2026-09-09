import { useMemo, useState } from "react";
import {
  downloadText,
  identifySignificators,
  renderClientHtml,
  renderScholarMarkdown,
  runAbsoluteAnalysis
} from "../core";
import { FigureGlyph } from "./FigureGlyph";

interface Props {
  question: string;
  motherIds: readonly string[];
  latitude: number;
  longitude: number;
  momentText: string;
}

export function AbsolutePanel({ question,motherIds,latitude,longitude,momentText }: Props) {
  const [showCalculation,setShowCalculation] = useState(false);
  const analysis = useMemo(() => runAbsoluteAnalysis({
    question,
    motherIds,
    timestamp:new Date(momentText),
    latitude,
    longitude
  }),[question,motherIds.join("|"),latitude,longitude,momentText]);

  const significators = identifySignificators(analysis.question);
  const verdict = analysis.traditionalVerdict;

  return (
    <section>
      <article className="absolute-verdict">
        <div>
          <p className="eyebrow">Ω SOVEREIGN ANALYSIS</p>
          <h2>{verdict.decision}</h2>
          <p className="verdict-class">{verdict.confidenceClass}</p>
          <p className="verdict-note">
            Traditional confidence score {verdict.confidence.toFixed(1)} / 100. This is a configured symbolic testimony score, not a scientific probability.
          </p>
        </div>
        <div className="judge-seal">
          <span>JUDGE</span>
          <FigureGlyph pattern={analysis.shield.judge.pattern} />
          <strong>{analysis.shield.judge.latin}</strong>
          <small>{analysis.shield.judge.arabic}</small>
        </div>
      </article>

      {analysis.decisionBoundary && <p className="notice">{analysis.decisionBoundary}</p>}

      <div className="analysis-grid">
        <article>
          <span className="metric-label">Question intelligence</span>
          <strong>{analysis.question.domain}</strong>
          <p>Houses {analysis.question.houses.join(", ")}</p>
          <small>{analysis.question.modules.join(" · ")}</small>
        </article>
        <article>
          <span className="metric-label">Data quality</span>
          <strong>{analysis.dataQuality.toFixed(0)} / 100</strong>
          <p>{analysis.validationErrors.length ? analysis.validationErrors.join("; ") : "Structural shield checks passed."}</p>
        </article>
        <article>
          <span className="metric-label">Contradiction hunter</span>
          <strong>{analysis.contradiction.severity.toUpperCase()}</strong>
          <p>{analysis.contradiction.strongestContrary?.label ?? "No contrary directional testimony in the active baseline rules."}</p>
        </article>
        <article>
          <span className="metric-label">Elements</span>
          <strong>{analysis.elements.dominant.join(" / ")}</strong>
          <p>Deficient: {analysis.elements.deficient.join(" / ")}</p>
        </article>
      </div>

      <div className="two-col">
        <article className="panel">
          <h3>Traceable testimony</h3>
          {analysis.evidence.map((evidence) => (
            <div className="evidence-row" key={evidence.id}>
              <span className={"direction d" + evidence.direction}>{evidence.direction > 0 ? "+" : evidence.direction < 0 ? "−" : "·"}</span>
              <div>
                <strong>{evidence.label}</strong>
                <small>{evidence.source} · weight {evidence.weight} · reliability {evidence.reliability}</small>
              </div>
            </div>
          ))}
        </article>

        <article className="panel">
          <h3>Significators</h3>
          {significators.map((item) => (
            <div className="evidence-row" key={item.role + item.house}>
              <span className="house-badge">{item.house}</span>
              <div><strong>{item.role}</strong><small>{item.reason}</small></div>
            </div>
          ))}
        </article>
      </div>

      {analysis.migration.length > 0 && (
        <article className="panel">
          <h3>Figure migration</h3>
          <div className="migration-list">
            {analysis.migration.map((item) => (
              <span key={item.figure.id}>{item.figure.latin}: houses {item.houses.join(" → ")}</span>
            ))}
          </div>
        </article>
      )}

      <div className="toolbar">
        <button onClick={() => setShowCalculation((value) => !value)}>
          {showCalculation ? "Hide calculation" : "Show calculation"}
        </button>
        <button className="secondary" onClick={() => downloadText("allama-absolute-scholar-report.md",renderScholarMarkdown(analysis),"text/markdown;charset=utf-8")}>
          Scholar report
        </button>
        <button className="secondary" onClick={() => downloadText("allama-absolute-client-report.html",renderClientHtml(analysis),"text/html;charset=utf-8")}>
          Client report
        </button>
      </div>

      {showCalculation && (
        <article className="panel calculation">
          <h3>Derivation ledger</h3>
          {analysis.shield.lineage.map((step) => (
            <div className="calc-row" key={step.target}>
              <strong>{step.target}</strong>
              <span>{step.sources.join(" + ")}</span>
              <span>{step.operation}</span>
              <code>{step.pattern.join("")}</code>
            </div>
          ))}
        </article>
      )}
    </section>
  );
}
