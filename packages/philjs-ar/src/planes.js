/**
 * @philjs/ar - AR Plane Detection Module
 *
 * Real-time plane detection and tracking for horizontal and vertical surfaces.
 */
import { signal, effect } from '@philjs/core';
/**
 * Plane detector for AR surface detection
 */
export class PlaneDetector {
    session = null;
    refSpace = null;
    planes = new Map();
    xrPlanes = new Map();
    config;
    eventHandlers = new Map();
    planeIdCounter = 0;
    // Reactive state
    planeCount = signal(0);
    horizontalPlanes = signal([]);
    verticalPlanes = signal([]);
    allPlanes = signal([]);
    largestPlane = signal(null);
    constructor(config = {}) {
        this.config = {
            detectHorizontal: config.detectHorizontal ?? true,
            detectVertical: config.detectVertical ?? true,
            minPlaneArea: config.minPlaneArea ?? 0.1, // 0.1 square meters
            mergeThreshold: config.mergeThreshold ?? 0.2, // 20cm threshold for merging
        };
        const eventTypes = ['detected', 'updated', 'removed', 'merged'];
        for (const type of eventTypes) {
            this.eventHandlers.set(type, new Set());
        }
    }
    /**
     * Check if plane detection is supported
     */
    static isSupported() {
        return typeof XRPlane !== 'undefined';
    }
    /**
     * Initialize plane detection with an XR session
     */
    initialize(session, refSpace) {
        this.session = session;
        this.refSpace = refSpace;
    }
    /**
     * Process XR frame for plane updates
     */
    processFrame(frame) {
        if (!this.refSpace)
            return;
        const detectedPlanes = frame.detectedPlanes;
        if (!detectedPlanes)
            return;
        const currentPlaneIds = new Set();
        // Process detected planes
        for (const xrPlane of detectedPlanes) {
            const orientation = this.getPlaneOrientation(xrPlane);
            // Filter by configuration
            if (orientation === 'horizontal' && !this.config.detectHorizontal)
                continue;
            if (orientation === 'vertical' && !this.config.detectVertical)
                continue;
            let planeId = this.xrPlanes.get(xrPlane);
            const isNew = !planeId;
            if (isNew) {
                planeId = `plane-${++this.planeIdCounter}`;
                this.xrPlanes.set(xrPlane, planeId);
            }
            currentPlaneIds.add(planeId);
            // Get plane pose
            const planePose = frame.getPose(xrPlane.planeSpace, this.refSpace);
            if (!planePose)
                continue;
            // Build polygon from plane polygon
            const polygon = [];
            for (const point of xrPlane.polygon) {
                polygon.push(new Float32Array([point.x, point.y, point.z]));
            }
            // Calculate plane dimensions
            const { width, height, area } = this.calculatePlaneDimensions(polygon);
            // Filter by minimum area
            if (area < this.config.minPlaneArea)
                continue;
            const plane = {
                id: planeId,
                orientation,
                center: new Float32Array([
                    planePose.transform.position.x,
                    planePose.transform.position.y,
                    planePose.transform.position.z,
                ]),
                normal: this.calculateNormal(planePose),
                polygon,
                width,
                height,
                area,
                lastUpdated: performance.now(),
            };
            const existingPlane = this.planes.get(planeId);
            this.planes.set(planeId, plane);
            if (isNew) {
                this.emitEvent('detected', plane);
            }
            else if (existingPlane && this.hasPlaneChanged(existingPlane, plane)) {
                this.emitEvent('updated', plane);
            }
        }
        // Remove planes that are no longer detected
        for (const [id] of this.planes) {
            if (!currentPlaneIds.has(id)) {
                const plane = this.planes.get(id);
                this.planes.delete(id);
                if (plane) {
                    this.emitEvent('removed', plane);
                }
            }
        }
        this.updateSignals();
    }
    /**
     * Get plane orientation from XRPlane
     */
    getPlaneOrientation(xrPlane) {
        return xrPlane.orientation === 'horizontal' ? 'horizontal' : 'vertical';
    }
    /**
     * Calculate plane normal from pose
     */
    calculateNormal(pose) {
        // The normal is typically the Y-axis for horizontal planes
        // and Z-axis for vertical planes
        const matrix = pose.transform.matrix;
        // Extract Y-axis from rotation matrix (for normal)
        return new Float32Array([matrix[4], matrix[5], matrix[6]]);
    }
    /**
     * Calculate plane dimensions
     */
    calculatePlaneDimensions(polygon) {
        if (polygon.length < 3) {
            return { width: 0, height: 0, area: 0 };
        }
        // Find bounding box
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        for (const point of polygon) {
            minX = Math.min(minX, point[0]);
            maxX = Math.max(maxX, point[0]);
            minZ = Math.min(minZ, point[2]);
            maxZ = Math.max(maxZ, point[2]);
        }
        const width = maxX - minX;
        const height = maxZ - minZ;
        // Calculate area using shoelace formula
        let area = 0;
        for (let i = 0; i < polygon.length; i++) {
            const j = (i + 1) % polygon.length;
            area += polygon[i][0] * polygon[j][2];
            area -= polygon[j][0] * polygon[i][2];
        }
        area = Math.abs(area) / 2;
        return { width, height, area };
    }
    /**
     * Check if plane has changed significantly
     */
    hasPlaneChanged(oldPlane, newPlane) {
        const centerDiff = Math.sqrt(Math.pow(oldPlane.center[0] - newPlane.center[0], 2) +
            Math.pow(oldPlane.center[1] - newPlane.center[1], 2) +
            Math.pow(oldPlane.center[2] - newPlane.center[2], 2));
        const areaDiff = Math.abs(oldPlane.area - newPlane.area);
        const polygonChanged = oldPlane.polygon.length !== newPlane.polygon.length;
        return centerDiff > 0.01 || areaDiff > 0.01 || polygonChanged;
    }
    /**
     * Get all detected planes
     */
    getPlanes() {
        return Array.from(this.planes.values());
    }
    /**
     * Get horizontal planes
     */
    getHorizontalPlanes() {
        return Array.from(this.planes.values()).filter((p) => p.orientation === 'horizontal');
    }
    /**
     * Get vertical planes
     */
    getVerticalPlanes() {
        return Array.from(this.planes.values()).filter((p) => p.orientation === 'vertical');
    }
    /**
     * Get plane by ID
     */
    getPlane(id) {
        return this.planes.get(id);
    }
    /**
     * Get the largest plane
     */
    getLargestPlane() {
        let largest = null;
        for (const plane of this.planes.values()) {
            if (!largest || plane.area > largest.area) {
                largest = plane;
            }
        }
        return largest;
    }
    /**
     * Get planes at a point
     */
    getPlanesAtPoint(point, tolerance = 0.1) {
        return Array.from(this.planes.values()).filter((plane) => {
            // Check if point is near plane
            const dx = Math.abs(point[0] - plane.center[0]);
            const dy = Math.abs(point[1] - plane.center[1]);
            const dz = Math.abs(point[2] - plane.center[2]);
            // Simple bounding box check
            return dx < plane.width / 2 + tolerance &&
                dz < plane.height / 2 + tolerance &&
                dy < tolerance;
        });
    }
    /**
     * Find the nearest plane to a point
     */
    getNearestPlane(point) {
        let nearest = null;
        let minDistance = Infinity;
        for (const plane of this.planes.values()) {
            const distance = Math.sqrt(Math.pow(point[0] - plane.center[0], 2) +
                Math.pow(point[1] - plane.center[1], 2) +
                Math.pow(point[2] - plane.center[2], 2));
            if (distance < minDistance) {
                minDistance = distance;
                nearest = plane;
            }
        }
        return nearest;
    }
    /**
     * Update reactive signals
     */
    updateSignals() {
        const allPlanes = Array.from(this.planes.values());
        this.planeCount.set(allPlanes.length);
        this.allPlanes.set(allPlanes);
        this.horizontalPlanes.set(allPlanes.filter((p) => p.orientation === 'horizontal'));
        this.verticalPlanes.set(allPlanes.filter((p) => p.orientation === 'vertical'));
        this.largestPlane.set(this.getLargestPlane());
    }
    /**
     * Add event handler
     */
    on(type, handler) {
        this.eventHandlers.get(type)?.add(handler);
    }
    /**
     * Remove event handler
     */
    off(type, handler) {
        this.eventHandlers.get(type)?.delete(handler);
    }
    /**
     * Emit event
     */
    emitEvent(type, plane, planes) {
        const event = {
            type,
            plane,
            planes,
            timestamp: performance.now(),
        };
        const handlers = this.eventHandlers.get(type);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(event);
                }
                catch (error) {
                    console.error(`Plane event handler error for ${type}:`, error);
                }
            }
        }
    }
    /**
     * Clear all planes
     */
    clear() {
        this.planes.clear();
        this.xrPlanes.clear();
        this.updateSignals();
    }
    /**
     * Dispose the plane detector
     */
    dispose() {
        this.clear();
        this.session = null;
        this.refSpace = null;
        this.eventHandlers.clear();
    }
}
/**
 * Create a plane detector with default configuration
 */
export function createPlaneDetector(config) {
    return new PlaneDetector(config);
}
//# sourceMappingURL=planes.js.map