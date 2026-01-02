/**
 * Animated API
 *
 * Animation primitives for native mobile animations.
 */

import { signal, type Signal } from '@philjs/core';

// ============================================================================
// Types
// ============================================================================

/**
 * Interpolation configuration
 */
export interface InterpolationConfig {
  inputRange: number[];
  outputRange: number[] | string[];
  extrapolate?: 'extend' | 'clamp' | 'identity';
  extrapolateLeft?: 'extend' | 'clamp' | 'identity';
  extrapolateRight?: 'extend' | 'clamp' | 'identity';
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: (t: number) => number;
  isInteraction?: boolean;
  useNativeDriver?: boolean;
}

/**
 * Spring configuration
 */
export interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
  velocity?: number;
  overshootClamping?: boolean;
  restSpeedThreshold?: number;
  restDisplacementThreshold?: number;
  toValue?: number;
  useNativeDriver?: boolean;
}

/**
 * Decay configuration
 */
export interface DecayConfig {
  velocity: number;
  deceleration?: number;
  useNativeDriver?: boolean;
}

/**
 * Animation result
 */
export interface AnimationResult {
  finished: boolean;
}

/**
 * Composite animation
 */
export interface CompositeAnimation {
  start: (callback?: (result: AnimationResult) => void) => void;
  stop: () => void;
  reset: () => void;
}

// ============================================================================
// Easing Functions
// ============================================================================

/**
 * Easing functions
 */
export const Easing = {
  linear: (t: number): number => t,

  quad: (t: number): number => t * t,

  cubic: (t: number): number => t * t * t,

  poly: (n: number) => (t: number): number => Math.pow(t, n),

  sin: (t: number): number => 1 - Math.cos((t * Math.PI) / 2),

  circle: (t: number): number => 1 - Math.sqrt(1 - t * t),

  exp: (t: number): number => Math.pow(2, 10 * (t - 1)),

  elastic: (bounciness: number = 1) => (t: number): number => {
    const p = bounciness * Math.PI;
    return 1 - Math.pow(Math.cos((t * Math.PI) / 2), 3) * Math.cos(t * p);
  },

  back: (s: number = 1.70158) => (t: number): number => {
    return t * t * ((s + 1) * t - s);
  },

  bounce: (t: number): number => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    }
    if (t < 2 / 2.75) {
      const t2 = t - 1.5 / 2.75;
      return 7.5625 * t2 * t2 + 0.75;
    }
    if (t < 2.5 / 2.75) {
      const t2 = t - 2.25 / 2.75;
      return 7.5625 * t2 * t2 + 0.9375;
    }
    const t2 = t - 2.625 / 2.75;
    return 7.5625 * t2 * t2 + 0.984375;
  },

  bezier: (x1: number, y1: number, x2: number, y2: number) => (t: number): number => {
    // Simplified cubic bezier implementation
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;

    function sampleCurveX(t: number): number {
      return ((ax * t + bx) * t + cx) * t;
    }

    function sampleCurveY(t: number): number {
      return ((ay * t + by) * t + cy) * t;
    }

    function solveCurveX(x: number): number {
      let t = x;
      for (let i = 0; i < 8; i++) {
        const diff = sampleCurveX(t) - x;
        if (Math.abs(diff) < 1e-6) return t;
        const d = (3 * ax * t + 2 * bx) * t + cx;
        if (Math.abs(d) < 1e-6) break;
        t -= diff / d;
      }
      return t;
    }

    return sampleCurveY(solveCurveX(t));
  },

  in: (easing: (t: number) => number) => easing,

  out: (easing: (t: number) => number) => (t: number): number => {
    return 1 - easing(1 - t);
  },

  inOut: (easing: (t: number) => number) => (t: number): number => {
    if (t < 0.5) {
      return easing(t * 2) / 2;
    }
    return 1 - easing((1 - t) * 2) / 2;
  },
};

// ============================================================================
// AnimatedValue
// ============================================================================

/**
 * Animated value class
 */
