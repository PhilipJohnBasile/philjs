/**
 * Gesture System for PhilJS CSS
 *
 * Touch and pointer gesture handling:
 * - Swipe detection (4 directions)
 * - Pinch/zoom gestures
 * - Pan/drag gestures
 * - Long press detection
 * - Tap/double-tap
 * - Rotation gestures
 * - Gesture-driven animations
 */

// =============================================================================
// Types
// =============================================================================

export interface Point {
  x: number;
  y: number;
}

export interface GestureState {
  startPoint: Point;
  currentPoint: Point;
  previousPoint: Point;
  velocity: Point;
  distance: Point;
  direction: Direction | null;
  scale: number;
  rotation: number;
  startTime: number;
  duration: number;
  isActive: boolean;
  pointerCount: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export type GestureType =
  | 'tap'
  | 'doubletap'
  | 'longpress'
  | 'swipe'
  | 'pan'
  | 'pinch'
  | 'rotate'
  | 'drag';

export interface GestureEvent {
  type: GestureType;
  state: GestureState;
  target: Element;
  originalEvent: PointerEvent | TouchEvent;
  preventDefault: () => void;
  stopPropagation: () => void;
}

export interface SwipeEvent extends GestureEvent {
  type: 'swipe';
  direction: Direction;
  velocity: number;
}

export interface PinchEvent extends GestureEvent {
  type: 'pinch';
  scale: number;
  center: Point;
}

export interface RotateEvent extends GestureEvent {
  type: 'rotate';
  rotation: number;
  center: Point;
}

export interface PanEvent extends GestureEvent {
  type: 'pan';
  delta: Point;
  offset: Point;
}

export interface GestureConfig {
  swipe?: SwipeConfig;
  pinch?: PinchConfig;
  pan?: PanConfig;
  tap?: TapConfig;
  longPress?: LongPressConfig;
  rotate?: RotateConfig;
}

export interface SwipeConfig {
  threshold?: number;
  velocity?: number;
  direction?: Direction | Direction[] | 'all';
}

export interface PinchConfig {
  threshold?: number;
  minScale?: number;
  maxScale?: number;
}

export interface PanConfig {
  threshold?: number;
  lockDirection?: boolean;
  bounds?: { left?: number; right?: number; top?: number; bottom?: number };
}

export interface TapConfig {
  maxDuration?: number;
  maxDistance?: number;
  doubleTapDelay?: number;
}

export interface LongPressConfig {
  duration?: number;
  maxDistance?: number;
}

export interface RotateConfig {
  threshold?: number;
}

export type GestureHandler<T extends GestureEvent = GestureEvent> = (event: T) => void;

export interface GestureHandlers {
  onTap?: GestureHandler;
  onDoubleTap?: GestureHandler;
  onLongPress?: GestureHandler;
  onSwipe?: GestureHandler<SwipeEvent>;
  onSwipeUp?: GestureHandler<SwipeEvent>;
  onSwipeDown?: GestureHandler<SwipeEvent>;
  onSwipeLeft?: GestureHandler<SwipeEvent>;
  onSwipeRight?: GestureHandler<SwipeEvent>;
  onPan?: GestureHandler<PanEvent>;
  onPanStart?: GestureHandler<PanEvent>;
  onPanEnd?: GestureHandler<PanEvent>;
  onPinch?: GestureHandler<PinchEvent>;
  onPinchStart?: GestureHandler<PinchEvent>;
  onPinchEnd?: GestureHandler<PinchEvent>;
  onRotate?: GestureHandler<RotateEvent>;
  onRotateStart?: GestureHandler<RotateEvent>;
  onRotateEnd?: GestureHandler<RotateEvent>;
  onDragStart?: GestureHandler;
  onDrag?: GestureHandler;
  onDragEnd?: GestureHandler;
}

// =============================================================================
// Gesture Manager
// =============================================================================

interface GestureBinding {
  element: Element;
  handlers: GestureHandlers;
  config: GestureConfig;
  cleanup: () => void;
}

const bindings = new WeakMap<Element, GestureBinding>();

/**
 * Attach gesture handlers to an element
 */
export function attachGestures(
  element: Element,
  handlers: GestureHandlers,
  config: GestureConfig = {}
): () => void {
  // Clean up existing binding
  const existing = bindings.get(element);
  if (existing) {
    existing.cleanup();
  }

  const state: GestureState = createInitialState();
  const pointers = new Map<number, Point>();
  let longPressTimer: ReturnType<typeof setTimeout> | null = null;
  let lastTapTime = 0;
  let lastTapPoint: Point | null = null;

  const defaultConfig: Required<GestureConfig> = {
    swipe: { threshold: 50, velocity: 0.3, direction: 'all' },
    pinch: { threshold: 0.1, minScale: 0.5, maxScale: 3 },
    pan: { threshold: 10, lockDirection: false },
    tap: { maxDuration: 300, maxDistance: 10, doubleTapDelay: 300 },
    longPress: { duration: 500, maxDistance: 10 },
    rotate: { threshold: 5 },
  };

  const mergedConfig = {
    swipe: { ...defaultConfig.swipe, ...config.swipe },
    pinch: { ...defaultConfig.pinch, ...config.pinch },
    pan: { ...defaultConfig.pan, ...config.pan },
    tap: { ...defaultConfig.tap, ...config.tap },
    longPress: { ...defaultConfig.longPress, ...config.longPress },
    rotate: { ...defaultConfig.rotate, ...config.rotate },
  };

  function handlePointerDown(e: PointerEvent) {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (element as HTMLElement).setPointerCapture?.(e.pointerId);

    if (pointers.size === 1) {
      state.startPoint = { x: e.clientX, y: e.clientY };
      state.currentPoint = { x: e.clientX, y: e.clientY };
      state.previousPoint = { x: e.clientX, y: e.clientY };
      state.startTime = Date.now();
      state.isActive = true;

      // Start long press timer
      longPressTimer = setTimeout(() => {
        const distance = getDistance(state.startPoint, state.currentPoint);
        if (distance <= mergedConfig.longPress.maxDistance) {
          handlers.onLongPress?.(createGestureEvent('longpress', state, element, e));
        }
      }, mergedConfig.longPress.duration);
    }

    state.pointerCount = pointers.size;
  }

  function handlePointerMove(e: PointerEvent) {
    if (!state.isActive) return;

    const prev = pointers.get(e.pointerId);
    if (!prev) return;

    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    state.previousPoint = { ...state.currentPoint };
    state.currentPoint = { x: e.clientX, y: e.clientY };
    state.duration = Date.now() - state.startTime;

    // Cancel long press if moved too far
    if (longPressTimer) {
      const distance = getDistance(state.startPoint, state.currentPoint);
      if (distance > mergedConfig.longPress.maxDistance) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }

    // Calculate velocity
    const dt = Math.max(16, Date.now() - (state.startTime + state.duration));
    state.velocity = {
      x: (state.currentPoint.x - state.previousPoint.x) / dt,
      y: (state.currentPoint.y - state.previousPoint.y) / dt,
    };

    // Calculate distance from start
    state.distance = {
      x: state.currentPoint.x - state.startPoint.x,
      y: state.currentPoint.y - state.startPoint.y,
    };

    // Determine direction
    state.direction = getDirection(state.distance);

    // Handle multi-touch gestures
    if (pointers.size >= 2) {
      const points = Array.from(pointers.values());
      const [p1, p2] = points;

      // Pinch detection
      const currentDistance = getDistance(p1, p2);
      const initialDistance = state.scale === 1 ? currentDistance : currentDistance / state.scale;
      const newScale = currentDistance / initialDistance;

      if (Math.abs(newScale - state.scale) > mergedConfig.pinch.threshold) {
        state.scale = Math.max(
          mergedConfig.pinch.minScale,
          Math.min(mergedConfig.pinch.maxScale, newScale)
        );
        const center = getCenter(p1, p2);
        handlers.onPinch?.(createPinchEvent(state, center, element, e));
      }

      // Rotation detection
      const angle = getAngle(p1, p2);
      const rotationDelta = angle - state.rotation;
      if (Math.abs(rotationDelta) > mergedConfig.rotate.threshold) {
        state.rotation = angle;
        const center = getCenter(p1, p2);
        handlers.onRotate?.(createRotateEvent(state, center, element, e));
      }
    }

    // Pan detection
    const totalDistance = getDistance(state.startPoint, state.currentPoint);
    if (totalDistance > mergedConfig.pan.threshold) {
      const delta = {
        x: state.currentPoint.x - state.previousPoint.x,
        y: state.currentPoint.y - state.previousPoint.y,
      };
      const offset = { ...state.distance };
      handlers.onPan?.(createPanEvent(state, delta, offset, element, e));
    }
  }

  function handlePointerUp(e: PointerEvent) {
    pointers.delete(e.pointerId);
    (element as HTMLElement).releasePointerCapture?.(e.pointerId);

    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }

    if (!state.isActive) return;

    state.duration = Date.now() - state.startTime;
    const distance = getDistance(state.startPoint, state.currentPoint);
    const velocity = Math.sqrt(state.velocity.x ** 2 + state.velocity.y ** 2);

    // Tap detection
    if (distance <= mergedConfig.tap.maxDistance && state.duration <= mergedConfig.tap.maxDuration) {
      const now = Date.now();

      // Double tap detection
      if (lastTapPoint && lastTapTime && now - lastTapTime < mergedConfig.tap.doubleTapDelay) {
        const tapDistance = getDistance(lastTapPoint, state.currentPoint);
        if (tapDistance <= mergedConfig.tap.maxDistance * 2) {
          handlers.onDoubleTap?.(createGestureEvent('doubletap', state, element, e));
          lastTapTime = 0;
          lastTapPoint = null;
        }
      } else {
        handlers.onTap?.(createGestureEvent('tap', state, element, e));
        lastTapTime = now;
        lastTapPoint = { ...state.currentPoint };
      }
    }

    // Swipe detection
    if (
      distance >= mergedConfig.swipe.threshold &&
      velocity >= mergedConfig.swipe.velocity &&
      state.direction
    ) {
      const allowedDirections = mergedConfig.swipe.direction === 'all'
        ? ['up', 'down', 'left', 'right']
        : Array.isArray(mergedConfig.swipe.direction)
        ? mergedConfig.swipe.direction
        : [mergedConfig.swipe.direction];

      if (allowedDirections.includes(state.direction)) {
        const swipeEvent = createSwipeEvent(state, velocity, element, e);
        handlers.onSwipe?.(swipeEvent);

        // Direction-specific handlers
        switch (state.direction) {
          case 'up': handlers.onSwipeUp?.(swipeEvent); break;
          case 'down': handlers.onSwipeDown?.(swipeEvent); break;
          case 'left': handlers.onSwipeLeft?.(swipeEvent); break;
          case 'right': handlers.onSwipeRight?.(swipeEvent); break;
        }
      }
    }

    // Pan end
    if (distance > mergedConfig.pan.threshold) {
      handlers.onPanEnd?.(createPanEvent(state, state.velocity, state.distance, element, e));
    }

    // Reset state if no more pointers
    if (pointers.size === 0) {
      Object.assign(state, createInitialState());
    }
  }

