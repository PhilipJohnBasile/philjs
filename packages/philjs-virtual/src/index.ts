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

// ============================================================================
// Types
// ============================================================================

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
  getVisibleRange: () => { start: number; end: number };
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

// ============================================================================
// Core Virtualizer
// ============================================================================

/**
 * Create a virtualizer instance for imperative control
 */
export function createVirtualizer<TScrollElement extends Element | Window = Element>(
  options: VirtualizerOptions<TScrollElement>
): Virtualizer<TScrollElement> {
  const {
    count,
    getScrollElement,
    estimateSize,
    horizontal = false,
    overscan = 3,
    lanes = 1,
    gap = 0,
    paddingStart = 0,
    paddingEnd = 0,
    onChange,
    debug = false,
  } = options;

  // State
  let scrollOffset = options.initialOffset ?? 0;
  const measuredSizes = new Map<number, number>();
  let observer: ResizeObserver | null = null;
  let scrollListener: (() => void) | null = null;

  // Calculate item positions
  function getItemOffset(index: number): number {
    let offset = paddingStart;
    for (let i = 0; i < index; i++) {
      offset += (measuredSizes.get(i) ?? estimateSize(i)) + gap;
    }
    return offset;
  }

  function getItemSize(index: number): number {
    return measuredSizes.get(index) ?? estimateSize(index);
  }

  function getTotalSize(): number {
    let total = paddingStart + paddingEnd;
    for (let i = 0; i < count; i++) {
      total += getItemSize(i);
      if (i < count - 1) total += gap;
    }
    return total;
  }

  function getVisibleRange(): { start: number; end: number } {
    const element = getScrollElement();
    if (!element) return { start: 0, end: 0 };

    const scrollSize = horizontal ? (element as any).clientWidth : (element as any).clientHeight;
    let start = 0;
    let end = 0;
    let offset = paddingStart;

    // Find start
    for (let i = 0; i < count; i++) {
      const size = getItemSize(i);
      if (offset + size > scrollOffset) {
        start = i;
        break;
      }
      offset += size + gap;
    }

    // Find end
    offset = getItemOffset(start);
    for (let i = start; i < count; i++) {
      const size = getItemSize(i);
      end = i;
      if (offset + size > scrollOffset + scrollSize) {
        break;
      }
      offset += size + gap;
    }

    return { start, end };
  }

  function getVirtualItems(): VirtualItem[] {
    const { start, end } = getVisibleRange();
    return buildVirtualItems(start, end);
  }

  function getVirtualItemsWithOverscan(): VirtualItem[] {
    const { start, end } = getVisibleRange();
    const overscanStart = Math.max(0, start - overscan);
    const overscanEnd = Math.min(count - 1, end + overscan);
    return buildVirtualItems(overscanStart, overscanEnd);
  }

  function buildVirtualItems(start: number, end: number): VirtualItem[] {
    const items: VirtualItem[] = [];
    let offset = getItemOffset(start);

    for (let i = start; i <= end && i < count; i++) {
      const size = getItemSize(i);
      items.push({
        index: i,
        key: i,
        start: offset,
        end: offset + size,
        size,
        lane: i % lanes,
      });
      offset += size + gap;
    }

    return items;
  }

  function scrollToIndex(index: number, scrollOptions: ScrollToOptions = {}): void {
    const { align = 'auto', behavior = 'auto' } = scrollOptions;
    const element = getScrollElement();
    if (!element) return;

    const itemOffset = getItemOffset(index);
    const itemSize = getItemSize(index);
    const scrollSize = horizontal ? (element as any).clientWidth : (element as any).clientHeight;

    let targetOffset: number;
    switch (align) {
      case 'start':
        targetOffset = itemOffset;
        break;
      case 'center':
        targetOffset = itemOffset - scrollSize / 2 + itemSize / 2;
        break;
      case 'end':
        targetOffset = itemOffset - scrollSize + itemSize;
        break;
      case 'auto':
      default:
        if (itemOffset < scrollOffset) {
          targetOffset = itemOffset;
        } else if (itemOffset + itemSize > scrollOffset + scrollSize) {
          targetOffset = itemOffset - scrollSize + itemSize;
        } else {
          return; // Already visible
        }
    }

    scrollToOffset(targetOffset, { behavior });
  }

  function scrollToOffset(offset: number, scrollOptions: ScrollToOptions = {}): void {
    const element = getScrollElement();
    if (!element) return;

    const { behavior = 'auto' } = scrollOptions;
    const scrollKey = horizontal ? 'scrollLeft' : 'scrollTop';

    if (behavior === 'smooth') {
      element.scrollTo({
        [horizontal ? 'left' : 'top']: offset,
        behavior: 'smooth',
      });
    } else {
      (element as any)[scrollKey] = offset;
    }
  }

  function measureElement(element: Element | null): void {
    if (!element) return;
    const index = parseInt(element.getAttribute('data-index') ?? '-1', 10);
    if (index < 0) return;

    const size = horizontal ? element.clientWidth : element.clientHeight;
    if (measuredSizes.get(index) !== size) {
      measuredSizes.set(index, size);
      onChange?.(virtualizer);
    }
  }

  function setupScrollListener(): void {
    const element = getScrollElement();
    if (!element || scrollListener) return;

    scrollListener = () => {
      const newOffset = horizontal ? (element as any).scrollLeft : (element as any).scrollTop;
      if (newOffset !== scrollOffset) {
        scrollOffset = newOffset;
        onChange?.(virtualizer);
      }
    };

    element.addEventListener('scroll', scrollListener, { passive: true });
  }

  function cleanup(): void {
    const element = getScrollElement();
    if (element && scrollListener) {
      element.removeEventListener('scroll', scrollListener);
    }
    observer?.disconnect();
    scrollListener = null;
    observer = null;
  }

  // Initialize
  setupScrollListener();

  const virtualizer: Virtualizer<TScrollElement> = {
    getVirtualItems,
    getVirtualItemsWithOverscan,
    getTotalSize,
    scrollToIndex,
    scrollToOffset,
    getScrollOffset: () => scrollOffset,
    measureElement,
    getMeasuredSize: (index) => measuredSizes.get(index),
    measure: () => onChange?.(virtualizer),
    getVisibleRange,
    isIndexVisible: (index) => {
      const { start, end } = getVisibleRange();
      return index >= start && index <= end;
    },
    cleanup,
    options,
  };

  return virtualizer;
}