export class AnimatedValue {
  private value: Signal<number>;
  private offset = 0;
  private listeners = new Set<(value: number) => void>();
  private animationId: number | null = null;

  constructor(initialValue: number = 0) {
    this.value = signal(initialValue);
  }

  getValue(): number {
    return this.value() + this.offset;
  }

  setValue(value: number): void {
    this.stopAnimation();
    this.value.set(value - this.offset);
    this.notifyListeners();
  }

  setOffset(offset: number): void {
    this.offset = offset;
  }

  flattenOffset(): void {
    this.value.set(this.value() + this.offset);
    this.offset = 0;
  }

  extractOffset(): void {
    this.offset += this.value();
    this.value.set(0);
  }

  addListener(callback: (value: { value: number }) => void): string {
    const wrappedCallback = (v: number) => callback({ value: v });
    this.listeners.add(wrappedCallback);
    return String(this.listeners.size);
  }

  removeListener(id: string): void {
    // Simplified - in real impl would track by ID
  }

  removeAllListeners(): void {
    this.listeners.clear();
  }

  stopAnimation(callback?: (value: number) => void): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    callback?.(this.getValue());
  }

  resetAnimation(callback?: (value: number) => void): void {
    this.stopAnimation(callback);
    this.value.set(0);
    this.offset = 0;
  }

  interpolate(config: InterpolationConfig): AnimatedInterpolation {
    return new AnimatedInterpolation(this, config);
  }

  private notifyListeners(): void {
    const value = this.getValue();
    this.listeners.forEach((listener) => listener(value));
  }

  // Internal method for animations
  _animate(
    toValue: number,
    duration: number,
    easing: (t: number) => number,
    callback?: (result: AnimationResult) => void
  ): void {
    const startValue = this.value();
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      this.value.set(startValue + (toValue - startValue) * easedProgress);
      this.notifyListeners();

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.animationId = null;
        callback?.({ finished: true });
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  // Internal getters
  _getValue(): number {
    return this.value();
  }

  _getSignal(): Signal<number> {
    return this.value;
  }
}

// ============================================================================
// AnimatedValueXY
// ============================================================================

/**
 * Animated 2D value class
 */
export class AnimatedValueXY {
  x: AnimatedValue;
  y: AnimatedValue;

  constructor(value?: { x?: number; y?: number }) {
    this.x = new AnimatedValue(value?.x ?? 0);
    this.y = new AnimatedValue(value?.y ?? 0);
  }

  setValue(value: { x: number; y: number }): void {
    this.x.setValue(value.x);
    this.y.setValue(value.y);
  }

  setOffset(offset: { x: number; y: number }): void {
    this.x.setOffset(offset.x);
    this.y.setOffset(offset.y);
  }

  flattenOffset(): void {
    this.x.flattenOffset();
    this.y.flattenOffset();
  }

  extractOffset(): void {
    this.x.extractOffset();
    this.y.extractOffset();
  }

  addListener(callback: (value: { x: number; y: number }) => void): string {
    const xListener = this.x.addListener(() => {
      callback({ x: this.x.getValue(), y: this.y.getValue() });
    });
    const yListener = this.y.addListener(() => {
      callback({ x: this.x.getValue(), y: this.y.getValue() });
    });
    return `${xListener}-${yListener}`;
  }

  removeListener(id: string): void {
    const [xId, yId] = id.split('-');
    this.x.removeListener(xId!);
    this.y.removeListener(yId!);
  }

  removeAllListeners(): void {
    this.x.removeAllListeners();
    this.y.removeAllListeners();
  }

  stopAnimation(callback?: (value: { x: number; y: number }) => void): void {
    this.x.stopAnimation();
    this.y.stopAnimation();
    callback?.({ x: this.x.getValue(), y: this.y.getValue() });
  }

  resetAnimation(callback?: (value: { x: number; y: number }) => void): void {
    this.x.resetAnimation();
    this.y.resetAnimation();
    callback?.({ x: this.x.getValue(), y: this.y.getValue() });
  }

