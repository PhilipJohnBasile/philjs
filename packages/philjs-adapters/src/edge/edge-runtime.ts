/**
 * PhilJS Edge Runtime - Universal Edge Runtime Abstraction
 *
 * Provides a unified interface for edge runtimes across:
 * - Cloudflare Workers
 * - Deno Deploy
 * - Vercel Edge
 * - Netlify Edge
 */

// ============================================================================
// Types
// ============================================================================

export type EdgePlatform = 'cloudflare' | 'deno' | 'vercel' | 'netlify' | 'unknown';

export interface EdgeContext {
  /** The edge platform detected */
  platform: EdgePlatform;
  /** Request object */
  request: Request;
  /** Platform-specific environment bindings */
  env: EdgeEnv;
  /** Execution context for background tasks */
  executionContext: EdgeExecutionContext;
  /** Region information */
  region?: EdgeRegion;
  /** Timing information for cold start tracking */
  timing: EdgeTiming;
}

export interface EdgeEnv {
  /** Get an environment variable */
  get(key: string): string | undefined;
  /** Get all environment variables */
  getAll(): Record<string, string>;
  /** Get a KV namespace binding (Cloudflare/Deno) */
  getKV?(namespace: string): EdgeKVNamespace | undefined;
  /** Platform-specific raw environment */
  raw: unknown;
}

export interface EdgeExecutionContext {
  /** Wait for a promise without blocking the response */
  waitUntil(promise: Promise<unknown>): void;
  /** Pass through on exception (Cloudflare Pages) */
  passThroughOnException?(): void;
}

export interface EdgeRegion {
  /** Region code (e.g., 'iad1', 'sfo1') */
  code: string;
  /** Region name */
  name: string;
  /** Continent code */
  continent?: string;
  /** Country code */
  country?: string;
  /** City */
  city?: string;
  /** Latitude */
  latitude?: number;
  /** Longitude */
  longitude?: number;
}

export interface EdgeTiming {
  /** Timestamp when the request started */
  requestStart: number;
  /** Whether this is a cold start */
  isColdStart: boolean;
  /** Cold start duration in ms (if applicable) */
  coldStartDuration?: number;
}

export interface EdgeKVNamespace {
  get(key: string, options?: { type?: 'text' | 'json' | 'arrayBuffer' | 'stream' }): Promise<unknown>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: EdgeKVPutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: EdgeKVListOptions): Promise<EdgeKVListResult>;
}

export interface EdgeKVPutOptions {
  expiration?: number;
  expirationTtl?: number;
  metadata?: Record<string, unknown>;
}

export interface EdgeKVListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

export interface EdgeKVListResult {
  keys: Array<{ name: string; expiration?: number; metadata?: unknown }>;
  list_complete: boolean;
  cursor?: string;
}

export interface EdgeRuntimeConfig {
  /** Enable cold start optimizations */
  coldStartOptimization?: boolean;
  /** Enable request coalescing */
  requestCoalescing?: boolean;
  /** Regions to deploy to */
  regions?: string[];
  /** Custom environment variable prefix */
  envPrefix?: string;
}

// ============================================================================
// Cold Start Tracking
// ============================================================================

// Track cold start state
let isFirstRequest = true;
let coldStartTimestamp = Date.now();

/**
 * Reset cold start tracking (useful for testing)
 */
export function resetColdStartTracking(): void {
  isFirstRequest = true;
  coldStartTimestamp = Date.now();
}

/**
 * Check if current request is a cold start
 */
export function isColdStart(): boolean {
  return isFirstRequest;
}

/**
 * Mark that the first request has been processed
 */
export function markWarm(): void {
  isFirstRequest = false;
}

/**
 * Get cold start duration if this is a cold start
 */
export function getColdStartDuration(): number | undefined {
  if (isFirstRequest) {
    return Date.now() - coldStartTimestamp;
  }
  return undefined;
}

// ============================================================================
// Platform Detection
// ============================================================================

/**
 * Detect the current edge platform
 */
