import { useMemo, useState } from "react";
import { flattenAncestry, traceJudgeLine, type Shield } from "../core";

export function ReverseTrace({ shield }: { shield: Shield }) {
  const [line,setLine] = useState(1);
  const rows = useMemo(() => flattenAncestry(traceJudgeLine(shield,line)),[shield,line]);

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">REVERSE JUDGE ANALYSIS</p>
          <h3>Trace Judge line {line} backward</h3>
        </div>
        <div className="line-picker">
          {[1,2,3,4].map((value) => (
            <button key={value} className={line === value ? "" : "secondary"} onClick={() => setLine(value)}>
              Line {value}
            </button>
          ))}
        </div>
      </div>

      <div className="ancestry-tree">
        {rows.map((row,index) => (
          <div key={index} className="ancestry-row" style={{ paddingLeft:(row.depth * 22) + "px" }}>
            <span className="ancestry-node">{row.node}</span>
            <span>line {row.line}</span>
            <strong>{row.value === 1 ? "●" : "● ●"}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}
