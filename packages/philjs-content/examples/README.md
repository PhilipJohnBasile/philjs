# PhilJS Content - Examples

This directory contains comprehensive examples demonstrating how to use PhilJS Content's RSS, Sitemap, SEO, and content utility features.

## Examples

### RSS Feed Generation (`rss-feed.ts`)

Learn how to generate RSS 2.0, Atom, and JSON feeds from your content collections:

- Manual feed generation with full control
- Auto-generate from content collections
- Podcast RSS feeds with enclosures
- Custom field mapping

### Sitemap Generation (`sitemap.ts`)

Generate XML sitemaps for search engines:

- Basic sitemap generation
- Auto-generate from content collections
- Multi-language sitemaps with alternate links
- Image and video sitemaps
- Sitemap indexes for large sites
- robots.txt generation

### SEO Utilities (`seo.tsx`)

Comprehensive SEO meta tag generation:

- Basic meta tags (title, description, keywords)
- Open Graph tags for social media
- Twitter Cards
- JSON-LD structured data (Article, Product, Organization, etc.)
- Breadcrumb navigation
- Auto-generate from content entries

### Content Utilities (`content-utils.tsx`)

Utility functions for content manipulation:

- Reading time calculation
- Excerpt generation
- Table of contents extraction and rendering
- Related posts finder
- Tag cloud generation
- Date grouping and pagination
- Search with context highlighting

## Running Examples

To run any example:

```bash
# Install dependencies
bun install

# Run an example
bun run examples/rss-feed.ts
bun run examples/sitemap.ts
```

## Integration Examples

### Build Script Integration

Add feed and sitemap generation to your build process:

```json
{
  "scripts": {
    "build": "vite build",
    "build:feed": "tsx scripts/generate-rss.ts",
    "build:sitemap": "tsx scripts/generate-sitemap.ts",
    "build:all": "bun run build && bun run build:feed && bun run build:sitemap"
  }
}
```

### Vite Plugin Integration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import { contentPlugin } from 'philjs-content/vite';

export default defineConfig({
  plugins: [
    contentPlugin({
      contentDir: './content',
    }),
  ],
});
```

### Route Handler Example

```typescript
// routes/feed.xml.ts
import { getCollection } from 'philjs-content';
import { generateRSSFromCollection } from 'philjs-content/rss';

export async function GET() {
  const posts = await getCollection('blog', {
    filter: (post) => !post.data.draft,
    sort: (a, b) => b.data.date.getTime() - a.data.date.getTime(),
    limit: 20,
  });

  const feed = generateRSSFromCollection({
    entries: posts,
    title: 'My Blog',
    description: 'Latest posts',
    site: 'https://example.com',
  });

  return new Response(feed, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=3600',
    },
  });
}
```

## CLI Commands

Generate feed and sitemap setup files:

```bash
# Generate RSS feed setup
philjs generate rss --format rss --collection blog --site https://example.com

# Generate sitemap setup
philjs generate sitemap --collection blog --site https://example.com

# With custom options
philjs generate rss \
  --format atom \
  --collection posts \
  --title "My Awesome Blog" \
  --description "Latest posts" \
  --site https://myblog.com \
  --limit 50

philjs generate sitemap \
  --collection blog \
  --site https://myblog.com \
  --changefreq weekly \
  --priority 0.8
```

## Learn More

- [RSS 2.0 Specification](https://www.rssboard.org/rss-specification)
- [Atom Specification](https://datatracker.ietf.org/doc/html/rfc4287)
- [JSON Feed Specification](https://jsonfeed.org/)
- [Sitemap Protocol](https://www.sitemaps.org/protocol.html)
- [Schema.org](https://schema.org/)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
