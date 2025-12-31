# Performance Best Practices

Optimize your PhilJS applications for maximum performance using Node.js 24+, TypeScript 6, and ES2024 features.

## Requirements

- **Node.js 24+** - Required for native ES2024 support
- **TypeScript 6+** - Required for isolated declarations and optimal build performance

## Fine-Grained Reactivity Advantages

PhilJS uses fine-grained reactivity, which means:

- Only affected DOM nodes update
- No virtual DOM diffing overhead
- No full component re-renders
- Automatic dependency tracking
- Minimal re-computation

```tsx
import { signal, memo } from '@philjs/core';

function Counter() {
  const count = signal(0);
  const doubled = memo(() => count() * 2);

  // When count changes:
  // 1. Only `count()` text node updates
  // 2. Only `doubled()` text node updates
  // 3. Button, div, and other elements untouched

  return (
    <div>
      <p>Count: {count()}</p>
      <p>Doubled: {doubled()}</p>
      <button onClick={() => count.set(count() + 1)}>Increment</button>
    </div>
  );
}
```

## ES2024 Performance Patterns

### Use Native Array Methods (ES2024)

ES2024 provides immutable array methods that are optimized by V8:

```tsx
const items = signal<Item[]>([...largeArray]);

// Use toSorted() instead of sort() for immutability
const sorted = memo(() =>
  items().toSorted((a, b) => b.score - a.score)
);

// Use toSpliced() for immutable splice operations
const withoutFirst = memo(() =>
  items().toSpliced(0, 1)
);

// Use toReversed() for immutable reversal
const reversed = memo(() =>
  items().toReversed()
);

// Combine with at() for safer indexing
const lastItem = memo(() =>
  items().at(-1)
);
```

### Use Object.groupBy() and Map.groupBy()

Native grouping is faster than manual reduce operations:

```tsx
const users = signal<User[]>([]);

// Use Object.groupBy() for grouping by string keys
const usersByRole = memo(() =>
  Object.groupBy(users(), user => user.role)
);

// Use Map.groupBy() for complex keys
const usersByDepartment = memo(() =>
  Map.groupBy(users(), user => user.department)
);
```

### Use Promise.withResolvers() for Async Patterns

```tsx
function createDeferredSignal<T>() {
  const { promise, resolve, reject } = Promise.withResolvers<T>();
  const data = signal<T | null>(null);
  const error = signal<Error | null>(null);

  promise.then(
    value => data.set(value),
    err => error.set(err)
  );

  return { data, error, resolve, reject };
}
```

## Memoization

### Use memo() for Expensive Computations

```tsx
const items = signal<Item[]>([...largeArray]);

// Memoize expensive operations using ES2024 immutable methods
const filtered = memo(() =>
  items().filter(item => item.active && item.score > 50)
);

const sorted = memo(() =>
  filtered().toSorted((a, b) => b.score - a.score)
);

const top10 = memo(() =>
  sorted().slice(0, 10)
);

// Avoid: computing inline without memoization
function BadComponent() {
  return (
    <div>
      {items()
        .filter(item => item.active && item.score > 50)
        .toSorted((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(item => <ItemCard key={item.id} item={item} />)
      }
    </div>
  );
}
```

### When NOT to Use memo()

```tsx
// ❌ Overkill for simple operations
const doubled = memo(() => count() * 2);

// ✅ Just compute it
const doubled = () => count() * 2;

// ❌ Memoizing simple references
const userName = memo(() => user().name);

// ✅ Access directly
const userName = () => user().name;
```

## Batching Updates

### Batch Related Changes

```tsx
import { batch } from '@philjs/core';

// ✅ Batch multiple signal updates
function updateUser(updates: Partial<User>) {
  batch(() => {
    firstName.set(updates.firstName || firstName());
    lastName.set(updates.lastName || lastName());
    email.set(updates.email || email());
    age.set(updates.age || age());
  });
}

// ❌ Sequential updates trigger effects multiple times
function badUpdate(updates: Partial<User>) {
  firstName.set(updates.firstName || firstName());
  lastName.set(updates.lastName || lastName());
  email.set(updates.email || email());
  age.set(updates.age || age());
}
```

### Batch in Loops

```tsx
// ✅ Batch updates when processing arrays
function processItems(newItems: Item[]) {
  batch(() => {
    newItems.forEach(item => {
      items.set([...items(), item]);
    });
  });
}

// Even better: single update
function processItemsBetter(newItems: Item[]) {
  items.set([...items(), ...newItems]);
}
```

## Lazy Loading

### Code Splitting with lazy()

```tsx
import { lazy, Suspense } from '@philjs/core';

// ✅ Split large components
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));
const Analytics = lazy(() => import('./Analytics'));

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/settings" component={Settings} />
        <Route path="/analytics" component={Analytics} />
      </Suspense>
    </Router>
  );
}
```

### Route-Based Splitting

```tsx
const routes = [
  {
    path: '/',
    component: lazy(() => import('./pages/Home'))
  },
  {
    path: '/products',
    component: lazy(() => import('./pages/Products'))
  },
  {
    path: '/checkout',
    component: lazy(() => import('./pages/Checkout'))
  }
];
```

