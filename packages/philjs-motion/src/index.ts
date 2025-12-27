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

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Spring Presets
// ============================================================================

export const SpringPresets = {
  default: { tension: 170, friction: 26 },
  gentle: { tension: 120, friction: 14 },
  wobbly: { tension: 180, friction: 12 },
  stiff: { tension: 210, friction: 20 },
  slow: { tension: 280, friction: 60 },
  molasses: { tension: 280, friction: 120 },
  bouncy: { tension: 600, friction: 10 },
  snappy: { tension: 400, friction: 30 }
};

// ============================================================================
// Spring Engine
// ============================================================================

export class Spring {
  private config: Required<SpringConfig>;
  private value: number;
  private velocity: number;
  private target: number;
  private isAnimating: boolean = false;
  private animationFrame: number | null = null;
  private callbacks: AnimationCallback[] = [];
  private resolvers: Array<() => void> = [];

  constructor(initialValue: number = 0, config: SpringConfig = {}) {
    this.config = {
      tension: config.tension ?? 170,
      friction: config.friction ?? 26,
      mass: config.mass ?? 1,
      velocity: config.velocity ?? 0,
      precision: config.precision ?? 0.01,
      clamp: config.clamp ?? false
    };

    this.value = initialValue;
    this.velocity = this.config.velocity;
    this.target = initialValue;
  }

  get(): number {
    return this.value;
  }

  set(newValue: number, immediate: boolean = false): Promise<void> {
    if (immediate) {
      this.value = newValue;
      this.target = newValue;
      this.velocity = 0;
      this.emit();
      return Promise.resolve();
    }

    this.target = newValue;

    if (!this.isAnimating) {
      this.start();
    }

    return new Promise((resolve) => {
      this.resolvers.push(resolve);
    });
  }

  configure(config: SpringConfig): void {
    Object.assign(this.config, config);
  }

  onUpdate(callback: AnimationCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) this.callbacks.splice(index, 1);
    };
  }

  private start(): void {
    this.isAnimating = true;
    this.animate();
  }

  private animate(): void {
    if (!this.isAnimating) return;

    const { tension, friction, mass, precision, clamp } = this.config;

    // Spring physics calculation
    const springForce = -tension * (this.value - this.target);
    const dampingForce = -friction * this.velocity;
    const acceleration = (springForce + dampingForce) / mass;

    this.velocity += acceleration * (1 / 60); // 60fps
    this.value += this.velocity * (1 / 60);

    // Clamping
    if (clamp) {
      if (
        (this.velocity > 0 && this.value > this.target) ||
        (this.velocity < 0 && this.value < this.target)
      ) {
        this.value = this.target;
        this.velocity = 0;
      }
    }

    // Check if animation is complete
    const isComplete =
      Math.abs(this.velocity) < precision &&
      Math.abs(this.value - this.target) < precision;

    if (isComplete) {
      this.value = this.target;
      this.velocity = 0;
      this.isAnimating = false;

      // Resolve all promises
      this.resolvers.forEach(resolve => resolve());
      this.resolvers = [];
    }

    this.emit();

    if (this.isAnimating) {
      this.animationFrame = requestAnimationFrame(() => this.animate());
    }
  }

  private emit(): void {
    const state: AnimationState = {
      isAnimating: this.isAnimating,
      progress: this.target !== 0 ? this.value / this.target : 1,
      velocity: this.velocity
    };

    this.callbacks.forEach(cb => cb(state));
  }

  stop(): void {
    this.isAnimating = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  dispose(): void {
    this.stop();
    this.callbacks = [];
    this.resolvers = [];
  }
}

// ============================================================================
// Multi-Dimensional Spring
// ============================================================================

export class SpringVector {
  private springs: Map<string, Spring> = new Map();
  private config: SpringConfig;

  constructor(initial: Record<string, number> = {}, config: SpringConfig = {}) {
    this.config = config;

    for (const [key, value] of Object.entries(initial)) {
      this.springs.set(key, new Spring(value, config));
    }
  }

  get(key?: string): number | Record<string, number> {
    if (key) {
      return this.springs.get(key)?.get() ?? 0;
    }

    const values: Record<string, number> = {};
    for (const [k, spring] of this.springs) {
      values[k] = spring.get();
    }
    return values;
  }

