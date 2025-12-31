/**
 * Next.js 14 style Parallel Routes for PhilJS Router.
 * Enables rendering multiple pages in the same layout simultaneously.
 *
 * Features:
 * - @slot syntax (e.g., @modal, @sidebar, @main)
 * - Independent loading states per slot
 * - Conditional rendering based on route
 * - Slot-level error boundaries
 * - Route interception for modals
 * - Parallel data loading for all slots
 *
 * @example
 * ```tsx
 * // app/layout.tsx
 * export default function Layout({ children, modal, sidebar }: {
 *   children: React.ReactNode;
 *   modal?: React.ReactNode;
 *   sidebar?: React.ReactNode;
 * }) {
 *   return (
 *     <div>
 *       <nav>Navigation</nav>
 *       {sidebar}
 *       <main>{children}</main>
 *       {modal}
 *     </div>
 *   );
 * }
 *
 * // app/@modal/(.)photos/[id]/page.tsx - Intercepts /photos/[id] for modal
 * export default function PhotoModal({ params }) {
 *   return <Modal><PhotoDetail id={params.id} /></Modal>;
 * }
 *
 * // app/photos/[id]/page.tsx - Full page version
 * export default function PhotoPage({ params }) {
 *   return <PhotoDetail id={params.id} />;
 * }
 * ```
 */

import { signal } from "@philjs/core";
import type { JSXElement, VNode } from "@philjs/core";
import {
  executeNestedLoaders,
  setCurrentRouteData,
  type LoaderFunction,
  type LoaderFunctionContext,
} from "./loader.js";
import { setRouteError, type ErrorBoundaryComponent } from "./error-boundary.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Slot name (e.g., "@modal", "@sidebar", "@main")
 */
export type SlotName = string;

/**
 * Slot definition with route configuration.
 */
export type SlotDefinition = {
  /** Slot name (e.g., "@modal") */
  name: SlotName;
  /** Route path pattern */
  path: string;
  /** Slot ID for data access */
  id?: string;
  /** Component to render in this slot */
  component?: SlotComponent;
  /** Data loader for this slot */
  loader?: LoaderFunction;
  /** Error boundary for this slot */
  errorBoundary?: ErrorBoundaryComponent;
  /** Loading component for this slot */
  loadingComponent?: SlotComponent;
  /** Default fallback when no route matches */
  default?: SlotComponent;
  /** Whether this slot is optional */
  optional?: boolean;
  /** Child routes within this slot */
  children?: SlotDefinition[];
};

/**
 * Component type for slots.
 */
export type SlotComponent<Props = SlotComponentProps> = (
  props: Props
) => VNode | JSXElement | string | null | undefined;

/**
 * Props passed to slot components.
 */
export type SlotComponentProps = {
  /** Route parameters */
  params: Record<string, string>;
  /** URL search params */
  searchParams: URLSearchParams;
  /** Loader data for this slot */
  data?: unknown;
  /** Loader error for this slot */
  error?: Error;
  /** Child content */
  children?: VNode | JSXElement | string | null;
  /** Slot name */
  slotName: SlotName;
};

/**
 * Matched slot in the hierarchy.
 */
export type MatchedSlot = {
  /** Slot definition */
  slot: SlotDefinition;
  /** Extracted parameters */
  params: Record<string, string>;
  /** Full pathname matched */
  pathname: string;
  /** Slot ID */
  id: string;
  /** Loader data */
  data?: unknown;
  /** Loader error */
  error?: Error;
  /** Loading state */
  loading?: boolean;
};

/**
 * Route interception configuration.
 */
export type InterceptConfig = {
  /**
   * Interception type:
   * - (.) - Intercepts same level
   * - (..) - Intercepts one level up
   * - (..)(..) - Intercepts two levels up
   * - (...) - Intercepts from root
   */
  type: "(.)" | "(..)" | "(..)(..)" | "(...)";
  /** Target path to intercept */
  target: string;
};

/**
 * Parse interception from path.
 */
export function parseInterception(path: string): InterceptConfig | null {
  // Match interception patterns at the start of the path
  if (path.startsWith("(...)")) {
    return { type: "(...)", target: path.slice(5) };
  }
  if (path.startsWith("(..)(..)")) {
    return { type: "(..)(..)", target: path.slice(8) };
  }
  if (path.startsWith("(..)")) {
    return { type: "(..)", target: path.slice(4) };
  }
  if (path.startsWith("(.)")) {
    return { type: "(.)", target: path.slice(3) };
  }

  return null;
}

