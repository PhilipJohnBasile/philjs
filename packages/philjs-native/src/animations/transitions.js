/**
 * Transition Presets
 *
 * Pre-built transition configurations for common animation patterns.
 */
import { Easing } from './Animated.js';
// ============================================================================
// Basic Transitions
// ============================================================================
/**
 * Fade transition
 */
export const fade = {
    duration: 300,
    easing: Easing.inOut(Easing.quad),
};
/**
 * Fade in transition
 */
export const fadeIn = {
    duration: 300,
    easing: Easing.out(Easing.quad),
    from: { opacity: 0 },
    to: { opacity: 1 },
};
/**
 * Fade out transition
 */
export const fadeOut = {
    duration: 300,
    easing: Easing.in(Easing.quad),
    from: { opacity: 1 },
    to: { opacity: 0 },
};
/**
 * Quick fade transition
 */
export const fadeQuick = {
    duration: 150,
    easing: Easing.linear,
};
// ============================================================================
// Slide Transitions
// ============================================================================
/**
 * Slide in from right
 */
export const slideInRight = {
    duration: 350,
    easing: Easing.out(Easing.cubic),
    from: { translateX: 100, opacity: 0 },
    to: { translateX: 0, opacity: 1 },
};
/**
 * Slide in from left
 */
export const slideInLeft = {
    duration: 350,
    easing: Easing.out(Easing.cubic),
    from: { translateX: -100, opacity: 0 },
    to: { translateX: 0, opacity: 1 },
};
/**
 * Slide in from top
 */
export const slideInUp = {
    duration: 350,
    easing: Easing.out(Easing.cubic),
    from: { translateY: -100, opacity: 0 },
    to: { translateY: 0, opacity: 1 },
};
/**
 * Slide in from bottom
 */
export const slideInDown = {
    duration: 350,
    easing: Easing.out(Easing.cubic),
    from: { translateY: 100, opacity: 0 },
    to: { translateY: 0, opacity: 1 },
};
/**
 * Slide out to right
 */
export const slideOutRight = {
    duration: 300,
    easing: Easing.in(Easing.cubic),
    from: { translateX: 0, opacity: 1 },
    to: { translateX: 100, opacity: 0 },
};
/**
 * Slide out to left
 */
export const slideOutLeft = {
    duration: 300,
    easing: Easing.in(Easing.cubic),
    from: { translateX: 0, opacity: 1 },
    to: { translateX: -100, opacity: 0 },
};
/**
 * Slide out to top
 */
export const slideOutUp = {
    duration: 300,
    easing: Easing.in(Easing.cubic),
    from: { translateY: 0, opacity: 1 },
    to: { translateY: -100, opacity: 0 },
};
/**
 * Slide out to bottom
 */
export const slideOutDown = {
    duration: 300,
    easing: Easing.in(Easing.cubic),
    from: { translateY: 0, opacity: 1 },
    to: { translateY: 100, opacity: 0 },
};
// ============================================================================
// Scale Transitions
// ============================================================================
/**
 * Scale up entrance
 */
export const scaleIn = {
    duration: 300,
    easing: Easing.out(Easing.back(1.5)),
    from: { scale: 0.8, opacity: 0 },
    to: { scale: 1, opacity: 1 },
};
/**
 * Scale down exit
 */
export const scaleOut = {
    duration: 250,
    easing: Easing.in(Easing.quad),
    from: { scale: 1, opacity: 1 },
    to: { scale: 0.8, opacity: 0 },
};
/**
 * Zoom in from center
 */
export const zoomIn = {
    duration: 400,
    easing: Easing.out(Easing.exp),
    from: { scale: 0, opacity: 0 },
    to: { scale: 1, opacity: 1 },
};
/**
 * Zoom out to center
 */
export const zoomOut = {
    duration: 350,
    easing: Easing.in(Easing.exp),
    from: { scale: 1, opacity: 1 },
    to: { scale: 0, opacity: 0 },
};
/**
 * Pop in (bounce scale)
 */
export const popIn = {
    duration: 400,
    easing: Easing.out(Easing.back(2)),
    from: { scale: 0.5, opacity: 0 },
    to: { scale: 1, opacity: 1 },
};
// ============================================================================
// Rotate Transitions
// ============================================================================
/**
 * Rotate in
 */
