export interface CouncilPerspective {
  id: string;
  label: string;
  school?: string;
  direction: -1 | 0 | 1;
  confidence: number;
  rationale: string;
  evidenceIds: readonly string[];
}

export interface CouncilResult {
  perspectives: readonly CouncilPerspective[];
  weightedScore: number;
  disagreement: number;
  majority: "support" | "oppose" | "split";
  dissent: readonly CouncilPerspective[];
}

export function deliberateCouncil(perspectives: readonly CouncilPerspective[]): CouncilResult {
  if (!perspectives.length) return { perspectives:[],weightedScore:0,disagreement:0,majority:"split",dissent:[] };

  const normalized = perspectives.map((item) => ({
    ...item,
    confidence:Math.max(0,Math.min(1,item.confidence))
  }));

  const totalWeight = normalized.reduce((sum,item) => sum + item.confidence,0);
  const weightedScore = totalWeight
    ? normalized.reduce((sum,item) => sum + item.direction * item.confidence,0) / totalWeight
    : 0;

  const majority = weightedScore > 0.1 ? "support" : weightedScore < -0.1 ? "oppose" : "split";
  const majorityDirection = majority === "support" ? 1 : majority === "oppose" ? -1 : 0;
  const dissent = majorityDirection === 0
    ? normalized.filter((item) => item.direction !== 0)
    : normalized.filter((item) => item.direction !== 0 && item.direction !== majorityDirection);

  const mean = normalized.reduce((sum,item) => sum + item.direction,0) / normalized.length;
  const disagreement = Math.sqrt(normalized.reduce((sum,item) => sum + (item.direction - mean) ** 2,0) / normalized.length);

  return { perspectives:normalized,weightedScore,disagreement,majority,dissent };
}