  set(values: Record<string, number>, immediate: boolean = false): Promise<void[]> {
    const promises: Promise<void>[] = [];

    for (const [key, value] of Object.entries(values)) {
      let spring = this.springs.get(key);

      if (!spring) {
        spring = new Spring(value, this.config);
        this.springs.set(key, spring);
      }

      promises.push(spring.set(value, immediate));
    }

    return Promise.all(promises);
  }

  onUpdate(callback: (values: Record<string, number>) => void): () => void {
    const unsubscribes: Array<() => void> = [];

    for (const [, spring] of this.springs) {
      unsubscribes.push(spring.onUpdate(() => {
        callback(this.get() as Record<string, number>);
      }));
    }

    return () => unsubscribes.forEach(fn => fn());
  }

  dispose(): void {
    for (const spring of this.springs.values()) {
      spring.dispose();
    }
    this.springs.clear();
  }
}

// ============================================================================
// Animated Transform
// ============================================================================

export class AnimatedTransform {
  private element: HTMLElement;
  private springs: SpringVector;
  private willChange: string[] = [];

  constructor(element: HTMLElement, initial?: TransformValues, config?: SpringConfig) {
    this.element = element;
    this.springs = new SpringVector(
      {
        x: initial?.x ?? 0,
        y: initial?.y ?? 0,
        z: initial?.z ?? 0,
        scale: initial?.scale ?? 1,
        scaleX: initial?.scaleX ?? 1,
        scaleY: initial?.scaleY ?? 1,
        rotate: initial?.rotate ?? 0,
        rotateX: initial?.rotateX ?? 0,
        rotateY: initial?.rotateY ?? 0,
        rotateZ: initial?.rotateZ ?? 0,
        skewX: initial?.skewX ?? 0,
        skewY: initial?.skewY ?? 0,
        opacity: initial?.opacity ?? 1
      },
      config
    );

    this.setupWillChange();
    this.springs.onUpdate((values) => this.applyTransform(values));
  }

  private setupWillChange(): void {
    this.element.style.willChange = 'transform, opacity';
  }

  private applyTransform(values: Record<string, number>): void {
    const transforms: string[] = [];

    if (values.x !== 0 || values.y !== 0 || values.z !== 0) {
      transforms.push(`translate3d(${values.x}px, ${values.y}px, ${values.z}px)`);
    }

    if (values.scale !== 1) {
      transforms.push(`scale(${values.scale})`);
    } else {
      if (values.scaleX !== 1) transforms.push(`scaleX(${values.scaleX})`);
      if (values.scaleY !== 1) transforms.push(`scaleY(${values.scaleY})`);
    }

    if (values.rotate !== 0) {
      transforms.push(`rotate(${values.rotate}deg)`);
    }
    if (values.rotateX !== 0) transforms.push(`rotateX(${values.rotateX}deg)`);
    if (values.rotateY !== 0) transforms.push(`rotateY(${values.rotateY}deg)`);
    if (values.rotateZ !== 0) transforms.push(`rotateZ(${values.rotateZ}deg)`);

    if (values.skewX !== 0) transforms.push(`skewX(${values.skewX}deg)`);
    if (values.skewY !== 0) transforms.push(`skewY(${values.skewY}deg)`);

    this.element.style.transform = transforms.join(' ');
    this.element.style.opacity = String(values.opacity);
  }

  animate(values: Partial<TransformValues>): Promise<void[]> {
    return this.springs.set(values as Record<string, number>);
  }

  set(values: Partial<TransformValues>): void {
    this.springs.set(values as Record<string, number>, true);
  }

  get(): TransformValues {
    return this.springs.get() as TransformValues;
  }

  dispose(): void {
    this.element.style.willChange = '';
    this.springs.dispose();
  }
}

// ============================================================================
// FLIP Layout Animation
// ============================================================================

export class FlipAnimation {
  private element: HTMLElement;
  private firstRect: LayoutRect | null = null;
  private config: SpringConfig;

  constructor(element: HTMLElement, config?: SpringConfig) {
    this.element = element;
    this.config = config ?? SpringPresets.default;
  }

