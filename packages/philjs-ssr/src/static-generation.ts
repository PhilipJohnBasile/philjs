/**
 * Static Site Generation (SSG) and Incremental Static Regeneration (ISR)
 *
 * Provides:
 * - SSG: Pre-render pages at build time
 * - ISR: Regenerate pages on-demand with revalidation
 * - Mixed rendering: Different modes per route
 */

import type { RouteModule } from "philjs-router";

export type RenderMode = "ssr" | "ssg" | "isr" | "csr";

export type RouteConfig = {
  mode?: RenderMode;
  revalidate?: number; // Seconds (for ISR)
  fallback?: "blocking" | "static" | false; // For ISR with unknown paths
  getStaticPaths?: () => Promise<string[]> | string[];
};

export type StaticPage = {
  path: string;
  html: string;
  data?: any;
  timestamp: number;
  revalidate?: number;
};

export type ISRCache = {
  get(path: string): StaticPage | null;
  set(path: string, page: StaticPage): Promise<void>;
  has(path: string): boolean;
  invalidate(path: string): Promise<void>;
  invalidateAll(): Promise<void>;
};

// ============================================================================
// In-Memory ISR Cache (for development/single server)
// ============================================================================

class MemoryISRCache implements ISRCache {
  private cache = new Map<string, StaticPage>();

  get(path: string): StaticPage | null {
    return this.cache.get(path) || null;
  }

  async set(path: string, page: StaticPage): Promise<void> {
    this.cache.set(path, page);
  }

  has(path: string): boolean {
    return this.cache.has(path);
  }

  async invalidate(path: string): Promise<void> {
    this.cache.delete(path);
  }

