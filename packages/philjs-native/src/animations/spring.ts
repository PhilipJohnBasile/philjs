/**
 * Spring Physics Animations
 *
 * Advanced spring physics for natural-feeling animations.
 */

import { signal, effect, type Signal } from 'philjs-core';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Default Configuration
// ============================================================================

const defaultConfig: SpringPhysicsConfig = {
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
export function createSpring(
  initialValue: number = 0,
  config: Partial<SpringPhysicsConfig> = {}
): SpringController {
  const cfg = { ...defaultConfig, ...config };

  // State
  let position = initialValue;
  let velocity = cfg.velocity || 0;
  let target = initialValue;
  let animationId: number | null = null;
  let lastTime: number | null = null;

  // Reactive signal for position
  const positionSignal = signal(position);

  // Subscribers
  const subscribers = new Set<(state: SpringState) => void>();

  /**
   * Notify all subscribers
   */
  function notify(): void {
    const state = getState();
    subscribers.forEach(callback => callback(state));
  }

  /**
   * Get current state
   */
  function getState(): SpringState {
    return {
      position,
      velocity,
      atRest: isAtRest(),
    };
  }

  /**
   * Check if at rest
   */
  function isAtRest(): boolean {
    return (
      Math.abs(velocity) < cfg.precision! &&
      Math.abs(position - target) < cfg.precision!
    );
  }

  /**
   * Animation frame callback
   */
  function animate(timestamp: number): void {
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
      } else if (displacement < 0 && position > target) {
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
    } else {
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

    setTarget(newTarget: number): void {
      target = newTarget;
      if (animationId === null && !isAtRest()) {
        lastTime = null;
        animationId = requestAnimationFrame(animate);
      }
    },

    setPosition(newPosition: number): void {
      position = newPosition;
      velocity = 0;
      positionSignal.set(position);
      notify();
    },

    addVelocity(impulse: number): void {
      velocity += impulse;
      if (animationId === null) {
        lastTime = null;
        animationId = requestAnimationFrame(animate);
      }
    },

    start(): void {
      if (animationId === null && !isAtRest()) {
        lastTime = null;
        animationId = requestAnimationFrame(animate);
      }
    },

    stop(): void {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
        lastTime = null;
      }
    },

    isAtRest,

    subscribe(callback: (state: SpringState) => void): () => void {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },

    position: positionSignal,
  };
}

// ============================================================================
// Spring 2D
// ============================================================================

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
export function createSpring2D(
  initialX: number = 0,
  initialY: number = 0,
  config: Partial<SpringPhysicsConfig> = {}
): Spring2DController {
  const springX = createSpring(initialX, config);
  const springY = createSpring(initialY, config);

  const subscribers = new Set<(state: Spring2DState) => void>();

  function getState(): Spring2DState {
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

  function notify(): void {
    const state = getState();
    subscribers.forEach(callback => callback(state));
  }

  // Subscribe to both springs
  springX.subscribe(() => notify());
  springY.subscribe(() => notify());

  return {
    getState,

    setTarget(x: number, y: number): void {
      springX.setTarget(x);
      springY.setTarget(y);
    },

    setPosition(x: number, y: number): void {
      springX.setPosition(x);
      springY.setPosition(y);
    },

    addVelocity(vx: number, vy: number): void {
      springX.addVelocity(vx);
      springY.addVelocity(vy);
    },

    start(): void {
      springX.start();
      springY.start();
    },

    stop(): void {
      springX.stop();
      springY.stop();
    },

    isAtRest(): boolean {
      return springX.isAtRest() && springY.isAtRest();
    },

    subscribe(callback: (state: Spring2DState) => void): () => void {
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
function criticalDamping(stiffness: number, mass: number): number {
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
  } as SpringPhysicsConfig,

  /**
   * Wobbly spring - bouncy with overshoot
   */
  wobbly: {
    mass: 1,
    stiffness: 180,
    damping: 12,
  } as SpringPhysicsConfig,

  /**
   * Stiff spring - quick and responsive
   */
  stiff: {
    mass: 1,
    stiffness: 210,
    damping: 20,
  } as SpringPhysicsConfig,

  /**
   * Slow spring - heavy and smooth
   */
  slow: {
    mass: 1,
    stiffness: 280,
    damping: 60,
  } as SpringPhysicsConfig,

  /**
   * Molasses spring - very slow and heavy
   */
  molasses: {
    mass: 1,
    stiffness: 280,
    damping: 120,
  } as SpringPhysicsConfig,

  /**
   * Default spring - balanced
   */
  default: {
    mass: 1,
    stiffness: 170,
    damping: 26,
  } as SpringPhysicsConfig,

  /**
   * Snappy spring - quick with minimal overshoot
   */
  snappy: {
    mass: 1,
    stiffness: 400,
    damping: 30,
  } as SpringPhysicsConfig,

  /**
   * Bouncy spring - lots of bounce
   */
  bouncy: {
    mass: 1,
    stiffness: 200,
    damping: 8,
  } as SpringPhysicsConfig,

  /**
   * No overshoot - critically damped
   */
  noOvershoot: (stiffness: number = 170): SpringPhysicsConfig => ({
    mass: 1,
    stiffness,
    damping: criticalDamping(stiffness, 1),
  }),

  /**
   * Custom spring with tension/friction (React Spring compatible)
   */
  custom: (tension: number, friction: number): SpringPhysicsConfig => ({
    mass: 1,
    stiffness: tension,
    damping: friction,
  }),
};

// ============================================================================
// Gesture Spring
// ============================================================================

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
export function createGestureSpring(
  initialValue: number = 0,
  config: Partial<GestureSpringConfig> = {}
): GestureSpringController {
  const {
    rubberBandFactor = 0.5,
    bounds,
    velocityMultiplier = 1,
    flingThreshold = 500,
    ...springConfig
  } = config;

  const spring = createSpring(initialValue, springConfig);
  let gestureActive = false;
  let gestureStartPosition = 0;

  /**
   * Apply rubber band effect for out-of-bounds positions
   */
  function applyRubberBand(position: number): number {
    if (!bounds) return position;

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
  function calculateSnapTarget(position: number, velocity: number): number {
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

    startGesture(): void {
      gestureActive = true;
      gestureStartPosition = spring.getState().position;
      spring.stop();
    },

    updateGesture(position: number, velocity: number): void {
      if (!gestureActive) return;

      const rubberBandedPosition = applyRubberBand(position);
      spring.setPosition(rubberBandedPosition);
    },

    endGesture(velocity: number = 0): void {
      if (!gestureActive) return;

      gestureActive = false;
      const currentPosition = spring.getState().position;
      const target = calculateSnapTarget(currentPosition, velocity);

      spring.addVelocity(velocity * velocityMultiplier);
      spring.setTarget(target);
    },

    isGestureActive(): boolean {
      return gestureActive;
    },
  };
}

// ============================================================================
// Chained Springs
// ============================================================================

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
export function createSpringChain(
  initialValue: number,
  config: ChainConfig
): SpringController[] {
  const springs: SpringController[] = [];

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
        } else {
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
export function useSpring(
  target: number,
  config: Partial<SpringPhysicsConfig> = {}
): Signal<number> {
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
export function useSpring2D(
  targetX: number,
  targetY: number,
  config: Partial<SpringPhysicsConfig> = {}
): { x: Signal<number>; y: Signal<number> } {
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
