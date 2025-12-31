/**
 * PhilJS Maps - Clustering Utilities
 * Efficient marker clustering using spatial indexing
 */
import type { LatLng, LatLngBounds, MarkerProps } from '../types.js';
/**
 * Cluster options
 */
export interface ClusterOptions {
    /** Cluster radius in pixels */
    radius?: number;
    /** Minimum points to form a cluster */
    minPoints?: number;
    /** Maximum zoom level for clustering */
    maxZoom?: number;
}
/**
 * Input point for clustering
 */
export interface ClusterPoint {
    position: LatLng;
    data: MarkerProps;
}
/**
 * Cluster result
 */
export interface ClusterResult {
    id: string;
    center: LatLng;
    count: number;
    markers: MarkerProps[];
    bounds: LatLngBounds;
}
/**
 * Calculate clusters for a set of points
 */
export declare function calculateClusters(points: ClusterPoint[], bounds: LatLngBounds, zoom: number, options?: ClusterOptions): ClusterResult[];
/**
 * Supercluster-based clustering (for use with supercluster library)
 */
export declare function createSupercluster(options?: ClusterOptions): {
    load: (points: ClusterPoint[]) => void;
    getClusters: (bounds: LatLngBounds, zoom: number) => ClusterResult[];
};
//# sourceMappingURL=cluster.d.ts.map