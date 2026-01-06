/**
 * PhilJS Static Site Generator
 *
 * A comprehensive static site generation framework with content collections,
 * Markdown/MDX support, image optimization, and more.
 *
 * @example
 * ```typescript
 * import {
 *   defineSSGConfig,
 *   createContentCollection,
 *   generateStaticSite,
 *   generateSitemap,
 * } from '@philjs/ssg';
 *
 * const config = defineSSGConfig({
 *   outDir: 'dist',
 *   routes: ['/'],
 *   content: {
 *     collections: ['blog', 'docs'],
 *   },
 * });
 * ```
 */

import { signal, computed, effect, type Signal, type Computed } from '@philjs/core';

// ============================================================================
// Types
// ============================================================================

export interface SSGConfig {
  /** Output directory */
  outDir?: string;
  /** Static routes to generate */
  routes?: string[] | (() => Promise<string[]>);
  /** Enable prerendering */
  prerender?: boolean;
  /** Content configuration */
  content?: ContentConfig;
  /** Build configuration */
  build?: BuildConfig;
  /** Image optimization configuration */
  images?: ImageConfig;
  /** SEO configuration */
  seo?: SEOConfig;
  /** Base URL for the site */
  baseUrl?: string;
  /** Trailing slash behavior */
  trailingSlash?: boolean;
  /** Clean URLs (no .html extension) */
  cleanUrls?: boolean;
}

export interface ContentConfig {
  /** Content collections to process */
  collections?: string[] | ContentCollectionConfig[];
  /** Content directory */
  dir?: string;
  /** Markdown options */
  markdown?: MarkdownConfig;
  /** MDX options */
  mdx?: MDXConfig;
}

export interface ContentCollectionConfig {
  /** Collection name */
  name: string;
  /** Collection directory relative to content dir */
  dir?: string;
  /** Schema for validation */
  schema?: ContentSchema;
  /** Sort order */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Filter function */
  filter?: (entry: ContentEntry) => boolean;
}

export interface ContentSchema {
  [key: string]: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
}

export interface MarkdownConfig {
  /** Enable GFM (GitHub Flavored Markdown) */
  gfm?: boolean;
  /** Enable syntax highlighting */
  syntaxHighlighting?: boolean;
  /** Syntax highlighting theme */
  syntaxTheme?: string;
  /** Custom remark plugins */
  remarkPlugins?: any[];
  /** Custom rehype plugins */
  rehypePlugins?: any[];
  /** Enable table of contents extraction */
  toc?: boolean;
  /** Enable reading time calculation */
  readingTime?: boolean;
}

export interface MDXConfig extends MarkdownConfig {
  /** Enable MDX support */
  enabled?: boolean;
  /** JSX import source */
  jsxImportSource?: string;
}

export interface BuildConfig {
  /** Enable minification */
  minify?: boolean;
  /** Enable source maps */
  sourcemap?: boolean;
  /** Enable gzip compression */
  compress?: boolean;
  /** Inline assets smaller than this size (bytes) */
  inlineThreshold?: number;
  /** Hash assets for cache busting */
  hashAssets?: boolean;
}

export interface ImageConfig {
  /** Enable image optimization */
  enabled?: boolean;
  /** Image formats to generate */
  formats?: ('webp' | 'avif' | 'png' | 'jpeg')[];
  /** Image sizes to generate */
  sizes?: number[];
  /** Image quality */
  quality?: number;
  /** Lazy loading */
  lazyLoad?: boolean;
  /** Placeholder type */
  placeholder?: 'blur' | 'color' | 'none';
}

export interface SEOConfig {
  /** Default title */
  title?: string;
  /** Title template */
  titleTemplate?: string;
  /** Default description */
  description?: string;
  /** Default open graph image */
  ogImage?: string;
  /** Twitter handle */
  twitterHandle?: string;
  /** Enable canonical URLs */
  canonical?: boolean;
}

export interface ContentEntry {
  /** Unique ID (file path without extension) */
  id: string;
  /** URL slug */
  slug: string;
  /** Raw content */
  body: string;
  /** Parsed frontmatter */
  data: Record<string, any>;
  /** Collection name */
  collection: string;
  /** File path */
  filePath: string;
  /** Rendered HTML */
  html?: string;
  /** Table of contents */
  toc?: TocEntry[];
  /** Reading time in minutes */
  readingTime?: number;
  /** Word count */
  wordCount?: number;
}

