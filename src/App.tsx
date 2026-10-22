import { useEffect, useMemo, useState } from "react";
import {
  FIGURES,
  calculateAbjad,
  classifyQuestion,
  currentPlanetaryHour,
  downloadText,
  entropyMothers,
  generateShield,
  localeDirection,
  moonPhase,
  parseCommand,
  SqliteCaseRepository,
  toJson,
  translate,
  validateShield,
  type CaseState,
  type Locale
} from "./core";
import { AbsolutePanel } from "./components/AbsolutePanel";
import { CommandPalette } from "./components/CommandPalette";
import { FigureGlyph } from "./components/FigureGlyph";
import { HouseMap } from "./components/HouseMap";
import { ReverseTrace } from "./components/ReverseTrace";
import { TapCaster } from "./components/TapCaster";
import { CaseVault } from "./components/CaseVault";
import { ResearchLab } from "./components/ResearchLab";
import { GraphLab } from "./components/GraphLab";
import { TimingLab } from "./components/TimingLab";
import { SettingsLab } from "./components/SettingsLab";
import { QuestionIntelligence } from "./components/QuestionIntelligence";
import { PractitionerConsole } from "./components/PractitionerConsole";

type View = "practitioner" | "cases" | "absolute" | "cast" | "houses" | "reverse" | "abjad" | "question" | "celestial" | "research" | "graphs" | "timing" | "settings";

function NavigationButton(props: { id: View; current: View; label: string; onSelect: (id: View) => void }) {
  return <button className={props.current === props.id ? "active" : ""} onClick={() => props.onSelect(props.id)}>{props.label}</button>;
}

