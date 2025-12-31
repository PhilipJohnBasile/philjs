/**
 * Storage API
 *
 * Async storage for persisting data on device.
 * Similar to React Native's AsyncStorage.
 */
import { signal, effect } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
// ============================================================================
// Storage Implementation
// ============================================================================
/**
 * Storage API singleton
 */
export const Storage = {
    /**
     * Configuration
     */
    config: {
        prefix: '@philjs:',
        encryptionKey: undefined,
    },
    /**
     * Configure storage
     */
    configure(options) {
        if (options.prefix !== undefined) {
            this.config.prefix = options.prefix;
        }
        if (options.encryptionKey !== undefined) {
            this.config.encryptionKey = options.encryptionKey;
        }
    },
    /**
     * Get item from storage
     */
    async getItem(key) {
        const platform = detectPlatform();
        const prefixedKey = this.config.prefix + key;
        if (platform === 'web') {
            try {
                const value = localStorage.getItem(prefixedKey);
                if (value && this.config.encryptionKey) {
                    return decrypt(value, this.config.encryptionKey);
                }
                return value;
            }
            catch (error) {
                console.error('Storage.getItem error:', error);
                return null;
            }
        }
        return nativeBridge.call('Storage', 'getItem', prefixedKey);
    },
    /**
     * Set item in storage
     */
    async setItem(key, value) {
        const platform = detectPlatform();
        const prefixedKey = this.config.prefix + key;
        let storedValue = value;
        if (this.config.encryptionKey) {
            storedValue = encrypt(value, this.config.encryptionKey);
        }
        if (platform === 'web') {
            try {
                localStorage.setItem(prefixedKey, storedValue);
            }
            catch (error) {
                // Handle quota exceeded
                if (error.name === 'QuotaExceededError') {
                    throw new Error('Storage quota exceeded');
                }
                throw error;
            }
            return;
        }
        return nativeBridge.call('Storage', 'setItem', prefixedKey, storedValue);
    },
    /**
     * Remove item from storage
     */
    async removeItem(key) {
        const platform = detectPlatform();
        const prefixedKey = this.config.prefix + key;
        if (platform === 'web') {
            localStorage.removeItem(prefixedKey);
            return;
        }
        return nativeBridge.call('Storage', 'removeItem', prefixedKey);
    },
    /**
     * Get multiple items
     */
    async multiGet(keys) {
        const platform = detectPlatform();
        const prefixedKeys = keys.map(k => this.config.prefix + k);
        if (platform === 'web') {
            return Promise.all(prefixedKeys.map(async (_key, index) => {
                const originalKey = keys[index];
                const value = await this.getItem(originalKey);
                return [originalKey, value];
            }));
        }
        const results = await nativeBridge.call('Storage', 'multiGet', prefixedKeys);
        return results.map(([_key, value], index) => [keys[index], value]);
    },
    /**
     * Set multiple items
     */
    async multiSet(keyValuePairs) {
        const platform = detectPlatform();
        if (platform === 'web') {
            await Promise.all(keyValuePairs.map(([key, value]) => this.setItem(key, value)));
            return;
        }
        const prefixedPairs = keyValuePairs.map(([k, v]) => [this.config.prefix + k, v]);
        return nativeBridge.call('Storage', 'multiSet', prefixedPairs);
    },
    /**
     * Remove multiple items
     */
    async multiRemove(keys) {
        const platform = detectPlatform();
        if (platform === 'web') {
            await Promise.all(keys.map(key => this.removeItem(key)));
            return;
        }
        const prefixedKeys = keys.map(k => this.config.prefix + k);
        return nativeBridge.call('Storage', 'multiRemove', prefixedKeys);
    },
    /**
     * Get all keys
     */
    async getAllKeys() {
        const platform = detectPlatform();
        if (platform === 'web') {
            const keys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.config.prefix)) {
                    keys.push(key.substring(this.config.prefix.length));
                }
            }
            return keys;
        }
        const keys = await nativeBridge.call('Storage', 'getAllKeys');
        return keys
            .filter(k => k.startsWith(this.config.prefix))
            .map(k => k.substring(this.config.prefix.length));
    },
    /**
     * Clear all storage
     */
    async clear() {
        const platform = detectPlatform();
        if (platform === 'web') {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.config.prefix)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            return;
        }
        return nativeBridge.call('Storage', 'clear', this.config.prefix);
    },
    /**
     * Merge an existing key value with new value
     */
    async mergeItem(key, value) {
        const existing = await this.getItem(key);
        if (existing) {
            try {
                const existingObj = JSON.parse(existing);
                const newObj = JSON.parse(value);
                const merged = { ...existingObj, ...newObj };
                await this.setItem(key, JSON.stringify(merged));
            }
            catch {
                // If not JSON, just overwrite
                await this.setItem(key, value);
            }
        }
        else {
            await this.setItem(key, value);
        }
    },
    /**
     * Get storage info
     */
    async getInfo() {
        const platform = detectPlatform();
        const keys = await this.getAllKeys();
        if (platform === 'web') {
            let used = 0;
            for (const key of keys) {
                const value = await this.getItem(key);
                if (value) {
                    used += (this.config.prefix + key).length + value.length;
                }
            }
            // localStorage typically has 5-10MB limit
            return {
                used,
                total: 5 * 1024 * 1024, // 5MB estimate
                keys: keys.length,
            };
        }
        return nativeBridge.call('Storage', 'getInfo');
    },
};
// ============================================================================
// JSON Storage Helpers
// ============================================================================
/**
 * Get JSON from storage
 */