  first(): void {
    const rect = this.element.getBoundingClientRect();
    this.firstRect = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };
  }

  last(): LayoutRect {
    const rect = this.element.getBoundingClientRect();
    return {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    };
  }

  invert(): { x: number; y: number; scaleX: number; scaleY: number } | null {
    if (!this.firstRect) return null;

    const lastRect = this.last();

    return {
      x: this.firstRect.x - lastRect.x,
      y: this.firstRect.y - lastRect.y,
      scaleX: this.firstRect.width / lastRect.width,
      scaleY: this.firstRect.height / lastRect.height
    };
  }

  async play(): Promise<void> {
    const invert = this.invert();
    if (!invert) return;

    const transform = new AnimatedTransform(this.element, {
      x: invert.x,
      y: invert.y,
      scaleX: invert.scaleX,
      scaleY: invert.scaleY
    }, this.config);

    await transform.animate({ x: 0, y: 0, scaleX: 1, scaleY: 1 });
    transform.dispose();
  }
}

// ============================================================================
// Gesture-Driven Animation
// ============================================================================

export class GestureAnimation {
  private element: HTMLElement;
  private transform: AnimatedTransform;
  private state: GestureState;
  private isDragging: boolean = false;
  private startPoint: { x: number; y: number } = { x: 0, y: 0 };
  private lastPoint: { x: number; y: number } = { x: 0, y: 0 };
  private lastTime: number = 0;
  private bounds?: { minX: number; maxX: number; minY: number; maxY: number };
  private onDragEndCallback?: (state: GestureState) => void;

  constructor(element: HTMLElement, config?: SpringConfig) {
    this.element = element;
    this.transform = new AnimatedTransform(element, {}, config);
    this.state = this.createInitialState();
    this.setupListeners();
  }

  private createInitialState(): GestureState {
    return {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      vx: 0,
      vy: 0,
      isDragging: false,
      isPinching: false,
      scale: 1,
      rotation: 0
    };
  }

  private setupListeners(): void {
    this.element.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.isDragging = true;
    this.startPoint = { x: e.clientX, y: e.clientY };
    this.lastPoint = { x: e.clientX, y: e.clientY };
    this.lastTime = Date.now();
    this.state.isDragging = true;
    this.element.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.isDragging) return;

    const now = Date.now();
    const dt = (now - this.lastTime) / 1000;

    this.state.dx = e.clientX - this.lastPoint.x;
    this.state.dy = e.clientY - this.lastPoint.y;
    this.state.x += this.state.dx;
    this.state.y += this.state.dy;

    if (dt > 0) {
      this.state.vx = this.state.dx / dt;
      this.state.vy = this.state.dy / dt;
    }

    // Apply bounds
    if (this.bounds) {
      this.state.x = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, this.state.x));
      this.state.y = Math.max(this.bounds.minY, Math.min(this.bounds.maxY, this.state.y));
    }

    this.transform.set({ x: this.state.x, y: this.state.y });

    this.lastPoint = { x: e.clientX, y: e.clientY };
    this.lastTime = now;
  };

  private onPointerUp = (): void => {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.state.isDragging = false;

    if (this.onDragEndCallback) {
      this.onDragEndCallback(this.state);
    }
  };

  setBounds(bounds: { minX: number; maxX: number; minY: number; maxY: number }): void {
    this.bounds = bounds;
  }

  onDragEnd(callback: (state: GestureState) => void): void {
    this.onDragEndCallback = callback;
  }

  animateTo(x: number, y: number): Promise<void[]> {
    this.state.x = x;
    this.state.y = y;
    return this.transform.animate({ x, y });
  }

  reset(): Promise<void[]> {
    this.state = this.createInitialState();
    return this.transform.animate({ x: 0, y: 0 });
  }

  getState(): GestureState {
    return { ...this.state };
  }

  dispose(): void {
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.transform.dispose();
  }
}

// ============================================================================
// Scroll-Linked Animation
// ============================================================================

export class ScrollAnimation {
  private element: HTMLElement;
  private container: HTMLElement | Window;
  private startOffset: number;
  private endOffset: number;
  private callbacks: Array<(progress: number, info: ScrollInfo) => void> = [];
  private lastScrollY: number = 0;
  private lastTime: number = 0;
  private ticking: boolean = false;

  constructor(
    element: HTMLElement,
    options: {
      container?: HTMLElement;
      startOffset?: number;
      endOffset?: number;
    } = {}
  ) {
    this.element = element;
    this.container = options.container ?? window;
    this.startOffset = options.startOffset ?? 0;
    this.endOffset = options.endOffset ?? 1;
    this.setupListener();
  }

