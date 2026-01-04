/**
 * Built-in animation primitives with spring physics and FLIP.
 * Declarative animations without external libraries.
 */
export type AnimationOptions = {
    /** Duration in ms (for non-spring animations) */
    duration?: number;
    /** Easing function or spring config */
    easing?: EasingFunction | SpringConfig;
    /** Delay before animation starts */
    delay?: number;
    /** Number of iterations (Infinity for infinite) */
    iterations?: number;
    /** Animation direction */
    direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
    /** Fill mode */
    fill?: "none" | "forwards" | "backwards" | "both";
    /** Callback when animation completes */
    onComplete?: () => void;
    /** Callback for each frame */
    onUpdate?: (progress: number) => void;
};
export type SpringConfig = {
    /** Spring stiffness (0-1, default: 0.15) */
    stiffness?: number;
    /** Damping ratio (0-1, default: 0.8) */
    damping?: number;
    /** Mass of the object (default: 1) */
    mass?: number;
    /** Velocity threshold to consider animation complete */
    restVelocity?: number;
    /** Distance threshold to consider animation complete */
    restDistance?: number;
};
export type EasingFunction = (t: number) => number;
export type AnimatedValue = {
    /** Current value */
    value: number;
    /** Target value */
    target: number;
    /** Current velocity (for spring animations) */
    velocity: number;
    /** Is currently animating */
    isAnimating: boolean;
    /** Set new target value */
    set: (value: number, options?: AnimationOptions) => void;
    /** Stop animation immediately */
    stop: () => void;
    /** Subscribe to value changes */
    subscribe: (callback: (value: number) => void) => () => void;
};
/**
 * Easing functions library.
 */
export declare const easings: {
    linear: (t: number) => number;
    easeIn: (t: number) => number;
    easeOut: (t: number) => number;
    easeInOut: (t: number) => number;
    easeInCubic: (t: number) => number;
    easeOutCubic: (t: number) => number;
    easeInOutCubic: (t: number) => number;
    easeInQuart: (t: number) => number;
    easeOutQuart: (t: number) => number;
    easeInOutQuart: (t: number) => number;
    bounce: (t: number) => number;
};
/**
 * Create an animated value with spring physics.
 */
export declare function createAnimatedValue(initialValue: number, defaultOptions?: AnimationOptions): AnimatedValue;
/**
 * FLIP (First, Last, Invert, Play) animation helper.
 */
export declare class FLIPAnimator {
    private positions;
    /**
     * Record positions of elements before a layout change.
     */
    recordPositions(selector?: string): void;
    /**
     * Animate elements from recorded positions to new positions.
     */
    animateChanges(options?: AnimationOptions): void;
}
/**
 * Gesture handlers for touch and mouse interactions.
 */
export type GestureHandlers = {
    onDragStart?: (event: PointerEvent) => void;
    onDrag?: (event: PointerEvent, delta: {
        x: number;
        y: number;
    }) => void;
    onDragEnd?: (event: PointerEvent) => void;
    onPinchStart?: (event: TouchEvent) => void;
    onPinch?: (event: TouchEvent, scale: number) => void;
    onPinchEnd?: (event: TouchEvent) => void;
    onSwipe?: (direction: "up" | "down" | "left" | "right") => void;
    onTap?: () => void;
    onDoubleTap?: () => void;
    onLongPress?: () => void;
};
/**
 * Attach gesture handlers to an element.
 */
export declare function attachGestures(element: HTMLElement, handlers: GestureHandlers): () => void;
/**
 * Create a parallax effect based on scroll position.
 */
export declare function createParallax(element: HTMLElement, options?: {
    speed?: number;
    offset?: number;
    axis?: "x" | "y" | "both";
}): () => void;
//# sourceMappingURL=animation.d.ts.map