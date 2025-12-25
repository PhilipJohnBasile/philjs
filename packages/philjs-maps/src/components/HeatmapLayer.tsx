/**
 * PhilJS Maps - Heatmap Layer Component
 * Visualize data density on the map
 */

import type { HeatmapLayerProps, HeatmapPoint, LatLng, MapInstance, LatLngBounds } from '../types';
import { getMapContext } from './Map';

// ============================================================================
// Heatmap Abstraction
// ============================================================================

/**
 * Abstract heatmap layer instance
 */
export interface HeatmapLayerInstance {
  native: unknown;
  getData(): HeatmapPoint[];
  setData(data: HeatmapPoint[]): void;
  addPoint(point: HeatmapPoint): void;
  removePoint(position: LatLng): void;
  setRadius(radius: number): void;
  setBlur(blur: number): void;
  setMaxIntensity(maxIntensity: number): void;
  setGradient(gradient: Record<number, string>): void;
  setOpacity(opacity: number): void;
  setVisible(visible: boolean): void;
  remove(): void;
  redraw(): void;
}

/**
 * Heatmap factory function type
 */
export type CreateHeatmapFn = (
  map: MapInstance,
  props: HeatmapLayerProps
) => HeatmapLayerInstance;

// Provider-specific heatmap factories
const heatmapFactories: Record<string, CreateHeatmapFn> = {};

/**
 * Register a heatmap factory for a provider
 */
export function registerHeatmapFactory(provider: string, factory: CreateHeatmapFn): void {
  heatmapFactories[provider] = factory;
}

/**
 * Get the heatmap factory for a provider
 */
export function getHeatmapFactory(provider: string): CreateHeatmapFn | undefined {
  return heatmapFactories[provider];
}

// ============================================================================
// Default Gradient
// ============================================================================

/**
 * Default heatmap gradient (blue -> cyan -> green -> yellow -> red)
 */
export const DEFAULT_HEATMAP_GRADIENT: Record<number, string> = {
  0.0: '#0000ff',
  0.25: '#00ffff',
  0.5: '#00ff00',
  0.75: '#ffff00',
  1.0: '#ff0000',
};

/**
 * Alternative gradients
 */
export const HEATMAP_GRADIENTS = {
  default: DEFAULT_HEATMAP_GRADIENT,
  thermal: {
    0.0: '#000000',
    0.2: '#1a0066',
    0.4: '#660066',
    0.6: '#ff3300',
    0.8: '#ffcc00',
    1.0: '#ffffff',
  },
  cool: {
    0.0: '#0d1b2a',
    0.25: '#1b263b',
    0.5: '#415a77',
    0.75: '#778da9',
    1.0: '#e0e1dd',
  },
  warm: {
    0.0: '#fff1e6',
    0.25: '#fec89a',
    0.5: '#f9844a',
    0.75: '#f3722c',
    1.0: '#f94144',
  },
  monochrome: {
    0.0: 'rgba(0, 0, 0, 0)',
    0.5: 'rgba(0, 0, 0, 0.5)',
    1.0: 'rgba(0, 0, 0, 1)',
  },
};

// ============================================================================
// Canvas-based Heatmap Implementation
// ============================================================================

interface CanvasHeatmapState {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  data: HeatmapPoint[];
  radius: number;
  blur: number;
  maxIntensity: number;
  gradient: Record<number, string>;
  opacity: number;
  visible: boolean;
}

/**
 * Create a canvas-based heatmap (fallback implementation)
 */
