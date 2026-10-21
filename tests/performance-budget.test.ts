import { describe, expect, it } from "vitest";
import {
  assertPerformanceBudget,
  benchmark,
  benchmarkAsync,
  checkPerformanceBudget,
  MAX_BENCHMARK_ITERATIONS,
  runAbsoluteAnalysis
} from "../src/core";

describe("performance budgets", () => {
  it("measures warm-up and timed iterations independently", () => {
    let now = 0;
    let calls = 0;
    const result = benchmark("deterministic",() => {
      calls += 1;
      now += 2;
    },{
      iterations:3,
      warmupIterations:2,
      now:() => now
    });

    expect(calls).toBe(5);
    expect(result).toEqual({
      label:"deterministic",
      iterations:3,
      warmupIterations:2,
      totalMs:6,
      meanMs:2,
      operationsPerSecond:500
    });
  });

  it("supports deterministic asynchronous measurements", async () => {
    let now = 10;
    const result = await benchmarkAsync("async",async () => {
      now += 4;
    },{
      iterations:2,
      warmupIterations:1,
      now:() => now
    });

    expect(result.totalMs).toBe(8);
    expect(result.operationsPerSecond).toBe(250);
  });

  it("reports every violated limit and throws on assertion", () => {
    const result = {
      label:"slow path",
      iterations:10,
      totalMs:100,
      meanMs:10,
      operationsPerSecond:100
    };
    const budget = { maxTotalMs:90, maxMeanMs:9, minOperationsPerSecond:110 };
    const report = checkPerformanceBudget(result,budget);

    expect(report.passed).toBe(false);
    expect(report.violations).toHaveLength(3);
    expect(() => assertPerformanceBudget(result,budget)).toThrow(/slow path/);
  });

  it("rejects unbounded iteration counts before executing the operation", () => {
    let calls = 0;
    expect(() => benchmark("invalid",() => { calls += 1; },MAX_BENCHMARK_ITERATIONS + 1)).toThrow(
      /must not exceed/
    );
    expect(calls).toBe(0);
  });

  it("keeps a representative full Sovereign analysis within the CI latency budget", () => {
    const input = {
      question:"Will this debtor repay me?",
      motherIds:["puer","caput-draconis","tristitia","albus"] as const,
      timestamp:"2026-09-09T12:00:00Z",
      latitude:11.8333,
      longitude:13.15,
      abjadTexts:["موسى"]
    };
    const result = benchmark("standard full Sovereign analysis",() => {
      runAbsoluteAnalysis(input);
    },{
      iterations:20,
      warmupIterations:5
    });

    expect(result.iterations).toBe(20);
    expect(() => assertPerformanceBudget(result,{
      maxTotalMs:2_000,
      maxMeanMs:100,
      minOperationsPerSecond:10
    })).not.toThrow();
  });
});
