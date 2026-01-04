/**
 * @philjs/biometric - Native Biometric Authentication
 *
 * WebAuthn, Face ID, Touch ID, and Windows Hello integration.
 * NO OTHER FRAMEWORK provides native biometric authentication.
 *
 * Features:
 * - WebAuthn/FIDO2 registration and authentication
 * - Passkey support
 * - Platform authenticator detection
 * - Cross-device authentication
 * - Conditional UI (autofill)
 * - Attestation verification
 * - Fallback strategies
 */
export interface BiometricCredential {
    id: string;
    rawId: ArrayBuffer;
    type: 'public-key';
    authenticatorAttachment: 'platform' | 'cross-platform' | null;
    createdAt: number;
    lastUsed?: number;
    deviceInfo?: string;
    name?: string;
}
export interface BiometricConfig {
    rpName: string;
    rpId?: string;
    timeout?: number;
    userVerification?: 'required' | 'preferred' | 'discouraged';
    attestation?: 'none' | 'indirect' | 'direct' | 'enterprise';
    authenticatorAttachment?: 'platform' | 'cross-platform';
    residentKey?: 'required' | 'preferred' | 'discouraged';
    requireResidentKey?: boolean;
}
export interface RegistrationOptions {
    userId: string;
    userName: string;
    userDisplayName?: string;
    excludeCredentials?: BiometricCredential[];
    challenge?: ArrayBuffer;
}
export interface AuthenticationOptions {
    allowCredentials?: BiometricCredential[];
    challenge?: ArrayBuffer;
    conditional?: boolean;
}
export interface RegistrationResult {
    credential: BiometricCredential;
    attestationObject: ArrayBuffer;
    clientDataJSON: ArrayBuffer;
    publicKey?: ArrayBuffer;
    publicKeyAlgorithm?: number;
    transports?: AuthenticatorTransport[];
}
export interface AuthenticationResult {
    credentialId: string;
    authenticatorData: ArrayBuffer;
    clientDataJSON: ArrayBuffer;
    signature: ArrayBuffer;
    userHandle?: ArrayBuffer;
}
export interface BiometricCapabilities {
    supported: boolean;
    platformAuthenticator: boolean;
    conditionalUI: boolean;
    userVerifyingPlatformAuthenticator: boolean;
}
declare function arrayBufferToBase64Url(buffer: ArrayBuffer): string;
declare function base64UrlToArrayBuffer(base64url: string): ArrayBuffer;
declare function generateChallenge(): ArrayBuffer;
export declare class BiometricManager {
    private config;
    private credentials;
    constructor(config: BiometricConfig);
    static getCapabilities(): Promise<BiometricCapabilities>;
    static isSupported(): boolean;
    register(options: RegistrationOptions): Promise<RegistrationResult>;
    authenticate(options?: AuthenticationOptions): Promise<AuthenticationResult>;
    conditionalAuthenticate(abortController?: AbortController): Promise<AuthenticationResult>;
    addCredential(credential: BiometricCredential): void;
    removeCredential(credentialId: string): boolean;
    getCredentials(): BiometricCredential[];
    getCredential(credentialId: string): BiometricCredential | undefined;
    clearCredentials(): void;
    serializeCredential(credential: BiometricCredential): string;
    deserializeCredential(serialized: string): BiometricCredential;
}
export declare class PasskeyManager {
    private biometricManager;
    private storageKey;
    constructor(config: BiometricConfig, storageKey?: string);
    private loadCredentials;
    private saveCredentials;
    createPasskey(userId: string, userName: string, displayName?: string): Promise<RegistrationResult>;
    signInWithPasskey(): Promise<AuthenticationResult>;
    signInWithAutofill(abortController?: AbortController): Promise<AuthenticationResult>;
    getPasskeys(): BiometricCredential[];
    renamePasskey(credentialId: string, name: string): boolean;
    deletePasskey(credentialId: string): boolean;
    clearPasskeys(): void;
}
export interface BiometricPromptOptions {
    title?: string;
    subtitle?: string;
    description?: string;
    negativeButtonText?: string;
    confirmationRequired?: boolean;
}
export declare class BiometricPrompt {
    private config;
    constructor(config: BiometricConfig);
    prompt(options?: BiometricPromptOptions): Promise<boolean>;
    static isAvailable(): Promise<boolean>;
    static getBiometricType(): Promise<'face' | 'fingerprint' | 'iris' | 'unknown'>;
}
/**
 * Hook for biometric authentication
 */
export declare function useBiometric(config: BiometricConfig): {
    capabilities: BiometricCapabilities | null;
    register: (options: RegistrationOptions) => Promise<RegistrationResult>;
    authenticate: (options?: AuthenticationOptions) => Promise<AuthenticationResult>;
    credentials: BiometricCredential[];
    isSupported: boolean;
    loading: boolean;
    error: Error | null;
};
/**
 * Hook for passkey management
 */
export declare function usePasskeys(config: BiometricConfig, storageKey?: string): {
    passkeys: BiometricCredential[];
    createPasskey: (userId: string, userName: string, displayName?: string) => Promise<RegistrationResult>;
    signIn: () => Promise<AuthenticationResult>;
    signInWithAutofill: (abortController?: AbortController) => Promise<AuthenticationResult>;
    renamePasskey: (id: string, name: string) => boolean;
    deletePasskey: (id: string) => boolean;
    clearPasskeys: () => void;
    loading: boolean;
    error: Error | null;
};
/**
 * Hook for biometric prompt
 */
export declare function useBiometricPrompt(config: BiometricConfig): {
    prompt: (options?: BiometricPromptOptions) => Promise<boolean>;
    isAvailable: boolean;
    biometricType: 'face' | 'fingerprint' | 'iris' | 'unknown';
    loading: boolean;
};
declare const _default: {
    BiometricManager: typeof BiometricManager;
    PasskeyManager: typeof PasskeyManager;
    BiometricPrompt: typeof BiometricPrompt;
    useBiometric: typeof useBiometric;
    usePasskeys: typeof usePasskeys;
    useBiometricPrompt: typeof useBiometricPrompt;
    arrayBufferToBase64Url: typeof arrayBufferToBase64Url;
    base64UrlToArrayBuffer: typeof base64UrlToArrayBuffer;
    generateChallenge: typeof generateChallenge;
};
export default _default;
//# sourceMappingURL=index.d.ts.map