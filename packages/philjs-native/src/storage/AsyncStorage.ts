/**
 * AsyncStorage API
 *
 * Persistent key-value storage with async interface.
 * Compatible with React Native's AsyncStorage.
 */

import { signal, effect, type Signal } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';

// ============================================================================
// Types
// ============================================================================

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
export class AsyncStorageError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AsyncStorageError';
  }
}

// ============================================================================
// Configuration
// ============================================================================

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

const config: AsyncStorageConfig = {
  prefix: '@asyncstorage:',
  maxValueSize: 2 * 1024 * 1024, // 2MB
  debug: false,
};

/**
 * Configure AsyncStorage
 */
export function configureAsyncStorage(options: Partial<AsyncStorageConfig>): void {
  Object.assign(config, options);
}

// ============================================================================
// Storage Implementation
// ============================================================================

/**
 * Get prefixed key
 */
function getPrefixedKey(key: string): string {
  return `${config.prefix}${key}`;
}

/**
 * Log debug message
 */
function debug(message: string, ...args: any[]): void {
  if (config.debug) {
    console.log(`[AsyncStorage] ${message}`, ...args);
  }
}

/**
 * Validate key
 */
function validateKey(key: string): void {
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
function validateValue(value: string): void {
  if (typeof value !== 'string') {
    throw new AsyncStorageError('Value must be a string', 'INVALID_VALUE');
  }
  if (value.length > config.maxValueSize) {
    throw new AsyncStorageError(
      `Value exceeds maximum size of ${config.maxValueSize} bytes`,
      'VALUE_TOO_LARGE'
    );
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
  async getItem(key: string, callback?: StorageCallback): Promise<string | null> {
    try {
      validateKey(key);
      const platform = detectPlatform();
      const prefixedKey = getPrefixedKey(key);

      debug('getItem', key);

      let value: string | null = null;

      if (platform === 'web') {
        value = localStorage.getItem(prefixedKey);
      } else {
        value = await nativeBridge.call<string | null>('AsyncStorage', 'getItem', prefixedKey);
      }

      callback?.(null, value);
      return value;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callback?.(err);
      throw err;
    }
  },

  /**
   * Set item in storage
   */
  async setItem(key: string, value: string, callback?: StorageCallback): Promise<void> {
    try {
      validateKey(key);
      validateValue(value);
      const platform = detectPlatform();
      const prefixedKey = getPrefixedKey(key);

      debug('setItem', key, `(${value.length} bytes)`);

      if (platform === 'web') {
        try {
          localStorage.setItem(prefixedKey, value);
        } catch (e) {
          if ((e as any).name === 'QuotaExceededError') {
            throw new AsyncStorageError('Storage quota exceeded', 'QUOTA_EXCEEDED');
          }
          throw e;
        }
      } else {
        await nativeBridge.call('AsyncStorage', 'setItem', prefixedKey, value);
      }

      callback?.(null);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callback?.(err);
      throw err;
    }
  },

  /**
   * Remove item from storage
   */
  async removeItem(key: string, callback?: StorageCallback): Promise<void> {
    try {
      validateKey(key);
      const platform = detectPlatform();
      const prefixedKey = getPrefixedKey(key);

      debug('removeItem', key);

      if (platform === 'web') {
        localStorage.removeItem(prefixedKey);
      } else {
        await nativeBridge.call('AsyncStorage', 'removeItem', prefixedKey);
      }

      callback?.(null);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callback?.(err);
      throw err;
    }
  },

  /**
   * Merge item with existing value (JSON merge)
   */
  async mergeItem(key: string, value: string, callback?: StorageCallback): Promise<void> {
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
        } catch {
          // If not valid JSON, just overwrite
          await this.setItem(key, value);
        }
      } else {
        await this.setItem(key, value);
      }

      callback?.(null);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callback?.(err);
      throw err;
    }
  },

  /**
   * Get multiple items
   */
  async multiGet(
    keys: readonly string[],
    callback?: (errors: readonly (Error | null)[] | null, result: MultiGetResult) => void
  ): Promise<MultiGetResult> {
    try {
      debug('multiGet', keys);

      const results = await Promise.all(
        keys.map(async (key): Promise<readonly [string, string | null]> => {
          const value = await this.getItem(key);
          return [key, value] as const;
        })
      );

      callback?.(null, results);
      return results;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callback?.([err], []);
      throw err;
    }
  },

  /**
   * Set multiple items
   */
  async multiSet(
    keyValuePairs: MultiSetInput,
    callback?: (errors: readonly (Error | null)[] | null) => void
  ): Promise<void> {
    try {
      debug('multiSet', keyValuePairs.map(([k]) => k));

      await Promise.all(
        keyValuePairs.map(([key, value]) => this.setItem(key, value))
      );

      callback?.(null);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callback?.([err]);
      throw err;
    }
  },

  /**
   * Remove multiple items
   */
  async multiRemove(
    keys: readonly string[],
    callback?: (errors: readonly (Error | null)[] | null) => void
  ): Promise<void> {
    try {
      debug('multiRemove', keys);

      await Promise.all(keys.map(key => this.removeItem(key)));

      callback?.(null);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callback?.([err]);
      throw err;
    }
  },

  /**
   * Merge multiple items
   */
  async multiMerge(
    keyValuePairs: MultiSetInput,
    callback?: (errors: readonly (Error | null)[] | null) => void
  ): Promise<void> {
    try {
      debug('multiMerge', keyValuePairs.map(([k]) => k));

      await Promise.all(
        keyValuePairs.map(([key, value]) => this.mergeItem(key, value))
      );

      callback?.(null);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callback?.([err]);
      throw err;
    }
  },

  /**
   * Get all keys
   */
  async getAllKeys(
    callback?: (error: Error | null, keys?: readonly string[]) => void
  ): Promise<readonly string[]> {
    try {
      const platform = detectPlatform();

      debug('getAllKeys');

      let keys: string[];

      if (platform === 'web') {
        keys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(config.prefix)) {
            keys.push(key.substring(config.prefix.length));
          }
        }
      } else {
        const allKeys = await nativeBridge.call<string[]>('AsyncStorage', 'getAllKeys');
        keys = allKeys
          .filter(k => k.startsWith(config.prefix))
          .map(k => k.substring(config.prefix.length));
      }

      callback?.(null, keys);
      return keys;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callback?.(err);
      throw err;
    }
  },

  /**
   * Clear all storage
   */
  async clear(callback?: (error: Error | null) => void): Promise<void> {
    try {
      const platform = detectPlatform();

      debug('clear');

      if (platform === 'web') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith(config.prefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } else {
        await nativeBridge.call('AsyncStorage', 'clear', config.prefix);
      }

      callback?.(null);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      callback?.(err);
      throw err;
    }
  },

  /**
   * Flush pending writes (no-op for web, relevant for native)
   */
  async flushGetRequests(): Promise<void> {
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
function deepMerge<T extends Record<string, any>>(target: T, source: T): T {
  const result = { ...target };

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = (target as any)[key];

      if (
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        targetValue !== null &&
        !Array.isArray(targetValue)
      ) {
        (result as any)[key] = deepMerge(targetValue, sourceValue);
      } else {
        (result as any)[key] = sourceValue;
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
export function useAsyncStorage<T = string>(
  key: string,
  defaultValue?: T
): {
  value: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  getItem: () => Promise<T | null>;
  setItem: (value: T) => Promise<void>;
  removeItem: () => Promise<void>;
  mergeItem: (value: Partial<T>) => Promise<void>;
} {
  const valueSignal = signal<T | null>(defaultValue ?? null);
  const loadingSignal = signal(true);
  const errorSignal = signal<Error | null>(null);

  // Load initial value
  (async () => {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored !== null) {
        try {
          valueSignal.set(JSON.parse(stored) as T);
        } catch {
          valueSignal.set(stored as unknown as T);
        }
      }
    } catch (err) {
      errorSignal.set(err instanceof Error ? err : new Error(String(err)));
    } finally {
      loadingSignal.set(false);
    }
  })();

  return {
    value: valueSignal,
    loading: loadingSignal,
    error: errorSignal,

    async getItem(): Promise<T | null> {
      loadingSignal.set(true);
      errorSignal.set(null);
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored !== null) {
          try {
            const parsed = JSON.parse(stored) as T;
            valueSignal.set(parsed);
            return parsed;
          } catch {
            valueSignal.set(stored as unknown as T);
            return stored as unknown as T;
          }
        }
        return null;
      } catch (err) {
        errorSignal.set(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        loadingSignal.set(false);
      }
    },

    async setItem(value: T): Promise<void> {
      loadingSignal.set(true);
      errorSignal.set(null);
      try {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        await AsyncStorage.setItem(key, serialized);
        valueSignal.set(value);
      } catch (err) {
        errorSignal.set(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        loadingSignal.set(false);
      }
    },

    async removeItem(): Promise<void> {
      loadingSignal.set(true);
      errorSignal.set(null);
      try {
        await AsyncStorage.removeItem(key);
        valueSignal.set(null);
      } catch (err) {
        errorSignal.set(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        loadingSignal.set(false);
      }
    },

    async mergeItem(value: Partial<T>): Promise<void> {
      loadingSignal.set(true);
      errorSignal.set(null);
      try {
        await AsyncStorage.mergeItem(key, JSON.stringify(value));
        const current = valueSignal();
        if (current && typeof current === 'object') {
          valueSignal.set({ ...current, ...value } as T);
        } else {
          valueSignal.set(value as T);
        }
      } catch (err) {
        errorSignal.set(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        loadingSignal.set(false);
      }
    },
  };
}

/**
 * Simple hook for string storage
 */
export function useStoredValue(
  key: string,
  defaultValue: string = ''
): [Signal<string>, (value: string) => Promise<void>] {
  const valueSignal = signal(defaultValue);

  // Load initial value
  AsyncStorage.getItem(key).then(value => {
    if (value !== null) {
      valueSignal.set(value);
    }
  });

  const setValue = async (value: string): Promise<void> => {
    valueSignal.set(value);
    await AsyncStorage.setItem(key, value);
  };

  return [valueSignal, setValue];
}

export default AsyncStorage;
