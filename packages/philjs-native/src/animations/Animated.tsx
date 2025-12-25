/**
 * Animated API
 *
 * A library for creating fluid, performant animations.
 * Similar to React Native's Animated API.
 */

import { signal, effect, batch, type Signal } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Interpolation configuration
 */
export interface InterpolationConfig {
  inputRange: number[];
  outputRange: (number | string)[];
  extrapolate?: 'extend' | 'clamp' | 'identity';
  extrapolateLeft?: 'extend' | 'clamp' | 'identity';
  extrapolateRight?: 'extend' | 'clamp' | 'identity';
  easing?: (t: number) => number;
}

/**
 * Animation configuration
 */
export interface AnimationConfig {
  toValue: number | AnimatedValue;
  duration?: number;
  delay?: number;
  easing?: (t: number) => number;
  useNativeDriver?: boolean;
  isInteraction?: boolean;
  onComplete?: (result: { finished: boolean }) => void;
}

/**
 * Spring animation configuration
 */
export interface SpringConfig {
  toValue: number | AnimatedValue;
  friction?: number;
  tension?: number;
  speed?: number;
  bounciness?: number;
  stiffness?: number;
  damping?: number;
  mass?: number;
  velocity?: number;
  overshootClamping?: boolean;
  restDisplacementThreshold?: number;
  restSpeedThreshold?: number;
  delay?: number;
  useNativeDriver?: boolean;
  isInteraction?: boolean;
  onComplete?: (result: { finished: boolean }) => void;
}

/**
 * Decay animation configuration
 */
export interface DecayConfig {
  velocity: number | { x: number; y: number };
  deceleration?: number;
  useNativeDriver?: boolean;
  isInteraction?: boolean;
  onComplete?: (result: { finished: boolean }) => void;
}

/**
 * Animation callback result
 */
export interface AnimationResult {
  finished: boolean;
}

/**
 * Composite animation type
 */
export interface CompositeAnimation {
  start: (callback?: (result: AnimationResult) => void) => void;
  stop: () => void;
  reset: () => void;
}

// ============================================================================
// Easing Functions
// ============================================================================

