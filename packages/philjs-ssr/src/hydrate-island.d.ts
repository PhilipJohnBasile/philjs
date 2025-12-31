/**
 * Selective hydration runtime for interactive islands.
 * Only hydrates components that need interactivity.
 */
import type { VNode } from "philjs-core";
/**
 * Register a component for island hydration.
 */
export declare function registerIsland(name: string, component: (props: any) => VNode): void;
/**
 * Hydrate a specific island by ID.
 */
export declare function hydrateIsland(islandId: string): void;
/**
 * Hydrate all islands on the page.
 */
export declare function hydrateAllIslands(): void;
/**
 * Hydrate an island with Intersection Observer (lazy hydration).
 */
export declare function hydrateIslandOnVisible(islandId: string, options?: IntersectionObserverInit): void;
/**
 * Hydrate an island on interaction (idle hydration).
 */
export declare function hydrateIslandOnInteraction(islandId: string, events?: string[]): void;
/**
 * Hydrate an island when browser is idle.
 */
export declare function hydrateIslandOnIdle(islandId: string, timeout?: number): void;
/**
 * Hydration strategies enum.
 */
export declare enum HydrationStrategy {
    /** Hydrate immediately */
    EAGER = "eager",
    /** Hydrate when visible */
    VISIBLE = "visible",
    /** Hydrate on interaction */
    INTERACTION = "interaction",
    /** Hydrate when idle */
    IDLE = "idle"
}
/**
 * Auto-hydrate islands based on strategy.
 */
export declare function autoHydrateIslands(strategy?: HydrationStrategy): void;
/**
 * Preload island component (for critical islands).
 */
export declare function preloadIsland(componentName: string): void;
/**
 * Get island hydration status.
 */
export declare function getIslandStatus(islandId: string): {
    exists: boolean;
    hydrated: boolean;
};
/**
 * Clear all hydrated islands (for testing).
 */
export declare function clearIslands(): void;
//# sourceMappingURL=hydrate-island.d.ts.map