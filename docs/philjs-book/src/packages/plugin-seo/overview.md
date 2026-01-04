# @philjs/plugin-seo

Comprehensive SEO plugin for PhilJS with meta tags, OpenGraph, Twitter Cards, JSON-LD structured data, sitemap generation, and robots.txt support.

## Installation

```bash
npm install @philjs/plugin-seo
# or
pnpm add @philjs/plugin-seo
```

## Features

- **Meta Tags Management** - Full control over page meta tags including title, description, keywords, canonical URLs, and robots directives
- **OpenGraph Tags** - Social sharing optimization for Facebook, LinkedIn, and other platforms
- **Twitter Cards** - Enhanced Twitter/X sharing with summary, large image, app, and player cards
- **JSON-LD Structured Data** - Rich snippets for search engines with support for Organization, Article, Product, FAQ, Breadcrumbs, and more
- **Sitemap Generation** - Automatic XML sitemap generation with image and hreflang support
- **robots.txt Support** - Configurable robots.txt generation with user agent rules

## Quick Start

```typescript
import { createSEOPlugin } from '@philjs/plugin-seo';

const seoPlugin = createSEOPlugin({
  baseUrl: 'https://example.com',
  defaults: {
    title: 'My Site',
    titleTemplate: '%s | My Site',
    description: 'Welcome to my site',
  },
  openGraph: {
    siteName: 'My Site',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@mysite',
  },
  sitemap: true,
  robots: true,
});
```

## Configuration

### SEOPluginConfig

The main configuration object for the SEO plugin:

```typescript
interface SEOPluginConfig {
  /** Base URL for the site (used for sitemap and canonical URLs) */
  baseUrl?: string;

  /** Default meta tags applied to all pages */
  defaults?: MetaTags;

  /** Default OpenGraph tags */
  openGraph?: OpenGraphTags;

  /** Default Twitter Card tags */
  twitter?: TwitterTags;

  /** Site-wide JSON-LD structured data */
  jsonLd?: JsonLd | JsonLd[];

  /** Enable sitemap generation */
  sitemap?: boolean | SitemapConfig;

  /** Enable robots.txt generation */
  robots?: boolean | RobotsTxtConfig;

  /** Enable trailing slashes on URLs */
  trailingSlash?: boolean;
}
```

### Complete Configuration Example

```typescript
import { createSEOPlugin } from '@philjs/plugin-seo';

const seoPlugin = createSEOPlugin({
  baseUrl: 'https://example.com',
  trailingSlash: false,

  defaults: {
    title: 'My Awesome Site',
    titleTemplate: '%s | My Awesome Site',
    description: 'The best site on the internet',
    keywords: ['awesome', 'site', 'example'],
    author: 'John Doe',
    viewport: 'width=device-width, initial-scale=1',
    themeColor: '#3b82f6',
    robots: {
      index: true,
      follow: true,
      maxSnippet: 160,
      maxImagePreview: 'large',
    },
  },

  openGraph: {
    siteName: 'My Awesome Site',
    type: 'website',
    locale: 'en_US',
    image: {
      url: 'https://example.com/og-image.png',
      width: 1200,
      height: 630,
      alt: 'My Awesome Site',
    },
  },

  twitter: {
    card: 'summary_large_image',
    site: '@myawesomesite',
    creator: '@johndoe',
  },

  jsonLd: {
    '@type': 'Organization',
    name: 'My Awesome Company',
    url: 'https://example.com',
    logo: 'https://example.com/logo.png',
    sameAs: [
      'https://twitter.com/myawesomesite',
      'https://linkedin.com/company/myawesomesite',
    ],
  },

  sitemap: {
    output: 'sitemap.xml',
    defaultChangefreq: 'weekly',
    defaultPriority: 0.7,
  },

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

## Meta Tags

### MetaTags Interface

```typescript
interface MetaTags {
  /** Page title */
  title?: string;

  /** Title template (e.g., "%s | My Site") */
  titleTemplate?: string;

  /** Meta description */
  description?: string;

  /** Meta keywords (string or array) */
  keywords?: string | string[];

  /** Canonical URL */
  canonical?: string;

  /** Robots directives */
  robots?: string | RobotsDirectives;

  /** Author */
  author?: string;

  /** Language */
  lang?: string;

  /** Viewport */
  viewport?: string;

  /** Theme color */
  themeColor?: string;

