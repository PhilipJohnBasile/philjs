/**
 * PhilJS Cloudflare Adapter
 *
 * Production-ready deployment adapter for Cloudflare with:
 * - Workers support
 * - Pages deployment
 * - KV storage integration
 * - D1 database integration
 * - Durable Objects support
 * - R2 object storage
 * - Queues integration
 * - wrangler.toml generation
 *
 * @module philjs-adapters/adapters/cloudflare
 */

import { writeFileSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join } from 'path';
import type { Adapter, AdapterConfig, EdgeAdapter, RequestContext } from '../types';
import { createBuildManifest, copyStaticAssets } from '../utils/build';
import { injectEnvVariables, loadEnvFile } from '../utils/env';

/**
 * Configuration options for the Cloudflare adapter
 */
export interface CloudflareAdapterConfig extends AdapterConfig {
  /** Deployment mode: 'workers' for Workers, 'pages' for Pages */
  mode?: 'workers' | 'pages';

  /** Account ID (for programmatic deployment) */
  accountId?: string;

  /** Worker/Pages project name */
  projectName?: string;

  /** Compatibility date */
  compatibilityDate?: string;

  /** Compatibility flags */
  compatibilityFlags?: string[];

  /** KV namespace bindings */
  kv?: KVNamespaceBinding[];

  /** D1 database bindings */
  d1?: D1DatabaseBinding[];

  /** Durable Objects bindings */
  durableObjects?: DurableObjectBinding[];

  /** R2 bucket bindings */
  r2?: R2BucketBinding[];

  /** Queue bindings */
  queues?: QueueBinding[];

  /** Service bindings */
  services?: ServiceBinding[];

  /** Analytics Engine bindings */
  analyticsEngine?: AnalyticsEngineBinding[];

  /** Environment variables */
  vars?: Record<string, string>;

  /** Secrets (names only - values set via wrangler) */
  secrets?: string[];

  /** Routes for Workers (not Pages) */
  routes?: RouteConfig[];

  /** Custom domains */
  customDomains?: string[];

  /** Workers Sites configuration (legacy) */
  site?: SiteConfig;

  /** Usage model: 'bundled' or 'unbound' */
  usageModel?: 'bundled' | 'unbound';

  /** Enable Cron Triggers */
  triggers?: CronTrigger[];

  /** Enable Smart Placement */
  placement?: PlacementConfig;

  /** Node.js compatibility mode */
  nodeCompat?: boolean;

  /** Generate wrangler.toml */
  generateConfig?: boolean;

  /** Build configuration */
  build?: BuildConfig;

  /** Development configuration */
  dev?: DevConfig;
}

/**
 * KV namespace binding configuration
 */
export interface KVNamespaceBinding {
  /** Binding name to use in code */
  binding: string;
  /** KV namespace ID */
  id: string;
  /** Preview namespace ID (for local dev) */
  previewId?: string;
}

/**
 * D1 database binding configuration
 */
export interface D1DatabaseBinding {
  /** Binding name to use in code */
  binding: string;
  /** D1 database ID */
  databaseId: string;
  /** Database name */
  databaseName: string;
  /** Enable migrations */
  migrationsDir?: string;
}

/**
 * Durable Object binding configuration
 */
export interface DurableObjectBinding {
  /** Binding name to use in code */
  binding: string;
  /** Durable Object class name */
  className: string;
  /** Script name (for external DO) */
  scriptName?: string;
  /** Environment (for external DO) */
  environment?: string;
}

/**
 * R2 bucket binding configuration
 */
export interface R2BucketBinding {
  /** Binding name to use in code */
  binding: string;
  /** R2 bucket name */
  bucketName: string;
  /** Preview bucket name */
  previewBucketName?: string;
  /** Jurisdiction */
  jurisdiction?: string;
}

/**
 * Queue binding configuration
 */
export interface QueueBinding {
  /** Binding name to use in code */
  binding: string;
  /** Queue name */
  queue: string;
  /** Delivery delay in seconds */
  deliveryDelay?: number;
}

/**
 * Service binding configuration
 */
export interface ServiceBinding {
  /** Binding name to use in code */
  binding: string;
  /** Service name */
  service: string;
  /** Environment */
  environment?: string;
}

