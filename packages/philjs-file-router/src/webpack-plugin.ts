/**
 * Webpack plugin for PhilJS File-based Router.
 *
 * Provides:
 * - Build-time route generation
 * - Virtual module for routes
 * - Watch mode support
 * - Type generation
 *
 * @example
 * ```ts
 * // webpack.config.js
 * const { PhilJSFileRouterPlugin } = require('@philjs/file-router/webpack');
 *
 * module.exports = {
 *   plugins: [
 *     new PhilJSFileRouterPlugin({
 *       routesDir: 'src/routes',
 *     }),
 *   ],
 * };
 * ```
 */

import { existsSync, mkdirSync, writeFileSync, watch } from "node:fs";
import { join, resolve, relative } from "node:path";
import type { Compiler, Compilation, NormalModule } from "webpack";
import type { WebpackPluginOptions, RouteManifest, ScanResult } from "./types.js";
import { scanDirectory, isRouteFileChange } from "./scanner.js";
import {
  generateFromScanResult,
  generateManifestCode,
  generateTypeDefinitions,
} from "./generator.js";

// ============================================================================
// Constants
// ============================================================================

const PLUGIN_NAME = "PhilJSFileRouterPlugin";
const VIRTUAL_MODULE_PATH = "virtual:philjs-file-routes";

