/**
 * @philjs/ar - AR Hooks
 *
 * PhilJS hooks for AR integration with reactive signals.
 */
import { type Signal, type Memo } from '@philjs/core';
type Computed<T> = Memo<T>;
import { Hologram, type ARConfig, type HitTestResult, type PlacedObject, type LightEstimate } from './hologram.js';
import { type ARAnchorp, type AnchorManagerConfig } from './anchors.js';
import { type ARPlane, type PlaneDetectorConfig } from './planes.js';
import { type GestureRecognizerConfig, type GestureState } from './gestures.js';
export interface UseAROptions extends ARConfig {
    planeDetection?: PlaneDetectorConfig | boolean;
    anchors?: AnchorManagerConfig | boolean;
    gestures?: GestureRecognizerConfig | boolean;
    onSessionStart?: () => void;
    onSessionEnd?: () => void;
    onError?: (error: Error) => void;
}
export interface UseARResult {
    supported: Signal<boolean>;
    active: Signal<boolean>;
    error: Signal<Error | null>;
    start: () => Promise<void>;
    end: () => Promise<void>;
    hitResult: Signal<HitTestResult | null>;
    performHitTest: (x: number, y: number) => Promise<HitTestResult | null>;
    placedObjects: Signal<PlacedObject[]>;
    placeObject: (options?: {
        model?: string;
        scale?: [number, number, number];
        userData?: Record<string, unknown>;
    }) => PlacedObject | null;
    placeObjectAt: (position: Float32Array, orientation: Float32Array, options?: {
        model?: string;
        scale?: [number, number, number];
        userData?: Record<string, unknown>;
    }) => PlacedObject;
    removeObject: (id: string) => boolean;
    lightEstimate: Signal<LightEstimate | null>;
    planes: Signal<ARPlane[]> | null;
    horizontalPlanes: Signal<ARPlane[]> | null;
    verticalPlanes: Signal<ARPlane[]> | null;
    largestPlane: Signal<ARPlane | null> | null;
    anchors: Signal<ARAnchorp[]> | null;
    createAnchor: ((pose: {
        position: Float32Array;
        orientation: Float32Array;
        matrix: Float32Array;
    }) => Promise<ARAnchorp | null>) | null;
    deleteAnchor: ((id: string) => boolean) | null;
    gestureState: Signal<GestureState> | null;
    hologram: Hologram | null;
    glContext: WebGLRenderingContext | null;
    session: XRSession | null;
    referenceSpace: XRReferenceSpace | null;
}
/**
 * Main AR hook for PhilJS
 */
export declare function useAR(options: UseAROptions): UseARResult;
/**
 * Hook for AR hit testing
 */
export declare function useHitTest(): {
    result: Signal<HitTestResult | null>;
    isHitting: Computed<boolean>;
};
/**
 * Hook for AR light estimation
 */
export declare function useLightEstimate(): {
    estimate: Signal<LightEstimate | null>;
    ambientIntensity: Computed<number>;
    primaryDirection: Computed<{
        x: number;
        y: number;
        z: number;
    } | null>;
};
/**
 * Hook for AR gestures
 */
export declare function useARGestures(element: HTMLElement | null, config?: GestureRecognizerConfig): {
    state: Signal<GestureState>;
    dispose: () => void;
};
/**
 * Hook for object placement
 */
export declare function usePlacedObjects(): {
    objects: Signal<PlacedObject[]>;
    add: (object: PlacedObject) => void;
    remove: (id: string) => void;
    clear: () => void;
    getById: (id: string) => PlacedObject | undefined;
};
export {};