export function detectEdgePlatform(): EdgePlatform {
  // Netlify Edge (uses Deno under the hood but has specific markers)
  // Check this FIRST before Deno since Netlify runs on Deno
  if (typeof (globalThis as any).Netlify !== 'undefined') {
    return 'netlify';
  }

  // Cloudflare Workers
  if (typeof (globalThis as any).caches !== 'undefined' &&
      typeof (globalThis as any).navigator === 'undefined' &&
      typeof (globalThis as any).process === 'undefined') {
    return 'cloudflare';
  }

  // Deno Deploy
  if (typeof (globalThis as any).Deno !== 'undefined') {
    return 'deno';
  }

  // Vercel Edge Runtime
  if (typeof (globalThis as any).EdgeRuntime !== 'undefined') {
    return 'vercel';
  }

  return 'unknown';
}

/**
 * Get platform-specific information
 */
export function getPlatformInfo(): {
  platform: EdgePlatform;
  version: string;
  features: string[];
} {
  const platform = detectEdgePlatform();

  switch (platform) {
    case 'cloudflare':
      return {
        platform,
        version: 'workers',
        features: ['kv', 'd1', 'r2', 'durable-objects', 'queues', 'analytics-engine'],
      };

    case 'deno':
      return {
        platform,
        version: (globalThis as any).Deno?.version?.deno || 'unknown',
        features: ['kv', 'cron', 'broadcast-channel'],
      };

    case 'vercel':
      return {
        platform,
        version: 'edge',
        features: ['edge-config', 'kv', 'blob', 'postgres'],
      };

    case 'netlify':
      return {
        platform,
        version: 'edge',
        features: ['blobs', 'context'],
      };

    default:
      return {
        platform: 'unknown',
        version: 'unknown',
        features: [],
      };
  }
}

// ============================================================================
// Environment Abstraction
// ============================================================================

/**
 * Create a unified environment interface
 */
export function createEdgeEnv(platformEnv: unknown): EdgeEnv {
  const platform = detectEdgePlatform();

  return {
    get(key: string): string | undefined {
      switch (platform) {
        case 'cloudflare':
          return (platformEnv as Record<string, string>)?.[key];

        case 'deno':
          return (globalThis as any).Deno?.env?.get(key);

        case 'vercel':
        case 'netlify':
          // Check process.env or Deno.env
          if (typeof process !== 'undefined') {
            return process.env[key];
          }
          if (typeof (globalThis as any).Deno !== 'undefined') {
            return (globalThis as any).Deno.env.get(key);
          }
          return undefined;

        default:
          if (typeof process !== 'undefined') {
            return process.env[key];
          }
          return undefined;
      }
    },

    getAll(): Record<string, string> {
      switch (platform) {
        case 'cloudflare':
          // Cloudflare env object contains bindings, filter to string values
          const cfEnv: Record<string, string> = {};
          if (platformEnv && typeof platformEnv === 'object') {
            for (const [key, value] of Object.entries(platformEnv)) {
              if (typeof value === 'string') {
                cfEnv[key] = value;
              }
            }
          }
          return cfEnv;

        case 'deno':
          return Object.fromEntries((globalThis as any).Deno?.env?.toObject() || {});

        case 'vercel':
        case 'netlify':
          if (typeof process !== 'undefined') {
            return { ...process.env } as Record<string, string>;
          }
          if (typeof (globalThis as any).Deno !== 'undefined') {
            return Object.fromEntries((globalThis as any).Deno.env.toObject());
          }
          return {};

        default:
          if (typeof process !== 'undefined') {
            return { ...process.env } as Record<string, string>;
          }
          return {};
      }
    },

    getKV(namespace: string): EdgeKVNamespace | undefined {
      switch (platform) {
        case 'cloudflare':
          return (platformEnv as Record<string, EdgeKVNamespace>)?.[namespace];

        case 'deno':
          // Deno KV requires opening
          return undefined; // Must be opened with Deno.openKv()

        case 'vercel':
          // Vercel KV is imported separately
          return undefined;

        default:
          return undefined;
      }
    },

    raw: platformEnv,
  };
}

// ============================================================================
// Execution Context Abstraction
// ============================================================================

/**
 * Create a unified execution context
 */
