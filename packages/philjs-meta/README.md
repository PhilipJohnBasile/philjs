# philjs-meta

SEO and meta tag management for PhilJS with OpenGraph, Twitter Cards, JSON-LD, and sitemap generation.

## Features

- ✅ Declarative head management
- ✅ OpenGraph meta tags
- ✅ Twitter Cards
- ✅ JSON-LD structured data
- ✅ Sitemap generation
- ✅ Robots.txt generation
- ✅ Multi-language support
- ✅ Automatic cleanup

## Installation

```bash
npm install philjs-meta
```

## Usage

### Basic Setup

```tsx
import { HeadProvider } from 'philjs-meta';

function App() {
  return (
    <HeadProvider>
      <YourApp />
    </HeadProvider>
  );
}
```

### Setting Title and Meta Tags

```tsx
import { Head, Meta, Title } from 'philjs-meta';

function Page() {
  return (
    <>
      <Head>
        <Title>My Page Title</Title>
        <Meta name="description" content="Page description" />
        <Meta name="keywords" content="philjs, react, framework" />
      </Head>

      <div>Page content</div>
    </>
  );
}
```

### All-in-One SEO Component

```tsx
import { SEO } from 'philjs-meta';

function Page() {
  return (
    <>
      <SEO
        config={{
          title: 'My Page',
          description: 'Page description',
          canonical: 'https://example.com/page',
        }}
        openGraph={{
          title: 'My Page',
          description: 'Page description',
          image: 'https://example.com/og-image.jpg',
          url: 'https://example.com/page',
        }}
        twitter={{
          card: 'summary_large_image',
          site: '@mysite',
          creator: '@creator',
        }}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'My Article',
          author: {
            '@type': 'Person',
            name: 'John Doe',
          },
        }}
      />

      <div>Content</div>
    </>
  );
}
```

### Generate Sitemap

```typescript
import { generateSitemap } from 'philjs-meta';

const entries = [
  {
    url: 'https://example.com',
    lastmod: '2025-12-16',
    changefreq: 'daily',
    priority: 1.0,
  },
  {
    url: 'https://example.com/about',
    lastmod: '2025-12-10',
    changefreq: 'monthly',
    priority: 0.8,
  },
];

const sitemap = generateSitemap(entries);
// Write to public/sitemap.xml
```

### Generate robots.txt

```typescript
import { generateRobotsTxt } from 'philjs-meta';

const robots = generateRobotsTxt({
  rules: [
    {
      userAgent: '*',
      allow: ['/'],
      disallow: ['/admin', '/api'],
    },
  ],
  sitemaps: ['https://example.com/sitemap.xml'],
});
// Write to public/robots.txt
```

## API

See [full API documentation](https://philjs.dev/api/meta).

## License

MIT
