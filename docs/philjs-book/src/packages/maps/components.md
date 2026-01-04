# Map Components

Detailed documentation for all map components provided by `@philjs/maps`.

## Map Component

The `Map` component is the main container that renders an interactive map. It is created via the `createMap` factory.

### Basic Usage

```typescript
import { createMap } from '@philjs/maps';

const { Map } = createMap({ provider: 'google', apiKey: 'YOUR_KEY' });

const container = Map({
  center: { lat: 40.7128, lng: -74.006 },
  zoom: 12,
  width: '100%',
  height: '400px'
});

document.body.appendChild(container);
```

### MapProps Reference

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `center` | `LatLng` | `{ lat: 0, lng: 0 }` | Initial center coordinates |
| `zoom` | `number` | `10` | Initial zoom level (0-22) |
| `width` | `string \| number` | `'100%'` | Map width (CSS value or pixels) |
| `height` | `string \| number` | `'400px'` | Map height (CSS value or pixels) |
| `className` | `string` | - | CSS class name for the container |
| `style` | `Record<string, string \| number>` | - | Inline styles object |
| `styleUrl` | `string` | Provider default | Custom map style URL |
| `minZoom` | `number` | - | Minimum zoom level |
| `maxZoom` | `number` | - | Maximum zoom level |
| `maxBounds` | `LatLngBounds` | - | Restrict map panning to bounds |
| `scrollWheelZoom` | `boolean` | `true` | Enable scroll wheel zoom |
| `doubleClickZoom` | `boolean` | `true` | Enable double-click zoom |
| `draggable` | `boolean` | `true` | Enable map dragging |
| `keyboardNavigation` | `boolean` | `true` | Enable keyboard navigation |
| `ariaLabel` | `string` | - | Accessible label for screen readers |
| `lazy` | `boolean` | `false` | Lazy load map on intersection |
| `lazyOptions` | `IntersectionObserverInit` | - | Options for lazy loading |

### Event Handlers

| Event | Type | Description |
|-------|------|-------------|
| `onLoad` | `(map: MapInstance) => void` | Called when map is ready |
| `onClick` | `(e: MapClickEvent) => void` | Called on map click |
| `onZoomChange` | `(zoom: number) => void` | Called when zoom changes |
| `onCenterChange` | `(center: LatLng) => void` | Called when center changes |
| `onBoundsChange` | `(bounds: LatLngBounds) => void` | Called when bounds change |
| `onDragStart` | `() => void` | Called when dragging starts |
| `onDragEnd` | `() => void` | Called when dragging ends |

### Complete Example

```typescript
const { Map, mapInstance } = createMap({ provider: 'google', apiKey: 'YOUR_KEY' });

const container = Map({
  center: { lat: 40.7128, lng: -74.006 },
  zoom: 12,
  width: '100%',
  height: '500px',
  className: 'my-map',
  style: { borderRadius: '8px' },

  // Controls
  scrollWheelZoom: true,
  doubleClickZoom: true,
  draggable: true,
  keyboardNavigation: true,

  // Limits
  minZoom: 4,
  maxZoom: 18,
  maxBounds: {
    north: 41,
    south: 40,
    east: -73,
    west: -75,
  },

  // Accessibility
  ariaLabel: 'Interactive map of New York City',

  // Lazy loading
  lazy: true,
  lazyOptions: { rootMargin: '100px' },

  // Events
  onLoad: (map) => {
    console.log('Map loaded!');
    console.log('Current center:', map.getCenter());
    console.log('Current zoom:', map.getZoom());
  },
  onClick: (e) => {
    console.log('Clicked at:', e.latlng);
    console.log('Pixel position:', e.pixel);
  },
  onZoomChange: (zoom) => {
    console.log('Zoom changed to:', zoom);
  },
  onCenterChange: (center) => {
    console.log('Center changed to:', center);
  },
  onBoundsChange: (bounds) => {
    console.log('Bounds changed to:', bounds);
  },
  onDragStart: () => console.log('Drag started'),
  onDragEnd: () => console.log('Drag ended'),
});
```

