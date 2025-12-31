# Static Site Generation (SSG)

Pre-render pages at build time for maximum performance and reliability.

## What You'll Learn

- SSG fundamentals
- Building static pages
- Dynamic routes with SSG
- Data fetching at build time
- Incremental Static Regeneration (ISR)
- Hybrid rendering
- Best practices

## Why SSG?

Static site generation offers unmatched benefits:

- **Maximum Performance**: Pre-rendered HTML, no server rendering overhead
- **Reliability**: Static files can't crash or have downtime
- **SEO**: Fully rendered HTML for search engines
- **Scalability**: Serve from CDN worldwide
- **Security**: No server-side code execution
- **Cost**: Cheap hosting with static file servers

## Basic SSG Setup

### Build Script

```typescript
// scripts/build-static.ts
import { renderToString } from '@philjs/ssr';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { App } from '../src/App';

interface Route {
  path: string;
  title: string;
}

const routes: Route[] = [
  { path: '/', title: 'Home' },
  { path: '/about', title: 'About' },
  { path: '/contact', title: 'Contact' }
];

async function buildStatic() {
  const distDir = join(process.cwd(), 'dist');
  mkdirSync(distDir, { recursive: true });

  for (const route of routes) {
    const html = await renderToString(<App url={route.path} />);

    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>${route.title}</title>
          <link rel="stylesheet" href="/assets/style.css" />
        </head>
        <body>
          <div id="app">${html}</div>
          <script type="module" src="/assets/entry-client.ts"></script>
        </body>
      </html>
    `;

    const filePath = route.path === '/'
      ? join(distDir, 'index.html')
      : join(distDir, route.path, 'index.html');

    mkdirSync(join(distDir, route.path), { recursive: true });
    writeFileSync(filePath, fullHtml);

    console.log(`✓ Built ${route.path}`);
  }

  console.log('\n✓ Static build complete!');
}

buildStatic().catch(console.error);
```

```json
// package.json
{
  "scripts": {
    "build:static": "tsx scripts/build-static.ts"
  }
}
```

## Dynamic Routes

### Generate Paths from Data

```typescript
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';

interface BlogPost {
  slug: string;
  title: string;
  content: string;
  date: string;
}

async function getBlogPosts(): Promise<BlogPost[]> {
  const postsDir = join(process.cwd(), 'content/blog');
  const files = await readdir(postsDir);

  const posts = await Promise.all(
    files
      .filter(file => file.endsWith('.md'))
      .map(async (file) => {
        const content = await readFile(join(postsDir, file), 'utf-8');
        const { data, content: markdown } = matter(content);

        return {
          slug: file.replace('.md', ''),
          title: data.title,
          content: markdown,
          date: data.date
        };
      })
  );

  return posts.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

async function buildBlogPages() {
  const posts = await getBlogPosts();

  // Build individual post pages
  for (const post of posts) {
    const html = await renderToString(
      <BlogPost post={post} />
    );

    const filePath = join('dist', 'blog', post.slug, 'index.html');
    writeHtmlFile(filePath, html, post.title);

    console.log(`✓ Built /blog/${post.slug}`);
  }

  // Build blog index page
  const indexHtml = await renderToString(
    <BlogIndex posts={posts} />
  );

  writeHtmlFile(join('dist', 'blog', 'index.html'), indexHtml, 'Blog');

  console.log(`✓ Built /blog (${posts.length} posts)`);
}

function writeHtmlFile(filePath: string, html: string, title: string) {
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>${title}</title>
        <link rel="stylesheet" href="/assets/style.css" />
      </head>
      <body>
        <div id="app">${html}</div>
        <script type="module" src="/assets/entry-client.ts"></script>
      </body>
    </html>
  `;

  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, fullHtml);
}
```

### Parallel Build

```typescript
async function buildAllPages() {
  const startTime = Date.now();

  // Build pages in parallel for speed
  await Promise.all([
    buildStaticPages(),
    buildBlogPages(),
    buildProductPages(),
    buildDocPages()
  ]);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n✓ Build completed in ${duration}s`);
}
```

## Data Fetching at Build Time

### API Data

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

async function fetchProducts(): Promise<Product[]> {
  const response = await fetch('https://api.example.com/products');
  return await response.json();
}

async function buildProductPages() {
  const products = await fetchProducts();

  for (const product of products) {
    const html = await renderToString(
      <ProductPage product={product} />
    );

    const filePath = join('dist', 'products', product.id, 'index.html');
    writeHtmlFile(filePath, html, product.name);
  }

  console.log(`✓ Built ${products.length} product pages`);
}
```

### CMS Data

