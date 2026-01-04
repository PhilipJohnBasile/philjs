/**
 * PhilJS Rocket State Management
 *
 * State management integration for Rocket framework.
 * Provides typed state containers and reactive state updates.
 */
// ============================================================================
// State Implementation
// ============================================================================
/**
 * Create a managed state container
 */
export function createManagedState(config) {
    let state = config.initial;
    const listeners = new Set();
    // Load persisted state if enabled
    if (config.persist && config.key && typeof globalThis !== 'undefined') {
        try {
            const stored = globalThis.__PHILJS_STATE__?.[config.key];
            if (stored) {
                state = config.deserialize ? config.deserialize(stored) : JSON.parse(stored);
            }
        }
        catch {
            // Use initial state if loading fails
        }
    }
    const notify = () => {
        listeners.forEach(listener => {
            try {
                listener(state);
            }
            catch (error) {
                console.error('State listener error:', error);
            }
        });
    };
    const persist = () => {
        if (config.persist && config.key) {
            try {
                const data = config.serialize ? config.serialize(state) : JSON.stringify(state);
                if (typeof globalThis !== 'undefined') {
                    globalThis.__PHILJS_STATE__ = globalThis.__PHILJS_STATE__ || {};
                    globalThis.__PHILJS_STATE__[config.key] = data;
                }
            }
            catch (error) {
                console.error('State persistence error:', error);
            }
        }
    };
    return {
        get() {
            return state;
        },
        inner() {
            return state;
        },
        update(fn) {
            state = fn(state);
            persist();
            notify();
        },
        set(value) {
            state = value;
            persist();
            notify();
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
}
/**
 * Create a state manager
 */
export function createStateManager() {
    const states = new Map();
    return {
        manage(key, value) {
            if (states.has(key)) {
                return states.get(key);
            }
            const managed = createManagedState({ initial: value, key });
            states.set(key, managed);
            return managed;
        },
        get(key) {
            return states.get(key);
        },
        has(key) {
            return states.has(key);
        },
        remove(key) {
            return states.delete(key);
        },
        keys() {
            return Array.from(states.keys());
        },
        clear() {
            states.clear();
        },
    };
}
/**
 * Create request-local state
 */
export function createRequestState(initial) {
    const state = new Map(Object.entries(initial || {}));
    return {
        get(key) {
            return state.get(key);
        },
        set(key, value) {
            state.set(key, value);
        },
        has(key) {
            return state.has(key);
        },
        delete(key) {
            return state.delete(key);
        },
        all() {
            return Object.fromEntries(state);
        },
    };
}
/**
 * Global state container
 */
export class GlobalState {
    _state;
    _version = 0;
    _updatedAt = Date.now();
    _listeners = new Set();
    constructor(initial) {
        this._state = initial;
    }
    /**
     * Get current state
     */
    get state() {
        return this._state;
    }
    /**
     * Get state version
     */
    get version() {
        return this._version;
    }
    /**
     * Get last update timestamp
     */
    get updatedAt() {
        return this._updatedAt;
    }
    /**
     * Update state
     */
    update(fn) {
        this._state = fn(this._state);
        this._version++;
        this._updatedAt = Date.now();
        this.notify();
    }
    /**
     * Set state with expected version (optimistic concurrency)
     */
    setWithVersion(value, expectedVersion) {
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
    subscribe(listener) {
        this._listeners.add(listener);
        return () => this._listeners.delete(listener);
    }
    /**
     * Get state snapshot
     */
    snapshot() {
        return {
            state: this._state,
            version: this._version,
            updatedAt: this._updatedAt,
        };
    }
    notify() {
        this._listeners.forEach(listener => {
            try {
                listener(this._state, this._version);
            }
            catch (error) {
                console.error('State listener error:', error);
            }
        });
    }
}
/**
 * Create a global state container
 */
export function createGlobalState(initial) {
    return new GlobalState(initial);
}
/**
 * Create a memoized selector
 */
export function createSelector(selector, equalityFn = Object.is) {
    let lastState;
    let lastResult;
    return (state) => {
        if (lastState === state) {
            return lastResult;
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
export function createDerivedSelector(...args) {
    const combiner = args.pop();
    const selectors = args;
    let lastArgs;
    let lastResult;
    return (state) => {
        const currentArgs = selectors.map(s => s(state));
        if (lastArgs && currentArgs.every((arg, i) => Object.is(arg, lastArgs[i]))) {
            return lastResult;
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
export function generateRustState(name, fields) {
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
export function generateRustStateGuard(name) {
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
//# sourceMappingURL=state.js.map