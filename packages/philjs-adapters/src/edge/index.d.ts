/**
 * PhilJS Edge Runtime Optimizations
 *
 * Comprehensive edge runtime utilities for deploying PhilJS applications
 * across multiple edge platforms with optimized performance.
 *
 * Target platforms:
 * - Cloudflare Workers
 * - Deno Deploy
 * - Vercel Edge
 * - Netlify Edge
 *
 * Features:
 * - Zero cold-start optimizations
 * - Request coalescing
 * - Edge-side includes (ESI)
 * - Automatic asset optimization
 * - Region-aware routing
 * - Edge KV store abstraction
 */
export { type EdgePlatform, type EdgeContext, type EdgeEnv, type EdgeExecutionContext, type EdgeRegion, type EdgeTiming, type EdgeKVNamespace, type EdgeKVPutOptions, type EdgeKVListOptions, type EdgeKVListResult, type EdgeRuntimeConfig, type EdgeHandlerOptions, type ColdStartConfig, detectEdgePlatform, getPlatformInfo, createEdgeEnv, createExecutionContext, getRegion, createEdgeHandler, coalesceRequest, isColdStart, markWarm, getColdStartDuration, resetColdStartTracking, preloadModule, getPreloadedModule, initializeColdStart, } from './edge-runtime.js';
export { type StreamingConfig, type SSEMessage, type ESIFragment, type HTMLStreamOptions, type StreamingWriter, createWritableStream, createStreamingResponse, createSSEStream, createSSEHandler, createHTMLStream, parseESITags, processESI, createESIMiddleware, streamThrough, mergeStreams, createStreamTee, } from './streaming.js';
export { type CacheEntry, type CacheOptions, type EdgeCacheConfig, type CacheStats, type EdgeKVStore, type ResponseCacheOptions, type AssetCacheOptions, EdgeCache, createCacheKey, shouldCacheResponse, createCachedResponse, createCacheMiddleware, createAssetCache, getDefaultCache, resetDefaultCache, } from './cache.js';
export { type GeoLocation, type GeoRoutingRule, type GeoRoutingConfig, type RegionConfig, type LatencyRoutingConfig, type GeoABTestConfig, getGeoLocation, getClientIP, applyGeoRouting, createGeoRoutingMiddleware, findBestRegion, createLatencyRouter, selectGeoVariant, createVariantCookie, calculateDistance, findNearestLocation, addGeoHeaders, } from './geo.js';
export { default as edgeRuntime } from './edge-runtime.js';
export { default as streaming } from './streaming.js';
export { default as cache } from './cache.js';
export { default as geo } from './geo.js';
//# sourceMappingURL=index.d.ts.map