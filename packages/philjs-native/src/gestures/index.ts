/**
 * PhilJS Native - Gesture System
 *
 * Provides gesture recognition for swipe, pinch, pan, and long press.
 * Works on both touch and pointer devices.
 */

import { signal, type Signal } from 'philjs-core';

// ============================================================================
// Types
// ============================================================================

/**
 * Point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Velocity in 2D space
 */
export interface Velocity {
  vx: number;
  vy: number;
}

/**
 * Gesture state
 */
export type GestureState = 'idle' | 'began' | 'changed' | 'ended' | 'cancelled';

/**
 * Swipe direction
 */
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Base gesture event
 */
export interface BaseGestureEvent {
  /** Gesture state */
  state: GestureState;
  /** Touch/pointer count */
  pointerCount: number;
  /** Timestamp */
  timestamp: number;
  /** Native event */
  nativeEvent: TouchEvent | PointerEvent | MouseEvent;
}

/**
 * Pan gesture event
 */
export interface PanGestureEvent extends BaseGestureEvent {
  /** Current position */
  position: Point;
  /** Translation from start */
  translation: Point;
  /** Velocity */
  velocity: Velocity;
  /** Absolute translation distance */
  absoluteTranslation: number;
}

/**
 * Pinch gesture event
 */
export interface PinchGestureEvent extends BaseGestureEvent {
  /** Scale factor */
  scale: number;
  /** Focal point (center between fingers) */
  focalPoint: Point;
  /** Velocity of scale change */
  velocity: number;
}

/**
 * Rotation gesture event
 */
export interface RotationGestureEvent extends BaseGestureEvent {
  /** Rotation in radians */
  rotation: number;
  /** Velocity of rotation */
  velocity: number;
  /** Anchor point */
  anchorPoint: Point;
}

/**
 * Swipe gesture event
 */
export interface SwipeGestureEvent extends BaseGestureEvent {
  /** Swipe direction */
  direction: SwipeDirection;
  /** Velocity */
  velocity: Velocity;
  /** Distance traveled */
  distance: number;
}

/**
 * Long press gesture event
 */
export interface LongPressGestureEvent extends BaseGestureEvent {
  /** Press position */
  position: Point;
  /** Duration of press in ms */
  duration: number;
}

/**
 * Tap gesture event
 */
