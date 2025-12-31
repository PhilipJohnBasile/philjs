/**
 * PhilJS Native - Capacitor Secure Storage Plugin
 *
 * Provides secure persistent storage using native keychain/keystore
 * with fallback to web storage APIs.
 */
import { type Signal } from 'philjs-core';
/**
 * Storage key-value pair
 */
export interface StorageItem {
    key: string;
    value: string;
}
/**
 * Storage configuration
 */
export interface StorageConfig {
    /** Group name for shared access (iOS) */
    group?: string;
    /** Whether to sync to iCloud (iOS) */
    synchronize?: boolean;
    /** Accessibility level (iOS) */
    accessibility?: 'afterFirstUnlock' | 'afterFirstUnlockThisDeviceOnly' | 'whenUnlocked' | 'whenUnlockedThisDeviceOnly';
}
/**
 * Encryption options
 */
export interface EncryptionOptions {
    /** Encrypt values before storing */
    encrypt?: boolean;
    /** Encryption key (if not using system keychain) */
    encryptionKey?: string;
}
/**
 * Storage ready state
 */
export declare const storageReady: Signal<boolean>;
/**
 * Secure Storage API
 */
export declare const CapacitorStorage: {
    /**
     * Configure storage options
     */
    configure(options?: StorageConfig): Promise<void>;
    /**
     * Get a value from storage
     */
    get(options: {
        key: string;
    }): Promise<{
        value: string | null;
    }>;
    /**
     * Set a value in storage
     */
    set(options: {
        key: string;
        value: string;
    }): Promise<void>;
    /**
     * Remove a value from storage
     */
    remove(options: {
        key: string;
    }): Promise<void>;
    /**
     * Get all keys
     */
    keys(): Promise<{
        keys: string[];
    }>;
    /**
     * Clear all storage
     */
    clear(): Promise<void>;
    /**
     * Migrate from old storage (Capacitor 2.x)
     */
    migrate(): Promise<void>;
    /**
     * Get multiple values
     */
    getMultiple(options: {
        keys: string[];
    }): Promise<{
        values: (string | null)[];
    }>;
    /**
     * Set multiple values
     */
    setMultiple(options: {
        items: StorageItem[];
    }): Promise<void>;
    /**
     * Remove multiple values
     */
    removeMultiple(options: {
        keys: string[];
    }): Promise<void>;
};
/**
 * Get JSON value from storage
 */
export declare function getJSON<T>(key: string, defaultValue?: T): Promise<T | null>;
/**
 * Set JSON value in storage
 */
export declare function setJSON<T>(key: string, value: T): Promise<void>;
/**
 * Update JSON value in storage (merge with existing)
 */
export declare function updateJSON<T extends object>(key: string, updates: Partial<T>): Promise<T | null>;
/**
 * Delete JSON value and return it
 */
export declare function popJSON<T>(key: string): Promise<T | null>;
/**
 * Secure storage using native keychain (iOS) or keystore (Android)
 */
export declare const SecureStorage: {
    /**
     * Get a secure value
     */
    get(key: string): Promise<string | null>;
    /**
     * Set a secure value
     */
    set(key: string, value: string): Promise<void>;
    /**
     * Remove a secure value
     */
    remove(key: string): Promise<void>;
    /**
     * Clear all secure values
     */
    clear(): Promise<void>;
    /**
     * Get all secure keys
     */
    keys(): Promise<string[]>;
    /**
     * Get secure JSON value
     */
    getJSON<T>(key: string): Promise<T | null>;
    /**
     * Set secure JSON value
     */
    setJSON<T>(key: string, value: T): Promise<void>;
};
/**
 * Session storage (cleared on app close)
 */
export declare const SessionStorage: {
    storage: Map<string, string>;
    get(key: string): string | null;
    set(key: string, value: string): void;
    remove(key: string): void;
    clear(): void;
    keys(): string[];
    getJSON<T>(key: string): T | null;
    setJSON<T>(key: string, value: T): void;
};
/**
 * Hook to get/set storage value
 */
export declare function useStorage<T>(key: string, initialValue?: T): [T | null, (value: T) => Promise<void>, () => Promise<void>];
/**
 * Hook to check if storage is ready
 */
export declare function useStorageReady(): boolean;
export default CapacitorStorage;
//# sourceMappingURL=storage.d.ts.map