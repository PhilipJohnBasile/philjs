# Tutorial: Build a Blog with Static Site Generation

Learn how to build a fully static blog with PhilJS that loads instantly and ranks well in search engines. This tutorial covers static site generation (SSG), markdown content, SEO, and deployment.

## What You'll Learn

- File-based routing for blog posts
- Markdown/MDX content with frontmatter
- Static page generation at build time
- SEO optimization with meta tags
- RSS feed generation
- Sitemap creation
- Incremental Static Regeneration (ISR)
- Deploying to production

## What We're Building

A complete blog with:
- Homepage with post listings
- Individual post pages
- Category filtering
- Tag support
- SEO-optimized meta tags
- RSS feed
- Sitemap
- Fast page loads (< 1s)

## Setup

```bash
pnpm create philjs my-blog
cd my-blog
pnpm install

# Install markdown dependencies
pnpm add gray-matter remark remark-html
pnpm add -D @types/node
```

## Step 1: Project Structure

Create this directory structure:

```
my-blog/
├── content/
│   └── posts/
│       ├── first-post.md
│       ├── second-post.md
│       └── getting-started.md
├── src/
│   ├── routes/
│   │   ├── index.tsx          # Homepage
│   │   ├── blog/
│   │   │   ├── index.tsx      # Blog listing
│   │   │   └── [slug].tsx     # Post page
│   │   └── tags/
│   │       └── [tag].tsx      # Tag page
│   ├── components/
│   │   ├── PostCard.tsx
│   │   ├── PostLayout.tsx
│   │   └── SEO.tsx
│   └── lib/
│       ├── posts.ts           # Post utilities
│       └── seo.ts             # SEO utilities
└── philjs.config.ts
```

## Step 2: Create Sample Blog Posts

Create `content/posts/first-post.md`:

```markdown
---
title: "Getting Started with PhilJS"
date: "2024-01-15"
author: "John Doe"
excerpt: "Learn how to build lightning-fast web apps with PhilJS"
tags: ["philjs", "tutorial", "getting-started"]
image: "/images/first-post.jpg"
---

# Getting Started with PhilJS

PhilJS is a revolutionary framework that combines the best ideas from React, Solid, and Qwik.

## Why PhilJS?

Here are the key benefits:

1. **Zero hydration** - Apps are interactive immediately
2. **Fine-grained reactivity** - Only what changes updates
3. **Built-in SSG** - Static generation out of the box

## Code Example

```typescript
import { signal } from 'philjs-core';

const count = signal(0);

<button onClick={() => count.set(c => c + 1)}>
  Clicked {count()} times
</button>
```

This is just the beginning. PhilJS makes building fast web apps effortless.
```

Create `content/posts/second-post.md`:

```markdown
---
title: "Advanced Patterns in PhilJS"
date: "2024-01-20"
author: "Jane Smith"
excerpt: "Deep dive into advanced PhilJS patterns and best practices"
tags: ["philjs", "advanced", "patterns"]
image: "/images/second-post.jpg"
---

# Advanced Patterns in PhilJS

Once you've mastered the basics, these patterns will help you build production-ready applications.

## Component Composition

Breaking down complex UIs into reusable components is key to maintainable code.

## State Management

Use signals for local state and context for global state. Keep it simple!
```

## Step 3: Create Post Utilities

Create `src/lib/posts.ts`:

```typescript
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

export interface Post {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  tags: string[];
  image?: string;
  content: string;
}

const postsDirectory = path.join(process.cwd(), 'content/posts');

export async function getAllPosts(): Promise<Post[]> {
  const fileNames = fs.readdirSync(postsDirectory);

  const allPosts = await Promise.all(
    fileNames
      .filter(fileName => fileName.endsWith('.md'))
      .map(async fileName => {
        const slug = fileName.replace(/\.md$/, '');
        return getPostBySlug(slug);
      })
  );

  // Sort posts by date (newest first)
  return allPosts.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export async function getPostBySlug(slug: string): Promise<Post> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // Parse frontmatter
  const { data, content } = matter(fileContents);

  // Convert markdown to HTML
  const processedContent = await remark()
    .use(html)
    .process(content);

  const contentHtml = processedContent.toString();

  return {
    slug,
    title: data.title,
    date: data.date,
    author: data.author,
    excerpt: data.excerpt,
    tags: data.tags || [],
    image: data.image,
    content: contentHtml,
  };
}

export async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts();
  const tagSet = new Set<string>();

  posts.forEach(post => {
    post.tags.forEach(tag => tagSet.add(tag));
  });

  return Array.from(tagSet).sort();
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getAllPosts();
  return posts.filter(post =>
    post.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
```

