/**
 * PPR Build-Time Prerendering
 *
 * Handles the generation of static shells at build time, including:
 * - Parallel route processing
 * - Manifest generation
 * - Asset extraction and optimization
 * - Cache warming
 */

import type { VNode } from "@philjs/core";
import type {
  PPRBuildConfig,
  PPRBuildResult,
  PPRBuildError,
  PPRManifest,
  PPRRouteEntry,
  StaticShell,
  PPRCache,
} from "./ppr-types.js";
import { renderToStaticShell } from "./ppr.js";

// ============================================================================
// PPR Build Version
// ============================================================================

export const PPR_VERSION = "1.0.0";

// ============================================================================
// PPR Builder
// ============================================================================

/**
 * Builder for PPR static shells
 */
export class PPRBuilder {
  private config: Required<PPRBuildConfig>;
  private shells: Map<string, StaticShell> = new Map();
  private errors: PPRBuildError[] = [];
  private startTime = 0;

  constructor(config: PPRBuildConfig) {
    this.config = {
      outDir: config.outDir,
      routes: config.routes,
      renderFn: config.renderFn,
      cache: config.cache || new MemoryPPRCache(),
      sourceMaps: config.sourceMaps ?? false,
      baseUrl: config.baseUrl || "",
      concurrency: config.concurrency || 4,
    };
  }

  /**
   * Build all PPR routes
   */
  async build(): Promise<PPRBuildResult> {
    this.startTime = performance.now();
    this.shells.clear();
    this.errors = [];

    console.log(`[PPR] Building ${this.config.routes.length} routes...`);

    // Expand dynamic routes
    const expandedRoutes = await this.expandDynamicRoutes();
    console.log(`[PPR] Expanded to ${expandedRoutes.length} paths`);

    // Process routes with concurrency
    await this.processRoutesConcurrently(expandedRoutes);

    // Generate manifest
    const manifest = this.generateManifest();

    // Write output files
    await this.writeOutput(manifest);

    const duration = performance.now() - this.startTime;

    console.log(
      `[PPR] Build complete: ${this.shells.size} shells, ${this.errors.length} errors, ${Math.round(duration)}ms`
    );

    return {
      shells: this.shells,
      duration,
      errors: this.errors,
      manifest,
    };
  }

  /**
   * Expand dynamic routes (e.g., /blog/[slug]) to concrete paths
   */
  private async expandDynamicRoutes(): Promise<
    Array<{ path: string; entry: PPRRouteEntry }>
  > {
    const expanded: Array<{ path: string; entry: PPRRouteEntry }> = [];

    for (const entry of this.config.routes) {
      if (entry.getStaticPaths) {
        try {
          const paths = await entry.getStaticPaths();
          for (const path of paths) {
            expanded.push({ path, entry });
          }
        } catch (error) {
          const buildError: PPRBuildError = {
            path: entry.path,
            message: `Failed to get static paths: ${error instanceof Error ? error.message : String(error)}`,
          };
          if (error instanceof Error && error.stack) {
            buildError.stack = error.stack;
          }
          this.errors.push(buildError);
        }
      } else {
        expanded.push({ path: entry.path, entry });
      }
    }

    return expanded;
  }

  /**
   * Process routes with controlled concurrency
   */
  private async processRoutesConcurrently(
    routes: Array<{ path: string; entry: PPRRouteEntry }>
  ): Promise<void> {
    const queue = [...routes];
    const inFlight: Promise<void>[] = [];

    while (queue.length > 0 || inFlight.length > 0) {
      // Fill up to concurrency limit
      while (queue.length > 0 && inFlight.length < this.config.concurrency) {
        const { path, entry } = queue.shift()!;
        const promise = this.processRoute(path, entry).then(() => {
          // Remove from inFlight when done
          const index = inFlight.indexOf(promise);
          if (index !== -1) inFlight.splice(index, 1);
        });
        inFlight.push(promise);
      }

      // Wait for at least one to complete
      if (inFlight.length > 0) {
        await Promise.race(inFlight);
      }
    }
  }

