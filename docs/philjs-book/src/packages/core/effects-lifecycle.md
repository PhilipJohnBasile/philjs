# Effects and Lifecycle

Effects are the primary way to perform side effects in PhilJS. They automatically track signal dependencies and re-run when those dependencies change, providing a declarative approach to managing external interactions.

## Core Concepts

### What is an Effect?

An effect is a function that:
1. Runs immediately when created
2. Automatically tracks which signals it reads
3. Re-runs whenever those signals change
4. Can optionally return a cleanup function

```typescript
import { signal, effect } from '@philjs/core';

const count = signal(0);

// Effect runs immediately, then re-runs when count changes
effect(() => {
  console.log(`Count is: ${count()}`);
});

count.set(1); // Logs: "Count is: 1"
count.set(2); // Logs: "Count is: 2"
```

### Automatic Dependency Tracking

Unlike React's `useEffect` where you must manually specify dependencies, PhilJS effects automatically track dependencies:

```typescript
const firstName = signal('John');
const lastName = signal('Doe');
const showFullName = signal(true);

effect(() => {
  if (showFullName()) {
    // Both firstName and lastName are tracked
    console.log(`${firstName()} ${lastName()}`);
  } else {
    // Only firstName is tracked in this branch
    console.log(firstName());
  }
});

// Change showFullName to false
showFullName.set(false);
// Now only firstName changes trigger the effect
```

## Creating Effects

### Basic Effect

```typescript
import { effect } from '@philjs/core';

const dispose = effect(() => {
  // Your side effect code here
  document.title = `Count: ${count()}`;
});

// Later: stop the effect
dispose();
```

### Effect with Cleanup

Effects can return a cleanup function that runs before each re-execution and when the effect is disposed:

```typescript
effect(() => {
  const timer = setInterval(() => {
    console.log('tick');
  }, 1000);

  // Cleanup runs before next execution and on dispose
  return () => {
    clearInterval(timer);
  };
});
```

### Using onCleanup

For more complex scenarios, use `onCleanup` to register multiple cleanup handlers:

```typescript
import { effect, onCleanup, signal } from '@philjs/core';

const isConnected = signal(false);

effect(() => {
  if (!isConnected()) return;

  // Setup WebSocket
  const ws = new WebSocket('wss://api.example.com');

  ws.onopen = () => console.log('Connected');
  ws.onmessage = (e) => handleMessage(e.data);

  // Register cleanup
  onCleanup(() => {
    console.log('Closing WebSocket');
    ws.close();
  });

  // Can register multiple cleanups
  onCleanup(() => {
    console.log('Cleanup 2');
  });
});
```

## Common Effect Patterns

### DOM Manipulation

```typescript
const theme = signal<'light' | 'dark'>('light');

effect(() => {
  const currentTheme = theme();
  document.body.classList.remove('light', 'dark');
  document.body.classList.add(currentTheme);

  // Update CSS custom properties
  document.documentElement.style.setProperty(
    '--bg-color',
    currentTheme === 'dark' ? '#1a1a1a' : '#ffffff'
  );
});
```

### Event Listeners

```typescript
const isListening = signal(true);

effect(() => {
  if (!isListening()) return;

  const handleResize = () => {
    console.log(`Window size: ${window.innerWidth}x${window.innerHeight}`);
  };

  window.addEventListener('resize', handleResize);

  onCleanup(() => {
    window.removeEventListener('resize', handleResize);
  });
});
```

### Timers and Intervals

```typescript
const intervalMs = signal(1000);
const tickCount = signal(0);

effect(() => {
  const ms = intervalMs();

  const id = setInterval(() => {
    tickCount.set(c => c + 1);
  }, ms);

  onCleanup(() => clearInterval(id));
});
```

### Async Operations

