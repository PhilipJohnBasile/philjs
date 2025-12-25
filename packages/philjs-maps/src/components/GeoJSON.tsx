/**
 * PhilJS Maps - GeoJSON Component
 * Render GeoJSON data on the map
 */

import type {
  GeoJSONProps,
  GeoJSONData,
  GeoJSONFeature,
  GeoJSONGeometry,
  GeoJSONStyle,
  LatLng,
  LatLngBounds,
  MapInstance,
  ShapeEvent,
} from '../types';
import { getMapContext } from './Map';
import { createPolyline, PolylineInstance } from './Polyline';
import { createPolygon, PolygonInstance } from './Polygon';
import { createMarker, MarkerInstance } from './Marker';

// ============================================================================
// GeoJSON Abstraction
// ============================================================================

/**
 * Abstract GeoJSON layer instance
 */
export interface GeoJSONLayerInstance {
  native: unknown;
  getData(): GeoJSONData;
  setData(data: GeoJSONData): void;
  setStyle(style: GeoJSONStyle | ((feature: GeoJSONFeature) => GeoJSONStyle)): void;
  getFeatures(): GeoJSONFeature[];
  getBounds(): LatLngBounds;
  remove(): void;
  bringToFront(): void;
  bringToBack(): void;
  setFilter(filter: ((feature: GeoJSONFeature) => boolean) | null): void;
}

/**
 * GeoJSON factory function type
 */
export type CreateGeoJSONFn = (
  map: MapInstance,
  props: GeoJSONProps
) => GeoJSONLayerInstance;

// Provider-specific GeoJSON factories
const geojsonFactories: Record<string, CreateGeoJSONFn> = {};

/**
 * Register a GeoJSON factory for a provider
 */
export function registerGeoJSONFactory(provider: string, factory: CreateGeoJSONFn): void {
  geojsonFactories[provider] = factory;
}

/**
 * Get the GeoJSON factory for a provider
 */
export function getGeoJSONFactory(provider: string): CreateGeoJSONFn | undefined {
  return geojsonFactories[provider];
}

// ============================================================================
// GeoJSON Parsing Utilities
// ============================================================================

/**
 * Parse GeoJSON coordinates to LatLng array
 */
function parseCoordinates(coordinates: unknown): LatLng[] {
  if (!Array.isArray(coordinates)) return [];

  return (coordinates as number[][]).map((coord) => ({
    lng: coord[0],
    lat: coord[1],
  }));
}

/**
 * Parse a single coordinate pair
 */
function parsePoint(coordinates: unknown): LatLng | null {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;
  const [lng, lat] = coordinates as number[];
  return { lng, lat };
}

/**
 * Get all features from GeoJSON data
 */
export function getFeatures(data: GeoJSONData): GeoJSONFeature[] {
  if (data.type === 'FeatureCollection') {
    return data.features || [];
  }

  if (data.type === 'Feature') {
    return [data as unknown as GeoJSONFeature];
  }

  if (data.type === 'GeometryCollection' && data.geometry) {
    return [{
      type: 'Feature',
      geometry: data.geometry,
      properties: data.properties || {},
    }];
  }

  return [];
}

/**
 * Calculate bounds of GeoJSON data
 */
export function calculateGeoJSONBounds(data: GeoJSONData): LatLngBounds {
  const features = getFeatures(data);
  let north = -Infinity;
  let south = Infinity;
  let east = -Infinity;
  let west = Infinity;

  function processCoordinates(coords: unknown): void {
    if (!Array.isArray(coords)) return;

    if (typeof coords[0] === 'number') {
      // Single coordinate pair
      const [lng, lat] = coords as number[];
      north = Math.max(north, lat);
      south = Math.min(south, lat);
      east = Math.max(east, lng);
      west = Math.min(west, lng);
    } else {
      // Nested coordinates
      for (const coord of coords) {
        processCoordinates(coord);
      }
    }
  }

  for (const feature of features) {
    if (feature.geometry && feature.geometry.coordinates) {
      processCoordinates(feature.geometry.coordinates);
    }
  }

  return { north, south, east, west };
}

// ============================================================================
// Default Style
// ============================================================================

const DEFAULT_STYLE: GeoJSONStyle = {
  strokeColor: '#3498db',
  strokeWeight: 2,
  strokeOpacity: 1,
  fillColor: '#3498db',
  fillOpacity: 0.2,
};

// ============================================================================
// Manual GeoJSON Rendering
// ============================================================================

interface RenderedFeature {
  feature: GeoJSONFeature;
  elements: (MarkerInstance | PolylineInstance | PolygonInstance)[];
}

/**
 * Create a manual GeoJSON layer (fallback implementation)
 */
