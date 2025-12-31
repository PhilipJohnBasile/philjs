/**
 * Island Loader - Dynamic loading and hydration orchestration
 */
import { getRegistry } from './registry.js';
/**
 * Island Loader - orchestrates loading and hydration of islands
 */
export class IslandLoader {
    _config;
    _lifecycle;
    _debug;
    constructor(config = {}) {
        this._config = config;
        this._lifecycle = config.lifecycle || {};
        this._debug = config.debug || false;
    }
    /**
     * Register multiple islands at once
     */
    registerAll(configs) {
        const registry = getRegistry();
        for (const config of configs) {
            const finalConfig = {
                ...config,
                strategy: config.strategy || this._config.defaultStrategy || 'visible'
            };
            registry.register(finalConfig);
            this._log(`Registered island: ${config.name}`);
        }
    }
    /**
     * Register a single island
     */
    register(config) {
        this.registerAll([config]);
    }
    /**
     * Lazy load and register an island from a dynamic import
     */
    async registerLazy(name, loader, options) {
        const registry = getRegistry();
        // Register with a lazy wrapper
        registry.register({
            name,
            strategy: options?.strategy || this._config.defaultStrategy || 'visible',
            ...options,
            component: async () => {
                const module = await loader();
                const Component = module.default;
                if (typeof Component === 'function') {
                    if (Component.prototype?.mount) {
                        return new Component();
                    }
                    return await Component();
                }
                throw new Error(`Invalid component export for island "${name}"`);
            }
        });
        this._log(`Registered lazy island: ${name}`);
    }
    /**
     * Scan DOM and hydrate all islands based on their strategies
     */
    async scanAndHydrate(root = document) {
        const islands = root.querySelectorAll('phil-island');
        this._log(`Found ${islands.length} islands to process`);
        // Islands will self-hydrate based on their strategy
        // This method is for explicit triggering if needed
        for (const island of islands) {
            const name = island.getAttribute('name');
            if (name && !island.hasAttribute('data-hydrated')) {
                this._log(`Processing island: ${name}`);
            }
        }
    }
    /**
     * Force hydrate all pending islands immediately
     */
    async hydrateAll(root = document) {
        const islands = root.querySelectorAll('phil-island:not([data-hydrated])');
        const promises = Array.from(islands).map(async (island) => {
            const instance = island._instance;
            if (instance) {
                if (this._lifecycle.onBeforeHydrate) {
                    await this._lifecycle.onBeforeHydrate(instance);
                }
                try {
                    await instance.hydrate();
                    this._lifecycle.onHydrated?.(instance);
                }
                catch (error) {
                    this._lifecycle.onError?.(instance, error);
                }
            }
        });
        await Promise.all(promises);
        this._log(`Force hydrated ${islands.length} islands`);
    }
    /**
     * Preload an island's component without hydrating
     */
    async preload(name) {
        const registry = getRegistry();
        const entry = registry.get(name);
        if (!entry) {
            console.warn(`[PhilJS Islands] Cannot preload unknown island: ${name}`);
            return;
        }
        const { config } = entry;
        // Trigger the component load
        if (typeof config.component === 'function') {
            if (!config.component.prototype?.mount) {
                // It's a factory, call it to preload
                await config.component();
                this._log(`Preloaded island: ${name}`);
            }
        }
    }
    /**
     * Preload multiple islands
     */
    async preloadAll(names) {
        await Promise.all(names.map(name => this.preload(name)));
    }
    _log(message) {
        if (this._debug) {
            console.log(`[PhilJS Islands] ${message}`);
        }
    }
}
/**
 * Create an island loader with configuration
 */
export function createIslandLoader(config) {
    return new IslandLoader(config);
}
//# sourceMappingURL=loader.js.map