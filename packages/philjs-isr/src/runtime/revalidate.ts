/**
 * PhilJS ISR Runtime Revalidation
 *
 * Runtime revalidation utilities for triggering page regeneration.
 */

import type { ISRLogger, StaticPropsContext } from '../types.js';
import type { RuntimeCache } from './cache.js';

/**
 * Revalidation options
 */
export interface RevalidationOptions {
  /** Force revalidation even if not stale */
  force?: boolean;
  /** Context for rendering */
  context?: StaticPropsContext;
  /** Priority (higher = sooner) */
  priority?: number;
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
  contentChanged?: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Render function type
 */
export type RenderFunction = (path: string, context?: StaticPropsContext) => Promise<string>;

/**
 * Runtime revalidator class
 */
export class RuntimeRevalidator {
  private cache: RuntimeCache;
  private renderFn: RenderFunction;
  private logger: ISRLogger;
  private processing: Set<string> = new Set();
  private queue: Map<string, { priority: number; context?: StaticPropsContext }> = new Map();
  private maxConcurrent: number;

  constructor(options: {
    cache: RuntimeCache;
    render: RenderFunction;
    maxConcurrent?: number;
    logger?: ISRLogger;
  }) {
    this.cache = options.cache;
    this.renderFn = options.render;
    this.maxConcurrent = options.maxConcurrent ?? 5;
    this.logger = options.logger ?? this.createDefaultLogger();
  }

  /**
   * Revalidate a path immediately (blocking)
   */
  async revalidate(path: string, options: RevalidationOptions = {}): Promise<RevalidationResult> {
    const startTime = Date.now();

    // Check if already processing
    if (this.processing.has(path)) {
      return {
        path,
        success: false,
        duration: 0,
        error: 'Already being revalidated',
      };
    }

    // Check if revalidation is needed
    if (!options.force) {
      const existing = await this.cache.get(path, true);
      if (existing) {
        const lookup = await this.cache.lookup(path);
        if (!lookup.isStale) {
          return {
            path,
            success: true,
            duration: 0,
            contentChanged: false,
          };
        }
      }
    }

    this.processing.add(path);
    await this.cache.markRevalidating(path);

    try {
      // Render new content
      const html = await this.renderFn(path, options.context);
      const duration = Date.now() - startTime;

      // Update cache
      const contentChanged = await this.cache.update(path, html);

      // If entry didn't exist, create it
      if (!contentChanged) {
        const existingMeta = await this.cache.getMeta(path);
        if (!existingMeta) {
          await this.cache.set(path, html);
        }
      }

      await this.cache.markFresh(path);

      this.logger.info(`Revalidated: ${path} in ${duration}ms (changed: ${contentChanged})`);

      return {
        path,
        success: true,
        duration,
        contentChanged,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      await this.cache.markError(path, errorMessage);
      this.logger.error(`Revalidation failed: ${path}`, { error: errorMessage });

      return {
        path,
        success: false,
        duration,
        error: errorMessage,
      };
    } finally {
      this.processing.delete(path);
      this.processQueue();
    }
  }

  /**
   * Queue a path for background revalidation
   */
  queueRevalidation(path: string, options: RevalidationOptions = {}): void {
    if (this.processing.has(path)) {
      return;
    }

    const existing = this.queue.get(path);
    const priority = options.priority ?? 0;

    if (!existing || priority > existing.priority) {
      this.queue.set(path, {
        priority,
        context: options.context,
      });
    }

    this.processQueue();
  }

  /**
   * Revalidate multiple paths
   */
  async revalidateMany(
    paths: string[],
    options: RevalidationOptions = {}
  ): Promise<RevalidationResult[]> {
    const results: RevalidationResult[] = [];

    for (const path of paths) {
      const result = await this.revalidate(path, options);
      results.push(result);
    }

    return results;
  }

  /**
   * Revalidate all paths with a tag
   */
  async revalidateTag(tag: string, options: RevalidationOptions = {}): Promise<RevalidationResult[]> {
    const paths = await this.cache.getByTag(tag);
    this.logger.info(`Revalidating tag "${tag}": ${paths.length} paths`);
    return this.revalidateMany(paths, options);
  }

  /**
   * Check if a path is currently being revalidated
   */
  isRevalidating(path: string): boolean {
    return this.processing.has(path);
  }

  /**
   * Get the number of paths in the queue
   */
  getQueueSize(): number {
    return this.queue.size;
  }

  /**
   * Get the number of paths currently being processed
   */
  getProcessingCount(): number {
    return this.processing.size;
  }

  /**
   * Clear the revalidation queue
   */
  clearQueue(): void {
    this.queue.clear();
  }

  /**
   * Process queued revalidations
   */
  private processQueue(): void {
    while (this.processing.size < this.maxConcurrent && this.queue.size > 0) {
      // Get highest priority item
      const entries = Array.from(this.queue.entries());
      entries.sort((a, b) => b[1].priority - a[1].priority);

      const [path, options] = entries[0];
      this.queue.delete(path);

      // Start revalidation in background
      this.revalidate(path, { context: options.context }).catch((error) => {
        this.logger.error(`Queue revalidation error: ${path}`, { error });
      });
    }
  }

  private createDefaultLogger(): ISRLogger {
    return {
      debug: () => {},
      info: () => {},
      warn: (msg) => console.warn(`[ISR:Revalidate] ${msg}`),
      error: (msg) => console.error(`[ISR:Revalidate] ${msg}`),
    };
  }
}

/**
 * Create a runtime revalidator
 */
export function createRevalidator(options: {
  cache: RuntimeCache;
  render: RenderFunction;
  maxConcurrent?: number;
  logger?: ISRLogger;
}): RuntimeRevalidator {
  return new RuntimeRevalidator(options);
}

/**
 * Create standalone revalidatePath function
 */
export function createRevalidatePath(revalidator: RuntimeRevalidator) {
  return async (path: string): Promise<RevalidationResult> => {
    return revalidator.revalidate(path, { force: true });
  };
}

/**
 * Create standalone revalidateTag function
 */
export function createRevalidateTag(revalidator: RuntimeRevalidator) {
  return async (tag: string): Promise<RevalidationResult[]> => {
    return revalidator.revalidateTag(tag, { force: true });
  };
}
