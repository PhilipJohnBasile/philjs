/**
 * Intersection Observer Utilities for Visibility-Based Prefetching
 *
 * Provides:
 * - Shared IntersectionObserver instance for efficiency
 * - Visibility detection for prefetch triggering
 * - Viewport proximity detection
 * - Lazy loading support
 */
export interface IntersectionOptions {
    /** Root element for intersection (defaults to viewport) */
    root?: Element | null;
    /** Margin around the root (e.g., '50px' for prefetch buffer) */
    rootMargin?: string;
    /** Threshold(s) at which to trigger callback */
    threshold?: number | number[];
    /** Callback when intersection changes */
    onIntersect?: (entry: IntersectionObserverEntry) => void;
    /** Only fire once then unobserve */
    once?: boolean;
}
export interface ObservedElement {
    element: Element;
    observer: IntersectionObserver;
    options: IntersectionOptions;
    hasIntersected: boolean;
}
/**
 * Create an IntersectionObserver with the given options
 *
 * @example
 * ```ts
 * const observer = createIntersectionObserver({
 *   rootMargin: '50px',
 *   onIntersect: (entry) => {
 *     if (entry.isIntersecting) {
 *       prefetchRoute(entry.target.getAttribute('href'));
 *     }
 *   },
 * });
 *
 * observeElement(linkElement, observer);
 * ```
 */
export declare function createIntersectionObserver(options?: IntersectionOptions): IntersectionObserver;
/**
 * Observe an element for intersection
 */
export declare function observeElement(element: Element, observerOrOptions: IntersectionObserver | IntersectionOptions): void;
/**
 * Stop observing an element
 */
export declare function unobserveElement(element: Element): void;
/**
 * Check if an element is currently being observed
 */
export declare function isObserving(element: Element): boolean;
/**
 * Check if an element has intersected (for 'once' observers)
 */
export declare function hasIntersected(element: Element): boolean;
/**
 * Disconnect all observers and clear state
 */
export declare function disconnectAll(): void;
export interface VisibilityState {
    isVisible: boolean;
    isPartiallyVisible: boolean;
    intersectionRatio: number;
    boundingRect: DOMRect | null;
}
/**
 * Get current visibility state of an element
 */
export declare function getVisibilityState(element: Element): VisibilityState;
/**
 * Check if an element is approaching the viewport
 *
 * @param element - Element to check
 * @param threshold - Distance in pixels to consider "approaching"
 */
export declare function isApproachingViewport(element: Element, threshold?: number): boolean;
export interface PrefetchZone {
    /** Distance in pixels from viewport edges to trigger prefetch */
    distance: number;
    /** Callback when element enters prefetch zone */
    onEnterZone: (element: Element) => void;
    /** Callback when element leaves prefetch zone */
    onLeaveZone?: (element: Element) => void;
}
/**
 * Create a prefetch zone around the viewport
 *
 * Elements entering this zone will trigger prefetching before they become visible.
 *
 * @example
 * ```ts
 * const cleanup = createPrefetchZone(linkElement, {
 *   distance: 200, // Start prefetch 200px before visible
 *   onEnterZone: (el) => {
 *     prefetchRoute(el.getAttribute('href'));
 *   },
 * });
 *
 * // Later: cleanup();
 * ```
 */
export declare function createPrefetchZone(element: Element, zone: PrefetchZone): () => void;
export type ScrollDirection = 'up' | 'down' | 'left' | 'right' | 'none';
/**
 * Get current scroll direction
 */
export declare function getScrollDirection(): ScrollDirection;
/**
 * Subscribe to scroll direction changes
 */
export declare function onScrollDirectionChange(listener: (direction: ScrollDirection) => void): () => void;
/**
 * Get elements that are likely to be scrolled into view
 *
 * @param links - Array of link elements to check
 * @param count - Maximum number of links to return
 */
export declare function getLinksInScrollPath(links: HTMLAnchorElement[], count?: number): HTMLAnchorElement[];
//# sourceMappingURL=intersection.d.ts.map