export const Easing = {
  /**
   * Linear easing
   */
  linear: (t: number): number => t,

  /**
   * Quadratic easing
   */
  quad: (t: number): number => t * t,

  /**
   * Cubic easing
   */
  cubic: (t: number): number => t * t * t,

  /**
   * Polynomial easing
   */
  poly: (n: number) => (t: number): number => Math.pow(t, n),

  /**
   * Sine easing
   */
  sin: (t: number): number => 1 - Math.cos((t * Math.PI) / 2),

  /**
   * Circle easing
   */
  circle: (t: number): number => 1 - Math.sqrt(1 - t * t),

  /**
   * Exponential easing
   */
  exp: (t: number): number => Math.pow(2, 10 * (t - 1)),

  /**
   * Elastic easing
   */
  elastic: (bounciness: number = 1) => (t: number): number => {
    const p = bounciness * Math.PI;
    return 1 - Math.pow(Math.cos((t * Math.PI) / 2), 3) * Math.cos(t * p);
  },

  /**
   * Back easing
   */
  back: (s: number = 1.70158) => (t: number): number => {
    return t * t * ((s + 1) * t - s);
  },

  /**
   * Bounce easing
   */
  bounce: (t: number): number => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      const t2 = t - 1.5 / 2.75;
      return 7.5625 * t2 * t2 + 0.75;
    } else if (t < 2.5 / 2.75) {
      const t2 = t - 2.25 / 2.75;
      return 7.5625 * t2 * t2 + 0.9375;
    }
    const t2 = t - 2.625 / 2.75;
    return 7.5625 * t2 * t2 + 0.984375;
  },

  /**
   * Bezier easing
   */
  bezier: (x1: number, y1: number, x2: number, y2: number) => {
    const NEWTON_ITERATIONS = 4;
    const NEWTON_MIN_SLOPE = 0.001;
    const SUBDIVISION_PRECISION = 0.0000001;
    const SUBDIVISION_MAX_ITERATIONS = 10;

    const kSplineTableSize = 11;
    const kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

    const sampleValues = new Float32Array(kSplineTableSize);
    for (let i = 0; i < kSplineTableSize; ++i) {
      sampleValues[i] = calcBezier(i * kSampleStepSize, x1, x2);
    }

    function calcBezier(t: number, a1: number, a2: number): number {
      return ((1 - 3 * a2 + 3 * a1) * t + (3 * a2 - 6 * a1)) * t * t + 3 * a1 * t;
    }

    function getSlope(t: number, a1: number, a2: number): number {
      return 3 * (1 - 3 * a2 + 3 * a1) * t * t + 2 * (3 * a2 - 6 * a1) * t + 3 * a1;
    }

    function binarySubdivide(x: number, a: number, b: number): number {
      let currentX, currentT;
      let i = 0;
      do {
        currentT = a + (b - a) / 2;
        currentX = calcBezier(currentT, x1, x2) - x;
        if (currentX > 0) {
          b = currentT;
        } else {
          a = currentT;
        }
      } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
      return currentT;
    }

    function newtonRaphsonIterate(x: number, guessT: number): number {
      for (let i = 0; i < NEWTON_ITERATIONS; ++i) {
        const currentSlope = getSlope(guessT, x1, x2);
        if (currentSlope === 0) return guessT;
        const currentX = calcBezier(guessT, x1, x2) - x;
        guessT -= currentX / currentSlope;
      }
      return guessT;
    }

    return (x: number): number => {
      if (x === 0 || x === 1) return x;

      let intervalStart = 0;
      let currentSample = 1;
      const lastSample = kSplineTableSize - 1;

      for (; currentSample !== lastSample && sampleValues[currentSample] <= x; ++currentSample) {
        intervalStart += kSampleStepSize;
      }
      --currentSample;

      const dist = (x - sampleValues[currentSample]) /
        (sampleValues[currentSample + 1] - sampleValues[currentSample]);
      const guessForT = intervalStart + dist * kSampleStepSize;
      const initialSlope = getSlope(guessForT, x1, x2);

      let t: number;
      if (initialSlope >= NEWTON_MIN_SLOPE) {
        t = newtonRaphsonIterate(x, guessForT);
      } else if (initialSlope === 0) {
        t = guessForT;
      } else {
        t = binarySubdivide(x, intervalStart, intervalStart + kSampleStepSize);
      }

      return calcBezier(t, y1, y2);
    };
  },

  /**
   * Ease in
   */
  in: (easing: (t: number) => number) => easing,

  /**
   * Ease out
   */
  out: (easing: (t: number) => number) => (t: number): number => 1 - easing(1 - t),

  /**
   * Ease in-out
   */
  inOut: (easing: (t: number) => number) => (t: number): number => {
    if (t < 0.5) {
      return easing(t * 2) / 2;
    }
    return 1 - easing((1 - t) * 2) / 2;
  },

  /**
   * Standard easing presets
   */
  ease: (): ((t: number) => number) => Easing.bezier(0.25, 0.1, 0.25, 1),
  easeIn: (): ((t: number) => number) => Easing.bezier(0.42, 0, 1, 1),
  easeOut: (): ((t: number) => number) => Easing.bezier(0, 0, 0.58, 1),
  easeInOut: (): ((t: number) => number) => Easing.bezier(0.42, 0, 0.58, 1),
};

// ============================================================================
// AnimatedValue Class
// ============================================================================

/**
 * Animated value that can be animated
 */
export class AnimatedValue {
  private _value: Signal<number>;
  private _offset: number = 0;
  private _animation: number | null = null;
  private _listeners: Map<string, (value: number) => void> = new Map();
  private _listenerIdCounter = 0;

  constructor(value: number = 0) {
    this._value = signal(value);
  }

  /**
   * Get the current value
   */
  getValue(): number {
    return this._value() + this._offset;
  }

  /**
   * Set the value directly
   */
  setValue(value: number): void {
    if (this._animation !== null) {
      cancelAnimationFrame(this._animation);
      this._animation = null;
    }
    this._value.set(value);
    this._notifyListeners();
  }

  /**
   * Set offset
   */
  setOffset(offset: number): void {
    this._offset = offset;
  }

