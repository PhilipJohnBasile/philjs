/**
 * PhilJS Content Collections - Query Functions
 *
 * Provides type-safe functions for querying content collections.
 */

import { globby } from 'globby';
import matter from 'gray-matter';
import { readFile, stat } from 'node:fs/promises';
import { join, relative, extname, basename, dirname } from 'node:path';
import { z } from 'zod';
import type {
  CollectionEntry,
  ContentEntry,
  DataEntry,
  CollectionFilter,
  GetCollectionOptions,
  CollectionsConfig,
  CollectionNames,
  CollectionEntryType,
  InferCollectionData,
  CollectionDefinition,
  RenderResult,
} from './types.js';
import {
  getContentStore,
  getCollectionConfig,
  validateEntryData,
  transformDates,
  slugFromPath,
  idFromPath,
} from './collection.js';
import { renderContent } from './render.js';

// Module-level configuration
let contentDir = './content';
let collectionsConfig: CollectionsConfig | null = null;

/**
 * Configure the content directory path
 */
export function setContentDir(dir: string): void {
  contentDir = dir;
}

/**
 * Get the current content directory path
 */
export function getContentDir(): string {
  return contentDir;
}

/**
 * Set the collections configuration
 */
export function setCollectionsConfig(config: CollectionsConfig): void {
  collectionsConfig = config;
}

/**
 * Get file patterns for a collection type
 */
function getFilePatterns(type: 'content' | 'data'): string[] {
  if (type === 'content') {
    return ['**/*.md', '**/*.mdx'];
  }
  return ['**/*.json', '**/*.yaml', '**/*.yml'];
}

/**
 * Parse a content file (markdown/mdx)
 */
async function parseContentFile(
  filePath: string,
  collectionName: string,
  basePath: string
): Promise<ContentEntry> {
  const content = await readFile(filePath, 'utf-8');
  const { data: frontmatter, content: body } = matter(content);
  const stats = await stat(filePath);

  const id = idFromPath(filePath, basePath);
  const slug = slugFromPath(id);

  // Transform date strings to Date objects
  const transformedData = transformDates(frontmatter);

  return {
    type: 'content',
    id,
    slug,
    collection: collectionName,
    data: transformedData,
    body,
    filePath: relative(basePath, filePath),
    modifiedTime: stats.mtime,
    render: async () => renderContent(body, transformedData),
  };
}

/**
 * Parse a data file (json/yaml)
 */
async function parseDataFile(
  filePath: string,
  collectionName: string,
  basePath: string
): Promise<DataEntry> {
  const content = await readFile(filePath, 'utf-8');
  const stats = await stat(filePath);
  const ext = extname(filePath).toLowerCase();

  let data: Record<string, unknown>;

  if (ext === '.json') {
    data = JSON.parse(content);
  } else if (ext === '.yaml' || ext === '.yml') {
    // Use gray-matter to parse YAML
    const parsed = matter(`---\n${content}\n---`);
    data = parsed.data;
  } else {
    throw new Error(`Unsupported data file format: ${ext}`);
  }

  const id = idFromPath(filePath, basePath);

  // Transform date strings to Date objects
  const transformedData = transformDates(data);

  return {
    type: 'data',
    id,
    collection: collectionName,
    data: transformedData,
    filePath: relative(basePath, filePath),
    modifiedTime: stats.mtime,
  };
}

/**
 * Load all entries for a collection from disk
 */
