import { useMemo, useState } from "react";
import { runPractitionerEngine, type Locale } from "../core";
import "../practitioner.css";

interface Props {
  locale: Locale;
  latitude: number;
  longitude: number;
  onOpenAudit: (question:string) => void;
  onOpenCases: () => void;
}

type Session = ReturnType<typeof runPractitionerEngine>;

function inferYearFromQuestion(question:string):number|undefined {
  const match=question.match(/\b(18|19|20|21)\d{2}\b/);
  return match ? Number(match[0]) : undefined;
}

export function PractitionerConsole({locale,latitude,longitude,onOpenAudit,onOpenCases}:Props) {
  const ar=locale==="ar";
  const t=(en:string,arabic:string)=>ar?arabic:en;

  const [subjectName,setSubjectName]=useState("");
  const [motherName,setMotherName]=useState("");
  const [otherParty,setOtherParty]=useState("");
  const [birthYearText,setBirthYearText]=useState("");
  const [targetYearText,setTargetYearText]=useState("");
  const [question,setQuestion]=useState("");
  const [session,setSession]=useState<Session|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [working,setWorking]=useState(false);
  const [showOptional,setShowOptional]=useState(false);

  const decisiveEvidence=useMemo(
    ()=>session?.synthesis.evidence.filter((item)=>item.role==="DECISIVE") ?? [],
    [session]
  );
  const supportingEvidence=useMemo(
    ()=>session?.synthesis.evidence.filter((item)=>item.role==="SUPPORTING") ?? [],
    [session]
  );

  function analyze():void {
    const cleanQuestion=question.trim();
    if (!cleanQuestion) {
      setError(t(
        "Write one precise question exactly as you want Allama to judge it.",
        "اكتب سؤالاً واحداً واضحاً كما تريد من علّامة أن يحكم فيه."
      ));
      return;
    }

    const parsedBirth=birthYearText.trim() ? Number(birthYearText) : undefined;
    const explicitTarget=targetYearText.trim() ? Number(targetYearText) : undefined;
    const inferredTarget=inferYearFromQuestion(cleanQuestion);
    const targetYear=explicitTarget ?? inferredTarget;

    if (parsedBirth!==undefined && !Number.isInteger(parsedBirth)) {
      setError(t("Birth year must be a whole year.","يجب أن تكون سنة الميلاد سنة صحيحة."));
      return;
    }
    if (targetYear!==undefined && !Number.isInteger(targetYear)) {
      setError(t("Target year must be a whole year.","يجب أن تكون السنة المستهدفة سنة صحيحة."));
      return;
    }

    setWorking(true);
    setError(null);
    try {
      const result=runPractitionerEngine({
        question:cleanQuestion,
        subjectName:subjectName.trim() || undefined,
        motherName:motherName.trim() || undefined,
        otherParty:otherParty.trim() || undefined,
        birthYear:parsedBirth,
        targetYear,
        timing:{
          moment:new Date(),
          latitude,
          longitude
        }
      });
      setSession(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setWorking(false);
    }
  }

  function reset():void {
    setSession(null);
    setQuestion("");
    setError(null);
  }

  if (session) {
    return <section className="practitioner-console">
      <div className="result-header">
        <div>
          <p className="eyebrow">{t("SOVEREIGN JUDGMENT","الحكم السيادي")}</p>
          <h1>{session.response.verdict}</h1>
          <p className="asked-question">{session.response.question}</p>
        </div>
        <div className={`verdict-orb verdict-${session.response.verdict.toLowerCase()}`}>
          <strong>{session.response.verdict}</strong>
          <span>{session.response.strength}</span>
        </div>
      </div>

      <div className="judgment-grid">
        <article className="judgment-card direct-card">
          <span>{t("DIRECT ANSWER","الجواب المباشر")}</span>
          <h2>{session.response.directAnswer}</h2>
        </article>

        <article className="judgment-card wide-card">
          <span>{t("DECISIVE BASIS","أساس الحكم")}</span>
          <p>{session.response.decisiveBasis}</p>
        </article>

        {decisiveEvidence.length>0 && <article className="judgment-card wide-card">
          <span>{t("DECISIVE VERIFIED EVIDENCE","الدليل المتحقق الحاسم")}</span>
          <ul>{decisiveEvidence.map((item)=><li key={item.id}><strong>{item.layer}</strong> — {item.statement}</li>)}</ul>
        </article>}

        {supportingEvidence.length>0 && <article className="judgment-card wide-card">
          <span>{t("SUPPORTING CROSS-CHECKS","المراجعات المساندة")}</span>
          <ul>{supportingEvidence.slice(0,6).map((item)=><li key={item.id}><strong>{item.layer}</strong> — {item.statement}</li>)}</ul>
        </article>}

        <article className="judgment-card">
          <span>{t("METHOD STATUS","حالة المناهج")}</span>
          <p>Raml: {session.response.methodStatus.raml}</p>
          <p>Ṭūkhī: {session.response.methodStatus.tukhi}</p>
          <p>Abjad: {session.response.methodStatus.abjad}</p>
          <p>Falaki: {session.response.methodStatus.falaki}</p>
        </article>

        <article className="judgment-card">
          <span>{t("QUESTION ROUTING","توجيه السؤال")}</span>
          <p>{session.kernel.structural.question.domain}</p>
          <p>{t("Primary house","البيت الأصلي")}: {session.kernel.raml.primaryHouse}</p>
        </article>

        {session.synthesis.unresolved.length>0 && <article className="judgment-card caution-card wide-card">
          <span>{t("SOURCE-GATED / NOT USED IN THE VERDICT","موقوف بالمصدر / لم يدخل في الحكم")}</span>
          <ul>{session.synthesis.unresolved.map((item,index)=><li key={index}>{item}</li>)}</ul>
        </article>}
      </div>

      <div className="result-actions">
        <button onClick={reset}>{t("New Analysis","تحليل جديد")}</button>
        <button className="secondary" onClick={onOpenCases}>{t("Case Vault","خزانة القضايا")}</button>
        <button className="ghost" onClick={()=>onOpenAudit(session.response.question)}>{t("Inspect Expert Audit","فتح التدقيق الخبير")}</button>
      </div>

      <p className="archive-note">
        {t(
          "No numeric confidence weighting is used. The visible verdict is produced only from methods that actually executed and passed their source gate.",
          "لا يستخدم النظام أوزان ثقة رقمية. لا يظهر الحكم إلا من المناهج التي نُفذت فعلاً واجتازت بوابة المصدر."
        )}
      </p>
    </section>;
  }

  return <section className="practitioner-console">
    <div className="practitioner-heading">
      <p className="eyebrow">{t("PRIVATE PRACTITIONER ENGINE","محرك الممارس الخاص")}</p>
      <h1>Ω ALLAMA ABSOLUTE</h1>
      <p>{t(
        "Give the names and ask the question. Allama handles the cast, calculations, source routing and cross-checking silently.",
        "أدخل الأسماء واسأل السؤال. يتولى علّامة الضرب والحساب وتوجيه المصادر والمراجعة في الخفاء."
      )}</p>
    </div>

    <article className="intake-card">
      <div className="intake-grid">
        <label>{t("Subject / client name","اسم صاحب المسألة")}
          <input value={subjectName} onChange={(event)=>setSubjectName(event.target.value)} placeholder={t("e.g. Musa","مثال: موسى")} />
        </label>
        <label>{t("Mother's name","اسم الأم")}
          <input value={motherName} onChange={(event)=>setMotherName(event.target.value)} placeholder={t("Optional","اختياري")} />
        </label>
        <label className="wide">{t("Other person / company / matter","الشخص أو الشركة أو الطرف الآخر")}
          <input value={otherParty} onChange={(event)=>setOtherParty(event.target.value)} placeholder={t("Optional","اختياري")} />
        </label>

        <label className="wide question-label">{t("What do you want to know?","ما الذي تريد معرفته؟")}
          <textarea value={question} onChange={(event)=>setQuestion(event.target.value)} placeholder={t(
            "Ask one precise question in ordinary language…",
            "اكتب سؤالاً واحداً واضحاً بلغتك العادية…"
          )} />
        </label>
      </div>

      <button className="optional-toggle" onClick={()=>setShowOptional((value)=>!value)}>
        {showOptional ? t("Hide optional details","إخفاء التفاصيل الاختيارية") : t("Optional year details","تفاصيل السنة الاختيارية")}
      </button>

      {showOptional && <div className="intake-grid optional-grid">
        <label>{t("Birth year","سنة الميلاد")}
          <input inputMode="numeric" value={birthYearText} onChange={(event)=>setBirthYearText(event.target.value)} placeholder="e.g. 1985" />
        </label>
        <label>{t("Target year","السنة المستهدفة")}
          <input inputMode="numeric" value={targetYearText} onChange={(event)=>setTargetYearText(event.target.value)} placeholder={String(new Date().getFullYear())} />
        </label>
      </div>}

      {error&&<p className="practitioner-error">{error}</p>}

      <button className="analyze-button" onClick={analyze} disabled={working}>
        {working?t("ANALYZING…","جارٍ التحليل…"):t("ANALYZE","حلّل")}
      </button>

      <div className="silent-engine-note">
        <span>{t("Silent engine","المحرك الصامت")}</span>
        <small>{t(
          "Question routing · Raml · verified Ṭūkhī rules · Abjad · Falaki facts · source gates · contradiction preservation",
          "توجيه السؤال · الرمل · قواعد الطوخي المتحققة · الأبجد · الحقائق الفلكية · بوابات المصدر · حفظ التعارض"
        )}</small>
      </div>
    </article>
  </section>;
}
