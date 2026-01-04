# Marker Clustering

Efficient marker clustering for handling large numbers of markers with `@philjs/maps`.

## Overview

When displaying many markers on a map, clustering groups nearby markers together to improve performance and readability. The `@philjs/maps` package provides:

- **Grid-based clustering** - Fast O(n) algorithm for real-time clustering
- **Supercluster integration** - Compatible with the Supercluster library for advanced use cases
- **Zoom-aware clustering** - Automatically adjusts clusters based on zoom level
- **Customizable appearance** - Control cluster size, radius, and rendering

## ClusterOptions

Configuration options for the clustering algorithm:

```typescript
interface ClusterOptions {
  /** Cluster radius in pixels (default: 60) */
  radius?: number;

  /** Minimum points to form a cluster (default: 2) */
  minPoints?: number;

  /** Maximum zoom level for clustering (default: 16) */
  maxZoom?: number;
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `radius` | `number` | `60` | Cluster radius in pixels. Larger values create fewer, larger clusters |
| `minPoints` | `number` | `2` | Minimum number of points required to form a cluster |
| `maxZoom` | `number` | `16` | Above this zoom level, clustering is disabled |

## calculateClusters Function

The main clustering function that groups points based on their geographic proximity.

### Signature

```typescript
import { calculateClusters } from '@philjs/maps';

function calculateClusters(
  points: ClusterPoint[],
  bounds: LatLngBounds,
  zoom: number,
  options?: ClusterOptions
): ClusterResult[];
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `points` | `ClusterPoint[]` | Array of points to cluster |
| `bounds` | `LatLngBounds` | Visible map bounds |
| `zoom` | `number` | Current map zoom level |
| `options` | `ClusterOptions` | Clustering configuration |

### Return Value

Returns an array of `ClusterResult` objects:

```typescript
interface ClusterResult {
  /** Unique cluster identifier */
  id: string;

  /** Geographic center of the cluster */
  center: LatLng;

  /** Number of markers in the cluster */
  count: number;

  /** Original marker props for all markers in cluster */
  markers: MarkerProps[];

  /** Bounding box containing all cluster points */
  bounds: LatLngBounds;
}
```

### ClusterPoint Input Format

```typescript
interface ClusterPoint {
  /** Geographic position */
  position: LatLng;

  /** Original marker data */
  data: MarkerProps;
}
```

### Basic Usage

```typescript
import { createMap, calculateClusters } from '@philjs/maps';
import type { ClusterPoint, ClusterResult } from '@philjs/maps';

const { Map, Marker, mapInstance } = createMap({
  provider: 'google',
  apiKey: 'YOUR_KEY'
});

// Your marker data
const locations = [
  { lat: 40.7128, lng: -74.006, name: 'New York' },
  { lat: 40.7580, lng: -73.9855, name: 'Midtown' },
  { lat: 40.7484, lng: -73.9857, name: 'Empire State' },
  // ... hundreds more markers
];

// Convert to ClusterPoint format
const points: ClusterPoint[] = locations.map((loc, i) => ({
  position: { lat: loc.lat, lng: loc.lng },
  data: {
    position: { lat: loc.lat, lng: loc.lng },
    title: loc.name
  }
}));

Map({
  center: { lat: 40.7128, lng: -74.006 },
  zoom: 12,
  onLoad: (map) => {
    renderClusters();

    // Re-cluster when map view changes
    map.on('moveend', renderClusters);
    map.on('zoom', renderClusters);
  }
});

let currentMarkers: Array<{ remove: () => void }> = [];

function renderClusters() {
  const map = mapInstance();
  if (!map) return;

  // Clear existing markers
  currentMarkers.forEach(m => m.remove());
  currentMarkers = [];

  // Calculate clusters for current view
  const clusters = calculateClusters(
    points,
    map.getBounds(),
    map.getZoom(),
    { radius: 60, minPoints: 2, maxZoom: 16 }
  );

  // Render clusters
  clusters.forEach((cluster) => {
    if (cluster.count === 1) {
      // Single marker
      const marker = Marker({
        position: cluster.center,
        title: cluster.markers[0]?.title
      });
      currentMarkers.push(marker);
    } else {
      // Cluster marker
      const marker = Marker({
        position: cluster.center,
        title: `${cluster.count} markers`,
        onClick: () => {
          // Zoom to cluster bounds on click
          map.fitBounds(cluster.bounds, 50);
        }
      });
      currentMarkers.push(marker);
    }
  });
}
```

## createSupercluster Utility

For applications with very large datasets, the `createSupercluster` utility provides a reusable cluster index that can be loaded once and queried multiple times.

