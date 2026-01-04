/**
 * PhilJS Content Collections - Collection Definition
 *
 * Provides the defineCollection function for creating type-safe content collections
 * with Zod schema validation.
 */
import { z } from 'zod';
// Re-export Zod for convenience in content/config.ts files
export { z } from 'zod';
/**
 * Define a content collection with type-safe schema validation.
 *
 * @example
 * ```typescript
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
 */
export function defineCollection(config) {
    return {
        type: config.type,
        schema: config.schema,
        _brand: 'CollectionDefinition',
        ...(config.directory !== undefined && { directory: config.directory }),
    };
}
/**
 * Create a reference to another collection entry.
 * Useful for relationships between content types.
 *
 * @example
 * ```typescript
 * const posts = defineCollection({
 *   type: 'content',
 *   schema: z.object({
 *     title: z.string(),
 *     author: reference('authors'), // Reference to authors collection
 *   }),
 * });
 * ```
 */
export function reference(collection) {
    return z.object({
        collection: z.literal(collection),
        id: z.string(),
    });
}
/**
 * Global content store for managing loaded collections
 */
const globalStore = {
    collections: new Map(),
    configs: new Map(),
    initialized: false,
};
/**
 * Get the global content store
 */
export function getContentStore() {
    return globalStore;
}
/**
 * Initialize the content store with collection configurations
 */
export function initializeStore(collections) {
    globalStore.configs.clear();
    globalStore.collections.clear();
    for (const [name, config] of Object.entries(collections)) {
        globalStore.configs.set(name, config);
        globalStore.collections.set(name, new Map());
    }
    globalStore.initialized = true;
}
/**
 * Reset the content store (useful for testing)
 */
export function resetStore() {
    globalStore.collections.clear();
    globalStore.configs.clear();
    globalStore.initialized = false;
}
/**
 * Check if the store has been initialized
 */
export function isStoreInitialized() {
    return globalStore.initialized;
}
/**
 * Get collection configuration by name
 */
export function getCollectionConfig(name) {
    return globalStore.configs.get(name);
}
/**
 * Validate entry data against collection schema
 */
export function validateEntryData(schema, data) {
    return schema.safeParse(data);
}
/**
 * Transform date strings to Date objects in frontmatter
 */
export function transformDates(data) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            // Try to parse as ISO date
            const date = new Date(value);
            if (!isNaN(date.getTime()) && isISODateString(value)) {
                result[key] = date;
            }
            else {
                result[key] = value;
            }
        }
        else if (value && typeof value === 'object' && !Array.isArray(value)) {
            result[key] = transformDates(value);
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
/**
 * Check if a string looks like an ISO date
 */
function isISODateString(value) {
    // Match ISO 8601 date formats
    const isoDatePattern = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:?\d{2})?)?$/;
    return isoDatePattern.test(value);
}
/**
 * Generate a slug from a file path
 */
export function slugFromPath(filePath) {
    // Remove file extension
    const withoutExt = filePath.replace(/\.(md|mdx|json|yaml|yml)$/i, '');
    // Convert to URL-friendly slug
    return withoutExt
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-\/]/g, '')
        .replace(/\/+/g, '/')
        .replace(/^\/|\/$/g, '');
}
/**
 * Generate ID from file path
 */
export function idFromPath(filePath, basePath) {
    // Remove base path prefix
    let relativePath = filePath;
    if (filePath.startsWith(basePath)) {
        relativePath = filePath.slice(basePath.length);
    }
    // Remove leading slash
    relativePath = relativePath.replace(/^[\/\\]/, '');
    // Remove file extension
    return relativePath.replace(/\.(md|mdx|json|yaml|yml)$/i, '');
}
/**
 * Helper to define collections config export
 *
 * @example
 * ```typescript
 * // content/config.ts
 * import { defineCollections, defineCollection, z } from 'philjs-content';
 *
 * export const collections = defineCollections({
 *   blog: defineCollection({
 *     type: 'content',
 *     schema: z.object({ title: z.string() }),
 *   }),
 *   authors: defineCollection({
 *     type: 'data',
 *     schema: z.object({ name: z.string() }),
 *   }),
 * });
 * ```
 */
export function defineCollections(collections) {
    return collections;
}
/**
 * Common schema helpers
 */
export const schemas = {
    /**
     * Standard blog post schema
     */
    blogPost: z.object({
        title: z.string(),
        description: z.string().optional(),
        date: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        author: z.string().optional(),
        tags: z.array(z.string()).default([]),
        draft: z.boolean().default(false),
        image: z.string().optional(),
        imageAlt: z.string().optional(),
    }),
    /**
     * Standard author schema
     */
    author: z.object({
        name: z.string(),
        email: z.string().email().optional(),
        avatar: z.string().url().optional(),
        bio: z.string().optional(),
        social: z.object({
            twitter: z.string().optional(),
            github: z.string().optional(),
            linkedin: z.string().optional(),
            website: z.string().url().optional(),
        }).optional(),
    }),
    /**
     * Standard documentation page schema
     */
    docs: z.object({
        title: z.string(),
        description: z.string().optional(),
        sidebar_position: z.number().optional(),
        sidebar_label: z.string().optional(),
        tags: z.array(z.string()).default([]),
        draft: z.boolean().default(false),
    }),
    /**
     * Standard changelog entry schema
     */
    changelog: z.object({
        version: z.string(),
        date: z.coerce.date(),
        breaking: z.boolean().default(false),
        features: z.array(z.string()).default([]),
        fixes: z.array(z.string()).default([]),
        deprecated: z.array(z.string()).default([]),
    }),
};
//# sourceMappingURL=collection.js.map