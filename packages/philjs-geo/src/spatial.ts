/**
 * @philjs/geo - Comprehensive Geospatial Computing Library
 *
 * Production-ready geospatial analysis with reactive state management,
 * advanced algorithms, and integration with mapping services.
 */

import { signal, computed, effect, batch } from '@philjs/core';

// =============================================================================
// Core Types and Interfaces
// =============================================================================

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
export type GeoJSONGeometryType =
    | 'Point'
    | 'MultiPoint'
    | 'LineString'
    | 'MultiLineString'
    | 'Polygon'
    | 'MultiPolygon'
    | 'GeometryCollection';

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
export type GeoJSONGeometry =
    | GeoJSONPoint
    | GeoJSONMultiPoint
    | GeoJSONLineString
    | GeoJSONMultiLineString
    | GeoJSONPolygon
    | GeoJSONMultiPolygon
    | GeoJSONGeometryCollection;

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

// =============================================================================
// Constants
// =============================================================================

/** Earth radius in various units */
export const EARTH_RADIUS = {
    kilometers: 6371.0088,
    miles: 3958.7613,
    meters: 6371008.8,
    feet: 20902464.9,
    nautical_miles: 3440.065
} as const;

/** Conversion factors between units */
export const UNIT_CONVERSION = {
    kilometers_to_miles: 0.621371,
    miles_to_kilometers: 1.60934,
    meters_to_feet: 3.28084,
    feet_to_meters: 0.3048,
    kilometers_to_nautical_miles: 0.539957,
    nautical_miles_to_kilometers: 1.852
} as const;

/** WGS84 ellipsoid parameters */
export const WGS84 = {
    semiMajorAxis: 6378137.0,
    semiMinorAxis: 6356752.314245,
    flattening: 1 / 298.257223563,
    eccentricitySquared: 0.00669437999014
} as const;

// =============================================================================
// Utility Functions
// =============================================================================

/** Convert degrees to radians */
export function toRadians(degrees: number): number {
    return degrees * Math.PI / 180;
}

/** Convert radians to degrees */
export function toDegrees(radians: number): number {
    return radians * 180 / Math.PI;
}

/** Normalize longitude to [-180, 180] */
export function normalizeLongitude(lon: number): number {
    return ((lon + 540) % 360) - 180;
}

/** Normalize latitude to [-90, 90] */
export function normalizeLatitude(lat: number): number {
    return Math.max(-90, Math.min(90, lat));
}

/** Validate coordinate */
export function isValidCoordinate(point: Point): boolean {
    const [lon, lat] = point;
    return lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90;
}

/** Convert distance between units */
export function convertDistance(value: number, from: DistanceUnit, to: DistanceUnit): number {
    if (from === to) return value;

    // Convert to kilometers first
    let km: number;
    switch (from) {
        case 'kilometers': km = value; break;
        case 'miles': km = value * UNIT_CONVERSION.miles_to_kilometers; break;
        case 'meters': km = value / 1000; break;
        case 'feet': km = value * UNIT_CONVERSION.feet_to_meters / 1000; break;
        case 'nautical_miles': km = value * UNIT_CONVERSION.nautical_miles_to_kilometers; break;
    }

    // Convert from kilometers to target
    switch (to) {
        case 'kilometers': return km;
        case 'miles': return km * UNIT_CONVERSION.kilometers_to_miles;
        case 'meters': return km * 1000;
        case 'feet': return km * 1000 * UNIT_CONVERSION.meters_to_feet;
        case 'nautical_miles': return km * UNIT_CONVERSION.kilometers_to_nautical_miles;
    }
}

// =============================================================================
// GeoSpatial Core Class
// =============================================================================

/**
 * Advanced Geospatial Analysis engine.
 * Implements comprehensive geodesic calculations and spatial algorithms.
 */
export class GeoSpatial {
    private static EARTH_RADIUS_KM = EARTH_RADIUS.kilometers;

