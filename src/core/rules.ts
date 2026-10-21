export type RuleOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "includes";

export interface RuleCondition {
  path: string;
  operator: RuleOperator;
  value: unknown;
}

export interface VersionedRule {
  id: string;
  name: string;
  version: number;
  enabled: boolean;
  weight: number;
  school: string;
  provenance?: string;
  conditions: readonly RuleCondition[];
  result: { direction: -1 | 0 | 1; label: string };
}

export interface RuleEvaluation {
  ruleId: string;
  matched: boolean;
  failedConditions: readonly RuleCondition[];
  contribution: number;
  label: string;
}

function readPath(target: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current,key) => {
    if (current && typeof current === "object" && key in current) return (current as Record<string,unknown>)[key];
    return undefined;
  }, target);
}

function compare(actual: unknown, operator: RuleOperator, expected: unknown): boolean {
  if (operator === "eq") return actual === expected;
  if (operator === "neq") return actual !== expected;
  if (operator === "gt") return Number(actual) > Number(expected);
  if (operator === "gte") return Number(actual) >= Number(expected);
  if (operator === "lt") return Number(actual) < Number(expected);
  if (operator === "lte") return Number(actual) <= Number(expected);
  if (operator === "includes") {
    if (Array.isArray(actual)) return actual.includes(expected);
    if (typeof actual === "string") return actual.includes(String(expected));
    return false;
  }
  return false;
}

export function evaluateRule(rule: VersionedRule, context: unknown): RuleEvaluation {
  if (!rule.enabled) return { ruleId:rule.id, matched:false, failedConditions:[], contribution:0, label:rule.result.label };
  const failedConditions = rule.conditions.filter((condition) => !compare(readPath(context,condition.path), condition.operator, condition.value));
  const matched = failedConditions.length === 0;
  return {
    ruleId:rule.id,
    matched,
    failedConditions,
    contribution:matched ? rule.weight * rule.result.direction : 0,
    label:rule.result.label
  };
}

export function evaluateRules(rules: readonly VersionedRule[], context: unknown): RuleEvaluation[] {
  return rules.map((rule) => evaluateRule(rule,context));
}
