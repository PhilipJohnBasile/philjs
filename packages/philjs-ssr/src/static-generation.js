/**
 * Static Site Generation (SSG) and Incremental Static Regeneration (ISR)
 *
 * Provides:
 * - SSG: Pre-render pages at build time
 * - ISR: Regenerate pages on-demand with revalidation
 * - Mixed rendering: Different modes per route
 */
// ============================================================================
// In-Memory ISR Cache (for development/single server)
// ============================================================================
class MemoryISRCache {
    cache = new Map();
    get(path) {
        return this.cache.get(path) || null;
    }
    async set(path, page) {
        this.cache.set(path, page);
    }
    has(path) {
        return this.cache.has(path);
    }
    async invalidate(path) {
        this.cache.delete(path);
    }
    async invalidateAll() {
        this.cache.clear();
    }
    size() {
        return this.cache.size;
    }
}
// ============================================================================
// Redis ISR Cache (for production/distributed)
// ============================================================================
export class RedisISRCache {
    redisClient;
    keyPrefix;
    constructor(redisClient, keyPrefix = "philjs:isr:") {
        this.redisClient = redisClient;
        this.keyPrefix = keyPrefix;
    }
    get(path) {
        const key = this.keyPrefix + path;
        const cached = this.redisClient.get(key);
        return cached ? JSON.parse(cached) : null;
    }
    async set(path, page) {
        const key = this.keyPrefix + path;
        await this.redisClient.set(key, JSON.stringify(page));
        if (page.revalidate) {
            await this.redisClient.expire(key, page.revalidate);
        }
    }
    has(path) {
        return this.redisClient.exists(this.keyPrefix + path);
    }
    async invalidate(path) {
        await this.redisClient.del(this.keyPrefix + path);
    }
    async invalidateAll() {
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
    cache;
    renderFn;
    constructor(renderFn, cache) {
        this.renderFn = renderFn;
        this.cache = cache || new MemoryISRCache();
    }
    /**
     * Generate static pages for all routes
     */
    async generateAll(routes) {
        const pages = new Map();
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
    async generatePage(path, config) {
        const html = await this.renderFn(path);
        const page = {
            path,
            html,
            timestamp: Date.now(),
        };
        if (config?.revalidate !== undefined) {
            page.revalidate = config.revalidate;
        }
        // Cache for ISR
        if (config?.mode === "isr") {
            await this.cache.set(path, page);
        }
        return page;
    }
    /**
     * Handle ISR request
     */
    async handleISR(path, config) {
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
        }
        else if (config.fallback === "static") {
            // Serve static fallback, regenerate in background
            this.regenerateInBackground(path, config);
            return {
                html: this.getStaticFallback(),
                stale: true,
            };
        }
        else {
            // No fallback - 404
            throw new Error("Page not found and no fallback configured");
        }
    }
    async regenerateInBackground(path, config) {
        // Don't await - run in background
        this.generatePage(path, config).catch((error) => {
            console.error(`Failed to regenerate ${path}:`, error);
        });
    }
    getStaticFallback() {
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
    async invalidate(path) {
        await this.cache.invalidate(path);
    }
    /**
     * Invalidate all cached pages
     */
    async invalidateAll() {
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
/**
 * Generate static files at build time
 */
export async function buildStaticSite(config) {
    const generator = new StaticGenerator(config.renderFn);
    const pages = await generator.generateAll(config.routes);
    // Write pages to disk
    const fs = await import("fs/promises");
    const path = await import("path");
    for (const [route, page] of pages) {
        const filePath = path.join(config.outDir, route === "/" ? "index.html" : `${route}.html`);
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
export function configureRoute(config) {
    return config;
}
export function ssg(config) {
    return { ...config, mode: "ssg" };
}
export function isr(revalidate, config) {
    return { ...config, mode: "isr", revalidate };
}
export function ssr() {
    return { mode: "ssr" };
}
export function csr() {
    return { mode: "csr" };
}
/**
 * Handle on-demand revalidation request
 */
export async function handleRevalidation(request, generator, options = {}) {
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
            return new Response(JSON.stringify({ revalidated: true, paths: options.paths }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        else {
            // Invalidate all
            await generator.invalidateAll();
            return new Response(JSON.stringify({ revalidated: true, all: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        }
    }
    catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
}
// ============================================================================
// Middleware for Mixed Rendering
// ============================================================================
export function createRenderingMiddleware(routes, generator) {
    return async (request) => {
        const url = new URL(request.url);
        const route = routes.get(url.pathname);
        if (!route)
            return null;
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
                }
                catch {
                    // Fallback to SSR
                    break;
                }
            }
            case "csr": {
                // Serve minimal HTML shell for client-side rendering
                return new Response(`<!DOCTYPE html><html><head><title>Loading...</title></head><body><div id="root"></div><script type="module" src="/client.js"></script></body></html>`, { headers: { "Content-Type": "text/html" } });
            }
            case "ssr":
            default:
                // Continue to SSR
                return null;
        }
        return null;
    };
}
//# sourceMappingURL=static-generation.js.map