/**
 * Parallel route configuration.
 */
export type ParallelRouteConfig = {
  /** Base path for routing */
  basePath?: string;
  /** Slot definitions */
  slots: SlotDefinition[];
  /** Main content slot (default: "children") */
  mainSlot?: SlotName;
  /** Whether to enable soft navigation for intercepted routes */
  softNavigation?: boolean;
  /** Default error boundary */
  defaultErrorBoundary?: ErrorBoundaryComponent;
};

/**
 * Navigation mode for route interception.
 */
export type NavigationMode = "soft" | "hard";

/**
 * Navigation state for intercepted routes.
 */
export type InterceptedNavigationState = {
  /** Whether navigation is intercepted */
  intercepted: boolean;
  /** Original URL before interception */
  originalUrl?: string;
  /** Slot that intercepted the route */
  slotName?: SlotName;
  /** Navigation mode */
  mode: NavigationMode;
};

// ============================================================================
// State Management
// ============================================================================

/**
 * Current parallel route state.
 */
const parallelRouteState = signal<{
  /** Matched slots by slot name */
  slots: Map<SlotName, MatchedSlot>;
  /** Combined params from all slots */
  params: Record<string, string>;
  /** Navigation state */
  navigation: InterceptedNavigationState;
  /** Current pathname */
  pathname: string;
}>({
  slots: new Map(),
  params: {},
  navigation: { intercepted: false, mode: "hard" },
  pathname: "/",
});

/**
 * Slot context for hooks.
 */
const slotContextSignal = signal<{
  slotName: SlotName;
  data: unknown;
  error?: Error;
  loading?: boolean;
} | null>(null);

/**
 * Interception history stack.
 */
const interceptionHistory = signal<Array<{
  pathname: string;
  slotName: SlotName;
  timestamp: number;
}>>([]);

// ============================================================================
// Slot Matching
// ============================================================================

/**
 * Match pathname against slot definitions.
 */
export function matchParallelRoutes(
  pathname: string,
  config: ParallelRouteConfig
): Map<SlotName, MatchedSlot> | null {
  const normalizedPath = normalizePath(pathname);
  const basePath = config.basePath || "";

  const matchedSlots = new Map<SlotName, MatchedSlot>();

  // Match each slot
  for (const slotDef of config.slots) {
    const match = matchSlot(normalizedPath, slotDef, basePath);

    if (match) {
      matchedSlots.set(slotDef.name, match);
    } else if (slotDef.default && !slotDef.optional) {
      // Use default component if no match and slot is required
      matchedSlots.set(slotDef.name, {
        slot: slotDef,
        params: {},
        pathname: normalizedPath,
        id: slotDef.id || `${slotDef.name}:default`,
        data: undefined,
      });
    }
  }

  // Return null if main slot (children) didn't match
  const mainSlot = config.mainSlot || "children";
  if (!matchedSlots.has(mainSlot)) {
    return null;
  }

  return matchedSlots;
}

/**
 * Match a single slot against pathname.
 */
function matchSlot(
  pathname: string,
  slotDef: SlotDefinition,
  basePath: string
): MatchedSlot | null {
  // Check for route interception
  const interception = parseInterception(slotDef.path);

  if (interception) {
    const targetPath = resolveInterceptedPath(pathname, interception, basePath);
    if (!targetPath) {
      return null;
    }

    // Match against target path
    const params = matchPath(targetPath, interception.target);
    if (params) {
      return {
        slot: slotDef,
        params,
        pathname: targetPath,
        id: slotDef.id || `${slotDef.name}:${slotDef.path}`,
      };
    }

    return null;
  }

  // Normal path matching
  const fullPath = joinPaths(basePath, slotDef.path);
  const params = matchPath(pathname, fullPath);

  if (!params) {
    // Check children
    if (slotDef.children) {
      for (const child of slotDef.children) {
        const childMatch = matchSlot(pathname, child, fullPath);
        if (childMatch) {
          return childMatch;
        }
      }
    }
    return null;
  }

  return {
    slot: slotDef,
    params,
    pathname,
    id: slotDef.id || `${slotDef.name}:${slotDef.path}`,
  };
}