function createCanvasHeatmap(map: MapInstance, props: HeatmapLayerProps): HeatmapLayerInstance {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: ${props.zIndex || 100};
  `;

  const ctx = canvas.getContext('2d')!;

  const state: CanvasHeatmapState = {
    canvas,
    ctx,
    data: [...props.data],
    radius: props.radius || 25,
    blur: props.blur || 15,
    maxIntensity: props.maxIntensity || 1,
    gradient: props.gradient || DEFAULT_HEATMAP_GRADIENT,
    opacity: props.opacity || 0.6,
    visible: true,
  };

  // Gradient palette cache
  let gradientPalette: Uint8ClampedArray | null = null;

  /**
   * Create gradient palette (256 colors)
   */
  function createGradientPalette(): Uint8ClampedArray {
    const paletteCanvas = document.createElement('canvas');
    paletteCanvas.width = 256;
    paletteCanvas.height = 1;
    const paletteCtx = paletteCanvas.getContext('2d')!;

    const grad = paletteCtx.createLinearGradient(0, 0, 256, 0);
    for (const [stop, color] of Object.entries(state.gradient)) {
      grad.addColorStop(parseFloat(stop), color);
    }

    paletteCtx.fillStyle = grad;
    paletteCtx.fillRect(0, 0, 256, 1);

    return paletteCtx.getImageData(0, 0, 256, 1).data;
  }

  /**
   * Convert lat/lng to pixel position
   */
  function latLngToPixel(position: LatLng, bounds: LatLngBounds, width: number, height: number): { x: number; y: number } {
    return {
      x: ((position.lng - bounds.west) / (bounds.east - bounds.west)) * width,
      y: ((bounds.north - position.lat) / (bounds.north - bounds.south)) * height,
    };
  }

  /**
   * Draw a single point
   */
  function drawPoint(x: number, y: number, weight: number): void {
    const radius = state.radius;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius + state.blur);
    grad.addColorStop(0, `rgba(0, 0, 0, ${weight})`);
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, radius + state.blur, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Colorize the grayscale heatmap
   */
  function colorize(): void {
    if (!gradientPalette) {
      gradientPalette = createGradientPalette();
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3];
      if (alpha > 0) {
        const paletteIndex = Math.min(255, Math.floor((alpha / 255) * 255)) * 4;
        pixels[i] = gradientPalette[paletteIndex];
        pixels[i + 1] = gradientPalette[paletteIndex + 1];
        pixels[i + 2] = gradientPalette[paletteIndex + 2];
        pixels[i + 3] = Math.floor(alpha * state.opacity);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Redraw the heatmap
   */
  function redraw(): void {
    if (!state.visible) return;

    const mapContainer = (map.native as { getContainer?: () => HTMLElement }).getContainer?.();
    if (!mapContainer) return;

    const rect = mapContainer.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bounds = map.getBounds();
    const zoom = map.getZoom();

    // Filter points within viewport (with padding)
    const padding = state.radius / 111319.9; // Approximate degrees
    const visibleBounds: LatLngBounds = {
      north: bounds.north + padding,
      south: bounds.south - padding,
      east: bounds.east + padding,
      west: bounds.west - padding,
    };

    // Draw intensity layer (grayscale)
    for (const point of state.data) {
      if (
        point.position.lat >= visibleBounds.south &&
        point.position.lat <= visibleBounds.north &&
        point.position.lng >= visibleBounds.west &&
        point.position.lng <= visibleBounds.east
      ) {
        const { x, y } = latLngToPixel(point.position, bounds, canvas.width, canvas.height);
        const weight = Math.min(1, (point.weight || 1) / state.maxIntensity);
        drawPoint(x, y, weight);
      }
    }

    // Apply color gradient
    colorize();
  }

  // Add canvas to map container
  const mapContainer = (map.native as { getContainer?: () => HTMLElement }).getContainer?.();
  if (mapContainer) {
    mapContainer.style.position = 'relative';
    mapContainer.appendChild(canvas);
  }

  // Initial draw
  redraw();

  // Redraw on map events
  map.on('move', redraw);
  map.on('zoom', redraw);
  map.on('resize', redraw);

  // Instance
  const instance: HeatmapLayerInstance = {
    native: canvas,

    getData(): HeatmapPoint[] {
      return [...state.data];
    },

    setData(data: HeatmapPoint[]): void {
      state.data = [...data];
      redraw();
    },

    addPoint(point: HeatmapPoint): void {
      state.data.push(point);
      redraw();
    },

    removePoint(position: LatLng): void {
      const index = state.data.findIndex(
        (p) => p.position.lat === position.lat && p.position.lng === position.lng
      );
      if (index !== -1) {
        state.data.splice(index, 1);
        redraw();
      }
    },

    setRadius(radius: number): void {
      state.radius = radius;
      redraw();
    },

    setBlur(blur: number): void {
      state.blur = blur;
      redraw();
    },

    setMaxIntensity(maxIntensity: number): void {
      state.maxIntensity = maxIntensity;
      redraw();
    },

    setGradient(gradient: Record<number, string>): void {
      state.gradient = gradient;
      gradientPalette = null; // Invalidate cache
      redraw();
    },

    setOpacity(opacity: number): void {
      state.opacity = opacity;
      redraw();
    },

    setVisible(visible: boolean): void {
      state.visible = visible;
      canvas.style.display = visible ? 'block' : 'none';
      if (visible) redraw();
    },

    remove(): void {
      map.off('move', redraw);
      map.off('zoom', redraw);
      map.off('resize', redraw);
      canvas.remove();
    },

    redraw,
  };

  return instance;
}

// ============================================================================
// Heatmap Component
// ============================================================================

/**
 * Create a heatmap layer on the map
 */
export function createHeatmapLayer(props: HeatmapLayerProps): HeatmapLayerInstance | null {
  const context = getMapContext();

  if (!context || !context.map) {
    console.warn('HeatmapLayer: No map context available.');
    return null;
  }

  const factory = getHeatmapFactory(context.provider);

  if (factory) {
    return factory(context.map, props);
  }

  // Fallback to canvas implementation
  return createCanvasHeatmap(context.map, props);
}

/**
 * HeatmapLayer component (for use with JSX)
 */
export function HeatmapLayer(props: HeatmapLayerProps): unknown {
  return {
    type: 'philjs-heatmap-layer',
    props,
    create: () => createHeatmapLayer(props),
  };
}

// ============================================================================
// Heatmap Utilities
// ============================================================================

/**
 * Generate random heatmap data for testing
 */
export function generateRandomHeatmapData(
  center: LatLng,
  count: number,
  spread = 0.1
): HeatmapPoint[] {
  const data: HeatmapPoint[] = [];

  for (let i = 0; i < count; i++) {
    data.push({
      position: {
        lat: center.lat + (Math.random() - 0.5) * spread * 2,
        lng: center.lng + (Math.random() - 0.5) * spread * 2,
      },
      weight: Math.random(),
    });
  }

  return data;
}

/**
 * Generate clustered heatmap data
 */
export function generateClusteredHeatmapData(
  centers: LatLng[],
  pointsPerCluster: number,
  clusterSpread = 0.02
): HeatmapPoint[] {
  const data: HeatmapPoint[] = [];

  for (const center of centers) {
    for (let i = 0; i < pointsPerCluster; i++) {
      // Use Gaussian distribution for more natural clustering
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(-2 * Math.log(Math.random())) * clusterSpread;

      data.push({
        position: {
          lat: center.lat + Math.cos(angle) * radius,
          lng: center.lng + Math.sin(angle) * radius,
        },
        weight: Math.random() * 0.5 + 0.5, // 0.5 - 1.0
      });
    }
  }

  return data;
}

/**
 * Normalize heatmap data weights to 0-1 range
 */
export function normalizeHeatmapData(data: HeatmapPoint[]): HeatmapPoint[] {
  if (data.length === 0) return [];

  const weights = data.map((p) => p.weight || 1);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;

  return data.map((point) => ({
    ...point,
    weight: ((point.weight || 1) - min) / range,
  }));
}

/**
 * Calculate intensity at a specific point
 */
export function calculateIntensityAt(
  position: LatLng,
  data: HeatmapPoint[],
  radius: number
): number {
  let totalIntensity = 0;
  const radiusSquared = radius * radius;

  for (const point of data) {
    const dx = (point.position.lng - position.lng) * 111319.9 * Math.cos((position.lat * Math.PI) / 180);
    const dy = (point.position.lat - position.lat) * 111319.9;
    const distSquared = dx * dx + dy * dy;

    if (distSquared <= radiusSquared) {
      // Linear falloff
      const factor = 1 - Math.sqrt(distSquared) / radius;
      totalIntensity += (point.weight || 1) * factor;
    }
  }

  return totalIntensity;
}

// Default export
export default HeatmapLayer;
