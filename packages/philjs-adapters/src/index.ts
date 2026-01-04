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

// Types
import type { Adapter, AdapterConfig } from './types.js';
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
export type {
  Adapter,
  AdapterConfig,
  EdgeAdapter,
  ServerlessAdapter,
  RequestContext,
  ResponseContext,
  RouteManifest,
  RouteEntry,
  BuildOutput,
} from './types.js';

// ============================================================================
// Enhanced Adapters (New v2.1 API)
// ============================================================================

// Vercel Enhanced Adapter
export {
  vercelAdapter as vercelAdapterV2,
  createVercelEdgeConfig as createVercelEdgeConfigV2,
  revalidatePath as revalidatePathV2,
  revalidateTag as revalidateTagV2,
  getVercelContext,
  vercelImageUrl,
} from './adapters/vercel.js';
export type {
  VercelAdapterConfig,
  VercelRegion,
  ISRConfig,
  ImageOptimizationConfig,
  CronConfig,
  MiddlewareConfig,
  HeaderConfig,
  RedirectConfig,
  RewriteConfig,
  FunctionRouteConfig,
} from './adapters/vercel.js';

// Cloudflare Enhanced Adapter
export {
  cloudflareAdapter as cloudflareAdapterV2,
  getCloudflareEnv as getCloudflareEnvV2,
  getExecutionContext as getExecutionContextV2,
  waitUntil as waitUntilV2,
  createKVHelper as createKVHelperV2,
  createD1Helper,
  createR2Helper,
  getDurableObject,
} from './adapters/cloudflare.js';
export type {
  CloudflareAdapterConfig,
  KVNamespaceBinding,
  D1DatabaseBinding,
  DurableObjectBinding,
  R2BucketBinding,
  QueueBinding,
  ServiceBinding,
  RouteConfig as CloudflareRouteConfig,
} from './adapters/cloudflare.js';

// Deno Deploy Adapter
export {
  denoDeployAdapter,
  getDenoKV,
  DenoKVWrapper,
  DenoKVAtomicWrapper,
  isDenoDeply as isDenoDeployV2,
  getDenoDeployRegion as getDenoDeployRegionV2,
  checkDenoPermissions,
  requestDenoPermission,
} from './adapters/deno-deploy.js';
export type {
  DenoDeployAdapterConfig,
  DenoDeployRegion,
  DenoKVConfig,
  FreshConfig,
  ImportMapConfig,
  DenoCompilerOptions,
} from './adapters/deno-deploy.js';

// Netlify Enhanced Adapter
export {
  netlifyAdapter as netlifyAdapterV2,
  getNetlifyContext as getNetlifyContextV2,
  netlifyImageCDN as netlifyImageCDNV2,
  getNetlifyIdentityUser,
  createFormsHandler,
} from './adapters/netlify.js';
export type {
  NetlifyAdapterConfig,
  NetlifyRegion,
  NetlifyHeaderConfig,
  NetlifyRedirectConfig,
  NetlifyPluginConfig,
  NetlifyBuildConfig,
  NetlifyContextConfig,
  NetlifyImageConfig,
  BackgroundFunctionConfig,
  ScheduledFunctionConfig,
  NetlifyGeo,
  NetlifySite,
  NetlifyUser,
} from './adapters/netlify.js';

// AWS Lambda Enhanced Adapter
export {
  awsLambdaAdapter as awsLambdaAdapterV2,
  getAWSLambdaContext,
  getRemainingTimeMs as getRemainingTimeMsV2,
  getAWSRequestId,
  getS3AssetUrl as getS3AssetUrlV2,
} from './adapters/aws-lambda.js';
export type {
  AWSLambdaAdapterConfig,
  APIGatewayConfig,
  CloudFrontConfig,
  S3Config,
  VPCConfig,
  FunctionUrlConfig,
  CORSConfig,
  AuthorizationConfig,
  CacheBehavior,
  AWSLambdaContext,
} from './adapters/aws-lambda.js';

// Node.js Enhanced Adapter
export {
  nodeAdapter as nodeAdapterV2,
  startServer as startServerV2,
  createExpressMiddleware,
  createFastifyPlugin,
} from './adapters/node.js';
export type {
  NodeAdapterConfig,
  ClusterConfig,
  StaticConfig as StaticConfigV2,
  LoggingConfig,
} from './adapters/node.js';

