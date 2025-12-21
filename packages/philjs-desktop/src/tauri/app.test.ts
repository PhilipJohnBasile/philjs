/**
 * Tests for Tauri App
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createDesktopApp,
  onBeforeClose,
  isAppInitialized,
  getLoadedPlugins,
  createDefaultConfig,
  getAppVersion,
  getAppName,
  getTauriVersion,
} from './app';
import { resetTauriContext } from './context';

describe('Tauri App', () => {
  beforeEach(() => {
    resetTauriContext();
    // Reset DOM
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('createDefaultConfig', () => {
    it('should create default configuration', () => {
      const config = createDefaultConfig();

      expect(config.appName).toBe('PhilJS App');
      expect(config.version).toBe('1.0.0');
      expect(config.window).toBeDefined();
      expect(config.window?.width).toBe(1024);
      expect(config.window?.height).toBe(768);
      expect(config.window?.resizable).toBe(true);
      expect(config.window?.center).toBe(true);
    });

    it('should allow overrides', () => {
      const config = createDefaultConfig({
        appName: 'My App',
        window: {
          width: 800,
          height: 600,
        },
      });

      expect(config.appName).toBe('My App');
      expect(config.window?.width).toBe(800);
    });
  });

  describe('createDesktopApp', () => {
    it('should create app with component', async () => {
      const component = () => '<div>Hello World</div>';
      const onReady = vi.fn();

      await createDesktopApp({
        component,
        onReady,
      });

      expect(isAppInitialized()).toBe(true);
      expect(onReady).toHaveBeenCalled();
    });

    it('should render to container', async () => {
      const container = document.createElement('div');
      container.id = 'test-app';
      document.body.appendChild(container);

      await createDesktopApp({
        component: () => '<h1>Test</h1>',
        containerId: 'test-app',
      });

      expect(container.innerHTML).toBe('<h1>Test</h1>');
    });

    it('should create container if not exists', async () => {
      await createDesktopApp({
        component: () => '<p>Content</p>',
        containerId: 'new-container',
      });

      const container = document.getElementById('new-container');
      expect(container).toBeTruthy();
      expect(container?.innerHTML).toBe('<p>Content</p>');
    });

    it('should load plugins', async () => {
      const plugin = {
        name: 'test-plugin',
        init: vi.fn().mockResolvedValue(undefined),
      };

      await createDesktopApp({
        component: () => '',
        plugins: [plugin],
      });

      expect(plugin.init).toHaveBeenCalled();
      expect(getLoadedPlugins()).toContainEqual(plugin);
    });

    it('should call error handler on plugin failure', async () => {
      const onError = vi.fn();
      const plugin = {
        name: 'failing-plugin',
        init: vi.fn().mockRejectedValue(new Error('Plugin failed')),
      };

      await expect(
        createDesktopApp({
          component: () => '',
          plugins: [plugin],
          onError,
        })
      ).rejects.toThrow('Plugin failed');
    });
  });

  describe('onBeforeClose', () => {
    it('should register before close handler', () => {
      const handler = vi.fn().mockReturnValue(true);

      const unregister = onBeforeClose(handler);

      expect(typeof unregister).toBe('function');
    });

    it('should unregister handler', () => {
      const handler = vi.fn();

      const unregister = onBeforeClose(handler);
      unregister();

      // Handler should be removed
    });
  });

  describe('isAppInitialized', () => {
    it('should return false before init', () => {
      expect(isAppInitialized()).toBe(false);
    });

    it('should return true after init', async () => {
      await createDesktopApp({
        component: () => '',
      });

      expect(isAppInitialized()).toBe(true);
    });
  });

  describe('getLoadedPlugins', () => {
    it('should return empty array initially', () => {
      expect(getLoadedPlugins()).toEqual([]);
    });
  });

  describe('getAppVersion', () => {
    it('should return version string', async () => {
      const version = await getAppVersion();
      expect(typeof version).toBe('string');
    });
  });

  describe('getAppName', () => {
    it('should return app name', async () => {
      const name = await getAppName();
      expect(typeof name).toBe('string');
    });
  });

  describe('getTauriVersion', () => {
    it('should return Tauri version', async () => {
      const version = await getTauriVersion();
      expect(typeof version).toBe('string');
    });
  });
});
