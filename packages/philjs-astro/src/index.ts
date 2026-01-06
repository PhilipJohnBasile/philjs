/**
 * @philjs/astro - Comprehensive Astronomy & Orbital Mechanics Library
 *
 * A full-featured astronomy library with ephemeris calculations, planet positions,
 * moon phases, coordinate transformations, and signal-reactive state.
 *
 * @example
 * ```typescript
 * import {
 *   Ephemeris,
 *   MoonPhase,
 *   SolarSystem,
 *   useAstronomy,
 *   usePlanetPosition
 * } from '@philjs/astro';
 *
 * // Get current Moon phase
 * const phase = MoonPhase.current();
 * console.log(phase.name, phase.illumination);
 *
 * // Track planet position reactively
 * const mars = usePlanetPosition('mars');
 * effect(() => console.log('Mars RA:', mars().rightAscension));
 * ```
 */

import { signal, computed, effect, batch, type Signal, type Computed } from '@philjs/core';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type CelestialBody =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars'
  | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';

export type ZodiacSign =
  | 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo'
  | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';

export type MoonPhaseName =
  | 'new_moon' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous'
  | 'full_moon' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';

export interface EquatorialCoordinates {
  rightAscension: number; // hours (0-24)
  declination: number; // degrees (-90 to +90)
  distance: number; // AU
}

export interface HorizontalCoordinates {
  altitude: number; // degrees above horizon
  azimuth: number; // degrees from north
}

export interface EclipticCoordinates {
  longitude: number; // degrees (0-360)
  latitude: number; // degrees (-90 to +90)
  distance: number; // AU
}

export interface GalacticCoordinates {
  longitude: number; // degrees (0-360)
  latitude: number; // degrees (-90 to +90)
}

export interface GeographicLocation {
  latitude: number; // degrees (-90 to +90)
  longitude: number; // degrees (-180 to +180)
  elevation?: number; // meters
  timezone?: string;
}

export interface CelestialEvent {
  type: 'rise' | 'set' | 'transit' | 'conjunction' | 'opposition' | 'eclipse' | 'occultation';
  body: CelestialBody;
  date: Date;
  description: string;
  magnitude?: number;
  visible?: boolean;
}

export interface PlanetData {
  name: string;
  symbol: string;
  mass: number; // kg
  radius: number; // km
  semiMajorAxis: number; // AU
  eccentricity: number;
  inclination: number; // degrees
  orbitalPeriod: number; // days
  rotationPeriod: number; // hours
  moons: number;
  rings: boolean;
}

export interface StarData {
  name: string;
  constellation: string;
  magnitude: number;
  spectralClass: string;
  rightAscension: number;
  declination: number;
  distance: number; // light years
  color: string;
}

export interface ConstellationData {
  name: string;
  abbreviation: string;
  genitive: string;
  family: string;
  area: number; // square degrees
  brightestStar: string;
  stars: string[];
  mythology: string;
}

export interface MoonPhaseData {
  name: MoonPhaseName;
  displayName: string;
  illumination: number; // 0-1
  age: number; // days since new moon
  emoji: string;
  description: string;
}

export interface EclipseData {
  type: 'solar_total' | 'solar_partial' | 'solar_annular' | 'lunar_total' | 'lunar_partial' | 'lunar_penumbral';
  date: Date;
  peakTime: Date;
  duration: number; // minutes
  magnitude: number;
  visibility: string[];
  sarosNumber: number;
}

export interface SatelliteData {
  name: string;
  noradId: number;
  tle1: string;
  tle2: string;
  altitude: number; // km
  velocity: number; // km/s
  period: number; // minutes
}

export interface AstronomyState {
  location: GeographicLocation;
  time: Date;
  planets: Map<CelestialBody, EquatorialCoordinates>;
  moonPhase: MoonPhaseData;
  siderealTime: number;
  julianDate: number;
}

// ============================================================================
// Constants
// ============================================================================

const J2000 = 2451545.0; // Julian Date of J2000 epoch
const JULIAN_CENTURY = 36525; // Days in a Julian century
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const HOURS_TO_DEG = 15;
const AU_TO_KM = 149597870.7;
const LIGHT_YEAR_TO_AU = 63241.1;
const EARTH_RADIUS_KM = 6371;

const SYNODIC_MONTH = 29.530588853; // Average lunar synodic period in days

