/**
 * PhilJS Native Storage
 *
 * Persistent and secure storage APIs.
 */

// AsyncStorage
export {
  AsyncStorage,
  configureAsyncStorage,
  useAsyncStorage,
  useStoredValue,
  AsyncStorageError,
} from './AsyncStorage.js';

export type {
  StorageCallback,
  MultiGetResult,
  MultiSetInput,
} from './AsyncStorage.js';

// SecureStorage
export {
  SecureStorage,
  configureSecureStorage,
  useSecureStorage,
} from './SecureStorage.js';

export type {
  SecureStorageOptions,
  SecureAccessible,
  SecureStorageResult,
  BiometricResult,
} from './SecureStorage.js';
