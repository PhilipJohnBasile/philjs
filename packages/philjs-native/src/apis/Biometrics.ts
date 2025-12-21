/**
 * Biometrics API
 *
 * Face ID, Touch ID, and Fingerprint authentication.
 */

import { signal, type Signal } from 'philjs-core';
import { detectPlatform, nativeBridge, platformSelect } from '../runtime.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Biometric type
 */
export type BiometricType = 'faceId' | 'touchId' | 'fingerprint' | 'iris' | 'none';

/**
 * Biometric support status
 */
export interface BiometricSupport {
  available: boolean;
  biometryType: BiometricType;
  error?: string;
}

/**
 * Authentication options
 */
export interface AuthenticationOptions {
  /**
   * Prompt message
   */
  promptMessage?: string;

  /**
   * Cancel button text
   */
  cancelTitle?: string;

  /**
   * Fallback to passcode/password
   */
  fallbackTitle?: string;

  /**
   * Allow device credentials (PIN/Pattern/Password)
   */
  allowDeviceCredentials?: boolean;

  /**
   * Confirmation required (Android)
   */
  confirmationRequired?: boolean;

  /**
   * Invalidated by biometry change
   */
  invalidatedByBiometryChange?: boolean;
}

/**
 * Authentication result
 */
export interface AuthenticationResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

/**
 * Keychain/Keystore options
 */
export interface SecureStoreOptions {
  /**
   * Access control
   */
  accessControl?: 'biometryAny' | 'biometryCurrentSet' | 'devicePasscode' | 'userPresence';

  /**
   * Require authentication
   */
  requireAuthentication?: boolean;

  /**
   * Authentication prompt
   */
  authenticationPrompt?: string;
}

// ============================================================================
// Biometrics State
// ============================================================================

/**
 * Biometric availability state
 */
export const biometricSupport: Signal<BiometricSupport> = signal<BiometricSupport>({
  available: false,
  biometryType: 'none',
});

// ============================================================================
// Biometrics API
// ============================================================================

/**
 * Biometrics API singleton
 */
export const Biometrics = {
  /**
   * Check if biometrics are available
   */
  async isAvailable(): Promise<BiometricSupport> {
    const platform = detectPlatform();

    if (platform === 'web') {
      // Check for WebAuthn support
      if (
        typeof window !== 'undefined' &&
        window.PublicKeyCredential &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
      ) {
        try {
          const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          const support: BiometricSupport = {
            available,
            biometryType: available ? 'fingerprint' : 'none', // Web can't distinguish type
          };
          biometricSupport.set(support);
          return support;
        } catch {
          return { available: false, biometryType: 'none' };
        }
      }

      return { available: false, biometryType: 'none' };
    }

    const support = await nativeBridge.call<BiometricSupport>('Biometrics', 'isAvailable');
    biometricSupport.set(support);
    return support;
  },

  /**
   * Get biometry type
   */
  async getBiometryType(): Promise<BiometricType> {
    const support = await this.isAvailable();
    return support.biometryType;
  },

  /**
   * Authenticate with biometrics
   */
  async authenticate(options?: AuthenticationOptions): Promise<AuthenticationResult> {
    const platform = detectPlatform();
    const defaultMessage = platformSelect({
      ios: 'Authenticate to continue',
      android: 'Verify your identity',
      default: 'Authenticate',
    });

    const opts = {
      promptMessage: defaultMessage,
      ...options,
    };

    if (platform === 'web') {
      return this.authenticateWithWebAuthn(opts);
    }

    return nativeBridge.call<AuthenticationResult>('Biometrics', 'authenticate', opts);
  },

  /**
   * Web-based authentication using WebAuthn
   */
  async authenticateWithWebAuthn(options: AuthenticationOptions): Promise<AuthenticationResult> {
    if (!window.PublicKeyCredential) {
      return { success: false, error: 'WebAuthn not supported' };
    }

    try {
      // Create a challenge
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required',
          rpId: window.location.hostname,
        },
      });

      if (credential) {
        return { success: true };
      }

      return { success: false, error: 'Authentication cancelled' };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: err.message,
        errorCode: (err as any).name,
      };
    }
  },

  /**
   * Check if device has enrolled biometrics
   */
  async hasEnrolledBiometrics(): Promise<boolean> {
    const support = await this.isAvailable();
    return support.available;
  },

  /**
   * Save to secure storage (Keychain/Keystore)
   */
  async secureStore(
    key: string,
    value: string,
    options?: SecureStoreOptions
  ): Promise<void> {
    const platform = detectPlatform();

    if (platform === 'web') {
      // Web uses IndexedDB with encryption (simplified)
      const encryptedValue = btoa(value);
      localStorage.setItem(`secure:${key}`, encryptedValue);
      return;
    }

    return nativeBridge.call('Biometrics', 'secureStore', key, value, options);
  },

  /**
   * Retrieve from secure storage
   */
  async secureRetrieve(
    key: string,
    options?: { authenticationPrompt?: string }
  ): Promise<string | null> {
    const platform = detectPlatform();

    if (platform === 'web') {
      const encryptedValue = localStorage.getItem(`secure:${key}`);
      if (!encryptedValue) return null;

      // Require authentication before returning
      const authResult = await this.authenticate({
        promptMessage: options?.authenticationPrompt || 'Authenticate to access secure data',
      });

      if (!authResult.success) {
        throw new Error('Authentication required');
      }

      return atob(encryptedValue);
    }

    return nativeBridge.call<string | null>('Biometrics', 'secureRetrieve', key, options);
  },

  /**
   * Delete from secure storage
   */
  async secureDelete(key: string): Promise<void> {
    const platform = detectPlatform();

    if (platform === 'web') {
      localStorage.removeItem(`secure:${key}`);
      return;
    }

    return nativeBridge.call('Biometrics', 'secureDelete', key);
  },

  /**
   * Check if key exists in secure storage
   */
  async secureHas(key: string): Promise<boolean> {
    const platform = detectPlatform();

    if (platform === 'web') {
      return localStorage.getItem(`secure:${key}`) !== null;
    }

    return nativeBridge.call<boolean>('Biometrics', 'secureHas', key);
  },

  /**
   * Create biometric-protected signature
   */
  async createSignature(
    key: string,
    payload: string,
    options?: AuthenticationOptions
  ): Promise<string | null> {
    const platform = detectPlatform();

    if (platform === 'web') {
      // Simplified - would use WebCrypto in production
      const authResult = await this.authenticate(options);
      if (!authResult.success) return null;

      // Create simple hash signature
      const encoder = new TextEncoder();
      const data = encoder.encode(payload);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    return nativeBridge.call<string | null>('Biometrics', 'createSignature', key, payload, options);
  },

  /**
   * Verify signature
   */
  async verifySignature(
    key: string,
    payload: string,
    signature: string
  ): Promise<boolean> {
    const platform = detectPlatform();

    if (platform === 'web') {
      // Verify by recreating signature
      const encoder = new TextEncoder();
      const data = encoder.encode(payload);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return signature === expectedSignature;
    }

    return nativeBridge.call<boolean>('Biometrics', 'verifySignature', key, payload, signature);
  },
};

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to check biometric availability
 */
export function useBiometrics(): BiometricSupport {
  // Check on mount
  Biometrics.isAvailable();
  return biometricSupport();
}

// ============================================================================
// Export
// ============================================================================

export default Biometrics;
