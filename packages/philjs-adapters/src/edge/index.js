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
// Platform detection
detectEdgePlatform, getPlatformInfo, 
// Environment
createEdgeEnv, createExecutionContext, getRegion, 
// Handler
createEdgeHandler, coalesceRequest, 
// Cold start
isColdStart, markWarm, getColdStartDuration, resetColdStartTracking, preloadModule, getPreloadedModule, initializeColdStart, } from './edge-runtime.js';
// Streaming
export { 
// Stream creation
createWritableStream, createStreamingResponse, 
// SSE
createSSEStream, createSSEHandler, 
// HTML streaming
createHTMLStream, 
// ESI
parseESITags, processESI, createESIMiddleware, 
// Utilities
streamThrough, mergeStreams, createStreamTee, } from './streaming.js';
// Caching
export { 
// Cache class
EdgeCache, 
// Response caching
createCacheKey, shouldCacheResponse, createCachedResponse, createCacheMiddleware, 
// Asset caching
createAssetCache, 
// Default cache
getDefaultCache, resetDefaultCache, } from './cache.js';
// Geolocation
export { 
// Geo extraction
getGeoLocation, getClientIP, 
// Geo routing
applyGeoRouting, createGeoRoutingMiddleware, 
// Region routing
findBestRegion, createLatencyRouter, 
// A/B testing
selectGeoVariant, createVariantCookie, 
// Distance
calculateDistance, findNearestLocation, 
// Utilities
addGeoHeaders, } from './geo.js';
// Re-export default objects for convenience
export { default as edgeRuntime } from './edge-runtime.js';
export { default as streaming } from './streaming.js';
export { default as cache } from './cache.js';
export { default as geo } from './geo.js';
//# sourceMappingURL=index.js.map