/**
 * Resolve intercepted path based on interception type.
 */
function resolveInterceptedPath(
  pathname: string,
  interception: InterceptConfig,
  basePath: string
): string | null {
  const segments = pathname.split("/").filter(Boolean);
  const baseSegments = basePath.split("/").filter(Boolean);

  let resolvedSegments: string[];

  switch (interception.type) {
    case "(.)":
      // Same level
      resolvedSegments = [...baseSegments, ...interception.target.split("/").filter(Boolean)];
      break;
    case "(..)":
      // One level up
      if (baseSegments.length === 0) return null;
      resolvedSegments = [
        ...baseSegments.slice(0, -1),
        ...interception.target.split("/").filter(Boolean),
      ];
      break;
    case "(..)(..)":
      // Two levels up
      if (baseSegments.length < 2) return null;
      resolvedSegments = [
        ...baseSegments.slice(0, -2),
        ...interception.target.split("/").filter(Boolean),
      ];
      break;
    case "(...)":
      // From root
      resolvedSegments = interception.target.split("/").filter(Boolean);
      break;
    default:
      return null;
  }

  const resolved = "/" + resolvedSegments.join("/");

  // Check if current pathname matches the resolved pattern
  const params = matchPath(pathname, resolved);
  return params ? pathname : null;
}

// ============================================================================
// Parallel Data Loading
// ============================================================================

/**
 * Load data for all slots in parallel.
 * No waterfall - all loaders run simultaneously.
 */
export async function loadParallelSlots(
  slots: Map<SlotName, MatchedSlot>,
  request: Request,
  options: {
    signal?: AbortSignal;
    revalidate?: boolean;
  } = {}
): Promise<Map<SlotName, MatchedSlot>> {
  const url = new URL(request.url);

  // Collect all loaders
  const loaderEntries: Array<[SlotName, MatchedSlot]> = [];
  for (const [slotName, slot] of slots.entries()) {
    if (slot.slot.loader) {
      loaderEntries.push([slotName, slot]);
    }
  }

  // Execute all loaders in parallel
  const results = await Promise.all(
    loaderEntries.map(async ([slotName, slot]) => {
      try {
        const context: LoaderFunctionContext = {
          params: slot.params,
          request,
          url,
        };

        const data = await slot.slot.loader!(context);

        return {
          slotName,
          data,
          error: undefined,
          loading: false,
        };
      } catch (error) {
        // Handle error with slot-level error boundary
        if (slot.slot.errorBoundary) {
          setRouteError(slot.id, error as Error);
        }

        return {
          slotName,
          data: undefined,
          error: error as Error,
          loading: false,
        };
      }
    })
  );

  // Merge results back into slots
  const loadedSlots = new Map(slots);

  for (const result of results) {
    const slot = loadedSlots.get(result.slotName);
    if (slot) {
      const updatedSlot: MatchedSlot = {
        ...slot,
        data: result.data,
        loading: result.loading,
      };
      if (result.error !== undefined) {
        updatedSlot.error = result.error;
      }
      loadedSlots.set(result.slotName, updatedSlot);

      // Set route data for useLoaderData hook
      setCurrentRouteData(slot.id, result.data, result.error);
    }
  }

  return loadedSlots;
}

// ============================================================================
// Route Interception
// ============================================================================

/**
 * Navigate with route interception support.
 */
export async function navigateWithInterception(
  to: string,
  config: ParallelRouteConfig,
  mode: NavigationMode = "soft"
): Promise<InterceptedNavigationState> {
  const currentState = parallelRouteState();
  const url = new URL(to, window.location.origin);

  // Check if any slot intercepts this route
  const interceptingSlot = findInterceptingSlot(url.pathname, config);

  if (interceptingSlot && mode === "soft") {
    // Soft navigation - client-only, preserve state
    const state: InterceptedNavigationState = {
      intercepted: true,
      originalUrl: currentState.pathname,
      slotName: interceptingSlot.name,
      mode: "soft",
    };

    // Add to history
    interceptionHistory.set([
      ...interceptionHistory(),
      {
        pathname: url.pathname,
        slotName: interceptingSlot.name,
        timestamp: Date.now(),
      },
    ]);

    return state;
  }

  // Hard navigation - full page reload
  return {
    intercepted: false,
    mode: "hard",
  };
}

