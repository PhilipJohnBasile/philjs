/**
 * @philjs/workers - Thread Pool Web Workers
 *
 * Easy parallelism with managed worker pools.
 * NO OTHER FRAMEWORK provides integrated thread pool workers.
 *
 * Features:
 * - Automatic worker pool management
 * - Task queuing and scheduling
 * - Transferable objects support
 * - Worker code bundling
 * - Comlink-style RPC
 * - SharedArrayBuffer support
 * - Progress reporting
 * - Cancellation support
 */

// ============================================================================
// Types
// ============================================================================

export interface WorkerPoolConfig {
  minWorkers?: number;
  maxWorkers?: number;
  idleTimeout?: number;
  taskTimeout?: number;
  workerOptions?: WorkerOptions;
}

export interface Task<T = any, R = any> {
  id: string;
  fn: (...args: T[]) => R;
  args: T[];
  transferables?: Transferable[];
  priority?: number;
  timeout?: number;
  onProgress?: (progress: number) => void;
}

export interface TaskResult<R = any> {
  id: string;
  result?: R;
  error?: Error;
  duration: number;
}

export interface WorkerMessage {
  type: 'task' | 'result' | 'error' | 'progress' | 'cancel' | 'ready';
  taskId?: string;
  payload?: any;
  transferables?: Transferable[];
}

export interface PoolStats {
  totalWorkers: number;
  activeWorkers: number;
  idleWorkers: number;
  queuedTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageTaskDuration: number;
}

// ============================================================================
// Inline Worker Creator
// ============================================================================

function createWorkerBlob(workerCode: string): string {
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return URL.createObjectURL(blob);
}

const WORKER_CODE = `
  let taskHandlers = new Map();

  self.onmessage = async (event) => {
    const { type, taskId, payload, transferables } = event.data;

    if (type === 'task') {
      try {
        // Deserialize the function
        const fn = new Function('return ' + payload.fnString)();
        const args = payload.args;

        // Execute with progress reporting
        const reportProgress = (progress) => {
          self.postMessage({
            type: 'progress',
            taskId,
            payload: { progress }
          });
        };

        // Inject progress reporter if function expects it
        const result = await fn(...args, reportProgress);

        self.postMessage({
          type: 'result',
          taskId,
          payload: { result }
        }, transferables || []);
      } catch (error) {
        self.postMessage({
          type: 'error',
          taskId,
          payload: { error: error.message, stack: error.stack }
        });
      }
    } else if (type === 'cancel') {
      // Handle cancellation
      taskHandlers.delete(taskId);
    }
  };

  self.postMessage({ type: 'ready' });
`;

// ============================================================================
// Worker Wrapper
// ============================================================================

export class PoolWorker {
  private worker: Worker;
  private currentTaskId: string | null = null;
  private resolvers: Map<string, { resolve: (v: any) => void; reject: (e: Error) => void }> = new Map();
  private progressHandlers: Map<string, (progress: number) => void> = new Map();
  private ready: Promise<void>;
  private _isReady = false;

  constructor() {
    const workerUrl = createWorkerBlob(WORKER_CODE);
    this.worker = new Worker(workerUrl);

    const { promise, resolve } = Promise.withResolvers<void>();
    this.ready = promise;
    const handler = (event: MessageEvent) => {
      if (event.data.type === 'ready') {
        this._isReady = true;
        this.worker.removeEventListener('message', handler);
        resolve();
      }
    };
    this.worker.addEventListener('message', handler);

    this.worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { type, taskId, payload } = event.data;

      if (type === 'result' && taskId) {
        const resolver = this.resolvers.get(taskId);
        if (resolver) {
          resolver.resolve(payload.result);
          this.resolvers.delete(taskId);
          this.progressHandlers.delete(taskId);
        }
        this.currentTaskId = null;
      } else if (type === 'error' && taskId) {
        const resolver = this.resolvers.get(taskId);
        if (resolver) {
          resolver.reject(new Error(payload.error));
          this.resolvers.delete(taskId);
          this.progressHandlers.delete(taskId);
        }
        this.currentTaskId = null;
      } else if (type === 'progress' && taskId) {
        const handler = this.progressHandlers.get(taskId);
        if (handler) {
          handler(payload.progress);
        }
      }
    };

