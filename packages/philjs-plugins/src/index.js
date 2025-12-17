/**
 * PhilJS Plugin System
 *
 * Create and manage framework plugins for PhilJS applications.
 */
// Plugin registry
const installedPlugins = new Map();
const hooks = new Map();
const providers = new Map();
/**
 * Define a plugin
 */
export function definePlugin(plugin) {
    return plugin;
}
/**
 * Create a plugin with options
 */
export function createPlugin(factory) {
    return (options = {}) => factory(options);
}
/**
 * Install a plugin
 */
export async function installPlugin(plugin, app, config = {}) {
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
    const context = {
        app,
        config,
        options: config,
        hook(name, handler) {
            if (!hooks.has(name)) {
                hooks.set(name, new Set());
            }
            hooks.get(name).add(handler);
        },
        provide(key, value) {
            providers.set(key, value);
        },
        inject(key, defaultValue) {
            return providers.has(key) ? providers.get(key) : defaultValue;
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
export async function uninstallPlugin(name) {
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
export async function callHook(name, args) {
    const handlers = hooks.get(name);
    if (!handlers)
        return;
    for (const handler of handlers) {
        await handler(...args);
    }
}
/**
 * Get installed plugins
 */
export function getInstalledPlugins() {
    return Array.from(installedPlugins.values());
}
/**
 * Check if plugin is installed
 */
export function isPluginInstalled(name) {
    return installedPlugins.has(name);
}
/**
 * Get a provider value
 */
export function getProvider(key) {
    return providers.get(key);
}
// Re-export registry
export { PluginRegistry, fetchPluginInfo, searchPlugins } from './registry';
//# sourceMappingURL=index.js.map