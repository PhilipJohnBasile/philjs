/**
 * PhilJS Vercel Adapter
 *
 * Full-featured Vercel deployment with:
 * - Edge Runtime support
 * - Serverless Functions
 * - Edge Config integration
 * - KV (Vercel KV) storage
 * - Blob storage
 * - Automatic ISR (Incremental Static Regeneration)
 * - Image Optimization
 */
import type { Adapter, AdapterConfig, EdgeAdapter, ServerlessAdapter } from '../types.js';
export interface VercelConfig extends AdapterConfig {
    /** Use Edge Runtime (default: false, uses Node.js serverless) */
    edge?: boolean;
    /** Vercel regions to deploy to */
    regions?: string[];
    /** Memory limit in MB (serverless only) */
    memory?: number;
    /** Max duration in seconds */
    maxDuration?: number;
    /** Enable Incremental Static Regeneration */
    isr?: {
        /** Revalidation time in seconds */
        expiration?: number;
        /** Allow manual revalidation */
        allowQuery?: boolean;
        /** Bypass token for on-demand revalidation */
        bypassToken?: string;
    };
    /** Enable Image Optimization */
    images?: {
        /** Allowed image domains */
        domains?: string[];
        /** Image formats to support */
        formats?: ('image/avif' | 'image/webp')[];
        /** Minimum cache TTL in seconds */
        minimumCacheTTL?: number;
        /** Device sizes for responsive images */
        deviceSizes?: number[];
        /** Image sizes for srcset */
        imageSizes?: number[];
    };
    /** Cron jobs */
    crons?: Array<{
        /** Path to invoke */
        path: string;
        /** Cron schedule expression */
        schedule: string;
    }>;
    /** Enable Vercel KV */
    kv?: {
        /** Database name */
        database?: string;
        /** Environment (production, preview, development) */
        env?: 'production' | 'preview' | 'development';
    };
    /** Enable Vercel Blob */
    blob?: {
        /** Enable read/write token */
        token?: string;
    };
    /** Enable Edge Config */
    edgeConfig?: {
        /** Config ID */
        id?: string;
    };
    /** Rewrites configuration */
    rewrites?: Array<{
        source: string;
        destination: string;
    }>;
    /** Redirects configuration */
    redirects?: Array<{
        source: string;
        destination: string;
        permanent?: boolean;
        statusCode?: number;
    }>;
    /** Headers configuration */
    headers?: Array<{
        source: string;
        headers: Array<{
            key: string;
            value: string;
        }>;
    }>;
    /** Split routes into separate functions */
    splitRoutes?: boolean;
    /** Node.js version (serverless only) */
    nodeVersion?: '18.x' | '20.x';
}
export declare function vercelAdapter(config?: VercelConfig): Adapter & Partial<EdgeAdapter & ServerlessAdapter>;
export declare function revalidatePath(path: string, type?: 'page' | 'layout'): Promise<any>;
export declare function revalidateTag(tag: string): Promise<any>;
export declare function createVercelEdgeConfig(options?: {
    regions?: string[];
    maxDuration?: number;
}): {
    runtime: string;
    regions: string[];
    maxDuration: number;
};
export default vercelAdapter;
//# sourceMappingURL=adapter.d.ts.map