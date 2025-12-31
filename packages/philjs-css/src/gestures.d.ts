/**
 * Gesture System for PhilJS CSS
 *
 * Touch and pointer gesture handling:
 * - Swipe detection (4 directions)
 * - Pinch/zoom gestures
 * - Pan/drag gestures
 * - Long press detection
 * - Tap/double-tap
 * - Rotation gestures
 * - Gesture-driven animations
 */
export interface Point {
    x: number;
    y: number;
}
export interface GestureState {
    startPoint: Point;
    currentPoint: Point;
    previousPoint: Point;
    velocity: Point;
    distance: Point;
    direction: Direction | null;
    scale: number;
    rotation: number;
    startTime: number;
    duration: number;
    isActive: boolean;
    pointerCount: number;
}
export type Direction = 'up' | 'down' | 'left' | 'right';
export type GestureType = 'tap' | 'doubletap' | 'longpress' | 'swipe' | 'pan' | 'pinch' | 'rotate' | 'drag';
export interface GestureEvent {
    type: GestureType;
    state: GestureState;
    target: Element;
    originalEvent: PointerEvent | TouchEvent;
    preventDefault: () => void;
    stopPropagation: () => void;
}
export interface SwipeEvent extends GestureEvent {
    type: 'swipe';
    direction: Direction;
    velocity: number;
}
export interface PinchEvent extends GestureEvent {
    type: 'pinch';
    scale: number;
    center: Point;
}
export interface RotateEvent extends GestureEvent {
    type: 'rotate';
    rotation: number;
    center: Point;
}
export interface PanEvent extends GestureEvent {
    type: 'pan';
    delta: Point;
    offset: Point;
}
export interface GestureConfig {
    swipe?: SwipeConfig;
    pinch?: PinchConfig;
    pan?: PanConfig;
    tap?: TapConfig;
    longPress?: LongPressConfig;
    rotate?: RotateConfig;
}
export interface SwipeConfig {
    threshold?: number;
    velocity?: number;
    direction?: Direction | Direction[] | 'all';
}
export interface PinchConfig {
    threshold?: number;
    minScale?: number;
    maxScale?: number;
}
export interface PanConfig {
    threshold?: number;
    lockDirection?: boolean;
    bounds?: {
        left?: number;
        right?: number;
        top?: number;
        bottom?: number;
    };
}
export interface TapConfig {
    maxDuration?: number;
    maxDistance?: number;
    doubleTapDelay?: number;
}
export interface LongPressConfig {
    duration?: number;
    maxDistance?: number;
}
export interface RotateConfig {
    threshold?: number;
}
export type GestureHandler<T extends GestureEvent = GestureEvent> = (event: T) => void;
export interface GestureHandlers {
    onTap?: GestureHandler;
    onDoubleTap?: GestureHandler;
    onLongPress?: GestureHandler;
    onSwipe?: GestureHandler<SwipeEvent>;
    onSwipeUp?: GestureHandler<SwipeEvent>;
    onSwipeDown?: GestureHandler<SwipeEvent>;
    onSwipeLeft?: GestureHandler<SwipeEvent>;
    onSwipeRight?: GestureHandler<SwipeEvent>;
    onPan?: GestureHandler<PanEvent>;
    onPanStart?: GestureHandler<PanEvent>;
    onPanEnd?: GestureHandler<PanEvent>;
    onPinch?: GestureHandler<PinchEvent>;
    onPinchStart?: GestureHandler<PinchEvent>;
    onPinchEnd?: GestureHandler<PinchEvent>;
    onRotate?: GestureHandler<RotateEvent>;
    onRotateStart?: GestureHandler<RotateEvent>;
    onRotateEnd?: GestureHandler<RotateEvent>;
    onDragStart?: GestureHandler;
    onDrag?: GestureHandler;
    onDragEnd?: GestureHandler;
}
/**
 * Attach gesture handlers to an element
 */
export declare function attachGestures(element: Element, handlers: GestureHandlers, config?: GestureConfig): () => void;
/**
 * Generate CSS for swipeable elements
 */
export declare function swipeableStyles(options?: {
    direction?: 'horizontal' | 'vertical' | 'both';
    threshold?: string;
    resistance?: number;
}): string;
/**
 * Generate CSS for draggable elements
 */
export declare function draggableStyles(options?: {
    cursor?: 'grab' | 'move' | 'pointer';
    activeScale?: number;
}): string;
/**
 * Generate CSS for pinch-zoomable elements
 */
export declare function zoomableStyles(options?: {
    minScale?: number;
    maxScale?: number;
    origin?: string;
}): string;
/**
 * CSS for pull-to-refresh container
 */
export declare function pullToRefreshStyles(options?: {
    threshold?: string;
    indicatorSize?: string;
}): string;
/**
 * Create a gesture-driven animation binding
 */
export declare function createGestureAnimation(options: {
    element: Element;
    gesture: 'pan' | 'swipe' | 'pinch';
    property: string;
    range: [number, number];
    unit?: string;
    easing?: (t: number) => number;
}): () => void;
/**
 * Create swipe-to-dismiss behavior
 */
export declare function swipeToDismiss(element: Element, options: {
    direction?: Direction | Direction[];
    threshold?: number;
    onDismiss: (direction: Direction) => void;
}): () => void;
/**
 * Create pull-to-refresh behavior
 */
export declare function pullToRefresh(element: Element, options: {
    threshold?: number;
    resistance?: number;
    onRefresh: () => Promise<void>;
}): () => void;
/**
 * Create carousel/slider behavior
 */
export declare function createCarousel(container: Element, options: {
    itemSelector: string;
    infinite?: boolean;
    autoplay?: number;
    onChange?: (index: number) => void;
}): {
    cleanup: () => void;
    goTo: (index: number) => void;
    next: () => void;
    prev: () => void;
    getCurrentIndex: () => number;
};
/**
 * Common gesture configurations
 */
export declare const gesturePresets: {
    readonly standard: {
        readonly swipe: {
            readonly threshold: 50;
            readonly velocity: 0.3;
        };
        readonly tap: {
            readonly maxDuration: 300;
            readonly maxDistance: 10;
        };
        readonly longPress: {
            readonly duration: 500;
        };
    };
    readonly sensitive: {
        readonly swipe: {
            readonly threshold: 30;
            readonly velocity: 0.2;
        };
        readonly tap: {
            readonly maxDuration: 400;
            readonly maxDistance: 15;
        };
        readonly longPress: {
            readonly duration: 400;
        };
    };
    readonly strict: {
        readonly swipe: {
            readonly threshold: 80;
            readonly velocity: 0.5;
        };
        readonly tap: {
            readonly maxDuration: 200;
            readonly maxDistance: 5;
        };
        readonly longPress: {
            readonly duration: 700;
        };
    };
};
/**
 * Direction vectors for calculations
 */
export declare const directionVectors: Record<Direction, Point>;
//# sourceMappingURL=gestures.d.ts.map