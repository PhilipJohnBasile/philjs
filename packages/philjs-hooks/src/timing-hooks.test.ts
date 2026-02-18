/**
 * Tests for PhilJS Hooks - Timing Hooks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signal } from '@philjs/core';
import {
  useDebouncedValue,
  useDebouncedCallback,
  useThrottledValue,
  useThrottledCallback,
  useInterval,
  useTimeout,
  useCountdown,
  useStopwatch,
} from './index';

describe('Timing Hooks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('useDebouncedValue', () => {
    it('should return initial value immediately', () => {
      const source = signal('initial');
      const debounced = useDebouncedValue(source, 100);
      expect(debounced.get()).toBe('initial');
    });

    it('should debounce value changes', async () => {
      const source = signal('initial');
      const debounced = useDebouncedValue(source, 100);

      source.set('changed');
      expect(debounced.get()).toBe('initial');

      vi.advanceTimersByTime(50);
      expect(debounced.get()).toBe('initial');

      vi.advanceTimersByTime(60);
      expect(debounced.get()).toBe('changed');
    });

    it('should reset timer on rapid changes', () => {
      const source = signal(0);
      const debounced = useDebouncedValue(source, 100);

      source.set(1);
      vi.advanceTimersByTime(50);

      source.set(2);
      vi.advanceTimersByTime(50);

      source.set(3);
      vi.advanceTimersByTime(50);

      // Not enough time has passed since last change
      expect(debounced.get()).toBe(0);

      vi.advanceTimersByTime(60);
      expect(debounced.get()).toBe(3);
    });
  });

  describe('useDebouncedCallback', () => {
    it('should debounce callback execution', () => {
      const callback = vi.fn();
      const debounced = useDebouncedCallback(callback, 100);

      debounced('a');
      debounced('b');
      debounced('c');

      expect(callback).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('c');
    });

    it('should support cancel', () => {
      const callback = vi.fn();
      const debounced = useDebouncedCallback(callback, 100);

      debounced('test');
      debounced.cancel();

      vi.advanceTimersByTime(200);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should support flush', () => {
      const callback = vi.fn();
      const debounced = useDebouncedCallback(callback, 100);

      debounced('test');
      debounced.flush();

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('test');
    });
  });

  describe('useThrottledValue', () => {
    it('should return initial value immediately', () => {
      const source = signal('initial');
      const throttled = useThrottledValue(source, 100);
      expect(throttled.get()).toBe('initial');
    });

    it('should update immediately on first change within interval', () => {
      const source = signal(0);
      const throttled = useThrottledValue(source, 100);

      // First change goes through immediately
      source.set(1);
      expect(throttled.get()).toBe(1);
    });

    it('should throttle subsequent changes', () => {
      const source = signal(0);
      const throttled = useThrottledValue(source, 100);

      source.set(1);
      expect(throttled.get()).toBe(1);

      // Rapid changes within throttle window
      source.set(2);
      source.set(3);
      expect(throttled.get()).toBe(1);

      // After throttle window, next change goes through
      vi.advanceTimersByTime(100);
      source.set(4);
      expect(throttled.get()).toBe(4);
    });
  });

  describe('useThrottledCallback', () => {
    it('should execute immediately on first call', () => {
      const callback = vi.fn();
      const throttled = useThrottledCallback(callback, 100);

      throttled('first');
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith('first');
    });

    it('should throttle subsequent calls', () => {
      const callback = vi.fn();
      const throttled = useThrottledCallback(callback, 100);

      throttled('a');
      throttled('b');
      throttled('c');

      expect(callback).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith('c');
    });
  });

  describe('useInterval', () => {
    it('should not be active by default', () => {
      const callback = vi.fn();
      const { active } = useInterval(callback, 100);
      expect(active.get()).toBe(false);
    });

    it('should start interval', () => {
      const callback = vi.fn();
      const { start, active } = useInterval(callback, 100);

      start();
      expect(active.get()).toBe(true);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should stop interval', () => {
      const callback = vi.fn();
      const { start, stop, active } = useInterval(callback, 100);

      start();
      vi.advanceTimersByTime(200);
      expect(callback).toHaveBeenCalledTimes(2);

      stop();
      expect(active.get()).toBe(false);

      vi.advanceTimersByTime(200);
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should toggle interval', () => {
      const callback = vi.fn();
      const { toggle, active } = useInterval(callback, 100);

      toggle();
      expect(active.get()).toBe(true);

      toggle();
      expect(active.get()).toBe(false);
    });
  });

  describe('useTimeout', () => {
    it('should not be active by default', () => {
      const callback = vi.fn();
      const { active } = useTimeout(callback, 100);
      expect(active.get()).toBe(false);
    });

    it('should start timeout', () => {
      const callback = vi.fn();
      const { start, active } = useTimeout(callback, 100);

      start();
      expect(active.get()).toBe(true);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(active.get()).toBe(false);
    });

    it('should clear timeout', () => {
      const callback = vi.fn();
      const { start, clear, active } = useTimeout(callback, 100);

      start();
      clear();
      expect(active.get()).toBe(false);

      vi.advanceTimersByTime(200);
      expect(callback).not.toHaveBeenCalled();
    });

    it('should only run once', () => {
      const callback = vi.fn();
      const { start } = useTimeout(callback, 100);

      start();
      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('useCountdown', () => {
    it('should initialize with given seconds', () => {
      const { count } = useCountdown({ seconds: 10 });
      expect(count.get()).toBe(10);
    });

    it('should not start automatically by default', () => {
      const { isRunning } = useCountdown({ seconds: 10 });
      expect(isRunning.get()).toBe(false);
    });

    it('should autostart if configured', () => {
      const { isRunning } = useCountdown({ seconds: 10, autostart: true });
      expect(isRunning.get()).toBe(true);
    });

    it('should count down', () => {
      const { count, start } = useCountdown({ seconds: 5, interval: 1000 });

      start();
      vi.advanceTimersByTime(2000);
      expect(count.get()).toBe(3);
    });

    it('should stop when reaching zero', () => {
      const { count, start, isRunning } = useCountdown({
        seconds: 2,
        interval: 1000,
      });

      start();
      vi.advanceTimersByTime(3000);
      expect(count.get()).toBe(0);
      expect(isRunning.get()).toBe(false);
    });

    it('should reset countdown', () => {
      const { count, start, reset } = useCountdown({
        seconds: 10,
        interval: 1000,
      });

      start();
      vi.advanceTimersByTime(3000);
      expect(count.get()).toBe(7);

      reset();
      expect(count.get()).toBe(10);
    });
  });

  describe('useStopwatch', () => {
    it('should initialize at 0', () => {
      const { time } = useStopwatch();
      expect(time.get()).toBe(0);
    });

    it('should not be running by default', () => {
      const { isRunning } = useStopwatch();
      expect(isRunning.get()).toBe(false);
    });

    it('should start and track time', () => {
      const { time, start, isRunning } = useStopwatch(100);

      start();
      expect(isRunning.get()).toBe(true);

      vi.advanceTimersByTime(500);
      expect(time.get()).toBeGreaterThanOrEqual(400);
    });

    it('should stop tracking', () => {
      const { time, start, stop, isRunning } = useStopwatch(100);

      start();
      vi.advanceTimersByTime(500);
      stop();

      const stoppedTime = time.get();
      expect(isRunning.get()).toBe(false);

      vi.advanceTimersByTime(500);
      expect(time.get()).toBe(stoppedTime);
    });

    it('should reset stopwatch', () => {
      const { time, start, reset } = useStopwatch(100);

      start();
      vi.advanceTimersByTime(500);
      reset();

      expect(time.get()).toBe(0);
    });

    it('should resume from paused time', () => {
      const { time, start, stop } = useStopwatch(100);

      start();
      vi.advanceTimersByTime(500);
      stop();

      const pausedTime = time.get();

      start();
      vi.advanceTimersByTime(500);

      expect(time.get()).toBeGreaterThanOrEqual(pausedTime + 400);
    });
  });
});
