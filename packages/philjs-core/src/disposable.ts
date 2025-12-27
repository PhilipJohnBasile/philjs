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
export function disposableTimeout(
  callback: () => void,
  delay: number
): Disposable & { id: ReturnType<typeof setTimeout> } {
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
export function disposableInterval(
  callback: () => void,
  delay: number
): Disposable & { id: ReturnType<typeof setInterval> } {
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
export function disposableAbortController(
  reason?: any
): Disposable & { controller: AbortController; signal: AbortSignal } {
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

/**
 * Disposable event listener that auto-removes when disposed
 * Usage: using listener = disposableEventListener(element, 'click', handler);
 */
export function disposableEventListener<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  listener: (ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): Disposable;
export function disposableEventListener<K extends keyof DocumentEventMap>(
  target: Document,
  type: K,
  listener: (ev: DocumentEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): Disposable;
export function disposableEventListener<K extends keyof HTMLElementEventMap>(
  target: HTMLElement,
  type: K,
  listener: (ev: HTMLElementEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): Disposable;
export function disposableEventListener(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
): Disposable {
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
export function disposableSubscription(
  subscribe: () => (() => void) | { unsubscribe: () => void }
): Disposable {
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
export function asyncDisposable<T>(
  resource: T,
  cleanup: (resource: T) => Promise<void>
): AsyncDisposable & { resource: T } {
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
export function createDisposableScope(): Disposable & {
  add: (disposable: Disposable) => void;
  addAsync: (disposable: AsyncDisposable) => void;
} {
  const disposables: Disposable[] = [];
  const asyncDisposables: AsyncDisposable[] = [];

  return {
    add(disposable: Disposable) {
      disposables.push(disposable);
    },
    addAsync(disposable: AsyncDisposable) {
      asyncDisposables.push(disposable);
    },
    [Symbol.dispose]() {
      // Dispose in reverse order (LIFO)
      for (let i = disposables.length - 1; i >= 0; i--) {
        disposables[i][Symbol.dispose]();
      }
      // Note: async disposables should use AsyncDisposableScope
      for (let i = asyncDisposables.length - 1; i >= 0; i--) {
        // Fire and forget for sync dispose - use AsyncDisposableScope for proper async
        void asyncDisposables[i][Symbol.asyncDispose]();
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
export function createAsyncDisposableScope(): AsyncDisposable & {
  add: (disposable: Disposable) => void;
  addAsync: (disposable: AsyncDisposable) => void;
} {
  const disposables: Disposable[] = [];
  const asyncDisposables: AsyncDisposable[] = [];

  return {
    add(disposable: Disposable) {
      disposables.push(disposable);
    },
    addAsync(disposable: AsyncDisposable) {
      asyncDisposables.push(disposable);
    },
    async [Symbol.asyncDispose]() {
      // Dispose in reverse order (LIFO)
      for (let i = asyncDisposables.length - 1; i >= 0; i--) {
        await asyncDisposables[i][Symbol.asyncDispose]();
      }
      for (let i = disposables.length - 1; i >= 0; i--) {
        disposables[i][Symbol.dispose]();
      }
    },
  };
}

/**
 * Helper to make any cleanup function disposable
 * Usage: using cleanup = toDisposable(() => someCleanup());
 */
export function toDisposable(cleanup: () => void): Disposable {
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
export function toAsyncDisposable(cleanup: () => Promise<void>): AsyncDisposable {
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
export function createDisposableMutex(): {
  acquire: () => Promise<Disposable>;
  isLocked: () => boolean;
} {
  let locked = false;
  const queue: Array<() => void> = [];

  return {
    isLocked: () => locked,
    acquire: (): Promise<Disposable> => {
      return new Promise((resolve) => {
        const tryAcquire = () => {
          if (!locked) {
            locked = true;
            resolve({
              [Symbol.dispose]() {
                locked = false;
                const next = queue.shift();
                if (next) next();
              },
            });
          } else {
            queue.push(tryAcquire);
          }
        };
        tryAcquire();
      });
    },
  };
}
