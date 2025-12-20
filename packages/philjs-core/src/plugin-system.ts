/**
 * PhilJS Plugin System
 * Comprehensive plugin architecture with lifecycle hooks and type safety
 */

import type { ViteDevServer, Plugin as VitePlugin } from "vite";
import type { RollupOptions } from "rollup";

/**
 * Plugin lifecycle phases
 */
export type PluginPhase = "init" | "build" | "dev" | "serve" | "test" | "deploy";

/**
 * Plugin context - provides access to framework internals
 */
export interface PluginContext {
  /** PhilJS version */
  version: string;
  /** Project root directory */
  root: string;
  /** Build mode */
  mode: "development" | "production" | "test";
  /** Configuration */
  config: Record<string, any>;
  /** Logger */
  logger: PluginLogger;
  /** File system utilities */
  fs: PluginFileSystem;
  /** Utility functions */
  utils: PluginUtils;
}

/**
 * Plugin logger interface
 */
export interface PluginLogger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  success(message: string, ...args: any[]): void;
}

/**
 * File system utilities for plugins
 */
export interface PluginFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  mkdir(path: string, recursive?: boolean): Promise<void>;
  readdir(path: string): Promise<string[]>;
  copy(src: string, dest: string): Promise<void>;
  remove(path: string): Promise<void>;
}

/**
 * Plugin utility functions
 */
export interface PluginUtils {
  /** Resolve path relative to project root */
  resolve(...paths: string[]): string;
  /** Execute shell command */
  exec(command: string, options?: { cwd?: string }): Promise<{ stdout: string; stderr: string }>;
  /** Get package manager (npm, pnpm, yarn, bun) */
  getPackageManager(): Promise<"npm" | "pnpm" | "yarn" | "bun">;
  /** Install npm packages */
  installPackages(packages: string[], dev?: boolean): Promise<void>;
  /** Read package.json */
  readPackageJson(): Promise<Record<string, any>>;
  /** Write package.json */
  writePackageJson(pkg: Record<string, any>): Promise<void>;
}

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks {
  /**
   * Called when plugin is loaded
   * Use for initialization and validation
   */
  init?(ctx: PluginContext): Promise<void> | void;

  /**
   * Called before build starts
   * Use to modify build configuration
   */
  buildStart?(ctx: PluginContext, buildConfig: BuildConfig): Promise<void> | void;

  /**
   * Called during build to transform code
   */
  transform?(
    ctx: PluginContext,
    code: string,
    id: string
  ): Promise<TransformResult | null> | TransformResult | null;

  /**
   * Called after build completes
   */
  buildEnd?(ctx: PluginContext, result: BuildResult): Promise<void> | void;

  /**
   * Called when dev server starts
   */
  devServerStart?(ctx: PluginContext, server: ViteDevServer): Promise<void> | void;

  /**
   * Called when dev server receives a request
   */
  devServerRequest?(
    ctx: PluginContext,
    req: Request,
    res: Response
  ): Promise<void | Response> | void | Response;

  /**
   * Called when file changes in dev mode
   */
  fileChange?(ctx: PluginContext, file: string): Promise<void> | void;

  /**
   * Called before serving production build
   */
  serveStart?(ctx: PluginContext): Promise<void> | void;

  /**
   * Called before running tests
   */
  testStart?(ctx: PluginContext): Promise<void> | void;

  /**
   * Called before deployment
   */
  deployStart?(ctx: PluginContext, target: string): Promise<void> | void;

  /**
   * Called when plugin is unloaded
   */
  cleanup?(ctx: PluginContext): Promise<void> | void;
}

/**
 * Build configuration
 */
export interface BuildConfig {
  entry: string;
  outDir: string;
  minify: boolean;
  sourcemap: boolean;
  target: string;
  format: "esm" | "cjs" | "iife";
  splitting: boolean;
  rollupOptions?: Partial<RollupOptions>;
  vitePlugins?: VitePlugin[];
}

/**
 * Transform result
 */
export interface TransformResult {
  code: string;
  map?: object;
}

/**
 * Build result
 */
export interface BuildResult {
  success: boolean;
  duration: number;
  outputs: BuildOutput[];
  errors?: Error[];
  warnings?: string[];
}

/**
 * Build output
 */
export interface BuildOutput {
  path: string;
  size: number;
  type: "js" | "css" | "asset";
}

/**
 * Plugin metadata
 */
