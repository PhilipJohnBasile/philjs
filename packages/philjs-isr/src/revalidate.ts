/**
 * PhilJS ISR Revalidation Logic
 *
 * Handles background revalidation of stale pages.
 * Supports both time-based and on-demand revalidation.
 */

import type { CacheManager } from './cache.js';
import { createCacheEntry, isStale, isWithinSWRWindow } from './cache.js';
import type { ISRConfig, ISREvent, ISRLogger, StaticPropsContext } from './config.js';
import type { TagManager } from './tags.js';

/**
 * Revalidation request
 */
export interface RevalidationRequest {
  /** Path to revalidate */
  path: string;
  /** Priority (higher = sooner) */
  priority?: number;
  /** Force revalidation even if not stale */
  force?: boolean;
  /** Context for rendering */
  context?: StaticPropsContext;
  /** Callback when complete */
  onComplete?: (success: boolean, duration: number) => void;
}

/**
 * Revalidation result
 */
export interface RevalidationResult {
  /** Path that was revalidated */
  path: string;
  /** Whether revalidation succeeded */
  success: boolean;
  /** Duration in milliseconds */
  duration: number;
  /** Whether content changed */
  contentChanged?: boolean | undefined;
  /** Error message if failed */
  error?: string | undefined;
  /** New content hash */
  newHash?: string | undefined;
  /** Previous content hash */
  previousHash?: string | undefined;
}

/**
 * Revalidation queue status
 */
export interface RevalidationQueueStatus {
  /** Number of pending requests */
  pending: number;
  /** Number of currently processing requests */
  processing: number;
  /** Number of completed requests */
  completed: number;
  /** Number of failed requests */
  failed: number;
  /** Whether the queue is paused */
  paused: boolean;
}

/**
 * Revalidation manager handles background regeneration of pages
 */
export class RevalidationManager {
  private cache: CacheManager;
  private tagManager: TagManager;
  private config: ISRConfig;
  private logger: ISRLogger;

  // Queue management
  private queue: Map<string, RevalidationRequest> = new Map();
  private processing: Set<string> = new Set();
  private completed: number = 0;
  private failed: number = 0;
  private paused: boolean = false;

  // Retry tracking
  private retryCount: Map<string, number> = new Map();

  // Event handler
  private eventHandler: ((event: ISREvent) => void | Promise<void>) | undefined;

  // Render function
  private renderFn: ((path: string, context?: StaticPropsContext) => Promise<string>) | undefined;

  constructor(
    cache: CacheManager,
    tagManager: TagManager,
    config: ISRConfig,
    eventHandler?: (event: ISREvent) => void | Promise<void>
  ) {
    this.cache = cache;
    this.tagManager = tagManager;
    this.config = config;
    this.logger = config.logger ?? this.createDefaultLogger();
    this.eventHandler = eventHandler;
    this.renderFn = config.render;
  }

  /**
   * Set the render function
   */
  setRenderFunction(fn: (path: string, context?: StaticPropsContext) => Promise<string>): void {
    this.renderFn = fn;
  }

  /**
   * Request revalidation of a path
   */
  async revalidate(request: RevalidationRequest): Promise<void> {
    const { path, priority = 0 } = request;

    // Skip if already processing
    if (this.processing.has(path)) {
      this.logger.debug(`Path already being revalidated: ${path}`);
      return;
    }

    // Check if we should revalidate
    if (!request.force) {
      const entry = await this.cache.get(path, { includeStale: true });
      if (entry && !isStale(entry)) {
        this.logger.debug(`Path not stale, skipping: ${path}`);
        return;
      }
    }

    // Add to queue (higher priority = processed sooner)
    const existing = this.queue.get(path);
    if (!existing || (priority > (existing.priority ?? 0))) {
      this.queue.set(path, { ...request, priority });
      this.logger.debug(`Queued revalidation: ${path} (priority: ${priority})`);
    }

    // Process queue
    await this.processQueue();
  }