### Component-Based Splitting

```tsx
// Heavy editor only loaded when needed
const CodeEditor = lazy(() => import('./CodeEditor'));

function DocumentEditor() {
  const showCodeEditor = signal(false);

  return (
    <div>
      <button onClick={() => showCodeEditor.set(true)}>
        Show Code Editor
      </button>

      {showCodeEditor() && (
        <Suspense fallback={<EditorLoader />}>
          <CodeEditor />
        </Suspense>
      )}
    </div>
  );
}
```

## List Virtualization

### Virtual Scrolling

```tsx
import { signal, memo } from '@philjs/core';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => JSX.Element;
}

function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem
}: VirtualListProps<T>) {
  const scrollTop = signal(0);

  const visibleRange = memo(() => {
    const start = Math.floor(scrollTop() / itemHeight);
    const count = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + count + 1, items.length);

    return { start, end };
  });

  const visibleItems = memo(() => {
    const { start, end } = visibleRange();
    return items.slice(start, end);
  });

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange().start * itemHeight;

  return (
    <div
      style={{ height: `${containerHeight}px`, overflow: 'auto' }}
      onScroll={(e) => scrollTop.set(e.currentTarget.scrollTop)}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems().map((item, index) =>
            renderItem(item, visibleRange().start + index)
          )}
        </div>
      </div>
    </div>
  );
}

// Usage
<VirtualList
  items={largeArray}
  itemHeight={50}
  containerHeight={400}
  renderItem={(item, index) => (
    <div key={index} style={{ height: '50px' }}>
      {item.name}
    </div>
  )}
/>
```

## Debouncing and Throttling

### Debounce Search

```tsx
function SearchBar() {
  const searchTerm = signal('');
  const debouncedTerm = signal('');

  let timeoutId: number;

  effect(() => {
    const term = searchTerm();

    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      debouncedTerm.set(term);
    }, 300);

    return () => clearTimeout(timeoutId);
  });

  effect(async () => {
    const term = debouncedTerm();
    if (term) {
      const results = await searchAPI(term);
      // Update results
    }
  });

  return (
    <input
      value={searchTerm()}
      onInput={(e) => searchTerm.set(e.currentTarget.value)}
      placeholder="Search..."
    />
  );
}
```

### Throttle Scroll

```tsx
function ScrollTracker() {
  const scrollY = signal(0);

  let throttleTimeout: number | null = null;

  const handleScroll = () => {
    if (throttleTimeout) return;

    throttleTimeout = setTimeout(() => {
      scrollY.set(window.scrollY);
      throttleTimeout = null;
    }, 100);
  };

  effect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  });

  return <div>Scroll Position: {scrollY()}</div>;
}
```

## Image Optimization

### Lazy Load Images

```tsx
function LazyImage({ src, alt }: { src: string; alt: string }) {
  const imgRef = signal<HTMLImageElement | null>(null);
  const isVisible = signal(false);

  effect(() => {
    const img = imgRef();
    if (!img) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        isVisible.set(true);
        observer.disconnect();
      }
    });

    observer.observe(img);

    return () => observer.disconnect();
  });

  return (
    <img
      ref={imgRef}
      src={isVisible() ? src : ''}
      alt={alt}
      loading="lazy"
    />
  );
}
```

### Progressive Images

```tsx
function ProgressiveImage({
  lowResSrc,
  highResSrc,
  alt
}: {
  lowResSrc: string;
  highResSrc: string;
  alt: string;
}) {
  const loaded = signal(false);

  return (
    <div className="progressive-image">
      <img
        src={lowResSrc}
        alt={alt}
        className={loaded() ? 'hidden' : 'blur'}
      />
      <img
        src={highResSrc}
        alt={alt}
        className={loaded() ? 'visible' : 'hidden'}
        onLoad={() => loaded.set(true)}
      />
    </div>
  );
}
```

## Bundle Optimization

### Import Only What You Need

```tsx
// ❌ Importing entire library
import _ from 'lodash';
const result = _.debounce(fn, 300);

// ✅ Import specific function
import debounce from 'lodash/debounce';
const result = debounce(fn, 300);

// Even better: use native or PhilJS utilities
```

### Dynamic Imports

```tsx
// ✅ Load heavy libraries only when needed
async function processImage(image: File) {
  const { default: imageProcessingLib } = await import('heavy-image-lib');
  return imageProcessingLib.process(image);
}

// ✅ Load data only when needed
async function loadChartData() {
  const data = await import('./chartData.json');
  return data.default;
}
```

## Avoid Unnecessary Work

### Skip Effects with untrack()

```tsx
import { untrack } from '@philjs/core';

const userId = signal('123');
const userName = signal('Alice');

effect(() => {
  // Only track userId, not userName
  console.log('User ID changed:', userId());

  // Read userName without tracking
  const name = untrack(() => userName());
  console.log('Current name:', name);
});
```