// Bun Enhanced Adapter
export {
  bunAdapter as bunAdapterV2,
  isBun as isBunV2,
  createBunSQLite as createBunSQLiteV2,
  bunFile,
  bunHash,
  bunVerify,
  createBunHandler,
} from './adapters/bun.js';
export type {
  BunAdapterConfig,
  SQLiteConfig,
  WebSocketConfig,
  BunOptimizations,
} from './adapters/bun.js';

// ============================================================================
// Build Utilities
// ============================================================================
export {
  MIME_TYPES,
  createBuildManifest,
  copyStaticAssets,
  optimizeAssets,
  generateHashedFilename,
  createOutputStructure,
  getFileHash,
  isImmutableAsset,
  getCacheControl,
} from './utils/build.js';
export type {
  BuildManifest,
  RouteManifestEntry,
  AssetManifestEntry,
  BuildManifestOptions,
  OptimizeAssetsOptions,
} from './utils/build.js';

// ============================================================================
// Environment Utilities
// ============================================================================
export {
  loadEnvFile,
  loadEnvironment,
  validateEnv,
  injectEnvVariables,
  generateEnvTypes,
  createMemorySecretsManager,
  createEnvSecretsManager,
  getEnv,
  isProduction,
  isDevelopment,
  getMode,
  platformEnv,
} from './utils/env.js';
export type {
  EnvDefinition,
  EnvConfig,
  LoadedEnv,
  SecretsManager,
} from './utils/env.js';

// Vercel
export { vercelAdapter, revalidatePath, revalidateTag, createVercelEdgeConfig } from './vercel/index.js';
export type { VercelConfig } from './vercel/index.js';

// Vercel (enhanced from adapter.ts)
export { vercelAdapter as vercelAdapterEnhanced } from './vercel/adapter.js';
export type { VercelConfig as VercelConfigEnhanced } from './vercel/adapter.js';

// Netlify
export { netlifyAdapter, getNetlifyContext, netlifyImageCDN } from './netlify/index.js';
export type { NetlifyConfig } from './netlify/index.js';

// Netlify (enhanced from adapter.ts)
export { netlifyAdapter as netlifyAdapterEnhanced } from './netlify/adapter.js';
export type { NetlifyConfig as NetlifyConfigEnhanced } from './netlify/adapter.js';

// Cloudflare
export { cloudflareAdapter, getCloudflareEnv, getExecutionContext, waitUntil, createKVHelper } from './cloudflare/index.js';
export type { CloudflareConfig } from './cloudflare/index.js';

// Cloudflare Pages (enhanced)
export {
  cloudflarePagesAdapter,
  createKVNamespace,
  createD1Database,
  createR2Bucket,
  passThroughOnException
} from './cloudflare-pages/index.js';
export type {
  CloudflarePagesConfig,
  KVNamespace,
  D1Database,
  D1PreparedStatement,
  R2Bucket
} from './cloudflare-pages/index.js';

// AWS
export { awsAdapter, getAWSContext, getRemainingTimeMs, getRequestId, getS3AssetUrl } from './aws/index.js';
export type { AWSConfig } from './aws/index.js';

// AWS Lambda (enhanced)
export { awsLambdaAdapter } from './aws-lambda/index.js';
export type { AWSLambdaConfig } from './aws-lambda/index.js';

// Node.js
export { nodeAdapter, startServer } from './node/index.js';
export type { NodeConfig } from './node/index.js';

// Static
export { staticAdapter, prerender, getStaticPaths } from './static/index.js';
export type { StaticConfig } from './static/index.js';

// Bun
export { bunAdapter, createBunAdapter, createBunSQLite, onWebSocketMessage, onWebSocketOpen, onWebSocketClose } from './bun/index.js';
export type { BunConfig, BunServerHandler, BunWebSocketConfig, BunWebSocket, BunServer } from './bun/index.js';

// Deno
export { denoAdapter, createDenoAdapter, startDenoServer, createDenoKV, checkPermissions, requestPermission, isDenoDeply, getDenoDeployRegion } from './deno/index.js';
export type { DenoConfig, DenoDeployConfig, DenoServeHandler, DenoKv } from './deno/index.js';

