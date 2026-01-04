/**
 * PhilJS Vercel Adapter
 *
 * Production-ready deployment adapter for Vercel with:
 * - Edge Functions support
 * - Serverless Functions
 * - Incremental Static Regeneration (ISR)
 * - Image Optimization integration
 * - vercel.json generation
 * - Cron jobs support
 * - Middleware support
 *
 * @module philjs-adapters/adapters/vercel
 */
import type { Adapter, AdapterConfig, EdgeAdapter } from '../types.js';
/**
 * Configuration options for the Vercel adapter
 */
export interface VercelAdapterConfig extends AdapterConfig {
    /** Use Edge Runtime (default: false, uses Node.js serverless) */
    edge?: boolean;
    /** Vercel deployment regions */
    regions?: VercelRegion[];
    /** Memory limit in MB (128-3008, default: 1024) */
    memory?: number;
    /** Max duration in seconds (edge: 30s max, serverless: 60s max) */
    maxDuration?: number;
    /** Incremental Static Regeneration configuration */
    isr?: ISRConfig;
    /** Image Optimization configuration */
    images?: ImageOptimizationConfig;
    /** Cron jobs configuration */
    crons?: CronConfig[];
    /** Middleware configuration */
    middleware?: MiddlewareConfig;
    /** Custom headers */
    headers?: HeaderConfig[];
    /** Redirects configuration */
    redirects?: RedirectConfig[];
    /** Rewrites configuration */
    rewrites?: RewriteConfig[];
    /** Function configuration per route */
    functions?: FunctionRouteConfig[];
    /** Enable response streaming (Edge only) */
    streaming?: boolean;
    /** Build output mode */
    buildOutput?: 'serverless' | 'edge' | 'hybrid';
    /** Generate vercel.json */
    generateConfig?: boolean;
    /** Project settings */
    projectSettings?: {
        framework?: string;
        buildCommand?: string;
        outputDirectory?: string;
        installCommand?: string;
        devCommand?: string;
    };
}
/**
 * Vercel deployment regions
 */
export type VercelRegion = 'arn1' | 'bom1' | 'cdg1' | 'cle1' | 'cpt1' | 'dub1' | 'fra1' | 'gru1' | 'hkg1' | 'hnd1' | 'iad1' | 'icn1' | 'kix1' | 'lhr1' | 'pdx1' | 'sfo1' | 'sin1' | 'syd1' | 'all';
/**
 * ISR (Incremental Static Regeneration) configuration
 */
export interface ISRConfig {
    /** Revalidation time in seconds */
    revalidate?: number;
    /** Bypass token for on-demand revalidation */
    bypassToken?: string;
    /** Paths to prerender */
    paths?: string[];
    /** Fallback behavior: 'blocking' | 'true' | 'false' */
    fallback?: 'blocking' | boolean;
    /** Tags for cache invalidation */
    tags?: string[];
}
/**
 * Image Optimization configuration
 */
export interface ImageOptimizationConfig {
    /** Allowed image domains */
    domains?: string[];
    /** Remote patterns for images */
    remotePatterns?: Array<{
        protocol?: 'http' | 'https';
        hostname: string;
        port?: string;
        pathname?: string;
    }>;
    /** Supported image formats */
    formats?: ('image/avif' | 'image/webp')[];
    /** Minimum cache TTL in seconds */
    minimumCacheTTL?: number;
    /** Device sizes for responsive images */
    deviceSizes?: number[];
    /** Image sizes for srcset */
    imageSizes?: number[];
    /** Enable dangerous SVG allow */
    dangerouslyAllowSVG?: boolean;
    /** Content security policy for images */
    contentSecurityPolicy?: string;
}
/**
 * Cron job configuration
 */
export interface CronConfig {
    /** API route path */
    path: string;
    /** Cron schedule expression */
    schedule: string;
}
/**
 * Middleware configuration
 */
export interface MiddlewareConfig {
    /** Matcher patterns for middleware */
    matcher?: string[];
    /** Skip patterns */
    skip?: string[];
    /** Enable geolocation */
    geo?: boolean;
    /** Enable request IP */
    ip?: boolean;
}
/**
 * Header configuration
 */
