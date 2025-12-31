/**
 * Geolocation API
 *
 * GPS location services for mobile apps.
 */
import { type Signal } from 'philjs-core';
/**
 * Location permission status
 */
export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'restricted' | 'limited';
/**
 * Location accuracy
 */
export type LocationAccuracy = 'lowest' | 'low' | 'balanced' | 'high' | 'highest' | 'bestForNavigation';
/**
 * Location coordinates
 */
export interface LocationCoordinates {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
}
/**
 * Location result
 */
export interface LocationResult {
    coords: LocationCoordinates;
    timestamp: number;
    mocked?: boolean;
}
/**
 * Location options
 */
export interface LocationOptions {
    accuracy?: LocationAccuracy;
    distanceFilter?: number;
    timeInterval?: number;
    showsBackgroundLocationIndicator?: boolean;
    pausesUpdatesAutomatically?: boolean;
    activityType?: 'other' | 'automotiveNavigation' | 'fitness' | 'otherNavigation' | 'airborne';
}
/**
 * Geocoding result
 */
export interface GeocodingResult {
    name?: string;
    street?: string;
    city?: string;
    region?: string;
    country?: string;
    postalCode?: string;
    isoCountryCode?: string;
    timezone?: string;
    formattedAddress?: string;
}
/**
 * Heading result
 */
export interface HeadingResult {
    magneticHeading: number;
    trueHeading: number;
    headingAccuracy: number;
    timestamp: number;
}
/**
 * Current location signal
 */
export declare const currentLocation: Signal<LocationResult | null>;
/**
 * Location permission signal
 */
export declare const locationPermission: Signal<LocationPermissionStatus>;
/**
 * Location error signal
 */
export declare const locationError: Signal<Error | null>;
/**
 * Geolocation API singleton
 */
export declare const Geolocation: {
    /**
     * Request location permission
     */
    requestPermission(type?: "whenInUse" | "always"): Promise<LocationPermissionStatus>;
    /**
     * Get permission status
     */
    getPermissionStatus(): Promise<LocationPermissionStatus>;
    /**
     * Get current location
     */
    getCurrentPosition(options?: LocationOptions): Promise<LocationResult>;
    /**
     * Watch location changes
     */
    watchPosition(callback: (location: LocationResult) => void, errorCallback?: (error: Error) => void, options?: LocationOptions): () => void;
    /**
     * Stop watching location
     */
    stopWatching(): void;
    /**
     * Reverse geocode coordinates to address
     */
    reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult[]>;
    /**
     * Geocode address to coordinates
     */
    geocode(address: string): Promise<{
        latitude: number;
        longitude: number;
    }[]>;
    /**
     * Get heading (compass)
     */
    getHeading(): Promise<HeadingResult>;
    /**
     * Watch heading changes
     */
    watchHeading(callback: (heading: HeadingResult) => void, errorCallback?: (error: Error) => void): () => void;
    /**
     * Calculate distance between two points (in meters)
     */
    getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
};
/**
 * Hook to get current location
 */
export declare function useLocation(options?: LocationOptions): {
    location: LocationResult | null;
    error: Error | null;
    loading: boolean;
    refresh: () => Promise<void>;
};
/**
 * Hook to watch location
 */
export declare function useWatchLocation(options?: LocationOptions): {
    location: LocationResult | null;
    error: Error | null;
};
export default Geolocation;
//# sourceMappingURL=Geolocation.d.ts.map