  /**
   * Flatten offset into value
   */
  flattenOffset(): void {
    this._value.set(this._value() + this._offset);
    this._offset = 0;
  }

  /**
   * Extract offset
   */
  extractOffset(): void {
    this._offset = this._value();
    this._value.set(0);
  }

  /**
   * Add listener
   */
  addListener(callback: (value: { value: number }) => void): string {
    const id = String(++this._listenerIdCounter);
    this._listeners.set(id, (value) => callback({ value }));
    return id;
  }

  /**
   * Remove listener
   */
  removeListener(id: string): void {
    this._listeners.delete(id);
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this._listeners.clear();
  }

  /**
   * Notify all listeners
   */
  private _notifyListeners(): void {
    const value = this.getValue();
    this._listeners.forEach(listener => listener(value));
  }

  /**
   * Stop any running animation
   */
  stopAnimation(callback?: (value: number) => void): void {
    if (this._animation !== null) {
      cancelAnimationFrame(this._animation);
      this._animation = null;
    }
    callback?.(this.getValue());
  }

  /**
   * Reset animation
   */
  resetAnimation(callback?: (value: number) => void): void {
    this.stopAnimation(callback);
  }

  /**
   * Interpolate value
   */
  interpolate(config: InterpolationConfig): AnimatedInterpolation {
    return new AnimatedInterpolation(this, config);
  }

  /**
   * Internal: Set animation frame ID
   */
  _setAnimation(id: number | null): void {
    this._animation = id;
  }

  /**
   * Internal: Get signal for tracking
   */
  _getSignal(): Signal<number> {
    return this._value;
  }
}

// ============================================================================
// AnimatedValueXY Class
// ============================================================================

/**
 * Animated 2D value
 */
export class AnimatedValueXY {
  x: AnimatedValue;
  y: AnimatedValue;

  constructor(value: { x: number; y: number } = { x: 0, y: 0 }) {
    this.x = new AnimatedValue(value.x);
    this.y = new AnimatedValue(value.y);
  }

  /**
   * Set value
   */
  setValue(value: { x: number; y: number }): void {
    this.x.setValue(value.x);
    this.y.setValue(value.y);
  }

  /**
   * Set offset
   */
  setOffset(offset: { x: number; y: number }): void {
    this.x.setOffset(offset.x);
    this.y.setOffset(offset.y);
  }

  /**
   * Flatten offset
   */
  flattenOffset(): void {
    this.x.flattenOffset();
    this.y.flattenOffset();
  }

  /**
   * Extract offset
   */
  extractOffset(): void {
    this.x.extractOffset();
    this.y.extractOffset();
  }

  /**
   * Get layout for styling
   */
  getLayout(): { left: AnimatedValue; top: AnimatedValue } {
    return {
      left: this.x,
      top: this.y,
    };
  }

  /**
   * Get translate transform
   */
  getTranslateTransform(): { translateX: AnimatedValue; translateY: AnimatedValue }[] {
    return [
      { translateX: this.x },
      { translateY: this.y },
    ];
  }

  /**
   * Stop animation
   */
  stopAnimation(callback?: (value: { x: number; y: number }) => void): void {
    this.x.stopAnimation();
    this.y.stopAnimation();
    callback?.({
      x: this.x.getValue(),
      y: this.y.getValue(),
    });
  }

  /**
   * Add listener
   */
  addListener(callback: (value: { x: number; y: number }) => void): string {
    const xId = this.x.addListener(() => {
      callback({ x: this.x.getValue(), y: this.y.getValue() });
    });
    const yId = this.y.addListener(() => {
      callback({ x: this.x.getValue(), y: this.y.getValue() });
    });
    return `${xId}_${yId}`;
  }

  /**
   * Remove listener
   */
  removeListener(id: string): void {
    const [xId, yId] = id.split('_');
    this.x.removeListener(xId);
    this.y.removeListener(yId);
  }
}

// ============================================================================
// AnimatedInterpolation Class
// ============================================================================

/**
 * Interpolated animated value
 */
export class AnimatedInterpolation {
  private _parent: AnimatedValue;
  private _config: InterpolationConfig;

  constructor(parent: AnimatedValue, config: InterpolationConfig) {
    this._parent = parent;
    this._config = config;
  }