  getLayout(): { left: AnimatedValue; top: AnimatedValue } {
    return { left: this.x, top: this.y };
  }

  getTranslateTransform(): Array<{ translateX: AnimatedValue } | { translateY: AnimatedValue }> {
    return [{ translateX: this.x }, { translateY: this.y }];
  }
}

// ============================================================================
// AnimatedInterpolation
// ============================================================================

/**
 * Animated interpolation class
 */
export class AnimatedInterpolation {
  private parent: AnimatedValue;
  private config: InterpolationConfig;

  constructor(parent: AnimatedValue, config: InterpolationConfig) {
    this.parent = parent;
    this.config = config;
  }

  getValue(): number | string {
    const input = this.parent.getValue();
    return this._interpolateValue(input);
  }

  private _interpolateValue(input: number): number | string {
    const { inputRange, outputRange, extrapolate = 'extend' } = this.config;

    // Find the segment
    let i = 0;
    for (; i < inputRange.length - 1; i++) {
      if (input < inputRange[i + 1]!) break;
    }

    const inputMin = inputRange[i]!;
    const inputMax = inputRange[i + 1] ?? inputMin;
    const outputMin = outputRange[i]!;
    const outputMax = outputRange[i + 1] ?? outputMin;

    // Calculate progress
    let progress = inputMax !== inputMin ? (input - inputMin) / (inputMax - inputMin) : 0;

    // Apply extrapolation
    if (progress < 0) {
      if (extrapolate === 'clamp') progress = 0;
      else if (extrapolate === 'identity') return input;
    } else if (progress > 1) {
      if (extrapolate === 'clamp') progress = 1;
      else if (extrapolate === 'identity') return input;
    }

    // Interpolate
    if (typeof outputMin === 'string' || typeof outputMax === 'string') {
      // Color or string interpolation (simplified)
      return progress < 0.5 ? outputMin : outputMax;
    }

    return outputMin + (outputMax - outputMin) * progress;
  }

  interpolate(config: InterpolationConfig): AnimatedInterpolation {
    // Chain interpolations
    return new AnimatedInterpolation(this.parent, {
      ...this.config,
      ...config,
    });
  }
}

// ============================================================================
// Animation Functions
// ============================================================================

/**
 * Timing animation
 */
export function timing(
  value: AnimatedValue,
  config: AnimationConfig & { toValue: number }
): CompositeAnimation {
  const { toValue, duration = 300, easing = Easing.inOut(Easing.quad), delay = 0 } = config;

  return {
    start(callback?: (result: AnimationResult) => void): void {
      if (delay > 0) {
        setTimeout(() => {
          value._animate(toValue, duration, easing, callback);
        }, delay);
      } else {
        value._animate(toValue, duration, easing, callback);
      }
    },
    stop(): void {
      value.stopAnimation();
    },
    reset(): void {
      value.resetAnimation();
    },
  };
}

/**
 * Spring animation
 */
export function spring(
  value: AnimatedValue,
  config: SpringConfig & { toValue: number }
): CompositeAnimation {
  const {
    toValue,
    stiffness = 100,
    damping = 10,
    mass = 1,
    velocity: initialVelocity = 0,
  } = config;

  let animationId: number | null = null;
  let position = value._getValue();
  let velocity = initialVelocity;
  let lastTime: number | null = null;

  const precision = 0.01;

  function isAtRest(): boolean {
    return Math.abs(velocity) < precision && Math.abs(position - toValue) < precision;
  }

  return {
    start(callback?: (result: AnimationResult) => void): void {
      position = value._getValue();

      function animate(time: number): void {
        if (lastTime === null) {
          lastTime = time;
          animationId = requestAnimationFrame(animate);
          return;
        }

        const deltaTime = Math.min((time - lastTime) / 1000, 0.064);
        lastTime = time;

        const displacement = position - toValue;
        const springForce = -stiffness * displacement;
        const dampingForce = -damping * velocity;
        const force = springForce + dampingForce;
        const acceleration = force / mass;

        velocity += acceleration * deltaTime;
        position += velocity * deltaTime;

        value.setValue(position);

        if (!isAtRest()) {
          animationId = requestAnimationFrame(animate);
        } else {
          value.setValue(toValue);
          animationId = null;
          callback?.({ finished: true });
        }
      }

      animationId = requestAnimationFrame(animate);
    },
    stop(): void {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },
    reset(): void {
      this.stop();
      position = value._getValue();
      velocity = 0;
    },
  };
}

