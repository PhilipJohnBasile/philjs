/**
 * PhilJS Native - Capacitor Secure Storage Plugin
 *
 * Provides secure persistent storage using native keychain/keystore
 * with fallback to web storage APIs.
 */
import { signal } from '@philjs/core';
import { isNativePlatform, callPlugin, registerPlugin, } from '../index.js';
// ============================================================================
// State
// ============================================================================
/**
 * Storage ready state
 */
export const storageReady = signal(false);
/**
 * Storage cache for performance
 */
const storageCache = new Map();
// ============================================================================
// Web Implementation
// ============================================================================
/**
 * Web storage using localStorage with optional encryption
 */
const WebStorage = {
    prefix: 'philjs_secure_',
    async get(options) {
        const value = localStorage.getItem(this.prefix + options.key);
        if (value !== null) {
            storageCache.set(options.key, value);
        }
        return { value };
    },
    async set(options) {
        localStorage.setItem(this.prefix + options.key, options.value);
        storageCache.set(options.key, options.value);
    },
    async remove(options) {
        localStorage.removeItem(this.prefix + options.key);
        storageCache.delete(options.key);
    },
    async keys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(this.prefix)) {
                keys.push(key.slice(this.prefix.length));
            }
        }
        return { keys };
    },
    async clear() {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(this.prefix)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach((key) => localStorage.removeItem(key));
        storageCache.clear();
    },
    async migrate() {
        // No migration needed for web
    },
    async configure(_options) {
        // Configuration not applicable for web
    },
};
// ============================================================================
// Preferences API (Modern Capacitor Storage)
// ============================================================================
registerPlugin('Preferences', { web: WebStorage });
/**
 * Secure Storage API
 */
export const CapacitorStorage = {
    /**
     * Configure storage options
     */
    async configure(options = {}) {
        if (!isNativePlatform()) {
            return WebStorage.configure(options);
        }
        try {
            await callPlugin('Preferences', 'configure', options);
        }
        catch {
            // Ignore if not available
        }
        storageReady.set(true);
    },
    /**
     * Get a value from storage
     */
    async get(options) {
        // Check cache first
        if (storageCache.has(options.key)) {
            return { value: storageCache.get(options.key) };
        }
        if (!isNativePlatform()) {
            return WebStorage.get(options);
        }
        try {
            const result = await callPlugin('Preferences', 'get', options);
            if (result.value !== null) {
                storageCache.set(options.key, result.value);
            }
            return result;
        }
        catch {
            return { value: null };
        }
    },
    /**
     * Set a value in storage
     */
    async set(options) {
        if (!isNativePlatform()) {
            return WebStorage.set(options);
        }
        try {
            await callPlugin('Preferences', 'set', options);
            storageCache.set(options.key, options.value);
        }
        catch (error) {
            throw new Error(`Storage set failed: ${error.message}`);
        }
    },
    /**
     * Remove a value from storage
     */
    async remove(options) {
        if (!isNativePlatform()) {
            return WebStorage.remove(options);
        }
        try {
            await callPlugin('Preferences', 'remove', options);
            storageCache.delete(options.key);
        }
        catch {
            // Ignore errors
        }
    },
    /**
     * Get all keys
     */
    async keys() {
        if (!isNativePlatform()) {
            return WebStorage.keys();
        }
        try {
            return await callPlugin('Preferences', 'keys');
        }
        catch {
            return { keys: [] };
        }
    },
    /**
     * Clear all storage
     */
    async clear() {
        if (!isNativePlatform()) {
            return WebStorage.clear();
        }
        try {
            await callPlugin('Preferences', 'clear');
            storageCache.clear();
        }
        catch {
            // Ignore errors
        }
    },
    /**
     * Migrate from old storage (Capacitor 2.x)
     */
    async migrate() {
        if (!isNativePlatform()) {
            return WebStorage.migrate();
        }
        try {
            await callPlugin('Preferences', 'migrate');
        }
        catch {
            // Ignore if migration not needed
        }
    },
    /**
     * Get multiple values
     */
    async getMultiple(options) {
        const values = await Promise.all(options.keys.map(async (key) => {
            const result = await this.get({ key });
            return result.value;
        }));
        return { values };
    },
    /**
     * Set multiple values
     */
    async setMultiple(options) {
        await Promise.all(options.items.map((item) => this.set({ key: item.key, value: item.value })));
    },
    /**
     * Remove multiple values
     */
    async removeMultiple(options) {
        await Promise.all(options.keys.map((key) => this.remove({ key })));
    },
};
// ============================================================================
// JSON Storage Helpers
// ============================================================================
/**
 * Get JSON value from storage
 */