  /**
   * Get interpolated value
   */
  getValue(): number | string {
    return this._interpolate(this._parent.getValue());
  }

  /**
   * Interpolate based on config
   */
  private _interpolate(input: number): number | string {
    const { inputRange, outputRange, extrapolate, extrapolateLeft, extrapolateRight, easing } = this._config;

    // Find the range segment
    let rangeIndex = 0;
    for (let i = 1; i < inputRange.length - 1; i++) {
      if (inputRange[i] < input) {
        rangeIndex = i;
      }
    }

    const inputMin = inputRange[rangeIndex];
    const inputMax = inputRange[rangeIndex + 1];
    const outputMin = outputRange[rangeIndex];
    const outputMax = outputRange[rangeIndex + 1];

    // Calculate progress
    let progress = (input - inputMin) / (inputMax - inputMin);

    // Apply easing if provided
    if (easing) {
      progress = easing(progress);
    }

    // Handle extrapolation
    const leftExtrapolate = extrapolateLeft || extrapolate || 'extend';
    const rightExtrapolate = extrapolateRight || extrapolate || 'extend';

    if (progress < 0) {
      if (leftExtrapolate === 'clamp') {
        return outputMin;
      } else if (leftExtrapolate === 'identity') {
        return input;
      }
    } else if (progress > 1) {
      if (rightExtrapolate === 'clamp') {
        return outputMax;
      } else if (rightExtrapolate === 'identity') {
        return input;
      }
    }

    // Interpolate
    if (typeof outputMin === 'number' && typeof outputMax === 'number') {
      return outputMin + progress * (outputMax - outputMin);
    }

    // Handle string interpolation (e.g., colors, degrees)
    return this._interpolateString(String(outputMin), String(outputMax), progress);
  }

  /**
   * Interpolate string values
   */
  private _interpolateString(start: string, end: string, progress: number): string {
    // Handle colors
    if (start.startsWith('#') && end.startsWith('#')) {
      return this._interpolateColor(start, end, progress);
    }

    // Handle deg, rad, etc.
    const startMatch = start.match(/^([\d.]+)(.*)$/);
    const endMatch = end.match(/^([\d.]+)(.*)$/);

    if (startMatch && endMatch && startMatch[2] === endMatch[2]) {
      const startNum = parseFloat(startMatch[1]);
      const endNum = parseFloat(endMatch[1]);
      const result = startNum + progress * (endNum - startNum);
      return `${result}${startMatch[2]}`;
    }

    return progress < 0.5 ? start : end;
  }

  /**
   * Interpolate hex colors
   */
  private _interpolateColor(start: string, end: string, progress: number): string {
    const startRgb = this._hexToRgb(start);
    const endRgb = this._hexToRgb(end);

    const r = Math.round(startRgb.r + progress * (endRgb.r - startRgb.r));
    const g = Math.round(startRgb.g + progress * (endRgb.g - startRgb.g));
    const b = Math.round(startRgb.b + progress * (endRgb.b - startRgb.b));

    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Convert hex to RGB
   */
  private _hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : { r: 0, g: 0, b: 0 };
  }

  /**
   * Chain interpolation
   */
  interpolate(config: InterpolationConfig): AnimatedInterpolation {
    // Create new interpolation that uses this one's output as input
    const parent = new AnimatedValue(0);

    // Update parent value when this interpolation changes
    effect(() => {
      const value = this.getValue();
      if (typeof value === 'number') {
        parent.setValue(value);
      }
    });

    return new AnimatedInterpolation(parent, config);
  }
}

// ============================================================================
// Animation Functions
// ============================================================================

/**
 * Create a timing animation
 */
