/**
 * PhilJS CSS Animation System
 *
 * Comprehensive animation utilities:
 * - Spring physics animations
 * - Keyframe generators
 * - Animation orchestration
 * - Motion presets
 * - Gesture-based animations
 * - FLIP technique
 * - Stagger and sequence animations
 */

import type { CSSStyleObject } from './types';

// =============================================================================
// Types
// =============================================================================

export interface SpringConfig {
  mass: number;
  stiffness: number;
  damping: number;
  velocity?: number;
}

export interface AnimationTimeline {
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

export interface Keyframe {
  offset?: number;
  easing?: string;
  composite?: CompositeOperation;
  [property: string]: string | number | undefined;
}

export interface MotionConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  fill?: FillMode;
  direction?: PlaybackDirection;
  iterations?: number;
}

export interface StaggerConfig {
  each?: number;
  from?: 'first' | 'last' | 'center' | number;
  grid?: [number, number];
  axis?: 'x' | 'y';
}

export interface OrchestrationConfig {
  stagger?: StaggerConfig;
  delayChildren?: number;
  staggerChildren?: number;
  when?: 'beforeChildren' | 'afterChildren';
}

// =============================================================================
// Spring Physics
// =============================================================================

export const springPresets: Record<string, SpringConfig> = {
  default: { mass: 1, stiffness: 100, damping: 10 },
  gentle: { mass: 1, stiffness: 120, damping: 14 },
  wobbly: { mass: 1, stiffness: 180, damping: 12 },
  stiff: { mass: 1, stiffness: 210, damping: 20 },
  slow: { mass: 1, stiffness: 280, damping: 60 },
  molasses: { mass: 1, stiffness: 280, damping: 120 },
  snappy: { mass: 1, stiffness: 400, damping: 30 },
  bouncy: { mass: 1, stiffness: 300, damping: 10 },
};

/**
 * Calculate spring animation keyframes
 */
export function calculateSpring(
  from: number,
  to: number,
  config: SpringConfig = springPresets.default,
  precision: number = 0.01
): number[] {
  const { mass, stiffness, damping, velocity = 0 } = config;

  const values: number[] = [];
  let position = from;
  let vel = velocity;
  const dt = 1 / 60; // 60fps

  const distance = to - from;
  let iterations = 0;
  const maxIterations = 1000;

  while (iterations < maxIterations) {
    const springForce = -stiffness * (position - to);
    const dampingForce = -damping * vel;
    const acceleration = (springForce + dampingForce) / mass;

    vel += acceleration * dt;
    position += vel * dt;
    values.push(position);

    // Check if settled
    if (Math.abs(position - to) < precision && Math.abs(vel) < precision) {
      break;
    }

    iterations++;
  }

  // Ensure final value is exact
  values.push(to);

  return values;
}

/**
 * Generate spring animation CSS
 */
export function springAnimation(
  property: string,
  from: number | string,
  to: number | string,
  config: SpringConfig = springPresets.default,
  unit: string = ''
): string {
  const fromNum = typeof from === 'number' ? from : parseFloat(from);
  const toNum = typeof to === 'number' ? to : parseFloat(to);

  const values = calculateSpring(fromNum, toNum, config);
  const duration = values.length / 60; // seconds

  // Sample keyframes (max 20 for performance)
  const step = Math.max(1, Math.floor(values.length / 20));
  const keyframes = values
    .filter((_, i) => i % step === 0 || i === values.length - 1)
    .map((val, i, arr) => {
      const offset = (i / (arr.length - 1)) * 100;
      return `${offset.toFixed(1)}% { ${property}: ${val.toFixed(3)}${unit}; }`;
    })
    .join('\n  ');

  const name = `spring-${property}-${Date.now().toString(36)}`;

  return `@keyframes ${name} {\n  ${keyframes}\n}\n.${name} { animation: ${name} ${duration.toFixed(2)}s linear forwards; }`;
}

/**
 * Create spring-based CSS timing function
 */
export function springEasing(config: SpringConfig = springPresets.default): string {
  // Approximate spring curve with cubic-bezier
  const { stiffness, damping } = config;
  const ratio = damping / (2 * Math.sqrt(stiffness));

  if (ratio < 1) {
    // Underdamped - has bounce
    return `cubic-bezier(0.34, 1.56, 0.64, 1)`;
  } else if (ratio === 1) {
    // Critically damped
    return `cubic-bezier(0.22, 1, 0.36, 1)`;
  } else {
    // Overdamped
    return `cubic-bezier(0.25, 0.1, 0.25, 1)`;
  }
}

