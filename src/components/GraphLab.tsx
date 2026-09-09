import { useMemo, useState } from "react";
import {
  contradictionGraph,
  elementFlowGraph,
  houseNetworkGraph,
  judgeAncestryGraph,
  migrationGraph,
  runAbsoluteAnalysis,
  runDeepSearch,
  testimonyDependencyGraph,
  type GraphModel,
  type Locale
} from "../core";

interface Props {
  locale:Locale;
  question:string;
  motherIds:readonly string[];
  latitude:number;
  longitude:number;
  momentText:string;
}

function GraphCanvas({model}:{model:GraphModel}) {
  const positions=useMemo(()=>{
    const count=Math.max(1,model.nodes.length);
    return new Map(model.nodes.map((node,index)=>{
      const angle=(Math.PI*2*index/count)-Math.PI/2;
      const radius=count<=4?110:count<=12?155:185;
      return [node.id,{x:250+Math.cos(angle)*radius,y:220+Math.sin(angle)*radius}];
    }));
  },[model]);
  return <div className="graph-frame">
    <svg viewBox="0 0 500 440" role="img" aria-label={model.title}>
      <g className="graph-edges">{model.edges.map((edge)=>{
        const a=positions.get(edge.from),b=positions.get(edge.to);
        if(!a||!b) return null;
        return <line key={edge.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} data-strength={edge.strength??1}/>;
      })}</g>
      <g className="graph-nodes">{model.nodes.map((node)=>{
        const p=positions.get(node.id)!;
        return <g key={node.id} transform={`translate(${p.x} ${p.y})`}>
          <circle r="27" />
          <text textAnchor="middle" y="-2">{node.label.slice(0,18)}</text>
          <text className="graph-group" textAnchor="middle" y="12">{node.group.slice(0,14)}</text>
          <title>{node.label} · {node.group}</title>
        </g>;
      })}</g>
    </svg>
  </div>;
}

export function GraphLab({locale,question,motherIds,latitude,longitude,momentText}:Props){
  const ar=locale==="ar";
  const [kind,setKind]=useState("ancestry");
  const analysis=useMemo(()=>runAbsoluteAnalysis({
    question,motherIds,timestamp:new Date(momentText),latitude,longitude
  }),[question,motherIds.join("|"),latitude,longitude,momentText]);
  const deep=useMemo(()=>runDeepSearch({analysis}),[analysis]);
  const models=useMemo(()=>({
    ancestry:judgeAncestryGraph(analysis),
    houses:houseNetworkGraph(analysis),
    elements:elementFlowGraph(analysis),
    migration:migrationGraph(analysis),
    testimony:testimonyDependencyGraph(analysis),
    contradiction:contradictionGraph(deep)
  }),[analysis,deep]);
  const model=models[kind as keyof typeof models];
  const buttons=[
    ["ancestry",ar?"نسب الحاكم":"Judge ancestry"],
    ["houses",ar?"شبكة البيوت":"House network"],
    ["elements",ar?"سريان العناصر":"Element flow"],
    ["migration",ar?"انتقال الأشكال":"Figure migration"],
    ["testimony",ar?"اعتماد الشهادات":"Testimony dependency"],
    ["contradiction",ar?"التعارض":"Contradiction"]
  ] as const;
  return <section>
    <div className="section-heading">
      <div><p className="eyebrow">{ar?"محرك الرسوم التحليلية":"STRUCTURAL VISUALIZATION"}</p><h2>{ar?"مختبر الرسوم":"Graph Laboratory"}</h2></div>
      <span className="status">{model.nodes.length} {ar?"عقد":"nodes"} · {model.edges.length} {ar?"روابط":"edges"}</span>
    </div>
    <div className="graph-tabs">{buttons.map(([id,label])=><button key={id} className={kind===id?"":"secondary"} onClick={()=>setKind(id)}>{label}</button>)}</div>
    <article className="panel">
      <h3>{ar?({
        ancestry:"رسم نسب الحاكم",houses:"رسم شبكة البيوت",elements:"رسم سريان العناصر",
        migration:"رسم انتقال الأشكال",testimony:"رسم اعتماد الشهادات",contradiction:"رسم التعارض"
      } as Record<string,string>)[kind]:model.title}</h3>
      {model.nodes.length?<GraphCanvas model={model}/>:<p className="notice">{ar?"لا توجد بيانات كافية لهذا الرسم في الضرب الحالي.":"This cast does not currently produce nodes for this graph."}</p>}
    </article>
    <article className="panel">
      <h3>{ar?"أقوى نتائج البحث العميق":"Top Deep-Search Findings"}</h3>
      {deep.findings.slice(0,12).map((item)=><div className="record-row" key={item.id}>
        <strong>{item.label}</strong>
        <small>{item.category} · {(item.strength*100).toFixed(0)}% · {item.direction>0?"+":item.direction<0?"−":"·"}</small>
        <span>{item.detail}</span>
        <code>{item.provenance.join(" · ")}</code>
      </div>)}
    </article>
  </section>;
}