/**
 * Analytics Engine binding
 */
export interface AnalyticsEngineBinding {
  /** Binding name to use in code */
  binding: string;
  /** Dataset name */
  dataset: string;
}

/**
 * Route configuration for Workers
 */
export interface RouteConfig {
  /** Route pattern */
  pattern: string;
  /** Zone ID (optional) */
  zoneId?: string;
  /** Zone name (optional) */
  zoneName?: string;
  /** Custom domain */
  customDomain?: boolean;
}

/**
 * Workers Sites configuration
 */
export interface SiteConfig {
  /** Bucket path for static assets */
  bucket: string;
  /** Include patterns */
  include?: string[];
  /** Exclude patterns */
  exclude?: string[];
}

/**
 * Cron trigger configuration
 */
export interface CronTrigger {
  /** Cron expression */
  cron: string;
}

/**
 * Smart Placement configuration
 */
export interface PlacementConfig {
  /** Placement mode */
  mode: 'smart';
}

/**
 * Build configuration
 */
export interface BuildConfig {
  /** Build command */
  command?: string;
  /** Watch directories */
  watch?: string[];
  /** Upload rules */
  upload?: {
    include?: string[];
    exclude?: string[];
  };
}

/**
 * Development configuration
 */
export interface DevConfig {
  /** Local port */
  port?: number;
  /** Local host */
  host?: string;
  /** Inspector port */
  inspectorPort?: number;
  /** Local protocol */
  localProtocol?: 'http' | 'https';
}

/**
 * Create a Cloudflare deployment adapter
 *
 * @example
 * ```typescript
 * import { cloudflareAdapter } from 'philjs-adapters/adapters/cloudflare';
 *
 * export default defineConfig({
 *   adapter: cloudflareAdapter({
 *     mode: 'pages',
 *     d1: [{
 *       binding: 'DB',
 *       databaseId: 'xxxx-xxxx-xxxx',
 *       databaseName: 'my-database',
 *     }],
 *     kv: [{
 *       binding: 'CACHE',
 *       id: 'xxxx-xxxx-xxxx',
 *     }],
 *   }),
 * });
 * ```
 */
