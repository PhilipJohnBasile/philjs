/**
 * PhilJS Maps - Marker Cluster Component
 * Efficient clustering for large numbers of markers
 */

import type {
  MarkerClusterProps,
  MarkerProps,
  ClusterData,
  LatLng,
  LatLngBounds,
  MapInstance,
} from '../types';
import { getMapContext } from './Map';
import { createMarker, MarkerInstance } from './Marker';
import { calculateClusters, ClusterOptions } from '../utils/cluster';

// ============================================================================
// Cluster Instance
// ============================================================================

/**
 * Marker cluster instance
 */
export interface MarkerClusterInstance {
  id: string;
  markers: MarkerInstance[];
  clusterMarkers: Map<string, MarkerInstance>;
  update(): void;
  addMarker(props: MarkerProps): void;
  removeMarker(position: LatLng): void;
  clearMarkers(): void;
  destroy(): void;
}

// ============================================================================
// Default Cluster Renderer
// ============================================================================

/**
 * Create default cluster icon SVG
 */
export function createClusterIcon(count: number): string {
  const size = count < 10 ? 40 : count < 100 ? 50 : 60;
  const color = count < 10 ? '#3498db' : count < 100 ? '#f39c12' : '#e74c3c';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.3"/>
        </filter>
      </defs>
      <circle fill="${color}" filter="url(#shadow)" cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}"/>
      <circle fill="white" cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 6}"/>
      <text x="${size / 2}" y="${size / 2 + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size / 3}" font-weight="bold" fill="${color}">${count}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Default cluster element renderer
 */
function defaultClusterRenderer(count: number, _markers: MarkerProps[]): unknown {
  return {
    icon: createClusterIcon(count),
    size: { x: count < 10 ? 40 : count < 100 ? 50 : 60, y: count < 10 ? 40 : count < 100 ? 50 : 60 },
  };
}

// ============================================================================
// Spiderfy Support
// ============================================================================

interface SpiderfyState {
  isSpiderfied: boolean;
  cluster: ClusterData | null;
  legs: MarkerInstance[];
}

/**
 * Calculate spider leg positions
 */
function calculateSpiderPositions(
  center: LatLng,
  count: number,
  legLength = 0.0002
): LatLng[] {
  const positions: LatLng[] = [];
  const angleStep = (2 * Math.PI) / count;

  for (let i = 0; i < count; i++) {
    const angle = angleStep * i - Math.PI / 2;
    positions.push({
      lat: center.lat + Math.sin(angle) * legLength,
      lng: center.lng + Math.cos(angle) * legLength,
    });
  }

  return positions;
}

/**
 * Spiderfy a cluster
 */
function spiderfyCluster(
  cluster: ClusterData,
  markers: MarkerProps[],
  map: MapInstance,
  state: SpiderfyState
): MarkerInstance[] {
  const positions = calculateSpiderPositions(cluster.center, markers.length);
  const spiderfiedMarkers: MarkerInstance[] = [];

  markers.forEach((markerProps, index) => {
    const marker = createMarker({
      ...markerProps,
      position: positions[index],
    });

    if (marker) {
      spiderfiedMarkers.push(marker);
    }
  });

  state.isSpiderfied = true;
  state.cluster = cluster;
  state.legs = spiderfiedMarkers;

  return spiderfiedMarkers;
}

/**
 * Unspiderfy - remove spider legs
 */
function unspiderfyCluster(state: SpiderfyState): void {
  state.legs.forEach((marker) => marker.remove());
  state.legs = [];
  state.isSpiderfied = false;
  state.cluster = null;
}

// ============================================================================
// Marker Cluster Component
// ============================================================================

/**
 * Create a marker cluster instance
 */