  /** Additional custom meta tags */
  meta?: Array<{
    name?: string;
    property?: string;
    content: string;
    httpEquiv?: string;
  }>;
}
```

### RobotsDirectives Interface

Fine-grained control over search engine behavior:

```typescript
interface RobotsDirectives {
  /** Allow indexing */
  index?: boolean;

  /** Allow following links */
  follow?: boolean;

  /** Prevent caching */
  noarchive?: boolean;

  /** Prevent snippets */
  nosnippet?: boolean;

  /** Prevent image indexing */
  noimageindex?: boolean;

  /** Prevent translation */
  notranslate?: boolean;

  /** Max snippet length in characters */
  maxSnippet?: number;

  /** Max image preview size */
  maxImagePreview?: 'none' | 'standard' | 'large';

  /** Max video preview length in seconds */
  maxVideoPreview?: number;
}
```

### Meta Tags Example

```typescript
import { setPageSEO } from './lib/seo';

setPageSEO({
  meta: {
    title: 'Product Details',
    description: 'Check out our amazing product with great features',
    keywords: ['product', 'amazing', 'features'],
    canonical: 'https://example.com/products/amazing-product',
    robots: {
      index: true,
      follow: true,
      maxSnippet: 160,
      maxImagePreview: 'large',
    },
    author: 'John Doe',
    themeColor: '#3b82f6',
    meta: [
      { name: 'format-detection', content: 'telephone=no' },
      { httpEquiv: 'x-ua-compatible', content: 'IE=edge' },
    ],
  },
});
```

## OpenGraph Tags

### OpenGraphTags Interface

```typescript
interface OpenGraphTags {
  /** OG title */
  title?: string;

  /** OG description */
  description?: string;

  /** OG type */
  type?: 'website' | 'article' | 'book' | 'profile' |
         'music.song' | 'music.album' | 'video.movie' |
         'video.episode' | 'product' | string;

  /** OG URL */
  url?: string;

  /** OG image (single) */
  image?: string | OpenGraphImage;

  /** OG images (multiple) */
  images?: OpenGraphImage[];

  /** Site name */
  siteName?: string;

  /** Locale */
  locale?: string;

  /** Alternate locales */
  alternateLocales?: string[];

  /** Article-specific properties */
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    expirationTime?: string;
    author?: string | string[];
    section?: string;
    tag?: string[];
  };

  /** Product-specific properties */
  product?: {
    price?: {
      amount: number;
      currency: string;
    };
    availability?: 'instock' | 'outofstock' | 'preorder';
  };
}

interface OpenGraphImage {
  url: string;
  secureUrl?: string;
  type?: string;
  width?: number;
  height?: number;
  alt?: string;
}
```

### OpenGraph Example

```typescript
import { setPageSEO } from './lib/seo';

// Basic website
setPageSEO({
  openGraph: {
    title: 'Welcome to My Site',
    description: 'Discover amazing content on our website',
    type: 'website',
    url: 'https://example.com',
    siteName: 'My Site',
    locale: 'en_US',
    image: {
      url: 'https://example.com/og-image.png',
      width: 1200,
      height: 630,
      alt: 'My Site Preview',
    },
  },
});

// Article
setPageSEO({
  openGraph: {
    title: 'How to Build Amazing Apps',
    description: 'A comprehensive guide to building web applications',
    type: 'article',
    url: 'https://example.com/blog/how-to-build-apps',
    article: {
      publishedTime: '2024-01-15T08:00:00Z',
      modifiedTime: '2024-01-20T10:30:00Z',
      author: ['John Doe', 'Jane Smith'],
      section: 'Technology',
      tag: ['web development', 'javascript', 'tutorial'],
    },
  },
});

// Product
setPageSEO({
  openGraph: {
    title: 'Premium Widget',
    description: 'The best widget you will ever use',
    type: 'product',
    url: 'https://example.com/products/premium-widget',
    product: {
      price: {
        amount: 29.99,
        currency: 'USD',
      },
      availability: 'instock',
    },
    images: [
      { url: 'https://example.com/widget-front.jpg', width: 800, height: 600 },
      { url: 'https://example.com/widget-side.jpg', width: 800, height: 600 },
    ],
  },
});
```

## Twitter Cards

### TwitterTags Interface

```typescript
interface TwitterTags {
  /** Card type */
  card?: 'summary' | 'summary_large_image' | 'app' | 'player';

  /** Twitter handle of content creator (e.g., @johndoe) */
  creator?: string;

