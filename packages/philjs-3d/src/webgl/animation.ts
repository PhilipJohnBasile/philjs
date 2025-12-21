/**
 * @file Animation Loop
 * @description requestAnimationFrame-based animation loop management
 */

import type { AnimationFrameInfo, AnimationLoop } from './types';

/**
 * Callback type for animation frame
 */
export type FrameCallback = (info: AnimationFrameInfo) => void;

/**
 * Create an animation loop
 */
export function createAnimationLoop(callback: FrameCallback): AnimationLoop {
  let animationId: number | null = null;
  let isRunning = false;
  let lastTime = 0;
  let frameCount = 0;
  let fps = 0;
  let fpsAccumulator = 0;
  let fpsFrameCount = 0;
  let lastFpsUpdate = 0;

  const loop = (currentTime: number) => {
    if (!isRunning) return;

    // Convert to seconds
    const time = currentTime / 1000;
    const deltaTime = lastTime ? time - lastTime : 0;
    lastTime = time;
    frameCount++;

    // Calculate FPS
    fpsAccumulator += deltaTime;
    fpsFrameCount++;
    if (currentTime - lastFpsUpdate >= 1000) {
      fps = fpsFrameCount / fpsAccumulator;
      fpsAccumulator = 0;
      fpsFrameCount = 0;
      lastFpsUpdate = currentTime;
    }

    callback({
      time,
      deltaTime,
      frameCount,
    });

    animationId = requestAnimationFrame(loop);
  };

  return {
    start: () => {
      if (isRunning) return;
      isRunning = true;
      lastTime = 0;
      frameCount = 0;
      animationId = requestAnimationFrame(loop);
    },
    stop: () => {
      if (!isRunning) return;
      isRunning = false;
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },
    get isRunning() {
      return isRunning;
    },
    get fps() {
      return fps;
    },
  };
}

/**
 * Create an animation loop with fixed timestep
 */
export function createFixedTimestepLoop(
  callback: FrameCallback,
  fixedDeltaTime: number = 1 / 60
): AnimationLoop & { update: () => void } {
  let animationId: number | null = null;
  let isRunning = false;
  let accumulator = 0;
  let lastTime = 0;
  let frameCount = 0;
  let fps = 0;
  let renderFps = 0;
  let fpsAccumulator = 0;
  let fpsFrameCount = 0;
  let lastFpsUpdate = 0;

  const update = () => {
    callback({
      time: frameCount * fixedDeltaTime,
      deltaTime: fixedDeltaTime,
      frameCount,
    });
    frameCount++;
  };

  const loop = (currentTime: number) => {
    if (!isRunning) return;

    const time = currentTime / 1000;
    const deltaTime = lastTime ? Math.min(time - lastTime, 0.25) : 0;
    lastTime = time;

    accumulator += deltaTime;

    // Fixed timestep updates
    while (accumulator >= fixedDeltaTime) {
      update();
      accumulator -= fixedDeltaTime;
    }

    // Calculate FPS
    fpsAccumulator += deltaTime;
    fpsFrameCount++;
    if (currentTime - lastFpsUpdate >= 1000) {
      renderFps = fpsFrameCount / fpsAccumulator;
      fps = frameCount / (time || 1);
      fpsAccumulator = 0;
      fpsFrameCount = 0;
      lastFpsUpdate = currentTime;
    }

    animationId = requestAnimationFrame(loop);
  };

  return {
    start: () => {
      if (isRunning) return;
      isRunning = true;
      lastTime = 0;
      frameCount = 0;
      accumulator = 0;
      animationId = requestAnimationFrame(loop);
    },
    stop: () => {
      if (!isRunning) return;
      isRunning = false;
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },
    get isRunning() {
      return isRunning;
    },
    get fps() {
      return fps;
    },
    update,
  };
}

/**
 * Create a time-based animator
 */
export function createAnimator(): {
  animate: (duration: number, callback: (t: number) => void) => Promise<void>;
  cancel: () => void;
} {
  let currentAnimationId: number | null = null;

  const animate = (duration: number, callback: (t: number) => void): Promise<void> => {
    return new Promise((resolve) => {
      const startTime = performance.now();

      const tick = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const t = Math.min(elapsed / duration, 1);

        callback(t);

        if (t < 1) {
          currentAnimationId = requestAnimationFrame(tick);
        } else {
          currentAnimationId = null;
          resolve();
        }
      };

      currentAnimationId = requestAnimationFrame(tick);
    });
  };

  const cancel = () => {
    if (currentAnimationId !== null) {
      cancelAnimationFrame(currentAnimationId);
      currentAnimationId = null;
    }
  };

  return { animate, cancel };
}

/**
 * Easing functions
 */
export const Easing = {
  linear: (t: number) => t,

  // Quad
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  // Cubic
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  // Quart
  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t: number) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

  // Quint
  easeInQuint: (t: number) => t * t * t * t * t,
  easeOutQuint: (t: number) => 1 + (--t) * t * t * t * t,
  easeInOutQuint: (t: number) =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,

  // Sine
  easeInSine: (t: number) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t: number) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,

  // Expo
  easeInExpo: (t: number) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  easeOutExpo: (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t: number) =>
    t === 0
      ? 0
      : t === 1
      ? 1
      : t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2,

  // Circ
  easeInCirc: (t: number) => 1 - Math.sqrt(1 - t * t),
  easeOutCirc: (t: number) => Math.sqrt(1 - (--t) * t),
  easeInOutCirc: (t: number) =>
    t < 0.5
      ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,

  // Elastic
  easeInElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeInOutElastic: (t: number) => {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },

  // Back
  easeInBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInOutBack: (t: number) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },

  // Bounce
  easeOutBounce: (t: number) => {
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
  easeInBounce: (t: number) => 1 - Easing.easeOutBounce(1 - t),
  easeInOutBounce: (t: number) =>
    t < 0.5
      ? (1 - Easing.easeOutBounce(1 - 2 * t)) / 2
      : (1 + Easing.easeOutBounce(2 * t - 1)) / 2,
};

/**
 * Interpolate between values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Interpolate between vectors
 */
export function lerpVec3(
  a: Float32Array | number[],
  b: Float32Array | number[],
  t: number
): Float32Array {
  return new Float32Array([
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
  ]);
}

/**
 * Spherical linear interpolation for rotations
 */
export function slerp(
  a: Float32Array | number[],
  b: Float32Array | number[],
  t: number
): Float32Array {
  // Assuming a and b are unit quaternions [x, y, z, w]
  let dot = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];

  // If dot is negative, negate one quaternion
  const negateB = dot < 0;
  if (negateB) {
    dot = -dot;
  }

  let scale0: number;
  let scale1: number;

  if (dot > 0.9995) {
    // Linear interpolation for very close quaternions
    scale0 = 1 - t;
    scale1 = t;
  } else {
    const theta = Math.acos(dot);
    const sinTheta = Math.sin(theta);
    scale0 = Math.sin((1 - t) * theta) / sinTheta;
    scale1 = Math.sin(t * theta) / sinTheta;
  }

  if (negateB) {
    scale1 = -scale1;
  }

  return new Float32Array([
    scale0 * a[0] + scale1 * b[0],
    scale0 * a[1] + scale1 * b[1],
    scale0 * a[2] + scale1 * b[2],
    scale0 * a[3] + scale1 * b[3],
  ]);
}
