/**
 * Fine-grained reactive signals implementation for PhilJS.
 * Inspired by SolidJS with automatic dependency tracking.
 */

// ============================================================================
// Types
// ============================================================================

export type Signal<T> = {
  (): T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (fn: (v: T) => void) => () => void;
  peek: () => T;
};

export type Memo<T> = {
  (): T;
};

export type LinkedSignal<T> = {
  (): T;
  set: (next: T | ((prev: T) => T)) => void;
  reset: () => void;
  isOverridden: () => boolean;
};

export type Resource<T> = {
  (): T;
  refresh: () => void;
  loading: () => boolean;
  error: () => Error | null;
};

export type EffectCleanup = () => void;

// ============================================================================
// Reactive Context
// ============================================================================

interface Computation {
  execute: () => void;
  dependencies: Set<Set<Computation>>;
}

let activeComputation: Computation | null = null;
let batchDepth = 0;
let batchedUpdates = new Set<() => void>();

// Owner tree for cleanup and disposal
interface Owner {
  cleanups: EffectCleanup[];
  owned: Owner[];
  context?: Map<symbol, unknown>;
}

let currentOwner: Owner | null = null;

// ============================================================================
// Core Signal Implementation
// ============================================================================

/**
 * Create a reactive signal with automatic dependency tracking.
 *
 * @example
 * ```ts
 * const count = signal(0);
 * console.log(count()); // 0
 * count.set(5);
 * console.log(count()); // 5
 * count.set(c => c + 1); // Updater function
 * ```
 */
export function signal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<Computation>();

  const read = (() => {
    // Track this signal as a dependency of the active computation
    if (activeComputation) {
      subscribers.add(activeComputation);
      activeComputation.dependencies.add(subscribers);
    }
    return value;
  }) as Signal<T>;

  read.set = (nextValue: T | ((prev: T) => T)) => {
    const newValue = typeof nextValue === "function"
      ? (nextValue as (prev: T) => T)(value)
      : nextValue;

    // Only update if value actually changed (reference equality)
    if (Object.is(value, newValue)) return;

    value = newValue;

    // Notify all subscribers
    if (batchDepth > 0) {
      // Queue updates for batching - convert to array to avoid iteration issues
      const subscribersList = Array.from(subscribers);
      subscribersList.forEach(computation => {
        batchedUpdates.add(computation.execute);
      });
    } else {
      // Execute immediately - convert to array to avoid modification during iteration
      const subscribersList = Array.from(subscribers);
      subscribersList.forEach(computation => computation.execute());
    }
  };

  read.subscribe = (fn: (v: T) => void) => {
    const computation: Computation = {
      execute: () => fn(value),
      dependencies: new Set(),
    };
    subscribers.add(computation);
    return () => subscribers.delete(computation);
  };

  // Peek reads the value without tracking dependencies
  read.peek = () => value;

  return read;
}

// ============================================================================
// Computed Values (Memos)
// ============================================================================

/**
 * Create a memoized computation that automatically tracks dependencies.
 *
 * @example
 * ```ts
 * const count = signal(0);
 * const doubled = memo(() => count() * 2);
 * console.log(doubled()); // 0
 * count.set(5);
 * console.log(doubled()); // 10
 * ```
 */
export function memo<T>(calc: () => T): Memo<T> {
  let cachedValue: T;
  let isStale = true;
  const subscribers = new Set<Computation>();

  const computation: Computation = {
    execute: () => {
      isStale = true;
      // Notify subscribers that we're stale - convert to array to avoid iteration issues
      const subscribersList = Array.from(subscribers);
      subscribersList.forEach(sub => sub.execute());
    },
    dependencies: new Set(),
  };

  const read = (() => {
    if (isStale) {
      // Clear old dependencies - convert to array first to avoid iteration issues
      const oldDeps = Array.from(computation.dependencies);
      oldDeps.forEach(deps => deps.delete(computation));
      computation.dependencies.clear();

      // Track new dependencies
      const prevComputation = activeComputation;
      activeComputation = computation;

      try {
        cachedValue = calc();
        isStale = false;
      } finally {
        activeComputation = prevComputation;
      }
    }

    // Track this memo as a dependency if we're in a computation
    if (activeComputation && activeComputation !== computation) {
      subscribers.add(activeComputation);
      activeComputation.dependencies.add(subscribers);
    }

    return cachedValue;
  }) as Memo<T> & { subscribe: (fn: (v: T) => void) => () => void };

  // Add subscribe method for JSX reactivity
  read.subscribe = (fn: (v: T) => void) => {
    const subscriberComputation: Computation = {
      execute: () => fn(read()),
      dependencies: new Set(),
    };
    subscribers.add(subscriberComputation);
    return () => subscribers.delete(subscriberComputation);
  };

  // Initialize the memo
  read();

  return read;
}

// ============================================================================
// Linked Signals (Writable Computed)
// ============================================================================