  /** Twitter handle of site (e.g., @mysite) */
  site?: string;

  /** Title */
  title?: string;

  /** Description */
  description?: string;

  /** Image URL */
  image?: string;

  /** Image alt text */
  imageAlt?: string;
}
```

### Twitter Cards Example

```typescript
import { setPageSEO } from './lib/seo';

// Summary card with large image
setPageSEO({
  twitter: {
    card: 'summary_large_image',
    site: '@mycompany',
    creator: '@johndoe',
    title: 'Amazing Article Title',
    description: 'This article will change the way you think about...',
    image: 'https://example.com/twitter-card.png',
    imageAlt: 'Article preview image',
  },
});

// Simple summary card
setPageSEO({
  twitter: {
    card: 'summary',
    site: '@mycompany',
    title: 'My Company',
    description: 'We build amazing products',
  },
});
```

## JSON-LD Structured Data

The plugin provides helper functions for creating common JSON-LD schemas and supports all major structured data types.

### Supported JSON-LD Types

```typescript
type JsonLdType =
  | 'Organization'
  | 'Person'
  | 'WebSite'
  | 'WebPage'
  | 'Article'
  | 'NewsArticle'
  | 'BlogPosting'
  | 'Product'
  | 'BreadcrumbList'
  | 'FAQPage'
  | 'HowTo'
  | 'Recipe'
  | 'Event'
  | 'LocalBusiness'
  | 'Review'
  | 'VideoObject'
  | 'ImageObject'
  | 'SoftwareApplication'
  | 'Course'
  | 'JobPosting';
```

### createBreadcrumbs()

Create breadcrumb navigation structured data:

```typescript
import { createBreadcrumbs, setPageSEO } from './lib/seo';

setPageSEO({
  jsonLd: createBreadcrumbs([
    { name: 'Home', url: 'https://example.com' },
    { name: 'Products', url: 'https://example.com/products' },
    { name: 'Widgets', url: 'https://example.com/products/widgets' },
    { name: 'Premium Widget' }, // Last item typically has no URL
  ]),
});
```

**Output:**
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com" },
    { "@type": "ListItem", "position": 2, "name": "Products", "item": "https://example.com/products" },
    { "@type": "ListItem", "position": 3, "name": "Widgets", "item": "https://example.com/products/widgets" },
    { "@type": "ListItem", "position": 4, "name": "Premium Widget" }
  ]
}
```

### createFAQ()

Create FAQ page structured data:

```typescript
import { createFAQ, setPageSEO } from './lib/seo';

setPageSEO({
  jsonLd: createFAQ([
    {
      question: 'What is PhilJS?',
      answer: 'PhilJS is a modern JavaScript framework for building web applications.',
    },
    {
      question: 'Is PhilJS free to use?',
      answer: 'Yes, PhilJS is open source and free to use under the MIT license.',
    },
    {
      question: 'How do I get started?',
      answer: 'Install PhilJS using npm: npm create philjs@latest',
    },
  ]),
});
```

**Output:**
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is PhilJS?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "PhilJS is a modern JavaScript framework for building web applications."
      }
    }
  ]
}
```

### createOrganization()

Create organization structured data:

```typescript
import { createOrganization, setPageSEO } from './lib/seo';

setPageSEO({
  jsonLd: createOrganization({
    name: 'My Company',
    url: 'https://example.com',
    logo: 'https://example.com/logo.png',
    sameAs: [
      'https://twitter.com/mycompany',
      'https://linkedin.com/company/mycompany',
      'https://github.com/mycompany',
    ],
  }),
});
```

### createWebSite()

Create website structured data with optional search action:

```typescript
import { createWebSite, setPageSEO } from './lib/seo';

setPageSEO({
  jsonLd: createWebSite({
    name: 'My Site',
    url: 'https://example.com',
    searchUrl: 'https://example.com/search?q={search_term_string}',
  }),
});
```

**Output:**
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "My Site",
  "url": "https://example.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://example.com/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  }
}
```

### Product JSON-LD