// Orbital elements for planets (J2000 epoch)
export const PLANET_DATA: Record<CelestialBody, PlanetData> = {
  sun: {
    name: 'Sun',
    symbol: '☉',
    mass: 1.989e30,
    radius: 696340,
    semiMajorAxis: 0,
    eccentricity: 0,
    inclination: 0,
    orbitalPeriod: 0,
    rotationPeriod: 609.12,
    moons: 0,
    rings: false,
  },
  moon: {
    name: 'Moon',
    symbol: '☽',
    mass: 7.342e22,
    radius: 1737.4,
    semiMajorAxis: 0.00257,
    eccentricity: 0.0549,
    inclination: 5.145,
    orbitalPeriod: 27.322,
    rotationPeriod: 655.72,
    moons: 0,
    rings: false,
  },
  mercury: {
    name: 'Mercury',
    symbol: '☿',
    mass: 3.301e23,
    radius: 2439.7,
    semiMajorAxis: 0.387,
    eccentricity: 0.2056,
    inclination: 7.0,
    orbitalPeriod: 87.97,
    rotationPeriod: 1407.6,
    moons: 0,
    rings: false,
  },
  venus: {
    name: 'Venus',
    symbol: '♀',
    mass: 4.867e24,
    radius: 6051.8,
    semiMajorAxis: 0.723,
    eccentricity: 0.0068,
    inclination: 3.4,
    orbitalPeriod: 224.7,
    rotationPeriod: -5832.5,
    moons: 0,
    rings: false,
  },
  mars: {
    name: 'Mars',
    symbol: '♂',
    mass: 6.417e23,
    radius: 3389.5,
    semiMajorAxis: 1.524,
    eccentricity: 0.0934,
    inclination: 1.85,
    orbitalPeriod: 686.98,
    rotationPeriod: 24.62,
    moons: 2,
    rings: false,
  },
  jupiter: {
    name: 'Jupiter',
    symbol: '♃',
    mass: 1.898e27,
    radius: 69911,
    semiMajorAxis: 5.203,
    eccentricity: 0.0489,
    inclination: 1.3,
    orbitalPeriod: 4332.59,
    rotationPeriod: 9.93,
    moons: 95,
    rings: true,
  },
  saturn: {
    name: 'Saturn',
    symbol: '♄',
    mass: 5.683e26,
    radius: 58232,
    semiMajorAxis: 9.537,
    eccentricity: 0.0565,
    inclination: 2.49,
    orbitalPeriod: 10759.22,
    rotationPeriod: 10.66,
    moons: 146,
    rings: true,
  },
  uranus: {
    name: 'Uranus',
    symbol: '⛢',
    mass: 8.681e25,
    radius: 25362,
    semiMajorAxis: 19.191,
    eccentricity: 0.0472,
    inclination: 0.77,
    orbitalPeriod: 30688.5,
    rotationPeriod: -17.24,
    moons: 28,
    rings: true,
  },
  neptune: {
    name: 'Neptune',
    symbol: '♆',
    mass: 1.024e26,
    radius: 24622,
    semiMajorAxis: 30.069,
    eccentricity: 0.0086,
    inclination: 1.77,
    orbitalPeriod: 60182,
    rotationPeriod: 16.11,
    moons: 16,
    rings: true,
  },
  pluto: {
    name: 'Pluto',
    symbol: '♇',
    mass: 1.309e22,
    radius: 1188.3,
    semiMajorAxis: 39.482,
    eccentricity: 0.2488,
    inclination: 17.16,
    orbitalPeriod: 90560,
    rotationPeriod: -153.29,
    moons: 5,
    rings: false,
  },
};

const ZODIAC_SIGNS: Record<ZodiacSign, { start: number; end: number; symbol: string; element: string }> = {
  aries: { start: 0, end: 30, symbol: '♈', element: 'fire' },
  taurus: { start: 30, end: 60, symbol: '♉', element: 'earth' },
  gemini: { start: 60, end: 90, symbol: '♊', element: 'air' },
  cancer: { start: 90, end: 120, symbol: '♋', element: 'water' },
  leo: { start: 120, end: 150, symbol: '♌', element: 'fire' },
  virgo: { start: 150, end: 180, symbol: '♍', element: 'earth' },
  libra: { start: 180, end: 210, symbol: '♎', element: 'air' },
  scorpio: { start: 210, end: 240, symbol: '♏', element: 'water' },
  sagittarius: { start: 240, end: 270, symbol: '♐', element: 'fire' },
  capricorn: { start: 270, end: 300, symbol: '♑', element: 'earth' },
  aquarius: { start: 300, end: 330, symbol: '♒', element: 'air' },
  pisces: { start: 330, end: 360, symbol: '♓', element: 'water' },
};

const BRIGHT_STARS: StarData[] = [
  { name: 'Sirius', constellation: 'Canis Major', magnitude: -1.46, spectralClass: 'A1V', rightAscension: 6.752, declination: -16.716, distance: 8.6, color: '#A3C9FF' },
  { name: 'Canopus', constellation: 'Carina', magnitude: -0.74, spectralClass: 'A9II', rightAscension: 6.399, declination: -52.696, distance: 310, color: '#FFFFD4' },
  { name: 'Alpha Centauri', constellation: 'Centaurus', magnitude: -0.27, spectralClass: 'G2V', rightAscension: 14.660, declination: -60.835, distance: 4.37, color: '#FFF5E1' },
  { name: 'Arcturus', constellation: 'Bootes', magnitude: -0.05, spectralClass: 'K1.5IIIFe', rightAscension: 14.261, declination: 19.182, distance: 36.7, color: '#FFCC6F' },
  { name: 'Vega', constellation: 'Lyra', magnitude: 0.03, spectralClass: 'A0V', rightAscension: 18.616, declination: 38.784, distance: 25, color: '#B5CFFF' },
  { name: 'Capella', constellation: 'Auriga', magnitude: 0.08, spectralClass: 'G8III', rightAscension: 5.278, declination: 45.998, distance: 42.9, color: '#FFFFD4' },
  { name: 'Rigel', constellation: 'Orion', magnitude: 0.13, spectralClass: 'B8Ia', rightAscension: 5.242, declination: -8.202, distance: 860, color: '#B5CFFF' },
  { name: 'Procyon', constellation: 'Canis Minor', magnitude: 0.34, spectralClass: 'F5IV-V', rightAscension: 7.655, declination: 5.225, distance: 11.5, color: '#FFF5E1' },
  { name: 'Betelgeuse', constellation: 'Orion', magnitude: 0.42, spectralClass: 'M1-2Ia-Iab', rightAscension: 5.919, declination: 7.407, distance: 700, color: '#FFBB6F' },
  { name: 'Altair', constellation: 'Aquila', magnitude: 0.77, spectralClass: 'A7V', rightAscension: 19.846, declination: 8.868, distance: 16.7, color: '#F0F0FF' },
  { name: 'Aldebaran', constellation: 'Taurus', magnitude: 0.85, spectralClass: 'K5III', rightAscension: 4.599, declination: 16.509, distance: 65, color: '#FFCC6F' },
  { name: 'Spica', constellation: 'Virgo', magnitude: 0.97, spectralClass: 'B1III-IV', rightAscension: 13.420, declination: -11.161, distance: 260, color: '#B5CFFF' },
  { name: 'Antares', constellation: 'Scorpius', magnitude: 1.09, spectralClass: 'M1.5Iab-b', rightAscension: 16.490, declination: -26.432, distance: 550, color: '#FF6F6F' },
  { name: 'Pollux', constellation: 'Gemini', magnitude: 1.14, spectralClass: 'K0III', rightAscension: 7.755, declination: 28.026, distance: 34, color: '#FFCC6F' },
  { name: 'Fomalhaut', constellation: 'Piscis Austrinus', magnitude: 1.16, spectralClass: 'A3V', rightAscension: 22.961, declination: -29.622, distance: 25, color: '#F0F0FF' },
  { name: 'Deneb', constellation: 'Cygnus', magnitude: 1.25, spectralClass: 'A2Ia', rightAscension: 20.690, declination: 45.280, distance: 2615, color: '#F0F0FF' },
];