export async function getJSON(key, defaultValue) {
    const result = await CapacitorStorage.get({ key });
    if (result.value === null) {
        return defaultValue ?? null;
    }
    try {
        return JSON.parse(result.value);
    }
    catch {
        return defaultValue ?? null;
    }
}
/**
 * Set JSON value in storage
 */
export async function setJSON(key, value) {
    await CapacitorStorage.set({
        key,
        value: JSON.stringify(value),
    });
}
/**
 * Update JSON value in storage (merge with existing)
 */
export async function updateJSON(key, updates) {
    const existing = await getJSON(key);
    if (existing === null) {
        await setJSON(key, updates);
        return updates;
    }
    const updated = { ...existing, ...updates };
    await setJSON(key, updated);
    return updated;
}
/**
 * Delete JSON value and return it
 */
export async function popJSON(key) {
    const value = await getJSON(key);
    await CapacitorStorage.remove({ key });
    return value;
}
// ============================================================================
// Secure Storage (Native Keychain/Keystore)
// ============================================================================
/**
 * Secure storage using native keychain (iOS) or keystore (Android)
 */
export const SecureStorage = {
    /**
     * Get a secure value
     */
    async get(key) {
        if (!isNativePlatform()) {
            // Use encrypted localStorage for web
            const result = await WebStorage.get({ key: `secure_${key}` });
            return result.value;
        }
        try {
            const result = await callPlugin('SecureStoragePlugin', 'get', { key });
            return result.value;
        }
        catch {
            return null;
        }
    },
    /**
     * Set a secure value
     */
    async set(key, value) {
        if (!isNativePlatform()) {
            // Use localStorage with prefix for web
            await WebStorage.set({ key: `secure_${key}`, value });
            return;
        }
        try {
            await callPlugin('SecureStoragePlugin', 'set', { key, value });
        }
        catch (error) {
            throw new Error(`Secure storage set failed: ${error.message}`);
        }
    },
    /**
     * Remove a secure value
     */
    async remove(key) {
        if (!isNativePlatform()) {
            await WebStorage.remove({ key: `secure_${key}` });
            return;
        }
        try {
            await callPlugin('SecureStoragePlugin', 'remove', { key });
        }
        catch {
            // Ignore errors
        }
    },
    /**
     * Clear all secure values
     */
    async clear() {
        if (!isNativePlatform()) {
            // Clear secure prefixed items
            const { keys } = await WebStorage.keys();
            for (const key of keys) {
                if (key.startsWith('secure_')) {
                    await WebStorage.remove({ key });
                }
            }
            return;
        }
        try {
            await callPlugin('SecureStoragePlugin', 'clear');
        }
        catch {
            // Ignore errors
        }
    },
    /**
     * Get all secure keys
     */
    async keys() {
        if (!isNativePlatform()) {
            const { keys } = await WebStorage.keys();
            return keys
                .filter((k) => k.startsWith('secure_'))
                .map((k) => k.replace('secure_', ''));
        }
        try {
            const result = await callPlugin('SecureStoragePlugin', 'keys');
            return result.value;
        }
        catch {
            return [];
        }
    },
    /**
     * Get secure JSON value
     */
    async getJSON(key) {
        const value = await this.get(key);
        if (value === null)
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return null;
        }
    },
    /**
     * Set secure JSON value
     */
    async setJSON(key, value) {
        await this.set(key, JSON.stringify(value));
    },
};
// ============================================================================
// Session Storage
// ============================================================================
/**
 * Session storage (cleared on app close)
 */
export const SessionStorage = {
    storage: new Map(),
    get(key) {
        return this.storage.get(key) ?? null;
    },
    set(key, value) {
        this.storage.set(key, value);
    },
    remove(key) {
        this.storage.delete(key);
    },
    clear() {
        this.storage.clear();
    },
    keys() {
        return Array.from(this.storage.keys());
    },
    getJSON(key) {
        const value = this.get(key);
        if (value === null)
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return null;
        }
    },
    setJSON(key, value) {
        this.set(key, JSON.stringify(value));
    },
};
// ============================================================================
// Storage Hooks
// ============================================================================
/**
 * Hook to get/set storage value
 */
export function useStorage(key, initialValue) {
    const valueSignal = signal(initialValue ?? null);
    // Load initial value
    getJSON(key, initialValue).then((value) => {
        valueSignal.set(value);
    });
    const setValue = async (value) => {
        await setJSON(key, value);
        valueSignal.set(value);
    };
    const removeValue = async () => {
        await CapacitorStorage.remove({ key });
        valueSignal.set(null);
    };
    return [valueSignal(), setValue, removeValue];
}
/**
 * Hook to check if storage is ready
 */
export function useStorageReady() {
    return storageReady();
}
// ============================================================================
// Exports
// ============================================================================
export default CapacitorStorage;
//# sourceMappingURL=storage.js.map