  function handlePointerCancel(e: PointerEvent) {
    pointers.delete(e.pointerId);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
    if (pointers.size === 0) {
      Object.assign(state, createInitialState());
    }
  }

  // Attach event listeners
  element.addEventListener('pointerdown', handlePointerDown as EventListener);
  element.addEventListener('pointermove', handlePointerMove as EventListener);
  element.addEventListener('pointerup', handlePointerUp as EventListener);
  element.addEventListener('pointercancel', handlePointerCancel as EventListener);

  // Prevent default touch behavior
  element.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

  const cleanup = () => {
    element.removeEventListener('pointerdown', handlePointerDown as EventListener);
    element.removeEventListener('pointermove', handlePointerMove as EventListener);
    element.removeEventListener('pointerup', handlePointerUp as EventListener);
    element.removeEventListener('pointercancel', handlePointerCancel as EventListener);
    bindings.delete(element);
  };

  bindings.set(element, { element, handlers, config: mergedConfig, cleanup });
  return cleanup;
}

// =============================================================================
// CSS Gesture Styles
// =============================================================================

/**
 * Generate CSS for swipeable elements
 */
export function swipeableStyles(options: {
  direction?: 'horizontal' | 'vertical' | 'both';
  threshold?: string;
  resistance?: number;
} = {}): string {
  const { direction = 'horizontal', threshold = '30%', resistance = 0.5 } = options;

  return `
    touch-action: ${direction === 'horizontal' ? 'pan-y' : direction === 'vertical' ? 'pan-x' : 'none'};
    user-select: none;
    -webkit-user-drag: none;
    will-change: transform;
    transition: transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
  `;
}

