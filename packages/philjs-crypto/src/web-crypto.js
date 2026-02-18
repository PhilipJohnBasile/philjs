/**
 * Web Crypto API Utilities
 *
 * Type-safe wrappers around the Web Cryptography API
 */
// ============================================================================
// Hashing
// ============================================================================
/**
 * Compute a cryptographic hash
 */
export async function hash(data, algorithm = 'SHA-256') {
    const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return crypto.subtle.digest(algorithm, buffer);
}
/**
 * Compute hash and return as hex string
 */
export async function hashHex(data, algorithm = 'SHA-256') {
    const hashBuffer = await hash(data, algorithm);
    return bufferToHex(hashBuffer);
}
/**
 * Compute hash and return as base64 string
 */
export async function hashBase64(data, algorithm = 'SHA-256') {
    const hashBuffer = await hash(data, algorithm);
    return bufferToBase64(hashBuffer);
}
// ============================================================================
// HMAC
// ============================================================================
/**
 * Generate HMAC key
 */
export async function generateHmacKey(algorithm = 'SHA-256') {
    return crypto.subtle.generateKey({ name: 'HMAC', hash: algorithm }, true, ['sign', 'verify']);
}
/**
 * Sign data with HMAC
 */
export async function hmacSign(key, data) {
    const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return crypto.subtle.sign('HMAC', key, buffer);
}
/**
 * Verify HMAC signature
 */
export async function hmacVerify(key, signature, data) {
    const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return crypto.subtle.verify('HMAC', key, signature, buffer);
}
// ============================================================================
// Symmetric Encryption (AES)
// ============================================================================
/**
 * Generate AES key
 */
export async function generateAesKey(length = 256, algorithm = 'AES-GCM') {
    return crypto.subtle.generateKey({ name: algorithm, length }, true, ['encrypt', 'decrypt']);
}
/**
 * Encrypt data with AES
 */
export async function aesEncrypt(key, data, algorithm = 'AES-GCM') {
    const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const iv = crypto.getRandomValues(new Uint8Array(algorithm === 'AES-GCM' ? 12 : 16));
    const params = algorithm === 'AES-GCM'
        ? { name: 'AES-GCM', iv: iv }
        : algorithm === 'AES-CBC'
            ? { name: 'AES-CBC', iv: iv }
            : { name: 'AES-CTR', counter: iv, length: 64 };
    const ciphertext = await crypto.subtle.encrypt(params, key, buffer);
    return { ciphertext, iv, algorithm };
}
/**
 * Decrypt data with AES
 */
export async function aesDecrypt(key, encrypted) {
    const { ciphertext, iv, algorithm } = encrypted;
    const params = algorithm === 'AES-GCM'
        ? { name: 'AES-GCM', iv: iv }
        : algorithm === 'AES-CBC'
            ? { name: 'AES-CBC', iv: iv }
            : { name: 'AES-CTR', counter: iv, length: 64 };
    return crypto.subtle.decrypt(params, key, ciphertext);
}
/**
 * Decrypt and return as string
 */
export async function aesDecryptString(key, encrypted) {
    const decrypted = await aesDecrypt(key, encrypted);
    return new TextDecoder().decode(decrypted);
}
// ============================================================================
// Asymmetric Encryption (RSA)
// ============================================================================
/**
 * Generate RSA key pair
 */
export async function generateRsaKeyPair(modulusLength = 2048) {
    return crypto.subtle.generateKey({
        name: 'RSA-OAEP',
        modulusLength,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
    }, true, ['encrypt', 'decrypt']);
}
/**
 * Encrypt with RSA public key
 */
export async function rsaEncrypt(publicKey, data) {
    const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, buffer);
}
/**
 * Decrypt with RSA private key
 */
export async function rsaDecrypt(privateKey, ciphertext) {
    return crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, ciphertext);
}
// ============================================================================
// Digital Signatures (ECDSA)
// ============================================================================
/**
 * Generate ECDSA key pair
 */
export async function generateEcdsaKeyPair(curve = 'P-256') {
    return crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: curve }, true, ['sign', 'verify']);
}
/**
 * Sign data with ECDSA
 */
export async function ecdsaSign(privateKey, data, hashAlgorithm = 'SHA-256') {
    const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return crypto.subtle.sign({ name: 'ECDSA', hash: hashAlgorithm }, privateKey, buffer);
}
/**
 * Verify ECDSA signature
 */
export async function ecdsaVerify(publicKey, signature, data, hashAlgorithm = 'SHA-256') {
    const buffer = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return crypto.subtle.verify({ name: 'ECDSA', hash: hashAlgorithm }, publicKey, signature, buffer);
}
// ============================================================================
// Key Derivation (PBKDF2)
// ============================================================================
/**
 * Derive a key from a password using PBKDF2
 */
export async function deriveKeyFromPassword(password, salt, iterations = 100000, keyLength = 256, algorithm = 'AES-GCM') {
    const passwordKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({
        name: 'PBKDF2',
        salt: salt,
        iterations,
        hash: 'SHA-256',
    }, passwordKey, { name: algorithm, length: keyLength }, true, ['encrypt', 'decrypt']);
}
/**
 * Generate a random salt
 */
export function generateSalt(length = 16) {
    return crypto.getRandomValues(new Uint8Array(length));
}
// ============================================================================
// Key Import/Export
// ============================================================================
/**
 * Export key to JWK format
 */
export async function exportKeyJwk(key) {
    return crypto.subtle.exportKey('jwk', key);
}
/**
 * Import key from JWK format
 */
export async function importKeyJwk(jwk, algorithm, usages) {
    return crypto.subtle.importKey('jwk', jwk, algorithm, true, usages);
}
/**
 * Export key to raw format (symmetric keys only)
 */
export async function exportKeyRaw(key) {
    return crypto.subtle.exportKey('raw', key);
}
// ============================================================================
// Random Generation
// ============================================================================
/**
 * Generate random bytes
 */
export function randomBytes(length) {
    return crypto.getRandomValues(new Uint8Array(length));
}
/**
 * Generate a random UUID
 */
export function randomUUID() {
    return crypto.randomUUID();
}
/**
 * Generate a random hex string
 */
export function randomHex(length) {
    return bufferToHex(randomBytes(Math.ceil(length / 2)).buffer).slice(0, length);
}
/**
 * Generate a random base64 string
 */
export function randomBase64(length) {
    return bufferToBase64(randomBytes(Math.ceil((length * 3) / 4)).buffer).slice(0, length);
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Convert ArrayBuffer to hex string
 */
export function bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}
/**
 * Convert hex string to ArrayBuffer
 */
export function hexToBuffer(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    }
    return bytes.buffer;
}
/**
 * Convert ArrayBuffer to base64 string
 */
export function bufferToBase64(buffer) {
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
export function base64ToBuffer(base64) {
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
export function secureCompare(a, b) {
    if (a.length !== b.length)
        return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}
//# sourceMappingURL=web-crypto.js.map