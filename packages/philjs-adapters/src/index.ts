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
 */

// Types
import type { Adapter, AdapterConfig } from './types';
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
} from './types';

// Vercel
export { vercelAdapter, revalidatePath, revalidateTag, createVercelEdgeConfig } from './vercel';
export type { VercelConfig } from './vercel';

// Vercel (enhanced from adapter.ts)
export { vercelAdapter as vercelAdapterEnhanced } from './vercel/adapter';
export type { VercelConfig as VercelConfigEnhanced } from './vercel/adapter';

// Netlify
export { netlifyAdapter, getNetlifyContext, netlifyImageCDN } from './netlify';
export type { NetlifyConfig } from './netlify';

// Netlify (enhanced from adapter.ts)
export { netlifyAdapter as netlifyAdapterEnhanced } from './netlify/adapter';
export type { NetlifyConfig as NetlifyConfigEnhanced } from './netlify/adapter';

// Cloudflare
export { cloudflareAdapter, getCloudflareEnv, getExecutionContext, waitUntil, createKVHelper } from './cloudflare';
export type { CloudflareConfig } from './cloudflare';

// Cloudflare Pages (enhanced)
export {
  cloudflarePagesAdapter,
  createKVNamespace,
  createD1Database,
  createR2Bucket,
  passThroughOnException
} from './cloudflare-pages';
export type {
  CloudflarePagesConfig,
  KVNamespace,
  D1Database,
  D1PreparedStatement,
  R2Bucket
} from './cloudflare-pages';

// AWS
export { awsAdapter, getAWSContext, getRemainingTimeMs, getRequestId, getS3AssetUrl } from './aws';
export type { AWSConfig } from './aws';

// AWS Lambda (enhanced)
export { awsLambdaAdapter } from './aws-lambda';
export type { AWSLambdaConfig } from './aws-lambda';

// Node.js
export { nodeAdapter, startServer } from './node';
export type { NodeConfig } from './node';

// Static
export { staticAdapter, prerender, getStaticPaths } from './static';
export type { StaticConfig } from './static';

// Bun
export { bunAdapter, createBunAdapter, createBunSQLite, onWebSocketMessage, onWebSocketOpen, onWebSocketClose } from './bun';
export type { BunConfig, BunServerHandler, BunWebSocketConfig, BunWebSocket, BunServer } from './bun';

// Deno
export { denoAdapter, createDenoAdapter, startDenoServer, createDenoKV, checkPermissions, requestPermission, isDenoDeply, getDenoDeployRegion } from './deno';
export type { DenoConfig, DenoDeployConfig, DenoServeHandler, DenoKv } from './deno';

// Railway
export { railwayAdapter } from './railway';
export type { RailwayConfig } from './railway';

// Runtime Detection
export { detectRuntime, getRuntimeInfo, hasFeature, assertRuntime, isBun, isDeno, isNode, isEdge, isBrowser, isServer } from './runtime-detect';
export type { Runtime, RuntimeInfo, RuntimeFeatures } from './runtime-detect';

// Auto-detect adapter based on environment
export function autoAdapter(config: AdapterConfig = {}): Adapter {
  // Check for runtime first (Bun, Deno)
  if (typeof globalThis !== 'undefined' && 'Bun' in globalThis) {
    const { bunAdapter } = require('./bun');
    return bunAdapter(config);
  }

  if (typeof globalThis !== 'undefined' && 'Deno' in globalThis) {
    const { denoAdapter } = require('./deno');
    return denoAdapter(config);
  }

  // Check for platform-specific environment variables
  if (typeof process !== 'undefined' && process.env?.VERCEL) {
    const { vercelAdapter } = require('./vercel');
    return vercelAdapter(config);
  }

  if (typeof process !== 'undefined' && process.env?.NETLIFY) {
    const { netlifyAdapter } = require('./netlify');
    return netlifyAdapter(config);
  }

  if (typeof process !== 'undefined' && (process.env?.CF_PAGES || process.env?.CLOUDFLARE_WORKERS)) {
    const { cloudflareAdapter } = require('./cloudflare');
    return cloudflareAdapter(config);
  }

  if (typeof process !== 'undefined' && (process.env?.AWS_LAMBDA_FUNCTION_NAME || process.env?.AWS_EXECUTION_ENV)) {
    const { awsAdapter } = require('./aws');
    return awsAdapter(config);
  }

  // Default to Node.js adapter
  const { nodeAdapter } = require('./node');
  return nodeAdapter(config);
}

