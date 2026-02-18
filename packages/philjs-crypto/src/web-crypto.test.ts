/**
 * Tests for PhilJS Crypto - Web Crypto Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  hash,
  hashHex,
  hashBase64,
  generateHmacKey,
  hmacSign,
  hmacVerify,
  generateAesKey,
  aesEncrypt,
  aesDecrypt,
  aesDecryptString,
  generateRsaKeyPair,
  rsaEncrypt,
  rsaDecrypt,
  generateEcdsaKeyPair,
  ecdsaSign,
  ecdsaVerify,
  deriveKeyFromPassword,
  generateSalt,
  exportKeyJwk,
  randomBytes,
  randomUUID,
  randomHex,
  randomBase64,
  bufferToHex,
  hexToBuffer,
  bufferToBase64,
  base64ToBuffer,
  secureCompare,
} from './web-crypto';

describe('Web Crypto Utilities', () => {
  describe('Hashing', () => {
    it('should hash string with SHA-256', async () => {
      const result = await hash('hello world');
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBe(32); // SHA-256 = 32 bytes
    });

    it('should hash with different algorithms', async () => {
      const sha1 = await hash('test', 'SHA-1');
      const sha256 = await hash('test', 'SHA-256');
      const sha384 = await hash('test', 'SHA-384');
      const sha512 = await hash('test', 'SHA-512');

      expect(sha1.byteLength).toBe(20);
      expect(sha256.byteLength).toBe(32);
      expect(sha384.byteLength).toBe(48);
      expect(sha512.byteLength).toBe(64);
    });

    it('should return consistent hash for same input', async () => {
      const hash1 = await hashHex('test');
      const hash2 = await hashHex('test');
      expect(hash1).toBe(hash2);
    });

    it('should return hex string', async () => {
      const result = await hashHex('hello');
      expect(result).toMatch(/^[0-9a-f]+$/);
      expect(result.length).toBe(64); // 32 bytes * 2
    });

    it('should return base64 string', async () => {
      const result = await hashBase64('hello');
      expect(result).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('should hash ArrayBuffer', async () => {
      const buffer = new TextEncoder().encode('test');
      const result = await hashHex(buffer);
      const stringResult = await hashHex('test');
      expect(result).toBe(stringResult);
    });
  });

  describe('HMAC', () => {
    it('should generate HMAC key', async () => {
      const key = await generateHmacKey();
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
    });

    it('should sign and verify data', async () => {
      const key = await generateHmacKey();
      const data = 'message to sign';

      const signature = await hmacSign(key, data);
      expect(signature).toBeInstanceOf(ArrayBuffer);

      const isValid = await hmacVerify(key, signature, data);
      expect(isValid).toBe(true);
    });

    it('should fail verification with wrong data', async () => {
      const key = await generateHmacKey();
      const data = 'original message';

      const signature = await hmacSign(key, data);
      const isValid = await hmacVerify(key, signature, 'tampered message');
      expect(isValid).toBe(false);
    });

    it('should fail verification with wrong key', async () => {
      const key1 = await generateHmacKey();
      const key2 = await generateHmacKey();
      const data = 'message';

      const signature = await hmacSign(key1, data);
      const isValid = await hmacVerify(key2, signature, data);
      expect(isValid).toBe(false);
    });
  });

  describe('AES Encryption', () => {
    it('should generate AES key', async () => {
      const key = await generateAesKey();
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
    });

    it('should encrypt and decrypt string with AES-GCM', async () => {
      const key = await generateAesKey(256, 'AES-GCM');
      const plaintext = 'secret message';

      const encrypted = await aesEncrypt(key, plaintext, 'AES-GCM');
      expect(encrypted.ciphertext).toBeInstanceOf(ArrayBuffer);
      expect(encrypted.iv).toBeInstanceOf(Uint8Array);
      expect(encrypted.algorithm).toBe('AES-GCM');

      const decrypted = await aesDecryptString(key, encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt with AES-CBC', async () => {
      const key = await generateAesKey(256, 'AES-CBC');
      const plaintext = 'secret message';

      const encrypted = await aesEncrypt(key, plaintext, 'AES-CBC');
      expect(encrypted.algorithm).toBe('AES-CBC');

      const decrypted = await aesDecryptString(key, encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should handle binary data', async () => {
      const key = await generateAesKey();
      const data = new Uint8Array([1, 2, 3, 4, 5]);

      const encrypted = await aesEncrypt(key, data);
      const decrypted = await aesDecrypt(key, encrypted);

      expect(new Uint8Array(decrypted)).toEqual(data);
    });

    it('should generate unique IVs', async () => {
      const key = await generateAesKey();
      const plaintext = 'same message';

      const encrypted1 = await aesEncrypt(key, plaintext);
      const encrypted2 = await aesEncrypt(key, plaintext);

      // IVs should be different
      expect(encrypted1.iv).not.toEqual(encrypted2.iv);
    });
  });

  describe('RSA Encryption', () => {
    it('should generate RSA key pair', async () => {
      const { publicKey, privateKey } = await generateRsaKeyPair();
      expect(publicKey).toBeDefined();
      expect(privateKey).toBeDefined();
      expect(publicKey.type).toBe('public');
      expect(privateKey.type).toBe('private');
    });

    it('should encrypt and decrypt with RSA', async () => {
      const { publicKey, privateKey } = await generateRsaKeyPair();
      const plaintext = 'secret';

      const ciphertext = await rsaEncrypt(publicKey, plaintext);
      expect(ciphertext).toBeInstanceOf(ArrayBuffer);

      const decrypted = await rsaDecrypt(privateKey, ciphertext);
      const decryptedString = new TextDecoder().decode(decrypted);
      expect(decryptedString).toBe(plaintext);
    });
  });

  describe('ECDSA Signatures', () => {
    it('should generate ECDSA key pair', async () => {
      const { publicKey, privateKey } = await generateEcdsaKeyPair();
      expect(publicKey).toBeDefined();
      expect(privateKey).toBeDefined();
    });

    it('should sign and verify with ECDSA', async () => {
      const { publicKey, privateKey } = await generateEcdsaKeyPair();
      const message = 'message to sign';

      const signature = await ecdsaSign(privateKey, message);
      expect(signature).toBeInstanceOf(ArrayBuffer);

      const isValid = await ecdsaVerify(publicKey, signature, message);
      expect(isValid).toBe(true);
    });

    it('should fail verification with tampered message', async () => {
      const { publicKey, privateKey } = await generateEcdsaKeyPair();
      const message = 'original message';

      const signature = await ecdsaSign(privateKey, message);
      const isValid = await ecdsaVerify(publicKey, signature, 'tampered message');
      expect(isValid).toBe(false);
    });

    it('should work with different curves', async () => {
      const p256 = await generateEcdsaKeyPair('P-256');
      const p384 = await generateEcdsaKeyPair('P-384');

      expect(p256.publicKey).toBeDefined();
      expect(p384.publicKey).toBeDefined();
    });
  });

  describe('Key Derivation', () => {
    it('should derive key from password', async () => {
      const password = 'my-password';
      const salt = generateSalt();

      const key = await deriveKeyFromPassword(password, salt);
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
    });

    it('should generate consistent keys with same inputs', async () => {
      const password = 'my-password';
      const salt = generateSalt();

      const key1 = await deriveKeyFromPassword(password, salt, 1000);
      const key2 = await deriveKeyFromPassword(password, salt, 1000);

      const jwk1 = await exportKeyJwk(key1);
      const jwk2 = await exportKeyJwk(key2);

      expect(jwk1.k).toBe(jwk2.k);
    });

    it('should generate different keys with different salts', async () => {
      const password = 'my-password';
      const salt1 = generateSalt();
      const salt2 = generateSalt();

      const key1 = await deriveKeyFromPassword(password, salt1, 1000);
      const key2 = await deriveKeyFromPassword(password, salt2, 1000);

      const jwk1 = await exportKeyJwk(key1);
      const jwk2 = await exportKeyJwk(key2);

      expect(jwk1.k).not.toBe(jwk2.k);
    });
  });

  describe('Random Generation', () => {
    it('should generate random bytes', () => {
      const bytes = randomBytes(32);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(32);
    });

    it('should generate random UUID', () => {
      const uuid = randomUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should generate random hex string', () => {
      const hex = randomHex(16);
      expect(hex).toMatch(/^[0-9a-f]+$/);
      expect(hex.length).toBe(16);
    });

    it('should generate random base64 string', () => {
      const b64 = randomBase64(16);
      expect(b64.length).toBe(16);
    });

    it('should generate unique values', () => {
      const uuids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        uuids.add(randomUUID());
      }
      expect(uuids.size).toBe(100);
    });
  });

  describe('Buffer Utilities', () => {
    it('should convert buffer to hex and back', () => {
      const original = new Uint8Array([0, 1, 255, 128, 64]).buffer;
      const hex = bufferToHex(original);
      const restored = hexToBuffer(hex);

      expect(new Uint8Array(restored)).toEqual(new Uint8Array(original));
    });

    it('should convert buffer to base64 and back', () => {
      const original = new Uint8Array([0, 1, 255, 128, 64]).buffer;
      const b64 = bufferToBase64(original);
      const restored = base64ToBuffer(b64);

      expect(new Uint8Array(restored)).toEqual(new Uint8Array(original));
    });

    it('should handle empty buffer', () => {
      const empty = new ArrayBuffer(0);
      expect(bufferToHex(empty)).toBe('');
      expect(bufferToBase64(empty)).toBe('');
    });
  });

  describe('Secure Compare', () => {
    it('should return true for equal strings', () => {
      expect(secureCompare('hello', 'hello')).toBe(true);
      expect(secureCompare('', '')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(secureCompare('hello', 'world')).toBe(false);
      expect(secureCompare('hello', 'Hello')).toBe(false);
      expect(secureCompare('hello', 'hello!')).toBe(false);
    });

    it('should return false for different length strings', () => {
      expect(secureCompare('hello', 'helloworld')).toBe(false);
      expect(secureCompare('hi', 'hello')).toBe(false);
    });
  });

  describe('Salt Generation', () => {
    it('should generate salt of default length', () => {
      const salt = generateSalt();
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(16);
    });

    it('should generate salt of custom length', () => {
      const salt = generateSalt(32);
      expect(salt.length).toBe(32);
    });

    it('should generate unique salts', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toEqual(salt2);
    });
  });
});
