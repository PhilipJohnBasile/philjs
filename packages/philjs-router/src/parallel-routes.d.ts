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
import type { JSXElement, VNode } from "philjs-core";
import { type LoaderFunction } from "./loader.js";
import { type ErrorBoundaryComponent } from "./error-boundary.js";
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
export type SlotComponent<Props = SlotComponentProps> = (props: Props) => VNode | JSXElement | string | null | undefined;
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
export declare function parseInterception(path: string): InterceptConfig | null;
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
/**
 * Match pathname against slot definitions.
 */
export declare function matchParallelRoutes(pathname: string, config: ParallelRouteConfig): Map<SlotName, MatchedSlot> | null;
/**
 * Load data for all slots in parallel.
 * No waterfall - all loaders run simultaneously.
 */
export declare function loadParallelSlots(slots: Map<SlotName, MatchedSlot>, request: Request, options?: {
    signal?: AbortSignal;
    revalidate?: boolean;
}): Promise<Map<SlotName, MatchedSlot>>;
/**
 * Navigate with route interception support.
 */
export declare function navigateWithInterception(to: string, config: ParallelRouteConfig, mode?: NavigationMode): Promise<InterceptedNavigationState>;
/**
 * Close intercepted route and restore original.
 */
export declare function closeInterception(): void;
/**
 * Check if current navigation is intercepted.
 */
export declare function isIntercepted(): boolean;
/**
 * Get interception history.
 */
export declare function getInterceptionHistory(): Array<{
    pathname: string;
    slotName: SlotName;
    timestamp: number;
}>;
/**
 * Render all parallel slots.
 */
export declare function renderParallelSlots(slots: Map<SlotName, MatchedSlot>, searchParams: URLSearchParams): Record<SlotName, VNode | JSXElement | string | null>;
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
export declare function useSlot(): {
    slotName: SlotName;
    data: unknown;
    error?: Error;
    loading: boolean;
};
/**
 * Hook to access a specific slot by name.
 */
export declare function useSlotByName(slotName: SlotName): MatchedSlot | undefined;
/**
 * Hook to access all slots.
 */
export declare function useSlots(): Map<SlotName, MatchedSlot>;
/**
 * Hook to access navigation state.
 */
export declare function useInterception(): InterceptedNavigationState;
/**
 * Hook to navigate with interception support.
 */
export declare function useInterceptedNavigation(): {
    navigate: (to: string, mode?: NavigationMode) => Promise<void>;
    close: () => void;
    isIntercepted: boolean;
};
/**
 * Create a parallel route configuration builder.
 */
export declare function createParallelRouteConfig(config: ParallelRouteConfig): ParallelRouteConfig;
/**
 * Update parallel route state.
 */
export declare function updateParallelRouteState(slots: Map<SlotName, MatchedSlot>, pathname: string, navigation?: Partial<InterceptedNavigationState>): void;
/**
 * Clear parallel route state.
 */
export declare function clearParallelRouteState(): void;
//# sourceMappingURL=parallel-routes.d.ts.map