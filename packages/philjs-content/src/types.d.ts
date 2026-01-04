/**
 * PhilJS Content Collections - Type Definitions
 *
 * Provides type-safe content collections similar to Astro's content collections,
 * with full Zod schema validation and TypeScript inference.
 */
import type { z, ZodType, ZodObject } from 'zod';
export { z } from 'zod';
/**
 * Collection types
 * - 'content': Markdown/MDX files with frontmatter
 * - 'data': JSON/YAML data files
 */
export type CollectionType = 'content' | 'data';
/**
 * Configuration for a content collection
 */
export interface CollectionConfig<TType extends CollectionType = CollectionType, TSchema extends ZodType = ZodType> {
    /** Collection type: 'content' for markdown/mdx, 'data' for json/yaml */
    type: TType;
    /** Zod schema for validating entry data/frontmatter */
    schema: TSchema;
    /** Optional custom directory path (relative to content folder) */
    directory?: string;
}
/**
 * Result of defineCollection()
 */
export interface CollectionDefinition<TType extends CollectionType = CollectionType, TSchema extends ZodType = ZodType> {
    type: TType;
    schema: TSchema;
    directory?: string;
    _brand: 'CollectionDefinition';
}
/**
 * Map of collection names to their definitions
 */
export type CollectionsConfig = Record<string, CollectionDefinition>;
/**
 * Infer the data type from a collection's schema
 */
export type InferCollectionData<T extends CollectionDefinition> = T['schema'] extends ZodType ? z.infer<T['schema']> : never;
/**
 * Heading extracted from content
 */
export interface ContentHeading {
    /** Heading depth (1-6) */
    depth: number;
    /** Heading text content */
    text: string;
    /** URL-friendly slug */
    slug: string;
}
/**
 * Image reference found in content
 */
export interface ContentImage {
    /** Source path or URL */
    src: string;
    /** Alt text */
    alt: string;
    /** Image width (if available) */
    width?: number;
    /** Image height (if available) */
    height?: number;
}
/**
 * A content entry (markdown/mdx)
 */
export interface ContentEntry<TData = Record<string, unknown>> {
    /** Entry type */
    type: 'content';
    /** Unique identifier (slug/path) */
    id: string;
    /** URL-friendly slug */
    slug: string;
    /** Collection name */
    collection: string;
    /** Validated frontmatter data */
    data: TData;
    /** Raw markdown/mdx content body */
    body: string;
    /** File path relative to content directory */
    filePath: string;
    /** File modification time */
    modifiedTime: Date;
    /** Render the content to a component */
    render(): Promise<RenderResult>;
}
/**
 * A data entry (json/yaml)
 */
export interface DataEntry<TData = Record<string, unknown>> {
    /** Entry type */
    type: 'data';
    /** Unique identifier */
    id: string;
    /** Collection name */
    collection: string;
    /** Validated data */
    data: TData;
    /** File path relative to content directory */
    filePath: string;
    /** File modification time */
    modifiedTime: Date;
}
/**
 * Union of all entry types
 */
export type CollectionEntry<TData = Record<string, unknown>> = ContentEntry<TData> | DataEntry<TData>;
/**
 * Props for custom MDX components
 */
export interface MDXComponentProps {
    children?: unknown;
    [key: string]: unknown;
}
/**
 * Map of component names to their implementations
 */
export type MDXComponents = Record<string, (props: MDXComponentProps) => unknown>;
/**
 * Result of rendering content
 */
export interface RenderResult {
    /** Rendered content as a PhilJS component */
    Content: (props: {
        components?: MDXComponents;
    }) => unknown;
    /** Headings extracted from content */
    headings: ContentHeading[];
    /** Images found in content */
    images: ContentImage[];
    /** Estimated reading time in minutes */
    readingTime: number;
    /** Table of contents */
    tableOfContents: TOCEntry[];
}
/**
 * Table of contents entry
 */
export interface TOCEntry {
    /** Heading depth (1-6) */
    depth: number;
    /** Heading text */
    text: string;
    /** URL-friendly slug */
    slug: string;
    /** Child entries */
    children: TOCEntry[];
}
/**
 * Filter function for collection queries
 */
export type CollectionFilter<TEntry extends CollectionEntry> = (entry: TEntry) => boolean;
/**
 * Sort function for collection queries
 */
export type CollectionSort<TEntry extends CollectionEntry> = (a: TEntry, b: TEntry) => number;
/**
 * Options for getCollection query
 */
