/**
 * PhilJS Poem SSR (Server-Side Rendering)
 *
 * Server-side rendering helpers for PhilJS components in Poem.
 * Supports both synchronous and streaming SSR, with hydration support.
 */
import type { PoemSSRConfig, MetaTag, Script } from './types.js';
/**
 * SSR render result
 */
export interface SSRResult {
    html: string;
    head: SSRHead;
    hydrationData?: unknown;
    renderTime: number;
}
/**
 * SSR head data (meta tags, title, etc.)
 */
export interface SSRHead {
    title?: string;
    meta: MetaTag[];
    links: SSRLink[];
    scripts: Script[];
    styles: string[];
}
/**
 * Link tag definition
 */
export interface SSRLink {
    rel: string;
    href: string;
    as?: string;
    type?: string;
    crossorigin?: string;
}
/**
 * SSR context passed to components
 */
export interface SSRContext {
    url: string;
    path: string;
    query: Record<string, string>;
    headers: Record<string, string>;
    userAgent?: string;
    isBot: boolean;
    isMobile: boolean;
    acceptLanguage: string[];
    requestId: string;
    cookies: Record<string, string>;
}
/**
 * SSR render options
 */
export interface SSRRenderOptions {
    /** Enable streaming */
    streaming?: boolean;
    /** Inject hydration scripts */
    hydration?: boolean;
    /** Custom head elements */
    head?: Partial<SSRHead>;
    /** Initial state for hydration */
    initialState?: unknown;
    /** Enable caching */
    cache?: boolean;
    /** Cache key */
    cacheKey?: string;
    /** Cache TTL in seconds */
    cacheTTL?: number;
    /** Abort signal for streaming */
    abortSignal?: AbortSignal;
}
/**
 * Streaming SSR chunk
 */
export interface SSRChunk {
    type: 'shell' | 'content' | 'suspense' | 'script' | 'end';
    content: string;
    id?: string;
}
/**
 * SSR Renderer for PhilJS components
 */
export declare class SSRRenderer {
    private config;
    constructor(config?: PoemSSRConfig);
    /**
     * Render a component to string
     */
    render(component: string, props?: Record<string, unknown>, options?: SSRRenderOptions): Promise<SSRResult>;
    /**
     * Render with streaming support
     */
    renderStream(component: string, props?: Record<string, unknown>, options?: SSRRenderOptions): AsyncGenerator<SSRChunk>;
    private renderComponent;
    private renderShell;
    private renderHydrationScript;
    /**
     * Generate Rust SSR code
     */
    static toRustCode(): string;
}
/**
 * SSR Cache for storing rendered pages
 */
export declare class SSRCache {
    private cache;
    private defaultTTL;
    constructor(defaultTTL?: number);
    /**
     * Get a cached result
     */
    get(key: string): SSRResult | null;
    /**
     * Set a cached result
     */
    set(key: string, result: SSRResult, ttl?: number): void;
    /**
     * Delete a cached entry
     */
    delete(key: string): boolean;
    /**
     * Clear all cached entries
     */
    clear(): void;
    /**
     * Purge expired entries
     */
    purgeExpired(): number;
    /**
     * Get cache size
     */
    size(): number;
    /**
     * Generate cache key from context
     */
    static generateKey(ctx: SSRContext): string;
}
/**
 * Head manager for SSR meta tags
 */
export declare class HeadManager {
    private head;
    constructor();
    /**
     * Set document title
     */
    title(title: string): this;
    /**
     * Add meta tag
     */
    meta(tag: MetaTag): this;
    /**
     * Add Open Graph meta tag
     */
    og(property: string, content: string): this;
    /**
     * Add Twitter card meta tag
     */
    twitter(name: string, content: string): this;
    /**
     * Add description meta tag
     */
    description(content: string): this;
    /**
     * Add canonical link
     */
    canonical(href: string): this;
    /**
     * Add preload link
     */
    preload(href: string, as: string, type?: string): this;
    /**
     * Add stylesheet
     */
    stylesheet(href: string): this;
    /**
     * Add script
     */
    script(script: Script): this;
    /**
     * Build head
     */
    build(): SSRHead;
    /**
     * Render to HTML string
     */
    render(): string;
}
/**
 * Full HTML document builder for SSR
 */
export declare class SSRDocument {
    private head;
    private bodyContent;
    private bodyAttrs;
    private htmlAttrs;
    private hydrationData?;
    constructor();
    /**
     * Get head manager
     */
    getHead(): HeadManager;
    /**
     * Set HTML attributes
     */
    htmlAttributes(attrs: Record<string, string>): this;
    /**
     * Set body attributes
     */
    bodyAttributes(attrs: Record<string, string>): this;
    /**
     * Set body content
     */
    body(content: string): this;
    /**
     * Set hydration data
     */
    hydration(data: unknown): this;
    /**
     * Render full document
     */
    render(): string;
}
/**
 * Create an SSR renderer
 */
export declare function createSSRRenderer(config?: PoemSSRConfig): SSRRenderer;
/**
 * Create an SSR cache
 */
export declare function createSSRCache(defaultTTL?: number): SSRCache;
/**
 * Create a head manager
 */
export declare function createHeadManager(): HeadManager;
/**
 * Create an SSR document
 */
export declare function createSSRDocument(): SSRDocument;
/**
 * Render a component with default settings
 */
export declare function renderToString(component: string, props?: Record<string, unknown>, options?: SSRRenderOptions): Promise<string>;
/**
 * Render a full document
 */
export declare function renderDocument(component: string, props?: Record<string, unknown>, head?: Partial<SSRHead>): Promise<string>;
//# sourceMappingURL=ssr.d.ts.map