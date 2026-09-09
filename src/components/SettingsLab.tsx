import { useEffect, useState } from "react";
import {
  LOCAL_AI_PRESETS,
  MUSA_ALLAMA_METHOD,
  PROTOCOLS,
  SqliteCaseRepository,
  createLocalAiProvider,
  createProtocolBookmark,
  decryptMethodologyProfile,
  downloadText,
  encryptMethodologyProfile,
  toJson,
  type EncryptedBackup,
  type Locale,
  type MethodologyProfile
} from "../core";

export function SettingsLab({locale}:{locale:Locale}){
  const ar=locale==="ar";
  const [repo,setRepo]=useState<SqliteCaseRepository|null>(null);
  const [profile,setProfile]=useState<MethodologyProfile>(MUSA_ALLAMA_METHOD);
  const [classical,setClassical]=useState("[]");
  const [correspondences,setCorrespondences]=useState("{}");
  const [weights,setWeights]=useState("{}");
  const [notes,setNotes]=useState("[]");
  const [protocolId,setProtocolId]=useState(PROTOCOLS[0].id);
  const [bookmarkName,setBookmarkName]=useState(PROTOCOLS[0].name);
  const [bookmarks,setBookmarks]=useState<ReturnType<SqliteCaseRepository["listProtocolBookmarks"]>>([]);
  const [endpoint,setEndpoint]=useState(LOCAL_AI_PRESETS.ollama.endpoint);
  const [model,setModel]=useState("");
  const [aiResult,setAiResult]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");

  const label=(en:string,arText:string)=>ar?arText:en;
  const sync=(p:MethodologyProfile)=>{setProfile(p);setClassical(JSON.stringify(p.classicalRules,null,2));setCorrespondences(JSON.stringify(p.customCorrespondences,null,2));setWeights(JSON.stringify(p.calibratedWeights,null,2));setNotes(JSON.stringify(p.notes,null,2));};

  useEffect(()=>{let active=true;let opened:SqliteCaseRepository|null=null;void SqliteCaseRepository.open().then((r)=>{
    if(!active){r.close();return;} opened=r;setRepo(r);const saved=r.getMethodologyProfile(MUSA_ALLAMA_METHOD.id);sync(saved??MUSA_ALLAMA_METHOD);setBookmarks(r.listProtocolBookmarks());
  }).catch((e)=>setMessage(String(e)));return()=>{active=false;opened?.close();};},[]);

  async function saveProfile():Promise<void>{
    if(!repo)return;
    try{
      const updated:MethodologyProfile={...profile,
        classicalRules:JSON.parse(classical) as string[],
        customCorrespondences:JSON.parse(correspondences) as Record<string,unknown>,
        calibratedWeights:JSON.parse(weights) as Record<string,number>,
        notes:JSON.parse(notes) as string[]
      };
      await repo.saveMethodologyProfile(updated);sync(updated);setMessage(label("Methodology saved to SQLite.","تم حفظ المنهج في SQLite."));
    }catch(e){setMessage(e instanceof Error?e.message:String(e));}
  }

  async function addBookmark():Promise<void>{
    if(!repo)return;
    const protocol=PROTOCOLS.find((p)=>p.id===protocolId);
    if(!protocol)return;
    const bookmark={...createProtocolBookmark(protocol),name:bookmarkName.trim()||protocol.name};
    await repo.saveProtocolBookmark(bookmark);
    setBookmarks(repo.listProtocolBookmarks());
  }

  async function exportEncrypted():Promise<void>{
    try{
      const encrypted=await encryptMethodologyProfile(profile,password);
      downloadText("musa-allama-method.encrypted.json",toJson(encrypted),"application/json");
      setMessage(label("Encrypted methodology exported.","تم تصدير المنهج مشفراً."));
    }catch(e){setMessage(e instanceof Error?e.message:String(e));}
  }

  async function importEncrypted(file:File):Promise<void>{
    if(!repo)return;
    try{
      const parsed=JSON.parse(await file.text()) as EncryptedBackup;
      const restored=await decryptMethodologyProfile(parsed,password);
      await repo.saveMethodologyProfile(restored);sync(restored);
      setMessage(label("Encrypted methodology restored into SQLite.","تمت استعادة المنهج المشفر إلى SQLite."));
    }catch(e){setMessage(e instanceof Error?e.message:String(e));}
  }

  async function testLocalAi():Promise<void>{
    try{
      setAiResult(label("Testing local endpoint…","جارٍ اختبار النموذج المحلي…"));
      const provider=createLocalAiProvider({endpoint,model});
      const result=await provider.complete([
        {role:"system",content:"Return only the token ALLAMA_LOCAL_OK."},
        {role:"user",content:"Connectivity test."}
      ]);
      setAiResult(result.provider+" / "+result.model+": "+result.text);
      setMessage("");
    }catch(e){setAiResult("");setMessage(e instanceof Error?e.message:String(e));}
  }

  if(!repo)return <section className="panel"><p>{message||label("Opening SQLite settings…","جارٍ فتح إعدادات SQLite…")}</p></section>;
  return <section>
    <div className="section-heading"><div><p className="eyebrow">{label("PRIVATE PRACTITIONER CONFIGURATION","إعدادات الممارس الخاصة")}</p><h2>{label("Methodology & Local Intelligence","المنهج والذكاء المحلي")}</h2></div><span className="status">SQLite</span></div>
    {message&&<p className="notice">{message}</p>}
    <div className="two-col">
      <article className="panel">
        <h3>MUSA ALLAMA METHOD</h3>
        <p>{label("Empty arrays mean no rule, correspondence, or weight is silently invented.","القوائم الفارغة تعني أن النظام لا يختلق قاعدة أو مراسلة أو وزناً من عنده.")}</p>
        <label>{label("Classical rules (JSON array)","القواعد الكلاسيكية (مصفوفة JSON)")}<textarea value={classical} onChange={(e)=>setClassical(e.target.value)}/></label>
        <label>{label("Custom correspondences (JSON object)","المراسلات الخاصة (كائن JSON)")}<textarea value={correspondences} onChange={(e)=>setCorrespondences(e.target.value)}/></label>
        <label>{label("Calibrated weights (JSON object)","الأوزان المعايرة (كائن JSON)")}<textarea value={weights} onChange={(e)=>setWeights(e.target.value)}/></label>
        <label>{label("Private notes (JSON array)","ملاحظات خاصة (مصفوفة JSON)")}<textarea value={notes} onChange={(e)=>setNotes(e.target.value)}/></label>
        <button onClick={()=>void saveProfile()}>{label("Save methodology","حفظ المنهج")}</button>
      </article>
      <article className="panel">
        <h3>{label("Encrypted methodology backup","نسخة المنهج المشفرة")}</h3>
        <label>{label("Backup password","كلمة مرور النسخة")}<input type="password" value={password} onChange={(e)=>setPassword(e.target.value)}/></label>
        <div className="toolbar"><button onClick={()=>void exportEncrypted()}>{label("Export encrypted profile","تصدير الملف المشفر")}</button>
        <label className="file-button">{label("Restore encrypted profile","استعادة الملف المشفر")}<input type="file" accept=".json,application/json" onChange={(e)=>{const file=e.target.files?.[0];if(file)void importEncrypted(file);e.target.value="";}}/></label></div>
        <h3>{label("Protocol bookmarks","إشارات البروتوكولات")}</h3>
        <label>{label("Protocol","البروتوكول")}<select value={protocolId} onChange={(e)=>{setProtocolId(e.target.value);setBookmarkName(PROTOCOLS.find(p=>p.id===e.target.value)?.name??"");}}>{PROTOCOLS.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <label>{label("Bookmark name","اسم الإشارة")}<input value={bookmarkName} onChange={(e)=>setBookmarkName(e.target.value)}/></label>
        <button onClick={()=>void addBookmark()}>{label("Save configuration bookmark","حفظ إعداد البروتوكول")}</button>
        {bookmarks.map(b=><div className="record-row" key={b.id}><strong>{b.name}</strong><small>{b.protocolId} · {b.configuration.enabledModules.join(" · ")}</small><button className="secondary" onClick={()=>void repo.deleteProtocolBookmark(b.id).then(()=>setBookmarks(repo.listProtocolBookmarks()))}>{label("Delete","حذف")}</button></div>)}
      </article>
    </div>
    <article className="panel">
      <h3>{label("Local AI — optional synthesis only","الذكاء المحلي — تركيب اختياري فقط")}</h3>
      <p>{label("No API key is stored here. Local mode accepts loopback endpoints only and never replaces deterministic calculations.","لا يُحفظ مفتاح API هنا. الوضع المحلي يقبل عناوين الجهاز المحلي فقط ولا يستبدل الحسابات الحتمية.")}</p>
      <div className="coordinates">
        <label>{label("Endpoint","العنوان")}<input value={endpoint} onChange={(e)=>setEndpoint(e.target.value)}/></label>
        <label>{label("Model","النموذج")}<input value={model} onChange={(e)=>setModel(e.target.value)}/></label>
      </div>
      <div className="toolbar">
        <button className="secondary" onClick={()=>setEndpoint(LOCAL_AI_PRESETS.ollama.endpoint)}>Ollama</button>
        <button className="secondary" onClick={()=>setEndpoint(LOCAL_AI_PRESETS.lmStudio.endpoint)}>LM Studio</button>
        <button onClick={()=>void testLocalAi()}>{label("Test local model","اختبار النموذج المحلي")}</button>
      </div>
      {aiResult&&<pre>{aiResult}</pre>}
    </article>
  </section>;
}