/**
 * Decay animation
 */
export function decay(value: AnimatedValue, config: DecayConfig): CompositeAnimation {
  const { velocity: initialVelocity, deceleration = 0.998 } = config;

  let animationId: number | null = null;
  let velocity = initialVelocity;
  let lastTime: number | null = null;

  return {
    start(callback?: (result: AnimationResult) => void): void {
      velocity = initialVelocity;

      function animate(time: number): void {
        if (lastTime === null) {
          lastTime = time;
          animationId = requestAnimationFrame(animate);
          return;
        }

        const deltaTime = (time - lastTime) / 1000;
        lastTime = time;

        const position = value._getValue() + velocity * deltaTime;
        velocity *= Math.pow(deceleration, deltaTime * 1000);

        value.setValue(position);

        if (Math.abs(velocity) > 0.1) {
          animationId = requestAnimationFrame(animate);
        } else {
          animationId = null;
          callback?.({ finished: true });
        }
      }

      animationId = requestAnimationFrame(animate);
    },
    stop(): void {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },
    reset(): void {
      this.stop();
      velocity = 0;
    },
  };
}

// ============================================================================
// Composite Animations
// ============================================================================

/**
 * Run animations in sequence
 */
export function sequence(animations: CompositeAnimation[]): CompositeAnimation {
  let current = 0;

  return {
    start(callback?: (result: AnimationResult) => void): void {
      const runNext = () => {
        if (current >= animations.length) {
          callback?.({ finished: true });
          return;
        }

        animations[current]!.start((result) => {
          if (result.finished) {
            current++;
            runNext();
          } else {
            callback?.({ finished: false });
          }
        });
      };

      runNext();
    },
    stop(): void {
      if (current < animations.length) {
        animations[current]!.stop();
      }
    },
    reset(): void {
      current = 0;
      animations.forEach((anim) => anim.reset());
    },
  };
}

/**
 * Run animations in parallel
 */
export function parallel(
  animations: CompositeAnimation[],
  config?: { stopTogether?: boolean }
): CompositeAnimation {
  const { stopTogether = true } = config || {};

  return {
    start(callback?: (result: AnimationResult) => void): void {
      let completed = 0;
      let stopped = false;

      animations.forEach((anim) => {
        anim.start((result) => {
          completed++;
          if (!result.finished && stopTogether && !stopped) {
            stopped = true;
            animations.forEach((a) => a.stop());
            callback?.({ finished: false });
          } else if (completed === animations.length && !stopped) {
            callback?.({ finished: true });
          }
        });
      });
    },
    stop(): void {
      animations.forEach((anim) => anim.stop());
    },
    reset(): void {
      animations.forEach((anim) => anim.reset());
    },
  };
}

/**
 * Run animations with staggered start times
 */
export function stagger(delay: number, animations: CompositeAnimation[]): CompositeAnimation {
  return parallel(
    animations.map((anim, i) => ({
      start(callback?: (result: AnimationResult) => void): void {
        setTimeout(() => anim.start(callback), delay * i);
      },
      stop: anim.stop.bind(anim),
      reset: anim.reset.bind(anim),
    }))
  );
}

/**
 * Loop an animation
 */