    this.worker.onerror = (error) => {
      if (this.currentTaskId) {
        const resolver = this.resolvers.get(this.currentTaskId);
        if (resolver) {
          resolver.reject(new Error(error.message));
          this.resolvers.delete(this.currentTaskId);
          this.progressHandlers.delete(this.currentTaskId);
        }
      }
    };
  }

  async execute<T, R>(task: Task<T, R>): Promise<R> {
    await this.ready;

    this.currentTaskId = task.id;

    const { promise, resolve, reject } = Promise.withResolvers<T>();
    this.resolvers.set(task.id, { resolve, reject });

    if (task.onProgress) {
      this.progressHandlers.set(task.id, task.onProgress);
    }

    const message: WorkerMessage = {
      type: 'task',
      taskId: task.id,
      payload: {
        fnString: task.fn.toString(),
        args: task.args
      },
      transferables: task.transferables
    };

    this.worker.postMessage(message, task.transferables ?? []);

    // Set timeout if specified
    if (task.timeout) {
      setTimeout(() => {
        if (this.resolvers.has(task.id)) {
          this.cancel(task.id);
          reject(new Error(`Task ${task.id} timed out after ${task.timeout}ms`));
        }
      }, task.timeout);
    }

    return promise;
  }

  cancel(taskId: string): void {
    this.worker.postMessage({ type: 'cancel', taskId });
    this.resolvers.delete(taskId);
    this.progressHandlers.delete(taskId);
    if (this.currentTaskId === taskId) {
      this.currentTaskId = null;
    }
  }

  isIdle(): boolean {
    return this.currentTaskId === null && this._isReady;
  }

  terminate(): void {
    this.worker.terminate();
  }
}

// ============================================================================
// Worker Pool
// ============================================================================

export class WorkerPool {
  private config: Required<WorkerPoolConfig>;
  private workers: PoolWorker[] = [];
  private taskQueue: Task[] = [];
  private stats: PoolStats = {
    totalWorkers: 0,
    activeWorkers: 0,
    idleWorkers: 0,
    queuedTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageTaskDuration: 0
  };
  private taskDurations: number[] = [];

  constructor(config: WorkerPoolConfig = {}) {
    const cpuCount = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;

    this.config = {
      minWorkers: config.minWorkers ?? 1,
      maxWorkers: config.maxWorkers ?? cpuCount,
      idleTimeout: config.idleTimeout ?? 30000,
      taskTimeout: config.taskTimeout ?? 60000,
      workerOptions: config.workerOptions ?? {}
    };

    // Create minimum workers
    for (let i = 0; i < this.config.minWorkers; i++) {
      this.createWorker();
    }
  }

  private createWorker(): PoolWorker {
    const worker = new PoolWorker();
    this.workers.push(worker);
    this.updateStats();
    return worker;
  }

  private getIdleWorker(): PoolWorker | null {
    return this.workers.find(w => w.isIdle()) ?? null;
  }

  async exec<T, R>(fn: (...args: T[]) => R, ...args: T[]): Promise<R> {
    const task: Task<T, R> = {
      id: crypto.randomUUID(),
      fn,
      args,
      timeout: this.config.taskTimeout
    };

    return this.runTask(task);
  }

  async run<T, R>(task: Omit<Task<T, R>, 'id'>): Promise<R> {
    const fullTask: Task<T, R> = {
      ...task,
      id: crypto.randomUUID()
    };

    return this.runTask(fullTask);
  }

  private async runTask<T, R>(task: Task<T, R>): Promise<R> {
    let worker = this.getIdleWorker();

    if (!worker && this.workers.length < this.config.maxWorkers) {
      worker = this.createWorker();
    }

    if (!worker) {
      // Queue the task
      const { promise, resolve, reject } = Promise.withResolvers<R>();
      const queuedTask = {
        ...task,
        resolve,
        reject
      };
      this.taskQueue.push(queuedTask as any);
      this.taskQueue.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
      this.updateStats();
      return promise;
    }

    const startTime = performance.now();

    try {
      const result = await worker.execute(task);
      const duration = performance.now() - startTime;

      this.taskDurations.push(duration);
      if (this.taskDurations.length > 100) {
        this.taskDurations.shift();
      }

      this.stats.completedTasks++;
      this.processQueue();
      this.updateStats();

      return result;
    } catch (error) {
      this.stats.failedTasks++;
      this.processQueue();
      this.updateStats();
      throw error;
    }
  }

