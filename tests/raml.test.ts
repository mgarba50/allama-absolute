import { describe, expect, it } from "vitest";
import { figureFromId, parityAdd, generateShield, validateShield } from "../src/core";

describe("Raml deterministic engine", () => {
  it("uses parity addition line by line", () => {
    expect(parityAdd([1,1,2,2],[1,2,1,2])).toEqual([2,1,1,2]);
  });

  it("derives a complete valid shield from four Mothers", () => {
    const mothers = ["puer","caput-draconis","tristitia","albus"].map(figureFromId);
    const shield = generateShield(mothers);
    expect(shield.mothers).toHaveLength(4);
    expect(shield.daughters).toHaveLength(4);
    expect(shield.nieces).toHaveLength(4);
    expect(validateShield(shield)).toEqual([]);
    expect(shield.judge.pattern.reduce((a,b)=>a+b,0) % 2).toBe(0);
  });

  it("produces expected daughters by transposition", () => {
    const mothers = ["puer","caput-draconis","tristitia","albus"].map(figureFromId);
    const shield = generateShield(mothers);
    expect(shield.daughters.map((f) => f.pattern.join(""))).toEqual(["1222","1212","2121","1112"]);
  });
});
