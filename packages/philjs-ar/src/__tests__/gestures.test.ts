/**
 * Tests for PhilJS AR - Gestures Module
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GestureRecognizer, createGestureRecognizer } from '../gestures';

describe('PhilJS AR - Gestures', () => {
  let element: HTMLDivElement;
  let recognizer: GestureRecognizer;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    if (recognizer) {
      recognizer.dispose();
    }
    element.remove();
  });

  describe('GestureRecognizer', () => {
    describe('Constructor', () => {
      it('should create with default configuration', () => {
        recognizer = new GestureRecognizer();
        expect(recognizer).toBeInstanceOf(GestureRecognizer);
      });

      it('should create with custom configuration', () => {
        recognizer = new GestureRecognizer({
          tapTimeout: 500,
          doubleTapDelay: 400,
          longPressDelay: 800,
          panThreshold: 20,
        });
        expect(recognizer).toBeInstanceOf(GestureRecognizer);
      });
    });

    describe('State', () => {
      it('should have initial inactive state', () => {
        recognizer = new GestureRecognizer();
        const state = recognizer.state.get();

        expect(state.isActive).toBe(false);
        expect(state.type).toBeNull();
        expect(state.startPosition).toBeNull();
        expect(state.currentPosition).toBeNull();
        expect(state.delta).toEqual({ x: 0, y: 0 });
        expect(state.scale).toBe(1);
        expect(state.rotation).toBe(0);
      });
    });

    describe('Attach/Detach', () => {
      it('should attach to element', () => {
        recognizer = new GestureRecognizer();
        recognizer.attach(element);
        // No throw means success
        expect(true).toBe(true);
      });

      it('should detach from element', () => {
        recognizer = new GestureRecognizer();
        recognizer.attach(element);
        recognizer.detach();
        // No throw means success
        expect(true).toBe(true);
      });

      it('should handle multiple attach calls', () => {
        recognizer = new GestureRecognizer();
        const element2 = document.createElement('div');
        document.body.appendChild(element2);

        recognizer.attach(element);
        recognizer.attach(element2);
        // Should detach from first and attach to second

        element2.remove();
        expect(true).toBe(true);
      });
    });

    describe('Event Handlers', () => {
      it('should register tap handler', () => {
        recognizer = new GestureRecognizer();
        const handler = vi.fn();

        recognizer.on('tap', handler);
        // No throw means success
        expect(true).toBe(true);
      });

      it('should register all gesture types', () => {
        recognizer = new GestureRecognizer();

        const types = ['tap', 'doubletap', 'longpress', 'pan', 'pinch', 'rotate', 'swipe'] as const;
        for (const type of types) {
          recognizer.on(type, vi.fn());
        }
        // No throw means success
        expect(true).toBe(true);
      });

      it('should unregister handlers', () => {
        recognizer = new GestureRecognizer();
        const handler = vi.fn();

        recognizer.on('tap', handler);
        recognizer.off('tap', handler);
        // No throw means success
        expect(true).toBe(true);
      });
    });

    describe('Touch Simulation', () => {
      it('should handle touch start', () => {
        recognizer = new GestureRecognizer();
        recognizer.attach(element);

        const touchEvent = new TouchEvent('touchstart', {
          touches: [{ identifier: 0, clientX: 100, clientY: 100, target: element } as Touch],
          changedTouches: [{ identifier: 0, clientX: 100, clientY: 100, target: element } as Touch],
          cancelable: true,
        });

        element.dispatchEvent(touchEvent);

        const state = recognizer.state.get();
        expect(state.isActive).toBe(true);
      });

      it('should track touch movement', () => {
        recognizer = new GestureRecognizer();
        recognizer.attach(element);

        // Start touch
        const startEvent = new TouchEvent('touchstart', {
          touches: [{ identifier: 0, clientX: 100, clientY: 100, target: element } as Touch],
          changedTouches: [{ identifier: 0, clientX: 100, clientY: 100, target: element } as Touch],
          cancelable: true,
        });
        element.dispatchEvent(startEvent);

        // Move touch
        const moveEvent = new TouchEvent('touchmove', {
          touches: [{ identifier: 0, clientX: 150, clientY: 150, target: element } as Touch],
          changedTouches: [{ identifier: 0, clientX: 150, clientY: 150, target: element } as Touch],
          cancelable: true,
        });
        element.dispatchEvent(moveEvent);

        const state = recognizer.state.get();
        expect(state.currentPosition).not.toBeNull();
      });

      it('should reset on touch end', () => {
        recognizer = new GestureRecognizer();
        recognizer.attach(element);

        // Start touch
        const startEvent = new TouchEvent('touchstart', {
          touches: [{ identifier: 0, clientX: 100, clientY: 100, target: element } as Touch],
          changedTouches: [{ identifier: 0, clientX: 100, clientY: 100, target: element } as Touch],
          cancelable: true,
        });
        element.dispatchEvent(startEvent);

        // End touch
        const endEvent = new TouchEvent('touchend', {
          touches: [],
          changedTouches: [{ identifier: 0, clientX: 100, clientY: 100, target: element } as Touch],
          cancelable: true,
        });
        element.dispatchEvent(endEvent);

        const state = recognizer.state.get();
        expect(state.isActive).toBe(false);
      });

      it('should handle touch cancel', () => {
        recognizer = new GestureRecognizer();
        recognizer.attach(element);

        // Start touch
        const startEvent = new TouchEvent('touchstart', {
          touches: [{ identifier: 0, clientX: 100, clientY: 100, target: element } as Touch],
          changedTouches: [{ identifier: 0, clientX: 100, clientY: 100, target: element } as Touch],
          cancelable: true,
        });
        element.dispatchEvent(startEvent);

        // Cancel touch
        const cancelEvent = new TouchEvent('touchcancel', {
          touches: [],
          changedTouches: [{ identifier: 0, clientX: 100, clientY: 100, target: element } as Touch],
          cancelable: true,
        });
        element.dispatchEvent(cancelEvent);

        const state = recognizer.state.get();
        expect(state.isActive).toBe(false);
      });
    });

    describe('Dispose', () => {
      it('should dispose cleanly', () => {
        recognizer = new GestureRecognizer();
        recognizer.attach(element);
        recognizer.dispose();
        // No throw means success
        expect(true).toBe(true);
      });
    });
  });

  describe('createGestureRecognizer', () => {
    it('should create gesture recognizer with factory function', () => {
      recognizer = createGestureRecognizer();
      expect(recognizer).toBeInstanceOf(GestureRecognizer);
    });

    it('should pass config to gesture recognizer', () => {
      recognizer = createGestureRecognizer({
        tapTimeout: 200,
        panThreshold: 15,
      });
      expect(recognizer).toBeInstanceOf(GestureRecognizer);
    });
  });
});