export default function App() {
  const [view,setView] = useState<View>("practitioner");
  const [historicalCases,setHistoricalCases] = useState<CaseState[]>([]);
  const [archiveState,setArchiveState] = useState<"loading" | "ready" | "unavailable">("loading");
  const [locale,setLocale] = useState<Locale>("en");
  const [selectedHouse,setSelectedHouse] = useState(1);
  const [motherIds,setMotherIds] = useState(["via","populus","fortuna-major","conjunctio"]);
  const mothers = motherIds.map((id) => FIGURES.find((figure) => figure.id === id) ?? FIGURES[0]);
  const shield = useMemo(() => generateShield(mothers),[motherIds.join("|")]);

  const [abjadText,setAbjadText] = useState("موسى");
  const abjad = useMemo(() => calculateAbjad(abjadText),[abjadText]);

  const [question,setQuestion] = useState("Will this debtor repay me within the period promised?");
  const profile = useMemo(() => classifyQuestion(question),[question]);

  const [latitude,setLatitude] = useState(11.8333);
  const [longitude,setLongitude] = useState(13.15);
  const [momentText,setMomentText] = useState(new Date().toISOString().slice(0,16));
  const moment = new Date(momentText);
  const planetary = useMemo(() => {
    try { return currentPlanetaryHour(moment,latitude,longitude); }
    catch { return null; }
  },[momentText,latitude,longitude]);
  const moon = useMemo(() => moonPhase(moment),[momentText]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDirection(locale);
  },[locale]);

  useEffect(() => {
    if (!["absolute","graphs","cases"].includes(view)) return;
    let active = true;
    setArchiveState("loading");
    void SqliteCaseRepository.readCasesSnapshot()
      .then((cases) => {
        if (!active) return;
        setHistoricalCases(cases);
        setArchiveState("ready");
      })
      .catch(() => {
        if (!active) return;
        setHistoricalCases([]);
        setArchiveState("unavailable");
      });
    return () => { active = false; };
  },[view]);

  const labels = ["M1","M2","M3","M4","D1","D2","D3","D4","N1","N2","N3","N4","RW","LW","JUDGE","RECONCILER"];
  const shieldFigures = [...shield.mothers,...shield.daughters,...shield.nieces,shield.rightWitness,shield.leftWitness,shield.judge,shield.reconciler];

  function randomize(): void {
    setMotherIds(entropyMothers().map((figure) => figure.id));
  }

  function updateMother(index: number,id: string): void {
    setMotherIds((current) => current.map((value,position) => position === index ? id : value));
  }

  function useTapMothers(ids: string[]): void {
    setMotherIds(ids);
    setView("cast");
  }

  function openExpertAudit(nextQuestion:string):void {
    setQuestion(nextQuestion);
    setMomentText(new Date().toISOString().slice(0,16));
    setView("absolute");
  }

  function executeCommand(raw: string): string | void {
    const command = parseCommand(raw);
    switch (command.type) {
      case "cast": setView("cast"); return;
      case "judge":
      case "reverse": setView("reverse"); return;
      case "house": setSelectedHouse(command.house); setView("houses"); return;
      case "abjad":
        if (!command.text.trim()) return "Use /abjad followed by Arabic text.";
        setAbjadText(command.text); setView("abjad"); return;
      case "hour":
      case "moon": setView("celestial"); return;
      case "deep": setView("absolute"); return;
      case "compare": setView("timing"); return;
      case "lock": setView("research"); return;
      case "outcome": setView("cases"); return;
      case "graphs": setView("graphs"); return;
      case "settings": setView("settings"); return;
      default: return "Unknown command. Supported: /cast, /judge, /reverse, /house N, /abjad TEXT, /hour, /moon, /deep, /compare, /lock, /outcome, /graphs, /settings.";
    }
  }

  const expert = !["practitioner","cases"].includes(view);
  const pageTitle =
    view === "practitioner" ? (locale === "ar" ? "استشارة جديدة" : "New Consultation") :
    view === "absolute" ? translate(locale,"absolute") :
    view === "cast" ? translate(locale,"cast") :
    view === "houses" ? translate(locale,"houses") :
    view === "reverse" ? translate(locale,"reverse") :
    view === "abjad" ? translate(locale,"abjad") :
    view === "question" ? translate(locale,"question") :
    view === "celestial" ? translate(locale,"celestial") :
    view === "cases" ? translate(locale,"cases") :
    view === "research" ? translate(locale,"research") :
    view === "graphs" ? translate(locale,"graphs") :
    view === "timing" ? translate(locale,"timing") :
    translate(locale,"settings");

  return <div className="shell practitioner-shell">
    <aside>
      <div className="brand">
        <span className="omega">Ω</span>
        <div><strong>ALLAMA ABSOLUTE</strong><small>{locale==="ar"?"الممارس السيادي الخاص":"Private Sovereign Practitioner"}</small></div>
      </div>

      <div className="primary-nav">
        <NavigationButton id="practitioner" current={view} label={locale==="ar"?"استشارة جديدة":"New Consultation"} onSelect={setView} />
        <NavigationButton id="cases" current={view} label={translate(locale,"cases")} onSelect={setView} />
      </div>

      <details className="expert-nav" open={expert}>
        <summary>{locale==="ar"?"وحدة التدقيق الخبير":"Expert Audit Console"}</summary>
        <div className="expert-buttons">
          <NavigationButton id="absolute" current={view} label={translate(locale,"absolute")} onSelect={setView} />
          <NavigationButton id="cast" current={view} label={translate(locale,"cast")} onSelect={setView} />
          <NavigationButton id="houses" current={view} label={translate(locale,"houses")} onSelect={setView} />
          <NavigationButton id="reverse" current={view} label={translate(locale,"reverse")} onSelect={setView} />
          <NavigationButton id="abjad" current={view} label={translate(locale,"abjad")} onSelect={setView} />
          <NavigationButton id="question" current={view} label={translate(locale,"question")} onSelect={setView} />
          <NavigationButton id="celestial" current={view} label={translate(locale,"celestial")} onSelect={setView} />
          <NavigationButton id="research" current={view} label={translate(locale,"research")} onSelect={setView} />
          <NavigationButton id="graphs" current={view} label={translate(locale,"graphs")} onSelect={setView} />
          <NavigationButton id="timing" current={view} label={translate(locale,"timing")} onSelect={setView} />
          <NavigationButton id="settings" current={view} label={translate(locale,"settings")} onSelect={setView} />
        </div>
      </details>

      <div className="locale-switch">
        <button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>English</button>
        <button className={locale === "ar" ? "active" : ""} onClick={() => setLocale("ar")}>العربية</button>
      </div>

      <div className="aside-note">
        {locale==="ar"
          ? "في الاستشارة العادية تظهر لك خلاصة القراءة فقط. ويمكن فتح التدقيق الخبير إذا أردت الاطلاع على التفاصيل الداخلية."
          : "In a normal consultation, only the considered reading is shown. Expert Audit is available only when you intentionally want the underlying workings."}
      </div>
    </aside>

    <main className="practitioner-main">
      <header className="minimal-header">
        <div><p className="eyebrow">{view==="practitioner" ? (locale==="ar"?"استشارة خاصة":"PRIVATE CONSULTATION") : "EXPERT AUDIT"}</p><h1>{pageTitle}</h1></div>
        <span className="status">{view==="practitioner" ? (locale==="ar"?"جلسة خاصة":"Private Session") : translate(locale,"localCore")}</span>
      </header>

      {expert&&<div className="command-wrap"><CommandPalette onCommand={executeCommand} locale={locale} /></div>}

      {view === "practitioner" && <PractitionerConsole
        locale={locale}
        latitude={latitude}
        longitude={longitude}
        onOpenAudit={openExpertAudit}
        onOpenCases={()=>setView("cases")}
      />}

      {view === "absolute" && <AbsolutePanel question={question} motherIds={motherIds} latitude={latitude} longitude={longitude} momentText={momentText} locale={locale} historicalCases={historicalCases} archiveState={archiveState} />}

      {view === "cast" && <section>
        <TapCaster onUseMothers={useTapMothers} locale={locale} />
        <div className="divider"><span>{locale==="ar"?"أو الضرب المباشر / العشوائية التشفيرية":"OR DIRECT / ENTROPY CAST"}</span></div>
        <div className="toolbar">
          <button onClick={randomize}>{locale==="ar"?"ضرب بعشوائية تشفيرية":"Cryptographic Entropy Cast"}</button>
          <button className="secondary" onClick={() => downloadText("allama-shield.json",toJson(shield),"application/json")}>{locale==="ar"?"تصدير الدرع JSON":"Export Shield JSON"}</button>
          <button className="secondary" onClick={() => setView("reverse")}>{locale==="ar"?"تتبّع الحاكم":"Trace Judge"}</button>
        </div>
        <div className="mothers">{motherIds.map((id,index) => <label key={index}>{locale==="ar"?"الأم":"Mother"} {index + 1}<select value={id} onChange={(event) => updateMother(index,event.target.value)}>{FIGURES.map((figure) => <option key={figure.id} value={figure.id}>{figure.latin} — {figure.pattern.join("")}</option>)}</select></label>)}</div>
        <div className="shield">{shieldFigures.map((figure,index) => <article key={labels[index]} className={index >= 14 ? "decisive" : ""}><span>{labels[index]}</span><FigureGlyph pattern={figure.pattern} /><strong>{figure.latin}</strong><small>{figure.arabic}</small></article>)}</div>
        <div className="validation">{validateShield(shield).length ? validateShield(shield).join("; ") : locale==="ar"?"✓ اجتاز الدرع التحقق البنيوي، بما في ذلك تكافؤ الحاكم.":"✓ Structural validation passed, including Judge parity."}</div>
      </section>}

      {view === "houses" && <HouseMap shield={shield} selectedHouse={selectedHouse} onSelect={setSelectedHouse} locale={locale} />}
      {view === "reverse" && <ReverseTrace shield={shield} locale={locale} />}

      {view === "abjad" && <section className="panel">
        <label>{locale==="ar"?"النص العربي":"Arabic text"}<input dir="rtl" value={abjadText} onChange={(event) => setAbjadText(event.target.value)} /></label>
        <div className="abjad-result">
          <div><span>{locale==="ar"?"الأصل":"Original"}</span><strong dir="rtl">{abjad.original}</strong></div>
          <div><span>{locale==="ar"?"بعد التطبيع":"Normalized"}</span><strong dir="rtl">{abjad.normalized}</strong></div>
          <div><span>{locale==="ar"?"مجموع الكبير":"Kabir Total"}</span><strong>{abjad.total}</strong></div>
          <div><span>{locale==="ar"?"الاختزالات":"Reductions"}</span><strong>{abjad.reductions.join(" → ")}</strong></div>
        </div>
        <table><thead><tr><th>{locale==="ar"?"الحرف":"Letter"}</th><th>{locale==="ar"?"القيمة":"Value"}</th></tr></thead><tbody>{abjad.steps.map((step,index) => <tr key={index}><td dir="rtl">{step.letter}</td><td>{step.value}</td></tr>)}</tbody></table>
      </section>}

      {view === "question" && <QuestionIntelligence locale={locale} activeQuestion={question} profile={profile} onUseQuestion={setQuestion} onRunQuestion={(nextQuestion)=>{setQuestion(nextQuestion);setView("absolute");}} />}
      {view === "research" && <ResearchLab locale={locale} motherIds={motherIds} />}
      {view === "graphs" && <GraphLab locale={locale} question={question} motherIds={motherIds} latitude={latitude} longitude={longitude} momentText={momentText} historicalCases={historicalCases} archiveState={archiveState} />}
      {view === "timing" && <TimingLab locale={locale} defaultLatitude={latitude} defaultLongitude={longitude} defaultMoment={momentText} />}
      {view === "settings" && <SettingsLab locale={locale} />}
      {view === "cases" && <CaseVault locale={locale} currentQuestion={question} motherIds={motherIds} onContinueCase={(caseQuestion,ids) => { setQuestion(caseQuestion); if(ids?.length === 4) setMotherIds([...ids]); setView("absolute"); }} />}

      {view === "celestial" && <section className="panel">
        <div className="coordinates">
          <label>{locale==="ar"?"خط العرض":"Latitude"}<input type="number" value={latitude} onChange={(event) => setLatitude(Number(event.target.value))} /></label>
          <label>{locale==="ar"?"خط الطول":"Longitude"}<input type="number" value={longitude} onChange={(event) => setLongitude(Number(event.target.value))} /></label>
          <label>{locale==="ar"?"الوقت":"Moment"}<input type="datetime-local" value={momentText} onChange={(event) => setMomentText(event.target.value)} /></label>
        </div>
        {planetary ? <div className="profile">
          <div><span>{locale==="ar"?"الساعة الكوكبية":"Planetary Hour"}</span><strong>{planetary.planet}</strong></div>
          <div><span>{locale==="ar"?"الترتيب":"Ordinal"}</span><strong>{planetary.ordinal}</strong></div>
          <div><span>{locale==="ar"?"الفترة":"Period"}</span><strong>{planetary.daylight ? (locale==="ar"?"نهار":"Day") : (locale==="ar"?"ليل":"Night")}</strong></div>
          <div><span>{locale==="ar"?"إضاءة القمر":"Moon Illumination"}</span><strong>{Math.round(moon.fraction * 100)}%</strong></div>
        </div> : <p className="notice">{locale==="ar"?"تعذر حساب الساعات الكوكبية لهذا التاريخ/الموقع.":"Planetary hours cannot be resolved at this date/location."}</p>}
      </section>}
    </main>
  </div>;
}
