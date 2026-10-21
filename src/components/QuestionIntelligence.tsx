import { useState } from "react";
import {
  analyzeClientChaos,
  type ChaosFragmentKind,
  type ClientChaosAnalysis,
  type Locale,
  type QuestionProfile
} from "../core";

interface Props {
  locale: Locale;
  activeQuestion: string;
  profile: QuestionProfile;
  onUseQuestion: (question: string) => void;
  onRunQuestion: (question: string) => void;
}

const copy = {
  en:{
    intro:"Paste the client’s complete message. The local parser separates statements by evidential role; review its extraction before using a question for Ω.",
    message:"Full client message",placeholder:"Paste the client’s account, including dates, claims, emotions and every question…",
    analyze:"Analyze message",reanalyze:"Analyze revised message",characters:"Characters",fragments:"Fragments",hidden:"Other questions",
    extracted:"Extracted primary question",use:"Use as active question",run:"Use question & run Ω",
    active:"Active question",domain:"Domain",decision:"Decision type",houses:"Relevant houses",modules:"Modules",
    relevant:"Relevant facts",alleged:"Attributed / alleged facts",emotional:"Emotional framing",irrelevant:"Other narrative",
    none:"None detected",otherQuestions:"Other questions found",useCandidate:"Review this question",audit:"Fragment audit",
    relevantKind:"Relevant fact",allegedKind:"Alleged fact",emotionKind:"Emotion",irrelevantKind:"Other narrative",questionKind:"Question",
    empty:"Enter a client message before analyzing it."
  },
  ar:{
    intro:"ألصق رسالة العميل كاملة. يفصل المحلل المحلي العبارات بحسب دورها الاستدلالي؛ راجع الاستخراج قبل اعتماد السؤال في Ω.",
    message:"رسالة العميل الكاملة",placeholder:"ألصق رواية العميل بما فيها التواريخ والادعاءات والانفعالات وجميع الأسئلة…",
    analyze:"تحليل الرسالة",reanalyze:"تحليل الرسالة المعدّلة",characters:"عدد الحروف",fragments:"المقاطع",hidden:"أسئلة أخرى",
    extracted:"السؤال الأساسي المستخرج",use:"اعتماد السؤال النشط",run:"اعتماد السؤال وتشغيل Ω",
    active:"السؤال النشط",domain:"المجال",decision:"نوع القرار",houses:"البيوت ذات الصلة",modules:"الوحدات",
    relevant:"الوقائع ذات الصلة",alleged:"الوقائع المنسوبة أو المزعومة",emotional:"الصياغة الانفعالية",irrelevant:"السرد الآخر",
    none:"لم يُكتشف شيء",otherQuestions:"أسئلة أخرى مكتشفة",useCandidate:"مراجعة هذا السؤال",audit:"سجل تصنيف المقاطع",
    relevantKind:"واقعة ذات صلة",allegedKind:"واقعة مزعومة",emotionKind:"انفعال",irrelevantKind:"سرد آخر",questionKind:"سؤال",
    empty:"أدخل رسالة العميل قبل تحليلها."
  }
} as const;

function fragmentKindLabel(kind: ChaosFragmentKind,locale: Locale): string {
  const t=copy[locale];
  if(kind==="relevant-fact")return t.relevantKind;
  if(kind==="alleged-fact")return t.allegedKind;
  if(kind==="emotion")return t.emotionKind;
  if(kind==="question")return t.questionKind;
  return t.irrelevantKind;
}

function AnalysisList({ title,items,empty }: { title:string; items:readonly string[]; empty:string }) {
  return <article className="chaos-bucket">
    <h3>{title}</h3>
    {items.length
      ? <ul>{items.map((item,index)=><li key={item+index}>{item}</li>)}</ul>
      : <small>{empty}</small>}
  </article>;
}

