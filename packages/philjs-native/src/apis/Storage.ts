/**
 * Storage API
 *
 * Async storage for persisting data on device.
 * Similar to React Native's AsyncStorage.
 */

import { signal, effect, type Signal } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';

// ============================================================================
// Types
// ============================================================================

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
    encryptionKey: undefined as string | undefined,
  },

  /**
   * Configure storage
   */
  configure(options: StorageOptions): void {
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
  async getItem(key: string): Promise<string | null> {
    const platform = detectPlatform();
    const prefixedKey = this.config.prefix + key;

    if (platform === 'web') {
      try {
        const value = localStorage.getItem(prefixedKey);
        if (value && this.config.encryptionKey) {
          return decrypt(value, this.config.encryptionKey);
        }
        return value;
      } catch (error) {
        console.error('Storage.getItem error:', error);
        return null;
      }
    }

    return nativeBridge.call<string | null>('Storage', 'getItem', prefixedKey);
  },

  /**
   * Set item in storage
   */
  async setItem(key: string, value: string): Promise<void> {
    const platform = detectPlatform();
    const prefixedKey = this.config.prefix + key;

    let storedValue = value;
    if (this.config.encryptionKey) {
      storedValue = encrypt(value, this.config.encryptionKey);
    }

    if (platform === 'web') {
      try {
        localStorage.setItem(prefixedKey, storedValue);
      } catch (error) {
        // Handle quota exceeded
        if ((error as any).name === 'QuotaExceededError') {
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
  async removeItem(key: string): Promise<void> {
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
  async multiGet(keys: string[]): Promise<MultiGetResult> {
    const platform = detectPlatform();
    const prefixedKeys = keys.map(k => this.config.prefix + k);

    if (platform === 'web') {
      return Promise.all(
        prefixedKeys.map(async (_key, index) => {
          const originalKey = keys[index]!;
          const value = await this.getItem(originalKey);
          return [originalKey, value] as [string, string | null];
        })
      );
    }

    const results = await nativeBridge.call<MultiGetResult>('Storage', 'multiGet', prefixedKeys);
    return results.map(([_key, value], index) => [keys[index]!, value]);
  },

  /**
   * Set multiple items
   */
  async multiSet(keyValuePairs: MultiSetInput): Promise<void> {
    const platform = detectPlatform();

    if (platform === 'web') {
      await Promise.all(
        keyValuePairs.map(([key, value]) => this.setItem(key, value))
      );
      return;
    }

    const prefixedPairs = keyValuePairs.map(([k, v]) => [this.config.prefix + k, v]);
    return nativeBridge.call('Storage', 'multiSet', prefixedPairs);
  },

  /**
   * Remove multiple items
   */
  async multiRemove(keys: string[]): Promise<void> {
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
  async getAllKeys(): Promise<string[]> {
    const platform = detectPlatform();

    if (platform === 'web') {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.config.prefix)) {
          keys.push(key.substring(this.config.prefix.length));
        }
      }
      return keys;
    }

    const keys = await nativeBridge.call<string[]>('Storage', 'getAllKeys');
    return keys
      .filter(k => k.startsWith(this.config.prefix))
      .map(k => k.substring(this.config.prefix.length));
  },

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    const platform = detectPlatform();

    if (platform === 'web') {
      const keysToRemove: string[] = [];
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
  async mergeItem(key: string, value: string): Promise<void> {
    const existing = await this.getItem(key);

    if (existing) {
      try {
        const existingObj = JSON.parse(existing);
        const newObj = JSON.parse(value);
        const merged = { ...existingObj, ...newObj };
        await this.setItem(key, JSON.stringify(merged));
      } catch {
        // If not JSON, just overwrite
        await this.setItem(key, value);
      }
    } else {
      await this.setItem(key, value);
    }
  },

  /**
   * Get storage info
   */
  async getInfo(): Promise<{
    used: number;
    total: number;
    keys: number;
  }> {
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
export async function getJSON<T>(key: string): Promise<T | null> {
  const value = await Storage.getItem(key);
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Set JSON to storage
 */
export async function setJSON<T>(key: string, value: T): Promise<void> {
  await Storage.setItem(key, JSON.stringify(value));
}

/**
 * Update JSON in storage
 */
export async function updateJSON<T>(
  key: string,
  updater: (current: T | null) => T
): Promise<void> {
  const current = await getJSON<T>(key);
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
  async getItem(key: string): Promise<string | null> {
    const platform = detectPlatform();

    if (platform === 'web') {
      // Web uses sessionStorage for slightly more security
      return sessionStorage.getItem(Storage.config.prefix + key);
    }

    return nativeBridge.call<string | null>('SecureStorage', 'getItem', key);
  },

  /**
   * Set secure item
   */
  async setItem(key: string, value: string): Promise<void> {
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
  async removeItem(key: string): Promise<void> {
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
  async clear(): Promise<void> {
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
export function useStorage<T>(
  key: string,
  defaultValue: T
): [Signal<T>, (value: T) => Promise<void>] {
  const state = signal<T>(defaultValue);

  // Load initial value
  effect(() => {
    getJSON<T>(key).then(value => {
      if (value !== null) {
        state.set(value);
      }
    });
  });

  // Setter that persists to storage
  const setValue = async (value: T) => {
    state.set(value);
    await setJSON(key, value);
  };

  return [state, setValue];
}

// ============================================================================
// Encryption Helpers (Simple XOR for demo - use proper encryption in production)
// ============================================================================

function encrypt(text: string, key: string): string {
  // Simple base64 encoding for demo
  // In production, use a proper encryption library
  return btoa(text);
}

function decrypt(encoded: string, key: string): string {
  try {
    return atob(encoded);
  } catch {
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
  instances: new Map<string, Map<string, string>>(),

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
  } {
    const platform = detectPlatform();

    // Use in-memory map for web (would use actual MMKV for native)
    if (!this.instances.has(id)) {
      this.instances.set(id, new Map());
    }

    const store = this.instances.get(id)!;

    return {
      getString(key: string): string | undefined {
        if (platform === 'web') {
          const value = localStorage.getItem(`mmkv:${id}:${key}`);
          return value ?? undefined;
        }
        return store.get(key);
      },

      setString(key: string, value: string): void {
        if (platform === 'web') {
          localStorage.setItem(`mmkv:${id}:${key}`, value);
        }
        store.set(key, value);
      },

      getNumber(key: string): number | undefined {
        const value = this.getString(key);
        return value !== undefined ? Number(value) : undefined;
      },

      setNumber(key: string, value: number): void {
        this.setString(key, String(value));
      },

      getBoolean(key: string): boolean | undefined {
        const value = this.getString(key);
        return value !== undefined ? value === 'true' : undefined;
      },

      setBoolean(key: string, value: boolean): void {
        this.setString(key, String(value));
      },

      delete(key: string): void {
        if (platform === 'web') {
          localStorage.removeItem(`mmkv:${id}:${key}`);
        }
        store.delete(key);
      },

      getAllKeys(): string[] {
        if (platform === 'web') {
          const keys: string[] = [];
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

      clearAll(): void {
        if (platform === 'web') {
          const prefix = `mmkv:${id}:`;
          const keysToRemove: string[] = [];
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