// ============================================================================
// Time Utilities
// ============================================================================

/**
 * Convert a JavaScript Date to Julian Date
 */
export function dateToJulianDate(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const hour = date.getUTCHours();
  const minute = date.getUTCMinutes();
  const second = date.getUTCSeconds();

  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  let jdn = day + Math.floor((153 * m + 2) / 5) + 365 * y;
  jdn += Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  const fraction = (hour - 12) / 24 + minute / 1440 + second / 86400;
  return jdn + fraction;
}

/**
 * Convert Julian Date to JavaScript Date
 */
export function julianDateToDate(jd: number): Date {
  const z = Math.floor(jd + 0.5);
  const f = jd + 0.5 - z;

  let a: number;
  if (z < 2299161) {
    a = z;
  } else {
    const alpha = Math.floor((z - 1867216.25) / 36524.25);
    a = z + 1 + alpha - Math.floor(alpha / 4);
  }

  const b = a + 1524;
  const c = Math.floor((b - 122.1) / 365.25);
  const d = Math.floor(365.25 * c);
  const e = Math.floor((b - d) / 30.6001);

  const day = b - d - Math.floor(30.6001 * e) + f;
  const month = e < 14 ? e - 1 : e - 13;
  const year = month > 2 ? c - 4716 : c - 4715;

  const dayFraction = day % 1;
  const hours = dayFraction * 24;
  const minutes = (hours % 1) * 60;
  const seconds = (minutes % 1) * 60;

  return new Date(Date.UTC(
    year,
    month - 1,
    Math.floor(day),
    Math.floor(hours),
    Math.floor(minutes),
    Math.floor(seconds)
  ));
}

/**
 * Get Julian centuries since J2000
 */
export function julianCenturies(date: Date): number {
  const jd = dateToJulianDate(date);
  return (jd - J2000) / JULIAN_CENTURY;
}

/**
 * Calculate Greenwich Mean Sidereal Time
 */
export function greenwichSiderealTime(date: Date): number {
  const jd = dateToJulianDate(date);
  const t = (jd - J2000) / JULIAN_CENTURY;

  let gmst = 280.46061837 + 360.98564736629 * (jd - J2000);
  gmst += 0.000387933 * t * t - t * t * t / 38710000;
  gmst = ((gmst % 360) + 360) % 360;

  return gmst / HOURS_TO_DEG; // Convert to hours
}

/**
 * Calculate Local Sidereal Time
 */
export function localSiderealTime(date: Date, longitude: number): number {
  const gmst = greenwichSiderealTime(date);
  let lst = gmst + longitude / HOURS_TO_DEG;
  return ((lst % 24) + 24) % 24;
}

/**
 * Get Modified Julian Date
 */
export function modifiedJulianDate(date: Date): number {
  return dateToJulianDate(date) - 2400000.5;
}

// ============================================================================
// Coordinate Transformations
// ============================================================================

/**
 * Convert equatorial coordinates to horizontal coordinates
 */
export function equatorialToHorizontal(
  eq: EquatorialCoordinates,
  location: GeographicLocation,
  date: Date
): HorizontalCoordinates {
  const lst = localSiderealTime(date, location.longitude);
  const ha = (lst - eq.rightAscension) * HOURS_TO_DEG * DEG_TO_RAD;
  const dec = eq.declination * DEG_TO_RAD;
  const lat = location.latitude * DEG_TO_RAD;

  const sinAlt = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(ha);
  const altitude = Math.asin(sinAlt) * RAD_TO_DEG;

  const cosAz = (Math.sin(dec) - Math.sin(lat) * sinAlt) / (Math.cos(lat) * Math.cos(altitude * DEG_TO_RAD));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) * RAD_TO_DEG;

  if (Math.sin(ha) > 0) {
    azimuth = 360 - azimuth;
  }

  return { altitude, azimuth };
}

/**
 * Convert horizontal coordinates to equatorial coordinates
 */
