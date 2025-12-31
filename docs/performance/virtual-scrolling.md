# Virtual Scrolling

Efficiently render large lists by only displaying visible items.

## What You'll Learn

- Virtual scrolling basics
- Fixed height items
- Variable height items
- Bidirectional scrolling
- Performance optimization
- Best practices

## Basic Virtual Scrolling

### Fixed Height Items

```typescript
import { signal, effect } from '@philjs/core';

interface VirtualScrollerProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => JSX.Element;
}

export function VirtualScroller<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem
}: VirtualScrollerProps<T>) {
  const scrollTop = signal(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = () => Math.floor(scrollTop() / itemHeight);
  const endIndex = () => Math.min(
    startIndex() + visibleCount + 1,
    items.length
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = () => startIndex() * itemHeight;

  const visibleItems = () =>
    items.slice(startIndex(), endIndex());

  const handleScroll = (e: Event) => {
    const target = e.target as HTMLElement;
    scrollTop.set(target.scrollTop);
  };

  return (
    <div
      style={{
        height: `${containerHeight}px`,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: `${totalHeight}px` }}>
        <div
          style={{
            transform: `translateY(${offsetY()}px)`,
            willChange: 'transform'
          }}
        >
          {visibleItems().map((item, i) =>
            renderItem(item, startIndex() + i)
          )}
        </div>
      </div>
    </div>
  );
}

// Usage
function App() {
  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  }));

  return (
    <VirtualScroller
      items={items}
      itemHeight={50}
      containerHeight={600}
      renderItem={(item) => (
        <div style={{ height: '50px', padding: '10px', borderBottom: '1px solid #eee' }}>
          {item.name}
        </div>
      )}
    />
  );
}
```

### With Overscan

```typescript
interface VirtualScrollerWithOverscanProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // Number of items to render outside viewport
  renderItem: (item: T, index: number) => JSX.Element;
}

export function VirtualScrollerWithOverscan<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
  renderItem
}: VirtualScrollerWithOverscanProps<T>) {
  const scrollTop = signal(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);

  const startIndex = () =>
    Math.max(0, Math.floor(scrollTop() / itemHeight) - overscan);

  const endIndex = () =>
    Math.min(
      Math.ceil(scrollTop() / itemHeight) + visibleCount + overscan,
      items.length
    );

  const visibleItems = () =>
    items.slice(startIndex(), endIndex());

  const offsetY = () => startIndex() * itemHeight;

  return (
    <div
      style={{
        height: `${containerHeight}px`,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={(e) => scrollTop.set((e.target as HTMLElement).scrollTop)}
    >
      <div style={{ height: `${items.length * itemHeight}px` }}>
        <div style={{ transform: `translateY(${offsetY()}px)` }}>
          {visibleItems().map((item, i) => (
            <div key={startIndex() + i}>
              {renderItem(item, startIndex() + i)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Variable Height Items

### Dynamic Height Virtual Scroller

```typescript
import { signal, memo } from '@philjs/core';

interface DynamicVirtualScrollerProps<T> {
  items: T[];
  estimatedItemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => JSX.Element;
}

