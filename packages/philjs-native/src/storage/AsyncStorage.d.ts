/**
 * AsyncStorage API
 *
 * Persistent key-value storage with async interface.
 * Compatible with React Native's AsyncStorage.
 */
import { type Signal } from 'philjs-core';
/**
 * Storage callback (for legacy compatibility)
 */
export type StorageCallback = (error: Error | null, result?: string | null) => void;
/**
 * Multi-get result
 */
export type MultiGetResult = readonly (readonly [string, string | null])[];
/**
 * Multi-set input
 */
export type MultiSetInput = readonly (readonly [string, string])[];
/**
 * Storage error
 */
export declare class AsyncStorageError extends Error {
    code?: string | undefined;
    constructor(message: string, code?: string | undefined);
}
/**
 * Storage configuration
 */
interface AsyncStorageConfig {
    /**
     * Key prefix for namespacing
     */
    prefix: string;
    /**
     * Maximum value size in bytes
     */
    maxValueSize: number;
    /**
     * Enable debug logging
     */
    debug: boolean;
}
/**
 * Configure AsyncStorage
 */
export declare function configureAsyncStorage(options: Partial<AsyncStorageConfig>): void;
/**
 * AsyncStorage - Persistent key-value storage
 */
export declare const AsyncStorage: {
    /**
     * Get item from storage
     */
    getItem(key: string, callback?: StorageCallback): Promise<string | null>;
    /**
     * Set item in storage
     */
    setItem(key: string, value: string, callback?: StorageCallback): Promise<void>;
    /**
     * Remove item from storage
     */
    removeItem(key: string, callback?: StorageCallback): Promise<void>;
    /**
     * Merge item with existing value (JSON merge)
     */
    mergeItem(key: string, value: string, callback?: StorageCallback): Promise<void>;
    /**
     * Get multiple items
     */
    multiGet(keys: readonly string[], callback?: (errors: readonly (Error | null)[] | null, result: MultiGetResult) => void): Promise<MultiGetResult>;
    /**
     * Set multiple items
     */
    multiSet(keyValuePairs: MultiSetInput, callback?: (errors: readonly (Error | null)[] | null) => void): Promise<void>;
    /**
     * Remove multiple items
     */
    multiRemove(keys: readonly string[], callback?: (errors: readonly (Error | null)[] | null) => void): Promise<void>;
    /**
     * Merge multiple items
     */
    multiMerge(keyValuePairs: MultiSetInput, callback?: (errors: readonly (Error | null)[] | null) => void): Promise<void>;
    /**
     * Get all keys
     */
    getAllKeys(callback?: (error: Error | null, keys?: readonly string[]) => void): Promise<readonly string[]>;
    /**
     * Clear all storage
     */
    clear(callback?: (error: Error | null) => void): Promise<void>;
    /**
     * Flush pending writes (no-op for web, relevant for native)
     */
    flushGetRequests(): Promise<void>;
};
/**
 * Hook to use async storage with reactive updates
 */
export declare function useAsyncStorage<T = string>(key: string, defaultValue?: T): {
    value: Signal<T | null>;
    loading: Signal<boolean>;
    error: Signal<Error | null>;
    getItem: () => Promise<T | null>;
    setItem: (value: T) => Promise<void>;
    removeItem: () => Promise<void>;
    mergeItem: (value: Partial<T>) => Promise<void>;
};
/**
 * Simple hook for string storage
 */
export declare function useStoredValue(key: string, defaultValue?: string): [Signal<string>, (value: string) => Promise<void>];
export default AsyncStorage;
//# sourceMappingURL=AsyncStorage.d.ts.map