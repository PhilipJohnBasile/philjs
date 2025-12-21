/**
 * Framework Bridge - Inter-Framework Communication
 * Enables state sharing and event communication between different framework islands
 */

/**
 * Shared state store that works across all frameworks
 */
class SharedStateStore<T = any> {
  private state: T;
  private subscribers = new Set<(state: T) => void>();
  private middleware: Array<(state: T, nextState: T) => T> = [];

  constructor(initialState: T) {
    this.state = initialState;
  }

  /**
   * Get current state
   */
  getState(): T {
    return this.state;
  }

  /**
   * Set new state and notify subscribers
   */
  setState(newState: T | ((prevState: T) => T)): void {
    const nextState = typeof newState === 'function'
      ? (newState as (prevState: T) => T)(this.state)
      : newState;

    // Apply middleware
    let processedState = nextState;
    for (const mw of this.middleware) {
      processedState = mw(this.state, processedState);
    }

    this.state = processedState;
    this.notify();
  }

  /**
   * Update partial state (shallow merge)
   */
  updateState(updates: Partial<T>): void {
    this.setState({
      ...this.state,
      ...updates
    } as T);
  }

  /**
   * Subscribe to state changes
   */
  subscribe(callback: (state: T) => void): () => void {
    this.subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Add middleware for state transformations
   */
  use(middleware: (state: T, nextState: T) => T): void {
    this.middleware.push(middleware);
  }

  /**
   * Notify all subscribers
   */
  private notify(): void {
    this.subscribers.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('[Framework Bridge] Subscriber error:', error);
      }
    });
  }

  /**
   * Clear all subscribers
   */
  clear(): void {
    this.subscribers.clear();
  }
}

/**
 * Global state registry
 */
const stateRegistry = new Map<string, SharedStateStore>();

/**
 * Create or get a shared state store
 */
export function createSharedState<T>(name: string, initialState: T): SharedStateStore<T> {
  if (stateRegistry.has(name)) {
    return stateRegistry.get(name) as SharedStateStore<T>;
  }

  const store = new SharedStateStore(initialState);
  stateRegistry.set(name, store);
  return store;
}

/**
 * Get an existing shared state store
 */
export function getSharedState<T>(name: string): SharedStateStore<T> | undefined {
  return stateRegistry.get(name) as SharedStateStore<T>;
}

/**
 * Remove a shared state store
 */
export function removeSharedState(name: string): void {
  const store = stateRegistry.get(name);
  if (store) {
    store.clear();
    stateRegistry.delete(name);
  }
}

/**
 * Clear all shared state stores (useful for testing)
 */
export function clearAllSharedState(): void {
  stateRegistry.forEach(store => store.clear());
  stateRegistry.clear();
}

/**
 * Event bus for cross-framework communication
 */
class EventBus {
  private listeners = new Map<string, Set<(data: any) => void>>();
  private middleware: Array<(event: string, data: any) => any> = [];

  /**
   * Emit an event
   */
  emit<T = any>(event: string, data?: T): void {
    const listeners = this.listeners.get(event);

    if (!listeners || listeners.size === 0) {
      return;
    }

    // Apply middleware
    let processedData = data;
    for (const mw of this.middleware) {
      processedData = mw(event, processedData);
    }

    // Notify listeners
    listeners.forEach(listener => {
      try {
        listener(processedData);
      } catch (error) {
        console.error(`[Framework Bridge] Event listener error for "${event}":`, error);
      }
    });
  }