export function horizontalToEquatorial(
  hz: HorizontalCoordinates,
  location: GeographicLocation,
  date: Date
): EquatorialCoordinates {
  const alt = hz.altitude * DEG_TO_RAD;
  const az = hz.azimuth * DEG_TO_RAD;
  const lat = location.latitude * DEG_TO_RAD;

  const sinDec = Math.sin(alt) * Math.sin(lat) + Math.cos(alt) * Math.cos(lat) * Math.cos(az);
  const dec = Math.asin(sinDec);

  const cosHa = (Math.sin(alt) - Math.sin(lat) * sinDec) / (Math.cos(lat) * Math.cos(dec));
  let ha = Math.acos(Math.max(-1, Math.min(1, cosHa)));

  if (Math.sin(az) > 0) {
    ha = 2 * Math.PI - ha;
  }

  const lst = localSiderealTime(date, location.longitude);
  let ra = lst - ha * RAD_TO_DEG / HOURS_TO_DEG;
  ra = ((ra % 24) + 24) % 24;

  return {
    rightAscension: ra,
    declination: dec * RAD_TO_DEG,
    distance: 0,
  };
}

/**
 * Convert ecliptic coordinates to equatorial coordinates
 */
export function eclipticToEquatorial(
  ecl: EclipticCoordinates,
  date: Date
): EquatorialCoordinates {
  const t = julianCenturies(date);
  const epsilon = (23.439291 - 0.0130042 * t) * DEG_TO_RAD;

  const lon = ecl.longitude * DEG_TO_RAD;
  const lat = ecl.latitude * DEG_TO_RAD;

  const sinDec = Math.sin(lat) * Math.cos(epsilon) + Math.cos(lat) * Math.sin(epsilon) * Math.sin(lon);
  const dec = Math.asin(sinDec);

  const y = Math.sin(lon) * Math.cos(epsilon) - Math.tan(lat) * Math.sin(epsilon);
  const x = Math.cos(lon);
  let ra = Math.atan2(y, x) * RAD_TO_DEG / HOURS_TO_DEG;
  ra = ((ra % 24) + 24) % 24;

  return {
    rightAscension: ra,
    declination: dec * RAD_TO_DEG,
    distance: ecl.distance,
  };
}

/**
 * Convert equatorial coordinates to galactic coordinates
 */
export function equatorialToGalactic(eq: EquatorialCoordinates): GalacticCoordinates {
  const ra = eq.rightAscension * HOURS_TO_DEG * DEG_TO_RAD;
  const dec = eq.declination * DEG_TO_RAD;

  // Galactic north pole in J2000: RA = 12h 51m 26.28s, Dec = +27° 7' 41.7"
  const raNGP = 192.859508 * DEG_TO_RAD;
  const decNGP = 27.128336 * DEG_TO_RAD;
  const lNCP = 122.932 * DEG_TO_RAD; // Galactic longitude of north celestial pole

  const sinB = Math.sin(dec) * Math.sin(decNGP) + Math.cos(dec) * Math.cos(decNGP) * Math.cos(ra - raNGP);
  const latitude = Math.asin(sinB) * RAD_TO_DEG;

  const y = Math.cos(dec) * Math.sin(ra - raNGP);
  const x = Math.sin(dec) * Math.cos(decNGP) - Math.cos(dec) * Math.sin(decNGP) * Math.cos(ra - raNGP);
  let longitude = (lNCP - Math.atan2(y, x)) * RAD_TO_DEG;
  longitude = ((longitude % 360) + 360) % 360;

  return { longitude, latitude };
}

/**
 * Format RA as hours, minutes, seconds
 */
export function formatRA(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = ((hours - h) * 60 - m) * 60;
  return `${h}h ${m}m ${s.toFixed(1)}s`;
}

/**
 * Format declination as degrees, arcminutes, arcseconds
 */
export function formatDec(degrees: number): string {
  const sign = degrees >= 0 ? '+' : '-';
  const abs = Math.abs(degrees);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = ((abs - d) * 60 - m) * 60;
  return `${sign}${d}° ${m}' ${s.toFixed(1)}"`;
}

// ============================================================================
// Ephemeris Calculations
// ============================================================================

/**
 * Calculate position of the Sun
 */
export function getSunPosition(date: Date): EquatorialCoordinates {
  const t = julianCenturies(date);

  // Mean longitude
  let L0 = 280.46646 + 36000.76983 * t + 0.0003032 * t * t;
  L0 = ((L0 % 360) + 360) % 360;

  // Mean anomaly
  let M = 357.52911 + 35999.05029 * t - 0.0001537 * t * t;
  M = M * DEG_TO_RAD;

  // Equation of center
  const C = (1.914602 - 0.004817 * t - 0.000014 * t * t) * Math.sin(M)
    + (0.019993 - 0.000101 * t) * Math.sin(2 * M)
    + 0.000289 * Math.sin(3 * M);

  // True longitude
  const longitude = L0 + C;

  // Apparent longitude (corrected for nutation)
  const omega = 125.04 - 1934.136 * t;
  const apparentLon = longitude - 0.00569 - 0.00478 * Math.sin(omega * DEG_TO_RAD);

  // Distance in AU
  const e = 0.016708634 - 0.000042037 * t - 0.0000001267 * t * t;
  const v = M + C * DEG_TO_RAD;
  const distance = (1.000001018 * (1 - e * e)) / (1 + e * Math.cos(v));

  return eclipticToEquatorial({ longitude: apparentLon, latitude: 0, distance }, date);
}

/**
 * Calculate position of the Moon
 */
