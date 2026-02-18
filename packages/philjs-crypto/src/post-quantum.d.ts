/**
 * Toy Learning With Errors (LWE) Implementation.
 * Demonstrates the mathematical principles of Lattice-based Post-Quantum Cryptography.
 * WARNING: NOT SECURE for production. Use standard libraries like liboqs for real security.
 */
export declare class PQC {
    private static n;
    private static q;
    private static start_error;
    static generateKeypair(): {
        pk: {
            A: number[][];
            b: number[];
        };
        sk: number[];
    };
    static encrypt(bit: 0 | 1, pk: {
        A: number[][];
        b: number[];
    }): {
        u: number[];
        v: number;
    };
    static decrypt(ciphertext: {
        u: number[];
        v: number;
    }, sk: number[]): 0 | 1;
}
