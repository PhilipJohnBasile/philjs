# @philjs/content - Complete Reference

The `@philjs/content` package provides Astro-style content collections for PhilJS with type-safe schemas, MDX support, and build-time optimization. It enables you to manage structured content like blog posts, documentation, and data files with full TypeScript inference and Zod validation.

## Installation

```bash
npm install @philjs/content
# or
pnpm add @philjs/content
# or
bun add @philjs/content
```

## Features

- **Type-safe Content Collections** - Define collections with Zod schemas for full TypeScript inference
- **MDX Support** - Write content in Markdown or MDX with component support
- **Build-time Validation** - Validate frontmatter and data at build time
- **RSS/Atom/JSON Feed Generation** - Generate feeds from collections automatically
- **Sitemap Generation** - Create XML sitemaps with image/video support
- **SEO Utilities** - Generate meta tags, Open Graph, Twitter Cards, and JSON-LD
- **Content Utilities** - Reading time, excerpts, tag clouds, related posts
- **Vite Plugin** - HMR, type generation, and image optimization
- **Collection References** - Create relationships between content types
- **Hot Module Replacement** - Instant content updates during development

## Package Exports

The content package provides multiple submodule exports for tree-shaking:

| Export | Description |
|--------|-------------|
| `@philjs/content` | Main entry point with all exports |
| `@philjs/content/collection` | Collection definition utilities |
| `@philjs/content/query` | Query functions for content |
| `@philjs/content/render` | MDX rendering utilities |
| `@philjs/content/vite` | Vite plugin for build integration |
| `@philjs/content/rss` | RSS, Atom, and JSON feed generation |
| `@philjs/content/sitemap` | XML sitemap generation |
| `@philjs/content/seo` | SEO meta tag generation |
| `@philjs/content/utils` | Content utility functions |

## Quick Start

### 1. Define Your Collections

Create a `content/config.ts` file to define your content collections:

```typescript
// content/config.ts
import { defineCollection, z } from '@philjs/content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    author: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    image: z.string().optional(),
  }),
});

const authors = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    email: z.string().email(),
    avatar: z.string().url().optional(),
    bio: z.string().optional(),
  }),
});

export const collections = { blog, authors };
```

### 2. Add Content Files

Create content in your collection directories:

```markdown
<!-- content/blog/my-first-post.md -->
---
title: My First Post
description: Welcome to my blog!
date: 2024-01-15
author: John Doe
tags: [javascript, webdev]
---

# Welcome to My Blog

This is my first blog post. **PhilJS Content** makes it easy to manage content!

## Features

- Type-safe frontmatter
- MDX support
- Auto-generated types
```

### 3. Query and Render Content

```typescript
import { getCollection, getEntry } from '@philjs/content';

// Get all blog posts (excluding drafts)
const posts = await getCollection('blog', ({ data }) => !data.draft);

// Get a single post
const post = await getEntry('blog', 'my-first-post');

if (post) {
  console.log(post.data.title);  // "My First Post"
  console.log(post.data.date);   // Date object

  // Render the content
  const { Content, headings, readingTime } = await post.render();
}
```

### 4. Configure Vite Plugin

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { contentPlugin } from '@philjs/content/vite';

export default defineConfig({
  plugins: [
    contentPlugin({
      contentDir: './content',
      optimizeImages: true,
      hmr: true,
    }),
  ],
});
```

---

## Collection Definition

### defineCollection

Create a type-safe content collection with Zod schema validation.

```typescript
import { defineCollection, z } from '@philjs/content';

