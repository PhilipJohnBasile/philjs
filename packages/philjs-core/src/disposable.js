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
export function disposableTimeout(callback, delay) {
    const id = setTimeout(callback, delay);
    return {
        id,
        [Symbol.dispose]() {
            clearTimeout(id);
        },
    };
}
/**
 * Disposable interval that auto-clears when disposed
 * Usage: using interval = disposableInterval(() => { ... }, 1000);
 */
export function disposableInterval(callback, delay) {
    const id = setInterval(callback, delay);
    return {
        id,
        [Symbol.dispose]() {
            clearInterval(id);
        },
    };
}
/**
 * Disposable AbortController that auto-aborts when disposed
 * Usage: using controller = disposableAbortController();
 */
export function disposableAbortController(reason) {
    const controller = new AbortController();
    return {
        controller,
        signal: controller.signal,
        [Symbol.dispose]() {
            if (!controller.signal.aborted) {
                controller.abort(reason);
            }
        },
    };
}
export function disposableEventListener(target, type, listener, options) {
    target.addEventListener(type, listener, options);
    return {
        [Symbol.dispose]() {
            target.removeEventListener(type, listener, options);
        },
    };
}
/**
 * Disposable subscription wrapper
 * Usage: using sub = disposableSubscription(() => store.subscribe(handler));
 */
export function disposableSubscription(subscribe) {
    const result = subscribe();
    const cleanup = typeof result === 'function' ? result : () => result.unsubscribe();
    return {
        [Symbol.dispose]() {
            cleanup();
        },
    };
}
/**
 * Async disposable for async cleanup
 * Usage: await using resource = asyncDisposable(acquireResource, releaseResource);
 */
export function asyncDisposable(resource, cleanup) {
    return {
        resource,
        async [Symbol.asyncDispose]() {
            await cleanup(resource);
        },
    };
}
/**
 * Create a disposable scope for managing multiple disposables
 * Usage:
 * using scope = createDisposableScope();
 * scope.add(disposableTimeout(...));
 * scope.add(disposableInterval(...));
 * // All cleaned up when scope exits
 */
export function createDisposableScope() {
    const disposables = [];
    const asyncDisposables = [];
    return {
        add(disposable) {
            disposables.push(disposable);
        },
        addAsync(disposable) {
            asyncDisposables.push(disposable);
        },
        [Symbol.dispose]() {
            // Dispose in reverse order (LIFO)
            for (let i = disposables.length - 1; i >= 0; i--) {
                disposables[i]?.[Symbol.dispose]();
            }
            // Note: async disposables should use AsyncDisposableScope
            for (let i = asyncDisposables.length - 1; i >= 0; i--) {
                // Fire and forget for sync dispose - use AsyncDisposableScope for proper async
                void asyncDisposables[i]?.[Symbol.asyncDispose]();
            }
        },
    };
}
/**
 * Create an async disposable scope for managing multiple async disposables
 * Usage:
 * await using scope = createAsyncDisposableScope();
 * scope.add(asyncDisposable(...));
 */
export function createAsyncDisposableScope() {
    const disposables = [];
    const asyncDisposables = [];
    return {
        add(disposable) {
            disposables.push(disposable);
        },
        addAsync(disposable) {
            asyncDisposables.push(disposable);
        },
        async [Symbol.asyncDispose]() {
            // Dispose in reverse order (LIFO)
            for (let i = asyncDisposables.length - 1; i >= 0; i--) {
                await asyncDisposables[i]?.[Symbol.asyncDispose]();
            }
            for (let i = disposables.length - 1; i >= 0; i--) {
                disposables[i]?.[Symbol.dispose]();
            }
        },
    };
}
/**
 * Helper to make any cleanup function disposable
 * Usage: using cleanup = toDisposable(() => someCleanup());
 */
export function toDisposable(cleanup) {
    return {
        [Symbol.dispose]() {
            cleanup();
        },
    };
}
/**
 * Helper to make any async cleanup function async disposable
 * Usage: await using cleanup = toAsyncDisposable(async () => await someCleanup());
 */
export function toAsyncDisposable(cleanup) {
    return {
        async [Symbol.asyncDispose]() {
            await cleanup();
        },
    };
}
/**
 * Disposable mutex/lock for async operations
 * Ensures only one operation runs at a time, auto-releases on dispose
 */
export function createDisposableMutex() {
    let locked = false;
    const queue = [];
    return {
        isLocked: () => locked,
        acquire: () => {
            return new Promise((resolve) => {
                const tryAcquire = () => {
                    if (!locked) {
                        locked = true;
                        resolve({
                            [Symbol.dispose]() {
                                locked = false;
                                const next = queue.shift();
                                if (next)
                                    next();
                            },
                        });
                    }
                    else {
                        queue.push(tryAcquire);
                    }
                };
                tryAcquire();
            });
        },
    };
}
//# sourceMappingURL=disposable.js.map