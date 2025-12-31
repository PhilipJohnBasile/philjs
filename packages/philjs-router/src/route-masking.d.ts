/**
 * Route Masking for PhilJS Router.
 * Allows displaying a different URL in the browser than the actual route being rendered.
 * Useful for modals, drawers, and parallel routes.
 *
 * @example
 * ```tsx
 * // Show /photos/123 in URL, but render /photos modal
 * navigate('/photos', {
 *   maskAs: '/photos/123',
 *   state: { photoId: '123', modal: true }
 * });
 *
 * // Show /settings in URL, but render /settings/profile
 * navigate('/settings/profile', { maskAs: '/settings' });
 * ```
 */
/**
 * Route mask configuration.
 */
export type RouteMask = {
    /** The actual route being rendered */
    actualRoute: string;
    /** The URL displayed in the browser */
    maskedUrl: string;
    /** Additional state for the masked route */
    state?: Record<string, unknown>;
    /** Timestamp when mask was created */
    timestamp: number;
    /** Whether to preserve the mask on navigation */
    preserve?: boolean;
};
/**
 * Navigation options with masking support.
 */
export type MaskedNavigationOptions = {
    /** Whether to replace current history entry */
    replace?: boolean;
    /** State to pass with navigation */
    state?: Record<string, unknown>;
    /** URL to display in browser (different from actual route) */
    maskAs?: string;
    /** Whether to preserve the mask on subsequent navigations */
    preserveMask?: boolean;
    /** Scroll restoration behavior */
    scroll?: boolean | {
        top: number;
        left: number;
    };
};
/**
 * Mask stack entry for nested masking.
 */
export type MaskStackEntry = {
    /** Unique ID for this mask */
    id: string;
    /** The mask configuration */
    mask: RouteMask;
    /** Parent mask ID if nested */
    parentId?: string;
};
/**
 * Mask matching strategy.
 */
export type MaskMatchStrategy = "exact" | "prefix" | "pattern";
/**
 * Mask restoration options.
 */
export type MaskRestoreOptions = {
    /** Whether to restore on browser back/forward */
    onPopState?: boolean;
    /** Whether to restore from history state */
    fromHistory?: boolean;
    /** Maximum age of mask in ms to restore */
    maxAge?: number;
};
/**
 * Configuration for route masking.
 */
declare const maskConfigSignal: any;
/**
 * Initialize route masking.
 */
export declare function initRouteMasking(config?: {
    enabled?: boolean;
    defaultPreserve?: boolean;
    maxStackDepth?: number;
    maxHistorySize?: number;
    restoreOptions?: Partial<MaskRestoreOptions>;
}): void;
/**
 * Create a route mask.
 */
export declare function createRouteMask(actualRoute: string, maskedUrl: string, options?: {
    state?: Record<string, unknown>;
    preserve?: boolean;
}): RouteMask;
/**
 * Apply a route mask.
 */
export declare function applyRouteMask(mask: RouteMask, options?: {
    push?: boolean;
    nested?: boolean;
}): void;
/**
 * Remove the current route mask.
 */
export declare function removeRouteMask(options?: {
    restoreUrl?: boolean;
    pop?: boolean;
}): void;
/**
 * Get the current route mask.
 */
export declare function getCurrentMask(): RouteMask | null;
/**
 * Check if a route is currently masked.
 */
export declare function isRouteMasked(): boolean;
/**
 * Get the actual route being rendered (unmask).
 */
export declare function getActualRoute(): string | null;
/**
 * Get the masked URL being displayed.
 */
export declare function getMaskedUrl(): string | null;
/**
 * Navigate with route masking.
 */
export declare function navigateWithMask(actualRoute: string, options?: MaskedNavigationOptions): void;
/**
 * Navigate and show as modal (common use case).
 */
export declare function navigateAsModal(modalRoute: string, options?: {
    backgroundRoute?: string;
    state?: Record<string, unknown>;
}): void;
/**
 * Navigate and show as drawer (common use case).
 */
export declare function navigateAsDrawer(drawerRoute: string, options?: {
    backgroundRoute?: string;
    state?: Record<string, unknown>;
    side?: "left" | "right" | "top" | "bottom";
}): void;
/**
 * Close modal/drawer and restore original route.
 */
export declare function closeOverlay(options?: {
    navigate?: boolean;
}): void;
/**
 * Push a new mask onto the stack.
 */
export declare function pushMask(mask: RouteMask): void;
/**
 * Pop the top mask from the stack.
 */
export declare function popMask(): RouteMask | null;
/**
 * Get the current mask stack.
 */
export declare function getMaskStack(): MaskStackEntry[];
/**
 * Get the stack depth.
 */
export declare function getMaskStackDepth(): number;
/**
 * Clear the entire mask stack.
 */
export declare function clearMaskStack(): void;
/**
 * Restore a mask from history.
 */
export declare function restoreMaskFromHistory(maskedUrl: string, options?: MaskRestoreOptions): boolean;
/**
 * Get mask from history.
 */
export declare function getMaskFromHistory(maskedUrl: string): RouteMask | null;
/**
 * Clear mask history.
 */
export declare function clearMaskHistory(): void;
/**
 * Check if a URL matches a mask pattern.
 */
export declare function matchesMask(url: string, pattern: string, strategy?: MaskMatchStrategy): boolean;
/**
 * Detect if current URL is masked by checking history state.
 */
export declare function detectMaskFromHistory(): RouteMask | null;
/**
 * Serialize a mask for storage.
 */
export declare function serializeMask(mask: RouteMask): string;
/**
 * Deserialize a mask from storage.
 */
export declare function deserializeMask(data: string): RouteMask | null;
/**
 * Check if route masking is enabled.
 */
export declare function isRouteMaskingEnabled(): boolean;
/**
 * Enable/disable route masking.
 */
export declare function setRouteMaskingEnabled(enabled: boolean): void;
/**
 * Get route masking configuration.
 */
export declare function getMaskConfig(): any;
/**
 * Update route masking configuration.
 */
export declare function updateMaskConfig(updates: Partial<ReturnType<typeof maskConfigSignal>>): void;
/**
 * Hook to get current mask.
 */
export declare function useRouteMask(): RouteMask | null;
/**
 * Hook to check if route is masked.
 */
export declare function useIsRouteMasked(): boolean;
/**
 * Hook to get actual route when masked.
 */
export declare function useActualRoute(): string | null;
/**
 * Hook to get masked URL.
 */
export declare function useMaskedUrl(): string | null;
/**
 * Hook to get mask state.
 */
export declare function useMaskState<T = Record<string, unknown>>(): T | null;
/**
 * Get debug information about current masks.
 */
export declare function getRouteMaskingDebugInfo(): {
    currentMask: any;
    stack: any;
    stackDepth: any;
    historySize: any;
    config: any;
    enabled: any;
};
/**
 * Export masking state for debugging.
 */
export declare function exportMaskingState(): string;
export {};
//# sourceMappingURL=route-masking.d.ts.map