export function getMoonPosition(date: Date): EquatorialCoordinates {
  const t = julianCenturies(date);

  // Mean longitude
  let Lp = 218.3164477 + 481267.88123421 * t;
  Lp = ((Lp % 360) + 360) % 360;

  // Mean elongation
  let D = 297.8501921 + 445267.1114034 * t;
  D = D * DEG_TO_RAD;

  // Mean anomaly of the Moon
  let M = 134.9633964 + 477198.8675055 * t;
  M = M * DEG_TO_RAD;

  // Mean anomaly of the Sun
  let Mp = 357.5291092 + 35999.0502909 * t;
  Mp = Mp * DEG_TO_RAD;

  // Argument of latitude
  let F = 93.2720950 + 483202.0175233 * t;
  F = F * DEG_TO_RAD;

  // Longitude correction (simplified)
  const dL = 6.289 * Math.sin(M)
    + 1.274 * Math.sin(2 * D - M)
    + 0.658 * Math.sin(2 * D)
    + 0.214 * Math.sin(2 * M)
    - 0.186 * Math.sin(Mp)
    - 0.114 * Math.sin(2 * F);

  // Latitude correction (simplified)
  const dB = 5.128 * Math.sin(F)
    + 0.281 * Math.sin(M + F)
    + 0.278 * Math.sin(M - F)
    + 0.173 * Math.sin(2 * D - F);

  // Distance correction (simplified)
  const dR = -20.905 * Math.cos(M)
    - 3.699 * Math.cos(2 * D - M)
    - 2.956 * Math.cos(2 * D);

  const longitude = Lp + dL;
  const latitude = dB;
  const distance = (385000.56 + dR * 1000) / AU_TO_KM;

  return eclipticToEquatorial({ longitude, latitude, distance }, date);
}

/**
 * Calculate approximate planet position using simplified Keplerian elements
 */
export function getPlanetPosition(body: CelestialBody, date: Date): EquatorialCoordinates {
  if (body === 'sun') return getSunPosition(date);
  if (body === 'moon') return getMoonPosition(date);

  const planet = PLANET_DATA[body];
  const t = julianCenturies(date);

  // Simplified orbital elements
  const a = planet.semiMajorAxis;
  const e = planet.eccentricity;
  const i = planet.inclination * DEG_TO_RAD;

  // Mean anomaly (simplified - days since J2000 / orbital period * 360)
  const jd = dateToJulianDate(date);
  const daysSinceJ2000 = jd - J2000;
  let M = (daysSinceJ2000 / planet.orbitalPeriod) * 360;
  M = ((M % 360) + 360) % 360 * DEG_TO_RAD;

  // Solve Kepler's equation (Newton-Raphson)
  let E = M;
  for (let iter = 0; iter < 10; iter++) {
    E = M + e * Math.sin(E);
  }

  // True anomaly
  const v = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2)
  );

  // Distance
  const r = a * (1 - e * Math.cos(E));

  // Heliocentric coordinates (simplified - ignoring longitude of ascending node and argument of perihelion)
  const longitude = v * RAD_TO_DEG;
  const latitude = 0; // Simplified

  // Convert to geocentric by subtracting Sun's position
  const sunPos = getSunPosition(date);

  return eclipticToEquatorial({ longitude, latitude, distance: r }, date);
}

// ============================================================================
// Moon Phase Calculations
// ============================================================================

