/**
 * PhilJS Plugin System
 * Comprehensive plugin architecture with lifecycle hooks and type safety
 */
/**
 * Plugin manager for loading and managing plugins
 */
export class PluginManager {
    baseContext;
    plugins = new Map();
    contexts = new Map();
    initialized = false;
    constructor(baseContext = {}) {
        this.baseContext = baseContext;
    }
    /**
     * Register a plugin
     */
    register(plugin) {
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
    async unregister(name) {
        const plugin = this.plugins.get(name);
        if (!plugin)
            return;
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
    async initialize(context) {
        if (this.initialized) {
            throw new Error("Plugins already initialized");
        }
        // Sort plugins by dependencies
        const sorted = this.topologicalSort();
        // Initialize each plugin
        for (const name of sorted) {
            const plugin = this.plugins.get(name);
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
    async callHook(hook, ...args) {
        for (const [name, plugin] of this.plugins) {
            const hookFn = plugin.hooks?.[hook];
            if (hookFn) {
                const ctx = this.contexts.get(name);
                // @ts-ignore - complex type inference
                await hookFn(ctx, ...args.slice(1));
            }
        }
    }
    /**
     * Call transform hook on all plugins
     */
    async transform(code, id) {
        let result = code;
        for (const [name, plugin] of this.plugins) {
            if (plugin.hooks?.transform) {
                const ctx = this.contexts.get(name);
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
    getPlugins() {
        return Array.from(this.plugins.values());
    }
    /**
     * Get plugin by name
     */
    getPlugin(name) {
        return this.plugins.get(name);
    }
    /**
     * Get all Vite plugins from registered plugins
     */
    getVitePlugins(config) {
        const vitePlugins = [];
        for (const [name, plugin] of this.plugins) {
            if (plugin.vitePlugin) {
                const pluginConfig = config[name] || {};
                const result = plugin.vitePlugin(pluginConfig);
                if (Array.isArray(result)) {
                    vitePlugins.push(...result);
                }
                else {
                    vitePlugins.push(result);
                }
            }
        }
        return vitePlugins;
    }
    /**
     * Validate plugin structure
     */
    validatePlugin(plugin) {
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
    checkDependencies(plugin) {
        if (!plugin.meta.dependencies)
            return;
        for (const [depName, depVersion] of Object.entries(plugin.meta.dependencies)) {
            const dep = this.plugins.get(depName);
            if (!dep) {
                throw new Error(`Plugin "${plugin.meta.name}" depends on "${depName}" which is not registered`);
            }
            // Simple version check (can be enhanced with semver)
            if (dep.meta.version !== depVersion && !depVersion.includes("*")) {
                console.warn(`Warning: Plugin "${plugin.meta.name}" expects "${depName}@${depVersion}" but got "${dep.meta.version}"`);
            }
        }
    }
    /**
     * Topological sort for dependency resolution
     */
    topologicalSort() {
        const sorted = [];
        const visited = new Set();
        const visiting = new Set();
        const visit = (name) => {
            if (visited.has(name))
                return;
            if (visiting.has(name)) {
                throw new Error(`Circular dependency detected involving plugin "${name}"`);
            }
            visiting.add(name);
            const plugin = this.plugins.get(name);
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
    createContext(plugin, baseCtx) {
        return {
            ...baseCtx,
            logger: this.createLogger(plugin.meta.name, baseCtx.logger),
        };
    }
    /**
     * Create namespaced logger
     */
    createLogger(pluginName, baseLogger) {
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
export function composePlugins(plugins) {
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
                    if (transformed)
                        result = transformed.code;
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
export function definePlugin(factory) {
    return factory;
}
/**
 * Create a simple plugin
 */
export function createPlugin(meta, hooks) {
    return { meta, hooks };
}
/**
 * Define a plugin preset
 */
export function definePreset(name, plugins) {
    return {
        name,
        plugins,
    };
}
//# sourceMappingURL=plugin-system.js.map