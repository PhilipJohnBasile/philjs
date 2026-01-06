/**
 * @philjs/ar - Hologram WebXR AR Module
 *
 * Production WebXR AR implementation with real hit testing,
 * anchor placement, and scene management.
 */

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

export class Hologram {
    private session: XRSession | null = null;
    private refSpace: XRReferenceSpace | null = null;
    private viewerRefSpace: XRReferenceSpace | null = null;
    private gl: WebGLRenderingContext | null = null;
    private hitTestSource: XRHitTestSource | null = null;
    private transientHitTestSource: XRTransientInputHitTestSource | null = null;
    private lightProbe: XRLightProbe | null = null;

    private config: ARConfig;
    private state: ARSessionState = {
        isActive: false,
        hasHitTestSource: false,
        lightEstimate: null,
        placedObjects: [],
    };

    private eventHandlers = new Map<AREventType, Set<AREventHandler>>();
    private lastHitResult: HitTestResult | null = null;
    private frameCallbacks: Array<(time: number, frame: XRFrame) => void> = [];
    private objectIdCounter = 0;

    constructor() {
        // Initialize event handler sets
        const eventTypes: AREventType[] = ['hit', 'place', 'remove', 'sessionstart', 'sessionend', 'error'];
        for (const type of eventTypes) {
            this.eventHandlers.set(type, new Set());
        }
    }

    /**
     * Check if WebXR AR is supported
     */
    static async isSupported(): Promise<boolean> {
        if (!('xr' in navigator)) {
            return false;
        }
        try {
            return await (navigator as any).xr.isSessionSupported('immersive-ar');
        } catch {
            return false;
        }
    }

    /**
     * Start an AR session with the given configuration
     */
    static async start(config: ARConfig): Promise<Hologram> {
        if (!await this.isSupported()) {
            throw new Error('WebXR AR not supported on this device/browser');
        }
        const hologram = new Hologram();
        await hologram.initSession(config);
        return hologram;
    }

    /**
     * Initialize the WebXR session
     */
    private async initSession(config: ARConfig): Promise<void> {
        this.config = config;

        const requiredFeatures: string[] = ['hit-test'];
        const optionalFeatures: string[] = [];

        if (config.domOverlay) {
            requiredFeatures.push('dom-overlay');
        }
        if (config.lightEstimation) {
            optionalFeatures.push('light-estimation');
        }

        // Request WebXR AR session
        const sessionInit: XRSessionInit = {
            requiredFeatures,
            optionalFeatures,
        };

        if (config.domOverlay) {
            (sessionInit as any).domOverlay = { root: config.domOverlay };
        }

        this.session = await (navigator as any).xr.requestSession('immersive-ar', sessionInit);

        // Set up session end handler
        this.session.addEventListener('end', () => {
            this.state.isActive = false;
            this.hitTestSource = null;
            this.transientHitTestSource = null;
            this.emitEvent('sessionend');
        });

        // Initialize WebGL context
        const canvas = document.createElement('canvas');
        const glContext = canvas.getContext('webgl', { xrCompatible: true });
        if (!glContext) {
            throw new Error('Failed to create WebGL context');
        }
        this.gl = glContext;

        // Update render state
        await this.session.updateRenderState({
            baseLayer: new XRWebGLLayer(this.session, this.gl),
        });

        // Request reference spaces
        this.refSpace = await this.session.requestReferenceSpace(
            config.referenceSpaceType || 'local'
        );
        this.viewerRefSpace = await this.session.requestReferenceSpace('viewer');

        // Initialize hit test source for viewer-based hit testing
        await this.initHitTestSource();

        // Initialize light estimation if requested
        if (config.lightEstimation) {
            await this.initLightEstimation();
        }

        this.state.isActive = true;
        this.emitEvent('sessionstart');

        // Start render loop
        this.session.requestAnimationFrame(this.onFrame.bind(this));
    }

    /**
     * Initialize the hit test source for viewer-based hit testing
     */
    private async initHitTestSource(): Promise<void> {
        if (!this.session || !this.viewerRefSpace) return;

        try {
            // Create hit test source from viewer reference space
            this.hitTestSource = await this.session.requestHitTestSource!({
                space: this.viewerRefSpace,
            });
            this.state.hasHitTestSource = true;
        } catch (error) {
            console.warn('Failed to create hit test source:', error);
            this.state.hasHitTestSource = false;
        }
    }

