import {
  Body,
  Ecliptic,
  EclipticGeoMoon,
  GeoVector,
  MoonPhase
} from "astronomy-engine";

export interface CelestialPosition {
  body: string;
  longitude: number;
  latitude: number;
  distanceAu: number;
  zodiacIndex: number;
  zodiacName: string;
}

export interface LunarMansionIndex {
  system: "equal-arc-28";
  index: number;
  arabicName: string;
  startLongitude: number;
  endLongitude: number;
  moonLongitude: number;
}

export const ZODIAC_NAMES = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
] as const;

export const ARABIC_LUNAR_MANSIONS = [
  "الشرطان","البطين","الثريا","الدبران","الهقعة","الهنعة","الذراع",
  "النثرة","الطرف","الجبهة","الزبرة","الصرفة","العواء","السماك",
  "الغفر","الزبانان","الإكليل","القلب","الشولة","النعائم","البلدة",
  "سعد الذابح","سعد بلع","سعد السعود","سعد الأخبية","الفرغ المقدم",
  "الفرغ المؤخر","بطن الحوت"
] as const;

const CLASSICAL_BODIES = [
  Body.Sun,Body.Moon,Body.Mercury,Body.Venus,Body.Mars,Body.Jupiter,Body.Saturn
] as const;

type ClassicalBody = (typeof CLASSICAL_BODIES)[number];

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

export function geocentricPosition(body: ClassicalBody,date: Date): CelestialPosition {
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid ephemeris date.");

  let longitude: number;
  let latitude: number;
  let distanceAu: number;

  if (body === Body.Moon) {
    const moon = EclipticGeoMoon(date);
    longitude = normalizeDegrees(moon.lon);
    latitude = moon.lat;
    distanceAu = moon.dist;
  } else {
    const vector = GeoVector(body,date,true);
    const ecliptic = Ecliptic(vector);
    longitude = normalizeDegrees(ecliptic.elon);
    latitude = ecliptic.elat;
    distanceAu = Math.sqrt(vector.x*vector.x + vector.y*vector.y + vector.z*vector.z);
  }

  const zodiacIndex = Math.floor(longitude / 30);
  return {
    body,
    longitude,
    latitude,
    distanceAu,
    zodiacIndex,
    zodiacName:ZODIAC_NAMES[zodiacIndex]
  };
}

export function classicalPlanetPositions(date: Date): CelestialPosition[] {
  return CLASSICAL_BODIES.map((body) => geocentricPosition(body,date));
}

export function lunarMansionIndex(date: Date): LunarMansionIndex {
  const moon = geocentricPosition(Body.Moon,date);
  const width = 360 / 28;
  const zeroBased = Math.floor(moon.longitude / width);
  return {
    system:"equal-arc-28",
    index:zeroBased + 1,
    arabicName:ARABIC_LUNAR_MANSIONS[zeroBased],
    startLongitude:zeroBased * width,
    endLongitude:(zeroBased + 1) * width,
    moonLongitude:moon.longitude
  };
}

export function moonPhaseAngle(date: Date): number {
  return MoonPhase(date);
}
