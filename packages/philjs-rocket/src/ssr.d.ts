/**
 * PhilJS Rocket SSR
 *
 * Server-side rendering integration for Rocket framework.
 * Provides streaming SSR, hydration, and SEO utilities.
 */
/**
 * SSR context passed to renderers
 */
export interface SSRContext {
    /** Request URL */
    url: string;
    /** Request path */
    path: string;
    /** Query parameters */
    query: Record<string, string>;
    /** Request headers */
    headers: Record<string, string>;
    /** User agent */
    userAgent?: string;
    /** Whether the client is a bot */
    isBot: boolean;
    /** Accept-Language header parsed */
    acceptLanguage: string[];
    /** Whether the client is mobile */
    isMobile: boolean;
    /** Request ID for tracing */
    requestId: string;
}
/**
 * SSR render result
 */
export interface SSRResult {
    /** Rendered HTML */
    html: string;
    /** Document head content */
    head: HeadContent;
    /** Hydration data */
    hydrationData?: unknown;
    /** HTTP status */
    status: number;
    /** Response headers */
    headers: Record<string, string>;
    /** Redirect URL (if applicable) */
    redirect?: string;
}
/**
 * Head content for SEO
 */
export interface HeadContent {
    /** Document title */
    title?: string;
    /** Meta tags */
    meta: MetaTag[];
    /** Link tags */
    links: LinkTag[];
    /** Scripts (head) */
    scripts: ScriptTag[];
    /** Styles */
    styles: StyleTag[];
    /** JSON-LD structured data */
    jsonLd?: Record<string, unknown>;
}
/**
 * Meta tag
 */
export interface MetaTag {
    name?: string;
    property?: string;
    content: string;
    httpEquiv?: string;
    charset?: string;
}
/**
 * Link tag
 */
export interface LinkTag {
    rel: string;
    href: string;
    type?: string;
    as?: string;
    crossorigin?: string;
    hreflang?: string;
}
/**
 * Script tag
 */
export interface ScriptTag {
    src?: string;
    content?: string;
    type?: string;
    async?: boolean;
    defer?: boolean;
    module?: boolean;
    id?: string;
}
/**
 * Style tag
 */
export interface StyleTag {
    content: string;
    id?: string;
}
/**
 * Render function type
 */
export type RenderFunction<T = unknown> = (props: T, ctx: SSRContext) => string | Promise<string>;
/**
 * SSR Renderer configuration
 */
export interface SSRRendererConfig {
    /** Enable streaming */
    streaming?: boolean;
    /** Enable hydration */
    hydration?: boolean;
    /** Default title */
    defaultTitle?: string;
    /** Default meta tags */
    defaultMeta?: MetaTag[];
    /** Static assets path */
    assetsPath?: string;
    /** Enable caching */
    cache?: boolean;
    /** Cache TTL in seconds */
    cacheTTL?: number;
}
/**
 * SSR Renderer class
 */
export declare class SSRRenderer {
    private config;
    private cache;
    constructor(config?: SSRRendererConfig);
    /**
     * Render a component to HTML
     */
    render<T>(renderFn: RenderFunction<T>, props: T, ctx: SSRContext): Promise<SSRResult>;
    /**
     * Render with streaming
     */
    renderStream<T>(renderFn: RenderFunction<T>, props: T, ctx: SSRContext): ReadableStream<Uint8Array>;
    /**
     * Build a full HTML document
     */
    private buildDocument;
    /**
     * Get cache key for a request
     */
    private getCacheKey;
    /**
     * Clear cache
     */
    clearCache(): void;
    /**
     * Clear expired cache entries
     */
    pruneCache(): void;
}
/**
 * Create SSR context from request data
 */
export declare function createSSRContext(url: string, headers: Record<string, string>): SSRContext;
/**
 * Generate meta tags for SEO
 */
export declare function generateSEOMeta(options: {
    title: string;
    description: string;
    url: string;
    image?: string;
    type?: string;
    siteName?: string;
    twitterCard?: 'summary' | 'summary_large_image';
    twitterSite?: string;
    locale?: string;
}): MetaTag[];
/**
 * Generate JSON-LD for structured data
 */
export declare function generateJsonLd(type: 'WebSite' | 'Article' | 'Product' | 'Organization' | 'Person' | 'BreadcrumbList', data: Record<string, unknown>): Record<string, unknown>;
/**
 * Create an SSR renderer
 */
export declare function createSSRRenderer(config?: SSRRendererConfig): SSRRenderer;
/**
 * Create a streaming SSR renderer
 */
export declare function createStreamingRenderer(config?: Omit<SSRRendererConfig, 'streaming'>): SSRRenderer;
/**
 * Generate Rust SSR code
 */
export declare function generateRustSSRCode(): string;
//# sourceMappingURL=ssr.d.ts.map