  /**
   * Process a single route
   */
  private async processRoute(
    path: string,
    entry: PPRRouteEntry
  ): Promise<void> {
    try {
      console.log(`[PPR] Building: ${path}`);

      // Render component to VNode
      const vnode = await this.renderComponent(entry.component, path);

      // Generate static shell
      const shell = await renderToStaticShell(vnode, path, entry.config);

      this.shells.set(path, shell);

      // Store in cache
      await this.config.cache.set(path, shell);

      console.log(
        `[PPR] Built: ${path} (${shell.boundaries.size} dynamic boundaries)`
      );
    } catch (error) {
      const buildError: PPRBuildError = {
        path,
        message: error instanceof Error ? error.message : String(error),
      };
      if (error instanceof Error && error.stack) {
        buildError.stack = error.stack;
      }
      this.errors.push(buildError);
      console.error(`[PPR] Error building ${path}:`, error);
    }
  }

  /**
   * Render a component to VNode
   */
  private async renderComponent(
    Component: (props: any) => VNode,
    path: string
  ): Promise<VNode> {
    // Extract route params from path
    const params = this.extractParams(path);

    // Call component with props
    return await Component({ params, path });
  }

  /**
   * Extract params from path
   */
  private extractParams(path: string): Record<string, string> {
    // Simple param extraction - in real impl would use router
    const params: Record<string, string> = {};
    const parts = path.split("/");

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      if (part.startsWith("[") && part.endsWith("]")) {
        const paramName = part.slice(1, -1);
        params[paramName] = parts[i] || "";
      }
    }

    return params;
  }

  /**
   * Generate build manifest
   */
  private generateManifest(): PPRManifest {
    const routes: PPRManifest["routes"] = {};

    for (const [path, shell] of this.shells) {
      routes[path] = {
        shellFile: this.getShellFilePath(path),
        boundaryCount: shell.boundaries.size,
        contentHash: shell.contentHash,
      };
    }

    return {
      buildTime: Date.now(),
      version: PPR_VERSION,
      routes,
    };
  }

  /**
   * Get output file path for a shell
   */
  private getShellFilePath(path: string): string {
    const normalized = path === "/" ? "/index" : path;
    return `${normalized}.shell.html`;
  }

  /**
   * Write output files to disk
   */
  private async writeOutput(manifest: PPRManifest): Promise<void> {
    // Dynamic import for Node.js fs
    const fs = await import("fs/promises");
    const pathModule = await import("path");

    // Ensure output directory exists
    await fs.mkdir(this.config.outDir, { recursive: true });

    // Write shells
    for (const [path, shell] of this.shells) {
      const filePath = pathModule.join(
        this.config.outDir,
        this.getShellFilePath(path)
      );

      // Ensure parent directory exists
      await fs.mkdir(pathModule.dirname(filePath), { recursive: true });

      // Write shell HTML
      await fs.writeFile(filePath, shell.html, "utf-8");

      // Write shell metadata
      const metadataPath = filePath.replace(".shell.html", ".shell.json");
      await fs.writeFile(
        metadataPath,
        JSON.stringify(
          {
            path: shell.path,
            buildTime: shell.buildTime,
            contentHash: shell.contentHash,
            boundaries: Array.from(shell.boundaries.entries()),
            assets: shell.assets,
          },
          null,
          2
        ),
        "utf-8"
      );
    }

    // Write manifest
    const manifestPath = pathModule.join(this.config.outDir, "ppr-manifest.json");
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

    console.log(`[PPR] Output written to ${this.config.outDir}`);
  }
}

// ============================================================================
// In-Memory PPR Cache
// ============================================================================

/**
 * Simple in-memory cache for development
 */
export class MemoryPPRCache implements PPRCache {
  private cache = new Map<string, StaticShell>();
  private hits = 0;
  private misses = 0;

  async get(path: string): Promise<StaticShell | null> {
    const shell = this.cache.get(path);
    if (shell) {
      this.hits++;
      return shell;
    }
    this.misses++;
    return null;
  }

  async set(path: string, shell: StaticShell): Promise<void> {
    this.cache.set(path, shell);
  }

  async has(path: string): Promise<boolean> {
    return this.cache.has(path);
  }