export interface TocEntry {
  /** Heading text */
  text: string;
  /** Heading level (1-6) */
  level: number;
  /** Slug for linking */
  slug: string;
  /** Child headings */
  children?: TocEntry[];
}

export interface GeneratedPage {
  /** Route path */
  route: string;
  /** Generated HTML */
  html: string;
  /** Associated metadata */
  meta?: Record<string, any>;
  /** Assets to include */
  assets?: string[];
}

export interface SitemapEntry {
  /** Page URL */
  loc: string;
  /** Last modification date */
  lastmod?: string;
  /** Change frequency */
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  /** Priority (0.0 - 1.0) */
  priority?: number;
}

export interface RSSFeedConfig {
  /** Feed title */
  title: string;
  /** Feed description */
  description: string;
  /** Site URL */
  siteUrl: string;
  /** Feed URL */
  feedUrl: string;
  /** Language */
  language?: string;
  /** Copyright */
  copyright?: string;
  /** Managing editor */
  managingEditor?: string;
  /** Web master */
  webMaster?: string;
  /** Time to live (minutes) */
  ttl?: number;
}

export interface RSSItem {
  /** Item title */
  title: string;
  /** Item URL */
  link: string;
  /** Item description/content */
  description: string;
  /** Publication date */
  pubDate: Date;
  /** Unique identifier */
  guid?: string;
  /** Categories */
  categories?: string[];
  /** Author */
  author?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<SSGConfig> = {
  outDir: 'dist',
  routes: ['/'],
  prerender: true,
  content: {
    collections: [],
    dir: 'content',
    markdown: {
      gfm: true,
      syntaxHighlighting: true,
      syntaxTheme: 'github-dark',
      remarkPlugins: [],
      rehypePlugins: [],
      toc: true,
      readingTime: true,
    },
    mdx: {
      enabled: false,
      jsxImportSource: '@philjs/core',
    },
  },
  build: {
    minify: true,
    sourcemap: false,
    compress: true,
    inlineThreshold: 4096,
    hashAssets: true,
  },
  images: {
    enabled: true,
    formats: ['webp', 'jpeg'],
    sizes: [640, 768, 1024, 1280, 1536],
    quality: 80,
    lazyLoad: true,
    placeholder: 'blur',
  },
  seo: {
    title: '',
    titleTemplate: '%s',
    description: '',
    ogImage: '',
    twitterHandle: '',
    canonical: true,
  },
  baseUrl: '',
  trailingSlash: false,
  cleanUrls: true,
};

/**
 * Define SSG configuration with defaults
 */
export function defineSSGConfig(config: SSGConfig): Required<SSGConfig> {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    content: { ...DEFAULT_CONFIG.content, ...config.content },
    build: { ...DEFAULT_CONFIG.build, ...config.build },
    images: { ...DEFAULT_CONFIG.images, ...config.images },
    seo: { ...DEFAULT_CONFIG.seo, ...config.seo },
  };
}

// ============================================================================
// Content Collections
// ============================================================================

const collections = new Map<string, ContentEntry[]>();

/**
 * Create a content collection
 */
export function createContentCollection(
  name: string,
  options: Partial<ContentCollectionConfig> = {}
): {
  name: string;
  entries: Signal<ContentEntry[]>;
  getEntry: (id: string) => ContentEntry | undefined;
  getEntryBySlug: (slug: string) => ContentEntry | undefined;
  getSortedEntries: (sortBy?: string, order?: 'asc' | 'desc') => ContentEntry[];
} {
  const entriesSignal = signal<ContentEntry[]>(collections.get(name) || []);

  return {
    name,
    entries: entriesSignal,
    getEntry(id: string) {
      return entriesSignal.get().find(e => e.id === id);
    },
    getEntryBySlug(slug: string) {
      return entriesSignal.get().find(e => e.slug === slug);
    },
    getSortedEntries(sortBy = options.sortBy || 'date', order = options.sortOrder || 'desc') {
      const entries = [...entriesSignal.get()];
      return entries.sort((a, b) => {
        const aVal = a.data[sortBy];
        const bVal = b.data[sortBy];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return order === 'desc' ? -comparison : comparison;
      });
    },
  };
}

