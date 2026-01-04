/**
 * @philjs/motion - Spring Physics Animation System
 *
 * Industry-first framework-native physics-based animations:
 * - Spring dynamics with configurable tension/friction
 * - Gesture-driven animations
 * - Layout animations with FLIP technique
 * - Scroll-linked animations
 * - Orchestrated sequences
 * - GPU-accelerated transforms
 */
export interface SpringConfig {
    tension?: number;
    friction?: number;
    mass?: number;
    velocity?: number;
    precision?: number;
    clamp?: boolean;
}
export interface AnimatedValue {
    value: number;
    velocity: number;
    target: number;
}
export interface AnimationState {
    isAnimating: boolean;
    progress: number;
    velocity: number;
}
export interface TransformValues {
    x?: number;
    y?: number;
    z?: number;
    scale?: number;
    scaleX?: number;
    scaleY?: number;
    rotate?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
    skewX?: number;
    skewY?: number;
    opacity?: number;
}
export interface LayoutRect {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface GestureState {
    x: number;
    y: number;
    dx: number;
    dy: number;
    vx: number;
    vy: number;
    isDragging: boolean;
    isPinching: boolean;
    scale: number;
    rotation: number;
}
export interface ScrollInfo {
    x: number;
    y: number;
    progress: number;
    velocity: number;
    direction: 'up' | 'down' | 'left' | 'right' | null;
}
export type EasingFunction = (t: number) => number;
export type AnimationCallback = (state: AnimationState) => void;
export declare const SpringPresets: {
    default: {
        tension: number;
        friction: number;
    };
    gentle: {
        tension: number;
        friction: number;
    };
    wobbly: {
        tension: number;
        friction: number;
    };
    stiff: {
        tension: number;
        friction: number;
    };
    slow: {
        tension: number;
        friction: number;
    };
    molasses: {
        tension: number;
        friction: number;
    };
    bouncy: {
        tension: number;
        friction: number;
    };
    snappy: {
        tension: number;
        friction: number;
    };
};
export declare class Spring {
    private config;
    private value;
    private velocity;
    private target;
    private isAnimating;
    private animationFrame;
    private callbacks;
    private resolvers;
    constructor(initialValue?: number, config?: SpringConfig);
    get(): number;
    set(newValue: number, immediate?: boolean): Promise<void>;
    configure(config: SpringConfig): void;
    onUpdate(callback: AnimationCallback): () => void;
    private start;
    private animate;
    private emit;
    stop(): void;
    dispose(): void;
}
export declare class SpringVector {
    private springs;
    private config;
    constructor(initial?: Record<string, number>, config?: SpringConfig);
    get(key?: string): number | Record<string, number>;
    set(values: Record<string, number>, immediate?: boolean): Promise<void[]>;
    onUpdate(callback: (values: Record<string, number>) => void): () => void;
    dispose(): void;
}
export declare class AnimatedTransform {
    private element;
    private springs;
    private willChange;
    constructor(element: HTMLElement, initial?: TransformValues, config?: SpringConfig);
    private setupWillChange;
    private applyTransform;
    animate(values: Partial<TransformValues>): Promise<void[]>;
    set(values: Partial<TransformValues>): void;
    get(): TransformValues;
    dispose(): void;
}
export declare class FlipAnimation {
    private element;
    private firstRect;
    private config;
    constructor(element: HTMLElement, config?: SpringConfig);
    first(): void;
    last(): LayoutRect;
    invert(): {
        x: number;
        y: number;
        scaleX: number;
        scaleY: number;
    } | null;
    play(): Promise<void>;
}
export declare class GestureAnimation {
    private element;
    private transform;
    private state;
    private isDragging;
    private startPoint;
    private lastPoint;
    private lastTime;
    private bounds?;
    private onDragEndCallback?;
    constructor(element: HTMLElement, config?: SpringConfig);
    private createInitialState;
    private setupListeners;
    private onPointerDown;
    private onPointerMove;
    private onPointerUp;
    setBounds(bounds: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    }): void;
    onDragEnd(callback: (state: GestureState) => void): void;
    animateTo(x: number, y: number): Promise<void[]>;
    reset(): Promise<void[]>;
    getState(): GestureState;
    dispose(): void;
}
export declare class ScrollAnimation {
    private element;
    private container;
    private startOffset;
    private endOffset;
    private callbacks;
    private lastScrollY;
    private lastTime;
    private ticking;
    constructor(element: HTMLElement, options?: {
        container?: HTMLElement;
        startOffset?: number;
        endOffset?: number;
    });
    private setupListener;
    private onScroll;
    private update;
    private getScrollY;
    private getScrollX;
    onProgress(callback: (progress: number, info: ScrollInfo) => void): () => void;
    dispose(): void;
}
export declare class AnimationSequence {
    private steps;
    private isPlaying;
    to(targets: HTMLElement | HTMLElement[], values: TransformValues, options?: {
        config?: SpringConfig;
        stagger?: number;
    }): AnimationSequence;
    play(): Promise<void>;
    reset(): void;
}
export declare const Easing: {
    linear: (t: number) => number;
    easeInQuad: (t: number) => number;
    easeOutQuad: (t: number) => number;
    easeInOutQuad: (t: number) => number;
    easeInCubic: (t: number) => number;
    easeOutCubic: (t: number) => number;
    easeInOutCubic: (t: number) => number;
    easeInElastic: (t: number) => number;
    easeOutElastic: (t: number) => number;
    easeOutBounce: (t: number) => number;
};
export declare function useSpring(initial?: number, config?: SpringConfig): {
    value: number;
    set: (newValue: number) => Promise<void> | undefined;
    setImmediate: (newValue: number) => Promise<void> | undefined;
};
export declare function useSpringVector(initial?: Record<string, number>, config?: SpringConfig): {
    values: Record<string, number>;
    set: (newValues: Record<string, number>) => Promise<void[]> | undefined;
};
export declare function useAnimatedTransform(elementRef: {
    current: HTMLElement | null;
}, initial?: TransformValues, config?: SpringConfig): {
    animate: (values: Partial<TransformValues>) => Promise<void[]> | undefined;
    set: (values: Partial<TransformValues>) => void;
};
export declare function useGesture(elementRef: {
    current: HTMLElement | null;
}, config?: SpringConfig): {
    state: GestureState;
    setBounds: (bounds: {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    }) => void;
    animateTo: (x: number, y: number) => Promise<void[]> | undefined;
    reset: () => Promise<void[]> | undefined;
};
export declare function useScrollAnimation(elementRef: {
    current: HTMLElement | null;
}, options?: {
    startOffset?: number;
    endOffset?: number;
}): {
    progress: number;
    scrollInfo: ScrollInfo | null;
};
export declare function useFlip(elementRef: {
    current: HTMLElement | null;
}, config?: SpringConfig): {
    snapshot: () => void;
    animate: () => Promise<void> | undefined;
};
declare const _default: {
    Spring: typeof Spring;
    SpringVector: typeof SpringVector;
    SpringPresets: {
        default: {
            tension: number;
            friction: number;
        };
        gentle: {
            tension: number;
            friction: number;
        };
        wobbly: {
            tension: number;
            friction: number;
        };
        stiff: {
            tension: number;
            friction: number;
        };
        slow: {
            tension: number;
            friction: number;
        };
        molasses: {
            tension: number;
            friction: number;
        };
        bouncy: {
            tension: number;
            friction: number;
        };
        snappy: {
            tension: number;
            friction: number;
        };
    };
    AnimatedTransform: typeof AnimatedTransform;
    FlipAnimation: typeof FlipAnimation;
    GestureAnimation: typeof GestureAnimation;
    ScrollAnimation: typeof ScrollAnimation;
    AnimationSequence: typeof AnimationSequence;
    Easing: {
        linear: (t: number) => number;
        easeInQuad: (t: number) => number;
        easeOutQuad: (t: number) => number;
        easeInOutQuad: (t: number) => number;
        easeInCubic: (t: number) => number;
        easeOutCubic: (t: number) => number;
        easeInOutCubic: (t: number) => number;
        easeInElastic: (t: number) => number;
        easeOutElastic: (t: number) => number;
        easeOutBounce: (t: number) => number;
    };
    useSpring: typeof useSpring;
    useSpringVector: typeof useSpringVector;
    useAnimatedTransform: typeof useAnimatedTransform;
    useGesture: typeof useGesture;
    useScrollAnimation: typeof useScrollAnimation;
    useFlip: typeof useFlip;
};
export default _default;
//# sourceMappingURL=index.d.ts.map