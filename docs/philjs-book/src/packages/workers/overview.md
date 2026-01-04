# @philjs/workers

Thread pool Web Workers with task queuing, shared state, and parallel iterators.

## Installation

```bash
npm install @philjs/workers
```

## Features

- **Worker Pool** - Automatic worker management
- **Task Queuing** - Priority-based task scheduling
- **Shared State** - SharedArrayBuffer with atomics
- **Channels** - Go-style message passing
- **Parallel Iterators** - map, filter, reduce in parallel
- **Transferables** - Zero-copy data transfer
- **Progress Reporting** - Real-time task progress
- **Cancellation** - Cancel running tasks

## Quick Start

```typescript
import { WorkerPool } from '@philjs/workers';

const pool = new WorkerPool({ maxWorkers: 4 });

// Execute a function in a worker
const result = await pool.exec(
  (a, b) => a + b,
  5, 10
);
console.log(result); // 15

// Parallel map over array
const squares = await pool.map(
  [1, 2, 3, 4, 5],
  (n) => n * n
);
console.log(squares); // [1, 4, 9, 16, 25]
```

## Worker Pool

### Configuration

```typescript
import { WorkerPool } from '@philjs/workers';

const pool = new WorkerPool({
  minWorkers: 1,           // Minimum workers to keep alive
  maxWorkers: navigator.hardwareConcurrency, // Max workers (default: CPU count)
  idleTimeout: 30000,      // Kill idle workers after 30s
  taskTimeout: 60000,      // Default task timeout
  workerOptions: {},       // Worker constructor options
});
```

### Basic Execution

```typescript
// Execute function with arguments
const result = await pool.exec(
  (x, y) => x * y,
  6, 7
);
// result: 42

// With more complex logic
const data = await pool.exec(
  (items) => {
    return items
      .filter(x => x > 0)
      .map(x => x * 2)
      .reduce((a, b) => a + b, 0);
  },
  [1, -2, 3, -4, 5]
);
// data: 18
```

### Running Tasks

```typescript
// Run with full task options
const result = await pool.run({
  fn: (data) => processData(data),
  args: [largeDataset],
  priority: 1,         // Higher priority
  timeout: 120000,     // 2 minute timeout
  transferables: [],   // Transferable objects
  onProgress: (progress) => {
    console.log(`${progress * 100}% complete`);
  },
});
```

### Parallel Array Operations

```typescript
// Map
const doubled = await pool.map([1, 2, 3, 4], (n) => n * 2);
// [2, 4, 6, 8]

// Filter
const evens = await pool.filter([1, 2, 3, 4, 5, 6], (n) => n % 2 === 0);
// [2, 4, 6]

// Reduce
const sum = await pool.reduce(
  [1, 2, 3, 4, 5],
  (acc, n) => acc + n,
  0
);
// 15

// Map with settled results (no throwing on error)
const results = await pool.mapSettled(items, processItem);
results.forEach(r => {
  if (r.status === 'fulfilled') {
    console.log('Success:', r.value);
  } else {
    console.log('Failed:', r.reason);
  }
});
```

### Pool Statistics

```typescript
const stats = pool.getStats();

console.log({
  totalWorkers: stats.totalWorkers,
  activeWorkers: stats.activeWorkers,
  idleWorkers: stats.idleWorkers,
  queuedTasks: stats.queuedTasks,
  completedTasks: stats.completedTasks,
  failedTasks: stats.failedTasks,
  averageTaskDuration: stats.averageTaskDuration,
});
```

### Pool Management

```typescript
// Resize pool
pool.resize(8); // Set to 8 workers

// Terminate all workers
pool.terminate();
```

## Progress Reporting

### From Worker

```typescript
// The last argument to the function is always the progress reporter
const result = await pool.run({
  fn: (items, reportProgress) => {
    const results = [];
    for (let i = 0; i < items.length; i++) {
      results.push(processItem(items[i]));
      reportProgress((i + 1) / items.length);
    }
    return results;
  },
  args: [largeArray],
  onProgress: (progress) => {
    updateProgressBar(progress * 100);
  },
});
```

## Shared State

### Creating Shared State

```typescript
import { SharedState } from '@philjs/workers';

const state = new SharedState({
  counter: 0,
  completed: 0,
  errors: 0,
});
```

