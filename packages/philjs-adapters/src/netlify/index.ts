/**
 * PhilJS Netlify Adapter
 *
 * Deploy to Netlify with Edge Functions and Serverless Functions support
 */

import { writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join } from 'path';
import type { Adapter, AdapterConfig, EdgeAdapter, RequestContext } from '../types';

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

export function netlifyAdapter(config: NetlifyConfig = {}): Adapter & Partial<EdgeAdapter> {
  const {
    outDir = '.netlify',
    edge = false,
    builders = true,
    excludedPaths = [],
    headers = [],
    redirects = [],
    forms = false,
    identity = false,
  } = config;

  return {
    name: 'netlify',
    edge,

    async adapt() {
      console.log('Building for Netlify...');

      // Create output directories
      const functionsDir = edge
        ? join(outDir, 'edge-functions')
        : join(outDir, 'functions');

      mkdirSync(functionsDir, { recursive: true });
      mkdirSync(join('publish'), { recursive: true });

      // Generate netlify.toml
      const netlifyToml = generateNetlifyToml({
        edge,
        functionsDir,
        headers,
        redirects,
        forms,
        identity,
        excludedPaths,
        builders,
      });

      writeFileSync('netlify.toml', netlifyToml);

      // Generate main function
      if (edge) {
        writeFileSync(
          join(functionsDir, 'handler.ts'),
          generateEdgeFunctionHandler()
        );

        // Edge function manifest
        writeFileSync(
          join(functionsDir, 'manifest.json'),
          JSON.stringify({
            functions: [{
              function: 'handler',
              path: '/*',
              excludedPath: ['/static/*', '/_next/*', ...excludedPaths],
            }],
            version: 1,
          }, null, 2)
        );
      } else {
        writeFileSync(
          join(functionsDir, 'handler.ts'),
          generateServerlessFunctionHandler(builders)
        );
      }

      // Copy static assets
      const staticDir = config.static?.assets || 'public';
      if (existsSync(staticDir)) {
        cpSync(staticDir, 'publish', { recursive: true });
      }

      // Copy prerendered pages
      if (existsSync('.philjs/prerendered')) {
        cpSync('.philjs/prerendered', 'publish', { recursive: true });
      }

      console.log('Netlify build complete');
    },

    getHandler() {
      return async (request: Request, context?: unknown): Promise<Response> => {
        const url = new URL(request.url);

        const requestContext: RequestContext = {
          url,
          method: request.method,
          headers: request.headers,
          body: request.body,
          params: {},
          platform: {
            name: 'netlify',
            edge,
            context,
          },
        };

        const { handleRequest } = await import('@philjs/ssr');
        return handleRequest(requestContext);
      };
    },
  };
}

function generateNetlifyToml(options: {
  edge: boolean;
  functionsDir: string;
  headers: NetlifyConfig['headers'];
  redirects: NetlifyConfig['redirects'];
  forms: boolean;
  identity: boolean;
  excludedPaths: string[];
  builders: boolean;
}): string {
  const lines: string[] = [
    '[build]',
    '  publish = "publish"',
    `  functions = "${options.edge ? '.netlify/edge-functions' : '.netlify/functions'}"`,
    '',
  ];

  // Add edge function config
  if (options.edge) {
    lines.push('[edge_functions]');
    lines.push('  package = ".netlify/edge-functions"');
    lines.push('');
  }

  // Add redirects for SPA fallback
  lines.push('[[redirects]]');
  lines.push('  from = "/*"');
  lines.push(`  to = "/.netlify/${options.edge ? 'edge-functions' : 'functions'}/handler"`);
  lines.push('  status = 200');
  lines.push('');

  // Custom redirects
  for (const redirect of options.redirects || []) {
    lines.push('[[redirects]]');
    lines.push(`  from = "${redirect.from}"`);
    lines.push(`  to = "${redirect.to}"`);
    lines.push(`  status = ${redirect.status || 301}`);
    if (redirect.force) {
      lines.push('  force = true');
    }
    lines.push('');
  }

  // Custom headers
  for (const header of options.headers || []) {
    lines.push('[[headers]]');
    lines.push(`  for = "${header.for}"`);
    lines.push('  [headers.values]');
    for (const [key, value] of Object.entries(header.values)) {
      lines.push(`    ${key} = "${value}"`);
    }
    lines.push('');
  }

  // Static asset caching
  lines.push('[[headers]]');
  lines.push('  for = "/static/*"');
  lines.push('  [headers.values]');
  lines.push('    Cache-Control = "public, max-age=31536000, immutable"');
  lines.push('');

  return lines.join('\n');
}

function generateEdgeFunctionHandler(): string {
  return `
// PhilJS Netlify Edge Function Handler
import type { Context } from "@netlify/edge-functions";

export default async function handler(request: Request, context: Context) {
  const { handleRequest } = await import('@philjs/ssr');

  const url = new URL(request.url);

  const requestContext = {
    url,
    method: request.method,
    headers: request.headers,
    body: request.body,
    params: {},
    platform: {
      name: 'netlify',
      edge: true,
      geo: context.geo,
      ip: context.ip,
      cookies: context.cookies,
      next: context.next,
      rewrite: context.rewrite,
    },
  };

  return handleRequest(requestContext);
}

export const config = {
  path: "/*",
  excludedPath: ["/static/*", "/_philjs/*"],
};
`;
}

function generateServerlessFunctionHandler(useBuilder: boolean): string {
  const builderImport = useBuilder
    ? `import { builder } from "@netlify/functions";`
    : '';

  const wrapper = useBuilder
    ? 'builder(handler)'
    : 'handler';

  return `
// PhilJS Netlify Serverless Function Handler
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
${builderImport}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const { handleRequest } = await import('@philjs/ssr');

  const url = new URL(event.rawUrl);

  const headers = new Headers();
  for (const [key, value] of Object.entries(event.headers || {})) {
    if (value) headers.set(key, value);
  }

  const requestContext = {
    url,
    method: event.httpMethod,
    headers,
    body: event.body,
    params: {},
    platform: {
      name: 'netlify',
      edge: false,
      context,
      clientContext: context.clientContext,
    },
  };

  const response = await handleRequest(requestContext);

  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });

  return {
    statusCode: response.status,
    headers: responseHeaders,
    body: await response.text(),
  };
};

export { ${wrapper} as handler };
`;
}

// Netlify-specific utilities
export function getNetlifyContext() {
  // Access Netlify context in edge functions
  return {
    geo: (globalThis as any).Netlify?.geo,
    ip: (globalThis as any).Netlify?.ip,
  };
}

export function netlifyImageCDN(src: string, options: {
  width?: number;
  height?: number;
  fit?: 'contain' | 'cover' | 'fill';
  format?: 'avif' | 'webp' | 'png' | 'jpg';
} = {}) {
  const params = new URLSearchParams();
  if (options.width) params.set('w', String(options.width));
  if (options.height) params.set('h', String(options.height));
  if (options.fit) params.set('fit', options.fit);
  if (options.format) params.set('fm', options.format);

  return `/.netlify/images?url=${encodeURIComponent(src)}&${params}`;
}

export default netlifyAdapter;
