/**
 * Transition Presets
 *
 * Pre-built transition configurations for common animation patterns.
 */
import { type SpringConfig } from './Animated.js';
/**
 * Transition configuration
 */
export interface TransitionConfig {
    /**
     * Duration in milliseconds
     */
    duration: number;
    /**
     * Easing function
     */
    easing: (t: number) => number;
    /**
     * Delay before starting
     */
    delay?: number;
}
/**
 * Transform transition configuration
 */
export interface TransformTransition extends TransitionConfig {
    /**
     * Starting transform values
     */
    from: TransformValues;
    /**
     * Ending transform values
     */
    to: TransformValues;
}
/**
 * Transform values
 */
export interface TransformValues {
    translateX?: number;
    translateY?: number;
    translateZ?: number;
    scale?: number;
    scaleX?: number;
    scaleY?: number;
    rotate?: string;
    rotateX?: string;
    rotateY?: string;
    rotateZ?: string;
    skewX?: string;
    skewY?: string;
    opacity?: number;
}
/**
 * Screen transition configuration
 */
export interface ScreenTransitionConfig {
    /**
     * Animation for the entering screen
     */
    enter: TransformTransition;
    /**
     * Animation for the exiting screen
     */
    exit: TransformTransition;
    /**
     * Whether to run animations in parallel
     */
    parallel?: boolean;
    /**
     * Gesture-based interaction config
     */
    gestureConfig?: {
        /**
         * Direction of the gesture
         */
        direction: 'horizontal' | 'vertical';
        /**
         * Threshold to complete the transition
         */
        threshold: number;
        /**
         * Whether the gesture is enabled
         */
        enabled: boolean;
    };
}
/**
 * Fade transition
 */
export declare const fade: TransitionConfig;
/**
 * Fade in transition
 */
export declare const fadeIn: TransformTransition;
/**
 * Fade out transition
 */
export declare const fadeOut: TransformTransition;
/**
 * Quick fade transition
 */
export declare const fadeQuick: TransitionConfig;
/**
 * Slide in from right
 */
export declare const slideInRight: TransformTransition;
/**
 * Slide in from left
 */
export declare const slideInLeft: TransformTransition;
/**
 * Slide in from top
 */
export declare const slideInUp: TransformTransition;
/**
 * Slide in from bottom
 */
export declare const slideInDown: TransformTransition;
/**
 * Slide out to right
 */
export declare const slideOutRight: TransformTransition;
/**
 * Slide out to left
 */
export declare const slideOutLeft: TransformTransition;
/**
 * Slide out to top
 */
export declare const slideOutUp: TransformTransition;
/**
 * Slide out to bottom
 */
export declare const slideOutDown: TransformTransition;
/**
 * Scale up entrance
 */
export declare const scaleIn: TransformTransition;
/**
 * Scale down exit
 */
export declare const scaleOut: TransformTransition;
/**
 * Zoom in from center
 */
export declare const zoomIn: TransformTransition;
/**
 * Zoom out to center
 */
export declare const zoomOut: TransformTransition;
/**
 * Pop in (bounce scale)
 */
export declare const popIn: TransformTransition;
/**
 * Rotate in
 */
export declare const rotateIn: TransformTransition;
/**
 * Rotate out
 */
export declare const rotateOut: TransformTransition;
/**
 * Flip horizontal
 */
export declare const flipInX: TransformTransition;
/**
 * Flip vertical
 */
export declare const flipInY: TransformTransition;
/**
 * Default stack push transition (iOS-like)
 */
export declare const stackPush: ScreenTransitionConfig;
/**
 * Default stack pop transition (iOS-like)
 */
export declare const stackPop: ScreenTransitionConfig;
/**
 * Modal presentation (slide up)
 */
export declare const modalPresent: ScreenTransitionConfig;
/**
 * Modal dismiss (slide down)
 */
export declare const modalDismiss: ScreenTransitionConfig;
/**
 * Fade transition between screens
 */
export declare const screenFade: ScreenTransitionConfig;
/**
 * No animation
 */
export declare const none: ScreenTransitionConfig;
/**
 * Android material design transition
 */
export declare const materialSharedAxis: ScreenTransitionConfig;
/**
 * Bottom sheet presentation
 */
export declare const bottomSheet: ScreenTransitionConfig;
/**
 * Standard timing durations
 */
export declare const durations: {
    readonly instant: 0;
    readonly fast: 150;
    readonly normal: 300;
    readonly slow: 500;
    readonly slower: 750;
    readonly slowest: 1000;
};
/**
 * Standard easing presets
 */
