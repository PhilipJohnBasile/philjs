/**
 * Spring Physics Animations
 *
 * Advanced spring physics for natural-feeling animations.
 */
import { signal, effect } from 'philjs-core';
// ============================================================================
// Default Configuration
// ============================================================================
const defaultConfig = {
    mass: 1,
    stiffness: 100,
    damping: 10,
    velocity: 0,
    clamp: false,
    precision: 0.01,
};
// ============================================================================
// Spring Implementation
// ============================================================================
/**
 * Create a spring physics controller
 */
export function createSpring(initialValue = 0, config = {}) {
    const cfg = { ...defaultConfig, ...config };
    // State
    let position = initialValue;
    let velocity = cfg.velocity || 0;
    let target = initialValue;
    let animationId = null;
    let lastTime = null;
    // Reactive signal for position
    const positionSignal = signal(position);
    // Subscribers
    const subscribers = new Set();
    /**
     * Notify all subscribers
     */
    function notify() {
        const state = getState();
        subscribers.forEach(callback => callback(state));
    }
    /**
     * Get current state
     */
    function getState() {
        return {
            position,
            velocity,
            atRest: isAtRest(),
        };
    }
    /**
     * Check if at rest
     */
    function isAtRest() {
        return (Math.abs(velocity) < cfg.precision &&
            Math.abs(position - target) < cfg.precision);
    }
    /**
     * Animation frame callback
     */
    function animate(timestamp) {
        if (lastTime === null) {
            lastTime = timestamp;
            animationId = requestAnimationFrame(animate);
            return;
        }
        // Calculate delta time in seconds, capped to prevent instability
        const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.064);
        lastTime = timestamp;
        // Spring physics calculation
        const displacement = position - target;
        // Spring force: F = -kx
        const springForce = -cfg.stiffness * displacement;
        // Damping force: F = -cv
        const dampingForce = -cfg.damping * velocity;
        // Total force
        const force = springForce + dampingForce;
        // Acceleration: a = F/m
        const acceleration = force / cfg.mass;
        // Update velocity and position using semi-implicit Euler
        velocity += acceleration * deltaTime;
        position += velocity * deltaTime;
        // Clamp if configured
        if (cfg.clamp) {
            if (displacement > 0 && position < target) {
                position = target;
                velocity = 0;
            }
            else if (displacement < 0 && position > target) {
                position = target;
                velocity = 0;
            }
        }
        // Update signal
        positionSignal.set(position);
        notify();
        // Continue animation if not at rest
        if (!isAtRest()) {
            animationId = requestAnimationFrame(animate);
        }
        else {
            // Snap to target when at rest
            position = target;
            velocity = 0;
            positionSignal.set(position);
            notify();
            animationId = null;
        }
    }
    return {
        getState,
        setTarget(newTarget) {
            target = newTarget;
            if (animationId === null && !isAtRest()) {
                lastTime = null;
                animationId = requestAnimationFrame(animate);
            }
        },
        setPosition(newPosition) {
            position = newPosition;
            velocity = 0;
            positionSignal.set(position);
            notify();
        },
        addVelocity(impulse) {
            velocity += impulse;
            if (animationId === null) {
                lastTime = null;
                animationId = requestAnimationFrame(animate);
            }
        },
        start() {
            if (animationId === null && !isAtRest()) {
                lastTime = null;
                animationId = requestAnimationFrame(animate);
            }
        },
        stop() {
            if (animationId !== null) {
                cancelAnimationFrame(animationId);
                animationId = null;
                lastTime = null;
            }
        },
        isAtRest,
        subscribe(callback) {
            subscribers.add(callback);
            return () => subscribers.delete(callback);
        },
        position: positionSignal,
    };
}
/**
 * Create a 2D spring physics controller
 */
export function createSpring2D(initialX = 0, initialY = 0, config = {}) {
    const springX = createSpring(initialX, config);
    const springY = createSpring(initialY, config);
    const subscribers = new Set();
    function getState() {
        const stateX = springX.getState();
        const stateY = springY.getState();
        return {
            x: stateX.position,
            y: stateY.position,
            velocityX: stateX.velocity,
            velocityY: stateY.velocity,
            atRest: stateX.atRest && stateY.atRest,
        };
    }
    function notify() {
        const state = getState();
        subscribers.forEach(callback => callback(state));
    }
    // Subscribe to both springs
    springX.subscribe(() => notify());
    springY.subscribe(() => notify());
    return {
        getState,
        setTarget(x, y) {
            springX.setTarget(x);
            springY.setTarget(y);
        },
        setPosition(x, y) {
            springX.setPosition(x);
            springY.setPosition(y);
        },
        addVelocity(vx, vy) {
            springX.addVelocity(vx);
            springY.addVelocity(vy);
        },
        start() {
            springX.start();
            springY.start();
        },
        stop() {
            springX.stop();
            springY.stop();
        },
        isAtRest() {
            return springX.isAtRest() && springY.isAtRest();
        },
        subscribe(callback) {
            subscribers.add(callback);
            return () => subscribers.delete(callback);
        },
        x: springX.position,
        y: springY.position,
    };
}
// ============================================================================
// Spring Presets
// ============================================================================
/**
 * Calculate damping ratio for critical damping
 */
function criticalDamping(stiffness, mass) {
    return 2 * Math.sqrt(stiffness * mass);
}
/**
 * Spring presets with natural-feeling physics
 */
