# @philjs/biometric

WebAuthn and FIDO2 biometric authentication with Face ID, Touch ID, Windows Hello, and passkey support.

## Installation

```bash
npm install @philjs/biometric
```

## Features

- **WebAuthn/FIDO2** - Standard-based authentication
- **Passkeys** - Passwordless authentication
- **Platform Authenticators** - Face ID, Touch ID, Windows Hello
- **Cross-Platform** - Security keys, phones
- **Conditional UI** - Autofill integration
- **Attestation** - Verify authenticator identity
- **Credential Management** - Store and manage credentials

## Quick Start

```typescript
import { BiometricManager } from '@philjs/biometric';

const manager = new BiometricManager({
  rpName: 'My App',
  rpId: 'myapp.com',
});

// Register a new credential
const result = await manager.register({
  userId: 'user-123',
  userName: 'john@example.com',
  userDisplayName: 'John Doe',
});

// Authenticate
const authResult = await manager.authenticate();
```

## BiometricManager

### Configuration

```typescript
const manager = new BiometricManager({
  rpName: 'My Application',           // Required: Relying party name
  rpId: 'example.com',                // Domain (defaults to current hostname)
  timeout: 60000,                     // 60 seconds
  userVerification: 'preferred',      // 'required' | 'preferred' | 'discouraged'
  attestation: 'none',                // 'none' | 'indirect' | 'direct' | 'enterprise'
  authenticatorAttachment: 'platform', // 'platform' | 'cross-platform'
  residentKey: 'preferred',           // 'required' | 'preferred' | 'discouraged'
  requireResidentKey: false,
});
```

### Check Capabilities

```typescript
const capabilities = await BiometricManager.getCapabilities();

console.log({
  supported: capabilities.supported,
  platformAuthenticator: capabilities.platformAuthenticator, // Face ID, Touch ID, etc.
  conditionalUI: capabilities.conditionalUI,                  // Autofill support
  userVerifyingPlatformAuthenticator: capabilities.userVerifyingPlatformAuthenticator,
});

// Quick check
if (BiometricManager.isSupported()) {
  // WebAuthn available
}
```

### Registration

```typescript
const result = await manager.register({
  userId: 'unique-user-id',
  userName: 'user@example.com',
  userDisplayName: 'John Doe',
  excludeCredentials: [], // Existing credentials to exclude
  challenge: customChallenge, // Optional, auto-generated if not provided
});

console.log('Credential created:', {
  id: result.credential.id,
  rawId: result.credential.rawId,
  type: result.credential.type,
  authenticatorAttachment: result.credential.authenticatorAttachment,
  attestationObject: result.attestationObject,
  clientDataJSON: result.clientDataJSON,
  publicKey: result.publicKey,
  publicKeyAlgorithm: result.publicKeyAlgorithm,
  transports: result.transports,
});
```

### Authentication

```typescript
// Basic authentication
const authResult = await manager.authenticate();

console.log('Authenticated:', {
  credentialId: authResult.credentialId,
  authenticatorData: authResult.authenticatorData,
  clientDataJSON: authResult.clientDataJSON,
  signature: authResult.signature,
  userHandle: authResult.userHandle,
});

// With specific credentials
const authResult2 = await manager.authenticate({
  allowCredentials: [existingCredential],
  challenge: customChallenge,
});
```

### Conditional UI (Autofill)

```typescript
// Enable passkey autofill in login form
const abortController = new AbortController();

try {
  const result = await manager.conditionalAuthenticate(abortController);
  // User selected passkey from autofill
  console.log('Authenticated via autofill:', result);
} catch (error) {
  if (error.name !== 'AbortError') {
    console.error('Authentication failed:', error);
  }
}

// Cancel on unmount
abortController.abort();
```

### Credential Management

```typescript
// Add existing credential
manager.addCredential(credential);

// Get all credentials
const credentials = manager.getCredentials();

// Get specific credential
const cred = manager.getCredential('credential-id');

// Remove credential
manager.removeCredential('credential-id');

// Clear all
manager.clearCredentials();
```

### Serialization

```typescript
// Serialize for storage
const serialized = manager.serializeCredential(credential);
localStorage.setItem('credential', serialized);

// Deserialize
const loaded = localStorage.getItem('credential');
const credential = manager.deserializeCredential(loaded);
```

## PasskeyManager

Higher-level API for passkey-based authentication with automatic storage.

### Setup

```typescript
import { PasskeyManager } from '@philjs/biometric';

const passkeys = new PasskeyManager({
  rpName: 'My App',
  rpId: 'myapp.com',
}, 'my_passkeys_storage_key');
```

