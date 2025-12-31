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
// Core Virtualizer
// ============================================================================
/**
 * Create a virtualizer instance for imperative control
 */
export function createVirtualizer(options) {
    const { count, getScrollElement, estimateSize, horizontal = false, overscan = 3, lanes = 1, gap = 0, paddingStart = 0, paddingEnd = 0, onChange, debug = false, } = options;
    // State
    let scrollOffset = options.initialOffset ?? 0;
    const measuredSizes = new Map();
    let observer = null;
    let scrollListener = null;
    // Calculate item positions
    function getItemOffset(index) {
        let offset = paddingStart;
        for (let i = 0; i < index; i++) {
            offset += (measuredSizes.get(i) ?? estimateSize(i)) + gap;
        }
        return offset;
    }
    function getItemSize(index) {
        return measuredSizes.get(index) ?? estimateSize(index);
    }
    function getTotalSize() {
        let total = paddingStart + paddingEnd;
        for (let i = 0; i < count; i++) {
            total += getItemSize(i);
            if (i < count - 1)
                total += gap;
        }
        return total;
    }
    function getVisibleRange() {
        const element = getScrollElement();
        if (!element)
            return { start: 0, end: 0 };
        const scrollSize = horizontal ? element.clientWidth : element.clientHeight;
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
    function getVirtualItems() {
        const { start, end } = getVisibleRange();
        return buildVirtualItems(start, end);
    }
    function getVirtualItemsWithOverscan() {
        const { start, end } = getVisibleRange();
        const overscanStart = Math.max(0, start - overscan);
        const overscanEnd = Math.min(count - 1, end + overscan);
        return buildVirtualItems(overscanStart, overscanEnd);
    }
    function buildVirtualItems(start, end) {
        const items = [];
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
    function scrollToIndex(index, scrollOptions = {}) {
        const { align = 'auto', behavior = 'auto' } = scrollOptions;
        const element = getScrollElement();
        if (!element)
            return;
        const itemOffset = getItemOffset(index);
        const itemSize = getItemSize(index);
        const scrollSize = horizontal ? element.clientWidth : element.clientHeight;
        let targetOffset;
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
                }
                else if (itemOffset + itemSize > scrollOffset + scrollSize) {
                    targetOffset = itemOffset - scrollSize + itemSize;
                }
                else {
                    return; // Already visible
                }
        }
        scrollToOffset(targetOffset, { behavior });
    }
    function scrollToOffset(offset, scrollOptions = {}) {
        const element = getScrollElement();
        if (!element)
            return;
        const { behavior = 'auto' } = scrollOptions;
        const scrollKey = horizontal ? 'scrollLeft' : 'scrollTop';
        if (behavior === 'smooth') {
            element.scrollTo({
                [horizontal ? 'left' : 'top']: offset,
                behavior: 'smooth',
            });
        }
        else {
            element[scrollKey] = offset;
        }
    }
    function measureElement(element) {
        if (!element)
            return;
        const index = parseInt(element.getAttribute('data-index') ?? '-1', 10);
        if (index < 0)
            return;
        const size = horizontal ? element.clientWidth : element.clientHeight;
        if (measuredSizes.get(index) !== size) {
            measuredSizes.set(index, size);
            onChange?.(virtualizer);
        }
    }
    function setupScrollListener() {
        const element = getScrollElement();
        if (!element || scrollListener)
            return;
        scrollListener = () => {
            const newOffset = horizontal ? element.scrollLeft : element.scrollTop;
            if (newOffset !== scrollOffset) {
                scrollOffset = newOffset;
                onChange?.(virtualizer);
            }
        };
        element.addEventListener('scroll', scrollListener, { passive: true });
    }
    function cleanup() {
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
    const virtualizer = {
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
export function VirtualList(props) {
    const { items, height, width, itemHeight, renderItem, horizontal = false, overscan = 3, className = '', gap = 0, getKey = (_item, index) => index, onScroll, onVisibleRangeChange, } = props;
    // This is a template - actual implementation depends on philjs-core JSX
    const containerStyle = {
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
    const innerStyle = {
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
export function VirtualGrid(props) {
    const { items, height, columns, rowHeight, columnWidth, renderItem, gap = 0, overscan = 2, className = '', getKey = (_item, index) => index, } = props;
    const rowCount = Math.ceil(items.length / columns);
    const totalHeight = rowCount * rowHeight + (rowCount - 1) * gap;
    const containerStyle = {
        height: typeof height === 'number' ? `${height}px` : height,
        overflow: 'auto',
        position: 'relative',
    };
    const innerStyle = {
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
export function createWindowScroller(options) {
    return createVirtualizer({
        ...options,
        getScrollElement: () => window,
        overscan: options.overscan ?? 5,
    });
}
/**
 * Calculate visible items for a given scroll position
 */
export function calculateVisibleRange(scrollOffset, containerSize, itemCount, getItemSize, overscan = 3) {
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
export function findIndexAtOffset(offset, itemCount, getItemOffset) {
    let low = 0;
    let high = itemCount - 1;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const midOffset = getItemOffset(mid);
        if (midOffset === offset) {
            return mid;
        }
        else if (midOffset < offset) {
            low = mid + 1;
        }
        else {
            high = mid - 1;
        }
    }
    return Math.max(0, low - 1);
}
/**
 * Create a smooth scroll handler with momentum
 */
export function createSmoothScroller(options) {
    const { getScrollElement, friction = 0.95 } = options;
    let velocity = 0;
    let animationFrame = null;
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
        scroll(delta) {
            velocity += delta;
            if (!animationFrame) {
                animationFrame = requestAnimationFrame(animate);
            }
        },
        scrollTo(offset) {
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
export function useVirtualizer(options) {
    // In actual implementation, this would integrate with PhilJS signals
    return createVirtualizer(options);
}
/**
 * Hook for window-based virtualization
 */
export function useWindowVirtualizer(options) {
    return createWindowScroller(options);
}
// ============================================================================
// Constants
// ============================================================================
export const DEFAULT_OVERSCAN = 3;
export const DEFAULT_SCROLL_DEBOUNCE = 16; // ~60fps
//# sourceMappingURL=index.js.map