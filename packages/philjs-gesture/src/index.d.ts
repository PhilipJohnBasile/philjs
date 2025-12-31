/**
 * @philjs/gesture - Camera-Based Gesture Recognition
 *
 * Industry-first framework-native gesture recognition:
 * - MediaPipe/TensorFlow.js hand tracking
 * - Custom gesture definition and training
 * - Real-time pose estimation
 * - Multi-hand gesture support
 * - Gesture sequence recognition
 * - Air gesture controls for touchless UI
 */
export interface Point2D {
    x: number;
    y: number;
}
export interface Point3D extends Point2D {
    z: number;
}
export interface HandLandmark {
    index: number;
    name: HandLandmarkName;
    position: Point3D;
    visibility: number;
}
export type HandLandmarkName = 'wrist' | 'thumb_cmc' | 'thumb_mcp' | 'thumb_ip' | 'thumb_tip' | 'index_mcp' | 'index_pip' | 'index_dip' | 'index_tip' | 'middle_mcp' | 'middle_pip' | 'middle_dip' | 'middle_tip' | 'ring_mcp' | 'ring_pip' | 'ring_dip' | 'ring_tip' | 'pinky_mcp' | 'pinky_pip' | 'pinky_dip' | 'pinky_tip';
export interface Hand {
    id: string;
    handedness: 'left' | 'right';
    landmarks: HandLandmark[];
    boundingBox: BoundingBox;
    confidence: number;
}
export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface GestureDefinition {
    name: string;
    fingerStates: FingerState[];
    palmOrientation?: PalmOrientation;
    motion?: MotionPattern;
    holdDuration?: number;
}
export interface FingerState {
    finger: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
    extended: boolean;
    curled?: boolean;
    touching?: 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
}
export type PalmOrientation = 'up' | 'down' | 'left' | 'right' | 'forward' | 'backward';
export interface MotionPattern {
    type: 'swipe' | 'circle' | 'pinch' | 'spread' | 'rotate' | 'wave' | 'tap' | 'grab';
    direction?: 'up' | 'down' | 'left' | 'right' | 'clockwise' | 'counterclockwise';
    speed?: 'slow' | 'normal' | 'fast';
    minDistance?: number;
}
export interface RecognizedGesture {
    name: string;
    confidence: number;
    hand: Hand;
    timestamp: number;
    duration?: number;
}
export interface GestureSequence {
    name: string;
    gestures: string[];
    maxInterval: number;
}
export interface GestureConfig {
    modelPath?: string;
    maxHands?: number;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
    smoothing?: boolean;
    smoothingFactor?: number;
}
export type GestureCallback = (gesture: RecognizedGesture) => void;
export type HandCallback = (hands: Hand[]) => void;
export declare class HandTracker {
    private videoElement;
    private stream;
    private isRunning;
    private config;
    private onHandsDetected;
    private animationFrame;
    private previousLandmarks;
    constructor(config?: GestureConfig);
    initialize(videoElement?: HTMLVideoElement): Promise<void>;
    onHands(callback: HandCallback): void;
    start(): void;
    private detect;
    private simulateHandDetection;
    private smoothLandmarks;
    stop(): void;
    dispose(): void;
}
export declare class GestureRecognizer {
    private gestures;
    private sequences;
    private gestureCallbacks;
    private recentGestures;
    private holdTimers;
    constructor();
    private registerBuiltInGestures;
    registerGesture(gesture: GestureDefinition): void;
    registerSequence(sequence: GestureSequence): void;
    onGesture(name: string, callback: GestureCallback): () => void;
    recognize(hands: Hand[]): RecognizedGesture[];
    private matchGesture;
    private isFingerExtended;
    private areFingersouching;
    private distance;
    private matchSequence;
    private emitGesture;
}
export declare class MotionAnalyzer {
    private positionHistory;
    private readonly historyLength;
    addPosition(handId: string, position: Point3D): void;
    detectSwipe(handId: string): MotionPattern | null;
    detectCircle(handId: string): MotionPattern | null;
    detectPinch(thumb: Point3D, index: Point3D, prevThumb: Point3D, prevIndex: Point3D): MotionPattern | null;
    private distance2D;
    getVelocity(handId: string): Point3D;
    clear(handId: string): void;
}
export declare class AirCursor {
    private element;
    private position;
    private isVisible;
    private onClickCallback;
    private lastPinchState;
    constructor();
    private createCursorElement;
    update(hand: Hand): void;
    private simulateClick;
    onClick(callback: () => void): void;
    show(): void;
    hide(): void;
    getPosition(): Point2D;
    dispose(): void;
}
export declare class GestureController {
    private handTracker;
    private gestureRecognizer;
    private motionAnalyzer;
    private airCursor;
    private config;
    constructor(config?: GestureConfig);
    initialize(videoElement?: HTMLVideoElement): Promise<void>;
    start(): void;
    stop(): void;
    enableAirCursor(): void;
    disableAirCursor(): void;
    onGesture(name: string, callback: GestureCallback): () => void;
    registerGesture(gesture: GestureDefinition): void;
    registerSequence(sequence: GestureSequence): void;
    dispose(): void;
}
export declare function useGestureController(config?: GestureConfig): {
    controller: GestureController | null;
    isInitialized: boolean;
    start: () => void | undefined;
    stop: () => void | undefined;
};
export declare function useGesture(controller: GestureController | null, gestureName: string, callback: GestureCallback): void;
export declare function useAirCursor(controller: GestureController | null, enabled?: boolean): void;
export declare function useHandTracking(config?: GestureConfig): {
    hands: Hand[];
    isTracking: boolean;
    start: () => void;
    stop: () => void;
};
export declare const GesturePresets: {
    navigation: {
        gestures: {
            name: string;
            gesture: string;
        }[];
    };
    media: {
        gestures: {
            name: string;
            gesture: string;
        }[];
    };
    presentation: {
        gestures: {
            name: string;
            gesture: string;
        }[];
    };
    gaming: {
        gestures: {
            name: string;
            gesture: string;
        }[];
    };
};
declare const _default: {
    HandTracker: typeof HandTracker;
    GestureRecognizer: typeof GestureRecognizer;
    MotionAnalyzer: typeof MotionAnalyzer;
    AirCursor: typeof AirCursor;
    GestureController: typeof GestureController;
    GesturePresets: {
        navigation: {
            gestures: {
                name: string;
                gesture: string;
            }[];
        };
        media: {
            gestures: {
                name: string;
                gesture: string;
            }[];
        };
        presentation: {
            gestures: {
                name: string;
                gesture: string;
            }[];
        };
        gaming: {
            gestures: {
                name: string;
                gesture: string;
            }[];
        };
    };
    useGestureController: typeof useGestureController;
    useGesture: typeof useGesture;
    useAirCursor: typeof useAirCursor;
    useHandTracking: typeof useHandTracking;
};
export default _default;
//# sourceMappingURL=index.d.ts.map