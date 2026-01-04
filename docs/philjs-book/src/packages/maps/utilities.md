# Utility Functions

`@philjs/maps` provides utility functions for geolocation, distance calculations, and geometry operations.

## useGeolocation Hook

Access the device's geographic location using the Geolocation API.

### Signature

```typescript
import { useGeolocation } from '@philjs/maps';

function useGeolocation(options?: GeolocationOptions): {
  position: Signal<GeolocationPosition | null>;
  loading: Signal<boolean>;
  error: Signal<GeolocationPositionError | null>;
  getCurrentPosition: () => Promise<GeolocationPosition | null>;
  watchPosition: () => () => void;
};
```

### Options

```typescript
interface GeolocationOptions {
  /** Enable high accuracy mode (default: true) */
  enableHighAccuracy?: boolean;

  /** Timeout in milliseconds (default: 10000) */
  timeout?: number;

  /** Maximum age of cached position in milliseconds (default: 0) */
  maximumAge?: number;
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableHighAccuracy` | `boolean` | `true` | Use GPS for higher accuracy (uses more battery) |
| `timeout` | `number` | `10000` | Maximum time to wait for position (ms) |
| `maximumAge` | `number` | `0` | Accept cached positions up to this age (ms) |

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `position` | `Signal<GeolocationPosition \| null>` | Current position (reactive signal) |
| `loading` | `Signal<boolean>` | Whether position is being fetched |
| `error` | `Signal<GeolocationPositionError \| null>` | Error if position fetch failed |
| `getCurrentPosition` | `() => Promise<GeolocationPosition \| null>` | Fetch position once |
| `watchPosition` | `() => () => void` | Start watching position (returns cleanup function) |

### GeolocationPosition Interface

```typescript
interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number;           // Accuracy in meters
    altitudeAccuracy: number | null;
    heading: number | null;     // Direction of travel (degrees)
    speed: number | null;       // Speed in m/s
  };
  timestamp: number;
}
```

### Basic Usage

```typescript
import { useGeolocation, createMap } from '@philjs/maps';

const { position, loading, error, getCurrentPosition } = useGeolocation({
  enableHighAccuracy: true,
  timeout: 15000
});

// Get position once
getCurrentPosition().then(() => {
  const pos = position();
  if (pos) {
    console.log('Latitude:', pos.coords.latitude);
    console.log('Longitude:', pos.coords.longitude);
    console.log('Accuracy:', pos.coords.accuracy, 'meters');
  }
});

// Check for errors
if (error()) {
  console.error('Geolocation error:', error()?.message);
}
```

### Watching Position

For continuous location updates (e.g., navigation apps):

```typescript
import { useGeolocation } from '@philjs/maps';

const { position, loading, watchPosition } = useGeolocation({
  enableHighAccuracy: true
});

// Start watching
const stopWatching = watchPosition();

// Subscribe to position changes
position.subscribe(() => {
  const pos = position();
  if (pos) {
    console.log('New position:', pos.coords.latitude, pos.coords.longitude);
    updateMapCenter(pos.coords.latitude, pos.coords.longitude);
  }
});

// Stop watching when done (e.g., on component unmount)
// stopWatching();
```

### Complete Geolocation Example

```typescript
import { createMap, useGeolocation, calculateDistance, formatDistance } from '@philjs/maps';

const { Map, Marker, mapInstance } = createMap({
  provider: 'mapbox',
  apiKey: 'YOUR_TOKEN'
});

const {
  position,
  loading,
  error,
  getCurrentPosition,
  watchPosition
} = useGeolocation({ enableHighAccuracy: true });

// Default center
const defaultCenter = { lat: 40.7128, lng: -74.006 };

// Create map
Map({
  center: defaultCenter,
  zoom: 14,
  height: '500px',
  onLoad: async (map) => {
    // Try to get user's position
    await getCurrentPosition();

    const pos = position();
    if (pos) {
      const userLocation = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      // Center map on user
      map.setCenter(userLocation);

      // Add marker for user location
      Marker({
        position: userLocation,
        title: 'Your location',
        ariaLabel: `Your current location with accuracy of ${Math.round(pos.coords.accuracy)} meters`
      });

      // Show distance to default center
      const distance = calculateDistance(userLocation, defaultCenter);
      console.log(`Distance to NYC: ${formatDistance(distance)}`);
    } else if (error()) {
      console.warn('Could not get location:', error()?.message);
    }
  }
});

// Show loading state
loading.subscribe(() => {
  if (loading()) {
    console.log('Getting your location...');
  }
});
```

