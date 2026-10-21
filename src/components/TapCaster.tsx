import { useState } from "react";
import {
  createTapCastSession,
  lockActiveLine,
  mothersFromTapCast,
  resetActiveLine,
  tapActiveLine,
  toggleBlindCast,
  type Locale
} from "../core";
import { FigureGlyph } from "./FigureGlyph";

export function TapCaster({ onUseMothers,locale="en" }: { onUseMothers: (ids: string[]) => void; locale?:Locale }) {
  const [session,setSession] = useState(() => createTapCastSession(true));
  const active = session.lines[session.activeLine];
  const ar=locale==="ar";
  const t=(en:string,arabic:string)=>ar?arabic:en;

  function resetAll(): void { setSession(createTapCastSession(session.blind)); }
  function lock(): void {
    try { setSession((current) => lockActiveLine(current)); } catch { return; }
  }
  const completedMothers = session.completed ? mothersFromTapCast(session) : [];

  return (
    <section className="tap-caster">
      <div className="section-heading">
        <div>
          <p className="eyebrow">{t("MANUAL HUMAN CAST","الضرب اليدوي")}</p>
          <h3>{t("Sixteen-line tapping chamber","حجرة النقر ذات الستة عشر سطراً")}</h3>
        </div>
        <label className="switch-row">
          <input type="checkbox" checked={session.blind} onChange={() => setSession((current) => toggleBlindCast(current))}/>
          {t("Blind count","إخفاء العد")}
        </label>
      </div>
      {!session.completed ? <>
        <div className="tap-status">
          <span>{t("Active line","السطر النشط")}</span>
          <strong>{session.activeLine + 1} / 16</strong>
          <span>{t("Mother","الأم")} {Math.floor(session.activeLine / 4) + 1}، {t("line","السطر")} {(session.activeLine % 4) + 1}</span>
        </div>
        <button className="tap-button" onClick={() => setSession((current) => tapActiveLine(current))}>
          {t("TAP","انقر")}
          <small>{session.blind ? t("Count concealed","العد مخفي") : active.count + " " + t("taps","نقرات")}</small>
        </button>
        <div className="tap-actions">
          <button onClick={lock} disabled={active.count < 1}>{t("Lock this line","ثبّت هذا السطر")}</button>
          <button className="secondary" onClick={() => setSession((current) => resetActiveLine(current))}>{t("Clear active line","مسح السطر النشط")}</button>
          <button className="secondary" onClick={resetAll}>{t("Restart cast","إعادة الضرب")}</button>
        </div>
      </> : <div className="completed-cast">
        <p className="success-line">✓ {t("Sixteen lines locked. Four Mothers derived.","تم تثبيت ستة عشر سطراً واشتقاق الأمهات الأربع.")}</p>
        <div className="completed-mothers">
          {completedMothers.map((figure,index) => <div key={figure.id + index}>
            <span>{t("Mother","الأم")} {index + 1}</span><FigureGlyph pattern={figure.pattern}/><strong>{figure.latin}</strong><small>{figure.arabic}</small>
          </div>)}
        </div>
        <div className="tap-actions">
          <button onClick={() => onUseMothers(completedMothers.map((figure) => figure.id))}>{t("Use these Mothers in shield","اعتماد هذه الأمهات في الدرع")}</button>
          <button className="secondary" onClick={resetAll}>{t("Cast again","ضرب جديد")}</button>
        </div>
      </div>}
      <div className="line-ledger">
        {session.lines.map((line,index) => <div key={index} className={line.locked ? "line-chip locked" : index === session.activeLine ? "line-chip active" : "line-chip"}>
          <span>{index + 1}</span><strong>{line.locked ? (line.parity === 1 ? "●" : "●●") : "—"}</strong>
          <small>{line.locked && !session.blind ? line.count + " " + t("taps","نقرات") : line.locked ? t("locked","مثبت") : ""}</small>
        </div>)}
      </div>
    </section>
  );
}
