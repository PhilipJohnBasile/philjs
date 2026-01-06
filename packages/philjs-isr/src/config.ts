/**
 * PhilJS ISR Configuration Types
 *
 * Provides type definitions for ISR configuration, page config, and revalidation settings.
 */

/**
 * Cache adapter types supported by ISR
 */
export type CacheAdapterType =
  | 'memory'
  | 'redis'
  | 'filesystem'
  | 'cloudflare-kv'
  | 'vercel';

/**
 * Log levels for ISR operations
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

/**
 * Revalidation status for a cache entry
 */
export type RevalidationStatus =
  | 'fresh' // Content is within revalidate window
  | 'stale' // Content needs revalidation
  | 'revalidating' // Currently being regenerated
  | 'error'; // Failed to regenerate

/**
 * Cache entry metadata
 */
export interface CacheEntryMeta {
  /** Path of the cached page */
  path: string;
  /** Unix timestamp when entry was created */
  createdAt: number;
  /** Unix timestamp when entry was last revalidated */
  revalidatedAt: number;
  /** Revalidation interval in seconds */
  revalidateInterval: number;
  /** Tags associated with this entry */
  tags: string[];
  /** ETag for conditional requests */
  etag?: string;
  /** Content hash for change detection */
  contentHash?: string;
  /** Current revalidation status */
  status: RevalidationStatus;
  /** Number of times this entry has been regenerated */
  regenerationCount: number;
  /** Last error message if revalidation failed */
  lastError?: string;
}

/**
 * Cached page entry
 */
export interface CacheEntry {
  /** Rendered HTML content */
  html: string;
  /** Entry metadata */
  meta: CacheEntryMeta;
  /** Optional page props (for hydration) */
  props?: Record<string, unknown>;
  /** HTTP headers to serve with this entry */
  headers?: Record<string, string>;
}

/**
 * Page-level ISR configuration (exported from page modules)
 */
export interface ISRPageConfig {
  /**
   * Revalidation interval in seconds
   * - `false`: Never revalidate (static forever)
   * - `number`: Revalidate after this many seconds
   */
  revalidate?: number | false;

  /**
   * Tags for on-demand invalidation
   * Pages with matching tags will be invalidated together
   */
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
   * - 'blocking': Wait for generation (like getStaticPaths fallback: 'blocking')
   * - 'prerender': Return loading state while generating
   * - false: Return 404
   */
  fallback?: 'blocking' | 'prerender' | false;
}

/**
 * Result from getStaticProps-style functions
 */
export interface StaticPropsResult<T = Record<string, unknown>> {
  /** Props to pass to the page component */
  props: T;
  /** Revalidation interval in seconds */
  revalidate?: number | false;
  /** Cache tags for invalidation */
  tags?: string[];
  /** Optional redirect instead of rendering */
  redirect?: {
    destination: string;
    permanent?: boolean;
  };
  /** Return 404 */
  notFound?: boolean;
}

/**
 * Context passed to getStaticProps
 */
export interface StaticPropsContext {
  /** Route parameters */
  params: Record<string, string | string[]>;
  /** Preview mode data */
  preview?: boolean;
  previewData?: unknown;
  /** Request locale */
  locale?: string;
  /** Default locale */
  defaultLocale?: string;
  /** All available locales */
  locales?: string[];
}

/**
 * Function signature for getStaticProps
 */
export type GetStaticProps<T = Record<string, unknown>> = (
  context: StaticPropsContext
) => Promise<StaticPropsResult<T>> | StaticPropsResult<T>;

/**
 * Result from getStaticPaths
 */
export interface StaticPathsResult {
  /** Array of paths to pre-render */
  paths: Array<string | { params: Record<string, string | string[]>; locale?: string }>;
  /** Fallback behavior */
  fallback: boolean | 'blocking';
}

/**
 * Function signature for getStaticPaths
 */
export type GetStaticPaths = () => Promise<StaticPathsResult> | StaticPathsResult;

/**
 * Monitoring/metrics hook types
 */
export interface ISRMetrics {
  /** Total cache hits */
  cacheHits: number;
  /** Total cache misses */
  cacheMisses: number;
  /** Total revalidations */
  revalidations: number;
  /** Failed revalidations */
  revalidationErrors: number;
  /** Average regeneration time in ms */
  avgRegenerationTime: number;
  /** Cache size in bytes (approximate) */
  cacheSize: number;
  /** Number of entries in cache */
  entryCount: number;
}

/**
 * Event types for ISR hooks
 */
export type ISREventType =
  | 'cache:hit'
  | 'cache:miss'
  | 'cache:set'
  | 'cache:delete'
  | 'revalidate:start'
  | 'revalidate:success'
  | 'revalidate:error'
  | 'tag:invalidate';

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

/**
 * Logger interface for ISR
 */
export interface ISRLogger {
  debug: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
}

/**
 * Main ISR configuration
 */
export interface ISRConfig {
  /**
   * Cache adapter to use
   * Can be a string (built-in adapter) or custom adapter instance
   */
  cache: CacheAdapterType | import('./cache.js').CacheAdapter;

  /**
   * Default revalidation interval in seconds
   * Used when page doesn't specify its own revalidate value
   * Default: 3600 (1 hour)
   */
  defaultRevalidate?: number;

  /**
   * Minimum revalidation interval in seconds
   * Prevents pages from setting too aggressive revalidation
   * Default: 1
   */
  minRevalidate?: number;

  /**
   * Maximum revalidation interval in seconds
   * Default: 31536000 (1 year)
   */
  maxRevalidate?: number;

  /**
   * Secret for authenticating on-demand revalidation requests
   * Required for /api/revalidate endpoint
   */
  revalidateSecret?: string;