// Railway
export { railwayAdapter } from './railway/index.js';
export type { RailwayConfig } from './railway/index.js';

// Runtime Detection
export { detectRuntime, getRuntimeInfo, hasFeature, assertRuntime, isBun, isDeno, isNode, isEdge, isBrowser, isServer } from './runtime-detect.js';
export type { Runtime, RuntimeInfo, RuntimeFeatures } from './runtime-detect.js';

// Edge Runtime Optimizations
export {
  // Edge Runtime
  detectEdgePlatform,
  getPlatformInfo,
  createEdgeEnv,
  createExecutionContext,
  getRegion,
  createEdgeHandler,
  coalesceRequest,
  isColdStart,
  markWarm,
  getColdStartDuration,
  resetColdStartTracking,
  preloadModule,
  getPreloadedModule,
  initializeColdStart,

  // Streaming
  createWritableStream,
  createStreamingResponse,
  createSSEStream,
  createSSEHandler,
  createHTMLStream,
  parseESITags,
  processESI,
  createESIMiddleware,
  streamThrough,
  mergeStreams,
  createStreamTee,

  // Caching
  EdgeCache,
  createCacheKey,
  shouldCacheResponse,
  createCachedResponse,
  createCacheMiddleware,
  createAssetCache,
  getDefaultCache,
  resetDefaultCache,

  // Geolocation
  getGeoLocation,
  getClientIP,
  applyGeoRouting,
  createGeoRoutingMiddleware,
  findBestRegion,
  createLatencyRouter,
  selectGeoVariant,
  createVariantCookie,
  calculateDistance,
  findNearestLocation,
  addGeoHeaders,

  // Default exports
  edgeRuntime,
  streaming,
  cache,
  geo,
} from './edge/index.js';

export type {
  // Edge Runtime Types
  EdgePlatform,
  EdgeContext,
  EdgeEnv,
  EdgeExecutionContext,
  EdgeRegion,
  EdgeTiming,
  EdgeKVNamespace,
  EdgeKVPutOptions,
  EdgeKVListOptions,
  EdgeKVListResult,
  EdgeRuntimeConfig,
  EdgeHandlerOptions,
  ColdStartConfig,

  // Streaming Types
  StreamingConfig,
  SSEMessage,
  ESIFragment,
  HTMLStreamOptions,
  StreamingWriter,

  // Cache Types
  CacheEntry,
  CacheOptions,
  EdgeCacheConfig,
  CacheStats,
  EdgeKVStore,
  ResponseCacheOptions,
  AssetCacheOptions,

  // Geo Types
  GeoLocation,
  GeoRoutingRule,
  GeoRoutingConfig,
  RegionConfig,
  LatencyRoutingConfig,
  GeoABTestConfig,
} from './edge/index.js';

