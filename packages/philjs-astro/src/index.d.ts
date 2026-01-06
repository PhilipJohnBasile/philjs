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
import { type Signal, type Computed } from '@philjs/core';
export type CelestialBody = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';
export type ZodiacSign = 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';
export type MoonPhaseName = 'new_moon' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous' | 'full_moon' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';
export interface EquatorialCoordinates {
    rightAscension: number;
    declination: number;
    distance: number;
}
export interface HorizontalCoordinates {
    altitude: number;
    azimuth: number;
}
export interface EclipticCoordinates {
    longitude: number;
    latitude: number;
    distance: number;
}
export interface GalacticCoordinates {
    longitude: number;
    latitude: number;
}
export interface GeographicLocation {
    latitude: number;
    longitude: number;
    elevation?: number;
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
    mass: number;
    radius: number;
    semiMajorAxis: number;
    eccentricity: number;
    inclination: number;
    orbitalPeriod: number;
    rotationPeriod: number;
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
    distance: number;
    color: string;
}
export interface ConstellationData {
    name: string;
    abbreviation: string;
    genitive: string;
    family: string;
    area: number;
    brightestStar: string;
    stars: string[];
    mythology: string;
}
export interface MoonPhaseData {
    name: MoonPhaseName;
    displayName: string;
    illumination: number;
    age: number;
    emoji: string;
    description: string;
}
export interface EclipseData {
    type: 'solar_total' | 'solar_partial' | 'solar_annular' | 'lunar_total' | 'lunar_partial' | 'lunar_penumbral';
    date: Date;
    peakTime: Date;
    duration: number;
    magnitude: number;
    visibility: string[];
    sarosNumber: number;
}
export interface SatelliteData {
    name: string;
    noradId: number;
    tle1: string;
    tle2: string;
    altitude: number;
    velocity: number;
    period: number;
}
export interface AstronomyState {
    location: GeographicLocation;
    time: Date;
    planets: Map<CelestialBody, EquatorialCoordinates>;
    moonPhase: MoonPhaseData;
    siderealTime: number;
    julianDate: number;
}
declare const J2000 = 2451545;
declare const JULIAN_CENTURY = 36525;
declare const DEG_TO_RAD: number;
declare const RAD_TO_DEG: number;
declare const AU_TO_KM = 149597870.7;
declare const SYNODIC_MONTH = 29.530588853;
export declare const PLANET_DATA: Record<CelestialBody, PlanetData>;
declare const ZODIAC_SIGNS: Record<ZodiacSign, {
    start: number;
    end: number;
    symbol: string;
    element: string;
}>;
declare const BRIGHT_STARS: StarData[];
/**
 * Convert a JavaScript Date to Julian Date
 */
export declare function dateToJulianDate(date: Date): number;
/**
 * Convert Julian Date to JavaScript Date
 */
export declare function julianDateToDate(jd: number): Date;
/**
 * Get Julian centuries since J2000
 */
export declare function julianCenturies(date: Date): number;
/**
 * Calculate Greenwich Mean Sidereal Time
 */
export declare function greenwichSiderealTime(date: Date): number;
/**
 * Calculate Local Sidereal Time
 */
export declare function localSiderealTime(date: Date, longitude: number): number;
/**
 * Get Modified Julian Date
 */
export declare function modifiedJulianDate(date: Date): number;
/**
 * Convert equatorial coordinates to horizontal coordinates
 */
export declare function equatorialToHorizontal(eq: EquatorialCoordinates, location: GeographicLocation, date: Date): HorizontalCoordinates;
/**
 * Convert horizontal coordinates to equatorial coordinates
 */
export declare function horizontalToEquatorial(hz: HorizontalCoordinates, location: GeographicLocation, date: Date): EquatorialCoordinates;
/**
 * Convert ecliptic coordinates to equatorial coordinates
 */
export declare function eclipticToEquatorial(ecl: EclipticCoordinates, date: Date): EquatorialCoordinates;
/**
 * Convert equatorial coordinates to galactic coordinates
 */
export declare function equatorialToGalactic(eq: EquatorialCoordinates): GalacticCoordinates;
/**
 * Format RA as hours, minutes, seconds
 */
export declare function formatRA(hours: number): string;
/**
 * Format declination as degrees, arcminutes, arcseconds
 */
export declare function formatDec(degrees: number): string;
/**
 * Calculate position of the Sun
 */
export declare function getSunPosition(date: Date): EquatorialCoordinates;
/**
 * Calculate position of the Moon
 */
export declare function getMoonPosition(date: Date): EquatorialCoordinates;
/**
 * Calculate approximate planet position using simplified Keplerian elements
 */
