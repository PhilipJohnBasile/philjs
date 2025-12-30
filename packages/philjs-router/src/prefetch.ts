/**
 * Qwik-style Speculative Prefetching Manager
 *
 * Provides intelligent prefetching with:
 * - Multiple prefetch modes (hover, visible, intent, render, none)
 * - Priority queue with visible > hover > idle ordering
 * - Network-aware prefetching (Save-Data, connection speed)
 * - Concurrent request limiting
 * - Service worker integration
 * - Data + code prefetching
 */

export type PrefetchMode = 'hover' | 'visible' | 'intent' | 'render' | 'none';

export type PrefetchPriority = 'critical' | 'high' | 'medium' | 'low' | 'idle';

export interface PrefetchConfig {
  /** Maximum concurrent prefetch requests */
  maxConcurrent?: number;
  /** Delay in ms before hover prefetch triggers */
  hoverDelay?: number;
  /** Intent threshold (0-1) for predictive prefetching */
  intentThreshold?: number;
  /** Respect Save-Data header */
  respectSaveData?: boolean;
  /** Minimum effective connection type to prefetch (e.g., '3g', '4g') */
  minConnectionType?: '2g' | '3g' | '4g' | 'slow-2g';
  /** Enable service worker caching */
  useServiceWorker?: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  /** Prefetch route data (loaders) */
  prefetchData?: boolean;
  /** Custom fetch options */
  fetchOptions?: RequestInit;
}

export interface PrefetchQueueItem {
  url: string;
  priority: PrefetchPriority;
  mode: PrefetchMode;
  timestamp: number;
  withData?: boolean;
  retryCount?: number;
}

export interface PrefetchStats {
  queued: number;
  loading: number;
  loaded: number;
  failed: number;
  cacheHits: number;
  cacheMisses: number;
  networkSaved: number; // bytes
}

export interface RouteLoader {
  (context: { params: Record<string, string>; request: Request }): Promise<any>;
}

export interface RouteModule {
  loader?: RouteLoader;
  default?: Function;
  config?: Record<string, unknown>;
}

export interface PrefetchResult {
  url: string;
  success: boolean;
  cached: boolean;
  data?: any;
  error?: Error;
  timing?: number;
}

// Priority weights for queue ordering
const PRIORITY_WEIGHTS: Record<PrefetchPriority, number> = {
  critical: 100,
  high: 80,
  medium: 60,
  low: 40,
  idle: 20,
};

// Mode to priority mapping
const MODE_PRIORITY: Record<PrefetchMode, PrefetchPriority> = {
  render: 'critical',
  visible: 'high',
  intent: 'medium',
  hover: 'low',
  none: 'idle',
};

// Connection type speeds (approximate Mbps)
const CONNECTION_SPEEDS: Record<string, number> = {
  'slow-2g': 0.05,
  '2g': 0.15,
  '3g': 1.5,
  '4g': 10,
};

/**
 * Network information from Navigator API
 */
interface NetworkInfo {
  saveData: boolean;
  effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  downlink: number;
  rtt: number;
}

/**
 * Get current network information
 */
function getNetworkInfo(): NetworkInfo {
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const connection = (nav as any)?.connection || (nav as any)?.mozConnection || (nav as any)?.webkitConnection;

  return {
    saveData: connection?.saveData || false,
    effectiveType: connection?.effectiveType || '4g',
    downlink: connection?.downlink || 10,
    rtt: connection?.rtt || 50,
  };
}

/**
 * Check if prefetching should be allowed based on network conditions
 */
function shouldPrefetch(config: PrefetchConfig): boolean {
  const network = getNetworkInfo();

  // Respect Save-Data header
  if (config.respectSaveData && network.saveData) {
    return false;
  }

  // Check connection type
  if (config.minConnectionType) {
    const minSpeed = CONNECTION_SPEEDS[config.minConnectionType] || 0;
    const currentSpeed = CONNECTION_SPEEDS[network.effectiveType] || 10;
    if (currentSpeed < minSpeed) {
      return false;
    }
  }

  return true;
}

/**
 * Prefetch Manager - Qwik-style speculative prefetching
 */
