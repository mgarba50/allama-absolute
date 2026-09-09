import SunCalc from "suncalc";

export type Planet = "Saturn" | "Jupiter" | "Mars" | "Sun" | "Venus" | "Mercury" | "Moon";
const CHALDEAN: readonly Planet[] = ["Saturn","Jupiter","Mars","Sun","Venus","Mercury","Moon"];
const DAY_RULERS: readonly Planet[] = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];

export interface PlanetaryHour {
  ordinal: number;
  planet: Planet;
  start: Date;
  end: Date;
  daylight: boolean;
}

function addDays(date: Date, days: number): Date {
  const out = new Date(date);
  out.setDate(out.getDate() + days);
  return out;
}

function rulerIndex(dayRulerName: Planet): number {
  return CHALDEAN.indexOf(dayRulerName);
}

export function dayRuler(date: Date): Planet {
  return DAY_RULERS[date.getDay()];
}

export interface SolarBoundaryTimes {
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
}

export function solarBoundaryTimes(date: Date,latitude:number,longitude:number):SolarBoundaryTimes {
  const times=SunCalc.getTimes(date,latitude,longitude);
  const nextTimes=SunCalc.getTimes(addDays(date,1),latitude,longitude);
  const sunrise=times.sunrise, sunset=times.sunset, nextSunrise=nextTimes.sunrise;
  if (![sunrise,sunset,nextSunrise].every((d)=>d instanceof Date&&Number.isFinite(d.getTime()))) {
    throw new Error("Solar boundaries are unavailable for this date/location.");
  }
  return {sunrise,sunset,nextSunrise};
}

export function planetaryHoursForDate(date: Date, latitude: number, longitude: number): PlanetaryHour[] {
  const {sunrise,sunset,nextSunrise}=solarBoundaryTimes(date,latitude,longitude);

  const ruler = dayRuler(sunrise);
  const startIndex = rulerIndex(ruler);
  const dayMs = (sunset.getTime() - sunrise.getTime()) / 12;
  const nightMs = (nextSunrise.getTime() - sunset.getTime()) / 12;
  const hours: PlanetaryHour[] = [];

  for (let i = 0; i < 12; i++) {
    hours.push({
      ordinal: i + 1,
      planet: CHALDEAN[(startIndex + i) % 7],
      start: new Date(sunrise.getTime() + dayMs * i),
      end: new Date(sunrise.getTime() + dayMs * (i + 1)),
      daylight: true
    });
  }

  for (let i = 0; i < 12; i++) {
    hours.push({
      ordinal: i + 13,
      planet: CHALDEAN[(startIndex + 12 + i) % 7],
      start: new Date(sunset.getTime() + nightMs * i),
      end: new Date(sunset.getTime() + nightMs * (i + 1)),
      daylight: false
    });
  }
  return hours;
}

export function currentPlanetaryHour(moment: Date, latitude: number, longitude: number): PlanetaryHour {
  const todaySchedule = planetaryHoursForDate(moment, latitude, longitude);
  const foundToday = todaySchedule.find((h) => moment >= h.start && moment < h.end);
  if (foundToday) return foundToday;

  const previousSchedule = planetaryHoursForDate(addDays(moment, -1), latitude, longitude);
  const foundPrevious = previousSchedule.find((h) => moment >= h.start && moment < h.end);
  if (foundPrevious) return foundPrevious;
  throw new Error("Unable to resolve the current planetary hour.");
}

export function moonPhase(moment: Date) {
  const illumination = SunCalc.getMoonIllumination(moment);
  return { fraction: illumination.fraction, phase: illumination.phase, angle: illumination.angle };
}
