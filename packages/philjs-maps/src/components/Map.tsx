/**
 * PhilJS Maps - Base Map Component
 * Provider-agnostic map component with lazy loading and accessibility support
 */

import type {
  MapProps,
  MapInstance,
  MapContextValue,
  MapProvider,
  LatLng,
  LatLngBounds,
  MapClickEvent,
} from '../types';

// Map context for child components
let mapContext: MapContextValue | null = null;

/**
 * Get the current map context
 */
export function getMapContext(): MapContextValue | null {
  return mapContext;
}

/**
 * Set the map context (used by provider implementations)
 */
export function setMapContext(ctx: MapContextValue): void {
  mapContext = ctx;
}

/**
 * Create a map context value
 */
export function createMapContext(
  map: MapInstance | null,
  provider: MapProvider,
  apiKey?: string,
  isLoaded = false,
  error: Error | null = null
): MapContextValue {
  return { map, provider, apiKey, isLoaded, error };
}

// ============================================================================
// Lazy Loading Support
// ============================================================================

interface LazyMapState {
  isVisible: boolean;
  hasLoaded: boolean;
}

/**
 * Create a lazy loading observer for the map
 */
function createLazyObserver(
  element: HTMLElement,
  options: IntersectionObserverInit,
  onVisible: () => void
): IntersectionObserver {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        onVisible();
        observer.disconnect();
      }
    });
  }, options);

  observer.observe(element);
  return observer;
}

// ============================================================================
// Touch Gesture Support
// ============================================================================

interface TouchState {
  startX: number;
  startY: number;
  startDistance: number;
  isPinching: boolean;
  isPanning: boolean;
}

/**
 * Calculate distance between two touch points
 */
function getTouchDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Setup touch gesture handlers for the map
 */
function setupTouchGestures(
  element: HTMLElement,
  map: MapInstance,
  enabled: boolean
): () => void {
  if (!enabled) return () => {};

  const state: TouchState = {
    startX: 0,
    startY: 0,
    startDistance: 0,
    isPinching: false,
    isPanning: false,
  };

  let initialZoom = 0;
  let initialCenter: LatLng = { lat: 0, lng: 0 };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - pan
      state.isPanning = true;
      state.startX = e.touches[0].clientX;
      state.startY = e.touches[0].clientY;
      initialCenter = map.getCenter();
    } else if (e.touches.length === 2) {
      // Two touches - pinch zoom
      state.isPinching = true;
      state.isPanning = false;
      state.startDistance = getTouchDistance(e.touches[0], e.touches[1]);
      initialZoom = map.getZoom();
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (state.isPinching && e.touches.length === 2) {
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / state.startDistance;
      const newZoom = initialZoom + Math.log2(scale);
      map.setZoom(Math.max(1, Math.min(22, newZoom)));
    }
  };

  const handleTouchEnd = () => {
    state.isPinching = false;
    state.isPanning = false;
  };

  element.addEventListener('touchstart', handleTouchStart, { passive: true });
  element.addEventListener('touchmove', handleTouchMove, { passive: false });
  element.addEventListener('touchend', handleTouchEnd, { passive: true });

  return () => {
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  };
}

// ============================================================================
// Keyboard Navigation Support
// ============================================================================

/**
 * Setup keyboard navigation for accessibility
 */
function setupKeyboardNavigation(
  element: HTMLElement,
  map: MapInstance,
  enabled: boolean
): () => void {
  if (!enabled) return () => {};

  const PAN_AMOUNT = 50; // pixels
  const ZOOM_AMOUNT = 1;

  const handleKeyDown = (e: KeyboardEvent) => {
    // Skip if focus is on an input element
    if ((e.target as HTMLElement).tagName === 'INPUT') return;

    const bounds = map.getBounds();
    const center = map.getCenter();
    const latDelta = (bounds.north - bounds.south) * (PAN_AMOUNT / element.clientHeight);
    const lngDelta = (bounds.east - bounds.west) * (PAN_AMOUNT / element.clientWidth);

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        map.panTo({ lat: center.lat + latDelta, lng: center.lng });
        break;
      case 'ArrowDown':
        e.preventDefault();
        map.panTo({ lat: center.lat - latDelta, lng: center.lng });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        map.panTo({ lat: center.lat, lng: center.lng - lngDelta });
        break;
      case 'ArrowRight':
        e.preventDefault();
        map.panTo({ lat: center.lat, lng: center.lng + lngDelta });
        break;
      case '+':
      case '=':
        e.preventDefault();
        map.setZoom(map.getZoom() + ZOOM_AMOUNT);
        break;
      case '-':
      case '_':
        e.preventDefault();
        map.setZoom(map.getZoom() - ZOOM_AMOUNT);
        break;
      case 'Home':
        e.preventDefault();
        map.setZoom(map.getZoom() + 5);
        break;
      case 'End':
        e.preventDefault();
        map.setZoom(map.getZoom() - 5);
        break;
    }
  };

  element.addEventListener('keydown', handleKeyDown);
  return () => element.removeEventListener('keydown', handleKeyDown);
}

// ============================================================================
// Map Component
// ============================================================================

/**
 * Base Map component props with provider-specific options
 */
export interface MapComponentProps extends MapProps {
  /** Provider-specific initialization function */
  initializeProvider?: (
    container: HTMLElement,
    props: MapProps
  ) => Promise<MapInstance>;
}

/**
 * Map state
 */
interface MapState {
  isLoaded: boolean;
  error: Error | null;
  map: MapInstance | null;
}

/**
 * Create the map container element
 */