export function loop(
  animation: CompositeAnimation,
  config?: { iterations?: number; resetBeforeIteration?: boolean }
): CompositeAnimation {
  const { iterations = -1, resetBeforeIteration = true } = config || {};
  let current = 0;
  let stopped = false;

  return {
    start(callback?: (result: AnimationResult) => void): void {
      stopped = false;

      const runIteration = () => {
        if (stopped) {
          callback?.({ finished: false });
          return;
        }

        if (iterations !== -1 && current >= iterations) {
          callback?.({ finished: true });
          return;
        }

        if (resetBeforeIteration && current > 0) {
          animation.reset();
        }

        current++;
        animation.start((result) => {
          if (result.finished) {
            runIteration();
          } else {
            callback?.({ finished: false });
          }
        });
      };

      runIteration();
    },
    stop(): void {
      stopped = true;
      animation.stop();
    },
    reset(): void {
      current = 0;
      animation.reset();
    },
  };
}

// ============================================================================
// Math Operations
// ============================================================================

/**
 * Add animated values
 */
export function add(a: AnimatedValue, b: AnimatedValue | number): AnimatedValue {
  const result = new AnimatedValue(0);
  const bValue = typeof b === 'number' ? b : b._getValue();
  result.setValue(a._getValue() + bValue);
  return result;
}

/**
 * Subtract animated values
 */
export function subtract(a: AnimatedValue, b: AnimatedValue | number): AnimatedValue {
  const result = new AnimatedValue(0);
  const bValue = typeof b === 'number' ? b : b._getValue();
  result.setValue(a._getValue() - bValue);
  return result;
}

/**
 * Multiply animated values
 */
export function multiply(a: AnimatedValue, b: AnimatedValue | number): AnimatedValue {
  const result = new AnimatedValue(0);
  const bValue = typeof b === 'number' ? b : b._getValue();
  result.setValue(a._getValue() * bValue);
  return result;
}

/**
 * Divide animated values
 */
export function divide(a: AnimatedValue, b: AnimatedValue | number): AnimatedValue {
  const result = new AnimatedValue(0);
  const bValue = typeof b === 'number' ? b : b._getValue();
  result.setValue(a._getValue() / bValue);
  return result;
}

/**
 * Modulo animated values
 */
export function modulo(a: AnimatedValue, modulus: number): AnimatedValue {
  const result = new AnimatedValue(0);
  result.setValue(((a._getValue() % modulus) + modulus) % modulus);
  return result;
}

/**
 * Clamp between min and max
 */
export function diffClamp(a: AnimatedValue, min: number, max: number): AnimatedValue {
  const result = new AnimatedValue(Math.min(Math.max(a._getValue(), min), max));
  return result;
}

// ============================================================================
// Event Handler
// ============================================================================

/**
 * Create an event handler for animated values
 */
export function event<T>(
  argMapping: Array<{ nativeEvent: Record<string, AnimatedValue | undefined> } | null>,
  config?: { listener?: (event: T) => void; useNativeDriver?: boolean }
): (event: T) => void {
  return (e: T) => {
    const nativeEvent = (e as unknown as { nativeEvent: Record<string, number> }).nativeEvent;

    argMapping.forEach((mapping) => {
      if (!mapping) return;

      Object.entries(mapping.nativeEvent).forEach(([key, animatedValue]) => {
        if (animatedValue && key in nativeEvent) {
          animatedValue.setValue(nativeEvent[key]!);
        }
      });
    });

    config?.listener?.(e);
  };
}

// ============================================================================
// Animated Components
// ============================================================================

/**
 * Create an animated component wrapper
 */
export function createAnimatedComponent<P extends Record<string, unknown>>(
  Component: (props: P) => unknown
): (props: P) => unknown {
  return (props: P) => {
    // In a real implementation, this would wrap the component
    // and handle animated style props
    return Component(props);
  };
}

// ============================================================================
// Animated Namespace
// ============================================================================

export const Animated = {
  Value: AnimatedValue,
  ValueXY: AnimatedValueXY,
  Interpolation: AnimatedInterpolation,
  timing,
  spring,
  decay,
  sequence,
  parallel,
  stagger,
  loop,
  add,
  subtract,
  multiply,
  divide,
  modulo,
  diffClamp,
  event,
  createAnimatedComponent,
  Easing,
};

export default Animated;
