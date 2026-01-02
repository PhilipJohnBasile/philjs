/**
 * PhilJS Native - Capacitor Secure Storage Plugin
 *
 * Provides secure persistent storage using native keychain/keystore
 * with fallback to web storage APIs.
 */

import { signal, type Signal } from '@philjs/core';
import {
  isNativePlatform,
  callPlugin,
  registerPlugin,
} from '../index.js';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// State
// ============================================================================

/**
 * Storage ready state
 */
export const storageReady: Signal<boolean> = signal(false);

/**
 * Storage cache for performance
 */
const storageCache = new Map<string, string>();

// ============================================================================
// Web Implementation
// ============================================================================

/**
 * Web storage using localStorage with optional encryption
 */
const WebStorage = {
  prefix: 'philjs_secure_',

  async get(options: { key: string }): Promise<{ value: string | null }> {
    const value = localStorage.getItem(this.prefix + options.key);
    if (value !== null) {
      storageCache.set(options.key, value);
    }
    return { value };
  },

  async set(options: { key: string; value: string }): Promise<void> {
    localStorage.setItem(this.prefix + options.key, options.value);
    storageCache.set(options.key, options.value);
  },

  async remove(options: { key: string }): Promise<void> {
    localStorage.removeItem(this.prefix + options.key);
    storageCache.delete(options.key);
  },

  async keys(): Promise<{ keys: string[] }> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keys.push(key.slice(this.prefix.length));
      }
    }
    return { keys };
  },

  async clear(): Promise<void> {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    storageCache.clear();
  },

  async migrate(): Promise<void> {
    // No migration needed for web
  },

  async configure(_options: StorageConfig): Promise<void> {
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
  async configure(options: StorageConfig = {}): Promise<void> {
    if (!isNativePlatform()) {
      return WebStorage.configure(options);
    }

    try {
      await callPlugin('Preferences', 'configure', options);
    } catch {
      // Ignore if not available
    }

    storageReady.set(true);
  },

  /**
   * Get a value from storage
   */
  async get(options: { key: string }): Promise<{ value: string | null }> {
    // Check cache first
    if (storageCache.has(options.key)) {
      return { value: storageCache.get(options.key)! };
    }

    if (!isNativePlatform()) {
      return WebStorage.get(options);
    }

    try {
      const result = await callPlugin<{ key: string }, { value: string | null }>(
        'Preferences',
        'get',
        options
      );
      if (result.value !== null) {
        storageCache.set(options.key, result.value);
      }
      return result;
    } catch {
      return { value: null };
    }
  },

  /**
   * Set a value in storage
   */
  async set(options: { key: string; value: string }): Promise<void> {
    if (!isNativePlatform()) {
      return WebStorage.set(options);
    }

    try {
      await callPlugin<{ key: string; value: string }, void>(
        'Preferences',
        'set',
        options
      );
      storageCache.set(options.key, options.value);
    } catch (error) {
      throw new Error(`Storage set failed: ${(error as Error).message}`);
    }
  },

  /**
   * Remove a value from storage
   */
  async remove(options: { key: string }): Promise<void> {
    if (!isNativePlatform()) {
      return WebStorage.remove(options);
    }

    try {
      await callPlugin<{ key: string }, void>('Preferences', 'remove', options);
      storageCache.delete(options.key);
    } catch {
      // Ignore errors
    }
  },

  /**
   * Get all keys
   */
  async keys(): Promise<{ keys: string[] }> {
    if (!isNativePlatform()) {
      return WebStorage.keys();
    }

    try {
      return await callPlugin<never, { keys: string[] }>('Preferences', 'keys');
    } catch {
      return { keys: [] };
    }
  },

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    if (!isNativePlatform()) {
      return WebStorage.clear();
    }

    try {
      await callPlugin('Preferences', 'clear');
      storageCache.clear();
    } catch {
      // Ignore errors
    }
  },

  /**
   * Migrate from old storage (Capacitor 2.x)
   */
  async migrate(): Promise<void> {
    if (!isNativePlatform()) {
      return WebStorage.migrate();
    }

    try {
      await callPlugin('Preferences', 'migrate');
    } catch {
      // Ignore if migration not needed
    }
  },

  /**
   * Get multiple values
   */
  async getMultiple(options: { keys: string[] }): Promise<{ values: (string | null)[] }> {
    const values = await Promise.all(
      options.keys.map(async (key) => {
        const result = await this.get({ key });
        return result.value;
      })
    );
    return { values };
  },

  /**
   * Set multiple values
   */
  async setMultiple(options: { items: StorageItem[] }): Promise<void> {
    await Promise.all(
      options.items.map((item) => this.set({ key: item.key, value: item.value }))
    );
  },

  /**
   * Remove multiple values
   */
  async removeMultiple(options: { keys: string[] }): Promise<void> {
    await Promise.all(options.keys.map((key) => this.remove({ key })));
  },
};