### Atomic Operations

```typescript
// Get value
const count = state.get('counter');

// Set value
state.set('counter', 10);

// Atomic add
const oldValue = state.add('counter', 5);

// Increment/decrement
state.increment('completed');
state.decrement('errors');

// Compare and exchange
const result = state.compareExchange('counter', 10, 20);
// Returns old value if exchange happened
```

### Get All Values

```typescript
const values = state.toObject();
// { counter: 20, completed: 1, errors: 0 }
```

### Share with Workers

```typescript
const buffer = state.getBuffer();

// Pass to worker
await pool.exec(
  (sharedBuffer) => {
    const state = SharedState.fromBuffer(sharedBuffer, ['counter', 'completed', 'errors']);
    state.increment('counter');
    return state.get('counter');
  },
  buffer
);
```

## Channels

Go-style channels for message passing between async contexts.

### Basic Usage

```typescript
import { Channel } from '@philjs/workers';

const channel = new Channel<number>();

// Send (non-blocking if there's a waiter)
await channel.send(42);

// Receive (blocks until message available)
const value = await channel.receive();

// Try receive (non-blocking)
const maybeValue = channel.tryReceive();
```

### Producer/Consumer

```typescript
const channel = new Channel<string>();

// Producer
async function producer() {
  for (const item of items) {
    await channel.send(item);
  }
  channel.close();
}

// Consumer
async function consumer() {
  for await (const item of channel) {
    await processItem(item);
  }
}

// Run both
await Promise.all([producer(), consumer()]);
```

### Channel Status

```typescript
// Check if closed
if (channel.isClosed()) {
  console.log('Channel closed');
}

// Get buffer length
console.log('Pending messages:', channel.length);

// Close channel
channel.close();
```

## Parallel Iterator

### Creating a Parallel Iterator

```typescript
import { ParallelIterator } from '@philjs/workers';

const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const parallel = new ParallelIterator(items, pool);
```

### Operations

```typescript
// Parallel map
const doubled = await parallel.map((x) => x * 2);

// Parallel filter
const evens = await parallel.filter((x) => x % 2 === 0);

// Parallel reduce
const sum = await parallel.reduce((acc, x) => acc + x, 0);

// Parallel forEach (side effects)
await parallel.forEach((x) => console.log(x));

// Parallel some
const hasNegative = await parallel.some((x) => x < 0);

// Parallel every
const allPositive = await parallel.every((x) => x > 0);

// Parallel find
const found = await parallel.find((x) => x > 5);
```

### Chunking

```typescript
// Process in chunks
const chunked = parallel.chunk(3);
// ParallelIterator<number[]> with [[1,2,3], [4,5,6], [7,8,9], [10]]

const chunkSums = await chunked.map((chunk) =>
  chunk.reduce((a, b) => a + b, 0)
);
```

## React-style Hooks

### useWorkerPool

```typescript
import { useWorkerPool } from '@philjs/workers';

function MyComponent() {
  const {
    exec,
    map,
    filter,
    reduce,
    stats,
    resize,
  } = useWorkerPool({ maxWorkers: 4 });

  const handleProcess = async () => {
    const results = await map(data, processItem);
    setResults(results);
  };

  return (
    <div>
      <p>Active workers: {stats.activeWorkers}</p>
      <p>Queued tasks: {stats.queuedTasks}</p>
      <button onClick={handleProcess}>Process</button>
    </div>
  );
}
```

### useParallel

```typescript
import { useParallel } from '@philjs/workers';

function DataProcessor({ items }) {
  const { results, loading, error, retry } = useParallel(
    items,
    (item) => expensiveComputation(item),
    [items] // Dependencies
  );

  if (loading) return <Spinner />;
  if (error) return <Error error={error} onRetry={retry} />;

  return <Results data={results} />;
}
```

### useSharedState

```typescript
import { useSharedState } from '@philjs/workers';

function Counter() {
  const {
    state,
    get,
    set,
    increment,
    decrement,
    buffer,
  } = useSharedState({
    count: 0,
    clicks: 0,
  });

  return (
    <div>
      <p>Count: {get('count')}</p>
      <button onClick={() => increment('count')}>+</button>
      <button onClick={() => decrement('count')}>-</button>
    </div>
  );
}
```

