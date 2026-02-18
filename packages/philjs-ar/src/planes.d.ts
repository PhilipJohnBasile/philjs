/**
 * @philjs/ar - AR Plane Detection Module
 *
 * Real-time plane detection and tracking for horizontal and vertical surfaces.
 */
import { type Signal } from '@philjs/core';
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
export declare class PlaneDetector {
    private session;
    private refSpace;
    private planes;
    private xrPlanes;
    private config;
    private eventHandlers;
    private planeIdCounter;
    readonly planeCount: Signal<number>;
    readonly horizontalPlanes: Signal<ARPlane[]>;
    readonly verticalPlanes: Signal<ARPlane[]>;
    readonly allPlanes: Signal<ARPlane[]>;
    readonly largestPlane: Signal<ARPlane | null>;
    constructor(config?: PlaneDetectorConfig);
    /**
     * Check if plane detection is supported
     */
    static isSupported(): boolean;
    /**
     * Initialize plane detection with an XR session
     */
    initialize(session: XRSession, refSpace: XRReferenceSpace): void;
    /**
     * Process XR frame for plane updates
     */
    processFrame(frame: XRFrame): void;
    /**
     * Get plane orientation from XRPlane
     */
    private getPlaneOrientation;
    /**
     * Calculate plane normal from pose
     */
    private calculateNormal;
    /**
     * Calculate plane dimensions
     */
    private calculatePlaneDimensions;
    /**
     * Check if plane has changed significantly
     */
    private hasPlaneChanged;
    /**
     * Get all detected planes
     */
    getPlanes(): ARPlane[];
    /**
     * Get horizontal planes
     */
    getHorizontalPlanes(): ARPlane[];
    /**
     * Get vertical planes
     */
    getVerticalPlanes(): ARPlane[];
    /**
     * Get plane by ID
     */
    getPlane(id: string): ARPlane | undefined;
    /**
     * Get the largest plane
     */
    getLargestPlane(): ARPlane | null;
    /**
     * Get planes at a point
     */
    getPlanesAtPoint(point: Float32Array, tolerance?: number): ARPlane[];
    /**
     * Find the nearest plane to a point
     */
    getNearestPlane(point: Float32Array): ARPlane | null;
    /**
     * Update reactive signals
     */
    private updateSignals;
    /**
     * Add event handler
     */
    on(type: PlaneEventType, handler: PlaneEventHandler): void;
    /**
     * Remove event handler
     */
    off(type: PlaneEventType, handler: PlaneEventHandler): void;
    /**
     * Emit event
     */
    private emitEvent;
    /**
     * Clear all planes
     */
    clear(): void;
    /**
     * Dispose the plane detector
     */
    dispose(): void;
}
/**
 * Create a plane detector with default configuration
 */
export declare function createPlaneDetector(config?: PlaneDetectorConfig): PlaneDetector;
export {};