const blog = defineCollection({
  type: 'content',  // 'content' for md/mdx, 'data' for json/yaml
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
  directory: 'posts',  // Optional: custom directory (default: collection name)
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | `'content' \| 'data'` | Collection type: markdown/MDX or JSON/YAML |
| `schema` | `ZodType` | Zod schema for validating entry data |
| `directory` | `string?` | Custom directory path relative to content folder |

### defineCollections

Helper to define multiple collections in a single call:

```typescript
import { defineCollections, defineCollection, z } from '@philjs/content';

export const collections = defineCollections({
  blog: defineCollection({
    type: 'content',
    schema: z.object({ title: z.string() }),
  }),
  authors: defineCollection({
    type: 'data',
    schema: z.object({ name: z.string() }),
  }),
});
```

### reference

Create a reference to another collection entry for relationships:

```typescript
import { defineCollection, z, reference } from '@philjs/content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    author: reference('authors'),  // Reference to authors collection
  }),
});
```

### Built-in Schema Helpers

The `schemas` object provides common schema patterns:

```typescript
import { schemas } from '@philjs/content';

// Standard blog post schema
const blog = defineCollection({
  type: 'content',
  schema: schemas.blogPost,
});

// Available schemas:
// - schemas.blogPost   - title, description, date, author, tags, draft, image
// - schemas.author     - name, email, avatar, bio, social links
// - schemas.docs       - title, description, sidebar_position, sidebar_label
// - schemas.changelog  - version, date, breaking, features, fixes, deprecated
```

---

## Query Functions

### getCollection

Get all entries from a collection with optional filtering, sorting, and pagination.

```typescript
import { getCollection } from '@philjs/content';

// Get all blog posts
const allPosts = await getCollection('blog');

// With filter function
const published = await getCollection('blog', ({ data }) => !data.draft);

// With full options
const recent = await getCollection('blog', {
  filter: ({ data }) => !data.draft,
  sort: (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  limit: 5,
  offset: 0,
});
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `filter` | `(entry) => boolean` | Filter entries |
| `sort` | `(a, b) => number` | Sort comparator |
| `limit` | `number` | Maximum entries to return |
| `offset` | `number` | Skip first N entries |

### getEntry

Get a single entry by ID or slug:

```typescript
import { getEntry } from '@philjs/content';

const post = await getEntry('blog', 'my-first-post');

if (post) {
  console.log(post.data.title);
  const { Content } = await post.render();
}
```

### getEntryBySlug

Get a content entry by its URL-friendly slug:

```typescript
import { getEntryBySlug } from '@philjs/content';

const post = await getEntryBySlug('blog', 'my-first-post');
```

### getEntries

Get multiple entries by their references:

```typescript
import { getEntries } from '@philjs/content';

const posts = await getEntries([
  { collection: 'blog', id: 'post-1' },
  { collection: 'blog', id: 'post-2' },
]);
```

### getCollectionTags

Get all unique tags from a collection:

```typescript
import { getCollectionTags } from '@philjs/content';

const tags = await getCollectionTags('blog');
// ['javascript', 'typescript', 'react', ...]

// Custom tag field
const categories = await getCollectionTags('blog', 'categories');
```

### getEntriesByTag

Get entries filtered by a specific tag:

```typescript
import { getEntriesByTag } from '@philjs/content';

const jsPosts = await getEntriesByTag('blog', 'javascript');
```

### getAdjacentEntries

Get previous and next entries for pagination:

```typescript
import { getAdjacentEntries } from '@philjs/content';

const { prev, next } = await getAdjacentEntries('blog', 'current-post', {
  sort: (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  filter: ({ data }) => !data.draft,
});

// Use for navigation
if (prev) console.log('Previous:', prev.data.title);
if (next) console.log('Next:', next.data.title);
```

### resolveReference

Resolve a reference to get the full entry:

```typescript
import { getEntry, resolveReference } from '@philjs/content';

const post = await getEntry('blog', 'my-post');
const author = await resolveReference(post.data.author);

console.log(author.data.name);  // Author's name
```

### groupBy

Group entries by a computed key:

```typescript
import { groupBy } from '@philjs/content';

const byYear = await groupBy('blog', (entry) =>
  entry.data.date.getFullYear().toString()
);
// { '2024': [...], '2023': [...] }
```

### countEntries

Count entries in a collection:

```typescript
import { countEntries } from '@philjs/content';

const total = await countEntries('blog');
const published = await countEntries('blog', ({ data }) => !data.draft);
```

### Utility Query Functions

```typescript
import { hasCollection, getCollectionNames } from '@philjs/content';

// Check if collection exists
if (hasCollection('blog')) {
  // ...
}

// Get all collection names
const names = getCollectionNames();  // ['blog', 'authors', ...]
```

---

## Content Rendering

### renderContent

Render markdown/MDX content to a PhilJS-compatible result:

```typescript
import { renderContent } from '@philjs/content';

const { Content, headings, images, readingTime, tableOfContents } =
  await renderContent(post.body, post.data);

// Content is a component
<Content components={{ h1: CustomH1, code: CodeBlock }} />
```

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `Content` | `Component` | Rendered content component |
| `headings` | `ContentHeading[]` | Extracted headings |
| `images` | `ContentImage[]` | Images found in content |
| `readingTime` | `number` | Estimated reading time in minutes |
| `tableOfContents` | `TOCEntry[]` | Hierarchical TOC structure |

### createContentRenderer

Create a reusable renderer with preset options:

```typescript
import { createContentRenderer } from '@philjs/content';

const render = createContentRenderer({
  components: { code: CodeBlock },
  remarkPlugins: [remarkMath],
  rehypePlugins: [rehypeKatex],
  gfm: true,
});

// Use the preconfigured renderer
const { Content } = await render(post.body);
```

### renderToString

Render content to plain HTML string for SSR:

```typescript
import { renderToString } from '@philjs/content';

const html = await renderToString(post.body);
```

### processForSearch

Process content for search indexing (strips formatting):

```typescript
import { processForSearch } from '@philjs/content';

const searchText = await processForSearch(post.body);
// Plain text suitable for indexing
```

### getExcerpt

Generate a content excerpt:

```typescript
import { getExcerpt } from '@philjs/content';

const excerpt = getExcerpt(post.body, 160);  // Max 160 characters
```

---

## RSS Feed Generation

### generateRSS

Generate an RSS 2.0 feed:

```typescript
import { generateRSS } from '@philjs/content/rss';

const rss = generateRSS({
  title: 'My Blog',
  description: 'A blog about web development',
  site: 'https://example.com',
  language: 'en',
  items: posts.map(post => ({
    title: post.data.title,
    link: `https://example.com/blog/${post.slug}`,
    description: post.data.description,
    pubDate: post.data.date,
    categories: post.data.tags,
    content: post.body,  // Optional: full content
  })),
  image: {
    url: 'https://example.com/logo.png',
    title: 'My Blog',
    link: 'https://example.com',
  },
  ttl: 60,  // Cache for 60 minutes
});

// Write to file or serve as response
```

### generateAtom

Generate an Atom feed:

```typescript
import { generateAtom } from '@philjs/content/rss';

const atom = generateAtom({
  title: 'My Blog',
  subtitle: 'A blog about web development',
  site: 'https://example.com',
  feedUrl: 'https://example.com/atom.xml',
  author: {
    name: 'John Doe',
    email: 'john@example.com',
    uri: 'https://example.com/about',
  },
  items: posts.map(post => ({
    title: post.data.title,
    link: `https://example.com/blog/${post.slug}`,
    summary: post.data.description,
    content: post.body,
    published: post.data.date,
    categories: post.data.tags,
  })),
});
```

### generateJSONFeed

Generate a JSON Feed:

```typescript
import { generateJSONFeed } from '@philjs/content/rss';

const jsonFeed = generateJSONFeed({
  title: 'My Blog',
  description: 'A blog about web development',
  home_page_url: 'https://example.com',
  feed_url: 'https://example.com/feed.json',
  items: posts.map(post => ({
    id: `https://example.com/blog/${post.slug}`,
    url: `https://example.com/blog/${post.slug}`,
    title: post.data.title,
    summary: post.data.description,
    content_html: post.body,
    date_published: post.data.date.toISOString(),
    tags: post.data.tags,
  })),
});
```

### Generate From Collection

Convenient helpers to generate feeds directly from collections:

```typescript
import {
  generateRSSFromCollection,
  generateAtomFromCollection,
  generateJSONFeedFromCollection
} from '@philjs/content/rss';

const posts = await getCollection('blog', ({ data }) => !data.draft);

// Generate RSS from collection
const rss = generateRSSFromCollection({
  entries: posts,
  title: 'My Blog',
  description: 'A blog about web development',
  site: 'https://example.com',
  limit: 20,
  mapping: {
    title: 'title',
    description: 'description',
    pubDate: 'date',
    categories: 'tags',
  },
});
```

---

## Sitemap Generation

### generateSitemap

Generate an XML sitemap:

```typescript
import { generateSitemap } from '@philjs/content/sitemap';

const sitemap = generateSitemap({
  site: 'https://example.com',
  urls: [
    {
      loc: '/',
      lastmod: new Date(),
      changefreq: 'daily',
      priority: 1.0,
    },
    {
      loc: '/blog',
      lastmod: new Date(),
      changefreq: 'daily',
      priority: 0.8,
    },
    ...posts.map(post => ({
      loc: `/blog/${post.slug}`,
      lastmod: post.modifiedTime,
      changefreq: 'weekly' as const,
      priority: 0.6,
    })),
  ],
});
```

### Sitemap with Images and Videos

```typescript
const sitemap = generateSitemap({
  site: 'https://example.com',
  urls: [
    {
      loc: '/gallery',
      images: [
        {
          loc: '/images/photo1.jpg',
          title: 'Photo 1',
          caption: 'A beautiful sunset',
        },
      ],
      videos: [
        {
          thumbnail_loc: '/video-thumb.jpg',
          title: 'Tutorial Video',
          description: 'Learn how to use PhilJS',
          content_loc: '/videos/tutorial.mp4',
          duration: 300,  // 5 minutes
        },
      ],
    },
  ],
});
```

### Multi-language Sitemap

```typescript
const sitemap = generateSitemap({
  site: 'https://example.com',
  urls: [
    {
      loc: '/about',
      alternates: [
        { lang: 'en', href: '/en/about' },
        { lang: 'es', href: '/es/sobre' },
        { lang: 'fr', href: '/fr/a-propos' },
      ],
    },
  ],
});
```

### generateSitemapIndex

For large sites, create a sitemap index:

```typescript
import { generateSitemapIndex, splitSitemap } from '@philjs/content/sitemap';

const allUrls = /* ... large array of URLs ... */;

// Split into chunks of 50,000 URLs
const chunks = splitSitemap(allUrls, 50000);

// Generate individual sitemaps
const sitemaps = chunks.map((chunk, i) => ({
  content: generateSitemap({ site: 'https://example.com', urls: chunk }),
  filename: `sitemap-${i + 1}.xml`,
}));

// Generate sitemap index
const index = generateSitemapIndex(
  sitemaps.map((s, i) => ({
    loc: `https://example.com/${s.filename}`,
    lastmod: new Date(),
  }))
);
```

### generateSitemapFromCollection

Generate sitemap directly from collection:

```typescript
import { generateSitemapFromCollection } from '@philjs/content/sitemap';

const posts = await getCollection('blog');

const sitemap = generateSitemapFromCollection({
  entries: posts,
  site: 'https://example.com',
  filter: (entry) => !entry.data.draft,
  mapping: {
    loc: (entry) => `/blog/${entry.slug}`,
    lastmod: 'date',
    changefreq: 'weekly',
    priority: 0.6,
  },
});
```

### generateRobotsTxt

Generate robots.txt with sitemap reference:

```typescript
import { generateRobotsTxt } from '@philjs/content/sitemap';

const robotsTxt = generateRobotsTxt({
  sitemapUrl: 'https://example.com/sitemap.xml',
  disallow: ['/admin', '/private'],
  allow: ['/public'],
  crawlDelay: 1,
  userAgent: '*',
});
```

---

## SEO Utilities

### generateMetaTags

Generate HTML meta tags from SEO configuration:

```typescript
import { generateMetaTags } from '@philjs/content/seo';

const tags = generateMetaTags({
  title: 'My Page Title',
  description: 'A description of my page',
  canonical: 'https://example.com/page',
  keywords: ['web', 'development', 'javascript'],
  robots: ['index', 'follow'],
  language: 'en',

  openGraph: {
    type: 'article',
    title: 'My Page Title',
    description: 'A description of my page',
    url: 'https://example.com/page',
    siteName: 'My Site',
    images: [
      {
        url: 'https://example.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Page preview',
      },
    ],
    article: {
      publishedTime: new Date('2024-01-15'),
      authors: ['John Doe'],
      tags: ['javascript', 'webdev'],
    },
  },

  twitter: {
    card: 'summary_large_image',
    site: '@mysite',
    creator: '@johndoe',
    title: 'My Page Title',
    description: 'A description of my page',
    image: 'https://example.com/twitter-card.jpg',
  },

  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'My Page Title',
    description: 'A description of my page',
    datePublished: '2024-01-15',
    author: {
      '@type': 'Person',
      name: 'John Doe',
    },
  },
});

// Insert in <head>
```

### generateSEOFromEntry

Auto-generate SEO config from a collection entry:

```typescript
import { generateSEOFromEntry, generateMetaTags } from '@philjs/content/seo';

const post = await getEntry('blog', 'my-post');

const seoConfig = generateSEOFromEntry(post, 'https://example.com', {
  titleTemplate: '%s | My Blog',
  defaultImage: 'https://example.com/default-og.jpg',
  siteName: 'My Blog',
  twitterHandle: '@myblog',
});

const metaTags = generateMetaTags(seoConfig);
```

### useSEO Hook

Use SEO configuration in PhilJS components:

```typescript
import { useSEO } from '@philjs/content/seo';

function BlogPost({ post }) {
  const { head } = useSEO({
    title: post.data.title,
    description: post.data.description,
    openGraph: {
      type: 'article',
      title: post.data.title,
    },
  });

  return (
    <article>
      <head innerHTML={head} />
      {/* content */}
    </article>
  );
}
```

---

## Content Utilities

### calculateReadingTime

Calculate estimated reading time:

```typescript
import { calculateReadingTime } from '@philjs/content/utils';

const { minutes, words, text } = calculateReadingTime(content, {
  wordsPerMinute: 200,
  includeCode: false,
  includeHTML: false,
});

console.log(text);  // "5 min read"
```

### generateExcerpt

Generate a content excerpt:

```typescript
import { generateExcerpt } from '@philjs/content/utils';

const excerpt = generateExcerpt(content, {
  length: 160,
  suffix: '...',
  preserveWords: true,
  stripHTML: true,
  stripMarkdown: true,
});
```

### extractTableOfContents

Extract hierarchical table of contents:

```typescript
import { extractTableOfContents } from '@philjs/content/utils';

const toc = extractTableOfContents(headings, {
  minDepth: 2,
  maxDepth: 4,
});

// Returns nested structure:
// [
//   { depth: 2, text: 'Introduction', slug: 'introduction', children: [...] },
//   ...
// ]
```

### renderTableOfContents

Render TOC as HTML:

```typescript
import { renderTableOfContents } from '@philjs/content/utils';

const html = renderTableOfContents(toc, {
  ordered: false,
  className: 'toc',
});
```

### findRelatedPosts

Find related posts based on tags and content similarity:

```typescript
import { findRelatedPosts } from '@philjs/content/utils';

const related = findRelatedPosts(currentPost, allPosts, {
  limit: 5,
  tagField: 'tags',
  minSharedTags: 1,
  threshold: 0.2,
});

// Returns posts with similarity scores
related.forEach(post => {
  console.log(post.data.title, post.score);
});
```

### generateTagCloud

Generate a weighted tag cloud:

```typescript
import { generateTagCloud, renderTagCloud } from '@philjs/content/utils';

const cloud = generateTagCloud(posts, {
  tagField: 'tags',
  minCount: 2,
  limit: 20,
  sort: 'count',  // or 'alphabetical'
});

// Returns: [{ tag: 'javascript', count: 15, weight: 1.0 }, ...]

const html = renderTagCloud(cloud, {
  baseUrl: '/tags/',
  className: 'tag-cloud',
  useWeightForSize: true,
  minSize: 0.8,
  maxSize: 2.0,
});
```

### groupByDate

Group entries by date:

```typescript
import { groupByDate } from '@philjs/content/utils';

const byMonth = groupByDate(posts, {
  dateField: 'date',
  granularity: 'month',  // 'year', 'month', or 'day'
  sort: 'desc',
});

// Map { '2024-01': [...], '2023-12': [...] }
```

### paginate

Paginate entries:

```typescript
import { paginate } from '@philjs/content/utils';

const page = paginate(posts, {
  pageSize: 10,
  page: 2,
});

console.log(page.items);       // Posts for page 2
console.log(page.totalPages);  // Total number of pages
console.log(page.hasNext);     // true/false
console.log(page.hasPrev);     // true/false
```

### Date Formatting

```typescript
import { formatDate, getRelativeTime } from '@philjs/content/utils';

formatDate(new Date(), 'long', 'en-US');     // "January 15, 2024"
formatDate(new Date(), 'short', 'en-US');    // "1/15/2024"
getRelativeTime(new Date(Date.now() - 86400000)); // "yesterday"
```

### Text Utilities

```typescript
import { slugify, stripMarkdown, getFirstWords } from '@philjs/content/utils';

slugify('Hello World!');           // "hello-world"
stripMarkdown('**bold** text');    // "bold text"
getFirstWords('The quick brown fox', 3);  // "The quick brown"
```

---

## Vite Plugin

### contentPlugin

Configure the Vite plugin for build integration:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { contentPlugin } from '@philjs/content/vite';

export default defineConfig({
  plugins: [
    contentPlugin({
      // Content directory (default: './content')
      contentDir: './content',

      // Generated types output (default: './.philjs/content-types.d.ts')
      typesOutput: './.philjs/content-types.d.ts',

      // Enable HMR for content (default: true)
      hmr: true,

      // Enable image optimization (default: true)
      optimizeImages: true,

      // Image optimization options
      imageOptions: {
        formats: ['webp', 'avif'],
        sizes: [640, 1280, 1920],
        quality: 80,
        lazyLoad: true,
        outputDir: './.philjs/optimized-images',
      },

      // Custom remark plugins
      remarkPlugins: [],

      // Custom rehype plugins
      rehypePlugins: [],

      // Watch for file changes (default: true in dev)
      watch: true,
    }),
  ],
});
```

### Generated Types

The plugin automatically generates TypeScript type definitions:

```typescript
// .philjs/content-types.d.ts (auto-generated)
declare module '@philjs/content' {
  export interface ContentCollections {
    blog: {
      type: 'content';
      ids: 'my-first-post' | 'second-post' | 'third-post';
    };
    authors: {
      type: 'data';
      ids: 'john-doe' | 'jane-smith';
    };
  }
}
```

### HMR Support

The plugin provides hot module replacement for content:

```typescript
// Client-side HMR handling
if (import.meta.hot) {
  import.meta.hot.on('philjs-content:update', (data) => {
    console.log('Content updated:', data);
    // { type: 'change', collection: 'blog', id: 'my-post' }
  });
}
```

---

## Types Reference

### CollectionEntry

```typescript
interface ContentEntry<TData> {
  type: 'content';
  id: string;
  slug: string;
  collection: string;
  data: TData;
  body: string;
  filePath: string;
  modifiedTime: Date;
  render(): Promise<RenderResult>;
}

interface DataEntry<TData> {
  type: 'data';
  id: string;
  collection: string;
  data: TData;
  filePath: string;
  modifiedTime: Date;
}

type CollectionEntry<TData> = ContentEntry<TData> | DataEntry<TData>;
```

### RenderResult

```typescript
interface RenderResult {
  Content: (props: { components?: MDXComponents }) => unknown;
  headings: ContentHeading[];
  images: ContentImage[];
  readingTime: number;
  tableOfContents: TOCEntry[];
}
```

### ContentHeading

```typescript
interface ContentHeading {
  depth: number;    // 1-6
  text: string;     // Heading text
  slug: string;     // URL-friendly slug
}
```

### TOCEntry

```typescript
interface TOCEntry {
  depth: number;
  text: string;
  slug: string;
  children: TOCEntry[];
}
```

### CollectionConfig

```typescript
interface CollectionConfig<TType, TSchema> {
  type: TType;              // 'content' | 'data'
  schema: TSchema;          // Zod schema
  directory?: string;       // Optional custom directory
}
```

### SEOConfig

```typescript
interface SEOConfig {
  title?: string;
  description?: string;
  canonical?: string;
  keywords?: string | string[];
  robots?: RobotsDirective | RobotsDirective[];
  language?: string;
  alternates?: AlternateLanguage[];
  openGraph?: OpenGraphConfig;
  twitter?: TwitterCardConfig;
  jsonLd?: JSONLDSchema | JSONLDSchema[];
  additionalMetaTags?: MetaTag[];
  additionalLinkTags?: LinkTag[];
}
```

---

## API Reference

### Collection Functions

| Function | Description |
|----------|-------------|
| `defineCollection(config)` | Define a content collection with schema |
| `defineCollections(config)` | Define multiple collections |
| `reference(collection)` | Create a reference to another collection |
| `getContentStore()` | Get the global content store |
| `initializeStore(collections)` | Initialize the content store |
| `resetStore()` | Reset the content store |
| `isStoreInitialized()` | Check if store is initialized |
| `getCollectionConfig(name)` | Get collection configuration |
| `validateEntryData(schema, data)` | Validate data against schema |
| `transformDates(data)` | Transform date strings to Date objects |
| `slugFromPath(path)` | Generate slug from file path |
| `idFromPath(path, base)` | Generate ID from file path |

### Query Functions

| Function | Description |
|----------|-------------|
| `getCollection(name, filterOrOptions?)` | Get all entries from a collection |
| `getEntry(collection, id)` | Get single entry by ID |
| `getEntryBySlug(collection, slug)` | Get entry by slug |
| `getEntries(references)` | Get multiple entries by references |
| `getCollectionTags(collection, field?)` | Get unique tags |
| `getEntriesByTag(collection, tag, field?)` | Get entries by tag |
| `getAdjacentEntries(collection, id, options?)` | Get prev/next entries |
| `resolveReference(reference)` | Resolve a collection reference |
| `groupBy(collection, keyFn, filter?)` | Group entries by key |
| `countEntries(collection, filter?)` | Count entries |
| `hasCollection(name)` | Check if collection exists |
| `getCollectionNames()` | Get all collection names |
| `setContentDir(dir)` | Set content directory |
| `getContentDir()` | Get content directory |
| `setCollectionsConfig(config)` | Set collections configuration |

### Render Functions

| Function | Description |
|----------|-------------|
| `renderContent(content, frontmatter?, options?)` | Render content to component |
| `renderToString(content, options?)` | Render to HTML string |
| `createContentRenderer(options)` | Create preconfigured renderer |
| `processForSearch(content)` | Process for search indexing |
| `getExcerpt(content, maxLength?)` | Get content excerpt |
| `defaultComponents` | Default MDX component mapping |

### RSS Functions

| Function | Description |
|----------|-------------|
| `generateRSS(config)` | Generate RSS 2.0 XML |
| `generateAtom(config)` | Generate Atom XML |
| `generateJSONFeed(config)` | Generate JSON Feed |
| `generateRSSFromCollection(options)` | Generate RSS from collection |
| `generateAtomFromCollection(options)` | Generate Atom from collection |
| `generateJSONFeedFromCollection(options)` | Generate JSON Feed from collection |
| `validateRSSFeed(config)` | Validate RSS configuration |

### Sitemap Functions

| Function | Description |
|----------|-------------|
| `generateSitemap(config)` | Generate XML sitemap |
| `generateSitemapIndex(sitemaps)` | Generate sitemap index |
| `generateSitemapFromCollection(options)` | Generate from collection |
| `generateUrlsFromRoutes(routes, site)` | Generate URLs from routes |
| `splitSitemap(urls, maxUrls?)` | Split large sitemap |
| `generateRobotsTxt(options)` | Generate robots.txt |
| `validateSitemap(config)` | Validate sitemap |

### SEO Functions

| Function | Description |
|----------|-------------|
| `generateMetaTags(config)` | Generate HTML meta tags |
| `generateSEOFromEntry(entry, site, options?)` | Generate SEO from entry |
| `useSEO(config)` | SEO hook for components |

### Utility Functions

| Function | Description |
|----------|-------------|
| `calculateReadingTime(text, options?)` | Calculate reading time |
| `generateExcerpt(text, options?)` | Generate excerpt |
| `extractTableOfContents(headings, options?)` | Extract TOC |
| `renderTableOfContents(toc, options?)` | Render TOC as HTML |
| `findRelatedPosts(current, all, options?)` | Find related posts |
| `generateTagCloud(entries, options?)` | Generate tag cloud |
| `renderTagCloud(cloud, options?)` | Render tag cloud |
| `groupByField(entries, field)` | Group by field |
| `groupByDate(entries, options?)` | Group by date |
| `paginate(items, options?)` | Paginate items |
| `slugify(text)` | Create URL slug |
| `stripMarkdown(text)` | Remove markdown formatting |
| `formatDate(date, format?, locale?)` | Format date |
| `getRelativeTime(date, locale?)` | Get relative time |
| `getFirstWords(text, count)` | Get first N words |

---

## Next Steps

- [Collection Schemas](./schemas.md) - Advanced schema patterns
- [MDX Components](./mdx-components.md) - Custom MDX component mapping
- [Feed Generation](./feeds.md) - RSS, Atom, and JSON feeds
- [SEO Best Practices](./seo.md) - SEO optimization guide
