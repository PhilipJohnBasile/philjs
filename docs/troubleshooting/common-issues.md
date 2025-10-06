# Common Issues

Solutions to frequently encountered problems in PhilJS applications.

## Signal Issues

### Signal Not Updating UI

**Problem:** UI doesn't update when signal changes.

```tsx
// ❌ Problem: Not calling signal
function Counter() {
  const count = signal(0);

  return <p>Count: {count}</p>;  // Shows [Function]
}
```

**Solution:** Call the signal to get its value.

```tsx
// ✅ Solution
function Counter() {
  const count = signal(0);

  return <p>Count: {count()}</p>;  // Shows value
}
```

### Mutating Signal Value

**Problem:** Changing object/array without triggering update.

```tsx
// ❌ Problem: Direct mutation
const user = signal({ name: 'Alice', age: 30 });

user().name = 'Bob';  // Doesn't trigger update!
```

**Solution:** Use immutable updates with `.set()`.

```tsx
// ✅ Solution
user.set({ ...user(), name: 'Bob' });

// Or for arrays
const items = signal([1, 2, 3]);

// ❌ Wrong
items().push(4);

// ✅ Correct
items.set([...items(), 4]);
```

### Signal in Loop

**Problem:** Creating signals inside loops.

```tsx
// ❌ Problem
function BadList({ items }: { items: Item[] }) {
  return (
    <ul>
      {items.map(item => {
        const selected = signal(false);  // Creates new signal each render!

        return (
          <li onClick={() => selected.set(true)}>
            {item.name}
          </li>
        );
      })}
    </ul>
  );
}
```

**Solution:** Lift signal out of loop or use component.

```tsx
// ✅ Solution 1: Component
function ListItem({ item }: { item: Item }) {
  const selected = signal(false);

  return (
    <li onClick={() => selected.set(true)}>
      {item.name}
    </li>
  );
}

function GoodList({ items }: { items: Item[] }) {
  return (
    <ul>
      {items.map(item => (
        <ListItem key={item.id} item={item} />
      ))}
    </ul>
  );
}

// ✅ Solution 2: Lift state up
function GoodList({ items }: { items: Item[] }) {
  const selectedIds = signal<Set<string>>(new Set());

  return (
    <ul>
      {items.map(item => (
        <li
          key={item.id}
          onClick={() => {
            const newSelected = new Set(selectedIds());
            newSelected.add(item.id);
            selectedIds.set(newSelected);
          }}
        >
          {item.name}
        </li>
      ))}
    </ul>
  );
}
```

## Effect Issues

### Effect Not Running

**Problem:** Effect doesn't execute when signal changes.

```tsx
// ❌ Problem: Not tracking signal
const count = signal(0);

effect(() => {
  console.log('This only runs once');
  // Not reading count(), so not tracking it
});
```

**Solution:** Read signals inside effect to track them.

```tsx
// ✅ Solution
effect(() => {
  console.log('Count:', count());  // Tracks count
});
```

### Infinite Loop in Effect

**Problem:** Effect triggers itself infinitely.

```tsx
// ❌ Problem: Effect updates signal it reads
const count = signal(0);

effect(() => {
  count.set(count() + 1);  // Infinite loop!
});
```

**Solution:** Don't update signals you read in the same effect.

```tsx
// ✅ Solution: Separate read and write
const input = signal(0);
const output = signal(0);

effect(() => {
  output.set(input() * 2);  // Read input, write output
});
```

### Effect Not Cleaning Up

**Problem:** Resources not cleaned up.

```tsx
// ❌ Problem: No cleanup
effect(() => {
  const id = setInterval(() => console.log('Tick'), 1000);
  // Interval keeps running!
});
```

**Solution:** Return cleanup function.

```tsx
// ✅ Solution
effect(() => {
  const id = setInterval(() => console.log('Tick'), 1000);

  return () => clearInterval(id);  // Cleanup
});
```

## Memo Issues

### Memo Not Recomputing

**Problem:** Memo doesn't update when dependency changes.

```tsx
// ❌ Problem: Not reading signal
const count = signal(0);

const doubled = memo(() => {
  const value = count;  // Not calling count()!
  return value * 2;  // Won't work
});
```

**Solution:** Call signals to track them.

```tsx
// ✅ Solution
const doubled = memo(() => count() * 2);
```

### Memo with Side Effects

**Problem:** Putting side effects in memo.

```tsx
// ❌ Problem: Side effects in memo
const result = memo(() => {
  console.log('Computing...');  // Side effect!
  api.logMetric('computation');  // Side effect!
  return count() * 2;
});
```

**Solution:** Use effects for side effects, memos for computations.

```tsx
// ✅ Solution
const result = memo(() => count() * 2);  // Pure computation

effect(() => {
  console.log('Result:', result());  // Side effect in effect
});
```

## Routing Issues

### Route Not Matching

**Problem:** Route doesn't work as expected.

```tsx
// ❌ Problem: Wrong order
<Router>
  <Route path="*" component={NotFound} />  // Catches everything!
  <Route path="/dashboard" component={Dashboard} />  // Never reached
</Router>
```

**Solution:** Put specific routes before catch-all.

```tsx
// ✅ Solution
<Router>
  <Route path="/" component={Home} />
  <Route path="/dashboard" component={Dashboard} />
  <Route path="*" component={NotFound} />  // Last
</Router>
```

### Link Not Working