function createManualGeoJSONLayer(map: MapInstance, props: GeoJSONProps): GeoJSONLayerInstance {
  const renderedFeatures: RenderedFeature[] = [];
  let currentFilter: ((feature: GeoJSONFeature) => boolean) | null = props.filter || null;
  let currentStyle = props.style || DEFAULT_STYLE;
  let currentData = props.data;

  /**
   * Get style for a feature
   */
  function getStyle(feature: GeoJSONFeature): GeoJSONStyle {
    if (typeof currentStyle === 'function') {
      return { ...DEFAULT_STYLE, ...currentStyle(feature) };
    }
    return { ...DEFAULT_STYLE, ...currentStyle };
  }

  /**
   * Render a Point geometry
   */
  function renderPoint(feature: GeoJSONFeature, geometry: GeoJSONGeometry): MarkerInstance | null {
    const position = parsePoint(geometry.coordinates);
    if (!position) return null;

    if (props.pointToLayer) {
      return props.pointToLayer(feature, position) as MarkerInstance;
    }

    return createMarker({
      position,
      title: String(feature.properties?.name || feature.properties?.title || ''),
      onClick: (e) => {
        props.onFeatureClick?.(feature, e as unknown as ShapeEvent);
      },
    });
  }

  /**
   * Render a LineString geometry
   */
  function renderLineString(feature: GeoJSONFeature, geometry: GeoJSONGeometry): PolylineInstance | null {
    const path = parseCoordinates(geometry.coordinates);
    if (path.length < 2) return null;

    const style = getStyle(feature);

    return createPolyline({
      path,
      strokeColor: style.strokeColor,
      strokeWeight: style.strokeWeight,
      strokeOpacity: style.strokeOpacity,
      onClick: (e) => {
        props.onFeatureClick?.(feature, e);
      },
    });
  }

  /**
   * Render a Polygon geometry
   */
  function renderPolygon(feature: GeoJSONFeature, geometry: GeoJSONGeometry): PolygonInstance | null {
    const rings = geometry.coordinates as number[][][];
    if (!rings || rings.length === 0) return null;

    const path = parseCoordinates(rings[0]);
    const holes = rings.slice(1).map((ring) => parseCoordinates(ring));

    if (path.length < 3) return null;

    const style = getStyle(feature);

    return createPolygon({
      path,
      holes: holes.length > 0 ? holes : undefined,
      strokeColor: style.strokeColor,
      strokeWeight: style.strokeWeight,
      strokeOpacity: style.strokeOpacity,
      fillColor: style.fillColor,
      fillOpacity: style.fillOpacity,
      onClick: (e) => {
        props.onFeatureClick?.(feature, e);
      },
    });
  }

  /**
   * Render a geometry
   */
  function renderGeometry(feature: GeoJSONFeature, geometry: GeoJSONGeometry): (MarkerInstance | PolylineInstance | PolygonInstance)[] {
    const elements: (MarkerInstance | PolylineInstance | PolygonInstance)[] = [];

    switch (geometry.type) {
      case 'Point': {
        const marker = renderPoint(feature, geometry);
        if (marker) elements.push(marker);
        break;
      }

      case 'MultiPoint': {
        const points = geometry.coordinates as number[][];
        for (const coord of points) {
          const marker = renderPoint(feature, { type: 'Point', coordinates: coord });
          if (marker) elements.push(marker);
        }
        break;
      }

      case 'LineString': {
        const polyline = renderLineString(feature, geometry);
        if (polyline) elements.push(polyline);
        break;
      }

      case 'MultiLineString': {
        const lines = geometry.coordinates as number[][][];
        for (const line of lines) {
          const polyline = renderLineString(feature, { type: 'LineString', coordinates: line });
          if (polyline) elements.push(polyline);
        }
        break;
      }

      case 'Polygon': {
        const polygon = renderPolygon(feature, geometry);
        if (polygon) elements.push(polygon);
        break;
      }

      case 'MultiPolygon': {
        const polygons = geometry.coordinates as number[][][][];
        for (const poly of polygons) {
          const polygon = renderPolygon(feature, { type: 'Polygon', coordinates: poly });
          if (polygon) elements.push(polygon);
        }
        break;
      }

      case 'GeometryCollection': {
        if (geometry.geometries) {
          for (const geom of geometry.geometries) {
            elements.push(...renderGeometry(feature, geom));
          }
        }
        break;
      }
    }

    return elements;
  }

  /**
   * Render all features
   */
  function render(): void {
    // Clear existing
    for (const rendered of renderedFeatures) {
      for (const element of rendered.elements) {
        element.remove();
      }
    }
    renderedFeatures.length = 0;

    // Get features
    const features = getFeatures(currentData);

    // Render each feature
    for (const feature of features) {
      // Apply filter
      if (currentFilter && !currentFilter(feature)) {
        continue;
      }

      if (!feature.geometry) continue;

      const elements = renderGeometry(feature, feature.geometry);

      renderedFeatures.push({ feature, elements });
    }
  }

  // Initial render
  render();

  // Instance
  const instance: GeoJSONLayerInstance = {
    native: renderedFeatures,

    getData(): GeoJSONData {
      return currentData;
    },

    setData(data: GeoJSONData): void {
      currentData = data;
      render();
    },

    setStyle(style: GeoJSONStyle | ((feature: GeoJSONFeature) => GeoJSONStyle)): void {
      currentStyle = style;
      render();
    },

    getFeatures(): GeoJSONFeature[] {
      return renderedFeatures.map((r) => r.feature);
    },

    getBounds(): LatLngBounds {
      return calculateGeoJSONBounds(currentData);
    },

    remove(): void {
      for (const rendered of renderedFeatures) {
        for (const element of rendered.elements) {
          element.remove();
        }
      }
      renderedFeatures.length = 0;
    },

    bringToFront(): void {
      // Re-add elements to bring to front
      render();
    },

    bringToBack(): void {
      // Would need z-index support
    },

    setFilter(filter: ((feature: GeoJSONFeature) => boolean) | null): void {
      currentFilter = filter;
      render();
    },
  };

  return instance;
}