export interface TapGestureEvent extends BaseGestureEvent {
  /** Tap position */
  position: Point;
  /** Number of taps */
  tapCount: number;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Gesture recognizer config
 */
export interface GestureConfig {
  /** Enabled state */
  enabled?: boolean;
  /** Minimum pointers required */
  minPointers?: number;
  /** Maximum pointers allowed */
  maxPointers?: number;
}

/**
 * Pan gesture config
 */
export interface PanGestureConfig extends GestureConfig {
  /** Minimum distance to activate (px) */
  minDistance?: number;
  /** Direction lock */
  lockDirection?: 'horizontal' | 'vertical' | 'none';
  /** Active offset X */
  activeOffsetX?: number | [number, number];
  /** Active offset Y */
  activeOffsetY?: number | [number, number];
  /** Fail offset X */
  failOffsetX?: number | [number, number];
  /** Fail offset Y */
  failOffsetY?: number | [number, number];
}

/**
 * Pinch gesture config
 */
export interface PinchGestureConfig extends GestureConfig {
  /** Minimum scale change to activate */
  minScale?: number;
}

/**
 * Swipe gesture config
 */
export interface SwipeGestureConfig extends GestureConfig {
  /** Direction(s) to recognize */
  direction?: SwipeDirection | SwipeDirection[];
  /** Minimum velocity (px/ms) */
  minVelocity?: number;
  /** Minimum distance (px) */
  minDistance?: number;
  /** Maximum duration (ms) */
  maxDuration?: number;
}

/**
 * Long press gesture config
 */
export interface LongPressGestureConfig extends GestureConfig {
  /** Duration to trigger (ms) */
  minDuration?: number;
  /** Maximum movement allowed (px) */
  maxDistance?: number;
}

/**
 * Tap gesture config
 */
export interface TapGestureConfig extends GestureConfig {
  /** Number of taps required */
  numberOfTaps?: number;
  /** Number of fingers required */
  numberOfTouches?: number;
  /** Max duration for each tap (ms) */
  maxDuration?: number;
  /** Max delay between taps (ms) */
  maxDelay?: number;
  /** Max distance between taps (px) */
  maxDistance?: number;
}

// ============================================================================
// Gesture State
// ============================================================================

/**
 * Active gesture tracking
 */
interface GestureTracker {
  startTime: number;
  startPosition: Point;
  currentPosition: Point;
  pointers: Map<number, Point>;
  previousPointers: Map<number, Point>;
  initialDistance?: number;
  initialAngle?: number;
}

/**
 * Create initial tracker
 */
function createTracker(): GestureTracker {
  return {
    startTime: 0,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    pointers: new Map(),
    previousPointers: new Map(),
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate distance between two points
 */
export function getDistance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between two points (radians)
 */
export function getAngle(p1: Point, p2: Point): number {
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

/**
 * Calculate center point between multiple points
 */
export function getCenter(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };

  const sum = points.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
  };
}

/**
 * Calculate velocity from two points and time delta
 */
export function getVelocity(p1: Point, p2: Point, dt: number): Velocity {
  if (dt === 0) return { vx: 0, vy: 0 };
  return {
    vx: (p2.x - p1.x) / dt,
    vy: (p2.y - p1.y) / dt,
  };
}

/**
 * Get touch/pointer position from event
 */
function getEventPosition(event: TouchEvent | PointerEvent | MouseEvent): Point {
  if ('touches' in event && event.touches.length > 0) {
    return {
      x: event.touches[0]!.clientX,
      y: event.touches[0]!.clientY,
    };
  }
  if ('clientX' in event) {
    return {
      x: event.clientX,
      y: event.clientY,
    };
  }
  return { x: 0, y: 0 };
}

/**
 * Get all touch positions from event
 */
function getAllTouchPositions(event: TouchEvent): Point[] {
  const positions: Point[] = [];
  for (let i = 0; i < event.touches.length; i++) {
    positions.push({
      x: event.touches[i]!.clientX,
      y: event.touches[i]!.clientY,
    });
  }
  return positions;
}

/**
 * Get swipe direction from velocity
 */
function getSwipeDirection(velocity: Velocity): SwipeDirection {
  if (Math.abs(velocity.vx) > Math.abs(velocity.vy)) {
    return velocity.vx > 0 ? 'right' : 'left';
  }
  return velocity.vy > 0 ? 'down' : 'up';
}

// ============================================================================
// Pan Gesture Recognizer
// ============================================================================

/**
 * Create a pan gesture recognizer
 */
export function createPanGesture(
  element: HTMLElement,
  handler: (event: PanGestureEvent) => void,
  config: PanGestureConfig = {}
): () => void {
  const {
    enabled = true,
    minPointers = 1,
    maxPointers = 10,
    minDistance = 10,
    lockDirection = 'none',
  } = config;

  let tracker = createTracker();
  let isActive = false;
  let lastTime = 0;
  let directionLock: 'horizontal' | 'vertical' | null = null;

  const emit = (state: GestureState, event: TouchEvent | PointerEvent | MouseEvent) => {
    if (!enabled) return;

    const now = Date.now();
    const dt = now - lastTime;
    lastTime = now;

    const velocity = getVelocity(
      tracker.previousPointers.get(0) || tracker.startPosition,
      tracker.currentPosition,
      dt
    );

    let translation = {
      x: tracker.currentPosition.x - tracker.startPosition.x,
      y: tracker.currentPosition.y - tracker.startPosition.y,
    };

    // Apply direction lock
    if (lockDirection !== 'none' && state === 'changed') {
      if (directionLock === null) {
        directionLock = Math.abs(translation.x) > Math.abs(translation.y)
          ? 'horizontal'
          : 'vertical';
      }

      if (lockDirection === 'horizontal' || directionLock === 'horizontal') {
        translation.y = 0;
      } else if (lockDirection === 'vertical' || directionLock === 'vertical') {
        translation.x = 0;
      }
    }

    handler({
      state,
      pointerCount: tracker.pointers.size,
      timestamp: now,
      nativeEvent: event,
      position: { ...tracker.currentPosition },
      translation,
      velocity,
      absoluteTranslation: getDistance({ x: 0, y: 0 }, translation),
    });
  };

  const onTouchStart = (event: TouchEvent) => {
    if (!enabled) return;
    if (event.touches.length < minPointers || event.touches.length > maxPointers) return;

    tracker = createTracker();
    tracker.startTime = Date.now();
    lastTime = tracker.startTime;
    tracker.startPosition = getEventPosition(event);
    tracker.currentPosition = { ...tracker.startPosition };

    for (let i = 0; i < event.touches.length; i++) {
      tracker.pointers.set(event.touches[i]!.identifier, {
        x: event.touches[i]!.clientX,
        y: event.touches[i]!.clientY,
      });
    }

    isActive = false;
    directionLock = null;
  };

  const onTouchMove = (event: TouchEvent) => {
    if (!enabled) return;
    if (tracker.pointers.size === 0) return;

    tracker.previousPointers = new Map(tracker.pointers);
    tracker.pointers.clear();

    for (let i = 0; i < event.touches.length; i++) {
      tracker.pointers.set(event.touches[i]!.identifier, {
        x: event.touches[i]!.clientX,
        y: event.touches[i]!.clientY,
      });
    }

    tracker.currentPosition = getEventPosition(event);

    const distance = getDistance(tracker.startPosition, tracker.currentPosition);

    if (!isActive && distance >= minDistance) {
      isActive = true;
      emit('began', event);
    } else if (isActive) {
      emit('changed', event);
    }
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (!enabled) return;

    if (isActive) {
      emit('ended', event);
    }

    if (event.touches.length === 0) {
      isActive = false;
      tracker = createTracker();
    }
  };

  const onTouchCancel = (event: TouchEvent) => {
    if (isActive) {
      emit('cancelled', event);
    }
    isActive = false;
    tracker = createTracker();
  };

  // Pointer events for mouse/pen
  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return; // Use touch events for touch
    if (!enabled) return;

    tracker = createTracker();
    tracker.startTime = Date.now();
    lastTime = tracker.startTime;
    tracker.startPosition = { x: event.clientX, y: event.clientY };
    tracker.currentPosition = { ...tracker.startPosition };
    tracker.pointers.set(event.pointerId, tracker.startPosition);

    isActive = false;
    directionLock = null;
    element.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    if (!enabled) return;
    if (!tracker.pointers.has(event.pointerId)) return;

    tracker.previousPointers = new Map(tracker.pointers);
    tracker.currentPosition = { x: event.clientX, y: event.clientY };
    tracker.pointers.set(event.pointerId, tracker.currentPosition);

    const distance = getDistance(tracker.startPosition, tracker.currentPosition);

    if (!isActive && distance >= minDistance) {
      isActive = true;
      emit('began', event);
    } else if (isActive) {
      emit('changed', event);
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    if (!enabled) return;

    if (isActive) {
      emit('ended', event);
    }

    tracker.pointers.delete(event.pointerId);
    if (tracker.pointers.size === 0) {
      isActive = false;
      tracker = createTracker();
    }
  };

  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchmove', onTouchMove, { passive: true });
  element.addEventListener('touchend', onTouchEnd);
  element.addEventListener('touchcancel', onTouchCancel);
  element.addEventListener('pointerdown', onPointerDown);
  element.addEventListener('pointermove', onPointerMove);
  element.addEventListener('pointerup', onPointerUp);
  element.addEventListener('pointercancel', onPointerUp);

  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchmove', onTouchMove);
    element.removeEventListener('touchend', onTouchEnd);
    element.removeEventListener('touchcancel', onTouchCancel);
    element.removeEventListener('pointerdown', onPointerDown);
    element.removeEventListener('pointermove', onPointerMove);
    element.removeEventListener('pointerup', onPointerUp);
    element.removeEventListener('pointercancel', onPointerUp);
  };
}

// ============================================================================
// Pinch Gesture Recognizer
// ============================================================================

/**
 * Create a pinch gesture recognizer
 */
export function createPinchGesture(
  element: HTMLElement,
  handler: (event: PinchGestureEvent) => void,
  config: PinchGestureConfig = {}
): () => void {
  const { enabled = true, minScale = 0.05 } = config;

  let tracker = createTracker();
  let isActive = false;
  let lastScale = 1;
  let lastTime = 0;

  const emit = (state: GestureState, event: TouchEvent, scale: number) => {
    if (!enabled) return;

    const positions = getAllTouchPositions(event);
    const focalPoint = getCenter(positions);

    const now = Date.now();
    const dt = now - lastTime;
    const velocity = dt > 0 ? (scale - lastScale) / dt : 0;
    lastTime = now;
    lastScale = scale;

    handler({
      state,
      pointerCount: event.touches.length,
      timestamp: now,
      nativeEvent: event,
      scale,
      focalPoint,
      velocity,
    });
  };

  const onTouchStart = (event: TouchEvent) => {
    if (!enabled) return;

    if (event.touches.length === 2) {
      tracker = createTracker();
      const positions = getAllTouchPositions(event);
      tracker.initialDistance = getDistance(positions[0]!, positions[1]!);
      lastScale = 1;
      lastTime = Date.now();
      isActive = false;
    }
  };

  const onTouchMove = (event: TouchEvent) => {
    if (!enabled) return;
    if (event.touches.length !== 2) return;
    if (tracker.initialDistance === undefined) return;

    const positions = getAllTouchPositions(event);
    const currentDistance = getDistance(positions[0]!, positions[1]!);
    const scale = currentDistance / tracker.initialDistance;

    if (!isActive && Math.abs(scale - 1) >= minScale) {
      isActive = true;
      emit('began', event, scale);
    } else if (isActive) {
      emit('changed', event, scale);
    }
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (!enabled) return;

    if (isActive && event.touches.length < 2) {
      const scale = lastScale;
      emit('ended', event, scale);
      isActive = false;
      tracker = createTracker();
    }
  };

  const onTouchCancel = (event: TouchEvent) => {
    if (isActive) {
      emit('cancelled', event, lastScale);
    }
    isActive = false;
    tracker = createTracker();
  };

  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchmove', onTouchMove, { passive: true });
  element.addEventListener('touchend', onTouchEnd);
  element.addEventListener('touchcancel', onTouchCancel);

  // Wheel event for desktop pinch (ctrl + scroll)
  const onWheel = (event: WheelEvent) => {
    if (!enabled) return;
    if (!event.ctrlKey) return;

    event.preventDefault();

    const scale = 1 - event.deltaY * 0.01;
    const focalPoint = { x: event.clientX, y: event.clientY };

    handler({
      state: 'changed',
      pointerCount: 1,
      timestamp: Date.now(),
      nativeEvent: event as any,
      scale,
      focalPoint,
      velocity: 0,
    });
  };

  element.addEventListener('wheel', onWheel, { passive: false });

  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchmove', onTouchMove);
    element.removeEventListener('touchend', onTouchEnd);
    element.removeEventListener('touchcancel', onTouchCancel);
    element.removeEventListener('wheel', onWheel);
  };
}

