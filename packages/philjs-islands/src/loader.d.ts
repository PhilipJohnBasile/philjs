/**
 * Island Loader - Dynamic loading and hydration orchestration
 */
import type { IslandConfig, LoaderConfig } from './types.js';
/**
 * Island Loader - orchestrates loading and hydration of islands
 */
export declare class IslandLoader {
    private _config;
    private _lifecycle;
    private _debug;
    constructor(config?: LoaderConfig);
    /**
     * Register multiple islands at once
     */
    registerAll(configs: IslandConfig[]): void;
    /**
     * Register a single island
     */
    register(config: IslandConfig): void;
    /**
     * Lazy load and register an island from a dynamic import
     */
    registerLazy(name: string, loader: () => Promise<{
        default: IslandConfig['component'];
    }>, options?: Partial<Omit<IslandConfig, 'name' | 'component'>>): Promise<void>;
    /**
     * Scan DOM and hydrate all islands based on their strategies
     */
    scanAndHydrate(root?: HTMLElement | Document): Promise<void>;
    /**
     * Force hydrate all pending islands immediately
     */
    hydrateAll(root?: HTMLElement | Document): Promise<void>;
    /**
     * Preload an island's component without hydrating
     */
    preload(name: string): Promise<void>;
    /**
     * Preload multiple islands
     */
    preloadAll(names: string[]): Promise<void>;
    private _log;
}
/**
 * Create an island loader with configuration
 */
export declare function createIslandLoader(config?: LoaderConfig): IslandLoader;
//# sourceMappingURL=loader.d.ts.map