### Signature

```typescript
import { createSupercluster } from '@philjs/maps';

function createSupercluster(options?: ClusterOptions): {
  load: (points: ClusterPoint[]) => void;
  getClusters: (bounds: LatLngBounds, zoom: number) => ClusterResult[];
};
```

### Usage

```typescript
import { createMap, createSupercluster } from '@philjs/maps';

const { Map, Marker, mapInstance } = createMap({
  provider: 'mapbox',
  apiKey: 'YOUR_TOKEN'
});

// Create the cluster index
const cluster = createSupercluster({
  radius: 80,
  minPoints: 3,
  maxZoom: 17
});

// Load data once (can be thousands of points)
const points = fetchMarkerData().map(item => ({
  position: { lat: item.lat, lng: item.lng },
  data: {
    position: { lat: item.lat, lng: item.lng },
    title: item.name,
    icon: item.icon
  }
}));

cluster.load(points);

// Query clusters as needed (fast lookups)
Map({
  center: { lat: 40.7128, lng: -74.006 },
  zoom: 10,
  onLoad: (map) => {
    updateClusters();

    map.on('moveend', updateClusters);
    map.on('zoom', updateClusters);
  }
});

function updateClusters() {
  const map = mapInstance();
  if (!map) return;

  // Fast cluster lookup
  const clusters = cluster.getClusters(map.getBounds(), map.getZoom());

  // Render clusters...
  renderMarkers(clusters);
}
```

## Algorithm Details

### Grid-Based Clustering

The `calculateClusters` function uses a grid-based algorithm:

1. **Cell Size Calculation**: The map is divided into a grid where cell size is based on `radius / 2^zoom`
2. **Point Assignment**: Each point is assigned to a grid cell based on its coordinates
3. **Cluster Formation**: Cells with `>= minPoints` become clusters; cells with fewer points remain individual markers
4. **Bounds Calculation**: Each cluster's bounding box is computed for zoom-to-fit functionality

```typescript
// Simplified algorithm illustration
const cellSize = radius / Math.pow(2, zoom);

for (const point of points) {
  const cellX = Math.floor(point.position.lng / cellSize);
  const cellY = Math.floor(point.position.lat / cellSize);
  const cellKey = `${cellX},${cellY}`;

  // Group points by cell
  if (!clusters.has(cellKey)) {
    clusters.set(cellKey, []);
  }
  clusters.get(cellKey).push(point);
}
```

### Zoom Level Behavior

- **Low zoom (zoomed out)**: More clustering, fewer markers shown
- **High zoom (zoomed in)**: Less clustering, more individual markers
- **Above maxZoom**: No clustering, all markers shown individually

```typescript
// Above maxZoom, return individual markers
if (zoom >= maxZoom) {
  return points.map((p, i) => ({
    id: `single-${i}`,
    center: p.position,
    count: 1,
    markers: [p.data],
    bounds: calculateBounds([p.position])
  }));
}
```

### Bounds Buffer

The algorithm adds a 10% buffer around the visible bounds to ensure smooth transitions when panning:

```typescript
const buffer = 0.1;
const latBuffer = (bounds.north - bounds.south) * buffer;
const lngBuffer = (bounds.east - bounds.west) * buffer;

const expandedBounds = {
  north: bounds.north + latBuffer,
  south: bounds.south - latBuffer,
  east: bounds.east + lngBuffer,
  west: bounds.west - lngBuffer
};
```

## Performance Considerations

### Large Datasets

For datasets with thousands of markers:

1. **Use createSupercluster**: Load data once, query multiple times
2. **Debounce updates**: Don't recalculate on every move event

```typescript
import { createSupercluster } from '@philjs/maps';

const cluster = createSupercluster({ radius: 60, maxZoom: 16 });

// Load 10,000+ points once
cluster.load(largeDataset);

// Debounce cluster updates
let updateTimeout: ReturnType<typeof setTimeout>;

function debouncedUpdate() {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    const clusters = cluster.getClusters(map.getBounds(), map.getZoom());
    renderMarkers(clusters);
  }, 100); // 100ms debounce
}

map.on('moveend', debouncedUpdate);
```

### Rendering Optimization

Reuse markers instead of recreating:

```typescript
const markerPool: Array<{ remove: () => void; update: (props: Partial<MarkerProps>) => void }> = [];

function renderClusters(clusters: ClusterResult[]) {
  // Hide excess markers
  for (let i = clusters.length; i < markerPool.length; i++) {
    markerPool[i].remove();
  }

  // Update or create markers
  clusters.forEach((cluster, i) => {
    if (markerPool[i]) {
      // Reuse existing marker
      markerPool[i].update({ position: cluster.center });
    } else {
      // Create new marker
      markerPool[i] = Marker({
        position: cluster.center,
        title: cluster.count > 1 ? `${cluster.count} markers` : cluster.markers[0]?.title
      });
    }
  });
}
```