### MapInstance Methods

The `MapInstance` object provides a unified API across all providers:

```typescript
interface MapInstance {
  provider: MapProvider;      // 'google' | 'mapbox' | 'leaflet'
  native: unknown;            // Native map instance

  getCenter(): LatLng;
  setCenter(center: LatLng): void;
  getZoom(): number;
  setZoom(zoom: number): void;
  getBounds(): LatLngBounds;
  fitBounds(bounds: LatLngBounds, padding?: number): void;
  panTo(center: LatLng): void;
  on(event: string, handler: (e: MapEvent) => void): void;
  off(event: string, handler: (e: MapEvent) => void): void;
}
```

---

## Marker Component

The `Marker` component places interactive markers on the map.

### Basic Usage

```typescript
const { Map, Marker } = createMap({ provider: 'google', apiKey: 'YOUR_KEY' });

Map({
  center: { lat: 40.7128, lng: -74.006 },
  zoom: 12,
  onLoad: () => {
    const marker = Marker({
      position: { lat: 40.7128, lng: -74.006 },
      title: 'New York City'
    });
  }
});
```

### MarkerProps Reference

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `position` | `LatLng` | **required** | Marker position |
| `title` | `string` | - | Tooltip text on hover |
| `icon` | `string \| MarkerIcon` | Provider default | Custom icon |
| `draggable` | `boolean` | `false` | Enable marker dragging |
| `opacity` | `number` | `1` | Marker opacity (0-1) |
| `zIndex` | `number` | - | Stacking order |
| `ariaLabel` | `string` | - | Accessible label |
| `clusterId` | `string` | - | Cluster group identifier |

### Event Handlers

| Event | Type | Description |
|-------|------|-------------|
| `onClick` | `(e: MarkerEvent) => void` | Called on marker click |
| `onDragEnd` | `(position: LatLng) => void` | Called when drag ends |
| `onMouseEnter` | `() => void` | Called on mouse enter |
| `onMouseLeave` | `() => void` | Called on mouse leave |

### Custom Icons

```typescript
// Simple icon URL
const marker1 = Marker({
  position: { lat: 40.7128, lng: -74.006 },
  icon: '/icons/custom-marker.png'
});

// Detailed icon configuration
const marker2 = Marker({
  position: { lat: 40.7128, lng: -74.006 },
  icon: {
    url: '/icons/custom-marker.png',
    size: { x: 40, y: 40 },        // Icon size
    anchor: { x: 20, y: 40 },      // Anchor point
    scaledSize: { x: 40, y: 40 }   // Display size
  }
});
```

### MarkerIcon Interface

```typescript
interface MarkerIcon {
  url: string;
  size?: Point;       // { x: number, y: number }
  anchor?: Point;     // Anchor point relative to icon
  scaledSize?: Point; // Scaled display size
}
```

### Draggable Markers

```typescript
const marker = Marker({
  position: { lat: 40.7128, lng: -74.006 },
  draggable: true,
  onDragEnd: (newPosition) => {
    console.log('Marker moved to:', newPosition);
    // Update state, save to server, etc.
  }
});
```

### Marker Methods

The Marker component returns an object with methods:

```typescript
const marker = Marker({ position: { lat: 40.7128, lng: -74.006 } });

// Remove marker from map
marker.remove();

// Update marker properties
marker.update({
  position: { lat: 40.72, lng: -74.01 }
});
```

### Complete Example

