import { useState } from "react";
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

  function analyze():void {
    const cleanQuestion=question.trim();
    if (!cleanQuestion) {
      setError(t(
        "Write one precise question exactly as you want Allama to consider it.",
        "اكتب سؤالاً واحداً واضحاً كما تريد من علّامة أن ينظر فيه."
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
      setSession(runPractitionerEngine({
        question:cleanQuestion,
        subjectName:subjectName.trim() || undefined,
        motherName:motherName.trim() || undefined,
        otherParty:otherParty.trim() || undefined,
        birthYear:parsedBirth,
        targetYear,
        timing:{moment:new Date(),latitude,longitude}
      }));
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
    const reading=session.conversation;

    return <section className="practitioner-console">
      <div className="consultation-result">
        <p className="eyebrow">{t("ALLAMA'S READING","قراءة علّامة")}</p>
        <h1>{reading.headline}</h1>
        <p className="asked-question">{session.response.question}</p>

        <article className="consultation-letter">
          <p className="consultation-verdict">{reading.verdict}</p>
          {reading.overview.map((paragraph,index)=><p key={index}>{paragraph}</p>)}

          <section className="reading-section">
            <h2>{t("What stands out","أبرز ما يظهر")}</h2>
            <ul>{reading.centralThemes.map((item,index)=><li key={index}>{item}</li>)}</ul>
          </section>

          <div className="reading-columns">
            <section className="reading-section">
              <h2>{t("Opportunities","وجوه الفرصة")}</h2>
              <ul>{reading.opportunities.map((item,index)=><li key={index}>{item}</li>)}</ul>
            </section>

            <section className="reading-section">
              <h2>{t("Cautions","مواضع الحذر")}</h2>
              <ul>{reading.cautions.map((item,index)=><li key={index}>{item}</li>)}</ul>
            </section>
          </div>

          <section className="reading-section timing-section">
            <h2>{t("Timing impression","انطباع التوقيت")}</h2>
            <p>{reading.timingImpression}</p>
          </section>

          <section className="reading-section guidance-section">
            <h2>{t("My practical advice","نصيحتي العملية")}</h2>
            <p>{reading.practicalGuidance}</p>
          </section>

          <p className="consultation-closing">{reading.closing}</p>
        </article>
      </div>

      <div className="result-actions consultation-actions">
        <button onClick={reset}>{t("Ask Another Question","اسأل سؤالاً آخر")}</button>
        <button className="secondary" onClick={onOpenCases}>{t("Case Vault","خزانة القضايا")}</button>
        <button className="ghost expert-audit-button" onClick={()=>onOpenAudit(session.response.question)}>
          {t("Expert Audit","التدقيق الخبير")}
        </button>
      </div>
    </section>;
  }

  return <section className="practitioner-console">
    <div className="practitioner-heading">
      <p className="eyebrow">{t("PRIVATE CONSULTATION","استشارة خاصة")}</p>
      <h1>Ω ALLAMA ABSOLUTE</h1>
      <p>{t(
        "Give the names and ask the question naturally. Allama will return the considered reading, not the workings behind it.",
        "أدخل الأسماء واسأل سؤالك بصورة طبيعية. سيعطيك علّامة خلاصة القراءة لا تفاصيل العمل خلفها."
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
            "Ask naturally. Example: Should I proceed with this partnership, and what should I watch for?",
            "اسأل بصورة طبيعية. مثال: هل أمضي في هذه الشراكة، وما الذي ينبغي أن أنتبه له؟"
          )} />
        </label>
      </div>

      <button className="optional-toggle" onClick={()=>setShowOptional((value)=>!value)}>
        {showOptional?t("Hide optional details","إخفاء التفاصيل الاختيارية"):t("Optional year details","تفاصيل السنة الاختيارية")}
      </button>

      {showOptional&&<div className="intake-grid optional-grid">
        <label>{t("Birth year","سنة الميلاد")}
          <input inputMode="numeric" value={birthYearText} onChange={(event)=>setBirthYearText(event.target.value)} placeholder="e.g. 1985" />
        </label>
        <label>{t("Target year","السنة المستهدفة")}
          <input inputMode="numeric" value={targetYearText} onChange={(event)=>setTargetYearText(event.target.value)} placeholder={String(new Date().getFullYear())} />
        </label>
      </div>}

      {error&&<p className="practitioner-error">{error}</p>}

      <button className="analyze-button" onClick={analyze} disabled={working}>
        {working?t("READING…","جارٍ النظر…"):t("BEGIN READING","ابدأ القراءة")}
      </button>

      <p className="consultation-privacy-note">
        {t(
          "Private consultation mode. Only the final reading is shown here; the underlying workings remain in Expert Audit.",
          "وضع الاستشارة الخاصة. تظهر هنا خلاصة القراءة فقط، أما التفاصيل الداخلية فتظل في التدقيق الخبير."
        )}
      </p>
    </article>
  </section>;
}