  async invalidateAll(): Promise<void> {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// ============================================================================
// Redis ISR Cache (for production/distributed)
// ============================================================================

export class RedisISRCache implements ISRCache {
  constructor(private redisClient: any, private keyPrefix = "philjs:isr:") {}

  get(path: string): StaticPage | null {
    const key = this.keyPrefix + path;
    const cached = this.redisClient.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  async set(path: string, page: StaticPage): Promise<void> {
    const key = this.keyPrefix + path;
    await this.redisClient.set(key, JSON.stringify(page));

    if (page.revalidate) {
      await this.redisClient.expire(key, page.revalidate);
    }
  }

  has(path: string): boolean {
    return this.redisClient.exists(this.keyPrefix + path);
  }

  async invalidate(path: string): Promise<void> {
    await this.redisClient.del(this.keyPrefix + path);
  }

  async invalidateAll(): Promise<void> {
    const keys = await this.redisClient.keys(this.keyPrefix + "*");
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }
  }
}

// ============================================================================
// Static Generation Manager
// ============================================================================

export class StaticGenerator {
  private cache: ISRCache;
  private renderFn: (path: string) => Promise<string>;

  constructor(
    renderFn: (path: string) => Promise<string>,
    cache?: ISRCache
  ) {
    this.renderFn = renderFn;
    this.cache = cache || new MemoryISRCache();
  }

  /**
   * Generate static pages for all routes
   */
  async generateAll(
    routes: Map<string, RouteModule & { config?: RouteConfig }>
  ): Promise<Map<string, StaticPage>> {
    const pages = new Map<string, StaticPage>();

    for (const [path, route] of routes) {
      const config = route.config;

      if (config?.mode === "ssg" || config?.mode === "isr") {
        // Get all paths to generate
        const paths = config.getStaticPaths
          ? await config.getStaticPaths()
          : [path];

        for (const p of paths) {
          const page = await this.generatePage(p, config);
          pages.set(p, page);
        }
      }
    }

    return pages;
  }

  /**
   * Generate a single static page
   */
  async generatePage(
    path: string,
    config?: RouteConfig
  ): Promise<StaticPage> {
    const html = await this.renderFn(path);

    const page: StaticPage = {
      path,
      html,
      timestamp: Date.now(),
      revalidate: config?.revalidate,
    };

    // Cache for ISR
    if (config?.mode === "isr") {
      await this.cache.set(path, page);
    }

    return page;
  }

  /**
   * Handle ISR request
   */
  async handleISR(
    path: string,
    config: RouteConfig
  ): Promise<{ html: string; stale: boolean }> {
    const cached = this.cache.get(path);

    // Cache hit - check if stale
    if (cached) {
      const age = (Date.now() - cached.timestamp) / 1000; // seconds
      const isStale = config.revalidate && age > config.revalidate;

      if (isStale) {
        // Stale-while-revalidate: serve stale, regenerate in background
        this.regenerateInBackground(path, config);
        return { html: cached.html, stale: true };
      }

      return { html: cached.html, stale: false };
    }

    // Cache miss
    if (config.fallback === "blocking") {
      // Block and generate
      const page = await this.generatePage(path, config);
      return { html: page.html, stale: false };
    } else if (config.fallback === "static") {
      // Serve static fallback, regenerate in background
      this.regenerateInBackground(path, config);
      return {
        html: this.getStaticFallback(),
        stale: true,
      };
    } else {
      // No fallback - 404
      throw new Error("Page not found and no fallback configured");
    }
  }

  private async regenerateInBackground(
    path: string,
    config: RouteConfig
  ): Promise<void> {
    // Don't await - run in background
    this.generatePage(path, config).catch((error) => {
      console.error(`Failed to regenerate ${path}:`, error);
    });
  }

  private getStaticFallback(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Loading...</title>
          <style>
            body { display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: system-ui; }
            .spinner { width: 50px; height: 50px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
        </body>
      </html>
    `;
  }

  /**
   * Invalidate cached page
   */
  async invalidate(path: string): Promise<void> {
    await this.cache.invalidate(path);
  }

  /**
   * Invalidate all cached pages
   */
  async invalidateAll(): Promise<void> {
    await this.cache.invalidateAll();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    if (this.cache instanceof MemoryISRCache) {
      return {
        type: "memory",
        size: this.cache.size(),
      };
    }
    return {
      type: "redis",
    };
  }
}

// ============================================================================
// Build-time Static Generation
// ============================================================================

export type BuildConfig = {
  outDir: string;
  routes: Map<string, RouteModule & { config?: RouteConfig }>;
  renderFn: (path: string) => Promise<string>;
};

/**
 * Generate static files at build time
 */
export async function buildStaticSite(config: BuildConfig): Promise<void> {
  const generator = new StaticGenerator(config.renderFn);
  const pages = await generator.generateAll(config.routes);

  // Write pages to disk
  const fs = await import("fs/promises");
  const path = await import("path");

  for (const [route, page] of pages) {
    const filePath = path.join(
      config.outDir,
      route === "/" ? "index.html" : `${route}.html`
    );

    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    // Write HTML
    await fs.writeFile(filePath, page.html, "utf-8");
  }

  console.log(`✓ Generated ${pages.size} static pages`);
}

// ============================================================================
// Route Configuration Helpers
// ============================================================================

export function configureRoute(config: RouteConfig): RouteConfig {
  return config;
}

export function ssg(config?: Omit<RouteConfig, "mode">): RouteConfig {
  return { ...config, mode: "ssg" };
}

export function isr(
  revalidate: number,
  config?: Omit<RouteConfig, "mode" | "revalidate">
): RouteConfig {
  return { ...config, mode: "isr", revalidate };
}

export function ssr(): RouteConfig {
  return { mode: "ssr" };
}

export function csr(): RouteConfig {
  return { mode: "csr" };
}

// ============================================================================
// On-Demand Revalidation
// ============================================================================

export type RevalidationOptions = {
  secret?: string; // Secret token for authentication
  paths?: string[]; // Specific paths to revalidate
  tags?: string[]; // Cache tags to invalidate
};

/**
 * Handle on-demand revalidation request
 */
export async function handleRevalidation(
  request: Request,
  generator: StaticGenerator,
  options: RevalidationOptions = {}
): Promise<Response> {
  // Verify secret if configured
  if (options.secret) {
    const token = request.headers.get("x-revalidation-token");
    if (token !== options.secret) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    if (options.paths) {
      // Invalidate specific paths
      for (const path of options.paths) {
        await generator.invalidate(path);
      }
      return new Response(
        JSON.stringify({ revalidated: true, paths: options.paths }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      // Invalidate all
      await generator.invalidateAll();
      return new Response(JSON.stringify({ revalidated: true, all: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

// ============================================================================
// Middleware for Mixed Rendering
// ============================================================================

export function createRenderingMiddleware(
  routes: Map<string, RouteModule & { config?: RouteConfig }>,
  generator: StaticGenerator
) {
  return async (request: Request): Promise<Response | null> => {
    const url = new URL(request.url);
    const route = routes.get(url.pathname);

    if (!route) return null;

    const config = route.config;

    switch (config?.mode) {
      case "ssg": {
        // Serve pre-generated static page
        const cached = generator["cache"].get(url.pathname);
        if (cached) {
          return new Response(cached.html, {
            headers: { "Content-Type": "text/html" },
          });
        }
        // Fallback to SSR if not found
        break;
      }

      case "isr": {
        // Handle ISR with revalidation
        try {
          const result = await generator.handleISR(url.pathname, config);
          const headers = new Headers({ "Content-Type": "text/html" });

          if (result.stale) {
            headers.set("X-PhilJS-Stale", "true");
          }

          return new Response(result.html, { headers });
        } catch {
          // Fallback to SSR
          break;
        }
      }

      case "csr": {
        // Serve minimal HTML shell for client-side rendering
        return new Response(
          `<!DOCTYPE html><html><head><title>Loading...</title></head><body><div id="root"></div><script type="module" src="/client.js"></script></body></html>`,
          { headers: { "Content-Type": "text/html" } }
        );
      }

      case "ssr":
      default:
        // Continue to SSR
        return null;
    }

    return null;
  };
}
