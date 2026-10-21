import { calculateAbjad, moduloAnalysis } from "./abjad";

export interface NameRelationAnalysis {
  left: ReturnType<typeof calculateAbjad>;
  right: ReturnType<typeof calculateAbjad>;
  sum: number;
  absoluteDifference: number;
  gcd: number;
  ratio: number | null;
  combinedModulo: Record<number,number>;
}

function greatestCommonDivisor(a: number,b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const next = x % y;
    x = y;
    y = next;
  }
  return x;
}

export function analyzeNameRelation(leftText: string,rightText: string): NameRelationAnalysis {
  const left = calculateAbjad(leftText);
  const right = calculateAbjad(rightText);
  const sum = left.total + right.total;
  return {
    left,
    right,
    sum,
    absoluteDifference:Math.abs(left.total - right.total),
    gcd:greatestCommonDivisor(left.total,right.total),
    ratio:right.total === 0 ? null : left.total / right.total,
    combinedModulo:moduloAnalysis(sum)
  };
}