export declare const easings: {
    readonly linear: (t: number) => number;
    readonly easeIn: (t: number) => number;
    readonly easeOut: (t: number) => number;
    readonly easeInOut: (t: number) => number;
    readonly easeInCubic: (t: number) => number;
    readonly easeOutCubic: (t: number) => number;
    readonly easeInOutCubic: (t: number) => number;
    readonly spring: (t: number) => number;
    readonly bounce: (t: number) => number;
    readonly elastic: (t: number) => number;
};
/**
 * Create a custom transition
 */
export declare function createTransition(duration: number, easing: (t: number) => number, from: TransformValues, to: TransformValues): TransformTransition;
/**
 * Create a screen transition
 */
export declare function createScreenTransition(enter: TransformTransition, exit: TransformTransition, options?: {
    parallel?: boolean;
    gestureConfig?: ScreenTransitionConfig['gestureConfig'];
}): ScreenTransitionConfig;
/**
 * Reverse a transform transition
 */
export declare function reverseTransition(transition: TransformTransition): TransformTransition;
/**
 * Chain multiple transitions
 */
export declare function chainTransitions(...transitions: TransformTransition[]): TransformTransition[];
/**
 * Standard spring configurations
 */
export declare const springConfigs: {
    /**
     * Gentle spring
     */
    gentle: Partial<SpringConfig>;
    /**
     * Wobbly spring
     */
    wobbly: Partial<SpringConfig>;
    /**
     * Stiff spring
     */
    stiff: Partial<SpringConfig>;
    /**
     * Slow spring
     */
    slow: Partial<SpringConfig>;
    /**
     * Molasses spring
     */
    molasses: Partial<SpringConfig>;
    /**
     * Default spring
     */
    default: Partial<SpringConfig>;
    /**
     * Snappy spring
     */
    snappy: Partial<SpringConfig>;
};
export declare const Transitions: {
    fade: TransitionConfig;
    fadeIn: TransformTransition;
    fadeOut: TransformTransition;
    fadeQuick: TransitionConfig;
    slideInRight: TransformTransition;
    slideInLeft: TransformTransition;
    slideInUp: TransformTransition;
    slideInDown: TransformTransition;
    slideOutRight: TransformTransition;
    slideOutLeft: TransformTransition;
    slideOutUp: TransformTransition;
    slideOutDown: TransformTransition;
    scaleIn: TransformTransition;
    scaleOut: TransformTransition;
    zoomIn: TransformTransition;
    zoomOut: TransformTransition;
    popIn: TransformTransition;
    rotateIn: TransformTransition;
    rotateOut: TransformTransition;
    flipInX: TransformTransition;
    flipInY: TransformTransition;
    stackPush: ScreenTransitionConfig;
    stackPop: ScreenTransitionConfig;
    modalPresent: ScreenTransitionConfig;
    modalDismiss: ScreenTransitionConfig;
    screenFade: ScreenTransitionConfig;
    materialSharedAxis: ScreenTransitionConfig;
    bottomSheet: ScreenTransitionConfig;
    none: ScreenTransitionConfig;
    durations: {
        readonly instant: 0;
        readonly fast: 150;
        readonly normal: 300;
        readonly slow: 500;
        readonly slower: 750;
        readonly slowest: 1000;
    };
    easings: {
        readonly linear: (t: number) => number;
        readonly easeIn: (t: number) => number;
        readonly easeOut: (t: number) => number;
        readonly easeInOut: (t: number) => number;
        readonly easeInCubic: (t: number) => number;
        readonly easeOutCubic: (t: number) => number;
        readonly easeInOutCubic: (t: number) => number;
        readonly spring: (t: number) => number;
        readonly bounce: (t: number) => number;
        readonly elastic: (t: number) => number;
    };
    springConfigs: {
        /**
         * Gentle spring
         */
        gentle: Partial<SpringConfig>;
        /**
         * Wobbly spring
         */
        wobbly: Partial<SpringConfig>;
        /**
         * Stiff spring
         */
        stiff: Partial<SpringConfig>;
        /**
         * Slow spring
         */
        slow: Partial<SpringConfig>;
        /**
         * Molasses spring
         */
        molasses: Partial<SpringConfig>;
        /**
         * Default spring
         */
        default: Partial<SpringConfig>;
        /**
         * Snappy spring
         */
        snappy: Partial<SpringConfig>;
    };
    createTransition: typeof createTransition;
    createScreenTransition: typeof createScreenTransition;
    reverseTransition: typeof reverseTransition;
    chainTransitions: typeof chainTransitions;
};
export default Transitions;
//# sourceMappingURL=transitions.d.ts.map