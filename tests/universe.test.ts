import { describe, expect, it } from "vitest";
import { matchUniverseQuestion, universeQuestions, validateUniverse } from "../src/core";

describe("777 question universe", () => {
  it("contains exactly 777 unique questions", () => {
    expect(universeQuestions()).toHaveLength(777);
    expect(validateUniverse()).toEqual([]);
  });

  it("retrieves a debt question by lexical overlap", () => {
    const match = matchUniverseQuestion("Will my debtor repay the money he owes me?",1)[0];
    expect(match).toBeTruthy();
    expect(match.entry.category.toLowerCase()).toContain("debt");
  });
});