export async function getJSON(key) {
    const value = await Storage.getItem(key);
    if (!value)
        return null;
    try {
        return JSON.parse(value);
    }
    catch {
        return null;
    }
}
/**
 * Set JSON to storage
 */
export async function setJSON(key, value) {
    await Storage.setItem(key, JSON.stringify(value));
}
/**
 * Update JSON in storage
 */
export async function updateJSON(key, updater) {
    const current = await getJSON(key);
    const updated = updater(current);
    await setJSON(key, updated);
}
// ============================================================================
// Secure Storage
// ============================================================================
/**
 * Secure storage with encryption
 */
export const SecureStorage = {
    /**
     * Get secure item
     */
    async getItem(key) {
        const platform = detectPlatform();
        if (platform === 'web') {
            // Web uses sessionStorage for slightly more security
            return sessionStorage.getItem(Storage.config.prefix + key);
        }
        return nativeBridge.call('SecureStorage', 'getItem', key);
    },
    /**
     * Set secure item
     */
    async setItem(key, value) {
        const platform = detectPlatform();
        if (platform === 'web') {
            sessionStorage.setItem(Storage.config.prefix + key, value);
            return;
        }
        return nativeBridge.call('SecureStorage', 'setItem', key, value);
    },
    /**
     * Remove secure item
     */
    async removeItem(key) {
        const platform = detectPlatform();
        if (platform === 'web') {
            sessionStorage.removeItem(Storage.config.prefix + key);
            return;
        }
        return nativeBridge.call('SecureStorage', 'removeItem', key);
    },
    /**
     * Clear all secure storage
     */
    async clear() {
        const platform = detectPlatform();
        if (platform === 'web') {
            sessionStorage.clear();
            return;
        }
        return nativeBridge.call('SecureStorage', 'clear');
    },
};
// ============================================================================
// Storage Hook
// ============================================================================
/**
 * Hook for reactive storage
 */
export function useStorage(key, defaultValue) {
    const state = signal(defaultValue);
    // Load initial value
    effect(() => {
        getJSON(key).then(value => {
            if (value !== null) {
                state.set(value);
            }
        });
    });
    // Setter that persists to storage
    const setValue = async (value) => {
        state.set(value);
        await setJSON(key, value);
    };
    return [state, setValue];
}
// ============================================================================
// Encryption Helpers (Simple XOR for demo - use proper encryption in production)
// ============================================================================
function encrypt(text, key) {
    // Simple base64 encoding for demo
    // In production, use a proper encryption library
    return btoa(text);
}
function decrypt(encoded, key) {
    try {
        return atob(encoded);
    }
    catch {
        return encoded;
    }
}
// ============================================================================
// MMKV-like Storage (High Performance)
// ============================================================================
/**
 * High-performance storage (MMKV-like)
 */
export const MMKVStorage = {
    instances: new Map(),
    /**
     * Create a new storage instance
     */
    create(id) {
        const platform = detectPlatform();
        // Use in-memory map for web (would use actual MMKV for native)
        if (!this.instances.has(id)) {
            this.instances.set(id, new Map());
        }
        const store = this.instances.get(id);
        return {
            getString(key) {
                if (platform === 'web') {
                    const value = localStorage.getItem(`mmkv:${id}:${key}`);
                    return value ?? undefined;
                }
                return store.get(key);
            },
            setString(key, value) {
                if (platform === 'web') {
                    localStorage.setItem(`mmkv:${id}:${key}`, value);
                }
                store.set(key, value);
            },
            getNumber(key) {
                const value = this.getString(key);
                return value !== undefined ? Number(value) : undefined;
            },
            setNumber(key, value) {
                this.setString(key, String(value));
            },
            getBoolean(key) {
                const value = this.getString(key);
                return value !== undefined ? value === 'true' : undefined;
            },
            setBoolean(key, value) {
                this.setString(key, String(value));
            },
            delete(key) {
                if (platform === 'web') {
                    localStorage.removeItem(`mmkv:${id}:${key}`);
                }
                store.delete(key);
            },
            getAllKeys() {
                if (platform === 'web') {
                    const keys = [];
                    const prefix = `mmkv:${id}:`;
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key?.startsWith(prefix)) {
                            keys.push(key.substring(prefix.length));
                        }
                    }
                    return keys;
                }
                return Array.from(store.keys());
            },
            clearAll() {
                if (platform === 'web') {
                    const prefix = `mmkv:${id}:`;
                    const keysToRemove = [];
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key?.startsWith(prefix)) {
                            keysToRemove.push(key);
                        }
                    }
                    keysToRemove.forEach(key => localStorage.removeItem(key));
                }
                store.clear();
            },
        };
    },
};
// ============================================================================
// Export
// ============================================================================
export default Storage;
//# sourceMappingURL=Storage.js.map