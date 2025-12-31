/**
 * Animated API
 *
 * Animation primitives for native mobile animations.
 */
import { type Signal } from 'philjs-core';
/**
 * Interpolation configuration
 */
export interface InterpolationConfig {
    inputRange: number[];
    outputRange: number[] | string[];
    extrapolate?: 'extend' | 'clamp' | 'identity';
    extrapolateLeft?: 'extend' | 'clamp' | 'identity';
    extrapolateRight?: 'extend' | 'clamp' | 'identity';
}
/**
 * Animation configuration
 */
export interface AnimationConfig {
    duration?: number;
    delay?: number;
    easing?: (t: number) => number;
    isInteraction?: boolean;
    useNativeDriver?: boolean;
}
/**
 * Spring configuration
 */
export interface SpringConfig {
    stiffness?: number;
    damping?: number;
    mass?: number;
    velocity?: number;
    overshootClamping?: boolean;
    restSpeedThreshold?: number;
    restDisplacementThreshold?: number;
    toValue?: number;
    useNativeDriver?: boolean;
}
/**
 * Decay configuration
 */
export interface DecayConfig {
    velocity: number;
    deceleration?: number;
    useNativeDriver?: boolean;
}
/**
 * Animation result
 */
export interface AnimationResult {
    finished: boolean;
}
/**
 * Composite animation
 */
export interface CompositeAnimation {
    start: (callback?: (result: AnimationResult) => void) => void;
    stop: () => void;
    reset: () => void;
}
/**
 * Easing functions
 */
export declare const Easing: {
    linear: (t: number) => number;
    quad: (t: number) => number;
    cubic: (t: number) => number;
    poly: (n: number) => (t: number) => number;
    sin: (t: number) => number;
    circle: (t: number) => number;
    exp: (t: number) => number;
    elastic: (bounciness?: number) => (t: number) => number;
    back: (s?: number) => (t: number) => number;
    bounce: (t: number) => number;
    bezier: (x1: number, y1: number, x2: number, y2: number) => (t: number) => number;
    in: (easing: (t: number) => number) => (t: number) => number;
    out: (easing: (t: number) => number) => (t: number) => number;
    inOut: (easing: (t: number) => number) => (t: number) => number;
};
/**
 * Animated value class
 */
export declare class AnimatedValue {
    private value;
    private offset;
    private listeners;
    private animationId;
    constructor(initialValue?: number);
    getValue(): number;
    setValue(value: number): void;
    setOffset(offset: number): void;
    flattenOffset(): void;
    extractOffset(): void;
    addListener(callback: (value: {
        value: number;
    }) => void): string;
    removeListener(id: string): void;
    removeAllListeners(): void;
    stopAnimation(callback?: (value: number) => void): void;
    resetAnimation(callback?: (value: number) => void): void;
    interpolate(config: InterpolationConfig): AnimatedInterpolation;
    private notifyListeners;
    _animate(toValue: number, duration: number, easing: (t: number) => number, callback?: (result: AnimationResult) => void): void;
    _getValue(): number;
    _getSignal(): Signal<number>;
}
/**
 * Animated 2D value class
 */
export declare class AnimatedValueXY {
    x: AnimatedValue;
    y: AnimatedValue;
    constructor(value?: {
        x?: number;
        y?: number;
    });
    setValue(value: {
        x: number;
        y: number;
    }): void;
    setOffset(offset: {
        x: number;
        y: number;
    }): void;
    flattenOffset(): void;
    extractOffset(): void;
    addListener(callback: (value: {
        x: number;
        y: number;
    }) => void): string;
    removeListener(id: string): void;
    removeAllListeners(): void;
    stopAnimation(callback?: (value: {
        x: number;
        y: number;
    }) => void): void;
    resetAnimation(callback?: (value: {
        x: number;
        y: number;
    }) => void): void;
    getLayout(): {
        left: AnimatedValue;
        top: AnimatedValue;
    };
    getTranslateTransform(): Array<{
        translateX: AnimatedValue;
    } | {
        translateY: AnimatedValue;
    }>;
}
/**
 * Animated interpolation class
 */
