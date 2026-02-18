/**
 * Web Crypto API Utilities
 *
 * Type-safe wrappers around the Web Cryptography API
 */
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
/**
 * Compute a cryptographic hash
 */
export declare function hash(data: string | ArrayBuffer | Uint8Array, algorithm?: HashAlgorithm): Promise<ArrayBuffer>;
/**
 * Compute hash and return as hex string
 */
export declare function hashHex(data: string | ArrayBuffer | Uint8Array, algorithm?: HashAlgorithm): Promise<string>;
/**
 * Compute hash and return as base64 string
 */
export declare function hashBase64(data: string | ArrayBuffer | Uint8Array, algorithm?: HashAlgorithm): Promise<string>;
/**
 * Generate HMAC key
 */
export declare function generateHmacKey(algorithm?: HashAlgorithm): Promise<CryptoKey>;
/**
 * Sign data with HMAC
 */
export declare function hmacSign(key: CryptoKey, data: string | ArrayBuffer | Uint8Array): Promise<ArrayBuffer>;
/**
 * Verify HMAC signature
 */
export declare function hmacVerify(key: CryptoKey, signature: ArrayBuffer, data: string | ArrayBuffer | Uint8Array): Promise<boolean>;
/**
 * Generate AES key
 */
export declare function generateAesKey(length?: KeyLength, algorithm?: SymmetricAlgorithm): Promise<CryptoKey>;
/**
 * Encrypt data with AES
 */
export declare function aesEncrypt(key: CryptoKey, data: string | ArrayBuffer | Uint8Array, algorithm?: SymmetricAlgorithm): Promise<EncryptedData>;
/**
 * Decrypt data with AES
 */
export declare function aesDecrypt(key: CryptoKey, encrypted: EncryptedData): Promise<ArrayBuffer>;
/**
 * Decrypt and return as string
 */
export declare function aesDecryptString(key: CryptoKey, encrypted: EncryptedData): Promise<string>;
/**
 * Generate RSA key pair
 */
export declare function generateRsaKeyPair(modulusLength?: 2048 | 4096): Promise<CryptoKeyPair>;
/**
 * Encrypt with RSA public key
 */
export declare function rsaEncrypt(publicKey: CryptoKey, data: string | ArrayBuffer | Uint8Array): Promise<ArrayBuffer>;
/**
 * Decrypt with RSA private key
 */
export declare function rsaDecrypt(privateKey: CryptoKey, ciphertext: ArrayBuffer): Promise<ArrayBuffer>;
/**
 * Generate ECDSA key pair
 */
export declare function generateEcdsaKeyPair(curve?: 'P-256' | 'P-384' | 'P-521'): Promise<CryptoKeyPair>;
/**
 * Sign data with ECDSA
 */
export declare function ecdsaSign(privateKey: CryptoKey, data: string | ArrayBuffer | Uint8Array, hashAlgorithm?: HashAlgorithm): Promise<ArrayBuffer>;
/**
 * Verify ECDSA signature
 */
export declare function ecdsaVerify(publicKey: CryptoKey, signature: ArrayBuffer, data: string | ArrayBuffer | Uint8Array, hashAlgorithm?: HashAlgorithm): Promise<boolean>;
/**
 * Derive a key from a password using PBKDF2
 */
export declare function deriveKeyFromPassword(password: string, salt: Uint8Array, iterations?: number, keyLength?: KeyLength, algorithm?: SymmetricAlgorithm): Promise<CryptoKey>;
/**
 * Generate a random salt
 */
export declare function generateSalt(length?: number): Uint8Array;
/**
 * Export key to JWK format
 */
export declare function exportKeyJwk(key: CryptoKey): Promise<JsonWebKey>;
/**
 * Import key from JWK format
 */
export declare function importKeyJwk(jwk: JsonWebKey, algorithm: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams | HmacImportParams | AesKeyAlgorithm, usages: KeyUsage[]): Promise<CryptoKey>;
/**
 * Export key to raw format (symmetric keys only)
 */
export declare function exportKeyRaw(key: CryptoKey): Promise<ArrayBuffer>;
/**
 * Generate random bytes
 */
export declare function randomBytes(length: number): Uint8Array;
/**
 * Generate a random UUID
 */
export declare function randomUUID(): string;
/**
 * Generate a random hex string
 */
export declare function randomHex(length: number): string;
/**
 * Generate a random base64 string
 */
export declare function randomBase64(length: number): string;
/**
 * Convert ArrayBuffer to hex string
 */
export declare function bufferToHex(buffer: ArrayBuffer): string;
/**
 * Convert hex string to ArrayBuffer
 */
export declare function hexToBuffer(hex: string): ArrayBuffer;
/**
 * Convert ArrayBuffer to base64 string
 */
export declare function bufferToBase64(buffer: ArrayBuffer): string;
/**
 * Convert base64 string to ArrayBuffer
 */
export declare function base64ToBuffer(base64: string): ArrayBuffer;
/**
 * Securely compare two strings (constant-time)
 */
export declare function secureCompare(a: string, b: string): boolean;
