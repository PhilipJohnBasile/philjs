/**
 * PhilJS Meta - Configuration
 *
 * Configuration system with:
 * - philjs.config.ts support
 * - Environment variables
 * - Build options
 */
/**
 * PhilJS configuration
 */
export interface PhilJSConfig {
    /** Application name */
    name?: string;
    /** Pages directory (relative to root) */
    pagesDir?: string;
    /** Public assets directory */
    publicDir?: string;
    /** Source directory */
    srcDir?: string;
    /** Base path for all routes */
    basePath?: string;
    /** Trailing slash behavior */
    trailingSlash?: boolean;
    /** Enable strict mode */
    strict?: boolean;
    /** Environment variables to expose to client */
    env?: Record<string, string>;
    /** Build configuration */
    build?: BuildConfig;
    /** Server configuration */
    server?: ServerConfig;
    /** SSR configuration */
    ssr?: SSRConfig;
    /** SSG configuration */
    ssg?: SSGConfig;
    /** Image optimization */
    images?: ImagesConfig;
    /** Internationalization */
    i18n?: I18nConfig;
    /** Headers configuration */
    headers?: HeadersConfig[];
    /** Redirects configuration */
    redirects?: RedirectConfig[];
    /** Rewrites configuration */
    rewrites?: RewriteConfig[];
    /** Experimental features */
    experimental?: ExperimentalConfig;
    /** Custom webpack/esbuild configuration */
    bundler?: BundlerConfig;
}
/**
 * Build configuration
 */
export interface BuildConfig {
    /** Output directory */
    outDir?: string;
    /** Enable minification */
    minify?: boolean;
    /** Generate source maps */
    sourcemap?: boolean | 'inline' | 'hidden';
    /** Target browsers/node versions */
    target?: string | string[];
    /** CSS modules configuration */
    cssModules?: boolean | CSSModulesConfig;
    /** Define global constants */
    define?: Record<string, string>;
    /** External dependencies */
    external?: string[];
    /** Bundle splitting */
    splitting?: boolean;
    /** Tree shaking */
    treeShaking?: boolean;
    /** Analyze bundle */
    analyze?: boolean;
}
/**
 * CSS Modules configuration
 */
export interface CSSModulesConfig {
    /** Scope behavior */
    scopeBehaviour?: 'global' | 'local';
    /** Generate scoped name pattern */
    generateScopedName?: string | ((name: string, filename: string, css: string) => string);
    /** Hash prefix */
    hashPrefix?: string;
}
/**
 * Server configuration
 */
export interface ServerConfig {
    /** Server port */
    port?: number;
    /** Server host */
    host?: string;
    /** Enable HTTPS */
    https?: boolean | HTTPSConfig;
    /** Compression */
    compress?: boolean;
    /** CORS configuration */
    cors?: boolean | CORSConfig;
    /** Rate limiting */
    rateLimit?: RateLimitConfig;
    /** Request body size limit */
    bodyLimit?: string;
    /** Request timeout in ms */
    timeout?: number;
}
/**
 * HTTPS configuration
 */
export interface HTTPSConfig {
    key: string;
    cert: string;
    ca?: string;
}
/**
 * CORS configuration
 */
export interface CORSConfig {
    origin?: string | string[] | boolean;
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
}
/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
    windowMs?: number;
    max?: number;
    message?: string;
    statusCode?: number;
    keyGenerator?: (req: Request) => string;
}
/**
 * SSR configuration
 */
export interface SSRConfig {
    /** Enable SSR */
    enabled?: boolean;
    /** Stream SSR responses */
    streaming?: boolean;
    /** Timeout for SSR in ms */
    timeout?: number;
    /** External packages for SSR */
    external?: string[];
    /** Hydration mode */
    hydration?: 'full' | 'partial' | 'progressive';
}
/**
 * SSG configuration
 */
export interface SSGConfig {
    /** Enable static generation */
    enabled?: boolean;
    /** Paths to pre-render */
    paths?: string[] | (() => string[] | Promise<string[]>);
    /** Fallback behavior */
    fallback?: boolean | 'blocking';
    /** Revalidation interval in seconds */
    revalidate?: number | false;
    /** Export directory */
    exportDir?: string;
}
/**
 * Images configuration
 */
