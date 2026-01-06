/**
 * @philjs/auth - Passkey/WebAuthn Primitives
 *
 * Modern passwordless authentication using Web Authentication API.
 * Supports passkeys, security keys, and biometric authentication.
 *
 * @example
 * ```tsx
 * import { usePasskey, registerPasskey, authenticateWithPasskey } from '@philjs/auth/webauthn';
 *
 * function LoginPage() {
 *   const { isSupported, isRegistered, register, authenticate } = usePasskey();
 *
 *   if (!isSupported()) {
 *     return <p>Passkeys are not supported on this device</p>;
 *   }
 *
 *   return (
 *     <div>
 *       {!isRegistered() ? (
 *         <button onClick={() => register()}>Register Passkey</button>
 *       ) : (
 *         <button onClick={() => authenticate()}>Sign in with Passkey</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */

import { signal, type Signal } from '@philjs/core';

// Types

export interface WebAuthnConfig {
  /** Relying Party ID (usually your domain) */
  rpId: string;
  /** Relying Party name */
  rpName: string;
  /** Server endpoints */
  endpoints: WebAuthnEndpoints;
  /** Timeout for WebAuthn operations (ms) */
  timeout?: number;
  /** Attestation preference */
  attestation?: AttestationConveyancePreference;
  /** Authenticator selection */
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  /** Credential hints */
  hints?: ('client-device' | 'security-key' | 'hybrid')[];
}

export interface WebAuthnEndpoints {
  /** Get registration options */
  registrationOptions: string;
  /** Verify registration */
  registrationVerify: string;
  /** Get authentication options */
  authenticationOptions: string;
  /** Verify authentication */
  authenticationVerify: string;
}

export interface PasskeyCredential {
  id: string;
  rawId: ArrayBuffer;
  type: 'public-key';
  authenticatorAttachment?: AuthenticatorAttachment;
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
}

export interface RegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: PublicKeyCredentialParameters[];
  timeout?: number;
  attestation?: AttestationConveyancePreference;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  excludeCredentials?: PublicKeyCredentialDescriptor[];
  extensions?: AuthenticationExtensionsClientInputs;
}

export interface AuthenticationOptions {
  challenge: string;
  timeout?: number;
  rpId: string;
  allowCredentials?: PublicKeyCredentialDescriptor[];
  userVerification?: UserVerificationRequirement;
  extensions?: AuthenticationExtensionsClientInputs;
}

export interface VerificationResult {
  verified: boolean;
  user?: {
    id: string;
    name: string;
    email?: string;
  };
  credential?: {
    id: string;
    publicKey: string;
    counter: number;
  };
}

// State

const supportedSignal: Signal<boolean> = signal(false);
const registeredSignal: Signal<boolean> = signal(false);
const loadingSignal: Signal<boolean> = signal(false);
const errorSignal: Signal<Error | null> = signal(null);
const userSignal: Signal<{ id: string; name: string; email?: string } | null> = signal(null);

let config: WebAuthnConfig | null = null;

// Core Functions

/**
 * Initializes WebAuthn with configuration
 */
export function initWebAuthn(cfg: WebAuthnConfig): void {
  config = {
    timeout: 60000,
    attestation: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
    ...cfg,
  };

  // Check browser support
  supportedSignal.set(isWebAuthnSupported());

  // Check for existing passkey
  checkExistingPasskey();
}

/**
 * Hook for passkey functionality
 */
export function usePasskey() {
  return {
    isSupported: supportedSignal,
    isRegistered: registeredSignal,
    isLoading: loadingSignal,
    error: errorSignal,
    user: userSignal,
    register: registerPasskey,
    authenticate: authenticateWithPasskey,
    isConditionalMediationAvailable,
  };
}

/**
 * Checks if WebAuthn is supported in the current browser
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'PublicKeyCredential' in window &&
    typeof window.PublicKeyCredential === 'function'
  );
}

/**
 * Checks if conditional mediation (autofill) is available
 */
export async function isConditionalMediationAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;

  try {
    return await PublicKeyCredential.isConditionalMediationAvailable?.() ?? false;
  } catch {
    return false;
  }
}

/**
 * Registers a new passkey for the user
 */
