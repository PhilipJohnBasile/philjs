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

// ============================================================================
// Core Map Components
// ============================================================================

import type {
  MapProps,
  MarkerProps,
  PolylineProps,
  PolygonProps,
  PopupProps,
  HeatmapLayerProps,
  GeoJSONProps,
  SearchBoxProps,
  DirectionsRendererProps,
  DirectionsRequest,
  DirectionsResult,
  GeocodeRequest,
  GeocodeResult,
  MapInstance,
  MapProvider,
  LatLng,
  LatLngBounds,
  MarkerClusterProps,
  ClusterData,
  GeolocationOptions,
  GeolocationState,
  MapContextValue,
  PlaceResult,
} from './types.js';

// ============================================================================
// Reactive Signals
// ============================================================================

type SignalGetter<T> = () => T;
type SignalSetter<T> = (value: T | ((prev: T) => T)) => void;
type Signal<T> = SignalGetter<T> & { set: SignalSetter<T>; subscribe: (fn: () => void) => () => void };

function createSignal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<() => void>();

  const getter = (() => value) as Signal<T>;
  getter.set = (newValue: T | ((prev: T) => T)) => {
    const nextValue = typeof newValue === 'function' ? (newValue as (prev: T) => T)(value) : newValue;
    if (value !== nextValue) {
      value = nextValue;
      subscribers.forEach((fn) => fn());
    }
  };
  getter.subscribe = (fn: () => void) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  };

  return getter;
}

function createEffect(fn: () => void | (() => void)): () => void {
  let cleanup: void | (() => void);
  const run = () => {
    if (cleanup) cleanup();
    cleanup = fn();
  };
  run();
  return () => {
    if (cleanup) cleanup();
  };
}

// ============================================================================
// Map Context
// ============================================================================

let currentMapContext: MapContextValue | null = null;

/**
 * Get the current map context
 */
export function useMapContext(): MapContextValue {
  if (!currentMapContext) {
    throw new Error('useMapContext must be used within a Map component');
  }
  return currentMapContext;
}

/**
 * Set map context (internal use)
 */
function setMapContext(ctx: MapContextValue | null): void {
  currentMapContext = ctx;
}

// ============================================================================
// Provider Loaders
// ============================================================================

interface ProviderLoader {
  load: (apiKey?: string) => Promise<void>;
  isLoaded: () => boolean;
}