export function createMarkerCluster(props: MarkerClusterProps): MarkerClusterInstance | null {
  const context = getMapContext();

  if (!context || !context.map) {
    console.warn('MarkerCluster: No map context available.');
    return null;
  }

  const map = context.map;
  const id = props.id || `cluster-${Date.now()}`;

  // State
  const individualMarkers: MarkerInstance[] = [];
  const clusterMarkers = new Map<string, MarkerInstance>();
  const markerData = [...props.markers];

  const spiderfyState: SpiderfyState = {
    isSpiderfied: false,
    cluster: null,
    legs: [],
  };

  // Cluster options
  const clusterOptions: ClusterOptions = {
    radius: props.radius || 60,
    minPoints: props.minClusterSize || 2,
    maxZoom: props.maxZoom || 16,
  };

  /**
   * Update clusters based on current viewport
   */
  function update(): void {
    // Clear existing markers
    individualMarkers.forEach((m) => m.remove());
    individualMarkers.length = 0;
    clusterMarkers.forEach((m) => m.remove());
    clusterMarkers.clear();

    // Unspiderfy if needed
    if (spiderfyState.isSpiderfied) {
      unspiderfyCluster(spiderfyState);
    }

    const bounds = map.getBounds();
    const zoom = map.getZoom();

    // Calculate clusters
    const clusters = calculateClusters(
      markerData.map((m) => ({
        position: m.position,
        data: m,
      })),
      bounds,
      zoom,
      clusterOptions
    );

    // Render clusters and individual markers
    clusters.forEach((cluster) => {
      if (cluster.count === 1) {
        // Single marker
        const markerProps = cluster.markers[0] as MarkerProps;
        const marker = createMarker(markerProps);
        if (marker) {
          individualMarkers.push(marker);
        }
      } else {
        // Cluster
        const clusterData: ClusterData = {
          id: cluster.id,
          center: cluster.center,
          count: cluster.count,
          markers: cluster.markers as MarkerProps[],
          bounds: cluster.bounds,
        };

        const renderer = props.clusterRenderer || defaultClusterRenderer;
        const renderedCluster = renderer(cluster.count, cluster.markers as MarkerProps[]);

        // Create cluster marker
        const clusterMarker = createMarker({
          position: cluster.center,
          icon: (renderedCluster as { icon: string }).icon,
          title: `Cluster of ${cluster.count} markers`,
          ariaLabel: `Cluster containing ${cluster.count} locations. Click to expand.`,
          onClick: () => {
            if (props.onClusterClick) {
              props.onClusterClick(clusterData);
            }

            if (props.spiderfy && zoom >= (props.maxZoom || 16)) {
              // Spiderfy at max zoom
              if (spiderfyState.isSpiderfied) {
                unspiderfyCluster(spiderfyState);
              }
              spiderfyCluster(clusterData, cluster.markers as MarkerProps[], map, spiderfyState);
            } else {
              // Zoom to cluster bounds
              map.fitBounds(cluster.bounds);
            }
          },
        });

        if (clusterMarker) {
          clusterMarkers.set(cluster.id, clusterMarker);
        }
      }
    });
  }

  // Initial update
  update();

  // Update on map events
  map.on('zoom', update);
  map.on('moveend', update);

  // Return cluster instance
  return {
    id,
    markers: individualMarkers,
    clusterMarkers,

    update,

    addMarker(markerProps: MarkerProps): void {
      markerData.push(markerProps);
      update();
    },

    removeMarker(position: LatLng): void {
      const index = markerData.findIndex(
        (m) => m.position.lat === position.lat && m.position.lng === position.lng
      );
      if (index !== -1) {
        markerData.splice(index, 1);
        update();
      }
    },

    clearMarkers(): void {
      markerData.length = 0;
      update();
    },

    destroy(): void {
      map.off('zoom', update);
      map.off('moveend', update);
      individualMarkers.forEach((m) => m.remove());
      clusterMarkers.forEach((m) => m.remove());
      if (spiderfyState.isSpiderfied) {
        unspiderfyCluster(spiderfyState);
      }
    },
  };
}

/**
 * MarkerCluster component (for use with JSX)
 */
export function MarkerCluster(props: MarkerClusterProps): unknown {
  return {
    type: 'philjs-marker-cluster',
    props,
    create: () => createMarkerCluster(props),
  };
}

// ============================================================================
// Animation Support
// ============================================================================

/**
 * Animate cluster markers when count changes
 */
export function animateClusterChange(
  clusterMarker: MarkerInstance,
  oldCount: number,
  newCount: number,
  duration = 300
): Promise<void> {
  return new Promise((resolve) => {
    // This would animate the cluster icon size/appearance
    // Implementation depends on the provider's marker capabilities
    setTimeout(resolve, duration);
  });
}

// Default export
export default MarkerCluster;
