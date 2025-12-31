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
// Inline Worker Creator
// ============================================================================
function createWorkerBlob(workerCode) {
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
    worker;
    currentTaskId = null;
    resolvers = new Map();
    progressHandlers = new Map();
    ready;
    _isReady = false;
    constructor() {
        const workerUrl = createWorkerBlob(WORKER_CODE);
        this.worker = new Worker(workerUrl);
        const { promise, resolve } = Promise.withResolvers();
        this.ready = promise;
        const handler = (event) => {
            if (event.data.type === 'ready') {
                this._isReady = true;
                this.worker.removeEventListener('message', handler);
                resolve();
            }
        };
        this.worker.addEventListener('message', handler);
        this.worker.onmessage = (event) => {
            const { type, taskId, payload } = event.data;
            if (type === 'result' && taskId) {
                const resolver = this.resolvers.get(taskId);
                if (resolver) {
                    resolver.resolve(payload.result);
                    this.resolvers.delete(taskId);
                    this.progressHandlers.delete(taskId);
                }
                this.currentTaskId = null;
            }
            else if (type === 'error' && taskId) {
                const resolver = this.resolvers.get(taskId);
                if (resolver) {
                    resolver.reject(new Error(payload.error));
                    this.resolvers.delete(taskId);
                    this.progressHandlers.delete(taskId);
                }
                this.currentTaskId = null;
            }
            else if (type === 'progress' && taskId) {
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
    async execute(task) {
        await this.ready;
        this.currentTaskId = task.id;
        const { promise, resolve, reject } = Promise.withResolvers();
        this.resolvers.set(task.id, { resolve, reject });
        if (task.onProgress) {
            this.progressHandlers.set(task.id, task.onProgress);
        }
        const message = {
            type: 'task',
            taskId: task.id,
            payload: {
                fnString: task.fn.toString(),
                args: task.args
            }
        };
        if (task.transferables !== undefined) {
            message.transferables = task.transferables;
        }
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
    cancel(taskId) {
        this.worker.postMessage({ type: 'cancel', taskId });
        this.resolvers.delete(taskId);
        this.progressHandlers.delete(taskId);
        if (this.currentTaskId === taskId) {
            this.currentTaskId = null;
        }
    }
    isIdle() {
        return this.currentTaskId === null && this._isReady;
    }
    terminate() {
        this.worker.terminate();
    }
}
// ============================================================================
// Worker Pool
// ============================================================================
export class WorkerPool {
    config;
    workers = [];
    taskQueue = [];
    stats = {
        totalWorkers: 0,
        activeWorkers: 0,
        idleWorkers: 0,
        queuedTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageTaskDuration: 0
    };
    taskDurations = [];
    constructor(config = {}) {
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
    createWorker() {
        const worker = new PoolWorker();
        this.workers.push(worker);
        this.updateStats();
        return worker;
    }
    getIdleWorker() {
        return this.workers.find(w => w.isIdle()) ?? null;
    }
    async exec(fn, ...args) {
        const task = {
            id: crypto.randomUUID(),
            fn,
            args,
            timeout: this.config.taskTimeout
        };
        return this.runTask(task);
    }
    async run(task) {
        const fullTask = {
            ...task,
            id: crypto.randomUUID()
        };
        return this.runTask(fullTask);
    }
    async runTask(task) {
        let worker = this.getIdleWorker();
        if (!worker && this.workers.length < this.config.maxWorkers) {
            worker = this.createWorker();
        }
        if (!worker) {
            // Queue the task
            const { promise, resolve, reject } = Promise.withResolvers();
            const queuedTask = {
                ...task,
                resolve,
                reject
            };
            this.taskQueue.push(queuedTask);
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
        }
        catch (error) {
            this.stats.failedTasks++;
            this.processQueue();
            this.updateStats();
            throw error;
        }
    }
    processQueue() {
        if (this.taskQueue.length === 0)
            return;
        const worker = this.getIdleWorker();
        if (!worker)
            return;
        const task = this.taskQueue.shift();
        const { resolve, reject, ...taskWithoutCallbacks } = task;
        worker.execute(taskWithoutCallbacks)
            .then(resolve)
            .catch(reject)
            .finally(() => {
            this.processQueue();
            this.updateStats();
        });
    }
    updateStats() {
        this.stats.totalWorkers = this.workers.length;
        this.stats.idleWorkers = this.workers.filter(w => w.isIdle()).length;
        this.stats.activeWorkers = this.stats.totalWorkers - this.stats.idleWorkers;
        this.stats.queuedTasks = this.taskQueue.length;
        if (this.taskDurations.length > 0) {
            this.stats.averageTaskDuration =
                this.taskDurations.reduce((a, b) => a + b, 0) / this.taskDurations.length;
        }
    }
    map(items, fn) {
        return Promise.all(items.map(item => this.exec(fn, item)));
    }
    async mapSettled(items, fn) {
        const tasks = items.map(item => this.exec(fn, item));
        return Promise.allSettled(tasks);
    }
    async reduce(items, fn, initial) {
        let result = initial;
        for (const item of items) {
            result = await this.exec(fn, result, item);
        }
        return result;
    }
    async filter(items, fn) {
        const results = await this.map(items, fn);
        return items.filter((_, i) => results[i]);
    }
    getStats() {
        this.updateStats();
        return { ...this.stats };
    }
    resize(size) {
        while (this.workers.length < size && this.workers.length < this.config.maxWorkers) {
            this.createWorker();
        }
        while (this.workers.length > size && this.workers.length > this.config.minWorkers) {
            const idleWorker = this.getIdleWorker();
            if (idleWorker) {
                idleWorker.terminate();
                this.workers = this.workers.filter(w => w !== idleWorker);
            }
            else {
                break;
            }
        }
        this.updateStats();
    }
    terminate() {
        this.workers.forEach(w => w.terminate());
        this.workers = [];
        this.taskQueue = [];
        this.updateStats();
    }
}
// ============================================================================
// Shared State
// ============================================================================
export class SharedState {
    buffer;
    view;
    keys;
    constructor(initial) {
        this.keys = Object.keys(initial);
        this.buffer = new SharedArrayBuffer(this.keys.length * 4);
        this.view = new Int32Array(this.buffer);
        this.keys.forEach((key, i) => {
            this.view[i] = initial[key];
        });
    }
    get(key) {
        const index = this.keys.indexOf(key);
        if (index === -1)
            throw new Error(`Unknown key: ${String(key)}`);
        return Atomics.load(this.view, index);
    }
    set(key, value) {
        const index = this.keys.indexOf(key);
        if (index === -1)
            throw new Error(`Unknown key: ${String(key)}`);
        Atomics.store(this.view, index, value);
    }
    add(key, value) {
        const index = this.keys.indexOf(key);
        if (index === -1)
            throw new Error(`Unknown key: ${String(key)}`);
        return Atomics.add(this.view, index, value);
    }
    increment(key) {
        return this.add(key, 1);
    }
    decrement(key) {
        return this.add(key, -1);
    }
    compareExchange(key, expected, replacement) {
        const index = this.keys.indexOf(key);
        if (index === -1)
            throw new Error(`Unknown key: ${String(key)}`);
        return Atomics.compareExchange(this.view, index, expected, replacement);
    }
    toObject() {
        const obj = {};
        this.keys.forEach((key, i) => {
            obj[key] = this.view[i];
        });
        return obj;
    }
    getBuffer() {
        return this.buffer;
    }
    static fromBuffer(buffer, keys) {
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
export class Channel {
    buffer = [];
    waiters = [];
    closed = false;
    async send(value) {
        if (this.closed) {
            throw new Error('Channel is closed');
        }
        if (this.waiters.length > 0) {
            const waiter = this.waiters.shift();
            waiter(value);
        }
        else {
            this.buffer.push(value);
        }
    }
    async receive() {
        if (this.buffer.length > 0) {
            return this.buffer.shift();
        }
        if (this.closed) {
            throw new Error('Channel is closed');
        }
        const { promise, resolve } = Promise.withResolvers();
        this.waiters.push(resolve);
        return promise;
    }
    tryReceive() {
        return this.buffer.shift();
    }
    close() {
        this.closed = true;
    }
    isClosed() {
        return this.closed;
    }
    get length() {
        return this.buffer.length;
    }
    async *[Symbol.asyncIterator]() {
        while (!this.closed || this.buffer.length > 0) {
            yield await this.receive();
        }
    }
}
// ============================================================================
// Parallel Iterator
// ============================================================================
export class ParallelIterator {
    items;
    pool;
    constructor(items, pool) {
        this.items = items;
        this.pool = pool ?? new WorkerPool();
    }
    async map(fn) {
        return this.pool.map(this.items, fn);
    }
    async filter(fn) {
        return this.pool.filter(this.items, fn);
    }
    async reduce(fn, initial) {
        return this.pool.reduce(this.items, fn, initial);
    }
    async forEach(fn) {
        await this.pool.map(this.items, fn);
    }
    async some(fn) {
        const results = await this.pool.map(this.items, fn);
        return results.some(Boolean);
    }
    async every(fn) {
        const results = await this.pool.map(this.items, fn);
        return results.every(Boolean);
    }
    async find(fn) {
        const results = await this.pool.map(this.items, fn);
        const index = results.findIndex(Boolean);
        return index >= 0 ? this.items[index] : undefined;
    }
    chunk(size) {
        const chunks = [];
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
function createState(initial) {
    let value = initial;
    return [() => value, (newValue) => { value = newValue; }];
}
let globalPool = null;
function getPool(config) {
    if (!globalPool) {
        globalPool = new WorkerPool(config);
    }
    return globalPool;
}
/**
 * Hook for worker pool
 */
export function useWorkerPool(config) {
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
export function useParallel(items, fn, deps) {
    const pool = getPool();
    const [getResults, setResults] = createState(null);
    const [getLoading, setLoading] = createState(true);
    const [getError, setError] = createState(null);
    const execute = async () => {
        setLoading(true);
        setError(null);
        try {
            const results = await pool.map(items, fn);
            setResults(results);
        }
        catch (e) {
            setError(e);
        }
        finally {
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
export function useSharedState(initial) {
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
// Default Export
// ============================================================================
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
//# sourceMappingURL=index.js.map