export declare class AnimatedInterpolation {
    private parent;
    private config;
    constructor(parent: AnimatedValue, config: InterpolationConfig);
    getValue(): number | string;
    private _interpolateValue;
    interpolate(config: InterpolationConfig): AnimatedInterpolation;
}
/**
 * Timing animation
 */
export declare function timing(value: AnimatedValue, config: AnimationConfig & {
    toValue: number;
}): CompositeAnimation;
/**
 * Spring animation
 */
export declare function spring(value: AnimatedValue, config: SpringConfig & {
    toValue: number;
}): CompositeAnimation;
/**
 * Decay animation
 */
export declare function decay(value: AnimatedValue, config: DecayConfig): CompositeAnimation;
/**
 * Run animations in sequence
 */
export declare function sequence(animations: CompositeAnimation[]): CompositeAnimation;
/**
 * Run animations in parallel
 */
export declare function parallel(animations: CompositeAnimation[], config?: {
    stopTogether?: boolean;
}): CompositeAnimation;
/**
 * Run animations with staggered start times
 */
export declare function stagger(delay: number, animations: CompositeAnimation[]): CompositeAnimation;
/**
 * Loop an animation
 */
export declare function loop(animation: CompositeAnimation, config?: {
    iterations?: number;
    resetBeforeIteration?: boolean;
}): CompositeAnimation;
/**
 * Add animated values
 */
export declare function add(a: AnimatedValue, b: AnimatedValue | number): AnimatedValue;
/**
 * Subtract animated values
 */
export declare function subtract(a: AnimatedValue, b: AnimatedValue | number): AnimatedValue;
/**
 * Multiply animated values
 */
export declare function multiply(a: AnimatedValue, b: AnimatedValue | number): AnimatedValue;
/**
 * Divide animated values
 */
export declare function divide(a: AnimatedValue, b: AnimatedValue | number): AnimatedValue;
/**
 * Modulo animated values
 */
export declare function modulo(a: AnimatedValue, modulus: number): AnimatedValue;
/**
 * Clamp between min and max
 */
export declare function diffClamp(a: AnimatedValue, min: number, max: number): AnimatedValue;
/**
 * Create an event handler for animated values
 */
export declare function event<T>(argMapping: Array<{
    nativeEvent: Record<string, AnimatedValue | undefined>;
} | null>, config?: {
    listener?: (event: T) => void;
    useNativeDriver?: boolean;
}): (event: T) => void;
/**
 * Create an animated component wrapper
 */
export declare function createAnimatedComponent<P extends Record<string, unknown>>(Component: (props: P) => unknown): (props: P) => unknown;
export declare const Animated: {
    Value: typeof AnimatedValue;
    ValueXY: typeof AnimatedValueXY;
    Interpolation: typeof AnimatedInterpolation;
    timing: typeof timing;
    spring: typeof spring;
    decay: typeof decay;
    sequence: typeof sequence;
    parallel: typeof parallel;
    stagger: typeof stagger;
    loop: typeof loop;
    add: typeof add;
    subtract: typeof subtract;
    multiply: typeof multiply;
    divide: typeof divide;
    modulo: typeof modulo;
    diffClamp: typeof diffClamp;
    event: typeof event;
    createAnimatedComponent: typeof createAnimatedComponent;
    Easing: {
        linear: (t: number) => number;
        quad: (t: number) => number;
        cubic: (t: number) => number;
        poly: (n: number) => (t: number) => number;
        sin: (t: number) => number;
        circle: (t: number) => number;
        exp: (t: number) => number;
        elastic: (bounciness?: number) => (t: number) => number;
        back: (s?: number) => (t: number) => number;
        bounce: (t: number) => number;
        bezier: (x1: number, y1: number, x2: number, y2: number) => (t: number) => number;
        in: (easing: (t: number) => number) => (t: number) => number;
        out: (easing: (t: number) => number) => (t: number) => number;
        inOut: (easing: (t: number) => number) => (t: number) => number;
    };
};
export default Animated;
//# sourceMappingURL=Animated.d.ts.map