```typescript
const { Map, Marker } = createMap({ provider: 'mapbox', apiKey: 'YOUR_TOKEN' });

const locations = [
  { lat: 40.7128, lng: -74.006, name: 'New York' },
  { lat: 34.0522, lng: -118.2437, name: 'Los Angeles' },
  { lat: 41.8781, lng: -87.6298, name: 'Chicago' },
];

Map({
  center: { lat: 39.8283, lng: -98.5795 },
  zoom: 4,
  onLoad: () => {
    const markers = locations.map((loc) =>
      Marker({
        position: { lat: loc.lat, lng: loc.lng },
        title: loc.name,
        ariaLabel: `Marker for ${loc.name}`,
        onClick: (e) => {
          console.log(`Clicked ${loc.name}`);
          // Open popup, show details, etc.
        },
        onMouseEnter: () => {
          console.log(`Hovering over ${loc.name}`);
        },
        onMouseLeave: () => {
          console.log(`Left ${loc.name}`);
        }
      })
    );

    // Store markers for later removal if needed
    window.mapMarkers = markers;
  }
});
```

---

## Popup Component

The `Popup` component displays informational overlays at specific positions.

### Basic Usage

```typescript
const { Map, Popup } = createMap({ provider: 'google', apiKey: 'YOUR_KEY' });

Map({
  center: { lat: 40.7128, lng: -74.006 },
  zoom: 12,
  onLoad: () => {
    const popup = Popup({
      position: { lat: 40.7128, lng: -74.006 },
      children: '<h3>New York City</h3><p>The Big Apple</p>',
      open: true
    });
  }
});
```

### PopupProps Reference

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `position` | `LatLng` | **required** | Popup position |
| `children` | `string \| HTMLElement` | **required** | Popup content |
| `open` | `boolean` | `false` | Initial open state |
| `offset` | `Point` | - | Offset from position |
| `closeButton` | `boolean` | `true` | Show close button |
| `closeOnClick` | `boolean` | `true` | Close on map click |
| `closeOnEscape` | `boolean` | `true` | Close on Escape key |
| `maxWidth` | `number` | - | Maximum width in pixels |
| `minWidth` | `number` | - | Minimum width in pixels |
| `className` | `string` | - | CSS class for content |
| `ariaLabel` | `string` | - | Accessible label |
| `role` | `string` | `'dialog'` | ARIA role |

### Event Handlers

| Event | Type | Description |
|-------|------|-------------|
| `onClose` | `() => void` | Called when popup closes |

### Popup Methods

```typescript
const popup = Popup({
  position: { lat: 40.7128, lng: -74.006 },
  children: 'Hello World!'
});

// Open the popup
popup.open();

// Close the popup
popup.close();

// Remove popup from map
popup.remove();
```

### HTML Content

```typescript
// String content
const popup1 = Popup({
  position: { lat: 40.7128, lng: -74.006 },
  children: '<div class="popup-content"><h3>Title</h3><p>Description</p></div>'
});

// HTMLElement content
const content = document.createElement('div');
content.innerHTML = `
  <h3>New York City</h3>
  <p>Population: 8.3 million</p>
  <button onclick="alert('Hello!')">Click me</button>
`;

const popup2 = Popup({
  position: { lat: 40.7128, lng: -74.006 },
  children: content,
  maxWidth: 300
});
```

### Complete Example

```typescript
const { Map, Marker, Popup } = createMap({ provider: 'leaflet' });

Map({
  center: { lat: 51.505, lng: -0.09 },
  zoom: 13,
  onLoad: () => {
    let activePopup: ReturnType<typeof Popup> | null = null;

    const marker = Marker({
      position: { lat: 51.505, lng: -0.09 },
      title: 'Click for details',
      onClick: () => {
        // Close existing popup
        activePopup?.close();

        // Create and open new popup
        activePopup = Popup({
          position: { lat: 51.505, lng: -0.09 },
          children: `
            <div class="popup-content">
              <h3>London</h3>
              <p>Capital of England</p>
              <p>Coordinates: 51.505, -0.09</p>
            </div>
          `,
          open: true,
          maxWidth: 250,
          closeButton: true,
          closeOnEscape: true,
          ariaLabel: 'Information about London',
          onClose: () => {
            console.log('Popup closed');
            activePopup = null;
          }
        });
      }
    });
  }
});
```

