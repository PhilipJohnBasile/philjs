/**
 * PhilJS CSS Animation System
 *
 * Comprehensive animation utilities:
 * - Spring physics animations
 * - Keyframe generators
 * - Animation orchestration
 * - Motion presets
 * - Gesture-based animations
 * - FLIP technique
 * - Stagger and sequence animations
 */
export interface SpringConfig {
    mass: number;
    stiffness: number;
    damping: number;
    velocity?: number;
}
export interface AnimationTimeline {
    keyframes: Keyframe[];
    options: KeyframeAnimationOptions;
}
export interface Keyframe {
    offset?: number;
    easing?: string;
    composite?: CompositeOperation;
    [property: string]: string | number | undefined;
}
export interface MotionConfig {
    duration?: number;
    delay?: number;
    easing?: string;
    fill?: FillMode;
    direction?: PlaybackDirection;
    iterations?: number;
}
export interface StaggerConfig {
    each?: number;
    from?: 'first' | 'last' | 'center' | number;
    grid?: [number, number];
    axis?: 'x' | 'y';
}
export interface OrchestrationConfig {
    stagger?: StaggerConfig;
    delayChildren?: number;
    staggerChildren?: number;
    when?: 'beforeChildren' | 'afterChildren';
}
export declare const springPresets: Record<string, SpringConfig>;
/**
 * Calculate spring animation keyframes
 */
export declare function calculateSpring(from: number, to: number, config?: SpringConfig, precision?: number): number[];
/**
 * Generate spring animation CSS
 */
export declare function springAnimation(property: string, from: number | string, to: number | string, config?: SpringConfig, unit?: string): string;
/**
 * Create spring-based CSS timing function
 */
export declare function springEasing(config?: SpringConfig): string;
/**
 * Generate slide animation
 */
export declare function slide(direction: 'up' | 'down' | 'left' | 'right', distance?: string): string;
/**
 * Generate fade animation
 */
export declare function fade(type: 'in' | 'out' | 'in-up' | 'in-down' | 'in-left' | 'in-right'): string;
/**
 * Generate scale animation
 */
export declare function scale(type: 'in' | 'out' | 'up' | 'down'): string;
/**
 * Generate rotate animation
 */
export declare function rotate(degrees?: number, options?: {
    origin?: string;
    scale?: boolean;
}): string;
/**
 * Generate bounce animation
 */
export declare function bounce(intensity?: 'light' | 'medium' | 'heavy'): string;
/**
 * Generate shake animation
 */
export declare function shake(intensity?: number): string;
/**
 * Generate pulse animation
 */
export declare function pulse(scale?: number): string;
/**
 * Generate flip animation
 */
export declare function flip(axis?: 'x' | 'y'): string;
/**
 * Generate swing animation
 */
export declare function swing(): string;
/**
 * Generate wobble animation
 */
export declare function wobble(): string;
/**
 * Generate rubber band animation
 */
export declare function rubberBand(): string;
/**
 * Calculate stagger delays
 */
export declare function calculateStagger(count: number, config?: StaggerConfig): number[];
/**
 * Generate staggered animation CSS
 */
export declare function staggerAnimation(selector: string, animation: string, count: number, config?: StaggerConfig): string;
/**
 * Create animation sequence
 */
export declare function sequence(animations: Array<{
    animation: string;
    duration: number;
    delay?: number;
}>): string;
/**
 * Create parallel animations
 */
export declare function parallel(animations: string[], options?: MotionConfig): string;
export interface FLIPState {
    rect: DOMRect;
    opacity: number;
    transform: string;
}
/**
 * Capture element's current state for FLIP
 */
export declare function captureState(element: HTMLElement): FLIPState;
/**
 * Play FLIP animation
 */
export declare function playFLIP(element: HTMLElement, first: FLIPState, last: FLIPState, options?: MotionConfig): Animation;
/**
 * Batch FLIP animations for multiple elements
 */
