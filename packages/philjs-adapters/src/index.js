/**
 * PhilJS Adapters
 *
 * Deploy PhilJS applications anywhere:
 * - Vercel (Edge & Serverless)
 * - Netlify (Edge Functions & Serverless)
 * - Cloudflare (Workers & Pages)
 * - AWS (Lambda, Lambda@Edge, Amplify)
 * - Node.js (standalone server)
 * - Bun (native Bun.serve)
 * - Deno (Deno.serve & Deno Deploy)
 * - Static (SSG)
 *
 * @module philjs-adapters
 */
import { vercelAdapter } from './vercel/index.js';
import { netlifyAdapter } from './netlify/index.js';
import { cloudflareAdapter } from './cloudflare/index.js';
import { awsAdapter } from './aws/index.js';
import { nodeAdapter } from './node/index.js';
import { staticAdapter } from './static/index.js';
import { bunAdapter } from './bun/index.js';
import { denoAdapter } from './deno/index.js';
import { railwayAdapter } from './railway/index.js';
import { vercelAdapter as vercelAdapterV2 } from './adapters/vercel.js';
import { cloudflareAdapter as cloudflareAdapterV2 } from './adapters/cloudflare.js';
import { denoDeployAdapter } from './adapters/deno-deploy.js';
import { netlifyAdapter as netlifyAdapterV2 } from './adapters/netlify.js';
import { awsLambdaAdapter } from './adapters/aws-lambda.js';
import { nodeAdapter as nodeAdapterV2 } from './adapters/node.js';
import { bunAdapter as bunAdapterV2 } from './adapters/bun.js';
// ============================================================================
// Enhanced Adapters (New v2.1 API)
// ============================================================================
// Vercel Enhanced Adapter
export { vercelAdapter as vercelAdapterV2, createVercelEdgeConfig as createVercelEdgeConfigV2, revalidatePath as revalidatePathV2, revalidateTag as revalidateTagV2, getVercelContext, vercelImageUrl, } from './adapters/vercel.js';
// Cloudflare Enhanced Adapter
export { cloudflareAdapter as cloudflareAdapterV2, getCloudflareEnv as getCloudflareEnvV2, getExecutionContext as getExecutionContextV2, waitUntil as waitUntilV2, createKVHelper as createKVHelperV2, createD1Helper, createR2Helper, getDurableObject, } from './adapters/cloudflare.js';
// Deno Deploy Adapter
export { denoDeployAdapter, getDenoKV, DenoKVWrapper, DenoKVAtomicWrapper, isDenoDeply as isDenoDeployV2, getDenoDeployRegion as getDenoDeployRegionV2, checkDenoPermissions, requestDenoPermission, } from './adapters/deno-deploy.js';
// Netlify Enhanced Adapter
export { netlifyAdapter as netlifyAdapterV2, getNetlifyContext as getNetlifyContextV2, netlifyImageCDN as netlifyImageCDNV2, getNetlifyIdentityUser, createFormsHandler, } from './adapters/netlify.js';
// AWS Lambda Enhanced Adapter
export { awsLambdaAdapter as awsLambdaAdapterV2, getAWSLambdaContext, getRemainingTimeMs as getRemainingTimeMsV2, getAWSRequestId, getS3AssetUrl as getS3AssetUrlV2, } from './adapters/aws-lambda.js';
// Node.js Enhanced Adapter
export { nodeAdapter as nodeAdapterV2, startServer as startServerV2, createExpressMiddleware, createFastifyPlugin, } from './adapters/node.js';
// Bun Enhanced Adapter
export { bunAdapter as bunAdapterV2, isBun as isBunV2, createBunSQLite as createBunSQLiteV2, bunFile, bunHash, bunVerify, createBunHandler, } from './adapters/bun.js';
// ============================================================================
// Build Utilities
// ============================================================================
export { MIME_TYPES, createBuildManifest, copyStaticAssets, optimizeAssets, generateHashedFilename, createOutputStructure, getFileHash, isImmutableAsset, getCacheControl, } from './utils/build.js';
// ============================================================================
// Environment Utilities
// ============================================================================
export { loadEnvFile, loadEnvironment, validateEnv, injectEnvVariables, generateEnvTypes, createMemorySecretsManager, createEnvSecretsManager, getEnv, isProduction, isDevelopment, getMode, platformEnv, } from './utils/env.js';
// Vercel
export { vercelAdapter, revalidatePath, revalidateTag, createVercelEdgeConfig } from './vercel/index.js';
// Vercel (enhanced from adapter.ts)
export { vercelAdapter as vercelAdapterEnhanced } from './vercel/adapter.js';
// Netlify
export { netlifyAdapter, getNetlifyContext, netlifyImageCDN } from './netlify/index.js';
// Netlify (enhanced from adapter.ts)
export { netlifyAdapter as netlifyAdapterEnhanced } from './netlify/adapter.js';
// Cloudflare
export { cloudflareAdapter, getCloudflareEnv, getExecutionContext, waitUntil, createKVHelper } from './cloudflare/index.js';
// Cloudflare Pages (enhanced)
export { cloudflarePagesAdapter, createKVNamespace, createD1Database, createR2Bucket, passThroughOnException } from './cloudflare-pages/index.js';
// AWS
export { awsAdapter, getAWSContext, getRemainingTimeMs, getRequestId, getS3AssetUrl } from './aws/index.js';
// AWS Lambda (enhanced)
export { awsLambdaAdapter } from './aws-lambda/index.js';
// Node.js
export { nodeAdapter, startServer } from './node/index.js';
// Static
export { staticAdapter, prerender, getStaticPaths } from './static/index.js';
// Bun
export { bunAdapter, createBunAdapter, createBunSQLite, onWebSocketMessage, onWebSocketOpen, onWebSocketClose } from './bun/index.js';
// Deno
export { denoAdapter, createDenoAdapter, startDenoServer, createDenoKV, checkPermissions, requestPermission, isDenoDeply, getDenoDeployRegion } from './deno/index.js';
// Railway
export { railwayAdapter } from './railway/index.js';
// Runtime Detection
export { detectRuntime, getRuntimeInfo, hasFeature, assertRuntime, isBun, isDeno, isNode, isEdge, isBrowser, isServer } from './runtime-detect.js';
// Edge Runtime Optimizations
export { 
// Edge Runtime
detectEdgePlatform, getPlatformInfo, createEdgeEnv, createExecutionContext, getRegion, createEdgeHandler, coalesceRequest, isColdStart, markWarm, getColdStartDuration, resetColdStartTracking, preloadModule, getPreloadedModule, initializeColdStart, 
// Streaming
createWritableStream, createStreamingResponse, createSSEStream, createSSEHandler, createHTMLStream, parseESITags, processESI, createESIMiddleware, streamThrough, mergeStreams, createStreamTee, 
// Caching
EdgeCache, createCacheKey, shouldCacheResponse, createCachedResponse, createCacheMiddleware, createAssetCache, getDefaultCache, resetDefaultCache, 
// Geolocation
getGeoLocation, getClientIP, applyGeoRouting, createGeoRoutingMiddleware, findBestRegion, createLatencyRouter, selectGeoVariant, createVariantCookie, calculateDistance, findNearestLocation, addGeoHeaders, 
// Default exports
edgeRuntime, streaming, cache, geo, } from './edge/index.js';
// Auto-detect adapter based on environment
export function autoAdapter(config = {}) {
    // Check for runtime first (Bun, Deno)
    if (typeof globalThis !== 'undefined' && 'Bun' in globalThis) {
        return bunAdapter(config);
    }
    if (typeof globalThis !== 'undefined' && 'Deno' in globalThis) {
        return denoAdapter(config);
    }
    // Check for platform-specific environment variables
    if (typeof process !== 'undefined' && process.env?.['VERCEL']) {
        return vercelAdapter(config);
    }
    if (typeof process !== 'undefined' && process.env?.['NETLIFY']) {
        return netlifyAdapter(config);
    }
    if (typeof process !== 'undefined' && (process.env?.['CF_PAGES'] || process.env?.['CLOUDFLARE_WORKERS'])) {
        return cloudflareAdapter(config);
    }
    if (typeof process !== 'undefined' && (process.env?.['AWS_LAMBDA_FUNCTION_NAME'] || process.env?.['AWS_EXECUTION_ENV'])) {
        return awsAdapter(config);
    }
    // Default to Node.js adapter
    return nodeAdapter(config);
}
// Adapter presets
export const presets = {
    /** Vercel with Edge Runtime */
    'vercel-edge': (config = {}) => vercelAdapter({ ...config, edge: true }),
    /** Vercel with Serverless */
    'vercel-serverless': (config = {}) => vercelAdapter({ ...config, edge: false }),
    /** Netlify Edge Functions */
    'netlify-edge': (config = {}) => netlifyAdapter({ ...config, edge: true }),
    /** Netlify Serverless Functions */
    'netlify-functions': (config = {}) => netlifyAdapter({ ...config, edge: false }),
    /** Cloudflare Pages */
    'cloudflare-pages': (config = {}) => cloudflareAdapter({ ...config, mode: 'pages' }),
    /** Cloudflare Workers */
    'cloudflare-workers': (config = {}) => cloudflareAdapter({ ...config, mode: 'workers' }),
    /** AWS Lambda */
    'aws-lambda': (config = {}) => awsAdapter({ ...config, mode: 'lambda' }),
    /** AWS Lambda@Edge */
    'aws-edge': (config = {}) => awsAdapter({ ...config, mode: 'lambda-edge' }),
    /** AWS Amplify */
    'aws-amplify': (config = {}) => awsAdapter({ ...config, mode: 'amplify' }),
    /** Node.js standalone */
    'node': (config = {}) => nodeAdapter(config),
    /** Static site generation */
    'static': (config = {}) => staticAdapter(config),
    /** Bun runtime */
    'bun': (config = {}) => bunAdapter(config),
    /** Bun with WebSocket support */
    'bun-websocket': (config = {}) => bunAdapter({ ...config, websocket: { enabled: true } }),
    /** Deno runtime */
    'deno': (config = {}) => denoAdapter(config),
    /** Deno with KV storage */
    'deno-kv': (config = {}) => denoAdapter({ ...config, kv: true }),
    /** Deno Deploy */
    'deno-deploy': (config = {}) => denoAdapter({ ...config, kv: true, deploy: { edgeCache: true } }),
    /** Railway */
    'railway': (config = {}) => railwayAdapter(config),
    /** Railway with Docker */
    'railway-docker': (config = {}) => railwayAdapter({ ...config, docker: {} }),
};
// Helper to create adapter from preset
export function createAdapter(preset, config = {}) {
    const factory = presets[preset];
    if (!factory) {
        throw new Error(`Unknown adapter preset: ${preset}`);
    }
    return factory(config);
}
// ============================================================================
// Enhanced Adapter Factory (v2.1 API)
// ============================================================================
/**
 * Enhanced adapter presets with the new v2.1 API
 */