// =============================================================================
// Keyframe Generators
// =============================================================================

/**
 * Generate slide animation
 */
export function slide(
  direction: 'up' | 'down' | 'left' | 'right',
  distance: string = '100%'
): string {
  const transforms: Record<string, [string, string]> = {
    up: [`translateY(${distance})`, 'translateY(0)'],
    down: [`translateY(-${distance})`, 'translateY(0)'],
    left: [`translateX(${distance})`, 'translateX(0)'],
    right: [`translateX(-${distance})`, 'translateX(0)'],
  };

  const [from, to] = transforms[direction];
  return `
@keyframes slide-${direction} {
  from { transform: ${from}; opacity: 0; }
  to { transform: ${to}; opacity: 1; }
}`;
}

/**
 * Generate fade animation
 */
export function fade(
  type: 'in' | 'out' | 'in-up' | 'in-down' | 'in-left' | 'in-right'
): string {
  const configs: Record<string, { from: CSSStyleObject; to: CSSStyleObject }> = {
    in: { from: { opacity: '0' }, to: { opacity: '1' } },
    out: { from: { opacity: '1' }, to: { opacity: '0' } },
    'in-up': {
      from: { opacity: '0', transform: 'translateY(20px)' },
      to: { opacity: '1', transform: 'translateY(0)' }
    },
    'in-down': {
      from: { opacity: '0', transform: 'translateY(-20px)' },
      to: { opacity: '1', transform: 'translateY(0)' }
    },
    'in-left': {
      from: { opacity: '0', transform: 'translateX(20px)' },
      to: { opacity: '1', transform: 'translateX(0)' }
    },
    'in-right': {
      from: { opacity: '0', transform: 'translateX(-20px)' },
      to: { opacity: '1', transform: 'translateX(0)' }
    },
  };

  const { from, to } = configs[type];
  return generateKeyframes(`fade-${type}`, from, to);
}

/**
 * Generate scale animation
 */
export function scale(
  type: 'in' | 'out' | 'up' | 'down'
): string {
  const configs: Record<string, { from: CSSStyleObject; to: CSSStyleObject }> = {
    in: { from: { transform: 'scale(0)' }, to: { transform: 'scale(1)' } },
    out: { from: { transform: 'scale(1)' }, to: { transform: 'scale(0)' } },
    up: { from: { transform: 'scale(0.95)' }, to: { transform: 'scale(1)' } },
    down: { from: { transform: 'scale(1.05)' }, to: { transform: 'scale(1)' } },
  };

  const { from, to } = configs[type];
  return generateKeyframes(`scale-${type}`, from, to);
}

/**
 * Generate rotate animation
 */
export function rotate(
  degrees: number = 360,
  options: { origin?: string; scale?: boolean } = {}
): string {
  const { origin = 'center', scale: includeScale = false } = options;

  const scaleTransform = includeScale ? ' scale(1)' : '';
  const fromScale = includeScale ? ' scale(0)' : '';

  return `
@keyframes rotate-${degrees} {
  from { transform: rotate(0deg)${fromScale}; transform-origin: ${origin}; }
  to { transform: rotate(${degrees}deg)${scaleTransform}; transform-origin: ${origin}; }
}`;
}

/**
 * Generate bounce animation
 */
export function bounce(intensity: 'light' | 'medium' | 'heavy' = 'medium'): string {
  const configs: Record<string, number[]> = {
    light: [0, -10, 0, -5, 0],
    medium: [0, -20, 0, -10, 0, -5, 0],
    heavy: [0, -30, 0, -15, 0, -7, 0, -3, 0],
  };

  const values = configs[intensity];
  const keyframes = values.map((y, i) => {
    const percent = (i / (values.length - 1)) * 100;
    return `${percent.toFixed(0)}% { transform: translateY(${y}px); }`;
  }).join('\n  ');

  return `@keyframes bounce-${intensity} {\n  ${keyframes}\n}`;
}

/**
 * Generate shake animation
 */
export function shake(intensity: number = 10): string {
  return `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-${intensity}px); }
  20%, 40%, 60%, 80% { transform: translateX(${intensity}px); }
}`;
}

/**
 * Generate pulse animation
 */
export function pulse(scale: number = 1.05): string {
  return `
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(${scale}); }
}`;
}

/**
 * Generate flip animation
 */
