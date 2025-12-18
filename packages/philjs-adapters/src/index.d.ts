/**
 * PhilJS Adapters
 *
 * Deploy PhilJS applications anywhere:
 * - Vercel (Edge & Serverless)
 * - Netlify (Edge Functions & Serverless)
 * - Cloudflare (Workers & Pages)
 * - AWS (Lambda, Lambda@Edge, Amplify)
 * - Node.js (standalone server)
 * - Static (SSG)
 */
import type { Adapter, AdapterConfig } from './types';
export type { Adapter, AdapterConfig, EdgeAdapter, ServerlessAdapter, RequestContext, ResponseContext, RouteManifest, RouteEntry, BuildOutput, } from './types';
export { vercelAdapter, revalidatePath, revalidateTag, createVercelEdgeConfig } from './vercel';
export type { VercelConfig } from './vercel';
export { netlifyAdapter, getNetlifyContext, netlifyImageCDN } from './netlify';
export type { NetlifyConfig } from './netlify';
export { cloudflareAdapter, getCloudflareEnv, getExecutionContext, waitUntil, createKVHelper } from './cloudflare';
export type { CloudflareConfig } from './cloudflare';
export { awsAdapter, getAWSContext, getRemainingTimeMs, getRequestId, getS3AssetUrl } from './aws';
export type { AWSConfig } from './aws';
export { nodeAdapter, startServer } from './node';
export type { NodeConfig } from './node';
export { staticAdapter, prerender, getStaticPaths } from './static';
export type { StaticConfig } from './static';
export declare function autoAdapter(config?: AdapterConfig): Adapter;
export declare const presets: {
    /** Vercel with Edge Runtime */
    'vercel-edge': (config?: Partial<import("./vercel").VercelConfig>) => any;
    /** Vercel with Serverless */
    'vercel-serverless': (config?: Partial<import("./vercel").VercelConfig>) => any;
    /** Netlify Edge Functions */
    'netlify-edge': (config?: Partial<import("./netlify").NetlifyConfig>) => any;
    /** Netlify Serverless Functions */
    'netlify-functions': (config?: Partial<import("./netlify").NetlifyConfig>) => any;
    /** Cloudflare Pages */
    'cloudflare-pages': (config?: Partial<import("./cloudflare").CloudflareConfig>) => any;
    /** Cloudflare Workers */
    'cloudflare-workers': (config?: Partial<import("./cloudflare").CloudflareConfig>) => any;
    /** AWS Lambda */
    'aws-lambda': (config?: Partial<import("./aws").AWSConfig>) => any;
    /** AWS Lambda@Edge */
    'aws-edge': (config?: Partial<import("./aws").AWSConfig>) => any;
    /** AWS Amplify */
    'aws-amplify': (config?: Partial<import("./aws").AWSConfig>) => any;
    /** Node.js standalone */
    node: (config?: Partial<import("./node").NodeConfig>) => any;
    /** Static site generation */
    static: (config?: Partial<import("./static").StaticConfig>) => any;
};
export type AdapterPreset = keyof typeof presets;
export declare function createAdapter(preset: AdapterPreset, config?: AdapterConfig): Adapter;
//# sourceMappingURL=index.d.ts.map