/**
 * Geolocation API
 *
 * GPS location services for mobile apps.
 */
import { signal, effect } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
// ============================================================================
// Geolocation State
// ============================================================================
/**
 * Current location signal
 */
export const currentLocation = signal(null);
/**
 * Location permission signal
 */
export const locationPermission = signal('undetermined');
/**
 * Location error signal
 */
export const locationError = signal(null);
/**
 * Watching state
 */
let watchId = null;
// ============================================================================
// Geolocation API
// ============================================================================
/**
 * Geolocation API singleton
 */
export const Geolocation = {
    /**
     * Request location permission
     */
    async requestPermission(type = 'whenInUse') {
        const platform = detectPlatform();
        if (platform === 'web') {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                locationPermission.set('granted');
                return 'granted';
            }
            catch (error) {
                const geoError = error;
                if (geoError.code === geoError.PERMISSION_DENIED) {
                    locationPermission.set('denied');
                    return 'denied';
                }
                return 'undetermined';
            }
        }
        const status = await nativeBridge.call('Geolocation', 'requestPermission', type);
        locationPermission.set(status);
        return status;
    },
    /**
     * Get permission status
     */
    async getPermissionStatus() {
        const platform = detectPlatform();
        if (platform === 'web') {
            try {
                const result = await navigator.permissions.query({ name: 'geolocation' });
                const status = result.state === 'granted' ? 'granted' :
                    result.state === 'denied' ? 'denied' : 'undetermined';
                locationPermission.set(status);
                return status;
            }
            catch {
                return 'undetermined';
            }
        }
        const status = await nativeBridge.call('Geolocation', 'getPermissionStatus');
        locationPermission.set(status);
        return status;
    },
    /**
     * Get current location
     */
    async getCurrentPosition(options) {
        const platform = detectPlatform();
        if (platform === 'web') {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition((position) => {
                    const result = convertWebPosition(position);
                    currentLocation.set(result);
                    locationError.set(null);
                    resolve(result);
                }, (error) => {
                    const err = new Error(error.message);
                    locationError.set(err);
                    reject(err);
                }, {
                    enableHighAccuracy: options?.accuracy === 'high' || options?.accuracy === 'highest',
                    timeout: 30000,
                    maximumAge: 0,
                });
            });
        }
        const result = await nativeBridge.call('Geolocation', 'getCurrentPosition', options);
        currentLocation.set(result);
        return result;
    },
    /**
     * Watch location changes
     */
    watchPosition(callback, errorCallback, options) {
        const platform = detectPlatform();
        if (platform === 'web') {
            watchId = navigator.geolocation.watchPosition((position) => {
                const result = convertWebPosition(position);
                currentLocation.set(result);
                locationError.set(null);
                callback(result);
            }, (error) => {
                const err = new Error(error.message);
                locationError.set(err);
                errorCallback?.(err);
            }, {
                enableHighAccuracy: options?.accuracy === 'high' || options?.accuracy === 'highest',
            });
            return () => {
                if (watchId !== null) {
                    navigator.geolocation.clearWatch(watchId);
                    watchId = null;
                }
            };
        }
        // Native watching
        nativeBridge.call('Geolocation', 'watchPosition', options);
        const unsubscribe = nativeBridge.on('locationUpdate', (location) => {
            currentLocation.set(location);
            callback(location);
        });
        const unsubscribeError = nativeBridge.on('locationError', (error) => {
            const err = new Error(error.message || 'Location error');
            locationError.set(err);
            errorCallback?.(err);
        });
        return () => {
            unsubscribe();
            unsubscribeError();
            nativeBridge.call('Geolocation', 'stopWatching');
        };
    },
    /**
     * Stop watching location
     */
    stopWatching() {
        const platform = detectPlatform();
        if (platform === 'web') {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
            }
        }
        else {
            nativeBridge.call('Geolocation', 'stopWatching');
        }
    },
    /**
     * Reverse geocode coordinates to address
     */
    async reverseGeocode(latitude, longitude) {
        const platform = detectPlatform();
        if (platform === 'web') {
            // Use a geocoding API (would need API key in production)
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                const data = await response.json();
                return [{
                        name: data.display_name,
                        street: data.address?.road,
                        city: data.address?.city || data.address?.town || data.address?.village,
                        region: data.address?.state,
                        country: data.address?.country,
                        postalCode: data.address?.postcode,
                        isoCountryCode: data.address?.country_code?.toUpperCase(),
                        formattedAddress: data.display_name,
                    }];
            }
            catch {
                return [];
            }
        }
        return nativeBridge.call('Geolocation', 'reverseGeocode', latitude, longitude);
    },
    /**
     * Geocode address to coordinates
     */
    async geocode(address) {
        const platform = detectPlatform();
        if (platform === 'web') {
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
                const data = await response.json();
                return data.map((item) => ({
                    latitude: parseFloat(item.lat),
                    longitude: parseFloat(item.lon),
                }));
            }
            catch {
                return [];
            }
        }
        return nativeBridge.call('Geolocation', 'geocode', address);
    },
    /**
     * Get heading (compass)
     */
    async getHeading() {
        const platform = detectPlatform();
        if (platform === 'web') {
            // Web doesn't have reliable heading API
            return {
                magneticHeading: 0,
                trueHeading: 0,
                headingAccuracy: -1,
                timestamp: Date.now(),
            };
        }
        return nativeBridge.call('Geolocation', 'getHeading');
    },
    /**
     * Watch heading changes
     */
    watchHeading(callback, errorCallback) {
        const platform = detectPlatform();
        if (platform === 'web') {
            // Limited web support via DeviceOrientation
            const handler = (event) => {
                callback({
                    magneticHeading: event.alpha || 0,
                    trueHeading: event.alpha || 0,
                    headingAccuracy: -1,
                    timestamp: Date.now(),
                });
            };
            window.addEventListener('deviceorientation', handler);
            return () => window.removeEventListener('deviceorientation', handler);
        }
        nativeBridge.call('Geolocation', 'watchHeading');
        const unsubscribe = nativeBridge.on('headingUpdate', callback);
        const unsubscribeError = nativeBridge.on('headingError', (error) => {
            errorCallback?.(new Error(error.message || 'Heading error'));
        });
        return () => {
            unsubscribe();
            unsubscribeError();
            nativeBridge.call('Geolocation', 'stopWatchingHeading');
        };
    },
    /**
     * Calculate distance between two points (in meters)
     */
    getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const phi1 = (lat1 * Math.PI) / 180;
        const phi2 = (lat2 * Math.PI) / 180;
        const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
        const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },
};
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Convert web GeolocationPosition to LocationResult
 */
function convertWebPosition(position) {
    return {
        coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            altitude: position.coords.altitude,
            accuracy: position.coords.accuracy,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
        },
        timestamp: position.timestamp,
        mocked: false,
    };
}
// ============================================================================
// Hooks
// ============================================================================
/**
 * Hook to get current location
 */
export function useLocation(options) {
    const location = currentLocation();
    const error = locationError();
    const loading = signal(false);
    const refresh = async () => {
        loading.set(true);
        try {
            await Geolocation.getCurrentPosition(options);
        }
        finally {
            loading.set(false);
        }
    };
    // Get initial location
    effect(() => {
        refresh();
    });
    return {
        location,
        error,
        loading: loading(),
        refresh,
    };
}
/**
 * Hook to watch location
 */
export function useWatchLocation(options) {
    effect(() => {
        const unsubscribe = Geolocation.watchPosition((loc) => currentLocation.set(loc), (err) => locationError.set(err), options);
        return unsubscribe;
    });
    return {
        location: currentLocation(),
        error: locationError(),
    };
}
// ============================================================================
// Export
// ============================================================================
export default Geolocation;
//# sourceMappingURL=Geolocation.js.map