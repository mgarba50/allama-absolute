export interface BenchmarkResult {
  label: string;
  iterations: number;
  warmupIterations?: number;
  totalMs: number;
  meanMs: number;
  operationsPerSecond: number;
}

export interface BenchmarkOptions {
  iterations?: number;
  warmupIterations?: number;
  now?: () => number;
}

export interface PerformanceBudget {
  maxTotalMs?: number;
  maxMeanMs?: number;
  minOperationsPerSecond?: number;
}

export interface PerformanceBudgetReport {
  label: string;
  passed: boolean;
  violations: readonly string[];
}

export const MAX_BENCHMARK_ITERATIONS = 1_000_000;
export const MAX_BENCHMARK_WARMUP_ITERATIONS = 100_000;

interface ResolvedBenchmarkOptions {
  iterations: number;
  warmupIterations: number;
  now: () => number;
}

function validateIterations(value: number): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error("Benchmark iterations must be a positive integer.");
  }
  if (value > MAX_BENCHMARK_ITERATIONS) {
    throw new Error(`Benchmark iterations must not exceed ${MAX_BENCHMARK_ITERATIONS}.`);
  }
}

function validateWarmupIterations(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > MAX_BENCHMARK_WARMUP_ITERATIONS) {
    throw new Error(
      `Benchmark warm-up iterations must be an integer between 0 and ` +
      `${MAX_BENCHMARK_WARMUP_ITERATIONS}.`
    );
  }
}

function resolveOptions(
  options: number | BenchmarkOptions | undefined,
  defaultIterations: number
): ResolvedBenchmarkOptions {
  const normalized = typeof options === "number" ? { iterations:options } : options ?? {};
  const iterations = normalized.iterations ?? defaultIterations;
  const warmupIterations = normalized.warmupIterations ?? 0;
  validateIterations(iterations);
  validateWarmupIterations(warmupIterations);
  return {
    iterations,
    warmupIterations,
    now:normalized.now ?? (() => performance.now())
  };
}

function resultFromElapsed(
  label: string,
  iterations: number,
  warmupIterations: number,
  totalMs: number
): BenchmarkResult {
  if (!Number.isFinite(totalMs) || totalMs < 0) {
    throw new Error("Benchmark clock must return finite, monotonically increasing millisecond values.");
  }
  return {
    label,
    iterations,
    ...(warmupIterations > 0 ? { warmupIterations } : {}),
    totalMs,
    meanMs:totalMs / iterations,
    operationsPerSecond:totalMs > 0 ? iterations / (totalMs / 1000) : Number.POSITIVE_INFINITY
  };
}

export function benchmark(
  label: string,
  operation: () => void,
  options: number | BenchmarkOptions = 1000
): BenchmarkResult {
  const resolved = resolveOptions(options,1000);
  for (let index = 0; index < resolved.warmupIterations; index++) operation();
  const start = resolved.now();
  for (let index = 0; index < resolved.iterations; index++) operation();
  const totalMs = resolved.now() - start;
  return resultFromElapsed(label,resolved.iterations,resolved.warmupIterations,totalMs);
}

export async function benchmarkAsync(
  label: string,
  operation: () => Promise<void>,
  options: number | BenchmarkOptions = 100
): Promise<BenchmarkResult> {
  const resolved = resolveOptions(options,100);
  for (let index = 0; index < resolved.warmupIterations; index++) await operation();
  const start = resolved.now();
  for (let index = 0; index < resolved.iterations; index++) await operation();
  const totalMs = resolved.now() - start;
  return resultFromElapsed(label,resolved.iterations,resolved.warmupIterations,totalMs);
}

function validateBudgetLimit(value: number | undefined, label: string): void {
  if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
    throw new Error(`${label} must be a finite, non-negative number.`);
  }
}

export function checkPerformanceBudget(
  result: BenchmarkResult,
  budget: PerformanceBudget
): PerformanceBudgetReport {
  validateBudgetLimit(budget.maxTotalMs,"Maximum total time");
  validateBudgetLimit(budget.maxMeanMs,"Maximum mean time");
  validateBudgetLimit(budget.minOperationsPerSecond,"Minimum operations per second");
  if (
    budget.maxTotalMs === undefined &&
    budget.maxMeanMs === undefined &&
    budget.minOperationsPerSecond === undefined
  ) {
    throw new Error("A performance budget must define at least one limit.");
  }

  const violations: string[] = [];
  if (budget.maxTotalMs !== undefined && result.totalMs > budget.maxTotalMs) {
    violations.push(`total ${result.totalMs.toFixed(3)}ms exceeds ${budget.maxTotalMs.toFixed(3)}ms`);
  }
  if (budget.maxMeanMs !== undefined && result.meanMs > budget.maxMeanMs) {
    violations.push(`mean ${result.meanMs.toFixed(3)}ms exceeds ${budget.maxMeanMs.toFixed(3)}ms`);
  }
  if (
    budget.minOperationsPerSecond !== undefined &&
    result.operationsPerSecond < budget.minOperationsPerSecond
  ) {
    violations.push(
      `throughput ${result.operationsPerSecond.toFixed(3)} ops/s is below ` +
      `${budget.minOperationsPerSecond.toFixed(3)} ops/s`
    );
  }

  return { label:result.label, passed:violations.length === 0, violations };
}

export function assertPerformanceBudget(result: BenchmarkResult, budget: PerformanceBudget): void {
  const report = checkPerformanceBudget(result,budget);
  if (!report.passed) {
    throw new Error(`Performance budget failed for "${report.label}": ${report.violations.join("; ")}.`);
  }
}