// ============================================================================
// Virtual List Component (JSX)
// ============================================================================

/**
 * Virtual List component for rendering large lists efficiently
 */
export function VirtualList<T>(props: VirtualListProps<T>): any {
  const {
    items,
    height,
    width,
    itemHeight,
    renderItem,
    horizontal = false,
    overscan = 3,
    className = '',
    gap = 0,
    getKey = (_item, index) => index,
    onScroll,
    onVisibleRangeChange,
  } = props;

  // This is a template - actual implementation depends on @philjs/core JSX
  const containerStyle: Record<string, string> = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: width ? (typeof width === 'number' ? `${width}px` : width) : '100%',
    overflow: 'auto',
    position: 'relative',
  };

  const getSize = typeof itemHeight === 'function' ? itemHeight : () => itemHeight;

  // Calculate total height
  let totalSize = 0;
  for (let i = 0; i < items.length; i++) {
    totalSize += getSize(i) + (i < items.length - 1 ? gap : 0);
  }

  const innerStyle: Record<string, string> = {
    height: horizontal ? '100%' : `${totalSize}px`,
    width: horizontal ? `${totalSize}px` : '100%',
    position: 'relative',
  };

  // Return structure for rendering
  return {
    type: 'VirtualList',
    containerStyle,
    innerStyle,
    items,
    getSize,
    gap,
    horizontal,
    overscan,
    renderItem,
    getKey,
    className,
    onScroll,
    onVisibleRangeChange,
  };
}

// ============================================================================
// Virtual Grid Component
// ============================================================================

/**
 * Virtual Grid component for rendering large grids efficiently
 */
