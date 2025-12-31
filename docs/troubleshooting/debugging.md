# Debugging Guide

Techniques and tools for debugging PhilJS applications.

## Browser DevTools

### Console Debugging

**Basic Logging:**

```tsx
function Counter() {
  const count = signal(0);

  // Log signal value
  console.log('Initial count:', count());

  effect(() => {
    console.log('Count changed:', count());
  });

  const increment = () => {
    console.log('Before increment:', count());
    count.set(count() + 1);
    console.log('After increment:', count());
  };

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

**Structured Logging:**

```tsx
effect(() => {
  console.group('Effect Execution');
  console.log('User:', user());
  console.log('Posts:', posts());
  console.table(posts());  // Nice table format
  console.groupEnd();
});
```

**Conditional Logging:**

```tsx
effect(() => {
  if (count() > 10) {
    console.warn('Count exceeded 10:', count());
  }

  if (count() > 100) {
    console.error('Count too high!', count());
  }
});
```

### Debugger Statement

**Breakpoint in Code:**

```tsx
function handleSubmit(e: Event) {
  e.preventDefault();

  debugger;  // Execution pauses here

  const formData = {
    email: email(),
    password: password()
  };

  submitForm(formData);
}
```

**Conditional Breakpoint:**

```tsx
effect(() => {
  // Only break when count is 5
  if (count() === 5) {
    debugger;
  }

  console.log('Count:', count());
});
```

### Browser Breakpoints

**Set breakpoints in Sources tab:**
1. Open DevTools → Sources
2. Find your file
3. Click line number to set breakpoint
4. Refresh page
5. Code pauses at breakpoint

**Conditional breakpoints:**
- Right-click line number
- Select "Add conditional breakpoint"
- Enter condition: `count === 5`

### Watch Expressions

**Monitor values in DevTools:**

```
Sources tab → Watch panel

Add expressions:
- count()
- user()?.name
- items().length
- doubled()
```

## Tracking Signal Changes

### Signal Inspector

```tsx
function createSignalInspector<T>(name: string, initialValue: T) {
  const s = signal(initialValue);

  const tracked = {
    get: () => {
      const value = s();
      console.log(`[${name}] Read:`, value);
      return value;
    },
    set: (newValue: T | ((prev: T) => T)) => {
      const oldValue = s();
      s.set(newValue);
      const updatedValue = s();
      console.log(`[${name}] Update:`, { old: oldValue, new: updatedValue });
    }
  };

  return tracked;
}

// Usage
const count = createSignalInspector('count', 0);

count.set(5);
// Console: [count] Update: { old: 0, new: 5 }

console.log(count.get());
// Console: [count] Read: 5
```

### Effect Tracker

```tsx
function createTrackedEffect(name: string, fn: () => void | (() => void)) {
  let runCount = 0;

  return effect(() => {
    runCount++;
    console.group(`[Effect: ${name}] Run #${runCount}`);

    const startTime = performance.now();
    const cleanup = fn();
    const duration = performance.now() - startTime;

    console.log(`Duration: ${duration.toFixed(2)}ms`);
    console.groupEnd();

    if (cleanup) {
      return () => {
        console.log(`[Effect: ${name}] Cleanup`);
        cleanup();
      };
    }
  });
}

// Usage
createTrackedEffect('fetchUser', () => {
  const id = userId();
  console.log('Fetching user:', id);

  fetchUser(id).then(data => user.set(data));
});
```

## Debugging Async Code

### Async Effect Debugging

```tsx
effect(async () => {
  console.log('1. Effect started');

  const id = userId();
  console.log('2. User ID:', id);

  try {
    console.log('3. Fetching...');
    const data = await fetchUser(id);

    console.log('4. Fetch succeeded:', data);
    user.set(data);
  } catch (err) {
    console.error('5. Fetch failed:', err);
    error.set(err);
  } finally {
    console.log('6. Effect complete');
  }
});
```

### Promise Inspection

```tsx
async function debugFetch(url: string) {
  console.log('Fetching:', url);

  try {
    const response = await fetch(url);

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    const data = await response.json();

    console.log('Response data:', data);

    return data;
  } catch (err) {
    console.error('Fetch error:', err);
    throw err;
  }
}
```

## Network Debugging

### Monitor API Calls

**Network Tab:**
1. Open DevTools → Network
2. Filter by XHR/Fetch
3. Click request to see details
4. Check Request Headers, Response, Timing

**Log All Requests:**

```tsx
// services/api.ts
class ApiClient {
  async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    console.group(`API Request: ${options?.method || 'GET'} ${url}`);
    console.log('Options:', options);

    const startTime = performance.now();

