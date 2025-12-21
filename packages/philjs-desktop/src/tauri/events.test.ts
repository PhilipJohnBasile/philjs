/**
 * Tests for Tauri Events
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  listen,
  once,
  emit,
  onTauriEvent,
  createEventEmitter,
  createTypedListener,
  waitForEvent,
  removeAllListeners,
  removeAllEventListeners,
  TauriEvents,
} from './events';
import { initTauriContext, resetTauriContext } from './context';
import { mockEvents, eventListeners } from '../test-setup';

describe('Tauri Events', () => {
  beforeEach(async () => {
    resetTauriContext();
    await initTauriContext();
    vi.clearAllMocks();
    eventListeners.clear();
  });

  describe('listen', () => {
    it('should register event listener', async () => {
      const callback = vi.fn();

      await listen('test-event', callback);

      expect(mockEvents.listen).toHaveBeenCalledWith('test-event', expect.any(Function));
    });

    it('should return unlisten function', async () => {
      const callback = vi.fn();
      const unlisten = await listen('test-event', callback);

      expect(typeof unlisten).toBe('function');
    });

    it('should call callback when event is emitted', async () => {
      const callback = vi.fn();
      await listen('test-event', callback);

      // Simulate event emission
      mockEvents.emit('test-event', { data: 'test' });

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('once', () => {
    it('should listen only once', async () => {
      const callback = vi.fn();

      await once('test-event', callback);

      expect(mockEvents.once).toHaveBeenCalledWith('test-event', expect.any(Function));
    });
  });

  describe('emit', () => {
    it('should emit event with payload', async () => {
      await emit('test-event', { message: 'hello' });

      expect(mockEvents.emit).toHaveBeenCalledWith('test-event', { message: 'hello' });
    });

    it('should emit event without payload', async () => {
      await emit('test-event');

      expect(mockEvents.emit).toHaveBeenCalledWith('test-event', undefined);
    });
  });

  describe('onTauriEvent', () => {
    it('should subscribe to event and return cleanup', () => {
      const handler = vi.fn();

      const cleanup = onTauriEvent('test-event', handler);

      expect(typeof cleanup).toBe('function');
    });
  });

  describe('createEventEmitter', () => {
    it('should create emitter for specific event', async () => {
      const emitter = createEventEmitter<{ count: number }>('count-updated');

      expect(emitter.emit).toBeDefined();
      expect(emitter.listen).toBeDefined();
      expect(emitter.once).toBeDefined();

      await emitter.emit({ count: 5 });

      expect(mockEvents.emit).toHaveBeenCalledWith('count-updated', { count: 5 });
    });
  });

  describe('createTypedListener', () => {
    it('should create typed listener', async () => {
      const onCountUpdated = createTypedListener<{ count: number }>('count-updated');
      const callback = vi.fn();

      await onCountUpdated(callback);

      expect(mockEvents.listen).toHaveBeenCalled();
    });
  });

  describe('waitForEvent', () => {
    it('should resolve when event is received', async () => {
      // Set up immediate event emission
      setTimeout(() => {
        mockEvents.emit('data-ready', { value: 42 });
      }, 10);

      const result = await waitForEvent<{ value: number }>('data-ready', 1000);

      expect(result).toEqual({ value: 42 });
    });

    it('should reject on timeout', async () => {
      await expect(waitForEvent('never-happens', 50)).rejects.toThrow('Timeout');
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for an event', async () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      await listen('test-event', callback1);
      await listen('test-event', callback2);

      removeAllListeners('test-event');

      // Listeners should be removed
      mockEvents.emit('test-event', {});
      // After removeAllListeners, new emissions shouldn't trigger old callbacks
    });
  });

  describe('removeAllEventListeners', () => {
    it('should remove all event listeners', async () => {
      await listen('event1', vi.fn());
      await listen('event2', vi.fn());

      removeAllEventListeners();

      // All listeners should be cleared
    });
  });

  describe('TauriEvents', () => {
    it('should have standard Tauri event constants', () => {
      expect(TauriEvents.WINDOW_RESIZED).toBe('tauri://resize');
      expect(TauriEvents.WINDOW_MOVED).toBe('tauri://move');
      expect(TauriEvents.WINDOW_CLOSE_REQUESTED).toBe('tauri://close-requested');
      expect(TauriEvents.WINDOW_FOCUS).toBe('tauri://focus');
      expect(TauriEvents.WINDOW_BLUR).toBe('tauri://blur');
      expect(TauriEvents.UPDATE_AVAILABLE).toBe('tauri://update-available');
    });
  });
});
