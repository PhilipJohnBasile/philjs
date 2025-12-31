/**
 * Biometrics API
 *
 * Face ID, Touch ID, and Fingerprint authentication.
 */
import { type Signal } from 'philjs-core';
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
/**
 * Biometric availability state
 */
export declare const biometricSupport: Signal<BiometricSupport>;
/**
 * Biometrics API singleton
 */
export declare const Biometrics: {
    /**
     * Check if biometrics are available
     */
    isAvailable(): Promise<BiometricSupport>;
    /**
     * Get biometry type
     */
    getBiometryType(): Promise<BiometricType>;
    /**
     * Authenticate with biometrics
     */
    authenticate(options?: AuthenticationOptions): Promise<AuthenticationResult>;
    /**
     * Web-based authentication using WebAuthn
     */
    authenticateWithWebAuthn(options: AuthenticationOptions): Promise<AuthenticationResult>;
    /**
     * Check if device has enrolled biometrics
     */
    hasEnrolledBiometrics(): Promise<boolean>;
    /**
     * Save to secure storage (Keychain/Keystore)
     */
    secureStore(key: string, value: string, options?: SecureStoreOptions): Promise<void>;
    /**
     * Retrieve from secure storage
     */
    secureRetrieve(key: string, options?: {
        authenticationPrompt?: string;
    }): Promise<string | null>;
    /**
     * Delete from secure storage
     */
    secureDelete(key: string): Promise<void>;
    /**
     * Check if key exists in secure storage
     */
    secureHas(key: string): Promise<boolean>;
    /**
     * Create biometric-protected signature
     */
    createSignature(key: string, payload: string, options?: AuthenticationOptions): Promise<string | null>;
    /**
     * Verify signature
     */
    verifySignature(key: string, payload: string, signature: string): Promise<boolean>;
};
/**
 * Hook to check biometric availability
 */
export declare function useBiometrics(): BiometricSupport;
export default Biometrics;
//# sourceMappingURL=Biometrics.d.ts.map