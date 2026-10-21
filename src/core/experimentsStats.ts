export interface BinaryTrial {
  predicted: boolean;
  actual: boolean;
  probability?: number;
}

export interface BinaryExperimentStats {
  sampleSize: number;
  correct: number;
  accuracy: number;
  truePositive: number;
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
  sensitivity: number | null;
  specificity: number | null;
  brierScore: number | null;
}

export function binaryExperimentStats(trials: readonly BinaryTrial[]): BinaryExperimentStats {
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;
  const probabilityTrials = trials.filter((trial) => typeof trial.probability === "number");

  for (const trial of trials) {
    if (trial.predicted && trial.actual) tp++;
    else if (!trial.predicted && !trial.actual) tn++;
    else if (trial.predicted && !trial.actual) fp++;
    else fn++;
  }

  const sampleSize = trials.length;
  const correct = tp + tn;
  const sensitivityDenominator = tp + fn;
  const specificityDenominator = tn + fp;
  const brierScore = probabilityTrials.length
    ? probabilityTrials.reduce((sum,trial) => {
        const probability = Math.max(0,Math.min(1,trial.probability as number));
        const actual = trial.actual ? 1 : 0;
        return sum + (probability - actual) ** 2;
      },0) / probabilityTrials.length
    : null;

  return {
    sampleSize,
    correct,
    accuracy:sampleSize ? correct / sampleSize : 0,
    truePositive:tp,
    trueNegative:tn,
    falsePositive:fp,
    falseNegative:fn,
    sensitivity:sensitivityDenominator ? tp / sensitivityDenominator : null,
    specificity:specificityDenominator ? tn / specificityDenominator : null,
    brierScore
  };
}