export class PrefetchManager {
  private queue: PrefetchQueueItem[] = [];
  private loading = new Map<string, Promise<PrefetchResult>>();
  private loaded = new Map<string, { result: PrefetchResult; timestamp: number }>();
  private failed = new Set<string>();
  private config: Required<PrefetchConfig>;
  private stats: PrefetchStats = {
    queued: 0,
    loading: 0,
    loaded: 0,
    failed: 0,
    cacheHits: 0,
    cacheMisses: 0,
    networkSaved: 0,
  };

  // Route module registry for data prefetching
  private routeModules = new Map<string, RouteModule>();
  private dataCache = new Map<string, { data: any; timestamp: number }>();

  // Service worker communication channel
  private swChannel: BroadcastChannel | null = null;

  constructor(config: PrefetchConfig = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent ?? 3,
      hoverDelay: config.hoverDelay ?? 100,
      intentThreshold: config.intentThreshold ?? 0.6,
      respectSaveData: config.respectSaveData ?? true,
      minConnectionType: config.minConnectionType ?? '3g',
      useServiceWorker: config.useServiceWorker ?? true,
      cacheTTL: config.cacheTTL ?? 5 * 60 * 1000, // 5 minutes
      prefetchData: config.prefetchData ?? true,
      fetchOptions: config.fetchOptions ?? {},
    };

