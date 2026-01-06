/**
 * PhilJS ISR Type Definitions
 *
 * Core types for Incremental Static Regeneration functionality.
 */

// =============================================================================
// Fallback Types
// =============================================================================

/**
 * Fallback behavior for pages not yet generated
 * - 'blocking': Wait for generation before responding
 * - true: Return loading state while generating in background
 * - false: Return 404 for non-pre-rendered paths
 */
export type FallbackMode = 'blocking' | true | false;

// =============================================================================
// Static Paths Types
// =============================================================================

/**
 * Path parameter object for dynamic routes
 */
export interface PathParams {
  params: Record<string, string | string[]>;
  locale?: string;
}

/**
 * Result from getStaticPaths function
 */
export interface StaticPathsResult {
  /** Array of paths to pre-render at build time */
  paths: Array<string | PathParams>;
  /** Fallback behavior for non-pre-rendered paths */
  fallback: FallbackMode;
}

/**
 * Function signature for getStaticPaths
 */
export type GetStaticPaths = () => Promise<StaticPathsResult> | StaticPathsResult;

// =============================================================================
// Static Props Types
// =============================================================================

/**
 * Context passed to getStaticProps function
 */
export interface StaticPropsContext {
  /** Route parameters extracted from the path */
  params: Record<string, string | string[]>;
  /** Whether preview mode is enabled */
  preview?: boolean;
  /** Preview mode data */
  previewData?: unknown;
  /** Current locale */
  locale?: string;
  /** Default locale */
  defaultLocale?: string;
  /** All available locales */
  locales?: string[];
}

/**
 * Result from getStaticProps function
 */
export interface StaticPropsResult<T = Record<string, unknown>> {
  /** Props to pass to the page component */
  props: T;
  /**
   * Revalidation interval in seconds
   * - number: Regenerate after this many seconds
   * - false: Never revalidate (static forever)
   */
  revalidate?: number | false;
  /** Cache tags for on-demand invalidation */
  tags?: string[];
  /** Redirect to another path instead of rendering */
  redirect?: {
    destination: string;
    permanent?: boolean;
  };
  /** Return 404 instead of rendering */
  notFound?: boolean;
}

/**
 * Function signature for getStaticProps
 */
export type GetStaticProps<T = Record<string, unknown>> = (
  context: StaticPropsContext
) => Promise<StaticPropsResult<T>> | StaticPropsResult<T>;

// =============================================================================
// Page Configuration Types
// =============================================================================

/**
 * ISR configuration exported from page modules
 */
export interface ISRPageConfig {
  /**
   * Revalidation interval in seconds
   * - number: Regenerate after this many seconds
   * - false: Never revalidate (static forever)
   */
  revalidate?: number | false;

  /** Cache tags for on-demand invalidation */
  tags?: string[];

  /**
   * Whether to block serving until regeneration completes
   * Default: false (serve stale while revalidating)
   */
  blocking?: boolean;

  /**
   * Custom cache key generator
   * Default: uses request path
   */
  cacheKey?: (request: Request) => string;

  /**
   * Fallback behavior for pages not yet generated
   */
  fallback?: FallbackMode;
}

/**
 * Page module with ISR exports
 */
export interface ISRPageModule {
  /** Default export (page component) */
  default: unknown;
  /** Static paths for dynamic routes */
  staticPaths?: GetStaticPaths;
  /** Static props for data fetching */
  staticProps?: GetStaticProps;
  /** Page-level ISR configuration */
  config?: ISRPageConfig;
}

// =============================================================================
// Build Types
// =============================================================================

/**
 * Pre-rendered page result
 */
export interface PrerenderedPage {
  /** Page path */
  path: string;
  /** Rendered HTML content */
  html: string;
  /** Page props (for hydration) */
  props?: Record<string, unknown>;
  /** Revalidation interval in seconds */
  revalidate: number | false;
  /** Cache tags */
  tags: string[];
  /** Generation timestamp */
  generatedAt: number;
}

/**
 * Build manifest entry
 */
export interface BuildManifestEntry {
  /** Page path */
  path: string;
  /** Source file path */
  sourcePath: string;
  /** Whether page has dynamic params */
  isDynamic: boolean;
  /** Fallback mode for dynamic pages */
  fallback?: FallbackMode;
  /** Revalidation interval */
  revalidate: number | false;
  /** Cache tags */
  tags: string[];
}