### Create Passkey

```typescript
const result = await passkeys.createPasskey(
  'user-123',           // userId
  'john@example.com',   // userName
  'John Doe'            // displayName (optional)
);

console.log('Passkey created:', result.credential.id);
```

### Sign In

```typescript
// Standard sign-in
const authResult = await passkeys.signInWithPasskey();

// Autofill sign-in
const abortController = new AbortController();
const authResult = await passkeys.signInWithAutofill(abortController);
```

### Manage Passkeys

```typescript
// Get all passkeys
const userPasskeys = passkeys.getPasskeys();

// Rename a passkey
passkeys.renamePasskey('credential-id', 'My iPhone');

// Delete a passkey
passkeys.deletePasskey('credential-id');

// Clear all passkeys
passkeys.clearPasskeys();
```

## BiometricPrompt

Simple biometric verification prompt (like unlocking device).

### Usage

```typescript
import { BiometricPrompt } from '@philjs/biometric';

const prompt = new BiometricPrompt({
  rpName: 'My App',
  rpId: 'myapp.com',
});

// Show biometric prompt
const success = await prompt.prompt({
  title: 'Confirm Identity',
  subtitle: 'Use biometric to continue',
  description: 'Verify your identity to complete the action',
});

if (success) {
  // User verified
  proceedWithSensitiveAction();
}
```

### Check Availability

```typescript
const isAvailable = await BiometricPrompt.isAvailable();

// Get biometric type
const type = await BiometricPrompt.getBiometricType();
// 'face' | 'fingerprint' | 'iris' | 'unknown'
```

## React-style Hooks

### useBiometric

```typescript
import { useBiometric } from '@philjs/biometric';

function LoginComponent() {
  const {
    capabilities,
    register,
    authenticate,
    credentials,
    isSupported,
    loading,
    error,
  } = useBiometric({
    rpName: 'My App',
    rpId: 'myapp.com',
  });

  const handleRegister = async () => {
    try {
      await register({
        userId: currentUser.id,
        userName: currentUser.email,
      });
      console.log('Biometric registered!');
    } catch (err) {
      console.error('Registration failed:', err);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await authenticate();
      await verifyWithServer(result);
    } catch (err) {
      console.error('Authentication failed:', err);
    }
  };

  return (
    <div>
      {isSupported && (
        <>
          <button onClick={handleRegister} disabled={loading}>
            Register Biometric
          </button>
          <button onClick={handleLogin} disabled={loading}>
            Login with Biometric
          </button>
        </>
      )}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

### usePasskeys

```typescript
import { usePasskeys } from '@philjs/biometric';

