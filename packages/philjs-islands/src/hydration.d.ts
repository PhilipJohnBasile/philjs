/**
 * Hydration utilities for PhilJS Islands
 */
import type { HydrationStrategy } from './types.js';
/**
 * Hydrate a specific island element
 */
export declare function hydrateIsland(element: HTMLElement): Promise<void>;
/**
 * Hydrate all islands in a container
 */
export declare function hydrateAll(root?: HTMLElement | Document, options?: {
    concurrent?: boolean;
}): Promise<void>;
/**
 * Mount islands with attribute-based detection
 * Supports both <phil-island> elements and [data-island] attributes
 */
export declare function mountIslands(root?: HTMLElement | Document, options?: {
    attributeName?: string;
    defaultStrategy?: HydrationStrategy;
}): void;
/**
 * Wait for an island to be hydrated
 */
export declare function waitForHydration(element: HTMLElement): Promise<void>;
/**
 * Wait for all islands in a container to hydrate
 */
export declare function waitForAllHydration(root?: HTMLElement | Document): Promise<void[]>;
//# sourceMappingURL=hydration.d.ts.map