---

## Distance Utilities

### calculateDistance

Calculate the distance between two geographic points using the Haversine formula.

```typescript
import { calculateDistance } from '@philjs/maps';

function calculateDistance(from: LatLng, to: LatLng): number;
```

**Parameters:**
- `from`: Starting point `{ lat: number, lng: number }`
- `to`: Ending point `{ lat: number, lng: number }`

**Returns:** Distance in meters

**Example:**

```typescript
import { calculateDistance } from '@philjs/maps';

const newYork = { lat: 40.7128, lng: -74.006 };
const losAngeles = { lat: 34.0522, lng: -118.2437 };

const distance = calculateDistance(newYork, losAngeles);
console.log(distance); // ~3935746 meters (~3936 km)
```

### Algorithm

The function uses the Haversine formula for great-circle distances:

```typescript
// Haversine formula implementation
const R = 6371e3; // Earth's radius in meters
const phi1 = (from.lat * Math.PI) / 180;
const phi2 = (to.lat * Math.PI) / 180;
const deltaPhi = ((to.lat - from.lat) * Math.PI) / 180;
const deltaLambda = ((to.lng - from.lng) * Math.PI) / 180;

const a =
  Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
  Math.cos(phi1) * Math.cos(phi2) *
  Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

return R * c; // Distance in meters
```

---

### calculateBearing

Calculate the initial bearing (direction) from one point to another.

```typescript
import { calculateBearing } from '@philjs/maps';

function calculateBearing(from: LatLng, to: LatLng): number;
```

**Parameters:**
- `from`: Starting point
- `to`: Destination point

**Returns:** Bearing in degrees (0-360), where:
- 0 = North
- 90 = East
- 180 = South
- 270 = West

**Example:**

```typescript
import { calculateBearing } from '@philjs/maps';

const newYork = { lat: 40.7128, lng: -74.006 };
const losAngeles = { lat: 34.0522, lng: -118.2437 };

const bearing = calculateBearing(newYork, losAngeles);
console.log(bearing); // ~273.5 degrees (roughly west)

// Direction helper
function getCardinalDirection(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index]!;
}

console.log(getCardinalDirection(bearing)); // 'W'
```

---

### destinationPoint

Calculate the destination point given a starting point, bearing, and distance.

```typescript
import { destinationPoint } from '@philjs/maps';

function destinationPoint(from: LatLng, bearing: number, distance: number): LatLng;
```

**Parameters:**
- `from`: Starting point
- `bearing`: Direction in degrees (0-360)
- `distance`: Distance in meters

**Returns:** Destination point `{ lat: number, lng: number }`

**Example:**

```typescript
import { destinationPoint } from '@philjs/maps';

const start = { lat: 40.7128, lng: -74.006 };

// Travel 100km due east (90 degrees)
const destination = destinationPoint(start, 90, 100000);
console.log(destination);
// { lat: 40.7128..., lng: -72.847... }

// Create points along a circle
function createCircle(center: LatLng, radiusMeters: number, points: number = 36): LatLng[] {
  const circle: LatLng[] = [];
  for (let i = 0; i < points; i++) {
    const bearing = (360 / points) * i;
    circle.push(destinationPoint(center, bearing, radiusMeters));
  }
  return circle;
}

const circlePoints = createCircle({ lat: 40.7128, lng: -74.006 }, 5000, 36);
```

---

## Geometry Utilities

### isPointInPolygon

Check if a point lies within a polygon using the ray casting algorithm.

```typescript
import { isPointInPolygon } from '@philjs/maps';

function isPointInPolygon(point: LatLng, polygon: LatLng[]): boolean;
```

**Parameters:**
- `point`: The point to test
- `polygon`: Array of vertices defining the polygon (automatically closed)

**Returns:** `true` if point is inside polygon, `false` otherwise

**Example:**

