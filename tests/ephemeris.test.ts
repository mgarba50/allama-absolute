import { describe, expect, it } from "vitest";
import { classicalPlanetPositions, lunarMansionIndex, moonPhaseAngle } from "../src/core";

describe("deterministic ephemeris", () => {
  const date = new Date("2026-09-09T12:00:00Z");

  it("returns seven classical celestial positions in valid angular ranges", () => {
    const positions = classicalPlanetPositions(date);
    expect(positions).toHaveLength(7);
    for (const position of positions) {
      expect(position.longitude).toBeGreaterThanOrEqual(0);
      expect(position.longitude).toBeLessThan(360);
      expect(position.latitude).toBeGreaterThanOrEqual(-90);
      expect(position.latitude).toBeLessThanOrEqual(90);
    }
  });

  it("maps lunar longitude to one of 28 equal-arc indexes", () => {
    const mansion = lunarMansionIndex(date);
    expect(mansion.index).toBeGreaterThanOrEqual(1);
    expect(mansion.index).toBeLessThanOrEqual(28);
    expect(mansion.system).toBe("equal-arc-28");
  });

  it("returns Moon phase angle in degrees", () => {
    const phase = moonPhaseAngle(date);
    expect(phase).toBeGreaterThanOrEqual(0);
    expect(phase).toBeLessThan(360);
  });
});
