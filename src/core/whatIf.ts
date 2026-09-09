import { runAbsoluteAnalysis, type AbsoluteAnalysis, type AbsoluteAnalysisInput } from "./analysis";

export interface WhatIfScenario {
  label: string;
  changes: Partial<AbsoluteAnalysisInput>;
}

export interface WhatIfResult {
  label: string;
  analysis: AbsoluteAnalysis;
  changedFields: readonly string[];
}

export function runWhatIf(base: AbsoluteAnalysisInput,scenarios: readonly WhatIfScenario[]): WhatIfResult[] {
  return scenarios.map((scenario) => {
    const input = { ...base,...scenario.changes };
    return {
      label:scenario.label,
      analysis:runAbsoluteAnalysis(input),
      changedFields:Object.keys(scenario.changes)
    };
  });
}
