/**
 * PhilJS Netlify Adapter
 *
 * Deploy to Netlify with Edge Functions and Serverless Functions support
 */
import type { Adapter, AdapterConfig, EdgeAdapter } from '../types.js';
export interface NetlifyConfig extends AdapterConfig {
    /** Use Edge Functions (default: false) */
    edge?: boolean;
    /** Enable On-Demand Builders (ISR) */
    builders?: boolean;
    /** Excluded paths from functions */
    excludedPaths?: string[];
    /** Custom headers */
    headers?: Array<{
        for: string;
        values: Record<string, string>;
    }>;
    /** Redirects */
    redirects?: Array<{
        from: string;
        to: string;
        status?: number;
        force?: boolean;
    }>;
    /** Forms handling */
    forms?: boolean;
    /** Identity (Netlify Identity) */
    identity?: boolean;
}
export declare function netlifyAdapter(config?: NetlifyConfig): Adapter & Partial<EdgeAdapter>;
export declare function getNetlifyContext(): {
    geo: any;
    ip: any;
};
export declare function netlifyImageCDN(src: string, options?: {
    width?: number;
    height?: number;
    fit?: 'contain' | 'cover' | 'fill';
    format?: 'avif' | 'webp' | 'png' | 'jpg';
}): string;
export default netlifyAdapter;
//# sourceMappingURL=index.d.ts.map