export function timing(
  value: AnimatedValue,
  config: AnimationConfig
): CompositeAnimation {
  const {
    toValue,
    duration = 500,
    delay = 0,
    easing = Easing.inOut(Easing.quad),
    useNativeDriver = false,
    onComplete,
  } = config;

  const targetValue = typeof toValue === 'number' ? toValue : toValue.getValue();
  let startTime: number | null = null;
  let startValue: number;
  let stopped = false;

  const animate = (timestamp: number): void => {
    if (stopped) return;

    if (startTime === null) {
      startTime = timestamp;
      startValue = value.getValue();
    }

    const elapsed = timestamp - startTime - delay;

    if (elapsed < 0) {
      value._setAnimation(requestAnimationFrame(animate));
      return;
    }

    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);
    const currentValue = startValue + (targetValue - startValue) * easedProgress;

    value.setValue(currentValue);

    if (progress < 1) {
      value._setAnimation(requestAnimationFrame(animate));
    } else {
      value._setAnimation(null);
      onComplete?.({ finished: true });
    }
  };

  return {
    start(callback?: (result: AnimationResult) => void) {
      stopped = false;
      const combinedCallback = (result: AnimationResult) => {
        onComplete?.(result);
        callback?.(result);
      };
      value._setAnimation(requestAnimationFrame(animate));
    },
    stop() {
      stopped = true;
      value.stopAnimation();
      onComplete?.({ finished: false });
    },
    reset() {
      stopped = true;
      startTime = null;
      value.stopAnimation();
    },
  };
}

/**
 * Create a spring animation
 */
export function spring(
  value: AnimatedValue,
  config: SpringConfig
): CompositeAnimation {
  const {
    toValue,
    stiffness = 100,
    damping = 10,
    mass = 1,
    velocity: initialVelocity = 0,
    overshootClamping = false,
    restDisplacementThreshold = 0.001,
    restSpeedThreshold = 0.001,
    delay = 0,
    useNativeDriver = false,
    onComplete,
  } = config;

  const targetValue = typeof toValue === 'number' ? toValue : toValue.getValue();
  let lastTime: number | null = null;
  let position: number;
  let velocity = initialVelocity;
  let stopped = false;

  const animate = (timestamp: number): void => {
    if (stopped) return;

    if (lastTime === null) {
      lastTime = timestamp;
      position = value.getValue();

      if (delay > 0) {
        setTimeout(() => {
          if (!stopped) {
            value._setAnimation(requestAnimationFrame(animate));
          }
        }, delay);
        return;
      }
    }

    const deltaTime = Math.min((timestamp - lastTime) / 1000, 0.064);
    lastTime = timestamp;

    // Spring physics
    const displacement = position - targetValue;
    const springForce = -stiffness * displacement;
    const dampingForce = -damping * velocity;
    const acceleration = (springForce + dampingForce) / mass;

    velocity += acceleration * deltaTime;
    position += velocity * deltaTime;

    // Clamp if needed
    if (overshootClamping) {
      if ((displacement > 0 && position < targetValue) ||
          (displacement < 0 && position > targetValue)) {
        position = targetValue;
        velocity = 0;
      }
    }

    value.setValue(position);

    // Check if at rest
    const isAtRest =
      Math.abs(velocity) < restSpeedThreshold &&
      Math.abs(position - targetValue) < restDisplacementThreshold;

    if (!isAtRest) {
      value._setAnimation(requestAnimationFrame(animate));
    } else {
      value.setValue(targetValue);
      value._setAnimation(null);
      onComplete?.({ finished: true });
    }
  };

  return {
    start(callback?: (result: AnimationResult) => void) {
      stopped = false;
      value._setAnimation(requestAnimationFrame(animate));
    },
    stop() {
      stopped = true;
      value.stopAnimation();
      onComplete?.({ finished: false });
    },
    reset() {
      stopped = true;
      lastTime = null;
      velocity = initialVelocity;
      value.stopAnimation();
    },
  };
}

/**
 * Create a decay animation
 */
