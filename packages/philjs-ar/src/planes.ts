/**
 * @philjs/ar - AR Plane Detection Module
 *
 * Real-time plane detection and tracking for horizontal and vertical surfaces.
 */

import { signal, effect, type Signal } from '@philjs/core';

export type PlaneOrientation = 'horizontal' | 'vertical';

export interface ARPlane {
  id: string;
  orientation: PlaneOrientation;
  center: Float32Array;
  normal: Float32Array;
  polygon: Float32Array[];
  width: number;
  height: number;
  area: number;
  lastUpdated: number;
}

export interface PlaneDetectorConfig {
  detectHorizontal?: boolean;
  detectVertical?: boolean;
  minPlaneArea?: number;
  mergeThreshold?: number;
}

type PlaneEventType = 'detected' | 'updated' | 'removed' | 'merged';
type PlaneEventHandler = (event: PlaneEvent) => void;

export interface PlaneEvent {
  type: PlaneEventType;
  plane?: ARPlane;
  planes?: ARPlane[];
  timestamp: number;
}

/**
 * Plane detector for AR surface detection
 */
export class PlaneDetector {
  private session: XRSession | null = null;
  private refSpace: XRReferenceSpace | null = null;
  private planes = new Map<string, ARPlane>();
  private xrPlanes = new Map<XRPlane, string>();
  private config: Required<PlaneDetectorConfig>;
  private eventHandlers = new Map<PlaneEventType, Set<PlaneEventHandler>>();
  private planeIdCounter = 0;

  // Reactive state
  readonly planeCount: Signal<number> = signal(0);
  readonly horizontalPlanes: Signal<ARPlane[]> = signal([]);
  readonly verticalPlanes: Signal<ARPlane[]> = signal([]);
  readonly allPlanes: Signal<ARPlane[]> = signal([]);
  readonly largestPlane: Signal<ARPlane | null> = signal(null);

  constructor(config: PlaneDetectorConfig = {}) {
    this.config = {
      detectHorizontal: config.detectHorizontal ?? true,
      detectVertical: config.detectVertical ?? true,
      minPlaneArea: config.minPlaneArea ?? 0.1, // 0.1 square meters
      mergeThreshold: config.mergeThreshold ?? 0.2, // 20cm threshold for merging
    };

    const eventTypes: PlaneEventType[] = ['detected', 'updated', 'removed', 'merged'];
    for (const type of eventTypes) {
      this.eventHandlers.set(type, new Set());
    }
  }

  /**
   * Check if plane detection is supported
   */
  static isSupported(): boolean {
    return typeof XRPlane !== 'undefined';
  }

  /**
   * Initialize plane detection with an XR session
   */
  initialize(session: XRSession, refSpace: XRReferenceSpace): void {
    this.session = session;
    this.refSpace = refSpace;
  }