/**
 * Generate CSS for draggable elements
 */
export function draggableStyles(options: {
  cursor?: 'grab' | 'move' | 'pointer';
  activeScale?: number;
} = {}): string {
  const { cursor = 'grab', activeScale = 1.02 } = options;

  return `
    cursor: ${cursor};
    touch-action: none;
    user-select: none;
    -webkit-user-drag: none;
    will-change: transform;
    transition: transform 0.15s ease, box-shadow 0.15s ease;

    &:active {
      cursor: grabbing;
      transform: scale(${activeScale});
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
  `;
}

/**
 * Generate CSS for pinch-zoomable elements
 */
export function zoomableStyles(options: {
  minScale?: number;
  maxScale?: number;
  origin?: string;
} = {}): string {
  const { minScale = 0.5, maxScale = 3, origin = 'center' } = options;

  return `
    touch-action: none;
    transform-origin: ${origin};
    will-change: transform;
    transition: transform 0.2s ease-out;
    min-scale: ${minScale};
    max-scale: ${maxScale};
  `;
}

/**
 * CSS for pull-to-refresh container
 */
export function pullToRefreshStyles(options: {
  threshold?: string;
  indicatorSize?: string;
} = {}): string {
  const { threshold = '80px', indicatorSize = '40px' } = options;

  return `
    position: relative;
    overflow-y: auto;
    overscroll-behavior-y: contain;

    &::before {
      content: '';
      position: absolute;
      top: calc(-${indicatorSize} - 10px);
      left: 50%;
      transform: translateX(-50%);
      width: ${indicatorSize};
      height: ${indicatorSize};
      border: 3px solid #e0e0e0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      opacity: 0;
      transition: opacity 0.2s, transform 0.2s;
    }

    &[data-pulling="true"]::before {
      opacity: 1;
    }

    &[data-refreshing="true"]::before {
      opacity: 1;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: translateX(-50%) rotate(360deg); }
    }
  `;
}

