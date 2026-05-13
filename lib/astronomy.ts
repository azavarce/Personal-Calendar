/**
 * Astronomical helpers used for the small almanac line on Today.
 *
 * Sun calculations use the standard NOAA-derived simplified formula —
 * accurate to ~2–3 minutes for the displayed times. Good enough for an
 * almanac touch; not for sailing.
 *
 * Moon phase is location-independent — same for every observer on Earth.
 *
 * Location for sun times defaults to New York City (40.7128°N, 74.0060°W).
 * Plan: surface a Settings option to override; for now, the default is
 * hardcoded and noted in the small caption beside the times.
 */

export type Location = {
  latitude: number;
  longitude: number;
  label: string;
};

export const DEFAULT_LOCATION: Location = {
  latitude: 40.7128,
  longitude: -74.006,
  label: 'New York',
};

function dayOfYear(d: Date): number {
  // Day of year using LOCAL date components — matches the user's calendar.
  const start = Date.UTC(d.getFullYear(), 0, 0);
  const today = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((today - start) / 86400000);
}

/**
 * Compute approximate sunrise and sunset for the given date at the given
 * coordinates. Returns local Date objects (the runtime's timezone determines
 * the display offset).
 */
export function getSunTimes(
  date: Date,
  latitude: number = DEFAULT_LOCATION.latitude,
  longitude: number = DEFAULT_LOCATION.longitude,
): { sunrise: Date; sunset: Date } {
  const n = dayOfYear(date);

  // Approximate solar declination (degrees).
  const declination = -23.44 * Math.cos(((2 * Math.PI) / 365.25) * (n + 10));
  const declRad = (declination * Math.PI) / 180;
  const latRad = (latitude * Math.PI) / 180;

  // Hour angle of sunrise/sunset, including the standard -0.833° refraction
  // correction.
  const cosH =
    (Math.sin((-0.833 * Math.PI) / 180) -
      Math.sin(latRad) * Math.sin(declRad)) /
    (Math.cos(latRad) * Math.cos(declRad));

  // Polar day or polar night — no real sunrise/sunset. Fall back to
  // midnight/noon as a graceful display.
  if (cosH > 1 || cosH < -1) {
    const fallback = new Date(date);
    fallback.setHours(0, 0, 0, 0);
    return { sunrise: fallback, sunset: fallback };
  }

  const hourAngle = Math.acos(cosH);
  const hourAngleHours = (hourAngle * 180) / Math.PI / 15;

  // Equation of time correction (minutes).
  const B = (2 * Math.PI * (n - 81)) / 364;
  const equationOfTime =
    9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);

  // Solar noon in UTC hours.
  const solarNoonUTC = 12 - longitude / 15 - equationOfTime / 60;
  const sunriseUTC = solarNoonUTC - hourAngleHours;
  const sunsetUTC = solarNoonUTC + hourAngleHours;

  const sunrise = new Date(date);
  sunrise.setUTCHours(0, 0, 0, 0);
  sunrise.setTime(sunrise.getTime() + Math.round(sunriseUTC * 3600000));

  const sunset = new Date(date);
  sunset.setUTCHours(0, 0, 0, 0);
  sunset.setTime(sunset.getTime() + Math.round(sunsetUTC * 3600000));

  return { sunrise, sunset };
}

export type MoonPhase = {
  /** 0..1 cycle position. 0 = new moon, 0.5 = full moon. */
  phase: number;
  name: string;
  /** Compact glyph used inline. */
  glyph: string;
};

/**
 * Compute the moon phase for the given date. Anchored on the known new moon
 * of 2000-01-06 at 18:14 UTC and the standard synodic month (29.5306 days).
 * Accurate to within a few hours, easily within the precision an almanac
 * needs.
 */
export function getMoonPhase(date: Date): MoonPhase {
  const knownNewMoon = new Date('2000-01-06T18:14:00Z').getTime();
  const synodicMonth = 29.530588853 * 86400000;
  const elapsed = date.getTime() - knownNewMoon;
  const phase =
    (((elapsed % synodicMonth) + synodicMonth) % synodicMonth) / synodicMonth;

  if (phase < 0.0625 || phase >= 0.9375)
    return { phase, name: 'New moon', glyph: '○' };
  if (phase < 0.1875) return { phase, name: 'Waxing crescent', glyph: '☽' };
  if (phase < 0.3125) return { phase, name: 'First quarter', glyph: '◐' };
  if (phase < 0.4375) return { phase, name: 'Waxing gibbous', glyph: '◑' };
  if (phase < 0.5625) return { phase, name: 'Full moon', glyph: '●' };
  if (phase < 0.6875) return { phase, name: 'Waning gibbous', glyph: '◑' };
  if (phase < 0.8125) return { phase, name: 'Last quarter', glyph: '◐' };
  return { phase, name: 'Waning crescent', glyph: '☾' };
}
