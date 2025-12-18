export * from "./types.js";
export * from "./loader.js";
export * from "./stream.js";
export * from "./resume.js";
export * from "./security.js";
export * from "./hints.js";
export { handleRequest } from "./request-handler.js";
export type { RouteModule, RequestContext, RenderOptions } from "./request-handler.js";
export { renderToStreamingResponse, Suspense } from "./streaming.js";
export type { StreamContext } from "./streaming.js";
export { csrfProtection, generateCSRFToken, csrfField, extractCSRFToken } from "./csrf.js";

// Advanced Streaming SSR with Selective Hydration
export {
  renderToStream,
  Suspense as SuspenseBoundary,
  Island,
} from "./render-to-stream.js";
export type {
  StreamContext as AdvancedStreamContext,
  RenderToStreamOptions,
} from "./render-to-stream.js";

// Selective Island Hydration
export {
  registerIsland,
  hydrateIsland,
  hydrateAllIslands,
  hydrateIslandOnVisible,
  hydrateIslandOnInteraction,
  hydrateIslandOnIdle,
  autoHydrateIslands,
  HydrationStrategy,
  getIslandStatus,
  clearIslands,
  preloadIsland,
} from "./hydrate-island.js";

// Stream Adapters
export {
  webStreamToNodeStream,
  nodeStreamToWebStream,
  pipeWebStreamToNode,
  createThroughputMeasurer,
  createCompressionStream,
  createMultiplexStream,
  createBufferedStream,
  createTimingStream,
  createRateLimitedStream,
  createFilterStream,
  teeStream,
  mergeStreams,
} from "./stream-adapters.js";
export type { TimedChunk } from "./stream-adapters.js";

// Static Generation (SSG/ISR)
export {
  StaticGenerator,
  RedisISRCache,
  buildStaticSite,
  configureRoute,
  ssg,
  isr,
  ssr,
  csr,
  handleRevalidation,
  createRenderingMiddleware,
} from "./static-generation.js";
export type {
  RenderMode,
  RouteConfig,
  StaticPage,
  ISRCache,
  BuildConfig,
  RevalidationOptions,
} from "./static-generation.js";

// Rate Limiting
export {
  RateLimiter,
  MemoryRateLimitStore,
  RedisRateLimitStore,
  SlidingWindowRateLimiter,
  AdaptiveRateLimiter,
  rateLimit,
  apiRateLimit,
  authRateLimit,
  apiKeyRateLimit,
  userRateLimit,
} from "./rate-limit.js";
export type {
  RateLimitConfig,
  RateLimitInfo,
  RateLimitStore,
  AdaptiveConfig,
} from "./rate-limit.js";

export {
  createFetchHandler,
  createNodeHttpHandler,
  createExpressMiddleware,
  createViteMiddleware,
  createWorkerHandler,
} from "./adapters.js";
export type { PhilJSServerOptions } from "./adapters.js";