/**
 * Build manifest containing all pre-rendered pages
 */
export interface BuildManifest {
  /** Build timestamp */
  buildTime: number;
  /** Build ID for cache busting */
  buildId: string;
  /** All page entries */
  pages: BuildManifestEntry[];
  /** Dynamic route patterns */
  dynamicRoutes: Array<{
    pattern: string;
    regex: string;
    paramNames: string[];
  }>;
}

// =============================================================================
// Runtime Types
// =============================================================================

/**
 * Cache entry stored in the cache backend
 */
export interface CacheEntry {
  /** Rendered HTML content */
  html: string;
  /** Cache entry metadata */
  meta: CacheEntryMeta;
  /** Optional page props */
  props?: Record<string, unknown>;
  /** HTTP headers to serve */
  headers?: Record<string, string>;
}

/**
 * Cache entry metadata
 */
export interface CacheEntryMeta {
  /** Page path */
  path: string;
  /** Creation timestamp */
  createdAt: number;
  /** Last revalidation timestamp */
  revalidatedAt: number;
  /** Revalidation interval in seconds */
  revalidateInterval: number;
  /** Cache tags */
  tags: string[];
  /** ETag for conditional requests */
  etag?: string;
  /** Content hash for change detection */
  contentHash?: string;
  /** Current revalidation status */
  status: RevalidationStatus;
  /** Number of regenerations */
  regenerationCount: number;
  /** Last error message */
  lastError?: string;
}

/**
 * Revalidation status
 */
export type RevalidationStatus = 'fresh' | 'stale' | 'revalidating' | 'error';

// =============================================================================
// Handler Types
// =============================================================================

/**
 * ISR handler context
 */
export interface ISRHandlerContext {
  /** Request object */
  request: Request;
  /** Parsed URL path */
  path: string;
  /** URL search params */
  searchParams: URLSearchParams;
  /** Route parameters */
  params: Record<string, string>;
  /** Custom context data */
  data: Record<string, unknown>;
}

/**
 * ISR handler result
 */
export interface ISRHandlerResult {
  /** Response to return */
  response?: Response;
  /** Continue to next handler */
  next?: boolean;
  /** Cache status for debugging */
  cacheStatus?: 'HIT' | 'MISS' | 'STALE' | 'BYPASS';
}

/**
 * ISR handler function
 */
export type ISRHandler = (context: ISRHandlerContext) => Promise<ISRHandlerResult | Response>;

// =============================================================================
// Revalidation Types
// =============================================================================

/**
 * On-demand revalidation request
 */
export interface RevalidateRequest {
  /** Path to revalidate (mutually exclusive with tag) */
  path?: string;
  /** Tag to revalidate (mutually exclusive with path) */
  tag?: string;
  /** Secret for authentication */
  secret: string;
}

/**
 * Revalidation result
 */
export interface RevalidateResult {
  /** Whether revalidation was successful */
  revalidated: boolean;
  /** Affected paths */
  paths: string[];
  /** Error message if failed */
  error?: string;
  /** Duration in milliseconds */
  duration: number;
}

// =============================================================================
// Webhook Types
// =============================================================================

/**
 * Webhook payload from CMS
 */
export interface WebhookPayload {
  /** Webhook event type */
  event: string;
  /** Content type that changed */
  contentType?: string;
  /** Content ID that changed */
  contentId?: string;
  /** Tags to invalidate */
  tags?: string[];
  /** Paths to invalidate */
  paths?: string[];
  /** Custom data */
  data?: Record<string, unknown>;
}

/**
 * Webhook handler result
 */
export interface WebhookResult {
  /** Whether webhook was processed successfully */
  success: boolean;
  /** Paths that were revalidated */
  revalidated: string[];
  /** Error message if failed */
  error?: string;
}

/**
 * Webhook handler function
 */
export type WebhookHandler = (payload: WebhookPayload) => Promise<WebhookResult>;

// =============================================================================
// Adapter Types
// =============================================================================

/**
 * Platform adapter interface
 */
export interface PlatformAdapter {
  /** Adapter name */
  readonly name: string;

  /** Initialize the adapter */
  initialize(): Promise<void>;

