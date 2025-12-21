/**
 * Geolocation API
 *
 * GPS location services for mobile apps.
 */

import { signal, effect, type Signal } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Location permission status
 */
export type LocationPermissionStatus =
  | 'granted'
  | 'denied'
  | 'undetermined'
  | 'restricted'
  | 'limited';

/**
 * Location accuracy
 */
export type LocationAccuracy =
  | 'lowest'
  | 'low'
  | 'balanced'
  | 'high'
  | 'highest'
  | 'bestForNavigation';

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

// ============================================================================
// Geolocation State
// ============================================================================

/**
 * Current location signal
 */
export const currentLocation: Signal<LocationResult | null> = signal(null);

/**
 * Location permission signal
 */
export const locationPermission: Signal<LocationPermissionStatus> = signal('undetermined');

/**
 * Location error signal
 */
export const locationError: Signal<Error | null> = signal(null);

/**
 * Watching state
 */
let watchId: number | null = null;

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
  async requestPermission(
    type: 'whenInUse' | 'always' = 'whenInUse'
  ): Promise<LocationPermissionStatus> {
    const platform = detectPlatform();

    if (platform === 'web') {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        locationPermission.set('granted');
        return 'granted';
      } catch (error) {
        const geoError = error as GeolocationPositionError;
        if (geoError.code === geoError.PERMISSION_DENIED) {
          locationPermission.set('denied');
          return 'denied';
        }
        return 'undetermined';
      }
    }

    const status = await nativeBridge.call<LocationPermissionStatus>(
      'Geolocation',
      'requestPermission',
      type
    );
    locationPermission.set(status);
    return status;
  },

  /**
   * Get permission status
   */
  async getPermissionStatus(): Promise<LocationPermissionStatus> {
    const platform = detectPlatform();

    if (platform === 'web') {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        const status = result.state === 'granted' ? 'granted' :
                       result.state === 'denied' ? 'denied' : 'undetermined';
        locationPermission.set(status);
        return status;
      } catch {
        return 'undetermined';
      }
    }

    const status = await nativeBridge.call<LocationPermissionStatus>(
      'Geolocation',
      'getPermissionStatus'
    );
    locationPermission.set(status);
    return status;
  },

  /**
   * Get current location
   */
  async getCurrentPosition(options?: LocationOptions): Promise<LocationResult> {
    const platform = detectPlatform();

    if (platform === 'web') {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const result = convertWebPosition(position);
            currentLocation.set(result);
            locationError.set(null);
            resolve(result);
          },
          (error) => {
            const err = new Error(error.message);
            locationError.set(err);
            reject(err);
          },
          {
            enableHighAccuracy: options?.accuracy === 'high' || options?.accuracy === 'highest',
            timeout: 30000,
            maximumAge: 0,
          }
        );
      });
    }

    const result = await nativeBridge.call<LocationResult>(
      'Geolocation',
      'getCurrentPosition',
      options
    );
    currentLocation.set(result);
    return result;
  },

  /**
   * Watch location changes
   */
  watchPosition(
    callback: (location: LocationResult) => void,
    errorCallback?: (error: Error) => void,
    options?: LocationOptions
  ): () => void {
    const platform = detectPlatform();

    if (platform === 'web') {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const result = convertWebPosition(position);
          currentLocation.set(result);
          locationError.set(null);
          callback(result);
        },
        (error) => {
          const err = new Error(error.message);
          locationError.set(err);
          errorCallback?.(err);
        },
        {
          enableHighAccuracy: options?.accuracy === 'high' || options?.accuracy === 'highest',
        }
      );

      return () => {
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
          watchId = null;
        }
      };
    }

    // Native watching
    nativeBridge.call('Geolocation', 'watchPosition', options);

    const unsubscribe = nativeBridge.on('locationUpdate', (location: LocationResult) => {
      currentLocation.set(location);
      callback(location);
    });

    const unsubscribeError = nativeBridge.on('locationError', (error: any) => {
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
  stopWatching(): void {
    const platform = detectPlatform();

    if (platform === 'web') {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
    } else {
      nativeBridge.call('Geolocation', 'stopWatching');
    }
  },

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<GeocodingResult[]> {
    const platform = detectPlatform();

    if (platform === 'web') {
      // Use a geocoding API (would need API key in production)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
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
      } catch {
        return [];
      }
    }

    return nativeBridge.call<GeocodingResult[]>(
      'Geolocation',
      'reverseGeocode',
      latitude,
      longitude
    );
  },

  /**
   * Geocode address to coordinates
   */
  async geocode(address: string): Promise<{ latitude: number; longitude: number }[]> {
    const platform = detectPlatform();

    if (platform === 'web') {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
        );
        const data = await response.json();

        return data.map((item: any) => ({
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        }));
      } catch {
        return [];
      }
    }

    return nativeBridge.call('Geolocation', 'geocode', address);
  },

  /**
   * Get heading (compass)
   */
  async getHeading(): Promise<HeadingResult> {
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

    return nativeBridge.call<HeadingResult>('Geolocation', 'getHeading');
  },

  /**
   * Watch heading changes
   */
  watchHeading(
    callback: (heading: HeadingResult) => void,
    errorCallback?: (error: Error) => void
  ): () => void {
    const platform = detectPlatform();

    if (platform === 'web') {
      // Limited web support via DeviceOrientation
      const handler = (event: DeviceOrientationEvent) => {
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
    const unsubscribeError = nativeBridge.on('headingError', (error: any) => {
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
  getDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
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
function convertWebPosition(position: GeolocationPosition): LocationResult {
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
export function useLocation(options?: LocationOptions): {
  location: LocationResult | null;
  error: Error | null;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const location = currentLocation();
  const error = locationError();
  const loading = signal(false);

  const refresh = async () => {
    loading.set(true);
    try {
      await Geolocation.getCurrentPosition(options);
    } finally {
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
export function useWatchLocation(options?: LocationOptions): {
  location: LocationResult | null;
  error: Error | null;
} {
  effect(() => {
    const unsubscribe = Geolocation.watchPosition(
      (loc) => currentLocation.set(loc),
      (err) => locationError.set(err),
      options
    );

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