// ============================================================================
// GeoJSON Component
// ============================================================================

/**
 * Create a GeoJSON layer on the map
 */
export function createGeoJSON(props: GeoJSONProps): GeoJSONLayerInstance | null {
  const context = getMapContext();

  if (!context || !context.map) {
    console.warn('GeoJSON: No map context available.');
    return null;
  }

  const factory = getGeoJSONFactory(context.provider);

  if (factory) {
    return factory(context.map, props);
  }

  // Fallback to manual implementation
  return createManualGeoJSONLayer(context.map, props);
}

/**
 * GeoJSON component (for use with JSX)
 */
export function GeoJSON(props: GeoJSONProps): unknown {
  return {
    type: 'philjs-geojson',
    props,
    create: () => createGeoJSON(props),
  };
}

// ============================================================================
// GeoJSON Utilities
// ============================================================================

/**
 * Fetch and parse GeoJSON from a URL
 */
export async function fetchGeoJSON(url: string): Promise<GeoJSONData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch GeoJSON: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Create a simple point feature
 */
export function createPointFeature(
  position: LatLng,
  properties: Record<string, unknown> = {}
): GeoJSONFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [position.lng, position.lat],
    },
    properties,
  };
}

/**
 * Create a simple line feature
 */
export function createLineFeature(
  path: LatLng[],
  properties: Record<string, unknown> = {}
): GeoJSONFeature {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: path.map((p) => [p.lng, p.lat]),
    },
    properties,
  };
}

/**
 * Create a simple polygon feature
 */
export function createPolygonFeature(
  path: LatLng[],
  properties: Record<string, unknown> = {},
  holes: LatLng[][] = []
): GeoJSONFeature {
  const rings = [
    path.map((p) => [p.lng, p.lat]),
    ...holes.map((hole) => hole.map((p) => [p.lng, p.lat])),
  ];

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: rings,
    },
    properties,
  };
}

/**
 * Create a FeatureCollection
 */
export function createFeatureCollection(features: GeoJSONFeature[]): GeoJSONData {
  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Merge multiple GeoJSON datasets
 */
export function mergeGeoJSON(...datasets: GeoJSONData[]): GeoJSONData {
  const features: GeoJSONFeature[] = [];

  for (const data of datasets) {
    features.push(...getFeatures(data));
  }

  return createFeatureCollection(features);
}

/**
 * Filter GeoJSON features
 */
export function filterGeoJSON(
  data: GeoJSONData,
  predicate: (feature: GeoJSONFeature) => boolean
): GeoJSONData {
  const features = getFeatures(data).filter(predicate);
  return createFeatureCollection(features);
}

/**
 * Simplify GeoJSON coordinates (reduce precision)
 */
export function simplifyGeoJSON(data: GeoJSONData, precision = 5): GeoJSONData {
  const factor = Math.pow(10, precision);

  function roundCoord(coord: number): number {
    return Math.round(coord * factor) / factor;
  }

  function processCoordinates(coords: unknown): unknown {
    if (!Array.isArray(coords)) return coords;

    if (typeof coords[0] === 'number') {
      return coords.map(roundCoord);
    }

    return coords.map(processCoordinates);
  }

  const features = getFeatures(data).map((feature) => ({
    ...feature,
    geometry: {
      ...feature.geometry,
      coordinates: processCoordinates(feature.geometry.coordinates),
    },
  }));

  return createFeatureCollection(features);
}

/**
 * Check if a point is inside a GeoJSON polygon feature
 */
export function isPointInGeoJSONPolygon(point: LatLng, feature: GeoJSONFeature): boolean {
  if (feature.geometry.type !== 'Polygon' && feature.geometry.type !== 'MultiPolygon') {
    return false;
  }

  const rings =
    feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates as number[][][]]
      : (feature.geometry.coordinates as number[][][][]);

  for (const polygonRings of rings) {
    const outerRing = polygonRings[0];
    const holes = polygonRings.slice(1);

    if (isPointInRing(point, outerRing)) {
      // Check holes
      for (const hole of holes) {
        if (isPointInRing(point, hole)) {
          return false;
        }
      }
      return true;
    }
  }

  return false;
}

/**
 * Ray casting algorithm for point in ring
 */
function isPointInRing(point: LatLng, ring: number[][]): boolean {
  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    if (((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

// Default export
export default GeoJSON;