// ============================================================================
// Rotation Gesture Recognizer
// ============================================================================

/**
 * Create a rotation gesture recognizer
 */
export function createRotationGesture(
  element: HTMLElement,
  handler: (event: RotationGestureEvent) => void,
  config: GestureConfig = {}
): () => void {
  const { enabled = true } = config;

  let tracker = createTracker();
  let isActive = false;
  let lastRotation = 0;
  let lastTime = 0;

  const emit = (state: GestureState, event: TouchEvent, rotation: number) => {
    if (!enabled) return;

    const positions = getAllTouchPositions(event);
    const anchorPoint = getCenter(positions);

    const now = Date.now();
    const dt = now - lastTime;
    const velocity = dt > 0 ? (rotation - lastRotation) / dt : 0;
    lastTime = now;
    lastRotation = rotation;

    handler({
      state,
      pointerCount: event.touches.length,
      timestamp: now,
      nativeEvent: event,
      rotation,
      velocity,
      anchorPoint,
    });
  };

  const onTouchStart = (event: TouchEvent) => {
    if (!enabled) return;

    if (event.touches.length === 2) {
      tracker = createTracker();
      const positions = getAllTouchPositions(event);
      tracker.initialAngle = getAngle(positions[0]!, positions[1]!);
      lastRotation = 0;
      lastTime = Date.now();
      isActive = false;
    }
  };

  const onTouchMove = (event: TouchEvent) => {
    if (!enabled) return;
    if (event.touches.length !== 2) return;
    if (tracker.initialAngle === undefined) return;

    const positions = getAllTouchPositions(event);
    const currentAngle = getAngle(positions[0]!, positions[1]!);
    let rotation = currentAngle - tracker.initialAngle;

    // Normalize rotation to -PI to PI
    while (rotation > Math.PI) rotation -= 2 * Math.PI;
    while (rotation < -Math.PI) rotation += 2 * Math.PI;

    if (!isActive && Math.abs(rotation) > 0.1) {
      isActive = true;
      emit('began', event, rotation);
    } else if (isActive) {
      emit('changed', event, rotation);
    }
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (!enabled) return;

    if (isActive && event.touches.length < 2) {
      emit('ended', event, lastRotation);
      isActive = false;
      tracker = createTracker();
    }
  };

  const onTouchCancel = (event: TouchEvent) => {
    if (isActive) {
      emit('cancelled', event, lastRotation);
    }
    isActive = false;
    tracker = createTracker();
  };

  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchmove', onTouchMove, { passive: true });
  element.addEventListener('touchend', onTouchEnd);
  element.addEventListener('touchcancel', onTouchCancel);

  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchmove', onTouchMove);
    element.removeEventListener('touchend', onTouchEnd);
    element.removeEventListener('touchcancel', onTouchCancel);
  };
}

