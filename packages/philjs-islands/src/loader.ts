/**
 * Island Loader - Dynamic loading and hydration orchestration
 */

import type {
  IslandConfig,
  IslandInstance,
  LoaderConfig,
  IslandLifecycle,
  HydrationStrategy
} from './types.js';
import { getRegistry } from './registry.js';

/**
 * Island Loader - orchestrates loading and hydration of islands
 */
export class IslandLoader {
  private _config: LoaderConfig;
  private _lifecycle: IslandLifecycle;
  private _debug: boolean;

  constructor(config: LoaderConfig = {}) {
    this._config = config;
    this._lifecycle = config.lifecycle || {};
    this._debug = config.debug || false;
  }

  /**
   * Register multiple islands at once
   */
  registerAll(configs: IslandConfig[]): void {
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
  register(config: IslandConfig): void {
    this.registerAll([config]);
  }

  /**
   * Lazy load and register an island from a dynamic import
   */
  async registerLazy(
    name: string,
    loader: () => Promise<{ default: IslandConfig['component'] }>,
    options?: Partial<Omit<IslandConfig, 'name' | 'component'>>
  ): Promise<void> {
    const registry = getRegistry();

    // Register with a lazy wrapper
    registry.register({
      name,
      strategy: options?.strategy || this._config.defaultStrategy || 'visible',
      ...options,
      component: async () => {
        const module = await loader();
        const Component = module.default;

        if (typeof Component === 'function' && Component.prototype?.mount) {
          return new Component();
        }

        if (typeof Component === 'function') {
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
  async scanAndHydrate(root: HTMLElement | Document = document): Promise<void> {
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
  async hydrateAll(root: HTMLElement | Document = document): Promise<void> {
    const islands = root.querySelectorAll('phil-island:not([data-hydrated])');

    const promises = Array.from(islands).map(async (island) => {
      const instance = (island as any)._instance as IslandInstance | undefined;
      if (instance) {
        if (this._lifecycle.onBeforeHydrate) {
          await this._lifecycle.onBeforeHydrate(instance);
        }

        try {
          await instance.hydrate();
          this._lifecycle.onHydrated?.(instance);
        } catch (error) {
          this._lifecycle.onError?.(instance, error as Error);
        }
      }
    });

    await Promise.all(promises);
    this._log(`Force hydrated ${islands.length} islands`);
  }

  /**
   * Preload an island's component without hydrating
   */
  async preload(name: string): Promise<void> {
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
        await (config.component as () => Promise<unknown>)();
        this._log(`Preloaded island: ${name}`);
      }
    }
  }

  /**
   * Preload multiple islands
   */
  async preloadAll(names: string[]): Promise<void> {
    await Promise.all(names.map(name => this.preload(name)));
  }

  private _log(message: string): void {
    if (this._debug) {
      console.log(`[PhilJS Islands] ${message}`);
    }
  }
}

/**
 * Create an island loader with configuration
 */
export function createIslandLoader(config?: LoaderConfig): IslandLoader {
  return new IslandLoader(config);
}
