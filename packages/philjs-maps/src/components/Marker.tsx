/**
 * PhilJS Maps - Marker Component
 * Provider-agnostic marker with accessibility support
 */

import type { MarkerProps, MarkerIcon, LatLng, MapInstance, MarkerEvent } from '../types';
import { getMapContext } from './Map';

// ============================================================================
// Marker Abstraction
// ============================================================================

/**
 * Abstract marker instance
 */
export interface MarkerInstance {
  native: unknown;
  getPosition(): LatLng;
  setPosition(position: LatLng): void;
  setIcon(icon: string | MarkerIcon): void;
  setDraggable(draggable: boolean): void;
  setOpacity(opacity: number): void;
  setVisible(visible: boolean): void;
  setZIndex(zIndex: number): void;
  remove(): void;
  on(event: string, handler: (e: MarkerEvent) => void): void;
  off(event: string, handler: (e: MarkerEvent) => void): void;
  openPopup(content: unknown): void;
  closePopup(): void;
}

/**
 * Marker factory function type
 */
export type CreateMarkerFn = (
  map: MapInstance,
  props: MarkerProps
) => MarkerInstance;

// Provider-specific marker factories (set by provider modules)
const markerFactories: Record<string, CreateMarkerFn> = {};

/**
 * Register a marker factory for a provider
 */
export function registerMarkerFactory(provider: string, factory: CreateMarkerFn): void {
  markerFactories[provider] = factory;
}

/**
 * Get the marker factory for the current provider
 */
export function getMarkerFactory(provider: string): CreateMarkerFn | undefined {
  return markerFactories[provider];
}

// ============================================================================
// Default Marker Icon
// ============================================================================

/**
 * Create a default marker icon SVG
 */
export function createDefaultMarkerIcon(color = '#3498db'): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path fill="${color}" filter="url(#shadow)" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z"/>
      <circle fill="white" cx="12" cy="12" r="5"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Create a numbered marker icon SVG
 */
export function createNumberedMarkerIcon(number: number, color = '#3498db'): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" flood-opacity="0.3"/>
        </filter>
      </defs>
      <path fill="${color}" filter="url(#shadow)" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z"/>
      <circle fill="white" cx="12" cy="12" r="7"/>
      <text x="12" y="16" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="${color}">${number}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// ============================================================================
// Accessibility Support
// ============================================================================

/**
 * Create an accessible marker element
 */
function createAccessibleMarkerElement(props: MarkerProps): HTMLElement {
  const element = document.createElement('div');
  element.setAttribute('role', 'button');
  element.setAttribute('tabindex', '0');
  element.setAttribute('aria-label', props.ariaLabel || props.title || 'Map marker');

  if (props.draggable) {
    element.setAttribute('aria-grabbed', 'false');
  }

  // Keyboard support
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // Trigger click
      element.click();
    }
  });

  return element;
}

// ============================================================================
// Marker Component
// ============================================================================

/**
 * Marker state
 */
interface MarkerState {
  instance: MarkerInstance | null;
  isHovered: boolean;
  isPopupOpen: boolean;
}

/**
 * Create a marker on the map
 */
export function createMarker(props: MarkerProps): MarkerInstance | null {
  const context = getMapContext();

  if (!context || !context.map) {
    console.warn('Marker: No map context available. Ensure Marker is a child of a Map component.');
    return null;
  }

  const factory = getMarkerFactory(context.provider);

  if (!factory) {
    console.warn(`Marker: No marker factory registered for provider "${context.provider}"`);
    return null;
  }

  const marker = factory(context.map, props);

  // Set up event handlers
  if (props.onClick) {
    marker.on('click', props.onClick);
  }

  if (props.onDragEnd) {
    marker.on('dragend', (e: MarkerEvent) => {
      props.onDragEnd?.(e.position);
    });
  }

  if (props.onMouseEnter) {
    marker.on('mouseenter', props.onMouseEnter as unknown as (e: MarkerEvent) => void);
  }

  if (props.onMouseLeave) {
    marker.on('mouseleave', props.onMouseLeave as unknown as (e: MarkerEvent) => void);
  }

  // Handle popup content (children)
  if (props.children) {
    marker.on('click', () => {
      marker.openPopup(props.children);
    });
  }

  return marker;
}

/**
 * Marker component (for use with JSX)
 */
export function Marker(props: MarkerProps): unknown {
  return {
    type: 'philjs-marker',
    props,
    create: () => createMarker(props),
  };
}

// ============================================================================
// Marker Utilities
// ============================================================================

/**
 * Update marker position with animation
 */
export function animateMarkerTo(
  marker: MarkerInstance,
  destination: LatLng,
  duration = 1000
): Promise<void> {
  return new Promise((resolve) => {
    const start = marker.getPosition();
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      const lat = start.lat + (destination.lat - start.lat) * eased;
      const lng = start.lng + (destination.lng - start.lng) * eased;

      marker.setPosition({ lat, lng });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

/**
 * Bounce animation for marker
 */
export function bounceMarker(marker: MarkerInstance, duration = 500): Promise<void> {
  return new Promise((resolve) => {
    const position = marker.getPosition();
    const startTime = performance.now();
    const bounceHeight = 0.0001; // Approximate degrees for visual bounce

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        marker.setPosition(position);
        resolve();
        return;
      }

      // Bounce easing
      const bounce = Math.sin(progress * Math.PI) * (1 - progress);
      marker.setPosition({
        lat: position.lat + bounce * bounceHeight,
        lng: position.lng,
      });

      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  });
}

/**
 * Create a draggable marker with constrained bounds
 */
export function createConstrainedDraggableMarker(
  props: MarkerProps,
  bounds: { north: number; south: number; east: number; west: number }
): MarkerInstance | null {
  const marker = createMarker({
    ...props,
    draggable: true,
    onDragEnd: (position) => {
      // Constrain to bounds
      const constrainedPosition: LatLng = {
        lat: Math.max(bounds.south, Math.min(bounds.north, position.lat)),
        lng: Math.max(bounds.west, Math.min(bounds.east, position.lng)),
      };

      if (
        constrainedPosition.lat !== position.lat ||
        constrainedPosition.lng !== position.lng
      ) {
        marker?.setPosition(constrainedPosition);
      }

      props.onDragEnd?.(constrainedPosition);
    },
  });

  return marker;
}

// Default export
export default Marker;
