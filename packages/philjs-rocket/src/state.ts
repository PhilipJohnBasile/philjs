/**
 * PhilJS Rocket State Management
 *
 * State management integration for Rocket framework.
 * Provides typed state containers and reactive state updates.
 */

// ============================================================================
// State Types
// ============================================================================

/**
 * Managed state container
 */
export interface ManagedState<T> {
  /** Get current state value */
  get(): T;
  /** Get a reference to state (for reading) */
  inner(): T;
  /** Update state with a function */
  update(fn: (state: T) => T): void;
  /** Replace state entirely */
  set(value: T): void;
  /** Subscribe to state changes */
  subscribe(listener: (state: T) => void): () => void;
}

/**
 * State configuration
 */
export interface StateConfig<T> {
  /** Initial state value */
  initial: T;
  /** State key for persistence */
  key?: string;
  /** Enable persistence */
  persist?: boolean;
  /** Custom serializer */
  serialize?: (state: T) => string;
  /** Custom deserializer */
  deserialize?: (data: string) => T;
}

/**
 * State manager for the application
 */
export interface StateManager {
  /** Register managed state */
  manage<T>(key: string, value: T): ManagedState<T>;
  /** Get managed state by key */
  get<T>(key: string): ManagedState<T> | undefined;
  /** Check if state exists */
  has(key: string): boolean;
  /** Remove managed state */
  remove(key: string): boolean;
  /** Get all state keys */
  keys(): string[];
  /** Clear all state */
  clear(): void;
}

// ============================================================================
// State Implementation
// ============================================================================

/**
 * Create a managed state container
 */
