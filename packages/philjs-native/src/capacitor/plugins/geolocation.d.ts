/**
 * PhilJS Native - Capacitor Geolocation Plugin
 *
 * Provides access to device location with support for
 * high accuracy, background tracking, and geocoding.
 */
import { type Signal } from 'philjs-core';
/**
 * Position coordinates
 */
export interface Coordinates {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
}
/**
 * Position result
 */
export interface Position {
    coords: Coordinates;
    timestamp: number;
}
/**
 * Position options
 */
export interface PositionOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
}
/**
 * Watch position options
 */
export interface WatchPositionOptions extends PositionOptions {
    /** Minimum distance in meters before an update is received */
    distanceFilter?: number;
    /** Whether to enable background location updates (requires permissions) */
    backgroundUpdates?: boolean;
}
/**
 * Geolocation permission status
 */
export type GeolocationPermissionState = 'prompt' | 'granted' | 'denied';
export interface GeolocationPermissions {
    location: GeolocationPermissionState;
    coarseLocation: GeolocationPermissionState;
}
/**
 * Geocoding result
 */
export interface GeocodingResult {
    latitude: number;
    longitude: number;
    formattedAddress: string;
    streetNumber?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    countryCode?: string;
}
/**
 * Current position signal
 */
export declare const currentPosition: Signal<Position | null>;
/**
 * Position error signal
 */
export declare const positionError: Signal<Error | null>;
/**
 * Permission state signal
 */
export declare const geolocationPermission: Signal<GeolocationPermissions>;
/**
 * Geolocation API
 */
export declare const CapacitorGeolocation: {
    /**
     * Get current position
     */
    getCurrentPosition(options?: PositionOptions): Promise<Position>;
    /**
     * Watch position changes
     */
    watchPosition(options: WatchPositionOptions | undefined, callback: (position: Position | null, error: Error | null) => void): string;
    /**
     * Clear a position watch
     */
    clearWatch(watchId: string): void;
    /**
     * Check geolocation permissions
     */
    checkPermissions(): Promise<GeolocationPermissions>;
    /**
     * Request geolocation permissions
     */
    requestPermissions(): Promise<GeolocationPermissions>;
    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
    /**
     * Reverse geocode coordinates to address
     */
    reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null>;
    /**
     * Forward geocode address to coordinates
     */
    geocode(address: string): Promise<GeocodingResult | null>;
};
/**
 * Hook to get current position
 */
export declare function useCurrentPosition(): Position | null;
/**
 * Hook to get position error
 */
export declare function usePositionError(): Error | null;
/**
 * Hook to get geolocation permissions
 */
export declare function useGeolocationPermissions(): GeolocationPermissions;
/**
 * Hook to watch position with auto-cleanup
 */
export declare function useWatchPosition(options?: WatchPositionOptions, callback?: (position: Position | null, error: Error | null) => void): Position | null;
export default CapacitorGeolocation;
//# sourceMappingURL=geolocation.d.ts.map