export function cloudflareAdapter(config: CloudflareAdapterConfig = {}): Adapter & EdgeAdapter {
  const {
    outDir = '.cloudflare',
    mode = 'pages',
    projectName = 'philjs-app',
    compatibilityDate = new Date().toISOString().split('T')[0],
    compatibilityFlags = [],
    kv = [],
    d1 = [],
    durableObjects = [],
    r2 = [],
    queues = [],
    services = [],
    analyticsEngine = [],
    vars = {},
    secrets = [],
    routes = [],
    customDomains = [],
    site,
    usageModel,
    triggers = [],
    placement,
    nodeCompat = false,
    generateConfig = true,
    build,
    dev,
  } = config;

  return {
    name: 'cloudflare',
    edge: true,
    edgeConfig: {
      regions: ['global'],
    },

    async adapt() {
      console.log(`Building for Cloudflare ${mode}...`);

      // Create output structure
      mkdirSync(outDir, { recursive: true });

      if (mode === 'pages') {
        await adaptForPages();
      } else {
        await adaptForWorkers();
      }

      // Generate wrangler.toml
      if (generateConfig) {
        const wranglerToml = generateWranglerToml();
        writeFileSync(
          join(outDir, 'wrangler.toml'),
          wranglerToml
        );
      }

      // Generate build manifest
      const manifest = await createBuildManifest({
        adapter: 'cloudflare',
        outputDir: outDir,
        routes: [],
      });
      writeFileSync(
        join(outDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      console.log(`Cloudflare build complete: ${outDir}`);
    },

    getHandler() {
      return async (request: Request, env?: unknown): Promise<Response> => {
        const url = new URL(request.url);

        const requestContext: RequestContext = {
          url,
          method: request.method,
          headers: request.headers,
          body: request.body,
          params: {},
          platform: {
            name: 'cloudflare',
            edge: true,
            env,
            ctx: (globalThis as any).ctx,
            mode,
          },
        };

        const { handleRequest } = await import('@philjs/ssr');
        return handleRequest(requestContext);
      };
    },
  };

  /**
   * Generate build for Cloudflare Pages
   */
  async function adaptForPages(): Promise<void> {
    mkdirSync(join(outDir, 'functions'), { recursive: true });

    // Generate _worker.js for Pages
    writeFileSync(
      join(outDir, '_worker.js'),
      generatePagesWorker()
    );

    // Generate _routes.json for static asset handling
    writeFileSync(
      join(outDir, '_routes.json'),
      JSON.stringify({
        version: 1,
        include: ['/*'],
        exclude: [
          '/static/*',
          '/assets/*',
          '/_philjs/*',
          '/favicon.ico',
          '/robots.txt',
          '/sitemap.xml',
        ],
      }, null, 2)
    );

    // Generate _headers file
    writeFileSync(
      join(outDir, '_headers'),
      generateHeadersFile()
    );

    // Generate _redirects file if there are redirects
    // (handled in wrangler.toml for Pages Functions)

    // Copy static assets
    await copyStaticAssets(config.static?.assets || 'public', outDir);

    // Copy prerendered pages
    if (existsSync('.philjs/prerendered')) {
      cpSync('.philjs/prerendered', outDir, { recursive: true });
    }
  }

  /**
   * Generate build for Cloudflare Workers
   */
  async function adaptForWorkers(): Promise<void> {
    // Generate worker.js
    writeFileSync(
      join(outDir, 'worker.js'),
      generateWorkerScript()
    );

    // If using Workers Sites, set up the assets
    if (site) {
      mkdirSync(join(outDir, site.bucket), { recursive: true });
      await copyStaticAssets(config.static?.assets || 'public', join(outDir, site.bucket));

      if (existsSync('.philjs/prerendered')) {
        cpSync('.philjs/prerendered', join(outDir, site.bucket), { recursive: true });
      }
    }
  }

  /**
   * Generate Cloudflare Pages worker code
   */
  function generatePagesWorker(): string {
    return `// PhilJS Cloudflare Pages Worker
// Generated by PhilJS Adapters

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Check for static assets first
    const staticPatterns = ['/static/', '/assets/', '/_philjs/', '.ico', '.txt', '.xml'];
    if (staticPatterns.some(p => url.pathname.includes(p) || url.pathname.endsWith(p.slice(1)))) {
      return env.ASSETS.fetch(request);
    }

    const { handleRequest } = await import('@philjs/ssr');

    const context = {
      url,
      method: request.method,
      headers: request.headers,
      body: request.body,
      params: {},
      platform: {
        name: 'cloudflare',
        edge: true,
        mode: 'pages',
        env,
        ctx,
        waitUntil: ctx.waitUntil.bind(ctx),
        passThroughOnException: ctx.passThroughOnException?.bind(ctx),
        // Bindings
        ${kv.length > 0 ? `kv: { ${kv.map(k => `${k.binding}: env.${k.binding}`).join(', ')} },` : ''}
        ${d1.length > 0 ? `d1: { ${d1.map(d => `${d.binding}: env.${d.binding}`).join(', ')} },` : ''}
        ${r2.length > 0 ? `r2: { ${r2.map(r => `${r.binding}: env.${r.binding}`).join(', ')} },` : ''}
        ${durableObjects.length > 0 ? `durableObjects: { ${durableObjects.map(d => `${d.binding}: env.${d.binding}`).join(', ')} },` : ''}
        ${queues.length > 0 ? `queues: { ${queues.map(q => `${q.binding}: env.${q.binding}`).join(', ')} },` : ''}
      },
    };

    try {
      return await handleRequest(context);
    } catch (error) {
      console.error('Request failed:', error);

      // In development, show error details
      if (env.CF_PAGES_URL?.includes('localhost') || env.CF_PAGES_BRANCH) {
        return new Response(
          JSON.stringify({
            error: 'Internal Server Error',
            message: error.message,
            stack: error.stack,
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response('Internal Server Error', { status: 500 });
    }
  },

  ${queues.length > 0 ? `
  // Queue consumer
  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      try {
        // Process message
        console.log('Processing queue message:', message.id);
        message.ack();
      } catch (error) {
        console.error('Queue processing error:', error);
        message.retry();
      }
    }
  },
  ` : ''}

  ${triggers.length > 0 ? `
  // Scheduled handler
  async scheduled(event, env, ctx) {
    console.log('Scheduled event:', event.cron);
    // Handle scheduled tasks
  },
  ` : ''}
};

${durableObjects.map(d => `
// Durable Object: ${d.className}
export class ${d.className} {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    // Handle Durable Object request
    return new Response('Durable Object OK');
  }
}
`).join('\n')}
`;
  }

  /**
   * Generate Cloudflare Workers script
   */
  function generateWorkerScript(): string {
    const sitesImport = site
      ? `import { getAssetFromKV } from '@cloudflare/kv-asset-handler';`
      : '';

    const sitesHandler = site
      ? `
    // Try to serve static asset first
    try {
      return await getAssetFromKV(event, {
        cacheControl: {
          browserTTL: 31536000,
          edgeTTL: 31536000,
          bypassCache: false,
        },
      });
    } catch (e) {
      if (e.status !== 404) {
        return new Response('Error loading asset', { status: 500 });
      }
      // Not a static asset, continue to SSR
    }
`
      : '';

    return `// PhilJS Cloudflare Workers Handler
// Generated by PhilJS Adapters
${sitesImport}

export default {
  async fetch(request, env, ctx) {
    const event = { request, env, ctx };
    ${sitesHandler}

    const { handleRequest } = await import('@philjs/ssr');

    const url = new URL(request.url);

    const context = {
      url,
      method: request.method,
      headers: request.headers,
      body: request.body,
      params: {},
      platform: {
        name: 'cloudflare',
        edge: true,
        mode: 'workers',
        env,
        ctx,
        waitUntil: ctx.waitUntil.bind(ctx),
        // Bindings
        ${kv.length > 0 ? `kv: { ${kv.map(k => `${k.binding}: env.${k.binding}`).join(', ')} },` : ''}
        ${d1.length > 0 ? `d1: { ${d1.map(d => `${d.binding}: env.${d.binding}`).join(', ')} },` : ''}
        ${r2.length > 0 ? `r2: { ${r2.map(r => `${r.binding}: env.${r.binding}`).join(', ')} },` : ''}
        ${durableObjects.length > 0 ? `durableObjects: { ${durableObjects.map(d => `${d.binding}: env.${d.binding}`).join(', ')} },` : ''}
      },
    };

    try {
      return await handleRequest(context);
    } catch (error) {
      console.error('Request failed:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },

  ${triggers.length > 0 ? `
  async scheduled(event, env, ctx) {
    console.log('Scheduled event:', event.cron);
  },
  ` : ''}
};
`;
  }

  /**
   * Generate wrangler.toml configuration
   */
  function generateWranglerToml(): string {
    const lines: string[] = [
      `# PhilJS Cloudflare Configuration`,
      `# Generated by PhilJS Adapters`,
      ``,
      `name = "${projectName}"`,
      `compatibility_date = "${compatibilityDate}"`,
    ];

    // Compatibility flags
    if (compatibilityFlags.length > 0 || nodeCompat) {
      const flags = [...compatibilityFlags];
      if (nodeCompat) {
        flags.push('nodejs_compat');
      }
      lines.push(`compatibility_flags = [${flags.map(f => `"${f}"`).join(', ')}]`);
    }

    // Mode-specific configuration
    if (mode === 'workers') {
      lines.push(`main = "worker.js"`);

      if (usageModel) {
        lines.push(`usage_model = "${usageModel}"`);
      }

      // Routes
      if (routes.length > 0) {
        lines.push(``, `# Routes`);
        for (const route of routes) {
          if (route.customDomain) {
            lines.push(`[[routes]]`);
            lines.push(`pattern = "${route.pattern}"`);
            lines.push(`custom_domain = true`);
          } else if (route.zoneId) {
            lines.push(`[[routes]]`);
            lines.push(`pattern = "${route.pattern}"`);
            lines.push(`zone_id = "${route.zoneId}"`);
          } else if (route.zoneName) {
            lines.push(`[[routes]]`);
            lines.push(`pattern = "${route.pattern}"`);
            lines.push(`zone_name = "${route.zoneName}"`);
          }
        }
      }

      // Workers Sites
      if (site) {
        lines.push(``, `[site]`);
        lines.push(`bucket = "${site.bucket}"`);
        if (site.include) {
          lines.push(`include = [${site.include.map(i => `"${i}"`).join(', ')}]`);
        }
        if (site.exclude) {
          lines.push(`exclude = [${site.exclude.map(e => `"${e}"`).join(', ')}]`);
        }
      }
    }

    // Custom domains
    if (customDomains.length > 0) {
      lines.push(``, `# Custom Domains`);
      for (const domain of customDomains) {
        lines.push(`[[custom_domains]]`);
        lines.push(`hostname = "${domain}"`);
      }
    }

    // KV Namespaces
    if (kv.length > 0) {
      lines.push(``, `# KV Namespaces`);
      for (const binding of kv) {
        lines.push(`[[kv_namespaces]]`);
        lines.push(`binding = "${binding.binding}"`);
        lines.push(`id = "${binding.id}"`);
        if (binding.previewId) {
          lines.push(`preview_id = "${binding.previewId}"`);
        }
      }
    }

    // D1 Databases
    if (d1.length > 0) {
      lines.push(``, `# D1 Databases`);
      for (const binding of d1) {
        lines.push(`[[d1_databases]]`);
        lines.push(`binding = "${binding.binding}"`);
        lines.push(`database_id = "${binding.databaseId}"`);
        lines.push(`database_name = "${binding.databaseName}"`);
        if (binding.migrationsDir) {
          lines.push(`migrations_dir = "${binding.migrationsDir}"`);
        }
      }
    }

    // Durable Objects
    if (durableObjects.length > 0) {
      lines.push(``, `# Durable Objects`);
      lines.push(`[durable_objects]`);
      lines.push(`bindings = [`);
      for (const binding of durableObjects) {
        if (binding.scriptName) {
          lines.push(`  { name = "${binding.binding}", class_name = "${binding.className}", script_name = "${binding.scriptName}"${binding.environment ? `, environment = "${binding.environment}"` : ''} },`);
        } else {
          lines.push(`  { name = "${binding.binding}", class_name = "${binding.className}" },`);
        }
      }
      lines.push(`]`);

      // Durable Object migrations
      lines.push(``, `[[migrations]]`);
      lines.push(`tag = "v1"`);
      lines.push(`new_classes = [${durableObjects.filter(d => !d.scriptName).map(d => `"${d.className}"`).join(', ')}]`);
    }

    // R2 Buckets
    if (r2.length > 0) {
      lines.push(``, `# R2 Buckets`);
      for (const binding of r2) {
        lines.push(`[[r2_buckets]]`);
        lines.push(`binding = "${binding.binding}"`);
        lines.push(`bucket_name = "${binding.bucketName}"`);
        if (binding.previewBucketName) {
          lines.push(`preview_bucket_name = "${binding.previewBucketName}"`);
        }
        if (binding.jurisdiction) {
          lines.push(`jurisdiction = "${binding.jurisdiction}"`);
        }
      }
    }

    // Queues
    if (queues.length > 0) {
      lines.push(``, `# Queues`);
      lines.push(`[[queues.producers]]`);
      for (const binding of queues) {
        lines.push(`binding = "${binding.binding}"`);
        lines.push(`queue = "${binding.queue}"`);
        if (binding.deliveryDelay) {
          lines.push(`delivery_delay = ${binding.deliveryDelay}`);
        }
      }
      lines.push(``, `[[queues.consumers]]`);
      lines.push(`queue = "${queues[0].queue}"`);
      lines.push(`max_batch_size = 10`);
      lines.push(`max_batch_timeout = 30`);
    }

    // Service Bindings
    if (services.length > 0) {
      lines.push(``, `# Service Bindings`);
      for (const binding of services) {
        lines.push(`[[services]]`);
        lines.push(`binding = "${binding.binding}"`);
        lines.push(`service = "${binding.service}"`);
        if (binding.environment) {
          lines.push(`environment = "${binding.environment}"`);
        }
      }
    }

    // Analytics Engine
    if (analyticsEngine.length > 0) {
      lines.push(``, `# Analytics Engine`);
      for (const binding of analyticsEngine) {
        lines.push(`[[analytics_engine_datasets]]`);
        lines.push(`binding = "${binding.binding}"`);
        lines.push(`dataset = "${binding.dataset}"`);
      }
    }

    // Environment Variables
    if (Object.keys(vars).length > 0) {
      lines.push(``, `# Environment Variables`);
      lines.push(`[vars]`);
      for (const [key, value] of Object.entries(vars)) {
        lines.push(`${key} = "${value}"`);
      }
    }

    // Cron Triggers
    if (triggers.length > 0) {
      lines.push(``, `# Cron Triggers`);
      lines.push(`[triggers]`);
      lines.push(`crons = [${triggers.map(t => `"${t.cron}"`).join(', ')}]`);
    }

    // Smart Placement
    if (placement) {
      lines.push(``, `# Smart Placement`);
      lines.push(`[placement]`);
      lines.push(`mode = "${placement.mode}"`);
    }

    // Build configuration
    if (build) {
      lines.push(``, `# Build Configuration`);
      lines.push(`[build]`);
      if (build.command) {
        lines.push(`command = "${build.command}"`);
      }
      if (build.watch) {
        lines.push(`watch_dir = "${build.watch[0]}"`);
      }
    }

    // Development configuration
    if (dev) {
      lines.push(``, `# Development Configuration`);
      lines.push(`[dev]`);
      if (dev.port) lines.push(`port = ${dev.port}`);
      if (dev.host) lines.push(`host = "${dev.host}"`);
      if (dev.localProtocol) lines.push(`local_protocol = "${dev.localProtocol}"`);
      if (dev.inspectorPort) lines.push(`inspector_port = ${dev.inspectorPort}`);
    }

    return lines.join('\n');
  }

  /**
   * Generate _headers file for Pages
   */
  function generateHeadersFile(): string {
    return `/static/*
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
`;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get Cloudflare environment bindings
 */
export function getCloudflareEnv<T = unknown>(): T {
  return (globalThis as any).__CLOUDFLARE_ENV__ || (globalThis as any).env;
}

/**
 * Get the execution context
 */
export function getExecutionContext(): {
  waitUntil: (promise: Promise<unknown>) => void;
  passThroughOnException: () => void;
} | undefined {
  return (globalThis as any).__CLOUDFLARE_CTX__ || (globalThis as any).ctx;
}

/**
 * Execute a promise in the background
 */
export function waitUntil(promise: Promise<unknown>): void {
  const ctx = getExecutionContext();
  if (ctx?.waitUntil) {
    ctx.waitUntil(promise);
  }
}

/**
 * Create a KV helper with type safety
 */
export function createKVHelper<T = unknown>(namespace: KVNamespace): KVHelper<T> {
  return {
    async get(key: string): Promise<T | null> {
      return namespace.get(key, 'json');
    },

    async getText(key: string): Promise<string | null> {
      return namespace.get(key, 'text');
    },

    async getWithMetadata(key: string): Promise<{ value: T | null; metadata: unknown }> {
      return namespace.getWithMetadata(key, 'json');
    },

    async put(key: string, value: T, options?: KVPutOptions): Promise<void> {
      await namespace.put(key, JSON.stringify(value), options);
    },

    async delete(key: string): Promise<void> {
      await namespace.delete(key);
    },

    async list(options?: KVListOptions): Promise<KVListResult> {
      return namespace.list(options);
    },
  };
}

/**
 * Create a D1 helper with type safety
 */
export function createD1Helper(database: D1Database): D1Helper {
  return {
    async query<T = unknown>(sql: string, ...params: unknown[]): Promise<T[]> {
      const result = await database.prepare(sql).bind(...params).all<T>();
      return result.results;
    },

    async queryFirst<T = unknown>(sql: string, ...params: unknown[]): Promise<T | null> {
      return database.prepare(sql).bind(...params).first<T>();
    },

    async run(sql: string, ...params: unknown[]): Promise<D1RunResult> {
      return database.prepare(sql).bind(...params).run();
    },

    async batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]> {
      return database.batch(statements);
    },

    prepare(sql: string): D1PreparedStatement {
      return database.prepare(sql);
    },
  };
}