export function createManagedState<T>(config: StateConfig<T>): ManagedState<T> {
  let state = config.initial;
  const listeners = new Set<(state: T) => void>();

  // Load persisted state if enabled
  if (config.persist && config.key && typeof globalThis !== 'undefined') {
    try {
      const stored = (globalThis as any).__PHILJS_STATE__?.[config.key];
      if (stored) {
        state = config.deserialize ? config.deserialize(stored) : JSON.parse(stored);
      }
    } catch {
      // Use initial state if loading fails
    }
  }

  const notify = () => {
    listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('State listener error:', error);
      }
    });
  };

  const persist = () => {
    if (config.persist && config.key) {
      try {
        const data = config.serialize ? config.serialize(state) : JSON.stringify(state);
        if (typeof globalThis !== 'undefined') {
          (globalThis as any).__PHILJS_STATE__ = (globalThis as any).__PHILJS_STATE__ || {};
          (globalThis as any).__PHILJS_STATE__[config.key] = data;
        }
      } catch (error) {
        console.error('State persistence error:', error);
      }
    }
  };

  return {
    get(): T {
      return state;
    },

    inner(): T {
      return state;
    },

    update(fn: (state: T) => T): void {
      state = fn(state);
      persist();
      notify();
    },

    set(value: T): void {
      state = value;
      persist();
      notify();
    },

    subscribe(listener: (state: T) => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * Create a state manager
 */
export function createStateManager(): StateManager {
  const states = new Map<string, ManagedState<unknown>>();

  return {
    manage<T>(key: string, value: T): ManagedState<T> {
      if (states.has(key)) {
        return states.get(key) as ManagedState<T>;
      }

      const managed = createManagedState({ initial: value, key });
      states.set(key, managed as ManagedState<unknown>);
      return managed;
    },

    get<T>(key: string): ManagedState<T> | undefined {
      return states.get(key) as ManagedState<T> | undefined;
    },

    has(key: string): boolean {
      return states.has(key);
    },

    remove(key: string): boolean {
      return states.delete(key);
    },

    keys(): string[] {
      return Array.from(states.keys());
    },

    clear(): void {
      states.clear();
    },
  };
}

// ============================================================================
// Request-Local State
// ============================================================================

/**
 * Request-local state container
 */
export interface RequestState<T = Record<string, unknown>> {
  /** Get a value from request state */
  get<V>(key: string): V | undefined;
  /** Set a value in request state */
  set<V>(key: string, value: V): void;
  /** Check if a key exists */
  has(key: string): boolean;
  /** Delete a key */
  delete(key: string): boolean;
  /** Get all state as an object */
  all(): T;
}

/**
 * Create request-local state
 */
export function createRequestState<T extends Record<string, unknown> = Record<string, unknown>>(
  initial?: Partial<T>
): RequestState<T> {
  const state = new Map<string, unknown>(Object.entries(initial || {}));

  return {
    get<V>(key: string): V | undefined {
      return state.get(key) as V | undefined;
    },

    set<V>(key: string, value: V): void {
      state.set(key, value);
    },

    has(key: string): boolean {
      return state.has(key);
    },

    delete(key: string): boolean {
      return state.delete(key);
    },

    all(): T {
      return Object.fromEntries(state) as T;
    },
  };
}

// ============================================================================
// Global Application State
// ============================================================================

/**
 * Application state definition
 */
export interface AppState<T> {
  /** Current state */
  state: T;
  /** State version for optimistic concurrency */
  version: number;
  /** Last update timestamp */
  updatedAt: number;
}

/**
 * Global state container
 */
export class GlobalState<T> {
  private _state: T;
  private _version: number = 0;
  private _updatedAt: number = Date.now();
  private _listeners: Set<(state: T, version: number) => void> = new Set();

  constructor(initial: T) {
    this._state = initial;
  }

  /**
   * Get current state
   */
  get state(): T {
    return this._state;
  }

  /**
   * Get state version
   */
  get version(): number {
    return this._version;
  }

  /**
   * Get last update timestamp
   */
  get updatedAt(): number {
    return this._updatedAt;
  }

  /**
   * Update state
   */
  update(fn: (state: T) => T): void {
    this._state = fn(this._state);
    this._version++;
    this._updatedAt = Date.now();
    this.notify();
  }

  /**
   * Set state with expected version (optimistic concurrency)
   */
  setWithVersion(value: T, expectedVersion: number): boolean {
    if (this._version !== expectedVersion) {
      return false;
    }
    this._state = value;
    this._version++;
    this._updatedAt = Date.now();
    this.notify();
    return true;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: T, version: number) => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Get state snapshot
   */
  snapshot(): AppState<T> {
    return {
      state: this._state,
      version: this._version,
      updatedAt: this._updatedAt,
    };
  }

  private notify(): void {
    this._listeners.forEach(listener => {
      try {
        listener(this._state, this._version);
      } catch (error) {
        console.error('State listener error:', error);
      }
    });
  }
}

/**
 * Create a global state container
 */
export function createGlobalState<T>(initial: T): GlobalState<T> {
  return new GlobalState(initial);
}

// ============================================================================
// State Selectors
// ============================================================================

/**
 * Selector function type
 */
export type Selector<T, R> = (state: T) => R;

/**
 * Create a memoized selector
 */
export function createSelector<T, R>(
  selector: Selector<T, R>,
  equalityFn: (a: R, b: R) => boolean = Object.is
): Selector<T, R> {
  let lastState: T | undefined;
  let lastResult: R | undefined;

  return (state: T): R => {
    if (lastState === state) {
      return lastResult as R;
    }

    const result = selector(state);

    if (lastResult !== undefined && equalityFn(result, lastResult)) {
      return lastResult;
    }

    lastState = state;
    lastResult = result;
    return result;
  };
}

/**
 * Create a derived selector from multiple selectors
 */
export function createDerivedSelector<T, S1, R>(
  selector1: Selector<T, S1>,
  combiner: (s1: S1) => R
): Selector<T, R>;
export function createDerivedSelector<T, S1, S2, R>(
  selector1: Selector<T, S1>,
  selector2: Selector<T, S2>,
  combiner: (s1: S1, s2: S2) => R
): Selector<T, R>;
export function createDerivedSelector<T, S1, S2, S3, R>(
  selector1: Selector<T, S1>,
  selector2: Selector<T, S2>,
  selector3: Selector<T, S3>,
  combiner: (s1: S1, s2: S2, s3: S3) => R
): Selector<T, R>;
export function createDerivedSelector<T, R>(
  ...args: (Selector<T, unknown> | ((...args: unknown[]) => R))[]
): Selector<T, R> {
  const combiner = args.pop() as (...args: unknown[]) => R;
  const selectors = args as Selector<T, unknown>[];

  let lastArgs: unknown[] | undefined;
  let lastResult: R | undefined;

  return (state: T): R => {
    const currentArgs = selectors.map(s => s(state));

    if (lastArgs && currentArgs.every((arg, i) => Object.is(arg, lastArgs![i]))) {
      return lastResult as R;
    }

    lastArgs = currentArgs;
    lastResult = combiner(...currentArgs);
    return lastResult;
  };
}

// ============================================================================
// Rust Code Generation
// ============================================================================

/**
 * Generate Rust state code
 */
export function generateRustState(name: string, fields: Record<string, string>): string {
  const fieldDefs = Object.entries(fields)
    .map(([field, type]) => `    pub ${field}: ${type},`)
    .join('\n');

  return `
use std::sync::Arc;
use parking_lot::RwLock;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ${name} {
${fieldDefs}
}

impl Default for ${name} {
    fn default() -> Self {
        Self {
            // Initialize fields with defaults
        }
    }
}

/// Managed state wrapper for ${name}
pub type ${name}State = Arc<RwLock<${name}>>;

/// Create a new managed ${name} state
pub fn create_${name.toLowerCase()}_state() -> ${name}State {
    Arc::new(RwLock::new(${name}::default()))
}

/// Get ${name} from Rocket state
pub fn get_${name.toLowerCase()}_state(state: &rocket::State<${name}State>) -> ${name} {
    state.read().clone()
}

/// Update ${name} in Rocket state
pub fn update_${name.toLowerCase()}_state<F>(state: &rocket::State<${name}State>, f: F)
where
    F: FnOnce(&mut ${name}),
{
    let mut guard = state.write();
    f(&mut *guard);
}
`.trim();
}

/**
 * Generate Rust request guard for state
 */
export function generateRustStateGuard(name: string): string {
  return `
use rocket::{Request, request::{FromRequest, Outcome}};
use std::sync::Arc;
use parking_lot::RwLock;

/// Request guard for accessing ${name} state
pub struct ${name}Guard<'r> {
    state: &'r Arc<RwLock<${name}>>,
}

impl<'r> ${name}Guard<'r> {
    pub fn read(&self) -> parking_lot::RwLockReadGuard<'_, ${name}> {
        self.state.read()
    }

    pub fn write(&self) -> parking_lot::RwLockWriteGuard<'_, ${name}> {
        self.state.write()
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for ${name}Guard<'r> {
    type Error = std::convert::Infallible;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let state = request.rocket().state::<Arc<RwLock<${name}>>>()
            .expect("${name} state not managed");
        Outcome::Success(${name}Guard { state })
    }
}
`.trim();
}