```typescript
import { setPageSEO } from './lib/seo';
import type { ProductJsonLd } from '@philjs/plugin-seo';

const productJsonLd: ProductJsonLd = {
  '@type': 'Product',
  name: 'Premium Widget',
  description: 'The best widget for all your needs',
  image: ['https://example.com/widget-1.jpg', 'https://example.com/widget-2.jpg'],
  brand: {
    '@type': 'Brand',
    name: 'WidgetCo',
  },
  sku: 'WIDGET-001',
  offers: {
    '@type': 'Offer',
    price: 29.99,
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    url: 'https://example.com/products/premium-widget',
    priceValidUntil: '2024-12-31',
    seller: {
      '@type': 'Organization',
      name: 'My Store',
    },
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: 4.8,
    reviewCount: 124,
    bestRating: 5,
    worstRating: 1,
  },
};

setPageSEO({ jsonLd: productJsonLd });
```

### Article JSON-LD

```typescript
import { setPageSEO } from './lib/seo';
import type { ArticleJsonLd } from '@philjs/plugin-seo';

const articleJsonLd: ArticleJsonLd = {
  '@type': 'Article',
  headline: 'How to Build Modern Web Apps',
  description: 'A comprehensive guide to building web applications',
  image: 'https://example.com/article-image.jpg',
  datePublished: '2024-01-15T08:00:00Z',
  dateModified: '2024-01-20T10:30:00Z',
  author: {
    '@type': 'Person',
    name: 'John Doe',
    url: 'https://example.com/authors/john-doe',
  },
  publisher: {
    '@type': 'Organization',
    name: 'My Blog',
    logo: {
      '@type': 'ImageObject',
      url: 'https://example.com/logo.png',
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://example.com/blog/how-to-build-web-apps',
  },
};

setPageSEO({ jsonLd: articleJsonLd });
```

### Multiple JSON-LD Schemas

You can include multiple JSON-LD schemas on a single page:

```typescript
import { createBreadcrumbs, createOrganization, setPageSEO } from './lib/seo';

setPageSEO({
  jsonLd: [
    createOrganization({
      name: 'My Company',
      url: 'https://example.com',
    }),
    createBreadcrumbs([
      { name: 'Home', url: 'https://example.com' },
      { name: 'About' },
    ]),
  ],
});
```

## Sitemap Generation

### SitemapConfig Interface

```typescript
interface SitemapConfig {
  /** Output path (default: 'sitemap.xml') */
  output?: string;

  /** Routes to include (glob patterns) */
  include?: string[];

  /** Routes to exclude (glob patterns) */
  exclude?: string[];

  /** Default change frequency */
  defaultChangefreq?: 'always' | 'hourly' | 'daily' | 'weekly' |
                      'monthly' | 'yearly' | 'never';

  /** Default priority (0.0 - 1.0) */
  defaultPriority?: number;

  /** Custom sitemap entries */
  customEntries?: SitemapEntry[];

  /** Generate sitemap index for large sites */
  generateIndex?: boolean;

  /** Max entries per sitemap file */
  maxEntriesPerFile?: number;
}

interface SitemapEntry {
  /** URL */
  loc: string;

  /** Last modified date */
  lastmod?: string | Date;

  /** Change frequency */
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' |
               'monthly' | 'yearly' | 'never';

  /** Priority (0.0 - 1.0) */
  priority?: number;

  /** Alternate language versions */
  alternates?: Array<{
    hreflang: string;
    href: string;
  }>;

  /** Images */
  images?: Array<{
    loc: string;
    caption?: string;
    title?: string;
  }>;
}
```

### Sitemap Example

```typescript
import { createSEOPlugin } from '@philjs/plugin-seo';

const seoPlugin = createSEOPlugin({
  baseUrl: 'https://example.com',
  sitemap: {
    output: 'sitemap.xml',
    defaultChangefreq: 'weekly',
    defaultPriority: 0.7,
    exclude: ['/admin/*', '/private/*'],
    customEntries: [
      {
        loc: 'https://example.com',
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date(),
      },
      {
        loc: 'https://example.com/products',
        changefreq: 'daily',
        priority: 0.9,
        images: [
          {
            loc: 'https://example.com/products-hero.jpg',
            title: 'Our Products',
          },
        ],
      },
      {
        loc: 'https://example.com/about',
        changefreq: 'monthly',
        priority: 0.6,
        alternates: [
          { hreflang: 'en', href: 'https://example.com/about' },
          { hreflang: 'es', href: 'https://example.com/es/about' },
          { hreflang: 'fr', href: 'https://example.com/fr/about' },
        ],
      },
    ],
  },
});
```

