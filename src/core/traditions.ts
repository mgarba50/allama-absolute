import { evaluateRules, type RuleEvaluation, type VersionedRule } from "./rules";

export interface TraditionSchool {
  id: string;
  name: string;
  description?: string;
}

export interface SchoolAnalysis {
  school: TraditionSchool;
  evaluations: readonly RuleEvaluation[];
  score: number;
  direction: -1 | 0 | 1;
}

export function analyzeSchools(
  schools: readonly TraditionSchool[],
  rules: readonly VersionedRule[],
  context: unknown
): SchoolAnalysis[] {
  return schools.map((school) => {
    const evaluations = evaluateRules(rules.filter((rule) => rule.school === school.id),context);
    const score = evaluations.reduce((sum,item) => sum + item.contribution,0);
    return {
      school,
      evaluations,
      score,
      direction:score > 0 ? 1 : score < 0 ? -1 : 0
    };
  });
}

export function schoolDisagreements(analyses: readonly SchoolAnalysis[]) {
  const directional = analyses.filter((analysis) => analysis.direction !== 0);
  const directions = new Set(directional.map((analysis) => analysis.direction));
  return {
    hasDisagreement:directions.size > 1,
    favorable:directional.filter((analysis) => analysis.direction > 0).map((analysis) => analysis.school.name),
    unfavorable:directional.filter((analysis) => analysis.direction < 0).map((analysis) => analysis.school.name),
    neutral:analyses.filter((analysis) => analysis.direction === 0).map((analysis) => analysis.school.name)
  };
}
