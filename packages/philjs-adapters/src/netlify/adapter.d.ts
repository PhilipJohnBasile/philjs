/**
 * PhilJS Netlify Adapter
 *
 * Full-featured Netlify deployment with:
 * - Netlify Functions (serverless)
 * - Edge Functions
 * - Blob storage
 * - Form handling
 * - Redirects and rewrites
 * - Headers configuration
 */
import type { Adapter, AdapterConfig, EdgeAdapter, ServerlessAdapter } from '../types.js';
export interface NetlifyConfig extends AdapterConfig {
    /** Use Edge Functions (default: false, uses Netlify Functions) */
    edge?: boolean;
    /** Output directory for build artifacts */
    outDir?: string;
    /** Netlify Functions configuration */
    functions?: {
        /** Functions directory */
        directory?: string;
        /** Node.js version */
        nodeVersion?: string;
        /** Include patterns */
        includedFiles?: string[];
        /** External node modules */
        externalNodeModules?: string[];
    };
    /** Edge Functions configuration */
    edgeFunctions?: {
        /** Edge Functions directory */
        directory?: string;
        /** Edge Functions to deploy */
        functions?: Array<{
            path: string;
            function: string;
        }>;
    };
    /** Redirects configuration */
    redirects?: Array<{
        from: string;
        to: string;
        status?: number;
        force?: boolean;
        conditions?: {
            country?: string[];
            language?: string[];
            role?: string[];
        };
    }>;
    /** Rewrites configuration */
    rewrites?: Array<{
        from: string;
        to: string;
        status?: number;
        conditions?: {
            country?: string[];
            language?: string[];
            role?: string[];
        };
    }>;
    /** Headers configuration */
    headers?: Array<{
        for: string;
        values: Record<string, string>;
    }>;
    /** Enable Netlify Blob */
    blob?: {
        /** Deploy key */
        deployKey?: string;
    };
    /** Enable Netlify Forms */
    forms?: {
        /** Form names to enable */
        names?: string[];
    };
    /** Enable Netlify Image CDN */
    images?: {
        /** Remote patterns to allow */
        remotePatterns?: Array<{
            protocol?: string;
            hostname: string;
            pathname?: string;
        }>;
    };
    /** Split testing configuration */
    splitTesting?: Array<{
        path: string;
        branches: Array<{
            branch: string;
            weight: number;
        }>;
    }>;
}
export declare function netlifyAdapter(config?: NetlifyConfig): Adapter & Partial<EdgeAdapter & ServerlessAdapter>;
export declare function getNetlifyContext(): any;
export declare function netlifyImageCDN(src: string, options?: {
    width?: number;
    height?: number;
    fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
    position?: string;
    quality?: number;
}): string;
export default netlifyAdapter;
//# sourceMappingURL=adapter.d.ts.map