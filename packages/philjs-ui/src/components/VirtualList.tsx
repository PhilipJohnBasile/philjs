/**
 * PhilJS UI - VirtualList Component
 *
 * Virtualized list for efficiently rendering large datasets.
 * Only renders visible items plus overscan buffer.
 */

import { signal, effect, memo } from 'philjs-core';

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((item: T, index: number) => number);
  overscan?: number;
  containerHeight?: number;
  renderItem: (item: T, index: number, style: Record<string, any>) => any;
  getItemKey?: (item: T, index: number) => string | number;
  onScroll?: (scrollTop: number) => void;
  onEndReached?: () => void;
  endReachedThreshold?: number;
  className?: string;
  innerClassName?: string;
}

export function VirtualList<T>(props: VirtualListProps<T>) {
  const {
    items,
    itemHeight,
    overscan = 3,
    containerHeight,
    renderItem,
    getItemKey = (_item: T, index: number) => index,
    onScroll,
    onEndReached,
    endReachedThreshold = 200,
    className = '',
    innerClassName = '',
  } = props;

  const scrollTop = signal(0);
  const containerRef = signal<HTMLDivElement | null>(null);
  const measuredHeights = signal<Map<number, number>>(new Map());
  const endReachedCalled = signal(false);

  // Calculate item positions
  const itemPositions = memo(() => {
    const positions: { top: number; height: number }[] = [];
    let currentTop = 0;

    for (let i = 0; i < items.length; i++) {
      const height = typeof itemHeight === 'function'
        ? itemHeight(items[i], i)
        : itemHeight;

      positions.push({ top: currentTop, height });
      currentTop += height;
    }

    return positions;
  });

  // Total content height
  const totalHeight = memo(() => {
    const positions = itemPositions();
    if (positions.length === 0) return 0;
    const last = positions[positions.length - 1];
    return last.top + last.height;
  });

  // Visible range
  const visibleRange = memo(() => {
    const container = containerRef();
    const height = containerHeight ?? (container?.clientHeight || 400);
    const positions = itemPositions();
    const top = scrollTop();

    if (positions.length === 0) {
      return { startIndex: 0, endIndex: 0 };
    }

    // Binary search for start index
    let startIndex = 0;
    let endIndex = positions.length - 1;
    let low = 0;
    let high = positions.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const pos = positions[mid];

      if (pos.top + pos.height < top) {
        low = mid + 1;
      } else if (pos.top > top) {
        high = mid - 1;
      } else {
        startIndex = mid;
        break;
      }
    }

    startIndex = Math.max(0, low - overscan);

    // Find end index
    const bottomEdge = top + height;
    for (let i = startIndex; i < positions.length; i++) {
      if (positions[i].top > bottomEdge) {
        endIndex = Math.min(positions.length - 1, i + overscan);
        break;
      }
    }

    return { startIndex, endIndex };
  });

  // Visible items
  const visibleItems = memo(() => {
    const { startIndex, endIndex } = visibleRange();
    const positions = itemPositions();
    const result: { item: T; index: number; style: Record<string, any> }[] = [];

    for (let i = startIndex; i <= endIndex; i++) {
      if (i < items.length) {
        result.push({
          item: items[i],
          index: i,
          style: {
            position: 'absolute',
            top: `${positions[i].top}px`,
            height: `${positions[i].height}px`,
            left: 0,
            right: 0,
          },
        });
      }
    }

    return result;
  });

  const handleScroll = (e: Event) => {
    const target = e.target as HTMLDivElement;
    const newScrollTop = target.scrollTop;
    scrollTop.set(newScrollTop);
    onScroll?.(newScrollTop);

    // Check if end reached
    if (onEndReached) {
      const scrollBottom = newScrollTop + target.clientHeight;
      const threshold = totalHeight() - endReachedThreshold;

      if (scrollBottom >= threshold && !endReachedCalled()) {
        endReachedCalled.set(true);
        onEndReached();
      } else if (scrollBottom < threshold) {
        endReachedCalled.set(false);
      }
    }
  };

  // Reset end reached when items change
  effect(() => {
    items.length; // Subscribe to items changes
    endReachedCalled.set(false);
  });

  return (
    <div
      ref={(el: HTMLDivElement) => containerRef.set(el)}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight ? `${containerHeight}px` : '100%' }}
      onScroll={handleScroll}
    >
      <div
        className={`relative ${innerClassName}`}
        style={{ height: `${totalHeight()}px` }}
      >
        {visibleItems().map(({ item, index, style }) => (
          <div key={getItemKey(item, index)} style={style}>
            {renderItem(item, index, style)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * VirtualGrid - 2D virtualized grid
 */
export interface VirtualGridProps<T> {
  items: T[];
  columnCount: number;
  rowHeight: number;
  columnWidth?: number;
  overscan?: number;
  containerHeight?: number;
  renderItem: (item: T, index: number, rowIndex: number, colIndex: number) => any;
  getItemKey?: (item: T, index: number) => string | number;
  gap?: number;
  className?: string;
}

export function VirtualGrid<T>(props: VirtualGridProps<T>) {
  const {
    items,
    columnCount,
    rowHeight,
    columnWidth,
    overscan = 2,
    containerHeight,
    renderItem,
    getItemKey = (_item: T, index: number) => index,
    gap = 0,
    className = '',
  } = props;

  const scrollTop = signal(0);
  const containerRef = signal<HTMLDivElement | null>(null);

  const rowCount = Math.ceil(items.length / columnCount);

  // Total height
  const totalHeight = rowCount * rowHeight + (rowCount - 1) * gap;

  // Visible row range
  const visibleRowRange = memo(() => {
    const container = containerRef();
    const height = containerHeight ?? (container?.clientHeight || 400);
    const top = scrollTop();

    const startRow = Math.max(0, Math.floor(top / (rowHeight + gap)) - overscan);
    const endRow = Math.min(
      rowCount - 1,
      Math.ceil((top + height) / (rowHeight + gap)) + overscan
    );

    return { startRow, endRow };
  });

  // Visible items
  const visibleItems = memo(() => {
    const { startRow, endRow } = visibleRowRange();
    const result: { item: T; index: number; rowIndex: number; colIndex: number; style: Record<string, any> }[] = [];

    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < columnCount; col++) {
        const index = row * columnCount + col;
        if (index < items.length) {
          result.push({
            item: items[index],
            index,
            rowIndex: row,
            colIndex: col,
            style: {
              position: 'absolute',
              top: `${row * (rowHeight + gap)}px`,
              left: columnWidth
                ? `${col * (columnWidth + gap)}px`
                : `${(col / columnCount) * 100}%`,
              width: columnWidth ? `${columnWidth}px` : `${100 / columnCount}%`,
              height: `${rowHeight}px`,
            },
          });
        }
      }
    }

    return result;
  });

  const handleScroll = (e: Event) => {
    const target = e.target as HTMLDivElement;
    scrollTop.set(target.scrollTop);
  };

  return (
    <div
      ref={(el: HTMLDivElement) => containerRef.set(el)}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight ? `${containerHeight}px` : '100%' }}
      onScroll={handleScroll}
    >
      <div className="relative" style={{ height: `${totalHeight}px` }}>
        {visibleItems().map(({ item, index, rowIndex, colIndex, style }) => (
          <div key={getItemKey(item, index)} style={style}>
            {renderItem(item, index, rowIndex, colIndex)}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * WindowedList - Alternative implementation with window-based rendering
 */
export interface WindowedListProps<T> {
  items: T[];
  itemSize: number;
  width?: number | string;
  height: number;
  direction?: 'vertical' | 'horizontal';
  children: (data: { items: T[]; startIndex: number }) => any;
  className?: string;
}

export function WindowedList<T>(props: WindowedListProps<T>) {
  const {
    items,
    itemSize,
    width = '100%',
    height,
    direction = 'vertical',
    children,
    className = '',
  } = props;

  const scroll = signal(0);
  const containerRef = signal<HTMLDivElement | null>(null);

  const isVertical = direction === 'vertical';
  const totalSize = items.length * itemSize;

  const visibleData = memo(() => {
    const container = containerRef();
    const viewportSize = isVertical ? height : (container?.clientWidth || 0);
    const currentScroll = scroll();

    const startIndex = Math.max(0, Math.floor(currentScroll / itemSize) - 1);
    const endIndex = Math.min(
      items.length,
      Math.ceil((currentScroll + viewportSize) / itemSize) + 1
    );

    return {
      items: items.slice(startIndex, endIndex),
      startIndex,
    };
  });

  const handleScroll = (e: Event) => {
    const target = e.target as HTMLDivElement;
    scroll.set(isVertical ? target.scrollTop : target.scrollLeft);
  };

  return (
    <div
      ref={(el: HTMLDivElement) => containerRef.set(el)}
      className={`overflow-auto ${className}`}
      style={{
        width,
        height: `${height}px`,
        overflowX: isVertical ? 'hidden' : 'auto',
        overflowY: isVertical ? 'auto' : 'hidden',
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          [isVertical ? 'height' : 'width']: `${totalSize}px`,
          [isVertical ? 'width' : 'height']: '100%',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            [isVertical ? 'top' : 'left']: `${visibleData().startIndex * itemSize}px`,
            [isVertical ? 'left' : 'top']: 0,
            [isVertical ? 'right' : 'bottom']: 0,
          }}
        >
          {children(visibleData())}
        </div>
      </div>
    </div>
  );
}
