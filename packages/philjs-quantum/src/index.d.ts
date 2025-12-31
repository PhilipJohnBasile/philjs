/**
 * @philjs/quantum - Quantum-Ready Primitives for Future Computing
 *
 * Prepare your applications for the quantum computing era:
 * - Quantum-safe cryptography
 * - Quantum random number generation
 * - Quantum-inspired optimization algorithms
 * - Post-quantum encryption primitives
 * - Quantum state simulation
 * - Hybrid classical-quantum computation patterns
 *
 * NO OTHER FRAMEWORK HAS THIS.
 */
export interface QuantumConfig {
    /** Use hardware random when available */
    useHardwareRandom?: boolean;
    /** Post-quantum algorithm preference */
    algorithm?: 'kyber' | 'dilithium' | 'sphincs' | 'ntru';
    /** Security level (bits) */
    securityLevel?: 128 | 192 | 256;
    /** Enable quantum simulation */
    enableSimulation?: boolean;
    /** Maximum qubits for simulation */
    maxQubits?: number;
}
export interface QuantumKey {
    publicKey: Uint8Array;
    privateKey: Uint8Array;
    algorithm: string;
    securityLevel: number;
}
export interface EncapsulatedKey {
    ciphertext: Uint8Array;
    sharedSecret: Uint8Array;
}
export interface QuantumSignature {
    signature: Uint8Array;
    algorithm: string;
    publicKey: Uint8Array;
}
export interface Qubit {
    alpha: Complex;
    beta: Complex;
}
export interface Complex {
    real: number;
    imag: number;
}
export interface QuantumState {
    amplitudes: Complex[];
    numQubits: number;
    measured: boolean;
    classicalBits: number[];
}
export interface QuantumCircuit {
    qubits: number;
    gates: QuantumGate[];
    measurements: number[];
}
export interface QuantumGate {
    type: GateType;
    targets: number[];
    controls?: number[];
    params?: number[];
}
export type GateType = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'CNOT' | 'CZ' | 'SWAP' | 'TOFFOLI' | 'RX' | 'RY' | 'RZ' | 'U' | 'PHASE';
export interface OptimizationResult {
    solution: number[];
    energy: number;
    iterations: number;
    converged: boolean;
}
export interface QAOAParams {
    layers: number;
    gamma: number[];
    beta: number[];
}
export declare const Complex: {
    create(real: number, imag?: number): Complex;
    add(a: Complex, b: Complex): Complex;
    sub(a: Complex, b: Complex): Complex;
    mul(a: Complex, b: Complex): Complex;
    div(a: Complex, b: Complex): Complex;
    conjugate(a: Complex): Complex;
    magnitude(a: Complex): number;
    phase(a: Complex): number;
    exp(theta: number): Complex;
    scale(a: Complex, s: number): Complex;
};
export declare class QuantumRNG {
    private buffer;
    private position;
    private readonly bufferSize;
    constructor(bufferSize?: number);
    private refill;
    nextByte(): number;
    nextBytes(n: number): Uint8Array;
    nextInt(max: number): number;
    nextFloat(): number;
    nextGaussian(mean?: number, stdDev?: number): number;
    shuffle<T>(array: T[]): T[];
}
/**
 * Simulated Kyber Key Encapsulation Mechanism
 * In production, use actual post-quantum libraries like liboqs
 */
export declare class KyberKEM {
    private readonly securityLevel;
    private readonly rng;
    constructor(securityLevel?: 128 | 192 | 256);
    generateKeyPair(): QuantumKey;
    encapsulate(publicKey: Uint8Array): EncapsulatedKey;
    decapsulate(ciphertext: Uint8Array, privateKey: Uint8Array): Uint8Array;
}
/**
 * Simulated Dilithium Digital Signature Algorithm
 */
export declare class DilithiumSignature {
    private readonly securityLevel;
    private readonly rng;
    constructor(securityLevel?: 128 | 192 | 256);
    generateKeyPair(): QuantumKey;
    sign(message: Uint8Array, privateKey: Uint8Array): QuantumSignature;
    verify(message: Uint8Array, signature: QuantumSignature, publicKey: Uint8Array): boolean;
}
export declare class QuantumSimulator {
    private state;
    private readonly maxQubits;
    constructor(numQubits: number, maxQubits?: number);
    private initializeState;
    hadamard(qubit: number): void;
    pauliX(qubit: number): void;
    pauliY(qubit: number): void;
    pauliZ(qubit: number): void;
    sGate(qubit: number): void;
    tGate(qubit: number): void;
    rotateX(qubit: number, theta: number): void;
    rotateY(qubit: number, theta: number): void;
    rotateZ(qubit: number, theta: number): void;
    private applySingleQubitGate;
    cnot(control: number, target: number): void;
    cz(control: number, target: number): void;
    swap(qubit1: number, qubit2: number): void;
    measure(qubit: number): number;
    measureAll(): number[];
    getState(): QuantumState;
    getProbabilities(): number[];
    reset(): void;
}
export declare class QuantumAnnealingOptimizer {
    private readonly rng;
    constructor();
    /**
     * Simulated Quantum Annealing for combinatorial optimization
     */
    optimize(costFunction: (solution: number[]) => number, numVariables: number, options?: {
        maxIterations?: number;
        initialTemp?: number;
        finalTemp?: number;
        coolingRate?: number;
    }): OptimizationResult;
}
export declare class QAOAOptimizer {
    private readonly simulator;
    constructor(numQubits: number);
    /**
     * Quantum Approximate Optimization Algorithm (simulated)
     */
    optimize(costHamiltonian: number[][], params: QAOAParams): OptimizationResult;
    private applyCostLayer;
    private applyMixerLayer;
    private calculateEnergy;
}
export declare function initQuantum(config?: QuantumConfig): void;
export declare function useQuantumRandom(): QuantumRNG;
export declare function usePostQuantumCrypto(): {
    kyber: KyberKEM;
    dilithium: DilithiumSignature;
};
export declare function useQuantumSimulator(numQubits: number): QuantumSimulator;
export declare function useQuantumAnnealing(): QuantumAnnealingOptimizer;
export declare function useQAOA(numQubits: number): QAOAOptimizer;
export declare function useQuantumId(length?: number): string;
export declare function useQuantumShuffle<T>(array: T[]): T[];
//# sourceMappingURL=index.d.ts.map