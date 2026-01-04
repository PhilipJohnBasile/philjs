# @philjs/virtual

The `@philjs/virtual` package provides high-performance list and grid virtualization for PhilJS, rendering millions of items efficiently with windowing.

## Installation

```bash
npm install @philjs/virtual
```

## Features

- **List Virtualization** - Render only visible items
- **Grid Virtualization** - Efficient grid layouts
- **Dynamic Sizing** - Variable height/width items
- **Smooth Scrolling** - Momentum-based scroll
- **Window Scroller** - Full-page virtualization
- **TanStack Virtual Compatible** - Similar API

## Quick Start

```typescript
import { createVirtualizer, VirtualList } from '@philjs/virtual';

// Component API
function MyList() {
  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
  }));

  return (
    <VirtualList
      items={items}
      height={400}
      itemHeight={35}
      renderItem={(item, index, style) => (
        <div style={style}>{item.name}</div>
      )}
    />
  );
}

// Imperative API
const scrollRef = document.getElementById('scroll-container');
const virtualizer = createVirtualizer({
  count: 10000,
  getScrollElement: () => scrollRef,
  estimateSize: () => 35,
});
```

---

## Core Virtualizer

### Creating a Virtualizer

```typescript
import { createVirtualizer } from '@philjs/virtual';
import type { VirtualizerOptions, Virtualizer } from '@philjs/virtual';

const virtualizer = createVirtualizer({
  // Required
  count: 10000,
  getScrollElement: () => document.getElementById('list'),
  estimateSize: (index) => 35,

  // Optional
  horizontal: false,          // Horizontal scroll
  overscan: 3,               // Extra items to render
  smoothScroll: true,        // Enable smooth scrolling
  initialOffset: 0,          // Starting scroll position
  lanes: 1,                  // For grid layouts
  gap: 0,                    // Gap between items
  paddingStart: 0,           // Top/left padding
  paddingEnd: 0,             // Bottom/right padding
  debug: false,              // Debug logging

  // Callbacks
  onChange: (virtualizer) => {
    console.log('Virtualizer updated');
  },
  measureElement: (element) => {
    return element.clientHeight;
  },
});
```

### Virtualizer Methods

```typescript
// Get visible virtual items
const items = virtualizer.getVirtualItems();

// Get items including overscan
const allItems = virtualizer.getVirtualItemsWithOverscan();

// Get total size of all items
const totalSize = virtualizer.getTotalSize();

// Scroll to specific index
virtualizer.scrollToIndex(500, {
  align: 'center',   // 'start' | 'center' | 'end' | 'auto'
  behavior: 'smooth' // 'auto' | 'smooth'
});

// Scroll to specific offset
virtualizer.scrollToOffset(5000, { behavior: 'smooth' });

// Get current scroll offset
const offset = virtualizer.getScrollOffset();

// Get visible range
const { start, end } = virtualizer.getVisibleRange();

// Check if index is visible
const isVisible = virtualizer.isIndexVisible(100);

// Measure a specific element
virtualizer.measureElement(element);

// Get measured size
const size = virtualizer.getMeasuredSize(index);

// Force re-calculation
virtualizer.measure();

// Cleanup
virtualizer.cleanup();
```

### VirtualItem Type

```typescript
interface VirtualItem {
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
```

---

## VirtualList Component

### Basic Usage

```typescript
import { VirtualList } from '@philjs/virtual';
import type { VirtualListProps } from '@philjs/virtual';

interface Item {
  id: number;
  name: string;
  description: string;
}

function ItemList({ items }: { items: Item[] }) {
  return (
    <VirtualList
      items={items}
      height={500}
      itemHeight={50}
      renderItem={(item, index, style) => (
        <div style={style} key={item.id}>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
        </div>
      )}
    />
  );
}
```

### With Dynamic Heights

```typescript
function DynamicList({ items }) {
  return (
    <VirtualList
      items={items}
      height={500}
      itemHeight={(index) => {
        // Variable heights based on content
        return items[index].expanded ? 150 : 50;
      }}
      renderItem={(item, index, style) => (
        <div style={style}>
          {item.name}
          {item.expanded && <div>{item.details}</div>}
        </div>
      )}
    />
  );
}
```

### Horizontal List

