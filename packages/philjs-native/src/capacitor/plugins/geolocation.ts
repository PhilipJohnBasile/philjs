// @ts-nocheck
/**
 * PhilJS Native - Capacitor Geolocation Plugin
 *
 * Provides access to device location with support for
 * high accuracy, background tracking, and geocoding.
 */

import { signal, effect, type Signal } from '@philjs/core';
import {
  isCapacitor,
  isNativePlatform,
  callPlugin,
  registerPlugin,
} from '../index.js';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// State
// ============================================================================

/**
 * Current position signal
 */
export const currentPosition: Signal<Position | null> = signal(null);

/**
 * Position error signal
 */
export const positionError: Signal<Error | null> = signal(null);

/**
 * Permission state signal
 */
export const geolocationPermission: Signal<GeolocationPermissions> = signal({
  location: 'prompt',
  coarseLocation: 'prompt',
});

/**
 * Active watch IDs
 */
const activeWatches = new Map<string, string | number>();

// ============================================================================
// Web Implementation
// ============================================================================

const WebGeolocation = {
  async getCurrentPosition(options?: PositionOptions): Promise<Position> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
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
        },
        (error) => {
          reject(new Error(error.message));
        },
        {
          enableHighAccuracy: options?.enableHighAccuracy ?? false,
          timeout: options?.timeout ?? 10000,
          maximumAge: options?.maximumAge ?? 0,
        }
      );
    });
  },

  watchPosition(
    options: WatchPositionOptions | undefined,
    callback: (position: Position | null, error: Error | null) => void
  ): string {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        callback(
          {
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
          },
          null
        );
      },
      (error) => {
        callback(null, new Error(error.message));
      },
      {
        enableHighAccuracy: options?.enableHighAccuracy ?? false,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 0,
      }
    );

    return String(watchId);
  },

  clearWatch(watchId: string): void {
    navigator.geolocation.clearWatch(Number(watchId));
  },

  async checkPermissions(): Promise<GeolocationPermissions> {
    try {
      const result = await navigator.permissions.query({
        name: 'geolocation' as PermissionName,
      });
      return {
        location: result.state as GeolocationPermissionState,
        coarseLocation: result.state as GeolocationPermissionState,
      };
    } catch {
      return { location: 'prompt', coarseLocation: 'prompt' };
    }
  },

  async requestPermissions(): Promise<GeolocationPermissions> {
    try {
      // Trigger permission request by getting position
      await this.getCurrentPosition({ timeout: 5000 });
      return { location: 'granted', coarseLocation: 'granted' };
    } catch {
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
  async getCurrentPosition(options?: PositionOptions): Promise<Position> {
    try {
      let position: Position;

      if (!isNativePlatform()) {
        position = await WebGeolocation.getCurrentPosition(options);
      } else {
        position = await callPlugin<PositionOptions | undefined, Position>(
          'Geolocation',
          'getCurrentPosition',
          options
        );
      }

      currentPosition.set(position);
      positionError.set(null);
      return position;
    } catch (error) {
      const err = error as Error;
      positionError.set(err);
      throw err;
    }
  },

  /**
   * Watch position changes
   */
  watchPosition(
    options: WatchPositionOptions | undefined,
    callback: (position: Position | null, error: Error | null) => void
  ): string {
    const watchId = `watch_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    if (!isNativePlatform()) {
      const nativeWatchId = WebGeolocation.watchPosition(options, (position, error) => {
        if (position) {
          currentPosition.set(position);
          positionError.set(null);
        } else if (error) {
          positionError.set(error);
        }
        callback(position, error);
      });
      activeWatches.set(watchId, nativeWatchId);
    } else {
      // Native implementation
      callPlugin('Geolocation', 'watchPosition', options).then((nativeWatchId) => {
        activeWatches.set(watchId, nativeWatchId as string);

        // Set up listener for position updates
        const capacitor = (window as any).Capacitor;
        if (capacitor?.Plugins?.Geolocation) {
          capacitor.Plugins.Geolocation.addListener(
            'watchPosition',
            (result: { position?: Position; error?: { message: string } }) => {
              if (result.position) {
                currentPosition.set(result.position);
                positionError.set(null);
                callback(result.position, null);
              } else if (result.error) {
                const error = new Error(result.error.message);
                positionError.set(error);
                callback(null, error);
              }
            }
          );
        }
      });
    }

    return watchId;
  },

  /**
   * Clear a position watch
   */
  clearWatch(watchId: string): void {
    const nativeWatchId = activeWatches.get(watchId);
    if (nativeWatchId === undefined) return;

    if (!isNativePlatform()) {
      WebGeolocation.clearWatch(String(nativeWatchId));
    } else {
      callPlugin('Geolocation', 'clearWatch', { id: nativeWatchId });
    }

    activeWatches.delete(watchId);
  },

  /**
   * Check geolocation permissions
   */
  async checkPermissions(): Promise<GeolocationPermissions> {
    let permissions: GeolocationPermissions;

    if (!isNativePlatform()) {
      permissions = await WebGeolocation.checkPermissions();
    } else {
      permissions = await callPlugin<never, GeolocationPermissions>(
        'Geolocation',
        'checkPermissions'
      );
    }

    geolocationPermission.set(permissions);
    return permissions;
  },

  /**
   * Request geolocation permissions
   */
  async requestPermissions(): Promise<GeolocationPermissions> {
    let permissions: GeolocationPermissions;

    if (!isNativePlatform()) {
      permissions = await WebGeolocation.requestPermissions();
    } else {
      permissions = await callPlugin<never, GeolocationPermissions>(
        'Geolocation',
        'requestPermissions'
      );
    }

    geolocationPermission.set(permissions);
    return permissions;
  },

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(
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
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<GeocodingResult | null> {
    // Use native geocoding if available
    if (isNativePlatform()) {
      try {
        return await callPlugin<{ latitude: number; longitude: number }, GeocodingResult>(
          'Geocoding',
          'reverseGeocode',
          { latitude, longitude }
        );
      } catch {
        // Fall back to web API
      }
    }

    // Use Nominatim (OpenStreetMap) for web
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
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
    } catch {
      return null;
    }
  },

  /**
   * Forward geocode address to coordinates
   */
  async geocode(address: string): Promise<GeocodingResult | null> {
    // Use native geocoding if available
    if (isNativePlatform()) {
      try {
        return await callPlugin<{ address: string }, GeocodingResult>(
          'Geocoding',
          'geocode',
          { address }
        );
      } catch {
        // Fall back to web API
      }
    }

    // Use Nominatim (OpenStreetMap) for web
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`
      );
      const data = await response.json();

      if (data.length === 0) return null;

      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formattedAddress: result.display_name,
      };
    } catch {
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
export function useCurrentPosition(): Position | null {
  return currentPosition();
}

/**
 * Hook to get position error
 */
export function usePositionError(): Error | null {
  return positionError();
}

/**
 * Hook to get geolocation permissions
 */
export function useGeolocationPermissions(): GeolocationPermissions {
  return geolocationPermission();
}

/**
 * Hook to watch position with auto-cleanup
 */
export function useWatchPosition(
  options?: WatchPositionOptions,
  callback?: (position: Position | null, error: Error | null) => void
): Position | null {
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