  /** Create request handler */
  createHandler(options: AdapterHandlerOptions): unknown;

  /** Handle on-demand revalidation */
  revalidate(path: string): Promise<boolean>;

  /** Get cache entry */
  getCache(path: string): Promise<CacheEntry | null>;

  /** Set cache entry */
  setCache(path: string, entry: CacheEntry): Promise<void>;

  /** Delete cache entry */
  deleteCache(path: string): Promise<boolean>;
}

/**
 * Adapter handler options
 */
export interface AdapterHandlerOptions {
  /** Render function to generate HTML */
  render: (path: string, context: StaticPropsContext) => Promise<string>;
  /** Paths to include */
  include?: RegExp | ((path: string) => boolean);
  /** Paths to exclude */
  exclude?: RegExp | ((path: string) => boolean);
  /** Default revalidation interval */
  defaultRevalidate?: number;
}

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * Main ISR configuration
 */
export interface ISRConfig {
  /** Cache adapter to use */
  cache: CacheAdapterType | CacheAdapter;

  /** Default revalidation interval in seconds */
  defaultRevalidate?: number;

  /** Minimum revalidation interval in seconds */
  minRevalidate?: number;

  /** Maximum revalidation interval in seconds */
  maxRevalidate?: number;

  /** Secret for authenticating revalidation requests */
  revalidateSecret?: string;

  /** Base URL for the application */
  baseUrl?: string;

  /** Render function */
  render?: (path: string, context?: StaticPropsContext) => Promise<string>;

  /** Callback when a page is revalidated */
  onRevalidate?: (path: string, success: boolean, duration: number) => void;

  /** Callback when revalidation fails */
  onError?: (path: string, error: Error) => void;

  /** Custom logger */
  logger?: ISRLogger;

  /** Log level */
  logLevel?: LogLevel;

  /** Enable metrics collection */
  enableMetrics?: boolean;

  /** Event handlers */
  onEvent?: ISREventHandler;

  /** Stale-while-revalidate grace period in seconds */
  staleWhileRevalidate?: number;

  /** Maximum concurrent regenerations */
  maxConcurrentRegenerations?: number;

  /** Retry configuration */
  retry?: {
    maxRetries?: number;
    initialDelay?: number;
    backoffMultiplier?: number;
    maxDelay?: number;
  };

  /** Development mode configuration */
  dev?: {
    disableCache?: boolean;
    alwaysRegenerate?: boolean;
    debugHeaders?: boolean;
  };
}

/**
 * Cache adapter types
 */
export type CacheAdapterType = 'memory' | 'redis' | 'filesystem' | 'cloudflare-kv' | 'vercel';

/**
 * Cache adapter interface
 */
export interface CacheAdapter {
  readonly name: string;
  get(path: string): Promise<CacheEntry | null>;
  set(path: string, entry: CacheEntry): Promise<void>;
  delete(path: string): Promise<boolean>;
  has(path: string): Promise<boolean>;
  keys(): Promise<string[]>;
  clear(): Promise<void>;
  getByTag(tag: string): Promise<string[]>;
  updateMeta(path: string, meta: Partial<CacheEntryMeta>): Promise<boolean>;
  getMeta(path: string): Promise<CacheEntryMeta | null>;
  getStats(): Promise<CacheStats>;
  close(): Promise<void>;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  entryCount: number;
  sizeBytes: number;
  staleCount: number;
  oldestEntry?: number;
  newestEntry?: number;
  byStatus: Record<RevalidationStatus, number>;
}

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

/**
 * Logger interface
 */
export interface ISRLogger {
  debug: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
}

/**
 * ISR event types
 */
export type ISREventType =
  | 'cache:hit'
  | 'cache:miss'
  | 'cache:set'
  | 'cache:delete'
  | 'revalidate:start'
  | 'revalidate:success'
  | 'revalidate:error'
  | 'tag:invalidate'
  | 'build:start'
  | 'build:page'
  | 'build:complete';

/**
 * ISR event payload
 */
export interface ISREvent {
  type: ISREventType;
  path: string;
  tags?: string[];
  timestamp: number;
  duration?: number;
  error?: Error;
  meta?: Record<string, unknown>;
}

/**
 * Event handler function
 */
export type ISREventHandler = (event: ISREvent) => void | Promise<void>;