export declare function batchFLIP(elements: HTMLElement[], getNewState: () => void, options?: MotionConfig): Animation[];
export declare const motionPresets: {
    readonly fadeIn: {
        readonly animation: "fadeIn";
        readonly duration: 0.3;
        readonly easing: "ease-out";
    };
    readonly fadeInUp: {
        readonly animation: "fadeInUp";
        readonly duration: 0.4;
        readonly easing: "ease-out";
    };
    readonly fadeInDown: {
        readonly animation: "fadeInDown";
        readonly duration: 0.4;
        readonly easing: "ease-out";
    };
    readonly slideInLeft: {
        readonly animation: "slideInLeft";
        readonly duration: 0.3;
        readonly easing: "ease-out";
    };
    readonly slideInRight: {
        readonly animation: "slideInRight";
        readonly duration: 0.3;
        readonly easing: "ease-out";
    };
    readonly slideInUp: {
        readonly animation: "slideInUp";
        readonly duration: 0.3;
        readonly easing: "ease-out";
    };
    readonly slideInDown: {
        readonly animation: "slideInDown";
        readonly duration: 0.3;
        readonly easing: "ease-out";
    };
    readonly scaleIn: {
        readonly animation: "scaleIn";
        readonly duration: 0.3;
        readonly easing: "cubic-bezier(0.34, 1.56, 0.64, 1)";
    };
    readonly fadeOut: {
        readonly animation: "fadeOut";
        readonly duration: 0.2;
        readonly easing: "ease-in";
    };
    readonly fadeOutUp: {
        readonly animation: "fadeOutUp";
        readonly duration: 0.3;
        readonly easing: "ease-in";
    };
    readonly fadeOutDown: {
        readonly animation: "fadeOutDown";
        readonly duration: 0.3;
        readonly easing: "ease-in";
    };
    readonly slideOutLeft: {
        readonly animation: "slideOutLeft";
        readonly duration: 0.3;
        readonly easing: "ease-in";
    };
    readonly slideOutRight: {
        readonly animation: "slideOutRight";
        readonly duration: 0.3;
        readonly easing: "ease-in";
    };
    readonly scaleOut: {
        readonly animation: "scaleOut";
        readonly duration: 0.2;
        readonly easing: "ease-in";
    };
    readonly bounce: {
        readonly animation: "bounce";
        readonly duration: 0.6;
        readonly easing: "ease-out";
        readonly iterations: 1;
    };
    readonly shake: {
        readonly animation: "shake";
        readonly duration: 0.5;
        readonly easing: "ease-in-out";
        readonly iterations: 1;
    };
    readonly pulse: {
        readonly animation: "pulse";
        readonly duration: 1;
        readonly easing: "ease-in-out";
        readonly iterations: "infinite";
    };
    readonly swing: {
        readonly animation: "swing";
        readonly duration: 0.6;
        readonly easing: "ease-in-out";
        readonly iterations: 1;
    };
    readonly wobble: {
        readonly animation: "wobble";
        readonly duration: 0.8;
        readonly easing: "ease-in-out";
        readonly iterations: 1;
    };
    readonly rubberBand: {
        readonly animation: "rubberBand";
        readonly duration: 0.6;
        readonly easing: "ease-out";
        readonly iterations: 1;
    };
    readonly crossfade: {
        readonly animation: "crossfade";
        readonly duration: 0.3;
        readonly easing: "ease-in-out";
    };
    readonly morph: {
        readonly animation: "morph";
        readonly duration: 0.5;
        readonly easing: "cubic-bezier(0.4, 0, 0.2, 1)";
    };
};
export declare const easings: {
    readonly linear: "linear";
    readonly ease: "ease";
    readonly easeIn: "ease-in";
    readonly easeOut: "ease-out";
    readonly easeInOut: "ease-in-out";
    readonly easeInCubic: "cubic-bezier(0.55, 0.055, 0.675, 0.19)";
    readonly easeOutCubic: "cubic-bezier(0.215, 0.61, 0.355, 1)";
    readonly easeInOutCubic: "cubic-bezier(0.645, 0.045, 0.355, 1)";
    readonly easeInQuart: "cubic-bezier(0.895, 0.03, 0.685, 0.22)";
    readonly easeOutQuart: "cubic-bezier(0.165, 0.84, 0.44, 1)";
    readonly easeInOutQuart: "cubic-bezier(0.77, 0, 0.175, 1)";
    readonly easeInExpo: "cubic-bezier(0.95, 0.05, 0.795, 0.035)";
    readonly easeOutExpo: "cubic-bezier(0.19, 1, 0.22, 1)";
    readonly easeInOutExpo: "cubic-bezier(1, 0, 0, 1)";
    readonly easeInBack: "cubic-bezier(0.6, -0.28, 0.735, 0.045)";
    readonly easeOutBack: "cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    readonly easeInOutBack: "cubic-bezier(0.68, -0.55, 0.265, 1.55)";
    readonly elasticOut: "cubic-bezier(0.34, 1.56, 0.64, 1)";
    readonly bounceOut: "cubic-bezier(0.34, 1.56, 0.64, 1)";
    readonly snappy: "cubic-bezier(0.17, 0.67, 0.29, 0.96)";
    readonly smooth: "cubic-bezier(0.4, 0, 0.2, 1)";
    readonly sharp: "cubic-bezier(0.4, 0, 0.6, 1)";
};
/**
 * Generate reduced motion styles
 */
export declare function reducedMotionStyles(): string;
/**
 * Check if user prefers reduced motion
 */
export declare function prefersReducedMotion(): boolean;
/**
 * Create motion-safe animation
 */
export declare function motionSafe(animation: string, fallback?: string): string;
/**
 * Generate all standard animation keyframes
 */
export declare function generateAllKeyframes(): string;
/**
 * Generate animation utility classes
 */
export declare function generateAnimationUtilities(): string;
//# sourceMappingURL=animations.d.ts.map