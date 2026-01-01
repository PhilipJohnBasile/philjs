# Performance Optimization Guide

Master PhilJS performance optimization with automatic and manual techniques.

## What You'll Learn

- Auto-memo patterns and when they apply
- Auto-batch patterns for multiple updates
- Manual optimization techniques
- Profiling with browser DevTools
- Bundle size optimization strategies
- Real-world performance patterns
- Code examples for each optimization

## Table of Contents

1. [Understanding PhilJS Performance](#understanding-philjs-performance)
2. [Auto-Memo Optimization](#auto-memo-optimization)
3. [Auto-Batch Optimization](#auto-batch-optimization)
4. [Manual Optimization Techniques](#manual-optimization-techniques)
5. [Profiling with DevTools](#profiling-with-devtools)
6. [Bundle Size Optimization](#bundle-size-optimization)
7. [Performance Patterns](#performance-patterns)
8. [Best Practices](#best-practices)

## Understanding PhilJS Performance

PhilJS delivers exceptional performance through fine-grained reactivity and automatic optimizations.

### Key Performance Metrics

Based on real benchmarks (from `metrics/PERFORMANCE.md`):

```typescript
// PhilJS Performance Characteristics
const performanceProfile = {
  signalCreation: '21.7M ops/sec',    // ~46ns per signal
  signalRead: '17.0M ops/sec',        // ~59ns per read
  signalWrite: '14.5M ops/sec',       // ~69ns per write
  memoComputation: '1.5M ops/sec',    // ~640ns per compute
  componentRender: '19.8M ops/sec',   // ~50ns per component
  bundleSize: '3.3KB gzipped'         // Core library
};
```

### When to Optimize

```typescript
// Profile first, optimize later
console.time('operation');
const result = expensiveOperation();
console.timeEnd('operation');

// Only optimize if:
// - Operation takes >16ms (blocks 60fps frame)
// - Operation runs frequently (>10 times per second)
// - Operation is user-visible (affects UX)
```

## Auto-Memo Optimization

The PhilJS compiler automatically detects expensive computations and applies memoization.

### What Gets Auto-Memoized

The compiler identifies these patterns for automatic memoization:

```typescript
// ✅ Multiple signal reads in JSX
function UserProfile({ userId }: Props) {
  const user = signal(/* ... */);
  const settings = signal(/* ... */);
  const permissions = signal(/* ... */);

  // Compiler auto-wraps in memo() because it reads 3+ signals
  return (
    <div>
      {user().name} - {settings().theme} - {permissions().level}
    </div>
  );
}

// ✅ Expensive computations
function DataGrid() {
  const data = signal(largeDataset);

  // Compiler detects array operations + filtering = expensive
  const filtered = data()
    .filter(item => item.active)
    .map(item => transform(item))
    .sort((a, b) => a.value - b.value);

  return <Table data={filtered} />;
}

// ✅ Derived state with multiple dependencies
function ShoppingCart() {
  const items = signal(/* ... */);
  const discounts = signal(/* ... */);
  const taxRate = signal(0.08);

  // Auto-memoized: reads 3 signals + calculations
  const total = items().reduce((sum, item) =>
    sum + item.price * item.quantity, 0
  ) * (1 - discounts()) * (1 + taxRate());

  return <div>Total: ${total.toFixed(2)}</div>;
}
```

### Manual Memo for Complex Cases

Use manual `memo()` when you need explicit control:

```typescript
import { signal, memo } from '@philjs/core';

function AdvancedAnalytics() {
  const events = signal<Event[]>([]);

  // Manual memo for complex analysis
  const statistics = memo(() => {
    const data = events();

    return {
      total: data.length,
      byCategory: groupBy(data, 'category'),
      trends: calculateTrends(data),
      predictions: runMLModel(data), // Heavy computation
      percentiles: calculatePercentiles(data)
    };
  });

  return (
    <div>
      <StatCard data={statistics()} />
    </div>
  );
}
```

### LinkedSignal for Writable Computed Values

Use `linkedSignal` when you need a computed value that can be manually overridden:

```typescript
import { signal, linkedSignal } from '@philjs/core';

function SmartSearchBox() {
  const query = signal('');
  const history = signal<string[]>([]);

  // Acts like memo, but can be overridden
  const suggestion = linkedSignal(() => {
    const q = query().toLowerCase();
    return history().find(h => h.toLowerCase().startsWith(q)) || '';
  });

  const handleInput = (value: string) => {
    query.set(value);
    // suggestion auto-updates based on query
  };

  const acceptSuggestion = () => {
    // Manually override the computed value
    query.set(suggestion());
  };

  const customizeSuggestion = (custom: string) => {
    // Override computed value temporarily
    suggestion.set(custom);
  };

  return (
    <div>
      <input
        value={query()}
        onInput={(e) => handleInput(e.target.value)}
        placeholder="Search..."
      />
      {suggestion() && (
        <div class="suggestion" onClick={acceptSuggestion}>
          {suggestion()}
        </div>
      )}
    </div>
  );
}
```

### When NOT to Use Memo

```typescript
// ❌ Don't memo simple operations
const doubled = memo(() => count() * 2); // Overkill

// ✅ Just compute directly
const doubled = count() * 2;

// ❌ Don't memo single signal reads
const userName = memo(() => user().name);

// ✅ Access directly
const userName = user().name;

// ❌ Don't memo values that change frequently
const timestamp = memo(() => Date.now()); // Useless cache

// ✅ Use signal if it needs to be reactive
const timestamp = signal(Date.now());
setInterval(() => timestamp.set(Date.now()), 1000);
```

## Auto-Batch Optimization

The compiler automatically detects multiple signal updates and wraps them in `batch()`.

### What Gets Auto-Batched

```typescript
// ✅ Consecutive signal updates in event handlers
function FormHandler() {
  const name = signal('');
  const email = signal('');
  const age = signal(0);

  const handleSubmit = () => {
    // Compiler auto-wraps in batch()
    // Only 1 re-render instead of 3
    name.set('John');
    email.set('john@example.com');
    age.set(30);

    // Equivalent to:
    // batch(() => {
    //   name.set('John');
    //   email.set('john@example.com');
    //   age.set(30);
    // });
  };

  return <button onClick={handleSubmit}>Submit</button>;
}

// ✅ Multiple updates in async callbacks
async function DataLoader() {
  const loading = signal(false);
  const data = signal(null);
  const error = signal(null);

  const fetchData = async () => {
    loading.set(true);

    try {
      const result = await fetch('/api/data');
      // Compiler detects multiple updates after await
      loading.set(false);
      data.set(result);
      error.set(null);
    } catch (e) {
      loading.set(false);
      error.set(e);
    }
  };

  return <button onClick={fetchData}>Load</button>;
}

// ✅ Loop-based updates
function BulkUpdate() {
  const items = signal<Item[]>([]);

  const processItems = (updates: Update[]) => {
    // Compiler detects loop with signal updates
    updates.forEach(update => {
      const item = items().find(i => i.id === update.id);
      if (item) {
        item.processed = true;
      }
    });
    items.set([...items()]); // Trigger once after loop
  };

  return <button onClick={() => processItems(queue)}>Process</button>;
}
```

### Manual Batch for Complex Scenarios

```typescript
import { signal, batch } from '@philjs/core';

function ComplexStateUpdate() {
  const user = signal({ name: '', age: 0 });
  const settings = signal({ theme: 'dark', lang: 'en' });
  const preferences = signal({ notifications: true });

  const updateProfile = (profile: Profile) => {
    // Manual batch for non-consecutive updates
    batch(() => {
      user.set(profile.user);

      if (profile.settings) {
        settings.set(profile.settings);
      }

      if (profile.preferences) {
        preferences.set(profile.preferences);
      }

      // Complex logic between updates
      logAnalytics('profile_updated', profile);

      // More updates
      updateLastModified();
      invalidateCache();
    });
  };

  return <button onClick={() => updateProfile(data)}>Update</button>;
}

// Nested batches are automatically flattened
function NestedBatches() {
  const a = signal(0);
  const b = signal(0);
  const c = signal(0);

  const update = () => {
    batch(() => {
      a.set(1);

      batch(() => {
        b.set(2); // Same batch as outer
        c.set(3); // Same batch as outer
      });

      // All updates flush together
    });
  };

  return <button onClick={update}>Update All</button>;
}
```

### Performance Impact of Batching

Based on benchmarks:

```typescript
// Without batching: 50 individual updates
// Time: ~889μs (17.8μs per update)
for (let i = 0; i < 50; i++) {
  signals[i].set(i);
}

// With batching: 50 updates in one flush
// Time: ~784μs (15.7μs per update)
// Performance improvement: ~14%
batch(() => {
  for (let i = 0; i < 50; i++) {
    signals[i].set(i);
  }
});

// Best practice: batch when updating 2+ signals
// Single update overhead: ~69ns
// Batch overhead: ~337ns
// Break-even point: 3 signal updates
```

## Manual Optimization Techniques

### 1. Optimize List Rendering

```typescript
// ❌ Recreates all items on every update
function TodoList() {
  const todos = signal<Todo[]>([]);

  return (
    <ul>
      {todos().map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

// ✅ Use keyed rendering for stable references
function TodoList() {
  const todos = signal<Todo[]>([]);

  return (
    <ul>
      {todos().map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

// ✅ For large lists, use virtual scrolling
import { createVirtualizer } from '@tanstack/virtual';

function LargeList({ items }: { items: Item[] }) {
  const parentRef = signal<HTMLElement | null>(null);

  const virtualizer = createVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef(),
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ListItem item={items[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Debounce Expensive Operations

```typescript
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let timeoutId: any;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

function SearchComponent() {
  const query = signal('');
  const results = signal<Result[]>([]);

  // Debounce API calls
  const search = debounce(async (q: string) => {
    if (!q) {
      results.set([]);
      return;
    }

    const data = await fetch(`/api/search?q=${q}`).then(r => r.json());
    results.set(data);
  }, 300);

  return (
    <div>
      <input
        value={query()}
        onInput={(e) => {
          query.set(e.target.value);
          search(e.target.value);
        }}
        placeholder="Search..."
      />
      <ResultsList results={results()} />
    </div>
  );
}
```

### 3. Optimize Effects with Cleanup

```typescript
import { effect, onCleanup } from '@philjs/core';

function RealtimeComponent() {
  const data = signal<Data | null>(null);

  // Properly cleanup subscriptions
  effect(() => {
    const ws = new WebSocket('wss://api.example.com');

    ws.onmessage = (event) => {
      data.set(JSON.parse(event.data));
    };

    // Cleanup when component unmounts or effect re-runs
    onCleanup(() => {
      ws.close();
    });
  });

  return <DataDisplay data={data()} />;
}

// For intervals and timeouts
function TimerComponent() {
  const count = signal(0);

  effect(() => {
    const interval = setInterval(() => {
      count.set(count() + 1);
    }, 1000);

    // Cleanup interval
    onCleanup(() => {
      clearInterval(interval);
    });
  });

  return <div>Count: {count()}</div>;
}
```

### 4. Lazy Load Components

```typescript
import { lazy, Suspense } from '@philjs/core';

// Lazy load heavy components
const Dashboard = lazy(() => import('./Dashboard'));
const Analytics = lazy(() => import('./Analytics'));
const Settings = lazy(() => import('./Settings'));

function App() {
  const currentRoute = signal<string>('/');

  return (
    <div>
      <Navigation onNavigate={(route) => currentRoute.set(route)} />

      <Suspense fallback={<LoadingSpinner />}>
        {currentRoute() === '/dashboard' && <Dashboard />}
        {currentRoute() === '/analytics' && <Analytics />}
        {currentRoute() === '/settings' && <Settings />}
      </Suspense>
    </div>
  );
}
```

### 5. Optimize Signal Granularity

```typescript
// ❌ Coarse-grained: entire object updates trigger re-renders
function UserProfileCoarse() {
  const user = signal({
    name: 'John',
    email: 'john@example.com',
    age: 30,
    address: { city: 'NYC', country: 'USA' },
    preferences: { theme: 'dark', lang: 'en' }
  });

  // Updating one field triggers re-render of everything
  const updateName = (name: string) => {
    user.set({ ...user(), name });
  };

  return (
    <div>
      <div>Name: {user().name}</div>
      <div>Email: {user().email}</div>
      <div>Theme: {user().preferences.theme}</div>
    </div>
  );
}

// ✅ Fine-grained: separate signals for independent data
function UserProfileFineGrained() {
  const name = signal('John');
  const email = signal('john@example.com');
  const age = signal(30);
  const city = signal('NYC');
  const theme = signal('dark');

  // Updating name only re-renders name display
  const updateName = (newName: string) => {
    name.set(newName);
  };

  return (
    <div>
      <div>Name: {name()}</div>
      <div>Email: {email()}</div>
      <div>Theme: {theme()}</div>
    </div>
  );
}

// ✅ Balanced: group related data, separate independent data
function UserProfileBalanced() {
  const profile = signal({ name: 'John', email: 'john@example.com', age: 30 });
  const address = signal({ city: 'NYC', country: 'USA' });
  const preferences = signal({ theme: 'dark', lang: 'en' });

  return (
    <div>
      <ProfileSection data={profile()} />
      <AddressSection data={address()} />
      <PreferencesSection data={preferences()} />
    </div>
  );
}
```

## Profiling with DevTools

### Chrome DevTools Performance Panel

```typescript
// Mark specific operations for profiling
function ProfiledOperation() {
  const data = signal<Data[]>([]);

  const processData = () => {
    // Mark the start
    performance.mark('process-start');

    const processed = heavyProcessing(data());
    data.set(processed);

    // Mark the end
    performance.mark('process-end');

    // Measure the duration
    performance.measure(
      'data-processing',
      'process-start',
      'process-end'
    );

    // Get the measurement
    const measure = performance.getEntriesByName('data-processing')[0];
    console.log(`Processing took ${measure.duration.toFixed(2)}ms`);

    // Cleanup
    performance.clearMarks();
    performance.clearMeasures();
  };

  return <button onClick={processData}>Process</button>;
}
```

### Performance Observer API

```typescript
import { effect } from '@philjs/core';

function usePerformanceMonitoring() {
  effect(() => {
    // Monitor all measurements
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 16) {
          // Warn about operations slower than 60fps
          console.warn(
            `Slow operation: ${entry.name} took ${entry.duration.toFixed(2)}ms`
          );
        }
      }
    });

    observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });

    onCleanup(() => observer.disconnect());
  });
}

function App() {
  usePerformanceMonitoring();

  return <div>App content</div>;
}
```

### Component Render Profiling

```typescript
function withRenderProfile<P>(
  Component: (props: P) => JSX.Element,
  name: string
) {
  return (props: P) => {
    performance.mark(`${name}-render-start`);

    const result = Component(props);

    performance.mark(`${name}-render-end`);
    performance.measure(
      `${name}-render`,
      `${name}-render-start`,
      `${name}-render-end`
    );

    const measure = performance.getEntriesByName(`${name}-render`)[0];
    if (measure.duration > 16) {
      console.warn(
        `${name} render took ${measure.duration.toFixed(2)}ms (> 16ms frame budget)`
      );
    }

    performance.clearMarks();
    performance.clearMeasures();

    return result;
  };
}

// Usage
const ProfiledDashboard = withRenderProfile(Dashboard, 'Dashboard');
```

### Real User Monitoring (RUM)

```typescript
function trackWebVitals() {
  // Largest Contentful Paint
  new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lcp = entries[entries.length - 1];

    sendAnalytics('LCP', {
      value: lcp.startTime,
      rating: lcp.startTime < 2500 ? 'good' :
              lcp.startTime < 4000 ? 'needs-improvement' : 'poor'
    });
  }).observe({ entryTypes: ['largest-contentful-paint'] });

  // First Input Delay
  new PerformanceObserver((list) => {
    const entry = list.getEntries()[0] as PerformanceEventTiming;
    const fid = entry.processingStart - entry.startTime;

    sendAnalytics('FID', {
      value: fid,
      rating: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor'
    });
  }).observe({ entryTypes: ['first-input'] });

  // Cumulative Layout Shift
  let clsValue = 0;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
      }
    }

    sendAnalytics('CLS', {
      value: clsValue,
      rating: clsValue < 0.1 ? 'good' :
              clsValue < 0.25 ? 'needs-improvement' : 'poor'
    });
  }).observe({ entryTypes: ['layout-shift'] });
}

