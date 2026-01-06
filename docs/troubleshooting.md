# PhilJS Troubleshooting Guide

This guide covers common issues, debugging techniques, and solutions for PhilJS applications.

## Table of Contents

- [Signal Issues](#signal-issues)
- [Reactivity Problems](#reactivity-problems)
- [SSR/Hydration Errors](#ssrhydration-errors)
- [Performance Issues](#performance-issues)
- [Build & Bundle Problems](#build--bundle-problems)
- [Router Issues](#router-issues)
- [State Management](#state-management)
- [DevTools Usage](#devtools-usage)
- [Memory Leaks](#memory-leaks)
- [TypeScript Errors](#typescript-errors)

---

## Signal Issues

### Signal not updating UI

**Symptoms:** Changes to signal values don't reflect in the UI.

**Common Causes & Solutions:**

1. **Not calling the signal as a function in JSX**
   ```tsx
   // Wrong - accessing signal without calling it
   <div>{count}</div>

   // Correct - call the signal to get its value
   <div>{count()}</div>
   ```

2. **Mutating objects/arrays instead of replacing**
   ```tsx
   // Wrong - mutation doesn't trigger updates
   const items = signal([1, 2, 3]);
   items().push(4); // UI won't update

   // Correct - create new array
   items.set([...items(), 4]);
   ```

3. **Setting same reference**
   ```tsx
   // Wrong - same reference, no update
   const user = signal({ name: 'John' });
   const current = user();
   current.name = 'Jane';
   user.set(current); // Same reference!

   // Correct - spread to create new reference
   user.set({ ...user(), name: 'Jane' });
   ```

### Signal updates causing infinite loops

**Symptoms:** Browser freezes, "Maximum call stack exceeded" error.

**Solution:** Avoid creating circular dependencies.

```tsx
// Wrong - circular dependency
const a = signal(0);
const b = computed(() => a() + 1);
effect(() => a.set(b())); // Infinite loop!

// Correct - break the cycle with conditions
effect(() => {
  const newValue = b();
  if (a() !== newValue - 1) {
    a.set(newValue - 1);
  }
});
```

### Signal not reactive in callback

**Symptoms:** Signal value in callbacks is stale.

**Solution:** Access signal inside the callback, not outside.

```tsx
// Wrong - captured stale value
const count = signal(0);
const staleCount = count(); // Captured at creation time

setTimeout(() => {
  console.log(staleCount); // Always 0
}, 1000);

// Correct - access fresh value
setTimeout(() => {
  console.log(count()); // Current value
}, 1000);
```

---

## Reactivity Problems

### Computed not recalculating

**Symptoms:** Computed value stays stale even when dependencies change.

**Solution:** Ensure all dependencies are accessed inside the computed.

```tsx
// Wrong - dependency outside computed
const multiplier = 2;
const doubled = computed(() => count() * multiplier);

// If you change multiplier, doubled won't update
multiplier = 3; // doubled still uses 2

// Correct - use signal for dynamic multiplier
const multiplierSignal = signal(2);
const doubled = computed(() => count() * multiplierSignal());
```

### Effect running too many times

**Symptoms:** Effects firing excessively, performance degradation.

**Solutions:**

1. **Batch updates**
   ```tsx
   // Wrong - triggers effect for each update
   count.set(1);
   name.set('John');
   active.set(true);

   // Correct - single effect run
   batch(() => {
     count.set(1);
     name.set('John');
     active.set(true);
   });
   ```

2. **Use memo for expensive computations**
   ```tsx
   const expensiveResult = memo(() => {
     return heavyComputation(data());
   });
   ```

### Effect cleanup not running

**Symptoms:** Subscriptions, timers, or listeners not being cleaned up.

**Solution:** Return cleanup function from effect.

```tsx
effect(() => {
  const subscription = eventSource.subscribe(data());

  // Return cleanup function
  return () => {
    subscription.unsubscribe();
  };
});
```

---

## SSR/Hydration Errors

### Hydration mismatch

**Symptoms:** "Hydration failed" warnings, flickering UI on load.

**Common Causes & Solutions:**

1. **Time-dependent rendering**
   ```tsx
   // Wrong - different on server vs client
   <div>{new Date().toLocaleString()}</div>

   // Correct - render after hydration
   const [mounted, setMounted] = useState(false);
   useEffect(() => setMounted(true), []);

   return mounted ? <div>{new Date().toLocaleString()}</div> : null;
   ```

2. **Browser-only APIs**
   ```tsx
   // Wrong - window doesn't exist on server
   const width = window.innerWidth;

   // Correct - check environment
   const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
   ```

3. **Random IDs**
   ```tsx
   // Wrong - different ID on server vs client
   const id = `id-${Math.random()}`;

   // Correct - use stable IDs
   import { useId } from '@philjs/core';
   const id = useId();
   ```

### SSR streaming errors

**Symptoms:** Partial page rendering, timeout errors.

**Solution:** Handle async data properly with Suspense.

```tsx
import { Suspense, defer } from '@philjs/router';

// Wrap async components
<Suspense fallback={<Loading />}>
  <AsyncComponent />
</Suspense>

// Use defer for non-critical data
export async function loader() {
  return defer({
    critical: await getCriticalData(),
    deferred: getDeferredData() // Promise, not awaited
  });
}
```

---

## Performance Issues

### Slow initial render

**Diagnostic Steps:**

1. **Check bundle size**
   ```bash
   npm run build -- --analyze
   ```

2. **Profile with DevTools**
   ```tsx
   import { RouterDevTools } from '@philjs/router';

   <RouterDevTools showPerformance />
   ```

**Solutions:**

1. **Code splitting**
   ```tsx
   // Lazy load routes
   const Dashboard = lazy(() => import('./Dashboard'));
   ```

2. **Virtualize long lists**
   ```tsx
   import { VirtualList } from '@philjs/virtual';

   <VirtualList
     items={largeArray}
     itemHeight={50}
     renderItem={(item) => <Item {...item} />}
   />
   ```

### Memory usage growing over time

**Diagnostic:**

```tsx
// Add to your app temporarily
setInterval(() => {
  console.log('Heap:', performance.memory?.usedJSHeapSize / 1024 / 1024, 'MB');
}, 5000);
```

**Solutions:**

1. **Clean up effects**
   ```tsx
   effect(() => {
     const handler = () => { /* ... */ };
     window.addEventListener('resize', handler);
     return () => window.removeEventListener('resize', handler);
   });
   ```

2. **Dispose computed/effects when done**
   ```tsx
   const dispose = effect(() => { /* ... */ });
   // Later, when no longer needed:
   dispose();
   ```

### Excessive re-renders

**Diagnostic:**

```tsx
import { enableDevTools } from '@philjs/devtools';
enableDevTools({ trackRenders: true });
```

**Solutions:**

1. **Memoize components**
   ```tsx
   const MemoizedChild = memo(ChildComponent);
   ```

2. **Split signals by concern**
   ```tsx
   // Wrong - one big signal
   const state = signal({ user: {}, settings: {}, data: [] });

   // Correct - separate signals
   const user = signal({});
   const settings = signal({});
   const data = signal([]);
   ```

---

## Build & Bundle Problems

### "Cannot find module" errors

**Solutions:**

1. **Check package.json exports**
   ```json
   {
     "exports": {
       ".": "./dist/index.js",
       "./router": "./dist/router.js"
     }
   }
   ```

2. **Verify tsconfig paths**
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@philjs/*": ["./packages/*/src"]
       }
     }
   }
   ```

### Tree-shaking not working

**Solution:** Ensure proper ESM setup.

```json
// package.json
{
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}
```

### Build failing with TypeScript errors

**Common fixes:**

1. **Update tsconfig**
   ```json
   {
     "compilerOptions": {
       "moduleResolution": "bundler",
       "target": "ES2022",
       "module": "ESNext"
     }
   }
   ```

2. **Check type versions**
   ```bash
   npm ls typescript
   npm ls @types/node
   ```

---

## Router Issues

### Routes not matching

**Diagnostic:**

```tsx
import { recordRouteMatch, RouterDevTools } from '@philjs/router';

// Enable match debugging
<RouterDevTools />

// Or manually check
recordRouteMatch({
  pathname: window.location.pathname,
  attempts: [], // Populated by router
  matchTime: 0
});
```

**Solutions:**

1. **Check route order (more specific first)**
   ```tsx
   const routes = [
     { path: '/users/:id/edit', component: EditUser }, // More specific
     { path: '/users/:id', component: UserDetail },    // Less specific
     { path: '/users', component: UserList },          // Least specific
   ];
   ```

2. **Verify path patterns**
   ```tsx
   // Wrong
   { path: 'users/:id' } // Missing leading slash

   // Correct
   { path: '/users/:id' }
   ```

### Navigation not working

**Solutions:**

1. **Use router navigation, not window.location**
   ```tsx
   // Wrong
   window.location.href = '/dashboard';

   // Correct
   import { navigate } from '@philjs/router';
   navigate('/dashboard');
   ```

2. **Check Link component usage**
   ```tsx
   // Wrong - regular anchor
   <a href="/dashboard">Dashboard</a>

   // Correct - router Link
   import { Link } from '@philjs/router';
   <Link to="/dashboard">Dashboard</Link>
   ```

### Loader data not available

**Solution:** Ensure proper data access.

```tsx
import { useLoaderData } from '@philjs/router';

function Component() {
  // Access loader data
  const data = useLoaderData();

  // For nested routes
  const parentData = useRouteLoaderData('parent-route-id');
}
```

---

## State Management

### State lost on navigation

**Solution:** Use persistent state or lift state up.

```tsx
// Option 1: Context/Store
import { createStore } from '@philjs/store';
const appStore = createStore({ user: null });

// Option 2: URL state
import { useSearchParams } from '@philjs/router';
const [params, setParams] = useSearchParams();

// Option 3: Session storage
import { persisted } from '@philjs/storage';
const user = persisted('user', null);
```

### Race conditions in async updates

**Solution:** Use abort controllers or versioning.

```tsx
let currentVersion = 0;

async function fetchData(query) {
  const version = ++currentVersion;
  const result = await api.search(query);

  // Only update if this is still the latest request
  if (version === currentVersion) {
    data.set(result);
  }
}
```

---

## DevTools Usage

### Installing DevTools

```bash
npm install @philjs/devtools-extension
```

### Enabling DevTools

```tsx
import { enableDevTools } from '@philjs/devtools';

// Development only
if (process.env.NODE_ENV === 'development') {
  enableDevTools({
    trackSignals: true,
    trackEffects: true,
    trackRenders: true,
    trackPerformance: true
  });
}
```

### Using Signal Inspector

1. Open browser DevTools
2. Go to "PhilJS" panel
3. View live signal values and updates
4. Click signals to see dependency graph

### Using Performance Profiler

1. Start recording in DevTools
2. Interact with your app
3. Stop recording
4. Analyze:
   - Signal update frequency
   - Effect execution time
   - Render duration

---

## Memory Leaks

### Detecting leaks

```tsx
// Add to development builds
import { trackAllocations } from '@philjs/devtools';

trackAllocations((stats) => {
  if (stats.signals > 1000) {
    console.warn('High signal count:', stats);
  }
});
```

### Common leak sources

1. **Undisposed effects**
   ```tsx
   // Store dispose function
   const disposers = [];
   disposers.push(effect(() => { /* ... */ }));

   // Cleanup on unmount
   onCleanup(() => disposers.forEach(d => d()));
   ```

2. **Event listeners**
   ```tsx
   effect(() => {
     document.addEventListener('click', handler);
     return () => document.removeEventListener('click', handler);
   });
   ```

3. **Intervals/Timeouts**
   ```tsx
   effect(() => {
     const id = setInterval(update, 1000);
     return () => clearInterval(id);
   });
   ```

---

## TypeScript Errors

### Signal type inference issues

```tsx
// Explicit typing when inference fails
const user = signal<User | null>(null);

// For complex objects
interface State {
  items: Item[];
  loading: boolean;
}
const state = signal<State>({ items: [], loading: false });
```

### Generic component props

```tsx
// Define generic props
interface ListProps<T> {
  items: Signal<T[]>;
  renderItem: (item: T) => JSXElement;
}

// Use with explicit types
function List<T>(props: ListProps<T>) {
  return (
    <ul>
      {props.items().map(props.renderItem)}
    </ul>
  );
}
```

---

## Getting Help

If you're still stuck:

1. **Search existing issues:** https://github.com/philjs/philjs/issues
2. **Check discussions:** https://github.com/philjs/philjs/discussions
3. **Join Discord:** https://discord.gg/philjs
4. **Stack Overflow:** Tag questions with `philjs`

When reporting issues, include:
- PhilJS version (`npm ls @philjs/core`)
- Browser/Node version
- Minimal reproduction code
- Expected vs actual behavior
- Console errors/warnings
