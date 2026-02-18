/**
 * @philjs/geo - Comprehensive Geospatial Computing Library
 *
 * Production-ready geospatial analysis with reactive state management,
 * advanced algorithms, and integration with mapping services.
 */
import { type Signal, type Memo } from '@philjs/core';
/** Geographic coordinate as [longitude, latitude] */
export type Point = [number, number];
/** 3D coordinate as [longitude, latitude, altitude] */
export type Point3D = [number, number, number];
/** Array of points forming a polygon boundary */
export type Polygon = Point[];
/** Array of polygons (for MultiPolygon support) */
export type MultiPolygon = Polygon[];
/** Linear ring (closed polygon boundary) */
export type LinearRing = Point[];
/** Line string (open path) */
export type LineString = Point[];
/** Multi-line string */
export type MultiLineString = LineString[];
/** Bounding box as [minLon, minLat, maxLon, maxLat] */
export type BoundingBox = [number, number, number, number];
/** 3D Bounding box with altitude */
export type BoundingBox3D = [number, number, number, number, number, number];
/** Distance unit types */
export type DistanceUnit = 'kilometers' | 'miles' | 'meters' | 'feet' | 'nautical_miles';
/** Area unit types */
export type AreaUnit = 'square_kilometers' | 'square_miles' | 'square_meters' | 'acres' | 'hectares';
/** Coordinate reference system */
export type CRS = 'EPSG:4326' | 'EPSG:3857' | 'EPSG:900913' | string;
/** GeoJSON geometry types */
export type GeoJSONGeometryType = 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon' | 'GeometryCollection';
/** GeoJSON Point geometry */
export interface GeoJSONPoint {
    type: 'Point';
    coordinates: Point;
}
/** GeoJSON MultiPoint geometry */
export interface GeoJSONMultiPoint {
    type: 'MultiPoint';
    coordinates: Point[];
}
/** GeoJSON LineString geometry */
export interface GeoJSONLineString {
    type: 'LineString';
    coordinates: Point[];
}
/** GeoJSON MultiLineString geometry */
export interface GeoJSONMultiLineString {
    type: 'MultiLineString';
    coordinates: Point[][];
}
/** GeoJSON Polygon geometry */
export interface GeoJSONPolygon {
    type: 'Polygon';
    coordinates: Point[][];
}
/** GeoJSON MultiPolygon geometry */
export interface GeoJSONMultiPolygon {
    type: 'MultiPolygon';
    coordinates: Point[][][];
}
/** GeoJSON GeometryCollection */
export interface GeoJSONGeometryCollection {
    type: 'GeometryCollection';
    geometries: GeoJSONGeometry[];
}
/** Union of all GeoJSON geometry types */
export type GeoJSONGeometry = GeoJSONPoint | GeoJSONMultiPoint | GeoJSONLineString | GeoJSONMultiLineString | GeoJSONPolygon | GeoJSONMultiPolygon | GeoJSONGeometryCollection;
/** GeoJSON Feature */
export interface GeoJSONFeature<G extends GeoJSONGeometry = GeoJSONGeometry, P = Record<string, unknown>> {
    type: 'Feature';
    id?: string | number;
    geometry: G;
    properties: P;
    bbox?: BoundingBox;
}
/** GeoJSON FeatureCollection */
export interface GeoJSONFeatureCollection<G extends GeoJSONGeometry = GeoJSONGeometry, P = Record<string, unknown>> {
    type: 'FeatureCollection';
    features: GeoJSONFeature<G, P>[];
    bbox?: BoundingBox;
}
/** Simplified GeoJSON type for backwards compatibility */
export type GeoJSON = GeoJSONGeometry | GeoJSONFeature | GeoJSONFeatureCollection;
/** Geocoding result */
export interface GeocodingResult {
    address: string;
    location: Point;
    confidence: number;
    placeId?: string;
    formattedAddress?: string;
    components?: {
        streetNumber?: string;
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
    };
    boundingBox?: BoundingBox;
}
/** Reverse geocoding result */
export interface ReverseGeocodingResult extends GeocodingResult {
    distance: number;
}
/** Route segment */
export interface RouteSegment {
    start: Point;
    end: Point;
    distance: number;
    duration: number;
    instruction?: string;
    roadName?: string;
    roadType?: string;
}
/** Route result */
export interface RouteResult {
    origin: Point;
    destination: Point;
    waypoints: Point[];
    segments: RouteSegment[];
    totalDistance: number;
    totalDuration: number;
    geometry: LineString;
    boundingBox: BoundingBox;
}
/** Isochrone result (areas reachable within time/distance) */
export interface IsochroneResult {
    center: Point;
    contours: Array<{
        value: number;
        unit: 'minutes' | 'kilometers';
        polygon: GeoJSONPolygon;
    }>;
}
/** Spatial index entry */
export interface SpatialIndexEntry<T = unknown> {
    id: string;
    geometry: GeoJSONGeometry;
    boundingBox: BoundingBox;
    data?: T;
}
/** Spatial query options */
export interface SpatialQueryOptions {
    limit?: number;
    offset?: number;
    withinDistance?: number;
    distanceUnit?: DistanceUnit;
}
/** Tile coordinates (for map tiles) */
export interface TileCoordinates {
    x: number;
    y: number;
    z: number;
}
/** Map viewport */
export interface MapViewport {
    center: Point;
    zoom: number;
    bearing?: number;
    pitch?: number;
    boundingBox: BoundingBox;
}
/** Cluster options */
export interface ClusterOptions {
    radius: number;
    minPoints?: number;
    maxZoom?: number;
    extent?: number;
}
/** Cluster result */
export interface ClusterResult {
    clusters: Array<{
        id: number;
        center: Point;
        count: number;
        expansion_zoom?: number;
        points: Point[];
    }>;
    noise: Point[];
}
/** Elevation data */
export interface ElevationData {
    location: Point;
    elevation: number;
    resolution?: number;
}
/** Terrain analysis result */
export interface TerrainAnalysis {
    slope: number;
    aspect: number;
    curvature: number;
    hillshade: number;
}
/** Weather data for location */
export interface LocationWeather {
    location: Point;
    temperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    conditions: string;
    timestamp: Date;
}
/** Time zone info */
export interface TimeZoneInfo {
    location: Point;
    timeZoneId: string;
    timeZoneName: string;
    utcOffset: number;
    dstOffset: number;
}
/** Earth radius in various units */
export declare const EARTH_RADIUS: {
    readonly kilometers: 6371.0088;
    readonly miles: 3958.7613;
    readonly meters: 6371008.8;
    readonly feet: 20902464.9;
    readonly nautical_miles: 3440.065;
};
/** Conversion factors between units */
export declare const UNIT_CONVERSION: {
    readonly kilometers_to_miles: 0.621371;
    readonly miles_to_kilometers: 1.60934;
    readonly meters_to_feet: 3.28084;
    readonly feet_to_meters: 0.3048;
    readonly kilometers_to_nautical_miles: 0.539957;
    readonly nautical_miles_to_kilometers: 1.852;
};
/** WGS84 ellipsoid parameters */
export declare const WGS84: {
    readonly semiMajorAxis: 6378137;
    readonly semiMinorAxis: 6356752.314245;
    readonly flattening: number;
    readonly eccentricitySquared: 0.00669437999014;
};
/** Convert degrees to radians */
export declare function toRadians(degrees: number): number;
/** Convert radians to degrees */
export declare function toDegrees(radians: number): number;
/** Normalize longitude to [-180, 180] */
export declare function normalizeLongitude(lon: number): number;
/** Normalize latitude to [-90, 90] */
export declare function normalizeLatitude(lat: number): number;
/** Validate coordinate */
export declare function isValidCoordinate(point: Point): boolean;
/** Convert distance between units */
export declare function convertDistance(value: number, from: DistanceUnit, to: DistanceUnit): number;
/**
 * Advanced Geospatial Analysis engine.
 * Implements comprehensive geodesic calculations and spatial algorithms.
 */
