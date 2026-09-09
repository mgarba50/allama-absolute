import type { AbsoluteAnalysis } from "./analysis";
import type { Locale } from "./i18n";

function escapeHtml(value:string):string{return value.replace(/[&<>"']/g,(c)=>c==="&"?"&amp;":c==="<"?"&lt;":c===">"?"&gt;":c==='"'?"&quot;":"&#039;");}

export function renderScholarMarkdown(analysis:AbsoluteAnalysis,locale:Locale="en"):string{
  const ar=locale==="ar"; const t=(en:string,a:string)=>ar?a:en;
  const lines=[
    "# "+t("ALLAMA ABSOLUTE — Scholar Report","ALLAMA ABSOLUTE — تقرير الباحث"),
    "",t("Generated","أُنشئ")+": "+analysis.generatedAt,t("Question","السؤال")+": "+analysis.question.normalized,
    t("Domain","المجال")+": "+analysis.question.domain,t("Relevant houses","البيوت ذات الصلة")+": "+analysis.question.houses.join(", "),"",
    "## "+t("Shield","الدرع"),
    t("Mothers","الأمهات")+": "+analysis.shield.mothers.map(f=>f.latin+" "+f.pattern.join("")).join(" | "),
    t("Witnesses","الشاهدان")+": "+analysis.shield.rightWitness.latin+" / "+analysis.shield.leftWitness.latin,
    t("Judge","الحاكم")+": "+analysis.shield.judge.latin+" "+analysis.shield.judge.pattern.join(""),
    t("Reconciler","المصلح")+": "+analysis.shield.reconciler.latin,"",
    "## "+t("Structural validation","التحقق البنيوي"),analysis.validationErrors.length?analysis.validationErrors.join("; "):t("Passed.","تم الاجتياز."),"",
    "## "+t("Traditional verdict","الحكم التقليدي"),
    t("Decision","القرار")+": "+analysis.traditionalVerdict.decision,
    t("Traditional confidence class","فئة الثقة التقليدية")+": "+analysis.traditionalVerdict.confidenceClass,
    t("Traditional confidence score","درجة الثقة التقليدية")+": "+analysis.traditionalVerdict.confidence.toFixed(2),
    t("Contradiction severity","شدة التعارض")+": "+analysis.contradiction.severity,"",
    "## "+t("Elemental distribution","توزيع العناصر"),JSON.stringify(analysis.elements.distribution),
    t("Dominant","الغالب")+": "+analysis.elements.dominant.join(", "),t("Deficient","الأضعف")+": "+analysis.elements.deficient.join(", "),"",
    "## "+t("Evidence classification","تصنيف الأدلة"),
    ...analysis.evidence.map(e=>"- ["+e.source+"] "+e.label+" ("+t("weight","الوزن")+" "+e.weight+")"),"",
    "## "+t("Data quality","جودة البيانات"),analysis.dataQuality.toFixed(0)+"/100",
    analysis.decisionBoundary?t("Boundary","الحد المعرفي")+": "+analysis.decisionBoundary:""
  ];
  return lines.join("\n");
}

export function renderClientHtml(analysis:AbsoluteAnalysis,locale:Locale="en"):string{
  const ar=locale==="ar"; const t=(en:string,a:string)=>ar?a:en;
  const boundary=analysis.decisionBoundary?'<p class="boundary">'+escapeHtml(analysis.decisionBoundary)+"</p>":"";
  return '<!doctype html><html lang="'+locale+'" dir="'+(ar?"rtl":"ltr")+'"><head><meta charset="utf-8"><title>ALLAMA ABSOLUTE</title>'+
    '<style>body{font-family:Georgia,"Noto Naskh Arabic",serif;max-width:760px;margin:40px auto;padding:0 20px;color:#1b1813;line-height:1.7}h1{letter-spacing:.05em}.card{border:1px solid #aa9368;padding:18px;margin:16px 0}.boundary{border-inline-start:4px solid #9a6b25;padding:10px;background:#f7f0e3}</style></head><body>'+
    "<h1>ALLAMA ABSOLUTE</h1><p>"+escapeHtml(analysis.question.normalized)+"</p>"+
    '<div class="card"><strong>'+t("Traditional verdict","الحكم التقليدي")+":</strong> "+escapeHtml(analysis.traditionalVerdict.decision)+
    "<br><strong>"+t("Class","الفئة")+":</strong> "+escapeHtml(analysis.traditionalVerdict.confidenceClass)+
    "<br><strong>"+t("Judge","الحاكم")+":</strong> "+escapeHtml(analysis.shield.judge.latin)+"</div>"+boundary+
    "<p><small>"+t("Symbolic/traditional analysis is kept separate from deterministic calculation and empirical evidence.","يظل التحليل الرمزي/التقليدي منفصلاً عن الحساب الحتمي والدليل التجريبي.")+"</small></p></body></html>";
}