/**
 * Create an R2 helper with type safety
 */
export function createR2Helper(bucket: R2Bucket): R2Helper {
  return {
    async get(key: string): Promise<R2ObjectBody | null> {
      return bucket.get(key);
    },

    async put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object> {
      return bucket.put(key, value, options);
    },

    async delete(key: string): Promise<void> {
      await bucket.delete(key);
    },

    async list(options?: R2ListOptions): Promise<R2Objects> {
      return bucket.list(options);
    },

    async head(key: string): Promise<R2Object | null> {
      return bucket.head(key);
    },
  };
}

/**
 * Get a Durable Object stub
 */
export function getDurableObject<T = unknown>(
  namespace: DurableObjectNamespace,
  id: string | DurableObjectId
): DurableObjectStub {
  const objectId = typeof id === 'string' ? namespace.idFromName(id) : id;
  return namespace.get(objectId);
}

// ============================================================================
// Type Definitions
// ============================================================================

interface KVNamespace {
  get(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<any>;
  getWithMetadata(key: string, type?: 'text' | 'json' | 'arrayBuffer' | 'stream'): Promise<any>;
  put(key: string, value: string | ArrayBuffer | ReadableStream, options?: KVPutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: KVListOptions): Promise<KVListResult>;
}

interface KVPutOptions {
  expiration?: number;
  expirationTtl?: number;
  metadata?: Record<string, unknown>;
}

interface KVListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
}