```typescript
import { isPointInPolygon } from '@philjs/maps';

// Define a polygon (Manhattan bounds, simplified)
const manhattan = [
  { lat: 40.879, lng: -73.927 },
  { lat: 40.879, lng: -73.959 },
  { lat: 40.701, lng: -74.020 },
  { lat: 40.701, lng: -73.971 }
];

const timesSquare = { lat: 40.7580, lng: -73.9855 };
const brooklyn = { lat: 40.6782, lng: -73.9442 };

console.log(isPointInPolygon(timesSquare, manhattan)); // true
console.log(isPointInPolygon(brooklyn, manhattan));     // false
```

**Use Cases:**

```typescript
// Geofencing
function isInDeliveryZone(userLocation: LatLng): boolean {
  const deliveryZone = [
    { lat: 40.8, lng: -74.1 },
    { lat: 40.8, lng: -73.9 },
    { lat: 40.7, lng: -73.9 },
    { lat: 40.7, lng: -74.1 }
  ];
  return isPointInPolygon(userLocation, deliveryZone);
}

// Filter markers in region
function getMarkersInRegion(markers: MarkerProps[], region: LatLng[]): MarkerProps[] {
  return markers.filter(m => isPointInPolygon(m.position, region));
}
```

---

### getCenterOfPoints

Calculate the geographic center (centroid) of a set of points.

```typescript
import { getCenterOfPoints } from '@philjs/maps';

function getCenterOfPoints(points: LatLng[]): LatLng;
```

**Parameters:**
- `points`: Array of geographic points

**Returns:** Center point `{ lat: number, lng: number }`. Returns `{ lat: 0, lng: 0 }` for empty arrays.

**Example:**

```typescript
import { getCenterOfPoints, createMap } from '@philjs/maps';

const storeLocations = [
  { lat: 40.7589, lng: -73.9851 },  // Times Square
  { lat: 40.7484, lng: -73.9857 },  // Empire State
  { lat: 40.7527, lng: -73.9772 },  // Grand Central
  { lat: 40.7614, lng: -73.9776 }   // Rockefeller Center
];

// Calculate center
const center = getCenterOfPoints(storeLocations);
console.log(center); // { lat: 40.7553..., lng: -73.9814... }

// Use as map center
const { Map, Marker } = createMap({ provider: 'google', apiKey: 'YOUR_KEY' });

Map({
  center: center,
  zoom: 14,
  onLoad: () => {
    storeLocations.forEach(loc => {
      Marker({ position: loc });
    });
  }
});
```

**Use Cases:**

```typescript
// Auto-center map on markers
function centerMapOnMarkers(map: MapInstance, markers: LatLng[]) {
  if (markers.length === 0) return;

  if (markers.length === 1) {
    map.setCenter(markers[0]!);
  } else {
    const center = getCenterOfPoints(markers);
    map.setCenter(center);
  }
}

// Calculate cluster center
function getClusterCenter(clusterMarkers: MarkerProps[]): LatLng {
  return getCenterOfPoints(clusterMarkers.map(m => m.position));
}
```

---

## Formatting Utilities

### formatDistance

Format a distance value for display with appropriate units.

```typescript
import { formatDistance } from '@philjs/maps';

function formatDistance(meters: number, units?: 'metric' | 'imperial'): string;
```

**Parameters:**
- `meters`: Distance in meters
- `units`: Unit system (default: `'metric'`)

**Returns:** Formatted string with units

**Formatting Rules:**

| Unit System | < 1000m / 5280ft | >= 1000m / 5280ft |
|-------------|------------------|-------------------|
| Metric | `"X m"` | `"X.X km"` |
| Imperial | `"X ft"` | `"X.X mi"` |

**Examples:**

```typescript
import { formatDistance } from '@philjs/maps';

// Metric (default)
console.log(formatDistance(500));        // "500 m"
console.log(formatDistance(1500));       // "1.5 km"
console.log(formatDistance(10000));      // "10.0 km"

// Imperial
console.log(formatDistance(500, 'imperial'));   // "1640 ft"
console.log(formatDistance(1500, 'imperial'));  // "4921 ft"
console.log(formatDistance(10000, 'imperial')); // "6.2 mi"
```

**Practical Usage:**