export declare class GeoSpatial {
    private static EARTH_RADIUS_KM;
    /**
     * Calculate Great Circle distance between two points (Haversine formula).
     * @param point1 [lon, lat]
     * @param point2 [lon, lat]
     * @param unit Distance unit (default: kilometers)
     * @returns Distance in specified units
     */
    static distance(point1: Point, point2: Point, unit?: DistanceUnit): number;
    /**
     * Calculate distance using Vincenty's formula (more accurate for long distances).
     */
    static vincentyDistance(point1: Point, point2: Point, unit?: DistanceUnit): number;
    /**
     * Calculate initial bearing from point1 to point2.
     */
    static bearing(point1: Point, point2: Point): number;
    /**
     * Calculate final bearing from point1 to point2.
     */
    static finalBearing(point1: Point, point2: Point): number;
    /**
     * Calculate midpoint between two points along great circle.
     */
    static midpoint(point1: Point, point2: Point): Point;
    /**
     * Calculate destination point given start point, bearing, and distance.
     */
    static destination(start: Point, bearing: number, distance: number, unit?: DistanceUnit): Point;
    /**
     * Check if a point is inside a polygon (Ray-casting algorithm).
     */
    static isPointInPolygon(point: Point, polygon: Polygon): boolean;
    /**
     * Check if point is inside polygon using winding number algorithm (handles complex polygons).
     */
    static isPointInPolygonWinding(point: Point, polygon: Polygon): boolean;
    private static isLeft;
    /**
     * Create a circular buffer (approximation) around a point.
     */
    static buffer(point: Point, distanceKm: number, steps?: number): GeoJSONPolygon;
    /**
     * Calculate the area of a polygon in specified units.
     */
    static polygonArea(polygon: Polygon, unit?: AreaUnit): number;
    /**
     * Calculate the perimeter (length) of a polygon or line.
     */
    static length(coordinates: Point[], unit?: DistanceUnit): number;
    /**
     * Calculate centroid of a polygon.
     */
    static centroid(polygon: Polygon): Point;
    /**
     * Calculate bounding box for a set of points.
     */
    static boundingBox(points: Point[]): BoundingBox;
    /**
     * Check if two bounding boxes intersect.
     */
    static bboxIntersects(bbox1: BoundingBox, bbox2: BoundingBox): boolean;
    /**
     * Check if a point is within a bounding box.
     */
    static pointInBBox(point: Point, bbox: BoundingBox): boolean;
    /**
     * Simplify a line using Douglas-Peucker algorithm.
     */
    static simplify(coordinates: Point[], tolerance?: number): Point[];
    private static perpendicularDistance;
    /**
     * Convert point to tile coordinates.
     */
    static pointToTile(point: Point, zoom: number): TileCoordinates;
    /**
     * Convert tile coordinates to point (center of tile).
     */
    static tileToPoint(tile: TileCoordinates): Point;
    /**
     * Calculate tile bounds.
     */
    static tileBounds(tile: TileCoordinates): BoundingBox;
    private static toRad;
    private static toDeg;
}
/**
 * R-Tree spatial index for efficient spatial queries.
 */
