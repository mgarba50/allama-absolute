import { classicalPlanetPositions, lunarMansionIndex } from "./ephemeris";
import { currentPlanetaryHour, moonPhase, planetaryHoursForDate, type Planet } from "./celestial";

export interface TimingPreference {
  preferredPlanets: readonly Planet[];
  avoidedPlanets?: readonly Planet[];
}

export interface TimingCandidate {
  label:string;
  moment:Date;
  latitude:number;
  longitude:number;
  timeZone?:string;
}

export interface TimingCandidateResult {
  label:string;
  momentUtc:string;
  localDisplay:string;
  latitude:number;
  longitude:number;
  planetaryHour:ReturnType<typeof currentPlanetaryHour>;
  moon:ReturnType<typeof moonPhase>;
  lunarMansion:ReturnType<typeof lunarMansionIndex>;
  planets:ReturnType<typeof classicalPlanetPositions>;
  score:number;
  reasons:readonly string[];
}

export interface ScheduleWindow {
  label:"traditional electional ranking";
  start:string;
  end:string;
  planet:Planet;
  daylight:boolean;
  score:number;
  reasons:readonly string[];
}

function localDisplay(moment:Date,timeZone?:string):string {
  if(!timeZone) return moment.toISOString();
  try {
    return new Intl.DateTimeFormat("en-GB",{timeZone,dateStyle:"medium",timeStyle:"long"}).format(moment);
  } catch {
    return moment.toISOString()+" (invalid time zone label: "+timeZone+")";
  }
}

function scorePlanet(planet:Planet,preference:TimingPreference):{score:number;reasons:string[]} {
  let score=0;
  const reasons:string[]=[];
  if(preference.preferredPlanets.includes(planet)) { score+=1; reasons.push(planet+" is preferred by the active configuration."); }
  if(preference.avoidedPlanets?.includes(planet)) { score-=1; reasons.push(planet+" is avoided by the active configuration."); }
  if(!reasons.length) reasons.push("No configured preference applies to "+planet+".");
  return {score,reasons};
}

export function compareLocationAwareTiming(
  candidates:readonly TimingCandidate[],
  preference:TimingPreference
):TimingCandidateResult[] {
  return candidates.map((candidate)=>{
    if(!Number.isFinite(candidate.moment.getTime())) throw new Error("Invalid timing candidate date: "+candidate.label);
    const planetaryHour=currentPlanetaryHour(candidate.moment,candidate.latitude,candidate.longitude);
    const scored=scorePlanet(planetaryHour.planet,preference);
    return {
      label:candidate.label,
      momentUtc:candidate.moment.toISOString(),
      localDisplay:localDisplay(candidate.moment,candidate.timeZone),
      latitude:candidate.latitude,longitude:candidate.longitude,
      planetaryHour,moon:moonPhase(candidate.moment),
      lunarMansion:lunarMansionIndex(candidate.moment),
      planets:classicalPlanetPositions(candidate.moment),
      score:scored.score,reasons:scored.reasons
    };
  }).sort((a,b)=>b.score-a.score || a.momentUtc.localeCompare(b.momentUtc));
}

export function exploreSchedule(
  start:Date,end:Date,latitude:number,longitude:number,preference:TimingPreference,
  maxDays=62
):ScheduleWindow[] {
  if(!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end<start) throw new Error("Invalid schedule range.");
  const spanDays=Math.ceil((end.getTime()-start.getTime())/86400000)+1;
  if(spanDays>maxDays) throw new Error("Schedule range exceeds configured maximum of "+maxDays+" days.");
  const windows:ScheduleWindow[]=[];
  const cursor=new Date(start);
  cursor.setHours(12,0,0,0);
  while(cursor<=end) {
    for(const hour of planetaryHoursForDate(cursor,latitude,longitude)) {
      if(hour.end<start || hour.start>end) continue;
      const scored=scorePlanet(hour.planet,preference);
      windows.push({
        label:"traditional electional ranking",
        start:hour.start.toISOString(),end:hour.end.toISOString(),planet:hour.planet,
        daylight:hour.daylight,score:scored.score,reasons:scored.reasons
      });
    }
    cursor.setDate(cursor.getDate()+1);
  }
  return windows.sort((a,b)=>b.score-a.score || a.start.localeCompare(b.start));
}
