/**
 * Vite plugin for PhilJS file-based routing.
 * Provides build-time route generation and HMR support.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, resolve, relative, dirname } from "node:path";
import type { Plugin, ViteDevServer, ModuleNode, HmrContext } from "vite";
import {
  scanDirectory,
  type ScanResult,
  type ScannerConfig,
} from "./scanner.js";
import {
  generateFromScanResult,
  generateManifestCode,
  generateRouteTypes,
  type RouteManifest,
  type GeneratorConfig,
} from "./generator.js";
import {
  RouteWatcher,
  type WatcherConfig,
  type FileChangeEvent,
} from "./watcher.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Plugin configuration options.
 */
export type VitePluginOptions = GeneratorConfig & {
  /** Output directory for generated files (relative to root) */
  outDir?: string;
  /** Name of the generated manifest file */
  manifestFileName?: string;
  /** Name of the generated types file */
  typesFileName?: string;
  /** Whether to generate a virtual module */
  virtualModule?: boolean;
  /** Virtual module name */
  virtualModuleName?: string;
  /** Whether to enable HMR for routes */
  hmr?: boolean;
  /** Log level */
  logLevel?: "verbose" | "info" | "warn" | "error" | "silent";
};

/**
 * Resolved plugin options.
 */
type ResolvedOptions = Required<VitePluginOptions>;

/**
 * Plugin state.
 */
type PluginState = {
  /** Current manifest */
  manifest: RouteManifest | null;
  /** Current scan result */
  scanResult: ScanResult | null;
  /** Route watcher instance */
  watcher: RouteWatcher | null;
  /** Vite dev server */
  server: ViteDevServer | null;
  /** Root directory */
  root: string;
  /** Is development mode */
  isDev: boolean;
};

// ============================================================================
// Constants
// ============================================================================

const VIRTUAL_MODULE_ID = "virtual:philjs-routes";
const RESOLVED_VIRTUAL_MODULE_ID = "\0" + VIRTUAL_MODULE_ID;

const DEFAULT_OPTIONS: Partial<ResolvedOptions> = {
  outDir: ".philjs",
  manifestFileName: "routes.js",
  typesFileName: "routes.d.ts",
  virtualModule: true,
  virtualModuleName: VIRTUAL_MODULE_ID,
  hmr: true,
  logLevel: "info",
  extensions: [".tsx", ".ts", ".jsx", ".js"],
  ignore: [],
  layouts: true,
  loading: true,
  errors: true,
  parallel: true,
  groups: true,
  lazy: true,
  generateTypes: true,
  basePath: "",
};

// ============================================================================
// Plugin Implementation
// ============================================================================

/**
 * Create the PhilJS file-based routing Vite plugin.
 */