// ============================================================================
// Swipe Gesture Recognizer
// ============================================================================

/**
 * Create a swipe gesture recognizer
 */
export function createSwipeGesture(
  element: HTMLElement,
  handler: (event: SwipeGestureEvent) => void,
  config: SwipeGestureConfig = {}
): () => void {
  const {
    enabled = true,
    direction = ['left', 'right', 'up', 'down'],
    minVelocity = 0.3,
    minDistance = 50,
    maxDuration = 500,
  } = config;

  const directions = Array.isArray(direction) ? direction : [direction];

  let tracker = createTracker();

  const onTouchStart = (event: TouchEvent) => {
    if (!enabled) return;

    tracker = createTracker();
    tracker.startTime = Date.now();
    tracker.startPosition = getEventPosition(event);
    tracker.currentPosition = { ...tracker.startPosition };
  };

  const onTouchMove = (event: TouchEvent) => {
    if (!enabled) return;
    if (tracker.startTime === 0) return;

    tracker.previousPointers.set(0, { ...tracker.currentPosition });
    tracker.currentPosition = getEventPosition(event);
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (!enabled) return;
    if (tracker.startTime === 0) return;

    const duration = Date.now() - tracker.startTime;
    if (duration > maxDuration) {
      tracker = createTracker();
      return;
    }

    const distance = getDistance(tracker.startPosition, tracker.currentPosition);
    if (distance < minDistance) {
      tracker = createTracker();
      return;
    }

    const velocity = getVelocity(tracker.startPosition, tracker.currentPosition, duration);
    const speed = Math.sqrt(velocity.vx * velocity.vx + velocity.vy * velocity.vy);

    if (speed < minVelocity) {
      tracker = createTracker();
      return;
    }

    const swipeDirection = getSwipeDirection(velocity);

    if (!directions.includes(swipeDirection)) {
      tracker = createTracker();
      return;
    }

    handler({
      state: 'ended',
      pointerCount: 0,
      timestamp: Date.now(),
      nativeEvent: event,
      direction: swipeDirection,
      velocity,
      distance,
    });

    tracker = createTracker();
  };

  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchmove', onTouchMove, { passive: true });
  element.addEventListener('touchend', onTouchEnd);

  return () => {
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchmove', onTouchMove);
    element.removeEventListener('touchend', onTouchEnd);
  };
}

