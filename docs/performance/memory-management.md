# Memory Management

Prevent memory leaks and optimize memory usage in PhilJS applications.

## What You'll Learn

- Memory leak detection
- Effect cleanup
- Event listener cleanup
- Observer cleanup
- Memory profiling
- Best practices

## Common Memory Leaks

### Event Listeners

```typescript
import { effect } from 'philjs-core';

// ❌ Memory leak - listener never removed
function BadComponent() {
  effect(() => {
    window.addEventListener('scroll', handleScroll);
    // Missing cleanup!
  });
}

// ✅ Proper cleanup
function GoodComponent() {
  effect(() => {
    const handleScroll = () => {
      console.log(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });
}
```

### Timers and Intervals

```typescript
// ❌ Memory leak - timer never cleared
function BadTimer() {
  effect(() => {
    setInterval(() => {
      console.log('tick');
    }, 1000);
    // Runs forever!
  });
}

// ✅ Proper cleanup
function GoodTimer() {
  effect(() => {
    const id = setInterval(() => {
      console.log('tick');
    }, 1000);

    return () => clearInterval(id);
  });
}
```

### Observers

```typescript
// ❌ Observer never disconnected
function BadObserver() {
  let ref: HTMLElement | undefined;

  effect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver((entries) => {
      // Handle intersection
    });

    observer.observe(ref);
    // Never disconnected!
  });
}

// ✅ Proper cleanup
function GoodObserver() {
  let ref: HTMLElement | undefined;

  effect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver((entries) => {
      // Handle intersection
    });

    observer.observe(ref);

    return () => observer.disconnect();
  });
}
```

## Effect Cleanup

### Cleanup Pattern

```typescript
import { effect, signal } from 'philjs-core';

function ComponentWithCleanup() {
  const isActive = signal(true);

  effect(() => {
    if (!isActive()) return;

    // Setup
    const subscription = subscribeToData((data) => {
      handleData(data);
    });

    const timer = setInterval(() => {
      checkStatus();
    }, 5000);

    // Cleanup
    return () => {
      subscription.unsubscribe();
      clearInterval(timer);
    };
  });
}
```

### Conditional Cleanup

```typescript
function ConditionalCleanup() {
  const isEnabled = signal(true);

  effect(() => {
    if (!isEnabled()) return;

    const ws = new WebSocket('wss://api.example.com');

    ws.onmessage = (event) => {
      handleMessage(event.data);
    };

    // Only cleanup if WebSocket was created
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  });
}
```

## Preventing Closures Leaks

### Avoid Capturing Large Objects

```typescript
// ❌ Captures entire large object
function BadClosure() {
  const largeData = signal({ /* huge object */ });

  effect(() => {
    // Captures entire largeData
    document.addEventListener('click', () => {
      console.log(largeData().id); // Only needs ID
    });
  });
}

// ✅ Extract only what's needed
function GoodClosure() {
  const largeData = signal({ /* huge object */ });
  const dataId = memo(() => largeData().id);

  effect(() => {
    const id = dataId(); // Only capture ID

    const handler = () => {
      console.log(id);
    };

    document.addEventListener('click', handler);

    return () => document.removeEventListener('click', handler);
  });
}
```

### WeakMap for Caching

```typescript
// ✅ WeakMap allows garbage collection
const cache = new WeakMap<object, any>();

function cacheResult(obj: object, result: any) {
  cache.set(obj, result);
}

function getCached(obj: object) {
  return cache.get(obj);
}

// When obj is garbage collected, cache entry is automatically removed
```

## Detaching DOM Elements

### Remove References

```typescript
function CleanComponent() {
  let element: HTMLElement | null = null;

  effect(() => {
    element = document.getElementById('my-element');

    return () => {
      // Remove reference to allow garbage collection
      element = null;
    };
  });
}
```

### Clear Large Arrays

