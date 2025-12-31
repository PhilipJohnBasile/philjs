/**
 * @philjs/xr - WebXR Components for VR/AR/MR Experiences
 *
 * Build immersive experiences with:
 * - VR/AR/MR headset support
 * - Hand tracking and gestures
 * - Spatial UI components
 * - 3D reactive primitives
 * - XR-optimized rendering
 * - Cross-platform XR compatibility
 *
 * NO OTHER FRAMEWORK HAS THIS.
 */
export type XRSessionMode = 'inline' | 'immersive-vr' | 'immersive-ar';
export type XRReferenceSpaceType = 'viewer' | 'local' | 'local-floor' | 'bounded-floor' | 'unbounded';
export interface XRConfig {
    /** Preferred session mode */
    mode?: XRSessionMode;
    /** Reference space type */
    referenceSpace?: XRReferenceSpaceType;
    /** Required features */
    requiredFeatures?: string[];
    /** Optional features */
    optionalFeatures?: string[];
    /** Enable hand tracking */
    handTracking?: boolean;
    /** Enable hit testing (AR) */
    hitTest?: boolean;
    /** Enable anchors (AR) */
    anchors?: boolean;
    /** Frame rate target */
    frameRate?: number;
}
export interface XRSessionState {
    isSupported: boolean;
    isActive: boolean;
    mode: XRSessionMode | null;
    session: XRSession | null;
    referenceSpace: XRReferenceSpace | null;
}
export interface XRControllerState {
    connected: boolean;
    handedness: 'left' | 'right' | 'none';
    position: Vector3;
    rotation: Quaternion;
    buttons: XRButtonState[];
    axes: number[];
    hapticActuators: GamepadHapticActuator[];
}
export interface XRButtonState {
    pressed: boolean;
    touched: boolean;
    value: number;
}
export interface XRHandState {
    connected: boolean;
    handedness: 'left' | 'right';
    joints: Map<XRHandJoint, XRJointState>;
    pinchStrength: number;
    gripStrength: number;
}
export interface XRJointState {
    position: Vector3;
    rotation: Quaternion;
    radius: number;
}
export type XRHandJoint = 'wrist' | 'thumb-metacarpal' | 'thumb-phalanx-proximal' | 'thumb-phalanx-distal' | 'thumb-tip' | 'index-finger-metacarpal' | 'index-finger-phalanx-proximal' | 'index-finger-phalanx-intermediate' | 'index-finger-phalanx-distal' | 'index-finger-tip' | 'middle-finger-metacarpal' | 'middle-finger-phalanx-proximal' | 'middle-finger-phalanx-intermediate' | 'middle-finger-phalanx-distal' | 'middle-finger-tip' | 'ring-finger-metacarpal' | 'ring-finger-phalanx-proximal' | 'ring-finger-phalanx-intermediate' | 'ring-finger-phalanx-distal' | 'ring-finger-tip' | 'pinky-finger-metacarpal' | 'pinky-finger-phalanx-proximal' | 'pinky-finger-phalanx-intermediate' | 'pinky-finger-phalanx-distal' | 'pinky-finger-tip';
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}
export interface Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;
}
export interface XRHitTestResultData {
    position: Vector3;
    rotation: Quaternion;
    plane?: {
        orientation: 'horizontal' | 'vertical';
        polygon: Vector3[];
    };
}
export interface XRAnchor {
    id: string;
    position: Vector3;
    rotation: Quaternion;
    isTracking: boolean;
}
export interface SpatialUIProps {
    position: Vector3;
    rotation?: Quaternion;
    scale?: Vector3;
    billboard?: boolean;
    followGaze?: boolean;
    interactionDistance?: number;
}
export declare const Vec3: {
    create(x?: number, y?: number, z?: number): Vector3;
    add(a: Vector3, b: Vector3): Vector3;
    sub(a: Vector3, b: Vector3): Vector3;
    scale(v: Vector3, s: number): Vector3;
    length(v: Vector3): number;
    normalize(v: Vector3): Vector3;
    dot(a: Vector3, b: Vector3): number;
    cross(a: Vector3, b: Vector3): Vector3;
    distance(a: Vector3, b: Vector3): number;
    lerp(a: Vector3, b: Vector3, t: number): Vector3;
    fromArray(arr: Float32Array | number[] | DOMPointReadOnly, offset?: number): Vector3;
    toArray(v: Vector3): number[];
};
export declare const Quat: {
    identity(): Quaternion;
    fromEuler(x: number, y: number, z: number): Quaternion;
    multiply(a: Quaternion, b: Quaternion): Quaternion;
    slerp(a: Quaternion, b: Quaternion, t: number): Quaternion;
    fromArray(arr: Float32Array | number[] | DOMPointReadOnly, offset?: number): Quaternion;
    toArray(q: Quaternion): number[];
};
export declare class XRSessionManager {
    private config;
    private session;
    private referenceSpace;
    private controllers;
    private hands;
    private hitTestSource;
    private anchors;
    private frameCallback;
    constructor(config?: XRConfig);
    isSupported(mode?: XRSessionMode): Promise<boolean>;
    startSession(): Promise<XRSession | null>;
    endSession(): Promise<void>;
    setFrameCallback(callback: (time: number, frame: XRFrame) => void): void;
    private handleFrame;
    private handleInputSourcesChange;
    private createControllerState;
    private createHandState;
    private updateInputSource;
    private updateHandState;
    getSession(): XRSession | null;
    getReferenceSpace(): XRReferenceSpace | null;
    getControllers(): Map<number, XRControllerState>;
    getController(index: number): XRControllerState | undefined;
    getHands(): Map<string, XRHandState>;
    getHand(handedness: 'left' | 'right'): XRHandState | undefined;
    performHitTest(frame: XRFrame): Promise<XRHitTestResultData[]>;
    createAnchor(position: Vector3, rotation: Quaternion): Promise<XRAnchor | null>;
    getAnchors(): Map<string, XRAnchor>;
    triggerHaptic(controllerIndex: number, intensity?: number, duration?: number): void;
}
export interface XRPanelProps extends SpatialUIProps {
    width: number;
    height: number;
    backgroundColor?: string;
    borderRadius?: number;
    children?: unknown;
}
export interface XRButtonProps extends SpatialUIProps {
    label: string;
    onClick?: () => void;
    onHover?: () => void;
    onHoverEnd?: () => void;
    hapticFeedback?: boolean;
}
export interface XRSliderProps extends SpatialUIProps {
    min: number;
    max: number;
    value: number;
    onChange?: (value: number) => void;
    orientation?: 'horizontal' | 'vertical';
}
export interface XRTextProps extends SpatialUIProps {
    text: string;
    fontSize?: number;
    color?: string;
    align?: 'left' | 'center' | 'right';
}
export interface XRModelProps extends SpatialUIProps {
    src: string;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    animations?: string[];
    currentAnimation?: string;
}
export declare function createXRPanel(props: XRPanelProps): object;
export declare function createXRButton(props: XRButtonProps): object;
export declare function createXRSlider(props: XRSliderProps): object;
export declare function createXRText(props: XRTextProps): object;
export declare function createXRModel(props: XRModelProps): object;
export type GestureType = 'pinch' | 'grab' | 'point' | 'thumbs-up' | 'peace' | 'fist' | 'open-palm';
export interface GestureEvent {
    gesture: GestureType;
    hand: 'left' | 'right';
    confidence: number;
    position: Vector3;
}
export declare class GestureRecognizer {
    private lastGestures;
    private gestureCallbacks;
    recognize(handState: XRHandState): GestureEvent | null;
    private detectGesture;
    private calculateConfidence;
    onGesture(gesture: GestureType, callback: (event: GestureEvent) => void): () => void;
}
export declare function initXR(config?: XRConfig): XRSessionManager;
export declare function getXRManager(): XRSessionManager | null;
export declare function useXR(): {
    isSupported: () => Promise<boolean>;
    startSession: () => Promise<XRSession | null>;
    endSession: () => Promise<void>;
    session: XRSession | null;
    referenceSpace: XRReferenceSpace | null;
};
export declare function useXRControllers(): Map<number, XRControllerState>;
export declare function useXRController(index: number): XRControllerState | null;
export declare function useXRHands(): Map<string, XRHandState>;
export declare function useXRHand(handedness: 'left' | 'right'): XRHandState | null;
export declare function useGesture(gesture: GestureType, callback: (event: GestureEvent) => void): void;
export declare function useXRFrame(callback: (time: number, frame: XRFrame) => void): void;
export declare function useHitTest(): (frame: XRFrame) => Promise<XRHitTestResultData[]>;
export declare function useAnchors(): {
    create: (position: Vector3, rotation: Quaternion) => Promise<XRAnchor | null>;
    getAll: () => Map<string, XRAnchor>;
};
//# sourceMappingURL=index.d.ts.map