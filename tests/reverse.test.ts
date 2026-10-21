import { describe, expect, it } from "vitest";
import { figureFromId, flattenAncestry, generateShield, traceJudgeLine } from "../src/core";

describe("reverse Judge ancestry", () => {
  it("traces every Judge line back to Mother origins", () => {
    const shield = generateShield(["puer","caput-draconis","tristitia","albus"].map(figureFromId));
    for (let line = 1; line <= 4; line++) {
      const root = traceJudgeLine(shield,line);
      expect(root.node).toBe("J");
      const leaves = flattenAncestry(root).filter((row) => row.node.startsWith("M"));
      expect(leaves.length).toBeGreaterThan(0);
      expect(leaves.every((row) => row.line >= 1 && row.line <= 4)).toBe(true);
    }
  });
});
