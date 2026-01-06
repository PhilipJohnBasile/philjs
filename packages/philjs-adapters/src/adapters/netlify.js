/**
 * PhilJS Netlify Adapter
 *
 * Production-ready deployment adapter for Netlify with:
 * - Edge Functions support
 * - Serverless Functions
 * - Forms integration
 * - Identity integration
 * - Image CDN
 * - netlify.toml generation
 *
 * @module philjs-adapters/adapters/netlify
 */
import { writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join } from 'path';
import { createBuildManifest, copyStaticAssets } from '../utils/build.js';
import { loadEnvFile } from '../utils/env.js';
/**
 * Create a Netlify deployment adapter
 *
 * @example
 * ```typescript
 * import { netlifyAdapter } from 'philjs-adapters/adapters/netlify';
 *
 * export default defineConfig({
 *   adapter: netlifyAdapter({
 *     edge: true,
 *     forms: true,
 *     identity: true,
 *     headers: [{
 *       for: '/*',
 *       values: { 'X-Frame-Options': 'DENY' },
 *     }],
 *   }),
 * });
 * ```
 */
export function netlifyAdapter(config = {}) {
    const { outDir = '.netlify', edge = false, builders = true, functionsDir = '.netlify/functions', publishDir = 'publish', forms = false, identity = false, excludedPaths = [], headers = [], redirects = [], plugins = [], build, contexts, regions = [], generateConfig = true, images, backgroundFunctions = [], scheduledFunctions = [], } = config;
    const adapter = {
        name: 'netlify',
        edge,
        async adapt() {
            console.log(`Building for Netlify (${edge ? 'Edge' : 'Serverless'})...`);
            // Create output directories
            const outputFunctionsDir = edge
                ? join(outDir, 'edge-functions')
                : functionsDir;
            mkdirSync(outputFunctionsDir, { recursive: true });
            mkdirSync(publishDir, { recursive: true });
            // Generate main function handler
            if (edge) {
                await generateEdgeFunction(outputFunctionsDir);
            }
            else {
                await generateServerlessFunction(outputFunctionsDir);
            }
            // Generate background functions
            for (const bgFunc of backgroundFunctions) {
                await generateBackgroundFunction(outputFunctionsDir, bgFunc);
            }
            // Generate scheduled functions
            for (const schedFunc of scheduledFunctions) {
                await generateScheduledFunction(outputFunctionsDir, schedFunc);
            }
            // Copy static assets
            await copyStaticAssets(config.static?.assets || 'public', publishDir);
            // Copy prerendered pages
            if (existsSync('.philjs/prerendered')) {
                cpSync('.philjs/prerendered', publishDir, { recursive: true });
            }
            // Generate netlify.toml
            if (generateConfig) {
                const netlifyToml = generateNetlifyToml();
                writeFileSync('netlify.toml', netlifyToml);
            }
            // Generate _headers file
            if (headers.length > 0) {
                writeFileSync(join(publishDir, '_headers'), generateHeadersFile());
            }
            // Generate _redirects file
            if (redirects.length > 0) {
                writeFileSync(join(publishDir, '_redirects'), generateRedirectsFile());
            }
            // Generate build manifest
            const manifest = await createBuildManifest({
                adapter: 'netlify',
                outputDir: outDir,
                routes: [],
            });
            writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
        },
        getHandler() {
            return async (request, context) => {
                const url = new URL(request.url);
                const requestContext = {
                    url,
                    method: request.method,
                    headers: request.headers,
                    body: request.body,
                    params: {},
                    platform: {
                        name: 'netlify',
                        edge,
                        context,
                        forms,
                        identity,
                    },
                };
                const { handleRequest } = await import('@philjs/ssr');
                return handleRequest(requestContext);
            };
        },
    };
    // Add edgeConfig only if edge is true
    if (edge) {
        adapter.edgeConfig = {
            regions: regions,
        };
    }
    return adapter;
    /**
     * Generate Edge Function handler
     */
    async function generateEdgeFunction(outputDir) {
        // Generate handler
        writeFileSync(join(outputDir, 'handler.ts'), generateEdgeFunctionHandler());
        // Generate manifest
        const manifest = {
            functions: [{
                    function: 'handler',
                    path: '/*',
                    excludedPath: ['/static/*', '/_philjs/*', ...excludedPaths],
                }],
            version: 1,
        };
        writeFileSync(join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    }
    /**
     * Generate Serverless Function handler
     */
    async function generateServerlessFunction(outputDir) {
        writeFileSync(join(outputDir, 'handler.ts'), generateServerlessFunctionHandler());
    }
    /**
     * Generate background function
     */
    async function generateBackgroundFunction(outputDir, config) {
        writeFileSync(join(outputDir, `${config.name}-background.ts`), `// Netlify Background Function: ${config.name}
// Generated by PhilJS Adapters

import type { BackgroundHandler } from "@netlify/functions";

export const handler: BackgroundHandler = async (event, context) => {
  console.log("Background function ${config.name} started");

  try {
    // Import and execute the handler
    const { default: userHandler } = await import("${config.handler}");
    await userHandler(event, context);
  } catch (error) {
    console.error("Background function error:", error);
  }
};
`);
    }
    /**
     * Generate scheduled function
     */
    async function generateScheduledFunction(outputDir, config) {
        writeFileSync(join(outputDir, `${config.name}.ts`), `// Netlify Scheduled Function: ${config.name}
// Schedule: ${config.schedule}
// Generated by PhilJS Adapters

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { schedule } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  console.log("Scheduled function ${config.name} triggered");

  try {
    const { default: userHandler } = await import("${config.handler}");
    return await userHandler(event, context);
  } catch (error) {
    console.error("Scheduled function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Scheduled function failed" }),
    };
  }
};

export const handler = schedule("${config.schedule}", handler);
`);
    }
    /**
     * Generate Edge Function handler code
     */
    function generateEdgeFunctionHandler() {
        return `// PhilJS Netlify Edge Function Handler
// Generated by PhilJS Adapters

import type { Context } from "@netlify/edge-functions";
import { handleRequest } from '@philjs/ssr';

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);

  // Skip static files
  const staticPatterns = ['/static/', '/_philjs/', '.ico', '.txt', '.xml'];
  if (staticPatterns.some(p => url.pathname.includes(p) || url.pathname.endsWith(p.slice(1)))) {
    return context.next();
  }

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
      json: context.json,
      ${forms ? 'forms: true,' : ''}
      ${identity ? 'identity: context.clientContext?.identity,' : ''}
    },
  };

  try {
    return await handleRequest(requestContext);
  } catch (error) {
    console.error("Request error:", error);
    return context.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const config = {
  path: "/*",
  excludedPath: ["/static/*", "/_philjs/*"${excludedPaths.map(p => `, "${p}"`).join('')}],
  ${regions.length > 0 ? `regions: ${JSON.stringify(regions)},` : ''}
};
`;
    }
    /**
     * Generate Serverless Function handler code
     */
    function generateServerlessFunctionHandler() {
        const builderWrapper = builders
            ? `
import { builder } from "@netlify/functions";

export const handler = builder(async (event: HandlerEvent, context: HandlerContext) => {
  return mainHandler(event, context);
});
`
            : `
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  return mainHandler(event, context);
};
`;
        return `// PhilJS Netlify Serverless Function Handler
// Generated by PhilJS Adapters

import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
${builders ? 'import { builder } from "@netlify/functions";' : ''}
import { handleRequest } from '@philjs/ssr';

async function mainHandler(event: HandlerEvent, context: HandlerContext) {
  const url = new URL(event.rawUrl);

  const headers = new Headers();
  for (const [key, value] of Object.entries(event.headers || {})) {
    if (value) headers.set(key, value);
  }

  const requestContext = {
    url,
    method: event.httpMethod,
    headers,
    body: event.body ? new ReadableStream({
      start(controller) {
        const body = event.isBase64Encoded
          ? Buffer.from(event.body!, 'base64').toString()
          : event.body;
        controller.enqueue(new TextEncoder().encode(body!));
        controller.close();
      }
    }) : null,
    params: {},
    platform: {
      name: 'netlify',
      edge: false,
      context,
      clientContext: context.clientContext,
      ${forms ? 'forms: true,' : ''}
      ${identity ? `identity: context.clientContext?.identity,
      user: context.clientContext?.user,` : ''}
    },
  };

  try {
    const response = await handleRequest(requestContext);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    let body = '';
    if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        body += decoder.decode(value, { stream: true });
      }
    }

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body,
    };
  } catch (error) {
    console.error("Request error:", error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: "Internal Server Error" }),
    };
  }
}

${builders ? `export const handler = builder(mainHandler);` : `export const handler: Handler = mainHandler;`}
`;
    }
    /**
     * Generate netlify.toml configuration
     */
    function generateNetlifyToml() {
        const lines = [
            '# PhilJS Netlify Configuration',
            '# Generated by PhilJS Adapters',
            '',
        ];
        // Build configuration
        lines.push('[build]');
        lines.push(`  publish = "${build?.publish || publishDir}"`);
        lines.push(`  functions = "${build?.functions || functionsDir}"`);
        if (build?.command) {
            lines.push(`  command = "${build.command}"`);
        }
        if (build?.base) {
            lines.push(`  base = "${build.base}"`);
        }
        if (build?.ignore) {
            lines.push(`  ignore = "${build.ignore}"`);
        }
        lines.push('');
        // Edge functions
        if (edge) {
            lines.push('[edge_functions]');
            lines.push(`  package = "${outDir}/edge-functions"`);
            lines.push('');
        }
        // Build environment
        if (build?.environment && Object.keys(build.environment).length > 0) {
            lines.push('[build.environment]');
            for (const [key, value] of Object.entries(build.environment)) {
                lines.push(`  ${key} = "${value}"`);
            }
            lines.push('');
        }
        // Processing
        if (build?.processing) {
            lines.push('[build.processing]');
            if (build.processing.css) {
                lines.push('[build.processing.css]');
                if (build.processing.css.bundle !== undefined) {
                    lines.push(`  bundle = ${build.processing.css.bundle}`);
                }
                if (build.processing.css.minify !== undefined) {
                    lines.push(`  minify = ${build.processing.css.minify}`);
                }
            }
            if (build.processing.js) {
                lines.push('[build.processing.js]');
                if (build.processing.js.bundle !== undefined) {
                    lines.push(`  bundle = ${build.processing.js.bundle}`);
                }
                if (build.processing.js.minify !== undefined) {
                    lines.push(`  minify = ${build.processing.js.minify}`);
                }
            }
            if (build.processing.html) {
                lines.push('[build.processing.html]');
                if (build.processing.html.prettyUrls !== undefined) {
                    lines.push(`  pretty_urls = ${build.processing.html.prettyUrls}`);
                }
            }
            if (build.processing.images) {
                lines.push('[build.processing.images]');
                if (build.processing.images.compress !== undefined) {
                    lines.push(`  compress = ${build.processing.images.compress}`);
                }
            }
            lines.push('');
        }
        // Main redirect for SPA
        lines.push('[[redirects]]');
        lines.push('  from = "/*"');
        lines.push(`  to = "/.netlify/${edge ? 'edge-functions' : 'functions'}/handler"`);
        lines.push('  status = 200');
        lines.push('');
        // Custom redirects
        for (const redirect of redirects) {
            lines.push('[[redirects]]');
            lines.push(`  from = "${redirect.from}"`);
            lines.push(`  to = "${redirect.to}"`);
            lines.push(`  status = ${redirect.status || 301}`);
            if (redirect.force) {
                lines.push('  force = true');
            }
            if (redirect.conditions) {
                if (redirect.conditions.Language) {
                    lines.push(`  [redirects.conditions]`);
                    lines.push(`    Language = [${redirect.conditions.Language.map(l => `"${l}"`).join(', ')}]`);
                }
                if (redirect.conditions.Country) {
                    lines.push(`  [redirects.conditions]`);
                    lines.push(`    Country = [${redirect.conditions.Country.map(c => `"${c}"`).join(', ')}]`);
                }
            }
            lines.push('');
        }
        // Headers
        for (const header of headers) {
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
        // Functions configuration
        lines.push('[functions]');
        lines.push('  node_bundler = "esbuild"');
        if (scheduledFunctions.length > 0 || backgroundFunctions.length > 0) {
            lines.push('  included_files = ["node_modules/**"]');
        }
        lines.push('');
        // Context-specific configuration
        if (contexts) {
            for (const [contextName, contextConfig] of Object.entries(contexts)) {
                lines.push(`[context.${contextName}]`);
                if (contextConfig.command) {
                    lines.push(`  command = "${contextConfig.command}"`);
                }
                if (contextConfig.publish) {
                    lines.push(`  publish = "${contextConfig.publish}"`);
                }
                if (contextConfig.environment) {
                    lines.push(`  [context.${contextName}.environment]`);
                    for (const [key, value] of Object.entries(contextConfig.environment)) {
                        lines.push(`    ${key} = "${value}"`);
                    }
                }
                lines.push('');
            }
        }
        // Plugins
        for (const plugin of plugins) {
            lines.push('[[plugins]]');
            lines.push(`  package = "${plugin.package}"`);
            if (plugin.inputs && Object.keys(plugin.inputs).length > 0) {
                lines.push('  [plugins.inputs]');
                for (const [key, value] of Object.entries(plugin.inputs)) {
                    lines.push(`    ${key} = ${JSON.stringify(value)}`);
                }
            }
            lines.push('');
        }
        return lines.join('\n');
    }
    /**
     * Generate _headers file
     */
    function generateHeadersFile() {
        const lines = [];
        for (const header of headers) {
            lines.push(header.for);
            for (const [key, value] of Object.entries(header.values)) {
                lines.push(`  ${key}: ${value}`);
            }
            lines.push('');
        }
        return lines.join('\n');
    }
    /**
     * Generate _redirects file
     */
    function generateRedirectsFile() {
        const lines = [];
        for (const redirect of redirects) {
            let line = `${redirect.from} ${redirect.to}`;
            if (redirect.status) {
                line += ` ${redirect.status}`;
            }
            if (redirect.force) {
                line += '!';
            }
            lines.push(line);
        }
        return lines.join('\n');
    }
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Get Netlify context in Edge Functions
 */
export function getNetlifyContext() {
    return {
        geo: globalThis.Netlify?.geo,
        ip: globalThis.Netlify?.ip,
        site: globalThis.Netlify?.site,
        account: globalThis.Netlify?.account,
    };
}
/**
 * Create a Netlify Image CDN URL
 *
 * @example
 * ```typescript
 * const imageUrl = netlifyImageCDN('https://example.com/image.jpg', {
 *   width: 800,
 *   format: 'webp',
 * });
 * ```
 */
export function netlifyImageCDN(src, options = {}) {
    const params = new URLSearchParams();
    params.set('url', src);
    if (options.width)
        params.set('w', String(options.width));
    if (options.height)
        params.set('h', String(options.height));
    if (options.fit)
        params.set('fit', options.fit);
    if (options.format)
        params.set('fm', options.format);
    if (options.quality)
        params.set('q', String(options.quality));
    return `/.netlify/images?${params}`;
}
/**
 * Get Netlify Identity user (in serverless functions)
 */
export function getNetlifyIdentityUser(context) {
    const ctx = context;
    return ctx?.clientContext?.user || null;
}
/**
 * Create a Netlify Forms handler
 */
export function createFormsHandler(formName) {
    return {
        async submit(data) {
            const formData = new FormData();
            formData.append('form-name', formName);
            for (const [key, value] of Object.entries(data)) {
                formData.append(key, String(value));
            }
            return fetch('/', {
                method: 'POST',
                body: formData,
            });
        },
    };
}
export default netlifyAdapter;
//# sourceMappingURL=netlify.js.map