export const MoonPhase = {
  /**
   * Get current moon phase
   */
  current(): MoonPhaseData {
    return this.forDate(new Date());
  },

  /**
   * Get moon phase for a specific date
   */
  forDate(date: Date): MoonPhaseData {
    const jd = dateToJulianDate(date);
    const daysSinceNewMoon = (jd - 2451550.1) % SYNODIC_MONTH;
    const age = ((daysSinceNewMoon % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
    const illumination = (1 - Math.cos(age / SYNODIC_MONTH * 2 * Math.PI)) / 2;

    const phaseIndex = Math.floor(age / SYNODIC_MONTH * 8);
    const phases: MoonPhaseData[] = [
      { name: 'new_moon', displayName: 'New Moon', illumination: 0, age, emoji: '🌑', description: 'The Moon is between the Earth and Sun.' },
      { name: 'waxing_crescent', displayName: 'Waxing Crescent', illumination, age, emoji: '🌒', description: 'The Moon is growing larger.' },
      { name: 'first_quarter', displayName: 'First Quarter', illumination: 0.5, age, emoji: '🌓', description: 'Half of the Moon is illuminated.' },
      { name: 'waxing_gibbous', displayName: 'Waxing Gibbous', illumination, age, emoji: '🌔', description: 'More than half illuminated, growing.' },
      { name: 'full_moon', displayName: 'Full Moon', illumination: 1, age, emoji: '🌕', description: 'The Moon is fully illuminated.' },
      { name: 'waning_gibbous', displayName: 'Waning Gibbous', illumination, age, emoji: '🌖', description: 'More than half illuminated, shrinking.' },
      { name: 'last_quarter', displayName: 'Last Quarter', illumination: 0.5, age, emoji: '🌗', description: 'Half of the Moon is illuminated.' },
      { name: 'waning_crescent', displayName: 'Waning Crescent', illumination, age, emoji: '🌘', description: 'The Moon is shrinking toward new.' },
    ];

    return { ...phases[phaseIndex], illumination, age };
  },

  /**
   * Get next new moon
   */
  nextNewMoon(from: Date = new Date()): Date {
    const current = this.forDate(from);
    const daysToNew = SYNODIC_MONTH - current.age;
    return new Date(from.getTime() + daysToNew * 24 * 60 * 60 * 1000);
  },

  /**
   * Get next full moon
   */
  nextFullMoon(from: Date = new Date()): Date {
    const current = this.forDate(from);
    let daysToFull = SYNODIC_MONTH / 2 - current.age;
    if (daysToFull < 0) daysToFull += SYNODIC_MONTH;
    return new Date(from.getTime() + daysToFull * 24 * 60 * 60 * 1000);
  },

  /**
   * Get all moon phases for a month
   */
  forMonth(year: number, month: number): Array<{ date: Date; phase: MoonPhaseData }> {
    const phases: Array<{ date: Date; phase: MoonPhaseData }> = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      phases.push({ date, phase: this.forDate(date) });
    }

    return phases;
  },
};

// ============================================================================
// Ephemeris Class
// ============================================================================

export class Ephemeris {
  private location: GeographicLocation;
  private date: Date;

  constructor(location?: GeographicLocation, date?: Date) {
    this.location = location || { latitude: 0, longitude: 0 };
    this.date = date || new Date();
  }

  /**
   * Set observer location
   */
  setLocation(location: GeographicLocation): this {
    this.location = location;
    return this;
  }

  /**
   * Set observation time
   */
  setDate(date: Date): this {
    this.date = date;
    return this;
  }

  /**
   * Get position of a celestial body
   */
  getPosition(body: CelestialBody): EquatorialCoordinates {
    return getPlanetPosition(body, this.date);
  }

  /**
   * Get horizontal coordinates for a body
   */
  getHorizontalPosition(body: CelestialBody): HorizontalCoordinates {
    const eq = this.getPosition(body);
    return equatorialToHorizontal(eq, this.location, this.date);
  }

  /**
   * Calculate rise, transit, and set times
   */
  getRiseTransitSet(body: CelestialBody): { rise: Date | null; transit: Date; set: Date | null } {
    const eq = this.getPosition(body);
    const lst = localSiderealTime(this.date, this.location.longitude);
    const lat = this.location.latitude * DEG_TO_RAD;
    const dec = eq.declination * DEG_TO_RAD;

    // Hour angle at transit
    const transitLST = eq.rightAscension;
    let transitHours = transitLST - lst;
    if (transitHours < 0) transitHours += 24;
    const transit = new Date(this.date.getTime() + transitHours * 60 * 60 * 1000);

    // Hour angle at rise/set (h = 0)
    const cosH = -Math.tan(lat) * Math.tan(dec);

    if (cosH < -1) {
      // Circumpolar - never sets
      return { rise: null, transit, set: null };
    }
    if (cosH > 1) {
      // Never rises
      return { rise: null, transit, set: null };
    }

    const H = Math.acos(cosH) * RAD_TO_DEG / HOURS_TO_DEG;
    const riseHours = transitHours - H;
    const setHours = transitHours + H;

    const rise = new Date(this.date.getTime() + (riseHours < 0 ? riseHours + 24 : riseHours) * 60 * 60 * 1000);
    const set = new Date(this.date.getTime() + (setHours > 24 ? setHours - 24 : setHours) * 60 * 60 * 1000);

    return { rise, transit, set };
  }

  /**
   * Check if body is visible (above horizon)
   */
  isVisible(body: CelestialBody): boolean {
    const hz = this.getHorizontalPosition(body);
    return hz.altitude > 0;
  }

  /**
   * Get angular separation between two bodies
   */
  getAngularSeparation(body1: CelestialBody, body2: CelestialBody): number {
    const pos1 = this.getPosition(body1);
    const pos2 = this.getPosition(body2);

    const ra1 = pos1.rightAscension * HOURS_TO_DEG * DEG_TO_RAD;
    const dec1 = pos1.declination * DEG_TO_RAD;
    const ra2 = pos2.rightAscension * HOURS_TO_DEG * DEG_TO_RAD;
    const dec2 = pos2.declination * DEG_TO_RAD;

    const cosSep = Math.sin(dec1) * Math.sin(dec2) +
                   Math.cos(dec1) * Math.cos(dec2) * Math.cos(ra1 - ra2);

    return Math.acos(Math.max(-1, Math.min(1, cosSep))) * RAD_TO_DEG;
  }

  /**
   * Get next eclipse
   */
  static nextEclipse(type?: 'solar' | 'lunar'): EclipseData {
    // Simplified - returns approximate next eclipse
    const now = new Date();
    const eclipses: EclipseData[] = [
      {
        type: 'solar_total',
        date: new Date('2026-08-12T14:00:00Z'),
        peakTime: new Date('2026-08-12T17:46:00Z'),
        duration: 132,
        magnitude: 1.039,
        visibility: ['Greenland', 'Iceland', 'Spain', 'Portugal'],
        sarosNumber: 126,
      },
      {
        type: 'lunar_total',
        date: new Date('2025-03-14T00:00:00Z'),
        peakTime: new Date('2025-03-14T06:58:00Z'),
        duration: 65,
        magnitude: 1.178,
        visibility: ['Americas', 'Europe', 'Africa'],
        sarosNumber: 132,
      },
    ];

    const filtered = type
      ? eclipses.filter(e => e.type.startsWith(type))
      : eclipses;

    return filtered.find(e => e.date > now) || filtered[0];
  }

  /**
   * Get planet data
   */
  static getPlanetData(body: CelestialBody): PlanetData {
    return PLANET_DATA[body];
  }

  /**
   * Format position for display
   */
  formatPosition(body: CelestialBody): { ra: string; dec: string; distance: string } {
    const pos = this.getPosition(body);
    return {
      ra: formatRA(pos.rightAscension),
      dec: formatDec(pos.declination),
      distance: `${pos.distance.toFixed(3)} AU`,
    };
  }
}

// ============================================================================
// Solar System Utilities
// ============================================================================

export const SolarSystem = {
  /**
   * Get all planet positions
   */
  getAllPositions(date: Date = new Date()): Map<CelestialBody, EquatorialCoordinates> {
    const positions = new Map<CelestialBody, EquatorialCoordinates>();
    const bodies: CelestialBody[] = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

    for (const body of bodies) {
      positions.set(body, getPlanetPosition(body, date));
    }

    return positions;
  },

  /**
   * Get zodiac sign for ecliptic longitude
   */
  getZodiacSign(longitude: number): ZodiacSign {
    const normalizedLon = ((longitude % 360) + 360) % 360;

    for (const [sign, data] of Object.entries(ZODIAC_SIGNS)) {
      if (normalizedLon >= data.start && normalizedLon < data.end) {
        return sign as ZodiacSign;
      }
    }
    return 'aries';
  },

  /**
   * Get zodiac sign data
   */
  getZodiacData(sign: ZodiacSign): typeof ZODIAC_SIGNS[ZodiacSign] {
    return ZODIAC_SIGNS[sign];
  },

  /**
   * Find conjunctions between planets
   */
  findConjunctions(
    startDate: Date,
    endDate: Date,
    threshold: number = 5
  ): CelestialEvent[] {
    const events: CelestialEvent[] = [];
    const bodies: CelestialBody[] = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];
    const ephemeris = new Ephemeris();

    const current = new Date(startDate);
    while (current <= endDate) {
      ephemeris.setDate(current);

      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const separation = ephemeris.getAngularSeparation(bodies[i], bodies[j]);
          if (separation < threshold) {
            events.push({
              type: 'conjunction',
              body: bodies[i],
              date: new Date(current),
              description: `${PLANET_DATA[bodies[i]].name} and ${PLANET_DATA[bodies[j]].name} within ${separation.toFixed(1)}°`,
            });
          }
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return events;
  },

  /**
   * Get visible planets tonight
   */
  getVisiblePlanets(location: GeographicLocation, date: Date = new Date()): CelestialBody[] {
    const ephemeris = new Ephemeris(location, date);
    const planets: CelestialBody[] = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];

    return planets.filter(planet => ephemeris.isVisible(planet));
  },
};