    /**
     * Calculate Great Circle distance between two points (Haversine formula).
     * @param point1 [lon, lat]
     * @param point2 [lon, lat]
     * @param unit Distance unit (default: kilometers)
     * @returns Distance in specified units
     */
    static distance(point1: Point, point2: Point, unit: DistanceUnit = 'kilometers'): number {
        const [lon1, lat1] = point1;
        const [lon2, lat2] = point2;

        const dLat = toRadians(lat2 - lat1);
        const dLon = toRadians(lon2 - lon1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const km = this.EARTH_RADIUS_KM * c;

        return convertDistance(km, 'kilometers', unit);
    }

    /**
     * Calculate distance using Vincenty's formula (more accurate for long distances).
     */
    static vincentyDistance(point1: Point, point2: Point, unit: DistanceUnit = 'kilometers'): number {
        const [lon1, lat1] = point1;
        const [lon2, lat2] = point2;

        const a = WGS84.semiMajorAxis;
        const b = WGS84.semiMinorAxis;
        const f = WGS84.flattening;

        const L = toRadians(lon2 - lon1);
        const U1 = Math.atan((1 - f) * Math.tan(toRadians(lat1)));
        const U2 = Math.atan((1 - f) * Math.tan(toRadians(lat2)));

        const sinU1 = Math.sin(U1), cosU1 = Math.cos(U1);
        const sinU2 = Math.sin(U2), cosU2 = Math.cos(U2);

        let lambda = L;
        let lambdaP: number;
        let iterLimit = 100;
        let cosSqAlpha: number, sinSigma: number, cos2SigmaM: number;
        let cosSigma: number, sigma: number;

        do {
            const sinLambda = Math.sin(lambda), cosLambda = Math.cos(lambda);
            sinSigma = Math.sqrt(
                (cosU2 * sinLambda) * (cosU2 * sinLambda) +
                (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda)
            );

            if (sinSigma === 0) return 0; // coincident points

            cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
            sigma = Math.atan2(sinSigma, cosSigma);
            const sinAlpha = cosU1 * cosU2 * sinLambda / sinSigma;
            cosSqAlpha = 1 - sinAlpha * sinAlpha;
            cos2SigmaM = cosSigma - 2 * sinU1 * sinU2 / cosSqAlpha;

            if (isNaN(cos2SigmaM)) cos2SigmaM = 0;

            const C = f / 16 * cosSqAlpha * (4 + f * (4 - 3 * cosSqAlpha));
            lambdaP = lambda;
            lambda = L + (1 - C) * f * sinAlpha * (
                sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM))
            );
        } while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0);

        if (iterLimit === 0) {
            // Formula failed to converge, fall back to Haversine
            return this.distance(point1, point2, unit);
        }

        const uSq = cosSqAlpha! * (a * a - b * b) / (b * b);
        const A = 1 + uSq / 16384 * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
        const B = uSq / 1024 * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
        const deltaSigma = B * sinSigma! * (
            cos2SigmaM! + B / 4 * (
                cosSigma! * (-1 + 2 * cos2SigmaM! * cos2SigmaM!) -
                B / 6 * cos2SigmaM! * (-3 + 4 * sinSigma! * sinSigma!) * (-3 + 4 * cos2SigmaM! * cos2SigmaM!)
            )
        );

        const meters = b * A * (sigma! - deltaSigma);
        return convertDistance(meters / 1000, 'kilometers', unit);
    }

    /**
     * Calculate initial bearing from point1 to point2.
     */
    static bearing(point1: Point, point2: Point): number {
        const [lon1, lat1] = point1;
        const [lon2, lat2] = point2;

        const dLon = toRadians(lon2 - lon1);
        const lat1Rad = toRadians(lat1);
        const lat2Rad = toRadians(lat2);

        const y = Math.sin(dLon) * Math.cos(lat2Rad);
        const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);

        const bearing = toDegrees(Math.atan2(y, x));
        return (bearing + 360) % 360;
    }

    /**
     * Calculate final bearing from point1 to point2.
     */
    static finalBearing(point1: Point, point2: Point): number {
        return (this.bearing(point2, point1) + 180) % 360;
    }

    /**
     * Calculate midpoint between two points along great circle.
     */
    static midpoint(point1: Point, point2: Point): Point {
        const [lon1, lat1] = point1;
        const [lon2, lat2] = point2;

        const lat1Rad = toRadians(lat1);
        const lat2Rad = toRadians(lat2);
        const dLon = toRadians(lon2 - lon1);

        const Bx = Math.cos(lat2Rad) * Math.cos(dLon);
        const By = Math.cos(lat2Rad) * Math.sin(dLon);

        const lat3 = Math.atan2(
            Math.sin(lat1Rad) + Math.sin(lat2Rad),
            Math.sqrt((Math.cos(lat1Rad) + Bx) * (Math.cos(lat1Rad) + Bx) + By * By)
        );
        const lon3 = toRadians(lon1) + Math.atan2(By, Math.cos(lat1Rad) + Bx);

        return [normalizeLongitude(toDegrees(lon3)), toDegrees(lat3)];
    }

    /**
     * Calculate destination point given start point, bearing, and distance.
     */
    static destination(start: Point, bearing: number, distance: number, unit: DistanceUnit = 'kilometers'): Point {
        const distKm = convertDistance(distance, unit, 'kilometers');
        const [lon1, lat1] = start;

        const lat1Rad = toRadians(lat1);
        const bearingRad = toRadians(bearing);
        const angularDistance = distKm / this.EARTH_RADIUS_KM;

        const lat2 = Math.asin(
            Math.sin(lat1Rad) * Math.cos(angularDistance) +
            Math.cos(lat1Rad) * Math.sin(angularDistance) * Math.cos(bearingRad)
        );

        const lon2 = toRadians(lon1) + Math.atan2(
            Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(lat1Rad),
            Math.cos(angularDistance) - Math.sin(lat1Rad) * Math.sin(lat2)
        );

        return [normalizeLongitude(toDegrees(lon2)), toDegrees(lat2)];
    }

    /**
     * Check if a point is inside a polygon (Ray-casting algorithm).
     */
    static isPointInPolygon(point: Point, polygon: Polygon): boolean {
        const [x, y] = point;
        let inside = false;

        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const [xi, yi] = polygon[i];
            const [xj, yj] = polygon[j];

            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

            if (intersect) inside = !inside;
        }

        return inside;
    }

    /**
     * Check if point is inside polygon using winding number algorithm (handles complex polygons).
     */
    static isPointInPolygonWinding(point: Point, polygon: Polygon): boolean {
        const [x, y] = point;
        let wn = 0;

        for (let i = 0; i < polygon.length - 1; i++) {
            const [x1, y1] = polygon[i];
            const [x2, y2] = polygon[i + 1];

            if (y1 <= y) {
                if (y2 > y) {
                    if (this.isLeft([x1, y1], [x2, y2], point) > 0) {
                        wn++;
                    }
                }
            } else {
                if (y2 <= y) {
                    if (this.isLeft([x1, y1], [x2, y2], point) < 0) {
                        wn--;
                    }
                }
            }
        }

        return wn !== 0;
    }

    private static isLeft(p0: Point, p1: Point, p2: Point): number {
        return (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p2[0] - p0[0]) * (p1[1] - p0[1]);
    }

    /**
     * Create a circular buffer (approximation) around a point.
     */
    static buffer(point: Point, distanceKm: number, steps: number = 64): GeoJSONPolygon {
        const coordinates: Point[] = [];

        for (let i = 0; i < steps; i++) {
            const bearing = (i / steps) * 360;
            coordinates.push(this.destination(point, bearing, distanceKm));
        }

        // Close the loop
        coordinates.push(coordinates[0]);

        return { type: 'Polygon', coordinates: [coordinates] };
    }

    /**
     * Calculate the area of a polygon in specified units.
     */
    static polygonArea(polygon: Polygon, unit: AreaUnit = 'square_kilometers'): number {
        const n = polygon.length;
        if (n < 3) return 0;

        let area = 0;

        for (let i = 0; i < n - 1; i++) {
            const [lon1, lat1] = polygon[i];
            const [lon2, lat2] = polygon[i + 1];

            area += toRadians(lon2 - lon1) * (
                2 + Math.sin(toRadians(lat1)) + Math.sin(toRadians(lat2))
            );
        }

        area = Math.abs(area * EARTH_RADIUS.meters * EARTH_RADIUS.meters / 2);

        // Convert to requested unit
        switch (unit) {
            case 'square_meters': return area;
            case 'square_kilometers': return area / 1e6;
            case 'square_miles': return area / 2.59e6;
            case 'acres': return area / 4046.86;
            case 'hectares': return area / 10000;
        }
    }

    /**
     * Calculate the perimeter (length) of a polygon or line.
     */
    static length(coordinates: Point[], unit: DistanceUnit = 'kilometers'): number {
        let total = 0;
        for (let i = 0; i < coordinates.length - 1; i++) {
            total += this.distance(coordinates[i], coordinates[i + 1], unit);
        }
        return total;
    }

    /**
     * Calculate centroid of a polygon.
     */
    static centroid(polygon: Polygon): Point {
        let cx = 0, cy = 0, area = 0;

        for (let i = 0; i < polygon.length - 1; i++) {
            const [x0, y0] = polygon[i];
            const [x1, y1] = polygon[i + 1];

            const a = x0 * y1 - x1 * y0;
            area += a;
            cx += (x0 + x1) * a;
            cy += (y0 + y1) * a;
        }

        area /= 2;
        cx /= (6 * area);
        cy /= (6 * area);

        return [cx, cy];
    }

    /**
     * Calculate bounding box for a set of points.
     */
    static boundingBox(points: Point[]): BoundingBox {
        if (points.length === 0) return [0, 0, 0, 0];

        let minLon = Infinity, minLat = Infinity;
        let maxLon = -Infinity, maxLat = -Infinity;

        for (const [lon, lat] of points) {
            minLon = Math.min(minLon, lon);
            minLat = Math.min(minLat, lat);
            maxLon = Math.max(maxLon, lon);
            maxLat = Math.max(maxLat, lat);
        }

        return [minLon, minLat, maxLon, maxLat];
    }

    /**
     * Check if two bounding boxes intersect.
     */
    static bboxIntersects(bbox1: BoundingBox, bbox2: BoundingBox): boolean {
        return !(
            bbox1[2] < bbox2[0] || bbox1[0] > bbox2[2] ||
            bbox1[3] < bbox2[1] || bbox1[1] > bbox2[3]
        );
    }

    /**
     * Check if a point is within a bounding box.
     */
    static pointInBBox(point: Point, bbox: BoundingBox): boolean {
        const [lon, lat] = point;
        return lon >= bbox[0] && lon <= bbox[2] && lat >= bbox[1] && lat <= bbox[3];
    }

    /**
     * Simplify a line using Douglas-Peucker algorithm.
     */
    static simplify(coordinates: Point[], tolerance: number = 0.0001): Point[] {
        if (coordinates.length <= 2) return coordinates;

        let maxDistance = 0;
        let maxIndex = 0;

        const start = coordinates[0];
        const end = coordinates[coordinates.length - 1];

        for (let i = 1; i < coordinates.length - 1; i++) {
            const distance = this.perpendicularDistance(coordinates[i], start, end);
            if (distance > maxDistance) {
                maxDistance = distance;
                maxIndex = i;
            }
        }

        if (maxDistance > tolerance) {
            const left = this.simplify(coordinates.slice(0, maxIndex + 1), tolerance);
            const right = this.simplify(coordinates.slice(maxIndex), tolerance);
            return [...left.slice(0, -1), ...right];
        }

        return [start, end];
    }

    private static perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
        const [x, y] = point;
        const [x1, y1] = lineStart;
        const [x2, y2] = lineEnd;

        const dx = x2 - x1;
        const dy = y2 - y1;

        if (dx === 0 && dy === 0) {
            return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
        }

        const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;

        return Math.sqrt((x - projX) ** 2 + (y - projY) ** 2);
    }

    /**
     * Convert point to tile coordinates.
     */
    static pointToTile(point: Point, zoom: number): TileCoordinates {
        const [lon, lat] = point;
        const n = Math.pow(2, zoom);
        const x = Math.floor((lon + 180) / 360 * n);
        const latRad = toRadians(lat);
        const y = Math.floor((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2 * n);
        return { x, y, z: zoom };
    }

    /**
     * Convert tile coordinates to point (center of tile).
     */
    static tileToPoint(tile: TileCoordinates): Point {
        const { x, y, z } = tile;
        const n = Math.pow(2, z);
        const lon = x / n * 360 - 180;
        const latRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n)));
        return [lon, toDegrees(latRad)];
    }

    /**
     * Calculate tile bounds.
     */
    static tileBounds(tile: TileCoordinates): BoundingBox {
        const { x, y, z } = tile;
        const nw = this.tileToPoint({ x, y, z });
        const se = this.tileToPoint({ x: x + 1, y: y + 1, z });
        return [nw[0], se[1], se[0], nw[1]];
    }

    // Legacy methods for backwards compatibility
    private static toRad(val: number) { return toRadians(val); }
    private static toDeg(val: number) { return toDegrees(val); }
}

