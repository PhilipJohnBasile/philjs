/**
 * Context Bridge Implementation
 * Enables context sharing across framework boundaries.
 */

import type { UniversalContext, ContextBridgeInstance } from '../types.js';

/**
 * Create a universal context that can be shared across frameworks.
 */
export function createUniversalContext<T>(
  id: string,
  defaultValue?: T
): UniversalContext<T> {
  let currentValue: T | undefined = defaultValue;
  const subscribers = new Set<(value: T | undefined) => void>();

  const context: UniversalContext<T> = {
    id,

    get: () => currentValue,

    set: (value: T) => {
      currentValue = value;
      for (const subscriber of subscribers) {
        try {
          subscriber(value);
        } catch (error) {
          console.error(`[UniversalContext: ${id}] Subscriber error:`, error);
        }
      }
    },

    subscribe: (callback) => {
      subscribers.add(callback);
      // Immediately notify with current value
      callback(currentValue);
      return () => {
        subscribers.delete(callback);
      };
    },

    hasValue: () => currentValue !== undefined,

    reset: () => {
      currentValue = defaultValue;
      for (const subscriber of subscribers) {
        try {
          subscriber(currentValue);
        } catch (error) {
          console.error(`[UniversalContext: ${id}] Subscriber error during reset:`, error);
        }
      }
    },
  };

  return context;
}

/**
 * Context Bridge implementation for managing multiple contexts
 */
export class ContextBridge implements ContextBridgeInstance {
  private contexts = new Map<string, UniversalContext<unknown>>();
  private parents: ContextBridgeInstance[] = [];

  /**
   * Create a new context
   */
  createContext<T>(id: string, defaultValue?: T): UniversalContext<T> {
    if (this.contexts.has(id)) {
      console.warn(`[ContextBridge] Context "${id}" already exists, returning existing context`);
      return this.contexts.get(id) as UniversalContext<T>;
    }

    const context = createUniversalContext<T>(id, defaultValue);
    this.contexts.set(id, context as UniversalContext<unknown>);
    return context;
  }

  /**
   * Get an existing context by ID.
   * Searches local contexts first, then parent bridges.
   */
  getContext<T>(id: string): UniversalContext<T> | undefined {
    // Check local contexts
    const localContext = this.contexts.get(id);
    if (localContext) {
      return localContext as UniversalContext<T>;
    }

    // Check parent contexts
    for (const parent of this.parents) {
      const parentContext = parent.getContext<T>(id);
      if (parentContext) {
        return parentContext;
      }
    }

    return undefined;
  }

  /**
   * Check if a context exists (locally or in parents)
   */
  hasContext(id: string): boolean {
    if (this.contexts.has(id)) {
      return true;
    }

    for (const parent of this.parents) {
      if (parent.hasContext(id)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Set up inheritance from a parent context bridge.
   * Contexts from the parent will be accessible if not overridden locally.
   */
  inherit(parent: ContextBridgeInstance): void {
    if (!this.parents.includes(parent)) {
      this.parents.push(parent);
    }
  }

  /**
   * Remove a parent from the inheritance chain
   */
  uninherit(parent: ContextBridgeInstance): void {
    const index = this.parents.indexOf(parent);
    if (index !== -1) {
      this.parents.splice(index, 1);
    }
  }

  /**
   * List all context IDs (local only)
   */
  listContexts(): string[] {
    return Array.from(this.contexts.keys());
  }

  /**
   * List all context IDs including inherited ones
   */
  listAllContexts(): string[] {
    const ids = new Set<string>(this.contexts.keys());

    for (const parent of this.parents) {
      for (const id of parent.listContexts()) {
        ids.add(id);
      }
    }

    return Array.from(ids);
  }

  /**
   * Delete a local context
   */
  deleteContext(id: string): boolean {
    return this.contexts.delete(id);
  }

  /**
   * Clear all local contexts
   */
  clear(): void {
    this.contexts.clear();
  }

  /**
   * Create a child bridge that inherits from this one
   */
  createChild(): ContextBridge {
    const child = new ContextBridge();
    child.inherit(this);
    return child;
  }
}

/**
 * Global context bridge instance.
 * Use this for application-wide contexts.
 */
let globalContextBridge: ContextBridge | null = null;

/**
 * Get or create the global context bridge.
 */
export function getGlobalContextBridge(): ContextBridge {
  if (!globalContextBridge) {
    globalContextBridge = new ContextBridge();
  }
  return globalContextBridge;
}

/**
 * Create a scoped context bridge for a component subtree.
 * The scoped bridge inherits from the global bridge.
 */
export function createScopedContextBridge(): ContextBridge {
  const scoped = new ContextBridge();
  scoped.inherit(getGlobalContextBridge());
  return scoped;
}

/**
 * Provider pattern helper - wraps context creation and value setting
 */
export interface ContextProvider<T> {
  /** The context being provided */
  context: UniversalContext<T>;

  /** Update the provided value */
  provide(value: T): void;

  /** Reset to default value */
  reset(): void;

  /** Cleanup the provider */
  dispose(): void;
}

export function createContextProvider<T>(
  id: string,
  initialValue: T,
  bridge: ContextBridgeInstance = getGlobalContextBridge()
): ContextProvider<T> {
  const context = (bridge as ContextBridge).createContext<T>(id, initialValue);

  return {
    context,

    provide: (value: T) => {
      context.set(value);
    },

    reset: () => {
      context.reset();
    },

    dispose: () => {
      if (bridge instanceof ContextBridge) {
        bridge.deleteContext(id);
      }
    },
  };
}