const DEFAULT_OPTIONS: Partial<WebpackPluginOptions> = {
  outDir: ".philjs",
  watch: true,
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
// Plugin Implementation
// ============================================================================

/**
 * Webpack plugin for PhilJS file-based routing.
 */
export class PhilJSFileRouterPlugin {
  private options: Required<WebpackPluginOptions>;
  private manifest: RouteManifest | null = null;
  private scanResult: ScanResult | null = null;
  private watcher: ReturnType<typeof watch> | null = null;
  private root: string = "";

  constructor(options: WebpackPluginOptions) {
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    } as Required<WebpackPluginOptions>;
  }

  /**
   * Log based on level.
   */
  private log(level: "verbose" | "info" | "warn" | "error", message: string): void {
    const levels = ["verbose", "info", "warn", "error", "silent"];
    const configLevel = this.options.logLevel;
    const configIndex = levels.indexOf(configLevel);
    const messageIndex = levels.indexOf(level);

    if (messageIndex >= configIndex) {
      const prefix = `[${PLUGIN_NAME}]`;
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
   * Generate routes from file system.
   */
  private generateRoutes(): RouteManifest | null {
    try {
      this.log("verbose", "Scanning routes directory...");

      this.scanResult = scanDirectory({
        routesDir: this.options.routesDir,
        extensions: this.options.extensions,
        ignore: this.options.ignore,
        layouts: this.options.layouts,
        loading: this.options.loading,
        errors: this.options.errors,
        groups: this.options.groups,
        parallel: this.options.parallel,
      });

      this.log(
        "verbose",
        `Found ${this.scanResult.pages.length} routes in ${this.scanResult.duration.toFixed(2)}ms`
      );

      this.manifest = generateFromScanResult(this.scanResult, this.options);

      this.log("info", `Generated ${this.manifest.routes.length} routes`);

      return this.manifest;
    } catch (error) {
      this.log("error", `Failed to generate routes: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Write generated files to disk.
   */
  private writeGeneratedFiles(): void {
    if (!this.manifest) return;

    const outDir = resolve(this.root, this.options.outDir);

    // Ensure output directory exists
    if (!existsSync(outDir)) {
      mkdirSync(outDir, { recursive: true });
    }

    // Write manifest file
    const manifestPath = join(outDir, "routes.js");
    const manifestCode = generateManifestCode(this.manifest, this.options);
    writeFileSync(manifestPath, manifestCode);
    this.log("verbose", `Wrote manifest to: ${manifestPath}`);

    // Write type definitions
    if (this.options.generateTypes) {
      const typesPath = join(outDir, "routes.d.ts");
      const typesCode = generateTypeDefinitions(this.manifest.routes);
      writeFileSync(typesPath, typesCode);
      this.log("verbose", `Wrote types to: ${typesPath}`);
    }
  }

  /**
   * Generate virtual module code.
   */
  private generateVirtualModuleCode(): string {
    if (!this.manifest) {
      return `
module.exports = {
  routes: [],
  matchRoute: function(pathname) { return null; },
  loadRoute: function(routeId) { return Promise.resolve(null); },
};
`;
    }

    const lines: string[] = [];

    // Header
    lines.push("/**");
    lines.push(" * Virtual route module generated by @philjs/file-router");
    lines.push(" */");
    lines.push("");

    // Generate lazy imports (CommonJS style for broader compatibility)
    for (const route of this.manifest.routes) {
      const importVar = `Route_${route.id.replace(/[^a-zA-Z0-9]/g, "_")}`;
      const importPath = route.absolutePath.replace(/\\/g, "/").replace(/\.[tj]sx?$/, "");
      lines.push(`var ${importVar} = function() { return import('${importPath}'); };`);
      (route as any).importVar = importVar;
    }
    lines.push("");

    // Routes array
    lines.push("var routes = [");
    for (const route of this.manifest.routes) {
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
      lines.push("  },");
    }
    lines.push("];");
    lines.push("");

    // Route matching function
    lines.push(`
function matchRoute(pathname) {
  for (var i = 0; i < routes.length; i++) {
    var route = routes[i];
    var pattern = route.path
      .replace(/:\\w+/g, '([^/]+)')
      .replace(/\\*\\w+\\??/g, '(.*)');
    var regex = new RegExp('^' + pattern + '$');
    var match = pathname.match(regex);
    if (match) {
      var params = {};
      route.params.forEach(function(param, index) {
        var name = param.startsWith('...') ? param.slice(3) : param;
        params[name] = decodeURIComponent(match[index + 1] || '');
      });
      return { route: route, params: params };
    }
  }
  return null;
}
`);

    // Route loading function
    lines.push(`
function loadRoute(routeId) {
  var route = routes.find(function(r) { return r.id === routeId; });
  if (!route || !route.lazy) {
    return Promise.resolve(null);
  }
  return route.lazy();
}
`);

    // Exports
    lines.push("");
    lines.push("module.exports = {");
    lines.push("  routes: routes,");
    lines.push("  matchRoute: matchRoute,");
    lines.push("  loadRoute: loadRoute,");
    lines.push("};");

    // ESM exports for compatibility
    lines.push("");
    lines.push("module.exports.default = module.exports;");

    return lines.join("\n");
  }

  /**
   * Apply the plugin to the webpack compiler.
   */
  apply(compiler: Compiler): void {
    this.root = compiler.context || process.cwd();
    this.options.routesDir = resolve(this.root, this.options.routesDir);

    const isWatchMode = compiler.options.watch;

    // Generate routes before compilation
    compiler.hooks.beforeCompile.tapAsync(PLUGIN_NAME, (params, callback) => {
      this.generateRoutes();
      callback();
    });

    // Handle virtual module resolution
    compiler.hooks.normalModuleFactory.tap(PLUGIN_NAME, (nmf) => {
      nmf.hooks.beforeResolve.tap(PLUGIN_NAME, (resolveData) => {
        if (!resolveData) return;

        if (
          resolveData.request === VIRTUAL_MODULE_PATH ||
          resolveData.request === "@philjs/file-router/routes"
        ) {
          const outDir = resolve(this.root, this.options.outDir);
          const manifestPath = join(outDir, "routes.js");

          // Ensure manifest file exists
          if (!existsSync(manifestPath)) {
            this.generateRoutes();
            this.writeGeneratedFiles();
          }

          resolveData.request = manifestPath;
        }
      });
    });

    // Write files after emit
    compiler.hooks.afterEmit.tapAsync(PLUGIN_NAME, (compilation, callback) => {
      this.writeGeneratedFiles();
      callback();
    });

    // Setup watch mode
    if (isWatchMode && this.options.watch) {
      compiler.hooks.watchRun.tapAsync(PLUGIN_NAME, (comp, callback) => {
        if (!this.watcher && existsSync(this.options.routesDir)) {
          this.watcher = watch(
            this.options.routesDir,
            { recursive: true },
            (eventType, filename) => {
              if (!filename) return;

              const filePath = join(this.options.routesDir, filename);
              if (
                isRouteFileChange(
                  filePath,
                  this.options.routesDir,
                  this.options.extensions
                )
              ) {
                this.log("info", `Route file changed: ${filename}`);
                this.generateRoutes();
                this.writeGeneratedFiles();
              }
            }
          );

          this.log("info", "Route file watching enabled");
        }

        callback();
      });

      // Cleanup watcher on close
      compiler.hooks.watchClose.tap(PLUGIN_NAME, () => {
        if (this.watcher) {
          this.watcher.close();
          this.watcher = null;
          this.log("verbose", "Route file watching stopped");
        }
      });
    }

    // Add routes directory to watched paths
    compiler.hooks.afterCompile.tap(PLUGIN_NAME, (compilation) => {
      if (existsSync(this.options.routesDir)) {
        compilation.contextDependencies.add(this.options.routesDir);
      }
    });

    // Log completion
    compiler.hooks.done.tap(PLUGIN_NAME, (stats) => {
      if (stats.hasErrors()) {
        this.log("error", "Build completed with errors");
      } else {
        this.log(
          "info",
          `Build completed: ${this.manifest?.routes.length || 0} routes`
        );
      }
    });
  }
}

// ============================================================================
// Helper Loader
// ============================================================================

/**
 * Webpack loader for route files.
 * Adds route metadata to modules.
 */
export function philjsRouteLoader(this: any, source: string): string {
  const callback = this.async();
  const resourcePath = this.resourcePath;

  // Add route metadata as a comment for debugging
  const routeInfo = `
/* @philjs/file-router
 * Route file: ${resourcePath}
 */
`;

  callback(null, routeInfo + source);
}

// ============================================================================
// Exports
// ============================================================================

export default PhilJSFileRouterPlugin;