export declare class SpatialIndex<T = unknown> {
    private root;
    private maxEntries;
    private minEntries;
    constructor(maxEntries?: number);
    private createNode;
    private updateBBox;
    /**
     * Insert an entry into the index.
     */
    insert(entry: SpatialIndexEntry<T>): void;
    private insertEntry;
    private calculateEnlargement;
    /**
     * Search for entries intersecting a bounding box.
     */
    search(bbox: BoundingBox): SpatialIndexEntry<T>[];
    private searchNode;
    /**
     * Find k nearest neighbors to a point.
     */
    knn(point: Point, k: number): SpatialIndexEntry<T>[];
    private knnSearch;
    private distanceToEntry;
    private distanceToBBox;
    /**
     * Remove an entry by ID.
     */
    remove(id: string): boolean;
    private removeFromNode;
    /**
     * Clear all entries.
     */
    clear(): void;
    /**
     * Get all entries.
     */
    all(): SpatialIndexEntry<T>[];
    private collectAll;
}
/**
 * DBSCAN clustering algorithm for point data.
 */
export declare class DBSCANCluster {
    private epsilon;
    private minPoints;
    private distanceUnit;
    constructor(epsilon: number, minPoints?: number, distanceUnit?: DistanceUnit);
    /**
     * Cluster points using DBSCAN algorithm.
     */
    cluster(points: Point[]): ClusterResult;
    private rangeQuery;
    private calculateClusterCenter;
}
/**
 * K-Means clustering for geographic data.
 */