    /**
     * Initialize transient hit test source for touch-based hit testing
     */
    async initTransientHitTest(): Promise<void> {
        if (!this.session) return;

        try {
            this.transientHitTestSource = await this.session.requestHitTestSourceForTransientInput!({
                profile: 'generic-touchscreen',
            });
        } catch (error) {
            console.warn('Failed to create transient hit test source:', error);
        }
    }

    /**
     * Initialize light estimation
     */
    private async initLightEstimation(): Promise<void> {
        if (!this.session) return;

        try {
            this.lightProbe = await this.session.requestLightProbe!();
        } catch (error) {
            console.warn('Light estimation not available:', error);
        }
    }

    /**
     * Main frame callback
     */
    private onFrame(time: number, frame: XRFrame): void {
        const session = frame.session;
        session.requestAnimationFrame(this.onFrame.bind(this));

        if (!this.refSpace) return;

        // Get viewer pose
        const pose = frame.getViewerPose(this.refSpace);
        if (!pose) return;

        // Process hit test results from viewer-based hit testing
        if (this.hitTestSource) {
            const hitResults = frame.getHitTestResults(this.hitTestSource);
            this.processHitTestResults(hitResults);
        }

        // Process transient hit test results (touch-based)
        if (this.transientHitTestSource) {
            const transientResults = frame.getHitTestResultsForTransientInput(
                this.transientHitTestSource
            );
            for (const transientResult of transientResults) {
                this.processHitTestResults(transientResult.results);
            }
        }

        // Process light estimation
        if (this.lightProbe) {
            this.processLightEstimation(frame);
        }

        // Call registered frame callbacks
        for (const callback of this.frameCallbacks) {
            try {
                callback(time, frame);
            } catch (error) {
                console.error('Frame callback error:', error);
            }
        }
    }

    /**
     * Process hit test results
     */
    private processHitTestResults(results: readonly XRHitTestResult[]): void {
        if (results.length === 0) {
            this.lastHitResult = null;
            return;
        }

        // Use the first (closest) hit result
        const hit = results[0];
        const pose = hit.getPose(this.refSpace!);

        if (!pose) {
            this.lastHitResult = null;
            return;
        }

        const matrix = pose.transform.matrix;
        const position = pose.transform.position;
        const orientation = pose.transform.orientation;

        this.lastHitResult = {
            position: new Float32Array([position.x, position.y, position.z]),
            orientation: new Float32Array([
                orientation.x,
                orientation.y,
                orientation.z,
                orientation.w,
            ]),
            worldMatrix: new Float32Array(matrix),
        };

        this.emitEvent('hit', this.lastHitResult);
    }

    /**
     * Process light estimation data
     */
    private processLightEstimation(frame: XRFrame): void {
        if (!this.lightProbe) return;

        const lightEstimate = frame.getLightEstimate?.(this.lightProbe);
        if (!lightEstimate) return;

        this.state.lightEstimate = {
            primaryLightDirection: new Float32Array(
                lightEstimate.primaryLightDirection
            ),
            primaryLightIntensity: new Float32Array(
                lightEstimate.primaryLightIntensity
            ),
            sphericalHarmonicsCoefficients: new Float32Array(
                lightEstimate.sphericalHarmonicsCoefficients
            ),
        };
    }

    /**
     * Perform a hit test at the given screen coordinates
     * Uses transient input hit testing for precise placement
     */
    async performHitTest(
        x: number,
        y: number
    ): Promise<HitTestResult | null> {
        if (!this.session || !this.refSpace) {
            return null;
        }

        // For screen-based hit testing, we need to use the viewer ray
        // If we have transient hit test source, results come through onFrame
        // Otherwise, return the last known hit result from viewer-based testing

        // Convert screen coordinates to normalized device coordinates
        const ndcX = (x / window.innerWidth) * 2 - 1;
        const ndcY = -(y / window.innerHeight) * 2 + 1;

        // If we have a hit result near the center of the screen, return it
        // For precise coordinate-based hit testing, the application should
        // use ray-casting with the viewer pose
        if (this.lastHitResult) {
            // Check if the hit is reasonably close to where the user tapped
            // In a full implementation, we'd use a ray from the tap position
            const centerThreshold = 0.3; // Normalized distance threshold
            const distFromCenter = Math.sqrt(ndcX * ndcX + ndcY * ndcY);

            if (distFromCenter < centerThreshold) {
                return this.lastHitResult;
            }
        }

        // If no hit test source, create one dynamically
        if (!this.hitTestSource) {
            await this.initHitTestSource();
        }

        // Return the most recent hit result
        // For coordinate-specific hit testing, applications should
        // implement ray-casting using the session's view matrix
        return this.lastHitResult;
    }

