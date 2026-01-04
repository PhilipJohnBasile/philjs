# @philjs/maps

Provider-agnostic map components for PhilJS with unified APIs supporting Google Maps, Mapbox, and Leaflet. Features reactive signals, accessibility support, marker clustering, and comprehensive geospatial utilities.

## Installation

```bash
npm install @philjs/maps
```

## Provider Support

| Provider | API Key Required | Best For |
|----------|------------------|----------|
| Google Maps | Yes (`apiKey`) | Full-featured apps, Places API, Directions |
| Mapbox | Yes (`accessToken`) | Custom styling, 3D terrain, large datasets |
| Leaflet | No | Free/open-source projects, simple maps |

## Quick Start

The `createMap` factory function creates a set of components bound to a specific map provider:

```typescript
import { createMap } from '@philjs/maps';

// Create components for your chosen provider
const { Map, Marker, Popup, Polyline, Polygon } = createMap({
  provider: 'google',
  apiKey: 'YOUR_GOOGLE_MAPS_API_KEY'
});

// Use the components
function App() {
  const container = Map({
    center: { lat: 40.7128, lng: -74.006 },
    zoom: 12,
    width: '100%',
    height: '400px',
    ariaLabel: 'Interactive map of New York City',
    onLoad: (map) => {
      console.log('Map loaded!', map);
    }
  });

  document.body.appendChild(container);
}
```

### Provider-Specific Setup

```typescript
// Google Maps
const google = createMap({
  provider: 'google',
  apiKey: process.env.GOOGLE_MAPS_API_KEY
});

// Mapbox
const mapbox = createMap({
  provider: 'mapbox',
  apiKey: process.env.MAPBOX_ACCESS_TOKEN
});

// Leaflet (free, no API key required)
const leaflet = createMap({
  provider: 'leaflet'
});
```

## Feature Overview

| Feature | Description |
|---------|-------------|
| **Multi-Provider** | Google Maps, Mapbox, Leaflet with unified API |
| **Reactive Signals** | Built-in signal system for state management |
| **Map Components** | Map, Marker, Popup, Polyline, Polygon |
| **Clustering** | Grid-based and Supercluster-compatible clustering |
| **Geolocation** | `useGeolocation` hook for device location |
| **Distance Utils** | Haversine distance, bearing, destination point |
| **Geometry Utils** | Point-in-polygon, center calculation |
| **Accessibility** | ARIA labels, keyboard navigation support |
| **Lazy Loading** | IntersectionObserver-based lazy map initialization |

## Core Concepts

### The createMap Factory

The `createMap` function is the main entry point. It returns component functions and reactive signals:

```typescript
import { createMap } from '@philjs/maps';

const {
  Map,           // Map container component
  Marker,        // Marker component
  Popup,         // Popup/InfoWindow component
  Polyline,      // Line shape component
  Polygon,       // Polygon shape component
  mapInstance,   // Signal<MapInstance | null>
  isLoaded,      // Signal<boolean>
  error,         // Signal<Error | null>
} = createMap({ provider: 'google', apiKey: 'YOUR_KEY' });
```

### Reactive Signals

The package uses a built-in reactive signal system:

```typescript
const { mapInstance, isLoaded, error } = createMap({ provider: 'google', apiKey: 'YOUR_KEY' });

// Read current value
console.log(isLoaded()); // false initially

// Subscribe to changes
const unsubscribe = isLoaded.subscribe(() => {
  if (isLoaded()) {
    console.log('Map is now loaded!');
  }
});

// Access map instance when ready
mapInstance.subscribe(() => {
  const map = mapInstance();
  if (map) {
    map.setZoom(15);
    map.panTo({ lat: 40.7128, lng: -74.006 });
  }
});

// Clean up subscription
unsubscribe();
```

### Map Context

Access the current map context from anywhere within a Map component tree:

```typescript
import { useMapContext } from '@philjs/maps';

function MyCustomControl() {
  const context = useMapContext();

  console.log(context.provider);  // 'google' | 'mapbox' | 'leaflet'
  console.log(context.isLoaded);  // boolean
  console.log(context.map);       // MapInstance | null
  console.log(context.error);     // Error | null
}
```

## Complete Example

```typescript
import { createMap, useGeolocation, calculateDistance, formatDistance } from '@philjs/maps';

// Create map components
const { Map, Marker, Popup, mapInstance } = createMap({
  provider: 'mapbox',
  apiKey: process.env.MAPBOX_ACCESS_TOKEN
});

// Create the map
const container = Map({
  center: { lat: 51.505, lng: -0.09 },
  zoom: 13,
  height: '500px',
  styleUrl: 'mapbox://styles/mapbox/streets-v12',
  onLoad: (map) => {
    // Add marker after map loads
    const marker = Marker({
      position: { lat: 51.505, lng: -0.09 },
      title: 'London',
      draggable: true,
      ariaLabel: 'Draggable marker for London',
      onClick: (e) => {
        popup.open();
      },
      onDragEnd: (newPosition) => {
        console.log('Marker moved to:', newPosition);
      }
    });

    // Create popup
    const popup = Popup({
      position: { lat: 51.505, lng: -0.09 },
      children: '<h3>London</h3><p>Capital of England</p>',
      closeButton: true,
      maxWidth: 300
    });
  }
});

document.getElementById('map-container').appendChild(container);

// Use geolocation
const { position, getCurrentPosition } = useGeolocation({
  enableHighAccuracy: true
});

getCurrentPosition().then(() => {
  const pos = position();
  if (pos) {
    const userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    const london = { lat: 51.505, lng: -0.09 };

    const distance = calculateDistance(userLocation, london);
    console.log(`Distance to London: ${formatDistance(distance)}`);
  }
});
```

## TypeScript Support

The package is fully typed with comprehensive TypeScript definitions:

```typescript
import type {
  MapProps,
  MarkerProps,
  PopupProps,
  PolylineProps,
  PolygonProps,
  LatLng,
  LatLngBounds,
  MapInstance,
  MapProvider,
  MapEvent,
  MapClickEvent,
  MarkerEvent,
  GeolocationOptions,
  GeolocationState
} from '@philjs/maps';
```

## Next Steps

- [Components](./components.md) - Detailed component documentation
- [Clustering](./clustering.md) - Marker clustering guide
- [Utilities](./utilities.md) - Geolocation and distance utilities