// =============================================================================
// Spatial Index (R-Tree Implementation)
// =============================================================================

interface RTreeNode<T> {
    boundingBox: BoundingBox;
    children?: RTreeNode<T>[];
    entries?: SpatialIndexEntry<T>[];
    isLeaf: boolean;
}

/**
 * R-Tree spatial index for efficient spatial queries.
 */
export class SpatialIndex<T = unknown> {
    private root: RTreeNode<T>;
    private maxEntries: number;
    private minEntries: number;

    constructor(maxEntries: number = 9) {
        this.maxEntries = maxEntries;
        this.minEntries = Math.ceil(maxEntries / 2);
        this.root = this.createNode([], true);
    }

    private createNode(entries: SpatialIndexEntry<T>[], isLeaf: boolean): RTreeNode<T> {
        return {
            boundingBox: [Infinity, Infinity, -Infinity, -Infinity],
            entries: isLeaf ? entries : undefined,
            children: isLeaf ? undefined : [],
            isLeaf
        };
    }

    private updateBBox(node: RTreeNode<T>): void {
        const items = node.isLeaf ? node.entries! : node.children!;
        if (items.length === 0) {
            node.boundingBox = [Infinity, Infinity, -Infinity, -Infinity];
            return;
        }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const item of items) {
            const bbox = 'boundingBox' in item ? item.boundingBox : (item as RTreeNode<T>).boundingBox;
            minX = Math.min(minX, bbox[0]);
            minY = Math.min(minY, bbox[1]);
            maxX = Math.max(maxX, bbox[2]);
            maxY = Math.max(maxY, bbox[3]);
        }
        node.boundingBox = [minX, minY, maxX, maxY];
    }

    /**
     * Insert an entry into the index.
     */
    insert(entry: SpatialIndexEntry<T>): void {
        this.insertEntry(entry, this.root);
        this.updateBBox(this.root);
    }

    private insertEntry(entry: SpatialIndexEntry<T>, node: RTreeNode<T>): void {
        if (node.isLeaf) {
            node.entries!.push(entry);
            if (node.entries!.length > this.maxEntries) {
                // Simple split - could be optimized
                const mid = Math.floor(node.entries!.length / 2);
                node.entries!.splice(mid);
            }
        } else {
            // Find best child
            let bestChild = node.children![0];
            let bestEnlargement = Infinity;

            for (const child of node.children!) {
                const enlargement = this.calculateEnlargement(child.boundingBox, entry.boundingBox);
                if (enlargement < bestEnlargement) {
                    bestEnlargement = enlargement;
                    bestChild = child;
                }
            }

            this.insertEntry(entry, bestChild);
            this.updateBBox(bestChild);
        }
    }

    private calculateEnlargement(bbox: BoundingBox, entryBBox: BoundingBox): number {
        const newBBox: BoundingBox = [
            Math.min(bbox[0], entryBBox[0]),
            Math.min(bbox[1], entryBBox[1]),
            Math.max(bbox[2], entryBBox[2]),
            Math.max(bbox[3], entryBBox[3])
        ];
        const oldArea = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]);
        const newArea = (newBBox[2] - newBBox[0]) * (newBBox[3] - newBBox[1]);
        return newArea - oldArea;
    }

    /**
     * Search for entries intersecting a bounding box.
     */
    search(bbox: BoundingBox): SpatialIndexEntry<T>[] {
        const results: SpatialIndexEntry<T>[] = [];
        this.searchNode(bbox, this.root, results);
        return results;
    }

    private searchNode(bbox: BoundingBox, node: RTreeNode<T>, results: SpatialIndexEntry<T>[]): void {
        if (!GeoSpatial.bboxIntersects(bbox, node.boundingBox)) return;

        if (node.isLeaf) {
            for (const entry of node.entries!) {
                if (GeoSpatial.bboxIntersects(bbox, entry.boundingBox)) {
                    results.push(entry);
                }
            }
        } else {
            for (const child of node.children!) {
                this.searchNode(bbox, child, results);
            }
        }
    }

    /**
     * Find k nearest neighbors to a point.
     */
    knn(point: Point, k: number): SpatialIndexEntry<T>[] {
        const candidates: Array<{ entry: SpatialIndexEntry<T>; distance: number }> = [];
        this.knnSearch(point, this.root, candidates);

        candidates.sort((a, b) => a.distance - b.distance);
        return candidates.slice(0, k).map(c => c.entry);
    }

    private knnSearch(
        point: Point,
        node: RTreeNode<T>,
        candidates: Array<{ entry: SpatialIndexEntry<T>; distance: number }>
    ): void {
        if (node.isLeaf) {
            for (const entry of node.entries!) {
                const distance = this.distanceToEntry(point, entry);
                candidates.push({ entry, distance });
            }
        } else {
            // Sort children by distance to point
            const sortedChildren = [...node.children!].sort((a, b) =>
                this.distanceToBBox(point, a.boundingBox) - this.distanceToBBox(point, b.boundingBox)
            );

            for (const child of sortedChildren) {
                this.knnSearch(point, child, candidates);
            }
        }
    }

    private distanceToEntry(point: Point, entry: SpatialIndexEntry<T>): number {
        if (entry.geometry.type === 'Point') {
            return GeoSpatial.distance(point, entry.geometry.coordinates as Point);
        }
        return this.distanceToBBox(point, entry.boundingBox);
    }

    private distanceToBBox(point: Point, bbox: BoundingBox): number {
        const [lon, lat] = point;
        const [minLon, minLat, maxLon, maxLat] = bbox;

        const dx = Math.max(minLon - lon, 0, lon - maxLon);
        const dy = Math.max(minLat - lat, 0, lat - maxLat);

        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Remove an entry by ID.
     */
    remove(id: string): boolean {
        return this.removeFromNode(id, this.root);
    }

    private removeFromNode(id: string, node: RTreeNode<T>): boolean {
        if (node.isLeaf) {
            const index = node.entries!.findIndex(e => e.id === id);
            if (index !== -1) {
                node.entries!.splice(index, 1);
                this.updateBBox(node);
                return true;
            }
            return false;
        }

        for (const child of node.children!) {
            if (this.removeFromNode(id, child)) {
                this.updateBBox(node);
                return true;
            }
        }
        return false;
    }

    /**
     * Clear all entries.
     */
    clear(): void {
        this.root = this.createNode([], true);
    }

    /**
     * Get all entries.
     */
    all(): SpatialIndexEntry<T>[] {
        const results: SpatialIndexEntry<T>[] = [];
        this.collectAll(this.root, results);
        return results;
    }

    private collectAll(node: RTreeNode<T>, results: SpatialIndexEntry<T>[]): void {
        if (node.isLeaf) {
            results.push(...node.entries!);
        } else {
            for (const child of node.children!) {
                this.collectAll(child, results);
            }
        }
    }
}

