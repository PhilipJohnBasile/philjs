/**
 * PhilJS Vercel Adapter
 *
 * Zero-config deployment to Vercel with Edge and Serverless support
 */
import type { Adapter, AdapterConfig, EdgeAdapter } from '../types.js';
export interface VercelConfig extends AdapterConfig {
    /** Use Edge Runtime (default: false, uses Node.js) */
    edge?: boolean;
    /** Vercel regions to deploy to */
    regions?: string[];
    /** Memory limit in MB (default: 1024) */
    memory?: number;
    /** Max duration in seconds (default: 10 for edge, 60 for serverless) */
    maxDuration?: number;
    /** Enable Incremental Static Regeneration */
    isr?: {
        /** Revalidation time in seconds */
        revalidate?: number;
        /** Bypass token for on-demand revalidation */
        bypassToken?: string;
    };
    /** Enable Image Optimization */
    images?: {
        domains?: string[];
        formats?: ('image/avif' | 'image/webp')[];
        minimumCacheTTL?: number;
    };
    /** Cron jobs */
    crons?: Array<{
        path: string;
        schedule: string;
    }>;
}
export declare function vercelAdapter(config?: VercelConfig): Adapter & Partial<EdgeAdapter>;
export declare function createVercelEdgeConfig(options?: {
    regions?: string[];
    maxDuration?: number;
}): {
    runtime: string;
    regions: string[];
    maxDuration: number;
};
export declare function revalidatePath(path: string, options?: {
    type?: 'page' | 'layout';
}): Promise<Response>;
export declare function revalidateTag(tag: string): Promise<Response>;
export default vercelAdapter;
//# sourceMappingURL=index.d.ts.map