// Initialize on app start
trackWebVitals();
```

## Bundle Size Optimization

### 1. Import from Subpaths

```typescript
// ❌ Imports entire library (39KB gzipped)
import { signal, memo, effect } from '@philjs/core';

// ✅ Import only what you need (3.3KB gzipped)
import { signal, memo, effect } from '@philjs/core/signals';
import { jsx } from '@philjs/core/jsx-runtime';

// ✅ Even more granular
import { signal } from '@philjs/core/signals';
import { render } from '@philjs/core/hydrate';
```

### 2. Tree Shaking Configuration

```typescript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks
          'philjs': ['@philjs/core'],
          'vendor': ['date-fns', 'lodash-es']
        }
      }
    }
  }
};

// package.json
{
  "sideEffects": false // Enable aggressive tree shaking
}
```

### 3. Replace Heavy Dependencies

```typescript
// ❌ Moment.js (67KB)
import moment from 'moment';
const formatted = moment().format('YYYY-MM-DD');

// ✅ date-fns (2KB per function)
import { format } from 'date-fns';
const formatted = format(new Date(), 'yyyy-MM-dd');

// ❌ Lodash (24KB full)
import _ from 'lodash';

// ✅ Lodash-es (tree-shakeable) or native methods
import { debounce } from 'lodash-es';
// Or
const debounce = (fn, delay) => { /* native implementation */ };

