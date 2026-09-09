export interface KnownAnswerSolarFixture {
  id:string;
  source:"USNO";
  latitude:number;
  longitude:number;
  standardTimeOffsetHours:number;
  dateUtcNoon:string;
  expectedSunriseUtc:string;
  expectedSunsetUtc:string;
  season:"winter"|"spring"|"summer"|"autumn";
  sourceLocator:string;
}

export const SOLAR_KNOWN_ANSWER_TOLERANCE_MINUTES=6;

export const USNO_SOLAR_FIXTURES:readonly KnownAnswerSolarFixture[]=[
  {id:"washington-winter",source:"USNO",latitude:38.89,longitude:-77.03,standardTimeOffsetHours:-5,dateUtcNoon:"2026-01-01T12:00:00Z",expectedSunriseUtc:"2026-01-01T12:27:00Z",expectedSunsetUtc:"2026-01-01T21:57:00Z",season:"winter",sourceLocator:"USNO 2026 Washington, DC annual table; Jan 01 = 07:27 / 16:57 standard time"},
  {id:"washington-spring",source:"USNO",latitude:38.89,longitude:-77.03,standardTimeOffsetHours:-5,dateUtcNoon:"2026-03-01T12:00:00Z",expectedSunriseUtc:"2026-03-01T11:40:00Z",expectedSunsetUtc:"2026-03-01T23:01:00Z",season:"spring",sourceLocator:"USNO 2026 Washington, DC annual table; Mar 01 = 06:40 / 18:01 standard time"},
  {id:"washington-summer",source:"USNO",latitude:38.89,longitude:-77.03,standardTimeOffsetHours:-5,dateUtcNoon:"2026-06-01T12:00:00Z",expectedSunriseUtc:"2026-06-01T09:45:00Z",expectedSunsetUtc:"2026-06-02T00:28:00Z",season:"summer",sourceLocator:"USNO 2026 Washington, DC annual table; Jun 01 = 04:45 / 19:28 standard time"},
  {id:"washington-autumn",source:"USNO",latitude:38.89,longitude:-77.03,standardTimeOffsetHours:-5,dateUtcNoon:"2026-09-01T12:00:00Z",expectedSunriseUtc:"2026-09-01T10:37:00Z",expectedSunsetUtc:"2026-09-01T23:38:00Z",season:"autumn",sourceLocator:"USNO 2026 Washington, DC annual table; Sep 01 = 05:37 / 18:38 standard time"},
  {id:"san-francisco-winter",source:"USNO",latitude:37.78,longitude:-122.41,standardTimeOffsetHours:-8,dateUtcNoon:"2026-01-01T12:00:00Z",expectedSunriseUtc:"2026-01-01T15:25:00Z",expectedSunsetUtc:"2026-01-02T01:02:00Z",season:"winter",sourceLocator:"USNO 2026 San Francisco annual table; Jan 01 = 07:25 / 17:02 standard time"},
  {id:"san-francisco-summer",source:"USNO",latitude:37.78,longitude:-122.41,standardTimeOffsetHours:-8,dateUtcNoon:"2026-06-01T12:00:00Z",expectedSunriseUtc:"2026-06-01T12:49:00Z",expectedSunsetUtc:"2026-06-02T03:26:00Z",season:"summer",sourceLocator:"USNO 2026 San Francisco annual table; Jun 01 = 04:49 / 19:26 standard time"},
  {id:"san-francisco-autumn",source:"USNO",latitude:37.78,longitude:-122.41,standardTimeOffsetHours:-8,dateUtcNoon:"2026-09-01T12:00:00Z",expectedSunriseUtc:"2026-09-01T13:39:00Z",expectedSunsetUtc:"2026-09-02T02:39:00Z",season:"autumn",sourceLocator:"USNO 2026 San Francisco annual table; Sep 01 = 05:39 / 18:39 standard time"}
];

export interface ValidationBlocker {
  status:"DATA-BLOCKED";
  requirement:string;
  missingData:string;
  authoritativeReference:string;
  retrievalInstruction:string;
}

export const LUNAR_POSITION_VALIDATION_BLOCKER:ValidationBlocker={
  status:"DATA-BLOCKED",
  requirement:"Independent Moon observer-centered ecliptic longitude/latitude and equal-arc mansion known answers",
  missingData:"Numeric JPL Horizons quantity #31 rows for selected UTC timestamps were not retrievable through the current execution environment.",
  authoritativeReference:"JPL Horizons Observer Table quantity #31 (ObsEcLon / ObsEcLat), geocentric center",
  retrievalInstruction:"Query the JPL Horizons API with COMMAND='301', EPHEM_TYPE='OBSERVER', CENTER='500@399', QUANTITIES='31' for each fixture timestamp; record returned ObsEcLon/ObsEcLat and derive equal-arc mansion floor(longitude/(360/28))+1."
};

export function minuteDifference(actual:Date,expectedIso:string):number{
  return Math.abs(actual.getTime()-new Date(expectedIso).getTime())/60000;
}