// =============================================================================
// Clustering Algorithms
// =============================================================================

/**
 * DBSCAN clustering algorithm for point data.
 */
export class DBSCANCluster {
    private epsilon: number;
    private minPoints: number;
    private distanceUnit: DistanceUnit;

    constructor(epsilon: number, minPoints: number = 5, distanceUnit: DistanceUnit = 'kilometers') {
        this.epsilon = epsilon;
        this.minPoints = minPoints;
        this.distanceUnit = distanceUnit;
    }

    /**
     * Cluster points using DBSCAN algorithm.
     */
    cluster(points: Point[]): ClusterResult {
        const n = points.length;
        const labels = new Array(n).fill(-1); // -1 = unvisited
        const clusters: Point[][] = [];
        const noise: Point[] = [];
        let clusterId = 0;

        for (let i = 0; i < n; i++) {
            if (labels[i] !== -1) continue;

            const neighbors = this.rangeQuery(points, i);

            if (neighbors.length < this.minPoints) {
                labels[i] = 0; // noise
                continue;
            }

            clusterId++;
            labels[i] = clusterId;
            const cluster: Point[] = [points[i]];
            clusters.push(cluster);

            const seeds = [...neighbors];
            for (let j = 0; j < seeds.length; j++) {
                const q = seeds[j];

                if (labels[q] === 0) {
                    labels[q] = clusterId;
                    cluster.push(points[q]);
                }

                if (labels[q] !== -1) continue;

                labels[q] = clusterId;
                cluster.push(points[q]);

                const qNeighbors = this.rangeQuery(points, q);
                if (qNeighbors.length >= this.minPoints) {
                    seeds.push(...qNeighbors.filter(n => !seeds.includes(n)));
                }
            }
        }

        // Collect noise points
        for (let i = 0; i < n; i++) {
            if (labels[i] === 0) {
                noise.push(points[i]);
            }
        }

        return {
            clusters: clusters.map((pts, idx) => ({
                id: idx + 1,
                center: this.calculateClusterCenter(pts),
                count: pts.length,
                points: pts
            })),
            noise
        };
    }

    private rangeQuery(points: Point[], index: number): number[] {
        const neighbors: number[] = [];
        const point = points[index];

        for (let i = 0; i < points.length; i++) {
            if (i !== index) {
                const dist = GeoSpatial.distance(point, points[i], this.distanceUnit);
                if (dist <= this.epsilon) {
                    neighbors.push(i);
                }
            }
        }

        return neighbors;
    }

    private calculateClusterCenter(points: Point[]): Point {
        let sumLon = 0, sumLat = 0;
        for (const [lon, lat] of points) {
            sumLon += lon;
            sumLat += lat;
        }
        return [sumLon / points.length, sumLat / points.length];
    }
}

/**
 * K-Means clustering for geographic data.
 */
export class KMeansCluster {
    private k: number;
    private maxIterations: number;

    constructor(k: number, maxIterations: number = 100) {
        this.k = k;
        this.maxIterations = maxIterations;
    }

    /**
     * Cluster points using K-Means algorithm.
     */
    cluster(points: Point[]): ClusterResult {
        if (points.length < this.k) {
            return {
                clusters: points.map((p, i) => ({
                    id: i + 1,
                    center: p,
                    count: 1,
                    points: [p]
                })),
                noise: []
            };
        }

        // Initialize centroids using K-Means++
        let centroids = this.initializeCentroids(points);
        let assignments = new Array(points.length).fill(0);

        for (let iter = 0; iter < this.maxIterations; iter++) {
            // Assign points to nearest centroid
            const newAssignments = points.map(p => this.findNearestCentroid(p, centroids));

            // Check for convergence
            if (this.arraysEqual(assignments, newAssignments)) break;
            assignments = newAssignments;

            // Update centroids
            centroids = this.updateCentroids(points, assignments);
        }

        // Build result
        const clusterPoints: Point[][] = Array.from({ length: this.k }, () => []);
        for (let i = 0; i < points.length; i++) {
            clusterPoints[assignments[i]].push(points[i]);
        }

        return {
            clusters: centroids.map((center, idx) => ({
                id: idx + 1,
                center,
                count: clusterPoints[idx].length,
                points: clusterPoints[idx]
            })).filter(c => c.count > 0),
            noise: []
        };
    }

