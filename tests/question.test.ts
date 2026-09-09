import { describe, expect, it } from "vitest";
import { classifyQuestion } from "../src/core";

describe("Question Intelligence", () => {
  it("routes debt questions to relevant houses", () => {
    const profile = classifyQuestion("Will this debtor repay my debt soon?");
    expect(profile.domain).toBe("Debt");
    expect(profile.houses).toEqual([1,2,7,8]);
    expect(profile.modules).toContain("timing");
  });

  it("flags high-stakes health symbolism", () => {
    const profile = classifyQuestion("Is this illness serious?");
    expect(profile.highStakes).toBe(true);
    expect(profile.notes.join(" ")).toMatch(/must not replace/i);
  });
});