export function decay(
  value: AnimatedValue,
  config: DecayConfig
): CompositeAnimation {
  const {
    velocity: initialVelocity,
    deceleration = 0.997,
    useNativeDriver = false,
    onComplete,
  } = config;

  let lastTime: number | null = null;
  let velocity = typeof initialVelocity === 'number' ? initialVelocity : 0;
  let stopped = false;

  const animate = (timestamp: number): void => {
    if (stopped) return;

    if (lastTime === null) {
      lastTime = timestamp;
    }

    const deltaTime = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    velocity *= Math.pow(deceleration, deltaTime * 1000);
    const newValue = value.getValue() + velocity * deltaTime;
    value.setValue(newValue);

    if (Math.abs(velocity) > 0.1) {
      value._setAnimation(requestAnimationFrame(animate));
    } else {
      value._setAnimation(null);
      onComplete?.({ finished: true });
    }
  };

  return {
    start(callback?: (result: AnimationResult) => void) {
      stopped = false;
      value._setAnimation(requestAnimationFrame(animate));
    },
    stop() {
      stopped = true;
      value.stopAnimation();
      onComplete?.({ finished: false });
    },
    reset() {
      stopped = true;
      lastTime = null;
      velocity = typeof initialVelocity === 'number' ? initialVelocity : 0;
      value.stopAnimation();
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
  let stopped = false;

  const runNext = (callback?: (result: AnimationResult) => void): void => {
    if (stopped || current >= animations.length) {
      callback?.({ finished: !stopped });
      return;
    }

    animations[current].start((result) => {
      if (result.finished) {
        current++;
        runNext(callback);
      } else {
        callback?.({ finished: false });
      }
    });
  };

  return {
    start(callback) {
      stopped = false;
      current = 0;
      runNext(callback);
    },
    stop() {
      stopped = true;
      if (current < animations.length) {
        animations[current].stop();
      }
    },
    reset() {
      stopped = true;
      current = 0;
      animations.forEach(anim => anim.reset());
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
  let stopped = false;
  let completedCount = 0;

  return {
    start(callback) {
      stopped = false;
      completedCount = 0;

      if (animations.length === 0) {
        callback?.({ finished: true });
        return;
      }

      animations.forEach(anim => {
        anim.start((result) => {
          completedCount++;

          if (!result.finished && stopTogether) {
            this.stop();
          }

          if (completedCount === animations.length) {
            callback?.({ finished: !stopped });
          }
        });
      });
    },
    stop() {
      stopped = true;
      animations.forEach(anim => anim.stop());
    },
    reset() {
      stopped = true;
      completedCount = 0;
      animations.forEach(anim => anim.reset());
    },
  };
}

/**
 * Run animations with a stagger delay
 */
export function stagger(
  delayMs: number,
  animations: CompositeAnimation[]
): CompositeAnimation {
  return parallel(
    animations.map((anim, index) => ({
      start(callback) {
        setTimeout(() => anim.start(callback), index * delayMs);
      },
      stop() {
        anim.stop();
      },
      reset() {
        anim.reset();
      },
    }))
  );
}

/**
 * Create a looping animation
 */
export function loop(
  animation: CompositeAnimation,
  config?: { iterations?: number; resetBeforeIteration?: boolean }
): CompositeAnimation {
  const { iterations = -1, resetBeforeIteration = true } = config || {};
  let currentIteration = 0;
  let stopped = false;

  const runIteration = (callback?: (result: AnimationResult) => void): void => {
    if (stopped) {
      callback?.({ finished: false });
      return;
    }

    if (iterations !== -1 && currentIteration >= iterations) {
      callback?.({ finished: true });
      return;
    }

    if (resetBeforeIteration && currentIteration > 0) {
      animation.reset();
    }

    animation.start((result) => {
      if (result.finished) {
        currentIteration++;
        runIteration(callback);
      } else {
        callback?.({ finished: false });
      }
    });
  };

  return {
    start(callback) {
      stopped = false;
      currentIteration = 0;
      runIteration(callback);
    },
    stop() {
      stopped = true;
      animation.stop();
    },
    reset() {
      stopped = true;
      currentIteration = 0;
      animation.reset();
    },
  };
}

/**
 * Add two animated values
 */
export function add(a: AnimatedValue, b: AnimatedValue): AnimatedValue {
  const result = new AnimatedValue(a.getValue() + b.getValue());

  effect(() => {
    result.setValue(a.getValue() + b.getValue());
  });

  return result;
}

/**
 * Subtract animated values
 */
export function subtract(a: AnimatedValue, b: AnimatedValue): AnimatedValue {
  const result = new AnimatedValue(a.getValue() - b.getValue());

  effect(() => {
    result.setValue(a.getValue() - b.getValue());
  });

  return result;
}

/**
 * Multiply animated values
 */
export function multiply(a: AnimatedValue, b: AnimatedValue): AnimatedValue {
  const result = new AnimatedValue(a.getValue() * b.getValue());

  effect(() => {
    result.setValue(a.getValue() * b.getValue());
  });

  return result;
}

/**
 * Divide animated values
 */
export function divide(a: AnimatedValue, b: AnimatedValue): AnimatedValue {
  const result = new AnimatedValue(a.getValue() / b.getValue());

  effect(() => {
    result.setValue(a.getValue() / b.getValue());
  });

  return result;
}

/**
 * Modulo of animated values
 */
export function modulo(a: AnimatedValue, modulus: number): AnimatedValue {
  const result = new AnimatedValue(a.getValue() % modulus);

  effect(() => {
    result.setValue(((a.getValue() % modulus) + modulus) % modulus);
  });

  return result;
}

/**
 * Diff between frame values
 */
export function diffClamp(
  a: AnimatedValue,
  min: number,
  max: number
): AnimatedValue {
  const result = new AnimatedValue(Math.min(Math.max(a.getValue(), min), max));
  let lastValue = a.getValue();

  effect(() => {
    const currentValue = a.getValue();
    const diff = currentValue - lastValue;
    lastValue = currentValue;

    const newValue = Math.min(Math.max(result.getValue() + diff, min), max);
    result.setValue(newValue);
  });

  return result;
}

// ============================================================================
// Event Handling
// ============================================================================

/**
 * Create an event handler that updates animated values
 */
export function event<T>(
  argMapping: Array<{ nativeEvent: Record<string, AnimatedValue | undefined> } | null>,
  config?: { listener?: (event: T) => void; useNativeDriver?: boolean }
): (event: T) => void {
  return (nativeEvent: T) => {
    argMapping.forEach(mapping => {
      if (mapping && mapping.nativeEvent) {
        const eventData = (nativeEvent as any).nativeEvent || nativeEvent;

        for (const [key, animatedValue] of Object.entries(mapping.nativeEvent)) {
          if (animatedValue && eventData[key] !== undefined) {
            animatedValue.setValue(eventData[key]);
          }
        }
      }
    });

    config?.listener?.(nativeEvent);
  };
}

// ============================================================================
// Animated Component
// ============================================================================

/**
 * Create an animated component wrapper
 */
export function createAnimatedComponent<P extends Record<string, any>>(
  Component: (props: P) => any
): (props: P) => any {
  return function AnimatedComponent(props: P): any {
    // Extract animated values from props and style
    const resolvedProps: Record<string, any> = {};

    for (const [key, value] of Object.entries(props)) {
      if (value instanceof AnimatedValue) {
        resolvedProps[key] = value.getValue();
      } else if (value instanceof AnimatedInterpolation) {
        resolvedProps[key] = value.getValue();
      } else if (key === 'style' && value) {
        resolvedProps[key] = resolveAnimatedStyle(value);
      } else {
        resolvedProps[key] = value;
      }
    }

    return Component(resolvedProps as P);
  };
}

/**
 * Resolve animated values in style object
 */
function resolveAnimatedStyle(style: any): any {
  if (Array.isArray(style)) {
    return style.map(resolveAnimatedStyle);
  }

  if (!style || typeof style !== 'object') {
    return style;
  }

  const resolved: Record<string, any> = {};

  for (const [key, value] of Object.entries(style)) {
    if (value instanceof AnimatedValue) {
      resolved[key] = value.getValue();
    } else if (value instanceof AnimatedInterpolation) {
      resolved[key] = value.getValue();
    } else if (key === 'transform' && Array.isArray(value)) {
      resolved[key] = value.map(transform => {
        const resolvedTransform: Record<string, any> = {};
        for (const [tKey, tValue] of Object.entries(transform)) {
          if (tValue instanceof AnimatedValue) {
            resolvedTransform[tKey] = tValue.getValue();
          } else if (tValue instanceof AnimatedInterpolation) {
            resolvedTransform[tKey] = tValue.getValue();
          } else {
            resolvedTransform[tKey] = tValue;
          }
        }
        return resolvedTransform;
      });
    } else if (typeof value === 'object' && value !== null) {
      resolved[key] = resolveAnimatedStyle(value);
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}

// ============================================================================
// Animated Namespace Export
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