### Conditional Tracking

```tsx
const enabled = signal(true);
const value = signal(0);

effect(() => {
  if (!enabled()) return;

  // Only track value when enabled
  console.log('Value:', value());
});
```

## Web Workers

### Offload Heavy Computation

```tsx
// worker.ts
self.onmessage = (e) => {
  const { data } = e;

  // Heavy computation
  const result = expensiveOperation(data);

  self.postMessage(result);
};

// Component
function HeavyComputation() {
  const result = signal<any>(null);
  const loading = signal(false);

  const compute = async (data: any) => {
    loading.set(true);

    const worker = new Worker(new URL('./worker.ts', import.meta.url));

    worker.postMessage(data);

    worker.onmessage = (e) => {
      result.set(e.data);
      loading.set(false);
      worker.terminate();
    };
  };

  return (
    <div>
      <button onClick={() => compute(inputData)}>
        Compute
      </button>

      {loading() && <Spinner />}
      {result() && <ResultView data={result()} />}
    </div>
  );
}
```

## Measuring Performance

### Performance Profiling

```tsx
function ProfiledComponent() {
  effect(() => {
    performance.mark('component-start');

    // Component logic

    performance.mark('component-end');
    performance.measure(
      'component-render',
      'component-start',
      'component-end'
    );

    const measure = performance.getEntriesByName('component-render')[0];
    console.log('Render time:', measure.duration);
  });

  return <div>Content</div>;
}
```

### Track Effect Performance

```tsx
function trackEffect(name: string, fn: () => void | (() => void)) {
  return effect(() => {
    const start = performance.now();

    const cleanup = fn();

    const duration = performance.now() - start;
    if (duration > 16) { // Longer than one frame
      console.warn(`Slow effect "${name}": ${duration}ms`);
    }

    return cleanup;
  });
}

// Usage
trackEffect('fetchUserData', () => {
  const data = fetchUser(userId());
  user.set(data);
});
```

## Memory Management

### Clean Up Effects

```tsx
// ✅ Always clean up subscriptions
function Component() {
  effect(() => {
    const subscription = dataStream.subscribe(data => {
      processData(data);
    });

    return () => subscription.unsubscribe();
  });

  return <div>Content</div>;
}

// ✅ Clean up timers
function Timer() {
  const count = signal(0);

  effect(() => {
    const id = setInterval(() => {
      count.set(count() + 1);
    }, 1000);

    return () => clearInterval(id);
  });

  return <div>{count()}</div>;
}

// ✅ Clean up event listeners
function ScrollListener() {
  effect(() => {
    const handler = () => console.log('Scrolled');

    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  });

  return <div>Scroll tracker</div>;
}
```

### Avoid Memory Leaks

```tsx
// ❌ Creating new objects in signals
const config = signal({
  theme: 'dark',
  language: 'en'
});

setInterval(() => {
  config.set({
    ...config(),
    timestamp: Date.now() // Creates new object every second!
  });
}, 1000);

// ✅ Only update when necessary
const lastUpdate = signal(Date.now());

setInterval(() => {
  if (shouldUpdate()) {
    lastUpdate.set(Date.now());
  }
}, 1000);
```

## Caching

### Memoized API Calls

```tsx
function createCachedFetch<T>(fetcher: (key: string) => Promise<T>) {
  const cache = new Map<string, T>();

  return async (key: string): Promise<T> => {
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const data = await fetcher(key);
    cache.set(key, data);
    return data;
  };
}

const fetchUser = createCachedFetch((userId: string) =>
  api.get(`/users/${userId}`)
);

// Usage
const user = signal<User | null>(null);

effect(async () => {
  const data = await fetchUser(userId()); // Cached on subsequent calls
  user.set(data);
});
```

## TypeScript 6 Build Performance

### Enable Isolated Declarations

TypeScript 6's isolated declarations provide faster builds:

```json
{
  "compilerOptions": {
    "isolatedDeclarations": true,
    "declaration": true,
    "declarationMap": true
  }
}
```

### Use Strict Type Checking

Strict checking catches performance issues at compile time:

```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true
  }
}
```

## Summary

**Performance Best Practices:**

ES2024 Features:
- Use `toSorted()`, `toReversed()`, `toSpliced()` for immutable array operations
- Use `Object.groupBy()` and `Map.groupBy()` for efficient grouping
- Use `Promise.withResolvers()` for cleaner async patterns
- Use `Set` methods (`union`, `intersection`, `difference`) for set operations

Reactivity:
- Leverage fine-grained reactivity
- Use memo() for expensive computations
- Batch related signal updates

Code Organization:
- Implement code splitting with lazy()
- Virtualize long lists
- Debounce/throttle frequent operations
- Lazy load images
- Optimize bundle size

Runtime:
- Use Web Workers for heavy computation
- Profile and measure performance
- Clean up effects properly
- Cache API responses
- Avoid unnecessary re-computation

TypeScript 6:
- Enable isolated declarations for faster builds
- Use strict type checking

**Next:** [Testing](./testing.md)
