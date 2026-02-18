/**
 * Web Crypto API Utilities
 *
 * Type-safe wrappers around the Web Cryptography API
 */

// ============================================================================
// Types
// ============================================================================

export type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
export type SymmetricAlgorithm = 'AES-GCM' | 'AES-CBC' | 'AES-CTR';
export type AsymmetricAlgorithm = 'RSA-OAEP' | 'ECDH' | 'ECDSA';
export type KeyLength = 128 | 192 | 256;

export interface EncryptedData {
  ciphertext: ArrayBuffer;
  iv: Uint8Array;
  algorithm: SymmetricAlgorithm;
}

export interface SignedData {
  data: ArrayBuffer;
  signature: ArrayBuffer;
  algorithm: string;
}

// ============================================================================
// Hashing
// ============================================================================

/**
 * Compute a cryptographic hash
 */
export async function hash(
  data: string | ArrayBuffer | Uint8Array,
  algorithm: HashAlgorithm = 'SHA-256'
): Promise<ArrayBuffer> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return crypto.subtle.digest(algorithm, buffer as BufferSource);
}

/**
 * Compute hash and return as hex string
 */
export async function hashHex(
  data: string | ArrayBuffer | Uint8Array,
  algorithm: HashAlgorithm = 'SHA-256'
): Promise<string> {
  const hashBuffer = await hash(data, algorithm);
  return bufferToHex(hashBuffer);
}

/**
 * Compute hash and return as base64 string
 */
export async function hashBase64(
  data: string | ArrayBuffer | Uint8Array,
  algorithm: HashAlgorithm = 'SHA-256'
): Promise<string> {
  const hashBuffer = await hash(data, algorithm);
  return bufferToBase64(hashBuffer);
}

// ============================================================================
// HMAC
// ============================================================================

/**
 * Generate HMAC key
 */
export async function generateHmacKey(
  algorithm: HashAlgorithm = 'SHA-256'
): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: 'HMAC', hash: algorithm },
    true,
    ['sign', 'verify']
  );
}

/**
 * Sign data with HMAC
 */
export async function hmacSign(
  key: CryptoKey,
  data: string | ArrayBuffer | Uint8Array
): Promise<ArrayBuffer> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return crypto.subtle.sign('HMAC', key, buffer as BufferSource);
}

/**
 * Verify HMAC signature
 */
export async function hmacVerify(
  key: CryptoKey,
  signature: ArrayBuffer,
  data: string | ArrayBuffer | Uint8Array
): Promise<boolean> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return crypto.subtle.verify('HMAC', key, signature, buffer as BufferSource);
}

// ============================================================================
// Symmetric Encryption (AES)
// ============================================================================

/**
 * Generate AES key
 */
export async function generateAesKey(
  length: KeyLength = 256,
  algorithm: SymmetricAlgorithm = 'AES-GCM'
): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: algorithm, length },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data with AES
 */
export async function aesEncrypt(
  key: CryptoKey,
  data: string | ArrayBuffer | Uint8Array,
  algorithm: SymmetricAlgorithm = 'AES-GCM'
): Promise<EncryptedData> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const iv = crypto.getRandomValues(new Uint8Array(algorithm === 'AES-GCM' ? 12 : 16));

  const params =
    algorithm === 'AES-GCM'
      ? { name: 'AES-GCM', iv: iv as BufferSource }
      : algorithm === 'AES-CBC'
      ? { name: 'AES-CBC', iv: iv as BufferSource }
      : { name: 'AES-CTR', counter: iv as BufferSource, length: 64 };

  const ciphertext = await crypto.subtle.encrypt(params as any, key, buffer as BufferSource);

  return { ciphertext, iv, algorithm };
}

/**
 * Decrypt data with AES
 */
export async function aesDecrypt(
  key: CryptoKey,
  encrypted: EncryptedData
): Promise<ArrayBuffer> {
  const { ciphertext, iv, algorithm } = encrypted;

  const params =
    algorithm === 'AES-GCM'
      ? { name: 'AES-GCM', iv: iv as BufferSource }
      : algorithm === 'AES-CBC'
      ? { name: 'AES-CBC', iv: iv as BufferSource }
      : { name: 'AES-CTR', counter: iv as BufferSource, length: 64 };

  return crypto.subtle.decrypt(params as any, key, ciphertext);
}