export function createExecutionContext(platformContext: unknown): EdgeExecutionContext {
  const platform = detectEdgePlatform();

  return {
    waitUntil(promise: Promise<unknown>): void {
      switch (platform) {
        case 'cloudflare':
          (platformContext as any)?.waitUntil?.(promise);
          break;

        case 'deno':
          // Deno Deploy uses a different pattern
          // The promise runs in background automatically
          promise.catch(console.error);
          break;

        case 'vercel':
          (platformContext as any)?.waitUntil?.(promise);
          break;

        case 'netlify':
          (platformContext as any)?.waitUntil?.(promise);
          break;

        default:
          // Fire and forget
          promise.catch(console.error);
      }
    },

    passThroughOnException(): void {
      if (platform === 'cloudflare') {
        (platformContext as any)?.passThroughOnException?.();
      }
    },
  };
}

// ============================================================================
// Region Detection
// ============================================================================

/**
 * Get region information from request headers or context
 */
export function getRegion(request: Request, platformContext?: unknown): EdgeRegion | undefined {
  const platform = detectEdgePlatform();

  switch (platform) {
    case 'cloudflare': {
      // Cloudflare provides CF object with request
      const cf = (request as any).cf;
      if (cf) {
        return {
          code: cf.colo || 'unknown',
          name: cf.city || cf.colo || 'unknown',
          continent: cf.continent,
          country: cf.country,
          city: cf.city,
          latitude: cf.latitude ? parseFloat(cf.latitude) : undefined,
          longitude: cf.longitude ? parseFloat(cf.longitude) : undefined,
        };
      }
      break;
    }

    case 'deno': {
      // Deno Deploy provides region in Deno.env
      const region = (globalThis as any).Deno?.env?.get('DENO_REGION');
      if (region) {
        return {
          code: region,
          name: region,
        };
      }
      break;
    }

    case 'vercel': {
      // Vercel provides region headers
      const region = request.headers.get('x-vercel-id')?.split('::')[0];
      if (region) {
        return {
          code: region,
          name: region,
        };
      }
      break;
    }

    case 'netlify': {
      // Netlify provides geo context
      const geo = (platformContext as any)?.geo;
      if (geo) {
        return {
          code: geo.country?.code || 'unknown',
          name: geo.city || geo.country?.name || 'unknown',
          country: geo.country?.code,
          city: geo.city,
          latitude: geo.latitude,
          longitude: geo.longitude,
        };
      }
      break;
    }
  }

  return undefined;
}

// ============================================================================
// Request Coalescing
// ============================================================================

interface PendingRequest {
  promise: Promise<Response>;
  timestamp: number;
}

const pendingRequests = new Map<string, PendingRequest>();
const COALESCE_WINDOW_MS = 50; // 50ms window for coalescing

/**
 * Create a cache key for request coalescing
 */
function createCoalesceKey(request: Request): string {
  const url = new URL(request.url);
  // Only coalesce GET requests with same URL
  if (request.method !== 'GET') {
    return `${request.method}:${url.href}:${Date.now()}:${Math.random()}`;
  }
  return `GET:${url.href}`;
}

/**
 * Coalesce identical requests within a time window
 */
export function coalesceRequest(
  request: Request,
  handler: () => Promise<Response>
): Promise<Response> {
  // Only coalesce GET requests
  if (request.method !== 'GET') {
    return handler();
  }

  const key = createCoalesceKey(request);
  const now = Date.now();

  // Check for pending request
  const pending = pendingRequests.get(key);
  if (pending && (now - pending.timestamp) < COALESCE_WINDOW_MS) {
    return pending.promise;
  }

  // Create new request
  const promise = handler().finally(() => {
    // Clean up after response
    setTimeout(() => pendingRequests.delete(key), COALESCE_WINDOW_MS);
  });

  pendingRequests.set(key, { promise, timestamp: now });
  return promise;
}

// ============================================================================
// Edge Runtime Handler
// ============================================================================

export interface EdgeHandlerOptions {
  /** Enable request coalescing */
  coalescing?: boolean;
  /** Handler function */
  handler: (context: EdgeContext) => Promise<Response>;
  /** Error handler */
  onError?: (error: Error, context: EdgeContext) => Response | Promise<Response>;
  /** Before request hook */
  beforeRequest?: (context: EdgeContext) => void | Promise<void>;
  /** After response hook */
  afterResponse?: (response: Response, context: EdgeContext) => void | Promise<void>;
}