// =============================================================================
// Gesture-Driven Animations
// =============================================================================

/**
 * Create a gesture-driven animation binding
 */
export function createGestureAnimation(options: {
  element: Element;
  gesture: 'pan' | 'swipe' | 'pinch';
  property: string;
  range: [number, number];
  unit?: string;
  easing?: (t: number) => number;
}): () => void {
  const { element, gesture, property, range, unit = 'px', easing = (t) => t } = options;
  const [min, max] = range;
  const delta = max - min;

  const handlers: GestureHandlers = {};

  if (gesture === 'pan') {
    handlers.onPan = (e) => {
      const progress = Math.max(0, Math.min(1, (e.offset.x - min) / delta));
      const value = min + easing(progress) * delta;
      (element as HTMLElement).style.setProperty(property, `${value}${unit}`);
    };
  } else if (gesture === 'pinch') {
    handlers.onPinch = (e) => {
      const value = min + (e.scale - 1) * delta;
      (element as HTMLElement).style.setProperty(property, `${Math.max(min, Math.min(max, value))}${unit}`);
    };
  }

  return attachGestures(element, handlers);
}

/**
 * Create swipe-to-dismiss behavior
 */
export function swipeToDismiss(
  element: Element,
  options: {
    direction?: Direction | Direction[];
    threshold?: number;
    onDismiss: (direction: Direction) => void;
  }
): () => void {
  const { direction = 'right', threshold = 100, onDismiss } = options;
  const directions = Array.isArray(direction) ? direction : [direction];

  let startX = 0;
  let currentX = 0;

  return attachGestures(element, {
    onPan: (e) => {
      currentX = e.offset.x;
      (element as HTMLElement).style.transform = `translateX(${currentX}px)`;
      (element as HTMLElement).style.opacity = `${1 - Math.abs(currentX) / (threshold * 2)}`;
    },
    onPanEnd: (e) => {
      const dir = e.offset.x > 0 ? 'right' : 'left';

      if (Math.abs(currentX) > threshold && directions.includes(dir)) {
        const exitX = dir === 'right' ? window.innerWidth : -window.innerWidth;
        (element as HTMLElement).style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        (element as HTMLElement).style.transform = `translateX(${exitX}px)`;
        (element as HTMLElement).style.opacity = '0';
        onDismiss(dir);
      } else {
        (element as HTMLElement).style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        (element as HTMLElement).style.transform = 'translateX(0)';
        (element as HTMLElement).style.opacity = '1';
      }
    },
  });
}

