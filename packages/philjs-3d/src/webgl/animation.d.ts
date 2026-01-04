/**
 * @file Animation Loop
 * @description requestAnimationFrame-based animation loop management
 */
import type { AnimationFrameInfo, AnimationLoop } from './types.js';
/**
 * Callback type for animation frame
 */
export type FrameCallback = (info: AnimationFrameInfo) => void;
/**
 * Create an animation loop
 */
export declare function createAnimationLoop(callback: FrameCallback): AnimationLoop;
/**
 * Create an animation loop with fixed timestep
 */
export declare function createFixedTimestepLoop(callback: FrameCallback, fixedDeltaTime?: number): AnimationLoop & {
    update: () => void;
};
/**
 * Create a time-based animator
 */
export declare function createAnimator(): {
    animate: (duration: number, callback: (t: number) => void) => Promise<void>;
    cancel: () => void;
};
/**
 * Easing functions
 */
export declare const Easing: {
    linear: (t: number) => number;
    easeInQuad: (t: number) => number;
    easeOutQuad: (t: number) => number;
    easeInOutQuad: (t: number) => number;
    easeInCubic: (t: number) => number;
    easeOutCubic: (t: number) => number;
    easeInOutCubic: (t: number) => number;
    easeInQuart: (t: number) => number;
    easeOutQuart: (t: number) => number;
    easeInOutQuart: (t: number) => number;
    easeInQuint: (t: number) => number;
    easeOutQuint: (t: number) => number;
    easeInOutQuint: (t: number) => number;
    easeInSine: (t: number) => number;
    easeOutSine: (t: number) => number;
    easeInOutSine: (t: number) => number;
    easeInExpo: (t: number) => number;
    easeOutExpo: (t: number) => number;
    easeInOutExpo: (t: number) => number;
    easeInCirc: (t: number) => number;
    easeOutCirc: (t: number) => number;
    easeInOutCirc: (t: number) => number;
    easeInElastic: (t: number) => number;
    easeOutElastic: (t: number) => number;
    easeInOutElastic: (t: number) => number;
    easeInBack: (t: number) => number;
    easeOutBack: (t: number) => number;
    easeInOutBack: (t: number) => number;
    easeOutBounce: (t: number) => number;
    easeInBounce: (t: number) => number;
    easeInOutBounce: (t: number) => number;
};
/**
 * Interpolate between values
 */
export declare function lerp(a: number, b: number, t: number): number;
/**
 * Interpolate between vectors
 */
export declare function lerpVec3(a: Float32Array | number[], b: Float32Array | number[], t: number): Float32Array;
/**
 * Spherical linear interpolation for rotations
 */
export declare function slerp(a: Float32Array | number[], b: Float32Array | number[], t: number): Float32Array;
//# sourceMappingURL=animation.d.ts.map