/**
 * Find slot that intercepts a given pathname.
 */
function findInterceptingSlot(
  pathname: string,
  config: ParallelRouteConfig
): SlotDefinition | null {
  for (const slotDef of config.slots) {
    if (slotDef.path.includes("(")) {
      const interception = parseInterception(slotDef.path);
      if (interception) {
        const basePath = config.basePath || "";
        const targetPath = resolveInterceptedPath(pathname, interception, basePath);
        if (targetPath) {
          return slotDef;
        }
      }
    }

    // Check children
    if (slotDef.children) {
      const childSlot = findInterceptingSlotRecursive(pathname, slotDef.children, config.basePath || "");
      if (childSlot) {
        return childSlot;
      }
    }
  }

  return null;
}

/**
 * Recursively find intercepting slot in children.
 */
function findInterceptingSlotRecursive(
  pathname: string,
  slots: SlotDefinition[],
  basePath: string
): SlotDefinition | null {
  for (const slotDef of slots) {
    if (slotDef.path.includes("(")) {
      const interception = parseInterception(slotDef.path);
      if (interception) {
        const targetPath = resolveInterceptedPath(pathname, interception, basePath);
        if (targetPath) {
          return slotDef;
        }
      }
    }

    if (slotDef.children) {
      const childSlot = findInterceptingSlotRecursive(
        pathname,
        slotDef.children,
        joinPaths(basePath, slotDef.path)
      );
      if (childSlot) {
        return childSlot;
      }
    }
  }

  return null;
}

/**
 * Close intercepted route and restore original.
 */
export function closeInterception(): void {
  const history = interceptionHistory();
  const currentState = parallelRouteState();

  if (history.length > 0) {
    // Remove last interception
    const updated = history.slice(0, -1);
    interceptionHistory.set(updated);
  }

  // Always reset navigation state
  if (currentState.navigation.originalUrl) {
    parallelRouteState.set({
      ...currentState,
      pathname: currentState.navigation.originalUrl,
      navigation: {
        intercepted: false,
        mode: "hard",
      },
    });
  } else {
    // If no original URL, just reset interception flag
    parallelRouteState.set({
      ...currentState,
      navigation: {
        intercepted: false,
        mode: "hard",
      },
    });
  }
}

/**
 * Check if current navigation is intercepted.
 */
export function isIntercepted(): boolean {
  return parallelRouteState().navigation.intercepted;
}

/**
 * Get interception history.
 */
export function getInterceptionHistory(): Array<{
  pathname: string;
  slotName: SlotName;
  timestamp: number;
}> {
  return interceptionHistory();
}

// ============================================================================
// Rendering
// ============================================================================

/**
 * Render all parallel slots.
 */
