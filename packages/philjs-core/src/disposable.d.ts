/**
 * PhilJS Disposable Utilities
 *
 * TypeScript 6 Explicit Resource Management (using keyword) support
 * Provides Disposable wrappers for common resources:
 * - Timers (setTimeout, setInterval)
 * - AbortControllers
 * - Event listeners
 * - Subscriptions
 */
/**
 * Disposable timeout that auto-clears when disposed
 * Usage: using timer = disposableTimeout(() => { ... }, 1000);
 */
export declare function disposableTimeout(callback: () => void, delay: number): Disposable & {
    id: ReturnType<typeof setTimeout>;
};
/**
 * Disposable interval that auto-clears when disposed
 * Usage: using interval = disposableInterval(() => { ... }, 1000);
 */
export declare function disposableInterval(callback: () => void, delay: number): Disposable & {
    id: ReturnType<typeof setInterval>;
};
/**
 * Disposable AbortController that auto-aborts when disposed
 * Usage: using controller = disposableAbortController();
 */
export declare function disposableAbortController(reason?: any): Disposable & {
    controller: AbortController;
    signal: AbortSignal;
};
/**
 * Disposable event listener that auto-removes when disposed
 * Usage: using listener = disposableEventListener(element, 'click', handler);
 */
export declare function disposableEventListener<K extends keyof WindowEventMap>(target: Window, type: K, listener: (ev: WindowEventMap[K]) => any, options?: boolean | AddEventListenerOptions): Disposable;
export declare function disposableEventListener<K extends keyof DocumentEventMap>(target: Document, type: K, listener: (ev: DocumentEventMap[K]) => any, options?: boolean | AddEventListenerOptions): Disposable;
export declare function disposableEventListener<K extends keyof HTMLElementEventMap>(target: HTMLElement, type: K, listener: (ev: HTMLElementEventMap[K]) => any, options?: boolean | AddEventListenerOptions): Disposable;
/**
 * Disposable subscription wrapper
 * Usage: using sub = disposableSubscription(() => store.subscribe(handler));
 */
export declare function disposableSubscription(subscribe: () => (() => void) | {
    unsubscribe: () => void;
}): Disposable;
/**
 * Async disposable for async cleanup
 * Usage: await using resource = asyncDisposable(acquireResource, releaseResource);
 */
export declare function asyncDisposable<T>(resource: T, cleanup: (resource: T) => Promise<void>): AsyncDisposable & {
    resource: T;
};
/**
 * Create a disposable scope for managing multiple disposables
 * Usage:
 * using scope = createDisposableScope();
 * scope.add(disposableTimeout(...));
 * scope.add(disposableInterval(...));
 * // All cleaned up when scope exits
 */
export declare function createDisposableScope(): Disposable & {
    add: (disposable: Disposable) => void;
    addAsync: (disposable: AsyncDisposable) => void;
};
/**
 * Create an async disposable scope for managing multiple async disposables
 * Usage:
 * await using scope = createAsyncDisposableScope();
 * scope.add(asyncDisposable(...));
 */
export declare function createAsyncDisposableScope(): AsyncDisposable & {
    add: (disposable: Disposable) => void;
    addAsync: (disposable: AsyncDisposable) => void;
};
/**
 * Helper to make any cleanup function disposable
 * Usage: using cleanup = toDisposable(() => someCleanup());
 */
export declare function toDisposable(cleanup: () => void): Disposable;
/**
 * Helper to make any async cleanup function async disposable
 * Usage: await using cleanup = toAsyncDisposable(async () => await someCleanup());
 */
export declare function toAsyncDisposable(cleanup: () => Promise<void>): AsyncDisposable;
/**
 * Disposable mutex/lock for async operations
 * Ensures only one operation runs at a time, auto-releases on dispose
 */
export declare function createDisposableMutex(): {
    acquire: () => Promise<Disposable>;
    isLocked: () => boolean;
};
//# sourceMappingURL=disposable.d.ts.map