import { describe, expect, it } from "vitest";
import {
  LUNAR_POSITION_VALIDATION_BLOCKER,
  SOLAR_KNOWN_ANSWER_TOLERANCE_MINUTES,
  USNO_SOLAR_FIXTURES,
  minuteDifference,
  planetaryHoursForDate,
  solarBoundaryTimes
} from "../src/core";

describe("independent astronomy known-answer validation",()=>{
  for(const fixture of USNO_SOLAR_FIXTURES){
    it(`${fixture.id}: matches USNO solar rise/set within documented tolerance`,()=>{
      const date=new Date(fixture.dateUtcNoon);
      const boundaries=solarBoundaryTimes(date,fixture.latitude,fixture.longitude);
      expect(minuteDifference(boundaries.sunrise,fixture.expectedSunriseUtc)).toBeLessThanOrEqual(SOLAR_KNOWN_ANSWER_TOLERANCE_MINUTES);
      expect(minuteDifference(boundaries.sunset,fixture.expectedSunsetUtc)).toBeLessThanOrEqual(SOLAR_KNOWN_ANSWER_TOLERANCE_MINUTES);
    });

    it(`${fixture.id}: planetary-hour day boundaries are anchored to validated rise/set`,()=>{
      const date=new Date(fixture.dateUtcNoon);
      const hours=planetaryHoursForDate(date,fixture.latitude,fixture.longitude);
      expect(minuteDifference(hours[0].start,fixture.expectedSunriseUtc)).toBeLessThanOrEqual(SOLAR_KNOWN_ANSWER_TOLERANCE_MINUTES);
      expect(minuteDifference(hours[11].end,fixture.expectedSunsetUtc)).toBeLessThanOrEqual(SOLAR_KNOWN_ANSWER_TOLERANCE_MINUTES);
      expect(hours[12].start.getTime()).toBe(hours[11].end.getTime());
    });
  }

  it("records the lunar-position known-answer gap as DATA-BLOCKED rather than fabricating values",()=>{
    expect(LUNAR_POSITION_VALIDATION_BLOCKER.status).toBe("DATA-BLOCKED");
    expect(LUNAR_POSITION_VALIDATION_BLOCKER.authoritativeReference).toContain("JPL Horizons");
    expect(LUNAR_POSITION_VALIDATION_BLOCKER.missingData).toContain("Numeric");
  });
});
