export * from "./types.js";
export * from "./loader.js";
export * from "./stream.js";
export * from "./resume.js";
export * from "./security.js";
export * from "./hints.js";
export { handleRequest } from "./request-handler.js";
export type { RouteModule, RequestContext, RenderOptions } from "./request-handler.js";
// Basic SSR render function
// Safe HTML escaping
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Basic SSR render function with escaping and attribute handling
export function renderToString(vnode: any): string {
  if (vnode === null || vnode === undefined || typeof vnode === 'boolean') return '';
  if (typeof vnode === 'string' || typeof vnode === 'number') return escapeHtml(String(vnode));
  if (Array.isArray(vnode)) return vnode.map(renderToString).join('');

  const type = vnode.type;
  const props = vnode.props || {};
  const children = props.children;

  // Handle Components (Functions)
  if (typeof type === 'function') {
    return renderToString(type(props));
  }

  // Handle HTML Tags
  let out = \`<\${type}\`;

  for (const [key, value] of Object.entries(props)) {
      if (key === 'children' || key === 'shadowRootMode') continue;
      if (key === 'style' && typeof value === 'object') {
          const styleStr = Object.entries(value as object)
              .map(([k, v]) => \`\${k.replace(/[A-Z]/g, '-$&').toLowerCase()}:\${v}\`)
              .join(';');
          out += \` style="\${escapeHtml(styleStr)}"\`;
      } else if (value === true) {
          out += \` \${key}\`; // Boolean attribute
      } else if (value !== false && value !== null && value !== undefined) {
          out += \` \${key}="\${escapeHtml(String(value))}"\`;
      }
  }

  if (props.shadowRootMode) {
    out += \`><template shadowrootmode="\${props.shadowRootMode}">\`;
    out += renderToString(children);
    out += \`</template></\${type}>\`;
    return out;
  }

  // Self-closing tags
  const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
  if (voidTags.has(type)) {
      return out + ' />';
  }

  out += \`>\${renderToString(children)}</\${type}>\`;
  return out;
}
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

// ============================================================================
// Partial Prerendering (PPR)
// ============================================================================

// PPR Core
export {
  createPPRContext,
  renderToStaticShell,
  renderDynamicContent,
  renderAllDynamicContent,
  injectDynamicContent,
  generatePPRResponse,
} from "./ppr.js";

// Dynamic Boundary Component
export {
  dynamic,
  isDynamic,
  createDynamic,
  dynamicPriority,
  dynamicDeferred,
  dynamicWithDependencies,
  dynamicIf,
  makeDynamic,
  getDynamicBoundaryId,
  serverOnly,
  dynamicWithRevalidation,
  dynamicForUser,
  registerDynamicBoundary,
  DYNAMIC_SYMBOL,
} from "./dynamic.js";

// PPR Streaming
export {
  PPRStreamController,
  createPPRStream,
  streamPPRResponse,
} from "./ppr-streaming.js";

// PPR Build
export {
  PPRBuilder,
  MemoryPPRCache,
  FileSystemPPRCache,
  buildPPR,
  buildPPRRoute,
  loadPPRManifest,
  loadStaticShell,
  pprVitePlugin,
  createPPRDevServer,
  PPR_VERSION,
} from "./ppr-build.js";

// PPR Caching
export {
  LRUPPRCache,
  RedisPPRCache,
  EdgeCacheController,
  CacheTagManager,
  generateCacheHeaders,
  parseConditionalRequest,
  shouldReturn304,
  create304Response,
} from "./ppr-cache.js";

// PPR Types
export type {
  PPRConfig,
  EdgeCachingStrategy,
  DynamicBoundary,
  StaticShell,
  DynamicBoundaryMetadata,
  ShellAssets,
  PPRContext,
  RequestTimeData,
  PPRCache,
  CacheStats,
  PPRStreamOptions,
  BoundaryResolution,
  PPRBuildConfig,
  PPRRouteEntry,
  PPRBuildResult,
  PPRBuildError,
  PPRManifest,
  DynamicProps,
  PPRSuspenseProps,
} from "./ppr-types.js";

export {
  PPR_PLACEHOLDER_START,
  PPR_PLACEHOLDER_END,
  PPR_FALLBACK_START,
  PPR_FALLBACK_END,
  extractBoundaryId,
  hashContent,
} from "./ppr-types.js";

// ============================================================================
// Resumability (Qwik-style State Serialization)
// ============================================================================

export {
  // QRL (Qwik Resource Locator) - Lazy-loadable References
  qrl,
  qrlChunk,
  isQRL,
  resolveQRL,
  qrlRegistry,

  // $ Prefix Functions - Mark Functions as Lazy-loadable
  $,
  $$,
  $closure,

  // State Serialization
  resumable,
  useResumable,
  resumableComputed,
  serializeState,
  deserializeState,
  resumeFromState,
  clearSerializedState,

  // Event Listener Serialization
  on,
  serializeListeners,
  resumeListeners,

  // Component Boundaries
  boundary,
  serializeBoundaries,
  getBoundary,

  // Resumable App Wrapper
  createResumableApp,

  // Full Resumability Context
  createResumableContext,
  serializeContext,
  resumeContext,

  // SSR Integration
  injectResumableState,
  extractResumableState,

  // Closure Serialization
  serializeClosure,
  deserializeClosureVars,

  // Development Tools
  getResumabilityStats,
  logResumabilityInfo,

  // Utilities
  isResuming,
  hasResumed,
  hasResumableState,
  enableResumability,
  onResume,
} from "./resumability.js";

export type {
  // QRL Types
  QRL,

  // State Types
  ResumableState,
  ResumableListener,
  ResumableContext,
  ComponentBoundary,
  ResumabilityOptions,

  // App Types
  ResumableAppOptions,
  ResumableApp,
} from "./resumability.js";

// ============================================================================
// SuperJSON Integration
// ============================================================================

export {
  serializeLoaderData,
  deserializeLoaderData,
  wrapLoaderWithSuperJSON,
  wrapActionWithSuperJSON,
  generateHydrationScript,
  generateHydrationRestoreScript,
  extractHydrationData,
  injectLoaderData,
  createLoaderDataSerializer,
  createStreamingLoaderSerializer,
  createLoaderDataAccessor,
  superJSONLoader,
  superJSONAction,
  hasSuperJSONLoader,
  getSuperJSONLoaderOptions,
  SUPERJSON_LOADER,
} from "./superjson.js";

export type {
  SSRSuperJSONOptions,
} from "./superjson.js";
