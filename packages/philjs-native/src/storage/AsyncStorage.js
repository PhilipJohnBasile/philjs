/**
 * AsyncStorage API
 *
 * Persistent key-value storage with async interface.
 * Compatible with React Native's AsyncStorage.
 */
import { signal, effect } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';
/**
 * Storage error
 */
export class AsyncStorageError extends Error {
    code;
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'AsyncStorageError';
    }
}
const config = {
    prefix: '@asyncstorage:',
    maxValueSize: 2 * 1024 * 1024, // 2MB
    debug: false,
};
/**
 * Configure AsyncStorage
 */
export function configureAsyncStorage(options) {
    Object.assign(config, options);
}
// ============================================================================
// Storage Implementation
// ============================================================================
/**
 * Get prefixed key
 */
function getPrefixedKey(key) {
    return `${config.prefix}${key}`;
}
/**
 * Log debug message
 */
function debug(message, ...args) {
    if (config.debug) {
        console.log(`[AsyncStorage] ${message}`, ...args);
    }
}
/**
 * Validate key
 */
function validateKey(key) {
    if (typeof key !== 'string') {
        throw new AsyncStorageError('Key must be a string', 'INVALID_KEY');
    }
    if (key.length === 0) {
        throw new AsyncStorageError('Key cannot be empty', 'EMPTY_KEY');
    }
}
/**
 * Validate value
 */
function validateValue(value) {
    if (typeof value !== 'string') {
        throw new AsyncStorageError('Value must be a string', 'INVALID_VALUE');
    }
    if (value.length > config.maxValueSize) {
        throw new AsyncStorageError(`Value exceeds maximum size of ${config.maxValueSize} bytes`, 'VALUE_TOO_LARGE');
    }
}
// ============================================================================
// AsyncStorage API
// ============================================================================
/**
 * AsyncStorage - Persistent key-value storage
 */
export const AsyncStorage = {
    /**
     * Get item from storage
     */
    async getItem(key, callback) {
        try {
            validateKey(key);
            const platform = detectPlatform();
            const prefixedKey = getPrefixedKey(key);
            debug('getItem', key);
            let value = null;
            if (platform === 'web') {
                value = localStorage.getItem(prefixedKey);
            }
            else {
                value = await nativeBridge.call('AsyncStorage', 'getItem', prefixedKey);
            }
            callback?.(null, value);
            return value;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            callback?.(err);
            throw err;
        }
    },
    /**
     * Set item in storage
     */
    async setItem(key, value, callback) {
        try {
            validateKey(key);
            validateValue(value);
            const platform = detectPlatform();
            const prefixedKey = getPrefixedKey(key);
            debug('setItem', key, `(${value.length} bytes)`);
            if (platform === 'web') {
                try {
                    localStorage.setItem(prefixedKey, value);
                }
                catch (e) {
                    if (e.name === 'QuotaExceededError') {
                        throw new AsyncStorageError('Storage quota exceeded', 'QUOTA_EXCEEDED');
                    }
                    throw e;
                }
            }
            else {
                await nativeBridge.call('AsyncStorage', 'setItem', prefixedKey, value);
            }
            callback?.(null);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            callback?.(err);
            throw err;
        }
    },
    /**
     * Remove item from storage
     */
    async removeItem(key, callback) {
        try {
            validateKey(key);
            const platform = detectPlatform();
            const prefixedKey = getPrefixedKey(key);
            debug('removeItem', key);
            if (platform === 'web') {
                localStorage.removeItem(prefixedKey);
            }
            else {
                await nativeBridge.call('AsyncStorage', 'removeItem', prefixedKey);
            }
            callback?.(null);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            callback?.(err);
            throw err;
        }
    },
    /**
     * Merge item with existing value (JSON merge)
     */
    async mergeItem(key, value, callback) {
        try {
            validateKey(key);
            validateValue(value);
            debug('mergeItem', key);
            const existing = await this.getItem(key);
            if (existing) {
                try {
                    const existingObj = JSON.parse(existing);
                    const newObj = JSON.parse(value);
                    const merged = deepMerge(existingObj, newObj);
                    await this.setItem(key, JSON.stringify(merged));
                }
                catch {
                    // If not valid JSON, just overwrite
                    await this.setItem(key, value);
                }
            }
            else {
                await this.setItem(key, value);
            }
            callback?.(null);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            callback?.(err);
            throw err;
        }
    },
    /**
     * Get multiple items
     */
    async multiGet(keys, callback) {
        try {
            debug('multiGet', keys);
            const results = await Promise.all(keys.map(async (key) => {
                const value = await this.getItem(key);
                return [key, value];
            }));
            callback?.(null, results);
            return results;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            callback?.([err], []);
            throw err;
        }
    },
    /**
     * Set multiple items
     */
    async multiSet(keyValuePairs, callback) {
        try {
            debug('multiSet', keyValuePairs.map(([k]) => k));
            await Promise.all(keyValuePairs.map(([key, value]) => this.setItem(key, value)));
            callback?.(null);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            callback?.([err]);
            throw err;
        }
    },
    /**
     * Remove multiple items
     */
    async multiRemove(keys, callback) {
        try {
            debug('multiRemove', keys);
            await Promise.all(keys.map(key => this.removeItem(key)));
            callback?.(null);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            callback?.([err]);
            throw err;
        }
    },
    /**
     * Merge multiple items
     */
    async multiMerge(keyValuePairs, callback) {
        try {
            debug('multiMerge', keyValuePairs.map(([k]) => k));
            await Promise.all(keyValuePairs.map(([key, value]) => this.mergeItem(key, value)));
            callback?.(null);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            callback?.([err]);
            throw err;
        }
    },
    /**
     * Get all keys
     */
    async getAllKeys(callback) {
        try {
            const platform = detectPlatform();
            debug('getAllKeys');
            let keys;
            if (platform === 'web') {
                keys = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key?.startsWith(config.prefix)) {
                        keys.push(key.substring(config.prefix.length));
                    }
                }
            }
            else {
                const allKeys = await nativeBridge.call('AsyncStorage', 'getAllKeys');
                keys = allKeys
                    .filter(k => k.startsWith(config.prefix))
                    .map(k => k.substring(config.prefix.length));
            }
            callback?.(null, keys);
            return keys;
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            callback?.(err);
            throw err;
        }
    },
    /**
     * Clear all storage
     */
    async clear(callback) {
        try {
            const platform = detectPlatform();
            debug('clear');
            if (platform === 'web') {
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key?.startsWith(config.prefix)) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
            }
            else {
                await nativeBridge.call('AsyncStorage', 'clear', config.prefix);
            }
            callback?.(null);
        }
        catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            callback?.(err);
            throw err;
        }
    },
    /**
     * Flush pending writes (no-op for web, relevant for native)
     */
    async flushGetRequests() {
        debug('flushGetRequests');
        // No-op for web implementation
    },
};
// ============================================================================
// Helpers
// ============================================================================
/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
            const sourceValue = source[key];
            const targetValue = target[key];
            if (typeof sourceValue === 'object' &&
                sourceValue !== null &&
                !Array.isArray(sourceValue) &&
                typeof targetValue === 'object' &&
                targetValue !== null &&
                !Array.isArray(targetValue)) {
                result[key] = deepMerge(targetValue, sourceValue);
            }
            else {
                result[key] = sourceValue;
            }
        }
    }
    return result;
}
// ============================================================================
// Hooks
// ============================================================================
/**
 * Hook to use async storage with reactive updates
 */