async function loadCollectionEntries(
  collectionName: string,
  config: CollectionDefinition
): Promise<CollectionEntry[]> {
  const collectionDir = join(contentDir, config.directory ?? collectionName);
  const patterns = getFilePatterns(config.type);

  try {
    const files = await globby(patterns, {
      cwd: collectionDir,
      absolute: true,
    });

    const entries: CollectionEntry[] = [];

    for (const filePath of files) {
      try {
        let entry: CollectionEntry;

        if (config.type === 'content') {
          entry = await parseContentFile(filePath, collectionName, collectionDir);
        } else {
          entry = await parseDataFile(filePath, collectionName, collectionDir);
        }

        // Validate against schema
        const result = validateEntryData(config.schema, entry.data);

        if (result.success) {
          entry.data = result.data as Record<string, unknown>;
          entries.push(entry);
        } else {
          console.warn(
            `[philjs-content] Validation failed for ${filePath}:`,
            result.error.format()
          );
        }
      } catch (error) {
        console.error(`[philjs-content] Failed to parse ${filePath}:`, error);
      }
    }

    return entries;
  } catch {
    // Collection directory doesn't exist
    return [];
  }
}

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
export async function getCollection<TName extends string>(
  collection: TName,
  filterOrOptions?: CollectionFilter<CollectionEntry> | GetCollectionOptions<CollectionEntry>
): Promise<CollectionEntry[]> {
  // Get collection config
  const config = collectionsConfig?.[collection] ?? getCollectionConfig(collection);

  if (!config) {
    throw new Error(
      `[philjs-content] Collection "${collection}" not found. ` +
      `Make sure it's defined in your content/config.ts file.`
    );
  }

  // Load entries from disk
  let entries = await loadCollectionEntries(collection, config);

  // Handle filter function or options object
  let filter: CollectionFilter<CollectionEntry> | undefined;
  let sort: ((a: CollectionEntry, b: CollectionEntry) => number) | undefined;
  let limit: number | undefined;
  let offset: number | undefined;

  if (typeof filterOrOptions === 'function') {
    filter = filterOrOptions;
  } else if (filterOrOptions) {
    filter = filterOrOptions.filter;
    sort = filterOrOptions.sort;
    limit = filterOrOptions.limit;
    offset = filterOrOptions.offset;
  }

  // Apply filter
  if (filter) {
    entries = entries.filter(filter);
  }

  // Apply sort (ES2023+ toSorted for non-mutating sort)
  if (sort) {
    entries = entries.toSorted(sort);
  }

  // Apply offset and limit
  if (offset !== undefined || limit !== undefined) {
    const start = offset ?? 0;
    const end = limit !== undefined ? start + limit : undefined;
    entries = entries.slice(start, end);
  }

  return entries;
}

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
export async function getEntry<TName extends string>(
  collection: TName,
  id: string
): Promise<CollectionEntry | undefined> {
  // Get collection config
  const config = collectionsConfig?.[collection] ?? getCollectionConfig(collection);

  if (!config) {
    throw new Error(
      `[philjs-content] Collection "${collection}" not found. ` +
      `Make sure it's defined in your content/config.ts file.`
    );
  }

  // Load all entries and find the matching one
  const entries = await loadCollectionEntries(collection, config);

  return entries.find((entry) => entry.id === id || entry.id === id.replace(/\//g, '\\'));
}

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
export async function getEntries(
  references: Array<{ collection: string; id: string }>
): Promise<CollectionEntry[]> {
  const entries: CollectionEntry[] = [];

  for (const ref of references) {
    const entry = await getEntry(ref.collection, ref.id);
    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
}

/**
 * Check if a collection exists.
 */
export function hasCollection(collection: string): boolean {
  return (
    collectionsConfig?.[collection] !== undefined ||
    getCollectionConfig(collection) !== undefined
  );
}

/**
 * Get all collection names.
 */
export function getCollectionNames(): string[] {
  if (collectionsConfig) {
    return Object.keys(collectionsConfig);
  }

  const store = getContentStore();
  return Array.from(store.configs.keys());
}

/**
 * Get entry by slug (for content collections).
 * This is a convenience function that matches by slug instead of id.
 *
 * @example
 * ```typescript
 * const post = await getEntryBySlug('blog', 'my-first-post');
 * ```
 */
export async function getEntryBySlug<TName extends string>(
  collection: TName,
  slug: string
): Promise<ContentEntry | undefined> {
  const config = collectionsConfig?.[collection] ?? getCollectionConfig(collection);

  if (!config) {
    throw new Error(
      `[philjs-content] Collection "${collection}" not found.`
    );
  }

  if (config.type !== 'content') {
    throw new Error(
      `[philjs-content] getEntryBySlug only works with content collections. ` +
      `"${collection}" is a data collection.`
    );
  }

  const entries = await loadCollectionEntries(collection, config);

  return entries.find(
    (entry) => entry.type === 'content' && entry.slug === slug
  ) as ContentEntry | undefined;
}

/**
 * Get all unique tags from a collection.
 *
 * @example
 * ```typescript
 * const tags = await getCollectionTags('blog');
 * // ['javascript', 'typescript', 'react', ...]
 * ```
 */
export async function getCollectionTags(
  collection: string,
  tagField: string = 'tags'
): Promise<string[]> {
  const entries = await getCollection(collection);

  const tagSet = new Set<string>();

  for (const entry of entries) {
    const tags = entry.data[tagField];
    if (Array.isArray(tags)) {
      for (const tag of tags) {
        if (typeof tag === 'string') {
          tagSet.add(tag);
        }
      }
    }
  }

  return Array.from(tagSet).toSorted();
}

/**
 * Get entries by tag.
 *
 * @example
 * ```typescript
 * const jsPosts = await getEntriesByTag('blog', 'javascript');
 * ```
 */
export async function getEntriesByTag(
  collection: string,
  tag: string,
  tagField: string = 'tags'
): Promise<CollectionEntry[]> {
  return getCollection(collection, (entry) => {
    const tags = entry.data[tagField];
    return Array.isArray(tags) && tags.includes(tag);
  });
}

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
export async function getAdjacentEntries(
  collection: string,
  currentId: string,
  options?: {
    sort?: (a: CollectionEntry, b: CollectionEntry) => number;
    filter?: CollectionFilter<CollectionEntry>;
  }
): Promise<{ prev: CollectionEntry | undefined; next: CollectionEntry | undefined }> {
  const collectionOptions: GetCollectionOptions<CollectionEntry> = {};
  if (options?.filter) {
    collectionOptions.filter = options.filter;
  }
  if (options?.sort) {
    collectionOptions.sort = options.sort;
  }
  const entries = await getCollection(collection, collectionOptions);

  const currentIndex = entries.findIndex((e) => e.id === currentId);

  if (currentIndex === -1) {
    return { prev: undefined, next: undefined };
  }

  return {
    prev: entries[currentIndex - 1],
    next: entries[currentIndex + 1],
  };
}

/**
 * Resolve a reference to another collection entry.
 *
 * @example
 * ```typescript
 * const post = await getEntry('blog', 'my-post');
 * const author = await resolveReference(post.data.author);
 * ```
 */
export async function resolveReference<TName extends string>(
  reference: { collection: TName; id: string }
): Promise<CollectionEntry | undefined> {
  return getEntry(reference.collection, reference.id);
}

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
export async function groupBy(
  collection: string,
  keyFn: (entry: CollectionEntry) => string,
  filter?: CollectionFilter<CollectionEntry>
): Promise<Record<string, CollectionEntry[]>> {
  const entries = await getCollection(collection, filter);

  // ES2024: Use native Object.groupBy
  return Object.groupBy(entries, keyFn) as Record<string, CollectionEntry[]>;
}

/**
 * Count entries in a collection.
 *
 * @example
 * ```typescript
 * const total = await countEntries('blog');
 * const published = await countEntries('blog', ({ data }) => !data.draft);
 * ```
 */
export async function countEntries(
  collection: string,
  filter?: CollectionFilter<CollectionEntry>
): Promise<number> {
  const entries = await getCollection(collection, filter);
  return entries.length;
}
