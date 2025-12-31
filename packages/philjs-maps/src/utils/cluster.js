/**
 * PhilJS Maps - Clustering Utilities
 * Efficient marker clustering using spatial indexing
 */
// ============================================================================
// Clustering Algorithm
// ============================================================================
/**
 * Convert lat/lng to tile coordinates at given zoom
 */
function latLngToTile(position, zoom) {
    const latRad = (position.lat * Math.PI) / 180;
    const n = Math.pow(2, zoom);
    const x = Math.floor(((position.lng + 180) / 360) * n);
    const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
    return { x, y };
}
/**
 * Calculate distance between two points in pixels at given zoom
 */
function pixelDistance(a, b, zoom) {
    const scale = Math.pow(2, zoom);
    const worldSize = 256 * scale;
    const ax = ((a.lng + 180) / 360) * worldSize;
    const ay = ((1 - Math.log(Math.tan((a.lat * Math.PI) / 180) + 1 / Math.cos((a.lat * Math.PI) / 180)) / Math.PI) / 2) * worldSize;
    const bx = ((b.lng + 180) / 360) * worldSize;
    const by = ((1 - Math.log(Math.tan((b.lat * Math.PI) / 180) + 1 / Math.cos((b.lat * Math.PI) / 180)) / Math.PI) / 2) * worldSize;
    return Math.sqrt(Math.pow(ax - bx, 2) + Math.pow(ay - by, 2));
}
/**
 * Calculate bounding box for a set of points
 */
function calculateBounds(points) {
    const firstPoint = points[0];
    if (!firstPoint) {
        return { north: 0, south: 0, east: 0, west: 0 };
    }
    let north = firstPoint.lat;
    let south = firstPoint.lat;
    let east = firstPoint.lng;
    let west = firstPoint.lng;
    for (const point of points) {
        if (point.lat > north)
            north = point.lat;
        if (point.lat < south)
            south = point.lat;
        if (point.lng > east)
            east = point.lng;
        if (point.lng < west)
            west = point.lng;
    }
    return { north, south, east, west };
}
/**
 * Check if a point is within bounds
 */
function isInBounds(position, bounds) {
    return (position.lat >= bounds.south &&
        position.lat <= bounds.north &&
        position.lng >= bounds.west &&
        position.lng <= bounds.east);
}
/**
 * Calculate clusters for a set of points
 */
export function calculateClusters(points, bounds, zoom, options = {}) {
    const { radius = 60, minPoints = 2, maxZoom = 16 } = options;
    // If zoom is above maxZoom, don't cluster
    if (zoom >= maxZoom) {
        return points
            .filter((p) => isInBounds(p.position, bounds))
            .map((p, i) => ({
            id: `single-${i}`,
            center: p.position,
            count: 1,
            markers: [p.data],
            bounds: calculateBounds([p.position]),
        }));
    }
    // Filter points within bounds (with buffer)
    const buffer = 0.1; // Add 10% buffer
    const latBuffer = (bounds.north - bounds.south) * buffer;
    const lngBuffer = (bounds.east - bounds.west) * buffer;
    const expandedBounds = {
        north: bounds.north + latBuffer,
        south: bounds.south - latBuffer,
        east: bounds.east + lngBuffer,
        west: bounds.west - lngBuffer,
    };
    const visiblePoints = points.filter((p) => isInBounds(p.position, expandedBounds));
    if (visiblePoints.length === 0) {
        return [];
    }
    // Simple grid-based clustering
    const clusters = new Map();
    const cellSize = radius / Math.pow(2, zoom);
    for (const point of visiblePoints) {
        const cellX = Math.floor(point.position.lng / cellSize);
        const cellY = Math.floor(point.position.lat / cellSize);
        const cellKey = `${cellX},${cellY}`;
        if (!clusters.has(cellKey)) {
            clusters.set(cellKey, []);
        }
        clusters.get(cellKey).push(point);
    }
    // Convert to cluster results
    const results = [];
    let clusterIndex = 0;
    for (const [_cellKey, clusterPoints] of clusters) {
        if (clusterPoints.length < minPoints) {
            // Not enough points to cluster, return as individual markers
            for (const point of clusterPoints) {
                results.push({
                    id: `single-${clusterIndex++}`,
                    center: point.position,
                    count: 1,
                    markers: [point.data],
                    bounds: calculateBounds([point.position]),
                });
            }
        }
        else {
            // Create cluster
            const positions = clusterPoints.map((p) => p.position);
            const center = {
                lat: positions.reduce((sum, p) => sum + p.lat, 0) / positions.length,
                lng: positions.reduce((sum, p) => sum + p.lng, 0) / positions.length,
            };
            results.push({
                id: `cluster-${clusterIndex++}`,
                center,
                count: clusterPoints.length,
                markers: clusterPoints.map((p) => p.data),
                bounds: calculateBounds(positions),
            });
        }
    }
    return results;
}
/**
 * Supercluster-based clustering (for use with supercluster library)
 */
export function createSupercluster(options = {}) {
    const { radius = 60, minPoints = 2, maxZoom = 16 } = options;
    let loadedPoints = [];
    return {
        load(points) {
            loadedPoints = points;
        },
        getClusters(bounds, zoom) {
            return calculateClusters(loadedPoints, bounds, zoom, { radius, minPoints, maxZoom });
        },
    };
}
//# sourceMappingURL=cluster.js.map