import { useMemo, useState } from "react";
import {
  compareLocationAwareTiming,
  exploreSchedule,
  type Locale,
  type Planet,
  type TimingCandidateResult
} from "../core";

interface Props { locale:Locale; defaultLatitude:number; defaultLongitude:number; defaultMoment:string; }
const PLANETS:readonly Planet[]=["Saturn","Jupiter","Mars","Sun","Venus","Mercury","Moon"];

function asLocalInput(date:Date):string{
  const offset=date.getTimezoneOffset()*60000;
  return new Date(date.getTime()-offset).toISOString().slice(0,16);
}

export function TimingLab({locale,defaultLatitude,defaultLongitude,defaultMoment}:Props){
  const ar=locale==="ar";
  const [a,setA]=useState({label:"Maiduguri",lat:String(defaultLatitude),lon:String(defaultLongitude),tz:"Africa/Lagos",moment:defaultMoment});
  const [b,setB]=useState({label:"Alternative",lat:"6.5244",lon:"3.3792",tz:"Africa/Lagos",moment:defaultMoment});
  const [preferred,setPreferred]=useState<Planet>("Jupiter");
  const [avoided,setAvoided]=useState<Planet>("Saturn");
  const [rangeStart,setRangeStart]=useState(defaultMoment);
  const [rangeEnd,setRangeEnd]=useState(asLocalInput(new Date(new Date(defaultMoment).getTime()+2*86400000)));
  const [results,setResults]=useState<TimingCandidateResult[]>([]);
  const [windows,setWindows]=useState<ReturnType<typeof exploreSchedule>>([]);
  const [message,setMessage]=useState("");
  const preference=useMemo(()=>({preferredPlanets:[preferred] as Planet[],avoidedPlanets:[avoided] as Planet[]}),[preferred,avoided]);

  function compare():void{
    try{
      setResults(compareLocationAwareTiming([
        {label:a.label,moment:new Date(a.moment),latitude:Number(a.lat),longitude:Number(a.lon),timeZone:a.tz},
        {label:b.label,moment:new Date(b.moment),latitude:Number(b.lat),longitude:Number(b.lon),timeZone:b.tz}
      ],preference));
      setMessage("");
    }catch(error){setMessage(error instanceof Error?error.message:String(error));}
  }
  function scan():void{
    try{
      setWindows(exploreSchedule(new Date(rangeStart),new Date(rangeEnd),Number(a.lat),Number(a.lon),preference));
      setMessage("");
    }catch(error){setMessage(error instanceof Error?error.message:String(error));}
  }
  const label=(en:string,arText:string)=>ar?arText:en;
  const field=(value:string,setter:(v:string)=>void,title:string,type="text")=><label>{title}<input type={type} value={value} onChange={(e)=>setter(e.target.value)}/></label>;

  return <section>
    <div className="section-heading">
      <div><p className="eyebrow">{label("CELESTIAL OBSERVATORY","المرصد الفلكي")}</p><h2>{label("Timing & Schedule Explorer","مستكشف التوقيت والجداول")}</h2></div>
      <span className="status">{label("Traditional ranking — calculated astronomy","ترتيب تقليدي — حسابات فلكية")}</span>
    </div>
    {message&&<p className="notice">{message}</p>}
    <div className="two-col">
      {[a,b].map((x,index)=><article className="panel" key={index}>
        <h3>{label(index===0?"Candidate A":"Candidate B",index===0?"الخيار أ":"الخيار ب")}</h3>
        {field(x.label,v=>index===0?setA({...a,label:v}):setB({...b,label:v}),label("Label","الاسم"))}
        <div className="coordinates">
          {field(x.lat,v=>index===0?setA({...a,lat:v}):setB({...b,lat:v}),label("Latitude","خط العرض"),"number")}
          {field(x.lon,v=>index===0?setA({...a,lon:v}):setB({...b,lon:v}),label("Longitude","خط الطول"),"number")}
        </div>
        {field(x.tz,v=>index===0?setA({...a,tz:v}):setB({...b,tz:v}),label("IANA time zone","المنطقة الزمنية IANA"))}
        {field(x.moment,v=>index===0?setA({...a,moment:v}):setB({...b,moment:v}),label("Local input moment","الوقت المدخل"),"datetime-local")}
      </article>)}
    </div>
    <article className="panel">
      <div className="coordinates">
        <label>{label("Preferred planetary ruler","الكوكب المفضل")}<select value={preferred} onChange={(e)=>setPreferred(e.target.value as Planet)}>{PLANETS.map(p=><option key={p}>{p}</option>)}</select></label>
        <label>{label("Avoided planetary ruler","الكوكب المتجنب")}<select value={avoided} onChange={(e)=>setAvoided(e.target.value as Planet)}>{PLANETS.map(p=><option key={p}>{p}</option>)}</select></label>
      </div>
      <button onClick={compare}>{label("Compare calculated contexts","قارن السياقات المحسوبة")}</button>
    </article>
    {results.map((result)=><article className="panel" key={result.label+result.momentUtc}>
      <div className="section-heading"><div><span className="metric-label">{result.label}</span><h3>{result.planetaryHour.planet} · {label("hour","ساعة")} {result.planetaryHour.ordinal}</h3></div><strong>{label("score","الدرجة")} {result.score}</strong></div>
      <div className="profile">
        <div><span>{label("Local display","العرض المحلي")}</span><strong>{result.localDisplay}</strong></div>
        <div><span>{label("UTC","التوقيت العالمي")}</span><strong>{result.momentUtc}</strong></div>
        <div><span>{label("Lunar mansion","المنزلة القمرية")}</span><strong>{result.lunarMansion.index} · {result.lunarMansion.arabicName}</strong></div>
        <div><span>{label("Moon illumination","إضاءة القمر")}</span><strong>{(result.moon.fraction*100).toFixed(1)}%</strong></div>
      </div>
      <table><thead><tr><th>{label("Body","الجسم")}</th><th>{label("Longitude","الطول")}</th><th>{label("Latitude","العرض")}</th><th>{label("Zodiac","البرج")}</th></tr></thead>
      <tbody>{result.planets.map(p=><tr key={p.body}><td>{p.body}</td><td>{p.longitude.toFixed(4)}°</td><td>{p.latitude.toFixed(4)}°</td><td>{p.zodiacName}</td></tr>)}</tbody></table>
    </article>)}

    <article className="panel">
      <h3>{label("Schedule Explorer","مستكشف الجدول")}</h3>
      <p>{label("Ranks planetary-hour windows only by the preferences you explicitly configure. It does not claim objective causation.","يرتب نوافذ الساعات الكوكبية فقط وفق التفضيلات التي تضبطها صراحة، ولا يدّعي سببية موضوعية.")}</p>
      <div className="coordinates">
        {field(rangeStart,setRangeStart,label("Start","البداية"),"datetime-local")}
        {field(rangeEnd,setRangeEnd,label("End (max 62 days)","النهاية (بحد أقصى 62 يوماً)"),"datetime-local")}
      </div>
      <button onClick={scan}>{label("Rank schedule windows","رتب نوافذ الجدول")}</button>
      {windows.slice(0,48).map((w,index)=><div className="record-row" key={w.start+w.planet}>
        <strong>#{index+1} · {w.planet} · {label("score","الدرجة")} {w.score}</strong>
        <small>{w.start} → {w.end} · {w.daylight?label("day","نهار"):label("night","ليل")}</small>
        <span>{w.label} · {w.reasons.join(" ")}</span>
      </div>)}
    </article>
  </section>;
}