export declare class KMeansCluster {
    private k;
    private maxIterations;
    constructor(k: number, maxIterations?: number);
    /**
     * Cluster points using K-Means algorithm.
     */
    cluster(points: Point[]): ClusterResult;
    private initializeCentroids;
    private findNearestCentroid;
    private updateCentroids;
    private arraysEqual;
}
/**
 * Coordinate transformation utilities.
 */
export declare class CoordinateTransform {
    /**
     * Convert WGS84 to Web Mercator (EPSG:3857).
     */
    static toWebMercator(point: Point): Point;
    /**
     * Convert Web Mercator to WGS84.
     */
    static fromWebMercator(point: Point): Point;
    /**
     * Convert lat/lon to UTM coordinates.
     */
    static toUTM(point: Point): {
        easting: number;
        northing: number;
        zone: number;
        hemisphere: 'N' | 'S';
    };
    /**
     * Convert UTM to lat/lon.
     */
    static fromUTM(easting: number, northing: number, zone: number, hemisphere: 'N' | 'S'): Point;
}
interface GeoStoreState {
    currentLocation: Point | null;
    watchId: number | null;
    isTracking: boolean;
    locationHistory: Array<{
        point: Point;
        timestamp: Date;
    }>;
    geofences: Map<string, {
        polygon: Polygon;
        callback: (inside: boolean) => void;
    }>;
    spatialIndex: SpatialIndex<unknown>;
    viewport: MapViewport | null;
    selectedFeatures: string[];
    layers: Map<string, GeoJSONFeatureCollection>;
}
/**
 * Create a reactive geo store.
 */
export declare function createGeoStore(): {
    state: Signal<GeoStoreState>;
    currentLocation: Memo<Point>;
    isTracking: Memo<boolean>;
    locationHistory: Memo<{
        point: Point;
        timestamp: Date;
    }[]>;
    viewport: Memo<MapViewport>;
    selectedFeatures: Memo<string[]>;
    startTracking: (options?: PositionOptions) => Promise<void>;
    stopTracking: () => void;
    getCurrentLocation: (options?: PositionOptions) => Promise<Point>;
    addGeofence: (id: string, polygon: Polygon, callback: (inside: boolean) => void) => void;
    removeGeofence: (id: string) => void;
    setViewport: (viewport: MapViewport) => void;
    addLayer: (id: string, collection: GeoJSONFeatureCollection) => void;
    removeLayer: (id: string) => void;
    selectFeatures: (ids: string[]) => void;
    queryFeatures: (bbox: BoundingBox) => SpatialIndexEntry<unknown>[];
    findNearest: (point: Point, k?: number) => SpatialIndexEntry<unknown>[];
};
/**
 * Hook for geolocation tracking.
 */
export declare function useGeolocation(options?: PositionOptions): {
    location: Signal<Point>;
    error: Signal<GeolocationPositionError>;
    isLoading: Signal<boolean>;
    accuracy: Memo<any>;
};
/**
 * Hook for calculating distance between points.
 */
export declare function useDistance(point1: Point | null, point2: Point | null, unit?: DistanceUnit): {
    distance: Memo<number>;
    bearing: Memo<number>;
};
/**
 * Hook for spatial queries.
 */
export declare function useSpatialQuery<T = unknown>(index: SpatialIndex<T>, bbox: BoundingBox | null): {
    results: Signal<SpatialIndexEntry<T>[]>;
    isQuerying: Signal<boolean>;
};
/**
 * Hook for clustering points.
 */
export declare function useClustering(points: Point[], options: ClusterOptions): {
    clusters: Signal<ClusterResult>;
    isProcessing: Signal<boolean>;
};
/**
 * Hook for geofencing.
 */
export declare function useGeofence(polygon: Polygon, onEnter?: () => void, onExit?: () => void): {
    isInside: Signal<boolean>;
    location: Signal<Point>;
};
/**
 * Hook for map viewport management.
 */
