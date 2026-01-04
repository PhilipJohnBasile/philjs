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
// Cold Start Tracking
// ============================================================================
// Track cold start state
let isFirstRequest = true;
let coldStartTimestamp = Date.now();
/**
 * Reset cold start tracking (useful for testing)
 */
export function resetColdStartTracking() {
    isFirstRequest = true;
    coldStartTimestamp = Date.now();
}
/**
 * Check if current request is a cold start
 */
export function isColdStart() {
    return isFirstRequest;
}
/**
 * Mark that the first request has been processed
 */
export function markWarm() {
    isFirstRequest = false;
}
/**
 * Get cold start duration if this is a cold start
 */
export function getColdStartDuration() {
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
export function detectEdgePlatform() {
    // Netlify Edge (uses Deno under the hood but has specific markers)
    // Check this FIRST before Deno since Netlify runs on Deno
    if (typeof globalThis.Netlify !== 'undefined') {
        return 'netlify';
    }
    // Cloudflare Workers
    if (typeof globalThis.caches !== 'undefined' &&
        typeof globalThis.navigator === 'undefined' &&
        typeof globalThis.process === 'undefined') {
        return 'cloudflare';
    }
    // Deno Deploy
    if (typeof globalThis.Deno !== 'undefined') {
        return 'deno';
    }
    // Vercel Edge Runtime
    if (typeof globalThis.EdgeRuntime !== 'undefined') {
        return 'vercel';
    }
    return 'unknown';
}
/**
 * Get platform-specific information
 */
export function getPlatformInfo() {
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
                version: globalThis.Deno?.version?.deno || 'unknown',
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
export function createEdgeEnv(platformEnv) {
    const platform = detectEdgePlatform();
    return {
        get(key) {
            switch (platform) {
                case 'cloudflare':
                    return platformEnv?.[key];
                case 'deno':
                    return globalThis.Deno?.env?.get(key);
                case 'vercel':
                case 'netlify':
                    // Check process.env or Deno.env
                    if (typeof process !== 'undefined') {
                        return process.env[key];
                    }
                    if (typeof globalThis.Deno !== 'undefined') {
                        return globalThis.Deno.env.get(key);
                    }
                    return undefined;
                default:
                    if (typeof process !== 'undefined') {
                        return process.env[key];
                    }
                    return undefined;
            }
        },
        getAll() {
            switch (platform) {
                case 'cloudflare':
                    // Cloudflare env object contains bindings, filter to string values
                    const cfEnv = {};
                    if (platformEnv && typeof platformEnv === 'object') {
                        for (const [key, value] of Object.entries(platformEnv)) {
                            if (typeof value === 'string') {
                                cfEnv[key] = value;
                            }
                        }
                    }
                    return cfEnv;
                case 'deno':
                    return Object.fromEntries(globalThis.Deno?.env?.toObject() || {});
                case 'vercel':
                case 'netlify':
                    if (typeof process !== 'undefined') {
                        return { ...process.env };
                    }
                    if (typeof globalThis.Deno !== 'undefined') {
                        return Object.fromEntries(globalThis.Deno.env.toObject());
                    }
                    return {};
                default:
                    if (typeof process !== 'undefined') {
                        return { ...process.env };
                    }
                    return {};
            }
        },
        getKV(namespace) {
            switch (platform) {
                case 'cloudflare':
                    return platformEnv?.[namespace];
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
export function createExecutionContext(platformContext) {
    const platform = detectEdgePlatform();
    return {
        waitUntil(promise) {
            switch (platform) {
                case 'cloudflare':
                    platformContext?.waitUntil?.(promise);
                    break;
                case 'deno':
                    // Deno Deploy uses a different pattern
                    // The promise runs in background automatically
                    promise.catch(console.error);
                    break;
                case 'vercel':
                    platformContext?.waitUntil?.(promise);
                    break;
                case 'netlify':
                    platformContext?.waitUntil?.(promise);
                    break;
                default:
                    // Fire and forget
                    promise.catch(console.error);
            }
        },
        passThroughOnException() {
            if (platform === 'cloudflare') {
                platformContext?.passThroughOnException?.();
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
export function getRegion(request, platformContext) {
    const platform = detectEdgePlatform();
    switch (platform) {
        case 'cloudflare': {
            // Cloudflare provides CF object with request
            const cf = request.cf;
            if (cf) {
                const region = {
                    code: cf.colo || 'unknown',
                    name: cf.city || cf.colo || 'unknown',
                };
                if (cf.continent !== undefined)
                    region.continent = cf.continent;
                if (cf.country !== undefined)
                    region.country = cf.country;
                if (cf.city !== undefined)
                    region.city = cf.city;
                if (cf.latitude !== undefined)
                    region.latitude = parseFloat(cf.latitude);
                if (cf.longitude !== undefined)
                    region.longitude = parseFloat(cf.longitude);
                return region;
            }
            break;
        }
        case 'deno': {
            // Deno Deploy provides region in Deno.env
            const region = globalThis.Deno?.env?.get('DENO_REGION');
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
            const geo = platformContext?.geo;
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
const pendingRequests = new Map();
const COALESCE_WINDOW_MS = 50; // 50ms window for coalescing
/**
 * Create a cache key for request coalescing
 */
function createCoalesceKey(request) {
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
export function coalesceRequest(request, handler) {
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
/**
 * Create an edge-optimized request handler
 */
export function createEdgeHandler(options) {
    const { handler, onError, beforeRequest, afterResponse, coalescing = false } = options;
    return async (request, platformEnv, platformContext) => {
        const requestStart = Date.now();
        const wasColdStart = isColdStart();
        // Build timing info
        const timing = {
            requestStart,
            isColdStart: wasColdStart,
        };
        const coldStartDur = getColdStartDuration();
        if (coldStartDur !== undefined) {
            timing.coldStartDuration = coldStartDur;
        }
        // Build context
        const context = {
            platform: detectEdgePlatform(),
            request,
            env: createEdgeEnv(platformEnv),
            executionContext: createExecutionContext(platformContext),
            timing,
        };
        // Only add region if available
        const region = getRegion(request, platformContext);
        if (region !== undefined) {
            context.region = region;
        }
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
            let response;
            if (coalescing) {
                response = await coalesceRequest(request, () => handler(context));
            }
            else {
                response = await handler(context);
            }
            // After response hook (non-blocking)
            if (afterResponse) {
                context.executionContext.waitUntil(Promise.resolve(afterResponse(response, context)));
            }
            return response;
        }
        catch (error) {
            console.error('Edge handler error:', error);
            if (onError) {
                return onError(error, context);
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
const preloadedModules = new Map();
/**
 * Preload a module to reduce cold start time
 */
export function preloadModule(name, loader) {
    const existing = preloadedModules.get(name);
    if (existing) {
        return Promise.resolve(existing);
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
export function getPreloadedModule(name) {
    return preloadedModules.get(name);
}
let coldStartInitialized = false;
/**
 * Run cold start optimizations
 */
export async function initializeColdStart(config) {
    if (coldStartInitialized) {
        return;
    }
    coldStartInitialized = true;
    const startTime = Date.now();
    try {
        // Preload modules in parallel
        const modulePromises = (config.modules || []).map(({ name, loader }) => preloadModule(name, loader));
        // Warm up connections in parallel
        const connectionPromises = (config.warmConnections || []).map((warmup) => warmup().catch((err) => console.warn('Connection warmup failed:', err)));
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
    }
    catch (error) {
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
//# sourceMappingURL=edge-runtime.js.map