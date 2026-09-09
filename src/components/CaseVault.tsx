import { useEffect, useMemo, useState } from "react";
import {
  SqliteCaseRepository,
  accuracySummary,
  appendCaseTimeline,
  createPractitionerNote,
  createPractitionerOverride,
  downloadBytes,
  downloadText,
  newCase,
  runAbsoluteAnalysis,
  searchCases,
  similarCases,
  toJson,
  type CaseState,
  type DatabaseHealth,
  type Locale
} from "../core";

interface Props {
  locale: Locale;
  currentQuestion: string;
  motherIds: readonly string[];
  onContinueCase: (question: string,motherIds?: readonly string[]) => void;
}

const words = {
  en:{
    title:"Case Vault",subtitle:"Authoritative SQLite practitioner archive",newCase:"New case",create:"Create case",
    search:"Search cases",open:"Open",continueCase:"Continue case",question:"Question",status:"Status",casts:"Casts",
    timeline:"Timeline",notes:"Practitioner notes",addNote:"Add note",saveCast:"Save current cast",recastReason:"Recast reason",
    prediction:"Predictions",capturePrediction:"Capture current prediction",outcomes:"Outcomes",recordOutcome:"Record outcome",
    yes:"Resolved YES",no:"Resolved NO",outcomeNotes:"Outcome notes / evidence",overrides:"Practitioner overrides",
    overrideReason:"Override reason",saveOverride:"Save override",comparison:"Similar-case comparison",calibration:"Calibration",
    recomputeCalibration:"Recompute accuracy snapshot",exportCase:"Export case JSON",exportDb:"Export SQLite database",
    importDb:"Import SQLite database",health:"Database health",integrity:"Integrity",schema:"Schema",tables:"Tables",
    noCase:"Select or create a case.",empty:"No records yet.",databaseReady:"SQLite ready"
  },
  ar:{
    title:"خزانة القضايا",subtitle:"الأرشيف المهني المعتمد على SQLite",newCase:"قضية جديدة",create:"إنشاء القضية",
    search:"البحث في القضايا",open:"فتح",continueCase:"متابعة القضية",question:"السؤال",status:"الحالة",casts:"الضروب",
    timeline:"الخط الزمني",notes:"ملاحظات الممارس",addNote:"إضافة ملاحظة",saveCast:"حفظ الضرب الحالي",recastReason:"سبب إعادة الضرب",
    prediction:"التنبؤات",capturePrediction:"تثبيت التنبؤ الحالي",outcomes:"النتائج",recordOutcome:"تسجيل النتيجة",
    yes:"محسوم: نعم",no:"محسوم: لا",outcomeNotes:"ملاحظات النتيجة / الدليل",overrides:"تجاوزات الممارس",
    overrideReason:"سبب التجاوز",saveOverride:"حفظ التجاوز",comparison:"مقارنة القضايا المتشابهة",calibration:"المعايرة",
    recomputeCalibration:"إعادة حساب دقة الحالات المحسومة",exportCase:"تصدير القضية JSON",exportDb:"تصدير قاعدة SQLite",
    importDb:"استيراد قاعدة SQLite",health:"سلامة قاعدة البيانات",integrity:"السلامة",schema:"إصدار المخطط",tables:"الجداول",
    noCase:"اختر قضية أو أنشئ قضية.",empty:"لا توجد سجلات بعد.",databaseReady:"SQLite جاهزة"
  }
} as const;

function timestampId(prefix: string): string {
  return prefix + "-" + new Date().toISOString().replace(/\D/g,"");
}