export interface PluginMetadata {
  /** Plugin name (must be unique) */
  name: string;
  /** Plugin version (semver) */
  version: string;
  /** Plugin description */
  description?: string;
  /** Plugin author */
  author?: string;
  /** Plugin homepage URL */
  homepage?: string;
  /** Plugin repository URL */
  repository?: string;
  /** Plugin license */
  license?: string;
  /** Plugin keywords */
  keywords?: string[];
  /** PhilJS version compatibility (semver range) */
  philjs?: string;
  /** Plugin dependencies (other plugins) */
  dependencies?: Record<string, string>;
  /** Plugin peer dependencies */
  peerDependencies?: Record<string, string>;
}

/**
 * Plugin configuration schema
 */
export interface PluginConfigSchema {
  type: "object" | "string" | "number" | "boolean" | "array";
  properties?: Record<string, PluginConfigSchema>;
  items?: PluginConfigSchema;
  required?: string[];
  default?: any;
  description?: string;
  enum?: any[];
}

/**
 * Main plugin interface
 */
export interface Plugin {
  /** Plugin metadata */
  meta: PluginMetadata;

  /** Plugin configuration schema */
  configSchema?: PluginConfigSchema;

  /** Plugin lifecycle hooks */
  hooks?: PluginHooks;

  /**
   * Vite plugin integration
   * Return a Vite plugin for build pipeline integration
   */
  vitePlugin?(config: any): VitePlugin | VitePlugin[];

  /**
   * Rollup plugin integration
   * Return a Rollup plugin for custom build transformations
   */
  rollupPlugin?(config: any): any;

  /**
   * Setup function called with user configuration
   */
  setup?(config: any, ctx: PluginContext): Promise<void> | void;
}

/**
 * Plugin factory function type
 */
export type PluginFactory<T = any> = (options?: T) => Plugin;

/**
 * Plugin manager for loading and managing plugins
 */
export class PluginManager {
  private plugins = new Map<string, Plugin>();
  private contexts = new Map<string, PluginContext>();
  private initialized = false;

  constructor(private baseContext: Partial<PluginContext> = {}) {}

  /**
   * Register a plugin
   */
  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.meta.name)) {
      throw new Error(`Plugin "${plugin.meta.name}" is already registered`);
    }

    // Validate plugin metadata
    this.validatePlugin(plugin);

    // Check dependencies
    this.checkDependencies(plugin);

    this.plugins.set(plugin.meta.name, plugin);
  }

  /**
   * Unregister a plugin
   */
  async unregister(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) return;

    // Call cleanup hook
    const ctx = this.contexts.get(name);
    if (ctx && plugin.hooks?.cleanup) {
      await plugin.hooks.cleanup(ctx);
    }

    this.plugins.delete(name);
    this.contexts.delete(name);
  }

  /**
   * Initialize all plugins
   */
  async initialize(context: PluginContext): Promise<void> {
    if (this.initialized) {
      throw new Error("Plugins already initialized");
    }

    // Sort plugins by dependencies
    const sorted = this.topologicalSort();

    // Initialize each plugin
    for (const name of sorted) {
      const plugin = this.plugins.get(name)!;
      const ctx = this.createContext(plugin, context);
      this.contexts.set(name, ctx);

      // Call setup
      if (plugin.setup) {
        await plugin.setup(context.config[name] || {}, ctx);
      }

      // Call init hook
      if (plugin.hooks?.init) {
        await plugin.hooks.init(ctx);
      }
    }

    this.initialized = true;
  }

  /**
   * Call a hook on all plugins
   */
  async callHook<K extends keyof PluginHooks>(
    hook: K,
    ...args: Parameters<NonNullable<PluginHooks[K]>>
  ): Promise<void> {
    for (const [name, plugin] of this.plugins) {
      const hookFn = plugin.hooks?.[hook];
      if (hookFn) {
        const ctx = this.contexts.get(name)!;
        // @ts-ignore - complex type inference
        await hookFn(ctx, ...args.slice(1));
      }
    }
  }

  /**
   * Call transform hook on all plugins
   */
  async transform(code: string, id: string): Promise<string> {
    let result = code;

    for (const [name, plugin] of this.plugins) {
      if (plugin.hooks?.transform) {
        const ctx = this.contexts.get(name)!;
        const transformed = await plugin.hooks.transform(ctx, result, id);
        if (transformed) {
          result = transformed.code;
        }
      }
    }

    return result;
  }

  /**
   * Get all registered plugins
   */
  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugin by name
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * Get all Vite plugins from registered plugins
   */
  getVitePlugins(config: any): VitePlugin[] {
    const vitePlugins: VitePlugin[] = [];

    for (const [name, plugin] of this.plugins) {
      if (plugin.vitePlugin) {
        const pluginConfig = config[name] || {};
        const result = plugin.vitePlugin(pluginConfig);
        if (Array.isArray(result)) {
          vitePlugins.push(...result);
        } else {
          vitePlugins.push(result);
        }
      }
    }

    return vitePlugins;
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: Plugin): void {
    if (!plugin.meta?.name) {
      throw new Error("Plugin must have a name");
    }

    if (!plugin.meta?.version) {
      throw new Error(`Plugin "${plugin.meta.name}" must have a version`);
    }

    // Validate semver
    if (!/^\d+\.\d+\.\d+/.test(plugin.meta.version)) {
      throw new Error(`Plugin "${plugin.meta.name}" version must be valid semver`);
    }
  }

  /**
   * Check plugin dependencies
   */
  private checkDependencies(plugin: Plugin): void {
    if (!plugin.meta.dependencies) return;

    for (const [depName, depVersion] of Object.entries(plugin.meta.dependencies)) {
      const dep = this.plugins.get(depName);
      if (!dep) {
        throw new Error(
          `Plugin "${plugin.meta.name}" depends on "${depName}" which is not registered`
        );
      }

      // Simple version check (can be enhanced with semver)
      if (dep.meta.version !== depVersion && !depVersion.includes("*")) {
        console.warn(
          `Warning: Plugin "${plugin.meta.name}" expects "${depName}@${depVersion}" but got "${dep.meta.version}"`
        );
      }
    }
  }

  /**
   * Topological sort for dependency resolution
   */
  private topologicalSort(): string[] {
    const sorted: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (name: string): void => {
      if (visited.has(name)) return;
      if (visiting.has(name)) {
        throw new Error(`Circular dependency detected involving plugin "${name}"`);
      }

      visiting.add(name);

      const plugin = this.plugins.get(name)!;
      if (plugin.meta.dependencies) {
        for (const depName of Object.keys(plugin.meta.dependencies)) {
          visit(depName);
        }
      }

      visiting.delete(name);
      visited.add(name);
      sorted.push(name);
    };

    for (const name of this.plugins.keys()) {
      visit(name);
    }

    return sorted;
  }

  /**
   * Create plugin context
   */
  private createContext(plugin: Plugin, baseCtx: PluginContext): PluginContext {
    return {
      ...baseCtx,
      logger: this.createLogger(plugin.meta.name, baseCtx.logger),
    };
  }

  /**
   * Create namespaced logger
   */
  private createLogger(pluginName: string, baseLogger: PluginLogger): PluginLogger {
    const prefix = `[${pluginName}]`;
    return {
      info: (msg, ...args) => baseLogger.info(`${prefix} ${msg}`, ...args),
      warn: (msg, ...args) => baseLogger.warn(`${prefix} ${msg}`, ...args),
      error: (msg, ...args) => baseLogger.error(`${prefix} ${msg}`, ...args),
      debug: (msg, ...args) => baseLogger.debug(`${prefix} ${msg}`, ...args),
      success: (msg, ...args) => baseLogger.success(`${prefix} ${msg}`, ...args),
    };
  }
}

