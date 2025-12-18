# Web Workers

Leverage Web Workers to offload heavy computations and maintain smooth UI performance in PhilJS applications.

## What You'll Learn

- Web Worker fundamentals
- Worker setup with PhilJS signals
- Data transfer patterns (postMessage, Transferable Objects, SharedArrayBuffer)
- Offloading heavy computations
- Worker pools and management
- Best practices for performance

## Web Worker Basics

Web Workers run JavaScript in background threads, preventing heavy computations from blocking the main thread and keeping your UI responsive.

### Creating a Basic Worker

```typescript
// public/workers/calculator.worker.ts
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'CALCULATE':
      const result = performHeavyCalculation(data);
      self.postMessage({ type: 'RESULT', data: result });
      break;

    case 'TERMINATE':
      self.close();
      break;
  }
});

function performHeavyCalculation(input: number): number {
  // Simulate heavy computation
  let result = 0;
  for (let i = 0; i < input * 1000000; i++) {
    result += Math.sqrt(i);
  }
  return result;
}
```

### Using a Worker in Your App

```typescript
import { signal, effect, onCleanup } from 'philjs-core';

function HeavyComputationDemo() {
  const result = signal<number | null>(null);
  const isCalculating = signal(false);
  const worker = signal<Worker | null>(null);

  effect(() => {
    // Initialize worker
    const w = new Worker('/workers/calculator.worker.js');
    worker.set(w);

    // Handle messages from worker
    w.addEventListener('message', (event) => {
      if (event.data.type === 'RESULT') {
        result.set(event.data.data);
        isCalculating.set(false);
      }
    });

    w.addEventListener('error', (error) => {
      console.error('Worker error:', error);
      isCalculating.set(false);
    });

    // Cleanup on unmount
    onCleanup(() => {
      w.terminate();
    });
  });

  const startCalculation = (input: number) => {
    isCalculating.set(true);
    worker()?.postMessage({ type: 'CALCULATE', data: input });
  };

  return (
    <div>
      <h2>Heavy Computation</h2>
      <button
        onClick={() => startCalculation(1000)}
        disabled={isCalculating()}
      >
        {isCalculating() ? 'Calculating...' : 'Start Calculation'}
      </button>

      {result() !== null && (
        <p>Result: {result()}</p>
      )}
    </div>
  );
}
```

## Worker Setup with Signals

### Creating a Worker Manager

Create a reusable worker manager that integrates seamlessly with PhilJS signals:

```typescript
// src/lib/worker-manager.ts
import { signal, batch, createRoot } from 'philjs-core';

export interface WorkerMessage<T = any> {
  id: string;
  type: string;
  data: T;
}

export interface WorkerResponse<T = any> {
  id: string;
  type: string;
  data: T;
  error?: string;
}

export function createWorkerManager<TRequest, TResponse>(
  workerUrl: string
) {
  const worker = new Worker(workerUrl);
  const pending = new Map<string, (response: TResponse) => void>();
  const status = signal<'idle' | 'busy' | 'error'>('idle');
  const activeJobs = signal(0);

  worker.addEventListener('message', (event: MessageEvent<WorkerResponse<TResponse>>) => {
    const { id, data, error } = event.data;

    if (error) {
      status.set('error');
      console.error('Worker error:', error);
    }

    const resolver = pending.get(id);
    if (resolver) {
      resolver(data);
      pending.delete(id);

      batch(() => {
        activeJobs.set(activeJobs() - 1);
        if (activeJobs() === 0) {
          status.set('idle');
        }
      });
    }
  });

  worker.addEventListener('error', (error) => {
    console.error('Worker error:', error);
    status.set('error');
  });

  return {
    status,
    activeJobs,

    execute: (type: string, data: TRequest): Promise<TResponse> => {
      return new Promise((resolve, reject) => {
        const id = `${Date.now()}-${Math.random()}`;
        pending.set(id, resolve);

        batch(() => {
          activeJobs.set(activeJobs() + 1);
          status.set('busy');
        });

        worker.postMessage({ id, type, data } as WorkerMessage<TRequest>);

        // Timeout after 30 seconds
        setTimeout(() => {
          if (pending.has(id)) {
            pending.delete(id);
            reject(new Error('Worker timeout'));
            status.set('error');
          }
        }, 30000);
      });
    },

    terminate: () => {
      worker.terminate();
      pending.clear();
      status.set('idle');
    }
  };
}

// Usage
function ImageProcessingApp() {
  const workerManager = createWorkerManager<
    { image: ImageData; filter: string },
    ImageData
  >('/workers/image-processor.worker.js');

  const processedImage = signal<ImageData | null>(null);

  const applyFilter = async (imageData: ImageData, filter: string) => {
    try {
      const result = await workerManager.execute('APPLY_FILTER', {
        image: imageData,
        filter
      });
      processedImage.set(result);
    } catch (error) {
      console.error('Failed to process image:', error);
    }
  };

  effect(() => {
    onCleanup(() => {
      workerManager.terminate();
    });
  });

  return (
    <div>
      <p>Status: {workerManager.status()}</p>
      <p>Active jobs: {workerManager.activeJobs()}</p>
      <button onClick={() => applyFilter(/* ... */, 'blur')}>
        Apply Blur
      </button>
    </div>
  );
}
```