  /**
   * Listen to an event
   */
  on<T = any>(event: string, callback: (data: T) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Listen to an event once
   */
  once<T = any>(event: string, callback: (data: T) => void): void {
    const unsubscribe = this.on(event, (data) => {
      callback(data);
      unsubscribe();
    });
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (data: any) => void): void {
    if (!callback) {
      // Remove all listeners for this event
      this.listeners.delete(event);
      return;
    }

    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Add middleware for event processing
   */
  use(middleware: (event: string, data: any) => any): void {
    this.middleware.push(middleware);
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
  }
}

/**
 * Global event bus instance
 */
export const eventBus = new EventBus();

/**
 * Props normalizer - Converts props between different framework conventions
 */
export class PropsNormalizer {
  /**
   * Normalize props from any framework to a standard format
   */
  static normalize(props: any, sourceFramework: string): Record<string, any> {
    const normalized: Record<string, any> = {};

    switch (sourceFramework) {
      case 'react':
        return this.normalizeReactProps(props);

      case 'vue':
        return this.normalizeVueProps(props);

      case 'svelte':
        return this.normalizeSvelteProps(props);

      case 'preact':
        return this.normalizePreactProps(props);

      case 'solid':
        return this.normalizeSolidProps(props);

      default:
        return props;
    }
  }

  /**
   * Denormalize props to a specific framework format
   */
  static denormalize(props: Record<string, any>, targetFramework: string): any {
    switch (targetFramework) {
      case 'react':
        return this.toReactProps(props);

      case 'vue':
        return this.toVueProps(props);

      case 'svelte':
        return this.toSvelteProps(props);

      case 'preact':
        return this.toPreactProps(props);

      case 'solid':
        return this.toSolidProps(props);

      default:
        return props;
    }
  }

  private static normalizeReactProps(props: any): Record<string, any> {
    const normalized: Record<string, any> = {};

    Object.keys(props).forEach(key => {
      // Convert className to class
      if (key === 'className') {
        normalized.class = props[key];
      }
      // Convert htmlFor to for
      else if (key === 'htmlFor') {
        normalized.for = props[key];
      }
      // Convert event handlers (onClick -> click)
      else if (key.startsWith('on') && key.length > 2) {
        const eventName = key.slice(2).toLowerCase();
        normalized[`on:${eventName}`] = props[key];
      }
      else {
        normalized[key] = props[key];
      }
    });

    return normalized;
  }

  private static normalizeVueProps(props: any): Record<string, any> {
    const normalized: Record<string, any> = {};

    Object.keys(props).forEach(key => {
      // Vue uses @ for events, normalize to on:
      if (key.startsWith('@')) {
        normalized[`on:${key.slice(1)}`] = props[key];
      }
      // Vue uses : for bindings
      else if (key.startsWith(':')) {
        normalized[key.slice(1)] = props[key];
      }
      else {
        normalized[key] = props[key];
      }
    });

    return normalized;
  }

  private static normalizeSvelteProps(props: any): Record<string, any> {
    // Svelte props are already fairly standard
    return { ...props };
  }

  private static normalizePreactProps(props: any): Record<string, any> {
    // Preact uses React-like conventions
    return this.normalizeReactProps(props);
  }

  private static normalizeSolidProps(props: any): Record<string, any> {
    // Solid uses similar conventions to React
    return this.normalizeReactProps(props);
  }

  private static toReactProps(props: Record<string, any>): any {
    const reactProps: Record<string, any> = {};

    Object.keys(props).forEach(key => {
      if (key === 'class') {
        reactProps.className = props[key];
      } else if (key === 'for') {
        reactProps.htmlFor = props[key];
      } else if (key.startsWith('on:')) {
        const eventName = key.slice(3);
        reactProps[`on${eventName.charAt(0).toUpperCase()}${eventName.slice(1)}`] = props[key];
      } else {
        reactProps[key] = props[key];
      }
    });

    return reactProps;
  }

  private static toVueProps(props: Record<string, any>): any {
    const vueProps: Record<string, any> = {};

    Object.keys(props).forEach(key => {
      if (key.startsWith('on:')) {
        vueProps[`@${key.slice(3)}`] = props[key];
      } else {
        vueProps[key] = props[key];
      }
    });

    return vueProps;
  }

  private static toSvelteProps(props: Record<string, any>): any {
    return { ...props };
  }

  private static toPreactProps(props: Record<string, any>): any {
    return this.toReactProps(props);
  }

  private static toSolidProps(props: Record<string, any>): any {
    return this.toReactProps(props);
  }
}

/**
 * Framework-specific hooks for shared state
 */
export const frameworkHooks = {
  /**
   * React hook for shared state
   */
  react: {
    useSharedState<T>(name: string, initialState: T): [T, (newState: T | ((prev: T) => T)) => void] {
      const React = require('react');
      const store = createSharedState(name, initialState);
      const [state, setState] = React.useState(store.getState());

      React.useEffect(() => {
        const unsubscribe = store.subscribe((newState) => {
          setState(newState);
        });

        return unsubscribe;
      }, []);

      const setSharedState = React.useCallback((newState: T | ((prev: T) => T)) => {
        store.setState(newState);
      }, []);

      return [state, setSharedState];
    },

    useEventBus() {
      return eventBus;
    }
  },

  /**
   * Vue composable for shared state
   */
  vue: {
    useSharedState<T>(name: string, initialState: T) {
      const { ref, onUnmounted } = require('vue');
      const store = createSharedState(name, initialState);
      const state = ref(store.getState());

      const unsubscribe = store.subscribe((newState) => {
        state.value = newState;
      });

      onUnmounted(() => {
        unsubscribe();
      });

      return {
        state,
        setState: (newState: T | ((prev: T) => T)) => store.setState(newState)
      };
    },

    useEventBus() {
      return eventBus;
    }
  },

  /**
   * Svelte store for shared state
   */
  svelte: {
    createSharedStore<T>(name: string, initialState: T) {
      const store = createSharedState(name, initialState);

      return {
        subscribe(callback: (value: T) => void) {
          callback(store.getState());
          return store.subscribe(callback);
        },
        set(value: T) {
          store.setState(value);
        },
        update(updater: (value: T) => T) {
          store.setState(updater);
        }
      };
    },

    useEventBus() {
      return eventBus;
    }
  },

  /**
   * Solid signal for shared state
   */
  solid: {
    createSharedSignal<T>(name: string, initialState: T) {
      const { createSignal, onCleanup } = require('solid-js');
      const store = createSharedState(name, initialState);
      const [state, setState] = createSignal(store.getState());

      const unsubscribe = store.subscribe((newState) => {
        setState(() => newState);
      });

      onCleanup(() => {
        unsubscribe();
      });

      return [
        state,
        (newState: T | ((prev: T) => T)) => store.setState(newState)
      ] as const;
    },

    useEventBus() {
      return eventBus;
    }
  }
};

/**
 * Create a bridge between two islands
 */
export function createIslandBridge(
  source: { framework: string; id: string },
  target: { framework: string; id: string }
) {
  const bridgeId = `${source.id}->${target.id}`;

  return {
    /**
     * Send data from source to target
     */
    send(data: any) {
      const normalizedData = PropsNormalizer.normalize(data, source.framework);
      const targetData = PropsNormalizer.denormalize(normalizedData, target.framework);

      eventBus.emit(`bridge:${bridgeId}`, targetData);
    },

    /**
     * Receive data in target
     */
    receive(callback: (data: any) => void) {
      return eventBus.on(`bridge:${bridgeId}`, callback);
    }
  };
}

/**
 * Debug utilities
 */
export const debug = {
  /**
   * Get all shared states
   */
  getStates() {
    const states: Record<string, any> = {};
    stateRegistry.forEach((store, name) => {
      states[name] = store.getState();
    });
    return states;
  },

  /**
   * Get all event listeners
   */
  getListeners() {
    return (eventBus as any).listeners;
  },

  /**
   * Log bridge activity
   */
  enableLogging() {
    eventBus.use((event, data) => {
      console.log('[Framework Bridge]', event, data);
      return data;
    });
  }
};
