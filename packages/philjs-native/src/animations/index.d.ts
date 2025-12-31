/**
 * PhilJS Native Animations
 *
 * Animation library for native mobile apps.
 */
export { Animated, AnimatedValue, AnimatedValueXY, AnimatedInterpolation, Easing, timing, spring, decay, sequence, parallel, stagger, loop, add, subtract, multiply, divide, modulo, diffClamp, event, createAnimatedComponent, } from './Animated.js';
export type { InterpolationConfig, AnimationConfig, SpringConfig, DecayConfig, AnimationResult, CompositeAnimation, } from './Animated.js';
export { Transitions, fade, fadeIn, fadeOut, fadeQuick, slideInRight, slideInLeft, slideInUp, slideInDown, slideOutRight, slideOutLeft, slideOutUp, slideOutDown, scaleIn, scaleOut, zoomIn, zoomOut, popIn, rotateIn, rotateOut, flipInX, flipInY, stackPush, stackPop, modalPresent, modalDismiss, screenFade, materialSharedAxis, bottomSheet, durations, easings, springConfigs, createTransition, createScreenTransition, reverseTransition, chainTransitions, } from './transitions.js';
export type { TransitionConfig, TransformTransition, TransformValues, ScreenTransitionConfig, } from './transitions.js';
export { Spring, createSpring, createSpring2D, createGestureSpring, createSpringChain, SpringPresets, useSpring, useSpring2D, } from './spring.js';
export type { SpringPhysicsConfig, SpringState, SpringController, Spring2DState, Spring2DController, GestureSpringConfig, GestureSpringController, ChainConfig, } from './spring.js';
//# sourceMappingURL=index.d.ts.map