```typescript
// ❌ Large array stays in memory
function BadList() {
  const items = signal(Array(10000).fill(0).map((_, i) => ({
    id: i,
    data: new Array(1000).fill(i)
  })));

  // Items never cleared
}

// ✅ Clear when no longer needed
function GoodList() {
  const items = signal([]);

  const loadItems = () => {
    items.set(generateLargeList());
  };

  const clearItems = () => {
    items.set([]); // Free memory
  };

  return (
    <div>
      <button onClick={loadItems}>Load</button>
      <button onClick={clearItems}>Clear</button>
    </div>
  );
}
```

## Memory Profiling

### Detect Memory Leaks

```typescript
function measureMemory() {
  if ('memory' in performance) {
    const memory = (performance as any).memory;

    console.log({
      usedJSHeapSize: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      totalJSHeapSize: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      jsHeapSizeLimit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
    });
  }
}

// Call periodically to track memory usage
setInterval(measureMemory, 5000);
```

### Performance Observer for Memory

```typescript
import { effect } from 'philjs-core';

function trackMemoryUsage() {
  effect(() => {
    if ('memory' in performance) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log('Memory:', entry);
        }
      });

      observer.observe({ entryTypes: ['measure'] });

      return () => observer.disconnect();
    }
  });
}
```

## Best Practices

### Use Weak References

```typescript
// ✅ WeakSet for object tracking
const tracked = new WeakSet<object>();

function trackObject(obj: object) {
  tracked.add(obj);
}

function isTracked(obj: object) {
  return tracked.has(obj);
}

// Objects can be garbage collected even if in WeakSet
```

### Limit Cache Size

```typescript
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  set(key: K, value: V) {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (mark as recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  clear() {
    this.cache.clear();
  }
}

// Usage
const cache = new LRUCache<string, any>(100); // Max 100 items
```

### Avoid Global Variables

```typescript
// ❌ Global variables prevent garbage collection
window.largeDataStore = {
  items: new Array(10000).fill(0)
};

// ✅ Use local scope
function Component() {
  const localData = signal([]);
  // Garbage collected when component unmounts
}
```

### Clean Up Subscriptions

```typescript
// ✅ Subscription cleanup pattern
function useSubscription<T>(subscribe: (callback: (data: T) => void) => () => void) {
  effect(() => {
    const unsubscribe = subscribe((data) => {
      handleData(data);
    });

    return () => unsubscribe();
  });
}

// Usage
useSubscription((callback) => {
  return eventBus.on('data', callback);
});
```

### Nullify Large Objects

```typescript
function processLargeData() {
  let largeObject = {
    data: new Array(1000000).fill(0)
  };

  // Use the data
  processData(largeObject.data);

  // Nullify to allow garbage collection
  largeObject = null as any;
}
```

## Debugging Memory Issues

### Chrome DevTools Memory Profiler

```typescript
// Take heap snapshots
function Component() {
  // 1. Take snapshot before action
  // 2. Perform action
  // 3. Take snapshot after
  // 4. Compare to find leaks

  const handleAction = () => {
    // Action that might leak
    for (let i = 0; i < 1000; i++) {
      createHeavyObject();
    }
  };

  return <button onClick={handleAction}>Test</button>;
}
```

### Memory Leak Test Pattern

```typescript
function testForMemoryLeak() {
  const initialMemory = (performance as any).memory?.usedJSHeapSize;

  // Perform action many times
  for (let i = 0; i < 100; i++) {
    const component = createComponent();
    component.mount();
    component.unmount();
  }

  // Force garbage collection (in Chrome with flag)
  if ((window as any).gc) {
    (window as any).gc();
  }

  const finalMemory = (performance as any).memory?.usedJSHeapSize;
  const leaked = finalMemory - initialMemory;

  if (leaked > 1000000) { // 1MB threshold
    console.warn('Possible memory leak:', leaked / 1048576, 'MB');
  }
}
```

## Summary

You've learned:

✅ Common memory leak patterns
✅ Effect cleanup patterns
✅ Event listener management
✅ Observer cleanup
✅ Preventing closure leaks
✅ Memory profiling techniques
✅ Best practices for memory management

Proper memory management ensures app stability!

---

**Next:** [Profiling →](./profiling.md) Identify performance bottlenecks
