# philjs-meta

SEO and meta tag management for PhilJS with OpenGraph, Twitter Cards, JSON-LD, and sitemap generation.

## Features

-  Declarative head management
-  OpenGraph meta tags
-  Twitter Cards
-  JSON-LD structured data
-  Sitemap generation
-  Robots.txt generation
-  Multi-language support
-  Automatic cleanup

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

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./router, ./data, ./server, ./config, ./seo
- Source files: packages/philjs-meta/src/index.ts, packages/philjs-meta/src/router/index.ts, packages/philjs-meta/src/data/index.ts, packages/philjs-meta/src/server/index.ts, packages/philjs-meta/src/config/index.ts, packages/philjs-meta/src/seo.tsx

### Public API
- Direct exports: AlternateLanguages, BasicMeta, BuildConfig, BundlerConfig, CORSConfig, CSSModulesConfig, DNSPrefetch, ExperimentalConfig, Favicons, HTTPSConfig, HeadersConfig, I18nConfig, ImageRemotePattern, ImagesConfig, JSONLD, LoadConfigOptions, LocaleDomain, OpenGraph, PhilJSConfig, Preconnect, RateLimitConfig, RedirectConfig, RewriteConfig, RouteCondition, SEO, SEOProps, SSGConfig, SSRConfig, ServerConfig, TwitterCard, defaultConfig, defineConfig, getEnvConfig, loadConfig, validateConfig
- Re-exported names: APIContext, APIHandler, APIResponse, APIRouteHandler, ActionContext, ActionErrors, ActionFunction, ActionResponse, AlternateLanguages, AuthOptions, BasicMeta, BodyParserOptions, BuildCLIOptions, BuildConfig, BuildContext, BuildError, BuildOptions, BuildPlugin, BuildResult, BundleInfo, BundlerConfig, CLIOptions, CORSOptions, CacheControlOptions, CacheEntry, CacheOptions, CacheStats, Compiler, CompressionOptions, CookieOptions, CookieStore, DNSPrefetch, DeferredData, DevServerOptions, ErrorBoundaryConfig, ErrorBoundaryFactory, ErrorBoundaryProps, ExperimentalConfig, ExtractParams, Favicons, FileRouter, FileRouterOptions, FormActionHandler, FormBody, GenerateOptions, GeoInfo, Head, HeadProvider, HeadersConfig, HttpMethod, I18nConfig, ISRConfig, ISRManager, ImagesConfig, InterceptedRoute, JSONBody, JSONLD, JSONLDConfig, LayoutComposition, LayoutContext, LayoutContextManager, LayoutDefinition, LayoutProps, LayoutTreeNode, LayoutUtils, Link, LinkTag, LoadConfigOptions, LoaderContext, LoaderFunction, LoadingConfig, LoadingFactory, LoadingProps, LoggerOptions, Meta, MetaConfig, MetaTag, MiddlewareChain, MiddlewareContext, MiddlewareFunction, MiddlewareResult, MultipartBody, NextResponse, NotFoundResponse, OpenGraph, OpenGraphConfig, OpenGraphImage, ParallelRouteSlot, PhilJSConfig, Preconnect, RateLimitInfo, RateLimitOptions, RateLimitStore, RedirectConfig, RedirectResponse, RequestTiming, RevalidateOptions, RewriteConfig, RobotsConfig, RouteBundle, RouteDefinition, RouteHandlerConfig, RouteManifest, RouteMetadata, RouteSegment, RouteSegmentType, SEO, SSE, SSEEvent, SSEStream, SSGConfig, SSRConfig, SWRConfig, SWRState, Schema, SchemaError, SchemaIssue, SecurityHeadersOptions, ServerConfig, ServerContext, SitemapEntry, StartServerOptions, StaticExportOptions, StaticPageInfo, Title, TwitterCard, TwitterConfig, analyzerPlugin, auth, bodyParser, build, cache, cacheControl, cached, compression, cors, createAPIRoute, createCompiler, createCompilerFromConfig, createErrorBoundary, createFileRouter, createFormAction, createLayoutTree, createLoadingWrapper, createMiddlewareContext, createServerContext, createSitemapEntry, defaultConfig, defer, defineAPIHandler, defineAction, defineConfig, defineLoader, dev, executeAction, executeLoader, generate, generateRobotsTxt, generateRouteManifest, generateSitemap, generateSitemapFromRoutes, generateSitemapIndex, getEnvConfig, getLayoutsForRoute, getParallelSlots, getRouteKey, hydration, json, loadConfig, logger, matchApiRoute, matchRoute, parseBody, parseInterceptedRoute, rateLimit, redirect, revalidatePath, revalidateTag, run, securityHeaders, setRouteContext, splitSitemap, start, staticExportPlugin, unstable_cache, useActionData, useHead, useIsSubmitting, useLoaderData, useParams, useSWR, useSearchParams, validateConfig, z
- Re-exported modules: ./Head.js, ./api-routes.js, ./build/compiler.js, ./cache.js, ./cli/index.js, ./config/index.js, ./data/cache.js, ./data/loaders.js, ./file-based.js, ./layouts.js, ./loaders.js, ./middleware.js, ./router/file-based.js, ./router/layouts.js, ./seo.js, ./server/api-routes.js, ./server/middleware.js, ./sitemap.js, ./types.js
<!-- API_SNAPSHOT_END -->

## License

MIT
