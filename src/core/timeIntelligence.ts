import { planetaryHoursForDate, type Planet, type PlanetaryHour } from "./celestial";

export interface TimingPreference {
  preferredPlanets: readonly Planet[];
  avoidedPlanets?: readonly Planet[];
}

export interface TimingWindow {
  hour: PlanetaryHour;
  score: number;
  reasons: readonly string[];
}

export function rankPlanetaryWindows(
  date: Date,
  latitude: number,
  longitude: number,
  preference: TimingPreference
): TimingWindow[] {
  const preferred = new Set(preference.preferredPlanets);
  const avoided = new Set(preference.avoidedPlanets ?? []);

  return planetaryHoursForDate(date,latitude,longitude)
    .map((hour) => {
      const reasons: string[] = [];
      let score = 0;
      if (preferred.has(hour.planet)) {
        score += 1;
        reasons.push("Planet is in the configured preferred set.");
      }
      if (avoided.has(hour.planet)) {
        score -= 1;
        reasons.push("Planet is in the configured avoided set.");
      }
      return { hour,score,reasons };
    })
    .sort((a,b) => b.score - a.score || a.hour.start.getTime() - b.hour.start.getTime());
}
