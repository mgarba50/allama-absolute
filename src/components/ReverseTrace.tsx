import { useMemo, useState } from "react";
import { flattenAncestry, traceJudgeLine, type Locale, type Shield } from "../core";

export function ReverseTrace({ shield,locale="en" }: { shield: Shield; locale?:Locale }) {
  const [line,setLine] = useState(1);
  const rows = useMemo(() => flattenAncestry(traceJudgeLine(shield,line)),[shield,line]);
  const ar=locale==="ar";
  return <section className="panel">
    <div className="section-heading">
      <div><p className="eyebrow">{ar?"التحليل العكسي للحاكم":"REVERSE JUDGE ANALYSIS"}</p><h3>{ar?`تتبّع السطر ${line} من الحاكم إلى أصوله`:`Trace Judge line ${line} backward`}</h3></div>
      <div className="line-picker">{[1,2,3,4].map((value)=><button key={value} className={line===value?"":"secondary"} onClick={()=>setLine(value)}>{ar?"السطر":"Line"} {value}</button>)}</div>
    </div>
    <div className="ancestry-tree">{rows.map((row,index)=><div key={index} className="ancestry-row" style={ar?{paddingRight:(row.depth*22)+"px"}:{paddingLeft:(row.depth*22)+"px"}}>
      <span className="ancestry-node">{row.node}</span><span>{ar?"السطر":"line"} {row.line}</span><strong>{row.value===1?"●":"● ●"}</strong>
    </div>)}</div>
  </section>;
}
