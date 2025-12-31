/**
 * PhilJS LiveView - Navigation
 *
 * Handles client-side navigation without full page reloads.
 * Supports live_patch (partial updates) and live_redirect (full navigation).
 */
import type { LiveNavigation, NavigationEvent } from './types.js';
interface NavigationState {
    currentPath: string;
    currentParams: URLSearchParams;
    history: string[];
    listeners: Set<(event: NavigationEvent) => void>;
}
/**
 * Navigate with a live patch (preserves socket connection, updates URL)
 */
export declare function livePatch(to: string, options?: {
    replace?: boolean;
}): void;
/**
 * Navigate with a live redirect (closes socket, opens new one)
 */
export declare function liveRedirect(to: string, options?: {
    replace?: boolean;
}): void;
/**
 * Handle link clicks for live navigation
 */
export declare function handleLinkClick(event: MouseEvent): void;
/**
 * Handle browser back/forward
 */
export declare function handlePopState(event: PopStateEvent): void;
/**
 * Add navigation listener
 */
export declare function onNavigate(callback: (event: NavigationEvent) => void): () => void;
/**
 * Initialize navigation handling
 */
export declare function initNavigation(): () => void;
/**
 * Get current navigation state
 */
export declare function getNavigation(): LiveNavigation;
/**
 * Parse URL path and extract params
 */
export declare function parseUrl(url: string): {
    path: string;
    params: URLSearchParams;
    hash: string;
};
/**
 * Build URL from path and params
 */
export declare function buildUrl(path: string, params?: Record<string, string | string[] | undefined>): string;
/**
 * Update URL params while preserving others
 */
export declare function updateParams(params: Record<string, string | undefined>): string;
interface ScrollPosition {
    x: number;
    y: number;
}
/**
 * Save current scroll position
 */
export declare function saveScrollPosition(key?: string): void;
/**
 * Restore scroll position
 */
export declare function restoreScrollPosition(key?: string): void;
/**
 * Scroll to element by ID or to top
 */
export declare function scrollToTarget(hash?: string): void;
/**
 * Update page title
 */
export declare function setPageTitle(title: string, prefix?: string, suffix?: string): void;
/**
 * Set loading state
 */
export declare function setLoading(loading: boolean, target?: string): void;
/**
 * Subscribe to loading state changes
 */
export declare function onLoading(callback: (loading: boolean) => void): () => void;
/**
 * Check if currently loading
 */
export declare function isLoading(): boolean;
export type { NavigationState, ScrollPosition };
//# sourceMappingURL=navigation.d.ts.map