---

## Polyline Component

The `Polyline` component draws lines on the map.

### Basic Usage

```typescript
const { Map, Polyline } = createMap({ provider: 'google', apiKey: 'YOUR_KEY' });

Map({
  center: { lat: 37.772, lng: -122.214 },
  zoom: 3,
  onLoad: () => {
    const polyline = Polyline({
      path: [
        { lat: 37.772, lng: -122.214 },
        { lat: 21.291, lng: -157.821 },
        { lat: -18.142, lng: 178.431 },
      ],
      strokeColor: '#FF0000',
      strokeWeight: 3,
      strokeOpacity: 0.8
    });
  }
});
```

### PolylineProps Reference

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `path` | `LatLng[]` | **required** | Array of coordinates |
| `strokeColor` | `string` | `'#3388ff'` | Line color |
| `strokeWeight` | `number` | `3` | Line width in pixels |
| `strokeOpacity` | `number` | `1` | Line opacity (0-1) |
| `strokeDasharray` | `string` | - | Dash pattern (e.g., `'10,5'`) |
| `editable` | `boolean` | `false` | Enable editing (Google only) |
| `zIndex` | `number` | - | Stacking order |
| `ariaLabel` | `string` | - | Accessible label |

### Event Handlers

| Event | Type | Description |
|-------|------|-------------|
| `onClick` | `(e: ShapeEvent) => void` | Called on polyline click |
| `onMouseEnter` | `() => void` | Called on mouse enter |
| `onMouseLeave` | `() => void` | Called on mouse leave |
| `onEdit` | `(path: LatLng[]) => void` | Called after editing |

### Polyline Methods

```typescript
const polyline = Polyline({
  path: [
    { lat: 37.772, lng: -122.214 },
    { lat: 21.291, lng: -157.821 }
  ]
});

// Update the path
polyline.setPath([
  { lat: 40.7128, lng: -74.006 },
  { lat: 34.0522, lng: -118.2437 }
]);

// Remove from map
polyline.remove();
```

### Flight Path Example

```typescript
const { Map, Polyline } = createMap({ provider: 'mapbox', apiKey: 'YOUR_TOKEN' });

const flightPath = [
  { lat: 40.7128, lng: -74.006 },    // New York
  { lat: 51.5074, lng: -0.1278 },    // London
  { lat: 48.8566, lng: 2.3522 },     // Paris
  { lat: 35.6762, lng: 139.6503 },   // Tokyo
];

Map({
  center: { lat: 40, lng: 0 },
  zoom: 2,
  onLoad: () => {
    Polyline({
      path: flightPath,
      strokeColor: '#4285F4',
      strokeWeight: 2,
      strokeOpacity: 0.8,
      ariaLabel: 'Flight path from New York to Tokyo',
      onClick: (e) => {
        console.log('Clicked flight path at:', e.latlng);
      }
    });
  }
});
```

---

## Polygon Component

The `Polygon` component draws filled shapes on the map.

### Basic Usage

```typescript
const { Map, Polygon } = createMap({ provider: 'google', apiKey: 'YOUR_KEY' });

Map({
  center: { lat: 25.774, lng: -80.19 },
  zoom: 5,
  onLoad: () => {
    const polygon = Polygon({
      path: [
        { lat: 25.774, lng: -80.19 },
        { lat: 18.466, lng: -66.118 },
        { lat: 32.321, lng: -64.757 },
      ],
      fillColor: '#FF0000',
      fillOpacity: 0.35,
      strokeColor: '#FF0000',
      strokeWeight: 2
    });
  }
});
```

