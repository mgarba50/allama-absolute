import { describe, expect, it } from "vitest";
import { dayRuler, planetaryHoursForDate } from "../src/core";

describe("Celestial planetary hours", () => {
  it("maps weekdays to traditional day rulers", () => {
    expect(dayRuler(new Date("2026-09-06T12:00:00Z"))).toBe("Sun");
    expect(dayRuler(new Date("2026-09-07T12:00:00Z"))).toBe("Moon");
  });

  it("creates 12 unequal day hours and 12 unequal night hours", () => {
    const hours = planetaryHoursForDate(new Date("2026-03-20T12:00:00Z"), 0, 0);
    expect(hours).toHaveLength(24);
    expect(hours.filter((h) => h.daylight)).toHaveLength(12);
    expect(hours.filter((h) => !h.daylight)).toHaveLength(12);
    expect(hours[0].end.getTime()).toBeGreaterThan(hours[0].start.getTime());
  });
});
