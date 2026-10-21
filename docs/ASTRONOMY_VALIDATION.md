# Independent Astronomy Validation

ALLAMA ABSOLUTE distinguishes range tests (a value is plausible) from independent known-answer tests (it agrees with an external reference). The former cannot substitute for the latter.

## Solar rise/set and planetary-hour boundaries

The independent reference is the U.S. Naval Observatory Astronomical Applications Department's [annual Rise and Set for the Sun tables](https://aa.usno.navy.mil/data/RS_OneYear). The 2026 fixtures in `src/core/astronomyValidation.ts` cover Washington, DC (38.89° N, 77.03° W; UTC−5 standard time) and San Francisco (37.78° N, 122.41° W; UTC−8 standard time) across four seasons. The [Washington table](https://aa.usno.navy.mil/calculated/rstt/year?ID=AA&year=2026&task=0&lat=38&lat_sign=1&lon=77&lon_sign=-1&label=WASHINGTON%2C+DC&tz=5&tz_sign=-1) and [San Francisco table](https://aa.usno.navy.mil/calculated/rstt/year?ID=AA&year=2026&task=0&lat=37.78&lat_sign=1&lon=122.41&lon_sign=-1&label=SAN+FRANCISCO&tz=8&tz_sign=-1) are the fixture provenance.

USNO prints local **standard** time, not daylight-saving civil time. The fixtures convert printed times to UTC using the fixed standard-time offset. The acceptance tolerance is ±6 minutes for SunCalc rise/set against the minute-rounded table; it allows for table rounding and differing model/atmospheric conventions. Planetary-hour daytime boundaries use the same sunrise and sunset anchors.

## Lunar longitude and mansion known answers: data-blocked

JPL Horizons is the selected independent reference. Its Observer Table quantity 31 reports observer-centered Earth ecliptic-of-date longitude and latitude (`ObsEcLon`, `ObsEcLat`). A geocentric Moon fixture should request Moon target `COMMAND='301'`, Earth-geocenter observer `CENTER='500@399'`, and `QUANTITIES='31'`. See the [Horizons API documentation](https://ssd-api.jpl.nasa.gov/doc/horizons.html) and [Horizons manual](https://ssd.jpl.nasa.gov/horizons/manual.html).

The attempted API retrieval did not yield verified numeric rows. Consequently the repository has no independent JPL lunar known-answer values yet, and this portion remains **data-blocked**. To unblock it, obtain and retain Horizons `ObsEcLon`/`ObsEcLat` rows for explicitly recorded UTC timestamps, target, center, quantity and reference settings; then compare the model to those rows with a documented angular tolerance. The current equal-arc mansion calculation assigns `floor(normalized longitude / (360/28)) + 1` for a longitude in `[0, 360)`.

Do not turn a value produced by Astronomy Engine into its own expected result, or label an unverified number as a JPL fixture.