// ============================================================================
// Long Press Gesture Recognizer
// ============================================================================

/**
 * Create a long press gesture recognizer
 */
export function createLongPressGesture(
  element: HTMLElement,
  handler: (event: LongPressGestureEvent) => void,
  config: LongPressGestureConfig = {}
): () => void {
  const {
    enabled = true,
    minDuration = 500,
    maxDistance = 10,
  } = config;

  let tracker = createTracker();
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let isActive = false;

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (isActive) {
      isActive = false;
    }
  };

  const onTouchStart = (event: TouchEvent) => {
    if (!enabled) return;

    cancel();

    tracker = createTracker();
    tracker.startTime = Date.now();
    tracker.startPosition = getEventPosition(event);
    tracker.currentPosition = { ...tracker.startPosition };

    timeoutId = setTimeout(() => {
      if (!enabled) return;

      const distance = getDistance(tracker.startPosition, tracker.currentPosition);
      if (distance > maxDistance) return;

      isActive = true;

      handler({
        state: 'began',
        pointerCount: event.touches.length,
        timestamp: Date.now(),
        nativeEvent: event,
        position: { ...tracker.startPosition },
        duration: minDuration,
      });
    }, minDuration);
  };

  const onTouchMove = (event: TouchEvent) => {
    if (!enabled) return;

    tracker.currentPosition = getEventPosition(event);

    const distance = getDistance(tracker.startPosition, tracker.currentPosition);
    if (distance > maxDistance) {
      cancel();
    }
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (!enabled) return;

    if (isActive) {
      const duration = Date.now() - tracker.startTime;

      handler({
        state: 'ended',
        pointerCount: 0,
        timestamp: Date.now(),
        nativeEvent: event,
        position: { ...tracker.startPosition },
        duration,
      });
    }

    cancel();
    tracker = createTracker();
  };

  const onTouchCancel = (event: TouchEvent) => {
    if (isActive) {
      handler({
        state: 'cancelled',
        pointerCount: 0,
        timestamp: Date.now(),
        nativeEvent: event,
        position: { ...tracker.startPosition },
        duration: Date.now() - tracker.startTime,
      });
    }
    cancel();
    tracker = createTracker();
  };

  // Context menu for desktop long press
  const onContextMenu = (event: MouseEvent) => {
    if (!enabled) return;

    event.preventDefault();

    handler({
      state: 'ended',
      pointerCount: 1,
      timestamp: Date.now(),
      nativeEvent: event,
      position: { x: event.clientX, y: event.clientY },
      duration: 0,
    });
  };

  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchmove', onTouchMove, { passive: true });
  element.addEventListener('touchend', onTouchEnd);
  element.addEventListener('touchcancel', onTouchCancel);
  element.addEventListener('contextmenu', onContextMenu);

  return () => {
    cancel();
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchmove', onTouchMove);
    element.removeEventListener('touchend', onTouchEnd);
    element.removeEventListener('touchcancel', onTouchCancel);
    element.removeEventListener('contextmenu', onContextMenu);
  };
}

