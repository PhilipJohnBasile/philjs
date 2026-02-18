/**
 * @philjs/ar - Hologram WebXR AR Module
 *
 * Production WebXR AR implementation with real hit testing,
 * anchor placement, and scene management.
 */
declare global {
    interface XRLightProbe {
        probeSpace: XRSpace;
        onreflectionchange: ((this: XRLightProbe, ev: Event) => void) | null;
    }
    interface XRLightEstimate {
        sphericalHarmonicsCoefficients: Float32Array;
        primaryLightDirection: DOMPointReadOnly;
        primaryLightIntensity: DOMPointReadOnly;
    }
    interface XRSession {
        requestLightProbe?: (options?: {
            reflectionFormat?: string;
        }) => Promise<XRLightProbe>;
    }
    interface XRFrame {
        getLightEstimate?: (lightProbe: XRLightProbe) => XRLightEstimate | null;
    }
}
export interface ARConfig {
    near: number;
    far: number;
    referenceSpaceType?: 'local' | 'local-floor' | 'bounded-floor' | 'unbounded' | 'viewer';
    domOverlay?: HTMLElement;
    lightEstimation?: boolean;
}
export interface HitTestResult {
    position: Float32Array;
    orientation: Float32Array;
    worldMatrix: Float32Array;
}
export interface PlacedObject {
    id: string;
    position: Float32Array;
    orientation: Float32Array;
    scale: Float32Array;
    model?: string;
    userData?: Record<string, unknown>;
}
export interface ARSessionState {
    isActive: boolean;
    hasHitTestSource: boolean;
    lightEstimate: LightEstimate | null;
    placedObjects: PlacedObject[];
}
export interface LightEstimate {
    primaryLightDirection: Float32Array;
    primaryLightIntensity: Float32Array;
    sphericalHarmonicsCoefficients: Float32Array;
}
type AREventType = 'hit' | 'place' | 'remove' | 'sessionstart' | 'sessionend' | 'error';
type AREventHandler = (event: AREvent) => void;
export interface AREvent {
    type: AREventType;
    data?: HitTestResult | PlacedObject | Error;
    timestamp: number;
}
export declare class Hologram {
    private session;
    private refSpace;
    private viewerRefSpace;
    private gl;
    private hitTestSource;
    private transientHitTestSource;
    private lightProbe;
    private config;
    private state;
    private eventHandlers;
    private lastHitResult;
    private frameCallbacks;
    private objectIdCounter;
    constructor();
    /**
     * Check if WebXR AR is supported
     */
    static isSupported(): Promise<boolean>;
    /**
     * Start an AR session with the given configuration
     */
    static start(config: ARConfig): Promise<Hologram>;
    /**
     * Initialize the WebXR session
     */
    private initSession;
    /**
     * Initialize the hit test source for viewer-based hit testing
     */
    private initHitTestSource;
    /**
     * Initialize transient hit test source for touch-based hit testing
     */
    initTransientHitTest(): Promise<void>;
    /**
     * Initialize light estimation
     */
    private initLightEstimation;
    /**
     * Main frame callback
     */
    private onFrame;
    /**
     * Process hit test results
     */
    private processHitTestResults;
    /**
     * Process light estimation data
     */
    private processLightEstimation;
    /**
     * Perform a hit test at the given screen coordinates
     * Uses transient input hit testing for precise placement
     */
    performHitTest(x: number, y: number): Promise<HitTestResult | null>;
    /**
     * Perform ray-based hit test from viewer position
     */
    performRayHitTest(origin: Float32Array, direction: Float32Array): Promise<HitTestResult | null>;
    /**
     * Place an object at the current hit test location
     */
    placeObject(options?: {
        model?: string;
        scale?: [number, number, number];
        userData?: Record<string, unknown>;
    }): PlacedObject | null;
    /**
     * Place an object at a specific position
     */
    placeObjectAt(position: Float32Array, orientation: Float32Array, options?: {
        model?: string;
        scale?: [number, number, number];
        userData?: Record<string, unknown>;
    }): PlacedObject;
    /**
     * Remove a placed object
     */
    removeObject(id: string): boolean;
    /**
     * Get all placed objects
     */
    getPlacedObjects(): ReadonlyArray<PlacedObject>;
    /**
     * Get the current session state
     */
    getState(): Readonly<ARSessionState>;
    /**
     * Get the last hit test result
     */
    getLastHitResult(): HitTestResult | null;
    /**
     * Get the current light estimate
     */
    getLightEstimate(): LightEstimate | null;
    /**
     * Add a frame callback
     */
    addFrameCallback(callback: (time: number, frame: XRFrame) => void): void;
    /**
     * Remove a frame callback
     */
    removeFrameCallback(callback: (time: number, frame: XRFrame) => void): void;
    /**
     * Add an event listener
     */
    on(type: AREventType, handler: AREventHandler): void;
    /**
     * Remove an event listener
     */
    off(type: AREventType, handler: AREventHandler): void;
    /**
     * Emit an event
     */
    private emitEvent;
    /**
     * Get the WebGL context
     */
    getGLContext(): WebGLRenderingContext | null;
    /**
     * Get the XR session
     */
    getSession(): XRSession | null;
    /**
     * Get the reference space
     */
    getReferenceSpace(): XRReferenceSpace | null;
    /**
     * End the AR session
     */
    end(): Promise<void>;
}
/**
 * Create a reticle visualization for hit test feedback
 */
export declare function createReticle(): {
    element: HTMLDivElement;
    update: (hit: HitTestResult | null, visible: boolean) => void;
    dispose: () => void;
};
/**
 * Utility to convert quaternion to euler angles
 */
export declare function quaternionToEuler(q: Float32Array): {
    x: number;
    y: number;
    z: number;
};
/**
 * Utility to create a quaternion from axis-angle
 */
export declare function axisAngleToQuaternion(axis: {
    x: number;
    y: number;
    z: number;
}, angle: number): Float32Array;
export {};