  /**
   * Revalidate a path immediately (blocking)
   */
  async revalidateNow(path: string, context?: StaticPropsContext): Promise<RevalidationResult> {
    const startTime = Date.now();

    // Mark as revalidating
    await this.cache.markRevalidating(path);
    this.processing.add(path);

    await this.emitEvent({
      type: 'revalidate:start',
      path,
      timestamp: Date.now(),
    });

    try {
      // Get previous entry for comparison
      const previousEntry = await this.cache.get(path, { includeStale: true });
      const previousHash = previousEntry?.meta.contentHash;

      // Render new content
      if (!this.renderFn) {
        throw new Error('Render function not set');
      }

      const html = await this.renderFn(path, context);
      const duration = Date.now() - startTime;

      // Create new cache entry
      const newEntry = createCacheEntry(path, html, {
        revalidateInterval: previousEntry?.meta.revalidateInterval ?? this.config.defaultRevalidate ?? 3600,
        tags: previousEntry?.meta.tags ?? [],
      });

      // Check if content changed
      const contentChanged = newEntry.meta.contentHash !== previousHash;

      // Store in cache
      await this.cache.set(path, newEntry);
      await this.cache.markRevalidated(path);

      // Clear retry count on success
      this.retryCount.delete(path);
      this.completed++;

      // Emit success event
      await this.emitEvent({
        type: 'revalidate:success',
        path,
        timestamp: Date.now(),
        duration,
        meta: { contentChanged },
      });

      // Call config callback
      if (this.config.onRevalidate) {
        this.config.onRevalidate(path, true, duration);
      }

      this.logger.info(`Revalidated: ${path}`, { duration, contentChanged });

      return {
        path,
        success: true,
        duration,
        contentChanged,
        newHash: newEntry.meta.contentHash,
        previousHash,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      await this.cache.markError(path, errorMessage);
      this.failed++;

      // Track retries
      const retries = (this.retryCount.get(path) ?? 0) + 1;
      this.retryCount.set(path, retries);

      // Emit error event
      await this.emitEvent({
        type: 'revalidate:error',
        path,
        timestamp: Date.now(),
        duration,
        error: error instanceof Error ? error : new Error(errorMessage),
      });

      // Call config callback
      if (this.config.onError) {
        this.config.onError(path, error instanceof Error ? error : new Error(errorMessage));
      }
      if (this.config.onRevalidate) {
        this.config.onRevalidate(path, false, duration);
      }

      this.logger.error(`Revalidation failed: ${path}`, { error: errorMessage, retries });

      // Schedule retry if under limit
      const maxRetries = this.config.retry?.maxRetries ?? 3;
      if (retries < maxRetries) {
        const delay = this.calculateRetryDelay(retries);
        this.logger.info(`Scheduling retry ${retries}/${maxRetries} for ${path} in ${delay}ms`);
        setTimeout(() => {
          this.revalidate({ path, force: true });
        }, delay);
      }

      return {
        path,
        success: false,
        duration,
        error: errorMessage,
      };
    } finally {
      this.processing.delete(path);
    }
  }

  /**
   * Revalidate by path (public API)
   */
  async revalidatePath(path: string): Promise<RevalidationResult> {
    return this.revalidateNow(path);
  }

  /**
   * Revalidate all paths with a tag
   */
  async revalidateTag(tag: string): Promise<RevalidationResult[]> {
    const paths = await this.tagManager.getPathsByTag(tag);
    const cachePaths = await this.cache.getByTag(tag);
    const allPaths = [...new Set([...paths, ...cachePaths])];

    this.logger.info(`Revalidating tag: ${tag} (${allPaths.length} paths)`);

    const results: RevalidationResult[] = [];
    for (const path of allPaths) {
      const result = await this.revalidateNow(path);
      results.push(result);
    }

    return results;
  }

  /**
   * Process the revalidation queue
   */
  private async processQueue(): Promise<void> {
    if (this.paused) {
      return;
    }

    const maxConcurrent = this.config.maxConcurrentRegenerations ?? 5;

    while (this.processing.size < maxConcurrent && this.queue.size > 0) {
      // Get highest priority request
      const entries = Array.from(this.queue.entries());
      entries.sort((a, b) => (b[1].priority ?? 0) - (a[1].priority ?? 0));

      const firstEntry = entries[0];
      if (!firstEntry) break;
      const [path, request] = firstEntry;
      this.queue.delete(path);

      // Process in background
      this.revalidateNow(path, request.context)
        .then(result => {
          if (request.onComplete) {
            request.onComplete(result.success, result.duration);
          }
        })
        .catch(error => {
          this.logger.error(`Queue processing error: ${path}`, { error });
        });
    }
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(retryNumber: number): number {
    const { initialDelay = 1000, backoffMultiplier = 2, maxDelay = 30000 } =
      this.config.retry ?? {};

    const delay = Math.min(
      initialDelay * Math.pow(backoffMultiplier, retryNumber - 1),
      maxDelay
    );

    // Add jitter (0-10% of delay)
    const jitter = delay * Math.random() * 0.1;
    return Math.round(delay + jitter);
  }

  /**
   * Pause queue processing
   */
  pause(): void {
    this.paused = true;
    this.logger.info('Revalidation queue paused');
  }

  /**
   * Resume queue processing
   */
  resume(): void {
    this.paused = false;
    this.logger.info('Revalidation queue resumed');
    this.processQueue();
  }

  /**
   * Clear the queue
   */
  clearQueue(): void {
    this.queue.clear();
    this.logger.info('Revalidation queue cleared');
  }

  /**
   * Get queue status
   */
  getStatus(): RevalidationQueueStatus {
    return {
      pending: this.queue.size,
      processing: this.processing.size,
      completed: this.completed,
      failed: this.failed,
      paused: this.paused,
    };
  }

  /**
   * Check if a path needs revalidation
   */
  async needsRevalidation(path: string): Promise<boolean> {
    const entry = await this.cache.get(path, { includeStale: true });
    if (!entry) {
      return true; // Not in cache, needs generation
    }
    return isStale(entry);
  }

  /**
   * Check if stale content can be served (within SWR window)
   */
  async canServeStale(path: string): Promise<boolean> {
    const entry = await this.cache.get(path, { includeStale: true });
    if (!entry) {
      return false;
    }
    const swrSeconds = this.config.staleWhileRevalidate ?? 60;
    return isWithinSWRWindow(entry, swrSeconds);
  }

  /**
   * Emit an ISR event
   */
  private async emitEvent(event: ISREvent): Promise<void> {
    if (this.eventHandler) {
      try {
        await this.eventHandler(event);
      } catch (error) {
        this.logger.error('Event handler error', { error });
      }
    }
  }

  /**
   * Create default logger
   */
  private createDefaultLogger(): ISRLogger {
    const level = this.config.logLevel ?? 'info';
    const levels = ['debug', 'info', 'warn', 'error', 'silent'];
    const currentLevel = levels.indexOf(level);
    const shouldLog = (msgLevel: string) => levels.indexOf(msgLevel) >= currentLevel;

    return {
      debug: (msg, meta) => shouldLog('debug') && console.debug(`[ISR:Revalidate] ${msg}`, meta || ''),
      info: (msg, meta) => shouldLog('info') && console.info(`[ISR:Revalidate] ${msg}`, meta || ''),
      warn: (msg, meta) => shouldLog('warn') && console.warn(`[ISR:Revalidate] ${msg}`, meta || ''),
      error: (msg, meta) => shouldLog('error') && console.error(`[ISR:Revalidate] ${msg}`, meta || ''),
    };
  }
}

/**
 * Create a standalone revalidatePath function
 */
export function createRevalidatePath(manager: RevalidationManager) {
  return async (path: string): Promise<RevalidationResult> => {
    return manager.revalidatePath(path);
  };
}

/**
 * Create a standalone revalidateTag function
 */
export function createRevalidateTag(manager: RevalidationManager) {
  return async (tag: string): Promise<RevalidationResult[]> => {
    return manager.revalidateTag(tag);
  };
}
