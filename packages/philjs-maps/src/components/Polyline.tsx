/**
 * PhilJS Maps - Polyline Component
 * Draw lines and routes on the map
 */

import type { PolylineProps, LatLng, MapInstance, ShapeEvent } from '../types';
import { getMapContext } from './Map';

// ============================================================================
// Polyline Abstraction
// ============================================================================

/**
 * Abstract polyline instance
 */
export interface PolylineInstance {
  native: unknown;
  getPath(): LatLng[];
  setPath(path: LatLng[]): void;
  setStyle(style: Partial<PolylineProps>): void;
  setEditable(editable: boolean): void;
  setVisible(visible: boolean): void;
  remove(): void;
  on(event: string, handler: (e: ShapeEvent) => void): void;
  off(event: string, handler: (e: ShapeEvent) => void): void;
  getBounds(): { north: number; south: number; east: number; west: number };
}

/**
 * Polyline factory function type
 */
export type CreatePolylineFn = (
  map: MapInstance,
  props: PolylineProps
) => PolylineInstance;

// Provider-specific polyline factories
const polylineFactories: Record<string, CreatePolylineFn> = {};

/**
 * Register a polyline factory for a provider
 */
export function registerPolylineFactory(provider: string, factory: CreatePolylineFn): void {
  polylineFactories[provider] = factory;
}

/**
 * Get the polyline factory for a provider
 */
export function getPolylineFactory(provider: string): CreatePolylineFn | undefined {
  return polylineFactories[provider];
}

// ============================================================================
// Polyline Component
// ============================================================================

/**
 * Create a polyline on the map
 */
export function createPolyline(props: PolylineProps): PolylineInstance | null {
  const context = getMapContext();

  if (!context || !context.map) {
    console.warn('Polyline: No map context available.');
    return null;
  }

  const factory = getPolylineFactory(context.provider);

  if (!factory) {
    console.warn(`Polyline: No polyline factory registered for provider "${context.provider}"`);
    return null;
  }

  const polyline = factory(context.map, props);

  // Set up event handlers
  if (props.onClick) {
    polyline.on('click', props.onClick);
  }

  if (props.onMouseEnter) {
    polyline.on('mouseenter', props.onMouseEnter as unknown as (e: ShapeEvent) => void);
  }

  if (props.onMouseLeave) {
    polyline.on('mouseleave', props.onMouseLeave as unknown as (e: ShapeEvent) => void);
  }

  if (props.onEdit && props.editable) {
    polyline.on('edit', () => {
      props.onEdit?.(polyline.getPath());
    });
  }

  return polyline;
}

/**
 * Polyline component (for use with JSX)
 */
export function Polyline(props: PolylineProps): unknown {
  return {
    type: 'philjs-polyline',
    props,
    create: () => createPolyline(props),
  };
}

// ============================================================================
// Polyline Utilities
// ============================================================================

/**
 * Calculate the total length of a polyline path in meters
 */
export function calculatePathLength(path: LatLng[]): number {
  if (path.length < 2) return 0;

  let totalLength = 0;

  for (let i = 0; i < path.length - 1; i++) {
    totalLength += haversineDistance(path[i], path[i + 1]);
  }

  return totalLength;
}

/**
 * Haversine distance between two points in meters
 */
function haversineDistance(point1: LatLng, point2: LatLng): number {
  const R = 6371e3; // Earth's radius in meters
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
 * Get a point at a specific percentage along the path
 */
export function getPointAtPercentage(path: LatLng[], percentage: number): LatLng | null {
  if (path.length < 2) return path[0] || null;

  const totalLength = calculatePathLength(path);
  const targetLength = totalLength * Math.max(0, Math.min(1, percentage));

  let currentLength = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const segmentLength = haversineDistance(path[i], path[i + 1]);

    if (currentLength + segmentLength >= targetLength) {
      const segmentPercentage = (targetLength - currentLength) / segmentLength;
      return {
        lat: path[i].lat + (path[i + 1].lat - path[i].lat) * segmentPercentage,
        lng: path[i].lng + (path[i + 1].lng - path[i].lng) * segmentPercentage,
      };
    }

    currentLength += segmentLength;
  }

  return path[path.length - 1];
}

/**
 * Simplify a path using Douglas-Peucker algorithm
 */
export function simplifyPath(path: LatLng[], tolerance = 0.00001): LatLng[] {
  if (path.length <= 2) return path;

  // Find the point with maximum distance from the line
  let maxDistance = 0;
  let maxIndex = 0;

  const start = path[0];
  const end = path[path.length - 1];

  for (let i = 1; i < path.length - 1; i++) {
    const distance = perpendicularDistance(path[i], start, end);
    if (distance > maxDistance) {
      maxDistance = distance;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDistance > tolerance) {
    const left = simplifyPath(path.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPath(path.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  return [start, end];
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
 * Animate drawing a polyline
 */
export function animatePolyline(
  polyline: PolylineInstance,
  duration = 2000
): Promise<void> {
  return new Promise((resolve) => {
    const fullPath = polyline.getPath();
    if (fullPath.length < 2) {
      resolve();
      return;
    }

    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Calculate how many points to show
      const pointCount = Math.floor(progress * (fullPath.length - 1)) + 1;
      const partialPath = fullPath.slice(0, pointCount);

      // Interpolate the last segment
      if (pointCount < fullPath.length && progress < 1) {
        const segmentProgress = (progress * (fullPath.length - 1)) % 1;
        const lastIndex = pointCount - 1;
        const interpolated = {
          lat:
            fullPath[lastIndex].lat +
            (fullPath[lastIndex + 1].lat - fullPath[lastIndex].lat) * segmentProgress,
          lng:
            fullPath[lastIndex].lng +
            (fullPath[lastIndex + 1].lng - fullPath[lastIndex].lng) * segmentProgress,
        };
        partialPath.push(interpolated);
      }

      polyline.setPath(partialPath);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        polyline.setPath(fullPath);
        resolve();
      }
    }

    polyline.setPath([fullPath[0]]);
    requestAnimationFrame(animate);
  });
}

/**
 * Create a dashed polyline pattern
 */
export function createDashedPattern(
  dashLength = 10,
  gapLength = 10
): string {
  return `${dashLength} ${gapLength}`;
}

/**
 * Create a gradient color array for a path
 */
export function createPathGradient(
  path: LatLng[],
  startColor: string,
  endColor: string
): string[] {
  const colors: string[] = [];

  // Parse colors (assumes hex format)
  const parseHex = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const start = parseHex(startColor);
  const end = parseHex(endColor);

  for (let i = 0; i < path.length; i++) {
    const t = i / (path.length - 1);
    const r = Math.round(start.r + (end.r - start.r) * t);
    const g = Math.round(start.g + (end.g - start.g) * t);
    const b = Math.round(start.b + (end.b - start.b) * t);
    colors.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
  }

  return colors;
}

// Default export
export default Polyline;
