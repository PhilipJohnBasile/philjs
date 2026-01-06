/**
 * PhilJS Incremental Static Regeneration (ISR)
 *
 * A production-ready ISR system similar to Next.js that allows static pages
 * to be regenerated on-demand or on a schedule.
 *
 * Features:
 * - Time-based revalidation
 * - On-demand revalidation via API
 * - Stale-while-revalidate pattern
 * - Tag-based invalidation
 * - Multiple cache backends (memory, Redis, filesystem, Cloudflare KV, Vercel KV)
 *
 * @example
 * ```typescript
 * import { createISR } from '@philjs/isr';
 *
 * const isr = await createISR({
 *   cache: 'memory',
 *   defaultRevalidate: 3600,
 *   render: async (path) => renderPage(path),
 *   onRevalidate: (path) => console.log(`Revalidated: ${path}`),
 * });
 *
 * // Use as middleware
 * app.use(isr.middleware());
 *
 * // API endpoint for on-demand revalidation
 * app.post('/api/revalidate', isr.handler());
 *
 * // Revalidate programmatically
 * await isr.revalidatePath('/blog/my-post');
 * await isr.revalidateTag('blog-posts');
 * ```
 */

import { CacheManager, createCacheManager } from './cache.js';
import type { CacheAdapter, CacheStats } from './cache.js';
import type {
  ISRConfig,
  ISREvent,
  ISRMetrics,
  ISRPageConfig,
  StaticPropsContext,
  StaticPropsResult,
} from './config.js';
import { DEFAULT_ISR_CONFIG, mergeConfig, validateConfig } from './config.js';
import { createAPIHandler, ISRApiHandler } from './api.js';
import { createMiddleware, ISRMiddleware } from './middleware.js';
import type { MiddlewareOptions } from './middleware.js';
import {
  createRevalidatePath,
  createRevalidateTag,
  RevalidationManager,
} from './revalidate.js';
import type { RevalidationResult, RevalidationQueueStatus } from './revalidate.js';
import { createScheduler, RevalidationScheduler } from './scheduler.js';
import type { SchedulerConfig, SchedulerStatus } from './scheduler.js';
import { TagManager } from './tags.js';
import type { TagInvalidationResult } from './tags.js';

// ============================================================================
// Main ISR Instance
// ============================================================================

/**
 * ISR instance returned by createISR
 */
export interface ISRInstance {
  /**
   * Revalidate a specific path
   */
  revalidatePath: (path: string) => Promise<RevalidationResult>;

  /**
   * Revalidate all paths with a tag
   */
  revalidateTag: (tag: string) => Promise<RevalidationResult[]>;

  /**
   * Invalidate tag (remove from cache without regenerating)
   */
  invalidateTag: (tag: string) => Promise<TagInvalidationResult>;

  /**
   * Invalidate multiple tags
   */
  invalidateTags: (tags: string[]) => Promise<TagInvalidationResult[]>;

  /**
   * Get ISR middleware for handling requests
   */
  middleware: (options?: MiddlewareOptions) => ISRMiddleware;

  /**
   * Get API handler for revalidation endpoints
   */
  handler: () => (request: Request) => Promise<Response>;

  /**
   * Start the background scheduler
   */
  startScheduler: () => void;

  /**
   * Stop the background scheduler
   */
  stopScheduler: () => void;

  /**
   * Get scheduler status
   */
  getSchedulerStatus: () => SchedulerStatus;

  /**
   * Get revalidation queue status
   */
  getQueueStatus: () => RevalidationQueueStatus;

  /**
   * Get cache statistics
   */
  getCacheStats: () => Promise<CacheStats>;

  /**
   * Get all cache keys
   */
  getCacheKeys: () => Promise<string[]>;

  /**
   * Clear the entire cache
   */
  clearCache: () => Promise<void>;

  /**
   * Close and cleanup all resources
   */
  close: () => Promise<void>;

  /**
   * Access underlying components (advanced usage)
   */
  readonly cache: CacheManager;
  readonly revalidator: RevalidationManager;
  readonly tagManager: TagManager;
  readonly scheduler: RevalidationScheduler;
  readonly config: ISRConfig;
}