```typescript
function HorizontalGallery({ images }) {
  return (
    <VirtualList
      items={images}
      height={200}
      width={800}
      itemHeight={180}
      horizontal={true}
      gap={16}
      renderItem={(image, index, style) => (
        <div style={style}>
          <img src={image.url} alt={image.alt} />
        </div>
      )}
    />
  );
}
```

### With Callbacks

```typescript
function CallbackList({ items }) {
  return (
    <VirtualList
      items={items}
      height={500}
      itemHeight={50}
      overscan={5}
      onScroll={(offset) => {
        console.log('Scrolled to:', offset);
      }}
      onVisibleRangeChange={(start, end) => {
        console.log(`Visible: ${start} - ${end}`);
        // Prefetch data for next page
        if (end > items.length - 20) {
          loadMoreItems();
        }
      }}
      getKey={(item, index) => item.id}
      renderItem={(item, index, style) => (
        <div style={style}>{item.name}</div>
      )}
    />
  );
}
```

### VirtualListProps

```typescript
interface VirtualListProps<T> {
  /** Items to render */
  items: T[];

  /** Container height (px or CSS value) */
  height: number | string;

  /** Container width (for horizontal lists) */
  width?: number | string;

  /** Item height (fixed or function) */
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
```

---

## VirtualGrid Component

### Basic Grid

```typescript
import { VirtualGrid } from '@philjs/virtual';
import type { VirtualGridProps } from '@philjs/virtual';

function ImageGrid({ images }) {
  return (
    <VirtualGrid
      items={images}
      height={600}
      columns={4}
      rowHeight={200}
      gap={16}
      renderItem={(image, index, style) => (
        <div style={style}>
          <img src={image.thumbnail} alt={image.alt} />
          <p>{image.title}</p>
        </div>
      )}
    />
  );
}
```

### Responsive Grid

```typescript
function ResponsiveGrid({ items }) {
  const [columns, setColumns] = useState(4);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 600) setColumns(2);
      else if (width < 900) setColumns(3);
      else setColumns(4);
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  return (
    <VirtualGrid
      items={items}
      height="100vh"
      columns={columns}
      rowHeight={250}
      gap={20}
      renderItem={(item, index, style) => (
        <Card style={style} {...item} />
      )}
    />
  );
}
```

### VirtualGridProps

```typescript
interface VirtualGridProps<T> {
  /** Items to render */
  items: T[];

  /** Container height */
  height: number | string;

  /** Number of columns */
  columns: number;

  /** Row height */
  rowHeight: number;

  /** Column width (optional, auto-calculated) */
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
```

---

## Window Scrolling

### Full-Page Virtualization

```typescript
import { createWindowScroller, useWindowVirtualizer } from '@philjs/virtual';

// Imperative
const windowScroller = createWindowScroller({
  count: 10000,
  estimateSize: () => 100,
  overscan: 5,
});

// Hook-style
function FullPageList({ items }) {
  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => 100,
    overscan: 5,
  });

  return (
    <div style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((virtualItem) => (
        <div
          key={virtualItem.key}
          style={{
            position: 'absolute',
            top: virtualItem.start,
            height: virtualItem.size,
          }}
        >
          {items[virtualItem.index].name}
        </div>
      ))}
    </div>
  );
}
```

---

## Utility Functions

### calculateVisibleRange

```typescript
import { calculateVisibleRange } from '@philjs/virtual';

const { startIndex, endIndex, startOffset } = calculateVisibleRange(
  scrollOffset,    // Current scroll position
  containerSize,   // Visible container size
  itemCount,       // Total items
  getItemSize,     // (index) => size
  overscan         // Extra items
);
```

### findIndexAtOffset

```typescript
import { findIndexAtOffset } from '@philjs/virtual';

// Binary search for item at offset
const index = findIndexAtOffset(
  offset,          // Target offset
  itemCount,       // Total items
  getItemOffset    // (index) => offset
);
```

### createSmoothScroller

```typescript
import { createSmoothScroller } from '@philjs/virtual';

const scroller = createSmoothScroller({
  getScrollElement: () => containerRef,
  friction: 0.95,
});

// Apply momentum scroll
scroller.scroll(delta);

// Scroll to position
scroller.scrollTo(1000);

// Stop scrolling
scroller.stop();
```

---

## Hooks API

### useVirtualizer