  private setupListener(): void {
    this.container.addEventListener('scroll', this.onScroll, { passive: true });
  }

  private onScroll = (): void => {
    if (!this.ticking) {
      requestAnimationFrame(() => {
        this.update();
        this.ticking = false;
      });
      this.ticking = true;
    }
  };

  private update(): void {
    const now = Date.now();
    const scrollY = this.getScrollY();
    const dt = (now - this.lastTime) / 1000;

    const rect = this.element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Calculate progress based on element position
    const elementTop = rect.top + scrollY;
    const elementBottom = elementTop + rect.height;
    const scrollTop = scrollY;
    const scrollBottom = scrollY + viewportHeight;

    let progress = 0;
    if (scrollBottom > elementTop && scrollTop < elementBottom) {
      const visibleTop = Math.max(scrollTop, elementTop);
      const visibleBottom = Math.min(scrollBottom, elementBottom);
      progress = (visibleBottom - visibleTop) / rect.height;
    }

    // Apply offset mapping
    progress = (progress - this.startOffset) / (this.endOffset - this.startOffset);
    progress = Math.max(0, Math.min(1, progress));

    const velocity = dt > 0 ? (scrollY - this.lastScrollY) / dt : 0;
    const direction = velocity > 0 ? 'down' : velocity < 0 ? 'up' : null;

    const info: ScrollInfo = {
      x: this.getScrollX(),
      y: scrollY,
      progress,
      velocity,
      direction
    };

    this.callbacks.forEach(cb => cb(progress, info));

    this.lastScrollY = scrollY;
    this.lastTime = now;
  }

  private getScrollY(): number {
    if (this.container === window) {
      return window.scrollY;
    }
    return (this.container as HTMLElement).scrollTop;
  }

  private getScrollX(): number {
    if (this.container === window) {
      return window.scrollX;
    }
    return (this.container as HTMLElement).scrollLeft;
  }

  onProgress(callback: (progress: number, info: ScrollInfo) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) this.callbacks.splice(index, 1);
    };
  }

  dispose(): void {
    this.container.removeEventListener('scroll', this.onScroll);
    this.callbacks = [];
  }
}

// ============================================================================
// Animation Sequence
// ============================================================================

export class AnimationSequence {
  private steps: Array<{
    targets: HTMLElement[];
    values: TransformValues;
    config?: SpringConfig;
    stagger?: number;
  }> = [];
  private isPlaying: boolean = false;

  to(
    targets: HTMLElement | HTMLElement[],
    values: TransformValues,
    options?: { config?: SpringConfig; stagger?: number }
  ): AnimationSequence {
    this.steps.push({
      targets: Array.isArray(targets) ? targets : [targets],
      values,
      config: options?.config,
      stagger: options?.stagger
    });
    return this;
  }

  async play(): Promise<void> {
    if (this.isPlaying) return;
    this.isPlaying = true;

    for (const step of this.steps) {
      const promises: Promise<void[]>[] = [];

      step.targets.forEach((target, index) => {
        const delay = step.stagger ? step.stagger * index : 0;

        const promise = new Promise<void[]>((resolve) => {
          setTimeout(async () => {
            const transform = new AnimatedTransform(target, {}, step.config);
            await transform.animate(step.values);
            transform.dispose();
            resolve([]);
          }, delay);
        });

        promises.push(promise);
      });

      await Promise.all(promises);
    }

    this.isPlaying = false;
  }

  reset(): void {
    this.steps = [];
    this.isPlaying = false;
  }
}

// ============================================================================
// Easing Functions
// ============================================================================

export const Easing = {
  linear: (t: number) => t,

  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  easeInElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  easeOutElastic: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },

  easeOutBounce: (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};

// ============================================================================
// Hooks
// ============================================================================

type CleanupFn = () => void;
type EffectFn = () => void | CleanupFn;

const effectQueue: EffectFn[] = [];

function useEffect(effect: EffectFn, _deps?: unknown[]): void {
  effectQueue.push(effect);
}

function useState<T>(initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  let state = initial;
  const setState = (value: T | ((prev: T) => T)) => {
    state = typeof value === 'function' ? (value as (prev: T) => T)(state) : value;
  };
  return [state, setState];
}

function useRef<T>(initial: T): { current: T } {
  return { current: initial };
}

function useCallback<T extends (...args: unknown[]) => unknown>(fn: T, _deps: unknown[]): T {
  return fn;
}