## Step 4: Create SEO Component

Create `src/components/SEO.tsx`:

```typescript
import { Head } from 'philjs-core';

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  author?: string;
  tags?: string[];
}

export function SEO({
  title,
  description,
  image = '/images/og-default.jpg',
  url = 'https://myblog.com',
  type = 'website',
  publishedTime,
  author,
  tags = [],
}: SEOProps) {
  const fullTitle = `${title} | My PhilJS Blog`;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={url} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Article specific */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {author && <meta property="article:author" content={author} />}
      {tags.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}

      {/* Additional SEO */}
      <link rel="canonical" href={url} />
      <meta name="robots" content="index, follow" />
    </Head>
  );
}
```

## Step 5: Create Post Card Component

Create `src/components/PostCard.tsx`:

```typescript
import { Link } from 'philjs-router';
import type { Post } from '../lib/posts';
import { formatDate } from '../lib/posts';

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article style={styles.card}>
      {post.image && (
        <Link href={`/blog/${post.slug}`}>
          <img
            src={post.image}
            alt={post.title}
            style={styles.image}
          />
        </Link>
      )}

      <div style={styles.content}>
        <div style={styles.meta}>
          <time style={styles.date}>{formatDate(post.date)}</time>
          <span style={styles.author}>by {post.author}</span>
        </div>

        <Link href={`/blog/${post.slug}`} style={styles.titleLink}>
          <h2 style={styles.title}>{post.title}</h2>
        </Link>

        <p style={styles.excerpt}>{post.excerpt}</p>

        <div style={styles.tags}>
          {post.tags.map(tag => (
            <Link
              key={tag}
              href={`/tags/${tag}`}
              style={styles.tag}
            >
              #{tag}
            </Link>
          ))}
        </div>

        <Link href={`/blog/${post.slug}`} style={styles.readMore}>
          Read more →
        </Link>
      </div>
    </article>
  );
}

const styles = {
  card: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  image: {
    width: '100%',
    height: '240px',
    objectFit: 'cover' as const,
  },
  content: {
    padding: '1.5rem',
  },
  meta: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '0.75rem',
    fontSize: '0.875rem',
    color: '#666',
  },
  date: {},
  author: {},
  titleLink: {
    textDecoration: 'none',
    color: 'inherit',
  },
  title: {
    margin: '0 0 0.75rem',
    fontSize: '1.5rem',
    color: '#333',
    transition: 'color 0.2s',
  },
  excerpt: {
    margin: '0 0 1rem',
    color: '#666',
    lineHeight: 1.6,
  },
  tags: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
    marginBottom: '1rem',
  },
  tag: {
    padding: '0.25rem 0.75rem',
    background: '#f0f0f0',
    borderRadius: '20px',
    fontSize: '0.875rem',
    color: '#667eea',
    textDecoration: 'none',
    transition: 'background 0.2s',
  },
  readMore: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: 'bold' as const,
  },
};
```

## Step 6: Create Blog Listing Page

Create `src/routes/blog/index.tsx`:

```typescript
import { PostCard } from '../../components/PostCard';
import { SEO } from '../../components/SEO';
import { getAllPosts } from '../../lib/posts';
import type { Post } from '../../lib/posts';

// This runs at build time to generate static page
export async function generateStaticParams() {
  return [{}]; // Generate one static page
}

interface BlogPageProps {
  posts: Post[];
}

export default async function BlogPage() {
  // Fetch posts at build time
  const posts = await getAllPosts();

  return (
    <>
      <SEO
        title="Blog"
        description="Articles about web development, PhilJS, and modern JavaScript"
        url="https://myblog.com/blog"
      />

      <div style={styles.container}>
        <header style={styles.header}>
          <h1 style={styles.title}>Blog</h1>
          <p style={styles.subtitle}>
            Thoughts on web development and PhilJS
          </p>
        </header>

        <div style={styles.grid}>
          {posts.map(post => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>

        {posts.length === 0 && (
          <div style={styles.empty}>
            <p>No posts yet. Check back soon!</p>
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '2rem',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '3rem',
  },
  title: {
    fontSize: '3rem',
    margin: '0 0 1rem',
    color: '#333',
  },
  subtitle: {
    fontSize: '1.25rem',
    color: '#666',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '2rem',
  },
  empty: {
    textAlign: 'center' as const,
    padding: '4rem',
    color: '#999',
  },
};
```

