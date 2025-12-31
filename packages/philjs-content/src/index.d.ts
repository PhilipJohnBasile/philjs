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
export { z } from 'zod';
export { defineCollection, defineCollections, reference, schemas, getContentStore, initializeStore, resetStore, isStoreInitialized, getCollectionConfig, validateEntryData, transformDates, slugFromPath, idFromPath, } from './collection.js';
export { getCollection, getEntry, getEntries, getEntryBySlug, getCollectionTags, getEntriesByTag, getAdjacentEntries, resolveReference, groupBy, countEntries, hasCollection, getCollectionNames, setContentDir, getContentDir, setCollectionsConfig, } from './query.js';
export { renderContent, renderToString, createContentRenderer, processForSearch, getExcerpt, defaultComponents, } from './render.js';
export type { CollectionType, CollectionConfig, CollectionDefinition, CollectionsConfig, InferCollectionData, CollectionEntry, ContentEntry, DataEntry, CollectionReference, ReferenceSchema, ContentHeading, ContentImage, TOCEntry, RenderResult, MDXComponents, MDXComponentProps, MDXCompileOptions, CollectionFilter, CollectionSort, GetCollectionOptions, ContentStore, ContentPluginOptions, ImageOptimizationOptions, ProcessedContent, ContentValidationError, ContentBuildResult, CollectionNames, CollectionEntryType, CommonFrontmatter, ContentWatchEvent, ContentWatchCallback, } from './types.js';
//# sourceMappingURL=index.d.ts.map