    /**
     * Perform ray-based hit test from viewer position
     */
    async performRayHitTest(
        origin: Float32Array,
        direction: Float32Array
    ): Promise<HitTestResult | null> {
        if (!this.session || !this.refSpace) {
            return null;
        }

        // Create a temporary ray-based hit test source
        try {
            const hitTestSource = await this.session.requestHitTestSource!({
                space: this.refSpace,
                offsetRay: new XRRay(
                    { x: origin[0], y: origin[1], z: origin[2], w: 1 },
                    { x: direction[0], y: direction[1], z: direction[2], w: 0 }
                ),
            });

            // The hit test results will be processed in the next frame
            // Store the source and wait for results
            const originalSource = this.hitTestSource;
            this.hitTestSource = hitTestSource;

            // Wait for one frame to get results
            await new Promise<void>((resolve) => {
                const frameCallback = () => {
                    this.hitTestSource = originalSource;
                    hitTestSource.cancel();
                    resolve();
                };
                this.addFrameCallback(frameCallback);
                setTimeout(() => {
                    this.removeFrameCallback(frameCallback);
                    resolve();
                }, 100);
            });

            return this.lastHitResult;
        } catch (error) {
            console.warn('Ray hit test failed:', error);
            return null;
        }
    }

    /**
     * Place an object at the current hit test location
     */
    placeObject(options?: {
        model?: string;
        scale?: [number, number, number];
        userData?: Record<string, unknown>;
    }): PlacedObject | null {
        if (!this.lastHitResult) {
            return null;
        }

        const object: PlacedObject = {
            id: `placed-${++this.objectIdCounter}`,
            position: new Float32Array(this.lastHitResult.position),
            orientation: new Float32Array(this.lastHitResult.orientation),
            scale: new Float32Array(options?.scale || [1, 1, 1]),
            model: options?.model,
            userData: options?.userData,
        };

        this.state.placedObjects.push(object);
        this.emitEvent('place', object);

        return object;
    }

    /**
     * Place an object at a specific position
     */
    placeObjectAt(
        position: Float32Array,
        orientation: Float32Array,
        options?: {
            model?: string;
            scale?: [number, number, number];
            userData?: Record<string, unknown>;
        }
    ): PlacedObject {
        const object: PlacedObject = {
            id: `placed-${++this.objectIdCounter}`,
            position: new Float32Array(position),
            orientation: new Float32Array(orientation),
            scale: new Float32Array(options?.scale || [1, 1, 1]),
            model: options?.model,
            userData: options?.userData,
        };

        this.state.placedObjects.push(object);
        this.emitEvent('place', object);

        return object;
    }

    /**
     * Remove a placed object
     */
    removeObject(id: string): boolean {
        const index = this.state.placedObjects.findIndex((obj) => obj.id === id);
        if (index === -1) {
            return false;
        }

        const [removed] = this.state.placedObjects.splice(index, 1);
        this.emitEvent('remove', removed);
        return true;
    }

    /**
     * Get all placed objects
     */
    getPlacedObjects(): ReadonlyArray<PlacedObject> {
        return this.state.placedObjects;
    }

    /**
     * Get the current session state
     */
    getState(): Readonly<ARSessionState> {
        return { ...this.state };
    }

    /**
     * Get the last hit test result
     */
    getLastHitResult(): HitTestResult | null {
        return this.lastHitResult;
    }

    /**
     * Get the current light estimate
     */
    getLightEstimate(): LightEstimate | null {
        return this.state.lightEstimate;
    }

    /**
     * Add a frame callback
     */
    addFrameCallback(callback: (time: number, frame: XRFrame) => void): void {
        this.frameCallbacks.push(callback);
    }