```typescript
import { GraphQLClient } from 'graphql-request';

const client = new GraphQLClient('https://cms.example.com/graphql');

interface Article {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
  };
}

async function fetchArticles(): Promise<Article[]> {
  const query = `
    query {
      articles {
        id
        title
        content
        author {
          name
        }
      }
    }
  `;

  const data = await client.request<{ articles: Article[] }>(query);
  return data.articles;
}

async function buildArticlePages() {
  const articles = await fetchArticles();

  await Promise.all(
    articles.map(async (article) => {
      const html = await renderToString(
        <ArticlePage article={article} />
      );

      const filePath = join('dist', 'articles', article.id, 'index.html');
      writeHtmlFile(filePath, html, article.title);
    })
  );

  console.log(`✓ Built ${articles.length} article pages`);
}
```

## Incremental Static Regeneration (ISR)

Rebuild pages on-demand when data changes.

### ISR with Timestamps

```typescript
import { existsSync, statSync } from 'fs';

interface PageCache {
  html: string;
  timestamp: number;
}

const cache = new Map<string, PageCache>();
const REVALIDATE_SECONDS = 60; // Rebuild after 60 seconds

async function getPage(path: string): Promise<string> {
  const cached = cache.get(path);
  const now = Date.now();

  // Return cached if fresh
  if (cached && (now - cached.timestamp) < REVALIDATE_SECONDS * 1000) {
    return cached.html;
  }

  // Rebuild page
  const html = await buildPage(path);

  cache.set(path, {
    html,
    timestamp: now
  });

  return html;
}

// Express server for ISR
app.get('/blog/:slug', async (req, res) => {
  const path = `/blog/${req.params.slug}`;
  const html = await getPage(path);
  res.send(html);
});
```

### ISR with Webhooks

```typescript
// Rebuild specific pages when CMS content changes
app.post('/api/revalidate', async (req, res) => {
  const { secret, paths } = req.body;

  // Verify secret
  if (secret !== process.env.REVALIDATE_SECRET) {
    return res.status(401).json({ error: 'Invalid secret' });
  }

  try {
    // Rebuild specified pages
    await Promise.all(
      paths.map(async (path: string) => {
        const html = await buildPage(path);

        // Update cache
        cache.set(path, {
          html,
          timestamp: Date.now()
        });

        // Write to disk
        const filePath = join('dist', path, 'index.html');
        writeHtmlFile(filePath, html, 'Updated Page');
      })
    );

    res.json({ revalidated: true, paths });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revalidate' });
  }
});
```

## Hybrid Rendering

Combine SSG with SSR and client-side rendering.

### Hybrid Strategy

```typescript
interface RenderStrategy {
  type: 'static' | 'ssr' | 'client';
  revalidate?: number;
}

const strategies: Record<string, RenderStrategy> = {
  '/': { type: 'static' },
  '/about': { type: 'static' },
  '/blog': { type: 'static', revalidate: 60 },
  '/blog/:slug': { type: 'static', revalidate: 60 },
  '/dashboard': { type: 'ssr' },
  '/admin': { type: 'ssr' }
};

function getStrategy(path: string): RenderStrategy {
  const exactMatch = strategies[path];
  if (exactMatch) return exactMatch;

  // Check for pattern match
  for (const [pattern, strategy] of Object.entries(strategies)) {
    if (matchPattern(pattern, path)) {
      return strategy;
    }
  }

  return { type: 'client' };
}

// Server handles based on strategy
app.get('*', async (req, res) => {
  const strategy = getStrategy(req.path);

  switch (strategy.type) {
    case 'static':
      // Serve pre-built file or use ISR
      if (strategy.revalidate) {
        const html = await getPage(req.path);
        return res.send(html);
      }
      return res.sendFile(join('dist', req.path, 'index.html'));

    case 'ssr':
      // Server-side render
      const html = await render(req.url);
      return res.send(html);

    case 'client':
      // Send SPA shell
      return res.sendFile(join('dist', 'index.html'));
  }
});
```

## Sitemap Generation

```typescript
import { writeFileSync } from 'fs';
import { join } from 'path';

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

function generateSitemap(entries: SitemapEntry[], baseUrl: string): string {
  const urls = entries.map(entry => `
    <url>
      <loc>${baseUrl}${entry.url}</loc>
      ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
      ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
      ${entry.priority ? `<priority>${entry.priority}</priority>` : ''}
    </url>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`;
}

async function buildSitemap() {
  const posts = await getBlogPosts();

  const entries: SitemapEntry[] = [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    { url: '/about', changefreq: 'monthly', priority: 0.8 },
    { url: '/blog', changefreq: 'daily', priority: 0.9 },
    ...posts.map(post => ({
      url: `/blog/${post.slug}`,
      lastmod: post.date,
      changefreq: 'monthly' as const,
      priority: 0.7
    }))
  ];

  const sitemap = generateSitemap(entries, 'https://example.com');
  writeFileSync(join('dist', 'sitemap.xml'), sitemap);

  console.log(`✓ Generated sitemap with ${entries.length} entries`);
}
```