// Auto-detect adapter based on environment
export function autoAdapter(config: AdapterConfig = {}): Adapter {
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
  'vercel-edge': (config: Partial<import('./vercel/index.js').VercelConfig> = {}) =>
    vercelAdapter({ ...config, edge: true }),

  /** Vercel with Serverless */
  'vercel-serverless': (config: Partial<import('./vercel/index.js').VercelConfig> = {}) =>
    vercelAdapter({ ...config, edge: false }),

  /** Netlify Edge Functions */
  'netlify-edge': (config: Partial<import('./netlify/index.js').NetlifyConfig> = {}) =>
    netlifyAdapter({ ...config, edge: true }),

  /** Netlify Serverless Functions */
  'netlify-functions': (config: Partial<import('./netlify/index.js').NetlifyConfig> = {}) =>
    netlifyAdapter({ ...config, edge: false }),

  /** Cloudflare Pages */
  'cloudflare-pages': (config: Partial<import('./cloudflare/index.js').CloudflareConfig> = {}) =>
    cloudflareAdapter({ ...config, mode: 'pages' }),

  /** Cloudflare Workers */
  'cloudflare-workers': (config: Partial<import('./cloudflare/index.js').CloudflareConfig> = {}) =>
    cloudflareAdapter({ ...config, mode: 'workers' }),

  /** AWS Lambda */
  'aws-lambda': (config: Partial<import('./aws/index.js').AWSConfig> = {}) =>
    awsAdapter({ ...config, mode: 'lambda' }),

  /** AWS Lambda@Edge */
  'aws-edge': (config: Partial<import('./aws/index.js').AWSConfig> = {}) =>
    awsAdapter({ ...config, mode: 'lambda-edge' }),

  /** AWS Amplify */
  'aws-amplify': (config: Partial<import('./aws/index.js').AWSConfig> = {}) =>
    awsAdapter({ ...config, mode: 'amplify' }),

  /** Node.js standalone */
  'node': (config: Partial<import('./node/index.js').NodeConfig> = {}) =>
    nodeAdapter(config),

  /** Static site generation */
  'static': (config: Partial<import('./static/index.js').StaticConfig> = {}) =>
    staticAdapter(config),

  /** Bun runtime */
  'bun': (config: Partial<import('./bun/index.js').BunConfig> = {}) =>
    bunAdapter(config),

  /** Bun with WebSocket support */
  'bun-websocket': (config: Partial<import('./bun/index.js').BunConfig> = {}) =>
    bunAdapter({ ...config, websocket: { enabled: true } }),

  /** Deno runtime */
  'deno': (config: Partial<import('./deno/index.js').DenoConfig> = {}) =>
    denoAdapter(config),

  /** Deno with KV storage */
  'deno-kv': (config: Partial<import('./deno/index.js').DenoConfig> = {}) =>
    denoAdapter({ ...config, kv: true }),

  /** Deno Deploy */
  'deno-deploy': (config: Partial<import('./deno/index.js').DenoConfig> = {}) =>
    denoAdapter({ ...config, kv: true, deploy: { edgeCache: true } }),

  /** Railway */
  'railway': (config: Partial<import('./railway/index.js').RailwayConfig> = {}) =>
    railwayAdapter(config),

  /** Railway with Docker */
  'railway-docker': (config: Partial<import('./railway/index.js').RailwayConfig> = {}) =>
    railwayAdapter({ ...config, docker: {} }),
};

export type AdapterPreset = keyof typeof presets;

// Helper to create adapter from preset
export function createAdapter(preset: AdapterPreset, config: AdapterConfig = {}): Adapter {
  const factory = presets[preset];
  if (!factory) {
    throw new Error(`Unknown adapter preset: ${preset}`);
  }
  return factory(config as any);
}

// ============================================================================
// Enhanced Adapter Factory (v2.1 API)
// ============================================================================

/**
 * Enhanced adapter presets with the new v2.1 API
 */
