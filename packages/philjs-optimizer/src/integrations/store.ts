/**
 * Store lazy loading integration
 */

import type { LazyHandler } from '../types.js';
import { loadSymbol } from '../runtime.js';

/**
 * Lazy store
 */
export interface LazyStore<T = any> {
  symbolId: string;
  store?: T;
  loaded: boolean;
  initialState?: T;
}

/**
 * Create a lazy store
 */
export function lazyStore<T = any>(
  loader: () => Promise<T>,
  initialState?: T
): LazyStore<T> {
  const symbolId = `lazy_store_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  return {
    symbolId,
    loaded: false,
    ...(initialState !== undefined && { initialState }),
  };
}

/**
 * Load a lazy store
 */
export async function loadStore<T = any>(
  lazyStore: LazyStore<T>
): Promise<T> {
  if (lazyStore.loaded && lazyStore.store) {
    return lazyStore.store;
  }

  const store = await loadSymbol(lazyStore.symbolId);
  lazyStore.store = store;
  lazyStore.loaded = true;

  return store;
}

/**
 * Use a lazy store (hook-like API)
 */
export function useLazyStore<T = any>(
  lazyStore: LazyStore<T>
): T | undefined {
  if (!lazyStore.loaded) {
    // Trigger load
    loadStore(lazyStore).catch((error) => {
      console.error('Failed to load lazy store:', error);
    });

    return lazyStore.initialState;
  }

  return lazyStore.store;
}

/**
 * Store registry
 */
export class StoreRegistry {
  private stores = new Map<string, LazyStore>();

  register<T = any>(store: LazyStore<T>): void {
    this.stores.set(store.symbolId, store);
  }

  get(symbolId: string): LazyStore | undefined {
    return this.stores.get(symbolId);
  }

  async loadAll(): Promise<void> {
    const promises = Array.from(this.stores.values()).map((store) =>
      loadStore(store)
    );
    await Promise.all(promises);
  }

  getLoadedCount(): number {
    return Array.from(this.stores.values()).filter((s) => s.loaded).length;
  }

  getTotalCount(): number {
    return this.stores.size;
  }
}

/**
 * Global store registry
 */
export const storeRegistry = new StoreRegistry();
