/**
 * Vite plugin for PhilJS File-based Router.
 *
 * Provides:
 * - Build-time route generation
 * - Virtual module for routes
 * - HMR support for route files
 * - Type generation
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { philjsFileRouter } from '@philjs/file-router/vite';
 *
 * export default {
 *   plugins: [
 *     philjsFileRouter({
 *       routesDir: 'src/routes',
 *     }),
 *   ],
 * };
 * ```
 */

import { existsSync, mkdirSync, writeFileSync, watch } from "node:fs";
import { join, resolve, relative } from "node:path";
import type { Plugin, ViteDevServer, HmrContext } from "vite";
import type { VitePluginOptions, RouteManifest, ScanResult } from "./types.js";
import { scanDirectory, isRouteFileChange } from "./scanner.js";
import {
  generateFromScanResult,
  generateManifestCode,
  generateTypeDefinitions,
} from "./generator.js";

// ============================================================================
// Constants
// ============================================================================

const VIRTUAL_MODULE_ID = "virtual:philjs-file-routes";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

const DEFAULT_OPTIONS: Partial<VitePluginOptions> = {
  outDir: ".philjs",
  virtualModuleName: VIRTUAL_MODULE_ID,
  hmr: true,
  logLevel: "info",
  extensions: [".tsx", ".ts", ".jsx", ".js"],
  ignore: [],
  layouts: true,
  loading: true,
  errors: true,
  groups: true,
  parallel: true,
  lazy: true,
  generateTypes: true,
  basePath: "",
};

// ============================================================================
// Plugin State
// ============================================================================

interface PluginState {
  manifest: RouteManifest | null;
  scanResult: ScanResult | null;
  server: ViteDevServer | null;
  root: string;
  isDev: boolean;
  watcher: ReturnType<typeof watch> | null;
}

// ============================================================================
// Plugin Implementation
// ============================================================================

/**
 * Create the PhilJS file-based routing Vite plugin.
 */