  async invalidate(path: string): Promise<void> {
    this.cache.delete(path);
  }

  async invalidateAll(): Promise<void> {
    this.cache.clear();
  }

  async stats(): Promise<{
    size: number;
    bytes: number;
    hitRatio: number;
    lastCleared?: number;
  }> {
    const total = this.hits + this.misses;
    let bytes = 0;

    for (const shell of this.cache.values()) {
      bytes += new TextEncoder().encode(shell.html).length;
    }

    return {
      size: this.cache.size,
      bytes,
      hitRatio: total > 0 ? this.hits / total : 0,
    };
  }
}

// ============================================================================
// File System PPR Cache
// ============================================================================

/**
 * File-system based cache for production
 */
export class FileSystemPPRCache implements PPRCache {
  private cacheDir: string;
  private hits = 0;
  private misses = 0;

  constructor(cacheDir: string) {
    this.cacheDir = cacheDir;
  }

  private async getFilePath(path: string): Promise<string> {
    const pathModule = await import("path");
    const safePath = path.replace(/[^a-zA-Z0-9-_/]/g, "_");
    return pathModule.join(this.cacheDir, `${safePath}.json`);
  }

  async get(path: string): Promise<StaticShell | null> {
    const fs = await import("fs/promises");

    try {
      const filePath = await this.getFilePath(path);
      const content = await fs.readFile(filePath, "utf-8");
      const data = JSON.parse(content);

      // Reconstruct the Map
      const shell: StaticShell = {
        ...data,
        boundaries: new Map(data.boundaries),
      };

      this.hits++;
      return shell;
    } catch {
      this.misses++;
      return null;
    }
  }

  async set(path: string, shell: StaticShell): Promise<void> {
    const fs = await import("fs/promises");
    const pathModule = await import("path");

    const filePath = await this.getFilePath(path);

    // Ensure directory exists
    await fs.mkdir(pathModule.dirname(filePath), { recursive: true });

    // Serialize Map to array for JSON
    const data = {
      ...shell,
      boundaries: Array.from(shell.boundaries.entries()),
    };

    await fs.writeFile(filePath, JSON.stringify(data), "utf-8");
  }