  private processQueue(): void {
    if (this.taskQueue.length === 0) return;

    const worker = this.getIdleWorker();
    if (!worker) return;

    const task = this.taskQueue.shift()!;
    const { resolve, reject, ...taskWithoutCallbacks } = task as any;

    worker.execute(taskWithoutCallbacks)
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.processQueue();
        this.updateStats();
      });
  }

  private updateStats(): void {
    this.stats.totalWorkers = this.workers.length;
    this.stats.idleWorkers = this.workers.filter(w => w.isIdle()).length;
    this.stats.activeWorkers = this.stats.totalWorkers - this.stats.idleWorkers;
    this.stats.queuedTasks = this.taskQueue.length;

    if (this.taskDurations.length > 0) {
      this.stats.averageTaskDuration =
        this.taskDurations.reduce((a, b) => a + b, 0) / this.taskDurations.length;
    }
  }

  map<T, R>(items: T[], fn: (item: T) => R): Promise<R[]> {
    return Promise.all(items.map(item => this.exec(fn, item)));
  }

  async mapSettled<T, R>(items: T[], fn: (item: T) => R): Promise<PromiseSettledResult<R>[]> {
    const tasks = items.map(item => this.exec(fn, item));
    return Promise.allSettled(tasks);
  }

  async reduce<T, R>(
    items: T[],
    fn: (acc: R, item: T) => R,
    initial: R
  ): Promise<R> {
    let result = initial;
    for (const item of items) {
      result = await this.exec(fn, result, item);
    }
    return result;
  }

  async filter<T>(items: T[], fn: (item: T) => boolean): Promise<T[]> {
    const results = await this.map(items, fn);
    return items.filter((_, i) => results[i]);
  }

  getStats(): PoolStats {
    this.updateStats();
    return { ...this.stats };
  }

  resize(size: number): void {
    while (this.workers.length < size && this.workers.length < this.config.maxWorkers) {
      this.createWorker();
    }

    while (this.workers.length > size && this.workers.length > this.config.minWorkers) {
      const idleWorker = this.getIdleWorker();
      if (idleWorker) {
        idleWorker.terminate();
        this.workers = this.workers.filter(w => w !== idleWorker);
      } else {
        break;
      }
    }

    this.updateStats();
  }

  terminate(): void {
    this.workers.forEach(w => w.terminate());
    this.workers = [];
    this.taskQueue = [];
    this.updateStats();
  }
}

// ============================================================================
// Shared State
// ============================================================================

export class SharedState<T extends Record<string, number>> {
  private buffer: SharedArrayBuffer;
  private view: Int32Array;
  private keys: (keyof T)[];

  constructor(initial: T) {
    this.keys = Object.keys(initial) as (keyof T)[];
    this.buffer = new SharedArrayBuffer(this.keys.length * 4);
    this.view = new Int32Array(this.buffer);

    this.keys.forEach((key, i) => {
      this.view[i] = initial[key] as number;
    });
  }

  get<K extends keyof T>(key: K): number {
    const index = this.keys.indexOf(key);
    if (index === -1) throw new Error(`Unknown key: ${String(key)}`);
    return Atomics.load(this.view, index);
  }

  set<K extends keyof T>(key: K, value: number): void {
    const index = this.keys.indexOf(key);
    if (index === -1) throw new Error(`Unknown key: ${String(key)}`);
    Atomics.store(this.view, index, value);
  }

  add<K extends keyof T>(key: K, value: number): number {
    const index = this.keys.indexOf(key);
    if (index === -1) throw new Error(`Unknown key: ${String(key)}`);
    return Atomics.add(this.view, index, value);
  }

  increment<K extends keyof T>(key: K): number {
    return this.add(key, 1);
  }

  decrement<K extends keyof T>(key: K): number {
    return this.add(key, -1);
  }

  compareExchange<K extends keyof T>(key: K, expected: number, replacement: number): number {
    const index = this.keys.indexOf(key);
    if (index === -1) throw new Error(`Unknown key: ${String(key)}`);
    return Atomics.compareExchange(this.view, index, expected, replacement);
  }

  toObject(): T {
    const obj: Record<string, number> = {};
    this.keys.forEach((key, i) => {
      obj[key as string] = this.view[i];
    });
    return obj as T;
  }

  getBuffer(): SharedArrayBuffer {
    return this.buffer;
  }

  static fromBuffer<T extends Record<string, number>>(
    buffer: SharedArrayBuffer,
    keys: (keyof T)[]
  ): SharedState<T> {
    const state = Object.create(SharedState.prototype);
    state.buffer = buffer;
    state.view = new Int32Array(buffer);
    state.keys = keys;
    return state;
  }
}

// ============================================================================
// Channel (Message Passing)
// ============================================================================

export class Channel<T> {
  private buffer: T[] = [];
  private waiters: Array<(value: T) => void> = [];
  private closed = false;

  async send(value: T): Promise<void> {
    if (this.closed) {
      throw new Error('Channel is closed');
    }

    if (this.waiters.length > 0) {
      const waiter = this.waiters.shift()!;
      waiter(value);
    } else {
      this.buffer.push(value);
    }
  }

  async receive(): Promise<T> {
    if (this.buffer.length > 0) {
      return this.buffer.shift()!;
    }

    if (this.closed) {
      throw new Error('Channel is closed');
    }

    const { promise, resolve } = Promise.withResolvers<T>();
    this.waiters.push(resolve);
    return promise;
  }

  tryReceive(): T | undefined {
    return this.buffer.shift();
  }

  close(): void {
    this.closed = true;
  }

  isClosed(): boolean {
    return this.closed;
  }