export function philjsRouter(options: VitePluginOptions): Plugin {
  const state: PluginState = {
    manifest: null,
    scanResult: null,
    watcher: null,
    server: null,
    root: "",
    isDev: false,
  };

  let resolvedOptions: ResolvedOptions;

  /**
   * Log a message based on log level.
   */
  function log(
    level: "verbose" | "info" | "warn" | "error",
    message: string
  ): void {
    const levels = ["verbose", "info", "warn", "error", "silent"];
    const configLevel = resolvedOptions.logLevel;
    const configIndex = levels.indexOf(configLevel);
    const messageIndex = levels.indexOf(level);

    if (messageIndex >= configIndex) {
      const prefix = "[philjs-router]";
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
   * Generate routes and return the manifest.
   */
  function generateRoutes(): RouteManifest | null {
    try {
      log("verbose", "Scanning routes directory...");

      state.scanResult = scanDirectory({
        dir: resolvedOptions.dir,
        extensions: resolvedOptions.extensions,
        ignore: resolvedOptions.ignore,
        layouts: resolvedOptions.layouts,
        loading: resolvedOptions.loading,
        errors: resolvedOptions.errors,
        parallel: resolvedOptions.parallel,
        groups: resolvedOptions.groups,
      });

      log(
        "verbose",
        `Found ${state.scanResult.routes.length} routes in ${state.scanResult.duration.toFixed(2)}ms`
      );

      state.manifest = generateFromScanResult(state.scanResult, {
        ...resolvedOptions,
        importTransformer: (absolutePath, relativePath) => {
          // Generate import path relative to virtual module location
          const importPath = relative(state.root, absolutePath)
            .replace(/\\/g, "/")
            .replace(/\.(tsx?|jsx?|js)$/, "");
          return "/" + importPath;
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
    if (!state.manifest) {
      return;
    }

    const outDir = resolve(state.root, resolvedOptions.outDir);

    // Ensure output directory exists
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }

    // Write manifest file
    const manifestPath = join(outDir, resolvedOptions.manifestFileName);
    const manifestCode = generateManifestCode(state.manifest, resolvedOptions);
    writeFileSync(manifestPath, manifestCode);
    log("verbose", `Wrote manifest to: ${manifestPath}`);

    // Write types file
    if (resolvedOptions.generateTypes) {
      const typesPath = join(outDir, resolvedOptions.typesFileName);
      const typesCode = generateRouteTypes(
        state.manifest.routes,
        resolvedOptions.typesModuleName
      );
      writeFileSync(typesPath, typesCode);
      log("verbose", `Wrote types to: ${typesPath}`);
    }
  }

  /**
   * Generate the virtual module code.
   */
  function generateVirtualModuleCode(): string {
    if (!state.manifest) {
      return "export const routes = [];\nexport const routeTree = [];";
    }

    const lines: string[] = [];

    // Header
    lines.push("// Virtual route module generated by @philjs/router");
    lines.push("// Do not import this file directly in production builds");
    lines.push("");

    // Generate lazy imports for each route
    for (const route of state.manifest.routes) {
      const importVar = state.manifest.importMap.get(route.id);
      if (importVar) {
        const importPath = route.absolutePath
          .replace(/\\/g, "/")
          .replace(/\.(tsx?|jsx?|js)$/, "");
        lines.push(
          `const ${importVar} = () => import('${importPath}');`
        );
      }
    }
    lines.push("");

    // Export routes array
    lines.push("export const routes = [");
    for (const route of state.manifest.routes) {
      const importVar = state.manifest.importMap.get(route.id);
      lines.push("  {");
      lines.push(`    id: ${JSON.stringify(route.id)},`);
      lines.push(`    path: ${JSON.stringify(route.path)},`);
      lines.push(`    filePath: ${JSON.stringify(route.filePath)},`);
      lines.push(`    params: ${JSON.stringify(route.params)},`);
      lines.push(`    lazy: ${importVar},`);
      lines.push(`    priority: ${route.priority},`);
      if (route.layoutChain.length > 0) {
        lines.push(`    layoutChain: ${JSON.stringify(route.layoutChain)},`);
      }
      if (route.groups.length > 0) {
        lines.push(`    groups: ${JSON.stringify(route.groups)},`);
      }
      if (route.slot) {
        lines.push(`    slot: ${JSON.stringify(route.slot)},`);
      }
      lines.push("  },");
    }
    lines.push("];");
    lines.push("");

    // Export route tree
    lines.push("export const routeTree = ");
    lines.push(JSON.stringify(state.manifest.tree, null, 2) + ";");
    lines.push("");

    // Export route matching function
    lines.push(`
export function matchRoute(pathname) {
  for (const route of routes) {
    const pattern = route.path
      .replace(/:[^/]+/g, '([^/]+)')
      .replace(/\\*[^/]+\\??/g, '(.*)');
    const regex = new RegExp('^' + pattern + '$');
    const match = pathname.match(regex);
    if (match) {
      const params = {};
      route.params.forEach((param, index) => {
        params[param] = match[index + 1];
      });
      return { route, params };
    }
  }
  return null;
}
`);

    // Export route loader
    lines.push(`
export async function loadRoute(routeId) {
  const route = routes.find(r => r.id === routeId);
  if (!route || !route.lazy) {
    return null;
  }
  return route.lazy();
}
`);

    return lines.join("\n");
  }

  /**
   * Handle HMR updates.
   */
  function handleHMRUpdate(event: FileChangeEvent): void {
    if (!state.server || !event.affectsRoutes) {
      return;
    }

    log("info", `Route file changed: ${event.relativePath}`);

    // Regenerate routes
    generateRoutes();

    // Invalidate the virtual module
    const module = state.server.moduleGraph.getModuleById(
      RESOLVED_VIRTUAL_MODULE_ID
    );
    if (module) {
      state.server.moduleGraph.invalidateModule(module);

      // Send HMR update
      state.server.ws.send({
        type: "custom",
        event: "philjs:route-update",
        data: {
          routeIds: event.affectedRouteIds,
          timestamp: event.timestamp,
        },
      });

      // Trigger full reload if needed
      if (event.affectedRouteIds.length > 3) {
        state.server.ws.send({ type: "full-reload" });
      } else {
        // Partial update
        state.server.ws.send({
          type: "update",
          updates: [
            {
              type: "js-update",
              path: VIRTUAL_MODULE_ID,
              acceptedPath: VIRTUAL_MODULE_ID,
              timestamp: event.timestamp,
            },
          ],
        });
      }
    }
  }

  return {
    name: "philjs-router",

    configResolved(config) {
      state.root = config.root;
      state.isDev = config.command === "serve";

      // Resolve options
      resolvedOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
        dir: resolve(config.root, options.dir),
      } as ResolvedOptions;

      log("verbose", `Routes directory: ${resolvedOptions.dir}`);
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

      // Start file watcher in dev mode
      if (resolvedOptions.hmr) {
        state.watcher = new RouteWatcher({
          ...resolvedOptions,
          verbose: resolvedOptions.logLevel === "verbose",
          onFileChange: handleHMRUpdate,
        });
        state.watcher.start();

        log("info", "Route HMR enabled");
      }

      // Handle route manifest API endpoint
      server.middlewares.use((req, res, next) => {
        if (req.url === "/__philjs_routes__") {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(state.manifest));
          return;
        }
        next();
      });
    },

    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID || id === resolvedOptions.virtualModuleName) {
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
      const relativePath = relative(resolvedOptions.dir, ctx.file);
      if (!relativePath.startsWith("..") && !relativePath.startsWith("/")) {
        // This is a route file - the watcher will handle it
        return;
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
        state.watcher.stop();
        state.watcher = null;
      }
    },
  };
}

// ============================================================================
// Helper Plugins
// ============================================================================

/**
 * Create a plugin for type generation only.
 */
export function philjsRouterTypes(options: VitePluginOptions): Plugin {
  return {
    name: "philjs-router-types",

    buildStart() {
      const root = process.cwd();
      const resolvedOptions: GeneratorConfig = {
        ...DEFAULT_OPTIONS,
        ...options,
        dir: resolve(root, options.dir),
      };

      const scanResult = scanDirectory(resolvedOptions);
      const manifest = generateFromScanResult(scanResult, resolvedOptions);

      const outDir = resolve(root, options.outDir || ".philjs");
      if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
      }

      const typesPath = join(outDir, options.typesFileName || "routes.d.ts");
      const typesCode = generateRouteTypes(
        manifest.routes,
        options.typesModuleName
      );
      writeFileSync(typesPath, typesCode);
    },
  };
}

// ============================================================================
// Client-side HMR Runtime
// ============================================================================

/**
 * HMR runtime code to be injected into the client bundle.
 */
export const hmrRuntimeCode = `
if (import.meta.hot) {
  import.meta.hot.on('philjs:route-update', (data) => {
    console.log('[philjs-router] Routes updated:', data.routeIds);

    // Dispatch custom event for route updates
    window.dispatchEvent(new CustomEvent('philjs:routes-updated', {
      detail: {
        routeIds: data.routeIds,
        timestamp: data.timestamp,
      },
    }));
  });

  // Accept HMR updates for this module
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      console.log('[philjs-router] Route module updated');
      window.dispatchEvent(new CustomEvent('philjs:routes-module-updated', {
        detail: { module: newModule },
      }));
    }
  });
}
`;

// ============================================================================
// Build Utilities
// ============================================================================

/**
 * Generate routes at build time (CLI utility).
 */
export async function generateRoutesAtBuildTime(
  options: VitePluginOptions
): Promise<RouteManifest | null> {
  const root = options.dir.startsWith("/")
    ? dirname(options.dir)
    : process.cwd();

  const resolvedOptions: GeneratorConfig = {
    ...DEFAULT_OPTIONS,
    ...options,
    dir: resolve(root, options.dir),
  };

  try {
    const scanResult = scanDirectory(resolvedOptions);
    const manifest = generateFromScanResult(scanResult, resolvedOptions);

    // Write files
    const outDir = resolve(root, options.outDir || ".philjs");
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }

    const manifestPath = join(outDir, options.manifestFileName || "routes.js");
    const manifestCode = generateManifestCode(manifest, resolvedOptions);
    writeFileSync(manifestPath, manifestCode);

    if (options.generateTypes !== false) {
      const typesPath = join(outDir, options.typesFileName || "routes.d.ts");
      const typesCode = generateRouteTypes(
        manifest.routes,
        options.typesModuleName
      );
      writeFileSync(typesPath, typesCode);
    }

    console.log(`[philjs-router] Generated ${manifest.routes.length} routes`);
    return manifest;
  } catch (error) {
    console.error(`[philjs-router] Build failed: ${(error as Error).message}`);
    return null;
  }
}

// ============================================================================
// Exports
// ============================================================================

export default philjsRouter;
