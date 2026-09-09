import { useMemo, useState } from "react";
import {
  buildFinalVerdict,
  downloadText,
  identifySignificators,
  renderClientHtml,
  renderDirectResponse,
  renderScholarMarkdown,
  runAbsoluteAnalysis,
  runAnalyticalCouncil,
  runDeepSearch,
  type DirectResponseMode,
  type Locale
} from "../core";
import { FigureGlyph } from "./FigureGlyph";

interface Props {
  question:string; motherIds:readonly string[]; latitude:number; longitude:number; momentText:string; locale?:Locale;
}
const MODES:readonly DirectResponseMode[]=["SOVEREIGN","SCHOLAR","CLIENT","MUSA","RESEARCHER"];

export function AbsolutePanel({ question,motherIds,latitude,longitude,momentText,locale="en" }: Props) {
  const [showCalculation,setShowCalculation] = useState(false);
  const [mode,setMode]=useState<DirectResponseMode>("SOVEREIGN");
  const ar=locale==="ar";
  const t=(en:string,arabic:string)=>ar?arabic:en;
  const analysis = useMemo(() => runAbsoluteAnalysis({question,motherIds,timestamp:new Date(momentText),latitude,longitude}),[question,motherIds.join("|"),latitude,longitude,momentText]);
  const deep=useMemo(()=>runDeepSearch({analysis}),[analysis]);
  const council=useMemo(()=>runAnalyticalCouncil(analysis,deep),[analysis,deep]);
  const finalVerdict=useMemo(()=>buildFinalVerdict(analysis,{deepSearch:deep,council}),[analysis,deep,council]);
  const significators=identifySignificators(analysis.question);
  const verdict=analysis.traditionalVerdict;
  const displayDecision=verdict.decision==="YES"?t("YES","نعم"):verdict.decision==="NO"?t("NO","لا"):verdict.decision==="MIXED"?t("MIXED","مختلط"):t("UNKNOWN","غير محسوم");

  return <section>
    <article className="absolute-verdict">
      <div><p className="eyebrow">{t("Ω SOVEREIGN ANALYSIS","Ω التحليل السيادي")}</p><h2>{displayDecision}</h2><p className="verdict-class">{verdict.confidenceClass}</p>
        <p className="verdict-note">{t(
          `Traditional confidence score ${verdict.confidence.toFixed(1)} / 100. This is a configured symbolic testimony score, not a scientific probability.`,
          `درجة الثقة التقليدية ${verdict.confidence.toFixed(1)} / 100. هذه درجة للشهادة الرمزية وفق الإعدادات وليست احتمالاً علمياً.`
        )}</p>
      </div>
      <div className="judge-seal"><span>{t("JUDGE","الحاكم")}</span><FigureGlyph pattern={analysis.shield.judge.pattern}/><strong>{analysis.shield.judge.latin}</strong><small>{analysis.shield.judge.arabic}</small></div>
    </article>
    {analysis.decisionBoundary&&<p className="notice">{analysis.decisionBoundary}</p>}
    <div className="analysis-grid">
      <article><span className="metric-label">{t("Question intelligence","ذكاء السؤال")}</span><strong>{analysis.question.domain}</strong><p>{t("Houses","البيوت")} {analysis.question.houses.join(", ")}</p><small>{analysis.question.modules.join(" · ")}</small></article>
      <article><span className="metric-label">{t("Data quality","جودة البيانات")}</span><strong>{analysis.dataQuality.toFixed(0)} / 100</strong><p>{analysis.validationErrors.length?analysis.validationErrors.join("; "):t("Structural shield checks passed.","اجتاز الدرع اختبارات البنية.")}</p></article>
      <article><span className="metric-label">{t("Contradiction hunter","كاشف التعارض")}</span><strong>{analysis.contradiction.severity.toUpperCase()}</strong><p>{analysis.contradiction.strongestContrary?.label??t("No contrary directional testimony in the active baseline rules.","لا توجد شهادة اتجاهية مضادة ضمن القواعد الأساسية النشطة.")}</p></article>
      <article><span className="metric-label">{t("Elements","العناصر")}</span><strong>{analysis.elements.dominant.join(" / ")}</strong><p>{t("Deficient","الأضعف")}: {analysis.elements.deficient.join(" / ")}</p></article>
    </div>
    <div className="two-col">
      <article className="panel"><h3>{t("Traceable testimony","الشهادات القابلة للتتبع")}</h3>{analysis.evidence.map((evidence)=><div className="evidence-row" key={evidence.id}>
        <span className={"direction d"+evidence.direction}>{evidence.direction>0?"+":evidence.direction<0?"−":"·"}</span><div><strong>{evidence.label}</strong><small>{evidence.source} · {t("weight","الوزن")} {evidence.weight} · {t("reliability","الموثوقية")} {evidence.reliability}</small></div>
      </div>)}</article>
      <article className="panel"><h3>{t("Significators","الأدلة")}</h3>{significators.map((item)=><div className="evidence-row" key={item.role+item.house}><span className="house-badge">{item.house}</span><div><strong>{item.role}</strong><small>{item.reason}</small></div></div>)}</article>
    </div>
    {analysis.migration.length>0&&<article className="panel"><h3>{t("Figure migration","انتقال الأشكال")}</h3><div className="migration-list">{analysis.migration.map((item)=><span key={item.figure.id}>{item.figure.latin}: {t("houses","البيوت")} {item.houses.join(" → ")}</span>)}</div></article>}
    <article className="panel">
      <div className="section-heading"><div><span className="metric-label">{t("Analytical Council","المجلس التحليلي")}</span><h3>{council.verdict} · {(council.confidence*100).toFixed(1)}%</h3></div><span className="status">{council.consensus}</span></div>
      {council.perspectives.map((p)=><div className="record-row" key={p.id}><strong>{p.label} · {p.direction>0?"+":p.direction<0?"−":"·"} {(p.confidence*100).toFixed(0)}%</strong><span>{p.rationale}</span></div>)}
      {council.strongestObjection&&<p className="notice">{t("Strongest objection","أقوى اعتراض")}: {council.strongestObjection.label}</p>}
    </article>
    <article className="panel">
      <h3>{t("Direct response mode","نمط الجواب المباشر")}</h3>
      <div className="graph-tabs">{MODES.map((m)=><button key={m} className={mode===m?"":"secondary"} onClick={()=>setMode(m)}>{m}</button>)}</div>
      <pre>{renderDirectResponse(mode,finalVerdict,analysis,locale)}</pre>
    </article>
    <article className="panel">
      <h3>{t("Deep Search ×100 — ranked findings","البحث العميق ×100 — النتائج المرتبة")}</h3>
      {deep.findings.slice(0,16).map((item)=><div className="record-row" key={item.id}><strong>{item.label}</strong><small>{item.category} · {(item.strength*100).toFixed(0)}%</small><span>{item.detail}</span><code>{item.provenance.join(" · ")}</code></div>)}
    </article>
    <div className="toolbar">
      <button onClick={()=>setShowCalculation(v=>!v)}>{showCalculation?t("Hide calculation","إخفاء الحساب"):t("Show calculation","إظهار الحساب")}</button>
      <button className="secondary" onClick={()=>downloadText("allama-absolute-scholar-report.md",renderScholarMarkdown(analysis,locale),"text/markdown;charset=utf-8")}>{t("Scholar report","تقرير الباحث")}</button>
      <button className="secondary" onClick={()=>downloadText("allama-absolute-client-report.html",renderClientHtml(analysis,locale),"text/html;charset=utf-8")}>{t("Client report","تقرير العميل")}</button>
    </div>
    {showCalculation&&<article className="panel calculation"><h3>{t("Derivation ledger","سجل الاشتقاق")}</h3>{analysis.shield.lineage.map((step)=><div className="calc-row" key={step.target}><strong>{step.target}</strong><span>{step.sources.join(" + ")}</span><span>{step.operation}</span><code>{step.pattern.join("")}</code></div>)}</article>}
  </section>;
}
