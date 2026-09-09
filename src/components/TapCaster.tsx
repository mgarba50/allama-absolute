import { useState } from "react";
import {
  createTapCastSession,
  lockActiveLine,
  mothersFromTapCast,
  resetActiveLine,
  tapActiveLine,
  toggleBlindCast
} from "../core";
import { FigureGlyph } from "./FigureGlyph";

export function TapCaster({ onUseMothers }: { onUseMothers: (ids: string[]) => void }) {
  const [session,setSession] = useState(() => createTapCastSession(true));
  const active = session.lines[session.activeLine];

  function resetAll(): void {
    setSession(createTapCastSession(session.blind));
  }

  function lock(): void {
    try {
      setSession((current) => lockActiveLine(current));
    } catch {
      return;
    }
  }

  const completedMothers = session.completed ? mothersFromTapCast(session) : [];

  return (
    <section className="tap-caster">
      <div className="section-heading">
        <div>
          <p className="eyebrow">MANUAL HUMAN CAST</p>
          <h3>Sixteen-line tapping chamber</h3>
        </div>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={session.blind}
            onChange={() => setSession((current) => toggleBlindCast(current))}
          />
          Blind count
        </label>
      </div>

      {!session.completed ? (
        <>
          <div className="tap-status">
            <span>Active line</span>
            <strong>{session.activeLine + 1} / 16</strong>
            <span>Mother {Math.floor(session.activeLine / 4) + 1}, line {(session.activeLine % 4) + 1}</span>
          </div>

          <button className="tap-button" onClick={() => setSession((current) => tapActiveLine(current))}>
            TAP
            <small>{session.blind ? "Count concealed" : active.count + " taps"}</small>
          </button>

          <div className="tap-actions">
            <button onClick={lock} disabled={active.count < 1}>Lock this line</button>
            <button className="secondary" onClick={() => setSession((current) => resetActiveLine(current))}>Clear active line</button>
            <button className="secondary" onClick={resetAll}>Restart cast</button>
          </div>
        </>
      ) : (
        <div className="completed-cast">
          <p className="success-line">✓ Sixteen lines locked. Four Mothers derived.</p>
          <div className="completed-mothers">
            {completedMothers.map((figure,index) => (
              <div key={figure.id + index}>
                <span>M{index + 1}</span>
                <FigureGlyph pattern={figure.pattern} />
                <strong>{figure.latin}</strong>
                <small>{figure.arabic}</small>
              </div>
            ))}
          </div>
          <div className="tap-actions">
            <button onClick={() => onUseMothers(completedMothers.map((figure) => figure.id))}>Use these Mothers in shield</button>
            <button className="secondary" onClick={resetAll}>Cast again</button>
          </div>
        </div>
      )}

      <div className="line-ledger">
        {session.lines.map((line,index) => (
          <div key={index} className={line.locked ? "line-chip locked" : index === session.activeLine ? "line-chip active" : "line-chip"}>
            <span>{index + 1}</span>
            <strong>{line.locked ? (line.parity === 1 ? "●" : "●●") : "—"}</strong>
            <small>{line.locked && !session.blind ? line.count + " taps" : line.locked ? "locked" : ""}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
