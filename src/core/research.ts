import { accuracySummary } from "./calibration";

export interface ResearchCase {
  id: string;
  actual: boolean;
  moduleVotes: Readonly<Record<string, number>>;
}

function prediction(record: ResearchCase, disabled: Set<string>): boolean {
  const score = Object.entries(record.moduleVotes)
    .filter(([module]) => !disabled.has(module))
    .reduce((sum,[,vote]) => sum + vote,0);
  return score >= 0;
}

export function ablationTest(records: readonly ResearchCase[], disabledModules: readonly string[]) {
  const disabled = new Set(disabledModules);
  return accuracySummary(records.map((record) => ({
    id:record.id,
    predicted:prediction(record,disabled),
    actual:record.actual
  })));
}

export function methodTournament(records: readonly ResearchCase[], methods: Readonly<Record<string,readonly string[]>>) {
  return Object.entries(methods)
    .map(([name,disabledModules]) => ({ name, summary:ablationTest(records,disabledModules) }))
    .sort((a,b) => b.summary.accuracy - a.summary.accuracy);
}
