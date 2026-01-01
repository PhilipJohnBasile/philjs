# Static Site Generation (SSG)

Generate pages at build time for maximum performance and SEO.

## What You'll Learn

- Static page generation
- Dynamic path generation
- Incremental Static Regeneration (ISR)
- When to use SSG
- SEO optimization
- Best practices

## What is SSG?

Static Site Generation pre-renders pages at build time:

**Benefits:**
- Blazing fast (served from CDN)
- Perfect SEO (fully rendered HTML)
- No server required
- Lower costs
- Maximum security

**Use for:**
- Marketing pages
- Documentation
- Blogs
- Product catalogs
- Any content that doesn't change often

## Basic Static Generation

### Simple Static Page

```typescript
// src/pages/about.tsx
export default function About() {
  return (
    <div>
      <h1>About Us</h1>
      <p>We build amazing software.</p>
    </div>
  );
}

// This page is automatically statically generated
```

### With Data Fetching

```typescript
// src/pages/blog/index.tsx
interface Post {
  slug: string;
  title: string;
  excerpt: string;
}

export async function getStaticProps() {
  // Fetch at build time
  const posts = await fetch('https://api.example.com/posts')
    .then(r => r.json());

  return {
    props: { posts }
  };
}

export default function Blog({ posts }: { posts: Post[] }) {
  return (
    <div>
      <h1>Blog</h1>
      {posts.map(post => (
        <article key={post.slug}>
          <h2>{post.title}</h2>
          <p>{post.excerpt}</p>
          <Link href={`/blog/${post.slug}`}>Read more</Link>
        </article>
      ))}
    </div>
  );
}
```

## Dynamic Paths

### Generate Static Params

```typescript
// src/pages/blog/[slug].tsx
interface Post {
  slug: string;
  title: string;
  content: string;
  publishedAt: string;
}

// Tell PhilJS which paths to generate
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts')
    .then(r => r.json());

  return posts.map((post: Post) => ({
    slug: post.slug
  }));
}

// Fetch data for each path
export async function getStaticProps({ params }: { params: { slug: string } }) {
  const post = await fetch(`https://api.example.com/posts/${params.slug}`)
    .then(r => r.json());

  return {
    props: { post }
  };
}

export default function BlogPost({ post }: { post: Post }) {
  return (
    <article>
      <h1>{post.title}</h1>
      <time>{new Date(post.publishedAt).toLocaleDateString()}</time>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
```

### Nested Dynamic Routes

```typescript
// src/pages/[category]/[product].tsx
export async function generateStaticParams() {
  const categories = await fetchCategories();

  const paths = [];

  for (const category of categories) {
    const products = await fetchProductsByCategory(category.slug);

    for (const product of products) {
      paths.push({
        category: category.slug,
        product: product.slug
      });
    }
  }

  return paths;
}

export async function getStaticProps({ params }: {
  params: { category: string; product: string }
}) {
  const product = await fetchProduct(params.category, params.product);

  return {
    props: { product }
  };
}

export default function Product({ product }: { product: Product }) {
  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.description}</p>
      <button>Add to Cart - ${product.price}</button>
    </div>
  );
}
```

## Incremental Static Regeneration (ISR)

### Revalidate After Time

```typescript
export async function getStaticProps() {
  const posts = await fetchPosts();

  return {
    props: { posts },
    revalidate: 60 // Regenerate every 60 seconds
  };
}
```

**How it works:**
1. Initial request: Serve stale page
2. Background: Regenerate page
3. Next request: Serve fresh page

### On-Demand Revalidation

```typescript
// src/pages/api/revalidate.ts
export async function POST(request: Request) {
  const { path } = await request.json();

  // Revalidate specific path
  await revalidatePath(path);

  return new Response(JSON.stringify({ revalidated: true }), {
    status: 200
  });
}
```

Trigger from CMS webhook:

```typescript
// When content is updated in CMS
async function onContentUpdate(slug: string) {
  await fetch('https://yoursite.com/api/revalidate', {
    method: 'POST',
    body: JSON.stringify({ path: `/blog/${slug}` })
  });
}
```

## Fallback Behavior

### Static Paths with Fallback

```typescript
export async function generateStaticParams() {
  // Only generate most popular posts at build time
  const popularPosts = await fetchPopularPosts(100);

  return popularPosts.map(post => ({
    slug: post.slug
  }));
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug);

  if (!post) {
    return {
      notFound: true
    };
  }

  return {
    props: { post },
    revalidate: 3600 // Revalidate hourly
  };
}

export const fallback = 'blocking'; // Generate on first request