export async function registerPasskey(user: {
  id: string;
  name: string;
  displayName: string;
}): Promise<VerificationResult> {
  if (!config) throw new Error('WebAuthn not initialized. Call initWebAuthn first.');
  if (!isWebAuthnSupported()) throw new Error('WebAuthn not supported');

  try {
    loadingSignal.set(true);
    errorSignal.set(null);

    // Get registration options from server
    const optionsResponse = await fetch(config.endpoints.registrationOptions, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
      credentials: 'include',
    });

    if (!optionsResponse.ok) {
      throw new Error('Failed to get registration options');
    }

    const options: RegistrationOptions = await optionsResponse.json();

    // Create credential
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: base64ToArrayBuffer(options.challenge),
        rp: {
          name: options.rp.name,
          id: options.rp.id,
        },
        user: {
          id: base64ToArrayBuffer(options.user.id),
          name: options.user.name,
          displayName: options.user.displayName,
        },
        pubKeyCredParams: options.pubKeyCredParams,
        timeout: options.timeout || config.timeout,
        attestation: options.attestation || config.attestation,
        authenticatorSelection: options.authenticatorSelection || config.authenticatorSelection,
        excludeCredentials: options.excludeCredentials?.map((c) => ({
          ...c,
          id: base64ToArrayBuffer(c.id as unknown as string),
        })),
        extensions: options.extensions,
      },
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Failed to create credential');
    }

    // Send credential to server for verification
    const attestationResponse = credential.response as AuthenticatorAttestationResponse;

    const verifyResponse = await fetch(config.endpoints.registrationVerify, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: credential.id,
        rawId: arrayBufferToBase64(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: arrayBufferToBase64(attestationResponse.clientDataJSON),
          attestationObject: arrayBufferToBase64(attestationResponse.attestationObject),
          transports: attestationResponse.getTransports?.() || [],
        },
      }),
      credentials: 'include',
    });

    if (!verifyResponse.ok) {
      throw new Error('Failed to verify registration');
    }

    const result: VerificationResult = await verifyResponse.json();

    if (result.verified) {
      registeredSignal.set(true);
      if (result.user) {
        userSignal.set(result.user);
      }
    }

    return result;
  } catch (error) {
    errorSignal.set(error as Error);
    throw error;
  } finally {
    loadingSignal.set(false);
  }
}

/**
 * Authenticates with an existing passkey
 */
export async function authenticateWithPasskey(options?: {
  conditional?: boolean;
}): Promise<VerificationResult> {
  if (!config) throw new Error('WebAuthn not initialized. Call initWebAuthn first.');
  if (!isWebAuthnSupported()) throw new Error('WebAuthn not supported');

  try {
    loadingSignal.set(true);
    errorSignal.set(null);

    // Get authentication options from server
    const optionsResponse = await fetch(config.endpoints.authenticationOptions, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (!optionsResponse.ok) {
      throw new Error('Failed to get authentication options');
    }

    const authOptions: AuthenticationOptions = await optionsResponse.json();

    // Get credential
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge: base64ToArrayBuffer(authOptions.challenge),
        timeout: authOptions.timeout || config.timeout,
        rpId: authOptions.rpId,
        allowCredentials: authOptions.allowCredentials?.map((c) => ({
          ...c,
          id: base64ToArrayBuffer(c.id as unknown as string),
        })),
        userVerification: authOptions.userVerification,
        extensions: authOptions.extensions,
      },
      mediation: options?.conditional ? 'conditional' : 'optional',
    }) as PublicKeyCredential;

    if (!credential) {
      throw new Error('No credential selected');
    }

    // Send credential to server for verification
    const assertionResponse = credential.response as AuthenticatorAssertionResponse;

    const verifyResponse = await fetch(config.endpoints.authenticationVerify, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: credential.id,
        rawId: arrayBufferToBase64(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: arrayBufferToBase64(assertionResponse.clientDataJSON),
          authenticatorData: arrayBufferToBase64(assertionResponse.authenticatorData),
          signature: arrayBufferToBase64(assertionResponse.signature),
          userHandle: assertionResponse.userHandle
            ? arrayBufferToBase64(assertionResponse.userHandle)
            : null,
        },
      }),
      credentials: 'include',
    });

    if (!verifyResponse.ok) {
      throw new Error('Failed to verify authentication');
    }

    const result: VerificationResult = await verifyResponse.json();

    if (result.verified && result.user) {
      userSignal.set(result.user);
      registeredSignal.set(true);
    }

    return result;
  } catch (error) {
    errorSignal.set(error as Error);
    throw error;
  } finally {
    loadingSignal.set(false);
  }
}

