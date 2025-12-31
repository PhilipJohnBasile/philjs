/**
 * PhilJS Virtual - High-performance list virtualization
 *
 * Render millions of items efficiently with windowing.
 * Inspired by TanStack Virtual.
 *
 * @example
 * ```typescript
 * import { createVirtualizer, VirtualList } from '@philjs/virtual';
 *
 * // Imperative API
 * const virtualizer = createVirtualizer({
 *   count: 10000,
 *   getScrollElement: () => scrollRef,
 *   estimateSize: () => 35,
 * });
 *
 * // Component API
 * <VirtualList
 *   items={items}
 *   height={400}
 *   itemHeight={35}
 *   renderItem={(item, index) => <div>{item.name}</div>}
 * />
 * ```
 */
export interface VirtualizerOptions<TScrollElement extends Element | Window = Element> {
    /** Total number of items */
    count: number;
    /** Function to get the scroll container element */
    getScrollElement: () => TScrollElement | null;
    /** Estimate size of each item (can be refined after measurement) */
    estimateSize: (index: number) => number;
    /** Horizontal mode */
    horizontal?: boolean;
    /** Overscan - how many items to render outside visible area */
    overscan?: number;
    /** Enable smooth scrolling */
    smoothScroll?: boolean;
    /** Initial scroll offset */
    initialOffset?: number;
    /** Callback when scroll changes */
    onChange?: (virtualizer: Virtualizer<TScrollElement>) => void;
    /** Enable dynamic size measurement */
    measureElement?: (element: Element) => number;
    /** Lane count for grid layout */
    lanes?: number;
    /** Gap between items */
    gap?: number;
    /** Padding start */
    paddingStart?: number;
    /** Padding end */
    paddingEnd?: number;
    /** Enable debug logging */
    debug?: boolean;
}
export interface VirtualItem {
    /** Index in the original list */
    index: number;
    /** Unique key */
    key: string | number;
    /** Start position (px) */
    start: number;
    /** End position (px) */
    end: number;
    /** Size (px) */
    size: number;
    /** Lane index for grid layout */
    lane: number;
}
export interface Virtualizer<TScrollElement extends Element | Window = Element> {
    /** Get visible virtual items */
    getVirtualItems: () => VirtualItem[];
    /** Get all virtual items (including overscan) */
    getVirtualItemsWithOverscan: () => VirtualItem[];
    /** Total size of all items */
    getTotalSize: () => number;
    /** Scroll to specific index */
    scrollToIndex: (index: number, options?: ScrollToOptions) => void;
    /** Scroll to specific offset */
    scrollToOffset: (offset: number, options?: ScrollToOptions) => void;
    /** Get current scroll offset */
    getScrollOffset: () => number;
    /** Measure a specific element */
    measureElement: (element: Element | null) => void;
    /** Get measured size for index */
    getMeasuredSize: (index: number) => number | undefined;
    /** Force re-calculation */
    measure: () => void;
    /** Get visible range */
    getVisibleRange: () => {
        start: number;
        end: number;
    };
    /** Check if index is visible */
    isIndexVisible: (index: number) => boolean;
    /** Cleanup */
    cleanup: () => void;
    /** Options */
    options: VirtualizerOptions<TScrollElement>;
}
export interface ScrollToOptions {
    align?: 'start' | 'center' | 'end' | 'auto';
    behavior?: 'auto' | 'smooth';
}
export interface VirtualListProps<T> {
    /** Items to render */
    items: T[];
    /** Container height (px) */
    height: number | string;
    /** Container width (px) - for horizontal lists */
    width?: number | string;
    /** Item height (fixed or estimator function) */
    itemHeight: number | ((index: number) => number);
    /** Render function for each item */
    renderItem: (item: T, index: number, style: Record<string, string>) => any;
    /** Horizontal mode */
    horizontal?: boolean;
    /** Overscan count */
    overscan?: number;
    /** CSS class for container */
    className?: string;
    /** Gap between items */
    gap?: number;
    /** Key extractor */
    getKey?: (item: T, index: number) => string | number;
    /** On scroll callback */
    onScroll?: (offset: number) => void;
    /** On visible range change */
    onVisibleRangeChange?: (start: number, end: number) => void;
}
export interface VirtualGridProps<T> {
    /** Items to render */
    items: T[];
    /** Container height (px) */
    height: number | string;
    /** Number of columns */
    columns: number;
    /** Row height */
    rowHeight: number;
    /** Column width (optional, auto-calculated if not provided) */
    columnWidth?: number;
    /** Render function for each item */
    renderItem: (item: T, index: number, style: Record<string, string>) => any;
    /** Gap between items */
    gap?: number;
    /** Overscan count */
    overscan?: number;
    /** CSS class for container */
    className?: string;
    /** Key extractor */
    getKey?: (item: T, index: number) => string | number;
}
/**
 * Create a virtualizer instance for imperative control
 */
export declare function createVirtualizer<TScrollElement extends Element | Window = Element>(options: VirtualizerOptions<TScrollElement>): Virtualizer<TScrollElement>;
/**
 * Virtual List component for rendering large lists efficiently
 */
export declare function VirtualList<T>(props: VirtualListProps<T>): any;
/**
 * Virtual Grid component for rendering large grids efficiently
 */
export declare function VirtualGrid<T>(props: VirtualGridProps<T>): any;
/**
 * Create a window scroller for infinite scroll with window as container
 */
export declare function createWindowScroller<T>(options: {
    count: number;
    estimateSize: (index: number) => number;
    overscan?: number;
}): Virtualizer<Window & typeof globalThis>;
/**
 * Calculate visible items for a given scroll position
 */
export declare function calculateVisibleRange(scrollOffset: number, containerSize: number, itemCount: number, getItemSize: (index: number) => number, overscan?: number): {
    startIndex: number;
    endIndex: number;
    startOffset: number;
};
/**
 * Binary search to find item at offset
 */
export declare function findIndexAtOffset(offset: number, itemCount: number, getItemOffset: (index: number) => number): number;
/**
 * Create a smooth scroll handler with momentum
 */
export declare function createSmoothScroller(options: {
    getScrollElement: () => Element | null;
    friction?: number;
    bounceStiffness?: number;
}): {
    scroll: (delta: number) => void;
    scrollTo: (offset: number) => void;
    stop: () => void;
};
/**
 * Hook-style API for frameworks that support hooks
 */
export declare function useVirtualizer<TScrollElement extends Element | Window = Element>(options: VirtualizerOptions<TScrollElement>): Virtualizer<TScrollElement>;
/**
 * Hook for window-based virtualization
 */
export declare function useWindowVirtualizer(options: {
    count: number;
    estimateSize: (index: number) => number;
    overscan?: number;
}): Virtualizer<Window & typeof globalThis>;
export declare const DEFAULT_OVERSCAN = 3;
export declare const DEFAULT_SCROLL_DEBOUNCE = 16;
//# sourceMappingURL=index.d.ts.map