/**
 * Island Registry - Central registry for island components
 */
import type { IslandConfig, IslandInstance, RegistryEntry } from './types.js';
/**
 * Global registry for island components
 */
export declare class IslandRegistry {
    private _entries;
    private static _instance;
    static getInstance(): IslandRegistry;
    /**
     * Register an island component
     */
    register(config: IslandConfig): void;
    /**
     * Get an island entry by name
     */
    get(name: string): RegistryEntry | undefined;
    /**
     * Check if an island is registered
     */
    has(name: string): boolean;
    /**
     * Unregister an island
     */
    unregister(name: string): boolean;
    /**
     * Get all registered island names
     */
    names(): string[];
    /**
     * Get all entries
     */
    entries(): IterableIterator<[string, RegistryEntry]>;
    /**
     * Track an island instance
     */
    trackInstance(name: string, instance: IslandInstance): void;
    /**
     * Untrack an island instance
     */
    untrackInstance(name: string, instance: IslandInstance): void;
    /**
     * Get all instances of an island
     */
    getInstances(name: string): IslandInstance[];
    /**
     * Clear all registrations
     */
    clear(): void;
    /**
     * Get total count of registered islands
     */
    get size(): number;
}
/**
 * Get the global island registry
 */
export declare function getRegistry(): IslandRegistry;
//# sourceMappingURL=registry.d.ts.map