export function flip(axis: 'x' | 'y' = 'y'): string {
  const transform = axis === 'y' ? 'rotateY' : 'rotateX';
  return `
@keyframes flip-${axis} {
  0% { transform: perspective(400px) ${transform}(0); }
  40% { transform: perspective(400px) ${transform}(-20deg); }
  60% { transform: perspective(400px) ${transform}(10deg); }
  80% { transform: perspective(400px) ${transform}(-5deg); }
  100% { transform: perspective(400px) ${transform}(0); }
}`;
}

/**
 * Generate swing animation
 */
export function swing(): string {
  return `
@keyframes swing {
  20% { transform: rotate(15deg); }
  40% { transform: rotate(-10deg); }
  60% { transform: rotate(5deg); }
  80% { transform: rotate(-5deg); }
  100% { transform: rotate(0deg); }
}`;
}

/**
 * Generate wobble animation
 */
export function wobble(): string {
  return `
@keyframes wobble {
  0% { transform: translateX(0%); }
  15% { transform: translateX(-25%) rotate(-5deg); }
  30% { transform: translateX(20%) rotate(3deg); }
  45% { transform: translateX(-15%) rotate(-3deg); }
  60% { transform: translateX(10%) rotate(2deg); }
  75% { transform: translateX(-5%) rotate(-1deg); }
  100% { transform: translateX(0%); }
}`;
}

/**
 * Generate rubber band animation
 */
export function rubberBand(): string {
  return `
@keyframes rubberBand {
  0% { transform: scale(1); }
  30% { transform: scaleX(1.25) scaleY(0.75); }
  40% { transform: scaleX(0.75) scaleY(1.25); }
  50% { transform: scaleX(1.15) scaleY(0.85); }
  65% { transform: scaleX(0.95) scaleY(1.05); }
  75% { transform: scaleX(1.05) scaleY(0.95); }
  100% { transform: scale(1); }
}`;
}

// =============================================================================
// Animation Orchestration
// =============================================================================

/**
 * Calculate stagger delays
 */
export function calculateStagger(
  count: number,
  config: StaggerConfig = {}
): number[] {
  const { each = 0.1, from = 'first', grid, axis } = config;
  const delays: number[] = [];

  if (grid) {
    const [cols, rows] = grid;
    for (let i = 0; i < count; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      if (axis === 'x') {
        delays.push(col * each);
      } else if (axis === 'y') {
        delays.push(row * each);
      } else {
        // Diagonal
        delays.push((row + col) * each);
      }
    }
  } else {
    for (let i = 0; i < count; i++) {
      let delay: number;

      if (from === 'first') {
        delay = i * each;
      } else if (from === 'last') {
        delay = (count - 1 - i) * each;
      } else if (from === 'center') {
        const center = (count - 1) / 2;
        delay = Math.abs(i - center) * each;
      } else if (typeof from === 'number') {
        delay = Math.abs(i - from) * each;
      } else {
        delay = i * each;
      }

      delays.push(delay);
    }
  }

  return delays;
}

/**
 * Generate staggered animation CSS
 */
export function staggerAnimation(
  selector: string,
  animation: string,
  count: number,
  config: StaggerConfig = {}
): string {
  const delays = calculateStagger(count, config);

  return delays.map((delay, i) =>
    `${selector}:nth-child(${i + 1}) { animation-delay: ${delay.toFixed(2)}s; }`
  ).join('\n');
}

/**
 * Create animation sequence
 */
export function sequence(
  animations: Array<{ animation: string; duration: number; delay?: number }>
): string {
  let currentDelay = 0;
  const rules: string[] = [];

  animations.forEach((anim, i) => {
    const delay = anim.delay ?? currentDelay;
    rules.push(`--seq-${i}-delay: ${delay.toFixed(2)}s;`);
    rules.push(`--seq-${i}-duration: ${anim.duration.toFixed(2)}s;`);
    currentDelay = delay + anim.duration;
  });

  return `:root {\n  ${rules.join('\n  ')}\n}`;
}

/**
 * Create parallel animations
 */
export function parallel(
  animations: string[],
  options: MotionConfig = {}
): string {
  const { duration = 0.3, delay = 0, easing = 'ease' } = options;

  return animations.map(anim =>
    `${anim} ${duration}s ${easing} ${delay}s`
  ).join(', ');
}

// =============================================================================
// FLIP Technique
// =============================================================================

export interface FLIPState {
  rect: DOMRect;
  opacity: number;
  transform: string;
}

/**
 * Capture element's current state for FLIP
 */