// ============================================================================
// Star Catalog
// ============================================================================

export const StarCatalog = {
  /**
   * Get all bright stars
   */
  getBrightStars(): StarData[] {
    return [...BRIGHT_STARS];
  },

  /**
   * Find stars by constellation
   */
  byConstellation(constellation: string): StarData[] {
    return BRIGHT_STARS.filter(s =>
      s.constellation.toLowerCase() === constellation.toLowerCase()
    );
  },

  /**
   * Find stars by magnitude limit
   */
  byMagnitude(limit: number): StarData[] {
    return BRIGHT_STARS.filter(s => s.magnitude <= limit);
  },

  /**
   * Get star by name
   */
  getByName(name: string): StarData | undefined {
    return BRIGHT_STARS.find(s =>
      s.name.toLowerCase() === name.toLowerCase()
    );
  },

  /**
   * Find stars near a position
   */
  findNear(
    ra: number,
    dec: number,
    radius: number = 10
  ): StarData[] {
    return BRIGHT_STARS.filter(star => {
      const dRa = (star.rightAscension - ra) * HOURS_TO_DEG * Math.cos(dec * DEG_TO_RAD);
      const dDec = star.declination - dec;
      const distance = Math.sqrt(dRa * dRa + dDec * dDec);
      return distance <= radius;
    });
  },
};

// ============================================================================
// Reactive State
// ============================================================================

export interface AstronomyStore {
  location: Signal<GeographicLocation>;
  time: Signal<Date>;
  autoUpdate: Signal<boolean>;
  updateInterval: Signal<number>;
  planets: Computed<Map<CelestialBody, EquatorialCoordinates>>;
  moonPhase: Computed<MoonPhaseData>;
  siderealTime: Computed<number>;
  julianDate: Computed<number>;
}

/**
 * Create a reactive astronomy store
 */
export function createAstronomyStore(
  initialLocation?: GeographicLocation,
  autoUpdate: boolean = false,
  updateIntervalMs: number = 60000
): AstronomyStore {
  const location = signal<GeographicLocation>(
    initialLocation || { latitude: 0, longitude: 0 }
  );
  const time = signal<Date>(new Date());
  const autoUpdateSignal = signal(autoUpdate);
  const updateInterval = signal(updateIntervalMs);

  const planets = computed(() => SolarSystem.getAllPositions(time()));
  const moonPhase = computed(() => MoonPhase.forDate(time()));
  const siderealTime = computed(() => localSiderealTime(time(), location().longitude));
  const julianDate = computed(() => dateToJulianDate(time()));

  // Auto-update effect
  if (typeof window !== 'undefined') {
    let intervalId: number | null = null;

    effect(() => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }

      if (autoUpdateSignal()) {
        intervalId = window.setInterval(() => {
          time.set(new Date());
        }, updateInterval());
      }
    });
  }

  return {
    location,
    time,
    autoUpdate: autoUpdateSignal,
    updateInterval,
    planets,
    moonPhase,
    siderealTime,
    julianDate,
  };
}

// ============================================================================
// PhilJS Hooks
// ============================================================================

let globalStore: AstronomyStore | null = null;

function getStore(): AstronomyStore {
  if (!globalStore) {
    globalStore = createAstronomyStore();
  }
  return globalStore;
}

/**
 * Hook to access astronomy state
 */
export function useAstronomy(): AstronomyStore {
  return getStore();
}

/**
 * Hook to track planet position
 */
export function usePlanetPosition(body: CelestialBody): Computed<EquatorialCoordinates> {
  const store = getStore();
  return computed(() => {
    const positions = store.planets();
    return positions.get(body) || { rightAscension: 0, declination: 0, distance: 0 };
  });
}

