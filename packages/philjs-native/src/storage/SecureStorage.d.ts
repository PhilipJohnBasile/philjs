/**
 * SecureStorage API
 *
 * Encrypted storage for sensitive data.
 * Uses Keychain on iOS, Keystore on Android, and sessionStorage with encryption on web.
 */
import { type Signal } from 'philjs-core';
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
export type SecureAccessible = 'WHEN_UNLOCKED' | 'AFTER_FIRST_UNLOCK' | 'WHEN_UNLOCKED_THIS_DEVICE_ONLY' | 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY' | 'WHEN_PASSCODE_SET_THIS_DEVICE_ONLY';
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
/**
 * Configure SecureStorage
 */
export declare function configureSecureStorage(options: Partial<SecureStorageConfig>): void;
/**
 * SecureStorage - Encrypted key-value storage
 */
export declare const SecureStorage: {
    /**
     * Get item from secure storage
     */
    getItem(key: string, options?: SecureStorageOptions): Promise<string | null>;
    /**
     * Set item in secure storage
     */
    setItem(key: string, value: string, options?: SecureStorageOptions): Promise<void>;
    /**
     * Remove item from secure storage
     */
    removeItem(key: string, options?: SecureStorageOptions): Promise<void>;
    /**
     * Get all keys in secure storage
     */
    getAllKeys(options?: Pick<SecureStorageOptions, "service" | "accessGroup">): Promise<string[]>;
    /**
     * Clear all items from secure storage
     */
    clear(options?: Pick<SecureStorageOptions, "service" | "accessGroup">): Promise<void>;
    /**
     * Check if biometrics are available
     */
    isBiometricsAvailable(): Promise<boolean>;
    /**
     * Authenticate with biometrics
     */
    authenticateWithBiometrics(reason?: string): Promise<BiometricResult>;
    /**
     * Get item with biometric authentication
     */
    getItemWithBiometrics(key: string, reason?: string, options?: SecureStorageOptions): Promise<string | null>;
    /**
     * Set item with biometric protection
     */
    setItemWithBiometrics(key: string, value: string, reason?: string, options?: SecureStorageOptions): Promise<void>;
};
/**
 * Hook for using secure storage
 */
export declare function useSecureStorage<T = string>(key: string, options?: SecureStorageOptions): {
    value: Signal<T | null>;
    loading: Signal<boolean>;
    error: Signal<Error | null>;
    getItem: () => Promise<T | null>;
    setItem: (value: T) => Promise<void>;
    removeItem: () => Promise<void>;
};
export default SecureStorage;
//# sourceMappingURL=SecureStorage.d.ts.map