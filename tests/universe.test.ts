import { describe, expect, it } from "vitest";
import {
  EXECUTABLE_MODULES,
  PROTOCOL_FAMILIES,
  VALID_DIFFICULTIES,
  matchUniverseQuestion,
  protocolCoverageForQuestion,
  universeQuestions,
  validateProtocolCoverage,
  validateUniverse
} from "../src/core";

describe("777 question universe", () => {
  it("contains exactly 777 unique questions", () => {
    expect(universeQuestions()).toHaveLength(777);
    expect(new Set(universeQuestions().map((entry) => entry.id)).size).toBe(777);
    expect(validateUniverse()).toEqual([]);
  });

  it("retrieves a debt question by lexical overlap", () => {
    const match = matchUniverseQuestion("Will my debtor repay the money he owes me?",1)[0];
    expect(match).toBeTruthy();
    expect(match.entry.category.toLowerCase()).toContain("debt");
  });

  it("maps all 777 questions to executable protocol families", () => {
    const entries = universeQuestions();
    expect(validateProtocolCoverage(entries)).toEqual([]);
    const moduleIds = new Set<string>(EXECUTABLE_MODULES);
    const familyIds = new Set(Object.keys(PROTOCOL_FAMILIES));
    const difficulties = new Set<string>(VALID_DIFFICULTIES);

    for (const entry of entries) {
      const coverage = protocolCoverageForQuestion(entry);
      expect(familyIds.has(coverage.id)).toBe(true);
      expect(difficulties.has(entry.difficulty)).toBe(true);
      expect(entry.category.trim().length).toBeGreaterThan(0);
      for (const module of [...coverage.requiredModules,...coverage.optionalModules,...coverage.excludedModules]) {
        expect(moduleIds.has(module)).toBe(true);
      }
      for (const house of coverage.houses) {
        expect(house).toBeGreaterThanOrEqual(1);
        expect(house).toBeLessThanOrEqual(12);
      }
    }
  });

  it("routes explicit blind and false-premise stress cases without inventing outcomes", () => {
    const blind = universeQuestions().find((entry) => entry.id === "ABS-Q002");
    const truth = universeQuestions().find((entry) => entry.id === "ABS-Q003");
    expect(blind).toBeTruthy();
    expect(truth).toBeTruthy();
    expect(protocolCoverageForQuestion(blind!).blindModeEligible).toBe(true);
    expect(protocolCoverageForQuestion(truth!).falsePremiseCheck).toBe(true);
  });
});