## Transferable Objects

### Zero-Copy Transfer

```typescript
// Create transferable data
const buffer = new ArrayBuffer(1024 * 1024); // 1MB
const data = new Uint8Array(buffer);
// Fill with data...

// Transfer to worker (zero-copy)
const result = await pool.run({
  fn: (data) => {
    // Process data
    return processBuffer(data);
  },
  args: [data],
  transferables: [buffer], // Transfer ownership
});

// Note: 'buffer' is no longer accessible here after transfer
```

### Common Transferables

```typescript
// ArrayBuffer
const arrayBuffer = new ArrayBuffer(100);

// TypedArrays' underlying buffer
const uint8 = new Uint8Array(100);
const float32 = new Float32Array(100);

// MessagePort
const { port1, port2 } = new MessageChannel();

// ImageBitmap
const bitmap = await createImageBitmap(imageData);

// OffscreenCanvas
const canvas = new OffscreenCanvas(800, 600);
```

## Types Reference

```typescript
// Pool configuration
interface WorkerPoolConfig {
  minWorkers?: number;
  maxWorkers?: number;
  idleTimeout?: number;
  taskTimeout?: number;
  workerOptions?: WorkerOptions;
}

// Task definition
interface Task<T = any, R = any> {
  id: string;
  fn: (...args: T[]) => R;
  args: T[];
  transferables?: Transferable[];
  priority?: number;
  timeout?: number;
  onProgress?: (progress: number) => void;
}

// Task result
interface TaskResult<R = any> {
  id: string;
  result?: R;
  error?: Error;
  duration: number;
}

// Pool statistics
interface PoolStats {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  queuedTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskDuration: number;
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `WorkerPool` | Managed pool of Web Workers |
| `PoolWorker` | Individual worker wrapper |
| `SharedState` | Atomic shared state |
| `Channel` | Async message channel |
| `ParallelIterator` | Parallel array operations |

### Hooks

| Hook | Description |
|------|-------------|
| `useWorkerPool(config?)` | Worker pool operations |
| `useParallel(items, fn, deps?)` | Parallel computation |
| `useSharedState(initial)` | Atomic shared state |

## Example: Image Processing Pipeline

```typescript
import { WorkerPool, SharedState, Channel } from '@philjs/workers';

async function processImages(images: ImageData[]) {
  const pool = new WorkerPool({ maxWorkers: 4 });
  const progress = new SharedState({ processed: 0, total: images.length });
  const results = new Channel<ProcessedImage>();

  // Process images in parallel
  const processing = pool.map(images, (image, reportProgress) => {
    // Apply filters
    const filtered = applyFilters(image);
    reportProgress(0.5);

    // Resize
    const resized = resize(filtered, 800, 600);
    reportProgress(1.0);

    return resized;
  });

  // Collect results as they complete
  processing.then(processedImages => {
    processedImages.forEach(img => results.send(img));
    results.close();
  });

  // Stream results
  const allResults: ProcessedImage[] = [];
  for await (const result of results) {
    allResults.push(result);
    progress.increment('processed');

    const current = progress.get('processed');
    const total = progress.get('total');
    console.log(`Progress: ${current}/${total}`);
  }

  pool.terminate();
  return allResults;
}
```

## Example: CPU-Intensive Computation

```typescript
import { useWorkerPool } from '@philjs/workers';

function PrimeCalculator() {
  const [primes, setPrimes] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const { exec } = useWorkerPool();

  const findPrimes = async (max: number) => {
    const result = await exec(
      (limit, reportProgress) => {
        const primes: number[] = [];

        for (let n = 2; n <= limit; n++) {
          if (isPrime(n)) primes.push(n);
          if (n % 1000 === 0) reportProgress(n / limit);
        }

        return primes;

        function isPrime(n: number): boolean {
          if (n < 2) return false;
          for (let i = 2; i <= Math.sqrt(n); i++) {
            if (n % i === 0) return false;
          }
          return true;
        }
      },
      max,
      { onProgress: setProgress }
    );

    setPrimes(result);
  };

  return (
    <div>
      <button onClick={() => findPrimes(1000000)}>
        Find primes up to 1,000,000
      </button>
      <progress value={progress} max={1} />
      <p>Found {primes.length} primes</p>
    </div>
  );
}
```