/**
 * Create an ISR instance
 */
export async function createISR(userConfig: ISRConfig): Promise<ISRInstance> {
  // Validate and merge config
  validateConfig(userConfig);
  const config = mergeConfig(userConfig);

  // Event handler wrapper
  const emitEvent = async (event: ISREvent) => {
    if (config.onEvent) {
      await config.onEvent(event);
    }
  };

  // Create cache manager
  const cacheManager = await createCacheManager(config);

  // Create tag manager
  const tagManager = new TagManager(cacheManager, config, emitEvent);

  // Create revalidation manager
  const revalidationManager = new RevalidationManager(
    cacheManager,
    tagManager,
    config,
    emitEvent
  );

  // Create scheduler
  const scheduler = createScheduler(
    cacheManager,
    revalidationManager,
    config,
    { autoStart: false }
  );

  // Create API handler
  let apiHandler: ISRApiHandler | null = null;

  // Create middleware instance cache
  let middlewareInstance: ISRMiddleware | null = null;

  return {
    revalidatePath: createRevalidatePath(revalidationManager),
    revalidateTag: createRevalidateTag(revalidationManager),

    invalidateTag: (tag: string) => tagManager.invalidateTag(tag),
    invalidateTags: (tags: string[]) => tagManager.invalidateTags(tags),

    middleware: (options?: MiddlewareOptions) => {
      if (!middlewareInstance) {
        middlewareInstance = createMiddleware(
          cacheManager,
          revalidationManager,
          tagManager,
          config,
          options,
          emitEvent
        );
      }
      return middlewareInstance;
    },

    handler: () => {
      if (!apiHandler) {
        apiHandler = createAPIHandler(
          cacheManager,
          revalidationManager,
          tagManager,
          config,
          { cors: true }
        );
      }
      return apiHandler.handler();
    },

    startScheduler: () => scheduler.start(),
    stopScheduler: () => scheduler.stop(),
    getSchedulerStatus: () => scheduler.getStatus(),
    getQueueStatus: () => revalidationManager.getStatus(),

    getCacheStats: () => cacheManager.getStats(),
    getCacheKeys: () => cacheManager.keys(),
    clearCache: () => cacheManager.clear(),

    close: async () => {
      scheduler.stop();
      revalidationManager.pause();
      await cacheManager.close();
    },

    // Expose internals for advanced usage
    cache: cacheManager,
    revalidator: revalidationManager,
    tagManager,
    scheduler,
    config,
  };
}

// ============================================================================
// Convenience Functions (for use without full ISR instance)
// ============================================================================

/**
 * Global ISR instance for convenience functions
 */
let globalISR: ISRInstance | null = null;

/**
 * Set the global ISR instance
 */
export function setGlobalISR(isr: ISRInstance): void {
  globalISR = isr;
}

/**
 * Get the global ISR instance
 */
export function getGlobalISR(): ISRInstance | null {
  return globalISR;
}

/**
 * Revalidate a path using the global ISR instance
 */
export async function revalidatePath(path: string): Promise<RevalidationResult> {
  if (!globalISR) {
    throw new Error('[ISR] Global ISR instance not set. Call setGlobalISR first.');
  }
  return globalISR.revalidatePath(path);
}

/**
 * Revalidate a tag using the global ISR instance
 */
export async function revalidateTag(tag: string): Promise<RevalidationResult[]> {
  if (!globalISR) {
    throw new Error('[ISR] Global ISR instance not set. Call setGlobalISR first.');
  }
  return globalISR.revalidateTag(tag);
}

// ============================================================================
// Page Config Helpers
// ============================================================================

/**
 * Define page-level ISR configuration
 *
 * @example
 * ```typescript
 * // In your page file
 * export const config = definePageConfig({
 *   revalidate: 60, // Regenerate every 60 seconds
 *   tags: ['blog-posts', 'homepage'],
 * });
 * ```
 */
export function definePageConfig(config: ISRPageConfig): ISRPageConfig {
  return {
    revalidate: config.revalidate ?? 3600,
    tags: config.tags ?? [],
    blocking: config.blocking ?? false,
    fallback: config.fallback ?? 'blocking',
    ...config,
  };
}

