/**
 * Comprehensive tests for PWA plugin
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateServiceWorker,
  registerServiceWorker,
  unregisterServiceWorker,
  skipWaitingAndReload,
} from './service-worker.js';
import {
  generateManifest,
  createManifestJSON,
  generatePWAMetaTags,
} from './manifest.js';
import {
  isOnline,
  initOfflineDetection,
  queueOfflineRequest,
} from './offline.js';
import {
  canInstall,
  isInstalled,
  initInstallPrompt,
  showInstallPrompt,
} from './install.js';
import {
  hasUpdate,
  initUpdateNotifications,
  checkForUpdates,
  applyUpdate,
} from './updates.js';
import {
  isBackgroundSyncSupported,
  registerBackgroundSync,
} from './background-sync.js';
import {
  createCacheRule,
  cacheRules,
  getDefaultCacheRules,
} from './cache-strategies.js';

// Mock browser APIs
const mockServiceWorker = {
  register: vi.fn(),
  getRegistration: vi.fn(),
  getRegistrations: vi.fn(),
  ready: Promise.resolve({
    sync: { register: vi.fn(), getTags: vi.fn() },
  }),
};

const mockCaches = {
  open: vi.fn(),
  match: vi.fn(),
  keys: vi.fn(),
  delete: vi.fn(),
};

beforeEach(() => {
  vi.stubGlobal('navigator', {
    serviceWorker: mockServiceWorker,
    onLine: true,
  });
  vi.stubGlobal('caches', mockCaches);
});

describe('Service Worker', () => {
  it('should generate service worker code', () => {
    const code = generateServiceWorker({
      cacheVersion: 'v1',
      precache: ['/index.html', '/app.js'],
      skipWaiting: true,
    });

    expect(code).toContain('CACHE_VERSION');
    expect(code).toContain('/index.html');
    expect(code).toContain('skipWaiting');
  });

  it('should include cache strategies', () => {
    const code = generateServiceWorker({
      runtimeCaching: [
        { pattern: /\.js$/, strategy: 'cache-first' },
        { pattern: /api/, strategy: 'network-first' },
      ],
    });

    expect(code).toContain('cache-first');
    expect(code).toContain('network-first');
  });

  it('should register service worker', async () => {
    mockServiceWorker.register.mockResolvedValue({ scope: '/' });

    const reg = await registerServiceWorker('/sw.js');

    expect(reg).toBeTruthy();
    expect(mockServiceWorker.register).toHaveBeenCalledWith('/sw.js', undefined);
  });
});

describe('Manifest', () => {
  it('should generate manifest', () => {
    const manifest = generateManifest({
      name: 'Test App',
      theme_color: '#000',
    });

    expect(manifest.name).toBe('Test App');
    expect(manifest.theme_color).toBe('#000');
    expect(manifest.start_url).toBe('/');
  });

  it('should create manifest JSON', () => {
    const json = createManifestJSON({ name: 'App' });
    const parsed = JSON.parse(json);

    expect(parsed.name).toBe('App');
  });

  it('should generate PWA meta tags', () => {
    const tags = generatePWAMetaTags({ name: 'App', theme_color: '#fff' });

    expect(tags).toContain('apple-mobile-web-app');
    expect(tags).toContain('#fff');
  });
});

describe('Offline Support', () => {
  it('should track online status', () => {
    expect(isOnline()).toBe(true);
  });

  it('should detect offline', () => {
    const cleanup = initOfflineDetection();

    window.dispatchEvent(new Event('offline'));
    expect(isOnline()).toBe(false);

    window.dispatchEvent(new Event('online'));
    expect(isOnline()).toBe(true);

    cleanup();
  });
});

describe('Install Prompt', () => {
  it('should handle install prompt', () => {
    const cleanup = initInstallPrompt();

    const event = new Event('beforeinstallprompt');
    (event as any).preventDefault = vi.fn();
    (event as any).prompt = vi.fn();
    (event as any).userChoice = Promise.resolve({ outcome: 'accepted' });

    window.dispatchEvent(event);
    expect(canInstall()).toBe(true);

    cleanup();
  });
});

describe('Updates', () => {
  it('should check for updates', async () => {
    mockServiceWorker.getRegistration.mockResolvedValue({
      update: vi.fn(),
      waiting: null,
    });

    const result = await checkForUpdates();
    expect(result).toBe(false);
  });
});

describe('Cache Strategies', () => {
  it('should create cache rule', () => {
    const rule = createCacheRule(/\.js$/, 'cache-first', { maxAge: 1000 });

    expect(rule.strategy).toBe('cache-first');
    expect(rule.maxAge).toBe(1000);
  });

  it('should provide default rules', () => {
    const rules = getDefaultCacheRules();
    expect(rules.length).toBeGreaterThan(0);
  });
});
