import { describe, expect, it } from "vitest";
import { runAbsoluteAnalysis } from "../src/core";

describe("Ω Allama Absolute orchestration", () => {
  it("returns traceable separated analysis layers", () => {
    const result = runAbsoluteAnalysis({
      question:"Will this debtor repay me?",
      motherIds:["puer","caput-draconis","tristitia","albus"],
      timestamp:"2026-09-09T12:00:00Z",
      latitude:11.8333,
      longitude:13.15,
      abjadTexts:["موسى"]
    });
    expect(result.validationErrors).toEqual([]);
    expect(result.question.domain).toBe("Debt");
    expect(result.evidence.every((item) => item.source === "traditional")).toBe(true);
    expect(result.dataQuality).toBeGreaterThan(0);
    expect(result.abjad[0].total).toBe(116);
  });
});