/**
 * Create a getStaticProps function with ISR support
 *
 * @example
 * ```typescript
 * export const getStaticProps = createGetStaticProps(async (context) => {
 *   const posts = await fetchPosts();
 *   return {
 *     props: { posts },
 *     revalidate: 3600,
 *     tags: ['blog-posts'],
 *   };
 * });
 * ```
 */
export function createGetStaticProps<T>(
  fn: (context: StaticPropsContext) => Promise<StaticPropsResult<T>> | StaticPropsResult<T>
): (context: StaticPropsContext) => Promise<StaticPropsResult<T>> {
  return async (context: StaticPropsContext) => {
    const result = await fn(context);

    // Ensure defaults
    return {
      ...result,
      revalidate: result.revalidate ?? 3600,
      tags: result.tags ?? [],
    };
  };
}

// ============================================================================
// Type Exports
// ============================================================================

export type {
  // Config types
  ISRConfig,
  ISRPageConfig,
  ISREvent,
  ISREventType,
  ISREventHandler,
  ISRLogger,
  ISRMetrics,
  CacheAdapterType,
  LogLevel,
  RevalidationStatus,
  StaticPropsContext,
  StaticPropsResult,
  GetStaticProps,
  GetStaticPaths,
  StaticPathsResult,
  CacheEntry,
  CacheEntryMeta,
} from './config.js';

export type {
  // Cache types
  CacheAdapter,
  CacheStats,
  CacheGetOptions,
  CacheSetOptions,
} from './cache.js';

export type {
  // Revalidation types
  RevalidationRequest,
  RevalidationResult,
  RevalidationQueueStatus,
} from './revalidate.js';

export type {
  // Tag types
  TagEntry,
  TagInvalidationResult,
} from './tags.js';

export type {
  // Scheduler types
  ScheduledTask,
  SchedulerConfig,
  SchedulerStatus,
} from './scheduler.js';

export type {
  // Middleware types
  MiddlewareContext,
  MiddlewareResult,
  MiddlewareOptions,
  ISRMiddlewareFn,
} from './middleware.js';

export type {
  // API types
  APIContext,
  APIResponse,
  APIHandlerOptions,
  RevalidateRequestBody,
} from './api.js';

// ============================================================================
// Class/Function Exports
// ============================================================================

export {
  // Cache
  CacheManager,
  createCacheManager,
  createCacheEntry,
  hashContent,
  isStale,
  isWithinSWRWindow,
  generateCacheControl,
  generateETag,
} from './cache.js';

export {
  // Config
  DEFAULT_ISR_CONFIG,
  defineISRConfig,
  mergeConfig,
  validateConfig,
} from './config.js';

export {
  // Revalidation
  RevalidationManager,
  createRevalidatePath,
  createRevalidateTag,
} from './revalidate.js';

export {
  // Tags
  TagManager,
  createHierarchicalTags,
  parseHierarchicalTag,
  matchTagPattern,
  tagHelpers,
} from './tags.js';

export {
  // Scheduler
  RevalidationScheduler,
  createScheduler,
  calculateNextRevalidation,
  isRevalidationDue,
} from './scheduler.js';

export {
  // Middleware
  ISRMiddleware,
  createMiddleware,
} from './middleware.js';

export {
  // API
  ISRApiHandler,
  createAPIHandler,
  createRevalidateEndpoint,
} from './api.js';

// ============================================================================
// Adapter Exports (re-export from adapters)
// ============================================================================

export {
  MemoryCacheAdapter,
  createMemoryCache,
  RedisCacheAdapter,
  createRedisCache,
  FilesystemCacheAdapter,
  createFilesystemCache,
  CloudflareKVAdapter,
  createCloudflareKVCache,
  VercelKVAdapter,
  createVercelKVCache,
} from './adapters/index.js';

export type {
  MemoryCacheConfig,
  RedisConfig,
  FilesystemCacheConfig,
  CloudflareKVConfig,
  VercelKVConfig,
} from './adapters/index.js';