interface KVListResult {
  keys: Array<{ name: string; expiration?: number; metadata?: unknown }>;
  list_complete: boolean;
  cursor?: string;
}

interface KVHelper<T> {
  get(key: string): Promise<T | null>;
  getText(key: string): Promise<string | null>;
  getWithMetadata(key: string): Promise<{ value: T | null; metadata: unknown }>;
  put(key: string, value: T, options?: KVPutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: KVListOptions): Promise<KVListResult>;
}

interface D1Database {
  prepare(sql: string): D1PreparedStatement;
  batch<T>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

interface D1PreparedStatement {
  bind(...params: unknown[]): D1PreparedStatement;
  first<T>(column?: string): Promise<T | null>;
  all<T>(): Promise<D1Result<T>>;
  run(): Promise<D1RunResult>;
}

interface D1Result<T> {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

interface D1RunResult {
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
    duration: number;
  };
}

interface D1Helper {
  query<T = unknown>(sql: string, ...params: unknown[]): Promise<T[]>;
  queryFirst<T = unknown>(sql: string, ...params: unknown[]): Promise<T | null>;
  run(sql: string, ...params: unknown[]): Promise<D1RunResult>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  prepare(sql: string): D1PreparedStatement;
}

interface R2Bucket {
  get(key: string): Promise<R2ObjectBody | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object>;
  delete(key: string): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
  head(key: string): Promise<R2Object | null>;
}

interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpEtag: string;
  uploaded: Date;
  httpMetadata?: Record<string, string>;
  customMetadata?: Record<string, string>;
}

interface R2ObjectBody extends R2Object {
  body: ReadableStream;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  json<T>(): Promise<T>;
}

interface R2PutOptions {
  httpMetadata?: Record<string, string>;
  customMetadata?: Record<string, string>;
  md5?: string;
}

interface R2ListOptions {
  prefix?: string;
  limit?: number;
  cursor?: string;
  delimiter?: string;
  include?: ('httpMetadata' | 'customMetadata')[];
}

interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
  delimitedPrefixes: string[];
}

interface R2Helper {
  get(key: string): Promise<R2ObjectBody | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object>;
  delete(key: string): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
  head(key: string): Promise<R2Object | null>;
}

interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  idFromString(id: string): DurableObjectId;
  newUniqueId(): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

interface DurableObjectId {
  toString(): string;
}

interface DurableObjectStub {
  fetch(request: Request | string, init?: RequestInit): Promise<Response>;
}

export default cloudflareAdapter;