// ❌ Axios (13KB)
import axios from 'axios';

// ✅ Native fetch (0KB) + wrapper
async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(response.statusText);
  return response.json();
}
```

### 4. Dynamic Imports for Heavy Features

```typescript
// ✅ Load PDF library only when needed
async function exportToPDF(data: any) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  // Generate PDF
  return doc;
}

// ✅ Load chart library only for analytics page
const Analytics = lazy(async () => {
  // Preload chart.js with analytics component
  await import('chart.js');
  return import('./Analytics');
});

// ✅ Conditionally load polyfills
if (!('IntersectionObserver' in window)) {
  await import('intersection-observer');
}
```

### 5. Code Splitting Strategy

```typescript
// vite.config.ts
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks by size
          if (id.includes('node_modules')) {
            if (id.includes('chart.js')) return 'vendor-charts';
            if (id.includes('date-fns')) return 'vendor-date';
            return 'vendor';
          }

          // Route-based chunks
          if (id.includes('/pages/')) {
            const page = id.split('/pages/')[1].split('/')[0];
            return `page-${page}`;
          }
        }
      }
    }
  }
};
```

## Performance Patterns

### Pattern 1: Selective Reactivity with Untrack

```typescript
import { signal, memo, untrack } from '@philjs/core';

function SearchResults() {
  const query = signal('');
  const sortBy = signal('relevance');
  const page = signal(1);

  // Only re-fetch when query or sortBy changes, not page
  const results = memo(() => {
    const q = query();
    const sort = sortBy();

    // Don't track page in dependencies
    const p = untrack(() => page());

    return fetchResults(q, sort, p);
  });

  return (
    <div>
      <SearchBox value={query()} onChange={query.set} />
      <SortSelect value={sortBy()} onChange={sortBy.set} />
      <Pagination page={page()} onPageChange={page.set} />
      <ResultsList data={results()} />
    </div>
  );
}
```

### Pattern 2: Resource Pattern for Data Fetching

```typescript
import { resource } from '@philjs/core';

