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
import { signal } from "philjs-core";
// ============================================================================
// State Management
// ============================================================================
/**
 * Current active route mask.
 */
const currentMaskSignal = signal(null);
/**
 * Mask stack for nested masking (e.g., modal within modal).
 */
const maskStackSignal = signal([]);
/**
 * Mask history for restoration.
 */
const maskHistorySignal = signal(new Map());
/**
 * Configuration for route masking.
 */
const maskConfigSignal = signal({
    enabled: true,
    defaultPreserve: false,
    maxStackDepth: 10,
    maxHistorySize: 50,
    restoreOptions: {
        onPopState: true,
        fromHistory: true,
        maxAge: 30 * 60 * 1000, // 30 minutes
    },
});
// ============================================================================
// Public API
// ============================================================================
/**
 * Initialize route masking.
 */
export function initRouteMasking(config) {
    const currentConfig = maskConfigSignal();
    maskConfigSignal.set({
        ...currentConfig,
        ...config,
        restoreOptions: {
            ...currentConfig.restoreOptions,
            ...config?.restoreOptions,
        },
    });
    // Set up popstate listener for mask restoration
    if (typeof window !== "undefined" && currentConfig.restoreOptions.onPopState) {
        window.addEventListener("popstate", handlePopState);
    }
}
/**
 * Create a route mask.
 */
export function createRouteMask(actualRoute, maskedUrl, options) {
    const result = {
        actualRoute,
        maskedUrl,
        preserve: options?.preserve ?? maskConfigSignal().defaultPreserve,
        timestamp: Date.now(),
    };
    if (options?.state !== undefined) {
        result.state = options.state;
    }
    return result;
}
/**
 * Apply a route mask.
 */
export function applyRouteMask(mask, options) {
    const config = maskConfigSignal();
    if (!config.enabled) {
        console.warn("[RouteMasking] Route masking is disabled");
        return;
    }
    // Handle nested masking
    if (options?.nested) {
        const stack = maskStackSignal();
        const currentMask = currentMaskSignal();
        if (stack.length >= config.maxStackDepth) {
            console.warn(`[RouteMasking] Max mask stack depth (${config.maxStackDepth}) reached`);
            return;
        }
        const parentId = currentMask
            ? stack[stack.length - 1]?.id
            : undefined;
        const entry = {
            id: generateMaskId(),
            mask,
        };
        if (parentId !== undefined) {
            entry.parentId = parentId;
        }
        maskStackSignal.set([...stack, entry]);
    }
    // Update current mask
    currentMaskSignal.set(mask);
    // Update browser URL without triggering navigation
    if (typeof window !== "undefined") {
        const url = new URL(mask.maskedUrl, window.location.origin);
        const method = options?.push ? "pushState" : "replaceState";
        window.history[method]({
            ...mask.state,
            __routeMask__: {
                actualRoute: mask.actualRoute,
                maskedUrl: mask.maskedUrl,
                timestamp: mask.timestamp,
            },
        }, "", url.toString());
        // Store in mask history
        storeMaskInHistory(mask);
    }
}
/**
 * Remove the current route mask.
 */
export function removeRouteMask(options) {
    const currentMask = currentMaskSignal();
    if (!currentMask)
        return;
    if (options?.pop) {
        // Pop from mask stack
        const stack = maskStackSignal();
        if (stack.length > 0) {
            const newStack = stack.slice(0, -1);
            maskStackSignal.set(newStack);
            // Restore parent mask if exists
            if (newStack.length > 0) {
                const parentMask = newStack[newStack.length - 1].mask;
                currentMaskSignal.set(parentMask);
                if (options?.restoreUrl && typeof window !== "undefined") {
                    const url = new URL(parentMask.maskedUrl, window.location.origin);
                    window.history.replaceState({ ...parentMask.state, __routeMask__: true }, "", url.toString());
                }
                return;
            }
        }
    }
    // Clear current mask
    currentMaskSignal.set(null);
    // Restore actual URL
    if (options?.restoreUrl && typeof window !== "undefined") {
        const url = new URL(currentMask.actualRoute, window.location.origin);
        window.history.replaceState({}, "", url.toString());
    }
}
/**
 * Get the current route mask.
 */
export function getCurrentMask() {
    return currentMaskSignal();
}
/**
 * Check if a route is currently masked.
 */
export function isRouteMasked() {
    return currentMaskSignal() !== null;
}
/**
 * Get the actual route being rendered (unmask).
 */
