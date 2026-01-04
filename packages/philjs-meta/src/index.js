/**
 * PhilJS Meta - Next.js/SvelteKit-style Meta-Framework
 *
 * A full-featured meta-framework for PhilJS with:
 * - File-based routing
 * - Nested layouts
 * - Data loading (loaders/actions)
 * - SSR/SSG support
 * - API routes
 * - Middleware
 * - Caching strategies
 */
// ==========================================
// Router
// ==========================================
export { createFileRouter, generateRouteManifest, matchRoute, matchApiRoute, } from './router/file-based.js';
export { createLayoutTree, getLayoutsForRoute, getParallelSlots, parseInterceptedRoute, createErrorBoundary, createLoadingWrapper, LayoutContextManager, LayoutUtils, } from './router/layouts.js';
// ==========================================
// Data Loading
// ==========================================
export { defineLoader, defineAction, executeLoader, executeAction, useLoaderData, useActionData, useIsSubmitting, useParams, useSearchParams, setRouteContext, getRouteKey, createFormAction, createServerContext, json, redirect, defer, hydration, RedirectResponse, NotFoundResponse, DeferredData, } from './data/loaders.js';
// ==========================================
// Caching
// ==========================================
export { cached, useSWR, revalidatePath, revalidateTag, cacheControl, unstable_cache, cache, ISRManager, } from './data/cache.js';
// ==========================================
// Server & Middleware
// ==========================================
export { createMiddlewareContext, MiddlewareChain, NextResponse, cors, auth, rateLimit, securityHeaders, logger, compression, bodyParser, } from './server/middleware.js';
// ==========================================
// API Routes
// ==========================================
export { createAPIRoute, defineAPIHandler, parseBody, APIResponse, SSE, z, } from './server/api-routes.js';
// ==========================================
// Build System
// ==========================================
export { Compiler, createCompiler, createCompilerFromConfig, analyzerPlugin, staticExportPlugin, } from './build/compiler.js';
// ==========================================
// Configuration
// ==========================================
export { loadConfig, defineConfig, validateConfig, getEnvConfig, defaultConfig, } from './config/index.js';
// ==========================================
// CLI (for programmatic access)
// ==========================================
export { dev, build, start, generate, run, } from './cli/index.js';
// ==========================================
// SEO (Legacy exports - moved to seo submodule)
// ==========================================
export { HeadProvider, Head, Meta, Link, Title, useHead } from './Head.js';
export { SEO, BasicMeta, OpenGraph, TwitterCard, JSONLD, Favicons, AlternateLanguages, Preconnect, DNSPrefetch, } from './seo.js';
export { generateSitemap, generateSitemapIndex, generateRobotsTxt, createSitemapEntry, splitSitemap, generateSitemapFromRoutes, } from './sitemap.js';
//# sourceMappingURL=index.js.map