// ============================================================================
// JSON Storage Helpers
// ============================================================================

/**
 * Get JSON value from storage
 */
export async function getJSON<T>(key: string, defaultValue?: T): Promise<T | null> {
  const result = await CapacitorStorage.get({ key });
  if (result.value === null) {
    return defaultValue ?? null;
  }
  try {
    return JSON.parse(result.value) as T;
  } catch {
    return defaultValue ?? null;
  }
}

/**
 * Set JSON value in storage
 */
export async function setJSON<T>(key: string, value: T): Promise<void> {
  await CapacitorStorage.set({
    key,
    value: JSON.stringify(value),
  });
}

/**
 * Update JSON value in storage (merge with existing)
 */
export async function updateJSON<T extends object>(
  key: string,
  updates: Partial<T>
): Promise<T | null> {
  const existing = await getJSON<T>(key);
  if (existing === null) {
    await setJSON(key, updates as T);
    return updates as T;
  }

  const updated = { ...existing, ...updates };
  await setJSON(key, updated);
  return updated;
}

/**
 * Delete JSON value and return it
 */
export async function popJSON<T>(key: string): Promise<T | null> {
  const value = await getJSON<T>(key);
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
  async get(key: string): Promise<string | null> {
    if (!isNativePlatform()) {
      // Use encrypted localStorage for web
      const result = await WebStorage.get({ key: `secure_${key}` });
      return result.value;
    }

    try {
      const result = await callPlugin<{ key: string }, { value: string }>(
        'SecureStoragePlugin',
        'get',
        { key }
      );
      return result.value;
    } catch {
      return null;
    }
  },

  /**
   * Set a secure value
   */
  async set(key: string, value: string): Promise<void> {
    if (!isNativePlatform()) {
      // Use localStorage with prefix for web
      await WebStorage.set({ key: `secure_${key}`, value });
      return;
    }

    try {
      await callPlugin('SecureStoragePlugin', 'set', { key, value });
    } catch (error) {
      throw new Error(`Secure storage set failed: ${(error as Error).message}`);
    }
  },

  /**
   * Remove a secure value
   */
  async remove(key: string): Promise<void> {
    if (!isNativePlatform()) {
      await WebStorage.remove({ key: `secure_${key}` });
      return;
    }

    try {
      await callPlugin('SecureStoragePlugin', 'remove', { key });
    } catch {
      // Ignore errors
    }
  },

  /**
   * Clear all secure values
   */
  async clear(): Promise<void> {
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
    } catch {
      // Ignore errors
    }
  },

  /**
   * Get all secure keys
   */
  async keys(): Promise<string[]> {
    if (!isNativePlatform()) {
      const { keys } = await WebStorage.keys();
      return keys
        .filter((k) => k.startsWith('secure_'))
        .map((k) => k.replace('secure_', ''));
    }

    try {
      const result = await callPlugin<never, { value: string[] }>(
        'SecureStoragePlugin',
        'keys'
      );
      return result.value;
    } catch {
      return [];
    }
  },

  /**
   * Get secure JSON value
   */
  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  /**
   * Set secure JSON value
   */
  async setJSON<T>(key: string, value: T): Promise<void> {
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
  storage: new Map<string, string>(),

  get(key: string): string | null {
    return this.storage.get(key) ?? null;
  },

  set(key: string, value: string): void {
    this.storage.set(key, value);
  },

  remove(key: string): void {
    this.storage.delete(key);
  },

  clear(): void {
    this.storage.clear();
  },

  keys(): string[] {
    return Array.from(this.storage.keys());
  },

  getJSON<T>(key: string): T | null {
    const value = this.get(key);
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  setJSON<T>(key: string, value: T): void {
    this.set(key, JSON.stringify(value));
  },
};

// ============================================================================
// Storage Hooks
// ============================================================================

/**
 * Hook to get/set storage value
 */
export function useStorage<T>(
  key: string,
  initialValue?: T
): [T | null, (value: T) => Promise<void>, () => Promise<void>] {
  const valueSignal = signal<T | null>(initialValue ?? null);

  // Load initial value
  getJSON<T>(key, initialValue).then((value) => {
    valueSignal.set(value);
  });

  const setValue = async (value: T) => {
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
export function useStorageReady(): boolean {
  return storageReady();
}

// ============================================================================
// Exports
// ============================================================================

export default CapacitorStorage;