export function captureState(element: HTMLElement): FLIPState {
  const style = getComputedStyle(element);
  return {
    rect: element.getBoundingClientRect(),
    opacity: parseFloat(style.opacity),
    transform: style.transform === 'none' ? '' : style.transform,
  };
}

/**
 * Play FLIP animation
 */
export function playFLIP(
  element: HTMLElement,
  first: FLIPState,
  last: FLIPState,
  options: MotionConfig = {}
): Animation {
  const { duration = 300, easing = 'cubic-bezier(0.4, 0, 0.2, 1)' } = options;

  const deltaX = first.rect.left - last.rect.left;
  const deltaY = first.rect.top - last.rect.top;
  const deltaW = first.rect.width / last.rect.width;
  const deltaH = first.rect.height / last.rect.height;

  return element.animate([
    {
      transform: `translate(${deltaX}px, ${deltaY}px) scale(${deltaW}, ${deltaH})`,
      opacity: first.opacity,
    },
    {
      transform: 'none',
      opacity: last.opacity,
    },
  ], {
    duration,
    easing,
    fill: 'both',
  });
}

/**
 * Batch FLIP animations for multiple elements
 */
export function batchFLIP(
  elements: HTMLElement[],
  getNewState: () => void,
  options: MotionConfig = {}
): Animation[] {
  // First: capture current state
  const firstStates = elements.map(captureState);

  // Perform DOM changes
  getNewState();

  // Last: capture new state
  const lastStates = elements.map(captureState);

  // Invert & Play
  return elements.map((el, i) => playFLIP(el, firstStates[i], lastStates[i], options));
}

// =============================================================================
// Motion Presets
// =============================================================================

export const motionPresets = {
  // Entrances
  fadeIn: { animation: 'fadeIn', duration: 0.3, easing: 'ease-out' },
  fadeInUp: { animation: 'fadeInUp', duration: 0.4, easing: 'ease-out' },
  fadeInDown: { animation: 'fadeInDown', duration: 0.4, easing: 'ease-out' },
  slideInLeft: { animation: 'slideInLeft', duration: 0.3, easing: 'ease-out' },
  slideInRight: { animation: 'slideInRight', duration: 0.3, easing: 'ease-out' },
  slideInUp: { animation: 'slideInUp', duration: 0.3, easing: 'ease-out' },
  slideInDown: { animation: 'slideInDown', duration: 0.3, easing: 'ease-out' },
  scaleIn: { animation: 'scaleIn', duration: 0.3, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },

  // Exits
  fadeOut: { animation: 'fadeOut', duration: 0.2, easing: 'ease-in' },
  fadeOutUp: { animation: 'fadeOutUp', duration: 0.3, easing: 'ease-in' },
  fadeOutDown: { animation: 'fadeOutDown', duration: 0.3, easing: 'ease-in' },
  slideOutLeft: { animation: 'slideOutLeft', duration: 0.3, easing: 'ease-in' },
  slideOutRight: { animation: 'slideOutRight', duration: 0.3, easing: 'ease-in' },
  scaleOut: { animation: 'scaleOut', duration: 0.2, easing: 'ease-in' },

  // Attention
  bounce: { animation: 'bounce', duration: 0.6, easing: 'ease-out', iterations: 1 },
  shake: { animation: 'shake', duration: 0.5, easing: 'ease-in-out', iterations: 1 },
  pulse: { animation: 'pulse', duration: 1, easing: 'ease-in-out', iterations: 'infinite' },
  swing: { animation: 'swing', duration: 0.6, easing: 'ease-in-out', iterations: 1 },
  wobble: { animation: 'wobble', duration: 0.8, easing: 'ease-in-out', iterations: 1 },
  rubberBand: { animation: 'rubberBand', duration: 0.6, easing: 'ease-out', iterations: 1 },

  // Transitions
  crossfade: { animation: 'crossfade', duration: 0.3, easing: 'ease-in-out' },
  morph: { animation: 'morph', duration: 0.5, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
} as const;

// =============================================================================
// Easing Functions
// =============================================================================

export const easings = {
  // Standard
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',

  // Cubic
  easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',

  // Quart
  easeInQuart: 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
  easeOutQuart: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
  easeInOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)',

  // Expo
  easeInExpo: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
  easeOutExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
  easeInOutExpo: 'cubic-bezier(1, 0, 0, 1)',

  // Back
  easeInBack: 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
  easeOutBack: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  easeInOutBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',

  // Elastic approximations (cubic-bezier can't do true elastic)
  elasticOut: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  bounceOut: 'cubic-bezier(0.34, 1.56, 0.64, 1)',

  // Special
  snappy: 'cubic-bezier(0.17, 0.67, 0.29, 0.96)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
} as const;