**Generated sitemap.xml:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://example.com</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://example.com/products</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <image:image>
      <image:loc>https://example.com/products-hero.jpg</image:loc>
      <image:title>Our Products</image:title>
    </image:image>
  </url>
  <url>
    <loc>https://example.com/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <xhtml:link rel="alternate" hreflang="en" href="https://example.com/about" />
    <xhtml:link rel="alternate" hreflang="es" href="https://example.com/es/about" />
    <xhtml:link rel="alternate" hreflang="fr" href="https://example.com/fr/about" />
  </url>
</urlset>
```

## robots.txt Generation

### RobotsTxtConfig Interface

```typescript
interface RobotsTxtConfig {
  /** Output path (default: 'robots.txt') */
  output?: string;

  /** User agent rules */
  rules?: Array<{
    /** User agent(s) to target */
    userAgent: string | string[];

    /** Paths to allow */
    allow?: string | string[];

    /** Paths to disallow */
    disallow?: string | string[];

    /** Crawl delay in seconds */
    crawlDelay?: number;
  }>;

  /** Sitemap URLs to include */
  sitemaps?: string[];

  /** Additional directives */
  additionalDirectives?: string[];
}
```

### robots.txt Example

```typescript
import { createSEOPlugin } from '@philjs/plugin-seo';

const seoPlugin = createSEOPlugin({
  baseUrl: 'https://example.com',
  robots: {
    output: 'robots.txt',
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/private', '/api'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 1,
      },
      {
        userAgent: ['Bingbot', 'Slurp'],
        allow: '/',
        disallow: '/tmp',
        crawlDelay: 2,
      },
      {
        userAgent: 'BadBot',
        disallow: '/',
      },
    ],
    sitemaps: [
      'https://example.com/sitemap.xml',
      'https://example.com/sitemap-products.xml',
    ],
    additionalDirectives: [
      'Host: example.com',
    ],
  },
});
```

**Generated robots.txt:**
```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /private
Disallow: /api

User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
User-agent: Slurp
Allow: /
Disallow: /tmp
Crawl-delay: 2

User-agent: BadBot
Disallow: /

Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/sitemap-products.xml

Host: example.com
```

## Client API

### setPageSEO()

Update the current page's SEO metadata. Merges with default configuration:

```typescript
import { setPageSEO } from './lib/seo';

// In a component or page
setPageSEO({
  meta: {
    title: 'Product Details',
    description: 'View our amazing product',
  },
  openGraph: {
    image: '/product-og.png',
  },
});
```

### generateSEOHead()

Generate SEO HTML tags as a string (useful for SSR):

```typescript
import { generateSEOHead } from '@philjs/plugin-seo';

const seoHtml = generateSEOHead({
  meta: {
    title: 'My Page',
    description: 'Page description',
  },
  openGraph: {
    title: 'My Page',
    image: '/og-image.png',
  },
  twitter: {
    card: 'summary_large_image',
  },
});

// Returns:
// <title>My Page</title>
// <meta name="description" content="Page description" />
// <meta property="og:title" content="My Page" />
// <meta property="og:image" content="/og-image.png" />
// <meta name="twitter:card" content="summary_large_image" />
```

### mergeSEO()

Merge multiple SEO configurations (later configs override earlier ones):

```typescript
import { mergeSEO } from '@philjs/plugin-seo';

const baseSEO = {
  meta: { title: 'Base Title', description: 'Base description' },
  openGraph: { siteName: 'My Site' },
};

const pageSEO = {
  meta: { title: 'Page Title' },
  openGraph: { image: '/page-image.png' },
};

const merged = mergeSEO(baseSEO, pageSEO);
// Result:
// {
//   meta: { title: 'Page Title', description: 'Base description' },
//   openGraph: { siteName: 'My Site', image: '/page-image.png' },
// }
```

### updateHead()

Update the document head directly in the browser:

```typescript
import { updateHead } from '@philjs/plugin-seo';

updateHead({
  meta: {
    title: 'Dynamic Page Title',
    description: 'Updated description',
  },
  openGraph: {
    title: 'Dynamic Page Title',
  },
});
```

This function:
- Updates `document.title` with the new title
- Removes existing SEO meta tags (marked with `data-philjs-seo`)
- Injects new meta, OpenGraph, Twitter, and JSON-LD tags

## PageSEO Interface

The complete page SEO data structure:

```typescript
interface PageSEO {
  /** Meta tags */
  meta?: MetaTags;

  /** OpenGraph tags */
  openGraph?: OpenGraphTags;

  /** Twitter Card tags */
  twitter?: TwitterTags;