export function CaseVault({ locale,currentQuestion,motherIds,onContinueCase }: Props) {
  const t = words[locale];
  const [repository,setRepository] = useState<SqliteCaseRepository | null>(null);
  const [cases,setCases] = useState<CaseState[]>([]);
  const [selectedId,setSelectedId] = useState("");
  const [query,setQuery] = useState("");
  const [newQuestion,setNewQuestion] = useState(currentQuestion);
  const [noteBody,setNoteBody] = useState("");
  const [recastReason,setRecastReason] = useState("");
  const [outcomeValue,setOutcomeValue] = useState<"yes" | "no">("yes");
  const [outcomeNotes,setOutcomeNotes] = useState("");
  const [overrideDecision,setOverrideDecision] = useState<"YES" | "NO" | "MIXED" | "UNKNOWN">("MIXED");
  const [overrideReason,setOverrideReason] = useState("");
  const [health,setHealth] = useState<DatabaseHealth | null>(null);
  const [message,setMessage] = useState("");

  const refresh = (repo: SqliteCaseRepository) => {
    setCases(repo.listCases());
    setHealth(repo.databaseHealth());
  };

  useEffect(() => {
    let active = true;
    let opened: SqliteCaseRepository | null = null;
    void SqliteCaseRepository.open()
      .then((repo) => {
        if (!active) {
          repo.close();
          return;
        }
        opened = repo;
        setRepository(repo);
        refresh(repo);
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : String(error)));
    return () => {
      active = false;
      opened?.close();
    };
  },[]);

  useEffect(() => {
    if (!newQuestion.trim()) setNewQuestion(currentQuestion);
  },[currentQuestion]);

  const visibleCases = useMemo(() => query.trim() ? searchCases(cases,query).map((hit) => hit.case) : cases,[cases,query]);
  const selected = repository && selectedId ? repository.getCase(selectedId) : null;
  const casts = selected && repository ? repository.listCasts(selected.id) : [];
  const notes = selected && repository ? repository.listNotes(selected.id) : [];
  const predictions = selected && repository ? repository.listPredictions(selected.id) : [];
  const outcomes = selected && repository ? repository.listOutcomes(selected.id) : [];
  const overrides = selected && repository ? repository.listOverrides(selected.id) : [];
  const similar = selected ? similarCases(cases,selected,6) : [];
  const calibration = repository?.listCalibration("all") ?? [];

  async function createCase(): Promise<void> {
    if (!repository) return;
    try {
      const record = newCase(newQuestion || currentQuestion);
      await repository.saveCase(record);
      setSelectedId(record.id);
      setMessage("");
      refresh(repository);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function saveCurrentCast(): Promise<void> {
    if (!repository || !selected) return;
    try {
      const existing = repository.listCasts(selected.id);
      if (existing.length && !recastReason.trim()) {
        setMessage(locale === "ar" ? "يلزم كتابة سبب واضح لإعادة الضرب." : "A written recast reason is required.");
        return;
      }
      const now = new Date().toISOString();
      const id = timestampId("CAST");
      await repository.saveCast({
        id,caseId:selected.id,createdAt:now,motherIds:[...motherIds],mode:"direct",
        recastReason:existing.length ? recastReason.trim() : undefined
      });
      const updated = appendCaseTimeline(
        selected,
        existing.length ? "recast" : "cast",
        existing.length ? "Recast recorded: " + recastReason.trim() : "Initial cast recorded",
        now
      );
      await repository.saveCase(updated);
      setRecastReason("");
      setMessage("");
      refresh(repository);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function addNote(): Promise<void> {
    if (!repository || !selected || !noteBody.trim()) return;
    try {
      const note = createPractitionerNote(selected.id,noteBody);
      await repository.saveNote(note);
      await repository.saveCase(appendCaseTimeline(selected,"note","Practitioner note added",note.createdAt));
      setNoteBody("");
      refresh(repository);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function capturePrediction(): Promise<void> {
    if (!repository || !selected) return;
    try {
      const now = new Date().toISOString();
      const analysis = runAbsoluteAnalysis({ question:selected.question,motherIds,timestamp:now });
      const latestCast = repository.listCasts(selected.id).at(-1);
      await repository.savePrediction({
        id:timestampId("PRED"),caseId:selected.id,castId:latestCast?.id,
        methodologyVersion:"absolute-core-0.3",verdict:analysis.traditionalVerdict,
        evidence:analysis.evidence,createdAt:now
      });
      await repository.saveCase(appendCaseTimeline(selected,"prediction","Prediction snapshot captured",now));
      refresh(repository);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function recordOutcome(): Promise<void> {
    if (!repository || !selected) return;
    try {
      const now = new Date().toISOString();
      const latestPrediction = repository.listPredictions(selected.id).at(-1);
      await repository.saveOutcome({
        id:timestampId("OUT"),caseId:selected.id,predictionId:latestPrediction?.id,recordedAt:now,
        resolved:true,binaryOutcome:outcomeValue === "yes",notes:outcomeNotes.trim() || undefined
      });
      const updated = appendCaseTimeline(
        {...selected,status:"resolved"},
        "outcome",
        outcomeValue === "yes" ? "Resolved outcome recorded: YES" : "Resolved outcome recorded: NO",
        now
      );
      await repository.saveCase({...updated,status:"resolved"});
      setOutcomeNotes("");
      refresh(repository);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function saveOverride(): Promise<void> {
    if (!repository || !selected || !overrideReason.trim()) return;
    const latest = repository.listPredictions(selected.id).at(-1);
    if (!latest) {
      setMessage(locale === "ar" ? "ثبّت تنبؤاً أولاً قبل تسجيل التجاوز." : "Capture a prediction before recording an override.");
      return;
    }
    try {
      const base = createPractitionerOverride(latest.verdict,overrideDecision,"Musa Allama",overrideReason);
      await repository.saveOverride({...base,caseId:selected.id,predictionId:latest.id});
      await repository.saveCase(appendCaseTimeline(selected,"override","Practitioner override recorded",base.createdAt));
      setOverrideReason("");
      refresh(repository);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function recomputeCalibration(): Promise<void> {
    if (!repository) return;
    const resolved = repository.listCases().flatMap((record) => {
      const prediction = repository.listPredictions(record.id).at(-1);
      const outcome = repository.listOutcomes(record.id).filter((item) => item.resolved && typeof item.binaryOutcome === "boolean").at(-1);
      if (!prediction || !outcome) return [];
      const predicted = prediction.verdict.decision === "YES" ? true : prediction.verdict.decision === "NO" ? false : null;
      if (predicted === null) return [];
      return [{ id:record.id,predicted,actual:outcome.binaryOutcome as boolean }];
    });
    const summary = accuracySummary(resolved);
    const now = new Date().toISOString();
    await repository.saveCalibration({
      id:timestampId("CAL"),methodologyVersion:"absolute-core-0.3",scope:"all",metric:"accuracy",
      sampleSize:summary.sampleSize,value:summary.accuracy,computedAt:now
    });
    refresh(repository);
  }

  async function importDatabase(file: File): Promise<void> {
    if (!repository) return;
    try {
      await repository.replaceDatabase(new Uint8Array(await file.arrayBuffer()));
      setSelectedId("");
      setMessage("");
      refresh(repository);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    }
  }

  if (!repository) {
    return <section className="panel"><h3>{t.title}</h3><p>{message || (locale === "ar" ? "جارٍ فتح قاعدة SQLite…" : "Opening SQLite…")}</p></section>;
  }

  return (
    <section className="vault">
      <div className="section-heading">
        <div><p className="eyebrow">{t.subtitle}</p><h2>{t.title}</h2></div>
        <span className={"db-health " + (health?.integrity === "ok" ? "ok" : "bad")}>{t.databaseReady}: {health?.integrity ?? "…"}</span>
      </div>
      {message && <p className="notice">{message}</p>}

      <div className="vault-layout">
        <aside className="vault-list">
          <label>{t.newCase}<textarea value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} /></label>
          <button onClick={() => void createCase()}>{t.create}</button>
          <label>{t.search}<input value={query} onChange={(e) => setQuery(e.target.value)} /></label>
          <div className="case-list">
            {visibleCases.map((record) => (
              <button key={record.id} className={selectedId === record.id ? "case-item selected" : "case-item"} onClick={() => setSelectedId(record.id)}>
                <strong>{record.question}</strong>
                <small>{record.status} · {record.updatedAt.slice(0,10)}</small>
              </button>
            ))}
            {!visibleCases.length && <small>{t.empty}</small>}
          </div>
        </aside>

        <div className="vault-detail">
          {!selected ? <article className="panel"><p>{t.noCase}</p></article> : <>
            <article className="panel">
              <div className="section-heading">
                <div><span className="metric-label">{selected.id}</span><h3>{selected.question}</h3></div>
                <button onClick={() => onContinueCase(selected.question,casts.at(-1)?.motherIds)}>{t.continueCase}</button>
              </div>
              <div className="profile">
                <div><span>{t.status}</span><strong>{selected.status}</strong></div>
                <div><span>{t.casts}</span><strong>{casts.length}</strong></div>
                <div><span>{t.prediction}</span><strong>{predictions.length}</strong></div>
                <div><span>{t.outcomes}</span><strong>{outcomes.length}</strong></div>
              </div>
              <div className="toolbar">
                <button onClick={() => void saveCurrentCast()}>{t.saveCast}</button>
                <button className="secondary" onClick={() => void capturePrediction()}>{t.capturePrediction}</button>
                <button className="secondary" onClick={() => downloadText(selected.id + ".json",toJson(repository.exportCase(selected.id)),"application/json")}>{t.exportCase}</button>
              </div>
              {casts.length > 0 && <label>{t.recastReason}<input value={recastReason} onChange={(e) => setRecastReason(e.target.value)} /></label>}
            </article>

            <div className="two-col">
              <article className="panel">
                <h3>{t.casts}</h3>
                {casts.map((cast) => <div className="record-row" key={cast.id}><strong>{cast.id}</strong><small>{cast.mode} · {cast.createdAt}</small><code>{cast.motherIds.join(" · ")}</code>{cast.recastReason && <small>{cast.recastReason}</small>}</div>)}
                {!casts.length && <small>{t.empty}</small>}
              </article>
              <article className="panel">
                <h3>{t.timeline}</h3>
                {selected.timeline.map((entry,index) => <div className="record-row" key={entry.at + index}><strong>{entry.type}</strong><small>{entry.at}</small><span>{entry.detail}</span></div>)}
              </article>
            </div>

            <div className="two-col">
              <article className="panel">
                <h3>{t.notes}</h3>
                <textarea value={noteBody} onChange={(e) => setNoteBody(e.target.value)} />
                <button onClick={() => void addNote()}>{t.addNote}</button>
                {notes.map((note) => <div className="record-row" key={note.id}><small>{note.createdAt}</small><span>{note.body}</span></div>)}
              </article>
              <article className="panel">
                <h3>{t.outcomes}</h3>
                <select value={outcomeValue} onChange={(e) => setOutcomeValue(e.target.value as "yes" | "no")}>
                  <option value="yes">{t.yes}</option><option value="no">{t.no}</option>
                </select>
                <textarea placeholder={t.outcomeNotes} value={outcomeNotes} onChange={(e) => setOutcomeNotes(e.target.value)} />
                <button onClick={() => void recordOutcome()}>{t.recordOutcome}</button>
                {outcomes.map((outcome) => <div className="record-row" key={outcome.id}><strong>{outcome.binaryOutcome ? "YES" : "NO"}</strong><small>{outcome.recordedAt}</small><span>{outcome.notes}</span></div>)}
              </article>
            </div>

            <div className="two-col">
              <article className="panel">
                <h3>{t.overrides}</h3>
                <select value={overrideDecision} onChange={(e) => setOverrideDecision(e.target.value as typeof overrideDecision)}>
                  <option>YES</option><option>NO</option><option>MIXED</option><option>UNKNOWN</option>
                </select>
                <textarea placeholder={t.overrideReason} value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
                <button onClick={() => void saveOverride()}>{t.saveOverride}</button>
                {overrides.map((item) => <div className="record-row" key={item.id}><strong>{item.machineVerdict.decision} → {item.overrideDecision}</strong><span>{item.reason}</span></div>)}
              </article>
              <article className="panel">
                <h3>{t.comparison}</h3>
                {similar.map((hit) => {
                  const latest = repository.listPredictions(hit.case.id).at(-1);
                  return <div className="record-row" key={hit.case.id}><strong>{hit.case.question}</strong><small>similarity {(hit.score*100).toFixed(0)}%</small><span>{latest ? latest.verdict.decision + " · " + latest.verdict.confidence.toFixed(0) : "No saved prediction"}</span></div>;
                })}
                {!similar.length && <small>{t.empty}</small>}
              </article>
            </div>
          </>}
        </div>
      </div>

      <article className="panel">
        <h3>{t.calibration}</h3>
        <button onClick={() => void recomputeCalibration()}>{t.recomputeCalibration}</button>
        {calibration.slice(0,5).map((item) => <div className="record-row" key={item.id}><strong>{item.metric}: {(item.value*100).toFixed(1)}%</strong><small>n={item.sampleSize} · {item.computedAt}</small></div>)}
      </article>

      <article className="panel">
        <h3>{t.health}</h3>
        <div className="profile">
          <div><span>{t.integrity}</span><strong>{health?.integrity}</strong></div>
          <div><span>{t.schema}</span><strong>{health?.userVersion}</strong></div>
          <div><span>{t.tables}</span><strong>{health?.tables.length}</strong></div>
          <div><span>{t.casts}</span><strong>{health?.counts.casts ?? 0}</strong></div>
        </div>
        <div className="toolbar">
          <button onClick={() => downloadBytes("allama-absolute.sqlite",repository.exportDatabase(),"application/vnd.sqlite3")}>{t.exportDb}</button>
          <label className="file-button">{t.importDb}<input type="file" accept=".sqlite,.db,application/vnd.sqlite3" onChange={(e) => { const file=e.target.files?.[0]; if(file) void importDatabase(file); e.target.value=""; }} /></label>
        </div>
      </article>
    </section>
  );
}