## Data Transfer Patterns

### PostMessage (Structured Clone)

Basic data transfer using structured cloning:

```typescript
// Main thread
worker.postMessage({
  type: 'PROCESS',
  data: {
    numbers: [1, 2, 3, 4, 5],
    config: { threshold: 100 }
  }
});

// Worker
self.addEventListener('message', (event) => {
  const { numbers, config } = event.data.data;
  const result = numbers.filter(n => n > config.threshold);
  self.postMessage({ type: 'RESULT', data: result });
});
```

### Transferable Objects (Zero-Copy)

Transfer ownership of ArrayBuffers for better performance:

```typescript
// src/lib/transferable-worker.ts
export function processLargeDataset() {
  const data = signal<Float32Array | null>(null);
  const worker = new Worker('/workers/data-processor.worker.js');

  const processData = (input: Float32Array) => {
    // Transfer ownership to worker (zero-copy)
    worker.postMessage(
      { type: 'PROCESS', buffer: input.buffer },
      [input.buffer] // Transferable objects list
    );

    // input is now detached and unusable in main thread
  };

  worker.addEventListener('message', (event) => {
    if (event.data.type === 'RESULT') {
      // Receive ownership back
      const result = new Float32Array(event.data.buffer);
      data.set(result);
    }
  });

  return { data, processData };
}

// Worker implementation
// workers/data-processor.worker.ts
self.addEventListener('message', (event) => {
  if (event.data.type === 'PROCESS') {
    const input = new Float32Array(event.data.buffer);

    // Process data
    for (let i = 0; i < input.length; i++) {
      input[i] = input[i] * 2;
    }

    // Transfer ownership back
    self.postMessage(
      { type: 'RESULT', buffer: input.buffer },
      [input.buffer]
    );
  }
});
```

### SharedArrayBuffer (Shared Memory)

Share memory between main thread and workers for real-time communication:

```typescript
// src/lib/shared-memory-worker.ts
import { signal, effect } from 'philjs-core';

export function createSharedCounter() {
  // Create shared memory (4 bytes for one Int32)
  const sharedBuffer = new SharedArrayBuffer(4);
  const sharedArray = new Int32Array(sharedBuffer);

  const count = signal(0);
  const worker = new Worker('/workers/counter.worker.js');

  // Send shared buffer to worker
  worker.postMessage({ type: 'INIT', buffer: sharedBuffer });

  // Poll shared memory for updates
  effect(() => {
    const interval = setInterval(() => {
      const value = Atomics.load(sharedArray, 0);
      if (value !== count()) {
        count.set(value);
      }
    }, 100);

    onCleanup(() => {
      clearInterval(interval);
      worker.terminate();
    });
  });

  const increment = () => {
    Atomics.add(sharedArray, 0, 1);
  };

  const decrement = () => {
    Atomics.sub(sharedArray, 0, 1);
  };

  return { count, increment, decrement };
}

// Worker implementation
// workers/counter.worker.ts
let sharedArray: Int32Array | null = null;

self.addEventListener('message', (event) => {
  if (event.data.type === 'INIT') {
    sharedArray = new Int32Array(event.data.buffer);

    // Worker can also modify the shared memory
    setInterval(() => {
      if (sharedArray) {
        Atomics.add(sharedArray, 0, 1);
      }
    }, 1000);
  }
});

// Usage
function SharedCounterDemo() {
  const { count, increment, decrement } = createSharedCounter();

  return (
    <div>
      <h2>Shared Counter: {count()}</h2>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <p>Counter updates from both main thread and worker!</p>
    </div>
  );
}
```

## Offloading Heavy Computations

### Image Processing

```typescript
// workers/image-processor.worker.ts
interface FilterConfig {
  type: 'blur' | 'sharpen' | 'grayscale' | 'sepia';
  strength?: number;
}

self.addEventListener('message', (event) => {
  const { id, type, data } = event.data;

  if (type === 'APPLY_FILTER') {
    const { imageData, filter } = data;
    const result = applyFilter(imageData, filter);

    self.postMessage(
      { id, type: 'RESULT', data: result },
      [result.data.buffer]
    );
  }
});

function applyFilter(imageData: ImageData, config: FilterConfig): ImageData {
  const { data, width, height } = imageData;
  const output = new ImageData(width, height);

  switch (config.type) {
    case 'grayscale':
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        output.data[i] = avg;
        output.data[i + 1] = avg;
        output.data[i + 2] = avg;
        output.data[i + 3] = data[i + 3];
      }
      break;

    case 'blur':
      // Implement blur algorithm
      const kernel = createBlurKernel(config.strength || 3);
      applyConvolution(data, output.data, width, height, kernel);
      break;

    // ... other filters
  }

  return output;
}

function createBlurKernel(size: number): number[][] {
  const kernel: number[][] = [];
  const sigma = size / 3;
  let sum = 0;

  for (let y = -size; y <= size; y++) {
    const row: number[] = [];
    for (let x = -size; x <= size; x++) {
      const value = Math.exp(-(x * x + y * y) / (2 * sigma * sigma));
      row.push(value);
      sum += value;
    }
    kernel.push(row);
  }

  // Normalize
  return kernel.map(row => row.map(v => v / sum));
}

function applyConvolution(
  input: Uint8ClampedArray,
  output: Uint8ClampedArray,
  width: number,
  height: number,
  kernel: number[][]
): void {
  const kSize = Math.floor(kernel.length / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0, g = 0, b = 0;

      for (let ky = -kSize; ky <= kSize; ky++) {
        for (let kx = -kSize; kx <= kSize; kx++) {
          const px = Math.min(width - 1, Math.max(0, x + kx));
          const py = Math.min(height - 1, Math.max(0, y + ky));
          const i = (py * width + px) * 4;
          const weight = kernel[ky + kSize][kx + kSize];

          r += input[i] * weight;
          g += input[i + 1] * weight;
          b += input[i + 2] * weight;
        }
      }

      const i = (y * width + x) * 4;
      output[i] = r;
      output[i + 1] = g;
      output[i + 2] = b;
      output[i + 3] = input[i + 3];
    }
  }
}
```

### Complex Calculations

