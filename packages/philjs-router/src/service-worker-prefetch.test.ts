/**
 * Tests for Service Worker Prefetch Integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generatePrefetchServiceWorker,
  initServiceWorkerPrefetch,
  requestSwPrefetch,
  isSwCached,
  getSwCachedUrls,
  clearSwCache,
  closeServiceWorkerPrefetch,
  createInlineServiceWorker,
  swrFetch,
} from './service-worker-prefetch.js';

// Mock BroadcastChannel
class MockBroadcastChannel {
  onmessage: ((event: any) => void) | null = null;
  postMessage = vi.fn();
  close = vi.fn();
}
global.BroadcastChannel = MockBroadcastChannel as any;

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock caches API
const mockCache = {
  match: vi.fn(),
  put: vi.fn(),
  keys: vi.fn(() => Promise.resolve([])),
  delete: vi.fn(),
};
const mockCaches = {
  open: vi.fn(() => Promise.resolve(mockCache)),
  delete: vi.fn(() => Promise.resolve(true)),
  keys: vi.fn(() => Promise.resolve([])),
};
global.caches = mockCaches as any;

// Mock Blob and URL
class MockBlob {
  content: string;
  type: string;
  constructor(content: string[], options: { type: string }) {
    this.content = content.join('');
    this.type = options.type;
  }
}
global.Blob = MockBlob as any;

const mockCreateObjectURL = vi.fn(() => 'blob:test-url');
global.URL = {
  createObjectURL: mockCreateObjectURL,
} as any;

// Mock navigator.serviceWorker
const mockServiceWorker = {
  register: vi.fn(),
  controller: null,
};
global.navigator = {
  serviceWorker: mockServiceWorker,
} as any;

describe('generatePrefetchServiceWorker', () => {
  it('should generate service worker code', () => {
    const code = generatePrefetchServiceWorker();

    expect(code).toContain('PhilJS Prefetch Service Worker');
    expect(code).toContain('ROUTE_CACHE');
    expect(code).toContain('DATA_CACHE');
  });

  it('should use default cache names', () => {
    const code = generatePrefetchServiceWorker();

    expect(code).toContain('philjs-route-cache-v1');
    expect(code).toContain('philjs-data-cache-v1');
  });

  it('should use custom cache names', () => {
    const code = generatePrefetchServiceWorker({
      routeCacheName: 'my-routes',
      dataCacheName: 'my-data',
    });

    expect(code).toContain('my-routes');
    expect(code).toContain('my-data');
  });

  it('should use custom max age', () => {
    const code = generatePrefetchServiceWorker({
      maxAge: 60000,
    });

    expect(code).toContain('60000');
  });

  it('should use custom max entries', () => {
    const code = generatePrefetchServiceWorker({
      maxEntries: 100,
    });

    expect(code).toContain('100');
  });

  it('should include stale-while-revalidate option', () => {
    const codeEnabled = generatePrefetchServiceWorker({
      staleWhileRevalidate: true,
    });
    expect(codeEnabled).toContain('STALE_WHILE_REVALIDATE = true');

    const codeDisabled = generatePrefetchServiceWorker({
      staleWhileRevalidate: false,
    });
    expect(codeDisabled).toContain('STALE_WHILE_REVALIDATE = false');
  });

  it('should include event listeners', () => {
    const code = generatePrefetchServiceWorker();

    expect(code).toContain("addEventListener('install'");
    expect(code).toContain("addEventListener('activate'");
    expect(code).toContain("addEventListener('fetch'");
    expect(code).toContain("addEventListener('message'");
  });

  it('should include message handlers', () => {
    const code = generatePrefetchServiceWorker();

    expect(code).toContain('PREFETCH_REQUEST');
    expect(code).toContain('GET_CACHED_URLS');
    expect(code).toContain('CLEAR_CACHE');
  });
});

describe('Service Worker Communication', () => {
  let mockChannel: MockBroadcastChannel;

  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel = new MockBroadcastChannel();
    global.BroadcastChannel = vi.fn(() => mockChannel) as any;
  });

  afterEach(() => {
    closeServiceWorkerPrefetch();
  });

  describe('initServiceWorkerPrefetch', () => {
    it('should create a BroadcastChannel', () => {
      initServiceWorkerPrefetch();

      expect(global.BroadcastChannel).toHaveBeenCalledWith('philjs-prefetch');
    });

    it('should request cached URLs on init', () => {
      initServiceWorkerPrefetch();

      expect(mockChannel.postMessage).toHaveBeenCalledWith({
        type: 'GET_CACHED_URLS',
      });
    });
  });

  describe('requestSwPrefetch', () => {
    it('should send prefetch request', () => {
      initServiceWorkerPrefetch();
      requestSwPrefetch('/dashboard', 'high');

      expect(mockChannel.postMessage).toHaveBeenCalledWith({
        type: 'PREFETCH_REQUEST',
        url: '/dashboard',
        priority: 'high',
      });
    });

    it('should use default priority', () => {
      initServiceWorkerPrefetch();
      requestSwPrefetch('/dashboard');

      expect(mockChannel.postMessage).toHaveBeenCalledWith({
        type: 'PREFETCH_REQUEST',
        url: '/dashboard',
        priority: 'low',
      });
    });

    it('should do nothing if not initialized', () => {
      closeServiceWorkerPrefetch();
      requestSwPrefetch('/dashboard');

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe('isSwCached', () => {
    it('should return false initially', () => {
      initServiceWorkerPrefetch();
      expect(isSwCached('/dashboard')).toBe(false);
    });

    it('should return true after cache status update', () => {
      initServiceWorkerPrefetch();

      // Simulate cache status message
      mockChannel.onmessage?.({
        data: {
          type: 'CACHE_STATUS',
          urls: ['/dashboard', '/users'],
        },
      });

      expect(isSwCached('/dashboard')).toBe(true);
      expect(isSwCached('/users')).toBe(true);
      expect(isSwCached('/unknown')).toBe(false);
    });

    it('should update on prefetch complete', () => {
      initServiceWorkerPrefetch();

      mockChannel.onmessage?.({
        data: {
          type: 'PREFETCH_COMPLETE',
          url: '/dashboard',
          success: true,
        },
      });

      expect(isSwCached('/dashboard')).toBe(true);
    });
  });

  describe('getSwCachedUrls', () => {
    it('should return empty array initially', () => {
      initServiceWorkerPrefetch();
      expect(getSwCachedUrls()).toEqual([]);
    });

    it('should return cached URLs', () => {
      initServiceWorkerPrefetch();

      mockChannel.onmessage?.({
        data: {
          type: 'CACHE_STATUS',
          urls: ['/a', '/b', '/c'],
        },
      });

      expect(getSwCachedUrls()).toEqual(['/a', '/b', '/c']);
    });
  });

  describe('clearSwCache', () => {
    it('should send clear cache message', () => {
      initServiceWorkerPrefetch();
      clearSwCache();

      expect(mockChannel.postMessage).toHaveBeenCalledWith({
        type: 'CLEAR_CACHE',
      });
    });

    it('should clear local cache tracking', () => {
      initServiceWorkerPrefetch();

      mockChannel.onmessage?.({
        data: {
          type: 'CACHE_STATUS',
          urls: ['/dashboard'],
        },
      });

      expect(isSwCached('/dashboard')).toBe(true);

      clearSwCache();

      expect(isSwCached('/dashboard')).toBe(false);
    });
  });

  describe('closeServiceWorkerPrefetch', () => {
    it('should close the channel', () => {
      initServiceWorkerPrefetch();
      closeServiceWorkerPrefetch();

      expect(mockChannel.close).toHaveBeenCalled();
    });

    it('should clear cached URLs', () => {
      initServiceWorkerPrefetch();

      mockChannel.onmessage?.({
        data: {
          type: 'CACHE_STATUS',
          urls: ['/dashboard'],
        },
      });

      closeServiceWorkerPrefetch();

      expect(getSwCachedUrls()).toEqual([]);
    });
  });
});

describe('createInlineServiceWorker', () => {
  it('should create a blob URL', () => {
    const url = createInlineServiceWorker();

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(url).toBe('blob:test-url');
  });

  it('should accept custom config', () => {
    const url = createInlineServiceWorker({
      routeCacheName: 'custom-routes',
      maxAge: 60000,
    });

    // The blob URL should be created
    expect(url).toBe('blob:test-url');
    expect(mockCreateObjectURL).toHaveBeenCalled();
  });
});

describe('swrFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCache.match.mockResolvedValue(null);
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'x-prefetch-timestamp': Date.now().toString() }),
      clone: () => ({
        body: null,
      }),
    });
  });

  it('should fetch from network if not cached', async () => {
    const response = await swrFetch('/api/data');

    expect(mockFetch).toHaveBeenCalledWith('/api/data');
    expect(response.ok).toBe(true);
  });

  it('should cache successful responses', async () => {
    await swrFetch('/api/data');

    expect(mockCache.put).toHaveBeenCalled();
  });

  it('should return cached response if available', async () => {
    const cachedResponse = {
      ok: true,
      headers: new Headers({
        'x-prefetch-timestamp': (Date.now() - 1000).toString(),
      }),
    };
    mockCache.match.mockResolvedValue(cachedResponse);

    const response = await swrFetch('/api/data', { maxAge: 60000 });

    expect(response).toBe(cachedResponse);
  });

  it('should revalidate in background', async () => {
    const onRevalidate = vi.fn();
    const cachedResponse = {
      ok: true,
      headers: new Headers({
        'x-prefetch-timestamp': (Date.now() - 1000).toString(),
      }),
    };
    mockCache.match.mockResolvedValue(cachedResponse);

    await swrFetch('/api/data', {
      maxAge: 60000,
      onRevalidate,
    });

    // Background fetch should be triggered
    expect(mockFetch).toHaveBeenCalled();
  });

  it('should use custom cache name', async () => {
    await swrFetch('/api/data', { cacheName: 'my-cache' });

    expect(mockCaches.open).toHaveBeenCalledWith('my-cache');
  });

  it('should respect max age', async () => {
    const oldTimestamp = Date.now() - 120000; // 2 minutes ago
    const cachedResponse = {
      ok: true,
      headers: new Headers({
        'x-prefetch-timestamp': oldTimestamp.toString(),
      }),
    };
    mockCache.match.mockResolvedValue(cachedResponse);

    await swrFetch('/api/data', { maxAge: 60000 }); // 1 minute max age

    // Should fetch from network since cache is too old
    expect(mockFetch).toHaveBeenCalled();
  });
});

describe('Service Worker Registration', () => {
  it('should handle missing serviceWorker support', async () => {
    const originalNavigator = global.navigator;
    global.navigator = {} as any;

    const { registerPrefetchServiceWorker } = await import('./service-worker-prefetch.js');
    const result = await registerPrefetchServiceWorker();

    expect(result).toBeNull();

    global.navigator = originalNavigator;
  });
});