export function useSpring(initial: number = 0, config?: SpringConfig) {
  const springRef = useRef<Spring | null>(null);
  const [value, setValue] = useState(initial);

  useEffect(() => {
    springRef.current = new Spring(initial, config);
    springRef.current.onUpdate((state) => {
      setValue(springRef.current!.get());
    });

    return () => springRef.current?.dispose();
  }, []);

  const set = useCallback((newValue: number) => {
    return springRef.current?.set(newValue);
  }, []);

  const setImmediate = useCallback((newValue: number) => {
    return springRef.current?.set(newValue, true);
  }, []);

  return { value, set, setImmediate };
}

export function useSpringVector(
  initial: Record<string, number> = {},
  config?: SpringConfig
) {
  const springRef = useRef<SpringVector | null>(null);
  const [values, setValues] = useState(initial);

  useEffect(() => {
    springRef.current = new SpringVector(initial, config);
    springRef.current.onUpdate(setValues);

    return () => springRef.current?.dispose();
  }, []);

  const set = useCallback((newValues: Record<string, number>) => {
    return springRef.current?.set(newValues);
  }, []);

  return { values, set };
}

export function useAnimatedTransform(
  elementRef: { current: HTMLElement | null },
  initial?: TransformValues,
  config?: SpringConfig
) {
  const transformRef = useRef<AnimatedTransform | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    transformRef.current = new AnimatedTransform(
      elementRef.current,
      initial,
      config
    );

    return () => transformRef.current?.dispose();
  }, [elementRef.current]);

  const animate = useCallback((values: Partial<TransformValues>) => {
    return transformRef.current?.animate(values);
  }, []);

  const set = useCallback((values: Partial<TransformValues>) => {
    transformRef.current?.set(values);
  }, []);

  return { animate, set };
}

export function useGesture(
  elementRef: { current: HTMLElement | null },
  config?: SpringConfig
) {
  const gestureRef = useRef<GestureAnimation | null>(null);
  const [state, setState] = useState<GestureState>({
    x: 0, y: 0, dx: 0, dy: 0, vx: 0, vy: 0,
    isDragging: false, isPinching: false, scale: 1, rotation: 0
  });

  useEffect(() => {
    if (!elementRef.current) return;

    gestureRef.current = new GestureAnimation(elementRef.current, config);

    return () => gestureRef.current?.dispose();
  }, [elementRef.current]);

  const setBounds = useCallback((bounds: { minX: number; maxX: number; minY: number; maxY: number }) => {
    gestureRef.current?.setBounds(bounds);
  }, []);

  const animateTo = useCallback((x: number, y: number) => {
    return gestureRef.current?.animateTo(x, y);
  }, []);

  const reset = useCallback(() => {
    return gestureRef.current?.reset();
  }, []);

  return { state, setBounds, animateTo, reset };
}

export function useScrollAnimation(
  elementRef: { current: HTMLElement | null },
  options?: { startOffset?: number; endOffset?: number }
) {
  const animationRef = useRef<ScrollAnimation | null>(null);
  const [progress, setProgress] = useState(0);
  const [scrollInfo, setScrollInfo] = useState<ScrollInfo | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    animationRef.current = new ScrollAnimation(elementRef.current, options);
    animationRef.current.onProgress((p, info) => {
      setProgress(p);
      setScrollInfo(info);
    });

    return () => animationRef.current?.dispose();
  }, [elementRef.current]);

  return { progress, scrollInfo };
}

export function useFlip(elementRef: { current: HTMLElement | null }, config?: SpringConfig) {
  const flipRef = useRef<FlipAnimation | null>(null);

  useEffect(() => {
    if (!elementRef.current) return;
    flipRef.current = new FlipAnimation(elementRef.current, config);
  }, [elementRef.current]);

  const snapshot = useCallback(() => {
    flipRef.current?.first();
  }, []);

  const animate = useCallback(() => {
    return flipRef.current?.play();
  }, []);

  return { snapshot, animate };
}

// Export everything
export default {
  Spring,
  SpringVector,
  SpringPresets,
  AnimatedTransform,
  FlipAnimation,
  GestureAnimation,
  ScrollAnimation,
  AnimationSequence,
  Easing,
  useSpring,
  useSpringVector,
  useAnimatedTransform,
  useGesture,
  useScrollAnimation,
  useFlip
};
