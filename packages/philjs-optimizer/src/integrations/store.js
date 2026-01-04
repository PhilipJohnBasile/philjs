/**
 * Store lazy loading integration
 */
import { loadSymbol } from '../runtime.js';
/**
 * Create a lazy store
 */
export function lazyStore(loader, initialState) {
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
export async function loadStore(lazyStore) {
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
export function useLazyStore(lazyStore) {
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
    stores = new Map();
    register(store) {
        this.stores.set(store.symbolId, store);
    }
    get(symbolId) {
        return this.stores.get(symbolId);
    }
    async loadAll() {
        const promises = Array.from(this.stores.values()).map((store) => loadStore(store));
        await Promise.all(promises);
    }
    getLoadedCount() {
        return Array.from(this.stores.values()).filter((s) => s.loaded).length;
    }
    getTotalCount() {
        return this.stores.size;
    }
}
/**
 * Global store registry
 */
export const storeRegistry = new StoreRegistry();
//# sourceMappingURL=store.js.map