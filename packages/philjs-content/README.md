# PhilJS Content

Astro-style Content Collections for PhilJS with type-safe schemas, MDX support, RSS/Atom feeds, SEO utilities, and powerful content manipulation tools.

<!-- PACKAGE_GUIDE_START -->
## Overview

Astro-style Content Collections for PhilJS with type-safe schemas and MDX support

## Focus Areas

- philjs, content-collections, mdx, markdown, cms, static-content, type-safe, rss, atom, json-feed, sitemap, seo, content-utilities

## Entry Points

- packages/philjs-content/src/index.ts
- packages/philjs-content/src/collection.ts
- packages/philjs-content/src/query.ts
- packages/philjs-content/src/render.ts
- ./vite
- packages/philjs-content/src/rss.ts
- packages/philjs-content/src/sitemap.ts
- packages/philjs-content/src/seo.ts
- packages/philjs-content/src/utils.ts

## Quick Start

```ts
import { AlternateLanguage, AtomAuthor, AtomFeedConfig } from '@philjs/content';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- AlternateLanguage
- AtomAuthor
- AtomFeedConfig
- AtomFeedItem
- FeedFromCollectionOptions
- JSONFeedAttachment
- JSONFeedConfig
- JSONFeedItem
- JSONLDArticle
- JSONLDBreadcrumb
- JSONLDEvent
- JSONLDOrganization
<!-- PACKAGE_GUIDE_END -->

## Features

- **Type-Safe Content Collections** - Define schemas with Zod for frontmatter validation
- **MDX Support** - Write content in Markdown or MDX with full component support
- **RSS/Atom/JSON Feeds** - Auto-generate feeds from your content
- **XML Sitemaps** - Generate sitemaps with image/video support
- **SEO Utilities** - Meta tags, Open Graph, Twitter Cards, JSON-LD
- **Content Utilities** - Reading time, excerpts, TOC, related posts, tag clouds
- **Hot Module Replacement** - Instant updates in development
- **Vite Integration** - Seamless integration with Vite build pipeline

## Installation

```bash
bun add philjs-content zod
```

See full documentation at [README_NEW.md](./README_NEW.md)

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./collection, ./query, ./render, ./vite, ./rss, ./sitemap, ./seo, ./utils
- Source files: packages/philjs-content/src/index.ts, packages/philjs-content/src/collection.ts, packages/philjs-content/src/query.ts, packages/philjs-content/src/render.ts, packages/philjs-content/src/rss.ts, packages/philjs-content/src/sitemap.ts, packages/philjs-content/src/seo.ts, packages/philjs-content/src/utils.ts

### Public API
- Direct exports: AlternateLanguage, AtomAuthor, AtomFeedConfig, AtomFeedItem, FeedFromCollectionOptions, JSONFeedAttachment, JSONFeedConfig, JSONFeedItem, JSONLDArticle, JSONLDBreadcrumb, JSONLDEvent, JSONLDOrganization, JSONLDPerson, JSONLDProduct, JSONLDSchema, JSONLDWebPage, JSONLDWebSite, LinkTag, MetaTag, OpenGraphArticle, OpenGraphBook, OpenGraphConfig, OpenGraphImage, OpenGraphProfile, OpenGraphVideo, RSSEnclosure, RSSFeedConfig, RSSFeedImage, RSSFeedItem, RobotsDirective, RouteInfo, SEOConfig, SitemapAlternate, SitemapConfig, SitemapFromCollectionOptions, SitemapImage, SitemapIndexEntry, SitemapUrl, SitemapVideo, TwitterApp, TwitterCardConfig, TwitterPlayer, calculateReadingTime, countEntries, createContentRenderer, defaultComponents, defineCollection, defineCollections, discoverRoutes, extractTableOfContents, findRelatedPosts, formatDate, generateAtom, generateAtomFromCollection, generateExcerpt, generateJSONFeed, generateJSONFeedFromCollection, generateMetaTags, generateRSS, generateRSSFromCollection, generateRobotsTxt, generateSEOFromEntry, generateSitemap, generateSitemapFromCollection, generateSitemapIndex, generateTagCloud, generateUrlsFromRoutes, getAdjacentEntries, getCollection, getCollectionConfig, getCollectionNames, getCollectionTags, getContentDir, getContentStore, getEntries, getEntriesByTag, getEntry, getEntryBySlug, getExcerpt, getFirstWords, getRelativeTime, groupBy, groupByDate, groupByField, hasCollection, idFromPath, initializeStore, isStoreInitialized, paginate, processForSearch, reference, renderContent, renderTableOfContents, renderTagCloud, renderToString, resetStore, resolveReference, schemas, setCollectionsConfig, setContentDir, slugFromPath, slugify, splitSitemap, stripMarkdown, transformDates, useSEO, validateEntryData, validateRSSFeed, validateSitemap
- Re-exported names: // Build types
  ProcessedContent, // Collection types
  CollectionType, // Content metadata
  ContentHeading, // Entry types
  CollectionEntry, // Helper types
  CollectionNames, // Plugin types
  ContentPluginOptions, // Query types
  CollectionFilter, // Rendering types
  RenderResult, // Store types
  ContentStore, // Watch types
  ContentWatchEvent, CollectionConfig, CollectionDefinition, CollectionEntryType, CollectionReference, CollectionSort, CollectionsConfig, CommonFrontmatter, ContentBuildResult, ContentEntry, ContentImage, ContentValidationError, ContentWatchCallback, DataEntry, GetCollectionOptions, ImageOptimizationOptions, InferCollectionData, MDXCompileOptions, MDXComponentProps, MDXComponents, ReferenceSchema, TOCEntry, countEntries, createContentRenderer, defaultComponents, defineCollection, defineCollections, getAdjacentEntries, getCollection, getCollectionConfig, getCollectionNames, getCollectionTags, getContentDir, getContentStore, getEntries, getEntriesByTag, getEntry, getEntryBySlug, getExcerpt, groupBy, hasCollection, idFromPath, initializeStore, isStoreInitialized, processForSearch, reference, renderContent, renderToString, resetStore, resolveReference, schemas, setCollectionsConfig, setContentDir, slugFromPath, transformDates, validateEntryData, z
- Re-exported modules: ./collection.js, ./query.js, ./render.js, ./types.js, zod
<!-- API_SNAPSHOT_END -->