export const rotateIn = {
    duration: 400,
    easing: Easing.out(Easing.cubic),
    from: { rotate: '-90deg', opacity: 0 },
    to: { rotate: '0deg', opacity: 1 },
};
/**
 * Rotate out
 */
export const rotateOut = {
    duration: 350,
    easing: Easing.in(Easing.cubic),
    from: { rotate: '0deg', opacity: 1 },
    to: { rotate: '90deg', opacity: 0 },
};
/**
 * Flip horizontal
 */
export const flipInX = {
    duration: 500,
    easing: Easing.out(Easing.cubic),
    from: { rotateX: '90deg', opacity: 0 },
    to: { rotateX: '0deg', opacity: 1 },
};
/**
 * Flip vertical
 */
export const flipInY = {
    duration: 500,
    easing: Easing.out(Easing.cubic),
    from: { rotateY: '90deg', opacity: 0 },
    to: { rotateY: '0deg', opacity: 1 },
};
// ============================================================================
// Screen Transition Presets
// ============================================================================
/**
 * Default stack push transition (iOS-like)
 */
export const stackPush = {
    enter: {
        duration: 350,
        easing: Easing.out(Easing.cubic),
        from: { translateX: 100, opacity: 1 },
        to: { translateX: 0, opacity: 1 },
    },
    exit: {
        duration: 350,
        easing: Easing.out(Easing.cubic),
        from: { translateX: 0, opacity: 1 },
        to: { translateX: -30, opacity: 0.8 },
    },
    parallel: true,
    gestureConfig: {
        direction: 'horizontal',
        threshold: 0.3,
        enabled: true,
    },
};
/**
 * Default stack pop transition (iOS-like)
 */
export const stackPop = {
    enter: {
        duration: 350,
        easing: Easing.out(Easing.cubic),
        from: { translateX: -30, opacity: 0.8 },
        to: { translateX: 0, opacity: 1 },
    },
    exit: {
        duration: 350,
        easing: Easing.out(Easing.cubic),
        from: { translateX: 0, opacity: 1 },
        to: { translateX: 100, opacity: 1 },
    },
    parallel: true,
};
/**
 * Modal presentation (slide up)
 */
export const modalPresent = {
    enter: {
        duration: 400,
        easing: Easing.out(Easing.cubic),
        from: { translateY: 100, opacity: 1 },
        to: { translateY: 0, opacity: 1 },
    },
    exit: {
        duration: 400,
        easing: Easing.out(Easing.cubic),
        from: { scale: 1, opacity: 1 },
        to: { scale: 0.95, opacity: 0.5 },
    },
    parallel: true,
    gestureConfig: {
        direction: 'vertical',
        threshold: 0.25,
        enabled: true,
    },
};
/**
 * Modal dismiss (slide down)
 */
export const modalDismiss = {
    enter: {
        duration: 350,
        easing: Easing.out(Easing.cubic),
        from: { scale: 0.95, opacity: 0.5 },
        to: { scale: 1, opacity: 1 },
    },
    exit: {
        duration: 350,
        easing: Easing.out(Easing.cubic),
        from: { translateY: 0, opacity: 1 },
        to: { translateY: 100, opacity: 1 },
    },
    parallel: true,
};
/**
 * Fade transition between screens
 */
export const screenFade = {
    enter: fadeIn,
    exit: fadeOut,
    parallel: true,
};
/**
 * No animation
 */
export const none = {
    enter: {
        duration: 0,
        easing: Easing.linear,
        from: { opacity: 1 },
        to: { opacity: 1 },
    },
    exit: {
        duration: 0,
        easing: Easing.linear,
        from: { opacity: 1 },
        to: { opacity: 1 },
    },
};
/**
 * Android material design transition
 */
export const materialSharedAxis = {
    enter: {
        duration: 300,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        from: { translateX: 30, opacity: 0 },
        to: { translateX: 0, opacity: 1 },
    },
    exit: {
        duration: 250,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
        from: { translateX: 0, opacity: 1 },
        to: { translateX: -30, opacity: 0 },
    },
    parallel: true,
};
/**
 * Bottom sheet presentation
 */
