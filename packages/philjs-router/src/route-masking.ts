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

import { signal } from "@philjs/core";

// ============================================================================
// Types
// ============================================================================

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
  scroll?: boolean | { top: number; left: number };
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

// ============================================================================
// State Management
// ============================================================================

/**
 * Current active route mask.
 */
const currentMaskSignal = signal<RouteMask | null>(null);

/**
 * Mask stack for nested masking (e.g., modal within modal).
 */
const maskStackSignal = signal<MaskStackEntry[]>([]);

/**
 * Mask history for restoration.
 */
const maskHistorySignal = signal<Map<string, RouteMask>>(new Map());

/**
 * Configuration for route masking.
 */
const maskConfigSignal = signal<{
  enabled: boolean;
  defaultPreserve: boolean;
  maxStackDepth: number;
  maxHistorySize: number;
  restoreOptions: MaskRestoreOptions;
}>({
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
export function initRouteMasking(config?: {
  enabled?: boolean;
  defaultPreserve?: boolean;
  maxStackDepth?: number;
  maxHistorySize?: number;
  restoreOptions?: Partial<MaskRestoreOptions>;
}): void {
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
export function createRouteMask(
  actualRoute: string,
  maskedUrl: string,
  options?: {
    state?: Record<string, unknown>;
    preserve?: boolean;
  }
): RouteMask {
  const result: RouteMask = {
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
export function applyRouteMask(
  mask: RouteMask,
  options?: {
    push?: boolean;
    nested?: boolean;
  }
): void {
  const config = maskConfigSignal();

  if (!config.enabled) {
    console.warn("[RouteMasking] Route masking is disabled");
    return;
  }

  // Handle nested masking
  if (options?.nested) {
    const stack = maskStackSignal();
    const currentMask = currentMaskSignal();
    const needsBaseEntry = Boolean(currentMask && stack.length === 0);
    const requiredSlots = needsBaseEntry ? 2 : 1;

    if (stack.length + requiredSlots > config.maxStackDepth) {
      console.warn(
        `[RouteMasking] Max mask stack depth (${config.maxStackDepth}) reached`
      );
      return;
    }

    const updatedStack = [...stack];
    if (needsBaseEntry && currentMask) {
      updatedStack.push({ id: generateMaskId(), mask: currentMask });
    }
    const parentId =
      updatedStack.length > 0 ? updatedStack[updatedStack.length - 1]!.id : undefined;

    const entry: MaskStackEntry = {
      id: generateMaskId(),
      mask,
    };
    if (parentId !== undefined) {
      entry.parentId = parentId;
    }

    maskStackSignal.set([...updatedStack, entry]);
  }

  // Update current mask
  currentMaskSignal.set(mask);

  // Update browser URL without triggering navigation
  if (typeof window !== "undefined") {
    const url = new URL(mask.maskedUrl, window.location.origin);
    const method = options?.push ? "pushState" : "replaceState";

    window.history[method](
      {
        ...mask.state,
        __routeMask__: {
          actualRoute: mask.actualRoute,
          maskedUrl: mask.maskedUrl,
          timestamp: mask.timestamp,
        },
      },
      "",
      url.toString()
    );

    // Store in mask history
    storeMaskInHistory(mask);
  }
}

/**
 * Remove the current route mask.
 */
export function removeRouteMask(options?: {
  restoreUrl?: boolean;
  pop?: boolean;
}): void {
  const currentMask = currentMaskSignal();

  if (!currentMask) return;

  if (options?.pop) {
    // Pop from mask stack
    const stack = maskStackSignal();
    if (stack.length > 0) {
      const newStack = stack.slice(0, -1);
      maskStackSignal.set(newStack);

      // Restore parent mask if exists
      if (newStack.length > 0) {
        const parentMask = newStack[newStack.length - 1]!.mask;
        currentMaskSignal.set(parentMask);

        if (options?.restoreUrl && typeof window !== "undefined") {
          const url = new URL(parentMask.maskedUrl, window.location.origin);
          window.history.replaceState(
            { ...parentMask.state, __routeMask__: true },
            "",
            url.toString()
          );
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
export function getCurrentMask(): RouteMask | null {
  return currentMaskSignal();
}

/**
 * Check if a route is currently masked.
 */
export function isRouteMasked(): boolean {
  return currentMaskSignal() !== null;
}

/**
 * Get the actual route being rendered (unmask).
 */
export function getActualRoute(): string | null {
  const mask = currentMaskSignal();
  return mask?.actualRoute ?? null;
}

/**
 * Get the masked URL being displayed.
 */
export function getMaskedUrl(): string | null {
  const mask = currentMaskSignal();
  return mask?.maskedUrl ?? null;
}

/**
 * Navigate with route masking.
 */
export function navigateWithMask(
  actualRoute: string,
  options?: MaskedNavigationOptions
): void {
  const maskedUrl = options?.maskAs || actualRoute;

  const maskOptions: { state?: Record<string, unknown>; preserve?: boolean } = {};
  if (options?.state !== undefined) {
    maskOptions.state = options.state;
  }
  if (options?.preserveMask !== undefined) {
    maskOptions.preserve = options.preserveMask;
  }

  const mask = createRouteMask(actualRoute, maskedUrl, maskOptions);

  applyRouteMask(mask, {
    push: !options?.replace,
    nested: Boolean(options?.preserveMask && currentMaskSignal()),
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
export function navigateAsModal(
  modalRoute: string,
  options?: {
    backgroundRoute?: string;
    state?: Record<string, unknown>;
  }
): void {
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
export function navigateAsDrawer(
  drawerRoute: string,
  options?: {
    backgroundRoute?: string;
    state?: Record<string, unknown>;
    side?: "left" | "right" | "top" | "bottom";
  }
): void {
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
export function closeOverlay(options?: { navigate?: boolean }): void {
  const mask = currentMaskSignal();

  if (!mask) return;

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
export function pushMask(mask: RouteMask): void {
  applyRouteMask(mask, {
    nested: true,
    push: true,
  });
}

/**
 * Pop the top mask from the stack.
 */
export function popMask(): RouteMask | null {
  const stack = maskStackSignal();

  if (stack.length === 0) return null;

  const popped = stack[stack.length - 1]!;
  removeRouteMask({
    restoreUrl: true,
    pop: true,
  });

  return popped.mask;
}

/**
 * Get the current mask stack.
 */
export function getMaskStack(): MaskStackEntry[] {
  return maskStackSignal();
}

/**
 * Get the stack depth.
 */
export function getMaskStackDepth(): number {
  return maskStackSignal().length;
}

/**
 * Clear the entire mask stack.
 */
export function clearMaskStack(): void {
  maskStackSignal.set([]);
  currentMaskSignal.set(null);
}

// ============================================================================
// Mask History & Restoration
// ============================================================================

/**
 * Store a mask in history.
 */
function storeMaskInHistory(mask: RouteMask): void {
  const history = maskHistorySignal();
  const config = maskConfigSignal();

  history.set(mask.maskedUrl, mask);

  // Trim history if too large
  if (history.size > config.maxHistorySize) {
    const entries = Array.from(history.entries());
    // Sort by timestamp and keep most recent
    entries.sort((a, b) => b[1]!.timestamp - a[1]!.timestamp);
    const trimmed = new Map(entries.slice(0, config.maxHistorySize));
    maskHistorySignal.set(trimmed);
  }
}

/**
 * Restore a mask from history.
 */
export function restoreMaskFromHistory(
  maskedUrl: string,
  options?: MaskRestoreOptions
): boolean {
  const history = maskHistorySignal();
  const mask = history.get(maskedUrl);

  if (!mask) return false;

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
export function getMaskFromHistory(maskedUrl: string): RouteMask | null {
  return maskHistorySignal().get(maskedUrl) || null;
}

/**
 * Clear mask history.
 */
export function clearMaskHistory(): void {
  maskHistorySignal.set(new Map());
}

// ============================================================================
// Mask Matching & Detection
// ============================================================================

/**
 * Check if a URL matches a mask pattern.
 */
export function matchesMask(
  url: string,
  pattern: string,
  strategy: MaskMatchStrategy = "exact"
): boolean {
  switch (strategy) {
    case "exact":
      return url === pattern;
    case "prefix":
      return url.startsWith(pattern);
    case "pattern":
      // Simple pattern matching with wildcards
      const regex = new RegExp(
        "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$"
      );
      return regex.test(url);
    default:
      return false;
  }
}

/**
 * Detect if current URL is masked by checking history state.
 */
export function detectMaskFromHistory(): RouteMask | null {
  if (typeof window === "undefined") return null;

  const state = window.history.state as Record<string, unknown> | null;

  if (state?.['__routeMask__']) {
    const routeMask = state['__routeMask__'] as {
      actualRoute: string;
      maskedUrl: string;
      timestamp: number;
    };
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
function handlePopState(_event: PopStateEvent): void {
  const config = maskConfigSignal();

  if (!config.restoreOptions.onPopState) return;

  const detectedMask = detectMaskFromHistory();

  if (detectedMask) {
    currentMaskSignal.set(detectedMask);
  } else {
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
function generateMaskId(): string {
  return `mask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Serialize a mask for storage.
 */
export function serializeMask(mask: RouteMask): string {
  return JSON.stringify(mask);
}

/**
 * Deserialize a mask from storage.
 */
export function deserializeMask(data: string): RouteMask | null {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Check if route masking is enabled.
 */
export function isRouteMaskingEnabled(): boolean {
  return maskConfigSignal().enabled;
}

/**
 * Enable/disable route masking.
 */
export function setRouteMaskingEnabled(enabled: boolean): void {
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
export function updateMaskConfig(
  updates: Partial<ReturnType<typeof maskConfigSignal>>
): void {
  const config = maskConfigSignal();
  maskConfigSignal.set({ ...config, ...updates });
}

// ============================================================================
// Hooks for Integration
// ============================================================================

/**
 * Hook to get current mask.
 */
export function useRouteMask(): RouteMask | null {
  return currentMaskSignal();
}

/**
 * Hook to check if route is masked.
 */
export function useIsRouteMasked(): boolean {
  return currentMaskSignal() !== null;
}

/**
 * Hook to get actual route when masked.
 */
export function useActualRoute(): string | null {
  const mask = currentMaskSignal();
  return mask?.actualRoute ?? null;
}

/**
 * Hook to get masked URL.
 */
export function useMaskedUrl(): string | null {
  const mask = currentMaskSignal();
  return mask?.maskedUrl ?? null;
}

/**
 * Hook to get mask state.
 */
export function useMaskState<T = Record<string, unknown>>(): T | null {
  const mask = currentMaskSignal();
  return (mask?.state as T) ?? null;
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
export function exportMaskingState(): string {
  return JSON.stringify(
    {
      currentMask: currentMaskSignal(),
      stack: maskStackSignal(),
      history: Array.from(maskHistorySignal().entries()),
      config: maskConfigSignal(),
    },
    null,
    2
  );
}

/**
 * Expose to window for debugging.
 */
if (typeof window !== "undefined") {
  (window as any).__PHILJS_ROUTE_MASKING__ = {
    getCurrentMask,
    isRouteMasked,
    getActualRoute,
    getMaskedUrl,
    getMaskStack,
    getDebugInfo: getRouteMaskingDebugInfo,
    exportState: exportMaskingState,
  };
}