export function renderParallelSlots(
  slots: Map<SlotName, MatchedSlot>,
  searchParams: URLSearchParams
): Record<SlotName, VNode | JSXElement | string | null> {
  const rendered: Record<SlotName, VNode | JSXElement | string | null> = {};

  for (const [slotName, slot] of slots.entries()) {
    const Component = slot.slot.component || slot.slot.default;

    if (!Component) {
      rendered[slotName] = null;
      continue;
    }

    // Set slot context for hooks
    const slotContext: {
      slotName: SlotName;
      data: unknown;
      error?: Error;
      loading?: boolean;
    } = {
      slotName,
      data: slot.data,
      loading: slot.loading || false,
    };
    if (slot.error !== undefined) {
      slotContext.error = slot.error;
    }
    slotContextSignal.set(slotContext);

    const props: SlotComponentProps = {
      params: slot.params,
      searchParams,
      data: slot.data,
      slotName,
    };
    if (slot.error !== undefined) {
      props.error = slot.error;
    }

    rendered[slotName] = Component(props);
  }

  return rendered;
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access current slot data.
 *
 * @example
 * ```tsx
 * export default function ModalSlot() {
 *   const slotData = useSlot();
 *   return <div>Slot: {slotData.slotName}</div>;
 * }
 * ```
 */
export function useSlot(): {
  slotName: SlotName;
  data: unknown;
  error?: Error;
  loading: boolean;
} {
  const context = slotContextSignal();

  if (!context) {
    throw new Error(
      "[PhilJS Parallel Routes] useSlot must be used inside a slot component. " +
      "Make sure your component is rendered by a parallel route."
    );
  }

  const result: {
    slotName: SlotName;
    data: unknown;
    error?: Error;
    loading: boolean;
  } = {
    slotName: context.slotName,
    data: context.data,
    loading: context.loading || false,
  };
  if (context.error !== undefined) {
    result.error = context.error;
  }
  return result;
}

/**
 * Hook to access a specific slot by name.
 */
export function useSlotByName(slotName: SlotName): MatchedSlot | undefined {
  const state = parallelRouteState();
  return state.slots.get(slotName);
}

/**
 * Hook to access all slots.
 */
export function useSlots(): Map<SlotName, MatchedSlot> {
  return parallelRouteState().slots;
}

/**
 * Hook to access navigation state.
 */
export function useInterception(): InterceptedNavigationState {
  return parallelRouteState().navigation;
}

/**
 * Hook to navigate with interception support.
 */
export function useInterceptedNavigation(): {
  navigate: (to: string, mode?: NavigationMode) => Promise<void>;
  close: () => void;
  isIntercepted: boolean;
} {
  const state = parallelRouteState();

  return {
    navigate: async (to: string, mode?: NavigationMode) => {
      // This would integrate with the router's navigate function
      // For now, we just update the state
      window.history.pushState({}, "", to);
    },
    close: closeInterception,
    isIntercepted: state.navigation.intercepted,
  };
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Normalize a pathname.
 */
function normalizePath(path: string): string {
  let normalized = path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path;

  if (!normalized.startsWith("/")) {
    normalized = "/" + normalized;
  }

  return normalized;
}

/**
 * Join two path segments.
 */
function joinPaths(parent: string, child: string): string {
  if (!child || child === "/") {
    return parent || "/";
  }

  if (!parent || parent === "/") {
    return child.startsWith("/") ? child : "/" + child;
  }

  const normalizedParent = parent.endsWith("/") ? parent.slice(0, -1) : parent;
  const normalizedChild = child.startsWith("/") ? child : "/" + child;

  return normalizedParent + normalizedChild;
}

/**
 * Match path against pattern.
 */
function matchPath(
  pathname: string,
  pattern: string
): Record<string, string> | null {
  const patternSegments = pattern.split("/").filter(Boolean);
  const pathSegments = pathname.split("/").filter(Boolean);

  if (patternSegments.length !== pathSegments.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternSegments.length; i++) {
    const patternSeg = patternSegments[i]!;
    const pathSeg = pathSegments[i]!;

    if (patternSeg.startsWith(":")) {
      const paramName = patternSeg.slice(1);
      params[paramName] = decodeURIComponent(pathSeg);
    } else if (patternSeg === "*") {
      params["*"] = pathSegments.slice(i).map(decodeURIComponent).join("/");
      return params;
    } else if (patternSeg !== pathSeg) {
      return null;
    }
  }

  return params;
}

/**
 * Create a parallel route configuration builder.
 */
export function createParallelRouteConfig(
  config: ParallelRouteConfig
): ParallelRouteConfig {
  const result: ParallelRouteConfig = {
    basePath: config.basePath || "",
    slots: config.slots,
    mainSlot: config.mainSlot || "children",
    softNavigation: config.softNavigation !== false,
  };
  if (config.defaultErrorBoundary !== undefined) {
    result.defaultErrorBoundary = config.defaultErrorBoundary;
  }
  return result;
}

/**
 * Update parallel route state.
 */
export function updateParallelRouteState(
  slots: Map<SlotName, MatchedSlot>,
  pathname: string,
  navigation?: Partial<InterceptedNavigationState>
): void {
  const currentState = parallelRouteState();

  // Combine params from all slots
  const params: Record<string, string> = {};
  for (const slot of slots.values()) {
    Object.assign(params, slot.params);
  }

  parallelRouteState.set({
    slots,
    params,
    pathname,
    navigation: {
      ...currentState.navigation,
      ...navigation,
    },
  });
}

/**
 * Clear parallel route state.
 */
export function clearParallelRouteState(): void {
  parallelRouteState.set({
    slots: new Map(),
    params: {},
    navigation: { intercepted: false, mode: "hard" },
    pathname: "/",
  });
  slotContextSignal.set(null);
  interceptionHistory.set([]);
}