// =============================================================================
// Reduced Motion
// =============================================================================

/**
 * Generate reduced motion styles
 */
export function reducedMotionStyles(): string {
  return `
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}`;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Create motion-safe animation
 */
export function motionSafe(animation: string, fallback?: string): string {
  return `
@media (prefers-reduced-motion: no-preference) {
  animation: ${animation};
}
@media (prefers-reduced-motion: reduce) {
  ${fallback ? `animation: ${fallback};` : 'animation: none;'}
}`;
}

// =============================================================================
// Utility Functions
// =============================================================================

function generateKeyframes(
  name: string,
  from: CSSStyleObject,
  to: CSSStyleObject
): string {
  const fromStr = Object.entries(from)
    .map(([k, v]) => `${camelToKebab(k)}: ${v};`)
    .join(' ');
  const toStr = Object.entries(to)
    .map(([k, v]) => `${camelToKebab(k)}: ${v};`)
    .join(' ');

  return `@keyframes ${name} {\n  from { ${fromStr} }\n  to { ${toStr} }\n}`;
}

function camelToKebab(str: string): string {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}

// =============================================================================
// All Animation Keyframes
// =============================================================================

/**
 * Generate all standard animation keyframes
 */
export function generateAllKeyframes(): string {
  return [
    // Fade
    fade('in'),
    fade('out'),
    fade('in-up'),
    fade('in-down'),
    fade('in-left'),
    fade('in-right'),

    // Slide
    slide('up'),
    slide('down'),
    slide('left'),
    slide('right'),

    // Scale
    scale('in'),
    scale('out'),
    scale('up'),
    scale('down'),

    // Effects
    bounce('light'),
    bounce('medium'),
    bounce('heavy'),
    shake(),
    pulse(),
    swing(),
    wobble(),
    rubberBand(),
    flip('x'),
    flip('y'),
    rotate(),

    // Reduced motion
    reducedMotionStyles(),
  ].join('\n\n');
}

// =============================================================================
// CSS Animation Classes
// =============================================================================

/**
 * Generate animation utility classes
 */
export function generateAnimationUtilities(): string {
  const durations = [75, 100, 150, 200, 300, 500, 700, 1000];
  const delays = [75, 100, 150, 200, 300, 500, 700, 1000];

  let css = '';

  // Duration utilities
  durations.forEach(d => {
    css += `.duration-${d} { animation-duration: ${d}ms; }\n`;
  });

  // Delay utilities
  delays.forEach(d => {
    css += `.delay-${d} { animation-delay: ${d}ms; }\n`;
  });

  // Easing utilities
  Object.entries(easings).forEach(([name, value]) => {
    css += `.ease-${name.replace(/([A-Z])/g, '-$1').toLowerCase()} { animation-timing-function: ${value}; }\n`;
  });

  // Fill mode utilities
  css += `.fill-none { animation-fill-mode: none; }\n`;
  css += `.fill-forwards { animation-fill-mode: forwards; }\n`;
  css += `.fill-backwards { animation-fill-mode: backwards; }\n`;
  css += `.fill-both { animation-fill-mode: both; }\n`;

  // Direction utilities
  css += `.direction-normal { animation-direction: normal; }\n`;
  css += `.direction-reverse { animation-direction: reverse; }\n`;
  css += `.direction-alternate { animation-direction: alternate; }\n`;
  css += `.direction-alternate-reverse { animation-direction: alternate-reverse; }\n`;

  // Iteration utilities
  css += `.iterate-1 { animation-iteration-count: 1; }\n`;
  css += `.iterate-2 { animation-iteration-count: 2; }\n`;
  css += `.iterate-infinite { animation-iteration-count: infinite; }\n`;

  // Play state utilities
  css += `.animate-running { animation-play-state: running; }\n`;
  css += `.animate-paused { animation-play-state: paused; }\n`;

  // Preset animations
  Object.entries(motionPresets).forEach(([name, preset]) => {
    const iterations = preset.iterations === 'infinite' ? 'infinite' : (preset.iterations || 1);
    css += `.animate-${name.replace(/([A-Z])/g, '-$1').toLowerCase()} { animation: ${preset.animation} ${preset.duration}s ${preset.easing} ${iterations}; }\n`;
  });

  return css;
}