  /**
   * Process XR frame for plane updates
   */
  processFrame(frame: XRFrame): void {
    if (!this.refSpace) return;

    const detectedPlanes = (frame as any).detectedPlanes as Set<XRPlane> | undefined;
    if (!detectedPlanes) return;

    const currentPlaneIds = new Set<string>();

    // Process detected planes
    for (const xrPlane of detectedPlanes) {
      const orientation = this.getPlaneOrientation(xrPlane);

      // Filter by configuration
      if (orientation === 'horizontal' && !this.config.detectHorizontal) continue;
      if (orientation === 'vertical' && !this.config.detectVertical) continue;

      let planeId = this.xrPlanes.get(xrPlane);
      const isNew = !planeId;

      if (isNew) {
        planeId = `plane-${++this.planeIdCounter}`;
        this.xrPlanes.set(xrPlane, planeId);
      }

      currentPlaneIds.add(planeId);

      // Get plane pose
      const planePose = frame.getPose(xrPlane.planeSpace, this.refSpace);
      if (!planePose) continue;

      // Build polygon from plane polygon
      const polygon: Float32Array[] = [];
      for (const point of xrPlane.polygon) {
        polygon.push(new Float32Array([point.x, point.y, point.z]));
      }

      // Calculate plane dimensions
      const { width, height, area } = this.calculatePlaneDimensions(polygon);

      // Filter by minimum area
      if (area < this.config.minPlaneArea) continue;

      const plane: ARPlane = {
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
      } else if (existingPlane && this.hasPlaneChanged(existingPlane, plane)) {
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
  private getPlaneOrientation(xrPlane: XRPlane): PlaneOrientation {
    return xrPlane.orientation === 'horizontal' ? 'horizontal' : 'vertical';
  }

  /**
   * Calculate plane normal from pose
   */
  private calculateNormal(pose: XRPose): Float32Array {
    // The normal is typically the Y-axis for horizontal planes
    // and Z-axis for vertical planes
    const matrix = pose.transform.matrix;
    // Extract Y-axis from rotation matrix (for normal)
    return new Float32Array([matrix[4], matrix[5], matrix[6]]);
  }

  /**
   * Calculate plane dimensions
   */
  private calculatePlaneDimensions(polygon: Float32Array[]): {
    width: number;
    height: number;
    area: number;
  } {
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
  private hasPlaneChanged(oldPlane: ARPlane, newPlane: ARPlane): boolean {
    const centerDiff = Math.sqrt(
      Math.pow(oldPlane.center[0] - newPlane.center[0], 2) +
      Math.pow(oldPlane.center[1] - newPlane.center[1], 2) +
      Math.pow(oldPlane.center[2] - newPlane.center[2], 2)
    );

    const areaDiff = Math.abs(oldPlane.area - newPlane.area);
    const polygonChanged = oldPlane.polygon.length !== newPlane.polygon.length;

    return centerDiff > 0.01 || areaDiff > 0.01 || polygonChanged;
  }

  /**
   * Get all detected planes
   */
  getPlanes(): ARPlane[] {
    return Array.from(this.planes.values());
  }

  /**
   * Get horizontal planes
   */
  getHorizontalPlanes(): ARPlane[] {
    return Array.from(this.planes.values()).filter((p) => p.orientation === 'horizontal');
  }

  /**
   * Get vertical planes
   */
  getVerticalPlanes(): ARPlane[] {
    return Array.from(this.planes.values()).filter((p) => p.orientation === 'vertical');
  }

  /**
   * Get plane by ID
   */
  getPlane(id: string): ARPlane | undefined {
    return this.planes.get(id);
  }

  /**
   * Get the largest plane
   */
  getLargestPlane(): ARPlane | null {
    let largest: ARPlane | null = null;
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
  getPlanesAtPoint(point: Float32Array, tolerance = 0.1): ARPlane[] {
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
  getNearestPlane(point: Float32Array): ARPlane | null {
    let nearest: ARPlane | null = null;
    let minDistance = Infinity;

    for (const plane of this.planes.values()) {
      const distance = Math.sqrt(
        Math.pow(point[0] - plane.center[0], 2) +
        Math.pow(point[1] - plane.center[1], 2) +
        Math.pow(point[2] - plane.center[2], 2)
      );

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
  private updateSignals(): void {
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
  on(type: PlaneEventType, handler: PlaneEventHandler): void {
    this.eventHandlers.get(type)?.add(handler);
  }

  /**
   * Remove event handler
   */
  off(type: PlaneEventType, handler: PlaneEventHandler): void {
    this.eventHandlers.get(type)?.delete(handler);
  }

  /**
   * Emit event
   */
  private emitEvent(type: PlaneEventType, plane?: ARPlane, planes?: ARPlane[]): void {
    const event: PlaneEvent = {
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
        } catch (error) {
          console.error(`Plane event handler error for ${type}:`, error);
        }
      }
    }
  }

  /**
   * Clear all planes
   */
  clear(): void {
    this.planes.clear();
    this.xrPlanes.clear();
    this.updateSignals();
  }

  /**
   * Dispose the plane detector
   */
  dispose(): void {
    this.clear();
    this.session = null;
    this.refSpace = null;
    this.eventHandlers.clear();
  }
}

/**
 * Create a plane detector with default configuration
 */
export function createPlaneDetector(config?: PlaneDetectorConfig): PlaneDetector {
  return new PlaneDetector(config);
}
