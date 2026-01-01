# @philjs/biometric

Native Biometric Authentication for PhilJS Applications

[![Node.js 24+](https://img.shields.io/badge/Node.js-24%2B-339933?logo=node.js)](https://nodejs.org/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![MIT License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

WebAuthn, Face ID, Touch ID, and Windows Hello integration for PhilJS applications.

**Features:**
- WebAuthn/FIDO2 registration and authentication
- Passkey support with local storage persistence
- Platform authenticator detection
- Conditional UI (autofill) support
- Cross-device authentication
- Biometric type detection (face, fingerprint, iris)
- Credential serialization for server sync

## Installation

```bash
npm install @philjs/biometric
```

## Quick Start

```typescript
import { BiometricManager } from '@philjs/biometric';

const manager = new BiometricManager({
  rpName: 'My App',
  rpId: 'myapp.com'
});

// Check if biometrics are supported
if (BiometricManager.isSupported()) {
  // Register a new credential
  const result = await manager.register({
    userId: 'user-123',
    userName: 'john@example.com'
  });

  // Authenticate
  const auth = await manager.authenticate();
}
```

## Usage

### Basic Registration and Authentication

```typescript
import { BiometricManager } from '@philjs/biometric';

const manager = new BiometricManager({
  rpName: 'My Application',
  rpId: window.location.hostname,
  userVerification: 'preferred',
  attestation: 'none',
  authenticatorAttachment: 'platform'
});

// Register
const registration = await manager.register({
  userId: 'user-123',
  userName: 'user@example.com',
  userDisplayName: 'John Doe'
});

// Authenticate
const authentication = await manager.authenticate();
```

### Passkey Management

```typescript
import { PasskeyManager } from '@philjs/biometric';

const passkeys = new PasskeyManager({
  rpName: 'My App',
  rpId: 'myapp.com'
});

// Create a passkey
await passkeys.createPasskey('user-id', 'user@example.com', 'John Doe');

// Sign in with passkey
const result = await passkeys.signInWithPasskey();

// Sign in with autofill (conditional UI)
const abortController = new AbortController();
const result = await passkeys.signInWithAutofill(abortController);

// Manage passkeys
passkeys.renamePasskey('credential-id', 'Work Laptop');
passkeys.deletePasskey('credential-id');
passkeys.getPasskeys();
```

### Check Capabilities

```typescript
import { BiometricManager, BiometricPrompt } from '@philjs/biometric';

const capabilities = await BiometricManager.getCapabilities();
// {
//   supported: true,
//   platformAuthenticator: true,
//   conditionalUI: true,
//   userVerifyingPlatformAuthenticator: true
// }

const biometricType = await BiometricPrompt.getBiometricType();
// 'face' | 'fingerprint' | 'iris' | 'unknown'
```

### Biometric Prompt

```typescript
import { BiometricPrompt } from '@philjs/biometric';

const prompt = new BiometricPrompt({ rpName: 'My App' });

const isAvailable = await BiometricPrompt.isAvailable();
const biometricType = await BiometricPrompt.getBiometricType();

const success = await prompt.prompt({
  title: 'Verify your identity',
  subtitle: 'Use biometrics to continue'
});
```

### Hooks API

```typescript
import { useBiometric, usePasskeys, useBiometricPrompt } from '@philjs/biometric';

// Biometric hook
const { capabilities, register, authenticate, credentials, isSupported, loading, error } =
  useBiometric({ rpName: 'My App' });

// Passkeys hook
const { passkeys, createPasskey, signIn, signInWithAutofill, renamePasskey, deletePasskey } =
  usePasskeys({ rpName: 'My App' });

// Prompt hook
const { prompt, isAvailable, biometricType, loading } =
  useBiometricPrompt({ rpName: 'My App' });
```

## API Reference

### Classes

#### `BiometricManager`
Core WebAuthn credential management.

**Static Methods:**
- `getCapabilities()` - Get device biometric capabilities
- `isSupported()` - Check if WebAuthn is supported

**Methods:**
- `register(options)` - Register new credential
- `authenticate(options?)` - Authenticate with existing credential
- `conditionalAuthenticate(abortController?)` - Conditional UI authentication
- `addCredential(credential)` - Add credential to manager
- `removeCredential(id)` - Remove credential
- `getCredentials()` - Get all credentials
- `serializeCredential(credential)` - Serialize for storage
- `deserializeCredential(serialized)` - Deserialize from storage

#### `PasskeyManager`
High-level passkey management with automatic persistence.

**Methods:**
- `createPasskey(userId, userName, displayName?)` - Create new passkey
- `signInWithPasskey()` - Sign in using passkey
- `signInWithAutofill(abortController?)` - Conditional UI sign-in
- `getPasskeys()` - Get stored passkeys
- `renamePasskey(id, name)` - Rename a passkey
- `deletePasskey(id)` - Delete a passkey
- `clearPasskeys()` - Clear all passkeys

#### `BiometricPrompt`
Simple biometric verification prompt.

**Methods:**
- `prompt(options?)` - Show biometric prompt
- `isAvailable()` - Check if biometrics available
- `getBiometricType()` - Detect biometric type

### Types

```typescript
interface BiometricConfig {
  rpName: string;
  rpId?: string;
  timeout?: number;
  userVerification?: 'required' | 'preferred' | 'discouraged';
  attestation?: 'none' | 'indirect' | 'direct' | 'enterprise';
  authenticatorAttachment?: 'platform' | 'cross-platform';
  residentKey?: 'required' | 'preferred' | 'discouraged';
}

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

interface BiometricCapabilities {
  supported: boolean;
  platformAuthenticator: boolean;
  conditionalUI: boolean;
  userVerifyingPlatformAuthenticator: boolean;
}
```

## Browser Support

- Chrome 67+
- Firefox 60+
- Safari 14+
- Edge 79+

Requires HTTPS in production (localhost exempt for development).

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-biometric/src/index.ts

### Public API
- Direct exports: AuthenticationOptions, AuthenticationResult, BiometricCapabilities, BiometricConfig, BiometricCredential, BiometricManager, BiometricPrompt, BiometricPromptOptions, PasskeyManager, RegistrationOptions, RegistrationResult, useBiometric, useBiometricPrompt, usePasskeys
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