// Adapter presets
export const presets = {
  /** Vercel with Edge Runtime */
  'vercel-edge': (config: Partial<import('./vercel').VercelConfig> = {}) =>
    require('./vercel').vercelAdapter({ ...config, edge: true }),

  /** Vercel with Serverless */
  'vercel-serverless': (config: Partial<import('./vercel').VercelConfig> = {}) =>
    require('./vercel').vercelAdapter({ ...config, edge: false }),

  /** Netlify Edge Functions */
  'netlify-edge': (config: Partial<import('./netlify').NetlifyConfig> = {}) =>
    require('./netlify').netlifyAdapter({ ...config, edge: true }),

  /** Netlify Serverless Functions */
  'netlify-functions': (config: Partial<import('./netlify').NetlifyConfig> = {}) =>
    require('./netlify').netlifyAdapter({ ...config, edge: false }),

  /** Cloudflare Pages */
  'cloudflare-pages': (config: Partial<import('./cloudflare').CloudflareConfig> = {}) =>
    require('./cloudflare').cloudflareAdapter({ ...config, mode: 'pages' }),

  /** Cloudflare Workers */
  'cloudflare-workers': (config: Partial<import('./cloudflare').CloudflareConfig> = {}) =>
    require('./cloudflare').cloudflareAdapter({ ...config, mode: 'workers' }),

  /** AWS Lambda */
  'aws-lambda': (config: Partial<import('./aws').AWSConfig> = {}) =>
    require('./aws').awsAdapter({ ...config, mode: 'lambda' }),

  /** AWS Lambda@Edge */
  'aws-edge': (config: Partial<import('./aws').AWSConfig> = {}) =>
    require('./aws').awsAdapter({ ...config, mode: 'lambda-edge' }),

  /** AWS Amplify */
  'aws-amplify': (config: Partial<import('./aws').AWSConfig> = {}) =>
    require('./aws').awsAdapter({ ...config, mode: 'amplify' }),

  /** Node.js standalone */
  'node': (config: Partial<import('./node').NodeConfig> = {}) =>
    require('./node').nodeAdapter(config),

  /** Static site generation */
  'static': (config: Partial<import('./static').StaticConfig> = {}) =>
    require('./static').staticAdapter(config),

  /** Bun runtime */
  'bun': (config: Partial<import('./bun').BunConfig> = {}) =>
    require('./bun').bunAdapter(config),

  /** Bun with WebSocket support */
  'bun-websocket': (config: Partial<import('./bun').BunConfig> = {}) =>
    require('./bun').bunAdapter({ ...config, websocket: { enabled: true } }),

  /** Deno runtime */
  'deno': (config: Partial<import('./deno').DenoConfig> = {}) =>
    require('./deno').denoAdapter(config),

  /** Deno with KV storage */
  'deno-kv': (config: Partial<import('./deno').DenoConfig> = {}) =>
    require('./deno').denoAdapter({ ...config, kv: true }),

  /** Deno Deploy */
  'deno-deploy': (config: Partial<import('./deno').DenoConfig> = {}) =>
    require('./deno').denoAdapter({ ...config, kv: true, deploy: { edgeCache: true } }),

  /** Railway */
  'railway': (config: Partial<import('./railway').RailwayConfig> = {}) =>
    require('./railway').railwayAdapter(config),

  /** Railway with Docker */
  'railway-docker': (config: Partial<import('./railway').RailwayConfig> = {}) =>
    require('./railway').railwayAdapter({ ...config, docker: {} }),
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