/**
 * Create pull-to-refresh behavior
 */
export function pullToRefresh(
  element: Element,
  options: {
    threshold?: number;
    resistance?: number;
    onRefresh: () => Promise<void>;
  }
): () => void {
  const { threshold = 80, resistance = 0.4, onRefresh } = options;
  let pullDistance = 0;
  let isRefreshing = false;

  return attachGestures(element, {
    onPan: (e) => {
      if (isRefreshing) return;
      if (element.scrollTop > 0) return;
      if (e.offset.y < 0) return;

      pullDistance = e.offset.y * resistance;
      (element as HTMLElement).style.transform = `translateY(${pullDistance}px)`;
      element.setAttribute('data-pulling', 'true');
    },
    onPanEnd: async () => {
      if (isRefreshing) return;

      if (pullDistance >= threshold) {
        isRefreshing = true;
        element.setAttribute('data-refreshing', 'true');
        element.removeAttribute('data-pulling');

        (element as HTMLElement).style.transform = `translateY(${threshold}px)`;

        await onRefresh();

        isRefreshing = false;
        element.removeAttribute('data-refreshing');
      }

      (element as HTMLElement).style.transition = 'transform 0.3s ease-out';
      (element as HTMLElement).style.transform = 'translateY(0)';
      setTimeout(() => {
        (element as HTMLElement).style.transition = '';
      }, 300);

      element.removeAttribute('data-pulling');
      pullDistance = 0;
    },
  });
}

/**
 * Create carousel/slider behavior
 */