/**
 * Create a writable computed signal (like Angular's linkedSignal).
 * Acts like a memo by default, but can be manually overridden.
 * When dependencies change, it resets to the computed value unless configured otherwise.
 *
 * @example
 * ```ts
 * const firstName = signal('John');
 * const lastName = signal('Doe');
 * const fullName = linkedSignal(() => `${firstName()} ${lastName()}`);
 *
 * console.log(fullName()); // "John Doe"
 * fullName.set('Jane Smith'); // Manual override
 * console.log(fullName()); // "Jane Smith"
 * console.log(fullName.isOverridden()); // true
 *
 * firstName.set('Bob'); // Dependency changed - resets to computed
 * console.log(fullName()); // "Bob Doe"
 * console.log(fullName.isOverridden()); // false
 * ```
 */
export function linkedSignal<T>(
  computation: () => T,
  options: { resetOnChange?: boolean } = {}
): LinkedSignal<T> {
  const { resetOnChange = true } = options;

  let cachedValue: T;
  let isOverridden = false;
  let isStale = true;
  const subscribers = new Set<Computation>();

  const comp: Computation = {
    execute: () => {
      // When dependencies change, mark as stale
      if (resetOnChange || !isOverridden) {
        isStale = true;
        isOverridden = false;
      }

      // Notify subscribers
      const subscribersList = Array.from(subscribers);
      subscribersList.forEach(sub => sub.execute());
    },
    dependencies: new Set(),
  };

  const read = (() => {
    if (isStale && !isOverridden) {
      // Clear old dependencies
      const oldDeps = Array.from(comp.dependencies);
      oldDeps.forEach(deps => deps.delete(comp));
      comp.dependencies.clear();

      // Track new dependencies
      const prevComputation = activeComputation;
      activeComputation = comp;

      try {
        cachedValue = computation();
        isStale = false;
      } finally {
        activeComputation = prevComputation;
      }
    }

    // Track this linked signal as a dependency if we're in a computation
    if (activeComputation && activeComputation !== comp) {
      subscribers.add(activeComputation);
      activeComputation.dependencies.add(subscribers);
    }

    return cachedValue;
  }) as LinkedSignal<T>;

  read.set = (nextValue: T | ((prev: T) => T)) => {
    const newValue = typeof nextValue === "function"
      ? (nextValue as (prev: T) => T)(cachedValue)
      : nextValue;

    if (Object.is(cachedValue, newValue)) return;

    cachedValue = newValue;
    isOverridden = true;
    isStale = false;

    // Notify all subscribers
    if (batchDepth > 0) {
      const subscribersList = Array.from(subscribers);
      subscribersList.forEach(subscriber => {
        batchedUpdates.add(subscriber.execute);
      });
    } else {
      const subscribersList = Array.from(subscribers);
      subscribersList.forEach(subscriber => subscriber.execute());
    }
  };

  read.reset = () => {
    isOverridden = false;
    isStale = true;

    // Force recomputation
    read();

    // Notify subscribers about the reset
    if (batchDepth > 0) {
      const subscribersList = Array.from(subscribers);
      subscribersList.forEach(subscriber => {
        batchedUpdates.add(subscriber.execute);
      });
    } else {
      const subscribersList = Array.from(subscribers);
      subscribersList.forEach(subscriber => subscriber.execute());
    }
  };

  read.isOverridden = () => isOverridden;

  // Initialize
  read();

  return read;
}

// ============================================================================
// Side Effects
// ============================================================================

/**
 * Create a side effect that automatically tracks dependencies and re-runs when they change.
 * Returns a cleanup function to dispose the effect.
 *
 * @example
 * ```ts
 * const count = signal(0);
 * const dispose = effect(() => {
 *   console.log('Count is:', count());
 *   return () => console.log('Cleanup!');
 * });
 *
 * count.set(5); // Logs: "Cleanup!" then "Count is: 5"
 * dispose(); // Stop the effect
 * ```
 */
export function effect(fn: () => void | EffectCleanup): EffectCleanup {
  let cleanup: void | EffectCleanup;
  let isDisposed = false;

  let owner: Owner | null = null;

  const computation: Computation = {
    execute: () => {
      if (isDisposed) return;

      // Run cleanup from previous execution
      if (typeof cleanup === "function") {
        cleanup();
      }

      // Run onCleanup callbacks from previous execution
      if (owner) {
        owner.cleanups.forEach(fn => fn());
        owner.cleanups = [];
      }

      // Clear old dependencies - convert to array first to avoid iteration issues
      const oldDeps = Array.from(computation.dependencies);
      oldDeps.forEach(deps => deps.delete(computation));
      computation.dependencies.clear();

      // Create owner for this effect
      const prevOwner = currentOwner;
      owner = {
        cleanups: [],
        owned: [],
      };
      currentOwner = owner;
      if (prevOwner) {
        prevOwner.owned.push(owner);
      }

      // Track new dependencies
      const prevComputation = activeComputation;
      activeComputation = computation;

      try {
        cleanup = fn();
      } finally {
        activeComputation = prevComputation;
        currentOwner = prevOwner;
      }
    },
    dependencies: new Set(),
  };

  // Run the effect initially
  computation.execute();

  // Return cleanup function
  return () => {
    if (isDisposed) return;
    isDisposed = true;

    if (typeof cleanup === "function") {
      cleanup();
    }

    // Run onCleanup callbacks
    if (owner) {
      owner.cleanups.forEach(fn => fn());
      owner.cleanups = [];
    }

    // Convert to array first to avoid iteration issues during deletion
    const oldDeps = Array.from(computation.dependencies);
    oldDeps.forEach(deps => deps.delete(computation));
    computation.dependencies.clear();
  };
}

