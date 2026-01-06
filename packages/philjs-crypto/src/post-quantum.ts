
/**
 * Toy Learning With Errors (LWE) Implementation.
 * Demonstrates the mathematical principles of Lattice-based Post-Quantum Cryptography.
 * WARNING: NOT SECURE for production. Use standard libraries like liboqs for real security.
 */
export class PQC {
    // Parameters for Toy LWE
    private static n = 4;  // Dimension of secret vector
    private static q = 32; // Modulus
    private static start_error = 1; // Noise bound

    static generateKeypair() {
        // Secret key s (vector of size n)
        const s = Array.from({ length: this.n }, () => Math.floor(Math.random() * this.q));

        // Public key (A, b) where b = As + e
        // A is a square matrix n x n for simplicity here
        const A = Array.from({ length: this.n }, () =>
            Array.from({ length: this.n }, () => Math.floor(Math.random() * this.q))
        );

        // e is small error vector
        const e = Array.from({ length: this.n }, () => Math.floor(Math.random() * 3) - 1); // -1, 0, 1

        // b = As + e (mod q)
        const b = A.map((row, i) => {
            let sum = 0;
            for (let j = 0; j < this.n; j++) {
                sum += row[j] * s[j];
            }
            return (sum + e[i]) % this.q;
        });

        return {
            pk: { A, b },
            sk: s
        };
    }

    static encrypt(bit: 0 | 1, pk: { A: number[][], b: number[] }) {
        // Encrypt a single bit
        // (u, v)
        // u = A^T * r % q
        // v = b^T * r + bit * floor(q/2) % q

        // r is random small vector (0, 1)
        const r = Array.from({ length: this.n }, () => Math.floor(Math.random() * 2));

        // u = A^T * r
        const u = Array.from({ length: this.n }, (_, colIndex) => {
            let sum = 0;
            for (let rowRaw = 0; rowRaw < this.n; rowRaw++) {
                sum += pk.A[rowRaw][colIndex] * r[rowRaw];
            }
            return sum % this.q;
        });

        // v = b * r + m * q/2
        let dot_br = 0;
        for (let i = 0; i < this.n; i++) dot_br += pk.b[i] * r[i];

        const v = (dot_br + bit * Math.floor(this.q / 2)) % this.q;

        return { u, v };
    }

    static decrypt(ciphertext: { u: number[], v: number }, sk: number[]) {
        // Decrypt: v - s^T * u
        let dot_su = 0;
        for (let i = 0; i < this.n; i++) dot_su += sk[i] * ciphertext.u[i];

        let diff = (ciphertext.v - dot_su) % this.q;
        if (diff < 0) diff += this.q;

        // If diff is close to q/2 -> 1, if close to 0 -> 0
        const center = this.q / 2;
        const distanceToCenter = Math.min(Math.abs(diff - center), Math.abs(diff + this.q - center));
        const distanceToZero = Math.min(diff, this.q - diff);

        return distanceToCenter < distanceToZero ? 1 : 0;
    }
}
