/**
 * Animation utilities and transitions for PhilJS Charts
 */
export type EasingFunction = (t: number) => number;
export declare const easings: {
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
    easeInElastic: (t: number) => number;
    easeOutElastic: (t: number) => number;
    easeOutBounce: (t: number) => number;
    easeInBounce: (t: number) => number;
};
export interface AnimationConfig {
    duration?: number;
    easing?: keyof typeof easings | EasingFunction;
    delay?: number;
    onStart?: () => void;
    onUpdate?: (progress: number) => void;
    onComplete?: () => void;
}
export declare const defaultAnimationConfig: Required<Omit<AnimationConfig, 'onStart' | 'onUpdate' | 'onComplete'>>;
export declare const animationPresets: {
    none: {
        duration: number;
    };
    fast: {
        duration: number;
        easing: "easeOutQuad";
    };
    normal: {
        duration: number;
        easing: "easeOutCubic";
    };
    slow: {
        duration: number;
        easing: "easeOutCubic";
    };
    bouncy: {
        duration: number;
        easing: "easeOutBounce";
    };
    elastic: {
        duration: number;
        easing: "easeOutElastic";
    };
};
export type TransitionType = 'fade' | 'scale' | 'slide' | 'expand' | 'morph';
export interface TransitionConfig extends AnimationConfig {
    type?: TransitionType;
    staggerDelay?: number;
    staggerOrder?: 'index' | 'value' | 'random';
}
export declare function animate(from: number, to: number, config?: AnimationConfig): Promise<void>;
export declare function animateStaggered(items: number[], config?: TransitionConfig): Promise<void>;
export interface SpringConfig {
    stiffness?: number;
    damping?: number;
    mass?: number;
    velocity?: number;
}
export declare function createSpring(config?: SpringConfig): {
    update: (target: number) => number;
    reset: (value: number) => void;
};
export declare function interpolateValues(from: number[], to: number[], t: number): number[];
export declare function interpolateColor(from: string, to: string, t: number): string;
export declare function morphPath(fromPath: string, toPath: string, t: number): string;
//# sourceMappingURL=animations.d.ts.map