export interface ImagesConfig {
    /** Remote patterns for allowed external images */
    remotePatterns?: ImageRemotePattern[];
    /** Allowed domains */
    domains?: string[];
    /** Device sizes for responsive images */
    deviceSizes?: number[];
    /** Image sizes for next/image */
    imageSizes?: number[];
    /** Loader for images */
    loader?: 'default' | 'imgix' | 'cloudinary' | 'akamai' | 'custom';
    /** Path prefix for images */
    path?: string;
    /** Formats to generate */
    formats?: ('image/avif' | 'image/webp')[];
    /** Minimum cache TTL */
    minimumCacheTTL?: number;
    /** Disable static images */
    disableStaticImages?: boolean;
    /** Dangerously allow SVG */
    dangerouslyAllowSVG?: boolean;
}
/**
 * Image remote pattern
 */
export interface ImageRemotePattern {
    protocol?: 'http' | 'https';
    hostname: string;
    port?: string;
    pathname?: string;
}
/**
 * I18n configuration
 */
export interface I18nConfig {
    /** Supported locales */
    locales: string[];
    /** Default locale */
    defaultLocale: string;
    /** Locale detection */
    localeDetection?: boolean;
    /** Locale domains for domain-based routing */
    domains?: LocaleDomain[];
}
/**
 * Locale domain
 */
export interface LocaleDomain {
    domain: string;
    defaultLocale: string;
    locales?: string[];
    http?: boolean;
}
/**
 * Headers configuration
 */
export interface HeadersConfig {
    /** URL pattern */
    source: string;
    /** Headers to add */
    headers: {
        key: string;
        value: string;
    }[];
}
/**
 * Redirect configuration
 */
export interface RedirectConfig {
    /** Source URL pattern */
    source: string;
    /** Destination URL */
    destination: string;
    /** Redirect status code */
    statusCode?: 301 | 302 | 303 | 307 | 308;
    /** Permanent redirect (301 vs 302) */
    permanent?: boolean;
    /** Base path handling */
    basePath?: false;
    /** Locale handling */
    locale?: false;
    /** Has conditions */
    has?: RouteCondition[];
    /** Missing conditions */
    missing?: RouteCondition[];
}
/**
 * Rewrite configuration
 */
export interface RewriteConfig {
    /** Source URL pattern */
    source: string;
    /** Destination URL */
    destination: string;
    /** Base path handling */
    basePath?: false;
    /** Locale handling */
    locale?: false;
    /** Has conditions */
    has?: RouteCondition[];
    /** Missing conditions */
    missing?: RouteCondition[];
}
/**
 * Route condition
 */
export interface RouteCondition {
    type: 'header' | 'cookie' | 'query' | 'host';
    key: string;
    value?: string;
}
/**
 * Experimental features
 */
export interface ExperimentalConfig {
    /** Enable React Server Components */
    serverComponents?: boolean;
    /** Enable React Suspense boundaries */
    suspense?: boolean;
    /** Enable incremental adoption */
    incrementalAdoption?: boolean;
    /** Enable streaming */
    streaming?: boolean;
    /** Enable partial prerendering */
    partialPrerendering?: boolean;
    /** Enable optimistic updates */
    optimisticUpdates?: boolean;
}
/**
 * Bundler configuration
 */
export interface BundlerConfig {
    /** esbuild options */
    esbuild?: Record<string, unknown>;
    /** Custom plugins */
    plugins?: unknown[];
    /** Alias mappings */
    alias?: Record<string, string>;
    /** Module resolution */
    resolve?: {
        extensions?: string[];
        mainFields?: string[];
        conditions?: string[];
    };
}
/**
 * Default configuration
 */
export declare const defaultConfig: PhilJSConfig;
/**
 * Load configuration options
 */
export interface LoadConfigOptions {
    /** Project root directory */
    root?: string;
    /** Config file path (overrides auto-detection) */
    configFile?: string;
    /** Environment (development, production, test) */
    env?: string;
}
/**
 * Load configuration from file
 */
export declare function loadConfig(options?: LoadConfigOptions): Promise<PhilJSConfig>;
/**
 * Define configuration (for type safety in config files)
 */
export declare function defineConfig(config: PhilJSConfig | ((env: {
    env?: string;
}) => PhilJSConfig)): PhilJSConfig | ((env: {
    env?: string;
}) => PhilJSConfig);
/**
 * Validate configuration
 */
export declare function validateConfig(config: PhilJSConfig): {
    valid: boolean;
    errors: string[];
};
/**
 * Get environment-specific configuration
 */
export declare function getEnvConfig(config: PhilJSConfig, env: 'development' | 'production' | 'test'): PhilJSConfig;
//# sourceMappingURL=index.d.ts.map