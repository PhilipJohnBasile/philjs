/**
 * PhilJS Native - Gesture System
 *
 * Provides gesture recognition for swipe, pinch, pan, and long press.
 * Works on both touch and pointer devices.
 */
/**
 * Point in 2D space
 */
export interface Point {
    x: number;
    y: number;
}
/**
 * Velocity in 2D space
 */
export interface Velocity {
    vx: number;
    vy: number;
}
/**
 * Gesture state
 */
export type GestureState = 'idle' | 'began' | 'changed' | 'ended' | 'cancelled';
/**
 * Swipe direction
 */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';
/**
 * Base gesture event
 */
export interface BaseGestureEvent {
    /** Gesture state */
    state: GestureState;
    /** Touch/pointer count */
    pointerCount: number;
    /** Timestamp */
    timestamp: number;
    /** Native event */
    nativeEvent: TouchEvent | PointerEvent | MouseEvent;
}
/**
 * Pan gesture event
 */
export interface PanGestureEvent extends BaseGestureEvent {
    /** Current position */
    position: Point;
    /** Translation from start */
    translation: Point;
    /** Velocity */
    velocity: Velocity;
    /** Absolute translation distance */
    absoluteTranslation: number;
}
/**
 * Pinch gesture event
 */
export interface PinchGestureEvent extends BaseGestureEvent {
    /** Scale factor */
    scale: number;
    /** Focal point (center between fingers) */
    focalPoint: Point;
    /** Velocity of scale change */
    velocity: number;
}
/**
 * Rotation gesture event
 */
export interface RotationGestureEvent extends BaseGestureEvent {
    /** Rotation in radians */
    rotation: number;
    /** Velocity of rotation */
    velocity: number;
    /** Anchor point */
    anchorPoint: Point;
}
/**
 * Swipe gesture event
 */
export interface SwipeGestureEvent extends BaseGestureEvent {
    /** Swipe direction */
    direction: SwipeDirection;
    /** Velocity */
    velocity: Velocity;
    /** Distance traveled */
    distance: number;
}
/**
 * Long press gesture event
 */
export interface LongPressGestureEvent extends BaseGestureEvent {
    /** Press position */
    position: Point;
    /** Duration of press in ms */
    duration: number;
}
/**
 * Tap gesture event
 */
export interface TapGestureEvent extends BaseGestureEvent {
    /** Tap position */
    position: Point;
    /** Number of taps */
    tapCount: number;
}
/**
 * Gesture recognizer config
 */
export interface GestureConfig {
    /** Enabled state */
    enabled?: boolean;
    /** Minimum pointers required */
    minPointers?: number;
    /** Maximum pointers allowed */
    maxPointers?: number;
}
/**
 * Pan gesture config
 */
export interface PanGestureConfig extends GestureConfig {
    /** Minimum distance to activate (px) */
    minDistance?: number;
    /** Direction lock */
    lockDirection?: 'horizontal' | 'vertical' | 'none';
    /** Active offset X */
    activeOffsetX?: number | [number, number];
    /** Active offset Y */
    activeOffsetY?: number | [number, number];
    /** Fail offset X */
    failOffsetX?: number | [number, number];
    /** Fail offset Y */
    failOffsetY?: number | [number, number];
}
/**
 * Pinch gesture config
 */
export interface PinchGestureConfig extends GestureConfig {
    /** Minimum scale change to activate */
    minScale?: number;
}
/**
 * Swipe gesture config
 */
export interface SwipeGestureConfig extends GestureConfig {
    /** Direction(s) to recognize */
    direction?: SwipeDirection | SwipeDirection[];
    /** Minimum velocity (px/ms) */
    minVelocity?: number;
    /** Minimum distance (px) */
    minDistance?: number;
    /** Maximum duration (ms) */
    maxDuration?: number;
}
/**
 * Long press gesture config
 */
export interface LongPressGestureConfig extends GestureConfig {
    /** Duration to trigger (ms) */
    minDuration?: number;
    /** Maximum movement allowed (px) */
    maxDistance?: number;
}
/**
 * Tap gesture config
 */
export interface TapGestureConfig extends GestureConfig {
    /** Number of taps required */
    numberOfTaps?: number;
    /** Number of fingers required */
    numberOfTouches?: number;
    /** Max duration for each tap (ms) */
    maxDuration?: number;
    /** Max delay between taps (ms) */
    maxDelay?: number;
    /** Max distance between taps (px) */
    maxDistance?: number;
}
/**
 * Calculate distance between two points
 */
export declare function getDistance(p1: Point, p2: Point): number;
/**
 * Calculate angle between two points (radians)
 */
