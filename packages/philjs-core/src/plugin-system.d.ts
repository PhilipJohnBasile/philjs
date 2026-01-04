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
    exec(command: string, options?: {
        cwd?: string;
    }): Promise<{
        stdout: string;
        stderr: string;
    }>;
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
    transform?(ctx: PluginContext, code: string, id: string): Promise<TransformResult | null> | TransformResult | null;
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
    devServerRequest?(ctx: PluginContext, req: Request, res: Response): Promise<void | Response> | void | Response;
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
export declare class PluginManager {
    private baseContext;
    private plugins;
    private contexts;
    private initialized;
    constructor(baseContext?: Partial<PluginContext>);
    /**
     * Register a plugin
     */
    register(plugin: Plugin): void;
    /**
     * Unregister a plugin
     */
    unregister(name: string): Promise<void>;
    /**
     * Initialize all plugins
     */
    initialize(context: PluginContext): Promise<void>;
    /**
     * Call a hook on all plugins
     */
    callHook<K extends keyof PluginHooks>(hook: K, ...args: Parameters<NonNullable<PluginHooks[K]>>): Promise<void>;
    /**
     * Call transform hook on all plugins
     */
    transform(code: string, id: string): Promise<string>;
    /**
     * Get all registered plugins
     */
    getPlugins(): Plugin[];
    /**
     * Get plugin by name
     */
    getPlugin(name: string): Plugin | undefined;
    /**
     * Get all Vite plugins from registered plugins
     */
    getVitePlugins(config: any): VitePlugin[];
    /**
     * Validate plugin structure
     */
    private validatePlugin;
    /**
     * Check plugin dependencies
     */
    private checkDependencies;
    /**
     * Topological sort for dependency resolution
     */
    private topologicalSort;
    /**
     * Create plugin context
     */
    private createContext;
    /**
     * Create namespaced logger
     */
    private createLogger;
}
/**
 * Plugin composition helper
 * Allows combining multiple plugins into one
 */
export declare function composePlugins(plugins: Plugin[]): Plugin;
/**
 * Helper to define a plugin
 */
export declare function definePlugin<T = any>(factory: PluginFactory<T>): PluginFactory<T>;
/**
 * Create a simple plugin
 */
export declare function createPlugin(meta: PluginMetadata, hooks: PluginHooks): Plugin;
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
export declare function definePreset(name: string, plugins: Plugin[]): PluginPreset;
//# sourceMappingURL=plugin-system.d.ts.map