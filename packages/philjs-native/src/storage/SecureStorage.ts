/**
 * SecureStorage API
 *
 * Encrypted storage for sensitive data.
 * Uses Keychain on iOS, Keystore on Android, and sessionStorage with encryption on web.
 */

import { signal, type Signal } from 'philjs-core';
import { detectPlatform, nativeBridge } from '../runtime.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Secure storage options
 */
export interface SecureStorageOptions {
  /**
   * Whether to require biometric authentication
   */
  requireBiometrics?: boolean;

  /**
   * Accessibility level (iOS)
   */
  accessible?: SecureAccessible;

  /**
   * Service name for keychain (iOS)
   */
  service?: string;

  /**
   * Access group for sharing between apps (iOS)
   */
  accessGroup?: string;
}

/**
 * Keychain accessibility levels (iOS)
 */
export type SecureAccessible =
  | 'WHEN_UNLOCKED'
  | 'AFTER_FIRST_UNLOCK'
  | 'WHEN_UNLOCKED_THIS_DEVICE_ONLY'
  | 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY'
  | 'WHEN_PASSCODE_SET_THIS_DEVICE_ONLY';

/**
 * Secure storage result
 */
export interface SecureStorageResult {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * Error message if failed
   */
  error?: string;

  /**
   * Retrieved value (for get operations)
   */
  value?: string;
}

/**
 * Biometric authentication result
 */
export interface BiometricResult {
  /**
   * Whether authentication succeeded
   */
  success: boolean;

  /**
   * Error type if failed
   */
  error?: 'USER_CANCELED' | 'BIOMETRY_NOT_AVAILABLE' | 'BIOMETRY_NOT_ENROLLED' | 'AUTHENTICATION_FAILED';

  /**
   * Error message
   */
  message?: string;
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Secure storage configuration
 */
interface SecureStorageConfig {
  /**
   * Key prefix for namespacing
   */
  prefix: string;

  /**
   * Default service name (iOS)
   */
  defaultService: string;

  /**
   * Enable debug logging
   */
  debug: boolean;
}

const config: SecureStorageConfig = {
  prefix: '@securestorage:',
  defaultService: 'com.philjs.securestorage',
  debug: false,
};

/**
 * Configure SecureStorage
 */
export function configureSecureStorage(options: Partial<SecureStorageConfig>): void {
  Object.assign(config, options);
}

// ============================================================================
// Web Encryption Helpers
// ============================================================================

/**
 * Generate encryption key from password
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Get or create device-specific encryption key
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  // Use a device-specific identifier (or generate one)
  let deviceId = sessionStorage.getItem('__philjs_device_id__');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    sessionStorage.setItem('__philjs_device_id__', deviceId);
  }

  // Get or generate salt
  let saltBase64 = localStorage.getItem('__philjs_salt__');
  let salt: Uint8Array;

  if (saltBase64) {
    salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
  } else {
    salt = crypto.getRandomValues(new Uint8Array(16));
    localStorage.setItem('__philjs_salt__', btoa(String.fromCharCode(...salt)));
  }

  return deriveKey(deviceId, salt);
}

/**
 * Encrypt a value
 */
async function encrypt(value: string): Promise<string> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(value)
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt a value
 */
async function decrypt(encrypted: string): Promise<string> {
  const key = await getEncryptionKey();
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));

  // Extract IV and data
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

// ============================================================================
// SecureStorage API
// ============================================================================

/**
 * SecureStorage - Encrypted key-value storage
 */
