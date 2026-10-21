import { useMemo } from "react";
import { HOUSES, housePlacements, type Locale, type Shield } from "../core";
import { FigureGlyph } from "./FigureGlyph";

export function HouseMap({ shield,selectedHouse,onSelect,locale="en" }: { shield:Shield; selectedHouse:number; onSelect:(house:number)=>void; locale?:Locale }) {
  const placements = useMemo(() => housePlacements(shield),[shield]);
  const selected = placements[selectedHouse - 1];
  const metadata = HOUSES[selectedHouse - 1];
  const ar=locale==="ar";
  return <section>
    <div className="house-wheel">
      {placements.map((placement) => {
        const house=HOUSES[placement.house-1];
        return <button key={placement.house} className={placement.house === selectedHouse ? "house-card selected" : "house-card"} onClick={() => onSelect(placement.house)}>
          <span>{ar?"البيت":"HOUSE"} {placement.house}</span><FigureGlyph pattern={placement.figure.pattern} compact/>
          <strong>{placement.figure.latin}</strong><small>{ar?house.nameAr:house.name}</small>
        </button>;
      })}
    </div>
    <article className="panel house-detail">
      <div><p className="eyebrow">{ar?"البيت":"HOUSE"} {selectedHouse}</p><h3>{ar?metadata.nameAr:metadata.name}</h3><p>{(ar?metadata.keywordsAr:metadata.keywords).join(" · ")}</p></div>
      <div className="figure-row"><FigureGlyph pattern={selected.figure.pattern}/><div><strong>{selected.figure.latin}</strong><small>{selected.figure.arabic} · {selected.figure.element} · {selected.figure.planet}</small></div></div>
    </article>
  </section>;
}