export declare function getAngle(p1: Point, p2: Point): number;
/**
 * Calculate center point between multiple points
 */
export declare function getCenter(points: Point[]): Point;
/**
 * Calculate velocity from two points and time delta
 */
export declare function getVelocity(p1: Point, p2: Point, dt: number): Velocity;
/**
 * Create a pan gesture recognizer
 */
export declare function createPanGesture(element: HTMLElement, handler: (event: PanGestureEvent) => void, config?: PanGestureConfig): () => void;
/**
 * Create a pinch gesture recognizer
 */
export declare function createPinchGesture(element: HTMLElement, handler: (event: PinchGestureEvent) => void, config?: PinchGestureConfig): () => void;
/**
 * Create a rotation gesture recognizer
 */
export declare function createRotationGesture(element: HTMLElement, handler: (event: RotationGestureEvent) => void, config?: GestureConfig): () => void;
/**
 * Create a swipe gesture recognizer
 */
export declare function createSwipeGesture(element: HTMLElement, handler: (event: SwipeGestureEvent) => void, config?: SwipeGestureConfig): () => void;
/**
 * Create a long press gesture recognizer
 */
export declare function createLongPressGesture(element: HTMLElement, handler: (event: LongPressGestureEvent) => void, config?: LongPressGestureConfig): () => void;
/**
 * Create a tap gesture recognizer
 */
export declare function createTapGesture(element: HTMLElement, handler: (event: TapGestureEvent) => void, config?: TapGestureConfig): () => void;
/**
 * Gesture handler options
 */
export interface GestureHandlerOptions {
    onPan?: (event: PanGestureEvent) => void;
    onPinch?: (event: PinchGestureEvent) => void;
    onRotation?: (event: RotationGestureEvent) => void;
    onSwipe?: (event: SwipeGestureEvent) => void;
    onLongPress?: (event: LongPressGestureEvent) => void;
    onTap?: (event: TapGestureEvent) => void;
    panConfig?: PanGestureConfig | undefined;
    pinchConfig?: PinchGestureConfig | undefined;
    rotationConfig?: GestureConfig | undefined;
    swipeConfig?: SwipeGestureConfig | undefined;
    longPressConfig?: LongPressGestureConfig | undefined;
    tapConfig?: TapGestureConfig | undefined;
}
/**
 * Create a combined gesture handler
 */
export declare function createGestureHandler(element: HTMLElement, options: GestureHandlerOptions): () => void;
/**
 * Hook-style gesture handler
 */
export declare function useGestures(elementRef: {
    current: HTMLElement | null;
}, options: GestureHandlerOptions): void;
/**
 * Use pan gesture
 */
export declare function usePanGesture(elementRef: {
    current: HTMLElement | null;
}, handler: (event: PanGestureEvent) => void, config?: PanGestureConfig): void;
/**
 * Use pinch gesture
 */
export declare function usePinchGesture(elementRef: {
    current: HTMLElement | null;
}, handler: (event: PinchGestureEvent) => void, config?: PinchGestureConfig): void;
/**
 * Use swipe gesture
 */
export declare function useSwipeGesture(elementRef: {
    current: HTMLElement | null;
}, handler: (event: SwipeGestureEvent) => void, config?: SwipeGestureConfig): void;
/**
 * Use long press gesture
 */
export declare function useLongPressGesture(elementRef: {
    current: HTMLElement | null;
}, handler: (event: LongPressGestureEvent) => void, config?: LongPressGestureConfig): void;
/**
 * Use tap gesture
 */
export declare function useTapGesture(elementRef: {
    current: HTMLElement | null;
}, handler: (event: TapGestureEvent) => void, config?: TapGestureConfig): void;
declare const _default: {
    createPanGesture: typeof createPanGesture;
    createPinchGesture: typeof createPinchGesture;
    createRotationGesture: typeof createRotationGesture;
    createSwipeGesture: typeof createSwipeGesture;
    createLongPressGesture: typeof createLongPressGesture;
    createTapGesture: typeof createTapGesture;
    createGestureHandler: typeof createGestureHandler;
    useGestures: typeof useGestures;
    usePanGesture: typeof usePanGesture;
    usePinchGesture: typeof usePinchGesture;
    useSwipeGesture: typeof useSwipeGesture;
    useLongPressGesture: typeof useLongPressGesture;
    useTapGesture: typeof useTapGesture;
    getDistance: typeof getDistance;
    getAngle: typeof getAngle;
    getCenter: typeof getCenter;
    getVelocity: typeof getVelocity;
};
export default _default;
//# sourceMappingURL=index.d.ts.map