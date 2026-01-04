/**
 * Island Registry - Central registry for island components
 */
/**
 * Global registry for island components
 */
export class IslandRegistry {
    _entries = new Map();
    static _instance = null;
    static getInstance() {
        if (!IslandRegistry._instance) {
            IslandRegistry._instance = new IslandRegistry();
        }
        return IslandRegistry._instance;
    }
    /**
     * Register an island component
     */
    register(config) {
        if (this._entries.has(config.name)) {
            console.warn(`[PhilJS Islands] Island "${config.name}" already registered, overwriting`);
        }
        this._entries.set(config.name, {
            config,
            instances: new Set()
        });
    }
    /**
     * Get an island entry by name
     */
    get(name) {
        return this._entries.get(name);
    }
    /**
     * Check if an island is registered
     */
    has(name) {
        return this._entries.has(name);
    }
    /**
     * Unregister an island
     */
    unregister(name) {
        return this._entries.delete(name);
    }
    /**
     * Get all registered island names
     */
    names() {
        return Array.from(this._entries.keys());
    }
    /**
     * Get all entries
     */
    entries() {
        return this._entries.entries();
    }
    /**
     * Track an island instance
     */
    trackInstance(name, instance) {
        const entry = this._entries.get(name);
        if (entry) {
            entry.instances.add(instance);
        }
    }
    /**
     * Untrack an island instance
     */
    untrackInstance(name, instance) {
        const entry = this._entries.get(name);
        if (entry) {
            entry.instances.delete(instance);
        }
    }
    /**
     * Get all instances of an island
     */
    getInstances(name) {
        const entry = this._entries.get(name);
        return entry ? Array.from(entry.instances) : [];
    }
    /**
     * Clear all registrations
     */
    clear() {
        this._entries.clear();
    }
    /**
     * Get total count of registered islands
     */
    get size() {
        return this._entries.size;
    }
}
/**
 * Get the global island registry
 */
export function getRegistry() {
    return IslandRegistry.getInstance();
}
//# sourceMappingURL=registry.js.map