```typescript
const searchQuery = signal('');
const results = signal<SearchResult[]>([]);
const isLoading = signal(false);

effect(() => {
  const query = searchQuery();

  // Don't search for short queries
  if (query.length < 3) {
    results.set([]);
    return;
  }

  // Create abort controller for cleanup
  const controller = new AbortController();

  isLoading.set(true);

  fetch(`/api/search?q=${encodeURIComponent(query)}`, {
    signal: controller.signal
  })
    .then(r => r.json())
    .then(data => {
      results.set(data);
      isLoading.set(false);
    })
    .catch(err => {
      if (err.name !== 'AbortError') {
        console.error('Search failed:', err);
        isLoading.set(false);
      }
    });

  // Abort previous request on cleanup
  onCleanup(() => controller.abort());
});
```

### LocalStorage Sync

```typescript
const preferences = signal({
  theme: 'light',
  fontSize: 16,
  notifications: true
});

// Load from localStorage on init
const stored = localStorage.getItem('preferences');
if (stored) {
  preferences.set(JSON.parse(stored));
}

// Sync to localStorage on change
effect(() => {
  const prefs = preferences();
  localStorage.setItem('preferences', JSON.stringify(prefs));
});
```

### Media Queries

```typescript
const isDarkMode = signal(false);

effect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = (e: MediaQueryListEvent) => {
    isDarkMode.set(e.matches);
  };

  // Set initial value
  isDarkMode.set(mediaQuery.matches);

  // Listen for changes
  mediaQuery.addEventListener('change', handleChange);

  onCleanup(() => {
    mediaQuery.removeEventListener('change', handleChange);
  });
});
```

### Intersection Observer

```typescript
const elementRef = signal<HTMLElement | null>(null);
const isVisible = signal(false);

effect(() => {
  const element = elementRef();
  if (!element) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      isVisible.set(entry.isIntersecting);
    },
    { threshold: 0.1 }
  );

  observer.observe(element);

  onCleanup(() => observer.disconnect());
});
```

## Scoped Roots

### createRoot

`createRoot` creates a new reactive scope for managing effect lifetimes:

```typescript
import { createRoot, effect, signal } from '@philjs/core';

function createTimer(callback: () => void, ms: number) {
  return createRoot(dispose => {
    const intervalMs = signal(ms);

    effect(() => {
      const id = setInterval(callback, intervalMs());
      onCleanup(() => clearInterval(id));
    });

    return {
      setInterval: (newMs: number) => intervalMs.set(newMs),
      stop: dispose
    };
  });
}

const timer = createTimer(() => console.log('tick'), 1000);

// Later
timer.setInterval(500); // Change interval
timer.stop(); // Stop and clean up
```

### Nested Effects

Effects can be nested, and child effects are automatically cleaned up when the parent re-runs:

```typescript
const items = signal([1, 2, 3]);

effect(() => {
  const currentItems = items();

  // These nested effects are cleaned up when items changes
  currentItems.forEach(item => {
    effect(() => {
      console.log(`Item ${item} effect`);
    });
  });
});

// When items changes, all nested effects are disposed
// and new ones are created
items.set([4, 5]);
```

## Batching Updates

### batch

Use `batch` to group multiple signal updates into a single update cycle:

```typescript
import { batch, signal, effect } from '@philjs/core';

const firstName = signal('John');
const lastName = signal('Doe');
const age = signal(30);

// This effect tracks all three signals
effect(() => {
  console.log(`${firstName()} ${lastName()}, age ${age()}`);
});

// Without batching: effect runs 3 times
firstName.set('Jane');
lastName.set('Smith');
age.set(25);

// With batching: effect runs only once
batch(() => {
  firstName.set('Jane');
  lastName.set('Smith');
  age.set(25);
});
// Logs: "Jane Smith, age 25" (only once)
```

### Nested Batching

Batching can be nested - updates only flush when the outermost batch completes:

```typescript
batch(() => {
  count.set(1);

  batch(() => {
    count.set(2);
    count.set(3);
  });
  // Still batched, no updates yet

  count.set(4);
});
// Now all updates are flushed, effects see final value: 4
```

## Untracking

### untrack

Use `untrack` to read signal values without creating dependencies:

```typescript
import { untrack, signal, effect } from '@philjs/core';

const trigger = signal(0);
const data = signal('Hello');

effect(() => {
  // This creates a dependency on trigger
  const t = trigger();

  // This does NOT create a dependency on data
  const d = untrack(() => data());

  console.log(`Trigger: ${t}, Data: ${d}`);
});

// This triggers the effect
trigger.set(1);

// This does NOT trigger the effect
data.set('World');

// But next time trigger changes, we see the new data
trigger.set(2);
// Logs: "Trigger: 2, Data: World"
```

### When to Use untrack

1. **Reading config that shouldn't trigger re-runs:**
```typescript
effect(() => {
  const query = searchQuery(); // Tracked
  const config = untrack(() => searchConfig()); // Not tracked

  performSearch(query, config);
});
```

2. **Avoiding infinite loops:**
```typescript
effect(() => {
  const items = itemsSignal();

  // Use untrack to prevent loop when modifying related signal
  const count = untrack(() => itemCount());

  if (items.length !== count) {
    itemCount.set(items.length);
  }
});
```

3. **Performance optimization:**
```typescript
effect(() => {
  const importantData = criticalSignal(); // Changes trigger update
  const largeObject = untrack(() => bigDataSignal()); // Changes ignored

  processData(importantData, largeObject);
});
```

## TypeScript 6 Disposable Integration

PhilJS supports TypeScript 6's Explicit Resource Management:

```typescript
import {
  disposableTimeout,
  disposableInterval,
  disposableEventListener,
  disposableSubscription
} from '@philjs/core/disposable';

// Using block pattern for automatic cleanup
{
  using timeout = disposableTimeout(() => {
    console.log('Timer fired');
  }, 5000);

  // timeout is automatically cleared when block exits
}

// Async disposables
async function connectToServer() {
  await using connection = await createAsyncConnection();

  // Use connection...

  // Automatically closed when function exits
}
```

## Best Practices

### 1. Keep Effects Focused

```typescript
// Bad: One effect doing too much
effect(() => {
  updateDOM();
  syncToServer();
  logAnalytics();
});

// Good: Separate effects for separate concerns
effect(() => updateDOM());
effect(() => syncToServer());
effect(() => logAnalytics());
```

### 2. Handle Cleanup Properly

```typescript
// Bad: Memory leak!
effect(() => {
  window.addEventListener('scroll', handleScroll);
});

// Good: Clean up listeners
effect(() => {
  window.addEventListener('scroll', handleScroll);
  onCleanup(() => window.removeEventListener('scroll', handleScroll));
});
```

### 3. Avoid Infinite Loops

```typescript
// Bad: Infinite loop!
effect(() => {
  count.set(count() + 1); // Reading and writing same signal
});

// Good: Use untrack or separate signals
effect(() => {
  const current = count();
  // Only update derived signal, not the source
  doubled.set(current * 2);
});
```

### 4. Debounce Expensive Operations

```typescript
import { debounceAsync } from '@philjs/core/async';

const debouncedSearch = debounceAsync(async (query: string) => {
  return fetch(`/api/search?q=${query}`).then(r => r.json());
}, 300);

effect(() => {
  const query = searchQuery();
  if (query.length >= 3) {
    debouncedSearch(query).then(setResults);
  }
});
```

### 5. Use createRoot for Isolated Scopes

```typescript
// Good: Isolated scope that can be disposed independently
function createFeature() {
  return createRoot(dispose => {
    const state = signal(initialState);

    effect(() => {
      // Feature-specific effects
    });

    return {
      getState: () => state(),
      destroy: dispose
    };
  });
}
```

## Debugging Effects

### Logging Dependencies

```typescript
effect(() => {
  console.log('Effect running with dependencies:');
  console.log('- count:', count());
  console.log('- name:', name());
});
```

### HMR Support

PhilJS effects integrate with Hot Module Replacement:

```typescript
import { cleanupHMREffects, getHMRStats } from '@philjs/core';

// In your HMR handler
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    cleanupHMREffects();
    // Re-initialize effects...
  });
}

// Debug HMR state
console.log(getHMRStats());
```

## Next Steps

- [Signals and Reactivity](./signals.md) - Deep dive into signals
- [Store](./store.md) - Deep reactive stores
- [Async Primitives](./async.md) - Advanced async handling
