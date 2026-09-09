import { FIGURES, figureFromPattern } from "./figures";
import type { Dot, FigurePattern, GeomanticFigure, Shield } from "./types";

export function parityAdd(a: FigurePattern, b: FigurePattern): FigurePattern {
  return a.map((value, index) => (value === b[index] ? 2 : 1)) as unknown as FigurePattern;
}

export function daughtersFromMothers(mothers: readonly GeomanticFigure[]): GeomanticFigure[] {
  if (mothers.length !== 4) throw new Error("Exactly four Mothers are required.");
  return [0,1,2,3].map((row) => figureFromPattern([
    mothers[0].pattern[row],
    mothers[1].pattern[row],
    mothers[2].pattern[row],
    mothers[3].pattern[row]
  ] as FigurePattern));
}

export function generateShield(mothers: readonly GeomanticFigure[]): Shield {
  if (mothers.length !== 4) throw new Error("Exactly four Mothers are required.");

  const daughters = daughtersFromMothers(mothers);
  const n1 = figureFromPattern(parityAdd(mothers[0].pattern, mothers[1].pattern));
  const n2 = figureFromPattern(parityAdd(mothers[2].pattern, mothers[3].pattern));
  const n3 = figureFromPattern(parityAdd(daughters[0].pattern, daughters[1].pattern));
  const n4 = figureFromPattern(parityAdd(daughters[2].pattern, daughters[3].pattern));
  const nieces = [n1,n2,n3,n4];

  const rightWitness = figureFromPattern(parityAdd(n1.pattern, n2.pattern));
  const leftWitness = figureFromPattern(parityAdd(n3.pattern, n4.pattern));
  const judge = figureFromPattern(parityAdd(rightWitness.pattern, leftWitness.pattern));
  const reconciler = figureFromPattern(parityAdd(judge.pattern, mothers[0].pattern));

  const lineage = [
    ...daughters.map((d, i) => ({
      target: "D" + (i + 1),
      sources: ["M1","M2","M3","M4"] as const,
      operation: "transpose" as const,
      pattern: d.pattern
    })),
    { target: "N1", sources: ["M1","M2"] as const, operation: "parity-add" as const, pattern: n1.pattern },
    { target: "N2", sources: ["M3","M4"] as const, operation: "parity-add" as const, pattern: n2.pattern },
    { target: "N3", sources: ["D1","D2"] as const, operation: "parity-add" as const, pattern: n3.pattern },
    { target: "N4", sources: ["D3","D4"] as const, operation: "parity-add" as const, pattern: n4.pattern },
    { target: "RW", sources: ["N1","N2"] as const, operation: "parity-add" as const, pattern: rightWitness.pattern },
    { target: "LW", sources: ["N3","N4"] as const, operation: "parity-add" as const, pattern: leftWitness.pattern },
    { target: "J", sources: ["RW","LW"] as const, operation: "parity-add" as const, pattern: judge.pattern },
    { target: "R", sources: ["J","M1"] as const, operation: "parity-add" as const, pattern: reconciler.pattern }
  ];

  return { mothers, daughters, nieces, rightWitness, leftWitness, judge, reconciler, lineage };
}

export function validateShield(shield: Shield): string[] {
  const errors: string[] = [];
  const expected = generateShield(shield.mothers);
  const compare = (label: string, actual: GeomanticFigure, wanted: GeomanticFigure) => {
    if (actual.id !== wanted.id) errors.push(label + " expected " + wanted.latin + " but received " + actual.latin);
  };

  shield.daughters.forEach((f, i) => compare("Daughter " + (i + 1), f, expected.daughters[i]));
  shield.nieces.forEach((f, i) => compare("Niece " + (i + 1), f, expected.nieces[i]));
  compare("Right Witness", shield.rightWitness, expected.rightWitness);
  compare("Left Witness", shield.leftWitness, expected.leftWitness);
  compare("Judge", shield.judge, expected.judge);

  const totalJudgePoints = shield.judge.pattern.reduce((sum, n) => sum + n, 0);
  if (totalJudgePoints % 2 !== 0) errors.push("Judge parity check failed.");
  return errors;
}

export function entropyMothers(): GeomanticFigure[] {
  if (!globalThis.crypto?.getRandomValues) throw new Error("Cryptographic entropy is unavailable.");
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  const patterns: FigurePattern[] = [];
  for (let i = 0; i < 4; i++) {
    patterns.push([
      (bytes[i*4] & 1 ? 1 : 2) as Dot,
      (bytes[i*4+1] & 1 ? 1 : 2) as Dot,
      (bytes[i*4+2] & 1 ? 1 : 2) as Dot,
      (bytes[i*4+3] & 1 ? 1 : 2) as Dot
    ]);
  }
  return patterns.map(figureFromPattern);
}

export function allPossibleFigures(): readonly GeomanticFigure[] {
  return FIGURES;
}