    private initializeCentroids(points: Point[]): Point[] {
        const centroids: Point[] = [];

        // First centroid is random
        centroids.push(points[Math.floor(Math.random() * points.length)]);

        // K-Means++ initialization
        while (centroids.length < this.k) {
            const distances = points.map(p => {
                const minDist = Math.min(...centroids.map(c => GeoSpatial.distance(p, c)));
                return minDist * minDist;
            });

            const sum = distances.reduce((a, b) => a + b, 0);
            let target = Math.random() * sum;

            for (let i = 0; i < points.length; i++) {
                target -= distances[i];
                if (target <= 0) {
                    centroids.push(points[i]);
                    break;
                }
            }
        }

        return centroids;
    }

    private findNearestCentroid(point: Point, centroids: Point[]): number {
        let minDist = Infinity;
        let nearest = 0;

        for (let i = 0; i < centroids.length; i++) {
            const dist = GeoSpatial.distance(point, centroids[i]);
            if (dist < minDist) {
                minDist = dist;
                nearest = i;
            }
        }

        return nearest;
    }

    private updateCentroids(points: Point[], assignments: number[]): Point[] {
        const sums: Array<{ lon: number; lat: number; count: number }> =
            Array.from({ length: this.k }, () => ({ lon: 0, lat: 0, count: 0 }));

        for (let i = 0; i < points.length; i++) {
            const cluster = assignments[i];
            sums[cluster].lon += points[i][0];
            sums[cluster].lat += points[i][1];
            sums[cluster].count++;
        }

        return sums.map(s =>
            s.count > 0 ? [s.lon / s.count, s.lat / s.count] as Point : [0, 0] as Point
        );
    }

    private arraysEqual(a: number[], b: number[]): boolean {
        return a.length === b.length && a.every((v, i) => v === b[i]);
    }
}

// =============================================================================
// Coordinate Transforms
// =============================================================================

/**
 * Coordinate transformation utilities.
 */
export class CoordinateTransform {
    /**
     * Convert WGS84 to Web Mercator (EPSG:3857).
     */
    static toWebMercator(point: Point): Point {
        const [lon, lat] = point;
        const x = lon * 20037508.34 / 180;
        const y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
        return [x, y * 20037508.34 / 180];
    }

    /**
     * Convert Web Mercator to WGS84.
     */
    static fromWebMercator(point: Point): Point {
        const [x, y] = point;
        const lon = x * 180 / 20037508.34;
        const lat = Math.atan(Math.exp(y * Math.PI / 20037508.34)) * 360 / Math.PI - 90;
        return [lon, lat];
    }

    /**
     * Convert lat/lon to UTM coordinates.
     */
    static toUTM(point: Point): { easting: number; northing: number; zone: number; hemisphere: 'N' | 'S' } {
        const [lon, lat] = point;
        const zone = Math.floor((lon + 180) / 6) + 1;
        const hemisphere = lat >= 0 ? 'N' : 'S';

        const k0 = 0.9996;
        const a = WGS84.semiMajorAxis;
        const e = Math.sqrt(WGS84.eccentricitySquared);
        const e2 = WGS84.eccentricitySquared;

        const lonOrigin = (zone - 1) * 6 - 180 + 3;
        const latRad = toRadians(lat);
        const lonRad = toRadians(lon);
        const lonOriginRad = toRadians(lonOrigin);

        const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) ** 2);
        const T = Math.tan(latRad) ** 2;
        const C = (e2 / (1 - e2)) * Math.cos(latRad) ** 2;
        const A = Math.cos(latRad) * (lonRad - lonOriginRad);

        const M = a * (
            (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256) * latRad -
            (3 * e2 / 8 + 3 * e2 ** 2 / 32 + 45 * e2 ** 3 / 1024) * Math.sin(2 * latRad) +
            (15 * e2 ** 2 / 256 + 45 * e2 ** 3 / 1024) * Math.sin(4 * latRad) -
            (35 * e2 ** 3 / 3072) * Math.sin(6 * latRad)
        );

        const easting = k0 * N * (
            A + (1 - T + C) * A ** 3 / 6 +
            (5 - 18 * T + T ** 2 + 72 * C - 58 * (e2 / (1 - e2))) * A ** 5 / 120
        ) + 500000;

        let northing = k0 * (
            M + N * Math.tan(latRad) * (
                A ** 2 / 2 + (5 - T + 9 * C + 4 * C ** 2) * A ** 4 / 24 +
                (61 - 58 * T + T ** 2 + 600 * C - 330 * (e2 / (1 - e2))) * A ** 6 / 720
            )
        );

        if (lat < 0) northing += 10000000;

        return { easting, northing, zone, hemisphere };
    }

    /**
     * Convert UTM to lat/lon.
     */
    static fromUTM(easting: number, northing: number, zone: number, hemisphere: 'N' | 'S'): Point {
        const k0 = 0.9996;
        const a = WGS84.semiMajorAxis;
        const e2 = WGS84.eccentricitySquared;
        const e1 = (1 - Math.sqrt(1 - e2)) / (1 + Math.sqrt(1 - e2));

        const x = easting - 500000;
        const y = hemisphere === 'S' ? northing - 10000000 : northing;

        const lonOrigin = (zone - 1) * 6 - 180 + 3;

        const M = y / k0;
        const mu = M / (a * (1 - e2 / 4 - 3 * e2 ** 2 / 64 - 5 * e2 ** 3 / 256));

        const phi1 = mu +
            (3 * e1 / 2 - 27 * e1 ** 3 / 32) * Math.sin(2 * mu) +
            (21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32) * Math.sin(4 * mu) +
            (151 * e1 ** 3 / 96) * Math.sin(6 * mu) +
            (1097 * e1 ** 4 / 512) * Math.sin(8 * mu);

        const N1 = a / Math.sqrt(1 - e2 * Math.sin(phi1) ** 2);
        const T1 = Math.tan(phi1) ** 2;
        const C1 = (e2 / (1 - e2)) * Math.cos(phi1) ** 2;
        const R1 = a * (1 - e2) / Math.pow(1 - e2 * Math.sin(phi1) ** 2, 1.5);
        const D = x / (N1 * k0);

        const lat = phi1 - (N1 * Math.tan(phi1) / R1) * (
            D ** 2 / 2 -
            (5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * (e2 / (1 - e2))) * D ** 4 / 24 +
            (61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * (e2 / (1 - e2)) - 3 * C1 ** 2) * D ** 6 / 720
        );

        const lon = (
            D -
            (1 + 2 * T1 + C1) * D ** 3 / 6 +
            (5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * (e2 / (1 - e2)) + 24 * T1 ** 2) * D ** 5 / 120
        ) / Math.cos(phi1);

        return [lonOrigin + toDegrees(lon), toDegrees(lat)];
    }
}

// =============================================================================
// Reactive Geo Store
// =============================================================================