// ============================================================================
// Tap Gesture Recognizer
// ============================================================================

/**
 * Create a tap gesture recognizer
 */
export function createTapGesture(
  element: HTMLElement,
  handler: (event: TapGestureEvent) => void,
  config: TapGestureConfig = {}
): () => void {
  const {
    enabled = true,
    numberOfTaps = 1,
    numberOfTouches = 1,
    maxDuration = 300,
    maxDelay = 300,
    maxDistance = 10,
  } = config;

  let tapCount = 0;
  let lastTapTime = 0;
  let lastTapPosition: Point = { x: 0, y: 0 };
  let startPosition: Point = { x: 0, y: 0 };
  let startTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const reset = () => {
    tapCount = 0;
    lastTapTime = 0;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const onTouchStart = (event: TouchEvent) => {
    if (!enabled) return;
    if (event.touches.length !== numberOfTouches) {
      reset();
      return;
    }

    startPosition = getEventPosition(event);
    startTime = Date.now();

    // Check if this is a continuation of previous taps
    const timeSinceLastTap = startTime - lastTapTime;
    const distanceFromLastTap = getDistance(startPosition, lastTapPosition);

    if (tapCount > 0 && (timeSinceLastTap > maxDelay || distanceFromLastTap > maxDistance)) {
      reset();
    }
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (!enabled) return;

    const endTime = Date.now();
    const duration = endTime - startTime;
    const endPosition = getEventPosition(event);
    const distance = getDistance(startPosition, endPosition);

    // Validate tap
    if (duration > maxDuration || distance > maxDistance) {
      reset();
      return;
    }

    tapCount++;
    lastTapTime = endTime;
    lastTapPosition = endPosition;

    if (tapCount >= numberOfTaps) {
      handler({
        state: 'ended',
        pointerCount: 0,
        timestamp: endTime,
        nativeEvent: event,
        position: endPosition,
        tapCount,
      });
      reset();
    } else {
      // Wait for more taps
      timeoutId = setTimeout(reset, maxDelay);
    }
  };

  const onTouchCancel = () => {
    reset();
  };

  // Click handler for single tap on desktop
  const onClick = (event: MouseEvent) => {
    if (!enabled) return;
    if (numberOfTaps !== 1) return;

    handler({
      state: 'ended',
      pointerCount: 1,
      timestamp: Date.now(),
      nativeEvent: event,
      position: { x: event.clientX, y: event.clientY },
      tapCount: 1,
    });
  };

  // Double click for desktop
  const onDblClick = (event: MouseEvent) => {
    if (!enabled) return;
    if (numberOfTaps !== 2) return;

    handler({
      state: 'ended',
      pointerCount: 1,
      timestamp: Date.now(),
      nativeEvent: event,
      position: { x: event.clientX, y: event.clientY },
      tapCount: 2,
    });
  };

  element.addEventListener('touchstart', onTouchStart, { passive: true });
  element.addEventListener('touchend', onTouchEnd);
  element.addEventListener('touchcancel', onTouchCancel);

  if (numberOfTaps === 1) {
    element.addEventListener('click', onClick);
  } else if (numberOfTaps === 2) {
    element.addEventListener('dblclick', onDblClick);
  }

  return () => {
    reset();
    element.removeEventListener('touchstart', onTouchStart);
    element.removeEventListener('touchend', onTouchEnd);
    element.removeEventListener('touchcancel', onTouchCancel);
    element.removeEventListener('click', onClick);
    element.removeEventListener('dblclick', onDblClick);
  };
}

// ============================================================================
// Combined Gesture Handler
// ============================================================================

/**
 * Gesture handler options
 */
export interface GestureHandlerOptions {
  onPan?: (event: PanGestureEvent) => void;
  onPinch?: (event: PinchGestureEvent) => void;
  onRotation?: (event: RotationGestureEvent) => void;
  onSwipe?: (event: SwipeGestureEvent) => void;
  onLongPress?: (event: LongPressGestureEvent) => void;
  onTap?: (event: TapGestureEvent) => void;
  panConfig?: PanGestureConfig | undefined;
  pinchConfig?: PinchGestureConfig | undefined;
  rotationConfig?: GestureConfig | undefined;
  swipeConfig?: SwipeGestureConfig | undefined;
  longPressConfig?: LongPressGestureConfig | undefined;
  tapConfig?: TapGestureConfig | undefined;
}

/**
 * Create a combined gesture handler
 */
export function createGestureHandler(
  element: HTMLElement,
  options: GestureHandlerOptions
): () => void {
  const cleanups: Array<() => void> = [];

  if (options.onPan) {
    cleanups.push(createPanGesture(element, options.onPan, options.panConfig));
  }

  if (options.onPinch) {
    cleanups.push(createPinchGesture(element, options.onPinch, options.pinchConfig));
  }

  if (options.onRotation) {
    cleanups.push(createRotationGesture(element, options.onRotation, options.rotationConfig));
  }

  if (options.onSwipe) {
    cleanups.push(createSwipeGesture(element, options.onSwipe, options.swipeConfig));
  }

  if (options.onLongPress) {
    cleanups.push(createLongPressGesture(element, options.onLongPress, options.longPressConfig));
  }

  if (options.onTap) {
    cleanups.push(createTapGesture(element, options.onTap, options.tapConfig));
  }

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}

// ============================================================================
// Gesture Hooks (for PhilJS components)
// ============================================================================

/**
 * Hook-style gesture handler
 */
export function useGestures(
  elementRef: { current: HTMLElement | null },
  options: GestureHandlerOptions
): void {
  if (typeof window === 'undefined') return;

  // This would integrate with PhilJS effect system
  // For now, provide a simple implementation
  let cleanup: (() => void) | null = null;

  const setup = () => {
    if (elementRef.current) {
      cleanup = createGestureHandler(elementRef.current, options);
    }
  };

  const teardown = () => {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  };

  // MutationObserver to handle element changes
  if (elementRef.current) {
    setup();
  }

  // Return cleanup for effect
  return teardown as any;
}

/**
 * Use pan gesture
 */
export function usePanGesture(
  elementRef: { current: HTMLElement | null },
  handler: (event: PanGestureEvent) => void,
  config?: PanGestureConfig
): void {
  useGestures(elementRef, { onPan: handler, panConfig: config });
}

/**
 * Use pinch gesture
 */
export function usePinchGesture(
  elementRef: { current: HTMLElement | null },
  handler: (event: PinchGestureEvent) => void,
  config?: PinchGestureConfig
): void {
  useGestures(elementRef, { onPinch: handler, pinchConfig: config });
}

/**
 * Use swipe gesture
 */
export function useSwipeGesture(
  elementRef: { current: HTMLElement | null },
  handler: (event: SwipeGestureEvent) => void,
  config?: SwipeGestureConfig
): void {
  useGestures(elementRef, { onSwipe: handler, swipeConfig: config });
}

/**
 * Use long press gesture
 */
export function useLongPressGesture(
  elementRef: { current: HTMLElement | null },
  handler: (event: LongPressGestureEvent) => void,
  config?: LongPressGestureConfig
): void {
  useGestures(elementRef, { onLongPress: handler, longPressConfig: config });
}

/**
 * Use tap gesture
 */
export function useTapGesture(
  elementRef: { current: HTMLElement | null },
  handler: (event: TapGestureEvent) => void,
  config?: TapGestureConfig
): void {
  useGestures(elementRef, { onTap: handler, tapConfig: config });
}

// ============================================================================
// Exports
// ============================================================================

export default {
  createPanGesture,
  createPinchGesture,
  createRotationGesture,
  createSwipeGesture,
  createLongPressGesture,
  createTapGesture,
  createGestureHandler,
  useGestures,
  usePanGesture,
  usePinchGesture,
  useSwipeGesture,
  useLongPressGesture,
  useTapGesture,
  getDistance,
  getAngle,
  getCenter,
  getVelocity,
};
