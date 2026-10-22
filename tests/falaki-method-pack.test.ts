import { describe,expect,it } from "vitest";
import { executeFalakiCore } from "../src/core/falakiMethodPack";

describe("falaki method pack",()=>{
  it("computes and verifies unequal planetary hours from real solar boundaries",()=>{
    const result=executeFalakiCore({
      moment:new Date("2026-03-20T12:00:00Z"),
      latitude:0,
      longitude:0
    });

    expect(result.hours).toHaveLength(24);
    expect(result.verification.dayPass).toBe(true);
    expect(result.verification.nightPass).toBe(true);
    expect(result.solar.sunrise.getTime()).toBeLessThan(result.solar.sunset.getTime());
    expect(result.solar.sunset.getTime()).toBeLessThan(result.solar.nextSunrise.getTime());
    expect(result.currentHour.planet).toBeTruthy();
    expect(result.astronomy.classicalPositions).toHaveLength(7);
    expect(result.source.warning).toContain("does not label a planet/hour favorable or unfavorable");
  });
});