export function getActualRoute() {
    const mask = currentMaskSignal();
    return mask?.actualRoute ?? null;
}
/**
 * Get the masked URL being displayed.
 */
export function getMaskedUrl() {
    const mask = currentMaskSignal();
    return mask?.maskedUrl ?? null;
}
/**
 * Navigate with route masking.
 */
export function navigateWithMask(actualRoute, options) {
    const maskedUrl = options?.maskAs || actualRoute;
    const maskOptions = {};
    if (options?.state !== undefined) {
        maskOptions.state = options.state;
    }
    if (options?.preserveMask !== undefined) {
        maskOptions.preserve = options.preserveMask;
    }
    const mask = createRouteMask(actualRoute, maskedUrl, maskOptions);
    applyRouteMask(mask, {
        push: !options?.replace,
    });
    // Trigger actual navigation to the route
    if (typeof window !== "undefined") {
        const event = new CustomEvent("philjs:navigate", {
            detail: {
                url: actualRoute,
                masked: true,
                displayUrl: maskedUrl,
                state: options?.state,
            },
        });
        window.dispatchEvent(event);
    }
}
/**
 * Navigate and show as modal (common use case).
 */
export function navigateAsModal(modalRoute, options) {
    const backgroundRoute = options?.backgroundRoute || window.location.pathname;
    navigateWithMask(modalRoute, {
        maskAs: backgroundRoute,
        state: {
            ...options?.state,
            modal: true,
        },
        preserveMask: true,
    });
}
/**
 * Navigate and show as drawer (common use case).
 */
export function navigateAsDrawer(drawerRoute, options) {
    const backgroundRoute = options?.backgroundRoute || window.location.pathname;
    navigateWithMask(drawerRoute, {
        maskAs: backgroundRoute,
        state: {
            ...options?.state,
            drawer: true,
            drawerSide: options?.side || "right",
        },
        preserveMask: true,
    });
}
/**
 * Close modal/drawer and restore original route.
 */
export function closeOverlay(options) {
    const mask = currentMaskSignal();
    if (!mask)
        return;
    removeRouteMask({
        restoreUrl: true,
        pop: true,
    });
    if (options?.navigate && typeof window !== "undefined") {
        const event = new CustomEvent("philjs:navigate", {
            detail: {
                url: mask.actualRoute,
                masked: false,
            },
        });
        window.dispatchEvent(event);
    }
}
// ============================================================================
// Mask Stack Management
// ============================================================================
/**
 * Push a new mask onto the stack.
 */
export function pushMask(mask) {
    applyRouteMask(mask, {
        nested: true,
        push: true,
    });
}
/**
 * Pop the top mask from the stack.
 */
export function popMask() {
    const stack = maskStackSignal();
    if (stack.length === 0)
        return null;
    const popped = stack[stack.length - 1];
    removeRouteMask({
        restoreUrl: true,
        pop: true,
    });
    return popped.mask;
}
/**
 * Get the current mask stack.
 */
export function getMaskStack() {
    return maskStackSignal();
}
/**
 * Get the stack depth.
 */
export function getMaskStackDepth() {
    return maskStackSignal().length;
}
/**
 * Clear the entire mask stack.
 */
export function clearMaskStack() {
    maskStackSignal.set([]);
    currentMaskSignal.set(null);
}
// ============================================================================
// Mask History & Restoration
// ============================================================================
/**
 * Store a mask in history.
 */
function storeMaskInHistory(mask) {
    const history = maskHistorySignal();
    const config = maskConfigSignal();
    history.set(mask.maskedUrl, mask);
    // Trim history if too large
    if (history.size > config.maxHistorySize) {
        const entries = Array.from(history.entries());
        // Sort by timestamp and keep most recent
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        const trimmed = new Map(entries.slice(0, config.maxHistorySize));
        maskHistorySignal.set(trimmed);
    }
}
/**
 * Restore a mask from history.
 */
export function restoreMaskFromHistory(maskedUrl, options) {
    const history = maskHistorySignal();
    const mask = history.get(maskedUrl);
    if (!mask)
        return false;
    // Check if mask is too old
    const config = maskConfigSignal();
    const maxAge = options?.maxAge ?? config.restoreOptions.maxAge;
    if (maxAge && Date.now() - mask.timestamp > maxAge) {
        history.delete(maskedUrl);
        return false;
    }
    applyRouteMask(mask, {
        push: false,
    });
    return true;
}
/**
 * Get mask from history.
 */
export function getMaskFromHistory(maskedUrl) {
    return maskHistorySignal().get(maskedUrl) || null;
}
/**
 * Clear mask history.
 */
