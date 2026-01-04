/**
 * Component search functionality
 */
import type { ComponentInfo } from './component-info.js';
/**
 * Show search box
 */
export declare function showSearchBox(onSelect: (component: ComponentInfo) => void): void;
/**
 * Hide search box
 */
export declare function hideSearchBox(): void;
/**
 * Check if search box is visible
 */
export declare function isSearchBoxVisible(): boolean;
/**
 * Filter components by criteria
 */
export declare function filterComponents(components: ComponentInfo[], criteria: {
    name?: string;
    isIsland?: boolean;
    isHydrated?: boolean;
    hasProp?: string;
    hasSignal?: string;
}): ComponentInfo[];
/**
 * Get search statistics
 */
export declare function getSearchStats(components: ComponentInfo[]): {
    total: number;
    islands: number;
    hydrated: number;
    withSignals: number;
};
//# sourceMappingURL=search.d.ts.map