  async has(path: string): Promise<boolean> {
    const fs = await import("fs/promises");

    try {
      const filePath = await this.getFilePath(path);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async invalidate(path: string): Promise<void> {
    const fs = await import("fs/promises");

    try {
      const filePath = await this.getFilePath(path);
      await fs.unlink(filePath);
    } catch {
      // File doesn't exist, that's fine
    }
  }

  async invalidateAll(): Promise<void> {
    const fs = await import("fs/promises");

    try {
      await fs.rm(this.cacheDir, { recursive: true, force: true });
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch {
      // Directory doesn't exist, that's fine
    }
  }

  async stats(): Promise<{
    size: number;
    bytes: number;
    hitRatio: number;
    lastCleared?: number;
  }> {
    const fs = await import("fs/promises");
    const pathModule = await import("path");

    let size = 0;
    let bytes = 0;

    try {
      const files = await fs.readdir(this.cacheDir);

      for (const file of files) {
        if (file.endsWith(".json")) {
          size++;
          const stat = await fs.stat(pathModule.join(this.cacheDir, file));
          bytes += stat.size;
        }
      }
    } catch {
      // Directory doesn't exist
    }

    const total = this.hits + this.misses;

    return {
      size,
      bytes,
      hitRatio: total > 0 ? this.hits / total : 0,
    };
  }
}

// ============================================================================
// Build Functions
// ============================================================================

/**
 * Build PPR static shells for all routes
 */
export async function buildPPR(config: PPRBuildConfig): Promise<PPRBuildResult> {
  const builder = new PPRBuilder(config);
  return await builder.build();
}

/**
 * Build a single PPR route
 */
export async function buildPPRRoute(
  entry: PPRRouteEntry,
  outDir: string,
  cache?: PPRCache
): Promise<StaticShell | null> {
  const builderConfig: PPRBuildConfig = {
    outDir,
    routes: [entry],
    renderFn: async () => "",
  };
  if (cache) {
    builderConfig.cache = cache;
  }
  const builder = new PPRBuilder(builderConfig);

  const result = await builder.build();

  if (result.errors.length > 0) {
    console.error(`[PPR] Build errors:`, result.errors);
    return null;
  }

  return result.shells.get(entry.path) || null;
}

/**
 * Load PPR manifest from build output
 */
export async function loadPPRManifest(outDir: string): Promise<PPRManifest | null> {
  const fs = await import("fs/promises");
  const pathModule = await import("path");

  try {
    const manifestPath = pathModule.join(outDir, "ppr-manifest.json");
    const content = await fs.readFile(manifestPath, "utf-8");
    return JSON.parse(content) as PPRManifest;
  } catch {
    return null;
  }
}

/**
 * Load a static shell from build output
 */
export async function loadStaticShell(
  outDir: string,
  path: string
): Promise<StaticShell | null> {
  const fs = await import("fs/promises");
  const pathModule = await import("path");

  const normalized = path === "/" ? "/index" : path;

  try {
    // Load HTML
    const htmlPath = pathModule.join(outDir, `${normalized}.shell.html`);
    const html = await fs.readFile(htmlPath, "utf-8");

    // Load metadata
    const metadataPath = pathModule.join(outDir, `${normalized}.shell.json`);
    const metadataContent = await fs.readFile(metadataPath, "utf-8");
    const metadata = JSON.parse(metadataContent);

    return {
      path: metadata.path,
      html,
      boundaries: new Map(metadata.boundaries),
      buildTime: metadata.buildTime,
      contentHash: metadata.contentHash,
      assets: metadata.assets,
    };
  } catch {
    return null;
  }
}

// ============================================================================
// Vite Plugin for PPR
// ============================================================================

/**
 * Vite plugin for PPR build integration
 */
export function pprVitePlugin(config: Partial<PPRBuildConfig> = {}) {
  return {
    name: "philjs-ppr",

    async buildStart() {
    },

    async generateBundle() {
      // PPR build happens in writeBundle
    },

    async writeBundle(options: { dir?: string }) {
      if (!config.routes || config.routes.length === 0) {
        console.log("[PPR] No routes configured, skipping PPR build");
        return;
      }

      const outDir = options.dir || config.outDir || "dist";

      try {
        const buildConfig: PPRBuildConfig = {
          outDir: `${outDir}/ppr`,
          routes: config.routes || [],
          renderFn: config.renderFn || (async () => ""),
        };
        if (config.cache) {
          buildConfig.cache = config.cache;
        }
        if (config.concurrency !== undefined) {
          buildConfig.concurrency = config.concurrency;
        }
        await buildPPR(buildConfig);
      } catch (error) {
        console.error("[PPR] Build failed:", error);
      }
    },
  };
}

// ============================================================================
// Watch Mode for Development
// ============================================================================

/**
 * Create a PPR dev server with hot reload
 */
export function createPPRDevServer(config: {
  routes: PPRRouteEntry[];
  renderFn: (path: string) => Promise<VNode>;
}) {
  const cache = new MemoryPPRCache();

  return {
    /**
     * Get or generate a shell for a path
     */
    async getShell(path: string): Promise<StaticShell | null> {
      // Check cache first
      const cached = await cache.get(path);
      if (cached) return cached;

      // Find matching route
      const entry = config.routes.find((r) => r.path === path);
      if (!entry) return null;

      // Generate shell
      const vnode = await config.renderFn(path);
      const shell = await renderToStaticShell(vnode, path, entry.config);

      await cache.set(path, shell);
      return shell;
    },

    /**
     * Invalidate a cached shell
     */
    async invalidate(path: string): Promise<void> {
      await cache.invalidate(path);
    },

    /**
     * Invalidate all cached shells
     */
    async invalidateAll(): Promise<void> {
      await cache.invalidateAll();
    },

    /**
     * Get cache stats
     */
    async stats() {
      return await cache.stats();
    },
  };
}

// ============================================================================
// Exports
// ============================================================================

export type {
  PPRBuildConfig,
  PPRBuildResult,
  PPRBuildError,
  PPRManifest,
  PPRRouteEntry,
} from "./ppr-types.js";