**Problem:** Link doesn't navigate.

```tsx
// ❌ Problem: Using <a> tag
<a href="/about">About</a>  // Full page reload
```

**Solution:** Use PhilJS Link component.

```tsx
// ✅ Solution
import { Link } from 'philjs-router';

<Link to="/about">About</Link>  // Client-side navigation
```

### useParams Returns Undefined

**Problem:** Route params are undefined.

```tsx
// ❌ Problem: Wrong route path
<Route path="/users" component={UserProfile} />

function UserProfile() {
  const { id } = useParams();  // id is undefined
}
```

**Solution:** Define parameter in route path.

```tsx
// ✅ Solution
<Route path="/users/:id" component={UserProfile} />

function UserProfile() {
  const { id } = useParams();  // id is available
}
```

## API/Data Fetching Issues

### Race Condition

**Problem:** Stale data from old requests.

```tsx
// ❌ Problem: Race condition
const userId = signal('user1');
const user = signal(null);

effect(async () => {
  const data = await fetchUser(userId());
  user.set(data);  // What if userId changed during fetch?
});
```

**Solution:** Use cleanup or abort signal.

```tsx
// ✅ Solution: Abort controller
effect(async () => {
  const controller = new AbortController();
  const id = userId();

  try {
    const data = await fetchUser(id, { signal: controller.signal });

    // Only set if still relevant
    if (userId() === id) {
      user.set(data);
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      throw err;
    }
  }

  return () => controller.abort();
});
```

### CORS Errors

**Problem:** Cross-origin request blocked.

```
Access to fetch at 'https://api.example.com' from origin
'http://localhost:3000' has been blocked by CORS policy
```

**Solution:** Configure CORS on server or use proxy.

```typescript
// vite.config.ts - Development proxy
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});

// Now use /api instead of full URL
const data = await fetch('/api/users');
```

### Network Request Failing

**Problem:** API requests fail silently.

```tsx
// ❌ Problem: No error handling
effect(async () => {
  const data = await fetchData();  // What if this fails?
  setData(data);
});
```

**Solution:** Add proper error handling.

```tsx
// ✅ Solution
const data = signal(null);
const loading = signal(true);
const error = signal(null);

effect(async () => {
  loading.set(true);
  error.set(null);

  try {
    const result = await fetchData();
    data.set(result);
  } catch (err) {
    error.set(err);
    console.error('Fetch failed:', err);
  } finally {
    loading.set(false);
  }
});
```

## TypeScript Issues

### Type Errors with Signals

**Problem:** TypeScript errors with signal types.

```tsx
// ❌ Problem: Wrong type
const user = signal(null);  // Type: Signal<null>

// Later...
user.set({ id: '1', name: 'Alice' });  // Type error!
```

**Solution:** Specify type parameter.

```tsx
// ✅ Solution
interface User {
  id: string;
  name: string;
}

const user = signal<User | null>(null);  // Correct type

user.set({ id: '1', name: 'Alice' });  // Works!
```

### JSX Type Errors

**Problem:** JSX element type errors.

```
Property 'children' does not exist on type 'IntrinsicAttributes'
```

**Solution:** Install and configure @types/react.

```bash
npm install -D @types/react
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "philjs-core"
  }
}
```

## Build Issues

### Module Not Found

**Problem:** Import fails with "Module not found".

```
Error: Cannot find module '@/components/Button'
```

**Solution:** Check tsconfig paths and vite aliases.

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

```typescript
// vite.config.ts
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

### Out of Memory

**Problem:** Build fails with out of memory error.

```
FATAL ERROR: Reached heap limit Allocation failed
```

**Solution:** Increase Node memory limit.

```json
// package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
  }
}
```

## Performance Issues

### Slow Rendering

**Problem:** UI feels sluggish.

**Common Causes:**
- Not using memo() for expensive computations
- Creating functions/objects in render
- Large lists without virtualization

**Solutions:**

```tsx
// ✅ Use memo for expensive computations
const filtered = memo(() =>
  items().filter(item => item.active)
);

// ✅ Virtualize large lists
<VirtualList items={thousands} renderItem={...} />

// ✅ Don't create new objects/arrays inline
// ❌ Wrong
<Component options={{ a: 1, b: 2 }} />

// ✅ Better
const options = { a: 1, b: 2 };
<Component options={options} />
```

More details: [Performance Issues →](./performance-issues.md)

## SSR Issues

### Hydration Mismatch

**Problem:** Server and client HTML don't match.

```
Warning: Hydration failed because the initial UI does not match
what was rendered on the server.
```

**Solution:** Ensure server and client render the same content.

```tsx
// ❌ Problem: Client-only value
function Component() {
  return <div>Width: {window.innerWidth}</div>;  // Fails on server
}

// ✅ Solution: Check environment
function Component() {
  const width = typeof window !== 'undefined' ? window.innerWidth : 0;
  return <div>Width: {width}</div>;
}
```

## Summary

**Common Issues:**

✅ Remember to call signals: `count()`
✅ Use immutable updates: `.set(newValue)`
✅ Don't create signals in loops
✅ Read signals in effects to track them
✅ Return cleanup functions from effects
✅ Use memos for computations, effects for side effects
✅ Handle API errors properly
✅ Specify signal types in TypeScript
✅ Configure path aliases correctly
✅ Check for hydration mismatches in SSR

**Next:** [Debugging Guide →](./debugging.md)