export const bottomSheet = {
    enter: {
        duration: 350,
        easing: Easing.out(Easing.cubic),
        from: { translateY: 100, opacity: 1 },
        to: { translateY: 0, opacity: 1 },
    },
    exit: {
        duration: 250,
        easing: Easing.in(Easing.cubic),
        from: { translateY: 0, opacity: 1 },
        to: { translateY: 100, opacity: 1 },
    },
    gestureConfig: {
        direction: 'vertical',
        threshold: 0.2,
        enabled: true,
    },
};
// ============================================================================
// Timing Presets
// ============================================================================
/**
 * Standard timing durations
 */
export const durations = {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 750,
    slowest: 1000,
};
/**
 * Standard easing presets
 */
export const easings = {
    linear: Easing.linear,
    easeIn: Easing.in(Easing.quad),
    easeOut: Easing.out(Easing.quad),
    easeInOut: Easing.inOut(Easing.quad),
    easeInCubic: Easing.in(Easing.cubic),
    easeOutCubic: Easing.out(Easing.cubic),
    easeInOutCubic: Easing.inOut(Easing.cubic),
    spring: Easing.out(Easing.back(1.5)),
    bounce: Easing.bounce,
    elastic: Easing.elastic(1),
};
// ============================================================================
// Transition Helpers
// ============================================================================
/**
 * Create a custom transition
 */
export function createTransition(duration, easing, from, to) {
    return {
        duration,
        easing,
        from,
        to,
    };
}
/**
 * Create a screen transition
 */
export function createScreenTransition(enter, exit, options) {
    const config = {
        enter,
        exit,
        parallel: options?.parallel ?? true,
    };
    if (options?.gestureConfig !== undefined) {
        config.gestureConfig = options.gestureConfig;
    }
    return config;
}
/**
 * Reverse a transform transition
 */
export function reverseTransition(transition) {
    return {
        ...transition,
        from: transition.to,
        to: transition.from,
    };
}
/**
 * Chain multiple transitions
 */
export function chainTransitions(...transitions) {
    return transitions.map((transition, index) => ({
        ...transition,
        delay: transitions.slice(0, index).reduce((acc, t) => acc + t.duration, 0),
    }));
}
// ============================================================================
// Spring Presets
// ============================================================================
/**
 * Standard spring configurations
 */
export const springConfigs = {
    /**
     * Gentle spring
     */
    gentle: {
        stiffness: 120,
        damping: 14,
        mass: 1,
    },
    /**
     * Wobbly spring
     */
    wobbly: {
        stiffness: 180,
        damping: 12,
        mass: 1,
    },
    /**
     * Stiff spring
     */
    stiff: {
        stiffness: 210,
        damping: 20,
        mass: 1,
    },
    /**
     * Slow spring
     */
    slow: {
        stiffness: 280,
        damping: 60,
        mass: 1,
    },
    /**
     * Molasses spring
     */
    molasses: {
        stiffness: 280,
        damping: 120,
        mass: 1,
    },
    /**
     * Default spring
     */
    default: {
        stiffness: 100,
        damping: 10,
        mass: 1,
    },
    /**
     * Snappy spring
     */
    snappy: {
        stiffness: 400,
        damping: 30,
        mass: 1,
    },
};
// ============================================================================
// Export All
// ============================================================================
export const Transitions = {
    // Basic
    fade,
    fadeIn,
    fadeOut,
    fadeQuick,
    // Slides
    slideInRight,
    slideInLeft,
    slideInUp,
    slideInDown,
    slideOutRight,
    slideOutLeft,
    slideOutUp,
    slideOutDown,
    // Scale
    scaleIn,
    scaleOut,
    zoomIn,
    zoomOut,
    popIn,
    // Rotate
    rotateIn,
    rotateOut,
    flipInX,
    flipInY,
    // Screen transitions
    stackPush,
    stackPop,
    modalPresent,
    modalDismiss,
    screenFade,
    materialSharedAxis,
    bottomSheet,
    none,
    // Presets
    durations,
    easings,
    springConfigs,
    // Helpers
    createTransition,
    createScreenTransition,
    reverseTransition,
    chainTransitions,
};
export default Transitions;
//# sourceMappingURL=transitions.js.map