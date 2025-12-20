/**
 * PhilJS Content Collections
 *
 * Astro-style content collections for PhilJS with type-safe schemas,
 * MDX support, and build-time optimization.
 *
 * @example
 * ```typescript
 * // content/config.ts
 * import { defineCollection, z } from 'philjs-content';
 *
 * const blog = defineCollection({
 *   type: 'content',
 *   schema: z.object({
 *     title: z.string(),
 *     date: z.date(),
 *     author: z.string(),
 *     tags: z.array(z.string()).optional(),
 *     draft: z.boolean().default(false),
 *   }),
 * });
 *
 * export const collections = { blog };
 * ```
 *
 * @example
 * ```typescript
 * // In your component
 * import { getCollection, getEntry } from 'philjs-content';
 *
 * const posts = await getCollection('blog', ({ data }) => !data.draft);
 * const post = await getEntry('blog', 'my-first-post');
 *
 * const { Content, headings } = await post.render();
 * ```
 *
 * @packageDocumentation
 */

// Re-export Zod for convenience
export { z } from 'zod';

// Collection definition
export {
  defineCollection,
  defineCollections,
  reference,
  schemas,
  getContentStore,
  initializeStore,
  resetStore,
  isStoreInitialized,
  getCollectionConfig,
  validateEntryData,
  transformDates,
  slugFromPath,
  idFromPath,
} from './collection.js';

// Query functions
export {
  getCollection,
  getEntry,
  getEntries,
  getEntryBySlug,
  getCollectionTags,
  getEntriesByTag,
  getAdjacentEntries,
  resolveReference,
  groupBy,
  countEntries,
  hasCollection,
  getCollectionNames,
  setContentDir,
  getContentDir,
  setCollectionsConfig,
} from './query.js';

// Rendering
export {
  renderContent,
  renderToString,
  createContentRenderer,
  processForSearch,
  getExcerpt,
  defaultComponents,
} from './render.js';

// Types
export type {
  // Collection types
  CollectionType,
  CollectionConfig,
  CollectionDefinition,
  CollectionsConfig,
  InferCollectionData,

  // Entry types
  CollectionEntry,
  ContentEntry,
  DataEntry,
  CollectionReference,
  ReferenceSchema,

  // Content metadata
  ContentHeading,
  ContentImage,
  TOCEntry,

  // Rendering types
  RenderResult,
  MDXComponents,
  MDXComponentProps,
  MDXCompileOptions,

  // Query types
  CollectionFilter,
  CollectionSort,
  GetCollectionOptions,

  // Store types
  ContentStore,

  // Plugin types
  ContentPluginOptions,
  ImageOptimizationOptions,

  // Build types
  ProcessedContent,
  ContentValidationError,
  ContentBuildResult,

  // Helper types
  CollectionNames,
  CollectionEntryType,
  CommonFrontmatter,

  // Watch types
  ContentWatchEvent,
  ContentWatchCallback,
} from './types.js';

// Vite plugin (separate export for tree-shaking)
// Use: import { contentPlugin } from 'philjs-content/vite'
