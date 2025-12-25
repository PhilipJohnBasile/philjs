/**
 * PhilJS Maps - Polygon Component
 * Draw areas and regions on the map
 */

import type { PolygonProps, LatLng, MapInstance, ShapeEvent, LatLngBounds } from '../types';
import { getMapContext } from './Map';

// ============================================================================
// Polygon Abstraction
// ============================================================================

/**
 * Abstract polygon instance
 */
export interface PolygonInstance {
  native: unknown;
  getPath(): LatLng[];
  setPath(path: LatLng[]): void;
  getHoles(): LatLng[][];
  setHoles(holes: LatLng[][]): void;
  setStyle(style: Partial<PolygonProps>): void;
  setEditable(editable: boolean): void;
  setVisible(visible: boolean): void;
  remove(): void;
  on(event: string, handler: (e: ShapeEvent) => void): void;
  off(event: string, handler: (e: ShapeEvent) => void): void;
  getBounds(): LatLngBounds;
  containsPoint(point: LatLng): boolean;
  getArea(): number;
}

/**
 * Polygon factory function type
 */
export type CreatePolygonFn = (
  map: MapInstance,
  props: PolygonProps
) => PolygonInstance;

// Provider-specific polygon factories
const polygonFactories: Record<string, CreatePolygonFn> = {};

/**
 * Register a polygon factory for a provider
 */
export function registerPolygonFactory(provider: string, factory: CreatePolygonFn): void {
  polygonFactories[provider] = factory;
}

/**
 * Get the polygon factory for a provider
 */
export function getPolygonFactory(provider: string): CreatePolygonFn | undefined {
  return polygonFactories[provider];
}

// ============================================================================
// Polygon Component
// ============================================================================

/**
 * Create a polygon on the map
 */
export function createPolygon(props: PolygonProps): PolygonInstance | null {
  const context = getMapContext();

  if (!context || !context.map) {
    console.warn('Polygon: No map context available.');
    return null;
  }

  const factory = getPolygonFactory(context.provider);

  if (!factory) {
    console.warn(`Polygon: No polygon factory registered for provider "${context.provider}"`);
    return null;
  }

  const polygon = factory(context.map, props);

  // Set up event handlers
  if (props.onClick) {
    polygon.on('click', props.onClick);
  }

  if (props.onMouseEnter) {
    polygon.on('mouseenter', props.onMouseEnter as unknown as (e: ShapeEvent) => void);
  }

  if (props.onMouseLeave) {
    polygon.on('mouseleave', props.onMouseLeave as unknown as (e: ShapeEvent) => void);
  }

  if (props.onEdit && props.editable) {
    polygon.on('edit', () => {
      props.onEdit?.(polygon.getPath(), polygon.getHoles());
    });
  }

  return polygon;
}

/**
 * Polygon component (for use with JSX)
 */
export function Polygon(props: PolygonProps): unknown {
  return {
    type: 'philjs-polygon',
    props,
    create: () => createPolygon(props),
  };
}

