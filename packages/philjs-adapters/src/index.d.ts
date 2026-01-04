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
import type { Adapter, AdapterConfig } from './types.js';
export type { Adapter, AdapterConfig, EdgeAdapter, ServerlessAdapter, RequestContext, ResponseContext, RouteManifest, RouteEntry, BuildOutput, } from './types.js';
export { vercelAdapter as vercelAdapterV2, createVercelEdgeConfig as createVercelEdgeConfigV2, revalidatePath as revalidatePathV2, revalidateTag as revalidateTagV2, getVercelContext, vercelImageUrl, } from './adapters/vercel.js';
export type { VercelAdapterConfig, VercelRegion, ISRConfig, ImageOptimizationConfig, CronConfig, MiddlewareConfig, HeaderConfig, RedirectConfig, RewriteConfig, FunctionRouteConfig, } from './adapters/vercel.js';
export { cloudflareAdapter as cloudflareAdapterV2, getCloudflareEnv as getCloudflareEnvV2, getExecutionContext as getExecutionContextV2, waitUntil as waitUntilV2, createKVHelper as createKVHelperV2, createD1Helper, createR2Helper, getDurableObject, } from './adapters/cloudflare.js';
export type { CloudflareAdapterConfig, KVNamespaceBinding, D1DatabaseBinding, DurableObjectBinding, R2BucketBinding, QueueBinding, ServiceBinding, RouteConfig as CloudflareRouteConfig, } from './adapters/cloudflare.js';
export { denoDeployAdapter, getDenoKV, DenoKVWrapper, DenoKVAtomicWrapper, isDenoDeply as isDenoDeployV2, getDenoDeployRegion as getDenoDeployRegionV2, checkDenoPermissions, requestDenoPermission, } from './adapters/deno-deploy.js';
export type { DenoDeployAdapterConfig, DenoDeployRegion, DenoKVConfig, FreshConfig, ImportMapConfig, DenoCompilerOptions, } from './adapters/deno-deploy.js';
export { netlifyAdapter as netlifyAdapterV2, getNetlifyContext as getNetlifyContextV2, netlifyImageCDN as netlifyImageCDNV2, getNetlifyIdentityUser, createFormsHandler, } from './adapters/netlify.js';
export type { NetlifyAdapterConfig, NetlifyRegion, NetlifyHeaderConfig, NetlifyRedirectConfig, NetlifyPluginConfig, NetlifyBuildConfig, NetlifyContextConfig, NetlifyImageConfig, BackgroundFunctionConfig, ScheduledFunctionConfig, NetlifyGeo, NetlifySite, NetlifyUser, } from './adapters/netlify.js';
export { awsLambdaAdapter as awsLambdaAdapterV2, getAWSLambdaContext, getRemainingTimeMs as getRemainingTimeMsV2, getAWSRequestId, getS3AssetUrl as getS3AssetUrlV2, } from './adapters/aws-lambda.js';
export type { AWSLambdaAdapterConfig, APIGatewayConfig, CloudFrontConfig, S3Config, VPCConfig, FunctionUrlConfig, CORSConfig, AuthorizationConfig, CacheBehavior, AWSLambdaContext, } from './adapters/aws-lambda.js';
export { nodeAdapter as nodeAdapterV2, startServer as startServerV2, createExpressMiddleware, createFastifyPlugin, } from './adapters/node.js';
export type { NodeAdapterConfig, ClusterConfig, StaticConfig as StaticConfigV2, LoggingConfig, } from './adapters/node.js';
export { bunAdapter as bunAdapterV2, isBun as isBunV2, createBunSQLite as createBunSQLiteV2, bunFile, bunHash, bunVerify, createBunHandler, } from './adapters/bun.js';
export type { BunAdapterConfig, SQLiteConfig, WebSocketConfig, BunOptimizations, } from './adapters/bun.js';
export { MIME_TYPES, createBuildManifest, copyStaticAssets, optimizeAssets, generateHashedFilename, createOutputStructure, getFileHash, isImmutableAsset, getCacheControl, } from './utils/build.js';
export type { BuildManifest, RouteManifestEntry, AssetManifestEntry, BuildManifestOptions, OptimizeAssetsOptions, } from './utils/build.js';
export { loadEnvFile, loadEnvironment, validateEnv, injectEnvVariables, generateEnvTypes, createMemorySecretsManager, createEnvSecretsManager, getEnv, isProduction, isDevelopment, getMode, platformEnv, } from './utils/env.js';
export type { EnvDefinition, EnvConfig, LoadedEnv, SecretsManager, } from './utils/env.js';
export { vercelAdapter, revalidatePath, revalidateTag, createVercelEdgeConfig } from './vercel/index.js';
export type { VercelConfig } from './vercel/index.js';
export { vercelAdapter as vercelAdapterEnhanced } from './vercel/adapter.js';
export type { VercelConfig as VercelConfigEnhanced } from './vercel/adapter.js';
export { netlifyAdapter, getNetlifyContext, netlifyImageCDN } from './netlify/index.js';
export type { NetlifyConfig } from './netlify/index.js';
export { netlifyAdapter as netlifyAdapterEnhanced } from './netlify/adapter.js';
export type { NetlifyConfig as NetlifyConfigEnhanced } from './netlify/adapter.js';
export { cloudflareAdapter, getCloudflareEnv, getExecutionContext, waitUntil, createKVHelper } from './cloudflare/index.js';
export type { CloudflareConfig } from './cloudflare/index.js';
export { cloudflarePagesAdapter, createKVNamespace, createD1Database, createR2Bucket, passThroughOnException } from './cloudflare-pages/index.js';
export type { CloudflarePagesConfig, KVNamespace, D1Database, D1PreparedStatement, R2Bucket } from './cloudflare-pages/index.js';
export { awsAdapter, getAWSContext, getRemainingTimeMs, getRequestId, getS3AssetUrl } from './aws/index.js';
export type { AWSConfig } from './aws/index.js';
export { awsLambdaAdapter } from './aws-lambda/index.js';
export type { AWSLambdaConfig } from './aws-lambda/index.js';
export { nodeAdapter, startServer } from './node/index.js';
export type { NodeConfig } from './node/index.js';
export { staticAdapter, prerender, getStaticPaths } from './static/index.js';
export type { StaticConfig } from './static/index.js';
export { bunAdapter, createBunAdapter, createBunSQLite, onWebSocketMessage, onWebSocketOpen, onWebSocketClose } from './bun/index.js';
export type { BunConfig, BunServerHandler, BunWebSocketConfig, BunWebSocket, BunServer } from './bun/index.js';
export { denoAdapter, createDenoAdapter, startDenoServer, createDenoKV, checkPermissions, requestPermission, isDenoDeply, getDenoDeployRegion } from './deno/index.js';
export type { DenoConfig, DenoDeployConfig, DenoServeHandler, DenoKv } from './deno/index.js';
export { railwayAdapter } from './railway/index.js';
export type { RailwayConfig } from './railway/index.js';
export { detectRuntime, getRuntimeInfo, hasFeature, assertRuntime, isBun, isDeno, isNode, isEdge, isBrowser, isServer } from './runtime-detect.js';
export type { Runtime, RuntimeInfo, RuntimeFeatures } from './runtime-detect.js';
export { detectEdgePlatform, getPlatformInfo, createEdgeEnv, createExecutionContext, getRegion, createEdgeHandler, coalesceRequest, isColdStart, markWarm, getColdStartDuration, resetColdStartTracking, preloadModule, getPreloadedModule, initializeColdStart, createWritableStream, createStreamingResponse, createSSEStream, createSSEHandler, createHTMLStream, parseESITags, processESI, createESIMiddleware, streamThrough, mergeStreams, createStreamTee, EdgeCache, createCacheKey, shouldCacheResponse, createCachedResponse, createCacheMiddleware, createAssetCache, getDefaultCache, resetDefaultCache, getGeoLocation, getClientIP, applyGeoRouting, createGeoRoutingMiddleware, findBestRegion, createLatencyRouter, selectGeoVariant, createVariantCookie, calculateDistance, findNearestLocation, addGeoHeaders, edgeRuntime, streaming, cache, geo, } from './edge/index.js';
export type { EdgePlatform, EdgeContext, EdgeEnv, EdgeExecutionContext, EdgeRegion, EdgeTiming, EdgeKVNamespace, EdgeKVPutOptions, EdgeKVListOptions, EdgeKVListResult, EdgeRuntimeConfig, EdgeHandlerOptions, ColdStartConfig, StreamingConfig, SSEMessage, ESIFragment, HTMLStreamOptions, StreamingWriter, CacheEntry, CacheOptions, EdgeCacheConfig, CacheStats, EdgeKVStore, ResponseCacheOptions, AssetCacheOptions, GeoLocation, GeoRoutingRule, GeoRoutingConfig, RegionConfig, LatencyRoutingConfig, GeoABTestConfig, } from './edge/index.js';
export declare function autoAdapter(config?: AdapterConfig): Adapter;
export declare const presets: {
    /** Vercel with Edge Runtime */
    'vercel-edge': (config?: Partial<import("./vercel/index.js").VercelConfig>) => Adapter & Partial<import("./types.js").EdgeAdapter>;
    /** Vercel with Serverless */
    'vercel-serverless': (config?: Partial<import("./vercel/index.js").VercelConfig>) => Adapter & Partial<import("./types.js").EdgeAdapter>;
    /** Netlify Edge Functions */
    'netlify-edge': (config?: Partial<import("./netlify/index.js").NetlifyConfig>) => Adapter & Partial<import("./types.js").EdgeAdapter>;
    /** Netlify Serverless Functions */
    'netlify-functions': (config?: Partial<import("./netlify/index.js").NetlifyConfig>) => Adapter & Partial<import("./types.js").EdgeAdapter>;
    /** Cloudflare Pages */
    'cloudflare-pages': (config?: Partial<import("./cloudflare/index.js").CloudflareConfig>) => Adapter & import("./types.js").EdgeAdapter;
    /** Cloudflare Workers */
    'cloudflare-workers': (config?: Partial<import("./cloudflare/index.js").CloudflareConfig>) => Adapter & import("./types.js").EdgeAdapter;
    /** AWS Lambda */
    'aws-lambda': (config?: Partial<import("./aws/index.js").AWSConfig>) => Adapter & import("./types.js").ServerlessAdapter;
    /** AWS Lambda@Edge */
    'aws-edge': (config?: Partial<import("./aws/index.js").AWSConfig>) => Adapter & import("./types.js").ServerlessAdapter;
    /** AWS Amplify */
    'aws-amplify': (config?: Partial<import("./aws/index.js").AWSConfig>) => Adapter & import("./types.js").ServerlessAdapter;
    /** Node.js standalone */
    node: (config?: Partial<import("./node/index.js").NodeConfig>) => Adapter;
    /** Static site generation */
    static: (config?: Partial<import("./static/index.js").StaticConfig>) => Adapter;
    /** Bun runtime */
    bun: (config?: Partial<import("./bun/index.js").BunConfig>) => Adapter;
    /** Bun with WebSocket support */
    'bun-websocket': (config?: Partial<import("./bun/index.js").BunConfig>) => Adapter;
    /** Deno runtime */
    deno: (config?: Partial<import("./deno/index.js").DenoConfig>) => Adapter;
    /** Deno with KV storage */
    'deno-kv': (config?: Partial<import("./deno/index.js").DenoConfig>) => Adapter;
    /** Deno Deploy */
    'deno-deploy': (config?: Partial<import("./deno/index.js").DenoConfig>) => Adapter;
    /** Railway */
    railway: (config?: Partial<import("./railway/index.js").RailwayConfig>) => Adapter;
    /** Railway with Docker */
    'railway-docker': (config?: Partial<import("./railway/index.js").RailwayConfig>) => Adapter;
};
export type AdapterPreset = keyof typeof presets;
export declare function createAdapter(preset: AdapterPreset, config?: AdapterConfig): Adapter;
/**
 * Enhanced adapter presets with the new v2.1 API
 */
