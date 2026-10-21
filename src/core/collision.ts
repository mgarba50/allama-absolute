import type { Evidence } from "./types";

export interface TestimonyPriorityContext {
  hierarchy?: Readonly<Record<string,number>>;
  historicalCalibration?: Readonly<Record<string,number>>;
  methodologicalPriority?: Readonly<Record<string,number>>;
  sourceQuality?: Readonly<Record<string,number>>;
  independenceGroup?: Readonly<Record<string,string>>;
  questionType?: string;
  preferredSourcesByQuestionType?: Readonly<Record<string,readonly Evidence["source"][]>>;
}

export interface RankedTestimony {
  evidence: Evidence;
  effectiveStrength: number;
  rawStrength: number;
  correlationPenalty: number;
  factors: Readonly<Record<string,number>>;
  explanation: string;
}

export interface TestimonyCollisionResolution {
  ranked: readonly RankedTestimony[];
  winner: RankedTestimony | null;
  strongestOpposition: RankedTestimony | null;
  direction: -1 | 0 | 1;
  contradictionStrength: number;
  explanation: string;
}

function clamp(value: number,min = 0,max = 1): number {
  return Math.max(min,Math.min(max,value));
}

export function resolveTestimonyCollisions(
  evidence: readonly Evidence[],
  context: TestimonyPriorityContext = {}
): TestimonyCollisionResolution {
  if (!evidence.length) {
    return {ranked:[],winner:null,strongestOpposition:null,direction:0,contradictionStrength:0,explanation:"No testimony supplied."};
  }

  const seenGroups = new Map<string,number>();
  const ranked = evidence.map((item) => {
    const rawStrength = Math.abs(item.weight * item.reliability);
    const hierarchy = context.hierarchy?.[item.id] ?? 1;
    const calibration = clamp(context.historicalCalibration?.[item.id] ?? 1,0,1.5);
    const methodology = context.methodologicalPriority?.[item.id] ?? 1;
    const quality = clamp(context.sourceQuality?.[item.id] ?? 1,0,1.5);
    const preferred = context.questionType && context.preferredSourcesByQuestionType?.[context.questionType]
      ? context.preferredSourcesByQuestionType[context.questionType].includes(item.source) ? 1.1 : 0.9
      : 1;
    const group = context.independenceGroup?.[item.id] ?? item.id;
    const previous = seenGroups.get(group) ?? 0;
    const correlationPenalty = previous === 0 ? 1 : Math.max(0.35,1 / (previous + 1));
    seenGroups.set(group,previous + 1);
    const effectiveStrength = rawStrength * hierarchy * calibration * methodology * quality * preferred * correlationPenalty;
    const explanation = [
      `raw=${rawStrength.toFixed(3)}`,
      `hierarchy×${hierarchy.toFixed(2)}`,
      `calibration×${calibration.toFixed(2)}`,
      `method×${methodology.toFixed(2)}`,
      `source-quality×${quality.toFixed(2)}`,
      `question-fit×${preferred.toFixed(2)}`,
      correlationPenalty < 1 ? `correlation penalty×${correlationPenalty.toFixed(2)}` : "independent testimony"
    ].join("; ");
    return {
      evidence:item,effectiveStrength,rawStrength,correlationPenalty,
      factors:{hierarchy,calibration,methodology,quality,preferred},
      explanation
    };
  }).sort((a,b) => b.effectiveStrength - a.effectiveStrength);

  const directional = ranked.filter((item) => item.evidence.direction !== 0);
  const positive = directional.filter((item) => item.evidence.direction > 0).reduce((sum,item) => sum + item.effectiveStrength,0);
  const negative = directional.filter((item) => item.evidence.direction < 0).reduce((sum,item) => sum + item.effectiveStrength,0);
  const total = positive + negative;
  const signed = total ? (positive - negative) / total : 0;
  const direction: -1 | 0 | 1 = signed > 0.1 ? 1 : signed < -0.1 ? -1 : 0;
  const contradictionStrength = total ? (2 * Math.min(positive,negative)) / total : 0;
  const winner = directional.find((item) => direction === 0 || item.evidence.direction === direction) ?? null;
  const strongestOpposition = direction === 0
    ? directional[1] ?? null
    : directional.find((item) => item.evidence.direction === -direction) ?? null;

  const explanation = winner
    ? `${winner.evidence.label} outranked competing testimony because ${winner.explanation}. Contradiction strength ${(contradictionStrength*100).toFixed(1)}%.`
    : "Directional testimony remained unresolved after hierarchy, reliability, calibration, source quality and independence weighting.";

  return {ranked,winner,strongestOpposition,direction,contradictionStrength,explanation};
}
