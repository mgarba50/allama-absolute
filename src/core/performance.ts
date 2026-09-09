export interface BenchmarkResult {
  label: string;
  iterations: number;
  totalMs: number;
  meanMs: number;
  operationsPerSecond: number;
}

export function benchmark(label: string,operation: () => void,iterations = 1000): BenchmarkResult {
  if (!Number.isInteger(iterations) || iterations < 1) throw new Error("Benchmark iterations must be a positive integer.");
  const start = performance.now();
  for (let index = 0; index < iterations; index++) operation();
  const totalMs = performance.now() - start;
  return {
    label,
    iterations,
    totalMs,
    meanMs:totalMs / iterations,
    operationsPerSecond:totalMs > 0 ? iterations / (totalMs / 1000) : Number.POSITIVE_INFINITY
  };
}

export async function benchmarkAsync(label: string,operation: () => Promise<void>,iterations = 100): Promise<BenchmarkResult> {
  if (!Number.isInteger(iterations) || iterations < 1) throw new Error("Benchmark iterations must be a positive integer.");
  const start = performance.now();
  for (let index = 0; index < iterations; index++) await operation();
  const totalMs = performance.now() - start;
  return {
    label,
    iterations,
    totalMs,
    meanMs:totalMs / iterations,
    operationsPerSecond:totalMs > 0 ? iterations / (totalMs / 1000) : Number.POSITIVE_INFINITY
  };
}
