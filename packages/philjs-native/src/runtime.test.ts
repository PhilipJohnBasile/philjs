/**
 * Runtime Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  detectPlatform,
  getPlatformInfo,
  platformSelect,
  onPlatform,
  getDimensions,
  createNativeApp,
  registerNativeComponent,
  getNativeComponent,
  hasNativeComponent,
  getRegisteredComponents,
  NativeBridge,
} from './runtime';

describe('Runtime', () => {
  describe('detectPlatform', () => {
    it('should return web by default', () => {
      const platform = detectPlatform();
      expect(platform).toBe('web');
    });

    it('should detect iOS when native bridge is present', () => {
      (globalThis as any).__PHILJS_IOS__ = true;
      const platform = detectPlatform();
      expect(platform).toBe('ios');
      delete (globalThis as any).__PHILJS_IOS__;
    });

    it('should detect Android when native bridge is present', () => {
      (globalThis as any).__PHILJS_ANDROID__ = true;
      const platform = detectPlatform();
      expect(platform).toBe('android');
      delete (globalThis as any).__PHILJS_ANDROID__;
    });
  });

  describe('getPlatformInfo', () => {
    it('should return platform info object', () => {
      const info = getPlatformInfo();

      expect(info).toHaveProperty('platform');
      expect(info).toHaveProperty('version');
      expect(info).toHaveProperty('isNative');
      expect(info).toHaveProperty('isWeb');
      expect(info).toHaveProperty('isIOS');
      expect(info).toHaveProperty('isAndroid');
      expect(info).toHaveProperty('deviceType');
      expect(info).toHaveProperty('screenWidth');
      expect(info).toHaveProperty('screenHeight');
      expect(info).toHaveProperty('pixelRatio');
      expect(info).toHaveProperty('colorScheme');
    });

    it('should have correct web values', () => {
      const info = getPlatformInfo();

      expect(info.platform).toBe('web');
      expect(info.isWeb).toBe(true);
      expect(info.isNative).toBe(false);
    });
  });

  describe('platformSelect', () => {
    it('should return default value on web', () => {
      const result = platformSelect({
        ios: 'ios-value',
        android: 'android-value',
        default: 'default-value',
      });

      expect(result).toBe('default-value');
    });

    it('should return web value when available', () => {
      const result = platformSelect({
        ios: 'ios-value',
        web: 'web-value',
        default: 'default-value',
      });

      expect(result).toBe('web-value');
    });

    it('should handle undefined platform values', () => {
      const result = platformSelect({
        default: 'fallback',
      });

      expect(result).toBe('fallback');
    });
  });

  describe('onPlatform', () => {
    it('should execute web handler on web platform', () => {
      const webFn = vi.fn(() => 'web-result');
      const iosFn = vi.fn(() => 'ios-result');

      const result = onPlatform({
        web: webFn,
        ios: iosFn,
      });

      expect(result).toBe('web-result');
      expect(webFn).toHaveBeenCalled();
      expect(iosFn).not.toHaveBeenCalled();
    });

    it('should execute default handler when no platform match', () => {
      const defaultFn = vi.fn(() => 'default-result');

      const result = onPlatform({
        ios: () => 'ios',
        default: defaultFn,
      });

      expect(result).toBe('default-result');
    });

    it('should return undefined when no handlers match', () => {
      const result = onPlatform({
        ios: () => 'ios',
      });

      expect(result).toBeUndefined();
    });
  });

  describe('getDimensions', () => {
    it('should return dimensions object', () => {
      const dims = getDimensions();

      expect(dims).toHaveProperty('width');
      expect(dims).toHaveProperty('height');
      expect(dims).toHaveProperty('scale');
      expect(typeof dims.width).toBe('number');
      expect(typeof dims.height).toBe('number');
      expect(typeof dims.scale).toBe('number');
    });
  });

  describe('createNativeApp', () => {
    it('should create a native app instance', () => {
      const app = createNativeApp({
        root: () => ({ type: 'div', children: 'Hello' }),
      });

      expect(app).toHaveProperty('state');
      expect(app).toHaveProperty('platform');
      expect(app).toHaveProperty('render');
      expect(app).toHaveProperty('unmount');
      expect(app).toHaveProperty('navigate');
    });

    it('should have active state by default', () => {
      const app = createNativeApp({
        root: () => null,
      });

      expect(app.state()).toBe('active');
    });

    it('should be able to render without error', () => {
      const app = createNativeApp({
        root: () => null,
      });

      expect(() => app.render()).not.toThrow();
    });

    it('should be able to unmount without error', () => {
      const app = createNativeApp({
        root: () => null,
      });

      app.render();
      expect(() => app.unmount()).not.toThrow();
    });
  });

  describe('Component Registry', () => {
    beforeEach(() => {
      // Clear registry between tests
    });

    it('should register a native component', () => {
      const component = () => ({ type: 'div' });

      registerNativeComponent('TestComponent', component);

      expect(hasNativeComponent('TestComponent')).toBe(true);
    });

    it('should get a registered component', () => {
      const component = () => ({ type: 'div' });

      registerNativeComponent('TestComponent2', component);
      const retrieved = getNativeComponent('TestComponent2');

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('TestComponent2');
      expect(retrieved?.render).toBe(component);
    });

    it('should return undefined for unregistered component', () => {
      const retrieved = getNativeComponent('NonExistent');

      expect(retrieved).toBeUndefined();
    });

    it('should get all registered component names', () => {
      registerNativeComponent('A', () => null);
      registerNativeComponent('B', () => null);

      const names = getRegisteredComponents();

      expect(names).toContain('A');
      expect(names).toContain('B');
    });
  });

  describe('NativeBridge', () => {
    it('should return singleton instance', () => {
      const bridge1 = NativeBridge.getInstance();
      const bridge2 = NativeBridge.getInstance();

      expect(bridge1).toBe(bridge2);
    });

    // Skip: localStorage not properly available in test environment
    it.skip('should provide web fallback for Storage.getItem', async () => {
      const bridge = NativeBridge.getInstance();

      localStorage.setItem('@philjs:test', 'value');
      const result = await bridge.call('Storage', 'getItem', '@philjs:test');

      expect(result).toBe('value');
    });

    // Skip: localStorage not properly available in test environment
    it.skip('should provide web fallback for Storage.setItem', async () => {
      const bridge = NativeBridge.getInstance();

      await bridge.call('Storage', 'setItem', '@philjs:test2', 'value2');
      const stored = localStorage.getItem('@philjs:test2');

      expect(stored).toBe('value2');
    });

    it('should allow subscribing to events', () => {
      const bridge = NativeBridge.getInstance();
      const callback = vi.fn();

      const unsubscribe = bridge.on('testEvent', callback);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should emit events to listeners', () => {
      const bridge = NativeBridge.getInstance();
      const callback = vi.fn();

      bridge.on('testEvent', callback);
      bridge.emit('testEvent', { data: 'test' });

      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should unsubscribe from events', () => {
      const bridge = NativeBridge.getInstance();
      const callback = vi.fn();

      const unsubscribe = bridge.on('testEvent2', callback);
      unsubscribe();
      bridge.emit('testEvent2', { data: 'test' });

      expect(callback).not.toHaveBeenCalled();
    });
  });
});