## Step 7: Create Individual Post Page

Create `src/routes/blog/[slug].tsx`:

```typescript
import { SEO } from '../../components/SEO';
import { getAllPosts, getPostBySlug, formatDate } from '../../lib/posts';
import type { Post } from '../../lib/posts';
import { Link } from 'philjs-router';

// Generate static pages for all posts at build time
export async function generateStaticParams() {
  const posts = await getAllPosts();

  return posts.map(post => ({
    slug: post.slug,
  }));
}

interface PostPageProps {
  params: { slug: string };
}

export default async function PostPage({ params }: PostPageProps) {
  const post = await getPostBySlug(params.slug);

  return (
    <>
      <SEO
        title={post.title}
        description={post.excerpt}
        image={post.image}
        url={`https://myblog.com/blog/${post.slug}`}
        type="article"
        publishedTime={post.date}
        author={post.author}
        tags={post.tags}
      />

      <article style={styles.article}>
        <header style={styles.header}>
          <Link href="/blog" style={styles.back}>
            ← Back to blog
          </Link>

          <h1 style={styles.title}>{post.title}</h1>

          <div style={styles.meta}>
            <time style={styles.date}>{formatDate(post.date)}</time>
            <span style={styles.author}>by {post.author}</span>
          </div>

          <div style={styles.tags}>
            {post.tags.map(tag => (
              <Link
                key={tag}
                href={`/tags/${tag}`}
                style={styles.tag}
              >
                #{tag}
              </Link>
            ))}
          </div>
        </header>

        {post.image && (
          <img
            src={post.image}
            alt={post.title}
            style={styles.featuredImage}
          />
        )}

        <div
          style={styles.content}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <footer style={styles.footer}>
          <Link href="/blog" style={styles.backButton}>
            ← Back to all posts
          </Link>
        </footer>
      </article>
    </>
  );
}

const styles = {
  article: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '2rem',
  },
  header: {
    marginBottom: '2rem',
  },
  back: {
    display: 'inline-block',
    marginBottom: '1rem',
    color: '#667eea',
    textDecoration: 'none',
  },
  title: {
    fontSize: '3rem',
    margin: '0 0 1rem',
    color: '#333',
    lineHeight: 1.2,
  },
  meta: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '1rem',
    color: '#666',
  },
  date: {},
  author: {},
  tags: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
  },
  tag: {
    padding: '0.25rem 0.75rem',
    background: '#f0f0f0',
    borderRadius: '20px',
    fontSize: '0.875rem',
    color: '#667eea',
    textDecoration: 'none',
  },
  featuredImage: {
    width: '100%',
    height: 'auto',
    borderRadius: '12px',
    marginBottom: '2rem',
  },
  content: {
    fontSize: '1.125rem',
    lineHeight: 1.8,
    color: '#333',
  },
  footer: {
    marginTop: '3rem',
    paddingTop: '2rem',
    borderTop: '1px solid #eee',
  },
  backButton: {
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    background: '#667eea',
    color: 'white',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold' as const,
  },
};
```

## Step 8: Generate RSS Feed

Create `src/lib/rss.ts`:

```typescript
import { getAllPosts } from './posts';
import type { Post } from './posts';

export async function generateRSS(): Promise<string> {
  const posts = await getAllPosts();
  const siteURL = 'https://myblog.com';

  const rssItems = posts
    .map(post => {
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteURL}/blog/${post.slug}</link>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <guid>${siteURL}/blog/${post.slug}</guid>
      ${post.tags.map(tag => `<category>${escapeXml(tag)}</category>`).join('\n')}
    </item>
  `.trim();
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>My PhilJS Blog</title>
    <link>${siteURL}</link>
    <description>Articles about web development and PhilJS</description>
    <language>en</language>
    <atom:link href="${siteURL}/rss.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
```

Create `src/routes/rss.xml.ts`:

```typescript
import { generateRSS } from '../lib/rss';

export async function GET() {
  const rss = await generateRSS();

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=3600, s-maxage=3600',
    },
  });
}
```

## Step 9: Generate Sitemap

Create `src/routes/sitemap.xml.ts`:

```typescript
import { getAllPosts } from '../lib/posts';

export async function GET() {
  const posts = await getAllPosts();
  const siteURL = 'https://myblog.com';

  const staticPages = [
    '',
    '/blog',
  ];

  const urls = [
    ...staticPages.map(page => ({
      loc: `${siteURL}${page}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: page === '' ? '1.0' : '0.8',
    })),
    ...posts.map(post => ({
      loc: `${siteURL}/blog/${post.slug}`,
      lastmod: post.date,
      changefreq: 'weekly',
      priority: '0.9',
    })),
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>
  `).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=3600, s-maxage=3600',
    },
  });
}
```