const providerLoaders: Record<MapProvider, ProviderLoader> = {
  google: {
    load: async (apiKey) => {
      if ((window as any).google?.maps) return;
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,drawing,visualization`;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps'));
        document.head.appendChild(script);
      });
    },
    isLoaded: () => !!(window as any).google?.maps,
  },
  mapbox: {
    load: async (accessToken) => {
      if ((window as any).mapboxgl) return;
      return new Promise((resolve, reject) => {
        // Load CSS
        const link = document.createElement('link');
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Load JS
        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.0.0/mapbox-gl.js';
        script.async = true;
        script.onload = () => {
          (window as any).mapboxgl.accessToken = accessToken;
          resolve();
        };
        script.onerror = () => reject(new Error('Failed to load Mapbox'));
        document.head.appendChild(script);
      });
    },
    isLoaded: () => !!(window as any).mapboxgl,
  },
  leaflet: {
    load: async () => {
      if ((window as any).L) return;
      return new Promise((resolve, reject) => {
        // Load CSS
        const link = document.createElement('link');
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        // Load JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Leaflet'));
        document.head.appendChild(script);
      });
    },
    isLoaded: () => !!(window as any).L,
  },
};

// ============================================================================
// Map Component
// ============================================================================

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
export function createMap(config: { provider: MapProvider; apiKey?: string }) {
  const { provider, apiKey } = config;

  // Shared state
  const mapInstance = createSignal<MapInstance | null>(null);
  const isLoaded = createSignal(false);
  const error = createSignal<Error | null>(null);

  // Load provider SDK
  const loadProvider = async (): Promise<void> => {
    try {
      await providerLoaders[provider].load(apiKey);
      isLoaded.set(true);
    } catch (e) {
      error.set(e as Error);
    }
  };

  /**
   * Map component
   */
  function Map(props: MapProps): HTMLElement {
    const container = document.createElement('div');
    container.className = props.className || '';
    container.style.width = typeof props.width === 'number' ? `${props.width}px` : (props.width || '100%');
    container.style.height = typeof props.height === 'number' ? `${props.height}px` : (props.height || '400px');

    if (props.ariaLabel) {
      container.setAttribute('aria-label', props.ariaLabel);
      container.setAttribute('role', 'application');
    }

    // Apply inline styles
    if (props.style) {
      Object.assign(container.style, props.style);
    }

    // Lazy loading with IntersectionObserver
    if (props.lazy) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            observer.disconnect();
            initializeMap();
          }
        },
        props.lazyOptions
      );
      observer.observe(container);
    } else {
      // Initialize immediately
      loadProvider().then(initializeMap);
    }

    async function initializeMap(): Promise<void> {
      if (!isLoaded()) await loadProvider();
      if (error()) return;

      const center = props.center || { lat: 0, lng: 0 };
      const zoom = props.zoom ?? 10;

      let map: MapInstance;

      switch (provider) {
        case 'google': {
          const google = (window as any).google;
          const nativeMap = new google.maps.Map(container, {
            center,
            zoom,
            scrollwheel: props.scrollWheelZoom ?? true,
            disableDoubleClickZoom: !(props.doubleClickZoom ?? true),
            draggable: props.draggable ?? true,
            minZoom: props.minZoom,
            maxZoom: props.maxZoom,
            restriction: props.maxBounds
              ? { latLngBounds: props.maxBounds, strictBounds: true }
              : undefined,
            keyboardShortcuts: props.keyboardNavigation ?? true,
          });

          map = createGoogleMapInstance(nativeMap);
          break;
        }

        case 'mapbox': {
          const mapboxgl = (window as any).mapboxgl;
          const nativeMap = new mapboxgl.Map({
            container,
            style: props.styleUrl || 'mapbox://styles/mapbox/streets-v12',
            center: [center.lng, center.lat],
            zoom,
            scrollZoom: props.scrollWheelZoom ?? true,
            doubleClickZoom: props.doubleClickZoom ?? true,
            dragPan: props.draggable ?? true,
            minZoom: props.minZoom,
            maxZoom: props.maxZoom,
            maxBounds: props.maxBounds
              ? [[props.maxBounds.west, props.maxBounds.south], [props.maxBounds.east, props.maxBounds.north]]
              : undefined,
            keyboard: props.keyboardNavigation ?? true,
          });

          map = createMapboxInstance(nativeMap);
          break;
        }

        case 'leaflet': {
          const L = (window as any).L;
          const nativeMap = L.map(container, {
            center: [center.lat, center.lng],
            zoom,
            scrollWheelZoom: props.scrollWheelZoom ?? true,
            doubleClickZoom: props.doubleClickZoom ?? true,
            dragging: props.draggable ?? true,
            minZoom: props.minZoom,
            maxZoom: props.maxZoom,
            maxBounds: props.maxBounds
              ? L.latLngBounds(
                  [props.maxBounds.south, props.maxBounds.west],
                  [props.maxBounds.north, props.maxBounds.east]
                )
              : undefined,
            keyboard: props.keyboardNavigation ?? true,
          });

          // Add default tile layer
          L.tileLayer(props.styleUrl || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
          }).addTo(nativeMap);

          map = createLeafletInstance(nativeMap);
          break;
        }
      }

      mapInstance.set(map);

      // Set up context
      setMapContext({
        map,
        provider,
        apiKey,
        isLoaded: true,
        error: null,
      });

      // Call onLoad callback
      props.onLoad?.(map);

      // Set up event handlers
      if (props.onClick) {
        map.on('click', (e: any) => {
          props.onClick?.({
            type: 'click',
            latlng: e.latlng,
            pixel: e.pixel || { x: 0, y: 0 },
            target: map,
          });
        });
      }

      if (props.onZoomChange) {
        map.on('zoom', () => {
          props.onZoomChange?.(map.getZoom());
        });
      }

      if (props.onCenterChange) {
        map.on('moveend', () => {
          props.onCenterChange?.(map.getCenter());
        });
      }

      if (props.onBoundsChange) {
        map.on('moveend', () => {
          props.onBoundsChange?.(map.getBounds());
        });
      }

      if (props.onDragStart) {
        map.on('dragstart', () => props.onDragStart?.());
      }

      if (props.onDragEnd) {
        map.on('dragend', () => props.onDragEnd?.());
      }
    }

    return container;
  }

  /**
   * Marker component
   */
  function Marker(props: MarkerProps): { remove: () => void; update: (props: Partial<MarkerProps>) => void } {
    const map = mapInstance();
    if (!map) throw new Error('Marker must be used within a Map component');

    let marker: any;
    let popup: any;

    switch (provider) {
      case 'google': {
        const google = (window as any).google;
        marker = new google.maps.Marker({
          position: props.position,
          map: map.native,
          title: props.title,
          draggable: props.draggable,
          opacity: props.opacity,
          zIndex: props.zIndex,
          icon: typeof props.icon === 'string' ? props.icon : props.icon?.url,
        });

        if (props.onClick) {
          marker.addListener('click', () => {
            props.onClick?.({ type: 'click', marker, position: marker.getPosition().toJSON(), target: map });
          });
        }

        if (props.onDragEnd) {
          marker.addListener('dragend', () => {
            props.onDragEnd?.(marker.getPosition().toJSON());
          });
        }

        if (props.onMouseEnter) {
          marker.addListener('mouseover', () => props.onMouseEnter?.());
        }

        if (props.onMouseLeave) {
          marker.addListener('mouseout', () => props.onMouseLeave?.());
        }
        break;
      }

      case 'mapbox': {
        const mapboxgl = (window as any).mapboxgl;
        const el = document.createElement('div');
        el.className = 'philjs-marker';

        if (typeof props.icon === 'string') {
          el.style.backgroundImage = `url(${props.icon})`;
          el.style.width = '32px';
          el.style.height = '32px';
          el.style.backgroundSize = 'cover';
        }

        marker = new mapboxgl.Marker({
          element: el,
          draggable: props.draggable,
          anchor: 'bottom',
        })
          .setLngLat([props.position.lng, props.position.lat])
          .addTo(map.native);

        if (props.onClick) {
          el.addEventListener('click', () => {
            props.onClick?.({ type: 'click', marker, position: props.position, target: map });
          });
        }

        if (props.onDragEnd) {
          marker.on('dragend', () => {
            const lngLat = marker.getLngLat();
            props.onDragEnd?.({ lat: lngLat.lat, lng: lngLat.lng });
          });
        }

        if (props.onMouseEnter) {
          el.addEventListener('mouseenter', () => props.onMouseEnter?.());
        }

        if (props.onMouseLeave) {
          el.addEventListener('mouseleave', () => props.onMouseLeave?.());
        }
        break;
      }

      case 'leaflet': {
        const L = (window as any).L;
        const iconOptions = typeof props.icon === 'string'
          ? { iconUrl: props.icon }
          : props.icon
            ? { iconUrl: props.icon.url, iconSize: props.icon.size ? [props.icon.size.x, props.icon.size.y] : undefined }
            : undefined;

        marker = L.marker([props.position.lat, props.position.lng], {
          title: props.title,
          draggable: props.draggable,
          opacity: props.opacity,
          zIndexOffset: props.zIndex,
          icon: iconOptions ? L.icon(iconOptions) : undefined,
        }).addTo(map.native);

        if (props.onClick) {
          marker.on('click', () => {
            props.onClick?.({ type: 'click', marker, position: props.position, target: map });
          });
        }

        if (props.onDragEnd) {
          marker.on('dragend', () => {
            const latlng = marker.getLatLng();
            props.onDragEnd?.({ lat: latlng.lat, lng: latlng.lng });
          });
        }

        if (props.onMouseEnter) {
          marker.on('mouseover', () => props.onMouseEnter?.());
        }

        if (props.onMouseLeave) {
          marker.on('mouseout', () => props.onMouseLeave?.());
        }
        break;
      }
    }

    // Set accessibility attributes
    if (props.ariaLabel && marker.getElement) {
      const el = marker.getElement();
      if (el) {
        el.setAttribute('aria-label', props.ariaLabel);
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
      }
    }

    return {
      remove: () => {
        switch (provider) {
          case 'google':
            marker.setMap(null);
            break;
          case 'mapbox':
            marker.remove();
            break;
          case 'leaflet':
            marker.remove();
            break;
        }
      },
      update: (newProps: Partial<MarkerProps>) => {
        if (newProps.position) {
          switch (provider) {
            case 'google':
              marker.setPosition(newProps.position);
              break;
            case 'mapbox':
              marker.setLngLat([newProps.position.lng, newProps.position.lat]);
              break;
            case 'leaflet':
              marker.setLatLng([newProps.position.lat, newProps.position.lng]);
              break;
          }
        }
      },
    };
  }

  /**
   * Popup component
   */
  function Popup(props: PopupProps): { remove: () => void; open: () => void; close: () => void } {
    const map = mapInstance();
    if (!map) throw new Error('Popup must be used within a Map component');

    let popup: any;

    // Create popup content container
    const content = document.createElement('div');
    content.className = props.className || '';
    if (props.ariaLabel) {
      content.setAttribute('aria-label', props.ariaLabel);
      content.setAttribute('role', props.role || 'dialog');
    }

    // Append children content
    if (typeof props.children === 'string') {
      content.innerHTML = props.children;
    } else if (props.children instanceof HTMLElement) {
      content.appendChild(props.children);
    }

    switch (provider) {
      case 'google': {
        const google = (window as any).google;
        popup = new google.maps.InfoWindow({
          content,
          position: props.position,
          maxWidth: props.maxWidth,
        });

        if (props.open) {
          popup.open(map.native);
        }

        popup.addListener('closeclick', () => {
          props.onClose?.();
        });
        break;
      }

      case 'mapbox': {
        const mapboxgl = (window as any).mapboxgl;
        popup = new mapboxgl.Popup({
          closeButton: props.closeButton ?? true,
          closeOnClick: props.closeOnClick ?? true,
          maxWidth: props.maxWidth ? `${props.maxWidth}px` : undefined,
          offset: props.offset ? [props.offset.x, props.offset.y] : undefined,
        })
          .setLngLat([props.position.lng, props.position.lat])
          .setDOMContent(content);

        if (props.open) {
          popup.addTo(map.native);
        }

        popup.on('close', () => {
          props.onClose?.();
        });
        break;
      }

      case 'leaflet': {
        const L = (window as any).L;
        popup = L.popup({
          closeButton: props.closeButton ?? true,
          closeOnClick: props.closeOnClick ?? true,
          maxWidth: props.maxWidth,
          minWidth: props.minWidth,
          offset: props.offset ? L.point(props.offset.x, props.offset.y) : undefined,
        })
          .setLatLng([props.position.lat, props.position.lng])
          .setContent(content);

        if (props.open) {
          popup.openOn(map.native);
        }

        popup.on('remove', () => {
          props.onClose?.();
        });
        break;
      }
    }

    // Handle escape key
    if (props.closeOnEscape !== false) {
      const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closePopup();
          props.onClose?.();
        }
      };
      document.addEventListener('keydown', handleKeydown);
    }

    function closePopup(): void {
      switch (provider) {
        case 'google':
          popup.close();
          break;
        case 'mapbox':
        case 'leaflet':
          popup.remove();
          break;
      }
    }

    function openPopup(): void {
      switch (provider) {
        case 'google':
          popup.open(map.native);
          break;
        case 'mapbox':
          popup.addTo(map.native);
          break;
        case 'leaflet':
          popup.openOn(map.native);
          break;
      }
    }

    return {
      remove: closePopup,
      open: openPopup,
      close: closePopup,
    };
  }

  /**
   * Polyline component
   */
  function Polyline(props: PolylineProps): { remove: () => void; setPath: (path: LatLng[]) => void } {
    const map = mapInstance();
    if (!map) throw new Error('Polyline must be used within a Map component');

    let polyline: any;

    switch (provider) {
      case 'google': {
        const google = (window as any).google;
        polyline = new google.maps.Polyline({
          path: props.path,
          map: map.native,
          strokeColor: props.strokeColor || '#3388ff',
          strokeWeight: props.strokeWeight || 3,
          strokeOpacity: props.strokeOpacity || 1,
          editable: props.editable,
          zIndex: props.zIndex,
        });

        if (props.onClick) {
          polyline.addListener('click', (e: any) => {
            props.onClick?.({ type: 'click', latlng: e.latLng.toJSON(), target: map });
          });
        }

        if (props.onEdit) {
          polyline.getPath().addListener('set_at', () => {
            const path = polyline.getPath().getArray().map((p: any) => p.toJSON());
            props.onEdit?.(path);
          });
        }
        break;
      }

      case 'mapbox': {
        const id = `polyline-${Date.now()}`;
        map.native.addSource(id, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: props.path.map((p) => [p.lng, p.lat]),
            },
          },
        });

        map.native.addLayer({
          id,
          type: 'line',
          source: id,
          paint: {
            'line-color': props.strokeColor || '#3388ff',
            'line-width': props.strokeWeight || 3,
            'line-opacity': props.strokeOpacity || 1,
          },
        });

        polyline = { id, source: id };

        if (props.onClick) {
          map.native.on('click', id, (e: any) => {
            props.onClick?.({
              type: 'click',
              latlng: { lat: e.lngLat.lat, lng: e.lngLat.lng },
              target: map,
            });
          });
        }
        break;
      }

      case 'leaflet': {
        const L = (window as any).L;
        polyline = L.polyline(
          props.path.map((p) => [p.lat, p.lng]),
          {
            color: props.strokeColor || '#3388ff',
            weight: props.strokeWeight || 3,
            opacity: props.strokeOpacity || 1,
          }
        ).addTo(map.native);

        if (props.onClick) {
          polyline.on('click', (e: any) => {
            props.onClick?.({ type: 'click', latlng: { lat: e.latlng.lat, lng: e.latlng.lng }, target: map });
          });
        }
        break;
      }
    }

    return {
      remove: () => {
        switch (provider) {
          case 'google':
            polyline.setMap(null);
            break;
          case 'mapbox':
            map.native.removeLayer(polyline.id);
            map.native.removeSource(polyline.source);
            break;
          case 'leaflet':
            polyline.remove();
            break;
        }
      },
      setPath: (path: LatLng[]) => {
        switch (provider) {
          case 'google':
            polyline.setPath(path);
            break;
          case 'mapbox':
            map.native.getSource(polyline.source).setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: path.map((p) => [p.lng, p.lat]),
              },
            });
            break;
          case 'leaflet':
            polyline.setLatLngs(path.map((p) => [p.lat, p.lng]));
            break;
        }
      },
    };
  }

  /**
   * Polygon component
   */
  function Polygon(props: PolygonProps): { remove: () => void; setPath: (path: LatLng[]) => void } {
    const map = mapInstance();
    if (!map) throw new Error('Polygon must be used within a Map component');

    let polygon: any;

    switch (provider) {
      case 'google': {
        const google = (window as any).google;
        polygon = new google.maps.Polygon({
          paths: props.holes ? [props.path, ...props.holes] : props.path,
          map: map.native,
          strokeColor: props.strokeColor || '#3388ff',
          strokeWeight: props.strokeWeight || 2,
          strokeOpacity: props.strokeOpacity || 1,
          fillColor: props.fillColor || '#3388ff',
          fillOpacity: props.fillOpacity || 0.3,
          editable: props.editable,
          zIndex: props.zIndex,
        });

        if (props.onClick) {
          polygon.addListener('click', (e: any) => {
            props.onClick?.({ type: 'click', latlng: e.latLng.toJSON(), target: map });
          });
        }
        break;
      }

      case 'mapbox': {
        const id = `polygon-${Date.now()}`;
        map.native.addSource(id, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [
                props.path.map((p) => [p.lng, p.lat]),
                ...(props.holes?.map((h) => h.map((p) => [p.lng, p.lat])) || []),
              ],
            },
          },
        });

        map.native.addLayer({
          id,
          type: 'fill',
          source: id,
          paint: {
            'fill-color': props.fillColor || '#3388ff',
            'fill-opacity': props.fillOpacity || 0.3,
          },
        });

        map.native.addLayer({
          id: `${id}-outline`,
          type: 'line',
          source: id,
          paint: {
            'line-color': props.strokeColor || '#3388ff',
            'line-width': props.strokeWeight || 2,
            'line-opacity': props.strokeOpacity || 1,
          },
        });

        polygon = { id, source: id };
        break;
      }

      case 'leaflet': {
        const L = (window as any).L;
        polygon = L.polygon(
          props.holes
            ? [props.path.map((p) => [p.lat, p.lng]), ...props.holes.map((h) => h.map((p) => [p.lat, p.lng]))]
            : props.path.map((p) => [p.lat, p.lng]),
          {
            color: props.strokeColor || '#3388ff',
            weight: props.strokeWeight || 2,
            opacity: props.strokeOpacity || 1,
            fillColor: props.fillColor || '#3388ff',
            fillOpacity: props.fillOpacity || 0.3,
          }
        ).addTo(map.native);

        if (props.onClick) {
          polygon.on('click', (e: any) => {
            props.onClick?.({ type: 'click', latlng: { lat: e.latlng.lat, lng: e.latlng.lng }, target: map });
          });
        }
        break;
      }
    }

    return {
      remove: () => {
        switch (provider) {
          case 'google':
            polygon.setMap(null);
            break;
          case 'mapbox':
            map.native.removeLayer(`${polygon.id}-outline`);
            map.native.removeLayer(polygon.id);
            map.native.removeSource(polygon.source);
            break;
          case 'leaflet':
            polygon.remove();
            break;
        }
      },
      setPath: (path: LatLng[]) => {
        switch (provider) {
          case 'google':
            polygon.setPath(path);
            break;
          case 'mapbox':
            map.native.getSource(polygon.source).setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Polygon',
                coordinates: [path.map((p) => [p.lng, p.lat])],
              },
            });
            break;
          case 'leaflet':
            polygon.setLatLngs(path.map((p) => [p.lat, p.lng]));
            break;
        }
      },
    };
  }

  return {
    Map,
    Marker,
    Popup,
    Polyline,
    Polygon,
    mapInstance,
    isLoaded,
    error,
  };
}

// ============================================================================
// Map Instance Factories
// ============================================================================

function createGoogleMapInstance(nativeMap: any): MapInstance {
  return {
    provider: 'google',
    native: nativeMap,
    getCenter: () => {
      const center = nativeMap.getCenter();
      return { lat: center.lat(), lng: center.lng() };
    },
    setCenter: (center) => nativeMap.setCenter(center),
    getZoom: () => nativeMap.getZoom(),
    setZoom: (zoom) => nativeMap.setZoom(zoom),
    getBounds: () => {
      const bounds = nativeMap.getBounds();
      if (!bounds) return { north: 0, south: 0, east: 0, west: 0 };
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      return { north: ne.lat(), south: sw.lat(), east: ne.lng(), west: sw.lng() };
    },
    fitBounds: (bounds, padding) => {
      const google = (window as any).google;
      const gBounds = new google.maps.LatLngBounds(
        { lat: bounds.south, lng: bounds.west },
        { lat: bounds.north, lng: bounds.east }
      );
      nativeMap.fitBounds(gBounds, padding);
    },
    panTo: (center) => nativeMap.panTo(center),
    on: (event, handler) => nativeMap.addListener(event, handler),
    off: (event, handler) => {
      const google = (window as any).google;
      google.maps.event.clearListeners(nativeMap, event);
    },
  };
}

function createMapboxInstance(nativeMap: any): MapInstance {
  return {
    provider: 'mapbox',
    native: nativeMap,
    getCenter: () => {
      const center = nativeMap.getCenter();
      return { lat: center.lat, lng: center.lng };
    },
    setCenter: (center) => nativeMap.setCenter([center.lng, center.lat]),
    getZoom: () => nativeMap.getZoom(),
    setZoom: (zoom) => nativeMap.setZoom(zoom),
    getBounds: () => {
      const bounds = nativeMap.getBounds();
      return {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      };
    },
    fitBounds: (bounds, padding) => {
      nativeMap.fitBounds(
        [[bounds.west, bounds.south], [bounds.east, bounds.north]],
        { padding }
      );
    },
    panTo: (center) => nativeMap.panTo([center.lng, center.lat]),
    on: (event, handler) => nativeMap.on(event, handler),
    off: (event, handler) => nativeMap.off(event, handler),
  };
}

function createLeafletInstance(nativeMap: any): MapInstance {
  return {
    provider: 'leaflet',
    native: nativeMap,
    getCenter: () => {
      const center = nativeMap.getCenter();
      return { lat: center.lat, lng: center.lng };
    },
    setCenter: (center) => nativeMap.setView([center.lat, center.lng], nativeMap.getZoom()),
    getZoom: () => nativeMap.getZoom(),
    setZoom: (zoom) => nativeMap.setZoom(zoom),
    getBounds: () => {
      const bounds = nativeMap.getBounds();
      return {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      };
    },
    fitBounds: (bounds, padding) => {
      const L = (window as any).L;
      nativeMap.fitBounds(
        L.latLngBounds([bounds.south, bounds.west], [bounds.north, bounds.east]),
        { padding: [padding || 0, padding || 0] }
      );
    },
    panTo: (center) => nativeMap.panTo([center.lat, center.lng]),
    on: (event, handler) => nativeMap.on(event, handler),
    off: (event, handler) => nativeMap.off(event, handler),
  };
}

// ============================================================================
// Geolocation Hook
// ============================================================================

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
export function useGeolocation(options: GeolocationOptions = {}): {
  position: Signal<GeolocationState['position']>;
  loading: Signal<boolean>;
  error: Signal<GeolocationState['error']>;
  getCurrentPosition: () => Promise<GeolocationPosition | null>;
  watchPosition: () => () => void;
} {
  const position = createSignal<GeolocationState['position']>(null);
  const loading = createSignal(false);
  const error = createSignal<GeolocationState['error']>(null);

  const geoOptions: PositionOptions = {
    enableHighAccuracy: options.enableHighAccuracy ?? true,
    timeout: options.timeout ?? 10000,
    maximumAge: options.maximumAge ?? 0,
  };

  const getCurrentPosition = (): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        error.set({ code: 0, message: 'Geolocation not supported' } as GeolocationPositionError);
        resolve(null);
        return;
      }

      loading.set(true);

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const geoPosition: GeolocationPosition = {
            coords: {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              altitude: pos.coords.altitude,
              accuracy: pos.coords.accuracy,
              altitudeAccuracy: pos.coords.altitudeAccuracy,
              heading: pos.coords.heading,
              speed: pos.coords.speed,
            },
            timestamp: pos.timestamp,
          };
          position.set(geoPosition);
          loading.set(false);
          error.set(null);
          resolve(geoPosition);
        },
        (err) => {
          error.set(err);
          loading.set(false);
          resolve(null);
        },
        geoOptions
      );
    });
  };

  const watchPosition = (): (() => void) => {
    if (!navigator.geolocation) {
      error.set({ code: 0, message: 'Geolocation not supported' } as GeolocationPositionError);
      return () => {};
    }

    loading.set(true);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const geoPosition: GeolocationPosition = {
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            altitude: pos.coords.altitude,
            accuracy: pos.coords.accuracy,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
          },
          timestamp: pos.timestamp,
        };
        position.set(geoPosition);
        loading.set(false);
        error.set(null);
      },
      (err) => {
        error.set(err);
        loading.set(false);
      },
      geoOptions
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  };

  return {
    position,
    loading,
    error,
    getCurrentPosition,
    watchPosition,
  };
}

// ============================================================================
// Distance Utilities
// ============================================================================

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in meters
 */
export function calculateDistance(from: LatLng, to: LatLng): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (from.lat * Math.PI) / 180;
  const φ2 = (to.lat * Math.PI) / 180;
  const Δφ = ((to.lat - from.lat) * Math.PI) / 180;
  const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate bearing between two points
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(from: LatLng, to: LatLng): number {
  const φ1 = (from.lat * Math.PI) / 180;
  const φ2 = (to.lat * Math.PI) / 180;
  const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return ((θ * 180) / Math.PI + 360) % 360;
}

/**
 * Calculate destination point given start point, bearing, and distance
 */
export function destinationPoint(from: LatLng, bearing: number, distance: number): LatLng {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (from.lat * Math.PI) / 180;
  const λ1 = (from.lng * Math.PI) / 180;
  const θ = (bearing * Math.PI) / 180;
  const δ = distance / R;

  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 =
    λ1 +
    Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));

  return {
    lat: (φ2 * 180) / Math.PI,
    lng: (((λ2 * 180) / Math.PI + 540) % 360) - 180,
  };
}

/**
 * Check if a point is within a polygon
 */
export function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  let inside = false;
  const x = point.lng;
  const y = point.lat;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i]!.lng;
    const yi = polygon[i]!.lat;
    const xj = polygon[j]!.lng;
    const yj = polygon[j]!.lat;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Calculate the center of a set of points
 */
export function getCenterOfPoints(points: LatLng[]): LatLng {
  if (points.length === 0) return { lat: 0, lng: 0 };

  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / points.length,
    lng: sum.lng / points.length,
  };
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number, units: 'metric' | 'imperial' = 'metric'): string {
  if (units === 'imperial') {
    const feet = meters * 3.28084;
    if (feet < 5280) {
      return `${Math.round(feet)} ft`;
    }
    return `${(feet / 5280).toFixed(1)} mi`;
  }

  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