function createMapContainer(props: MapProps): HTMLDivElement {
  const container = document.createElement('div');

  // Set dimensions
  const width = typeof props.width === 'number' ? `${props.width}px` : props.width || '100%';
  const height = typeof props.height === 'number' ? `${props.height}px` : props.height || '400px';

  container.style.width = width;
  container.style.height = height;
  container.style.position = 'relative';

  // Apply custom styles
  if (props.style) {
    Object.assign(container.style, props.style);
  }

  // Apply class name
  if (props.className) {
    container.className = props.className;
  }

  // Accessibility attributes
  container.setAttribute('role', 'application');
  container.setAttribute('aria-label', props.ariaLabel || 'Interactive map');

  if (props.keyboardNavigation !== false) {
    container.setAttribute('tabindex', '0');
  }

  return container;
}

/**
 * Create a loading placeholder
 */
function createLoadingPlaceholder(): HTMLDivElement {
  const placeholder = document.createElement('div');
  placeholder.className = 'philjs-map-loading';
  placeholder.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: #f0f0f0;
    color: #666;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  placeholder.innerHTML = `
    <div style="text-align: center;">
      <div style="
        width: 40px;
        height: 40px;
        border: 3px solid #ddd;
        border-top-color: #3498db;
        border-radius: 50%;
        animation: philjs-map-spin 1s linear infinite;
        margin: 0 auto 10px;
      "></div>
      <span>Loading map...</span>
    </div>
    <style>
      @keyframes philjs-map-spin {
        to { transform: rotate(360deg); }
      }
    </style>
  `;
  placeholder.setAttribute('aria-live', 'polite');
  placeholder.setAttribute('aria-busy', 'true');
  return placeholder;
}

/**
 * Create an error placeholder
 */
function createErrorPlaceholder(error: Error): HTMLDivElement {
  const placeholder = document.createElement('div');
  placeholder.className = 'philjs-map-error';
  placeholder.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: #fee;
    color: #c00;
    font-family: system-ui, -apple-system, sans-serif;
    padding: 20px;
    box-sizing: border-box;
  `;
  placeholder.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 24px; margin-bottom: 10px;">!</div>
      <div>Failed to load map</div>
      <div style="font-size: 12px; margin-top: 5px; opacity: 0.7;">${error.message}</div>
    </div>
  `;
  placeholder.setAttribute('role', 'alert');
  return placeholder;
}

/**
 * Initialize the map with the selected provider
 */
async function initializeMap(
  container: HTMLElement,
  props: MapComponentProps,
  state: MapState
): Promise<void> {
  try {
    if (!props.initializeProvider) {
      throw new Error('No map provider specified. Use GoogleMap, MapboxMap, or LeafletMap component.');
    }

    const map = await props.initializeProvider(container, props);
    state.map = map;
    state.isLoaded = true;

    // Set up context
    setMapContext(createMapContext(
      map,
      props.provider || 'leaflet',
      props.apiKey,
      true
    ));

    // Set up touch gestures
    const cleanupTouch = setupTouchGestures(
      container,
      map,
      props.touchGestures !== false
    );

    // Set up keyboard navigation
    const cleanupKeyboard = setupKeyboardNavigation(
      container,
      map,
      props.keyboardNavigation !== false
    );

    // Set up event listeners
    if (props.onClick) {
      map.on('click', (e: MapClickEvent) => props.onClick?.(e));
    }

    if (props.onZoomChange) {
      map.on('zoom', () => props.onZoomChange?.(map.getZoom()));
    }

    if (props.onCenterChange) {
      map.on('move', () => props.onCenterChange?.(map.getCenter()));
    }

    if (props.onBoundsChange) {
      map.on('moveend', () => props.onBoundsChange?.(map.getBounds()));
    }

    if (props.onDragStart) {
      map.on('dragstart', () => props.onDragStart?.());
    }

    if (props.onDragEnd) {
      map.on('dragend', () => props.onDragEnd?.());
    }

    // Call onLoad callback
    props.onLoad?.(map);

  } catch (error) {
    state.error = error instanceof Error ? error : new Error(String(error));
    setMapContext(createMapContext(
      null,
      props.provider || 'leaflet',
      props.apiKey,
      false,
      state.error
    ));
  }
}

/**
 * Map component factory
 * Creates a PhilJS-compatible map component
 */
export function createMap(props: MapComponentProps): HTMLElement {
  const container = createMapContainer(props);
  const state: MapState = {
    isLoaded: false,
    error: null,
    map: null,
  };

  if (props.lazy) {
    // Lazy load - show placeholder until visible
    const placeholder = createLoadingPlaceholder();
    container.appendChild(placeholder);

    createLazyObserver(
      container,
      props.lazyOptions || { rootMargin: '100px' },
      async () => {
        container.removeChild(placeholder);
        await initializeMap(container, props, state);

        if (state.error) {
          container.appendChild(createErrorPlaceholder(state.error));
        }
      }
    );
  } else {
    // Immediate load
    const placeholder = createLoadingPlaceholder();
    container.appendChild(placeholder);

    initializeMap(container, props, state).then(() => {
      if (placeholder.parentNode === container) {
        container.removeChild(placeholder);
      }

      if (state.error) {
        container.appendChild(createErrorPlaceholder(state.error));
      }
    });
  }

  return container;
}

/**
 * Map component (for use with JSX)
 * This is a functional component that returns a map container
 */
export function Map(props: MapProps): unknown {
  // In a full implementation, this would integrate with PhilJS's rendering system
  // For now, we return the configuration for the map
  return {
    type: 'philjs-map',
    props,
    create: () => createMap(props as MapComponentProps),
  };
}

// Default export
export default Map;
