/**
 * @philjs/serverless
 *
 * Unified serverless adapter for AWS, Vercel, Cloudflare, and more
 */

import { awsHandler } from './aws.js';
import { netlifyHandler } from './netlify.js';

export * from './aws.js';
export * from './vercel.js';
export * from './cloudflare.js';
export * from './netlify.js';

export type ServerlessPlatform = 'aws' | 'vercel' | 'cloudflare' | 'netlify';

export interface ServerlessConfig {
  platform?: ServerlessPlatform;
  region?: string;
  timeout?: number;
  memory?: number;
}

/**
 * Auto-detect the serverless platform
 */
export function detectPlatform(): ServerlessPlatform | null {
  if (process.env['AWS_LAMBDA_FUNCTION_NAME']) return 'aws';
  if (process.env['VERCEL']) {
    return 'vercel';
  }
  if (process.env['CF_PAGES'] || (typeof caches !== 'undefined' && 'default' in caches)) {
    return 'cloudflare';
  }
  if (process.env['NETLIFY']) {
    return 'netlify';
  }
  return null;
}

/**
 * Create a unified handler that works across all platforms
 */
export function createHandler(handler: (request: Request) => Promise<Response>) {
  return {
    // AWS Lambda
    aws: (event: any, context: any) => awsHandler(event, context, handler),
    // Vercel Edge/Serverless
    vercel: handler,
    // Cloudflare Workers
    cloudflare: { fetch: handler },
    // Netlify Functions
    netlify: (event: any, context: any) => netlifyHandler(event, context, handler),
    // Universal handler
    handle() {
      const platform = detectPlatform();
      switch (platform) {
        case 'aws':
          return this.aws;
        case 'vercel':
          return this.vercel;
        case 'cloudflare':
          return this.cloudflare;
        case 'netlify':
          return this.netlify;
        default:
          return this.vercel;
      }
    },
  };
}