export interface GetCollectionOptions<TEntry extends CollectionEntry> {
    /** Filter entries */
    filter?: CollectionFilter<TEntry>;
    /** Sort entries */
    sort?: CollectionSort<TEntry>;
    /** Limit number of results */
    limit?: number;
    /** Skip first N results */
    offset?: number;
}
/**
 * Reference to another collection entry
 */
export interface CollectionReference<TCollection extends string = string> {
    collection: TCollection;
    id: string;
}
/**
 * Zod schema helper for collection references
 */
export type ReferenceSchema<TCollection extends string> = ZodObject<{
    collection: z.ZodLiteral<TCollection>;
    id: z.ZodString;
}>;
/**
 * Content store - internal storage for loaded content
 */
export interface ContentStore {
    /** All loaded collections */
    collections: Map<string, Map<string, CollectionEntry>>;
    /** Collection configurations */
    configs: Map<string, CollectionDefinition>;
    /** Whether the store has been initialized */
    initialized: boolean;
}
/**
 * Vite plugin options
 */
export interface ContentPluginOptions {
    /** Content directory path (default: './content') */
    contentDir?: string;
    /** Generated types output path (default: './.philjs/content-types.d.ts') */
    typesOutput?: string;
    /** Enable hot module replacement for content */
    hmr?: boolean;
    /** Enable image optimization */
    optimizeImages?: boolean;
    /** Image optimization options */
    imageOptions?: ImageOptimizationOptions;
    /** Custom remark plugins */
    remarkPlugins?: unknown[];
    /** Custom rehype plugins */
    rehypePlugins?: unknown[];
    /** Watch for file changes in development */
    watch?: boolean;
}
/**
 * Image optimization options
 */
export interface ImageOptimizationOptions {
    /** Output formats to generate */
    formats?: ('webp' | 'avif' | 'png' | 'jpg')[];
    /** Sizes to generate for responsive images */
    sizes?: number[];
    /** Quality setting (1-100) */
    quality?: number;
    /** Enable lazy loading */
    lazyLoad?: boolean;
    /** Output directory for optimized images */
    outputDir?: string;
}
/**
 * Processed content file metadata
 */
export interface ProcessedContent {
    /** File path */
    path: string;
    /** Collection name */
    collection: string;
    /** Entry ID/slug */
    id: string;
    /** Frontmatter data */
    frontmatter: Record<string, unknown>;
    /** Content body */
    body: string;
    /** Headings */
    headings: ContentHeading[];
    /** Images */
    images: ContentImage[];
    /** File modification time */
    mtime: Date;
}
/**
 * Content validation error
 */
export interface ContentValidationError {
    /** Collection name */
    collection: string;
    /** Entry ID */
    entryId: string;
    /** File path */
    filePath: string;
    /** Validation errors */
    errors: z.ZodError['errors'];
}
/**
 * Content build result
 */
export interface ContentBuildResult {
    /** Successfully processed entries */
    entries: ProcessedContent[];
    /** Validation errors */
    errors: ContentValidationError[];
    /** Generated type definitions */
    types: string;
    /** Build duration in ms */
    duration: number;
}
/**
 * Helper type to extract collection names from a config
 */
export type CollectionNames<T extends CollectionsConfig> = keyof T & string;
/**
 * Helper type to extract entry type for a specific collection
 */
export type CollectionEntryType<TConfig extends CollectionsConfig, TName extends CollectionNames<TConfig>> = TConfig[TName]['type'] extends 'content' ? ContentEntry<InferCollectionData<TConfig[TName]>> : DataEntry<InferCollectionData<TConfig[TName]>>;
/**
 * Frontmatter schema with common fields
 */
export interface CommonFrontmatter {
    title?: string;
    description?: string;
    date?: Date;
    draft?: boolean;
    tags?: string[];
}
/**
 * MDX compilation options
 */
export interface MDXCompileOptions {
    /** Custom components to use */
    components?: MDXComponents;
    /** Remark plugins */
    remarkPlugins?: unknown[];
    /** Rehype plugins */
    rehypePlugins?: unknown[];
    /** Enable GFM (GitHub Flavored Markdown) */
    gfm?: boolean;
    /** Code highlighting theme */
    syntaxHighlightTheme?: string;
}
/**
 * Content watcher events
 */
export type ContentWatchEvent = {
    type: 'add';
    path: string;
    collection: string;
} | {
    type: 'change';
    path: string;
    collection: string;
} | {
    type: 'unlink';
    path: string;
    collection: string;
};
/**
 * Content watcher callback
 */
export type ContentWatchCallback = (event: ContentWatchEvent) => void;
//# sourceMappingURL=types.d.ts.map