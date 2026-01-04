/**
 * PhilJS Content Collections - MDX Rendering
 *
 * Provides rendering capabilities for markdown and MDX content
 * with support for custom components, syntax highlighting, and more.
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
/**
 * Extract headings from markdown content
 */
function extractHeadings(content) {
    const headings = [];
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
        const depth = match[1].length;
        const text = match[2].trim();
        const slug = slugify(text);
        headings.push({ depth, text, slug });
    }
    return headings;
}
/**
 * Extract image references from markdown content
 */
function extractImages(content) {
    const images = [];
    // Standard markdown images: ![alt](src)
    const mdImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;
    while ((match = mdImageRegex.exec(content)) !== null) {
        images.push({
            src: match[2],
            alt: match[1] || '',
        });
    }
    // HTML images: <img src="..." alt="..." />
    const htmlImageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*(?:alt=["']([^"']*)["'])?[^>]*\/?>/gi;
    while ((match = htmlImageRegex.exec(content)) !== null) {
        images.push({
            src: match[1],
            alt: match[2] || '',
        });
    }
    return images;
}
/**
 * Calculate estimated reading time in minutes
 */
function calculateReadingTime(content) {
    // Average reading speed: 200-250 words per minute
    const wordsPerMinute = 225;
    // Remove code blocks
    const textOnly = content
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]+`/g, '');
    // Count words
    const wordCount = textOnly.trim().split(/\s+/).filter(Boolean).length;
    // Calculate minutes, minimum 1 minute
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}
/**
 * Convert text to URL-friendly slug
 */
function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '');
}
/**
 * Build table of contents from headings
 */
function buildTableOfContents(headings) {
    const toc = [];
    const stack = [toc];
    for (const heading of headings) {
        const entry = {
            depth: heading.depth,
            text: heading.text,
            slug: heading.slug,
            children: [],
        };
        // Find the right parent level
        while (stack.length > heading.depth) {
            stack.pop();
        }
        // Add to appropriate parent
        const parent = stack[stack.length - 1];
        parent.push(entry);
        // Push this entry's children array for potential nested headings
        if (heading.depth < 6) {
            stack.push(entry.children);
        }
    }
    return toc;
}
/**
 * Create a markdown processor with plugins
 */
function createProcessor(options = {}) {
    let processor = unified().use(remarkParse);
    // Add GFM support (tables, strikethrough, etc.)
    if (options.gfm !== false) {
        processor = processor.use(remarkGfm);
    }
    // Add MDX support
    processor = processor.use(remarkMdx);
    // Add custom remark plugins
    if (options.remarkPlugins) {
        for (const plugin of options.remarkPlugins) {
            processor = processor.use(plugin);
        }
    }
    // Convert to HTML
    processor = processor.use(remarkRehype, { allowDangerousHtml: true });
    // Add slugs to headings
    processor = processor.use(rehypeSlug);
    // Add anchor links to headings
    processor = processor.use(rehypeAutolinkHeadings, {
        behavior: 'wrap',
    });
    // Add custom rehype plugins
    if (options.rehypePlugins) {
        for (const plugin of options.rehypePlugins) {
            processor = processor.use(plugin);
        }
    }
    // Stringify to HTML
    processor = processor.use(rehypeStringify, { allowDangerousHtml: true });
    return processor;
}
/**
 * Compile markdown/MDX content to HTML
 */
async function compileContent(content, options = {}) {
    const processor = createProcessor(options);
    const result = await processor.process(content);
    return String(result);
}
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
export async function renderContent(content, _frontmatter = {}, options = {}) {
    // Extract metadata
    const headings = extractHeadings(content);
    const images = extractImages(content);
    const readingTime = calculateReadingTime(content);
    const tableOfContents = buildTableOfContents(headings);
    // Compile content to HTML
    const html = await compileContent(content, options);
    // Create the Content component
    const Content = (props) => {
        // In a real implementation, this would use PhilJS's JSX runtime
        // For now, we return an object that can be used by the framework
        return {
            type: 'philjs-content',
            html,
            components: props.components ?? options.components ?? {},
        };
    };
    return {
        Content,
        headings,
        images,
        readingTime,
        tableOfContents,
    };
}
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
export function createContentRenderer(defaultOptions = {}) {
    return async function render(content, frontmatter = {}, options = {}) {
        const mergedOptions = {
            ...defaultOptions,
            ...options,
            components: {
                ...defaultOptions.components,
                ...options.components,
            },
            remarkPlugins: [
                ...(defaultOptions.remarkPlugins ?? []),
                ...(options.remarkPlugins ?? []),
            ],
            rehypePlugins: [
                ...(defaultOptions.rehypePlugins ?? []),
                ...(options.rehypePlugins ?? []),
            ],
        };
        return renderContent(content, frontmatter, mergedOptions);
    };
}
/**
 * Render content to plain HTML string (for SSR).
 *
 * @example
 * ```typescript
 * const html = await renderToString(post.body);
 * ```
 */
export async function renderToString(content, options = {}) {
    return compileContent(content, options);
}
/**
 * Process content for search indexing.
 * Strips HTML and returns plain text.
 *
 * @example
 * ```typescript
 * const searchText = await processForSearch(post.body);
 * ```
 */
export async function processForSearch(content) {
    // Remove code blocks
    let text = content.replace(/```[\s\S]*?```/g, '');
    // Remove inline code
    text = text.replace(/`[^`]+`/g, '');
    // Remove markdown links, keep text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    // Remove images
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
    // Remove HTML tags
    text = text.replace(/<[^>]+>/g, '');
    // Remove heading markers
    text = text.replace(/^#{1,6}\s+/gm, '');
    // Remove emphasis markers
    text = text.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');
    // Remove blockquotes
    text = text.replace(/^>\s+/gm, '');
    // Collapse whitespace
    text = text.replace(/\s+/g, ' ').trim();
    return text;
}
/**
 * Get excerpt from content.
 *
 * @example
 * ```typescript
 * const excerpt = getExcerpt(post.body, 160);
 * ```
 */
