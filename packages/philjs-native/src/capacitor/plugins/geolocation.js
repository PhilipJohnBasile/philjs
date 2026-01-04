// @ts-nocheck
/**
 * PhilJS Native - Capacitor Geolocation Plugin
 *
 * Provides access to device location with support for
 * high accuracy, background tracking, and geocoding.
 */
import { signal, effect } from '@philjs/core';
import { isCapacitor, isNativePlatform, callPlugin, registerPlugin, } from '../index.js';
// ============================================================================
// State
// ============================================================================
/**
 * Current position signal
 */
export const currentPosition = signal(null);
/**
 * Position error signal
 */
export const positionError = signal(null);
/**
 * Permission state signal
 */
export const geolocationPermission = signal({
    location: 'prompt',
    coarseLocation: 'prompt',
});
/**
 * Active watch IDs
 */
const activeWatches = new Map();
// ============================================================================
// Web Implementation
// ============================================================================
const WebGeolocation = {
    async getCurrentPosition(options) {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            navigator.geolocation.getCurrentPosition((position) => {
                resolve({
                    coords: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        altitude: position.coords.altitude,
                        altitudeAccuracy: position.coords.altitudeAccuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                    },
                    timestamp: position.timestamp,
                });
            }, (error) => {
                reject(new Error(error.message));
            }, {
                enableHighAccuracy: options?.enableHighAccuracy ?? false,
                timeout: options?.timeout ?? 10000,
                maximumAge: options?.maximumAge ?? 0,
            });
        });
    },
    watchPosition(options, callback) {
        const watchId = navigator.geolocation.watchPosition((position) => {
            callback({
                coords: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                },
                timestamp: position.timestamp,
            }, null);
        }, (error) => {
            callback(null, new Error(error.message));
        }, {
            enableHighAccuracy: options?.enableHighAccuracy ?? false,
            timeout: options?.timeout ?? 10000,
            maximumAge: options?.maximumAge ?? 0,
        });
        return String(watchId);
    },
    clearWatch(watchId) {
        navigator.geolocation.clearWatch(Number(watchId));
    },
    async checkPermissions() {
        try {
            const result = await navigator.permissions.query({
                name: 'geolocation',
            });
            return {
                location: result.state,
                coarseLocation: result.state,
            };
        }
        catch {
            return { location: 'prompt', coarseLocation: 'prompt' };
        }
    },
    async requestPermissions() {
        try {
            // Trigger permission request by getting position
            await this.getCurrentPosition({ timeout: 5000 });
            return { location: 'granted', coarseLocation: 'granted' };
        }
        catch {
            return { location: 'denied', coarseLocation: 'denied' };
        }
    },
};
// ============================================================================
// Geolocation API
// ============================================================================
registerPlugin('Geolocation', { web: WebGeolocation });
/**
 * Geolocation API
 */
