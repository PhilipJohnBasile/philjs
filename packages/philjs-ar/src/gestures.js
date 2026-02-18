/**
 * @philjs/ar - AR Gestures Module
 *
 * Touch and gesture recognition for AR interactions.
 * Handles taps, drags, pinch, rotation, and multi-touch gestures.
 */
import { signal, effect } from '@philjs/core';
/**
 * Gesture recognizer for AR interactions
 */
export class GestureRecognizer {
    element = null;
    config;
    touches = new Map();
    handlers = new Map();
    lastTapTime = 0;
    lastTapPosition = null;
    longPressTimer = null;
    isPanning = false;
    isPinching = false;
    isRotating = false;
    initialPinchDistance = 0;
    initialRotation = 0;
    lastPinchScale = 1;
    lastRotation = 0;
    // Reactive state
    state = signal({
        isActive: false,
        type: null,
        startPosition: null,
        currentPosition: null,
        delta: { x: 0, y: 0 },
        scale: 1,
        rotation: 0,
        velocity: { x: 0, y: 0 },
    });
    constructor(config = {}) {
        this.config = {
            tapTimeout: config.tapTimeout ?? 300,
            doubleTapDelay: config.doubleTapDelay ?? 300,
            longPressDelay: config.longPressDelay ?? 500,
            panThreshold: config.panThreshold ?? 10,
            swipeVelocityThreshold: config.swipeVelocityThreshold ?? 0.5,
            pinchThreshold: config.pinchThreshold ?? 0.05,
            rotateThreshold: config.rotateThreshold ?? 0.1,
        };
        const gestureTypes = ['tap', 'doubletap', 'longpress', 'pan', 'pinch', 'rotate', 'swipe'];
        for (const type of gestureTypes) {
            this.handlers.set(type, new Set());
        }
    }
    /**
     * Attach to an element
     */
    attach(element) {
        if (this.element) {
            this.detach();
        }
        this.element = element;
        element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
        element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
        element.addEventListener('touchcancel', this.handleTouchCancel, { passive: false });
    }
    /**
     * Detach from element
     */
    detach() {
        if (!this.element)
            return;
        this.element.removeEventListener('touchstart', this.handleTouchStart);
        this.element.removeEventListener('touchmove', this.handleTouchMove);
        this.element.removeEventListener('touchend', this.handleTouchEnd);
        this.element.removeEventListener('touchcancel', this.handleTouchCancel);
        this.element = null;
        this.reset();
    }
    /**
     * Handle touch start
     */
    handleTouchStart = (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            this.touches.set(touch.identifier, {
                id: touch.identifier,
                startX: touch.clientX,
                startY: touch.clientY,
                currentX: touch.clientX,
                currentY: touch.clientY,
                startTime: performance.now(),
            });
        }
        // Start long press timer for single touch
        if (this.touches.size === 1) {
            const touch = Array.from(this.touches.values())[0];
            this.longPressTimer = setTimeout(() => {
                if (this.touches.size === 1 && !this.isPanning) {
                    const currentTouch = Array.from(this.touches.values())[0];
                    const distance = this.getDistance({ x: touch.startX, y: touch.startY }, { x: currentTouch.currentX, y: currentTouch.currentY });
                    if (distance < this.config.panThreshold) {
                        this.emitGesture('longpress', {
                            type: 'longpress',
                            position: { x: touch.startX, y: touch.startY },
                            duration: this.config.longPressDelay,
                            timestamp: performance.now(),
                        });
                    }
                }
            }, this.config.longPressDelay);
        }
        // Initialize pinch/rotate for two-finger gestures
        if (this.touches.size === 2) {
            const touchList = Array.from(this.touches.values());
            this.initialPinchDistance = this.getDistance({ x: touchList[0].currentX, y: touchList[0].currentY }, { x: touchList[1].currentX, y: touchList[1].currentY });
            this.initialRotation = this.getAngle({ x: touchList[0].currentX, y: touchList[0].currentY }, { x: touchList[1].currentX, y: touchList[1].currentY });
            this.lastPinchScale = 1;
            this.lastRotation = 0;
        }
        this.updateState();
    };
    /**
     * Handle touch move
     */
    handleTouchMove = (e) => {
        e.preventDefault();
        // Update touch positions
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const info = this.touches.get(touch.identifier);
            if (info) {
                info.currentX = touch.clientX;
                info.currentY = touch.clientY;
            }
        }
        if (this.touches.size === 1) {
            this.handlePan();
        }
        else if (this.touches.size === 2) {
            this.handlePinchRotate();
        }
        this.updateState();
    };
    /**
     * Handle single-finger pan
     */
    handlePan() {
        const touch = Array.from(this.touches.values())[0];
        const deltaX = touch.currentX - touch.startX;
        const deltaY = touch.currentY - touch.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        if (distance > this.config.panThreshold && !this.isPanning) {
            this.isPanning = true;
            this.clearLongPressTimer();
            this.emitGesture('pan', {
                type: 'pan',
                phase: 'start',
                position: { x: touch.currentX, y: touch.currentY },
                delta: { x: deltaX, y: deltaY },
                velocity: { x: 0, y: 0 },
                timestamp: performance.now(),
            });
        }
        else if (this.isPanning) {
            const elapsed = (performance.now() - touch.startTime) / 1000;
            const velocity = elapsed > 0
                ? { x: deltaX / elapsed, y: deltaY / elapsed }
                : { x: 0, y: 0 };
            this.emitGesture('pan', {
                type: 'pan',
                phase: 'move',
                position: { x: touch.currentX, y: touch.currentY },
                delta: { x: deltaX, y: deltaY },
                velocity,
                timestamp: performance.now(),
            });
        }
    }
    /**
     * Handle two-finger pinch and rotate
     */
    handlePinchRotate() {
        const touchList = Array.from(this.touches.values());
        const currentDistance = this.getDistance({ x: touchList[0].currentX, y: touchList[0].currentY }, { x: touchList[1].currentX, y: touchList[1].currentY });
        const currentAngle = this.getAngle({ x: touchList[0].currentX, y: touchList[0].currentY }, { x: touchList[1].currentX, y: touchList[1].currentY });
        const center = {
            x: (touchList[0].currentX + touchList[1].currentX) / 2,
            y: (touchList[0].currentY + touchList[1].currentY) / 2,
        };
        const scale = currentDistance / this.initialPinchDistance;
        const rotation = currentAngle - this.initialRotation;
        // Pinch detection
        const scaleDelta = Math.abs(scale - this.lastPinchScale);
        if (scaleDelta > this.config.pinchThreshold || this.isPinching) {
            if (!this.isPinching) {
                this.isPinching = true;
                this.emitGesture('pinch', {
                    type: 'pinch',
                    phase: 'start',
                    scale,
                    center,
                    timestamp: performance.now(),
                });
            }
            else {
                this.emitGesture('pinch', {
                    type: 'pinch',
                    phase: 'move',
                    scale,
                    center,
                    timestamp: performance.now(),
                });
            }
            this.lastPinchScale = scale;
        }
        // Rotation detection
        const rotationDelta = Math.abs(rotation - this.lastRotation);
        if (rotationDelta > this.config.rotateThreshold || this.isRotating) {
            if (!this.isRotating) {
                this.isRotating = true;
                this.emitGesture('rotate', {
                    type: 'rotate',
                    phase: 'start',
                    rotation,
                    center,
                    timestamp: performance.now(),
                });
            }
            else {
                this.emitGesture('rotate', {
                    type: 'rotate',
                    phase: 'move',
                    rotation,
                    center,
                    timestamp: performance.now(),
                });
            }
            this.lastRotation = rotation;
        }
    }
    /**
     * Handle touch end
     */
    handleTouchEnd = (e) => {
        e.preventDefault();
        const endedTouches = [];
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            const info = this.touches.get(touch.identifier);
            if (info) {
                endedTouches.push(info);
                this.touches.delete(touch.identifier);
            }
        }
        // End pan gesture
        if (this.isPanning && this.touches.size === 0) {
            const touch = endedTouches[0];
            const elapsed = (performance.now() - touch.startTime) / 1000;
            const deltaX = touch.currentX - touch.startX;
            const deltaY = touch.currentY - touch.startY;
            const velocity = elapsed > 0
                ? { x: deltaX / elapsed, y: deltaY / elapsed }
                : { x: 0, y: 0 };
            // Check for swipe
            const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
            if (speed > this.config.swipeVelocityThreshold * 1000) {
                const direction = this.getSwipeDirection(velocity);
                this.emitGesture('swipe', {
                    type: 'swipe',
                    direction,
                    velocity: speed,
                    position: { x: touch.currentX, y: touch.currentY },
                    timestamp: performance.now(),
                });
            }
            this.emitGesture('pan', {
                type: 'pan',
                phase: 'end',
                position: { x: touch.currentX, y: touch.currentY },
                delta: { x: deltaX, y: deltaY },
                velocity,
                timestamp: performance.now(),
            });
            this.isPanning = false;
        }
        // End pinch/rotate gestures
        if (this.touches.size < 2) {
            const center = endedTouches.length > 0
                ? { x: endedTouches[0].currentX, y: endedTouches[0].currentY }
                : { x: 0, y: 0 };
            if (this.isPinching) {
                this.emitGesture('pinch', {
                    type: 'pinch',
                    phase: 'end',
                    scale: this.lastPinchScale,
                    center,
                    timestamp: performance.now(),
                });
                this.isPinching = false;
            }
            if (this.isRotating) {
                this.emitGesture('rotate', {
                    type: 'rotate',
                    phase: 'end',
                    rotation: this.lastRotation,
                    center,
                    timestamp: performance.now(),
                });
                this.isRotating = false;
            }
        }
        // Detect tap
        if (!this.isPanning && !this.isPinching && !this.isRotating && endedTouches.length === 1) {
            const touch = endedTouches[0];
            const elapsed = performance.now() - touch.startTime;
            const distance = this.getDistance({ x: touch.startX, y: touch.startY }, { x: touch.currentX, y: touch.currentY });
            if (elapsed < this.config.tapTimeout && distance < this.config.panThreshold) {
                const now = performance.now();
                const position = { x: touch.currentX, y: touch.currentY };
                // Check for double tap
                if (this.lastTapPosition && now - this.lastTapTime < this.config.doubleTapDelay) {
                    const tapDistance = this.getDistance(this.lastTapPosition, position);
                    if (tapDistance < this.config.panThreshold * 2) {
                        this.emitGesture('doubletap', {
                            type: 'doubletap',
                            position,
                            timestamp: now,
                        });
                        this.lastTapTime = 0;
                        this.lastTapPosition = null;
                        this.updateState();
                        return;
                    }
                }
                // Single tap
                this.emitGesture('tap', {
                    type: 'tap',
                    position,
                    timestamp: now,
                });
                this.lastTapTime = now;
                this.lastTapPosition = position;
            }
        }
        this.clearLongPressTimer();
        this.updateState();
    };
    /**
     * Handle touch cancel
     */
    handleTouchCancel = (e) => {
        for (let i = 0; i < e.changedTouches.length; i++) {
            this.touches.delete(e.changedTouches[i].identifier);
        }
        if (this.isPanning) {
            this.emitGesture('pan', {
                type: 'pan',
                phase: 'cancel',
                position: { x: 0, y: 0 },
                delta: { x: 0, y: 0 },
                velocity: { x: 0, y: 0 },
                timestamp: performance.now(),
            });
            this.isPanning = false;
        }
        if (this.isPinching) {
            this.emitGesture('pinch', {
                type: 'pinch',
                phase: 'cancel',
                scale: 1,
                center: { x: 0, y: 0 },
                timestamp: performance.now(),
            });
            this.isPinching = false;
        }
        if (this.isRotating) {
            this.emitGesture('rotate', {
                type: 'rotate',
                phase: 'cancel',
                rotation: 0,
                center: { x: 0, y: 0 },
                timestamp: performance.now(),
            });
            this.isRotating = false;
        }
        this.reset();
    };
    /**
     * Get distance between two points
     */
    getDistance(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    /**
     * Get angle between two points
     */
    getAngle(p1, p2) {
        return Math.atan2(p2.y - p1.y, p2.x - p1.x);
    }
    /**
     * Determine swipe direction
     */
    getSwipeDirection(velocity) {
        if (Math.abs(velocity.x) > Math.abs(velocity.y)) {
            return velocity.x > 0 ? 'right' : 'left';
        }
        return velocity.y > 0 ? 'down' : 'up';
    }
    /**
     * Clear long press timer
     */
    clearLongPressTimer() {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }
    /**
     * Update reactive state
     */
    updateState() {
        let type = null;
        if (this.isPanning)
            type = 'pan';
        else if (this.isPinching)
            type = 'pinch';
        else if (this.isRotating)
            type = 'rotate';
        const touchList = Array.from(this.touches.values());
        const firstTouch = touchList[0];
        this.state.set({
            isActive: this.touches.size > 0,
            type,
            startPosition: firstTouch ? { x: firstTouch.startX, y: firstTouch.startY } : null,
            currentPosition: firstTouch ? { x: firstTouch.currentX, y: firstTouch.currentY } : null,
            delta: firstTouch
                ? { x: firstTouch.currentX - firstTouch.startX, y: firstTouch.currentY - firstTouch.startY }
                : { x: 0, y: 0 },
            scale: this.lastPinchScale,
            rotation: this.lastRotation,
            velocity: { x: 0, y: 0 },
        });
    }
    /**
     * Reset state
     */
    reset() {
        this.touches.clear();
        this.isPanning = false;
        this.isPinching = false;
        this.isRotating = false;
        this.initialPinchDistance = 0;
        this.initialRotation = 0;
        this.lastPinchScale = 1;
        this.lastRotation = 0;
        this.clearLongPressTimer();
        this.updateState();
    }
    /**
     * Add gesture handler
     */
    on(type, handler) {
        this.handlers.get(type)?.add(handler);
    }
    /**
     * Remove gesture handler
     */
    off(type, handler) {
        this.handlers.get(type)?.delete(handler);
    }
    /**
     * Emit gesture event
     */
    emitGesture(type, event) {
        const handlers = this.handlers.get(type);
        if (handlers) {
            for (const handler of handlers) {
                try {
                    handler(event);
                }
                catch (error) {
                    console.error(`Gesture handler error for ${type}:`, error);
                }
            }
        }
    }
    /**
     * Dispose the gesture recognizer
     */
    dispose() {
        this.detach();
        this.handlers.clear();
    }
}
/**
 * Create a gesture recognizer with default configuration
 */
export function createGestureRecognizer(config) {
    return new GestureRecognizer(config);
}
//# sourceMappingURL=gestures.js.map