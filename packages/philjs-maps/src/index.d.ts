/**
 * PhilJS Maps - Provider-Agnostic Map Components
 *
 * A comprehensive maps package supporting Google Maps, Mapbox, and Leaflet
 * with a unified API, reactive signals, accessibility support, and clustering.
 *
 * @packageDocumentation
 */
export * from './types.js';
export * from './utils/index.js';
export * from './utils/cluster.js';
import type { MapProps, MarkerProps, PolylineProps, PolygonProps, PopupProps, MapInstance, MapProvider, LatLng, GeolocationOptions, GeolocationState, MapContextValue } from './types.js';
type SignalGetter<T> = () => T;
type SignalSetter<T> = (value: T | ((prev: T) => T)) => void;
type Signal<T> = SignalGetter<T> & {
    set: SignalSetter<T>;
    subscribe: (fn: () => void) => () => void;
};
/**
 * Get the current map context
 */
export declare function useMapContext(): MapContextValue;
/**
 * Create a Map component with the specified provider
 *
 * @example
 * ```tsx
 * const { Map, Marker, Popup } = createMap({ provider: 'google', apiKey: 'YOUR_KEY' });
 *
 * function App() {
 *   return (
 *     <Map center={{ lat: 40.7128, lng: -74.006 }} zoom={12}>
 *       <Marker position={{ lat: 40.7128, lng: -74.006 }} title="NYC">
 *         <Popup>Hello New York!</Popup>
 *       </Marker>
 *     </Map>
 *   );
 * }
 * ```
 */
export declare function createMap(config: {
    provider: MapProvider;
    apiKey?: string;
}): {
    Map: (props: MapProps) => HTMLElement;
    Marker: (props: MarkerProps) => {
        remove: () => void;
        update: (props: Partial<MarkerProps>) => void;
    };
    Popup: (props: PopupProps) => {
        remove: () => void;
        open: () => void;
        close: () => void;
    };
    Polyline: (props: PolylineProps) => {
        remove: () => void;
        setPath: (path: LatLng[]) => void;
    };
    Polygon: (props: PolygonProps) => {
        remove: () => void;
        setPath: (path: LatLng[]) => void;
    };
    mapInstance: Signal<MapInstance | null>;
    isLoaded: Signal<boolean>;
    error: Signal<Error | null>;
};
/**
 * Hook for accessing device geolocation
 *
 * @example
 * ```typescript
 * const { position, loading, error, getCurrentPosition, watchPosition } = useGeolocation();
 *
 * // Get current position once
 * await getCurrentPosition();
 *
 * // Or watch position continuously
 * watchPosition();
 * ```
 */
export declare function useGeolocation(options?: GeolocationOptions): {
    position: Signal<GeolocationState['position']>;
    loading: Signal<boolean>;
    error: Signal<GeolocationState['error']>;
    getCurrentPosition: () => Promise<GeolocationPosition | null>;
    watchPosition: () => () => void;
};
/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in meters
 */
export declare function calculateDistance(from: LatLng, to: LatLng): number;
/**
 * Calculate bearing between two points
 * @returns Bearing in degrees (0-360)
 */
export declare function calculateBearing(from: LatLng, to: LatLng): number;
/**
 * Calculate destination point given start point, bearing, and distance
 */
export declare function destinationPoint(from: LatLng, bearing: number, distance: number): LatLng;
/**
 * Check if a point is within a polygon
 */
export declare function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean;
/**
 * Calculate the center of a set of points
 */
export declare function getCenterOfPoints(points: LatLng[]): LatLng;
/**
 * Format distance for display
 */
export declare function formatDistance(meters: number, units?: 'metric' | 'imperial'): string;
//# sourceMappingURL=index.d.ts.map