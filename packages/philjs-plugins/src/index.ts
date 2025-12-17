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

// Plugin registry
const installedPlugins = new Map<string, Plugin>();
const hooks = new Map<keyof PluginHooks, Set<Function>>();
const providers = new Map<string | symbol, unknown>();

/**
 * Define a plugin
 */
export function definePlugin(plugin: Plugin): Plugin {
  return plugin;
}

/**
 * Create a plugin with options
 */
export function createPlugin<T extends Record<string, unknown>>(
  factory: (options: T) => Plugin
): (options?: T) => Plugin {
  return (options = {} as T) => factory(options);
}

/**
 * Install a plugin
 */
export async function installPlugin(
  plugin: Plugin,
  app: PhilJSApp,
  config: Record<string, unknown> = {}
): Promise<void> {
  if (installedPlugins.has(plugin.name)) {
    console.warn(`Plugin "${plugin.name}" is already installed`);
    return;
  }

  // Check dependencies
  if (plugin.dependencies) {
    for (const dep of plugin.dependencies) {
      if (!installedPlugins.has(dep)) {
        throw new Error(`Plugin "${plugin.name}" requires "${dep}" to be installed first`);
      }
    }
  }

  const context: PluginContext = {
    app,
    config,
    options: config,
    hook(name, handler) {
      if (!hooks.has(name)) {
        hooks.set(name, new Set());
      }
      hooks.get(name)!.add(handler);
    },
    provide(key, value) {
      providers.set(key, value);
    },
    inject(key, defaultValue) {
      return providers.has(key) ? (providers.get(key) as any) : defaultValue;
    },
    addRoute(route) {
      callHook('routes:extend', [route]);
    },
    addMiddleware(middleware) {
      // Add to middleware stack
    },
    addServerHandler(handler) {
      // Add to server handlers
    },
  };

  await plugin.setup(context);
  installedPlugins.set(plugin.name, plugin);
  console.log(`Plugin "${plugin.name}" v${plugin.version} installed`);
}

/**
 * Uninstall a plugin
 */
export async function uninstallPlugin(name: string): Promise<void> {
  const plugin = installedPlugins.get(name);
  if (!plugin) {
    console.warn(`Plugin "${name}" is not installed`);
    return;
  }

  if (plugin.cleanup) {
    await plugin.cleanup();
  }

  installedPlugins.delete(name);
  console.log(`Plugin "${name}" uninstalled`);
}

/**
 * Call a hook
 */
export async function callHook<T extends keyof PluginHooks>(
  name: T,
  args: Parameters<PluginHooks[T]>
): Promise<void> {
  const handlers = hooks.get(name);
  if (!handlers) return;

  for (const handler of handlers) {
    await (handler as Function)(...args);
  }
}

/**
 * Get installed plugins
 */
export function getInstalledPlugins(): Plugin[] {
  return Array.from(installedPlugins.values());
}

/**
 * Check if plugin is installed
 */
export function isPluginInstalled(name: string): boolean {
  return installedPlugins.has(name);
}

/**
 * Get a provider value
 */
export function getProvider<T>(key: string | symbol): T | undefined {
  return providers.get(key) as T | undefined;
}

// Re-export registry
export { PluginRegistry, fetchPluginInfo, searchPlugins } from './registry';
