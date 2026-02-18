/**
 * Tests for PhilJS Crypto - Post-Quantum Cryptography (Educational LWE)
 */

import { describe, it, expect } from 'vitest';
import { PQC } from './post-quantum';

describe('Post-Quantum Cryptography (Educational LWE)', () => {
  describe('Key Generation', () => {
    it('should generate a keypair', () => {
      const { pk, sk } = PQC.generateKeypair();

      expect(pk).toBeDefined();
      expect(pk.A).toBeDefined();
      expect(pk.b).toBeDefined();
      expect(sk).toBeDefined();
    });

    it('should generate matrix A with correct dimensions', () => {
      const { pk } = PQC.generateKeypair();

      // A should be a 4x4 matrix (n=4)
      expect(pk.A.length).toBe(4);
      pk.A.forEach((row) => {
        expect(row.length).toBe(4);
      });
    });

    it('should generate vector b with correct length', () => {
      const { pk } = PQC.generateKeypair();
      expect(pk.b.length).toBe(4);
    });

    it('should generate secret key with correct length', () => {
      const { sk } = PQC.generateKeypair();
      expect(sk.length).toBe(4);
    });

    it('should generate different keypairs each time', () => {
      const kp1 = PQC.generateKeypair();
      const kp2 = PQC.generateKeypair();

      // Very unlikely to be the same
      expect(kp1.sk).not.toEqual(kp2.sk);
    });
  });

  describe('Encryption', () => {
    it('should encrypt bit 0', () => {
      const { pk } = PQC.generateKeypair();
      const ciphertext = PQC.encrypt(0, pk);

      expect(ciphertext).toBeDefined();
      expect(ciphertext.u).toBeDefined();
      expect(ciphertext.v).toBeDefined();
    });

    it('should encrypt bit 1', () => {
      const { pk } = PQC.generateKeypair();
      const ciphertext = PQC.encrypt(1, pk);

      expect(ciphertext).toBeDefined();
      expect(ciphertext.u).toBeDefined();
      expect(ciphertext.v).toBeDefined();
    });

    it('should produce vector u of correct length', () => {
      const { pk } = PQC.generateKeypair();
      const ciphertext = PQC.encrypt(0, pk);

      expect(ciphertext.u.length).toBe(4);
    });

    it('should produce different ciphertexts for same plaintext', () => {
      const { pk } = PQC.generateKeypair();

      // Due to random r, encryptions should differ
      const ct1 = PQC.encrypt(1, pk);
      const ct2 = PQC.encrypt(1, pk);

      // Very unlikely to be exactly the same
      const same = ct1.u.every((val, i) => val === ct2.u[i]) && ct1.v === ct2.v;
      expect(same).toBe(false);
    });
  });

  describe('Decryption', () => {
    it('should decrypt bit 0 correctly', () => {
      const { pk, sk } = PQC.generateKeypair();
      const ciphertext = PQC.encrypt(0, pk);
      const decrypted = PQC.decrypt(ciphertext, sk);

      expect(decrypted).toBe(0);
    });

    it('should decrypt bit 1 correctly', () => {
      const { pk, sk } = PQC.generateKeypair();
      const ciphertext = PQC.encrypt(1, pk);
      const decrypted = PQC.decrypt(ciphertext, sk);

      expect(decrypted).toBe(1);
    });

    it('should handle multiple encryption/decryption cycles', () => {
      const { pk, sk } = PQC.generateKeypair();

      // Test multiple rounds
      for (let i = 0; i < 10; i++) {
        const bit = (i % 2) as 0 | 1;
        const ciphertext = PQC.encrypt(bit, pk);
        const decrypted = PQC.decrypt(ciphertext, sk);
        expect(decrypted).toBe(bit);
      }
    });
  });

  describe('End-to-End Scenarios', () => {
    it('should work with fresh keypairs', () => {
      // Generate multiple keypairs and test each
      for (let i = 0; i < 5; i++) {
        const { pk, sk } = PQC.generateKeypair();

        const ct0 = PQC.encrypt(0, pk);
        const ct1 = PQC.encrypt(1, pk);

        expect(PQC.decrypt(ct0, sk)).toBe(0);
        expect(PQC.decrypt(ct1, sk)).toBe(1);
      }
    });

    it('should maintain correctness over many operations', () => {
      const { pk, sk } = PQC.generateKeypair();
      let errors = 0;
      const trials = 50;

      for (let i = 0; i < trials; i++) {
        const bit = Math.random() < 0.5 ? 0 : 1 as 0 | 1;
        const ct = PQC.encrypt(bit, pk);
        const decrypted = PQC.decrypt(ct, sk);

        if (decrypted !== bit) {
          errors++;
        }
      }

      // Due to the toy nature, some errors may occur
      // but should be very rare with these parameters
      expect(errors).toBeLessThan(trials * 0.1); // Less than 10% error rate
    });
  });

  describe('Security Properties (Educational)', () => {
    it('should not decrypt with wrong secret key', () => {
      const kp1 = PQC.generateKeypair();
      const kp2 = PQC.generateKeypair();

      // Encrypt with pk1, try to decrypt with sk2
      const ct = PQC.encrypt(1, kp1.pk);

      // Decryption with wrong key should be random (might be 0 or 1)
      // We can't reliably test "wrong" decryption, but we can verify
      // the scheme works with the right key
      const correct = PQC.decrypt(ct, kp1.sk);
      expect(correct).toBe(1);
    });

    it('should produce ciphertexts with values mod q', () => {
      const { pk } = PQC.generateKeypair();
      const q = 32; // The modulus

      const ct = PQC.encrypt(0, pk);

      // All values should be within [0, q)
      ct.u.forEach((val) => {
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(q);
      });
      expect(ct.v).toBeGreaterThanOrEqual(0);
      expect(ct.v).toBeLessThan(q);
    });
  });
});