export declare function getPlanetPosition(body: CelestialBody, date: Date): EquatorialCoordinates;
export declare const MoonPhase: {
    /**
     * Get current moon phase
     */
    current(): MoonPhaseData;
    /**
     * Get moon phase for a specific date
     */
    forDate(date: Date): MoonPhaseData;
    /**
     * Get next new moon
     */
    nextNewMoon(from?: Date): Date;
    /**
     * Get next full moon
     */
    nextFullMoon(from?: Date): Date;
    /**
     * Get all moon phases for a month
     */
    forMonth(year: number, month: number): Array<{
        date: Date;
        phase: MoonPhaseData;
    }>;
};
export declare class Ephemeris {
    private location;
    private date;
    constructor(location?: GeographicLocation, date?: Date);
    /**
     * Set observer location
     */
    setLocation(location: GeographicLocation): this;
    /**
     * Set observation time
     */
    setDate(date: Date): this;
    /**
     * Get position of a celestial body
     */
    getPosition(body: CelestialBody): EquatorialCoordinates;
    /**
     * Get horizontal coordinates for a body
     */
    getHorizontalPosition(body: CelestialBody): HorizontalCoordinates;
    /**
     * Calculate rise, transit, and set times
     */
    getRiseTransitSet(body: CelestialBody): {
        rise: Date | null;
        transit: Date;
        set: Date | null;
    };
    /**
     * Check if body is visible (above horizon)
     */
    isVisible(body: CelestialBody): boolean;
    /**
     * Get angular separation between two bodies
     */
    getAngularSeparation(body1: CelestialBody, body2: CelestialBody): number;
    /**
     * Get next eclipse
     */
    static nextEclipse(type?: 'solar' | 'lunar'): EclipseData;
    /**
     * Get planet data
     */
    static getPlanetData(body: CelestialBody): PlanetData;
    /**
     * Format position for display
     */
    formatPosition(body: CelestialBody): {
        ra: string;
        dec: string;
        distance: string;
    };
}
export declare const SolarSystem: {
    /**
     * Get all planet positions
     */
    getAllPositions(date?: Date): Map<CelestialBody, EquatorialCoordinates>;
    /**
     * Get zodiac sign for ecliptic longitude
     */
    getZodiacSign(longitude: number): ZodiacSign;
    /**
     * Get zodiac sign data
     */
    getZodiacData(sign: ZodiacSign): (typeof ZODIAC_SIGNS)[ZodiacSign];
    /**
     * Find conjunctions between planets
     */
    findConjunctions(startDate: Date, endDate: Date, threshold?: number): CelestialEvent[];
    /**
     * Get visible planets tonight
     */
    getVisiblePlanets(location: GeographicLocation, date?: Date): CelestialBody[];
};
export declare const StarCatalog: {
    /**
     * Get all bright stars
     */
    getBrightStars(): StarData[];
    /**
     * Find stars by constellation
     */
    byConstellation(constellation: string): StarData[];
    /**
     * Find stars by magnitude limit
     */
    byMagnitude(limit: number): StarData[];
    /**
     * Get star by name
     */
    getByName(name: string): StarData | undefined;
    /**
     * Find stars near a position
     */
    findNear(ra: number, dec: number, radius?: number): StarData[];
};
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
export declare function createAstronomyStore(initialLocation?: GeographicLocation, autoUpdate?: boolean, updateIntervalMs?: number): AstronomyStore;
/**
 * Hook to access astronomy state
 */
export declare function useAstronomy(): AstronomyStore;
/**
 * Hook to track planet position
 */
export declare function usePlanetPosition(body: CelestialBody): Computed<EquatorialCoordinates>;
/**
 * Hook to track moon phase
 */
export declare function useMoonPhase(): Computed<MoonPhaseData>;
/**
 * Hook to track sidereal time
 */
export declare function useSiderealTime(): Computed<number>;
/**
 * Hook for horizontal coordinates
 */
export declare function useHorizontalPosition(body: CelestialBody): Computed<HorizontalCoordinates>;
/**
 * Hook to check visibility
 */
export declare function useIsVisible(body: CelestialBody): Computed<boolean>;
/**
 * Hook for rise/transit/set times
 */
export declare function useRiseTransitSet(body: CelestialBody): Computed<{
    rise: Date | null;
    transit: Date;
    set: Date | null;
}>;
/**
 * Set observer location globally
 */
export declare function setObserverLocation(location: GeographicLocation): void;
/**
 * Enable/disable auto-update
 */
export declare function setAutoUpdate(enabled: boolean, intervalMs?: number): void;
export declare class SatelliteTracker {
    private tle1;
    private tle2;
    constructor(tle1: string, tle2: string);
    /**
     * Parse TLE epoch
     */
    private parseEpoch;
    /**
     * Get satellite position (simplified SGP4)
     */
    getPosition(date: Date): EquatorialCoordinates;
    /**
     * Get next pass over a location
     */
    getNextPass(location: GeographicLocation): {
        start: Date;
        peak: Date;
        end: Date;
        maxElevation: number;
    } | null;
}
/**
 * Create tracker for ISS
 */
export declare function createISSTracker(): SatelliteTracker;
export { J2000, JULIAN_CENTURY, DEG_TO_RAD, RAD_TO_DEG, AU_TO_KM, SYNODIC_MONTH, ZODIAC_SIGNS, BRIGHT_STARS, dateToJulianDate, julianDateToDate, julianCenturies, greenwichSiderealTime, localSiderealTime, modifiedJulianDate, equatorialToHorizontal, horizontalToEquatorial, eclipticToEquatorial, equatorialToGalactic, formatRA, formatDec, getSunPosition, getMoonPosition, getPlanetPosition, };
//# sourceMappingURL=index.d.ts.map