// ============================================================================
// Polygon Utilities
// ============================================================================

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;

    if (((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Check if a point is inside a polygon with holes
 */
export function isPointInPolygonWithHoles(
  point: LatLng,
  polygon: LatLng[],
  holes: LatLng[][]
): boolean {
  // Must be inside the outer polygon
  if (!isPointInPolygon(point, polygon)) {
    return false;
  }

  // Must not be inside any hole
  for (const hole of holes) {
    if (isPointInPolygon(point, hole)) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate the area of a polygon in square meters using Shoelace formula
 */
export function calculatePolygonArea(polygon: LatLng[]): number {
  if (polygon.length < 3) return 0;

  // Convert to approximate meters (rough approximation)
  const metersPerDegree = 111319.9;

  // Calculate centroid for better accuracy
  let sumLat = 0;
  let sumLng = 0;
  for (const point of polygon) {
    sumLat += point.lat;
    sumLng += point.lng;
  }
  const centerLat = sumLat / polygon.length;

  // Adjust for latitude
  const latScale = metersPerDegree;
  const lngScale = metersPerDegree * Math.cos((centerLat * Math.PI) / 180);

  // Convert polygon to meters
  const meterPolygon = polygon.map((p) => ({
    x: p.lng * lngScale,
    y: p.lat * latScale,
  }));

  // Shoelace formula
  let area = 0;
  for (let i = 0; i < meterPolygon.length; i++) {
    const j = (i + 1) % meterPolygon.length;
    area += meterPolygon[i].x * meterPolygon[j].y;
    area -= meterPolygon[j].x * meterPolygon[i].y;
  }

  return Math.abs(area) / 2;
}

/**
 * Calculate the perimeter of a polygon in meters
 */
export function calculatePolygonPerimeter(polygon: LatLng[]): number {
  if (polygon.length < 2) return 0;

  let perimeter = 0;

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    perimeter += haversineDistance(polygon[i], polygon[j]);
  }

  return perimeter;
}

/**
 * Haversine distance between two points in meters
 */
function haversineDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371e3;
  const phi1 = (point1.lat * Math.PI) / 180;
  const phi2 = (point2.lat * Math.PI) / 180;
  const deltaPhi = ((point2.lat - point1.lat) * Math.PI) / 180;
  const deltaLambda = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate the centroid of a polygon
 */
export function calculatePolygonCentroid(polygon: LatLng[]): LatLng {
  if (polygon.length === 0) return { lat: 0, lng: 0 };
  if (polygon.length === 1) return polygon[0];

  let sumLat = 0;
  let sumLng = 0;
  let area = 0;

  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    const cross = polygon[i].lng * polygon[j].lat - polygon[j].lng * polygon[i].lat;
    area += cross;
    sumLat += (polygon[i].lat + polygon[j].lat) * cross;
    sumLng += (polygon[i].lng + polygon[j].lng) * cross;
  }

  area = area / 2;

  if (area === 0) {
    // Fallback to simple average for degenerate polygons
    let avgLat = 0;
    let avgLng = 0;
    for (const point of polygon) {
      avgLat += point.lat;
      avgLng += point.lng;
    }
    return { lat: avgLat / polygon.length, lng: avgLng / polygon.length };
  }

  return {
    lat: sumLat / (6 * area),
    lng: sumLng / (6 * area),
  };
}

/**
 * Get the bounding box of a polygon
 */
export function getPolygonBounds(polygon: LatLng[]): LatLngBounds {
  if (polygon.length === 0) {
    return { north: 0, south: 0, east: 0, west: 0 };
  }

  let north = -Infinity;
  let south = Infinity;
  let east = -Infinity;
  let west = Infinity;

  for (const point of polygon) {
    north = Math.max(north, point.lat);
    south = Math.min(south, point.lat);
    east = Math.max(east, point.lng);
    west = Math.min(west, point.lng);
  }

  return { north, south, east, west };
}

/**
 * Simplify a polygon using Douglas-Peucker algorithm
 */
export function simplifyPolygon(polygon: LatLng[], tolerance = 0.00001): LatLng[] {
  if (polygon.length <= 3) return polygon;

  // Find the point with maximum distance
  let maxDistance = 0;
  let maxIndex = 0;

  for (let i = 1; i < polygon.length - 1; i++) {
    const distance = perpendicularDistance(polygon[i], polygon[0], polygon[polygon.length - 1]);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  if (maxDistance > tolerance) {
    const left = simplifyPolygon(polygon.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPolygon(polygon.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [polygon[0], polygon[polygon.length - 1]];
}

/**
 * Calculate perpendicular distance from a point to a line
 */
function perpendicularDistance(point: LatLng, lineStart: LatLng, lineEnd: LatLng): number {
  const dx = lineEnd.lng - lineStart.lng;
  const dy = lineEnd.lat - lineStart.lat;

  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) return haversineDistance(point, lineStart);

  const u =
    ((point.lng - lineStart.lng) * dx + (point.lat - lineStart.lat) * dy) / (mag * mag);

  let closest: LatLng;
  if (u < 0) {
    closest = lineStart;
  } else if (u > 1) {
    closest = lineEnd;
  } else {
    closest = {
      lng: lineStart.lng + u * dx,
      lat: lineStart.lat + u * dy,
    };
  }

  return haversineDistance(point, closest);
}

/**
 * Create a circle polygon approximation
 */
export function createCirclePolygon(
  center: LatLng,
  radiusMeters: number,
  numPoints = 64
): LatLng[] {
  const points: LatLng[] = [];
  const earthRadius = 6371e3;

  for (let i = 0; i < numPoints; i++) {
    const angle = (2 * Math.PI * i) / numPoints;

    // Calculate point using spherical geometry
    const lat1 = (center.lat * Math.PI) / 180;
    const lng1 = (center.lng * Math.PI) / 180;
    const angularDistance = radiusMeters / earthRadius;

    const lat2 = Math.asin(
      Math.sin(lat1) * Math.cos(angularDistance) +
        Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(angle)
    );

    const lng2 =
      lng1 +
      Math.atan2(
        Math.sin(angle) * Math.sin(angularDistance) * Math.cos(lat1),
        Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
      );

    points.push({
      lat: (lat2 * 180) / Math.PI,
      lng: (lng2 * 180) / Math.PI,
    });
  }

  return points;
}

/**
 * Create a rectangular polygon
 */
export function createRectanglePolygon(bounds: LatLngBounds): LatLng[] {
  return [
    { lat: bounds.north, lng: bounds.west },
    { lat: bounds.north, lng: bounds.east },
    { lat: bounds.south, lng: bounds.east },
    { lat: bounds.south, lng: bounds.west },
  ];
}

/**
 * Buffer a polygon by a distance (simple approximation)
 */
export function bufferPolygon(polygon: LatLng[], distanceMeters: number): LatLng[] {
  // This is a simplified buffer that just moves each point outward from the centroid
  // A proper buffer algorithm would use computational geometry libraries
  const centroid = calculatePolygonCentroid(polygon);
  const buffered: LatLng[] = [];

  for (const point of polygon) {
    const dx = point.lng - centroid.lng;
    const dy = point.lat - centroid.lat;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) {
      buffered.push(point);
      continue;
    }

    // Convert distance to degrees (approximate)
    const bufferDegrees = distanceMeters / 111319.9;
    const scale = (distance + bufferDegrees) / distance;

    buffered.push({
      lat: centroid.lat + dy * scale,
      lng: centroid.lng + dx * scale,
    });
  }

  return buffered;
}

// Default export
export default Polygon;