    this.initServiceWorkerChannel();
  }

  /**
   * Initialize service worker communication
   */
  private initServiceWorkerChannel(): void {
    if (typeof window === 'undefined') return;
    if (!this.config.useServiceWorker) return;

    try {
      this.swChannel = new BroadcastChannel('philjs-prefetch');
      this.swChannel.onmessage = (event) => {
        this.handleServiceWorkerMessage(event.data);
      };
    } catch {
      // BroadcastChannel not supported
    }
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(message: any): void {
    if (message.type === 'PREFETCH_COMPLETE') {
      const { url, success, cached } = message;
      if (success && cached) {
        this.stats.cacheHits++;
      }
    }
  }

  /**
   * Register a route module for data prefetching
   */
  public registerRouteModule(path: string, module: RouteModule): void {
    this.routeModules.set(path, module);
  }

  /**
   * Prefetch a route (code only)
   */
  public prefetchRoute(url: string, mode: PrefetchMode = 'hover'): Promise<PrefetchResult> {
    return this.prefetch(url, { mode, withData: false });
  }

  /**
   * Prefetch a route with its data loader
   */
  public prefetchRouteWithData(
    url: string,
    options: { preload?: boolean; params?: Record<string, string> } = {}
  ): Promise<PrefetchResult> {
    const prefetchOptions: {
      mode?: PrefetchMode;
      withData?: boolean;
      priority?: PrefetchPriority;
      params?: Record<string, string>;
    } = {
      mode: options.preload ? 'render' : 'intent',
      withData: true,
    };
    if (options.params !== undefined) {
      prefetchOptions.params = options.params;
    }
    return this.prefetch(url, prefetchOptions);
  }

  /**
   * Main prefetch method
   */
  public async prefetch(
    url: string,
    options: {
      mode?: PrefetchMode;
      withData?: boolean;
      priority?: PrefetchPriority;
      params?: Record<string, string>;
    } = {}
  ): Promise<PrefetchResult> {
    const mode = options.mode ?? 'hover';
    const withData = options.withData ?? false;
    const priority = options.priority ?? MODE_PRIORITY[mode];

    // Skip if mode is 'none'
    if (mode === 'none') {
      return { url, success: false, cached: false };
    }

    // Check network conditions
    if (!shouldPrefetch(this.config)) {
      return { url, success: false, cached: false };
    }

    // Check cache first
    const cached = this.loaded.get(url);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
      this.stats.cacheHits++;
      return cached.result;
    }

    // Check if already loading
    const existing = this.loading.get(url);
    if (existing) {
      return existing;
    }

    // Check if failed recently (skip for 30 seconds)
    if (this.failed.has(url)) {
      return { url, success: false, cached: false };
    }

    // Add to queue
    const item: PrefetchQueueItem = {
      url,
      priority,
      mode,
      timestamp: Date.now(),
      withData,
      retryCount: 0,
    };

    this.addToQueue(item);
    this.stats.queued++;

    // Process queue
    return this.processQueue(url, options.params);
  }

  /**
   * Add item to priority queue
   */
  private addToQueue(item: PrefetchQueueItem): void {
    // Remove existing entry for same URL
    this.queue = this.queue.filter((q) => q.url !== item.url);

    // Add new item
    this.queue.push(item);

    // Sort by priority (higher weight first), then by timestamp (older first)
    this.queue.sort((a, b) => {
      const priorityDiff = PRIORITY_WEIGHTS[b.priority] - PRIORITY_WEIGHTS[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });
  }

  /**
   * Process the prefetch queue
   */
  private async processQueue(targetUrl?: string, params?: Record<string, string>): Promise<PrefetchResult> {
    // Track the result for the target URL
    let targetResult: Promise<PrefetchResult> | undefined;

    while (this.queue.length > 0 && this.loading.size < this.config.maxConcurrent) {
      const item = this.queue.shift();
      if (!item) break;

      this.stats.queued--;

      const fetchPromise = this.executePrefetch(item, params);
      this.loading.set(item.url, fetchPromise);
      this.stats.loading++;

      if (item.url === targetUrl) {
        targetResult = fetchPromise;
      }

      // Don't await - let it process in parallel
      fetchPromise.finally(() => {
        this.loading.delete(item.url);
        this.stats.loading--;
        // Continue processing queue
        this.processQueue();
      });
    }

    // If we're waiting for a specific URL
    if (targetUrl) {
      const existing = this.loading.get(targetUrl);
      if (existing) {
        return existing;
      }
      if (targetResult) {
        return targetResult;
      }
      // URL might already be loaded
      const cached = this.loaded.get(targetUrl);
      if (cached) {
        return cached.result;
      }
    }

    return { url: targetUrl || '', success: true, cached: false };
  }

  /**
   * Execute a single prefetch
   */
  private async executePrefetch(
    item: PrefetchQueueItem,
    params?: Record<string, string>
  ): Promise<PrefetchResult> {
    const startTime = performance.now();

    try {
      // Try service worker first
      if (this.config.useServiceWorker && this.swChannel) {
        this.swChannel.postMessage({
          type: 'PREFETCH_REQUEST',
          url: item.url,
          priority: item.priority,
        });
      }

      // Prefetch the route code using link prefetch
      await this.prefetchCode(item.url);

      // Prefetch data if requested
      let data: any;
      if (item.withData && this.config.prefetchData) {
        data = await this.prefetchData(item.url, params || {});
      }

      const timing = performance.now() - startTime;
      const result: PrefetchResult = {
        url: item.url,
        success: true,
        cached: false,
        data,
        timing,
      };

      // Cache the result
      this.loaded.set(item.url, { result, timestamp: Date.now() });
      this.stats.loaded++;
      this.stats.cacheMisses++;

      return result;
    } catch (error) {
      const timing = performance.now() - startTime;

      // Retry logic
      if ((item.retryCount ?? 0) < 2) {
        item.retryCount = (item.retryCount ?? 0) + 1;
        // Add back to queue with lower priority
        item.priority = 'low';
        this.addToQueue(item);
        return { url: item.url, success: false, cached: false, timing };
      }

      // Mark as failed
      this.failed.add(item.url);
      this.stats.failed++;

      // Clear failed status after 30 seconds
      setTimeout(() => this.failed.delete(item.url), 30000);

      return {
        url: item.url,
        success: false,
        cached: false,
        error: error instanceof Error ? error : new Error(String(error)),
        timing,
      };
    }
  }

  /**
   * Prefetch route code using link prefetch
   */
  private async prefetchCode(url: string): Promise<void> {
    if (typeof document === 'undefined') return;

    // Check if already prefetched
    const existingLink = document.querySelector(`link[rel="prefetch"][href="${url}"]`);
    if (existingLink) return;

    // Create prefetch link
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    link.as = 'document';

    // Add to document
    document.head.appendChild(link);

    // Also do a fetch for more control
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'X-Prefetch': 'true',
        },
        ...this.config.fetchOptions,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Estimate network savings
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        this.stats.networkSaved += parseInt(contentLength, 10);
      }
    } catch (error) {
      // Remove failed prefetch link
      link.remove();
      throw error;
    }
  }

  /**
   * Prefetch route data (run loader)
   */
  private async prefetchData(url: string, params: Record<string, string>): Promise<any> {
    // Check data cache first
    const cached = this.dataCache.get(url);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
      return cached.data;
    }

    // Find route module
    const pathname = new URL(url, 'http://localhost').pathname;
    const module = this.findRouteModule(pathname);

    if (!module?.loader) {
      return undefined;
    }

    // Execute loader
    const request = new Request(url, { method: 'GET' });
    const data = await module.loader({ params, request });

    // Cache data
    this.dataCache.set(url, { data, timestamp: Date.now() });

    return data;
  }

  /**
   * Find route module for a path
   */
  private findRouteModule(pathname: string): RouteModule | undefined {
    // Try exact match first
    if (this.routeModules.has(pathname)) {
      return this.routeModules.get(pathname);
    }

    // Try pattern matching
    for (const [pattern, module] of this.routeModules) {
      if (this.matchPath(pattern, pathname)) {
        return module;
      }
    }

    return undefined;
  }

  /**
   * Simple path pattern matching
   */
  private matchPath(pattern: string, pathname: string): boolean {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = pathname.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) return false;

    for (let i = 0; i < patternParts.length; i++) {
      const segment = patternParts[i];
      if (segment === undefined) continue;
      if (segment.startsWith(':') || segment === '*') {
        continue;
      }
      if (segment !== pathParts[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Cancel a pending prefetch
   */
  public cancel(url: string): void {
    this.queue = this.queue.filter((item) => item.url !== url);
  }

  /**
   * Cancel all pending prefetches
   */
  public cancelAll(): void {
    this.queue = [];
  }

  /**
   * Get prefetch statistics
   */
  public getStats(): PrefetchStats {
    return { ...this.stats };
  }

  /**
   * Check if a URL is prefetched
   */
  public isPrefetched(url: string): boolean {
    const cached = this.loaded.get(url);
    return cached !== undefined && Date.now() - cached.timestamp < this.config.cacheTTL;
  }

  /**
   * Check if a URL is currently loading
   */
  public isLoading(url: string): boolean {
    return this.loading.has(url);
  }

  /**
   * Get cached data for a URL
   */
  public getCachedData(url: string): any | undefined {
    const cached = this.dataCache.get(url);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
      return cached.data;
    }
    return undefined;
  }

  /**
   * Clear all caches
   */
  public clear(): void {
    this.queue = [];
    this.loading.clear();
    this.loaded.clear();
    this.failed.clear();
    this.dataCache.clear();
    this.stats = {
      queued: 0,
      loading: 0,
      loaded: 0,
      failed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      networkSaved: 0,
    };
  }

  /**
   * Destroy the prefetch manager
   */
  public destroy(): void {
    this.clear();
    this.routeModules.clear();
    this.swChannel?.close();
    this.swChannel = null;
  }
}

// ============================================================================
// Global Prefetch Manager Instance
// ============================================================================

let globalPrefetchManager: PrefetchManager | null = null;

/**
 * Initialize the global prefetch manager
 */
export function initPrefetchManager(config?: PrefetchConfig): PrefetchManager {
  if (globalPrefetchManager) {
    globalPrefetchManager.destroy();
  }
  globalPrefetchManager = new PrefetchManager(config);
  return globalPrefetchManager;
}

/**
 * Get the global prefetch manager
 */
export function getPrefetchManager(): PrefetchManager | null {
  return globalPrefetchManager;
}

/**
 * Prefetch a route (convenience function)
 */
export function prefetchRoute(url: string, mode?: PrefetchMode): Promise<PrefetchResult> {
  const manager = globalPrefetchManager || initPrefetchManager();
  return manager.prefetchRoute(url, mode);
}

/**
 * Prefetch a route with data (convenience function)
 */
export function prefetchRouteWithData(
  url: string,
  options?: { preload?: boolean; params?: Record<string, string> }
): Promise<PrefetchResult> {
  const manager = globalPrefetchManager || initPrefetchManager();
  return manager.prefetchRouteWithData(url, options);
}