/**
 * Starts conditional UI (autofill) authentication
 */
export async function startConditionalUI(
  inputElement: HTMLInputElement
): Promise<VerificationResult | null> {
  if (!(await isConditionalMediationAvailable())) {
    return null;
  }

  // Add autocomplete attribute
  inputElement.autocomplete = 'username webauthn';

  try {
    return await authenticateWithPasskey({ conditional: true });
  } catch (error) {
    // Conditional UI was aborted or failed
    return null;
  }
}

/**
 * Lists registered passkeys for the current user
 */
export async function listPasskeys(): Promise<
  Array<{
    id: string;
    createdAt: string;
    lastUsed: string;
    deviceType: string;
  }>
> {
  if (!config) throw new Error('WebAuthn not initialized');

  // This would typically be a server call
  return [];
}

/**
 * Removes a registered passkey
 */
export async function removePasskey(credentialId: string): Promise<void> {
  if (!config) throw new Error('WebAuthn not initialized');

  // This would typically be a server call
}

// Helper Functions

async function checkExistingPasskey(): Promise<void> {
  if (!config || !isWebAuthnSupported()) return;

  try {
    // Check if user has existing passkey via server
    const response = await fetch(config.endpoints.authenticationOptions, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (response.ok) {
      const options = await response.json();
      registeredSignal.set(options.allowCredentials?.length > 0);
    }
  } catch {
    // Silently fail
  }
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Handle base64url encoding
  const base64Standard = base64.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (base64Standard.length % 4)) % 4);
  const binary = atob(base64Standard + padding);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  // Use base64url encoding
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Components

/**
 * Passkey button component
 */
export function PasskeyButton(props: {
  mode: 'register' | 'authenticate';
  user?: { id: string; name: string; displayName: string };
  onSuccess?: (result: VerificationResult) => void;
  onError?: (error: Error) => void;
  children?: any;
  class?: string;
  style?: string | Record<string, string>;
}) {
  const loading = loadingSignal;
  const supported = supportedSignal;

  async function handleClick() {
    try {
      let result: VerificationResult;

      if (props.mode === 'register') {
        if (!props.user) {
          throw new Error('User data required for registration');
        }
        result = await registerPasskey(props.user);
      } else {
        result = await authenticateWithPasskey();
      }

      props.onSuccess?.(result);
    } catch (error) {
      props.onError?.(error as Error);
    }
  }

  if (!supported()) {
    return null;
  }

  return {
    type: 'button',
    props: {
      onClick: handleClick,
      disabled: loading(),
      class: props.class,
      style: props.style,
      'aria-busy': loading(),
    },
    children: loading()
      ? 'Loading...'
      : props.children || (props.mode === 'register' ? 'Register Passkey' : 'Sign in with Passkey'),
  };
}

/**
 * Passkey input with conditional UI
 */
export function PasskeyInput(props: {
  onAuthenticate?: (result: VerificationResult) => void;
  placeholder?: string;
  class?: string;
  style?: string | Record<string, string>;
}) {
  let inputRef: HTMLInputElement | null = null;

  function setRef(el: HTMLInputElement) {
    inputRef = el;
    if (el) {
      startConditionalUI(el).then((result) => {
        if (result) {
          props.onAuthenticate?.(result);
        }
      });
    }
  }

  return {
    type: 'input',
    props: {
      ref: setRef,
      type: 'text',
      autocomplete: 'username webauthn',
      placeholder: props.placeholder || 'Username',
      class: props.class,
      style: props.style,
    },
  };
}

// Export types
export type {
  WebAuthnConfig,
  WebAuthnEndpoints,
  PasskeyCredential,
  RegistrationOptions,
  AuthenticationOptions,
  VerificationResult,
};