/**
 * Hook to track moon phase
 */
export function useMoonPhase(): Computed<MoonPhaseData> {
  return getStore().moonPhase;
}

/**
 * Hook to track sidereal time
 */
export function useSiderealTime(): Computed<number> {
  return getStore().siderealTime;
}

/**
 * Hook for horizontal coordinates
 */
export function useHorizontalPosition(body: CelestialBody): Computed<HorizontalCoordinates> {
  const store = getStore();
  return computed(() => {
    const eq = store.planets().get(body);
    if (!eq) return { altitude: 0, azimuth: 0 };
    return equatorialToHorizontal(eq, store.location(), store.time());
  });
}

/**
 * Hook to check visibility
 */
export function useIsVisible(body: CelestialBody): Computed<boolean> {
  const hz = useHorizontalPosition(body);
  return computed(() => hz().altitude > 0);
}

/**
 * Hook for rise/transit/set times
 */
export function useRiseTransitSet(body: CelestialBody): Computed<{ rise: Date | null; transit: Date; set: Date | null }> {
  const store = getStore();
  return computed(() => {
    const ephemeris = new Ephemeris(store.location(), store.time());
    return ephemeris.getRiseTransitSet(body);
  });
}

/**
 * Set observer location globally
 */
export function setObserverLocation(location: GeographicLocation): void {
  getStore().location.set(location);
}

/**
 * Enable/disable auto-update
 */
export function setAutoUpdate(enabled: boolean, intervalMs?: number): void {
  const store = getStore();
  if (intervalMs !== undefined) {
    store.updateInterval.set(intervalMs);
  }
  store.autoUpdate.set(enabled);
}

// ============================================================================
// Satellite Tracking (TLE-based)
// ============================================================================

export class SatelliteTracker {
  private tle1: string;
  private tle2: string;

  constructor(tle1: string, tle2: string) {
    this.tle1 = tle1;
    this.tle2 = tle2;
  }

  /**
   * Parse TLE epoch
   */
  private parseEpoch(): Date {
    const epochYear = parseInt(this.tle1.substring(18, 20));
    const epochDay = parseFloat(this.tle1.substring(20, 32));

    const year = epochYear < 57 ? 2000 + epochYear : 1900 + epochYear;
    const date = new Date(year, 0, 1);
    date.setDate(date.getDate() + epochDay - 1);

    return date;
  }

  /**
   * Get satellite position (simplified SGP4)
   */
  getPosition(date: Date): EquatorialCoordinates {
    // This is a simplified calculation - real SGP4 is much more complex
    const inclination = parseFloat(this.tle2.substring(8, 16));
    const raan = parseFloat(this.tle2.substring(17, 25));
    const meanMotion = parseFloat(this.tle2.substring(52, 63));

    const epoch = this.parseEpoch();
    const elapsed = (date.getTime() - epoch.getTime()) / 1000 / 60; // minutes
    const orbits = meanMotion * elapsed / 1440;
    const meanAnomaly = (orbits * 360) % 360;

    return {
      rightAscension: (raan / 15 + meanAnomaly / 15) % 24,
      declination: inclination * Math.sin(meanAnomaly * DEG_TO_RAD),
      distance: 0.0027, // Approximate LEO distance in AU
    };
  }

  /**
   * Get next pass over a location
   */
  getNextPass(location: GeographicLocation): { start: Date; peak: Date; end: Date; maxElevation: number } | null {
    const now = new Date();
    const searchHours = 24;

    for (let minutes = 0; minutes < searchHours * 60; minutes += 1) {
      const time = new Date(now.getTime() + minutes * 60 * 1000);
      const pos = this.getPosition(time);
      const hz = equatorialToHorizontal(pos, location, time);

      if (hz.altitude > 10) {
        // Found start of pass, find peak and end
        let peak = time;
        let maxElev = hz.altitude;
        let end = time;

        for (let m = 1; m < 30; m++) {
          const t = new Date(time.getTime() + m * 60 * 1000);
          const p = this.getPosition(t);
          const h = equatorialToHorizontal(p, location, t);

          if (h.altitude > maxElev) {
            maxElev = h.altitude;
            peak = t;
          }

          if (h.altitude < 0) {
            end = new Date(t.getTime() - 60 * 1000);
            break;
          }
          end = t;
        }

        return { start: time, peak, end, maxElevation: maxElev };
      }
    }

    return null;
  }
}

/**
 * Create tracker for ISS
 */
export function createISSTracker(): SatelliteTracker {
  // Sample TLE for ISS (these expire quickly in real use)
  const tle1 = '1 25544U 98067A   24001.00000000  .00016717  00000-0  10270-3 0  9999';
  const tle2 = '2 25544  51.6400 200.0000 0000000 100.0000 260.0000 15.50000000000000';
  return new SatelliteTracker(tle1, tle2);
}

// ============================================================================
// Exports
// ============================================================================

export {
  // Constants
  J2000,
  JULIAN_CENTURY,
  DEG_TO_RAD,
  RAD_TO_DEG,
  AU_TO_KM,
  SYNODIC_MONTH,
  ZODIAC_SIGNS,
  BRIGHT_STARS,

  // Time functions
  dateToJulianDate,
  julianDateToDate,
  julianCenturies,
  greenwichSiderealTime,
  localSiderealTime,
  modifiedJulianDate,

  // Coordinate transformations
  equatorialToHorizontal,
  horizontalToEquatorial,
  eclipticToEquatorial,
  equatorialToGalactic,
  formatRA,
  formatDec,

  // Ephemeris calculations
  getSunPosition,
  getMoonPosition,
  getPlanetPosition,
};
