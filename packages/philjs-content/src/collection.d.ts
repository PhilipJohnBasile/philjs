/**
 * PhilJS Content Collections - Collection Definition
 *
 * Provides the defineCollection function for creating type-safe content collections
 * with Zod schema validation.
 */
import { z } from 'zod';
import type { ZodType } from 'zod';
import type { CollectionType, CollectionConfig, CollectionDefinition, CollectionsConfig, ReferenceSchema, ContentStore } from './types.js';
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
export declare function defineCollection<TType extends CollectionType, TSchema extends ZodType>(config: CollectionConfig<TType, TSchema>): CollectionDefinition<TType, TSchema>;
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
export declare function reference<TCollection extends string>(collection: TCollection): ReferenceSchema<TCollection>;
/**
 * Get the global content store
 */
export declare function getContentStore(): ContentStore;
/**
 * Initialize the content store with collection configurations
 */
export declare function initializeStore(collections: CollectionsConfig): void;
/**
 * Reset the content store (useful for testing)
 */
export declare function resetStore(): void;
/**
 * Check if the store has been initialized
 */
export declare function isStoreInitialized(): boolean;
/**
 * Get collection configuration by name
 */
export declare function getCollectionConfig(name: string): CollectionDefinition | undefined;
/**
 * Validate entry data against collection schema
 */
export declare function validateEntryData<TSchema extends ZodType>(schema: TSchema, data: unknown): z.SafeParseReturnType<unknown, z.infer<TSchema>>;
/**
 * Transform date strings to Date objects in frontmatter
 */
export declare function transformDates(data: Record<string, unknown>): Record<string, unknown>;
/**
 * Generate a slug from a file path
 */
export declare function slugFromPath(filePath: string): string;
/**
 * Generate ID from file path
 */
export declare function idFromPath(filePath: string, basePath: string): string;
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
export declare function defineCollections<T extends CollectionsConfig>(collections: T): T;
/**
 * Common schema helpers
 */
export declare const schemas: {
    /**
     * Standard blog post schema
     */
    blogPost: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        date: z.ZodCoercedDate<unknown>;
        updatedDate: z.ZodOptional<z.ZodCoercedDate<unknown>>;
        author: z.ZodOptional<z.ZodString>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
        draft: z.ZodDefault<z.ZodBoolean>;
        image: z.ZodOptional<z.ZodString>;
        imageAlt: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    /**
     * Standard author schema
     */
    author: z.ZodObject<{
        name: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        avatar: z.ZodOptional<z.ZodString>;
        bio: z.ZodOptional<z.ZodString>;
        social: z.ZodOptional<z.ZodObject<{
            twitter: z.ZodOptional<z.ZodString>;
            github: z.ZodOptional<z.ZodString>;
            linkedin: z.ZodOptional<z.ZodString>;
            website: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
    }, z.core.$strip>;
    /**
     * Standard documentation page schema
     */
    docs: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        sidebar_position: z.ZodOptional<z.ZodNumber>;
        sidebar_label: z.ZodOptional<z.ZodString>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
        draft: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>;
    /**
     * Standard changelog entry schema
     */
    changelog: z.ZodObject<{
        version: z.ZodString;
        date: z.ZodCoercedDate<unknown>;
        breaking: z.ZodDefault<z.ZodBoolean>;
        features: z.ZodDefault<z.ZodArray<z.ZodString>>;
        fixes: z.ZodDefault<z.ZodArray<z.ZodString>>;
        deprecated: z.ZodDefault<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
};
//# sourceMappingURL=collection.d.ts.map