// ============================================================================
// Batching
// ============================================================================

/**
 * Batch multiple signal updates into a single update cycle.
 * This prevents unnecessary re-computations.
 *
 * @example
 * ```ts
 * const firstName = signal('John');
 * const lastName = signal('Doe');
 *
 * batch(() => {
 *   firstName.set('Jane');
 *   lastName.set('Smith');
 * }); // Only triggers one update to dependents
 * ```
 */
export function batch<T>(fn: () => T): T {
  batchDepth++;
  try {
    return fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      // Execute all batched updates
      const updates = Array.from(batchedUpdates);
      batchedUpdates.clear();
      updates.forEach(update => update());
    }
  }
}

// ============================================================================
// Untrack
// ============================================================================

/**
 * Run a function without tracking dependencies.
 * Useful for reading signals without creating dependencies.
 *
 * @example
 * ```ts
 * const a = signal(1);
 * const b = signal(2);
 *
 * const sum = memo(() => {
 *   const aVal = a(); // Tracked
 *   const bVal = untrack(() => b()); // Not tracked
 *   return aVal + bVal;
 * });
 *
 * b.set(100); // Won't trigger sum to recompute
 * a.set(5); // Will trigger sum to recompute
 * ```
 */
export function untrack<T>(fn: () => T): T {
  const prevComputation = activeComputation;
  activeComputation = null;
  try {
    return fn();
  } finally {
    activeComputation = prevComputation;
  }
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Register a cleanup function to be called when the current effect is disposed.
 *
 * @example
 * ```ts
 * effect(() => {
 *   const timer = setInterval(() => console.log('tick'), 1000);
 *   onCleanup(() => clearInterval(timer));
 * });
 * ```
 */
export function onCleanup(cleanup: EffectCleanup): void {
  if (currentOwner) {
    currentOwner.cleanups.push(cleanup);
  }
}

// ============================================================================
// Root (Owner Management)
// ============================================================================

/**
 * Create a root scope for effects that lives until explicitly disposed.
 * Useful for managing long-lived reactive scopes.
 *
 * @example
 * ```ts
 * const dispose = createRoot(dispose => {
 *   const count = signal(0);
 *   effect(() => console.log(count()));
 *   return dispose; // Return dispose function
 * });
 *
 * // Later...
 * dispose(); // Clean up all effects
 * ```
 */
export function createRoot<T>(fn: (dispose: () => void) => T): T {
  const prevOwner = currentOwner;
  const owner: Owner = {
    cleanups: [],
    owned: [],
  };
  currentOwner = owner;

  const dispose = () => {
    // Dispose all owned children
    owner.owned.forEach(child => disposeOwner(child));
    owner.owned = [];

    // Run cleanups
    owner.cleanups.forEach(cleanup => cleanup());
    owner.cleanups = [];
  };

  try {
    return fn(dispose);
  } finally {
    currentOwner = prevOwner;
  }
}

function disposeOwner(owner: Owner): void {
  owner.owned.forEach(child => disposeOwner(child));
  owner.cleanups.forEach(cleanup => cleanup());
}

// ============================================================================
// Resources (Async Signals)
// ============================================================================

/**
 * Create a resource that tracks loading and error states.
 *
 * @example
 * ```ts
 * const userId = signal(1);
 * const user = resource(async () => {
 *   const response = await fetch(`/api/users/${userId()}`);
 *   return response.json();
 * });
 *
 * if (user.loading()) {
 *   return <div>Loading...</div>;
 * }
 * if (user.error()) {
 *   return <div>Error: {user.error().message}</div>;
 * }
 * return <div>User: {user().name}</div>;
 * ```
 */
export function resource<T>(fetcher: () => T | Promise<T>): Resource<T> {
  const data = signal<T | undefined>(undefined);
  const loading = signal(true);
  const error = signal<Error | null>(null);

  const refresh = () => {
    loading.set(true);
    error.set(null);

    try {
      const result = fetcher();

      if (result instanceof Promise) {
        result
          .then(value => {
            data.set(value as T);
            loading.set(false);
          })
          .catch(err => {
            error.set(err instanceof Error ? err : new Error(String(err)));
            loading.set(false);
          });
      } else {
        data.set(result);
        loading.set(false);
      }
    } catch (err) {
      error.set(err instanceof Error ? err : new Error(String(err)));
      loading.set(false);
    }
  };

  // Initial fetch
  refresh();

  const read = (() => {
    if (error()) throw error();
    return data() as T;
  }) as Resource<T>;

  read.refresh = refresh;
  read.loading = () => loading();
  read.error = () => error();

  return read;
}

