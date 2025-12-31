/**
 * PhilJS Content Collections - Query Functions
 *
 * Provides type-safe functions for querying content collections.
 */
import type { CollectionEntry, ContentEntry, CollectionFilter, GetCollectionOptions, CollectionsConfig } from './types.js';
/**
 * Configure the content directory path
 */
export declare function setContentDir(dir: string): void;
/**
 * Get the current content directory path
 */
export declare function getContentDir(): string;
/**
 * Set the collections configuration
 */
export declare function setCollectionsConfig(config: CollectionsConfig): void;
/**
 * Get all entries from a collection with optional filtering.
 *
 * @example
 * ```typescript
 * // Get all blog posts
 * const posts = await getCollection('blog');
 *
 * // Get published posts only
 * const published = await getCollection('blog', ({ data }) => !data.draft);
 *
 * // With sorting and limiting
 * const recent = await getCollection('blog', {
 *   filter: ({ data }) => !data.draft,
 *   sort: (a, b) => b.data.date.getTime() - a.data.date.getTime(),
 *   limit: 5,
 * });
 * ```
 */
export declare function getCollection<TName extends string>(collection: TName, filterOrOptions?: CollectionFilter<CollectionEntry> | GetCollectionOptions<CollectionEntry>): Promise<CollectionEntry[]>;
/**
 * Get a single entry from a collection by ID/slug.
 *
 * @example
 * ```typescript
 * const post = await getEntry('blog', 'my-first-post');
 *
 * if (post) {
 *   console.log(post.data.title);
 *   const { Content } = await post.render();
 * }
 * ```
 */
export declare function getEntry<TName extends string>(collection: TName, id: string): Promise<CollectionEntry | undefined>;
/**
 * Get entries by their IDs.
 *
 * @example
 * ```typescript
 * const posts = await getEntries([
 *   { collection: 'blog', id: 'post-1' },
 *   { collection: 'blog', id: 'post-2' },
 * ]);
 * ```
 */
export declare function getEntries(references: Array<{
    collection: string;
    id: string;
}>): Promise<CollectionEntry[]>;
/**
 * Check if a collection exists.
 */
export declare function hasCollection(collection: string): boolean;
/**
 * Get all collection names.
 */
export declare function getCollectionNames(): string[];
/**
 * Get entry by slug (for content collections).
 * This is a convenience function that matches by slug instead of id.
 *
 * @example
 * ```typescript
 * const post = await getEntryBySlug('blog', 'my-first-post');
 * ```
 */
export declare function getEntryBySlug<TName extends string>(collection: TName, slug: string): Promise<ContentEntry | undefined>;
/**
 * Get all unique tags from a collection.
 *
 * @example
 * ```typescript
 * const tags = await getCollectionTags('blog');
 * // ['javascript', 'typescript', 'react', ...]
 * ```
 */
export declare function getCollectionTags(collection: string, tagField?: string): Promise<string[]>;
/**
 * Get entries by tag.
 *
 * @example
 * ```typescript
 * const jsPosts = await getEntriesByTag('blog', 'javascript');
 * ```
 */
export declare function getEntriesByTag(collection: string, tag: string, tagField?: string): Promise<CollectionEntry[]>;
/**
 * Get adjacent entries (previous/next) for pagination.
 *
 * @example
 * ```typescript
 * const { prev, next } = await getAdjacentEntries('blog', 'current-post', {
 *   sort: (a, b) => b.data.date.getTime() - a.data.date.getTime(),
 * });
 * ```
 */
export declare function getAdjacentEntries(collection: string, currentId: string, options?: {
    sort?: (a: CollectionEntry, b: CollectionEntry) => number;
    filter?: CollectionFilter<CollectionEntry>;
}): Promise<{
    prev: CollectionEntry | undefined;
    next: CollectionEntry | undefined;
}>;
/**
 * Resolve a reference to another collection entry.
 *
 * @example
 * ```typescript
 * const post = await getEntry('blog', 'my-post');
 * const author = await resolveReference(post.data.author);
 * ```
 */
export declare function resolveReference<TName extends string>(reference: {
    collection: TName;
    id: string;
}): Promise<CollectionEntry | undefined>;
/**
 * Group entries by a field value.
 * Uses ES2024 Object.groupBy for optimal performance.
 *
 * @example
 * ```typescript
 * const byYear = await groupBy('blog', (entry) =>
 *   entry.data.date.getFullYear().toString()
 * );
 * // { '2024': [...], '2023': [...] }
 * ```
 */
export declare function groupBy(collection: string, keyFn: (entry: CollectionEntry) => string, filter?: CollectionFilter<CollectionEntry>): Promise<Record<string, CollectionEntry[]>>;
/**
 * Count entries in a collection.
 *
 * @example
 * ```typescript
 * const total = await countEntries('blog');
 * const published = await countEntries('blog', ({ data }) => !data.draft);
 * ```
 */
export declare function countEntries(collection: string, filter?: CollectionFilter<CollectionEntry>): Promise<number>;
//# sourceMappingURL=query.d.ts.map