## Step 10: Configure Static Generation

Create `philjs.config.ts`:

```typescript
import { defineConfig } from 'philjs/config';

export default defineConfig({
  // Enable static site generation
  output: 'static',

  // Configure build
  build: {
    // Generate static pages
    prerender: true,

    // Optimize images
    images: {
      formats: ['webp', 'avif'],
      sizes: [640, 750, 828, 1080, 1200],
    },
  },

  // SEO
  seo: {
    sitemap: true,
    robots: true,
  },
});
```

## Step 11: Build and Deploy

### Build for Production

```bash
pnpm build
```

This generates static HTML files in `dist/`:

```
dist/
├── index.html
├── blog/
│   ├── index.html
│   ├── first-post/
│   │   └── index.html
│   ├── second-post/
│   │   └── index.html
│   └── getting-started/
│       └── index.html
├── rss.xml
├── sitemap.xml
└── _assets/
    ├── index-abc123.js
    └── index-def456.css
```

### Deploy to Vercel

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod
```

### Deploy to Netlify

```bash
# Install Netlify CLI
pnpm add -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Deploy to Cloudflare Pages

```bash
# Install Wrangler
pnpm add -g wrangler

# Deploy
wrangler pages publish dist
```

## Step 12: Add Incremental Static Regeneration

Update `src/routes/blog/[slug].tsx` for ISR:

```typescript
// Revalidate every hour
export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map(post => ({ slug: post.slug }));
}
```

Now pages regenerate automatically after 1 hour, keeping content fresh without rebuilding the entire site.

## Performance Optimization

### Image Optimization

```typescript
import { Image } from 'philjs/image';

<Image
  src="/images/post.jpg"
  alt="Post cover"
  width={800}
  height={400}
  loading="lazy"
  placeholder="blur"
/>
```

### Code Splitting

```typescript
// Lazy load comments
const Comments = lazy(() => import('./Comments'));

<Suspense fallback={<CommentsLoading />}>
  <Comments postId={post.id} />
</Suspense>
```

### Prefetching

```typescript
import { Link } from 'philjs-router';

// Prefetch on hover
<Link href={`/blog/${post.slug}`} prefetch="hover">
  {post.title}
</Link>
```

## What You Learned

✅ **Static Site Generation** - Building pages at build time
✅ **Markdown content** - Using frontmatter and converting to HTML
✅ **SEO optimization** - Meta tags, Open Graph, Twitter Cards
✅ **RSS feeds** - Syndicating content
✅ **Sitemaps** - Helping search engines discover pages
✅ **File-based routing** - Organizing pages by URL structure
✅ **ISR** - Keeping static pages fresh
✅ **Deployment** - Publishing to Vercel, Netlify, Cloudflare

## Challenges

Extend your blog:

1. **Comments**: Add comment system (Disqus, Giscus)
2. **Search**: Implement full-text search with Algolia
3. **Related posts**: Show similar articles
4. **Reading time**: Calculate and display reading time
5. **Table of contents**: Auto-generate from headings
6. **Code syntax highlighting**: Use Prism or Shiki
7. **Dark mode**: Add theme switching
8. **Newsletter**: Integrate email signup
9. **Analytics**: Add privacy-friendly analytics
10. **CMS**: Connect to headless CMS (Contentful, Sanity)

## Performance Results

Your static blog will be incredibly fast:

- **First Contentful Paint**: < 0.5s
- **Time to Interactive**: < 1s
- **Lighthouse Score**: 95-100
- **Bundle Size**: ~15KB gzipped
- **Page Load**: Instant (prerendered HTML)

## Next Steps

- **[Learn About Routing](../routing/basics.md)** - Master file-based routing
- **[Explore SSG Details](../advanced/ssg.md)** - Deep dive into static generation
- **[SEO Best Practices](../advanced/seo.md)** - Optimize for search engines

---

**Next:** [Thinking in PhilJS →](./thinking-in-philjs.md)
