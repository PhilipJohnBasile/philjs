/**
 * PhilJS Meta - Next.js/SvelteKit-style Meta-Framework
 *
 * A full-featured meta-framework for PhilJS with:
 * - File-based routing
 * - Nested layouts
 * - Data loading (loaders/actions)
 * - SSR/SSG support
 * - API routes
 * - Middleware
 * - Caching strategies
 */

// ==========================================
// Router
// ==========================================
export {
  createFileRouter,
  generateRouteManifest,
  matchRoute,
  matchApiRoute,
  type FileRouter,
  type FileRouterOptions,
  type RouteDefinition,
  type RouteManifest,
  type RouteMetadata,
  type RouteSegment,
  type RouteSegmentType,
} from './router/file-based';

export {
  createLayoutTree,
  getLayoutsForRoute,
  getParallelSlots,
  parseInterceptedRoute,
  createErrorBoundary,
  createLoadingWrapper,
  LayoutContextManager,
  LayoutUtils,
  type LayoutProps,
  type ErrorBoundaryProps,
  type LoadingProps,
  type LayoutDefinition,
  type LayoutTreeNode,
  type LayoutContext,
  type LayoutComposition,
  type ErrorBoundaryConfig,
  type LoadingConfig,
  type ParallelRouteSlot,
  type InterceptedRoute,
} from './router/layouts';

// ==========================================
// Data Loading
// ==========================================
export {
  defineLoader,
  defineAction,
  executeLoader,
  executeAction,
  useLoaderData,
  useActionData,
  useIsSubmitting,
  useParams,
  useSearchParams,
  setRouteContext,
  getRouteKey,
  createFormAction,
  createServerContext,
  json,
  redirect,
  defer,
  hydration,
  RedirectResponse,
  NotFoundResponse,
  DeferredData,
  type LoaderContext,
  type ActionContext,
  type LoaderFunction,
  type ActionFunction,
  type ActionResponse,
  type ActionErrors,
  type ServerContext,
  type CookieStore,
  type CookieOptions,
  type FormActionHandler,
} from './data/loaders';

// ==========================================
// Caching
// ==========================================
export {
  cached,
  useSWR,
  revalidatePath,
  revalidateTag,
  cacheControl,
  unstable_cache,
  cache,
  ISRManager,
  type CacheEntry,
  type CacheOptions,
  type CacheStats,
  type CacheControlOptions,
  type RevalidateOptions,
  type SWRConfig,
  type SWRState,
  type ISRConfig,
} from './data/cache';

// ==========================================
// Server & Middleware
// ==========================================
export {
  createMiddlewareContext,
  MiddlewareChain,
  NextResponse,
  cors,
  auth,
  rateLimit,
  securityHeaders,
  logger,
  compression,
  bodyParser,
  type MiddlewareContext,
  type MiddlewareFunction,
  type MiddlewareResult,
  type GeoInfo,
  type RequestTiming,
  type CORSOptions,
  type AuthOptions,
  type RateLimitOptions,
  type RateLimitStore,
  type RateLimitInfo,
  type SecurityHeadersOptions,
  type LoggerOptions,
  type CompressionOptions,
  type BodyParserOptions,
} from './server/middleware';

// ==========================================
// API Routes
// ==========================================
export {
  createAPIRoute,
  defineAPIHandler,
  parseBody,
  APIResponse,
  SSE,
  z,
  type HttpMethod,
  type APIContext,
  type APIHandler,
  type APIRouteHandler,
  type RouteHandlerConfig,
  type Schema,
  type SchemaError,
  type SchemaIssue,
  type SSEStream,
  type SSEEvent,
  type ExtractParams,
} from './server/api-routes';

// ==========================================
// Build System
// ==========================================
export {
  Compiler,
  createCompiler,
  createCompilerFromConfig,
  analyzerPlugin,
  staticExportPlugin,
  type BuildOptions,
  type BuildPlugin,
  type BuildContext,
  type BuildResult,
  type BuildError,
  type BundleInfo,
  type RouteBundle,
  type StaticPageInfo,
  type StaticExportOptions,
} from './build/compiler';

// ==========================================
// Configuration
// ==========================================
export {
  loadConfig,
  defineConfig,
  validateConfig,
  getEnvConfig,
  defaultConfig,
  type PhilJSConfig,
  type BuildConfig,
  type ServerConfig,
  type SSRConfig,
  type SSGConfig,
  type ImagesConfig,
  type I18nConfig,
  type HeadersConfig,
  type RedirectConfig,
  type RewriteConfig,
  type ExperimentalConfig,
  type BundlerConfig,
  type LoadConfigOptions,
} from './config';

// ==========================================
// CLI (for programmatic access)
// ==========================================
export {
  dev,
  build,
  start,
  generate,
  run,
  type CLIOptions,
  type DevServerOptions,
  type BuildCLIOptions,
  type StartServerOptions,
  type GenerateOptions,
} from './cli';

// ==========================================
// SEO (Legacy exports - moved to seo submodule)
// ==========================================
export { HeadProvider, Head, Meta, Link, Title, useHead } from './Head';

export {
  SEO,
  BasicMeta,
  OpenGraph,
  TwitterCard,
  JSONLD,
  Favicons,
  AlternateLanguages,
  Preconnect,
  DNSPrefetch,
} from './seo';

export {
  generateSitemap,
  generateSitemapIndex,
  generateRobotsTxt,
  createSitemapEntry,
  splitSitemap,
  generateSitemapFromRoutes,
} from './sitemap';

export type {
  MetaTag,
  LinkTag,
  MetaConfig,
  OpenGraphConfig,
  OpenGraphImage,
  TwitterConfig,
  JSONLDConfig,
  SitemapEntry,
  RobotsConfig,
} from './types';