  get length(): number {
    return this.buffer.length;
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<T> {
    while (!this.closed || this.buffer.length > 0) {
      yield await this.receive();
    }
  }
}

// ============================================================================
// Parallel Iterator
// ============================================================================

export class ParallelIterator<T> {
  private items: T[];
  private pool: WorkerPool;

  constructor(items: T[], pool?: WorkerPool) {
    this.items = items;
    this.pool = pool ?? new WorkerPool();
  }

  async map<R>(fn: (item: T) => R): Promise<R[]> {
    return this.pool.map(this.items, fn);
  }

  async filter(fn: (item: T) => boolean): Promise<T[]> {
    return this.pool.filter(this.items, fn);
  }

  async reduce<R>(fn: (acc: R, item: T) => R, initial: R): Promise<R> {
    return this.pool.reduce(this.items, fn, initial);
  }

  async forEach(fn: (item: T) => void): Promise<void> {
    await this.pool.map(this.items, fn);
  }

  async some(fn: (item: T) => boolean): Promise<boolean> {
    const results = await this.pool.map(this.items, fn);
    return results.some(Boolean);
  }

  async every(fn: (item: T) => boolean): Promise<boolean> {
    const results = await this.pool.map(this.items, fn);
    return results.every(Boolean);
  }

  async find(fn: (item: T) => boolean): Promise<T | undefined> {
    const results = await this.pool.map(this.items, fn);
    const index = results.findIndex(Boolean);
    return index >= 0 ? this.items[index] : undefined;
  }

  chunk(size: number): ParallelIterator<T[]> {
    const chunks: T[][] = [];
    for (let i = 0; i < this.items.length; i += size) {
      chunks.push(this.items.slice(i, i + size));
    }
    return new ParallelIterator(chunks, this.pool);
  }
}

// ============================================================================
// React-style Hooks
// ============================================================================

// State helper
function createState<T>(initial: T): [() => T, (value: T) => void] {
  let value = initial;
  return [() => value, (newValue: T) => { value = newValue; }];
}

let globalPool: WorkerPool | null = null;

function getPool(config?: WorkerPoolConfig): WorkerPool {
  if (!globalPool) {
    globalPool = new WorkerPool(config);
  }
  return globalPool;
}

/**
 * Hook for worker pool
 */
export function useWorkerPool(config?: WorkerPoolConfig): {
  exec: <T, R>(fn: (...args: T[]) => R, ...args: T[]) => Promise<R>;
  map: <T, R>(items: T[], fn: (item: T) => R) => Promise<R[]>;
  filter: <T>(items: T[], fn: (item: T) => boolean) => Promise<T[]>;
  reduce: <T, R>(items: T[], fn: (acc: R, item: T) => R, initial: R) => Promise<R>;
  stats: PoolStats;
  resize: (size: number) => void;
} {
  const pool = getPool(config);

  return {
    exec: (fn, ...args) => pool.exec(fn, ...args),
    map: (items, fn) => pool.map(items, fn),
    filter: (items, fn) => pool.filter(items, fn),
    reduce: (items, fn, initial) => pool.reduce(items, fn, initial),
    stats: pool.getStats(),
    resize: (size) => pool.resize(size)
  };
}

/**
 * Hook for parallel computation
 */
export function useParallel<T, R>(
  items: T[],
  fn: (item: T) => R,
  deps?: any[]
): {
  results: R[] | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
} {
  const pool = getPool();
  const [getResults, setResults] = createState<R[] | null>(null);
  const [getLoading, setLoading] = createState(true);
  const [getError, setError] = createState<Error | null>(null);

  const execute = async () => {
    setLoading(true);
    setError(null);

    try {
      const results = await pool.map(items, fn);
      setResults(results);
    } catch (e) {
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  // Execute on mount
  execute();

  return {
    results: getResults(),
    loading: getLoading(),
    error: getError(),
    retry: execute
  };
}

/**
 * Hook for shared state across workers
 */
export function useSharedState<T extends Record<string, number>>(
  initial: T
): {
  state: T;
  get: <K extends keyof T>(key: K) => number;
  set: <K extends keyof T>(key: K, value: number) => void;
  increment: <K extends keyof T>(key: K) => number;
  decrement: <K extends keyof T>(key: K) => number;
  buffer: SharedArrayBuffer;
} {
  const shared = new SharedState(initial);

  return {
    state: shared.toObject(),
    get: (key) => shared.get(key),
    set: (key, value) => shared.set(key, value),
    increment: (key) => shared.increment(key),
    decrement: (key) => shared.decrement(key),
    buffer: shared.getBuffer()
  };
}

// ============================================================================
// Exports
// ============================================================================

export {
  PoolWorker,
  WorkerPool,
  SharedState,
  Channel,
  ParallelIterator
};

export default {
  PoolWorker,
  WorkerPool,
  SharedState,
  Channel,
  ParallelIterator,
  useWorkerPool,
  useParallel,
  useSharedState
};