export default function Post({ post }: { post: Post }) {
  return <PostView post={post} />;
}
```

**Fallback options:**
- `false` - 404 for unknown paths
- `true` - Show loading state, then generate
- `'blocking'` - Wait for generation (no loading state)

## SEO Optimization

### Meta Tags

```typescript
// src/pages/blog/[slug].tsx
export async function getStaticProps({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug);

  return {
    props: { post },
    meta: {
      title: post.title,
      description: post.excerpt,
      openGraph: {
        title: post.title,
        description: post.excerpt,
        image: post.coverImage,
        type: 'article'
      }
    }
  };
}
```

### Structured Data

```typescript
export default function Product({ product }: { product: Product }) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD'
    }
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <h1>{product.name}</h1>
      <p>{product.description}</p>
    </div>
  );
}
```

### Sitemap Generation

```typescript
// src/pages/sitemap.xml.ts
export async function GET() {
  const posts = await fetchAllPosts();
  const products = await fetchAllProducts();

  const urls = [
    { url: '/', changefreq: 'daily', priority: 1.0 },
    ...posts.map(post => ({
      url: `/blog/${post.slug}`,
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: post.updatedAt
    })),
    ...products.map(product => ({
      url: `/products/${product.slug}`,
      changefreq: 'weekly',
      priority: 0.7
    }))
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.map(({ url, changefreq, priority, lastmod }) => `
  <url>
    <loc>https://example.com${url}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
  `).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml'
    }
  });
}
```

## Markdown/MDX Support

### Blog from Markdown Files

```typescript
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

export async function generateStaticParams() {
  const postsDirectory = path.join(process.cwd(), 'content/posts');
  const filenames = fs.readdirSync(postsDirectory);

  return filenames
    .filter(name => name.endsWith('.md'))
    .map(filename => ({
      slug: filename.replace(/\.md$/, '')
    }));
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const filePath = path.join(process.cwd(), 'content/posts', `${params.slug}.md`);
  const fileContents = fs.readFileSync(filePath, 'utf8');

  const { data, content } = matter(fileContents);
  const html = marked(content);

  return {
    props: {
      title: data.title,
      date: data.date,
      content: html
    }
  };
}

export default function Post({ title, date, content }: {
  title: string;
  date: string;
  content: string;
}) {
  return (
    <article>
      <h1>{title}</h1>
      <time>{date}</time>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </article>
  );
}
```

## Build Optimization

### Parallel Generation

```typescript
// philjs.config.ts
export default {
  build: {
    parallel: true, // Generate pages in parallel
    maxWorkers: 4 // Number of worker threads
  }
};
```

### Selective Generation

```typescript
// Only generate first N pages at build time
export async function generateStaticParams() {
  const allPosts = await fetchAllPosts();

  // Generate top 100 at build time
  // Rest generated on demand
  return allPosts.slice(0, 100).map(post => ({
    slug: post.slug
  }));
}

export const fallback = 'blocking'; // Generate others on first request
```

## Hybrid: SSG + Client-Side

### Static Shell, Dynamic Data

```typescript
// Static at build time
export async function getStaticProps() {
  const initialData = await fetchInitialData();

  return {
    props: { initialData }
  };
}

export default function Dashboard({ initialData }: { initialData: any }) {
  // Client-side fetch for real-time data
  const { data: liveData } = useLiveData();

  return (
    <div>
      {/* Static content */}
      <header>{initialData.title}</header>

      {/* Live data */}
      <Stats data={liveData() || initialData.stats} />
    </div>
  );
}
```

## Best Practices

### Use for Stable Content

```typescript
// ✅ SSG for blogs, docs, marketing
export async function getStaticProps() {
  const posts = await fetchPosts();
  return { props: { posts }, revalidate: 3600 };
}

// ❌ SSG for user dashboards (too dynamic)
```

### Set Appropriate Revalidation

```typescript
// ✅ Match revalidation to content update frequency
return {
  props: { data },
  revalidate: 3600 // 1 hour for blog
};

// ❌ Too frequent (defeats purpose)
return {
  props: { data },
  revalidate: 1 // Every second
};
```

### Generate Popular Paths

```typescript
// ✅ Generate most-visited pages
export async function generateStaticParams() {
  const popular = await fetchPopularProducts(1000);
  return popular.map(p => ({ slug: p.slug }));
}

// ❌ Generate everything (slow builds)
export async function generateStaticParams() {
  const all = await fetchAllProducts(); // 1 million products
  return all.map(p => ({ slug: p.slug }));
}
```

### Use Fallback Wisely

```typescript
// ✅ Fallback for dynamic content
export const fallback = 'blocking';

// ❌ No fallback with incomplete generation
export const fallback = false;
// Many 404s!
```

### Optimize Images

```typescript
// ✅ Use optimized images
<img
  src={`/images/${product.slug}.webp`}
  alt={product.name}
  loading="lazy"
/>

// ❌ Large unoptimized images
<img src={product.rawImage} />
```

## Summary

You've learned:

✅ Static page generation
✅ Dynamic path generation with generateStaticParams
✅ Data fetching at build time with getStaticProps
✅ Incremental Static Regeneration (ISR)
✅ Fallback strategies
✅ SEO optimization (meta tags, structured data, sitemaps)
✅ Markdown/MDX support
✅ Build optimization
✅ Hybrid SSG + client-side
✅ Best practices

SSG delivers maximum performance and perfect SEO!

---

**Next:** [Server-Side Rendering →](./server-side-rendering.md) Render pages on each request