export function useAsyncStorage(key, defaultValue) {
    const valueSignal = signal(defaultValue ?? null);
    const loadingSignal = signal(true);
    const errorSignal = signal(null);
    // Load initial value
    (async () => {
        try {
            const stored = await AsyncStorage.getItem(key);
            if (stored !== null) {
                try {
                    valueSignal.set(JSON.parse(stored));
                }
                catch {
                    valueSignal.set(stored);
                }
            }
        }
        catch (err) {
            errorSignal.set(err instanceof Error ? err : new Error(String(err)));
        }
        finally {
            loadingSignal.set(false);
        }
    })();
    return {
        value: valueSignal,
        loading: loadingSignal,
        error: errorSignal,
        async getItem() {
            loadingSignal.set(true);
            errorSignal.set(null);
            try {
                const stored = await AsyncStorage.getItem(key);
                if (stored !== null) {
                    try {
                        const parsed = JSON.parse(stored);
                        valueSignal.set(parsed);
                        return parsed;
                    }
                    catch {
                        valueSignal.set(stored);
                        return stored;
                    }
                }
                return null;
            }
            catch (err) {
                errorSignal.set(err instanceof Error ? err : new Error(String(err)));
                throw err;
            }
            finally {
                loadingSignal.set(false);
            }
        },
        async setItem(value) {
            loadingSignal.set(true);
            errorSignal.set(null);
            try {
                const serialized = typeof value === 'string' ? value : JSON.stringify(value);
                await AsyncStorage.setItem(key, serialized);
                valueSignal.set(value);
            }
            catch (err) {
                errorSignal.set(err instanceof Error ? err : new Error(String(err)));
                throw err;
            }
            finally {
                loadingSignal.set(false);
            }
        },
        async removeItem() {
            loadingSignal.set(true);
            errorSignal.set(null);
            try {
                await AsyncStorage.removeItem(key);
                valueSignal.set(null);
            }
            catch (err) {
                errorSignal.set(err instanceof Error ? err : new Error(String(err)));
                throw err;
            }
            finally {
                loadingSignal.set(false);
            }
        },
        async mergeItem(value) {
            loadingSignal.set(true);
            errorSignal.set(null);
            try {
                await AsyncStorage.mergeItem(key, JSON.stringify(value));
                const current = valueSignal();
                if (current && typeof current === 'object') {
                    valueSignal.set({ ...current, ...value });
                }
                else {
                    valueSignal.set(value);
                }
            }
            catch (err) {
                errorSignal.set(err instanceof Error ? err : new Error(String(err)));
                throw err;
            }
            finally {
                loadingSignal.set(false);
            }
        },
    };
}
/**
 * Simple hook for string storage
 */
export function useStoredValue(key, defaultValue = '') {
    const valueSignal = signal(defaultValue);
    // Load initial value
    AsyncStorage.getItem(key).then(value => {
        if (value !== null) {
            valueSignal.set(value);
        }
    });
    const setValue = async (value) => {
        valueSignal.set(value);
        await AsyncStorage.setItem(key, value);
    };
    return [valueSignal, setValue];
}
export default AsyncStorage;
//# sourceMappingURL=AsyncStorage.js.map