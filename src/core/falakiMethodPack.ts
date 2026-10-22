import {
  currentPlanetaryHour,
  dayRuler,
  planetaryHoursForDate,
  solarBoundaryTimes,
  type Planet,
  type PlanetaryHour
} from "./celestial";
import { classicalPlanetPositions, lunarMansionIndex, moonPhaseAngle } from "./ephemeris";

export interface FalakiCoreInput {
  moment:Date;
  latitude:number;
  longitude:number;
}

export interface FalakiVerification {
  dayHourMilliseconds:number;
  nightHourMilliseconds:number;
  dayEndErrorMilliseconds:number;
  nightEndErrorMilliseconds:number;
  dayPass:boolean;
  nightPass:boolean;
}

export interface FalakiCoreExecution {
  input:{
    momentIso:string;
    latitude:number;
    longitude:number;
  };
  solar:{
    sunrise:Date;
    sunset:Date;
    nextSunrise:Date;
  };
  weekdayRuler:Planet;
  currentHour:PlanetaryHour;
  hours:readonly PlanetaryHour[];
  verification:FalakiVerification;
  astronomy:{
    classicalPositions:ReturnType<typeof classicalPlanetPositions>;
    lunarMansion:ReturnType<typeof lunarMansionIndex>;
    moonPhaseAngle:number;
  };
  source:{
    method:string;
    warning:string;
  };
  trace:readonly string[];
}

export function executeFalakiCore(input:FalakiCoreInput):FalakiCoreExecution {
  if (!Number.isFinite(input.moment.getTime())) throw new Error("Invalid Falaki moment.");
  if (!Number.isFinite(input.latitude) || input.latitude < -90 || input.latitude > 90) throw new Error("Latitude must be between -90 and 90.");
  if (!Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180) throw new Error("Longitude must be between -180 and 180.");

  const solar=solarBoundaryTimes(input.moment,input.latitude,input.longitude);
  const hours=planetaryHoursForDate(input.moment,input.latitude,input.longitude);
  const currentHour=currentPlanetaryHour(input.moment,input.latitude,input.longitude);
  const weekdayRuler=dayRuler(solar.sunrise);

  const daylight=solar.sunset.getTime()-solar.sunrise.getTime();
  const nighttime=solar.nextSunrise.getTime()-solar.sunset.getTime();
  const dayHourMilliseconds=daylight/12;
  const nightHourMilliseconds=nighttime/12;

  const dayHours=hours.filter((hour)=>hour.daylight);
  const nightHours=hours.filter((hour)=>!hour.daylight);
  const dayEnd=dayHours[11]?.end.getTime() ?? NaN;
  const nightEnd=nightHours[11]?.end.getTime() ?? NaN;
  const dayEndErrorMilliseconds=Math.abs(dayEnd-solar.sunset.getTime());
  const nightEndErrorMilliseconds=Math.abs(nightEnd-solar.nextSunrise.getTime());

  const verification={
    dayHourMilliseconds,
    nightHourMilliseconds,
    dayEndErrorMilliseconds,
    nightEndErrorMilliseconds,
    dayPass:dayEndErrorMilliseconds < 2,
    nightPass:nightEndErrorMilliseconds < 2
  };

  const classicalPositions=classicalPlanetPositions(input.moment);
  const lunarMansion=lunarMansionIndex(input.moment);
  const phaseAngle=moonPhaseAngle(input.moment);

  const trace=[
    `MOMENT=${input.moment.toISOString()}`,
    `LOCATION=${input.latitude},${input.longitude}`,
    `SUNRISE=${solar.sunrise.toISOString()}`,
    `SUNSET=${solar.sunset.toISOString()}`,
    `NEXT_SUNRISE=${solar.nextSunrise.toISOString()}`,
    `DAY_LENGTH_MS=${daylight}`,
    `DAY_HOUR_MS=(SUNSET-SUNRISE)/12=${dayHourMilliseconds}`,
    `NIGHT_LENGTH_MS=${nighttime}`,
    `NIGHT_HOUR_MS=(NEXT_SUNRISE-SUNSET)/12=${nightHourMilliseconds}`,
    `WEEKDAY_RULER=${weekdayRuler}`,
    `CURRENT_PLANETARY_HOUR=${currentHour.ordinal}:${currentHour.planet}`,
    `VERIFY_DAY_END_ERROR_MS=${dayEndErrorMilliseconds}`,
    `VERIFY_NIGHT_END_ERROR_MS=${nightEndErrorMilliseconds}`,
    `LUNAR_MANSION_EQUAL_ARC_28=${lunarMansion.index}:${lunarMansion.arabicName}`,
    `MOON_PHASE_ANGLE=${phaseAngle}`
  ];

  return {
    input:{momentIso:input.moment.toISOString(),latitude:input.latitude,longitude:input.longitude},
    solar,
    weekdayRuler,
    currentHour,
    hours,
    verification,
    astronomy:{classicalPositions,lunarMansion,moonPhaseAngle:phaseAngle},
    source:{
      method:"ALLAMA Omega Raml/Abjad Masterbook — planetary-hours-masterclass / hours",
      warning:"This pack computes astronomical/timing facts and the traditional planetary-hour sequence. It does not label a planet/hour favorable or unfavorable unless a separate sourced interpretive rule pack explicitly does so."
    },
    trace
  };
}
