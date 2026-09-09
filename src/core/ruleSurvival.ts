import { accuracySummary } from "./calibration";

export interface RuleOutcomeRecord {
  ruleId: string;
  predicted: boolean;
  actual: boolean;
}

export interface RuleSurvivalScore {
  ruleId: string;
  sampleSize: number;
  accuracy: number;
  wilsonLow: number;
  status: "insufficient-data" | "weak" | "watch" | "surviving";
}

export function ruleSurvival(records: readonly RuleOutcomeRecord[],minimumSample = 20): RuleSurvivalScore[] {
  const grouped = new Map<string,RuleOutcomeRecord[]>();
  for (const record of records) {
    const rows = grouped.get(record.ruleId) ?? [];
    rows.push(record);
    grouped.set(record.ruleId,rows);
  }

  return [...grouped.entries()].map(([ruleId,rows]) => {
    const summary = accuracySummary(rows.map((row,index) => ({
      id:ruleId + "-" + index,
      predicted:row.predicted,
      actual:row.actual
    })));

    const status: RuleSurvivalScore["status"] =
      summary.sampleSize < minimumSample ? "insufficient-data" :
      summary.wilsonLow >= 0.55 ? "surviving" :
      summary.accuracy >= 0.5 ? "watch" :
      "weak";

    return {
      ruleId,
      sampleSize:summary.sampleSize,
      accuracy:summary.accuracy,
      wilsonLow:summary.wilsonLow,
      status
    };
  }).sort((a,b) => b.wilsonLow - a.wilsonLow);
}