export const SpringPresets = {
    /**
     * Gentle spring - slow and soft
     */
    gentle: {
        mass: 1,
        stiffness: 120,
        damping: 14,
    },
    /**
     * Wobbly spring - bouncy with overshoot
     */
    wobbly: {
        mass: 1,
        stiffness: 180,
        damping: 12,
    },
    /**
     * Stiff spring - quick and responsive
     */
    stiff: {
        mass: 1,
        stiffness: 210,
        damping: 20,
    },
    /**
     * Slow spring - heavy and smooth
     */
    slow: {
        mass: 1,
        stiffness: 280,
        damping: 60,
    },
    /**
     * Molasses spring - very slow and heavy
     */
    molasses: {
        mass: 1,
        stiffness: 280,
        damping: 120,
    },
    /**
     * Default spring - balanced
     */
    default: {
        mass: 1,
        stiffness: 170,
        damping: 26,
    },
    /**
     * Snappy spring - quick with minimal overshoot
     */
    snappy: {
        mass: 1,
        stiffness: 400,
        damping: 30,
    },
    /**
     * Bouncy spring - lots of bounce
     */
    bouncy: {
        mass: 1,
        stiffness: 200,
        damping: 8,
    },
    /**
     * No overshoot - critically damped
     */
    noOvershoot: (stiffness = 170) => ({
        mass: 1,
        stiffness,
        damping: criticalDamping(stiffness, 1),
    }),
    /**
     * Custom spring with tension/friction (React Spring compatible)
     */
    custom: (tension, friction) => ({
        mass: 1,
        stiffness: tension,
        damping: friction,
    }),
};
/**
 * Create a gesture-aware spring
 */
export function createGestureSpring(initialValue = 0, config = {}) {
    const { rubberBandFactor = 0.5, bounds, velocityMultiplier = 1, flingThreshold = 500, ...springConfig } = config;
    const spring = createSpring(initialValue, springConfig);
    let gestureActive = false;
    let gestureStartPosition = 0;
    /**
     * Apply rubber band effect for out-of-bounds positions
     */
    function applyRubberBand(position) {
        if (!bounds)
            return position;
        if (bounds.min !== undefined && position < bounds.min) {
            const overscroll = bounds.min - position;
            return bounds.min - overscroll * rubberBandFactor;
        }
        if (bounds.max !== undefined && position > bounds.max) {
            const overscroll = position - bounds.max;
            return bounds.max + overscroll * rubberBandFactor;
        }
        return position;
    }
    /**
     * Calculate snap target based on velocity
     */
    function calculateSnapTarget(position, velocity) {
        let target = position;
        // Add momentum based on velocity
        if (Math.abs(velocity) > flingThreshold) {
            const momentum = (velocity * velocityMultiplier) / (springConfig.stiffness || 100);
            target += momentum;
        }
        // Clamp to bounds
        if (bounds) {
            if (bounds.min !== undefined) {
                target = Math.max(target, bounds.min);
            }
            if (bounds.max !== undefined) {
                target = Math.min(target, bounds.max);
            }
        }
        return target;
    }
    return {
        ...spring,
        startGesture() {
            gestureActive = true;
            gestureStartPosition = spring.getState().position;
            spring.stop();
        },
        updateGesture(position, velocity) {
            if (!gestureActive)
                return;
            const rubberBandedPosition = applyRubberBand(position);
            spring.setPosition(rubberBandedPosition);
        },
        endGesture(velocity = 0) {
            if (!gestureActive)
                return;
            gestureActive = false;
            const currentPosition = spring.getState().position;
            const target = calculateSnapTarget(currentPosition, velocity);
            spring.addVelocity(velocity * velocityMultiplier);
            spring.setTarget(target);
        },
        isGestureActive() {
            return gestureActive;
        },
    };
}
/**
 * Create a chain of connected springs
 */
export function createSpringChain(initialValue, config) {
    const springs = [];
    for (let i = 0; i < config.count; i++) {
        const damping = config.spring.damping || 10;
        const dampingMultiplier = config.dampingDecay
            ? Math.pow(config.dampingDecay, i)
            : 1;
        const spring = createSpring(initialValue, {
            ...config.spring,
            damping: damping * dampingMultiplier,
        });
        springs.push(spring);
        // Link to previous spring
        if (i > 0) {
            const prevSpring = springs[i - 1];
            const stagger = config.stagger || 0;
            prevSpring.subscribe((state) => {
                if (stagger > 0) {
                    setTimeout(() => {
                        spring.setTarget(state.position);
                    }, stagger);
                }
                else {
                    spring.setTarget(state.position);
                }
            });
        }
    }
    return springs;
}
// ============================================================================
// useSpring Hook
// ============================================================================
/**
 * Hook to use spring physics
 */
export function useSpring(target, config = {}) {
    const spring = createSpring(target, config);
    // Update target when it changes
    effect(() => {
        spring.setTarget(target);
    });
    return spring.position;
}
/**
 * Hook to use 2D spring physics
 */
export function useSpring2D(targetX, targetY, config = {}) {
    const spring = createSpring2D(targetX, targetY, config);
    // Update targets when they change
    effect(() => {
        spring.setTarget(targetX, targetY);
    });
    return { x: spring.x, y: spring.y };
}
// ============================================================================
// Export All
// ============================================================================
export const Spring = {
    create: createSpring,
    create2D: createSpring2D,
    createGesture: createGestureSpring,
    createChain: createSpringChain,
    presets: SpringPresets,
    useSpring,
    useSpring2D,
};
export default Spring;
//# sourceMappingURL=spring.js.map