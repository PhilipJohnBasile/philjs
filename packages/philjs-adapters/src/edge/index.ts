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

// Edge Runtime
export {
  // Types
  type EdgePlatform,
  type EdgeContext,
  type EdgeEnv,
  type EdgeExecutionContext,
  type EdgeRegion,
  type EdgeTiming,
  type EdgeKVNamespace,
  type EdgeKVPutOptions,
  type EdgeKVListOptions,
  type EdgeKVListResult,
  type EdgeRuntimeConfig,
  type EdgeHandlerOptions,
  type ColdStartConfig,

  // Platform detection
  detectEdgePlatform,
  getPlatformInfo,

  // Environment
  createEdgeEnv,
  createExecutionContext,
  getRegion,

  // Handler
  createEdgeHandler,
  coalesceRequest,

  // Cold start
  isColdStart,
  markWarm,
  getColdStartDuration,
  resetColdStartTracking,
  preloadModule,
  getPreloadedModule,
  initializeColdStart,
} from './edge-runtime';

// Streaming
export {
  // Types
  type StreamingConfig,
  type SSEMessage,
  type ESIFragment,
  type HTMLStreamOptions,
  type StreamingWriter,

  // Stream creation
  createWritableStream,
  createStreamingResponse,

  // SSE
  createSSEStream,
  createSSEHandler,

  // HTML streaming
  createHTMLStream,

  // ESI
  parseESITags,
  processESI,
  createESIMiddleware,

  // Utilities
  streamThrough,
  mergeStreams,
  createStreamTee,
} from './streaming';

// Caching
export {
  // Types
  type CacheEntry,
  type CacheOptions,
  type EdgeCacheConfig,
  type CacheStats,
  type EdgeKVStore,
  type ResponseCacheOptions,
  type AssetCacheOptions,

  // Cache class
  EdgeCache,

  // Response caching
  createCacheKey,
  shouldCacheResponse,
  createCachedResponse,
  createCacheMiddleware,

  // Asset caching
  createAssetCache,

  // Default cache
  getDefaultCache,
  resetDefaultCache,
} from './cache';

// Geolocation
export {
  // Types
  type GeoLocation,
  type GeoRoutingRule,
  type GeoRoutingConfig,
  type RegionConfig,
  type LatencyRoutingConfig,
  type GeoABTestConfig,

  // Geo extraction
  getGeoLocation,
  getClientIP,

  // Geo routing
  applyGeoRouting,
  createGeoRoutingMiddleware,

  // Region routing
  findBestRegion,
  createLatencyRouter,

  // A/B testing
  selectGeoVariant,
  createVariantCookie,

  // Distance
  calculateDistance,
  findNearestLocation,

  // Utilities
  addGeoHeaders,
} from './geo';

// Re-export default objects for convenience
export { default as edgeRuntime } from './edge-runtime';
export { default as streaming } from './streaming';
export { default as cache } from './cache';
export { default as geo } from './geo';