export function clearMaskHistory() {
    maskHistorySignal.set(new Map());
}
// ============================================================================
// Mask Matching & Detection
// ============================================================================
/**
 * Check if a URL matches a mask pattern.
 */
export function matchesMask(url, pattern, strategy = "exact") {
    switch (strategy) {
        case "exact":
            return url === pattern;
        case "prefix":
            return url.startsWith(pattern);
        case "pattern":
            // Simple pattern matching with wildcards
            const regex = new RegExp("^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
            return regex.test(url);
        default:
            return false;
    }
}
/**
 * Detect if current URL is masked by checking history state.
 */
export function detectMaskFromHistory() {
    if (typeof window === "undefined")
        return null;
    const state = window.history.state;
    if (state?.['__routeMask__']) {
        const routeMask = state['__routeMask__'];
        return {
            actualRoute: routeMask.actualRoute,
            maskedUrl: routeMask.maskedUrl,
            timestamp: routeMask.timestamp,
            state,
        };
    }
    return null;
}
/**
 * Restore mask on popstate.
 */
function handlePopState(_event) {
    const config = maskConfigSignal();
    if (!config.restoreOptions.onPopState)
        return;
    const detectedMask = detectMaskFromHistory();
    if (detectedMask) {
        currentMaskSignal.set(detectedMask);
    }
    else {
        // Clear mask if navigating to non-masked route
        removeRouteMask({ restoreUrl: false });
    }
}
// ============================================================================
// Utilities
// ============================================================================
/**
 * Generate a unique mask ID.
 */
function generateMaskId() {
    return `mask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Serialize a mask for storage.
 */
export function serializeMask(mask) {
    return JSON.stringify(mask);
}
/**
 * Deserialize a mask from storage.
 */
export function deserializeMask(data) {
    try {
        return JSON.parse(data);
    }
    catch {
        return null;
    }
}
/**
 * Check if route masking is enabled.
 */
export function isRouteMaskingEnabled() {
    return maskConfigSignal().enabled;
}
/**
 * Enable/disable route masking.
 */
export function setRouteMaskingEnabled(enabled) {
    const config = maskConfigSignal();
    maskConfigSignal.set({ ...config, enabled });
}
/**
 * Get route masking configuration.
 */
export function getMaskConfig() {
    return maskConfigSignal();
}
/**
 * Update route masking configuration.
 */
export function updateMaskConfig(updates) {
    const config = maskConfigSignal();
    maskConfigSignal.set({ ...config, ...updates });
}
// ============================================================================
// Hooks for Integration
// ============================================================================
/**
 * Hook to get current mask.
 */
export function useRouteMask() {
    return currentMaskSignal();
}
/**
 * Hook to check if route is masked.
 */
export function useIsRouteMasked() {
    return currentMaskSignal() !== null;
}
/**
 * Hook to get actual route when masked.
 */
export function useActualRoute() {
    const mask = currentMaskSignal();
    return mask?.actualRoute ?? null;
}
/**
 * Hook to get masked URL.
 */
export function useMaskedUrl() {
    const mask = currentMaskSignal();
    return mask?.maskedUrl ?? null;
}
/**
 * Hook to get mask state.
 */
export function useMaskState() {
    const mask = currentMaskSignal();
    return mask?.state ?? null;
}
// ============================================================================
// Debug & DevTools Integration
// ============================================================================
/**
 * Get debug information about current masks.
 */
export function getRouteMaskingDebugInfo() {
    return {
        currentMask: currentMaskSignal(),
        stack: maskStackSignal(),
        stackDepth: maskStackSignal().length,
        historySize: maskHistorySignal().size,
        config: maskConfigSignal(),
        enabled: maskConfigSignal().enabled,
    };
}
/**
 * Export masking state for debugging.
 */
export function exportMaskingState() {
    return JSON.stringify({
        currentMask: currentMaskSignal(),
        stack: maskStackSignal(),
        history: Array.from(maskHistorySignal().entries()),
        config: maskConfigSignal(),
    }, null, 2);
}
/**
 * Expose to window for debugging.
 */
if (typeof window !== "undefined") {
    window.__PHILJS_ROUTE_MASKING__ = {
        getCurrentMask,
        isRouteMasked,
        getActualRoute,
        getMaskedUrl,
        getMaskStack,
        getDebugInfo: getRouteMaskingDebugInfo,
        exportState: exportMaskingState,
    };
}
//# sourceMappingURL=route-masking.js.map