/**
 * Storage API
 *
 * Async storage for persisting data on device.
 * Similar to React Native's AsyncStorage.
 */
import { type Signal } from 'philjs-core';
/**
 * Storage options
 */
export interface StorageOptions {
    /**
     * Encryption key for secure storage
     */
    encryptionKey?: string;
    /**
     * Storage prefix for namespacing
     */
    prefix?: string;
}
/**
 * Multi-get result
 */
export type MultiGetResult = [string, string | null][];
/**
 * Multi-set input
 */
export type MultiSetInput = [string, string][];
/**
 * Storage API singleton
 */
export declare const Storage: {
    /**
     * Configuration
     */
    config: {
        prefix: string;
        encryptionKey: string | undefined;
    };
    /**
     * Configure storage
     */
    configure(options: StorageOptions): void;
    /**
     * Get item from storage
     */
    getItem(key: string): Promise<string | null>;
    /**
     * Set item in storage
     */
    setItem(key: string, value: string): Promise<void>;
    /**
     * Remove item from storage
     */
    removeItem(key: string): Promise<void>;
    /**
     * Get multiple items
     */
    multiGet(keys: string[]): Promise<MultiGetResult>;
    /**
     * Set multiple items
     */
    multiSet(keyValuePairs: MultiSetInput): Promise<void>;
    /**
     * Remove multiple items
     */
    multiRemove(keys: string[]): Promise<void>;
    /**
     * Get all keys
     */
    getAllKeys(): Promise<string[]>;
    /**
     * Clear all storage
     */
    clear(): Promise<void>;
    /**
     * Merge an existing key value with new value
     */
    mergeItem(key: string, value: string): Promise<void>;
    /**
     * Get storage info
     */
    getInfo(): Promise<{
        used: number;
        total: number;
        keys: number;
    }>;
};
/**
 * Get JSON from storage
 */
export declare function getJSON<T>(key: string): Promise<T | null>;
/**
 * Set JSON to storage
 */
export declare function setJSON<T>(key: string, value: T): Promise<void>;
/**
 * Update JSON in storage
 */
export declare function updateJSON<T>(key: string, updater: (current: T | null) => T): Promise<void>;
/**
 * Secure storage with encryption
 */
export declare const SecureStorage: {
    /**
     * Get secure item
     */
    getItem(key: string): Promise<string | null>;
    /**
     * Set secure item
     */
    setItem(key: string, value: string): Promise<void>;
    /**
     * Remove secure item
     */
    removeItem(key: string): Promise<void>;
    /**
     * Clear all secure storage
     */
    clear(): Promise<void>;
};
/**
 * Hook for reactive storage
 */
export declare function useStorage<T>(key: string, defaultValue: T): [Signal<T>, (value: T) => Promise<void>];
/**
 * High-performance storage (MMKV-like)
 */
export declare const MMKVStorage: {
    instances: Map<string, Map<string, string>>;
    /**
     * Create a new storage instance
     */
    create(id: string): {
        getString: (key: string) => string | undefined;
        setString: (key: string, value: string) => void;
        getNumber: (key: string) => number | undefined;
        setNumber: (key: string, value: number) => void;
        getBoolean: (key: string) => boolean | undefined;
        setBoolean: (key: string, value: boolean) => void;
        delete: (key: string) => void;
        getAllKeys: () => string[];
        clearAll: () => void;
    };
};
export default Storage;
//# sourceMappingURL=Storage.d.ts.map