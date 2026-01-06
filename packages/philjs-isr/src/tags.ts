/**
 * PhilJS ISR Tag-Based Invalidation System
 *
 * Provides tag-based cache invalidation for related content.
 * Pages can be tagged and invalidated together when content changes.
 */

import type { CacheManager } from './cache.js';
import type { ISRConfig, ISREvent, ISRLogger } from './config.js';

/**
 * Tag registry entry
 */
export interface TagEntry {
  /** Paths associated with this tag */
  paths: Set<string>;
  /** When the tag was last invalidated */
  lastInvalidatedAt?: number;
  /** Number of times this tag has been invalidated */
  invalidationCount: number;
}

/**
 * Tag invalidation result
 */
export interface TagInvalidationResult {
  /** Tag that was invalidated */
  tag: string;
  /** Paths that were invalidated */
  paths: string[];
  /** Whether the invalidation was successful */
  success: boolean;
  /** Duration of the operation in ms */
  duration: number;
  /** Errors encountered during invalidation */
  errors?: Array<{ path: string; error: string }>;
}

/**
 * Tag manager for tracking and invalidating tagged content
 */
export class TagManager {
  private cache: CacheManager;
  private config: ISRConfig;
  private logger: ISRLogger;
  private registry: Map<string, TagEntry> = new Map();
  private pathToTags: Map<string, Set<string>> = new Map();
  private eventHandler: ((event: ISREvent) => void | Promise<void>) | undefined;

  constructor(
    cache: CacheManager,
    config: ISRConfig,
    eventHandler?: (event: ISREvent) => void | Promise<void>
  ) {
    this.cache = cache;
    this.config = config;
    this.logger = config.logger ?? this.createDefaultLogger();
    this.eventHandler = eventHandler;
  }

  /**
   * Register a path with tags
   */
  async registerPath(path: string, tags: string[]): Promise<void> {
    // Update path -> tags mapping
    const existingTags = this.pathToTags.get(path) ?? new Set();

    // Remove from old tags not in new list
    for (const oldTag of existingTags) {
      if (!tags.includes(oldTag)) {
        const entry = this.registry.get(oldTag);
        if (entry) {
          entry.paths.delete(path);
          if (entry.paths.size === 0) {
            this.registry.delete(oldTag);
          }
        }
      }
    }

    // Add to new tags
    for (const tag of tags) {
      if (!this.registry.has(tag)) {
        this.registry.set(tag, {
          paths: new Set(),
          invalidationCount: 0,
        });
      }
      this.registry.get(tag)!.paths.add(path);
    }

    this.pathToTags.set(path, new Set(tags));
    this.logger.debug(`Registered path ${path} with tags: ${tags.join(', ')}`);
  }

  /**
   * Unregister a path from all tags
   */
  async unregisterPath(path: string): Promise<void> {
    const tags = this.pathToTags.get(path);
    if (!tags) {
      return;
    }

    for (const tag of tags) {
      const entry = this.registry.get(tag);
      if (entry) {
        entry.paths.delete(path);
        if (entry.paths.size === 0) {
          this.registry.delete(tag);
        }
      }
    }

    this.pathToTags.delete(path);
    this.logger.debug(`Unregistered path ${path} from all tags`);
  }

  /**
   * Get all paths for a tag
   */
  getPathsByTag(tag: string): string[] {
    // First check local registry
    const localEntry = this.registry.get(tag);
    if (localEntry && localEntry.paths.size > 0) {
      return Array.from(localEntry.paths);
    }

    return [];
  }

  /**
   * Get all tags for a path
   */
  getTagsForPath(path: string): string[] {
    const tags = this.pathToTags.get(path);
    return tags ? Array.from(tags) : [];
  }