interface GeoStoreState {
    currentLocation: Point | null;
    watchId: number | null;
    isTracking: boolean;
    locationHistory: Array<{ point: Point; timestamp: Date }>;
    geofences: Map<string, { polygon: Polygon; callback: (inside: boolean) => void }>;
    spatialIndex: SpatialIndex<unknown>;
    viewport: MapViewport | null;
    selectedFeatures: string[];
    layers: Map<string, GeoJSONFeatureCollection>;
}

/**
 * Create a reactive geo store.
 */
export function createGeoStore() {
    const state = signal<GeoStoreState>({
        currentLocation: null,
        watchId: null,
        isTracking: false,
        locationHistory: [],
        geofences: new Map(),
        spatialIndex: new SpatialIndex(),
        viewport: null,
        selectedFeatures: [],
        layers: new Map()
    });

    const currentLocation = computed(() => state.value.currentLocation);
    const isTracking = computed(() => state.value.isTracking);
    const locationHistory = computed(() => state.value.locationHistory);
    const viewport = computed(() => state.value.viewport);
    const selectedFeatures = computed(() => state.value.selectedFeatures);

    /**
     * Start tracking user location.
     */
    function startTracking(options?: PositionOptions): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            const watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const point: Point = [position.coords.longitude, position.coords.latitude];

                    batch(() => {
                        const current = state.value;
                        state.value = {
                            ...current,
                            currentLocation: point,
                            isTracking: true,
                            locationHistory: [
                                ...current.locationHistory,
                                { point, timestamp: new Date() }
                            ].slice(-1000) // Keep last 1000 points
                        };
                    });

                    // Check geofences
                    checkGeofences(point);
                    resolve();
                },
                (error) => reject(error),
                options
            );

            state.value = { ...state.value, watchId, isTracking: true };
        });
    }

    /**
     * Stop tracking user location.
     */
    function stopTracking(): void {
        const { watchId } = state.value;
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            state.value = { ...state.value, watchId: null, isTracking: false };
        }
    }

    /**
     * Get current location once.
     */
    function getCurrentLocation(options?: PositionOptions): Promise<Point> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const point: Point = [position.coords.longitude, position.coords.latitude];
                    state.value = { ...state.value, currentLocation: point };
                    resolve(point);
                },
                reject,
                options
            );
        });
    }

    /**
     * Add a geofence.
     */
    function addGeofence(id: string, polygon: Polygon, callback: (inside: boolean) => void): void {
        const geofences = new Map(state.value.geofences);
        geofences.set(id, { polygon, callback });
        state.value = { ...state.value, geofences };
    }

    /**
     * Remove a geofence.
     */
    function removeGeofence(id: string): void {
        const geofences = new Map(state.value.geofences);
        geofences.delete(id);
        state.value = { ...state.value, geofences };
    }

    /**
     * Check if current location is within geofences.
     */
    function checkGeofences(location: Point): void {
        for (const [, { polygon, callback }] of state.value.geofences) {
            const inside = GeoSpatial.isPointInPolygon(location, polygon);
            callback(inside);
        }
    }

    /**
     * Update viewport.
     */
    function setViewport(viewport: MapViewport): void {
        state.value = { ...state.value, viewport };
    }

    /**
     * Add a layer.
     */
    function addLayer(id: string, collection: GeoJSONFeatureCollection): void {
        const layers = new Map(state.value.layers);
        layers.set(id, collection);

        // Add features to spatial index
        for (const feature of collection.features) {
            if (feature.geometry && feature.id) {
                state.value.spatialIndex.insert({
                    id: String(feature.id),
                    geometry: feature.geometry,
                    boundingBox: feature.bbox || GeoSpatial.boundingBox(
                        extractCoordinates(feature.geometry)
                    ),
                    data: feature.properties
                });
            }
        }

        state.value = { ...state.value, layers };
    }

    /**
     * Remove a layer.
     */
    function removeLayer(id: string): void {
        const layer = state.value.layers.get(id);
        if (layer) {
            for (const feature of layer.features) {
                if (feature.id) {
                    state.value.spatialIndex.remove(String(feature.id));
                }
            }
        }

        const layers = new Map(state.value.layers);
        layers.delete(id);
        state.value = { ...state.value, layers };
    }

    /**
     * Select features.
     */
    function selectFeatures(ids: string[]): void {
        state.value = { ...state.value, selectedFeatures: ids };
    }

    /**
     * Query features by bounding box.
     */
    function queryFeatures(bbox: BoundingBox): SpatialIndexEntry<unknown>[] {
        return state.value.spatialIndex.search(bbox);
    }

    /**
     * Find nearest features to a point.
     */
    function findNearest(point: Point, k: number = 5): SpatialIndexEntry<unknown>[] {
        return state.value.spatialIndex.knn(point, k);
    }

    return {
        // State
        state,
        currentLocation,
        isTracking,
        locationHistory,
        viewport,
        selectedFeatures,

        // Location tracking
        startTracking,
        stopTracking,
        getCurrentLocation,

        // Geofencing
        addGeofence,
        removeGeofence,

        // Viewport
        setViewport,

        // Layers
        addLayer,
        removeLayer,

        // Selection
        selectFeatures,

        // Queries
        queryFeatures,
        findNearest
    };
}

// Helper to extract coordinates from any geometry type
function extractCoordinates(geometry: GeoJSONGeometry): Point[] {
    switch (geometry.type) {
        case 'Point':
            return [geometry.coordinates];
        case 'MultiPoint':
        case 'LineString':
            return geometry.coordinates;
        case 'MultiLineString':
        case 'Polygon':
            return geometry.coordinates.flat();
        case 'MultiPolygon':
            return geometry.coordinates.flat(2);
        case 'GeometryCollection':
            return geometry.geometries.flatMap(extractCoordinates);
        default:
            return [];
    }
}

// =============================================================================
// PhilJS Hooks
// =============================================================================

/**
 * Hook for geolocation tracking.
 */
export function useGeolocation(options?: PositionOptions) {
    const location = signal<Point | null>(null);
    const error = signal<GeolocationPositionError | null>(null);
    const isLoading = signal(true);

    const accuracy = computed(() => {
        // Note: accuracy would need to be stored separately
        return null;
    });

    effect(() => {
        if (!navigator.geolocation) {
            error.value = { code: 2, message: 'Geolocation not supported' } as GeolocationPositionError;
            isLoading.value = false;
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                location.value = [position.coords.longitude, position.coords.latitude];
                error.value = null;
                isLoading.value = false;
            },
            (err) => {
                error.value = err;
                isLoading.value = false;
            },
            options
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    });

    return { location, error, isLoading, accuracy };
}

/**
 * Hook for calculating distance between points.
 */
export function useDistance(point1: Point | null, point2: Point | null, unit: DistanceUnit = 'kilometers') {
    const distance = computed(() => {
        if (!point1 || !point2) return null;
        return GeoSpatial.distance(point1, point2, unit);
    });

    const bearing = computed(() => {
        if (!point1 || !point2) return null;
        return GeoSpatial.bearing(point1, point2);
    });

    return { distance, bearing };
}