export function philjsFileRouter(options: VitePluginOptions): Plugin {
  const state: PluginState = {
    manifest: null,
    scanResult: null,
    server: null,
    root: "",
    isDev: false,
    watcher: null,
  };

  let resolvedOptions: Required<VitePluginOptions>;

  /**
   * Log based on level.
   */
  function log(level: "verbose" | "info" | "warn" | "error", message: string): void {
    const levels = ["verbose", "info", "warn", "error", "silent"];
    const configLevel = resolvedOptions.logLevel;
    const configIndex = levels.indexOf(configLevel);
    const messageIndex = levels.indexOf(level);

    if (messageIndex >= configIndex) {
      const prefix = "[philjs-file-router]";
      switch (level) {
        case "error":
          console.error(`${prefix} ${message}`);
          break;
        case "warn":
          console.warn(`${prefix} ${message}`);
          break;
        default:
          console.log(`${prefix} ${message}`);
      }
    }
  }

  /**
   * Generate routes.
   */
  function generateRoutes(): RouteManifest | null {
    try {
      log("verbose", "Scanning routes directory...");

      state.scanResult = scanDirectory({
        routesDir: resolvedOptions.routesDir,
        extensions: resolvedOptions.extensions,
        ignore: resolvedOptions.ignore,
        layouts: resolvedOptions.layouts,
        loading: resolvedOptions.loading,
        errors: resolvedOptions.errors,
        groups: resolvedOptions.groups,
        parallel: resolvedOptions.parallel,
      });

      log(
        "verbose",
        `Found ${state.scanResult.pages.length} routes in ${state.scanResult.duration.toFixed(2)}ms`
      );

      state.manifest = generateFromScanResult(state.scanResult, {
        ...resolvedOptions,
        importTransformer: (absolutePath, relativePath) => {
          // Generate absolute import path for Vite
          const importPath = absolutePath
            .replace(/\\/g, "/")
            .replace(/\.[tj]sx?$/, "");
          return importPath;
        },
      });

      log("info", `Generated ${state.manifest.routes.length} routes`);

      return state.manifest;
    } catch (error) {
      log("error", `Failed to generate routes: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Write generated files to disk.
   */
  function writeGeneratedFiles(): void {
    if (!state.manifest) return;

    const outDir = resolve(state.root, resolvedOptions.outDir || ".philjs");

    // Ensure output directory exists
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }

    // Write manifest file
    const manifestPath = join(outDir, "routes.js");
    const manifestCode = generateManifestCode(state.manifest, resolvedOptions);
    writeFileSync(manifestPath, manifestCode);
    log("verbose", `Wrote manifest to: ${manifestPath}`);

    // Write type definitions
    if (resolvedOptions.generateTypes) {
      const typesPath = join(outDir, "routes.d.ts");
      const typesCode = generateTypeDefinitions(state.manifest.routes);
      writeFileSync(typesPath, typesCode);
      log("verbose", `Wrote types to: ${typesPath}`);
    }
  }

  /**
   * Generate virtual module code.
   */
  function generateVirtualModuleCode(): string {
    if (!state.manifest) {
      return `
export const routes = [];
export const routeTree = null;
export function matchRoute(pathname) { return null; }
export async function loadRoute(routeId) { return null; }
`;
    }

    const lines: string[] = [];

    // Header
    lines.push("/**");
    lines.push(" * Virtual route module generated by @philjs/file-router");
    lines.push(" * Do not import directly in production builds");
    lines.push(" */");
    lines.push("");

    // Generate lazy imports
    for (const route of state.manifest.routes) {
      const importVar = (route as any).importVar || `Route_${route.id.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const importPath = route.absolutePath.replace(/\\/g, "/").replace(/\.[tj]sx?$/, "");
      lines.push(`const ${importVar} = () => import('${importPath}');`);
      (route as any).importVar = importVar;
    }
    lines.push("");

    // Export routes array
    lines.push("export const routes = [");
    for (const route of state.manifest.routes) {
      const importVar = (route as any).importVar;
      lines.push("  {");
      lines.push(`    id: ${JSON.stringify(route.id)},`);
      lines.push(`    path: ${JSON.stringify(route.path)},`);
      lines.push(`    filePath: ${JSON.stringify(route.filePath)},`);
      lines.push(`    params: ${JSON.stringify(route.params)},`);
      lines.push(`    priority: ${route.priority},`);
      lines.push(`    lazy: ${importVar},`);
      if (route.layoutChain.length > 0) {
        lines.push(`    layoutChain: ${JSON.stringify(route.layoutChain)},`);
      }
      if (route.groups.length > 0) {
        lines.push(`    groups: ${JSON.stringify(route.groups)},`);
      }
      if (route.slot) {
        lines.push(`    slot: ${JSON.stringify(route.slot)},`);
      }
      if (route.isIndex) {
        lines.push(`    isIndex: true,`);
      }
      if (route.isCatchAll) {
        lines.push(`    isCatchAll: true,`);
      }
      lines.push("  },");
    }
    lines.push("];");
    lines.push("");

    // Route matching function
    lines.push(`
export function matchRoute(pathname) {
  for (const route of routes) {
    const pattern = route.path
      .replace(/:\\w+/g, '([^/]+)')
      .replace(/\\*\\w+\\??/g, '(.*)');
    const regex = new RegExp('^' + pattern + '$');
    const match = pathname.match(regex);
    if (match) {
      const params = {};
      route.params.forEach((param, index) => {
        const name = param.startsWith('...') ? param.slice(3) : param;
        params[name] = decodeURIComponent(match[index + 1] || '');
      });
      return { route, params };
    }
  }
  return null;
}
`);

    // Route loading function
    lines.push(`
export async function loadRoute(routeId) {
  const route = routes.find(r => r.id === routeId);
  if (!route || !route.lazy) {
    return null;
  }
  return route.lazy();
}
`);

    // HMR runtime code
    if (state.isDev) {
      lines.push(`
if (import.meta.hot) {
  import.meta.hot.on('philjs:route-update', (data) => {
    console.log('[philjs-file-router] Routes updated:', data.routeIds);
    window.dispatchEvent(new CustomEvent('philjs:routes-updated', {
      detail: data,
    }));
  });

  import.meta.hot.accept((newModule) => {
    if (newModule) {
      window.dispatchEvent(new CustomEvent('philjs:routes-module-updated', {
        detail: { module: newModule },
      }));
    }
  });
}
`);
    }

    return lines.join("\n");
  }

  /**
   * Handle HMR for route files.
   */
  function handleHMRUpdate(filePath: string): void {
    if (!state.server) return;

    log("info", `Route file changed: ${relative(state.root, filePath)}`);

    // Regenerate routes
    generateRoutes();

    // Invalidate virtual module
    const module = state.server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID);
    if (module) {
      state.server.moduleGraph.invalidateModule(module);

      // Send HMR update
      state.server.ws.send({
        type: "custom",
        event: "philjs:route-update",
        data: {
          routeIds: state.manifest?.routes.map((r) => r.id) || [],
          timestamp: Date.now(),
        },
      });

      // Also trigger module update
      state.server.ws.send({
        type: "update",
        updates: [
          {
            type: "js-update",
            path: VIRTUAL_MODULE_ID,
            acceptedPath: VIRTUAL_MODULE_ID,
            timestamp: Date.now(),
          },
        ],
      });
    }
  }

  return {
    name: "philjs-file-router",

    configResolved(config) {
      state.root = config.root;
      state.isDev = config.command === "serve";

      // Resolve options
      resolvedOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
        routesDir: resolve(config.root, options.routesDir),
      } as Required<VitePluginOptions>;

      log("verbose", `Routes directory: ${resolvedOptions.routesDir}`);
    },

    buildStart() {
      // Generate routes on build start
      generateRoutes();

      // Write files for production build
      if (!state.isDev) {
        writeGeneratedFiles();
      }
    },

    configureServer(server) {
      state.server = server;

      // Watch for route file changes
      if (resolvedOptions.hmr) {
        const routesDir = resolvedOptions.routesDir;

        if (existsSync(routesDir)) {
          state.watcher = watch(
            routesDir,
            { recursive: true },
            (eventType, filename) => {
              if (!filename) return;

              const filePath = join(routesDir, filename);
              if (
                isRouteFileChange(
                  filePath,
                  routesDir,
                  resolvedOptions.extensions
                )
              ) {
                handleHMRUpdate(filePath);
              }
            }
          );

          log("info", "Route HMR enabled");
        }
      }

      // Add API endpoint for route manifest
      server.middlewares.use((req, res, next) => {
        if (req.url === "/__philjs_routes__") {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(state.manifest, null, 2));
          return;
        }
        next();
      });
    },

    resolveId(id) {
      if (
        id === VIRTUAL_MODULE_ID ||
        id === resolvedOptions.virtualModuleName
      ) {
        return RESOLVED_VIRTUAL_MODULE_ID;
      }
      return null;
    },

    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        return generateVirtualModuleCode();
      }
      return null;
    },

    handleHotUpdate(ctx: HmrContext) {
      // Check if changed file is in routes directory
      const relativePath = relative(resolvedOptions.routesDir, ctx.file);
      if (!relativePath.startsWith("..") && !relativePath.startsWith("/")) {
        // File is in routes directory, regenerate
        handleHMRUpdate(ctx.file);
        return [];
      }
    },

    closeBundle() {
      // Write final files on build complete
      if (!state.isDev) {
        writeGeneratedFiles();
      }
    },

    buildEnd() {
      // Clean up watcher
      if (state.watcher) {
        state.watcher.close();
        state.watcher = null;
      }
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate routes at build time (CLI utility).
 */
export async function generateRoutesAtBuildTime(
  options: VitePluginOptions
): Promise<RouteManifest | null> {
  const root = process.cwd();

  const resolvedOptions: Required<VitePluginOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
    routesDir: resolve(root, options.routesDir),
  } as Required<VitePluginOptions>;

  try {
    const scanResult = scanDirectory({
      routesDir: resolvedOptions.routesDir,
      extensions: resolvedOptions.extensions,
      ignore: resolvedOptions.ignore,
      layouts: resolvedOptions.layouts,
      loading: resolvedOptions.loading,
      errors: resolvedOptions.errors,
      groups: resolvedOptions.groups,
      parallel: resolvedOptions.parallel,
    });

    const manifest = generateFromScanResult(scanResult, resolvedOptions);

    // Write files
    const outDir = resolve(root, resolvedOptions.outDir || ".philjs");
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }

    const manifestPath = join(outDir, "routes.js");
    const manifestCode = generateManifestCode(manifest, resolvedOptions);
    writeFileSync(manifestPath, manifestCode);

    if (resolvedOptions.generateTypes) {
      const typesPath = join(outDir, "routes.d.ts");
      const typesCode = generateTypeDefinitions(manifest.routes);
      writeFileSync(typesPath, typesCode);
    }

    console.log(`[philjs-file-router] Generated ${manifest.routes.length} routes`);
    return manifest;
  } catch (error) {
    console.error(`[philjs-file-router] Build failed: ${(error as Error).message}`);
    return null;
  }
}

// ============================================================================
// Exports
// ============================================================================

export default philjsFileRouter;