/**
 * Load content from a directory
 */
export async function loadContent(
  config: ContentConfig,
  readFile: (path: string) => Promise<string>,
  listFiles: (pattern: string) => Promise<string[]>
): Promise<Map<string, ContentEntry[]>> {
  const result = new Map<string, ContentEntry[]>();
  const contentDir = config.dir || 'content';

  const collectionConfigs = (config.collections || []).map(c =>
    typeof c === 'string' ? { name: c } : c
  );

  for (const collectionConfig of collectionConfigs) {
    const { name, dir = name, filter } = collectionConfig;
    const pattern = `${contentDir}/${dir}/**/*.{md,mdx}`;
    const files = await listFiles(pattern);
    const entries: ContentEntry[] = [];

    for (const filePath of files) {
      const content = await readFile(filePath);
      const entry = parseContentFile(content, filePath, name);

      if (!filter || filter(entry)) {
        entries.push(entry);
      }
    }

    result.set(name, entries);
    collections.set(name, entries);
  }

  return result;
}

/**
 * Parse a content file (Markdown with frontmatter)
 */
export function parseContentFile(
  content: string,
  filePath: string,
  collection: string
): ContentEntry {
  const { data, body } = parseFrontmatter(content);
  const id = extractId(filePath);
  const slug = data.slug || id;

  const entry: ContentEntry = {
    id,
    slug,
    body,
    data,
    collection,
    filePath,
  };

  // Calculate reading time
  if (body) {
    const words = body.trim().split(/\s+/).length;
    entry.wordCount = words;
    entry.readingTime = Math.ceil(words / 200); // ~200 WPM average
  }

  return entry;
}

/**
 * Parse YAML frontmatter from content
 */
export function parseFrontmatter(content: string): { data: Record<string, any>; body: string } {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { data: {}, body: content };
  }

  const [, frontmatter, body] = match;
  const data: Record<string, any> = {};

  // Simple YAML parser for common patterns
  const lines = frontmatter.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value: any = line.slice(colonIndex + 1).trim();

      // Parse value types
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (/^\d+$/.test(value)) value = parseInt(value, 10);
      else if (/^\d+\.\d+$/.test(value)) value = parseFloat(value);
      else if (/^\d{4}-\d{2}-\d{2}/.test(value)) value = new Date(value);
      else if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^["']|["']$/g, ''));
      } else if (value.startsWith('"') || value.startsWith("'")) {
        value = value.slice(1, -1);
      }

      data[key] = value;
    }
  }

  return { data, body: body.trim() };
}

/**
 * Extract ID from file path
 */
function extractId(filePath: string): string {
  const parts = filePath.split('/');
  const filename = parts[parts.length - 1];
  return filename.replace(/\.(md|mdx)$/, '');
}

// ============================================================================
// Markdown Processing
// ============================================================================

/**
 * Render markdown to HTML
 */
export function renderMarkdown(content: string, options: MarkdownConfig = {}): string {
  // Basic markdown rendering (would integrate with marked/remark in production)
  let html = content;

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]+?)```/g, (_, lang, code) => {
    const langClass = lang ? ` class="language-${lang}"` : '';
    return `<pre><code${langClass}>${escapeHtml(code.trim())}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // Paragraphs
  html = html.split('\n\n').map(para => {
    if (para.startsWith('<')) return para;
    return `<p>${para}</p>`;
  }).join('\n');

  // Lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  return html;
}

/**
 * Extract table of contents from markdown
 */
export function extractToc(content: string): TocEntry[] {
  const headings: TocEntry[] = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2];
    const slug = slugify(text);

    headings.push({ text, level, slug });
  }

  // Build tree structure
  return buildTocTree(headings);
}

/**
 * Build hierarchical TOC tree
 */