export function createCarousel(
  container: Element,
  options: {
    itemSelector: string;
    infinite?: boolean;
    autoplay?: number;
    onChange?: (index: number) => void;
  }
): {
  cleanup: () => void;
  goTo: (index: number) => void;
  next: () => void;
  prev: () => void;
  getCurrentIndex: () => number;
} {
  const { itemSelector, infinite = false, autoplay, onChange } = options;
  const items = container.querySelectorAll(itemSelector);
  const itemCount = items.length;
  let currentIndex = 0;
  let autoplayInterval: ReturnType<typeof setInterval> | null = null;

  const track = container.querySelector('[data-carousel-track]') || container.firstElementChild!;
  const itemWidth = (items[0] as HTMLElement).offsetWidth;

  function updatePosition(animate = true) {
    if (animate) {
      (track as HTMLElement).style.transition = 'transform 0.3s ease-out';
    }
    (track as HTMLElement).style.transform = `translateX(${-currentIndex * itemWidth}px)`;
    onChange?.(currentIndex);
  }

  function goTo(index: number) {
    if (infinite) {
      currentIndex = ((index % itemCount) + itemCount) % itemCount;
    } else {
      currentIndex = Math.max(0, Math.min(itemCount - 1, index));
    }
    updatePosition();
  }

  function next() {
    goTo(currentIndex + 1);
  }

  function prev() {
    goTo(currentIndex - 1);
  }

  const gestureCleanup = attachGestures(container, {
    onSwipeLeft: () => next(),
    onSwipeRight: () => prev(),
    onPan: (e) => {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
      }
      (track as HTMLElement).style.transition = 'none';
      const offset = -currentIndex * itemWidth + e.offset.x;
      (track as HTMLElement).style.transform = `translateX(${offset}px)`;
    },
    onPanEnd: (e) => {
      if (Math.abs(e.offset.x) > itemWidth / 3) {
        if (e.offset.x > 0) prev();
        else next();
      } else {
        updatePosition();
      }
    },
  }, {
    swipe: { direction: ['left', 'right'] },
  });

  if (autoplay) {
    autoplayInterval = setInterval(next, autoplay);
  }

  return {
    cleanup: () => {
      gestureCleanup();
      if (autoplayInterval) clearInterval(autoplayInterval);
    },
    goTo,
    next,
    prev,
    getCurrentIndex: () => currentIndex,
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

function createInitialState(): GestureState {
  return {
    startPoint: { x: 0, y: 0 },
    currentPoint: { x: 0, y: 0 },
    previousPoint: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    distance: { x: 0, y: 0 },
    direction: null,
    scale: 1,
    rotation: 0,
    startTime: 0,
    duration: 0,
    isActive: false,
    pointerCount: 0,
  };
}

function getDistance(p1: Point, p2: Point): number {
  return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
}

function getCenter(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

function getAngle(p1: Point, p2: Point): number {
  return (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
}

function getDirection(distance: Point): Direction | null {
  const { x, y } = distance;
  const absX = Math.abs(x);
  const absY = Math.abs(y);

  if (absX < 10 && absY < 10) return null;

  if (absX > absY) {
    return x > 0 ? 'right' : 'left';
  } else {
    return y > 0 ? 'down' : 'up';
  }
}

function createGestureEvent(
  type: GestureType,
  state: GestureState,
  target: Element,
  originalEvent: PointerEvent | TouchEvent
): GestureEvent {
  return {
    type,
    state: { ...state },
    target,
    originalEvent,
    preventDefault: () => originalEvent.preventDefault(),
    stopPropagation: () => originalEvent.stopPropagation(),
  };
}

function createSwipeEvent(
  state: GestureState,
  velocity: number,
  target: Element,
  originalEvent: PointerEvent | TouchEvent
): SwipeEvent {
  return {
    ...createGestureEvent('swipe', state, target, originalEvent),
    type: 'swipe',
    direction: state.direction!,
    velocity,
  };
}

function createPinchEvent(
  state: GestureState,
  center: Point,
  target: Element,
  originalEvent: PointerEvent | TouchEvent
): PinchEvent {
  return {
    ...createGestureEvent('pinch', state, target, originalEvent),
    type: 'pinch',
    scale: state.scale,
    center,
  };
}

function createRotateEvent(
  state: GestureState,
  center: Point,
  target: Element,
  originalEvent: PointerEvent | TouchEvent
): RotateEvent {
  return {
    ...createGestureEvent('rotate', state, target, originalEvent),
    type: 'rotate',
    rotation: state.rotation,
    center,
  };
}

function createPanEvent(
  state: GestureState,
  delta: Point,
  offset: Point,
  target: Element,
  originalEvent: PointerEvent | TouchEvent
): PanEvent {
  return {
    ...createGestureEvent('pan', state, target, originalEvent),
    type: 'pan',
    delta,
    offset,
  };
}

// =============================================================================
// Presets
// =============================================================================

/**
 * Common gesture configurations
 */
export const gesturePresets = {
  standard: {
    swipe: { threshold: 50, velocity: 0.3 },
    tap: { maxDuration: 300, maxDistance: 10 },
    longPress: { duration: 500 },
  },
  sensitive: {
    swipe: { threshold: 30, velocity: 0.2 },
    tap: { maxDuration: 400, maxDistance: 15 },
    longPress: { duration: 400 },
  },
  strict: {
    swipe: { threshold: 80, velocity: 0.5 },
    tap: { maxDuration: 200, maxDistance: 5 },
    longPress: { duration: 700 },
  },
} as const;

/**
 * Direction vectors for calculations
 */
export const directionVectors: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