    try {
      const response = await fetch(url, options);

      const duration = performance.now() - startTime;

      console.log('Status:', response.status);
      console.log('Duration:', `${duration.toFixed(2)}ms`);

      const data = await response.json();
      console.log('Response:', data);
      console.groupEnd();

      return data;
    } catch (err) {
      console.error('Request failed:', err);
      console.groupEnd();
      throw err;
    }
  }
}
```

## Performance Profiling

### Chrome Performance Tab

**Record Performance:**
1. Open DevTools → Performance
2. Click Record
3. Interact with app
4. Stop recording
5. Analyze flame graph

**What to Look For:**
- Long tasks (>50ms)
- Excessive function calls
- Memory spikes
- Layout shifts

### Performance Marks

```tsx
function ProfiledComponent() {
  performance.mark('component-start');

  const count = signal(0);
  const doubled = memo(() => count() * 2);

  effect(() => {
    performance.mark('effect-start');

    // Effect logic
    console.log('Count:', count());

    performance.mark('effect-end');
    performance.measure('effect', 'effect-start', 'effect-end');
  });

  performance.mark('component-end');
  performance.measure('component-setup', 'component-start', 'component-end');

  // View measurements
  performance.getEntriesByType('measure').forEach(entry => {
    console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`);
  });

  return <div>{doubled()}</div>;
}
```

### Memory Profiling

**Check for Memory Leaks:**

1. Open DevTools → Memory
2. Take heap snapshot
3. Interact with app
4. Take another snapshot
5. Compare snapshots
6. Look for growing objects

**Common Leaks:**

```tsx
// ❌ Leak: Effect not cleaning up
effect(() => {
  const interval = setInterval(() => {
    // This keeps running!
  }, 1000);
});

// ✅ Fixed: Cleanup
effect(() => {
  const interval = setInterval(() => {
    console.log('Tick');
  }, 1000);

  return () => clearInterval(interval);
});
```

## State Inspection

### Inspect Current State

```tsx
function DebugPanel() {
  return (
    <div className="debug-panel">
      <h3>Debug Info</h3>

      <div>
        <strong>User:</strong>
        <pre>{JSON.stringify(user(), null, 2)}</pre>
      </div>

      <div>
        <strong>Count:</strong> {count()}
      </div>

      <div>
        <strong>Items:</strong> {items().length}
      </div>

      <div>
        <strong>Selected:</strong>
        <pre>{JSON.stringify(selectedIds(), null, 2)}</pre>
      </div>
    </div>
  );
}

// Show only in development
{import.meta.env.DEV && <DebugPanel />}
```

### State History

```tsx
function createStateHistory<T>(signal: Signal<T>, maxHistory = 10) {
  const history: T[] = [];

  effect(() => {
    const value = signal();
    history.push(value);

    if (history.length > maxHistory) {
      history.shift();
    }

    console.log('State history:', history);
  });

  return {
    getHistory: () => history,
    clear: () => { history.length = 0; }
  };
}

// Usage
const count = signal(0);
const countHistory = createStateHistory(count);

// Later
console.log('History:', countHistory.getHistory());
// [0, 1, 2, 3, 4, 5]
```

## React DevTools (if using adapter)

### Component Tree

```
React DevTools → Components tab

- View component hierarchy
- Inspect props
- See hooks/signals
- Highlight updates
```

### Profiler

```
React DevTools → Profiler tab

- Record interactions
- See render times
- Identify slow components
- Check why components rendered
```

## Testing for Debugging

### Unit Test Debugging

```tsx
import { describe, it, expect } from 'vitest';

describe('Counter', () => {
  it('increments count', () => {
    const counter = useCounter();

    console.log('Initial:', counter.count());

    counter.increment();

    console.log('After increment:', counter.count());

    expect(counter.count()).toBe(1);
  });
});

// Run with: npm test -- --reporter=verbose
```

### Integration Test Debugging

```tsx
import { render, screen } from '@testing-library/philjs';

it('shows user name', async () => {
  render(<UserProfile userId="123" />);

  console.log('DOM:', screen.debug());  // Print current DOM

  await screen.findByText('Alice');

  console.log('Updated DOM:', screen.debug());
});
```

## Source Maps

### Enable Source Maps

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: true  // Generate source maps
  }
});
```

**Benefits:**
- See original code in DevTools
- Set breakpoints in TypeScript
- Better error messages
- Easier debugging

## Common Debugging Patterns

### Check-Then-Log Pattern

```tsx
const value = someSignal();

if (!value) {
  console.error('Value is null/undefined!', {
    signal: someSignal,
    otherContext: someOtherValue()
  });
  return;
}

// Safe to use value
console.log('Processing:', value);
```

### Try-Catch with Context

```tsx
try {
  const result = await riskyOperation();
  processResult(result);
} catch (err) {
  console.error('Operation failed:', {
    error: err,
    context: {
      userId: user()?.id,
      timestamp: new Date().toISOString(),
      attemptCount: retryCount()
    }
  });
}
```

### Assertion Pattern

```tsx
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error('Assertion failed:', message);
    debugger;  // Pause in DevTools
    throw new Error(message);
  }
}

// Usage
effect(() => {
  const value = count();

  assert(value >= 0, 'Count should not be negative');
  assert(value <= 100, 'Count should not exceed 100');

  // Proceed with valid value
});
```

## Debugging Tools

### VS Code Debugger

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}/src",
      "sourceMaps": true
    }
  ]
}
```

### PhilJS DevTools (if available)

```tsx
import { DevTools } from '@philjs/devtools';

function App() {
  return (
    <>
      {import.meta.env.DEV && <DevTools />}
      <Router>
        <Routes />
      </Router>
    </>
  );
}
```

**Features:**
- Signal inspection
- Effect tracking
- Component tree
- Time-travel debugging
- Performance metrics

## Summary

**Debugging Techniques:**

✅ Use console.log strategically
✅ Set breakpoints with debugger
✅ Monitor signals with inspectors
✅ Track effects with logging
✅ Profile performance
✅ Check network requests
✅ Inspect state history
✅ Use source maps
✅ Write debugging tests
✅ Enable DevTools

**Best Practices:**

- Remove debug code before committing
- Use meaningful log messages
- Include context in errors
- Profile before optimizing
- Test edge cases
- Document complex debugging sessions

**Next:** [Performance Issues →](./performance-issues.md)