/**
 * Plugin composition helper
 * Allows combining multiple plugins into one
 */
export function composePlugins(plugins: Plugin[]): Plugin {
  const firstPlugin = plugins[0];

  return {
    meta: {
      name: `${firstPlugin.meta.name}-composed`,
      version: firstPlugin.meta.version,
      description: `Composed plugin: ${plugins.map((p) => p.meta.name).join(", ")}`,
    },
    hooks: {
      async init(ctx) {
        for (const plugin of plugins) {
          await plugin.hooks?.init?.(ctx);
        }
      },
      async buildStart(ctx, config) {
        for (const plugin of plugins) {
          await plugin.hooks?.buildStart?.(ctx, config);
        }
      },
      async transform(ctx, code, id) {
        let result = code;
        for (const plugin of plugins) {
          const transformed = await plugin.hooks?.transform?.(ctx, result, id);
          if (transformed) result = transformed.code;
        }
        return result ? { code: result } : null;
      },
      async buildEnd(ctx, result) {
        for (const plugin of plugins) {
          await plugin.hooks?.buildEnd?.(ctx, result);
        }
      },
      async cleanup(ctx) {
        for (const plugin of plugins) {
          await plugin.hooks?.cleanup?.(ctx);
        }
      },
    },
  };
}

/**
 * Helper to define a plugin
 */
export function definePlugin<T = any>(factory: PluginFactory<T>): PluginFactory<T> {
  return factory;
}

/**
 * Create a simple plugin
 */
export function createPlugin(meta: PluginMetadata, hooks: PluginHooks): Plugin {
  return { meta, hooks };
}

/**
 * Plugin preset - a collection of plugins
 */
export interface PluginPreset {
  name: string;
  description?: string;
  plugins: Plugin[];
}

/**
 * Define a plugin preset
 */
export function definePreset(name: string, plugins: Plugin[]): PluginPreset {
  return {
    name,
    plugins,
  };
}