export function QuestionIntelligence({ locale,activeQuestion,profile,onUseQuestion,onRunQuestion }: Props) {
  const t=copy[locale];
  const [message,setMessage]=useState(activeQuestion);
  const [analysis,setAnalysis]=useState<ClientChaosAnalysis|null>(null);
  const [candidate,setCandidate]=useState(activeQuestion);
  const [error,setError]=useState("");

  function analyze(): void {
    try {
      const next=analyzeClientChaos(message);
      setAnalysis(next);
      setCandidate(next.actualQuestion);
      setError("");
    } catch {
      setAnalysis(null);
      setError(t.empty);
    }
  }

  function updateMessage(value:string): void {
    setMessage(value);
    setAnalysis(null);
    setError("");
  }

  function commit(run:boolean): void {
    const cleaned=candidate.trim();
    if(!cleaned){setError(t.empty);return;}
    if(run)onRunQuestion(cleaned);
    else onUseQuestion(cleaned);
    setError("");
  }

  return <section className="question-intelligence">
    <article className="panel question-workbench">
      <p>{t.intro}</p>
      <label>{t.message}
        <textarea
          dir="auto"
          className="client-message"
          value={message}
          placeholder={t.placeholder}
          onChange={(event)=>updateMessage(event.target.value)}
        />
      </label>
      <div className="toolbar">
        <button onClick={analyze} disabled={!message.trim()}>{analysis?t.reanalyze:t.analyze}</button>
        <span className="question-length">{message.length.toLocaleString(locale==="ar"?"ar":"en")} {t.characters}</span>
      </div>
      {error?<p className="notice" role="alert">{error}</p>:null}
    </article>

    {analysis?<>
      <div className="chaos-summary" aria-label={locale==="ar"?"ملخص التحليل":"Analysis summary"}>
        <article><span>{t.characters}</span><strong>{analysis.originalLength.toLocaleString(locale==="ar"?"ar":"en")}</strong></article>
        <article><span>{t.fragments}</span><strong>{analysis.fragments.length}</strong></article>
        <article><span>{t.hidden}</span><strong>{analysis.hiddenQuestions.length}</strong></article>
      </div>

      <article className="panel extracted-question">
        <label>{t.extracted}
          <textarea dir="auto" value={candidate} onChange={(event)=>setCandidate(event.target.value)} />
        </label>
        <div className="toolbar">
          <button onClick={()=>commit(false)} disabled={!candidate.trim()}>{t.use}</button>
          <button className="secondary" onClick={()=>commit(true)} disabled={!candidate.trim()}>{t.run}</button>
        </div>
        {analysis.hiddenQuestions.length?<div className="hidden-questions">
          <strong>{t.otherQuestions}</strong>
          {analysis.hiddenQuestions.map((item,index)=><button className="secondary" key={item+index} onClick={()=>setCandidate(item)}>{t.useCandidate}: {item}</button>)}
        </div>:null}
      </article>

      <div className="chaos-grid">
        <AnalysisList title={t.relevant} items={analysis.relevantFacts} empty={t.none}/>
        <AnalysisList title={t.alleged} items={analysis.allegedFacts} empty={t.none}/>
        <AnalysisList title={t.emotional} items={analysis.emotionalClaims} empty={t.none}/>
        <AnalysisList title={t.irrelevant} items={analysis.irrelevantNarrative} empty={t.none}/>
      </div>

      <details className="panel fragment-audit">
        <summary>{t.audit}</summary>
        {analysis.fragments.map((fragment,index)=><div className="fragment-row" key={fragment.text+index}>
          <span>{fragmentKindLabel(fragment.kind,locale)}</span>
          <p dir="auto">{fragment.text}</p>
        </div>)}
      </details>
    </>:null}

    <article className="panel">
      <span className="metric-label">{t.active}</span>
      <p className="active-question" dir="auto">{activeQuestion}</p>
      <div className="profile">
        <div><span>{t.domain}</span><strong>{profile.domain}</strong></div>
        <div><span>{t.decision}</span><strong>{profile.decisionType}</strong></div>
        <div><span>{t.houses}</span><strong>{profile.houses.join(", ")}</strong></div>
        <div><span>{t.modules}</span><strong>{profile.modules.join(" · ")}</strong></div>
      </div>
      {profile.notes.map((note)=><p className="notice" key={note}>{note}</p>)}
    </article>
  </section>;
}