/**
 * Hook for spatial queries.
 */
export function useSpatialQuery<T = unknown>(
    index: SpatialIndex<T>,
    bbox: BoundingBox | null
) {
    const results = signal<SpatialIndexEntry<T>[]>([]);
    const isQuerying = signal(false);

    effect(() => {
        if (!bbox) {
            results.value = [];
            return;
        }

        isQuerying.value = true;
        results.value = index.search(bbox);
        isQuerying.value = false;
    });

    return { results, isQuerying };
}

/**
 * Hook for clustering points.
 */
export function useClustering(
    points: Point[],
    options: ClusterOptions
) {
    const clusters = signal<ClusterResult | null>(null);
    const isProcessing = signal(false);

    effect(() => {
        if (points.length === 0) {
            clusters.value = { clusters: [], noise: [] };
            return;
        }

        isProcessing.value = true;
        const clusterer = new DBSCANCluster(options.radius, options.minPoints);
        clusters.value = clusterer.cluster(points);
        isProcessing.value = false;
    });

    return { clusters, isProcessing };
}

/**
 * Hook for geofencing.
 */
export function useGeofence(
    polygon: Polygon,
    onEnter?: () => void,
    onExit?: () => void
) {
    const isInside = signal(false);
    const { location } = useGeolocation();

    effect(() => {
        const loc = location.value;
        if (!loc) return;

        const nowInside = GeoSpatial.isPointInPolygon(loc, polygon);

        if (nowInside && !isInside.value) {
            isInside.value = true;
            onEnter?.();
        } else if (!nowInside && isInside.value) {
            isInside.value = false;
            onExit?.();
        }
    });

    return { isInside, location };
}

/**
 * Hook for map viewport management.
 */
export function useMapViewport(initialViewport?: Partial<MapViewport>) {
    const viewport = signal<MapViewport>({
        center: initialViewport?.center || [0, 0],
        zoom: initialViewport?.zoom || 10,
        bearing: initialViewport?.bearing || 0,
        pitch: initialViewport?.pitch || 0,
        boundingBox: initialViewport?.boundingBox || [-180, -90, 180, 90]
    });

    const setCenter = (center: Point) => {
        viewport.value = { ...viewport.value, center };
    };

    const setZoom = (zoom: number) => {
        viewport.value = { ...viewport.value, zoom };
    };

    const setBearing = (bearing: number) => {
        viewport.value = { ...viewport.value, bearing };
    };

    const setPitch = (pitch: number) => {
        viewport.value = { ...viewport.value, pitch };
    };

    const fitBounds = (bbox: BoundingBox, padding?: number) => {
        const [minLon, minLat, maxLon, maxLat] = bbox;
        const center: Point = [(minLon + maxLon) / 2, (minLat + maxLat) / 2];

        // Calculate appropriate zoom level
        const latDiff = maxLat - minLat;
        const lonDiff = maxLon - minLon;
        const maxDiff = Math.max(latDiff, lonDiff);
        const zoom = Math.floor(Math.log2(360 / maxDiff)) - (padding ? 1 : 0);

        viewport.value = { ...viewport.value, center, zoom, boundingBox: bbox };
    };

    return { viewport, setCenter, setZoom, setBearing, setPitch, fitBounds };
}

/**
 * Hook for route tracking.
 */
export function useRouteTracking() {
    const route = signal<Point[]>([]);
    const totalDistance = signal(0);
    const isTracking = signal(false);
    const { location } = useGeolocation({ enableHighAccuracy: true });

    const startTracking = () => {
        route.value = [];
        totalDistance.value = 0;
        isTracking.value = true;
    };

    const stopTracking = () => {
        isTracking.value = false;
    };

    effect(() => {
        if (!isTracking.value || !location.value) return;

        const currentRoute = route.value;
        if (currentRoute.length > 0) {
            const lastPoint = currentRoute[currentRoute.length - 1];
            const dist = GeoSpatial.distance(lastPoint, location.value);

            // Only add point if moved more than 10 meters
            if (dist > 0.01) {
                route.value = [...currentRoute, location.value];
                totalDistance.value = totalDistance.value + dist;
            }
        } else {
            route.value = [location.value];
        }
    });

    return {
        route,
        totalDistance,
        isTracking,
        startTracking,
        stopTracking
    };
}

// =============================================================================
// Configuration Generators
// =============================================================================

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
export function generateMapboxConfig(options: MapboxConfig): object {
    return {
        container: 'map',
        accessToken: options.accessToken,
        style: options.style || 'mapbox://styles/mapbox/streets-v12',
        center: options.center || [0, 0],
        zoom: options.zoom || 10,
        minZoom: options.minZoom,
        maxZoom: options.maxZoom,
        bearing: options.bearing || 0,
        pitch: options.pitch || 0,
        attributionControl: true,
        preserveDrawingBuffer: true
    };
}

/**
 * Generate Leaflet configuration.
 */
export function generateLeafletConfig(options: LeafletConfig = {}): object {
    return {
        center: options.center ? [options.center[1], options.center[0]] : [0, 0],
        zoom: options.zoom || 10,
        minZoom: options.minZoom || 0,
        maxZoom: options.maxZoom || 18,
        zoomControl: true,
        attributionControl: true,
        tileLayer: {
            url: options.tileLayer?.url || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: options.tileLayer?.attribution ||
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: options.tileLayer?.maxZoom || 19
        }
    };
}

/**
 * Generate Google Maps configuration.
 */
export function generateGoogleMapsConfig(options: GoogleMapsConfig): object {
    return {
        apiKey: options.apiKey,
        version: 'weekly',
        libraries: ['places', 'geometry', 'drawing'],
        mapOptions: {
            center: options.center ? { lat: options.center[1], lng: options.center[0] } : { lat: 0, lng: 0 },
            zoom: options.zoom || 10,
            mapTypeId: options.mapTypeId || 'roadmap',
            styles: options.styles,
            fullscreenControl: true,
            mapTypeControl: true,
            streetViewControl: true,
            zoomControl: true
        }
    };
}

/**
 * Generate OpenLayers configuration.
 */
export function generateOpenLayersConfig(options: OpenLayersConfig): object {
    return {
        target: options.target,
        view: {
            center: options.center ? CoordinateTransform.toWebMercator(options.center) : [0, 0],
            zoom: options.zoom || 10,
            projection: 'EPSG:3857'
        },
        layers: options.layers || [
            {
                type: 'tile',
                source: 'OSM'
            }
        ],
        controls: {
            zoom: true,
            rotate: true,
            attribution: true,
            scaleLine: true
        }
    };
}

// =============================================================================
// API Clients
// =============================================================================

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
export class NominatimClient implements GeocodingClient {
    private baseUrl = 'https://nominatim.openstreetmap.org';
    private userAgent: string;

    constructor(userAgent: string = 'PhilJS-Geo/1.0') {
        this.userAgent = userAgent;
    }

