# Runtime Performance

Optimize application execution speed and responsiveness.

## What You'll Learn

- Event optimization
- Rendering performance
- JavaScript optimization
- DOM operations
- Web Workers
- Best practices

## Event Optimization

### Debouncing

```typescript
function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let timeoutId: any;

  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
}

// Usage
function SearchInput() {
  const query = signal('');

  const handleSearch = debounce((value: string) => {
    // API call only after user stops typing
    searchAPI(value);
  }, 300);

  return (
    <input
      value={query()}
      onInput={(e) => {
        query.set(e.target.value);
        handleSearch(e.target.value);
      }}
    />
  );
}
```

### Throttling

```typescript
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  let inThrottle: boolean;

  return ((...args: any[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}

// Usage
function ScrollHandler() {
  const handleScroll = throttle(() => {
    console.log('Scroll event', window.scrollY);
  }, 100);

  return <div onScroll={handleScroll}>{/* content */}</div>;
}
```

### Passive Event Listeners

```typescript
import { effect } from '@philjs/core';

function usePassiveScroll(callback: (e: Event) => void) {
  effect(() => {
    const handler = (e: Event) => callback(e);

    window.addEventListener('scroll', handler, { passive: true });

    return () => window.removeEventListener('scroll', handler);
  });
}

// Usage
usePassiveScroll((e) => {
  // Won't block scrolling
  updateScrollPosition(window.scrollY);
});
```

## Rendering Performance

### Batch Updates

```typescript
import { batch } from '@philjs/core';

function updateMultipleValues() {
  const count = signal(0);
  const name = signal('');
  const active = signal(false);

  // ❌ Triggers 3 re-renders
  count.set(10);
  name.set('Alice');
  active.set(true);

  // ✅ Triggers 1 re-render
  batch(() => {
    count.set(10);
    name.set('Alice');
    active.set(true);
  });
}
```

### Avoid Layout Thrashing

```typescript
// ❌ Layout thrashing (read-write-read-write)
function badLayoutUpdate() {
  const height1 = element1.offsetHeight; // Read
  element1.style.height = `${height1 * 2}px`; // Write

  const height2 = element2.offsetHeight; // Read (forces layout)
  element2.style.height = `${height2 * 2}px`; // Write
}

// ✅ Batch reads, then batch writes
function goodLayoutUpdate() {
  // Batch all reads
  const height1 = element1.offsetHeight;
  const height2 = element2.offsetHeight;

  // Batch all writes
  element1.style.height = `${height1 * 2}px`;
  element2.style.height = `${height2 * 2}px`;
}
```

### RequestAnimationFrame

```typescript
function useRAF(callback: () => void) {
  effect(() => {
    let rafId: number;

    const loop = () => {
      callback();
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  });
}

// Usage
function AnimatedComponent() {
  const position = signal(0);

  useRAF(() => {
    position.set(position() + 1);
  });

  return <div style={{ transform: `translateX(${position()}px)` }} />;
}
```

## JavaScript Optimization

### Avoid Blocking Operations

```typescript
// ❌ Blocks main thread
function processLargeDataset(data: any[]) {
  return data.map(item => heavyTransformation(item));
}

// ✅ Use Web Worker
const worker = new Worker('/worker.js');

worker.postMessage({ data: largeDataset });

worker.onmessage = (e) => {
  const processed = e.data;
  updateUI(processed);
};
```

### Optimize Loops

```typescript
// ❌ Slow loop
for (let i = 0; i < array.length; i++) {
  // array.length calculated each iteration
}

// ✅ Cache length
const len = array.length;
for (let i = 0; i < len; i++) {
  // Faster
}

// ✅ Or use for...of
for (const item of array) {
  // Clean and fast
}
```

### Early Returns

```typescript
// ✅ Early returns reduce computation
function processItem(item: any) {
  if (!item) return null;
  if (item.skip) return null;
  if (!item.valid) return null;

  // Heavy processing only if needed
  return expensiveTransformation(item);
}
```

## DOM Operations

### Minimize DOM Access

```typescript
// ❌ Multiple DOM accesses
function updateList() {
  for (let i = 0; i < items.length; i++) {
    document.getElementById('list').innerHTML += `<li>${items[i]}</li>`;
  }
}

// ✅ Build string, single DOM update
function updateList() {
  const html = items.map(item => `<li>${item}</li>`).join('');
  document.getElementById('list')!.innerHTML = html;
}
```