### PolygonProps Reference

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `path` | `LatLng[]` | **required** | Polygon vertices |
| `holes` | `LatLng[][]` | - | Array of hole paths |
| `strokeColor` | `string` | `'#3388ff'` | Outline color |
| `strokeWeight` | `number` | `2` | Outline width |
| `strokeOpacity` | `number` | `1` | Outline opacity (0-1) |
| `fillColor` | `string` | `'#3388ff'` | Fill color |
| `fillOpacity` | `number` | `0.3` | Fill opacity (0-1) |
| `editable` | `boolean` | `false` | Enable editing |
| `zIndex` | `number` | - | Stacking order |
| `ariaLabel` | `string` | - | Accessible label |

### Event Handlers

| Event | Type | Description |
|-------|------|-------------|
| `onClick` | `(e: ShapeEvent) => void` | Called on polygon click |
| `onMouseEnter` | `() => void` | Called on mouse enter |
| `onMouseLeave` | `() => void` | Called on mouse leave |
| `onEdit` | `(path: LatLng[], holes?: LatLng[][]) => void` | Called after editing |

### Polygon Methods

```typescript
const polygon = Polygon({
  path: [
    { lat: 25.774, lng: -80.19 },
    { lat: 18.466, lng: -66.118 },
    { lat: 32.321, lng: -64.757 }
  ]
});

// Update the path
polygon.setPath([
  { lat: 40.774, lng: -73.9 },
  { lat: 40.774, lng: -74.1 },
  { lat: 40.674, lng: -74.0 }
]);

// Remove from map
polygon.remove();
```

### Polygon with Holes

```typescript
const { Map, Polygon } = createMap({ provider: 'leaflet' });

Map({
  center: { lat: 28, lng: -70 },
  zoom: 5,
  onLoad: () => {
    Polygon({
      // Outer boundary (Bermuda Triangle)
      path: [
        { lat: 25.774, lng: -80.19 },  // Miami
        { lat: 18.466, lng: -66.118 }, // Puerto Rico
        { lat: 32.321, lng: -64.757 }, // Bermuda
      ],
      // Holes (excluded areas)
      holes: [
        [
          { lat: 28.745, lng: -70.579 },
          { lat: 29.57, lng: -67.514 },
          { lat: 27.339, lng: -66.668 },
        ]
      ],
      fillColor: '#0000FF',
      fillOpacity: 0.35,
      strokeColor: '#0000FF',
      strokeWeight: 2,
      strokeOpacity: 1
    });
  }
});
```

### Interactive Region Example

```typescript
const { Map, Polygon } = createMap({ provider: 'google', apiKey: 'YOUR_KEY' });

const regions = [
  {
    name: 'Region A',
    path: [/* coordinates */],
    color: '#FF6B6B'
  },
  {
    name: 'Region B',
    path: [/* coordinates */],
    color: '#4ECDC4'
  }
];

Map({
  center: { lat: 40, lng: -74 },
  zoom: 8,
  onLoad: () => {
    regions.forEach((region) => {
      Polygon({
        path: region.path,
        fillColor: region.color,
        fillOpacity: 0.3,
        strokeColor: region.color,
        strokeWeight: 2,
        onClick: (e) => {
          console.log(`Clicked ${region.name} at`, e.latlng);
          showRegionDetails(region);
        },
        onMouseEnter: () => {
          // Highlight on hover
          // Note: Would need to store reference to update
        }
      });
    });
  }
});
```

---

## Provider-Specific Notes

### Google Maps

- Requires API key with Maps JavaScript API enabled
- Supports editable shapes
- Full Places and Directions API support
- Best for production apps requiring Places autocomplete

### Mapbox

- Requires access token
- Uses GeoJSON layers for shapes (Polyline, Polygon)
- Custom styles via `styleUrl` property
- Best for custom-styled maps and large datasets

### Leaflet

- No API key required (uses OpenStreetMap tiles by default)
- Lightweight and free
- Custom tile sources via `styleUrl`
- Best for open-source projects and simple maps

```typescript
// Leaflet with custom tiles
const { Map } = createMap({ provider: 'leaflet' });

Map({
  center: { lat: 51.505, lng: -0.09 },
  zoom: 13,
  styleUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
});
```
