import { useEffect, useMemo, useState } from "react";
import {
  REMOTE_STATE_BOUNDARY,
  SqliteCaseRepository,
  ablationTest,
  accuracySummary,
  buildErrorAutopsy,
  classifyQuestion,
  compareHumanAbsolute,
  comparePredictionOutcome,
  confidenceCalibration,
  createDontTellAbsoluteSession,
  figureFrequencies,
  historicalAccuracy,
  methodTournament,
  questionCategoryPerformance,
  rankRemoteHypotheses,
  revealDontTellAbsoluteSession,
  ruleSurvival,
  subsystemContribution,
  type DontTellAbsoluteSession,
  type HumanAbsoluteRecord,
  type Locale,
  type RemoteVote,
  type ResearchCase,
  type RuleOutcomeRecord
} from "../core";

interface Props { locale:Locale; motherIds:readonly string[]; }

function Bars({rows}:{rows:readonly {label:string;value:number;detail?:string}[]}) {
  const max=Math.max(1,...rows.map((r)=>Math.abs(r.value)));
  return <div className="metric-bars">{rows.map((row)=><div className="metric-bar" key={row.label}>
    <span>{row.label}</span><div className="bar-track"><i style={{width:(Math.abs(row.value)/max*100)+"%"}} /></div>
    <strong>{row.detail ?? row.value.toFixed(2)}</strong>
  </div>)}</div>;
}

