# philjs-plugin-seo

Comprehensive SEO plugin for PhilJS with meta tags, OpenGraph, Twitter Cards, JSON-LD structured data, sitemap generation, and robots.txt support.

## Installation

```bash
pnpm add philjs-plugin-seo
```

## Quick Start

### 1. Add the Plugin

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { createSEOPlugin } from 'philjs-plugin-seo';

export default defineConfig({
  plugins: [
    createSEOPlugin({
      baseUrl: 'https://example.com',
      defaults: {
        titleTemplate: '%s | My Site',
        description: 'Default site description',
      },
      openGraph: {
        type: 'website',
        siteName: 'My Site',
      },
      twitter: {
        card: 'summary_large_image',
        site: '@mysite',
      },
      sitemap: true,
      robots: true,
    }).vitePlugin(),
  ],
});
```

### 2. Use SEO in Pages

```tsx
import { setPageSEO } from './lib/seo';

function ProductPage({ product }) {
  setPageSEO({
    meta: {
      title: product.name,
      description: product.description,
    },
    openGraph: {
      type: 'product',
      image: product.image,
      product: {
        price: { amount: product.price, currency: 'USD' },
        availability: 'instock',
      },
    },
    jsonLd: {
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.image,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
  });

  return <div>...</div>;
}
```

## Features

### Meta Tags

```typescript
setPageSEO({
  meta: {
    title: 'Page Title',
    titleTemplate: '%s | Site Name', // %s replaced with title
    description: 'Page description for search engines',
    keywords: ['keyword1', 'keyword2'],
    canonical: 'https://example.com/page',
    robots: { index: true, follow: true },
    author: 'Author Name',
    themeColor: '#ffffff',
  },
});
```

### OpenGraph Tags

```typescript
setPageSEO({
  openGraph: {
    title: 'Share Title',
    description: 'Share description',
    type: 'article',
    url: 'https://example.com/article',
    siteName: 'My Site',
    locale: 'en_US',
    image: {
      url: 'https://example.com/og-image.jpg',
      width: 1200,
      height: 630,
      alt: 'Image description',
    },
    article: {
      publishedTime: '2024-01-15T00:00:00Z',
      modifiedTime: '2024-01-16T00:00:00Z',
      author: ['Author Name'],
      section: 'Technology',
      tag: ['javascript', 'web'],
    },
  },
});
```

### Twitter Cards

```typescript
setPageSEO({
  twitter: {
    card: 'summary_large_image',
    site: '@sitehandle',
    creator: '@authorhandle',
    title: 'Tweet Title',
    description: 'Tweet description',
    image: 'https://example.com/twitter-image.jpg',
    imageAlt: 'Image description',
  },
});
```

### JSON-LD Structured Data

#### Organization

```typescript
import { createOrganization } from './lib/seo';

setPageSEO({
  jsonLd: createOrganization({
    name: 'Company Name',
    url: 'https://example.com',
    logo: 'https://example.com/logo.png',
    sameAs: [
      'https://twitter.com/company',
      'https://facebook.com/company',
      'https://linkedin.com/company/company',
    ],
  }),
});
```

#### Breadcrumbs

```typescript
import { createBreadcrumbs } from './lib/seo';

setPageSEO({
  jsonLd: createBreadcrumbs([
    { name: 'Home', url: 'https://example.com' },
    { name: 'Products', url: 'https://example.com/products' },
    { name: 'Widget', url: 'https://example.com/products/widget' },
  ]),
});
```

#### FAQ Page

```typescript
import { createFAQ } from './lib/seo';

setPageSEO({
  jsonLd: createFAQ([
    {
      question: 'What is PhilJS?',
      answer: 'PhilJS is a modern JavaScript framework...',
    },
    {
      question: 'How do I install it?',
      answer: 'Run pnpm add philjs-core...',
    },
  ]),
});
```

#### Article

```typescript
setPageSEO({
  jsonLd: {
    '@type': 'Article',
    headline: 'Article Title',
    description: 'Article description',
    image: ['https://example.com/image.jpg'],
    datePublished: '2024-01-15T00:00:00Z',
    dateModified: '2024-01-16T00:00:00Z',
    author: {
      '@type': 'Person',
      name: 'Author Name',
      url: 'https://example.com/author',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Publisher Name',
      logo: {
        '@type': 'ImageObject',
        url: 'https://example.com/logo.png',
      },
    },
  },
});
```

### Sitemap Generation

```typescript
createSEOPlugin({
  baseUrl: 'https://example.com',
  sitemap: {
    output: 'sitemap.xml',
    defaultChangefreq: 'weekly',
    defaultPriority: 0.5,
    customEntries: [
      { loc: 'https://example.com/', priority: 1.0, changefreq: 'daily' },
      { loc: 'https://example.com/about', priority: 0.8 },
      {
        loc: 'https://example.com/products',
        priority: 0.9,
        images: [
          { loc: 'https://example.com/product1.jpg', title: 'Product 1' },
        ],
      },
    ],
  },
});
```

### Robots.txt Generation

```typescript
createSEOPlugin({
  baseUrl: 'https://example.com',
  robots: {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/private'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 1,
      },
    ],
    sitemaps: ['https://example.com/sitemap.xml'],
  },
});
```

## API Reference

### Plugin Configuration

| Option | Type | Description |
|--------|------|-------------|
| `baseUrl` | `string` | Base URL for the site |
| `defaults` | `MetaTags` | Default meta tags for all pages |
| `openGraph` | `OpenGraphTags` | Default OpenGraph tags |
| `twitter` | `TwitterTags` | Default Twitter Card tags |
| `jsonLd` | `JsonLd \| JsonLd[]` | Site-wide JSON-LD |
| `sitemap` | `boolean \| SitemapConfig` | Sitemap configuration |
| `robots` | `boolean \| RobotsTxtConfig` | Robots.txt configuration |
| `trailingSlash` | `boolean` | Whether to use trailing slashes |

### Client Functions

| Function | Description |
|----------|-------------|
| `setPageSEO(seo)` | Update page SEO (client-side) |
| `generatePageSEO(seo)` | Generate SEO HTML string (SSR) |
| `mergeSEO(...configs)` | Merge multiple SEO configs |
| `createBreadcrumbs(items)` | Create breadcrumb JSON-LD |
| `createFAQ(questions)` | Create FAQ page JSON-LD |
| `createOrganization(org)` | Create organization JSON-LD |
| `createWebSite(site)` | Create website JSON-LD |

### Robots Directives

```typescript
interface RobotsDirectives {
  index?: boolean;      // Allow indexing
  follow?: boolean;     // Follow links
  noarchive?: boolean;  // No cached version
  nosnippet?: boolean;  // No snippet in results
  noimageindex?: boolean; // No image indexing
  notranslate?: boolean;  // No translation
  maxSnippet?: number;    // Max snippet length
  maxImagePreview?: 'none' | 'standard' | 'large';
  maxVideoPreview?: number;
}
```

## SSR Integration

For server-side rendering, use `generatePageSEO`:

```typescript
import { generatePageSEO } from './lib/seo';
import { renderToString } from 'philjs-core/render-to-string';

const seoHtml = generatePageSEO({
  meta: { title: 'My Page' },
  openGraph: { type: 'website' },
});

const html = `
<!DOCTYPE html>
<html>
<head>
  ${seoHtml}
</head>
<body>
  ${await renderToString(<App />)}
</body>
</html>
`;
```

## License

MIT
