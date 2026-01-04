/**
 * PhilJS Content Collections - MDX Rendering
 *
 * Provides rendering capabilities for markdown and MDX content
 * with support for custom components, syntax highlighting, and more.
 */
import type { RenderResult, MDXComponents, MDXCompileOptions } from './types.js';
/**
 * Render markdown/MDX content to a PhilJS-compatible result.
 *
 * @example
 * ```typescript
 * const { Content, headings, readingTime } = await renderContent(
 *   post.body,
 *   post.data
 * );
 *
 * // Use in component
 * <Content components={{ h1: CustomH1, code: CodeBlock }} />
 * ```
 */
export declare function renderContent(content: string, _frontmatter?: Record<string, unknown>, options?: MDXCompileOptions): Promise<RenderResult>;
/**
 * Create a content renderer with preset options.
 *
 * @example
 * ```typescript
 * const render = createContentRenderer({
 *   components: { code: CodeBlock },
 *   remarkPlugins: [remarkMath],
 *   rehypePlugins: [rehypeKatex],
 * });
 *
 * const { Content } = await render(post.body);
 * ```
 */
export declare function createContentRenderer(defaultOptions?: MDXCompileOptions): (content: string, frontmatter?: Record<string, unknown>, options?: MDXCompileOptions) => Promise<RenderResult>;
/**
 * Render content to plain HTML string (for SSR).
 *
 * @example
 * ```typescript
 * const html = await renderToString(post.body);
 * ```
 */
export declare function renderToString(content: string, options?: MDXCompileOptions): Promise<string>;
/**
 * Process content for search indexing.
 * Strips HTML and returns plain text.
 *
 * @example
 * ```typescript
 * const searchText = await processForSearch(post.body);
 * ```
 */
export declare function processForSearch(content: string): Promise<string>;
/**
 * Get excerpt from content.
 *
 * @example
 * ```typescript
 * const excerpt = getExcerpt(post.body, 160);
 * ```
 */
export declare function getExcerpt(content: string, maxLength?: number): string;
/**
 * Default MDX components mapping.
 * These provide sensible defaults that can be overridden.
 */
export declare const defaultComponents: MDXComponents;
//# sourceMappingURL=render.d.ts.map