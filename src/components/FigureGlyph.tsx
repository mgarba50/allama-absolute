export function FigureGlyph({ pattern, compact = false }: { pattern: readonly number[]; compact?: boolean }) {
  return (
    <div className={compact ? "glyph compact" : "glyph"} aria-label={"Geomantic pattern " + pattern.join("-")}>
      {pattern.map((line,index) => (
        <div key={index} className="glyph-line">{line === 1 ? "●" : "● ●"}</div>
      ))}
    </div>
  );
}