```typescript
import { useVirtualizer } from '@philjs/virtual';

function VirtualizedList() {
  const containerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: 10000,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });

  return (
    <div ref={containerRef} style={{ height: 400, overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            data-index={item.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${item.start}px)`,
            }}
          >
            Row {item.index}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### useWindowVirtualizer

```typescript
import { useWindowVirtualizer } from '@philjs/virtual';

function InfiniteScroll({ items, loadMore }) {
  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => 100,
    overscan: 10,
  });

  // Load more when near bottom
  useEffect(() => {
    const { end } = virtualizer.getVisibleRange();
    if (end > items.length - 20) {
      loadMore();
    }
  });

  return (
    <div style={{ height: virtualizer.getTotalSize() }}>
      {virtualizer.getVirtualItems().map((item) => (
        <ItemRow key={item.key} item={items[item.index]} style={item} />
      ))}
    </div>
  );
}
```

---

## Performance Tips

### 1. Use Stable Keys

```typescript
// Good - stable keys
getKey={(item) => item.id}

// Avoid - index as key for dynamic lists
getKey={(item, index) => index}
```

### 2. Memoize Render Items

```typescript
const MemoizedItem = memo(({ item, style }) => (
  <div style={style}>{item.name}</div>
));

<VirtualList
  renderItem={(item, index, style) => (
    <MemoizedItem key={item.id} item={item} style={style} />
  )}
/>
```

### 3. Optimize Measure Functions

```typescript
// Good - cache measurements
const sizeCache = new Map();
const estimateSize = (index) => sizeCache.get(index) ?? 50;

// Avoid - expensive calculations
const estimateSize = (index) => calculateComplexHeight(items[index]);
```

### 4. Use Appropriate Overscan

```typescript
// Fast scrolling - more overscan
overscan={10}

// Normal scrolling - default
overscan={3}

// Memory constrained - less overscan
overscan={1}
```

---

## Types Reference

```typescript
interface VirtualizerOptions<TScrollElement> {
  count: number;
  getScrollElement: () => TScrollElement | null;
  estimateSize: (index: number) => number;
  horizontal?: boolean;
  overscan?: number;
  smoothScroll?: boolean;
  initialOffset?: number;
  onChange?: (virtualizer: Virtualizer<TScrollElement>) => void;
  measureElement?: (element: Element) => number;
  lanes?: number;
  gap?: number;
  paddingStart?: number;
  paddingEnd?: number;
  debug?: boolean;
}

interface Virtualizer<TScrollElement> {
  getVirtualItems: () => VirtualItem[];
  getVirtualItemsWithOverscan: () => VirtualItem[];
  getTotalSize: () => number;
  scrollToIndex: (index: number, options?: ScrollToOptions) => void;
  scrollToOffset: (offset: number, options?: ScrollToOptions) => void;
  getScrollOffset: () => number;
  measureElement: (element: Element | null) => void;
  getMeasuredSize: (index: number) => number | undefined;
  measure: () => void;
  getVisibleRange: () => { start: number; end: number };
  isIndexVisible: (index: number) => boolean;
  cleanup: () => void;
  options: VirtualizerOptions<TScrollElement>;
}

interface ScrollToOptions {
  align?: 'start' | 'center' | 'end' | 'auto';
  behavior?: 'auto' | 'smooth';
}
```

---

## API Reference

| Export | Description |
|--------|-------------|
| `createVirtualizer` | Create virtualizer instance |
| `VirtualList` | Virtual list component |
| `VirtualGrid` | Virtual grid component |
| `useVirtualizer` | Hook for virtualization |
| `useWindowVirtualizer` | Window-scroller hook |
| `createWindowScroller` | Window scroller instance |
| `calculateVisibleRange` | Calculate visible items |
| `findIndexAtOffset` | Binary search for index |
| `createSmoothScroller` | Momentum scroll handler |

### Constants

| Export | Description |
|--------|-------------|
| `DEFAULT_OVERSCAN` | Default overscan (3) |
| `DEFAULT_SCROLL_DEBOUNCE` | Scroll debounce (16ms) |

---

## Next Steps

- [Performance Optimization](../../performance/virtual-scrolling.md)
- [@philjs/ui Data Display](../ui/data-display.md)
- [@philjs/core Signals](../core/signals.md)
