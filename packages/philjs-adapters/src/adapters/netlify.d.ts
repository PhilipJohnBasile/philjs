/**
 * PhilJS Netlify Adapter
 *
 * Production-ready deployment adapter for Netlify with:
 * - Edge Functions support
 * - Serverless Functions
 * - Forms integration
 * - Identity integration
 * - Image CDN
 * - netlify.toml generation
 *
 * @module philjs-adapters/adapters/netlify
 */
import type { Adapter, AdapterConfig, EdgeAdapter } from '../types.js';
/**
 * Configuration options for the Netlify adapter
 */
export interface NetlifyAdapterConfig extends AdapterConfig {
    /** Use Edge Functions (default: false) */
    edge?: boolean;
    /** Enable On-Demand Builders (ISR) */
    builders?: boolean;
    /** Functions directory */
    functionsDir?: string;
    /** Publish directory */
    publishDir?: string;
    /** Enable Netlify Forms */
    forms?: boolean;
    /** Enable Netlify Identity */
    identity?: boolean;
    /** Excluded paths from functions */
    excludedPaths?: string[];
    /** Custom headers */
    headers?: NetlifyHeaderConfig[];
    /** Redirects */
    redirects?: NetlifyRedirectConfig[];
    /** Plugins to enable */
    plugins?: NetlifyPluginConfig[];
    /** Build configuration */
    build?: NetlifyBuildConfig;
    /** Context-specific configuration */
    contexts?: Record<string, NetlifyContextConfig>;
    /** Edge function regions */
    regions?: NetlifyRegion[];
    /** Generate netlify.toml */
    generateConfig?: boolean;
    /** Image CDN configuration */
    images?: NetlifyImageConfig;
    /** Background functions */
    backgroundFunctions?: BackgroundFunctionConfig[];
    /** Scheduled functions */
    scheduledFunctions?: ScheduledFunctionConfig[];
}
/**
 * Netlify deployment regions for Edge Functions
 */
export type NetlifyRegion = 'us-east-1' | 'us-west-1' | 'eu-west-1' | 'eu-west-2' | 'ap-southeast-1' | 'ap-southeast-2' | 'ap-northeast-1' | 'sa-east-1';
/**
 * Header configuration
 */
export interface NetlifyHeaderConfig {
    /** Path pattern */
    for: string;
    /** Header values */
    values: Record<string, string>;
}
/**
 * Redirect configuration
 */
export interface NetlifyRedirectConfig {
    /** Source path */
    from: string;
    /** Destination path or URL */
    to: string;
    /** HTTP status code */
    status?: number;
    /** Force redirect (ignore _redirects precedence) */
    force?: boolean;
    /** Conditions for redirect */
    conditions?: {
        Language?: string[];
        Country?: string[];
        Role?: string[];
        Cookie?: string;
    };
    /** Query string handling */
    query?: Record<string, string>;
    /** Signed URL */
    signed?: string;
}
/**
 * Plugin configuration
 */
export interface NetlifyPluginConfig {
    /** Plugin package name */
    package: string;
    /** Plugin inputs */
    inputs?: Record<string, unknown>;
}
/**
 * Build configuration
 */
export interface NetlifyBuildConfig {
    /** Build command */
    command?: string;
    /** Publish directory */
    publish?: string;
    /** Functions directory */
    functions?: string;
    /** Edge functions directory */
    edgeFunctions?: string;
    /** Base directory */
    base?: string;
    /** Environment variables */
    environment?: Record<string, string>;
    /** Ignore build if */
    ignore?: string;
    /** Processing configuration */
    processing?: {
        css?: {
            bundle?: boolean;
            minify?: boolean;
        };
        js?: {
            bundle?: boolean;
            minify?: boolean;
        };
        html?: {
            prettyUrls?: boolean;
        };
        images?: {
            compress?: boolean;
        };
    };
}
/**
 * Context-specific configuration
 */
export interface NetlifyContextConfig {
    command?: string;
    publish?: string;
    environment?: Record<string, string>;
}
/**
 * Image CDN configuration
 */
export interface NetlifyImageConfig {
    /** Remote patterns for external images */
    remotePatterns?: Array<{
        protocol?: 'http' | 'https';
        hostname: string;
    }>;
}
/**
 * Background function configuration
 */
export interface BackgroundFunctionConfig {
    /** Function name */
    name: string;
    /** Handler path */
    handler: string;
}
/**
 * Scheduled function configuration
 */
export interface ScheduledFunctionConfig {
    /** Function name */
    name: string;
    /** Cron expression */
    schedule: string;
    /** Handler path */
    handler: string;
}
/**
 * Create a Netlify deployment adapter
 *
 * @example
 * ```typescript
 * import { netlifyAdapter } from 'philjs-adapters/adapters/netlify';
 *
 * export default defineConfig({
 *   adapter: netlifyAdapter({
 *     edge: true,
 *     forms: true,
 *     identity: true,
 *     headers: [{
 *       for: '/*',
 *       values: { 'X-Frame-Options': 'DENY' },
 *     }],
 *   }),
 * });
 * ```
 */
export declare function netlifyAdapter(config?: NetlifyAdapterConfig): Adapter & Partial<EdgeAdapter>;
/**
 * Get Netlify context in Edge Functions
 */
export declare function getNetlifyContext(): {
    geo?: NetlifyGeo;
    ip?: string;
    site?: NetlifySite;
    account?: NetlifyAccount;
};
/**
 * Netlify geolocation data
 */
export interface NetlifyGeo {
    city?: string;
    country?: {
        code?: string;
        name?: string;
    };
    subdivision?: {
        code?: string;
        name?: string;
    };
    timezone?: string;
    latitude?: number;
    longitude?: number;
}
/**
 * Netlify site information
 */
export interface NetlifySite {
    id: string;
    name: string;
    url: string;
}
/**
 * Netlify account information
 */
export interface NetlifyAccount {
    id: string;
}
/**
 * Create a Netlify Image CDN URL
 *
 * @example
 * ```typescript
 * const imageUrl = netlifyImageCDN('https://example.com/image.jpg', {
 *   width: 800,
 *   format: 'webp',
 * });
 * ```
 */
export declare function netlifyImageCDN(src: string, options?: {
    width?: number;
    height?: number;
    fit?: 'contain' | 'cover' | 'fill';
    format?: 'avif' | 'webp' | 'png' | 'jpg';
    quality?: number;
}): string;
/**
 * Get Netlify Identity user (in serverless functions)
 */
export declare function getNetlifyIdentityUser(context: unknown): NetlifyUser | null;
/**
 * Netlify Identity user
 */
export interface NetlifyUser {
    email: string;
    exp: number;
    sub: string;
    user_metadata: Record<string, unknown>;
    app_metadata: Record<string, unknown>;
}
/**
 * Create a Netlify Forms handler
 */
export declare function createFormsHandler(formName: string): {
    submit(data: Record<string, unknown>): Promise<Response>;
};
export default netlifyAdapter;
//# sourceMappingURL=netlify.d.ts.map