/**
 * Island component loader with automatic code splitting and performance optimizations.
 */
export type VNode = any;
export type IslandModule = {
    default: (props: any) => VNode;
};
export type IslandManifest = {
    [key: string]: {
        /** Import path for the island component */
        import: string;
        /** Props to pass to the component */
        props?: Record<string, any>;
        /** Hydration trigger: visible, idle, immediate, interaction, or media */
        trigger?: "visible" | "idle" | "immediate" | "interaction" | "media";
        /** Media query for media trigger */
        media?: string;
        /** Priority (0-10, higher = sooner) */
        priority?: number;
        /** Intersection observer options for visible trigger */
        observerOptions?: IntersectionObserverInit;
    };
};
/**
 * Register an island component loader.
 */
export declare function registerIsland(name: string, loader: () => Promise<IslandModule>): void;
/**
 * Load and hydrate an island component with performance optimizations.
 */
export declare function loadIsland(element: Element, manifest: IslandManifest): Promise<void>;
/**
 * Initialize islands with hydration strategies and priority queue.
 */
export declare function initIslands(manifest: IslandManifest): void;
/**
 * Create an island wrapper component for SSR.
 */
export declare function Island(props: {
    name: string;
    trigger?: "visible" | "idle" | "immediate" | "interaction" | "media";
    media?: string;
    priority?: number;
    props?: Record<string, any>;
    children: VNode;
    observerOptions?: IntersectionObserverInit;
}): VNode;
/**
 * Preload an island module without hydrating
 */
export declare function preloadIsland(name: string): Promise<IslandModule> | undefined;
/**
 * Prefetch islands that are likely to be needed
 */
export declare function prefetchIslands(names: string[]): void;
/**
 * Clear the module cache (useful for hot module replacement)
 */
export declare function clearModuleCache(): void;
/**
 * Get performance metrics for island loading
 */
export declare function getIslandMetrics(): {
    loadedIslands: number;
    cachedModules: number;
    measurements: PerformanceMeasure[];
};
/**
 * Cleanup performance marks for a specific island
 */
export declare function cleanupIslandMetrics(name: string): void;
//# sourceMappingURL=island-loader.d.ts.map