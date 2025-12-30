/**
 * Animation utilities and transitions for PhilJS Charts
 */

export type EasingFunction = (t: number) => number;

// Easing functions
export const easings = {
  linear: (t: number): number => t,

  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutQuad: (t: number): number =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => (--t) * t * t + 1,
  easeInOutCubic: (t: number): number =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  easeInQuart: (t: number): number => t * t * t * t,
  easeOutQuart: (t: number): number => 1 - (--t) * t * t * t,
  easeInOutQuart: (t: number): number =>
    t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

  easeInElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },

  easeOutElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  easeOutBounce: (t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },

  easeInBounce: (t: number): number => 1 - easings.easeOutBounce(1 - t),
};

// Animation configuration
export interface AnimationConfig {
  duration?: number;
  easing?: keyof typeof easings | EasingFunction;
  delay?: number;
  onStart?: () => void;
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

export const defaultAnimationConfig: Required<Omit<AnimationConfig, 'onStart' | 'onUpdate' | 'onComplete'>> = {
  duration: 400,
  easing: 'easeOutCubic',
  delay: 0,
};

// Animation presets
export const animationPresets = {
  none: { duration: 0 },
  fast: { duration: 200, easing: 'easeOutQuad' as const },
  normal: { duration: 400, easing: 'easeOutCubic' as const },
  slow: { duration: 800, easing: 'easeOutCubic' as const },
  bouncy: { duration: 600, easing: 'easeOutBounce' as const },
  elastic: { duration: 800, easing: 'easeOutElastic' as const },
};

// Transition types for charts
export type TransitionType =
  | 'fade'
  | 'scale'
  | 'slide'
  | 'expand'
  | 'morph';

export interface TransitionConfig extends AnimationConfig {
  type?: TransitionType;
  staggerDelay?: number;
  staggerOrder?: 'index' | 'value' | 'random';
}

// Animation runner
export function animate(
  from: number,
  to: number,
  config: AnimationConfig = {}
): Promise<void> {
  return new Promise((resolve) => {
    const {
      duration = defaultAnimationConfig.duration,
      easing = defaultAnimationConfig.easing,
      delay = defaultAnimationConfig.delay,
      onStart,
      onUpdate,
      onComplete,
    } = config;

    const easingFn = typeof easing === 'function' ? easing : easings[easing];

    setTimeout(() => {
      onStart?.();

      const startTime = performance.now();

      function step(currentTime: number) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easingFn(progress);
        const value = from + (to - from) * easedProgress;

        onUpdate?.(value);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          onComplete?.();
          resolve();
        }
      }

      requestAnimationFrame(step);
    }, delay);
  });
}

// Staggered animation for multiple elements
export async function animateStaggered(
  items: number[],
  config: TransitionConfig = {}
): Promise<void> {
  const { staggerDelay = 50, staggerOrder = 'index' } = config;

  let orderedItems: Array<{ value: number; index: number }>;

  switch (staggerOrder) {
    case 'value':
      orderedItems = items
        .map((value, index) => ({ value, index }))
        .sort((a, b) => a.value - b.value);
      break;
    case 'random':
      orderedItems = items
        .map((value, index) => ({ value, index }))
        .sort(() => Math.random() - 0.5);
      break;
    default:
      orderedItems = items.map((value, index) => ({ value, index }));
  }

  const promises = orderedItems.map(({ value }, i) =>
    animate(0, value, {
      ...config,
      delay: (config.delay || 0) + i * staggerDelay,
    })
  );

  await Promise.all(promises);
}

// Spring physics animation
export interface SpringConfig {
  stiffness?: number;
  damping?: number;
  mass?: number;
  velocity?: number;
}

export function createSpring(config: SpringConfig = {}): {
  update: (target: number) => number;
  reset: (value: number) => void;
} {
  const {
    stiffness = 100,
    damping = 10,
    mass = 1,
    velocity: initialVelocity = 0,
  } = config;

  let position = 0;
  let velocity = initialVelocity;

  return {
    update(target: number): number {
      const force = stiffness * (target - position);
      const dampingForce = damping * velocity;
      const acceleration = (force - dampingForce) / mass;

      velocity += acceleration * 0.016; // ~60fps
      position += velocity * 0.016;

      return position;
    },
    reset(value: number) {
      position = value;
      velocity = 0;
    },
  };
}

// Interpolation utilities
export function interpolateValues(
  from: number[],
  to: number[],
  t: number
): number[] {
  return from.map((start, i) => start + ((to[i] ?? 0) - start) * t);
}

export function interpolateColor(
  from: string,
  to: string,
  t: number
): string {
  const fromRgb = hexToRgb(from);
  const toRgb = hexToRgb(to);

  const r = Math.round(fromRgb.r + (toRgb.r - fromRgb.r) * t);
  const g = Math.round(fromRgb.g + (toRgb.g - fromRgb.g) * t);
  const b = Math.round(fromRgb.b + (toRgb.b - fromRgb.b) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const hexClean = hex.replace('#', '');
  return {
    r: parseInt(hexClean.slice(0, 2), 16),
    g: parseInt(hexClean.slice(2, 4), 16),
    b: parseInt(hexClean.slice(4, 6), 16),
  };
}

// Path morphing for smooth transitions
export function morphPath(
  fromPath: string,
  toPath: string,
  t: number
): string {
  // Simple path interpolation - works best with paths of same structure
  const fromNumbers = fromPath.match(/-?\d+\.?\d*/g)?.map(Number) || [];
  const toNumbers = toPath.match(/-?\d+\.?\d*/g)?.map(Number) || [];

  if (fromNumbers.length !== toNumbers.length) {
    return t < 0.5 ? fromPath : toPath;
  }

  const interpolated = interpolateValues(fromNumbers, toNumbers, t);
  let i = 0;

  return fromPath.replace(/-?\d+\.?\d*/g, () =>
    (interpolated[i++] ?? 0).toFixed(2)
  );
}