export function getExcerpt(content, maxLength = 200) {
    // Remove code blocks
    let text = content.replace(/```[\s\S]*?```/g, '');
    // Remove inline code
    text = text.replace(/`[^`]+`/g, '');
    // Remove markdown links, keep text
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    // Remove images
    text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
    // Remove heading markers
    text = text.replace(/^#{1,6}\s+/gm, '');
    // Remove emphasis markers
    text = text.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');
    // Collapse whitespace
    text = text.replace(/\s+/g, ' ').trim();
    // Truncate
    if (text.length <= maxLength) {
        return text;
    }
    // Find a good break point (end of sentence or word)
    const truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.8) {
        return truncated.slice(0, lastSpace) + '...';
    }
    return truncated + '...';
}
/**
 * Default MDX components mapping.
 * These provide sensible defaults that can be overridden.
 */
export const defaultComponents = {
    // Headings
    h1: (props) => ({ type: 'h1', props }),
    h2: (props) => ({ type: 'h2', props }),
    h3: (props) => ({ type: 'h3', props }),
    h4: (props) => ({ type: 'h4', props }),
    h5: (props) => ({ type: 'h5', props }),
    h6: (props) => ({ type: 'h6', props }),
    // Block elements
    p: (props) => ({ type: 'p', props }),
    blockquote: (props) => ({ type: 'blockquote', props }),
    ul: (props) => ({ type: 'ul', props }),
    ol: (props) => ({ type: 'ol', props }),
    li: (props) => ({ type: 'li', props }),
    // Inline elements
    a: (props) => ({ type: 'a', props }),
    strong: (props) => ({ type: 'strong', props }),
    em: (props) => ({ type: 'em', props }),
    code: (props) => ({ type: 'code', props }),
    // Code blocks
    pre: (props) => ({ type: 'pre', props }),
    // Tables
    table: (props) => ({ type: 'table', props }),
    thead: (props) => ({ type: 'thead', props }),
    tbody: (props) => ({ type: 'tbody', props }),
    tr: (props) => ({ type: 'tr', props }),
    th: (props) => ({ type: 'th', props }),
    td: (props) => ({ type: 'td', props }),
    // Media
    img: (props) => ({ type: 'img', props }),
    hr: (props) => ({ type: 'hr', props }),
};
//# sourceMappingURL=render.js.map