/**
 * Create an edge-optimized request handler
 */
export function createEdgeHandler(options: EdgeHandlerOptions) {
  const { handler, onError, beforeRequest, afterResponse, coalescing = false } = options;

  return async (request: Request, platformEnv?: unknown, platformContext?: unknown): Promise<Response> => {
    const requestStart = Date.now();
    const wasColdStart = isColdStart();

    // Build context
    const context: EdgeContext = {
      platform: detectEdgePlatform(),
      request,
      env: createEdgeEnv(platformEnv),
      executionContext: createExecutionContext(platformContext),
      region: getRegion(request, platformContext),
      timing: {
        requestStart,
        isColdStart: wasColdStart,
        coldStartDuration: getColdStartDuration(),
      },
    };

    // Mark as warm after first request
    if (wasColdStart) {
      markWarm();
    }

    try {
      // Before request hook
      if (beforeRequest) {
        await beforeRequest(context);
      }

      // Handle request with optional coalescing
      let response: Response;
      if (coalescing) {
        response = await coalesceRequest(request, () => handler(context));
      } else {
        response = await handler(context);
      }

      // After response hook (non-blocking)
      if (afterResponse) {
        context.executionContext.waitUntil(
          Promise.resolve(afterResponse(response, context))
        );
      }

      return response;
    } catch (error) {
      console.error('Edge handler error:', error);

      if (onError) {
        return onError(error as Error, context);
      }

      return new Response('Internal Server Error', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
  };
}

// ============================================================================
// Zero Cold Start Optimizations
// ============================================================================

/** Modules to preload for faster cold starts */
const preloadedModules = new Map<string, unknown>();

/**
 * Preload a module to reduce cold start time
 */
export function preloadModule<T>(name: string, loader: () => Promise<T>): Promise<T> {
  const existing = preloadedModules.get(name);
  if (existing) {
    return Promise.resolve(existing as T);
  }

  const promise = loader().then((module) => {
    preloadedModules.set(name, module);
    return module;
  });

  preloadedModules.set(name, promise);
  return promise;
}

/**
 * Get a preloaded module
 */
export function getPreloadedModule<T>(name: string): T | undefined {
  return preloadedModules.get(name) as T | undefined;
}

/**
 * Initialize critical resources for faster subsequent requests
 */
export interface ColdStartConfig {
  /** Modules to preload */
  modules?: Array<{ name: string; loader: () => Promise<unknown> }>;
  /** Connections to warm up */
  warmConnections?: Array<() => Promise<void>>;
  /** Custom initialization */
  onInit?: () => Promise<void>;
}

let coldStartInitialized = false;

/**
 * Run cold start optimizations
 */
export async function initializeColdStart(config: ColdStartConfig): Promise<void> {
  if (coldStartInitialized) {
    return;
  }

  coldStartInitialized = true;
  const startTime = Date.now();

  try {
    // Preload modules in parallel
    const modulePromises = (config.modules || []).map(({ name, loader }) =>
      preloadModule(name, loader)
    );

    // Warm up connections in parallel
    const connectionPromises = (config.warmConnections || []).map((warmup) =>
      warmup().catch((err) => console.warn('Connection warmup failed:', err))
    );

    // Run custom initialization
    const initPromise = config.onInit?.() || Promise.resolve();

    // Wait for all initialization
    await Promise.all([
      Promise.all(modulePromises),
      Promise.all(connectionPromises),
      initPromise,
    ]);

    const duration = Date.now() - startTime;
    console.log(`Cold start initialization completed in ${duration}ms`);
  } catch (error) {
    console.error('Cold start initialization failed:', error);
  }
}

// ============================================================================
// Exports
// ============================================================================

export default {
  detectEdgePlatform,
  getPlatformInfo,
  createEdgeEnv,
  createExecutionContext,
  getRegion,
  createEdgeHandler,
  coalesceRequest,
  isColdStart,
  markWarm,
  getColdStartDuration,
  resetColdStartTracking,
  preloadModule,
  getPreloadedModule,
  initializeColdStart,
};
