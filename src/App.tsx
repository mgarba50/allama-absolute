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
  toJson,
  translate,
  validateShield,
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

type View = "dashboard" | "absolute" | "cast" | "houses" | "reverse" | "abjad" | "question" | "celestial" | "cases" | "research";

function NavigationButton(props: { id: View; current: View; label: string; onSelect: (id: View) => void }) {
  return (
    <button className={props.current === props.id ? "active" : ""} onClick={() => props.onSelect(props.id)}>
      {props.label}
    </button>
  );
}

export default function App() {
  const [view,setView] = useState<View>("dashboard");
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

  function executeCommand(raw: string): string | void {
    const command = parseCommand(raw);
    switch (command.type) {
      case "cast":
        setView("cast");
        return;
      case "judge":
      case "reverse":
        setView("reverse");
        return;
      case "house":
        setSelectedHouse(command.house);
        setView("houses");
        return;
      case "abjad":
        if (!command.text.trim()) return "Use /abjad followed by Arabic text.";
        setAbjadText(command.text);
        setView("abjad");
        return;
      case "hour":
      case "moon":
        setView("celestial");
        return;
      case "deep":
        setView("absolute");
        return;
      case "compare":
        return "Comparison is available as an engine API but is not exposed as a shell command yet.";
      case "lock":
        return "Blind-lock operations require a trial record and are not executed from the global shell.";
      case "outcome":
        return "Outcome recording requires a selected case and cannot run without case context.";
      default:
        return "Unknown command. Supported here: /cast, /judge, /reverse, /house N, /abjad TEXT, /hour, /moon, /deep.";
    }
  }

  const pageTitle =
    view === "dashboard" ? translate(locale,"dashboard") :
    view === "absolute" ? translate(locale,"absolute") :
    view === "cast" ? translate(locale,"cast") :
    view === "houses" ? translate(locale,"houses") :
    view === "reverse" ? translate(locale,"reverse") :
    view === "abjad" ? translate(locale,"abjad") :
    view === "question" ? translate(locale,"question") :
    view === "celestial" ? translate(locale,"celestial") :
    view === "cases" ? translate(locale,"cases") :
    translate(locale,"research");

  return (
    <div className="shell">
      <aside>
        <div className="brand">
          <span className="omega">Ω</span>
          <div><strong>ALLAMA ABSOLUTE</strong><small>Sovereign Symbolic Intelligence Engine</small></div>
        </div>

        <NavigationButton id="dashboard" current={view} label={translate(locale,"dashboard")} onSelect={setView} />
        <NavigationButton id="absolute" current={view} label={translate(locale,"absolute")} onSelect={setView} />
        <NavigationButton id="cast" current={view} label={translate(locale,"cast")} onSelect={setView} />
        <NavigationButton id="houses" current={view} label={translate(locale,"houses")} onSelect={setView} />
        <NavigationButton id="reverse" current={view} label={translate(locale,"reverse")} onSelect={setView} />
        <NavigationButton id="abjad" current={view} label={translate(locale,"abjad")} onSelect={setView} />
        <NavigationButton id="question" current={view} label={translate(locale,"question")} onSelect={setView} />
        <NavigationButton id="celestial" current={view} label={translate(locale,"celestial")} onSelect={setView} />
        <NavigationButton id="cases" current={view} label={translate(locale,"cases")} onSelect={setView} />
        <NavigationButton id="research" current={view} label={translate(locale,"research")} onSelect={setView} />

        <div className="locale-switch">
          <button className={locale === "en" ? "active" : ""} onClick={() => setLocale("en")}>English</button>
          <button className={locale === "ar" ? "active" : ""} onClick={() => setLocale("ar")}>العربية</button>
        </div>

        <div className="aside-note">
          Deterministic calculation, traditional interpretation, AI inference and empirical evidence remain separate by design.
        </div>
      </aside>

      <main>
        <header>
          <div>
            <p className="eyebrow">{translate(locale,"laboratory")}</p>
            <h1>{pageTitle}</h1>
          </div>
          <span className="status">{translate(locale,"localCore")}</span>
        </header>

        <CommandPalette onCommand={executeCommand} />

        {view === "dashboard" && (
          <section className="grid">
            <article className="hero">
              <p className="eyebrow">CENTRAL COMMAND</p>
              <h2>Ω ALLAMA ABSOLUTE</h2>
              <p>The machine calculates first, reasons second, challenges itself third, and writes the verdict last.</p>
              <div className="hero-actions">
                <button onClick={() => setView("absolute")}>{translate(locale,"runAnalysis")}</button>
                <button className="secondary" onClick={() => setView("cast")}>{translate(locale,"castingChamber")}</button>
              </div>
            </article>

            <article>
              <span className="metric-label">Current Judge</span>
              <div className="figure-row">
                <FigureGlyph pattern={shield.judge.pattern} />
                <div><strong>{shield.judge.latin}</strong><small>{shield.judge.arabic}</small></div>
              </div>
            </article>

            <article>
              <span className="metric-label">Planetary Hour</span>
              <strong className="big">{planetary?.planet ?? "Unavailable"}</strong>
              <small>{planetary ? planetary.start.toLocaleTimeString() + " — " + planetary.end.toLocaleTimeString() : "Check coordinates/date"}</small>
            </article>

            <article>
              <span className="metric-label">Question Domain</span>
              <strong className="big">{profile.domain}</strong>
              <small>Houses {profile.houses.join(", ")}</small>
            </article>

            <article>
              <span className="metric-label">Moon Illumination</span>
              <strong className="big">{Math.round(moon.fraction * 100)}%</strong>
              <small>Phase index {moon.phase.toFixed(3)}</small>
            </article>
          </section>
        )}

        {view === "absolute" && (
          <AbsolutePanel
            question={question}
            motherIds={motherIds}
            latitude={latitude}
            longitude={longitude}
            momentText={momentText}
          />
        )}

        {view === "cast" && (
          <section>
            <TapCaster onUseMothers={useTapMothers} />

            <div className="divider"><span>OR DIRECT / ENTROPY CAST</span></div>
            <div className="toolbar">
              <button onClick={randomize}>Cryptographic Entropy Cast</button>
              <button className="secondary" onClick={() => downloadText("allama-shield.json",toJson(shield),"application/json")}>
                Export Shield JSON
              </button>
              <button className="secondary" onClick={() => setView("reverse")}>Trace Judge</button>
            </div>

            <div className="mothers">
              {motherIds.map((id,index) => (
                <label key={index}>
                  Mother {index + 1}
                  <select value={id} onChange={(event) => updateMother(index,event.target.value)}>
                    {FIGURES.map((figure) => (
                      <option key={figure.id} value={figure.id}>{figure.latin} — {figure.pattern.join("")}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="shield">
              {shieldFigures.map((figure,index) => (
                <article key={labels[index]} className={index >= 14 ? "decisive" : ""}>
                  <span>{labels[index]}</span>
                  <FigureGlyph pattern={figure.pattern} />
                  <strong>{figure.latin}</strong>
                  <small>{figure.arabic}</small>
                </article>
              ))}
            </div>

            <div className="validation">
              {validateShield(shield).length ? validateShield(shield).join("; ") : "✓ Structural validation passed, including Judge parity."}
            </div>
          </section>
        )}

        {view === "houses" && <HouseMap shield={shield} selectedHouse={selectedHouse} onSelect={setSelectedHouse} />}

        {view === "reverse" && <ReverseTrace shield={shield} />}

        {view === "abjad" && (
          <section className="panel">
            <label>Arabic text<input dir="rtl" value={abjadText} onChange={(event) => setAbjadText(event.target.value)} /></label>
            <div className="abjad-result">
              <div><span>Original</span><strong dir="rtl">{abjad.original}</strong></div>
              <div><span>Normalized</span><strong dir="rtl">{abjad.normalized}</strong></div>
              <div><span>Kabir Total</span><strong>{abjad.total}</strong></div>
              <div><span>Reductions</span><strong>{abjad.reductions.join(" → ")}</strong></div>
            </div>
            <table>
              <thead><tr><th>Letter</th><th>Value</th></tr></thead>
              <tbody>{abjad.steps.map((step,index) => <tr key={index}><td dir="rtl">{step.letter}</td><td>{step.value}</td></tr>)}</tbody>
            </table>
          </section>
        )}

        {view === "question" && (
          <section className="panel">
            <label>Client question<textarea value={question} onChange={(event) => setQuestion(event.target.value)} /></label>
            <div className="profile">
              <div><span>Domain</span><strong>{profile.domain}</strong></div>
              <div><span>Decision Type</span><strong>{profile.decisionType}</strong></div>
              <div><span>Relevant Houses</span><strong>{profile.houses.join(", ")}</strong></div>
              <div><span>Modules</span><strong>{profile.modules.join(" · ")}</strong></div>
            </div>
            {profile.notes.map((note) => <p className="notice" key={note}>{note}</p>)}
            <div className="toolbar"><button onClick={() => setView("absolute")}>Run Ω on this question</button></div>
          </section>
        )}

        {view === "research" && <ResearchLab locale={locale} motherIds={motherIds} />}

        {view === "cases" && <CaseVault locale={locale} currentQuestion={question} motherIds={motherIds} onContinueCase={(caseQuestion,ids) => { setQuestion(caseQuestion); if(ids?.length === 4) setMotherIds([...ids]); setView("absolute"); }} />}

        {view === "celestial" && (
          <section className="panel">
            <div className="coordinates">
              <label>Latitude<input type="number" value={latitude} onChange={(event) => setLatitude(Number(event.target.value))} /></label>
              <label>Longitude<input type="number" value={longitude} onChange={(event) => setLongitude(Number(event.target.value))} /></label>
              <label>Moment<input type="datetime-local" value={momentText} onChange={(event) => setMomentText(event.target.value)} /></label>
            </div>
            {planetary ? (
              <div className="profile">
                <div><span>Planetary Hour</span><strong>{planetary.planet}</strong></div>
                <div><span>Ordinal</span><strong>{planetary.ordinal}</strong></div>
                <div><span>Period</span><strong>{planetary.daylight ? "Day" : "Night"}</strong></div>
                <div><span>Moon Illumination</span><strong>{Math.round(moon.fraction * 100)}%</strong></div>
              </div>
            ) : <p className="notice">Planetary hours cannot be resolved at this date/location.</p>}
          </section>
        )}
      </main>
    </div>
  );
}