  /**
   * Invalidate all paths with a specific tag
   */
  async invalidateTag(tag: string): Promise<TagInvalidationResult> {
    const startTime = Date.now();
    const errors: Array<{ path: string; error: string }> = [];

    this.logger.info(`Invalidating tag: ${tag}`);

    // Get paths from both local registry and cache
    const localPaths = this.getPathsByTag(tag);
    const cachePaths = await this.cache.getByTag(tag);
    const allPaths = [...new Set([...localPaths, ...cachePaths])];

    if (allPaths.length === 0) {
      this.logger.debug(`No paths found for tag: ${tag}`);
      return {
        tag,
        paths: [],
        success: true,
        duration: Date.now() - startTime,
      };
    }

    // Delete each path from cache
    const deletedPaths: string[] = [];
    for (const path of allPaths) {
      try {
        const deleted = await this.cache.delete(path);
        if (deleted) {
          deletedPaths.push(path);
        }
      } catch (error) {
        errors.push({
          path,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Update registry
    const entry = this.registry.get(tag);
    if (entry) {
      entry.lastInvalidatedAt = Date.now();
      entry.invalidationCount++;
    }

    const duration = Date.now() - startTime;

    // Emit event
    await this.emitEvent({
      type: 'tag:invalidate',
      path: tag,
      tags: [tag],
      timestamp: Date.now(),
      duration,
      meta: { invalidatedPaths: deletedPaths.length },
    });

    this.logger.info(`Invalidated ${deletedPaths.length} paths for tag: ${tag}`, {
      paths: deletedPaths,
      duration,
    });

    return {
      tag,
      paths: deletedPaths,
      success: errors.length === 0,
      duration,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Invalidate multiple tags
   */
  async invalidateTags(tags: string[]): Promise<TagInvalidationResult[]> {
    const results: TagInvalidationResult[] = [];

    for (const tag of tags) {
      const result = await this.invalidateTag(tag);
      results.push(result);
    }

    return results;
  }

  /**
   * Invalidate all paths matching a tag pattern
   */
  async invalidateTagPattern(pattern: string): Promise<TagInvalidationResult[]> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matchingTags = Array.from(this.registry.keys()).filter(tag => regex.test(tag));

    if (matchingTags.length === 0) {
      this.logger.debug(`No tags match pattern: ${pattern}`);
      return [];
    }

    return this.invalidateTags(matchingTags);
  }

  /**
   * Get tag statistics
   */
  getTagStats(): Map<string, { pathCount: number; lastInvalidatedAt?: number; invalidationCount: number }> {
    const stats = new Map<string, { pathCount: number; lastInvalidatedAt?: number; invalidationCount: number }>();

    for (const [tag, entry] of this.registry) {
      stats.set(tag, {
        pathCount: entry.paths.size,
        lastInvalidatedAt: entry.lastInvalidatedAt,
        invalidationCount: entry.invalidationCount,
      });
    }

    return stats;
  }

  /**
   * Get all registered tags
   */
  getAllTags(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Clear all tag registrations
   */
  clear(): void {
    this.registry.clear();
    this.pathToTags.clear();
    this.logger.info('Tag registry cleared');
  }

  /**
   * Rebuild tag registry from cache
   */
  async rebuildFromCache(): Promise<void> {
    this.registry.clear();
    this.pathToTags.clear();

    const keys = await this.cache.keys();
    for (const path of keys) {
      const meta = await this.cache.getAdapter().getMeta(path);
      if (meta && meta.tags.length > 0) {
        await this.registerPath(path, meta.tags);
      }
    }

    this.logger.info(`Rebuilt tag registry with ${this.registry.size} tags`);
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
      debug: (msg, meta) => shouldLog('debug') && console.debug(`[ISR:Tags] ${msg}`, meta || ''),
      info: (msg, meta) => shouldLog('info') && console.info(`[ISR:Tags] ${msg}`, meta || ''),
      warn: (msg, meta) => shouldLog('warn') && console.warn(`[ISR:Tags] ${msg}`, meta || ''),
      error: (msg, meta) => shouldLog('error') && console.error(`[ISR:Tags] ${msg}`, meta || ''),
    };
  }
}

/**
 * Helper function to create hierarchical tags
 * e.g., createHierarchicalTags('blog', 'post', '123') returns ['blog', 'blog:post', 'blog:post:123']
 */
export function createHierarchicalTags(...parts: string[]): string[] {
  const tags: string[] = [];
  let current = '';

  for (const part of parts) {
    current = current ? `${current}:${part}` : part;
    tags.push(current);
  }

  return tags;
}

/**
 * Parse a hierarchical tag into its parts
 */
export function parseHierarchicalTag(tag: string): string[] {
  return tag.split(':');
}

/**
 * Check if a tag matches a pattern (supports * wildcard)
 */
export function matchTagPattern(tag: string, pattern: string): boolean {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  return regex.test(tag);
}

/**
 * Create common tag helpers
 */
export const tagHelpers = {
  /**
   * Create tags for a content type
   * e.g., content('blog', 'post-123') returns ['content:blog', 'content:blog:post-123']
   */
  content: (type: string, id?: string): string[] => {
    const tags = [`content:${type}`];
    if (id) {
      tags.push(`content:${type}:${id}`);
    }
    return tags;
  },

  /**
   * Create tags for a user's content
   * e.g., user('user-123') returns ['user:user-123']
   */
  user: (userId: string): string[] => [`user:${userId}`],

  /**
   * Create tags for a collection
   * e.g., collection('featured') returns ['collection:featured']
   */
  collection: (name: string): string[] => [`collection:${name}`],

  /**
   * Create tags for a category
   * e.g., category('tech', 'javascript') returns ['category:tech', 'category:tech:javascript']
   */
  category: (...parts: string[]): string[] => {
    return createHierarchicalTags('category', ...parts);
  },

  /**
   * Create tags for a locale
   * e.g., locale('en-US') returns ['locale:en-US']
   */
  locale: (locale: string): string[] => [`locale:${locale}`],

  /**
   * Create global invalidation tag
   * Useful for site-wide cache invalidation
   */
  global: (): string[] => ['global:all'],
};