export function DynamicVirtualScroller<T>({
  items,
  estimatedItemHeight,
  containerHeight,
  renderItem
}: DynamicVirtualScrollerProps<T>) {
  const scrollTop = signal(0);
  const itemHeights = signal<Map<number, number>>(new Map());

  const getItemHeight = (index: number) => {
    return itemHeights().get(index) ?? estimatedItemHeight;
  };

  const getItemOffset = (index: number) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i);
    }
    return offset;
  };

  const getTotalHeight = memo(() => {
    let height = 0;
    for (let i = 0; i < items.length; i++) {
      height += getItemHeight(i);
    }
    return height;
  });

  const getVisibleRange = () => {
    let start = 0;
    let end = items.length - 1;

    // Find start index
    let offset = 0;
    for (let i = 0; i < items.length; i++) {
      if (offset + getItemHeight(i) > scrollTop()) {
        start = i;
        break;
      }
      offset += getItemHeight(i);
    }

    // Find end index
    offset = getItemOffset(start);
    for (let i = start; i < items.length; i++) {
      if (offset > scrollTop() + containerHeight) {
        end = i;
        break;
      }
      offset += getItemHeight(i);
    }

    return { start, end };
  };

  const visibleRange = memo(() => getVisibleRange());

  const measureItem = (index: number, element: HTMLElement) => {
    const height = element.getBoundingClientRect().height;
    if (height !== itemHeights().get(index)) {
      const updated = new Map(itemHeights());
      updated.set(index, height);
      itemHeights.set(updated);
    }
  };

  return (
    <div
      style={{
        height: `${containerHeight}px`,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={(e) => scrollTop.set((e.target as HTMLElement).scrollTop)}
    >
      <div style={{ height: `${getTotalHeight()}px`, position: 'relative' }}>
        {items.slice(visibleRange().start, visibleRange().end + 1).map((item, i) => {
          const index = visibleRange().start + i;
          return (
            <div
              key={index}
              ref={(el) => el && measureItem(index, el)}
              style={{
                position: 'absolute',
                top: `${getItemOffset(index)}px`,
                width: '100%'
              }}
            >
              {renderItem(item, index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## Bidirectional Scrolling

### Grid Virtual Scroller

```typescript
interface GridVirtualScrollerProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  containerWidth: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => JSX.Element;
}

export function GridVirtualScroller<T>({
  items,
  itemWidth,
  itemHeight,
  containerWidth,
  containerHeight,
  renderItem
}: GridVirtualScrollerProps<T>) {
  const scrollTop = signal(0);
  const scrollLeft = signal(0);

  const columnsPerRow = Math.floor(containerWidth / itemWidth);
  const totalRows = Math.ceil(items.length / columnsPerRow);

  const visibleRows = () => {
    const start = Math.floor(scrollTop() / itemHeight);
    const count = Math.ceil(containerHeight / itemHeight) + 1;
    return { start, count };
  };

  const visibleColumns = () => {
    const start = Math.floor(scrollLeft() / itemWidth);
    const count = Math.ceil(containerWidth / itemWidth) + 1;
    return { start, count };
  };

  const visibleItems = () => {
    const rows = visibleRows();
    const cols = visibleColumns();
    const items: Array<{ item: T; row: number; col: number; index: number }> = [];

    for (let row = rows.start; row < rows.start + rows.count; row++) {
      for (let col = cols.start; col < cols.start + cols.count; col++) {
        const index = row * columnsPerRow + col;
        if (index < items.length) {
          items.push({ item: items[index], row, col, index });
        }
      }
    }

    return items;
  };

  return (
    <div
      style={{
        width: `${containerWidth}px`,
        height: `${containerHeight}px`,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={(e) => {
        const target = e.target as HTMLElement;
        scrollTop.set(target.scrollTop);
        scrollLeft.set(target.scrollLeft);
      }}
    >
      <div
        style={{
          width: `${columnsPerRow * itemWidth}px`,
          height: `${totalRows * itemHeight}px`,
          position: 'relative'
        }}
      >
        {visibleItems().map(({ item, row, col, index }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${col * itemWidth}px`,
              top: `${row * itemHeight}px`,
              width: `${itemWidth}px`,
              height: `${itemHeight}px`
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Performance Optimization

### Throttled Scroll

```typescript
import { signal } from '@philjs/core';

function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let lastCall = 0;
  let timeoutId: any;

  return ((...args: any[]) => {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func(...args);
      }, delay - (now - lastCall));
    }
  }) as T;
}

export function OptimizedVirtualScroller<T>(props: VirtualScrollerProps<T>) {
  const scrollTop = signal(0);

  const handleScroll = throttle((scrollY: number) => {
    scrollTop.set(scrollY);
  }, 16); // ~60fps

  return (
    <div
      onScroll={(e) => handleScroll((e.target as HTMLElement).scrollTop)}
    >
      {/* Virtual scroller content */}
    </div>
  );
}
```

### RequestAnimationFrame Optimization

```typescript
export function RAFVirtualScroller<T>(props: VirtualScrollerProps<T>) {
  const scrollTop = signal(0);
  let rafId: number | null = null;

  const handleScroll = (e: Event) => {
    if (rafId !== null) return;

    rafId = requestAnimationFrame(() => {
      scrollTop.set((e.target as HTMLElement).scrollTop);
      rafId = null;
    });
  };

  effect(() => {
    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  });

  return (
    <div onScroll={handleScroll}>
      {/* Virtual scroller content */}
    </div>
  );
}
```

## Infinite Scroll

### Load More on Scroll

```typescript
import { signal, effect } from '@philjs/core';

interface InfiniteScrollProps<T> {
  items: T[];
  loadMore: () => Promise<T[]>;
  hasMore: boolean;
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => JSX.Element;
}

export function InfiniteVirtualScroller<T>({
  items,
  loadMore,
  hasMore,
  itemHeight,
  containerHeight,
  renderItem
}: InfiniteScrollProps<T>) {
  const allItems = signal<T[]>(items);
  const loading = signal(false);
  const scrollTop = signal(0);

  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = () => Math.floor(scrollTop() / itemHeight);
  const endIndex = () => Math.min(
    startIndex() + visibleCount,
    allItems().length
  );

  const handleScroll = async (e: Event) => {
    const target = e.target as HTMLElement;
    scrollTop.set(target.scrollTop);

    // Load more when near bottom
    const scrolledToBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < itemHeight * 5;

    if (scrolledToBottom && hasMore && !loading()) {
      loading.set(true);
      const newItems = await loadMore();
      allItems.set([...allItems(), ...newItems]);
      loading.set(false);
    }
  };

  return (
    <div
      style={{
        height: `${containerHeight}px`,
        overflow: 'auto'
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: `${allItems().length * itemHeight}px` }}>
        <div style={{ transform: `translateY(${startIndex() * itemHeight}px)` }}>
          {allItems()
            .slice(startIndex(), endIndex())
            .map((item, i) => renderItem(item, startIndex() + i))}
        </div>
      </div>

      {loading() && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          Loading more...
        </div>
      )}
    </div>
  );
}
```

## Best Practices

### Use Fixed Heights When Possible

```typescript
// ✅ Fixed height (better performance)
<VirtualScroller
  items={items}
  itemHeight={50}
  renderItem={(item) => (
    <div style={{ height: '50px' }}>{item.name}</div>
  )}
/>

// ❌ Variable height (slower)
<DynamicVirtualScroller
  items={items}
  estimatedItemHeight={50}
  renderItem={(item) => (
    <div>{item.content}</div> // Unknown height
  )}
/>
```

### Add Overscan for Smooth Scrolling

```typescript
// ✅ Render extra items for smooth scroll
<VirtualScroller
  overscan={3}
  {...props}
/>

// ❌ No overscan (may show empty space during scroll)
<VirtualScroller
  overscan={0}
  {...props}
/>
```

### Throttle Scroll Events

```typescript
// ✅ Throttle scroll updates
const handleScroll = throttle((scrollY) => {
  scrollTop.set(scrollY);
}, 16);

// ❌ Update on every scroll event
const handleScroll = (e) => {
  scrollTop.set(e.target.scrollTop);
};
```

### Use Stable Keys

```typescript
// ✅ Stable keys for items
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}

// ❌ Index as key (can cause issues)
{items.map((item, i) => (
  <div key={i}>{item.name}</div>
))}
```

### Measure Heights Efficiently

```typescript
// ✅ Measure only once
const measureItem = (index: number, el: HTMLElement) => {
  if (!itemHeights().has(index)) {
    itemHeights().set(index, el.getBoundingClientRect().height);
  }
};

// ❌ Measure on every render
const measureItem = (index: number, el: HTMLElement) => {
  itemHeights().set(index, el.getBoundingClientRect().height);
};
```

## Summary

You've learned:

✅ Basic virtual scrolling for fixed heights
✅ Variable height virtual scrolling
✅ Bidirectional (grid) virtual scrolling
✅ Performance optimization techniques
✅ Infinite scroll implementation
✅ Best practices for virtual scrolling

Virtual scrolling enables smooth rendering of massive lists!

---

**Next:** [Bundle Optimization →](./bundle-optimization.md) Reduce bundle size