    async geocode(address: string): Promise<GeocodingResult[]> {
        const url = `${this.baseUrl}/search?format=json&q=${encodeURIComponent(address)}`;

        const response = await fetch(url, {
            headers: { 'User-Agent': this.userAgent }
        });

        if (!response.ok) {
            throw new Error(`Geocoding failed: ${response.statusText}`);
        }

        const data = await response.json();

        return data.map((item: any) => ({
            address: item.display_name,
            location: [parseFloat(item.lon), parseFloat(item.lat)] as Point,
            confidence: parseFloat(item.importance) || 0.5,
            placeId: item.place_id?.toString(),
            formattedAddress: item.display_name,
            boundingBox: item.boundingbox ? [
                parseFloat(item.boundingbox[2]),
                parseFloat(item.boundingbox[0]),
                parseFloat(item.boundingbox[3]),
                parseFloat(item.boundingbox[1])
            ] as BoundingBox : undefined
        }));
    }

    async reverseGeocode(point: Point): Promise<ReverseGeocodingResult[]> {
        const [lon, lat] = point;
        const url = `${this.baseUrl}/reverse?format=json&lat=${lat}&lon=${lon}`;

        const response = await fetch(url, {
            headers: { 'User-Agent': this.userAgent }
        });

        if (!response.ok) {
            throw new Error(`Reverse geocoding failed: ${response.statusText}`);
        }

        const data = await response.json();

        return [{
            address: data.display_name,
            location: [parseFloat(data.lon), parseFloat(data.lat)] as Point,
            confidence: 1.0,
            placeId: data.place_id?.toString(),
            formattedAddress: data.display_name,
            distance: 0,
            components: {
                streetNumber: data.address?.house_number,
                street: data.address?.road,
                city: data.address?.city || data.address?.town || data.address?.village,
                state: data.address?.state,
                country: data.address?.country,
                postalCode: data.address?.postcode
            }
        }];
    }
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
export class OSRMClient implements RoutingClient {
    private baseUrl: string;

    constructor(baseUrl: string = 'https://router.project-osrm.org') {
        this.baseUrl = baseUrl;
    }

    async route(origin: Point, destination: Point, waypoints: Point[] = []): Promise<RouteResult> {
        const coordinates = [origin, ...waypoints, destination]
            .map(p => `${p[0]},${p[1]}`)
            .join(';');

        const url = `${this.baseUrl}/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Routing failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes?.length) {
            throw new Error('No route found');
        }

        const route = data.routes[0];

        return {
            origin,
            destination,
            waypoints,
            segments: route.legs.flatMap((leg: any) =>
                leg.steps.map((step: any) => ({
                    start: step.maneuver.location as Point,
                    end: step.geometry?.coordinates?.[step.geometry.coordinates.length - 1] || step.maneuver.location,
                    distance: step.distance / 1000, // Convert to km
                    duration: step.duration / 60, // Convert to minutes
                    instruction: step.maneuver.instruction,
                    roadName: step.name,
                    roadType: step.mode
                }))
            ),
            totalDistance: route.distance / 1000,
            totalDuration: route.duration / 60,
            geometry: route.geometry.coordinates,
            boundingBox: GeoSpatial.boundingBox(route.geometry.coordinates)
        };
    }
}

// =============================================================================
// GeoJSON Utilities
// =============================================================================

/**
 * GeoJSON manipulation utilities.
 */
export class GeoJSONUtils {
    /**
     * Create a GeoJSON Point.
     */
    static point(coordinates: Point, properties?: Record<string, unknown>): GeoJSONFeature<GeoJSONPoint> {
        return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates },
            properties: properties || {}
        };
    }

    /**
     * Create a GeoJSON LineString.
     */
    static lineString(coordinates: Point[], properties?: Record<string, unknown>): GeoJSONFeature<GeoJSONLineString> {
        return {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates },
            properties: properties || {}
        };
    }

    /**
     * Create a GeoJSON Polygon.
     */
    static polygon(coordinates: Point[][], properties?: Record<string, unknown>): GeoJSONFeature<GeoJSONPolygon> {
        return {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates },
            properties: properties || {}
        };
    }

    /**
     * Create a FeatureCollection.
     */
    static featureCollection<G extends GeoJSONGeometry = GeoJSONGeometry>(
        features: GeoJSONFeature<G>[]
    ): GeoJSONFeatureCollection<G> {
        return {
            type: 'FeatureCollection',
            features
        };
    }

    /**
     * Calculate bounding box for GeoJSON.
     */
    static bbox(geojson: GeoJSON): BoundingBox {
        const coords = this.getAllCoordinates(geojson);
        return GeoSpatial.boundingBox(coords);
    }

    /**
     * Extract all coordinates from any GeoJSON structure.
     */
    static getAllCoordinates(geojson: GeoJSON): Point[] {
        if ('features' in geojson) {
            return geojson.features.flatMap(f => this.getAllCoordinates(f.geometry));
        }
        if ('geometry' in geojson) {
            return this.getAllCoordinates(geojson.geometry);
        }
        return extractCoordinates(geojson as GeoJSONGeometry);
    }

    /**
     * Buffer a GeoJSON geometry.
     */
    static buffer(geojson: GeoJSONGeometry, distance: number, unit: DistanceUnit = 'kilometers'): GeoJSONPolygon {
        const distKm = convertDistance(distance, unit, 'kilometers');

        if (geojson.type === 'Point') {
            return GeoSpatial.buffer(geojson.coordinates, distKm);
        }

        // For other types, buffer each coordinate and union (simplified)
        const coords = extractCoordinates(geojson);
        if (coords.length === 0) {
            return { type: 'Polygon', coordinates: [[]] };
        }

        // Use centroid for simplicity
        const bbox = GeoSpatial.boundingBox(coords);
        const center: Point = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
        const maxDist = Math.max(
            ...coords.map(c => GeoSpatial.distance(center, c))
        );

        return GeoSpatial.buffer(center, maxDist + distKm);
    }

    /**
     * Simplify GeoJSON geometry.
     */
    static simplify(geojson: GeoJSONGeometry, tolerance: number): GeoJSONGeometry {
        switch (geojson.type) {
            case 'LineString':
                return {
                    type: 'LineString',
                    coordinates: GeoSpatial.simplify(geojson.coordinates, tolerance)
                };
            case 'Polygon':
                return {
                    type: 'Polygon',
                    coordinates: geojson.coordinates.map(ring =>
                        GeoSpatial.simplify(ring, tolerance)
                    )
                };
            case 'MultiLineString':
                return {
                    type: 'MultiLineString',
                    coordinates: geojson.coordinates.map(line =>
                        GeoSpatial.simplify(line, tolerance)
                    )
                };
            case 'MultiPolygon':
                return {
                    type: 'MultiPolygon',
                    coordinates: geojson.coordinates.map(polygon =>
                        polygon.map(ring => GeoSpatial.simplify(ring, tolerance))
                    )
                };
            default:
                return geojson;
        }
    }
}

// =============================================================================
// Type Exports
// =============================================================================

export type {
    GeoStoreState
};