export const CapacitorGeolocation = {
    /**
     * Get current position
     */
    async getCurrentPosition(options) {
        try {
            let position;
            if (!isNativePlatform()) {
                position = await WebGeolocation.getCurrentPosition(options);
            }
            else {
                position = await callPlugin('Geolocation', 'getCurrentPosition', options);
            }
            currentPosition.set(position);
            positionError.set(null);
            return position;
        }
        catch (error) {
            const err = error;
            positionError.set(err);
            throw err;
        }
    },
    /**
     * Watch position changes
     */
    watchPosition(options, callback) {
        const watchId = `watch_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        if (!isNativePlatform()) {
            const nativeWatchId = WebGeolocation.watchPosition(options, (position, error) => {
                if (position) {
                    currentPosition.set(position);
                    positionError.set(null);
                }
                else if (error) {
                    positionError.set(error);
                }
                callback(position, error);
            });
            activeWatches.set(watchId, nativeWatchId);
        }
        else {
            // Native implementation
            callPlugin('Geolocation', 'watchPosition', options).then((nativeWatchId) => {
                activeWatches.set(watchId, nativeWatchId);
                // Set up listener for position updates
                const capacitor = window.Capacitor;
                if (capacitor?.Plugins?.Geolocation) {
                    capacitor.Plugins.Geolocation.addListener('watchPosition', (result) => {
                        if (result.position) {
                            currentPosition.set(result.position);
                            positionError.set(null);
                            callback(result.position, null);
                        }
                        else if (result.error) {
                            const error = new Error(result.error.message);
                            positionError.set(error);
                            callback(null, error);
                        }
                    });
                }
            });
        }
        return watchId;
    },
    /**
     * Clear a position watch
     */
    clearWatch(watchId) {
        const nativeWatchId = activeWatches.get(watchId);
        if (nativeWatchId === undefined)
            return;
        if (!isNativePlatform()) {
            WebGeolocation.clearWatch(String(nativeWatchId));
        }
        else {
            callPlugin('Geolocation', 'clearWatch', { id: nativeWatchId });
        }
        activeWatches.delete(watchId);
    },
    /**
     * Check geolocation permissions
     */
    async checkPermissions() {
        let permissions;
        if (!isNativePlatform()) {
            permissions = await WebGeolocation.checkPermissions();
        }
        else {
            permissions = await callPlugin('Geolocation', 'checkPermissions');
        }
        geolocationPermission.set(permissions);
        return permissions;
    },
    /**
     * Request geolocation permissions
     */
    async requestPermissions() {
        let permissions;
        if (!isNativePlatform()) {
            permissions = await WebGeolocation.requestPermissions();
        }
        else {
            permissions = await callPlugin('Geolocation', 'requestPermissions');
        }
        geolocationPermission.set(permissions);
        return permissions;
    },
    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const phi1 = (lat1 * Math.PI) / 180;
        const phi2 = (lat2 * Math.PI) / 180;
        const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
        const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) *
                Math.cos(phi2) *
                Math.sin(deltaLambda / 2) *
                Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in meters
    },
    /**
     * Reverse geocode coordinates to address
     */
    async reverseGeocode(latitude, longitude) {
        // Use native geocoding if available
        if (isNativePlatform()) {
            try {
                return await callPlugin('Geocoding', 'reverseGeocode', { latitude, longitude });
            }
            catch {
                // Fall back to web API
            }
        }
        // Use Nominatim (OpenStreetMap) for web
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const data = await response.json();
            return {
                latitude,
                longitude,
                formattedAddress: data.display_name,
                streetNumber: data.address?.house_number,
                street: data.address?.road,
                city: data.address?.city || data.address?.town || data.address?.village,
                state: data.address?.state,
                postalCode: data.address?.postcode,
                country: data.address?.country,
                countryCode: data.address?.country_code?.toUpperCase(),
            };
        }
        catch {
            return null;
        }
    },
    /**
     * Forward geocode address to coordinates
     */
    async geocode(address) {
        // Use native geocoding if available
        if (isNativePlatform()) {
            try {
                return await callPlugin('Geocoding', 'geocode', { address });
            }
            catch {
                // Fall back to web API
            }
        }
        // Use Nominatim (OpenStreetMap) for web
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
            const data = await response.json();
            if (data.length === 0)
                return null;
            const result = data[0];
            return {
                latitude: parseFloat(result.lat),
                longitude: parseFloat(result.lon),
                formattedAddress: result.display_name,
            };
        }
        catch {
            return null;
        }
    },
};
// ============================================================================
// Hooks
// ============================================================================
/**
 * Hook to get current position
 */
export function useCurrentPosition() {
    return currentPosition();
}
/**
 * Hook to get position error
 */
export function usePositionError() {
    return positionError();
}
/**
 * Hook to get geolocation permissions
 */
export function useGeolocationPermissions() {
    return geolocationPermission();
}
/**
 * Hook to watch position with auto-cleanup
 */
export function useWatchPosition(options, callback) {
    effect(() => {
        const watchId = CapacitorGeolocation.watchPosition(options, (position, error) => {
            callback?.(position, error);
        });
        return () => {
            CapacitorGeolocation.clearWatch(watchId);
        };
    });
    return currentPosition();
}
// ============================================================================
// Exports
// ============================================================================
export default CapacitorGeolocation;
//# sourceMappingURL=geolocation.js.map