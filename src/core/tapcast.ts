import { figureFromPattern } from "./figures";
import type { Dot, GeomanticFigure, FigurePattern } from "./types";

export interface TapLine {
  count: number;
  locked: boolean;
  parity: Dot | null;
}

export interface TapCastSession {
  blind: boolean;
  lines: readonly TapLine[];
  activeLine: number;
  completed: boolean;
}

export function createTapCastSession(blind = true): TapCastSession {
  return {
    blind,
    lines:Array.from({length:16},() => ({ count:0, locked:false, parity:null })),
    activeLine:0,
    completed:false
  };
}

export function tapActiveLine(session: TapCastSession): TapCastSession {
  if (session.completed) return session;
  const index = session.activeLine;
  const lines = session.lines.map((line,position) =>
    position === index && !line.locked ? { ...line, count:line.count + 1 } : line
  );
  return { ...session, lines };
}

export function lockActiveLine(session: TapCastSession): TapCastSession {
  if (session.completed) return session;
  const index = session.activeLine;
  const current = session.lines[index];
  if (!current || current.count < 1) throw new Error("Tap the active line at least once before locking it.");

  const parity: Dot = current.count % 2 === 0 ? 2 : 1;
  const lines = session.lines.map((line,position) =>
    position === index ? { ...line, locked:true, parity } : line
  );

  const next = lines.findIndex((line) => !line.locked);
  return {
    ...session,
    lines,
    activeLine:next === -1 ? 15 : next,
    completed:next === -1
  };
}

export function resetActiveLine(session: TapCastSession): TapCastSession {
  if (session.completed) return session;
  const lines = session.lines.map((line,position) =>
    position === session.activeLine ? { count:0, locked:false, parity:null } : line
  );
  return { ...session, lines };
}

export function toggleBlindCast(session: TapCastSession): TapCastSession {
  return { ...session, blind:!session.blind };
}

export function mothersFromTapCast(session: TapCastSession): GeomanticFigure[] {
  if (!session.completed || session.lines.some((line) => !line.locked || line.parity == null)) {
    throw new Error("All sixteen casting lines must be locked before Mothers can be derived.");
  }

  const figures: GeomanticFigure[] = [];
  for (let mother = 0; mother < 4; mother++) {
    const offset = mother * 4;
    const pattern = [
      session.lines[offset].parity,
      session.lines[offset+1].parity,
      session.lines[offset+2].parity,
      session.lines[offset+3].parity
    ] as FigurePattern;
    figures.push(figureFromPattern(pattern));
  }
  return figures;
}