### Use Document Fragments

```typescript
function createList(items: string[]) {
  const fragment = document.createDocumentFragment();

  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    fragment.appendChild(li);
  });

  // Single reflow
  document.getElementById('list')!.appendChild(fragment);
}
```

### Avoid Inline Styles

```typescript
// ❌ Inline styles (slower)
<div style={{ width: '100px', height: '100px', backgroundColor: 'red' }} />

// ✅ CSS classes (faster)
<div className="box box-red" />
```

## Web Workers

### Offload Heavy Tasks

```typescript
// main thread
const worker = new Worker('/data-processor.worker.js');

worker.postMessage({
  action: 'process',
  data: largeDataset
});

worker.onmessage = (e) => {
  if (e.data.type === 'progress') {
    updateProgress(e.data.percent);
  } else if (e.data.type === 'complete') {
    displayResults(e.data.results);
  }
};

// data-processor.worker.js
self.onmessage = (e) => {
  if (e.data.action === 'process') {
    const results = [];
    const total = e.data.data.length;

    e.data.data.forEach((item, index) => {
      results.push(processItem(item));

      // Report progress
      if (index % 100 === 0) {
        self.postMessage({
          type: 'progress',
          percent: (index / total) * 100
        });
      }
    });

    self.postMessage({
      type: 'complete',
      results
    });
  }
};
```

### Worker Pool

```typescript
class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{
    data: any;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = [];

  constructor(workerScript: string, poolSize: number = 4) {
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript);

      worker.onmessage = (e) => {
        this.handleWorkerComplete(worker, e.data);
      };

      this.workers.push(worker);
    }
  }

  execute(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const freeWorker = this.workers.find(w => !(w as any).busy);

      if (freeWorker) {
        this.runTask(freeWorker, data, resolve, reject);
      } else {
        this.queue.push({ data, resolve, reject });
      }
    });
  }

  private runTask(
    worker: Worker,
    data: any,
    resolve: (value: any) => void,
    reject: (reason: any) => void
  ) {
    (worker as any).busy = true;
    (worker as any).resolve = resolve;
    (worker as any).reject = reject;
    worker.postMessage(data);
  }

  private handleWorkerComplete(worker: Worker, result: any) {
    (worker as any).resolve(result);
    (worker as any).busy = false;

    // Process queue
    if (this.queue.length > 0) {
      const { data, resolve, reject } = this.queue.shift()!;
      this.runTask(worker, data, resolve, reject);
    }
  }
}

// Usage
const pool = new WorkerPool('/processor.worker.js', 4);

async function processData(items: any[]) {
  const results = await Promise.all(
    items.map(item => pool.execute(item))
  );
  return results;
}
```

## Best Practices

### Use Will-Change Sparingly

```css
/* ✅ Use for elements that will animate */
.animated-element {
  will-change: transform;
}

/* ❌ Don't use on everything */
* {
  will-change: transform, opacity;
}
```

### Optimize Images

```typescript
// ✅ Use appropriate image formats
<picture>
  <source srcset="image.avif" type="image/avif" />
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="..." />
</picture>

// ✅ Lazy load images
<img loading="lazy" src="image.jpg" />

// ✅ Use responsive images
<img
  srcset="small.jpg 400w, medium.jpg 800w, large.jpg 1200w"
  sizes="(max-width: 600px) 100vw, 50vw"
/>
```

### Avoid Memory Leaks

```typescript
// ✅ Clean up event listeners
effect(() => {
  const handler = () => console.log('clicked');
  window.addEventListener('click', handler);

  return () => window.removeEventListener('click', handler);
});

// ✅ Clear timers
effect(() => {
  const id = setInterval(() => {
    console.log('tick');
  }, 1000);

  return () => clearInterval(id);
});
```

### Use CSS Containment

```css
/* Optimize rendering performance */
.independent-component {
  contain: layout style paint;
}

.card-grid {
  contain: layout style;
}
```

## Summary

You've learned:

✅ Event optimization (debounce, throttle)
✅ Rendering performance optimization
✅ JavaScript execution optimization
✅ Efficient DOM operations
✅ Web Workers for heavy tasks
✅ Best practices for runtime performance

Optimize runtime for smooth, responsive applications!

---

**Next:** [Memory Management →](./memory-management.md) Prevent memory leaks
