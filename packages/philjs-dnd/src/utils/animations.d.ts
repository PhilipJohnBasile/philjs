import type { DropAnimation, Position } from '../types.js';
export declare const defaultDropAnimation: DropAnimation;
export declare const fastDropAnimation: DropAnimation;
export declare const slowDropAnimation: DropAnimation;
export declare const springDropAnimation: DropAnimation;
export declare const bounceDropAnimation: DropAnimation;
export declare const easings: {
    linear: string;
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    easeInQuad: string;
    easeOutQuad: string;
    easeInOutQuad: string;
    easeInCubic: string;
    easeOutCubic: string;
    easeInOutCubic: string;
    easeInQuart: string;
    easeOutQuart: string;
    easeInOutQuart: string;
    easeInExpo: string;
    easeOutExpo: string;
    easeInOutExpo: string;
    easeInBack: string;
    easeOutBack: string;
    easeInOutBack: string;
    spring: string;
    bounce: string;
};
export declare function applyDropAnimation(element: HTMLElement, animation: DropAnimation): Promise<void>;
export interface LayoutShiftAnimation {
    duration: number;
    easing: string;
}
export declare const defaultLayoutShiftAnimation: LayoutShiftAnimation;
export declare function animateLayoutShift(element: HTMLElement, from: {
    x: number;
    y: number;
}, to: {
    x: number;
    y: number;
}, config?: LayoutShiftAnimation): Promise<void>;
export declare function createKeyframeAnimation(element: HTMLElement, keyframes: Keyframe[], options: KeyframeAnimationOptions): Animation;
export declare const shakeKeyframes: Keyframe[];
export declare const pulseKeyframes: Keyframe[];
export declare const fadeOutKeyframes: Keyframe[];
export declare const fadeInKeyframes: Keyframe[];
export declare const scaleUpKeyframes: Keyframe[];
export declare const scaleDownKeyframes: Keyframe[];
export declare const slideInFromTopKeyframes: Keyframe[];
export declare const slideInFromBottomKeyframes: Keyframe[];
export declare function getTransformValues(element: HTMLElement): Position;
export declare function setTransform(element: HTMLElement, position: Position): void;
export declare function clearTransform(element: HTMLElement): void;
export interface FlipState {
    rect: DOMRect;
    element: HTMLElement;
}
export declare function captureFlipState(element: HTMLElement): FlipState;
export declare function playFlipAnimation(firstState: FlipState, config?: LayoutShiftAnimation): Promise<void>;
export declare function getTransitionString(property: string | string[], duration: number, easing?: string, delay?: number): string;
export declare function removeTransition(element: HTMLElement): void;
export declare function waitForTransition(element: HTMLElement): Promise<void>;
//# sourceMappingURL=animations.d.ts.map