export function VirtualGrid<T>(props: VirtualGridProps<T>): any {
  const {
    items,
    height,
    columns,
    rowHeight,
    columnWidth,
    renderItem,
    gap = 0,
    overscan = 2,
    className = '',
    getKey = (_item, index) => index,
  } = props;

  const rowCount = Math.ceil(items.length / columns);
  const totalHeight = rowCount * rowHeight + (rowCount - 1) * gap;

  const containerStyle: Record<string, string> = {
    height: typeof height === 'number' ? `${height}px` : height,
    overflow: 'auto',
    position: 'relative',
  };

  const innerStyle: Record<string, string> = {
    height: `${totalHeight}px`,
    position: 'relative',
  };

  return {
    type: 'VirtualGrid',
    containerStyle,
    innerStyle,
    items,
    columns,
    rowHeight,
    columnWidth,
    gap,
    overscan,
    renderItem,
    getKey,
    className,
    rowCount,
    totalHeight,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a window scroller for infinite scroll with window as container
 */
export function createWindowScroller<T>(options: {
  count: number;
  estimateSize: (index: number) => number;
  overscan?: number;
}): Virtualizer<Window & typeof globalThis> {
  return createVirtualizer({
    ...options,
    getScrollElement: () => window as any,
    overscan: options.overscan ?? 5,
  });
}

/**
 * Calculate visible items for a given scroll position
 */
export function calculateVisibleRange(
  scrollOffset: number,
  containerSize: number,
  itemCount: number,
  getItemSize: (index: number) => number,
  overscan: number = 3
): { startIndex: number; endIndex: number; startOffset: number } {
  let offset = 0;
  let startIndex = 0;
  let endIndex = 0;

  // Find start index
  for (let i = 0; i < itemCount; i++) {
    const size = getItemSize(i);
    if (offset + size > scrollOffset) {
      startIndex = Math.max(0, i - overscan);
      break;
    }
    offset += size;
  }

  // Find end index
  const startOffset = offset;
  for (let i = startIndex; i < itemCount; i++) {
    const size = getItemSize(i);
    endIndex = i;
    if (offset > scrollOffset + containerSize) {
      endIndex = Math.min(itemCount - 1, i + overscan);
      break;
    }
    offset += size;
  }

  return {
    startIndex,
    endIndex,
    startOffset,
  };
}

/**
 * Binary search to find item at offset
 */
export function findIndexAtOffset(
  offset: number,
  itemCount: number,
  getItemOffset: (index: number) => number
): number {
  let low = 0;
  let high = itemCount - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midOffset = getItemOffset(mid);

    if (midOffset === offset) {
      return mid;
    } else if (midOffset < offset) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return Math.max(0, low - 1);
}

/**
 * Create a smooth scroll handler with momentum
 */
export function createSmoothScroller(options: {
  getScrollElement: () => Element | null;
  friction?: number;
  bounceStiffness?: number;
}): {
  scroll: (delta: number) => void;
  scrollTo: (offset: number) => void;
  stop: () => void;
} {
  const { getScrollElement, friction = 0.95 } = options;
  let velocity = 0;
  let animationFrame: number | null = null;

  function animate() {
    const element = getScrollElement();
    if (!element || Math.abs(velocity) < 0.5) {
      velocity = 0;
      animationFrame = null;
      return;
    }

    element.scrollTop += velocity;
    velocity *= friction;
    animationFrame = requestAnimationFrame(animate);
  }

  return {
    scroll(delta: number) {
      velocity += delta;
      if (!animationFrame) {
        animationFrame = requestAnimationFrame(animate);
      }
    },
    scrollTo(offset: number) {
      const element = getScrollElement();
      if (element) {
        element.scrollTo({ top: offset, behavior: 'smooth' });
      }
    },
    stop() {
      velocity = 0;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
    },
  };
}

// ============================================================================
// React/Preact-style Hooks (for compatibility)
// ============================================================================

/**
 * Hook-style API for frameworks that support hooks
 */
export function useVirtualizer<TScrollElement extends Element | Window = Element>(
  options: VirtualizerOptions<TScrollElement>
): Virtualizer<TScrollElement> {
  // In actual implementation, this would integrate with PhilJS signals
  return createVirtualizer(options);
}

/**
 * Hook for window-based virtualization
 */
export function useWindowVirtualizer(options: {
  count: number;
  estimateSize: (index: number) => number;
  overscan?: number;
}): Virtualizer<Window & typeof globalThis> {
  return createWindowScroller(options);
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_OVERSCAN = 3;
export const DEFAULT_SCROLL_DEBOUNCE = 16; // ~60fps
