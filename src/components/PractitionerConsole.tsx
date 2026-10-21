import { useState } from "react";
import {
  buildFinalVerdict,
  buildPractitionerAnswer,
  entropyMothers,
  runAbsoluteAnalysis,
  runDeepSearch,
  runHundredPerspectiveCouncil,
  type CaseState,
  type Locale
} from "../core";
import "../practitioner.css";

interface Props {
  locale: Locale;
  historicalCases: readonly CaseState[];
  archiveState: "loading" | "ready" | "unavailable";
  latitude: number;
  longitude: number;
  onOpenAudit: (question:string,motherIds:string[]) => void;
  onOpenCases: () => void;
}

type Session = {
  question:string;
  motherIds:string[];
  answer:ReturnType<typeof buildPractitionerAnswer>;
  analysis:ReturnType<typeof runAbsoluteAnalysis>;
  council:ReturnType<typeof runHundredPerspectiveCouncil>;
};

export function PractitionerConsole({locale,historicalCases,archiveState,latitude,longitude,onOpenAudit,onOpenCases}:Props) {
  const ar=locale==="ar";
  const t=(en:string,arabic:string)=>ar?arabic:en;
  const [subjectName,setSubjectName]=useState("");
  const [motherName,setMotherName]=useState("");
  const [otherParty,setOtherParty]=useState("");
  const [question,setQuestion]=useState("");
  const [session,setSession]=useState<Session|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [working,setWorking]=useState(false);

  function analyze():void {
    const cleanQuestion=question.trim();
    if (!cleanQuestion) {
      setError(t("Write the question exactly as you want Allama to judge it.","اكتب السؤال كما تريد من علّامة أن يحكم فيه."));
      return;
    }
    setWorking(true);
    setError(null);
    try {
      const motherIds=entropyMothers().map((figure)=>figure.id);
      const abjadTexts=[subjectName,motherName,otherParty].map((value)=>value.trim()).filter(Boolean);
      const analysis=runAbsoluteAnalysis({
        question:cleanQuestion,
        motherIds,
        timestamp:new Date(),
        latitude,
        longitude,
        abjadTexts
      });
      const deep=runDeepSearch({analysis,cases:historicalCases,currentQuestion:cleanQuestion});
      const council=runHundredPerspectiveCouncil(analysis,deep);
      const finalVerdict=buildFinalVerdict(analysis,{deepSearch:deep,council});
      const answer=buildPractitionerAnswer(analysis,deep,council,finalVerdict);
      setSession({question:cleanQuestion,motherIds,answer,analysis,council});
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setWorking(false);
    }
  }

  function newAnalysis():void {
    setSession(null);
    setQuestion("");
    setError(null);
  }

  return <section className="practitioner-console">
    {!session ? <>
      <div className="practitioner-heading">
        <p className="eyebrow">{t("PRIVATE PRACTITIONER ENGINE","محرك الممارس الخاص")}</p>
        <h1>Ω ALLAMA ABSOLUTE</h1>
        <p>{t(
          "Give the people involved and the question. Allama handles the casting, calculation, cross-checking and judgment silently.",
          "أدخل أسماء المعنيين والسؤال. يتولى علّامة الضرب والحساب والمراجعة والحكم في الخفاء."
        )}</p>
      </div>

      <article className="intake-card">
        <div className="intake-grid">
          <label>{t("Subject / client name","اسم صاحب المسألة")}
            <input value={subjectName} onChange={(event)=>setSubjectName(event.target.value)} placeholder={t("e.g. Musa Garba","مثال: موسى غربا")} />
          </label>
          <label>{t("Mother's name","اسم الأم")}
            <input value={motherName} onChange={(event)=>setMotherName(event.target.value)} placeholder={t("Optional when not relevant","اختياري عند عدم الحاجة")} />
          </label>
          <label className="wide">{t("Other person / company / matter","الشخص أو الشركة أو الطرف الآخر")}
            <input value={otherParty} onChange={(event)=>setOtherParty(event.target.value)} placeholder={t("Optional","اختياري")} />
          </label>
          <label className="wide question-label">{t("What do you want to know?","ما الذي تريد معرفته؟")}
            <textarea value={question} onChange={(event)=>setQuestion(event.target.value)} placeholder={t("Ask one precise question in ordinary language…","اكتب سؤالاً واحداً واضحاً بلغتك العادية…")} />
          </label>
        </div>
        {error&&<p className="practitioner-error">{error}</p>}
        <button className="analyze-button" onClick={analyze} disabled={working}>{working?t("ANALYZING…","جارٍ التحليل…"):t("ANALYZE","حلّل")}</button>
        <div className="silent-engine-note">
          <span>{t("Silent engine","المحرك الصامت")}</span>
          <small>{t("Raml · houses · Abjad · question routing · contradiction hunting · deep search · analytical council · final verdict","الرمل · البيوت · الأبجد · توجيه السؤال · كشف التعارض · البحث العميق · المجلس التحليلي · الحكم النهائي")}</small>
        </div>
      </article>
    </> : <>
      <div className="result-header">
        <div>
          <p className="eyebrow">{t("SOVEREIGN JUDGMENT","الحكم السيادي")}</p>
          <h1>{session.answer.headline}</h1>
          <p className="asked-question">{session.question}</p>
        </div>
        <div className={`verdict-orb verdict-${session.answer.verdict.toLowerCase()}`}>
          <strong>{session.answer.verdict}</strong>
          <span>{session.answer.confidence.toFixed(0)}%</span>
        </div>
      </div>

      {session.analysis.decisionBoundary&&<p className="boundary-notice">{session.analysis.decisionBoundary}</p>}

      <div className="judgment-grid">
        <article className="judgment-card direct-card">
          <span>{t("DIRECT ANSWER","الجواب المباشر")}</span>
          <h2>{session.answer.directAnswer}</h2>
        </article>
        <article className="judgment-card">
          <span>{t("WHAT TO DO","ما العمل")}</span>
          <p>{session.answer.action}</p>
        </article>
        <article className="judgment-card compact-card">
          <span>{t("RISK","المخاطرة")}</span>
          <strong>{session.answer.risk}</strong>
        </article>
        <article className="judgment-card compact-card">
          <span>{t("QUESTION DOMAIN","مجال السؤال")}</span>
          <strong>{session.answer.domain}</strong>
        </article>
        <article className="judgment-card wide-card">
          <span>{t("TIMING","التوقيت")}</span>
          <p>{session.answer.timing}</p>
        </article>
        <article className="judgment-card wide-card">
          <span>{t("WHY ALLAMA REACHED THIS JUDGMENT","لماذا وصل علّامة إلى هذا الحكم")}</span>
          <ul>{session.answer.reasons.map((reason,index)=><li key={index}>{reason}</li>)}</ul>
        </article>
        {session.answer.cautions.length>0&&<article className="judgment-card caution-card wide-card">
          <span>{t("CAUTION / CONTRARY TESTIMONY","التنبيه / الشهادة المعارضة")}</span>
          <ul>{session.answer.cautions.map((reason,index)=><li key={index}>{reason}</li>)}</ul>
        </article>}
        <article className="final-judgment wide-card">
          <span>{t("FINAL JUDGMENT","الحكم النهائي")}</span>
          <h2>{session.answer.finalJudgment}</h2>
        </article>
      </div>

      <div className="result-actions">
        <button onClick={newAnalysis}>{t("New Analysis","تحليل جديد")}</button>
        <button className="secondary" onClick={onOpenCases}>{t("Case Vault","خزانة القضايا")}</button>
        <button className="ghost" onClick={()=>onOpenAudit(session.question,session.motherIds)}>{t("Inspect Expert Audit","فتح التدقيق الخبير")}</button>
      </div>
      <p className="archive-note">{archiveState==="ready"&&historicalCases.length?t(`Silent comparison included ${historicalCases.length} saved case(s).`,`شملت المقارنة الصامتة ${historicalCases.length} قضية محفوظة.`):t("The answer was produced without requiring you to inspect the internal casting machinery.","صدر الحكم دون الحاجة إلى استعراض آلية الضرب الداخلية.")}</p>
    </>}
  </section>;
}