function buildTocTree(flatHeadings: TocEntry[]): TocEntry[] {
  const root: TocEntry[] = [];
  const stack: TocEntry[] = [];

  for (const heading of flatHeadings) {
    const entry: TocEntry = { ...heading, children: [] };

    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      root.push(entry);
    } else {
      stack[stack.length - 1].children!.push(entry);
    }

    stack.push(entry);
  }

  return root;
}

// ============================================================================
// Static Site Generation
// ============================================================================

/**
 * Generate a static site
 */
export async function generateStaticSite(
  config: SSGConfig,
  render: (url: string, data?: any) => Promise<string>
): Promise<GeneratedPage[]> {
  const fullConfig = defineSSGConfig(config);
  const routes = typeof fullConfig.routes === 'function'
    ? await fullConfig.routes()
    : fullConfig.routes;

  const results: GeneratedPage[] = [];

  for (const route of routes) {
    const html = await render(route);
    results.push({
      route: normalizeRoute(route, fullConfig),
      html,
    });
  }

  return results;
}

/**
 * Generate static paths from content
 */
export async function generateStaticPaths(
  collection: string,
  pathTemplate: string = '/[slug]'
): Promise<string[]> {
  const entries = collections.get(collection) || [];
  return entries.map(entry => pathTemplate.replace('[slug]', entry.slug));
}

/**
 * Normalize route based on config
 */