```typescript
// workers/math-processor.worker.ts
self.addEventListener('message', (event) => {
  const { id, type, data } = event.data;

  switch (type) {
    case 'FIBONACCI':
      const result = fibonacci(data.n);
      self.postMessage({ id, type: 'RESULT', data: result });
      break;

    case 'PRIME_FACTORS':
      const factors = primeFactors(data.number);
      self.postMessage({ id, type: 'RESULT', data: factors });
      break;

    case 'MONTE_CARLO_PI':
      const pi = estimatePi(data.iterations);
      self.postMessage({ id, type: 'RESULT', data: pi });
      break;
  }
});

function fibonacci(n: number): number {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

function primeFactors(n: number): number[] {
  const factors: number[] = [];
  let divisor = 2;

  while (n >= 2) {
    if (n % divisor === 0) {
      factors.push(divisor);
      n = n / divisor;
    } else {
      divisor++;
    }
  }

  return factors;
}

function estimatePi(iterations: number): number {
  let inside = 0;

  for (let i = 0; i < iterations; i++) {
    const x = Math.random();
    const y = Math.random();

    if (x * x + y * y <= 1) {
      inside++;
    }
  }

  return (inside / iterations) * 4;
}

// Usage in app
function MathCalculator() {
  const worker = createWorkerManager<any, any>('/workers/math-processor.worker.js');
  const result = signal<number | null>(null);
  const calculating = signal(false);

  const calculate = async (type: string, data: any) => {
    calculating.set(true);
    try {
      const res = await worker.execute(type, data);
      result.set(res);
    } finally {
      calculating.set(false);
    }
  };

  return (
    <div>
      <button onClick={() => calculate('FIBONACCI', { n: 1000 })}>
        Calculate Fibonacci(1000)
      </button>
      <button onClick={() => calculate('MONTE_CARLO_PI', { iterations: 10000000 })}>
        Estimate Pi (10M iterations)
      </button>

      {calculating() && <p>Calculating...</p>}
      {result() !== null && <p>Result: {result()}</p>}
    </div>
  );
}
```

### Data Parsing and Transformation

```typescript
// workers/data-transformer.worker.ts
interface CSVParseOptions {
  delimiter?: string;
  headers?: boolean;
  skipEmpty?: boolean;
}

self.addEventListener('message', (event) => {
  const { id, type, data } = event.data;

  switch (type) {
    case 'PARSE_CSV':
      const parsed = parseCSV(data.text, data.options);
      self.postMessage({ id, type: 'RESULT', data: parsed });
      break;

    case 'PARSE_JSON':
      const json = parseJSON(data.text);
      self.postMessage({ id, type: 'RESULT', data: json });
      break;

    case 'TRANSFORM_DATA':
      const transformed = transformData(data.input, data.schema);
      self.postMessage({ id, type: 'RESULT', data: transformed });
      break;
  }
});

function parseCSV(text: string, options: CSVParseOptions = {}): any[] {
  const { delimiter = ',', headers = true, skipEmpty = true } = options;
  const lines = text.split('\n').filter(line => !skipEmpty || line.trim());

  if (lines.length === 0) return [];

  const headerRow = headers ? lines[0].split(delimiter) : null;
  const dataRows = headers ? lines.slice(1) : lines;

  return dataRows.map(line => {
    const values = line.split(delimiter);

    if (headerRow) {
      return headerRow.reduce((obj, header, i) => {
        obj[header.trim()] = values[i]?.trim() || '';
        return obj;
      }, {} as any);
    }

    return values.map(v => v.trim());
  });
}

function parseJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
}

function transformData(input: any[], schema: any): any[] {
  return input.map(item => {
    const transformed: any = {};

    for (const [key, config] of Object.entries(schema)) {
      const { source, transform } = config as any;
      const value = item[source];

      transformed[key] = transform ? transform(value) : value;
    }

    return transformed;
  });
}
```

## Worker Pools

Manage multiple workers for parallel processing:

```typescript
// src/lib/worker-pool.ts
import { signal, batch } from 'philjs-core';

export class WorkerPool<TRequest, TResponse> {
  private workers: Worker[] = [];
  private queue: Array<{
    id: string;
    type: string;
    data: TRequest;
    resolve: (value: TResponse) => void;
    reject: (error: Error) => void;
  }> = [];
  private activeJobs = signal(0);
  private queueSize = signal(0);

  constructor(
    private workerUrl: string,
    private poolSize: number = navigator.hardwareConcurrency || 4
  ) {
    this.initializeWorkers();
  }

  private initializeWorkers() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerUrl);

      worker.addEventListener('message', (event) => {
        this.handleWorkerMessage(worker, event.data);
      });

      worker.addEventListener('error', (error) => {
        console.error('Worker error:', error);
      });

      this.workers.push(worker);
    }
  }

  private handleWorkerMessage(worker: Worker, data: WorkerResponse<TResponse>) {
    const { id, data: result, error } = data;

    // Find and resolve pending job
    const jobIndex = this.queue.findIndex(job => job.id === id);
    if (jobIndex >= 0) {
      const job = this.queue.splice(jobIndex, 1)[0];

      if (error) {
        job.reject(new Error(error));
      } else {
        job.resolve(result);
      }

      batch(() => {
        this.activeJobs.set(this.activeJobs() - 1);
        this.queueSize.set(this.queue.length);
      });
    }

    // Process next job in queue
    this.processQueue();
  }

  private processQueue() {
    if (this.queue.length === 0) return;

    const availableWorker = this.workers.find(w => {
      // Simple availability check - in production, track worker states
      return true;
    });

    if (availableWorker && this.queue.length > 0) {
      const job = this.queue[0];

      availableWorker.postMessage({
        id: job.id,
        type: job.type,
        data: job.data
      });

      this.activeJobs.set(this.activeJobs() + 1);
    }
  }

  execute(type: string, data: TRequest): Promise<TResponse> {
    return new Promise((resolve, reject) => {
      const id = `${Date.now()}-${Math.random()}`;

      this.queue.push({ id, type, data, resolve, reject });
      this.queueSize.set(this.queue.length);

      this.processQueue();
    });
  }

  getStats() {
    return {
      activeJobs: this.activeJobs,
      queueSize: this.queueSize,
      poolSize: this.poolSize
    };
  }

  terminate() {
    this.workers.forEach(w => w.terminate());
    this.workers = [];
    this.queue = [];
    batch(() => {
      this.activeJobs.set(0);
      this.queueSize.set(0);
    });
  }
}

// Usage
function BatchImageProcessor() {
  const pool = new WorkerPool('/workers/image-processor.worker.js', 4);
  const processed = signal(0);
  const total = signal(0);

  const processImages = async (images: ImageData[]) => {
    total.set(images.length);
    processed.set(0);

    const promises = images.map(async (img) => {
      const result = await pool.execute('APPLY_FILTER', {
        image: img,
        filter: 'grayscale'
      });
      processed.set(processed() + 1);
      return result;
    });

    return Promise.all(promises);
  };

  const stats = pool.getStats();

  return (
    <div>
      <h2>Batch Image Processor</h2>
      <p>Active jobs: {stats.activeJobs()}</p>
      <p>Queue size: {stats.queueSize()}</p>
      <p>Progress: {processed()} / {total()}</p>
      <button onClick={() => processImages(/* ... */)}>
        Process 100 Images
      </button>
    </div>
  );
}
```

## Best Practices

### Do: Use Workers for Heavy Computation

```typescript
// ✅ Good: Offload expensive operations
function DataAnalyzer() {
  const worker = createWorkerManager('/workers/analyzer.worker.js');
  const results = signal(null);

  const analyzeData = async (data: number[]) => {
    // Heavy analysis runs in worker, UI stays responsive
    const analysis = await worker.execute('ANALYZE', data);
    results.set(analysis);
  };

  return <div>{/* UI remains smooth */}</div>;
}
```

### Don't: Use Workers for Trivial Operations

```typescript
// ❌ Bad: Worker overhead exceeds benefit
function SimpleCalculator() {
  const worker = new Worker('/workers/add.worker.js');

  const add = (a: number, b: number) => {
    // Communication overhead > computation time
    worker.postMessage({ a, b });
  };
}

// ✅ Good: Simple operations stay in main thread
function SimpleCalculator() {
  const add = (a: number, b: number) => a + b;
}
```