  /**
   * Base URL for the application
   * Used for generating absolute URLs during revalidation
   */
  baseUrl?: string;

  /**
   * Custom page renderer function
   * Called to generate HTML for a path
   */
  render?: (path: string, context?: StaticPropsContext) => Promise<string>;

  /**
   * Callback when a page is revalidated
   */
  onRevalidate?: (path: string, success: boolean, duration: number) => void;

  /**
   * Callback when revalidation fails
   */
  onError?: (path: string, error: Error) => void;

  /**
   * Custom logger
   */
  logger?: ISRLogger;

  /**
   * Log level
   * Default: 'info'
   */
  logLevel?: LogLevel;

  /**
   * Enable metrics collection
   * Default: true
   */
  enableMetrics?: boolean;

  /**
   * Event handlers for various ISR events
   */
  onEvent?: ISREventHandler;

  /**
   * Redis-specific configuration (when cache is 'redis')
   */
  redis?: {
    url?: string;
    host?: string;
    port?: number;
    password?: string;
    db?: number;
    keyPrefix?: string;
    tls?: boolean;
  };

  /**
   * Filesystem-specific configuration (when cache is 'filesystem')
   */
  filesystem?: {
    /** Directory to store cache files */
    cacheDir?: string;
    /** File extension for cache files */
    extension?: string;
  };

  /**
   * Cloudflare KV-specific configuration
   */
  cloudflareKV?: {
    /** KV namespace binding name */
    namespace?: string;
    /** Account ID for API access */
    accountId?: string;
    /** API token for KV operations */
    apiToken?: string;
  };

  /**
   * Vercel KV-specific configuration
   */
  vercelKV?: {
    /** KV URL (defaults to VERCEL_KV_URL env var) */
    url?: string;
    /** KV token (defaults to VERCEL_KV_REST_API_TOKEN env var) */
    token?: string;
  };

  /**
   * Stale-while-revalidate grace period in seconds
   * How long to serve stale content while revalidating
   * Default: 60
   */
  staleWhileRevalidate?: number;

  /**
   * Maximum concurrent regenerations
   * Prevents overloading the server during mass invalidation
   * Default: 5
   */
  maxConcurrentRegenerations?: number;

  /**
   * Retry configuration for failed regenerations
   */
  retry?: {
    /** Maximum number of retries */
    maxRetries?: number;
    /** Initial delay in ms */
    initialDelay?: number;
    /** Backoff multiplier */
    backoffMultiplier?: number;
    /** Maximum delay in ms */
    maxDelay?: number;
  };

  /**
   * Development mode configuration
   */
  dev?: {
    /** Disable caching in development */
    disableCache?: boolean;
    /** Always regenerate on request */
    alwaysRegenerate?: boolean;
    /** Show ISR debug info in responses */
    debugHeaders?: boolean;
  };
}

/**
 * Default ISR configuration values
 */
export const DEFAULT_ISR_CONFIG: Required<
  Pick<
    ISRConfig,
    | 'defaultRevalidate'
    | 'minRevalidate'
    | 'maxRevalidate'
    | 'staleWhileRevalidate'
    | 'maxConcurrentRegenerations'
    | 'logLevel'
    | 'enableMetrics'
  >
> & {
  retry: Required<NonNullable<ISRConfig['retry']>>;
  dev: Required<NonNullable<ISRConfig['dev']>>;
} = {
  defaultRevalidate: 3600,
  minRevalidate: 1,
  maxRevalidate: 31536000,
  staleWhileRevalidate: 60,
  maxConcurrentRegenerations: 5,
  logLevel: 'info',
  enableMetrics: true,
  retry: {
    maxRetries: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
    maxDelay: 30000,
  },
  dev: {
    disableCache: false,
    alwaysRegenerate: false,
    debugHeaders: true,
  },
};

/**
 * Create a page ISR config with defaults
 */
export function defineISRConfig(config: ISRPageConfig): ISRPageConfig {
  return {
    revalidate: config.revalidate ?? 3600,
    tags: config.tags ?? [],
    blocking: config.blocking ?? false,
    fallback: config.fallback ?? 'blocking',
    ...config,
  };
}

/**
 * Merge user config with defaults
 */
export function mergeConfig(userConfig: ISRConfig): ISRConfig & typeof DEFAULT_ISR_CONFIG {
  return {
    ...DEFAULT_ISR_CONFIG,
    ...userConfig,
    retry: {
      ...DEFAULT_ISR_CONFIG.retry,
      ...userConfig.retry,
    },
    dev: {
      ...DEFAULT_ISR_CONFIG.dev,
      ...userConfig.dev,
    },
  };
}

/**
 * Validate ISR configuration
 */
export function validateConfig(config: ISRConfig): void {
  if (!config.cache) {
    throw new Error('[ISR] Cache adapter is required');
  }

  if (config.defaultRevalidate !== undefined && config.defaultRevalidate < 0) {
    throw new Error('[ISR] defaultRevalidate must be a positive number');
  }

  if (config.minRevalidate !== undefined && config.minRevalidate < 1) {
    throw new Error('[ISR] minRevalidate must be at least 1 second');
  }

  if (
    config.maxRevalidate !== undefined &&
    config.minRevalidate !== undefined &&
    config.maxRevalidate < config.minRevalidate
  ) {
    throw new Error('[ISR] maxRevalidate must be greater than minRevalidate');
  }

  if (config.maxConcurrentRegenerations !== undefined && config.maxConcurrentRegenerations < 1) {
    throw new Error('[ISR] maxConcurrentRegenerations must be at least 1');
  }
}