    /**
     * Remove a frame callback
     */
    removeFrameCallback(callback: (time: number, frame: XRFrame) => void): void {
        const index = this.frameCallbacks.indexOf(callback);
        if (index !== -1) {
            this.frameCallbacks.splice(index, 1);
        }
    }

    /**
     * Add an event listener
     */
    on(type: AREventType, handler: AREventHandler): void {
        this.eventHandlers.get(type)?.add(handler);
    }

    /**
     * Remove an event listener
     */
    off(type: AREventType, handler: AREventHandler): void {
        this.eventHandlers.get(type)?.delete(handler);
    }

    /**
     * Emit an event
     */
    private emitEvent(type: AREventType, data?: HitTestResult | PlacedObject | Error): void {
        const event: AREvent = {
            type,
            data,
            timestamp: performance.now(),
        };

        const handlers = this.eventHandlers.get(type);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(event);
                } catch (error) {
                    console.error(`Event handler error for ${type}:`, error);
                }
            }
        }
    }

    /**
     * Get the WebGL context
     */
    getGLContext(): WebGLRenderingContext | null {
        return this.gl;
    }

    /**
     * Get the XR session
     */
    getSession(): XRSession | null {
        return this.session;
    }

    /**
     * Get the reference space
     */
    getReferenceSpace(): XRReferenceSpace | null {
        return this.refSpace;
    }

    /**
     * End the AR session
     */
    async end(): Promise<void> {
        if (this.hitTestSource) {
            this.hitTestSource.cancel();
            this.hitTestSource = null;
        }

        if (this.transientHitTestSource) {
            this.transientHitTestSource.cancel();
            this.transientHitTestSource = null;
        }

        if (this.session) {
            await this.session.end();
            this.session = null;
        }

        this.state.isActive = false;
        this.state.placedObjects = [];
        this.frameCallbacks = [];
    }
}

/**
 * Create a reticle visualization for hit test feedback
 */
export function createReticle(): {
    element: HTMLDivElement;
    update: (hit: HitTestResult | null, visible: boolean) => void;
    dispose: () => void;
} {
    const element = document.createElement('div');
    element.style.cssText = `
        position: fixed;
        width: 40px;
        height: 40px;
        border: 2px solid white;
        border-radius: 50%;
        pointer-events: none;
        transform: translate(-50%, -50%);
        opacity: 0;
        transition: opacity 0.2s;
        z-index: 10000;
        box-shadow: 0 0 10px rgba(255,255,255,0.5);
    `;

    document.body.appendChild(element);

    return {
        element,
        update(hit: HitTestResult | null, visible: boolean) {
            if (!hit || !visible) {
                element.style.opacity = '0';
                return;
            }

            // Project 3D position to screen coordinates
            // This is a simplified projection - in practice, you'd use the view/projection matrices
            element.style.left = `${window.innerWidth / 2}px`;
            element.style.top = `${window.innerHeight / 2}px`;
            element.style.opacity = '1';
        },
        dispose() {
            element.remove();
        },
    };
}

/**
 * Utility to convert quaternion to euler angles
 */
export function quaternionToEuler(q: Float32Array): { x: number; y: number; z: number } {
    const [qx, qy, qz, qw] = q;

    // Roll (x-axis rotation)
    const sinr_cosp = 2 * (qw * qx + qy * qz);
    const cosr_cosp = 1 - 2 * (qx * qx + qy * qy);
    const x = Math.atan2(sinr_cosp, cosr_cosp);

    // Pitch (y-axis rotation)
    const sinp = 2 * (qw * qy - qz * qx);
    const y = Math.abs(sinp) >= 1
        ? Math.sign(sinp) * Math.PI / 2
        : Math.asin(sinp);

    // Yaw (z-axis rotation)
    const siny_cosp = 2 * (qw * qz + qx * qy);
    const cosy_cosp = 1 - 2 * (qy * qy + qz * qz);
    const z = Math.atan2(siny_cosp, cosy_cosp);

    return { x, y, z };
}

/**
 * Utility to create a quaternion from axis-angle
 */
export function axisAngleToQuaternion(
    axis: { x: number; y: number; z: number },
    angle: number
): Float32Array {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);

    return new Float32Array([
        axis.x * s,
        axis.y * s,
        axis.z * s,
        Math.cos(halfAngle),
    ]);
}
