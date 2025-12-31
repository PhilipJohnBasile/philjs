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
export declare class PoolWorker {
    private worker;
    private currentTaskId;
    private resolvers;
    private progressHandlers;
    private ready;
    private _isReady;
    constructor();
    execute<T, R>(task: Task<T, R>): Promise<R>;
    cancel(taskId: string): void;
    isIdle(): boolean;
    terminate(): void;
}
export declare class WorkerPool {
    private config;
    private workers;
    private taskQueue;
    private stats;
    private taskDurations;
    constructor(config?: WorkerPoolConfig);
    private createWorker;
    private getIdleWorker;
    exec<T, R>(fn: (...args: T[]) => R, ...args: T[]): Promise<R>;
    run<T, R>(task: Omit<Task<T, R>, 'id'>): Promise<R>;
    private runTask;
    private processQueue;
    private updateStats;
    map<T, R>(items: T[], fn: (item: T) => R): Promise<R[]>;
    mapSettled<T, R>(items: T[], fn: (item: T) => R): Promise<PromiseSettledResult<R>[]>;
    reduce<T, R>(items: T[], fn: (acc: R, item: T) => R, initial: R): Promise<R>;
    filter<T>(items: T[], fn: (item: T) => boolean): Promise<T[]>;
    getStats(): PoolStats;
    resize(size: number): void;
    terminate(): void;
}
export declare class SharedState<T extends Record<string, number>> {
    private buffer;
    private view;
    private keys;
    constructor(initial: T);
    get<K extends keyof T>(key: K): number;
    set<K extends keyof T>(key: K, value: number): void;
    add<K extends keyof T>(key: K, value: number): number;
    increment<K extends keyof T>(key: K): number;
    decrement<K extends keyof T>(key: K): number;
    compareExchange<K extends keyof T>(key: K, expected: number, replacement: number): number;
    toObject(): T;
    getBuffer(): SharedArrayBuffer;
    static fromBuffer<T extends Record<string, number>>(buffer: SharedArrayBuffer, keys: (keyof T)[]): SharedState<T>;
}
export declare class Channel<T> {
    private buffer;
    private waiters;
    private closed;
    send(value: T): Promise<void>;
    receive(): Promise<T>;
    tryReceive(): T | undefined;
    close(): void;
    isClosed(): boolean;
    get length(): number;
    [Symbol.asyncIterator](): AsyncIterableIterator<T>;
}
export declare class ParallelIterator<T> {
    private items;
    private pool;
    constructor(items: T[], pool?: WorkerPool);
    map<R>(fn: (item: T) => R): Promise<R[]>;
    filter(fn: (item: T) => boolean): Promise<T[]>;
    reduce<R>(fn: (acc: R, item: T) => R, initial: R): Promise<R>;
    forEach(fn: (item: T) => void): Promise<void>;
    some(fn: (item: T) => boolean): Promise<boolean>;
    every(fn: (item: T) => boolean): Promise<boolean>;
    find(fn: (item: T) => boolean): Promise<T | undefined>;
    chunk(size: number): ParallelIterator<T[]>;
}
/**
 * Hook for worker pool
 */
export declare function useWorkerPool(config?: WorkerPoolConfig): {
    exec: <T, R>(fn: (...args: T[]) => R, ...args: T[]) => Promise<R>;
    map: <T, R>(items: T[], fn: (item: T) => R) => Promise<R[]>;
    filter: <T>(items: T[], fn: (item: T) => boolean) => Promise<T[]>;
    reduce: <T, R>(items: T[], fn: (acc: R, item: T) => R, initial: R) => Promise<R>;
    stats: PoolStats;
    resize: (size: number) => void;
};
/**
 * Hook for parallel computation
 */
export declare function useParallel<T, R>(items: T[], fn: (item: T) => R, deps?: any[]): {
    results: R[] | null;
    loading: boolean;
    error: Error | null;
    retry: () => void;
};
/**
 * Hook for shared state across workers
 */
export declare function useSharedState<T extends Record<string, number>>(initial: T): {
    state: T;
    get: <K extends keyof T>(key: K) => number;
    set: <K extends keyof T>(key: K, value: number) => void;
    increment: <K extends keyof T>(key: K) => number;
    decrement: <K extends keyof T>(key: K) => number;
    buffer: SharedArrayBuffer;
};
declare const _default: {
    PoolWorker: typeof PoolWorker;
    WorkerPool: typeof WorkerPool;
    SharedState: typeof SharedState;
    Channel: typeof Channel;
    ParallelIterator: typeof ParallelIterator;
    useWorkerPool: typeof useWorkerPool;
    useParallel: typeof useParallel;
    useSharedState: typeof useSharedState;
};
export default _default;
//# sourceMappingURL=index.d.ts.map