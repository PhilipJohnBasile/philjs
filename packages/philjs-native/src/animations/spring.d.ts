/**
 * Spring Physics Animations
 *
 * Advanced spring physics for natural-feeling animations.
 */
import { type Signal } from 'philjs-core';
/**
 * Spring configuration
 */
export interface SpringPhysicsConfig {
    /**
     * Mass of the spring system
     */
    mass: number;
    /**
     * Stiffness of the spring
     */
    stiffness: number;
    /**
     * Damping coefficient
     */
    damping: number;
    /**
     * Initial velocity
     */
    velocity?: number;
    /**
     * Whether to clamp overshooting
     */
    clamp?: boolean;
    /**
     * Precision for considering the spring at rest
     */
    precision?: number;
}
/**
 * Spring state
 */
export interface SpringState {
    position: number;
    velocity: number;
    atRest: boolean;
}
/**
 * Spring controller
 */
export interface SpringController {
    /**
     * Get current spring state
     */
    getState(): SpringState;
    /**
     * Set target position
     */
    setTarget(target: number): void;
    /**
     * Set current position immediately
     */
    setPosition(position: number): void;
    /**
     * Add velocity impulse
     */
    addVelocity(velocity: number): void;
    /**
     * Start the spring animation
     */
    start(): void;
    /**
     * Stop the spring animation
     */
    stop(): void;
    /**
     * Check if spring is at rest
     */
    isAtRest(): boolean;
    /**
     * Subscribe to position changes
     */
    subscribe(callback: (state: SpringState) => void): () => void;
    /**
     * Get the position signal for reactive updates
     */
    position: Signal<number>;
}
/**
 * Create a spring physics controller
 */
export declare function createSpring(initialValue?: number, config?: Partial<SpringPhysicsConfig>): SpringController;
/**
 * 2D Spring state
 */
export interface Spring2DState {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
    atRest: boolean;
}
/**
 * 2D Spring controller
 */
export interface Spring2DController {
    getState(): Spring2DState;
    setTarget(x: number, y: number): void;
    setPosition(x: number, y: number): void;
    addVelocity(vx: number, vy: number): void;
    start(): void;
    stop(): void;
    isAtRest(): boolean;
    subscribe(callback: (state: Spring2DState) => void): () => void;
    x: Signal<number>;
    y: Signal<number>;
}
/**
 * Create a 2D spring physics controller
 */
export declare function createSpring2D(initialX?: number, initialY?: number, config?: Partial<SpringPhysicsConfig>): Spring2DController;
/**
 * Spring presets with natural-feeling physics
 */
export declare const SpringPresets: {
    /**
     * Gentle spring - slow and soft
     */
    gentle: SpringPhysicsConfig;
    /**
     * Wobbly spring - bouncy with overshoot
     */
    wobbly: SpringPhysicsConfig;
    /**
     * Stiff spring - quick and responsive
     */
    stiff: SpringPhysicsConfig;
    /**
     * Slow spring - heavy and smooth
     */
    slow: SpringPhysicsConfig;
    /**
     * Molasses spring - very slow and heavy
     */
    molasses: SpringPhysicsConfig;
    /**
     * Default spring - balanced
     */
    default: SpringPhysicsConfig;
    /**
     * Snappy spring - quick with minimal overshoot
     */
    snappy: SpringPhysicsConfig;
    /**
     * Bouncy spring - lots of bounce
     */
    bouncy: SpringPhysicsConfig;
    /**
     * No overshoot - critically damped
     */
    noOvershoot: (stiffness?: number) => SpringPhysicsConfig;
    /**
     * Custom spring with tension/friction (React Spring compatible)
     */
    custom: (tension: number, friction: number) => SpringPhysicsConfig;
};
/**
 * Gesture spring for drag interactions
 */
export interface GestureSpringConfig extends SpringPhysicsConfig {
    /**
     * Resistance when dragging beyond bounds
     */
    rubberBandFactor?: number;
    /**
     * Bounds for the spring
     */
    bounds?: {
        min?: number;
        max?: number;
    };
    /**
     * Velocity multiplier for fling gestures
     */
    velocityMultiplier?: number;
    /**
     * Threshold velocity for fling detection
     */
    flingThreshold?: number;
}
/**
 * Gesture spring controller
 */
export interface GestureSpringController extends SpringController {
    /**
     * Start tracking a gesture
     */
    startGesture(): void;
    /**
     * Update during gesture with position and velocity
     */
    updateGesture(position: number, velocity: number): void;
    /**
     * End gesture and animate to rest
     */
    endGesture(velocity?: number): void;
    /**
     * Check if currently tracking a gesture
     */
    isGestureActive(): boolean;
}
/**
 * Create a gesture-aware spring
 */
export declare function createGestureSpring(initialValue?: number, config?: Partial<GestureSpringConfig>): GestureSpringController;
/**
 * Chain configuration
 */
export interface ChainConfig {
    /**
     * Number of springs in the chain
     */
    count: number;
    /**
     * Spring configuration for each link
     */
    spring: Partial<SpringPhysicsConfig>;
    /**
     * Delay between springs (creates trailing effect)
     */
    stagger?: number;
    /**
     * Damping multiplier per link (creates decay)
     */
    dampingDecay?: number;
}
/**
 * Create a chain of connected springs
 */
export declare function createSpringChain(initialValue: number, config: ChainConfig): SpringController[];
/**
 * Hook to use spring physics
 */
export declare function useSpring(target: number, config?: Partial<SpringPhysicsConfig>): Signal<number>;
/**
 * Hook to use 2D spring physics
 */
export declare function useSpring2D(targetX: number, targetY: number, config?: Partial<SpringPhysicsConfig>): {
    x: Signal<number>;
    y: Signal<number>;
};
export declare const Spring: {
    create: typeof createSpring;
    create2D: typeof createSpring2D;
    createGesture: typeof createGestureSpring;
    createChain: typeof createSpringChain;
    presets: {
        /**
         * Gentle spring - slow and soft
         */
        gentle: SpringPhysicsConfig;
        /**
         * Wobbly spring - bouncy with overshoot
         */
        wobbly: SpringPhysicsConfig;
        /**
         * Stiff spring - quick and responsive
         */
        stiff: SpringPhysicsConfig;
        /**
         * Slow spring - heavy and smooth
         */
        slow: SpringPhysicsConfig;
        /**
         * Molasses spring - very slow and heavy
         */
        molasses: SpringPhysicsConfig;
        /**
         * Default spring - balanced
         */
        default: SpringPhysicsConfig;
        /**
         * Snappy spring - quick with minimal overshoot
         */
        snappy: SpringPhysicsConfig;
        /**
         * Bouncy spring - lots of bounce
         */
        bouncy: SpringPhysicsConfig;
        /**
         * No overshoot - critically damped
         */
        noOvershoot: (stiffness?: number) => SpringPhysicsConfig;
        /**
         * Custom spring with tension/friction (React Spring compatible)
         */
        custom: (tension: number, friction: number) => SpringPhysicsConfig;
    };
    useSpring: typeof useSpring;
    useSpring2D: typeof useSpring2D;
};
export default Spring;
//# sourceMappingURL=spring.d.ts.map