export const enhancedPresets = {
  /** Vercel with Edge Runtime (v2.1) */
  'vercel-edge': (config: Partial<import('./adapters/vercel.js').VercelAdapterConfig> = {}) => {
    return vercelAdapterV2({ ...config, edge: true });
  },

  /** Vercel with Serverless (v2.1) */
  'vercel-serverless': (config: Partial<import('./adapters/vercel.js').VercelAdapterConfig> = {}) => {
    return vercelAdapterV2({ ...config, edge: false });
  },

  /** Cloudflare Pages (v2.1) */
  'cloudflare-pages': (config: Partial<import('./adapters/cloudflare.js').CloudflareAdapterConfig> = {}) => {
    return cloudflareAdapterV2({ ...config, mode: 'pages' });
  },

  /** Cloudflare Workers (v2.1) */
  'cloudflare-workers': (config: Partial<import('./adapters/cloudflare.js').CloudflareAdapterConfig> = {}) => {
    return cloudflareAdapterV2({ ...config, mode: 'workers' });
  },

  /** Deno Deploy (v2.1) */
  'deno-deploy': (config: Partial<import('./adapters/deno-deploy.js').DenoDeployAdapterConfig> = {}) => {
    return denoDeployAdapter(config);
  },

  /** Deno Deploy with Fresh (v2.1) */
  'deno-fresh': (config: Partial<import('./adapters/deno-deploy.js').DenoDeployAdapterConfig> = {}) => {
    return denoDeployAdapter({ ...config, fresh: true });
  },

  /** Netlify Edge (v2.1) */
  'netlify-edge': (config: Partial<import('./adapters/netlify.js').NetlifyAdapterConfig> = {}) => {
    return netlifyAdapterV2({ ...config, edge: true });
  },

  /** Netlify Functions (v2.1) */
  'netlify-functions': (config: Partial<import('./adapters/netlify.js').NetlifyAdapterConfig> = {}) => {
    return netlifyAdapterV2({ ...config, edge: false });
  },

  /** AWS Lambda (v2.1) */
  'aws-lambda': (config: Partial<import('./adapters/aws-lambda.js').AWSLambdaAdapterConfig> = {}) => {
    return awsLambdaAdapter({ ...config, integration: 'http-api' });
  },

  /** AWS Lambda@Edge (v2.1) */
  'aws-edge': (config: Partial<import('./adapters/aws-lambda.js').AWSLambdaAdapterConfig> = {}) => {
    return awsLambdaAdapter({ ...config, integration: 'lambda-edge' });
  },

  /** AWS Lambda with Streaming (v2.1) */
  'aws-streaming': (config: Partial<import('./adapters/aws-lambda.js').AWSLambdaAdapterConfig> = {}) => {
    return awsLambdaAdapter({ ...config, streaming: true });
  },

  /** Node.js standalone (v2.1) */
  'node': (config: Partial<import('./adapters/node.js').NodeAdapterConfig> = {}) => {
    return nodeAdapterV2(config);
  },

  /** Node.js with Express (v2.1) */
  'node-express': (config: Partial<import('./adapters/node.js').NodeAdapterConfig> = {}) => {
    return nodeAdapterV2({ ...config, express: true });
  },

  /** Node.js with Fastify (v2.1) */
  'node-fastify': (config: Partial<import('./adapters/node.js').NodeAdapterConfig> = {}) => {
    return nodeAdapterV2({ ...config, fastify: true });
  },

  /** Node.js with PM2 (v2.1) */
  'node-pm2': (config: Partial<import('./adapters/node.js').NodeAdapterConfig> = {}) => {
    return nodeAdapterV2({ ...config, generatePM2: true, cluster: true });
  },

  /** Bun runtime (v2.1) */
  'bun': (config: Partial<import('./adapters/bun.js').BunAdapterConfig> = {}) => {
    return bunAdapterV2(config);
  },

  /** Bun with WebSocket (v2.1) */
  'bun-websocket': (config: Partial<import('./adapters/bun.js').BunAdapterConfig> = {}) => {
    return bunAdapterV2({ ...config, websocket: { enabled: true } });
  },

  /** Bun with SQLite (v2.1) */
  'bun-sqlite': (config: Partial<import('./adapters/bun.js').BunAdapterConfig> = {}) => {
    return bunAdapterV2({ ...config, sqlite: './data.db' });
  },
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
export function createEnhancedAdapter(
  preset: EnhancedAdapterPreset,
  config: AdapterConfig = {}
): Adapter {
  const factory = enhancedPresets[preset];
  if (!factory) {
    throw new Error(`Unknown enhanced adapter preset: ${preset}`);
  }
  return factory(config as any);
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
export function defineAdapter<T extends EnhancedAdapterPreset>(
  preset: T,
  config: T extends 'vercel-edge' | 'vercel-serverless'
    ? Partial<import('./adapters/vercel.js').VercelAdapterConfig>
    : T extends 'cloudflare-pages' | 'cloudflare-workers'
    ? Partial<import('./adapters/cloudflare.js').CloudflareAdapterConfig>
    : T extends 'deno-deploy' | 'deno-fresh'
    ? Partial<import('./adapters/deno-deploy.js').DenoDeployAdapterConfig>
    : T extends 'netlify-edge' | 'netlify-functions'
    ? Partial<import('./adapters/netlify.js').NetlifyAdapterConfig>
    : T extends 'aws-lambda' | 'aws-edge' | 'aws-streaming'
    ? Partial<import('./adapters/aws-lambda.js').AWSLambdaAdapterConfig>
    : T extends 'node' | 'node-express' | 'node-fastify' | 'node-pm2'
    ? Partial<import('./adapters/node.js').NodeAdapterConfig>
    : T extends 'bun' | 'bun-websocket' | 'bun-sqlite'
    ? Partial<import('./adapters/bun.js').BunAdapterConfig>
    : AdapterConfig = {} as any
): Adapter {
  return createEnhancedAdapter(preset, config as AdapterConfig);
}