### Custom Cluster Rendering

For custom cluster appearances:

```typescript
function createClusterMarker(cluster: ClusterResult) {
  // Create custom DOM element
  const el = document.createElement('div');
  el.className = 'cluster-marker';
  el.style.cssText = `
    width: ${30 + cluster.count * 2}px;
    height: ${30 + cluster.count * 2}px;
    background: #4285F4;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    cursor: pointer;
  `;
  el.textContent = String(cluster.count);

  return Marker({
    position: cluster.center,
    icon: el, // Note: Requires Mapbox for custom elements
    onClick: () => {
      mapInstance()?.fitBounds(cluster.bounds, 50);
    }
  });
}
```

## Complete Example

```typescript
import {
  createMap,
  createSupercluster,
  calculateDistance,
  formatDistance
} from '@philjs/maps';
import type { ClusterPoint, ClusterResult } from '@philjs/maps';

// Create map components
const { Map, Marker, Popup, mapInstance } = createMap({
  provider: 'google',
  apiKey: process.env.GOOGLE_MAPS_API_KEY
});

// Create cluster index
const clusterIndex = createSupercluster({
  radius: 60,
  minPoints: 2,
  maxZoom: 15
});

// Sample data: coffee shops
const coffeeShops = [
  { id: 1, name: 'Coffee House A', lat: 40.7128, lng: -74.006 },
  { id: 2, name: 'Bean Counter', lat: 40.7138, lng: -74.008 },
  { id: 3, name: 'Espresso Bar', lat: 40.7118, lng: -74.004 },
  // ... many more
];

// Convert to ClusterPoint format
const points: ClusterPoint[] = coffeeShops.map(shop => ({
  position: { lat: shop.lat, lng: shop.lng },
  data: {
    position: { lat: shop.lat, lng: shop.lng },
    title: shop.name,
    // Store additional data
    clusterId: String(shop.id)
  }
}));

// Load into cluster index
clusterIndex.load(points);

// State
let activeMarkers: Array<{ remove: () => void }> = [];
let activePopup: { close: () => void } | null = null;

// Create map
const container = Map({
  center: { lat: 40.7128, lng: -74.006 },
  zoom: 13,
  height: '600px',
  ariaLabel: 'Map of coffee shops',

  onLoad: (map) => {
    // Initial render
    updateClusters();

    // Update on map changes
    map.on('moveend', updateClusters);
    map.on('zoom', updateClusters);
  },

  onClick: () => {
    // Close popup when clicking map
    activePopup?.close();
    activePopup = null;
  }
});

function updateClusters() {
  const map = mapInstance();
  if (!map) return;

  // Clear existing markers
  activeMarkers.forEach(m => m.remove());
  activeMarkers = [];

  // Get clusters for current view
  const clusters = clusterIndex.getClusters(map.getBounds(), map.getZoom());

  // Render each cluster
  clusters.forEach(cluster => {
    if (cluster.count === 1) {
      // Single marker
      const shopData = cluster.markers[0];
      const marker = Marker({
        position: cluster.center,
        title: shopData?.title || 'Coffee Shop',
        ariaLabel: `Coffee shop: ${shopData?.title}`,
        onClick: () => showShopPopup(cluster)
      });
      activeMarkers.push(marker);
    } else {
      // Cluster marker
      const marker = Marker({
        position: cluster.center,
        title: `${cluster.count} coffee shops`,
        ariaLabel: `Cluster of ${cluster.count} coffee shops. Click to zoom in.`,
        onClick: () => {
          // Zoom to show cluster contents
          map.fitBounds(cluster.bounds, 50);
        }
      });
      activeMarkers.push(marker);
    }
  });
}

function showShopPopup(cluster: ClusterResult) {
  activePopup?.close();

  const shop = cluster.markers[0];
  if (!shop) return;

  activePopup = Popup({
    position: cluster.center,
    children: `
      <div class="shop-popup">
        <h3>${shop.title}</h3>
        <p>Click for details</p>
      </div>
    `,
    open: true,
    maxWidth: 250,
    onClose: () => {
      activePopup = null;
    }
  });
}

document.getElementById('app')?.appendChild(container);
```

## Related

- [Components](./components.md) - Map and Marker component documentation
- [Utilities](./utilities.md) - Distance and geometry utilities
