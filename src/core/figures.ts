import type { FigurePattern, GeomanticFigure } from "./types";

const raw: Array<Omit<GeomanticFigure, "id">> = [
  { latin: "Via", arabic: "الطريق", pattern: [1,1,1,1], planet: "Moon", element: "Water", quality: "neutral", keywords: ["journey","change","movement"] },
  { latin: "Populus", arabic: "الجماعة", pattern: [2,2,2,2], planet: "Moon", element: "Water", quality: "neutral", keywords: ["crowd","receptivity","collective"] },
  { latin: "Fortuna Major", arabic: "السعد الأكبر", pattern: [2,2,1,1], planet: "Sun", element: "Earth", quality: "favorable", keywords: ["lasting success","authority","stability"] },
  { latin: "Fortuna Minor", arabic: "السعد الأصغر", pattern: [1,1,2,2], planet: "Sun", element: "Fire", quality: "favorable", keywords: ["swift success","temporary advantage","action"] },
  { latin: "Acquisitio", arabic: "الكسب", pattern: [2,1,2,1], planet: "Jupiter", element: "Air", quality: "favorable", keywords: ["gain","acquisition","increase"] },
  { latin: "Amissio", arabic: "الخسارة", pattern: [1,2,1,2], planet: "Venus", element: "Fire", quality: "unfavorable", keywords: ["loss","release","departure"] },
  { latin: "Laetitia", arabic: "الفرح", pattern: [1,2,2,2], planet: "Jupiter", element: "Fire", quality: "favorable", keywords: ["joy","elevation","optimism"] },
  { latin: "Tristitia", arabic: "الحزن", pattern: [2,2,2,1], planet: "Saturn", element: "Air", quality: "unfavorable", keywords: ["delay","heaviness","restriction"] },
  { latin: "Puer", arabic: "الولد", pattern: [1,1,2,1], planet: "Mars", element: "Air", quality: "neutral", keywords: ["impulse","conflict","initiative"] },
  { latin: "Puella", arabic: "البنت", pattern: [1,2,1,1], planet: "Venus", element: "Water", quality: "favorable", keywords: ["harmony","attraction","conciliation"] },
  { latin: "Rubeus", arabic: "الأحمر", pattern: [2,1,2,2], planet: "Mars", element: "Water", quality: "unfavorable", keywords: ["passion","danger","instability"] },
  { latin: "Albus", arabic: "الأبيض", pattern: [2,2,1,2], planet: "Mercury", element: "Water", quality: "favorable", keywords: ["clarity","wisdom","communication"] },
  { latin: "Conjunctio", arabic: "الاجتماع", pattern: [2,1,1,2], planet: "Mercury", element: "Earth", quality: "neutral", keywords: ["meeting","union","exchange"] },
  { latin: "Carcer", arabic: "السجن", pattern: [1,2,2,1], planet: "Saturn", element: "Earth", quality: "unfavorable", keywords: ["constraint","blockage","containment"] },
  { latin: "Caput Draconis", arabic: "رأس التنين", pattern: [2,1,1,1], planet: "North Node", element: "Earth", quality: "favorable", keywords: ["beginning","entry","threshold"] },
  { latin: "Cauda Draconis", arabic: "ذنب التنين", pattern: [1,1,1,2], planet: "South Node", element: "Fire", quality: "unfavorable", keywords: ["ending","exit","closure"] }
];

export const FIGURES: readonly GeomanticFigure[] = raw.map((figure) => ({
  ...figure,
  id: figure.latin.toLowerCase().replace(/\s+/g, "-")
}));

const key = (pattern: FigurePattern | readonly number[]) => pattern.join("");
const byPattern = new Map(FIGURES.map((f) => [key(f.pattern), f]));
const byId = new Map(FIGURES.map((f) => [f.id, f]));

export function figureFromPattern(pattern: FigurePattern): GeomanticFigure {
  const figure = byPattern.get(key(pattern));
  if (!figure) throw new Error("Unknown geomantic pattern: " + key(pattern));
  return figure;
}

export function figureFromId(id: string): GeomanticFigure {
  const figure = byId.get(id);
  if (!figure) throw new Error("Unknown geomantic figure: " + id);
  return figure;
}
