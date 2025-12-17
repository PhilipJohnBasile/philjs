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

// Types
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

// Netlify
export { netlifyAdapter, getNetlifyContext, netlifyImageCDN } from './netlify';
export type { NetlifyConfig } from './netlify';

// Cloudflare
export { cloudflareAdapter, getCloudflareEnv, getExecutionContext, waitUntil, createKVHelper } from './cloudflare';
export type { CloudflareConfig } from './cloudflare';

// AWS
export { awsAdapter, getAWSContext, getRemainingTimeMs, getRequestId, getS3AssetUrl } from './aws';
export type { AWSConfig } from './aws';

// Node.js
export { nodeAdapter, startServer } from './node';
export type { NodeConfig } from './node';

// Static
export { staticAdapter, prerender, getStaticPaths } from './static';
export type { StaticConfig } from './static';

// Auto-detect adapter based on environment
export function autoAdapter(config: AdapterConfig = {}): Adapter {
  // Check for platform-specific environment variables
  if (process.env.VERCEL) {
    const { vercelAdapter } = require('./vercel');
    return vercelAdapter(config);
  }

  if (process.env.NETLIFY) {
    const { netlifyAdapter } = require('./netlify');
    return netlifyAdapter(config);
  }

  if (process.env.CF_PAGES || process.env.CLOUDFLARE_WORKERS) {
    const { cloudflareAdapter } = require('./cloudflare');
    return cloudflareAdapter(config);
  }

  if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.AWS_EXECUTION_ENV) {
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