export declare const enhancedPresets: {
    /** Vercel with Edge Runtime (v2.1) */
    'vercel-edge': (config?: Partial<import("./adapters/vercel.js").VercelAdapterConfig>) => Adapter & Partial<import("./types.js").EdgeAdapter>;
    /** Vercel with Serverless (v2.1) */
    'vercel-serverless': (config?: Partial<import("./adapters/vercel.js").VercelAdapterConfig>) => Adapter & Partial<import("./types.js").EdgeAdapter>;
    /** Cloudflare Pages (v2.1) */
    'cloudflare-pages': (config?: Partial<import("./adapters/cloudflare.js").CloudflareAdapterConfig>) => Adapter & import("./types.js").EdgeAdapter;
    /** Cloudflare Workers (v2.1) */
    'cloudflare-workers': (config?: Partial<import("./adapters/cloudflare.js").CloudflareAdapterConfig>) => Adapter & import("./types.js").EdgeAdapter;
    /** Deno Deploy (v2.1) */
    'deno-deploy': (config?: Partial<import("./adapters/deno-deploy.js").DenoDeployAdapterConfig>) => Adapter & import("./types.js").EdgeAdapter;
    /** Deno Deploy with Fresh (v2.1) */
    'deno-fresh': (config?: Partial<import("./adapters/deno-deploy.js").DenoDeployAdapterConfig>) => Adapter & import("./types.js").EdgeAdapter;
    /** Netlify Edge (v2.1) */
    'netlify-edge': (config?: Partial<import("./adapters/netlify.js").NetlifyAdapterConfig>) => Adapter & Partial<import("./types.js").EdgeAdapter>;
    /** Netlify Functions (v2.1) */
    'netlify-functions': (config?: Partial<import("./adapters/netlify.js").NetlifyAdapterConfig>) => Adapter & Partial<import("./types.js").EdgeAdapter>;
    /** AWS Lambda (v2.1) */
    'aws-lambda': (config?: Partial<import("./adapters/aws-lambda.js").AWSLambdaAdapterConfig>) => Adapter & import("./types.js").ServerlessAdapter;
    /** AWS Lambda@Edge (v2.1) */
    'aws-edge': (config?: Partial<import("./adapters/aws-lambda.js").AWSLambdaAdapterConfig>) => Adapter & import("./types.js").ServerlessAdapter;
    /** AWS Lambda with Streaming (v2.1) */
    'aws-streaming': (config?: Partial<import("./adapters/aws-lambda.js").AWSLambdaAdapterConfig>) => Adapter & import("./types.js").ServerlessAdapter;
    /** Node.js standalone (v2.1) */
    node: (config?: Partial<import("./adapters/node.js").NodeAdapterConfig>) => Adapter;
    /** Node.js with Express (v2.1) */
    'node-express': (config?: Partial<import("./adapters/node.js").NodeAdapterConfig>) => Adapter;
    /** Node.js with Fastify (v2.1) */
    'node-fastify': (config?: Partial<import("./adapters/node.js").NodeAdapterConfig>) => Adapter;
    /** Node.js with PM2 (v2.1) */
    'node-pm2': (config?: Partial<import("./adapters/node.js").NodeAdapterConfig>) => Adapter;
    /** Bun runtime (v2.1) */
    bun: (config?: Partial<import("./adapters/bun.js").BunAdapterConfig>) => Adapter;
    /** Bun with WebSocket (v2.1) */
    'bun-websocket': (config?: Partial<import("./adapters/bun.js").BunAdapterConfig>) => Adapter;
    /** Bun with SQLite (v2.1) */
    'bun-sqlite': (config?: Partial<import("./adapters/bun.js").BunAdapterConfig>) => Adapter;
};
export type EnhancedAdapterPreset = keyof typeof enhancedPresets;
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
export declare function createEnhancedAdapter(preset: EnhancedAdapterPreset, config?: AdapterConfig): Adapter;
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
export declare function defineAdapter<T extends EnhancedAdapterPreset>(preset: T, config?: T extends 'vercel-edge' | 'vercel-serverless' ? Partial<import('./adapters/vercel.js').VercelAdapterConfig> : T extends 'cloudflare-pages' | 'cloudflare-workers' ? Partial<import('./adapters/cloudflare.js').CloudflareAdapterConfig> : T extends 'deno-deploy' | 'deno-fresh' ? Partial<import('./adapters/deno-deploy.js').DenoDeployAdapterConfig> : T extends 'netlify-edge' | 'netlify-functions' ? Partial<import('./adapters/netlify.js').NetlifyAdapterConfig> : T extends 'aws-lambda' | 'aws-edge' | 'aws-streaming' ? Partial<import('./adapters/aws-lambda.js').AWSLambdaAdapterConfig> : T extends 'node' | 'node-express' | 'node-fastify' | 'node-pm2' ? Partial<import('./adapters/node.js').NodeAdapterConfig> : T extends 'bun' | 'bun-websocket' | 'bun-sqlite' ? Partial<import('./adapters/bun.js').BunAdapterConfig> : AdapterConfig): Adapter;
//# sourceMappingURL=index.d.ts.map