export declare function useMapViewport(initialViewport?: Partial<MapViewport>): {
    viewport: Signal<MapViewport>;
    setCenter: (center: Point) => void;
    setZoom: (zoom: number) => void;
    setBearing: (bearing: number) => void;
    setPitch: (pitch: number) => void;
    fitBounds: (bbox: BoundingBox, padding?: number) => void;
};
/**
 * Hook for route tracking.
 */
export declare function useRouteTracking(): {
    route: Signal<Point[]>;
    totalDistance: Signal<number>;
    isTracking: Signal<boolean>;
    startTracking: () => void;
    stopTracking: () => void;
};
export interface MapboxConfig {
    accessToken: string;
    style?: string;
    center?: Point;
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    bearing?: number;
    pitch?: number;
}
export interface LeafletConfig {
    center?: Point;
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    tileLayer?: {
        url: string;
        attribution?: string;
        maxZoom?: number;
    };
}
export interface GoogleMapsConfig {
    apiKey: string;
    center?: Point;
    zoom?: number;
    mapTypeId?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
    styles?: object[];
}
export interface OpenLayersConfig {
    target: string;
    center?: Point;
    zoom?: number;
    layers?: Array<{
        type: 'tile' | 'vector';
        source: string;
    }>;
}
/**
 * Generate Mapbox GL JS configuration.
 */
export declare function generateMapboxConfig(options: MapboxConfig): object;
/**
 * Generate Leaflet configuration.
 */
export declare function generateLeafletConfig(options?: LeafletConfig): object;
/**
 * Generate Google Maps configuration.
 */
export declare function generateGoogleMapsConfig(options: GoogleMapsConfig): object;
/**
 * Generate OpenLayers configuration.
 */
export declare function generateOpenLayersConfig(options: OpenLayersConfig): object;
/**
 * Geocoding API client interface.
 */
export interface GeocodingClient {
    geocode(address: string): Promise<GeocodingResult[]>;
    reverseGeocode(point: Point): Promise<ReverseGeocodingResult[]>;
}
/**
 * Nominatim (OpenStreetMap) geocoding client.
 */
export declare class NominatimClient implements GeocodingClient {
    private baseUrl;
    private userAgent;
    constructor(userAgent?: string);
    geocode(address: string): Promise<GeocodingResult[]>;
    reverseGeocode(point: Point): Promise<ReverseGeocodingResult[]>;
}
/**
 * Routing API client interface.
 */
export interface RoutingClient {
    route(origin: Point, destination: Point, waypoints?: Point[]): Promise<RouteResult>;
}
/**
 * OSRM routing client.
 */
export declare class OSRMClient implements RoutingClient {
    private baseUrl;
    constructor(baseUrl?: string);
    route(origin: Point, destination: Point, waypoints?: Point[]): Promise<RouteResult>;
}
/**
 * GeoJSON manipulation utilities.
 */
export declare class GeoJSONUtils {
    /**
     * Create a GeoJSON Point.
     */
    static point(coordinates: Point, properties?: Record<string, unknown>): GeoJSONFeature<GeoJSONPoint>;
    /**
     * Create a GeoJSON LineString.
     */
    static lineString(coordinates: Point[], properties?: Record<string, unknown>): GeoJSONFeature<GeoJSONLineString>;
    /**
     * Create a GeoJSON Polygon.
     */
    static polygon(coordinates: Point[][], properties?: Record<string, unknown>): GeoJSONFeature<GeoJSONPolygon>;
    /**
     * Create a FeatureCollection.
     */
    static featureCollection<G extends GeoJSONGeometry = GeoJSONGeometry>(features: GeoJSONFeature<G>[]): GeoJSONFeatureCollection<G>;
    /**
     * Calculate bounding box for GeoJSON.
     */
    static bbox(geojson: GeoJSON): BoundingBox;
    /**
     * Extract all coordinates from any GeoJSON structure.
     */
    static getAllCoordinates(geojson: GeoJSON): Point[];
    /**
     * Buffer a GeoJSON geometry.
     */
    static buffer(geojson: GeoJSONGeometry, distance: number, unit?: DistanceUnit): GeoJSONPolygon;
    /**
     * Simplify GeoJSON geometry.
     */
    static simplify(geojson: GeoJSONGeometry, tolerance: number): GeoJSONGeometry;
}
export type { GeoStoreState };