function PasskeySettings() {
  const {
    passkeys,
    createPasskey,
    signIn,
    signInWithAutofill,
    renamePasskey,
    deletePasskey,
    clearPasskeys,
    loading,
    error,
  } = usePasskeys({
    rpName: 'My App',
    rpId: 'myapp.com',
  });

  return (
    <div>
      <h2>Your Passkeys</h2>
      <ul>
        {passkeys.map(pk => (
          <li key={pk.id}>
            {pk.name || 'Unnamed Passkey'}
            <button onClick={() => renamePasskey(pk.id, prompt('New name:'))}>
              Rename
            </button>
            <button onClick={() => deletePasskey(pk.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
      <button onClick={() => createPasskey(userId, userEmail)}>
        Add Passkey
      </button>
    </div>
  );
}
```

### useBiometricPrompt

```typescript
import { useBiometricPrompt } from '@philjs/biometric';

function SensitiveAction() {
  const { prompt, isAvailable, biometricType, loading } = useBiometricPrompt({
    rpName: 'My App',
  });

  const handleAction = async () => {
    const verified = await prompt({
      title: 'Confirm Action',
    });

    if (verified) {
      performSensitiveAction();
    }
  };

  return (
    <button onClick={handleAction} disabled={!isAvailable || loading}>
      {biometricType === 'face' ? 'Verify with Face ID' : 'Verify with Fingerprint'}
    </button>
  );
}
```

## Server-Side Verification

### Registration Response

```typescript
// Client sends to server:
const serverPayload = {
  credentialId: result.credential.id,
  attestationObject: arrayBufferToBase64(result.attestationObject),
  clientDataJSON: arrayBufferToBase64(result.clientDataJSON),
  publicKey: result.publicKey ? arrayBufferToBase64(result.publicKey) : null,
  publicKeyAlgorithm: result.publicKeyAlgorithm,
  transports: result.transports,
};

// Server verifies and stores credential
```

### Authentication Response

```typescript
// Client sends to server:
const serverPayload = {
  credentialId: authResult.credentialId,
  authenticatorData: arrayBufferToBase64(authResult.authenticatorData),
  clientDataJSON: arrayBufferToBase64(authResult.clientDataJSON),
  signature: arrayBufferToBase64(authResult.signature),
  userHandle: authResult.userHandle ? arrayBufferToBase64(authResult.userHandle) : null,
};

// Server verifies signature and completes authentication
```

## Types Reference

```typescript
// Credential
interface BiometricCredential {
  id: string;
  rawId: ArrayBuffer;
  type: 'public-key';
  authenticatorAttachment: 'platform' | 'cross-platform' | null;
  createdAt: number;
  lastUsed?: number;
  deviceInfo?: string;
  name?: string;
}

// Registration options
interface RegistrationOptions {
  userId: string;
  userName: string;
  userDisplayName?: string;
  excludeCredentials?: BiometricCredential[];
  challenge?: ArrayBuffer;
}

// Registration result
interface RegistrationResult {
  credential: BiometricCredential;
  attestationObject: ArrayBuffer;
  clientDataJSON: ArrayBuffer;
  publicKey?: ArrayBuffer;
  publicKeyAlgorithm?: number;
  transports?: AuthenticatorTransport[];
}

// Authentication options
interface AuthenticationOptions {
  allowCredentials?: BiometricCredential[];
  challenge?: ArrayBuffer;
  conditional?: boolean;
}

// Authentication result
interface AuthenticationResult {
  credentialId: string;
  authenticatorData: ArrayBuffer;
  clientDataJSON: ArrayBuffer;
  signature: ArrayBuffer;
  userHandle?: ArrayBuffer;
}

// Capabilities
interface BiometricCapabilities {
  supported: boolean;
  platformAuthenticator: boolean;
  conditionalUI: boolean;
  userVerifyingPlatformAuthenticator: boolean;
}

// Configuration
interface BiometricConfig {
  rpName: string;
  rpId?: string;
  timeout?: number;
  userVerification?: 'required' | 'preferred' | 'discouraged';
  attestation?: 'none' | 'indirect' | 'direct' | 'enterprise';
  authenticatorAttachment?: 'platform' | 'cross-platform';
  residentKey?: 'required' | 'preferred' | 'discouraged';
  requireResidentKey?: boolean;
}
```

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `BiometricManager` | Core WebAuthn credential management |
| `PasskeyManager` | High-level passkey API with storage |
| `BiometricPrompt` | Simple biometric verification |

### Hooks

| Hook | Description |
|------|-------------|
| `useBiometric(config)` | Full biometric authentication |
| `usePasskeys(config, storageKey?)` | Passkey management |
| `useBiometricPrompt(config)` | Simple verification prompt |

### Utility Functions

| Function | Description |
|----------|-------------|
| `arrayBufferToBase64Url(buffer)` | Convert ArrayBuffer to base64url |
| `base64UrlToArrayBuffer(str)` | Convert base64url to ArrayBuffer |
| `generateChallenge()` | Generate random challenge |

## Example: Complete Login Flow

```typescript
import { BiometricManager, BiometricPrompt } from '@philjs/biometric';

async function setupBiometricLogin(userId: string, userEmail: string) {
  const manager = new BiometricManager({
    rpName: 'My App',
    rpId: window.location.hostname,
  });

  // Check support
  const caps = await BiometricManager.getCapabilities();
  if (!caps.platformAuthenticator) {
    console.log('No biometric authenticator available');
    return;
  }

  // Register
  try {
    const result = await manager.register({
      userId,
      userName: userEmail,
    });

    // Send to server for storage
    await fetch('/api/auth/register-credential', {
      method: 'POST',
      body: JSON.stringify({
        credentialId: result.credential.id,
        attestationObject: btoa(String.fromCharCode(...new Uint8Array(result.attestationObject))),
        clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(result.clientDataJSON))),
      }),
    });

    console.log('Biometric registered successfully!');
  } catch (error) {
    console.error('Registration failed:', error);
  }
}

async function biometricLogin() {
  const manager = new BiometricManager({
    rpName: 'My App',
    rpId: window.location.hostname,
  });

  try {
    const result = await manager.authenticate();

    // Verify with server
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({
        credentialId: result.credentialId,
        authenticatorData: btoa(String.fromCharCode(...new Uint8Array(result.authenticatorData))),
        clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(result.clientDataJSON))),
        signature: btoa(String.fromCharCode(...new Uint8Array(result.signature))),
      }),
    });

    if (response.ok) {
      console.log('Login successful!');
    }
  } catch (error) {
    console.error('Login failed:', error);
  }
}
```
