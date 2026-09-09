export interface ResolvedPrediction {
  id: string;
  predicted: boolean;
  actual: boolean;
  modules?: readonly string[];
  ruleIds?: readonly string[];
}

export interface AccuracySummary {
  sampleSize: number;
  correct: number;
  accuracy: number;
  wilsonLow: number;
  wilsonHigh: number;
}

export function accuracySummary(records: readonly ResolvedPrediction[]): AccuracySummary {
  const sampleSize = records.length;
  const correct = records.filter((record) => record.predicted === record.actual).length;
  if (!sampleSize) return { sampleSize:0, correct:0, accuracy:0, wilsonLow:0, wilsonHigh:0 };

  const accuracy = correct / sampleSize;
  const z = 1.96;
  const denominator = 1 + z*z/sampleSize;
  const center = (accuracy + z*z/(2*sampleSize)) / denominator;
  const margin = z * Math.sqrt((accuracy*(1-accuracy)/sampleSize) + (z*z/(4*sampleSize*sampleSize))) / denominator;

  return {
    sampleSize,
    correct,
    accuracy,
    wilsonLow:Math.max(0,center - margin),
    wilsonHigh:Math.min(1,center + margin)
  };
}

export function compareHumanAbsolute(
  records: readonly { musa: boolean; absolute: boolean; joint?: boolean; actual: boolean }[]
) {
  const map = (selector: (record: typeof records[number]) => boolean) =>
    accuracySummary(records.map((record,index) => ({ id:String(index), predicted:selector(record), actual:record.actual })));
  return {
    musa:map((record) => record.musa),
    absolute:map((record) => record.absolute),
    joint:map((record) => record.joint ?? record.absolute),
    musaOverruledCorrectly:records.filter((record) => record.musa !== record.absolute && record.musa === record.actual).length,
    absoluteOverruledCorrectly:records.filter((record) => record.musa !== record.absolute && record.absolute === record.actual).length
  };
}
