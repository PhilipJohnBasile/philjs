/**
 * Create PhilJS Plugin - Plugin SDK
 * Tools and utilities for building PhilJS plugins
 */
export interface PluginLogger {
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    debug: (message: string, ...args: any[]) => void;
    success: (message: string, ...args: any[]) => void;
}
export interface PluginFileSystem {
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    exists: (path: string) => Promise<boolean>;
    mkdir: (path: string, options?: {
        recursive?: boolean;
    }) => Promise<void>;
    readdir: (path: string) => Promise<string[]>;
    copy: (src: string, dest: string) => Promise<void>;
    remove: (path: string) => Promise<void>;
}
export interface PluginUtils {
    resolve: (...paths: string[]) => string;
    exec: (command: string) => Promise<{
        stdout: string;
        stderr: string;
    }>;
    getPackageManager: () => Promise<"npm" | "pnpm" | "yarn" | "bun">;
    installPackages: (packages: string[], dev?: boolean) => Promise<void>;
    readPackageJson: () => Promise<Record<string, any>>;
    writePackageJson: (pkg: Record<string, any>) => Promise<void>;
}
export interface PluginContext {
    version: string;
    root: string;
    mode: "development" | "production" | "test";
    config: Record<string, any>;
    logger: PluginLogger;
    fs: PluginFileSystem;
    utils: PluginUtils;
}
export interface PluginHooks {
    init?: (ctx: PluginContext) => Promise<void> | void;
    buildStart?: (ctx: PluginContext, config: any) => Promise<void> | void;
    transform?: (ctx: PluginContext, code: string, id: string) => Promise<{
        code: string;
        map?: any;
    } | null> | {
        code: string;
        map?: any;
    } | null;
    buildEnd?: (ctx: PluginContext, result: any) => Promise<void> | void;
    devServerStart?: (ctx: PluginContext, server: any) => Promise<void> | void;
    fileChange?: (ctx: PluginContext, file: string) => Promise<void> | void;
    serveStart?: (ctx: PluginContext) => Promise<void> | void;
    testStart?: (ctx: PluginContext) => Promise<void> | void;
    deployStart?: (ctx: PluginContext, target: string) => Promise<void> | void;
    cleanup?: (ctx: PluginContext) => Promise<void> | void;
}
export interface PluginMetadata {
    name: string;
    version: string;
    description?: string;
    author?: string;
    license?: string;
    keywords?: string[];
    repository?: string | {
        type: string;
        url: string;
    };
    homepage?: string;
    philjs?: string;
}
export interface PluginConfigSchema {
    type?: "object";
    properties?: Record<string, {
        type?: string;
        description?: string;
        default?: any;
        enum?: any[];
        required?: boolean;
    }>;
    required?: string[];
}
export interface Plugin {
    meta: PluginMetadata;
    configSchema?: PluginConfigSchema | undefined;
    setup?: ((config: any, ctx: PluginContext) => Promise<void> | void) | undefined;
    hooks?: PluginHooks;
    vitePlugin?: ((config: any) => any) | undefined;
}
export { createPlugin, type PluginOptions } from './generator.js';
export * from './template-engine.js';
/**
 * Plugin builder for easier plugin creation
 */
export declare class PluginBuilder {
    private plugin;
    /**
     * Set plugin metadata
     */
    meta(meta: Partial<Plugin["meta"]>): this;
    /**
     * Add lifecycle hook
     */
    hook<K extends keyof PluginHooks>(hookName: K, handler: PluginHooks[K]): this;
    /**
     * Add setup function
     */
    setup(handler: Plugin["setup"]): this;
    /**
     * Add Vite plugin integration
     */
    vitePlugin(handler: Plugin["vitePlugin"]): this;
    /**
     * Add config schema
     */
    configSchema(schema: Plugin["configSchema"]): this;
    /**
     * Build the plugin
     */
    build(): Plugin;
}
/**
 * Create a plugin builder
 */
export declare function createBuilder(): PluginBuilder;
/**
 * Plugin testing utilities
 */
export declare class PluginTester {
    private plugin;
    private mockContext;
    private files;
    constructor(plugin: Plugin);
    /**
     * Create mock plugin context
     */
    private createMockContext;
    /**
     * Test plugin setup
     */
    testSetup(config?: any): Promise<void>;
    /**
     * Test plugin hooks
     */
    testHook<K extends keyof PluginHooks>(hookName: K, ...args: Parameters<NonNullable<PluginHooks[K]>>): Promise<any>;
    /**
     * Get mock context for assertions
     */
    getContext(): PluginContext;
    /**
     * Set mock file
     */
    setFile(path: string, content: string): void;
    /**
     * Get mock file
     */
    getFile(path: string): Promise<string | undefined>;
}
/**
 * Create plugin tester
 */
export declare function createTester(plugin: Plugin): PluginTester;
/**
 * Plugin validation utilities
 */
export declare const pluginValidator: {
    /**
     * Validate plugin structure
     */
    validate(plugin: Plugin): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Validate config against schema
     */
    validateConfig(config: any, schema: Plugin["configSchema"]): {
        valid: boolean;
        errors: string[];
    };
};
/**
 * Plugin publishing utilities
 */
export declare const pluginPublisher: {
    /**
     * Generate package.json for plugin
     */
    generatePackageJson(plugin: Plugin): Record<string, any>;
    /**
     * Generate README.md for plugin
     */
    generateReadme(plugin: Plugin): string;
    /**
     * Generate configuration documentation
     */
    generateConfigDocs(schema: NonNullable<Plugin["configSchema"]>): string;
    /**
     * Generate tsconfig.json
     */
    generateTSConfig(): Record<string, any>;
};
/**
 * Plugin development helpers
 */
export declare const pluginHelpers: {
    /**
     * Create a logger that prefixes messages
     */
    createLogger(pluginName: string): {
        info: (msg: string, ...args: any[]) => void;
        warn: (msg: string, ...args: any[]) => void;
        error: (msg: string, ...args: any[]) => void;
        debug: (msg: string, ...args: any[]) => void;
        success: (msg: string, ...args: any[]) => void;
    };
    /**
     * Async retry utility
     */
    retry<T>(fn: () => Promise<T>, options?: {
        retries?: number;
        delay?: number;
    }): Promise<T>;
    /**
     * Debounce utility
     */
    debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void;
};
//# sourceMappingURL=index.d.ts.map