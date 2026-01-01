# @philjs/maps

Map components for React applications with support for Mapbox, Google Maps, and Leaflet. Build interactive, customizable maps with markers, layers, and geospatial features.

## Installation

```bash
npm install @philjs/maps
# or
yarn add @philjs/maps
# or
pnpm add @philjs/maps
```

## Basic Usage

```tsx
import { Map, Marker, Popup } from '@philjs/maps';

function LocationMap() {
  const center = { lat: 40.7128, lng: -74.0060 };

  return (
    <Map
      provider="mapbox"
      accessToken={MAPBOX_TOKEN}
      center={center}
      zoom={12}
    >
      <Marker position={center}>
        <Popup>New York City</Popup>
      </Marker>
    </Map>
  );
}
```

## Features

- **Multiple Providers** - Mapbox, Google Maps, Leaflet support
- **Markers** - Customizable map markers with icons
- **Popups** - Information popups on markers
- **Layers** - GeoJSON, tile layers, heatmaps
- **Clustering** - Automatic marker clustering
- **Drawing Tools** - Draw shapes, polygons, routes
- **Geocoding** - Address to coordinates conversion
- **Directions** - Route planning and navigation
- **Street View** - Google Street View integration
- **3D Buildings** - 3D building rendering (Mapbox)
- **Offline Maps** - Cache tiles for offline use
- **Accessibility** - Keyboard navigation support

## Components

| Component | Description |
|-----------|-------------|
| `Map` | Main map container |
| `Marker` | Map marker |
| `Popup` | Information popup |
| `GeoJSON` | GeoJSON layer |
| `HeatmapLayer` | Heatmap visualization |
| `ClusterLayer` | Marker clustering |
| `DrawControl` | Drawing tools |
| `SearchBox` | Location search |

## Providers

```tsx
// Mapbox
<Map provider="mapbox" accessToken={MAPBOX_TOKEN} />

// Google Maps
<Map provider="google" apiKey={GOOGLE_MAPS_KEY} />

// Leaflet (OpenStreetMap)
<Map provider="leaflet" />
```

## Hooks

```tsx
import { useMap, useGeolocation } from '@philjs/maps';

const { flyTo, zoomIn, getBounds } = useMap();
const { position, error } = useGeolocation();
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./google, ./mapbox, ./leaflet, ./utils
- Source files: packages/philjs-maps/src/utils/index.ts

### Public API
- Direct exports: (none detected)
- Re-exported names: (none detected)
- Re-exported modules: ./cluster.js
<!-- API_SNAPSHOT_END -->

## License

MIT