function normalizeRoute(route: string, config: Required<SSGConfig>): string {
  let normalized = route;

  // Handle trailing slash
  if (config.trailingSlash && !normalized.endsWith('/')) {
    normalized += '/';
  } else if (!config.trailingSlash && normalized.endsWith('/') && normalized !== '/') {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

// ============================================================================
// Sitemap Generation
// ============================================================================

/**
 * Generate XML sitemap
 */
export function generateSitemap(
  entries: SitemapEntry[],
  baseUrl: string
): string {
  const urls = entries.map(entry => {
    const parts = [`    <loc>${baseUrl}${entry.loc}</loc>`];

    if (entry.lastmod) {
      parts.push(`    <lastmod>${entry.lastmod}</lastmod>`);
    }
    if (entry.changefreq) {
      parts.push(`    <changefreq>${entry.changefreq}</changefreq>`);
    }
    if (entry.priority !== undefined) {
      parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
    }

    return `  <url>\n${parts.join('\n')}\n  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/**
 * Generate sitemap from generated pages
 */
export function generateSitemapFromPages(
  pages: GeneratedPage[],
  baseUrl: string,
  options: {
    defaultChangefreq?: SitemapEntry['changefreq'];
    defaultPriority?: number;
    lastmod?: string;
  } = {}
): string {
  const entries: SitemapEntry[] = pages.map(page => ({
    loc: page.route,
    lastmod: options.lastmod || new Date().toISOString().split('T')[0],
    changefreq: options.defaultChangefreq || 'weekly',
    priority: page.route === '/' ? 1.0 : options.defaultPriority || 0.8,
  }));

  return generateSitemap(entries, baseUrl);
}

// ============================================================================
// RSS Feed Generation
// ============================================================================

/**
 * Generate RSS 2.0 feed
 */
export function generateRSSFeed(config: RSSFeedConfig, items: RSSItem[]): string {
  const itemsXml = items.map(item => {
    const parts = [
      `      <title>${escapeXml(item.title)}</title>`,
      `      <link>${item.link}</link>`,
      `      <description>${escapeXml(item.description)}</description>`,
      `      <pubDate>${item.pubDate.toUTCString()}</pubDate>`,
    ];

    if (item.guid) {
      parts.push(`      <guid isPermaLink="false">${item.guid}</guid>`);
    } else {
      parts.push(`      <guid>${item.link}</guid>`);
    }

    if (item.author) {
      parts.push(`      <author>${escapeXml(item.author)}</author>`);
    }

    if (item.categories) {
      item.categories.forEach(cat => {
        parts.push(`      <category>${escapeXml(cat)}</category>`);
      });
    }

    return `    <item>\n${parts.join('\n')}\n    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(config.title)}</title>
    <link>${config.siteUrl}</link>
    <description>${escapeXml(config.description)}</description>
    <language>${config.language || 'en-us'}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${config.feedUrl}" rel="self" type="application/rss+xml"/>
${config.copyright ? `    <copyright>${escapeXml(config.copyright)}</copyright>\n` : ''}${config.ttl ? `    <ttl>${config.ttl}</ttl>\n` : ''}${itemsXml}
  </channel>
</rss>`;
}

/**
 * Generate RSS feed from content collection
 */
export function generateRSSFromCollection(
  collection: string,
  config: RSSFeedConfig,
  options: {
    limit?: number;
    descriptionField?: string;
    titleField?: string;
    dateField?: string;
  } = {}
): string {
  const entries = collections.get(collection) || [];
  const {
    limit = 20,
    descriptionField = 'description',
    titleField = 'title',
    dateField = 'date',
  } = options;

  const sortedEntries = [...entries]
    .sort((a, b) => {
      const aDate = new Date(a.data[dateField] || 0);
      const bDate = new Date(b.data[dateField] || 0);
      return bDate.getTime() - aDate.getTime();
    })
    .slice(0, limit);

  const items: RSSItem[] = sortedEntries.map(entry => ({
    title: entry.data[titleField] || entry.id,
    link: `${config.siteUrl}/${entry.collection}/${entry.slug}`,
    description: entry.data[descriptionField] || entry.body.slice(0, 200) + '...',
    pubDate: new Date(entry.data[dateField] || Date.now()),
    categories: entry.data.tags || entry.data.categories,
  }));

  return generateRSSFeed(config, items);
}

// ============================================================================
// JSON Feed Generation
// ============================================================================

export interface JSONFeedConfig {
  title: string;
  home_page_url: string;
  feed_url: string;
  description?: string;
  icon?: string;
  favicon?: string;
  author?: {
    name?: string;
    url?: string;
    avatar?: string;
  };
  language?: string;
}

export interface JSONFeedItem {
  id: string;
  url: string;
  title: string;
  content_html?: string;
  content_text?: string;
  summary?: string;
  date_published?: string;
  date_modified?: string;
  author?: { name: string };
  tags?: string[];
}

/**
 * Generate JSON Feed
 */
export function generateJSONFeed(config: JSONFeedConfig, items: JSONFeedItem[]): string {
  return JSON.stringify({
    version: 'https://jsonfeed.org/version/1.1',
    ...config,
    items,
  }, null, 2);
}

// ============================================================================
// Data Hooks
// ============================================================================

/**
 * Hook for loading static data at build time
 */
export function useStaticProps<T>(
  loader: () => Promise<T>
): { data: Signal<T | null>; loading: Signal<boolean>; error: Signal<Error | null> } {
  const data = signal<T | null>(null);
  const loading = signal(true);
  const error = signal<Error | null>(null);

  loader()
    .then(result => {
      data.set(result);
      loading.set(false);
    })
    .catch(err => {
      error.set(err);
      loading.set(false);
    });

  return { data, loading, error };
}

/**
 * Hook for getting collection data
 */
export function useCollection(name: string): {
  entries: Signal<ContentEntry[]>;
  loading: Signal<boolean>;
} {
  const entries = signal<ContentEntry[]>(collections.get(name) || []);
  const loading = signal(false);

  return { entries, loading };
}

/**
 * Hook for getting a single entry
 */
export function useEntry(collection: string, slug: string): {
  entry: Computed<ContentEntry | undefined>;
  loading: Signal<boolean>;
} {
  const allEntries = collections.get(collection) || [];
  const loading = signal(false);
  const entry = computed(() => allEntries.find(e => e.slug === slug));

  return { entry, loading };
}

// ============================================================================
// Image Optimization
// ============================================================================

export interface OptimizedImage {
  src: string;
  srcset: string;
  sizes: string;
  width: number;
  height: number;
  placeholder?: string;
}

/**
 * Generate optimized image markup
 */
export function getOptimizedImage(
  src: string,
  options: {
    alt: string;
    widths?: number[];
    formats?: string[];
    sizes?: string;
    quality?: number;
    placeholder?: 'blur' | 'color' | 'none';
  }
): OptimizedImage {
  const widths = options.widths || [640, 768, 1024, 1280, 1536];
  const formats = options.formats || ['webp', 'jpeg'];
  const sizes = options.sizes || '100vw';

  // Generate srcset for responsive images
  const srcset = widths
    .map(w => `${transformImageUrl(src, { width: w, format: formats[0] })} ${w}w`)
    .join(', ');

  return {
    src: transformImageUrl(src, { width: widths[widths.length - 1], format: formats[0] }),
    srcset,
    sizes,
    width: widths[widths.length - 1],
    height: 0, // Would be calculated from actual image
    placeholder: options.placeholder === 'blur' ? generateBlurPlaceholder(src) : undefined,
  };
}

/**
 * Transform image URL for optimization service
 */
function transformImageUrl(
  src: string,
  options: { width?: number; height?: number; format?: string; quality?: number }
): string {
  const params = new URLSearchParams();
  if (options.width) params.set('w', String(options.width));
  if (options.height) params.set('h', String(options.height));
  if (options.format) params.set('f', options.format);
  if (options.quality) params.set('q', String(options.quality));

  return `/_philjs/image?src=${encodeURIComponent(src)}&${params.toString()}`;
}

/**
 * Generate blur placeholder (base64 data URL)
 */
function generateBlurPlaceholder(src: string): string {
  // In production, this would generate an actual blur hash
  return `data:image/svg+xml;base64,${btoa(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="#e0e0e0" width="100" height="100"/></svg>`
  )}`;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Slugify text for URLs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Escape HTML entities
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape XML entities
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string, locale: string = 'en-US'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Calculate reading time
 */
export function calculateReadingTime(content: string, wordsPerMinute: number = 200): number {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// ============================================================================
// Build Utilities
// ============================================================================

/**
 * Get output file path for a route
 */
export function getOutputPath(route: string, config: SSGConfig): string {
  const outDir = config.outDir || 'dist';

  if (route === '/') {
    return `${outDir}/index.html`;
  }

  if (config.cleanUrls) {
    return `${outDir}${route}/index.html`;
  }

  return `${outDir}${route}.html`;
}

/**
 * Generate build manifest
 */
export interface BuildManifest {
  pages: GeneratedPage[];
  assets: string[];
  buildTime: string;
  config: SSGConfig;
}

export function generateBuildManifest(
  pages: GeneratedPage[],
  assets: string[],
  config: SSGConfig
): BuildManifest {
  return {
    pages,
    assets,
    buildTime: new Date().toISOString(),
    config,
  };
}

// ============================================================================
// SEO Utilities
// ============================================================================

/**
 * Generate meta tags for SEO
 */
export function generateMetaTags(options: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  twitterHandle?: string;
}): string {
  const tags: string[] = [];

  if (options.title) {
    tags.push(`<title>${escapeHtml(options.title)}</title>`);
    tags.push(`<meta property="og:title" content="${escapeHtml(options.title)}">`);
    tags.push(`<meta name="twitter:title" content="${escapeHtml(options.title)}">`);
  }

  if (options.description) {
    tags.push(`<meta name="description" content="${escapeHtml(options.description)}">`);
    tags.push(`<meta property="og:description" content="${escapeHtml(options.description)}">`);
    tags.push(`<meta name="twitter:description" content="${escapeHtml(options.description)}">`);
  }

  if (options.image) {
    tags.push(`<meta property="og:image" content="${options.image}">`);
    tags.push(`<meta name="twitter:image" content="${options.image}">`);
  }

  if (options.url) {
    tags.push(`<meta property="og:url" content="${options.url}">`);
    tags.push(`<link rel="canonical" href="${options.url}">`);
  }

  tags.push(`<meta property="og:type" content="${options.type || 'website'}">`);
  tags.push(`<meta name="twitter:card" content="${options.twitterCard || 'summary_large_image'}">`);

  if (options.twitterHandle) {
    tags.push(`<meta name="twitter:site" content="${options.twitterHandle}">`);
  }

  return tags.join('\n');
}

/**
 * Generate structured data (JSON-LD)
 */
export function generateStructuredData(type: string, data: Record<string, any>): string {
  const ld = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return `<script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

// ============================================================================
// Exports for CLI integration
// ============================================================================

export { DEFAULT_CONFIG };
