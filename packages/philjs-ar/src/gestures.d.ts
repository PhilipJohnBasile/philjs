/**
 * @philjs/ar - AR Gestures Module
 *
 * Touch and gesture recognition for AR interactions.
 * Handles taps, drags, pinch, rotation, and multi-touch gestures.
 */
import { type Signal } from '@philjs/core';
export interface Point2D {
    x: number;
    y: number;
}
export interface GestureState {
    isActive: boolean;
    type: GestureType | null;
    startPosition: Point2D | null;
    currentPosition: Point2D | null;
    delta: Point2D;
    scale: number;
    rotation: number;
    velocity: Point2D;
}
export type GestureType = 'tap' | 'doubletap' | 'longpress' | 'pan' | 'pinch' | 'rotate' | 'swipe';
export interface TapEvent {
    type: 'tap' | 'doubletap';
    position: Point2D;
    timestamp: number;
}
export interface LongPressEvent {
    type: 'longpress';
    position: Point2D;
    duration: number;
    timestamp: number;
}
export interface PanEvent {
    type: 'pan';
    phase: 'start' | 'move' | 'end' | 'cancel';
    position: Point2D;
    delta: Point2D;
    velocity: Point2D;
    timestamp: number;
}
export interface PinchEvent {
    type: 'pinch';
    phase: 'start' | 'move' | 'end' | 'cancel';
    scale: number;
    center: Point2D;
    timestamp: number;
}
export interface RotateEvent {
    type: 'rotate';
    phase: 'start' | 'move' | 'end' | 'cancel';
    rotation: number;
    center: Point2D;
    timestamp: number;
}
export interface SwipeEvent {
    type: 'swipe';
    direction: 'left' | 'right' | 'up' | 'down';
    velocity: number;
    position: Point2D;
    timestamp: number;
}
export type GestureEvent = TapEvent | LongPressEvent | PanEvent | PinchEvent | RotateEvent | SwipeEvent;
export type GestureHandler<T extends GestureEvent = GestureEvent> = (event: T) => void;
export interface GestureRecognizerConfig {
    tapTimeout?: number;
    doubleTapDelay?: number;
    longPressDelay?: number;
    panThreshold?: number;
    swipeVelocityThreshold?: number;
    pinchThreshold?: number;
    rotateThreshold?: number;
}
/**
 * Gesture recognizer for AR interactions
 */
export declare class GestureRecognizer {
    private element;
    private config;
    private touches;
    private handlers;
    private lastTapTime;
    private lastTapPosition;
    private longPressTimer;
    private isPanning;
    private isPinching;
    private isRotating;
    private initialPinchDistance;
    private initialRotation;
    private lastPinchScale;
    private lastRotation;
    readonly state: Signal<GestureState>;
    constructor(config?: GestureRecognizerConfig);
    /**
     * Attach to an element
     */
    attach(element: HTMLElement): void;
    /**
     * Detach from element
     */
    detach(): void;
    /**
     * Handle touch start
     */
    private handleTouchStart;
    /**
     * Handle touch move
     */
    private handleTouchMove;
    /**
     * Handle single-finger pan
     */
    private handlePan;
    /**
     * Handle two-finger pinch and rotate
     */
    private handlePinchRotate;
    /**
     * Handle touch end
     */
    private handleTouchEnd;
    /**
     * Handle touch cancel
     */
    private handleTouchCancel;
    /**
     * Get distance between two points
     */
    private getDistance;
    /**
     * Get angle between two points
     */
    private getAngle;
    /**
     * Determine swipe direction
     */
    private getSwipeDirection;
    /**
     * Clear long press timer
     */
    private clearLongPressTimer;
    /**
     * Update reactive state
     */
    private updateState;
    /**
     * Reset state
     */
    private reset;
    /**
     * Add gesture handler
     */
    on<T extends GestureEvent>(type: GestureType, handler: GestureHandler<T>): void;
    /**
     * Remove gesture handler
     */
    off<T extends GestureEvent>(type: GestureType, handler: GestureHandler<T>): void;
    /**
     * Emit gesture event
     */
    private emitGesture;
    /**
     * Dispose the gesture recognizer
     */
    dispose(): void;
}
/**
 * Create a gesture recognizer with default configuration
 */
export declare function createGestureRecognizer(config?: GestureRecognizerConfig): GestureRecognizer;