export interface HeaderConfig {
    /** Source path pattern */
    source: string;
    /** Headers to add */
    headers: Array<{
        key: string;
        value: string;
    }>;
    /** Has condition */
    has?: Array<{
        type: 'header' | 'cookie' | 'host' | 'query';
        key: string;
        value?: string;
    }>;
    /** Missing condition */
    missing?: Array<{
        type: 'header' | 'cookie' | 'host' | 'query';
        key: string;
        value?: string;
    }>;
}
/**
 * Redirect configuration
 */
export interface RedirectConfig {
    /** Source path pattern */
    source: string;
    /** Destination path */
    destination: string;
    /** HTTP status code (301, 302, 307, 308) */
    statusCode?: 301 | 302 | 307 | 308;
    /** Permanent redirect */
    permanent?: boolean;
    /** Has condition */
    has?: Array<{
        type: 'header' | 'cookie' | 'host' | 'query';
        key: string;
        value?: string;
    }>;
}
/**
 * Rewrite configuration
 */
export interface RewriteConfig {
    /** Source path pattern */
    source: string;
    /** Destination path or URL */
    destination: string;
    /** Has condition */
    has?: Array<{
        type: 'header' | 'cookie' | 'host' | 'query';
        key: string;
        value?: string;
    }>;
}
/**
 * Per-route function configuration
 */
export interface FunctionRouteConfig {
    /** Route pattern */
    pattern: string;
    /** Runtime: 'edge' or 'nodejs' */
    runtime?: 'edge' | 'nodejs';
    /** Memory in MB */
    memory?: number;
    /** Max duration in seconds */
    maxDuration?: number;
    /** Regions */
    regions?: VercelRegion[];
}
/**
 * Create a Vercel deployment adapter
 *
 * @example
 * ```typescript
 * import { vercelAdapter } from 'philjs-adapters/adapters/vercel';
 *
 * export default defineConfig({
 *   adapter: vercelAdapter({
 *     edge: true,
 *     regions: ['iad1', 'sfo1'],
 *     isr: {
 *       revalidate: 60,
 *       paths: ['/blog/*'],
 *     },
 *     images: {
 *       domains: ['images.example.com'],
 *       formats: ['image/avif', 'image/webp'],
 *     },
 *   }),
 * });
 * ```
 */
export declare function vercelAdapter(config?: VercelAdapterConfig): Adapter & Partial<EdgeAdapter>;
/**
 * Create Vercel Edge config export for API routes
 *
 * @example
 * ```typescript
 * // In your API route
 * export const config = createVercelEdgeConfig({
 *   regions: ['iad1', 'sfo1'],
 *   maxDuration: 30,
 * });
 * ```
 */
export declare function createVercelEdgeConfig(options?: {
    regions?: VercelRegion[];
    maxDuration?: number;
    streaming?: boolean;
}): object;
/**
 * Trigger on-demand revalidation for a path
 *
 * @example
 * ```typescript
 * // In an API route
 * await revalidatePath('/blog/my-post');
 * ```
 */
export declare function revalidatePath(path: string, options?: {
    type?: 'page' | 'layout';
    secret?: string;
}): Promise<Response>;
/**
 * Trigger revalidation by cache tag
 *
 * @example
 * ```typescript
 * // In an API route
 * await revalidateTag('blog-posts');
 * ```
 */
export declare function revalidateTag(tag: string, options?: {
    secret?: string;
}): Promise<Response>;
/**
 * Get Vercel-specific request context
 */
export declare function getVercelContext(): {
    geo?: {
        country?: string;
        region?: string;
        city?: string;
        latitude?: string;
        longitude?: string;
    };
    ip?: string;
    isEdge: boolean;
};
/**
 * Create an image URL using Vercel's Image Optimization
 *
 * @example
 * ```typescript
 * const optimizedUrl = vercelImageUrl('https://example.com/image.jpg', {
 *   width: 800,
 *   quality: 80,
 * });
 * ```
 */
export declare function vercelImageUrl(src: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'auto' | 'webp' | 'avif';
}): string;
export default vercelAdapter;
//# sourceMappingURL=vercel.d.ts.map