## RSS Feed Generation

```typescript
function generateRSS(posts: BlogPost[], baseUrl: string): string {
  const items = posts.map(post => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <guid>${baseUrl}/blog/${post.slug}</guid>
    </item>
  `).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>My Blog</title>
    <link>${baseUrl}</link>
    <description>Latest blog posts</description>
    <language>en-us</language>
    ${items}
  </channel>
</rss>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function buildRSS() {
  const posts = await getBlogPosts();
  const rss = generateRSS(posts.slice(0, 20), 'https://example.com');

  writeFileSync(join('dist', 'rss.xml'), rss);
  console.log('✓ Generated RSS feed');
}
```

## Best Practices

### Cache Build Data

```typescript
import { readFileSync, writeFileSync, existsSync } from 'fs';

interface BuildCache {
  posts: BlogPost[];
  products: Product[];
  timestamp: number;
}

const CACHE_FILE = '.build-cache.json';

function loadCache(): BuildCache | null {
  if (!existsSync(CACHE_FILE)) return null;

  try {
    const data = readFileSync(CACHE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function saveCache(cache: BuildCache) {
  writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

async function buildWithCache() {
  const cache = loadCache();
  const now = Date.now();

  // Use cache if less than 5 minutes old
  if (cache && (now - cache.timestamp) < 5 * 60 * 1000) {
    console.log('Using cached data');
    return cache;
  }

  // Fetch fresh data
  const [posts, products] = await Promise.all([
    getBlogPosts(),
    fetchProducts()
  ]);

  const newCache = {
    posts,
    products,
    timestamp: now
  };

  saveCache(newCache);
  return newCache;
}
```

### Optimize Images During Build

```typescript
import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';

async function optimizeImages() {
  const sourceDir = 'public/images';
  const outputDir = 'dist/images';

  await mkdir(outputDir, { recursive: true });

  const files = await readdir(sourceDir);

  await Promise.all(
    files
      .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
      .map(async (file) => {
        const input = join(sourceDir, file);
        const output = join(outputDir, file.replace(/\.(jpg|jpeg|png)$/i, '.webp'));

        await sharp(input)
          .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toFile(output);

        console.log(`✓ Optimized ${file}`);
      })
  );
}
```

### Build-Time Type Checking

```typescript
// Validate data at build time
function validateBlogPost(post: any): post is BlogPost {
  if (typeof post.slug !== 'string') {
    throw new Error(`Invalid slug in post: ${JSON.stringify(post)}`);
  }
  if (typeof post.title !== 'string') {
    throw new Error(`Invalid title in post: ${post.slug}`);
  }
  if (typeof post.content !== 'string') {
    throw new Error(`Invalid content in post: ${post.slug}`);
  }
  return true;
}

async function getBlogPosts(): Promise<BlogPost[]> {
  const posts = await fetchRawPosts();

  // Validate each post
  posts.forEach(post => {
    if (!validateBlogPost(post)) {
      throw new Error(`Invalid post: ${JSON.stringify(post)}`);
    }
  });

  return posts;
}
```

### Preview Mode

```typescript
// Enable preview mode for unpublished content
app.get('/api/preview', (req, res) => {
  const { secret, slug } = req.query;

  if (secret !== process.env.PREVIEW_SECRET) {
    return res.status(401).json({ error: 'Invalid secret' });
  }

  // Set preview cookie
  res.setHeader(
    'Set-Cookie',
    `preview=true; Path=/; HttpOnly; Max-Age=3600`
  );

  res.redirect(`/blog/${slug}`);
});

// Serve draft content in preview mode
app.get('/blog/:slug', async (req, res) => {
  const isPreview = req.cookies.preview === 'true';

  const post = isPreview
    ? await getDraftPost(req.params.slug)
    : await getPublishedPost(req.params.slug);

  if (!post) {
    return res.status(404).send('Not found');
  }

  const html = await renderToString(<BlogPost post={post} />);
  res.send(html);
});
```

## Summary

You've learned:

✅ SSG fundamentals and benefits
✅ Building static pages at build time
✅ Generating pages from dynamic data
✅ Data fetching from APIs and CMS
✅ Incremental Static Regeneration (ISR)
✅ Hybrid rendering strategies
✅ Sitemap and RSS generation
✅ Build optimization techniques
✅ Preview mode for draft content

SSG delivers maximum performance and reliability!

---

**Next:** [Internationalization →](./i18n.md) Build multi-language applications