export function ResearchLab({locale,motherIds}:Props){
  const ar=locale==="ar";
  const [repo,setRepo]=useState<SqliteCaseRepository|null>(null);
  const [revision,setRevision]=useState(0);
  const [message,setMessage]=useState("");
  const [blind,setBlind]=useState<DontTellAbsoluteSession|null>(null);
  const [revealText,setRevealText]=useState("");
  const [remoteJson,setRemoteJson]=useState("[]");
  const [remoteResults,setRemoteResults]=useState<ReturnType<typeof rankRemoteHypotheses>>([]);
  const [researchJson,setResearchJson]=useState("[]");
  const [researchRows,setResearchRows]=useState<ResearchCase[]>([]);
  const [humanJson,setHumanJson]=useState("[]");
  const [humanRows,setHumanRows]=useState<HumanAbsoluteRecord[]>([]);
  const [ruleJson,setRuleJson]=useState("[]");
  const [ruleRows,setRuleRows]=useState<RuleOutcomeRecord[]>([]);

  useEffect(()=>{let active=true;let opened:SqliteCaseRepository|null=null;void SqliteCaseRepository.open().then((r)=>{if(!active){r.close();return;} opened=r;setRepo(r);}).catch((e)=>setMessage(String(e)));return()=>{active=false;opened?.close();};},[]);

  const empirical=useMemo(()=>{
    if(!repo) return [];
    return repo.listCases().flatMap((c)=>{
      const p=repo.listPredictions(c.id).at(-1);
      const o=repo.listOutcomes(c.id).filter((x)=>x.resolved&&typeof x.binaryOutcome==="boolean").at(-1);
      if(!p||!o) return [];
      const predicted=p.verdict.decision==="YES"?true:p.verdict.decision==="NO"?false:null;
      if(predicted===null) return [];
      return [{id:c.id,category:classifyQuestion(c.question).domain,predicted,actual:o.binaryOutcome as boolean,confidence:p.verdict.confidence,resolvedAt:o.recordedAt}];
    });
  },[repo,revision]);

  const stats=accuracySummary(empirical);
  const bins=confidenceCalibration(empirical);
  const categories=questionCategoryPerformance(empirical);
  const history=historicalAccuracy(empirical);
  const figures=repo?figureFrequencies(repo.listCases().flatMap((c)=>repo.listCasts(c.id))):[];
  const autopsies=useMemo(()=>{
    if(!repo) return [];
    return repo.listCases().flatMap((c)=>{
      const p=repo.listPredictions(c.id).at(-1),o=repo.listOutcomes(c.id).filter((x)=>x.resolved).at(-1);
      if(!p||!o) return [];
      const comparison=comparePredictionOutcome({caseId:c.id,createdAt:p.createdAt,methodologyVersion:p.methodologyVersion,verdict:p.verdict,evidence:p.evidence},o);
      const autopsy=buildErrorAutopsy({caseId:c.id,createdAt:p.createdAt,methodologyVersion:p.methodologyVersion,verdict:p.verdict,evidence:p.evidence},comparison);
      return autopsy.required?[{caseId:c.id,autopsy}]:[];
    });
  },[repo,revision]);

  function parse<T>(text:string,setter:(value:T)=>void):void{
    try{setter(JSON.parse(text) as T);setMessage("");}catch(e){setMessage(e instanceof Error?e.message:String(e));}
  }

  async function createBlind():Promise<void>{
    if(!repo) return;
    const session=await createDontTellAbsoluteSession("BLIND-"+new Date().toISOString().replace(/\D/g,""),{motherIds});
    setBlind(session);
    await repo.saveExperimentTrial({id:session.id,experimentId:"dont-tell-absolute",predictionLockHash:session.lock.hash,prediction:session,createdAt:session.createdAt});
    setRevision((v)=>v+1);
  }

  async function revealBlind():Promise<void>{
    if(!repo||!blind||!revealText.trim()) return;
    const revealed=await revealDontTellAbsoluteSession(blind,{question:revealText.trim()});
    await repo.saveExperimentTrial({id:blind.id,experimentId:"dont-tell-absolute",predictionLockHash:blind.lock.hash,prediction:blind,reveal:revealed.reveal,score:{integrityVerified:revealed.integrityVerified},createdAt:blind.createdAt});
    setMessage(revealed.integrityVerified?(ar?"تم التحقق من سلامة القفل قبل الكشف.":"Prediction lock verified before reveal."):(ar?"فشل التحقق من القفل.":"Prediction lock verification failed."));
    setRevision((v)=>v+1);
  }

  function runRemote():void{
    const hypotheses=[
      {id:"indoor",dimension:"environment" as const,label:"Indoors"},{id:"outdoor",dimension:"environment" as const,label:"Outdoors"},
      {id:"moving",dimension:"activity" as const,label:"Moving"},{id:"stationary",dimension:"activity" as const,label:"Stationary"},
      {id:"alone",dimension:"social" as const,label:"Alone"},{id:"social",dimension:"social" as const,label:"With others"},
      {id:"near",dimension:"distance" as const,label:"Near"},{id:"far",dimension:"distance" as const,label:"Far"},
      {id:"north",dimension:"direction" as const,label:"North"},{id:"south",dimension:"direction" as const,label:"South"},
      {id:"east",dimension:"direction" as const,label:"East"},{id:"west",dimension:"direction" as const,label:"West"}
    ];
    try{const votes=JSON.parse(remoteJson) as RemoteVote[];setRemoteResults(rankRemoteHypotheses(hypotheses,votes));setMessage("");}catch(e){setMessage(String(e));}
  }

  const tournament=researchRows.length?methodTournament(researchRows,{baseline:[],noRaml:["raml"],noAbjad:["abjad"],noCelestial:["celestial"],noHouses:["houses"]}):[];
  const contribution=researchRows.length?subsystemContribution(researchRows):[];
  const human=humanRows.length?compareHumanAbsolute(humanRows):null;
  const survival=ruleRows.length?ruleSurvival(ruleRows):[];

  return <section className="research-lab">
    <div className="section-heading"><div><p className="eyebrow">{ar?"مختبر التحقق والمعايرة":"EMPIRICAL DISCIPLINE"}</p><h2>{ar?"مختبر البحث":"Research Laboratory"}</h2></div><span className="status">{ar?"لا ادعاء بلا بيانات":"No data, no performance claim"}</span></div>
    {message&&<p className="notice">{message}</p>}

    <div className="analysis-grid">
      <article><span className="metric-label">{ar?"الحالات المحسومة":"Resolved cases"}</span><strong>{stats.sampleSize}</strong><p>{stats.sampleSize?(ar?"الدقة المسجلة":"Recorded accuracy")+": "+(stats.accuracy*100).toFixed(1)+"%":(ar?"لا توجد عينة قابلة للقياس بعد.":"No scorable sample yet.")}</p></article>
      <article><span className="metric-label">{ar?"فاصل ويلسون":"Wilson interval"}</span><strong>{stats.sampleSize?(stats.wilsonLow*100).toFixed(1)+"–"+(stats.wilsonHigh*100).toFixed(1)+"%":"—"}</strong><p>{ar?"يعرض عدم اليقين مع حجم العينة.":"Shows sample-size uncertainty."}</p></article>
      <article><span className="metric-label">{ar?"تشريح الأخطاء":"Error autopsies"}</span><strong>{autopsies.length}</strong><p>{ar?"لا تعديل رجعي للتنبؤات.":"Historical predictions remain frozen."}</p></article>
      <article><span className="metric-label">{ar?"تجارب عمياء محفوظة":"Stored blind trials"}</span><strong>{repo?.listExperimentTrials("dont-tell-absolute").length ?? 0}</strong><p>{ar?"الكشف منفصل تقنياً عن التنبؤ.":"Reveal data is stored separately from prediction data."}</p></article>
    </div>

    <div className="two-col">
      <article className="panel"><h3>{ar?"لا تخبر أبسولوت":"DON'T TELL ABSOLUTE"}</h3><p>{ar?"أنشئ التحليل قبل إدخال القصة أو الادعاء.":"Seal the analysis before entering the alleged story or claim."}</p><button onClick={()=>void createBlind()}>{ar?"إنشاء جلسة عمياء":"Create blind session"}</button>{blind&&<><div className="record-row"><strong>{blind.id}</strong><small>{blind.createdAt}</small><span>Judge: {blind.analysis.shield.judge.latin} · {blind.analysis.traditionalVerdict.decision}</span></div><textarea value={revealText} onChange={(e)=>setRevealText(e.target.value)} placeholder={ar?"أدخل السؤال/الادعاء بعد التثبيت":"Enter question/claim only after sealing"} /><button onClick={()=>void revealBlind()}>{ar?"كشف والتحقق":"Reveal & verify lock"}</button></>}</article>
      <article className="panel"><h3>{ar?"مختبر الحالة البعيدة":"Remote State Lab"}</h3><p className="notice">{REMOTE_STATE_BOUNDARY}</p><textarea value={remoteJson} onChange={(e)=>setRemoteJson(e.target.value)} placeholder='[{"hypothesisId":"moving","ruleId":"R1","weight":1,"direction":1}]' /><button onClick={runRemote}>{ar?"رتب الفرضيات من أصوات القواعد":"Rank hypotheses from supplied rule votes"}</button>{remoteResults.length>0&&<Bars rows={remoteResults.slice(0,8).map((r)=>({label:r.label,value:r.score,detail:r.score.toFixed(2)}))}/>}</article>
    </div>

    <div className="two-col">
      <article className="panel"><h3>{ar?"معايرة الثقة":"Confidence calibration"}</h3>{bins.length?<Bars rows={bins.map((b)=>({label:b.low+"–"+b.high+"%",value:b.accuracy,detail:"n="+b.sampleSize+" · acc "+(b.accuracy*100).toFixed(0)+"%"}))}/>:<p>{ar?"يلزم حالات محسومة.":"Resolved cases required."}</p>}</article>
      <article className="panel"><h3>{ar?"الأداء حسب فئة السؤال":"Question-category performance"}</h3>{categories.length?<Bars rows={categories.slice(0,10).map((c)=>({label:c.category,value:c.accuracy,detail:"n="+c.sampleSize+" · "+(c.accuracy*100).toFixed(0)+"%"}))}/>:<p>{ar?"لا توجد بيانات كافية.":"No empirical category data yet."}</p>}</article>
    </div>

    <div className="two-col">
      <article className="panel"><h3>{ar?"الدقة التاريخية":"Historical performance"}</h3>{history.length?<Bars rows={history.slice(-12).map((h)=>({label:"#"+h.index,value:h.accuracy,detail:(h.accuracy*100).toFixed(0)+"%"}))}/>:<p>{ar?"لا توجد نتائج محسومة.":"No resolved outcomes."}</p>}</article>
      <article className="panel"><h3>{ar?"تكرار الأشكال":"Figure frequency"}</h3>{figures.length?<Bars rows={figures.slice(0,10).map((f)=>({label:f.latin,value:f.frequency,detail:f.count+" · "+(f.frequency*100).toFixed(1)+"%"}))}/>:<p>{ar?"لا توجد ضروب محفوظة.":"No stored casts."}</p>}</article>
    </div>

    <article className="panel"><h3>{ar?"بيانات اختبار الوحدات — المستخدم يزودها":"Subsystem trial dataset — user supplied"}</h3><p>{ar?"لا تُستنتج مساهمة أي وحدة من دون أصوات وحدات مسجلة ونتائج فعلية.":"Subsystem contribution is not inferred unless module votes and actual outcomes are supplied."}</p><textarea value={researchJson} onChange={(e)=>setResearchJson(e.target.value)} placeholder='[{"id":"T1","actual":true,"moduleVotes":{"raml":1,"abjad":-0.2}}]' /><button onClick={()=>parse<ResearchCase[]>(researchJson,setResearchRows)}>{ar?"تحميل بيانات البحث":"Load research dataset"}</button>{researchRows.length>0&&<><h4>Ablation: raml</h4><p>{JSON.stringify(ablationTest(researchRows,["raml"]))}</p><h4>{ar?"بطولة المناهج":"Method Tournament"}</h4><Bars rows={tournament.map((x)=>({label:x.name,value:x.summary.accuracy,detail:"n="+x.summary.sampleSize+" · "+(x.summary.accuracy*100).toFixed(1)+"%"}))}/><h4>{ar?"مساهمة الأنظمة الفرعية":"Subsystem contribution"}</h4><Bars rows={contribution.map((x)=>({label:x.module,value:x.delta,detail:(x.delta*100).toFixed(1)+" pp"}))}/></>}</article>

    <div className="two-col">
      <article className="panel"><h3>{ar?"موسى مقابل أبسولوت":"Human vs Absolute"}</h3><textarea value={humanJson} onChange={(e)=>setHumanJson(e.target.value)} placeholder='[{"musa":true,"absolute":false,"actual":true}]' /><button onClick={()=>parse<HumanAbsoluteRecord[]>(humanJson,setHumanRows)}>{ar?"تحميل المقارنة":"Load comparison"}</button>{human&&<pre>{JSON.stringify(human,null,2)}</pre>}</article>
      <article className="panel"><h3>{ar?"بقاء القواعد":"Rule Survival"}</h3><textarea value={ruleJson} onChange={(e)=>setRuleJson(e.target.value)} placeholder='[{"ruleId":"R1","predicted":true,"actual":true}]' /><button onClick={()=>parse<RuleOutcomeRecord[]>(ruleJson,setRuleRows)}>{ar?"تحميل سجل القواعد":"Load rule outcomes"}</button>{survival.map((r)=><div className="record-row" key={r.ruleId}><strong>{r.ruleId} · {r.status}</strong><small>n={r.sampleSize} · {(r.accuracy*100).toFixed(1)}% · Wilson low {(r.wilsonLow*100).toFixed(1)}%</small></div>)}</article>
    </div>

    <article className="panel"><h3>{ar?"تشريح الأخطاء":"Error Autopsy"}</h3>{autopsies.length?autopsies.map(({caseId,autopsy})=><div className="record-row" key={caseId}><strong>{caseId} · {autopsy.frozenMethodologyVersion}</strong>{autopsy.suspectedFailureModes.map((x)=><span key={x}>{x}</span>)}</div>):<p>{ar?"لا توجد أخطاء قابلة للقياس في السجل الحالي.":"No scorable incorrect predictions in the current archive."}</p>}</article>
  </section>;
}
