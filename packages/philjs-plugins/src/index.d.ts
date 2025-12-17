/**
 * PhilJS Plugin System
 *
 * Create and manage framework plugins for PhilJS applications.
 */
export interface Plugin {
    /** Unique plugin name */
    name: string;
    /** Plugin version */
    version: string;
    /** Plugin description */
    description?: string;
    /** Plugin author */
    author?: string;
    /** Plugin dependencies */
    dependencies?: string[];
    /** Setup function called when plugin is installed */
    setup: (context: PluginContext) => void | Promise<void>;
    /** Cleanup function called when plugin is uninstalled */
    cleanup?: () => void | Promise<void>;
}
export interface PluginContext {
    /** PhilJS app instance */
    app: PhilJSApp;
    /** Plugin configuration */
    config: Record<string, unknown>;
    /** Register a hook */
    hook: <T extends keyof PluginHooks>(name: T, handler: PluginHooks[T]) => void;
    /** Provide a value to the app */
    provide: <T>(key: string | symbol, value: T) => void;
    /** Inject a provided value */
    inject: <T>(key: string | symbol, defaultValue?: T) => T | undefined;
    /** Add routes */
    addRoute: (route: RouteDefinition) => void;
    /** Add middleware */
    addMiddleware: (middleware: Middleware) => void;
    /** Add server handler */
    addServerHandler: (handler: ServerHandler) => void;
    /** Get plugin options */
    options: Record<string, unknown>;
}
export interface PhilJSApp {
    /** App name */
    name: string;
    /** App version */
    version: string;
    /** Environment */
    env: 'development' | 'production' | 'test';
    /** Root directory */
    rootDir: string;
    /** Source directory */
    srcDir: string;
    /** Output directory */
    outDir: string;
}
export interface PluginHooks {
    /** Called during app build */
    'build:start': () => void | Promise<void>;
    'build:done': (result: BuildResult) => void | Promise<void>;
    /** Called during development */
    'dev:start': () => void | Promise<void>;
    'dev:hot-update': (modules: string[]) => void | Promise<void>;
    /** Called during rendering */
    'render:start': (context: RenderContext) => void | Promise<void>;
    'render:done': (html: string) => string | Promise<string>;
    /** Called for routes */
    'routes:extend': (routes: RouteDefinition[]) => RouteDefinition[];
    /** Called for server */
    'server:middleware': (req: Request, res: Response, next: () => void) => void | Promise<void>;
    /** Called on errors */
    'error:client': (error: Error) => void;
    'error:server': (error: Error) => void;
}
export interface BuildResult {
    success: boolean;
    duration: number;
    outputFiles: string[];
    errors: Error[];
    warnings: string[];
}
export interface RenderContext {
    url: string;
    route: string;
    params: Record<string, string>;
    query: Record<string, string>;
}
export interface RouteDefinition {
    path: string;
    component?: string;
    handler?: string;
    middleware?: string[];
    meta?: Record<string, unknown>;
}
export interface Middleware {
    name: string;
    handler: (req: Request, res: Response, next: () => void) => void | Promise<void>;
    order?: number;
}
export interface ServerHandler {
    route: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'ALL';
    handler: (req: Request, res: Response) => void | Promise<void>;
}
/**
 * Define a plugin
 */
export declare function definePlugin(plugin: Plugin): Plugin;
/**
 * Create a plugin with options
 */
export declare function createPlugin<T extends Record<string, unknown>>(factory: (options: T) => Plugin): (options?: T) => Plugin;
/**
 * Install a plugin
 */
export declare function installPlugin(plugin: Plugin, app: PhilJSApp, config?: Record<string, unknown>): Promise<void>;
/**
 * Uninstall a plugin
 */
export declare function uninstallPlugin(name: string): Promise<void>;
/**
 * Call a hook
 */
export declare function callHook<T extends keyof PluginHooks>(name: T, args: Parameters<PluginHooks[T]>): Promise<void>;
/**
 * Get installed plugins
 */
export declare function getInstalledPlugins(): Plugin[];
/**
 * Check if plugin is installed
 */
export declare function isPluginInstalled(name: string): boolean;
/**
 * Get a provider value
 */
export declare function getProvider<T>(key: string | symbol): T | undefined;
export { PluginRegistry, fetchPluginInfo, searchPlugins } from './registry';
//# sourceMappingURL=index.d.ts.map