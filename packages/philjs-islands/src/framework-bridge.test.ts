/**
 * Framework Bridge Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createSharedState,
  getSharedState,
  removeSharedState,
  eventBus,
  PropsNormalizer,
  createIslandBridge,
  frameworkHooks,
  debug
} from './framework-bridge.js';

describe('Framework Bridge', () => {
  beforeEach(() => {
    // Clear event bus
    eventBus.clear();
  });

  describe('Shared State Store', () => {
    it('should create and retrieve shared state', () => {
      const store = createSharedState('counter', { count: 0 });

      expect(store.getState()).toEqual({ count: 0 });

      const retrieved = getSharedState('counter');
      expect(retrieved).toBe(store);
    });

    it('should update state and notify subscribers', () => {
      const store = createSharedState('user', { name: 'Alice', age: 30 });
      const subscriber = vi.fn();

      store.subscribe(subscriber);
      store.setState({ name: 'Bob', age: 25 });

      expect(subscriber).toHaveBeenCalledWith({ name: 'Bob', age: 25 });
      expect(store.getState()).toEqual({ name: 'Bob', age: 25 });
    });

    it('should support functional updates', () => {
      const store = createSharedState('counter', { count: 0 });

      store.setState(prev => ({ count: prev.count + 1 }));
      expect(store.getState().count).toBe(1);

      store.setState(prev => ({ count: prev.count + 1 }));
      expect(store.getState().count).toBe(2);
    });

    it('should support partial updates', () => {
      const store = createSharedState('user', { name: 'Alice', age: 30, city: 'NYC' });

      store.updateState({ age: 31 });

      expect(store.getState()).toEqual({ name: 'Alice', age: 31, city: 'NYC' });
    });

    it('should allow unsubscribing', () => {
      const store = createSharedState('test', { value: 1 });
      const subscriber = vi.fn();

      const unsubscribe = store.subscribe(subscriber);
      store.setState({ value: 2 });

      expect(subscriber).toHaveBeenCalledTimes(1);

      unsubscribe();
      store.setState({ value: 3 });

      // Should not be called again
      expect(subscriber).toHaveBeenCalledTimes(1);
    });

    it('should support middleware', () => {
      const store = createSharedState('logged', { count: 0 });

      const loggingMiddleware = vi.fn((state, nextState) => {
        return { ...nextState, count: nextState.count * 2 };
      });

      store.use(loggingMiddleware);
      store.setState({ count: 5 });

      expect(loggingMiddleware).toHaveBeenCalled();
      expect(store.getState().count).toBe(10); // Doubled by middleware
    });

    it('should remove shared state', () => {
      const store = createSharedState('temp', { data: 'test' });
      expect(getSharedState('temp')).toBe(store);

      removeSharedState('temp');
      expect(getSharedState('temp')).toBeUndefined();
    });
  });

  describe('Event Bus', () => {
    it('should emit and listen to events', () => {
      const listener = vi.fn();

      eventBus.on('test-event', listener);
      eventBus.emit('test-event', { message: 'Hello' });

      expect(listener).toHaveBeenCalledWith({ message: 'Hello' });
    });

    it('should support multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      eventBus.on('multi-event', listener1);
      eventBus.on('multi-event', listener2);
      eventBus.emit('multi-event', 'data');

      expect(listener1).toHaveBeenCalledWith('data');
      expect(listener2).toHaveBeenCalledWith('data');
    });

    it('should support once listeners', () => {
      const listener = vi.fn();

      eventBus.once('once-event', listener);

      eventBus.emit('once-event', 'first');
      eventBus.emit('once-event', 'second');

      // Should only be called once
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith('first');
    });

    it('should remove event listeners', () => {
      const listener = vi.fn();

      const unsubscribe = eventBus.on('remove-event', listener);
      eventBus.emit('remove-event', 'first');

      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      eventBus.emit('remove-event', 'second');

      // Should not be called again
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should remove all listeners for an event', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      eventBus.on('clear-event', listener1);
      eventBus.on('clear-event', listener2);

      eventBus.off('clear-event');

      eventBus.emit('clear-event', 'data');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should support middleware', () => {
      const middleware = vi.fn((event, data) => {
        return { ...data, modified: true };
      });

      const listener = vi.fn();

      eventBus.use(middleware);
      eventBus.on('middleware-event', listener);
      eventBus.emit('middleware-event', { original: true });

      expect(middleware).toHaveBeenCalled();
      expect(listener).toHaveBeenCalledWith({ original: true, modified: true });
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();

      eventBus.on('error-event', errorListener);
      eventBus.on('error-event', normalListener);

      // Should not throw
      expect(() => {
        eventBus.emit('error-event', 'data');
      }).not.toThrow();

      // Normal listener should still be called
      expect(normalListener).toHaveBeenCalled();
    });
  });

  describe('Props Normalizer', () => {
    it('should normalize React props', () => {
      const reactProps = {
        className: 'btn',
        htmlFor: 'input-1',
        onClick: () => {},
        onMouseEnter: () => {},
        children: 'Click me'
      };

      const normalized = PropsNormalizer.normalize(reactProps, 'react');

      expect(normalized.class).toBe('btn');
      expect(normalized.for).toBe('input-1');
      expect(normalized['on:click']).toBeDefined();
      expect(normalized['on:mouseenter']).toBeDefined();
    });

    it('should normalize Vue props', () => {
      const vueProps = {
        '@click': () => {},
        ':value': 'test',
        'data-id': '123'
      };

      const normalized = PropsNormalizer.normalize(vueProps, 'vue');

      expect(normalized['on:click']).toBeDefined();
      expect(normalized.value).toBe('test');
      expect(normalized['data-id']).toBe('123');
    });

    it('should denormalize to React props', () => {
      const normalized = {
        class: 'btn',
        for: 'input-1',
        'on:click': () => {},
        'data-id': '123'
      };

      const reactProps = PropsNormalizer.denormalize(normalized, 'react');

      expect(reactProps.className).toBe('btn');
      expect(reactProps.htmlFor).toBe('input-1');
      expect(reactProps.onClick).toBeDefined();
      expect(reactProps['data-id']).toBe('123');
    });

    it('should denormalize to Vue props', () => {
      const normalized = {
        'on:click': () => {},
        value: 'test',
        class: 'btn'
      };

      const vueProps = PropsNormalizer.denormalize(normalized, 'vue');

      expect(vueProps['@click']).toBeDefined();
      expect(vueProps.value).toBe('test');
      expect(vueProps.class).toBe('btn');
    });

    it('should handle round-trip normalization', () => {
      const original = {
        className: 'btn primary',
        onClick: () => {},
        'data-test': 'value'
      };

      const normalized = PropsNormalizer.normalize(original, 'react');
      const denormalized = PropsNormalizer.denormalize(normalized, 'react');

      expect(denormalized.className).toBe('btn primary');
      expect(denormalized.onClick).toBeDefined();
      expect(denormalized['data-test']).toBe('value');
    });
  });

  describe('Island Bridge', () => {
    it('should create bridge between islands', () => {
      const bridge = createIslandBridge(
        { framework: 'react', id: 'island-1' },
        { framework: 'vue', id: 'island-2' }
      );

      expect(bridge.send).toBeDefined();
      expect(bridge.receive).toBeDefined();
    });

    it('should send and receive data through bridge', () => {
      const bridge = createIslandBridge(
        { framework: 'react', id: 'sender' },
        { framework: 'vue', id: 'receiver' }
      );

      const receiver = vi.fn();
      bridge.receive(receiver);

      bridge.send({ message: 'Hello from React!' });

      expect(receiver).toHaveBeenCalled();
      const receivedData = receiver.mock.calls[0][0];
      expect(receivedData.message).toBe('Hello from React!');
    });

    it('should normalize props across frameworks', () => {
      const bridge = createIslandBridge(
        { framework: 'react', id: 'react-island' },
        { framework: 'vue', id: 'vue-island' }
      );

      const receiver = vi.fn();
      bridge.receive(receiver);

      // Send React-style props
      bridge.send({ className: 'btn', onClick: () => {} });

      expect(receiver).toHaveBeenCalled();
      const receivedData = receiver.mock.calls[0][0];

      // Should be normalized for Vue
      expect(receivedData['@click']).toBeDefined();
    });
  });

  describe('Debug Utilities', () => {
    it('should get all shared states', () => {
      createSharedState('state1', { value: 1 });
      createSharedState('state2', { value: 2 });

      const states = debug.getStates();

      expect(states.state1).toEqual({ value: 1 });
      expect(states.state2).toEqual({ value: 2 });
    });

    it('should enable logging', () => {
      debug.enableLogging();

      const listener = vi.fn();
      eventBus.on('logged-event', listener);
      eventBus.emit('logged-event', { test: true });

      expect(listener).toHaveBeenCalled();
    });
  });

  describe('Framework-Specific Hooks', () => {
    it('should provide React hook', () => {
      expect(frameworkHooks.react.useSharedState).toBeDefined();
      expect(frameworkHooks.react.useEventBus).toBeDefined();
    });

    it('should provide Vue composable', () => {
      expect(frameworkHooks.vue.useSharedState).toBeDefined();
      expect(frameworkHooks.vue.useEventBus).toBeDefined();
    });

    it('should provide Svelte store', () => {
      expect(frameworkHooks.svelte.createSharedStore).toBeDefined();
      expect(frameworkHooks.svelte.useEventBus).toBeDefined();
    });

    it('should provide Solid signal', () => {
      expect(frameworkHooks.solid.createSharedSignal).toBeDefined();
      expect(frameworkHooks.solid.useEventBus).toBeDefined();
    });
  });
});