/**
 * Decrypt and return as string
 */
export async function aesDecryptString(
  key: CryptoKey,
  encrypted: EncryptedData
): Promise<string> {
  const decrypted = await aesDecrypt(key, encrypted);
  return new TextDecoder().decode(decrypted);
}

// ============================================================================
// Asymmetric Encryption (RSA)
// ============================================================================

/**
 * Generate RSA key pair
 */
export async function generateRsaKeyPair(
  modulusLength: 2048 | 4096 = 2048
): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt with RSA public key
 */
export async function rsaEncrypt(
  publicKey: CryptoKey,
  data: string | ArrayBuffer | Uint8Array
): Promise<ArrayBuffer> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, buffer as BufferSource);
}

/**
 * Decrypt with RSA private key
 */
export async function rsaDecrypt(
  privateKey: CryptoKey,
  ciphertext: ArrayBuffer
): Promise<ArrayBuffer> {
  return crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, ciphertext);
}

// ============================================================================
// Digital Signatures (ECDSA)
// ============================================================================

/**
 * Generate ECDSA key pair
 */
export async function generateEcdsaKeyPair(
  curve: 'P-256' | 'P-384' | 'P-521' = 'P-256'
): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: curve },
    true,
    ['sign', 'verify']
  );
}

/**
 * Sign data with ECDSA
 */
export async function ecdsaSign(
  privateKey: CryptoKey,
  data: string | ArrayBuffer | Uint8Array,
  hashAlgorithm: HashAlgorithm = 'SHA-256'
): Promise<ArrayBuffer> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return crypto.subtle.sign(
    { name: 'ECDSA', hash: hashAlgorithm },
    privateKey,
    buffer as BufferSource
  );
}

/**
 * Verify ECDSA signature
 */
export async function ecdsaVerify(
  publicKey: CryptoKey,
  signature: ArrayBuffer,
  data: string | ArrayBuffer | Uint8Array,
  hashAlgorithm: HashAlgorithm = 'SHA-256'
): Promise<boolean> {
  const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  return crypto.subtle.verify(
    { name: 'ECDSA', hash: hashAlgorithm },
    publicKey,
    signature,
    buffer as BufferSource
  );
}

// ============================================================================
// Key Derivation (PBKDF2)
// ============================================================================

/**
 * Derive a key from a password using PBKDF2
 */
export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  iterations = 100000,
  keyLength: KeyLength = 256,
  algorithm: SymmetricAlgorithm = 'AES-GCM'
): Promise<CryptoKey> {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: algorithm, length: keyLength },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random salt
 */
export function generateSalt(length = 16): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

// ============================================================================
// Key Import/Export
// ============================================================================

/**
 * Export key to JWK format
 */
export async function exportKeyJwk(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey('jwk', key);
}

/**
 * Import key from JWK format
 */
export async function importKeyJwk(
  jwk: JsonWebKey,
  algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm,
  usages: KeyUsage[]
): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', jwk, algorithm, true, usages);
}

/**
 * Export key to raw format (symmetric keys only)
 */
export async function exportKeyRaw(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key);
}

// ============================================================================
// Random Generation
// ============================================================================

/**
 * Generate random bytes
 */
export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Generate a random UUID
 */
export function randomUUID(): string {
  return crypto.randomUUID();
}

/**
 * Generate a random hex string
 */
export function randomHex(length: number): string {
  return bufferToHex(randomBytes(Math.ceil(length / 2)).buffer as ArrayBuffer).slice(0, length);
}

/**
 * Generate a random base64 string
 */
export function randomBase64(length: number): string {
  return bufferToBase64(randomBytes(Math.ceil((length * 3) / 4)).buffer as ArrayBuffer).slice(0, length);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert ArrayBuffer to hex string
 */
export function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex string to ArrayBuffer
 */
export function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes.buffer;
}

/**
 * Convert ArrayBuffer to base64 string
 */
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Securely compare two strings (constant-time)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