### Do: Transfer Large Buffers

```typescript
// ✅ Good: Transfer ownership for large data
const largeArray = new Float32Array(1000000);
worker.postMessage(
  { buffer: largeArray.buffer },
  [largeArray.buffer] // Zero-copy transfer
);
```

### Don't: Clone Large Objects

```typescript
// ❌ Bad: Cloning large objects is slow
const largeObject = { data: new Array(1000000).fill(0) };
worker.postMessage(largeObject); // Slow structured clone

// ✅ Good: Use ArrayBuffer when possible
const buffer = new Float32Array(largeObject.data).buffer;
worker.postMessage({ buffer }, [buffer]);
```

### Do: Clean Up Workers

```typescript
// ✅ Good: Terminate workers when done
function WorkerComponent() {
  const worker = new Worker('/workers/processor.worker.js');

  effect(() => {
    onCleanup(() => {
      worker.terminate();
    });
  });

  return <div>{/* ... */}</div>;
}
```

### Do: Handle Errors Gracefully

```typescript
// ✅ Good: Error handling
const worker = new Worker('/workers/processor.worker.js');

worker.addEventListener('error', (error) => {
  console.error('Worker error:', error);
  // Show user-friendly error message
  showErrorNotification('Processing failed');
});

worker.addEventListener('messageerror', (error) => {
  console.error('Message error:', error);
});
```

### Do: Use TypeScript for Type Safety

```typescript
// ✅ Good: Strongly typed worker messages
interface WorkerRequest {
  type: 'PROCESS' | 'CANCEL' | 'STATUS';
  data: any;
}

interface WorkerResponse {
  type: 'RESULT' | 'ERROR' | 'PROGRESS';
  data: any;
  error?: string;
}

const worker = new Worker('/workers/typed.worker.js') as Worker;

worker.postMessage({
  type: 'PROCESS',
  data: { input: [1, 2, 3] }
} as WorkerRequest);
```

## Performance Tips

### Monitor Worker Performance

```typescript
// Track worker execution time
function createTimedWorker(url: string) {
  const worker = new Worker(url);
  const metrics = signal<{ avgTime: number; count: number }>({
    avgTime: 0,
    count: 0
  });

  const execute = async (type: string, data: any) => {
    const start = performance.now();

    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        const duration = performance.now() - start;

        // Update metrics
        const m = metrics();
        metrics.set({
          avgTime: (m.avgTime * m.count + duration) / (m.count + 1),
          count: m.count + 1
        });

        worker.removeEventListener('message', handler);
        resolve(event.data);
      };

      worker.addEventListener('message', handler);
      worker.postMessage({ type, data });
    });
  };

  return { worker, execute, metrics };
}
```

### Optimize Data Transfer

```typescript
// Use compression for text data
async function sendCompressedData(worker: Worker, text: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  // Use CompressionStream API (when available)
  if ('CompressionStream' in window) {
    const stream = new Blob([data])
      .stream()
      .pipeThrough(new CompressionStream('gzip'));

    const compressed = await new Response(stream).arrayBuffer();
    worker.postMessage({ compressed }, [compressed]);
  } else {
    worker.postMessage({ data: data.buffer }, [data.buffer]);
  }
}
```

## Summary

You've learned:

✅ Web Worker fundamentals and lifecycle
✅ Worker setup with PhilJS signals for reactive state
✅ Data transfer patterns (postMessage, Transferables, SharedArrayBuffer)
✅ Offloading heavy computations (image processing, math, parsing)
✅ Worker pools for parallel processing
✅ Best practices for performance and reliability
✅ Error handling and cleanup
✅ Performance monitoring and optimization

Web Workers enable you to build highly performant applications that remain responsive even during intensive computations!

---

**Next:** [WebSockets →](./websockets.md) Real-time communication patterns