function UserProfile({ userId }: { userId: number }) {
  // Resource automatically handles loading/error states
  const user = resource(
    () => userId, // Source signal
    async (id) => {
      const response = await fetch(`/api/users/${id}`);
      return response.json();
    }
  );

  return (
    <div>
      {user.loading() && <LoadingSpinner />}
      {user.error() && <ErrorMessage error={user.error()!} />}
      {user() && <UserCard user={user()!} />}
    </div>
  );
}
```

### Pattern 3: Computed Context for Shared State

```typescript
import { signal, memo, createContext, useContext } from '@philjs/core';

// Create context with computed values
const CartContext = createContext<{
  items: () => CartItem[];
  total: () => number;
  itemCount: () => number;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
}>();

function CartProvider({ children }: { children: JSX.Element }) {
  const items = signal<CartItem[]>([]);

  // Memoized computations shared across components
  const total = memo(() =>
    items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  const itemCount = memo(() =>
    items().reduce((sum, item) => sum + item.quantity, 0)
  );

  const addItem = (item: CartItem) => {
    items.set([...items(), item]);
  };

  const removeItem = (id: string) => {
    items.set(items().filter(item => item.id !== id));
  };

  return (
    <CartContext.Provider value={{ items, total, itemCount, addItem, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

// Components only re-render when their specific dependencies change
function CartBadge() {
  const { itemCount } = useContext(CartContext);
  return <span class="badge">{itemCount()}</span>;
}

function CartTotal() {
  const { total } = useContext(CartContext);
  return <div>Total: ${total().toFixed(2)}</div>;
}
```

### Pattern 4: Optimistic Updates

```typescript
function TodoList() {
  const todos = signal<Todo[]>([]);

  const addTodo = async (text: string) => {
    // Create optimistic todo
    const optimisticTodo: Todo = {
      id: `temp-${Date.now()}`,
      text,
      completed: false,
      pending: true
    };

    // Immediately update UI
    todos.set([...todos(), optimisticTodo]);

    try {
      // Send to server
      const savedTodo = await api.post('/todos', { text });

      // Replace optimistic with real data
      todos.set(
        todos().map(t =>
          t.id === optimisticTodo.id ? savedTodo : t
        )
      );
    } catch (error) {
      // Rollback on error
      todos.set(
        todos().filter(t => t.id !== optimisticTodo.id)
      );
      showError('Failed to add todo');
    }
  };

  return (
    <div>
      <AddTodoForm onAdd={addTodo} />
      <ul>
        {todos().map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            pending={todo.pending}
          />
        ))}
      </ul>
    </div>
  );
}
```

### Pattern 5: Derived State Chains

```typescript
function DataAnalyticsPipeline() {
  const rawData = signal<DataPoint[]>([]);

  // Chain of derived computations
  const filtered = memo(() =>
    rawData().filter(d => d.isValid && d.value > 0)
  );

  const normalized = memo(() =>
    filtered().map(d => ({
      ...d,
      normalizedValue: d.value / Math.max(...filtered().map(p => p.value))
    }))
  );

  const grouped = memo(() =>
    groupBy(normalized(), 'category')
  );

  const statistics = memo(() => {
    const data = normalized();
    return {
      mean: average(data.map(d => d.value)),
      median: median(data.map(d => d.value)),
      stdDev: standardDeviation(data.map(d => d.value))
    };
  });

  // Each memo only recomputes when its direct dependencies change
  return (
    <div>
      <DataSummary
        total={filtered().length}
        stats={statistics()}
      />
      <DataChart data={grouped()} />
    </div>
  );
}
```

## Best Practices

### 1. Profile Before Optimizing

```typescript
// ✅ Use browser DevTools to identify bottlenecks
// 1. Open DevTools > Performance tab
// 2. Record interaction
// 3. Look for long tasks (>50ms)
// 4. Optimize the slowest operations first

// ✅ Use console.time for quick checks
console.time('expensive-operation');
const result = expensiveOperation();
console.timeEnd('expensive-operation');
// expensive-operation: 234.56ms

// Only optimize if it's actually slow!
```

### 2. Avoid Premature Optimization

```typescript
// ❌ Over-optimized from the start
function SimpleCounter() {
  const count = memo(() => signal(0)); // Unnecessary memo
  const doubled = memo(() => count() * 2); // Unnecessary memo
  const text = memo(() => `Count: ${doubled()}`); // Unnecessary memo

  return <div>{text()}</div>;
}

// ✅ Start simple, optimize when needed
function SimpleCounter() {
  const count = signal(0);

  return <div>Count: {count() * 2}</div>;
}
```

### 3. Use the Right Data Structure

```typescript
// ❌ Array for frequent lookups
const users = signal<User[]>([]);
const findUser = (id: string) => users().find(u => u.id === id); // O(n)

// ✅ Map for frequent lookups
const users = signal<Map<string, User>>(new Map());
const findUser = (id: string) => users().get(id); // O(1)

// ❌ Nested arrays for hierarchical data
const tree = signal([[1, [2, [3, [4]]]]]);

// ✅ Use proper tree structure
const tree = signal<TreeNode>({
  value: 1,
  children: [
    { value: 2, children: [
      { value: 3, children: [
        { value: 4, children: [] }
      ]}
    ]}
  ]
});
```

### 4. Minimize Re-renders

```typescript
// ❌ Re-renders entire list on every change
function ItemList() {
  const items = signal<Item[]>([]);

  return (
    <div>
      {items().map(item => (
        <div onClick={() => toggleItem(item.id)}>
          {item.name}: {item.selected ? '✓' : '○'}
        </div>
      ))}
    </div>
  );
}

// ✅ Extract item component for isolated updates
function ItemList() {
  const items = signal<Item[]>([]);

  return (
    <div>
      {items().map(item => (
        <ListItem key={item.id} item={item} />
      ))}
    </div>
  );
}

function ListItem({ item }: { item: Item }) {
  const selected = signal(item.selected);

  return (
    <div onClick={() => selected.set(!selected())}>
      {item.name}: {selected() ? '✓' : '○'}
    </div>
  );
}
```

### 5. Clean Up Effects

```typescript
// ❌ Memory leak - no cleanup
function ComponentWithLeak() {
  const data = signal(null);

  effect(() => {
    const ws = new WebSocket('wss://api.example.com');
    ws.onmessage = (e) => data.set(e.data);
    // WebSocket never closed!
  });

  return <DataDisplay data={data()} />;
}

// ✅ Proper cleanup
function ComponentWithCleanup() {
  const data = signal(null);

  effect(() => {
    const ws = new WebSocket('wss://api.example.com');
    ws.onmessage = (e) => data.set(e.data);

    onCleanup(() => {
      ws.close();
    });
  });

  return <DataDisplay data={data()} />;
}
```

### 6. Set Performance Budgets

```json
// .budgetrc.json
{
  "budgets": [
    {
      "path": "dist/assets/*.js",
      "limit": "170 KB",
      "gzip": true
    },
    {
      "path": "dist/assets/*.css",
      "limit": "30 KB",
      "gzip": true
    }
  ]
}
```

### 7. Monitor Production Performance

```typescript
// Setup Real User Monitoring (RUM)
import { initPerformanceMonitoring } from './monitoring';

// Track key metrics
initPerformanceMonitoring({
  // Report to analytics service
  onMetric: (metric, value) => {
    analytics.track('performance', { metric, value });
  },

  // Alert on regressions
  onRegression: (metric, current, baseline) => {
    if (current > baseline * 1.1) {
      alertSlack(`Performance regression: ${metric} is ${current}ms (baseline: ${baseline}ms)`);
    }
  },

  // Track custom metrics
  customMetrics: {
    'time-to-interactive': () => performance.timing.domInteractive,
    'bundle-load-time': () => performance.getEntriesByType('navigation')[0].duration
  }
});
```

## Summary

You've learned:

- Auto-memo patterns and when the compiler applies them automatically
- Auto-batch optimization for multiple signal updates
- Manual optimization techniques for advanced scenarios
- How to profile performance with Chrome DevTools
- Bundle size optimization strategies and best practices
- Real-world performance patterns for common use cases
- Best practices to avoid common performance pitfalls

Remember: **Profile first, optimize later**. PhilJS is already extremely fast (21.7M signal operations/second). Only optimize when you've identified an actual bottleneck through profiling.

## Performance Checklist

- [ ] Profile with DevTools to identify bottlenecks
- [ ] Let compiler auto-optimize (memo/batch) when possible
- [ ] Use manual `memo()` only for expensive computations
- [ ] Batch multiple signal updates in event handlers
- [ ] Debounce/throttle high-frequency events
- [ ] Clean up effects and subscriptions
- [ ] Use virtual scrolling for lists >1000 items
- [ ] Lazy load heavy components and libraries
- [ ] Optimize bundle size with tree shaking
- [ ] Monitor production performance with RUM
- [ ] Set and enforce performance budgets
- [ ] Use fine-grained reactivity (separate signals)
- [ ] Avoid unnecessary re-renders with proper keys

---

**Next Steps:**
- [Profiling Guide →](./profiling.md) Deep dive into performance profiling
- [Bundle Optimization →](./bundle-optimization.md) Advanced bundle size techniques
- [Runtime Performance →](./runtime-performance.md) Optimize execution speed