```typescript
import { calculateDistance, formatDistance, useGeolocation, createMap } from '@philjs/maps';

const { Map, Marker, Popup } = createMap({ provider: 'google', apiKey: 'YOUR_KEY' });
const { position, getCurrentPosition } = useGeolocation();

const stores = [
  { name: 'Store A', lat: 40.7580, lng: -73.9855 },
  { name: 'Store B', lat: 40.7484, lng: -73.9857 },
  { name: 'Store C', lat: 40.7527, lng: -73.9772 }
];

Map({
  center: { lat: 40.7528, lng: -73.9828 },
  zoom: 14,
  onLoad: async (map) => {
    await getCurrentPosition();
    const userPos = position();

    stores.forEach(store => {
      let distanceText = '';

      if (userPos) {
        const userLocation = {
          lat: userPos.coords.latitude,
          lng: userPos.coords.longitude
        };
        const distance = calculateDistance(userLocation, { lat: store.lat, lng: store.lng });
        distanceText = formatDistance(distance, 'imperial');
      }

      const marker = Marker({
        position: { lat: store.lat, lng: store.lng },
        title: store.name,
        onClick: () => {
          Popup({
            position: { lat: store.lat, lng: store.lng },
            children: `
              <h3>${store.name}</h3>
              ${distanceText ? `<p>Distance: ${distanceText}</p>` : ''}
            `,
            open: true
          });
        }
      });
    });
  }
});
```

---

## Complete Utilities Example

```typescript
import {
  createMap,
  useGeolocation,
  calculateDistance,
  calculateBearing,
  destinationPoint,
  isPointInPolygon,
  getCenterOfPoints,
  formatDistance
} from '@philjs/maps';

const { Map, Marker, Polygon: MapPolygon, Polyline, mapInstance } = createMap({
  provider: 'mapbox',
  apiKey: 'YOUR_TOKEN'
});

// Sample data
const serviceArea = [
  { lat: 40.8, lng: -74.05 },
  { lat: 40.8, lng: -73.9 },
  { lat: 40.7, lng: -73.9 },
  { lat: 40.7, lng: -74.05 }
];

const destinations = [
  { id: 1, name: 'Customer A', lat: 40.7580, lng: -73.9855 },
  { id: 2, name: 'Customer B', lat: 40.7484, lng: -73.9857 },
  { id: 3, name: 'Customer C', lat: 40.6782, lng: -73.9442 } // Outside area
];

// Geolocation
const { position, getCurrentPosition } = useGeolocation({ enableHighAccuracy: true });

Map({
  center: getCenterOfPoints(serviceArea),
  zoom: 12,
  height: '600px',
  onLoad: async (map) => {
    // Draw service area
    MapPolygon({
      path: serviceArea,
      fillColor: '#4285F4',
      fillOpacity: 0.1,
      strokeColor: '#4285F4',
      strokeWeight: 2
    });

    // Get user location
    await getCurrentPosition();
    const userPos = position();

    if (userPos) {
      const userLocation = {
        lat: userPos.coords.latitude,
        lng: userPos.coords.longitude
      };

      // Check if user is in service area
      const inServiceArea = isPointInPolygon(userLocation, serviceArea);
      console.log('User in service area:', inServiceArea);

      // Add user marker
      Marker({
        position: userLocation,
        title: 'Your location',
        ariaLabel: inServiceArea
          ? 'Your location - within service area'
          : 'Your location - outside service area'
      });

      // Add destination markers with distance info
      destinations.forEach(dest => {
        const destLocation = { lat: dest.lat, lng: dest.lng };
        const inArea = isPointInPolygon(destLocation, serviceArea);
        const distance = calculateDistance(userLocation, destLocation);
        const bearing = calculateBearing(userLocation, destLocation);

        Marker({
          position: destLocation,
          title: `${dest.name} - ${formatDistance(distance)}`,
          onClick: () => {
            // Draw route line
            Polyline({
              path: [userLocation, destLocation],
              strokeColor: inArea ? '#34A853' : '#EA4335',
              strokeWeight: 2
            });

            console.log(`
              ${dest.name}:
              - Distance: ${formatDistance(distance)}
              - Bearing: ${Math.round(bearing)} degrees
              - In service area: ${inArea}
            `);
          }
        });
      });

      // Calculate optimal center for all points
      const allPoints = [
        userLocation,
        ...destinations.map(d => ({ lat: d.lat, lng: d.lng }))
      ];
      const optimalCenter = getCenterOfPoints(allPoints);
      map.setCenter(optimalCenter);
    }
  }
});
```

## Related

- [Overview](./overview.md) - Package overview and quick start
- [Components](./components.md) - Map component documentation
- [Clustering](./clustering.md) - Marker clustering guide
