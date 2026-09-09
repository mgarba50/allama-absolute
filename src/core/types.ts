export type Dot = 1 | 2;
export type FigurePattern = readonly [Dot, Dot, Dot, Dot];
export type FigureQuality = "favorable" | "unfavorable" | "neutral";
export type ElementName = "Fire" | "Air" | "Water" | "Earth";

export interface GeomanticFigure {
  id: string;
  latin: string;
  arabic: string;
  pattern: FigurePattern;
  planet: string;
  element: ElementName;
  quality: FigureQuality;
  keywords: readonly string[];
}

export interface DerivationStep {
  target: string;
  sources: readonly string[];
  operation: "transpose" | "parity-add";
  pattern: FigurePattern;
}

export interface Shield {
  mothers: readonly GeomanticFigure[];
  daughters: readonly GeomanticFigure[];
  nieces: readonly GeomanticFigure[];
  rightWitness: GeomanticFigure;
  leftWitness: GeomanticFigure;
  judge: GeomanticFigure;
  reconciler: GeomanticFigure;
  lineage: readonly DerivationStep[];
}

export interface QuestionProfile {
  raw: string;
  normalized: string;
  domain: string;
  houses: readonly number[];
  modules: readonly string[];
  decisionType: "YES_NO" | "COMPARISON" | "TIMING" | "LOCATION" | "OPEN";
  highStakes: boolean;
  notes: readonly string[];
}

export interface Evidence {
  id: string;
  source: "deterministic" | "traditional" | "ai" | "empirical";
  direction: -1 | 0 | 1;
  weight: number;
  reliability: number;
  label: string;
}

export interface Verdict {
  decision: "YES" | "NO" | "MIXED" | "UNKNOWN";
  confidence: number;
  confidenceClass: string;
  supporting: readonly Evidence[];
  contrary: readonly Evidence[];
  score: number;
}
