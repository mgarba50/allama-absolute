import { describe, expect, it } from "vitest";
import {
  assessQuestionQuality,
  binaryExperimentStats,
  createPractitionerOverride,
  ruleSurvival,
  synthesizeVerdict
} from "../src/core";

describe("research discipline", () => {
  it("flags compound and allegation questions without inventing a factual answer", () => {
    const result = assessQuestionQuality("Did he steal the money and also will he return it?");
    expect(result.issues.some((issue) => issue.code === "compound-question")).toBe(true);
    expect(result.issues.some((issue) => issue.code === "allegation")).toBe(true);
  });

  it("calculates transparent experiment statistics", () => {
    const stats = binaryExperimentStats([
      {predicted:true,actual:true,probability:.8},
      {predicted:true,actual:false,probability:.7},
      {predicted:false,actual:false,probability:.2}
    ]);
    expect(stats.sampleSize).toBe(3);
    expect(stats.correct).toBe(2);
    expect(stats.brierScore).not.toBeNull();
  });

  it("does not promote rules with tiny samples", () => {
    const scores = ruleSurvival([
      {ruleId:"r1",predicted:true,actual:true},
      {ruleId:"r1",predicted:true,actual:true}
    ]);
    expect(scores[0].status).toBe("insufficient-data");
  });

  it("preserves the machine verdict when a practitioner overrides it", () => {
    const machine = synthesizeVerdict([{id:"x",source:"traditional",direction:1,weight:1,reliability:1,label:"test"}]);
    const override = createPractitionerOverride(machine,"NO","Musa Allama","Context outside the configured rule set.");
    expect(override.machineVerdict.decision).toBe("YES");
    expect(override.overrideDecision).toBe("NO");
  });
});