  /** JSON-LD structured data */
  jsonLd?: JsonLd | JsonLd[];

  /** Additional link tags */
  links?: Array<{
    rel: string;
    href: string;
    hreflang?: string;
    type?: string;
  }>;
}
```

### Complete Page SEO Example

```typescript
import { setPageSEO, createBreadcrumbs } from './lib/seo';

setPageSEO({
  meta: {
    title: 'Premium Widget - Best Widgets Store',
    description: 'Buy the Premium Widget - the best widget for all your needs',
    keywords: ['widget', 'premium', 'quality'],
    canonical: 'https://example.com/products/premium-widget',
    robots: { index: true, follow: true },
  },

  openGraph: {
    title: 'Premium Widget',
    description: 'The best widget you will ever use',
    type: 'product',
    url: 'https://example.com/products/premium-widget',
    image: {
      url: 'https://example.com/widgets/premium-og.jpg',
      width: 1200,
      height: 630,
      alt: 'Premium Widget',
    },
    product: {
      price: { amount: 29.99, currency: 'USD' },
      availability: 'instock',
    },
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Premium Widget',
    description: 'The best widget you will ever use',
    image: 'https://example.com/widgets/premium-twitter.jpg',
  },

  jsonLd: [
    createBreadcrumbs([
      { name: 'Home', url: 'https://example.com' },
      { name: 'Products', url: 'https://example.com/products' },
      { name: 'Premium Widget' },
    ]),
    {
      '@type': 'Product',
      name: 'Premium Widget',
      description: 'The best widget for all your needs',
      image: 'https://example.com/widgets/premium.jpg',
      offers: {
        '@type': 'Offer',
        price: 29.99,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    },
  ],

  links: [
    { rel: 'alternate', href: 'https://example.com/es/products/premium-widget', hreflang: 'es' },
    { rel: 'alternate', href: 'https://example.com/fr/products/premium-widget', hreflang: 'fr' },
  ],
});
```

## Vite Integration

The SEO plugin automatically integrates with Vite to:

1. **Inject default SEO tags** into `index.html` during build
2. **Generate sitemap.xml** during build
3. **Generate robots.txt** during build

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { createSEOPlugin } from '@philjs/plugin-seo';

const seoPlugin = createSEOPlugin({
  baseUrl: 'https://example.com',
  defaults: {
    title: 'My Site',
    description: 'Welcome to my site',
  },
  sitemap: true,
  robots: true,
});

export default defineConfig({
  plugins: [
    seoPlugin.vitePlugin({}),
  ],
});
```

## Best Practices

1. **Always set a title and description** - These are the most important meta tags for SEO
2. **Use title templates** - Keep consistent branding with `titleTemplate: '%s | My Site'`
3. **Include OpenGraph and Twitter tags** - Essential for social sharing
4. **Add structured data** - JSON-LD helps search engines understand your content
5. **Set canonical URLs** - Prevent duplicate content issues
6. **Generate sitemaps** - Help search engines discover your pages
7. **Configure robots.txt** - Control crawler access to your site

## API Reference

### Exports from `@philjs/plugin-seo`

```typescript
// Main plugin
export { createSEOPlugin } from '@philjs/plugin-seo';

// Head utilities
export {
  generateMetaTags,
  generateOpenGraphTags,
  generateTwitterTags,
  generateJsonLd,
  generateSEOHead,
  mergeSEO,
  updateHead,
  createBreadcrumbs,
  createFAQ,
  createOrganization,
  createWebSite,
} from '@philjs/plugin-seo';

// Types
export type {
  SEOPluginConfig,
  PageSEO,
  MetaTags,
  OpenGraphTags,
  TwitterTags,
  JsonLd,
  JsonLdType,
  SitemapEntry,
  SitemapConfig,
  RobotsTxtConfig,
  RobotsDirectives,
  OpenGraphImage,
  OrganizationJsonLd,
  WebSiteJsonLd,
  ArticleJsonLd,
  ProductJsonLd,
  BreadcrumbJsonLd,
  FAQJsonLd,
} from '@philjs/plugin-seo';
```

### Exports from `@philjs/plugin-seo/head`

Direct access to head management utilities:

```typescript
import {
  generateSEOHead,
  updateHead,
  mergeSEO,
  createBreadcrumbs,
  createFAQ,
  createOrganization,
  createWebSite,
} from '@philjs/plugin-seo/head';
```