export const enhancedPresets = {
    /** Vercel with Edge Runtime (v2.1) */
    'vercel-edge': (config = {}) => {
        return vercelAdapterV2({ ...config, edge: true });
    },
    /** Vercel with Serverless (v2.1) */
    'vercel-serverless': (config = {}) => {
        return vercelAdapterV2({ ...config, edge: false });
    },
    /** Cloudflare Pages (v2.1) */
    'cloudflare-pages': (config = {}) => {
        return cloudflareAdapterV2({ ...config, mode: 'pages' });
    },
    /** Cloudflare Workers (v2.1) */
    'cloudflare-workers': (config = {}) => {
        return cloudflareAdapterV2({ ...config, mode: 'workers' });
    },
    /** Deno Deploy (v2.1) */
    'deno-deploy': (config = {}) => {
        return denoDeployAdapter(config);
    },
    /** Deno Deploy with Fresh (v2.1) */
    'deno-fresh': (config = {}) => {
        return denoDeployAdapter({ ...config, fresh: true });
    },
    /** Netlify Edge (v2.1) */
    'netlify-edge': (config = {}) => {
        return netlifyAdapterV2({ ...config, edge: true });
    },
    /** Netlify Functions (v2.1) */
    'netlify-functions': (config = {}) => {
        return netlifyAdapterV2({ ...config, edge: false });
    },
    /** AWS Lambda (v2.1) */
    'aws-lambda': (config = {}) => {
        return awsLambdaAdapter({ ...config, integration: 'http-api' });
    },
    /** AWS Lambda@Edge (v2.1) */
    'aws-edge': (config = {}) => {
        return awsLambdaAdapter({ ...config, integration: 'lambda-edge' });
    },
    /** AWS Lambda with Streaming (v2.1) */
    'aws-streaming': (config = {}) => {
        return awsLambdaAdapter({ ...config, streaming: true });
    },
    /** Node.js standalone (v2.1) */
    'node': (config = {}) => {
        return nodeAdapterV2(config);
    },
    /** Node.js with Express (v2.1) */
    'node-express': (config = {}) => {
        return nodeAdapterV2({ ...config, express: true });
    },
    /** Node.js with Fastify (v2.1) */
    'node-fastify': (config = {}) => {
        return nodeAdapterV2({ ...config, fastify: true });
    },
    /** Node.js with PM2 (v2.1) */
    'node-pm2': (config = {}) => {
        return nodeAdapterV2({ ...config, generatePM2: true, cluster: true });
    },
    /** Bun runtime (v2.1) */
    'bun': (config = {}) => {
        return bunAdapterV2(config);
    },
    /** Bun with WebSocket (v2.1) */
    'bun-websocket': (config = {}) => {
        return bunAdapterV2({ ...config, websocket: { enabled: true } });
    },
    /** Bun with SQLite (v2.1) */
    'bun-sqlite': (config = {}) => {
        return bunAdapterV2({ ...config, sqlite: './data.db' });
    },
};
/**
 * Create an adapter using the enhanced v2.1 API
 *
 * @example
 * ```typescript
 * import { createEnhancedAdapter } from 'philjs-adapters';
 *
 * const adapter = createEnhancedAdapter('vercel-edge', {
 *   regions: ['iad1', 'sfo1'],
 *   isr: { revalidate: 60 },
 * });
 * ```
 */
export function createEnhancedAdapter(preset, config = {}) {
    const factory = enhancedPresets[preset];
    if (!factory) {
        throw new Error(`Unknown enhanced adapter preset: ${preset}`);
    }
    return factory(config);
}
/**
 * Define adapter configuration with type safety
 *
 * @example
 * ```typescript
 * import { defineAdapter } from 'philjs-adapters';
 *
 * export default defineAdapter('vercel-edge', {
 *   regions: ['iad1'],
 *   isr: { revalidate: 60 },
 * });
 * ```
 */
export function defineAdapter(preset, config = {}) {
    return createEnhancedAdapter(preset, config);
}
//# sourceMappingURL=index.js.map