export const SecureStorage = {
  /**
   * Get item from secure storage
   */
  async getItem(key: string, options?: SecureStorageOptions): Promise<string | null> {
    const platform = detectPlatform();
    const prefixedKey = `${config.prefix}${key}`;

    if (config.debug) {
      console.log('[SecureStorage] getItem:', key);
    }

    if (platform === 'web') {
      try {
        const encrypted = sessionStorage.getItem(prefixedKey);
        if (encrypted === null) return null;
        return await decrypt(encrypted);
      } catch (error) {
        console.error('[SecureStorage] Decryption failed:', error);
        // Remove corrupted data
        sessionStorage.removeItem(prefixedKey);
        return null;
      }
    }

    // Native implementation
    const result = await nativeBridge.call<SecureStorageResult>(
      'SecureStorage',
      'getItem',
      {
        key: prefixedKey,
        service: options?.service || config.defaultService,
        requireBiometrics: options?.requireBiometrics,
        accessGroup: options?.accessGroup,
      }
    );

    if (!result.success) {
      if (config.debug) {
        console.log('[SecureStorage] getItem failed:', result.error);
      }
      return null;
    }

    return result.value ?? null;
  },

  /**
   * Set item in secure storage
   */
  async setItem(key: string, value: string, options?: SecureStorageOptions): Promise<void> {
    const platform = detectPlatform();
    const prefixedKey = `${config.prefix}${key}`;

    if (config.debug) {
      console.log('[SecureStorage] setItem:', key, `(${value.length} chars)`);
    }

    if (platform === 'web') {
      const encrypted = await encrypt(value);
      sessionStorage.setItem(prefixedKey, encrypted);
      return;
    }

    // Native implementation
    const result = await nativeBridge.call<SecureStorageResult>(
      'SecureStorage',
      'setItem',
      {
        key: prefixedKey,
        value,
        service: options?.service || config.defaultService,
        accessible: options?.accessible || 'WHEN_UNLOCKED',
        requireBiometrics: options?.requireBiometrics,
        accessGroup: options?.accessGroup,
      }
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to store item securely');
    }
  },

  /**
   * Remove item from secure storage
   */
  async removeItem(key: string, options?: SecureStorageOptions): Promise<void> {
    const platform = detectPlatform();
    const prefixedKey = `${config.prefix}${key}`;

    if (config.debug) {
      console.log('[SecureStorage] removeItem:', key);
    }

    if (platform === 'web') {
      sessionStorage.removeItem(prefixedKey);
      return;
    }

    // Native implementation
    await nativeBridge.call(
      'SecureStorage',
      'removeItem',
      {
        key: prefixedKey,
        service: options?.service || config.defaultService,
        accessGroup: options?.accessGroup,
      }
    );
  },

  /**
   * Get all keys in secure storage
   */
  async getAllKeys(options?: Pick<SecureStorageOptions, 'service' | 'accessGroup'>): Promise<string[]> {
    const platform = detectPlatform();

    if (platform === 'web') {
      const keys: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(config.prefix)) {
          keys.push(key.substring(config.prefix.length));
        }
      }
      return keys;
    }

    // Native implementation
    return nativeBridge.call<string[]>(
      'SecureStorage',
      'getAllKeys',
      {
        service: options?.service || config.defaultService,
        prefix: config.prefix,
        accessGroup: options?.accessGroup,
      }
    );
  },

  /**
   * Clear all items from secure storage
   */
  async clear(options?: Pick<SecureStorageOptions, 'service' | 'accessGroup'>): Promise<void> {
    const platform = detectPlatform();

    if (config.debug) {
      console.log('[SecureStorage] clear');
    }

    if (platform === 'web') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith(config.prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      return;
    }

    // Native implementation
    await nativeBridge.call(
      'SecureStorage',
      'clear',
      {
        service: options?.service || config.defaultService,
        prefix: config.prefix,
        accessGroup: options?.accessGroup,
      }
    );
  },

  /**
   * Check if biometrics are available
   */
  async isBiometricsAvailable(): Promise<boolean> {
    const platform = detectPlatform();

    if (platform === 'web') {
      // Check for WebAuthn support
      return (
        typeof PublicKeyCredential !== 'undefined' &&
        typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function' &&
        (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
      );
    }

    return nativeBridge.call<boolean>('SecureStorage', 'isBiometricsAvailable');
  },

  /**
   * Authenticate with biometrics
   */
  async authenticateWithBiometrics(
    reason: string = 'Authenticate to access secure data'
  ): Promise<BiometricResult> {
    const platform = detectPlatform();

    if (platform === 'web') {
      // WebAuthn-based authentication
      try {
        if (!(await this.isBiometricsAvailable())) {
          return {
            success: false,
            error: 'BIOMETRY_NOT_AVAILABLE',
            message: 'Biometric authentication is not available',
          };
        }

        // For web, we'd use WebAuthn here
        // This is a simplified placeholder
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: 'AUTHENTICATION_FAILED',
          message: error instanceof Error ? error.message : 'Authentication failed',
        };
      }
    }

    // Native implementation
    return nativeBridge.call<BiometricResult>(
      'SecureStorage',
      'authenticateWithBiometrics',
      reason
    );
  },

  /**
   * Get item with biometric authentication
   */
  async getItemWithBiometrics(
    key: string,
    reason?: string,
    options?: SecureStorageOptions
  ): Promise<string | null> {
    const authResult = await this.authenticateWithBiometrics(reason);
    if (!authResult.success) {
      throw new Error(authResult.message || 'Biometric authentication failed');
    }
    return this.getItem(key, { ...options, requireBiometrics: true });
  },

  /**
   * Set item with biometric protection
   */
  async setItemWithBiometrics(
    key: string,
    value: string,
    reason?: string,
    options?: SecureStorageOptions
  ): Promise<void> {
    const authResult = await this.authenticateWithBiometrics(reason);
    if (!authResult.success) {
      throw new Error(authResult.message || 'Biometric authentication failed');
    }
    return this.setItem(key, value, { ...options, requireBiometrics: true });
  },
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook for using secure storage
 */
export function useSecureStorage<T = string>(
  key: string,
  options?: SecureStorageOptions
): {
  value: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  getItem: () => Promise<T | null>;
  setItem: (value: T) => Promise<void>;
  removeItem: () => Promise<void>;
} {
  const valueSignal = signal<T | null>(null);
  const loadingSignal = signal(true);
  const errorSignal = signal<Error | null>(null);

  // Load initial value
  (async () => {
    try {
      const stored = await SecureStorage.getItem(key, options);
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
        const stored = await SecureStorage.getItem(key, options);
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
        await SecureStorage.setItem(key, serialized, options);
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
        await SecureStorage.removeItem(key, options);
        valueSignal.set(null);
      } catch (err) {
        errorSignal.set(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        loadingSignal.set(false);
      }
    },
  };
}

export default SecureStorage;
