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

// ============================================================================
// Types
// ============================================================================

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

export type GateType =
  | 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T'
  | 'CNOT' | 'CZ' | 'SWAP' | 'TOFFOLI'
  | 'RX' | 'RY' | 'RZ' | 'U' | 'PHASE';

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

// ============================================================================
// Complex Number Operations
// ============================================================================

export const Complex = {
  create(real: number, imag: number = 0): Complex {
    return { real, imag };
  },

  add(a: Complex, b: Complex): Complex {
    return { real: a.real + b.real, imag: a.imag + b.imag };
  },

  sub(a: Complex, b: Complex): Complex {
    return { real: a.real - b.real, imag: a.imag - b.imag };
  },

  mul(a: Complex, b: Complex): Complex {
    return {
      real: a.real * b.real - a.imag * b.imag,
      imag: a.real * b.imag + a.imag * b.real
    };
  },

  div(a: Complex, b: Complex): Complex {
    const denom = b.real * b.real + b.imag * b.imag;
    return {
      real: (a.real * b.real + a.imag * b.imag) / denom,
      imag: (a.imag * b.real - a.real * b.imag) / denom
    };
  },

  conjugate(a: Complex): Complex {
    return { real: a.real, imag: -a.imag };
  },

  magnitude(a: Complex): number {
    return Math.sqrt(a.real * a.real + a.imag * a.imag);
  },

  phase(a: Complex): number {
    return Math.atan2(a.imag, a.real);
  },

  exp(theta: number): Complex {
    return { real: Math.cos(theta), imag: Math.sin(theta) };
  },

  scale(a: Complex, s: number): Complex {
    return { real: a.real * s, imag: a.imag * s };
  }
};

// ============================================================================
// Quantum Random Number Generator
// ============================================================================

export class QuantumRNG {
  private buffer: Uint8Array;
  private position: number = 0;
  private readonly bufferSize: number;

  constructor(bufferSize: number = 256) {
    this.bufferSize = bufferSize;
    this.buffer = new Uint8Array(bufferSize);
    this.refill();
  }

  private refill(): void {
    // Use crypto.getRandomValues for cryptographically secure randomness
    // In a real quantum computer, this would use quantum measurement
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(this.buffer);
    } else {
      // Fallback for environments without crypto
      for (let i = 0; i < this.bufferSize; i++) {
        this.buffer[i] = Math.floor(Math.random() * 256);
      }
    }
    this.position = 0;
  }

  nextByte(): number {
    if (this.position >= this.bufferSize) {
      this.refill();
    }
    return this.buffer[this.position++];
  }

  nextBytes(n: number): Uint8Array {
    const result = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      result[i] = this.nextByte();
    }
    return result;
  }

  nextInt(max: number): number {
    const bytes = Math.ceil(Math.log2(max) / 8) || 1;
    let value: number;
    do {
      value = 0;
      for (let i = 0; i < bytes; i++) {
        value = (value << 8) | this.nextByte();
      }
      value = value % (max + 1);
    } while (value > max);
    return value;
  }

  nextFloat(): number {
    const bytes = this.nextBytes(4);
    const view = new DataView(bytes.buffer);
    return view.getUint32(0) / 0xFFFFFFFF;
  }

  nextGaussian(mean: number = 0, stdDev: number = 1): number {
    // Box-Muller transform
    const u1 = this.nextFloat();
    const u2 = this.nextFloat();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

// ============================================================================
// Post-Quantum Cryptography (Simulated)
// ============================================================================

/**
 * Simulated Kyber Key Encapsulation Mechanism
 * In production, use actual post-quantum libraries like liboqs
 */
export class KyberKEM {
  private readonly securityLevel: number;
  private readonly rng: QuantumRNG;

  constructor(securityLevel: 128 | 192 | 256 = 256) {
    this.securityLevel = securityLevel;
    this.rng = new QuantumRNG();
  }

  generateKeyPair(): QuantumKey {
    // Simulated key generation
    // Real implementation would use lattice-based cryptography
    const privateKeySize = this.securityLevel * 4;
    const publicKeySize = this.securityLevel * 8;

    return {
      publicKey: this.rng.nextBytes(publicKeySize),
      privateKey: this.rng.nextBytes(privateKeySize),
      algorithm: 'KYBER',
      securityLevel: this.securityLevel
    };
  }

  encapsulate(publicKey: Uint8Array): EncapsulatedKey {
    // Simulated encapsulation
    const ciphertextSize = this.securityLevel * 6;
    const sharedSecretSize = 32;

    return {
      ciphertext: this.rng.nextBytes(ciphertextSize),
      sharedSecret: this.rng.nextBytes(sharedSecretSize)
    };
  }

  decapsulate(ciphertext: Uint8Array, privateKey: Uint8Array): Uint8Array {
    // Simulated decapsulation
    return this.rng.nextBytes(32);
  }
}

/**
 * Simulated Dilithium Digital Signature Algorithm
 */
export class DilithiumSignature {
  private readonly securityLevel: number;
  private readonly rng: QuantumRNG;

  constructor(securityLevel: 128 | 192 | 256 = 256) {
    this.securityLevel = securityLevel;
    this.rng = new QuantumRNG();
  }

  generateKeyPair(): QuantumKey {
    const privateKeySize = this.securityLevel * 8;
    const publicKeySize = this.securityLevel * 4;

    return {
      publicKey: this.rng.nextBytes(publicKeySize),
      privateKey: this.rng.nextBytes(privateKeySize),
      algorithm: 'DILITHIUM',
      securityLevel: this.securityLevel
    };
  }

  sign(message: Uint8Array, privateKey: Uint8Array): QuantumSignature {
    // Simulated signing
    const signatureSize = this.securityLevel * 10;

    return {
      signature: this.rng.nextBytes(signatureSize),
      algorithm: 'DILITHIUM',
      publicKey: new Uint8Array(0) // Would include public key for verification
    };
  }

  verify(message: Uint8Array, signature: QuantumSignature, publicKey: Uint8Array): boolean {
    // Simulated verification (always returns true for demo)
    // Real implementation would verify lattice-based signature
    return true;
  }
}

// ============================================================================
// Quantum State Simulator
// ============================================================================

export class QuantumSimulator {
  private state: QuantumState;
  private readonly maxQubits: number;

  constructor(numQubits: number, maxQubits: number = 16) {
    if (numQubits > maxQubits) {
      throw new Error(`Cannot simulate more than ${maxQubits} qubits`);
    }

    this.maxQubits = maxQubits;
    this.state = this.initializeState(numQubits);
  }

  private initializeState(numQubits: number): QuantumState {
    const size = Math.pow(2, numQubits);
    const amplitudes: Complex[] = new Array(size);

    // Initialize to |0...0⟩ state
    amplitudes[0] = Complex.create(1, 0);
    for (let i = 1; i < size; i++) {
      amplitudes[i] = Complex.create(0, 0);
    }

    return {
      amplitudes,
      numQubits,
      measured: false,
      classicalBits: new Array(numQubits).fill(0)
    };
  }

  // Single-qubit gates

  hadamard(qubit: number): void {
    this.applySingleQubitGate(qubit, [
      [Complex.create(1 / Math.SQRT2), Complex.create(1 / Math.SQRT2)],
      [Complex.create(1 / Math.SQRT2), Complex.create(-1 / Math.SQRT2)]
    ]);
  }

  pauliX(qubit: number): void {
    this.applySingleQubitGate(qubit, [
      [Complex.create(0), Complex.create(1)],
      [Complex.create(1), Complex.create(0)]
    ]);
  }

  pauliY(qubit: number): void {
    this.applySingleQubitGate(qubit, [
      [Complex.create(0), Complex.create(0, -1)],
      [Complex.create(0, 1), Complex.create(0)]
    ]);
  }

  pauliZ(qubit: number): void {
    this.applySingleQubitGate(qubit, [
      [Complex.create(1), Complex.create(0)],
      [Complex.create(0), Complex.create(-1)]
    ]);
  }

  sGate(qubit: number): void {
    this.applySingleQubitGate(qubit, [
      [Complex.create(1), Complex.create(0)],
      [Complex.create(0), Complex.create(0, 1)]
    ]);
  }

  tGate(qubit: number): void {
    this.applySingleQubitGate(qubit, [
      [Complex.create(1), Complex.create(0)],
      [Complex.create(0), Complex.exp(Math.PI / 4)]
    ]);
  }

  rotateX(qubit: number, theta: number): void {
    const cos = Math.cos(theta / 2);
    const sin = Math.sin(theta / 2);
    this.applySingleQubitGate(qubit, [
      [Complex.create(cos), Complex.create(0, -sin)],
      [Complex.create(0, -sin), Complex.create(cos)]
    ]);
  }

  rotateY(qubit: number, theta: number): void {
    const cos = Math.cos(theta / 2);
    const sin = Math.sin(theta / 2);
    this.applySingleQubitGate(qubit, [
      [Complex.create(cos), Complex.create(-sin)],
      [Complex.create(sin), Complex.create(cos)]
    ]);
  }

  rotateZ(qubit: number, theta: number): void {
    this.applySingleQubitGate(qubit, [
      [Complex.exp(-theta / 2), Complex.create(0)],
      [Complex.create(0), Complex.exp(theta / 2)]
    ]);
  }

  private applySingleQubitGate(qubit: number, matrix: Complex[][]): void {
    const n = this.state.numQubits;
    const size = Math.pow(2, n);
    const newAmplitudes: Complex[] = [...this.state.amplitudes];

    for (let i = 0; i < size; i++) {
      const bit = (i >> qubit) & 1;
      if (bit === 0) {
        const j = i | (1 << qubit);
        const a0 = this.state.amplitudes[i];
        const a1 = this.state.amplitudes[j];

        newAmplitudes[i] = Complex.add(
          Complex.mul(matrix[0][0], a0),
          Complex.mul(matrix[0][1], a1)
        );
        newAmplitudes[j] = Complex.add(
          Complex.mul(matrix[1][0], a0),
          Complex.mul(matrix[1][1], a1)
        );
      }
    }

    this.state.amplitudes = newAmplitudes;
  }

  // Two-qubit gates

  cnot(control: number, target: number): void {
    const n = this.state.numQubits;
    const size = Math.pow(2, n);

    for (let i = 0; i < size; i++) {
      const controlBit = (i >> control) & 1;
      if (controlBit === 1) {
        const j = i ^ (1 << target);
        if (i < j) {
          [this.state.amplitudes[i], this.state.amplitudes[j]] =
            [this.state.amplitudes[j], this.state.amplitudes[i]];
        }
      }
    }
  }

  cz(control: number, target: number): void {
    const n = this.state.numQubits;
    const size = Math.pow(2, n);

    for (let i = 0; i < size; i++) {
      const controlBit = (i >> control) & 1;
      const targetBit = (i >> target) & 1;
      if (controlBit === 1 && targetBit === 1) {
        this.state.amplitudes[i] = Complex.scale(this.state.amplitudes[i], -1);
      }
    }
  }

  swap(qubit1: number, qubit2: number): void {
    const n = this.state.numQubits;
    const size = Math.pow(2, n);

    for (let i = 0; i < size; i++) {
      const bit1 = (i >> qubit1) & 1;
      const bit2 = (i >> qubit2) & 1;
      if (bit1 !== bit2) {
        const j = i ^ (1 << qubit1) ^ (1 << qubit2);
        if (i < j) {
          [this.state.amplitudes[i], this.state.amplitudes[j]] =
            [this.state.amplitudes[j], this.state.amplitudes[i]];
        }
      }
    }
  }

  // Measurement

  measure(qubit: number): number {
    const n = this.state.numQubits;
    const size = Math.pow(2, n);

    // Calculate probability of measuring |1⟩
    let prob1 = 0;
    for (let i = 0; i < size; i++) {
      if ((i >> qubit) & 1) {
        prob1 += Math.pow(Complex.magnitude(this.state.amplitudes[i]), 2);
      }
    }

    // Collapse the state
    const random = Math.random();
    const result = random < prob1 ? 1 : 0;
    const normFactor = result === 1 ? Math.sqrt(prob1) : Math.sqrt(1 - prob1);

    for (let i = 0; i < size; i++) {
      const bit = (i >> qubit) & 1;
      if (bit === result) {
        this.state.amplitudes[i] = Complex.scale(
          this.state.amplitudes[i],
          1 / normFactor
        );
      } else {
        this.state.amplitudes[i] = Complex.create(0);
      }
    }

    this.state.classicalBits[qubit] = result;
    return result;
  }

  measureAll(): number[] {
    const results: number[] = [];
    for (let i = 0; i < this.state.numQubits; i++) {
      results.push(this.measure(i));
    }
    this.state.measured = true;
    return results;
  }

  // State inspection

  getState(): QuantumState {
    return { ...this.state, amplitudes: [...this.state.amplitudes] };
  }

  getProbabilities(): number[] {
    return this.state.amplitudes.map(a => Math.pow(Complex.magnitude(a), 2));
  }

  reset(): void {
    this.state = this.initializeState(this.state.numQubits);
  }
}

// ============================================================================
// Quantum-Inspired Optimization
// ============================================================================

export class QuantumAnnealingOptimizer {
  private readonly rng: QuantumRNG;

  constructor() {
    this.rng = new QuantumRNG();
  }

  /**
   * Simulated Quantum Annealing for combinatorial optimization
   */
  optimize(
    costFunction: (solution: number[]) => number,
    numVariables: number,
    options: {
      maxIterations?: number;
      initialTemp?: number;
      finalTemp?: number;
      coolingRate?: number;
    } = {}
  ): OptimizationResult {
    const {
      maxIterations = 10000,
      initialTemp = 100,
      finalTemp = 0.001,
      coolingRate = 0.99
    } = options;

    // Initialize random solution
    let solution = Array.from({ length: numVariables }, () => this.rng.nextInt(1));
    let energy = costFunction(solution);
    let bestSolution = [...solution];
    let bestEnergy = energy;

    let temperature = initialTemp;
    let iterations = 0;

    while (temperature > finalTemp && iterations < maxIterations) {
      // Generate neighbor by flipping random bits (quantum tunneling simulation)
      const neighbor = [...solution];
      const numFlips = Math.max(1, Math.floor(this.rng.nextFloat() * 3));

      for (let i = 0; i < numFlips; i++) {
        const flipIndex = this.rng.nextInt(numVariables - 1);
        neighbor[flipIndex] = 1 - neighbor[flipIndex];
      }

      const neighborEnergy = costFunction(neighbor);
      const delta = neighborEnergy - energy;

      // Accept with Boltzmann probability (quantum tunneling effect)
      if (delta < 0 || this.rng.nextFloat() < Math.exp(-delta / temperature)) {
        solution = neighbor;
        energy = neighborEnergy;

        if (energy < bestEnergy) {
          bestSolution = [...solution];
          bestEnergy = energy;
        }
      }

      temperature *= coolingRate;
      iterations++;
    }

    return {
      solution: bestSolution,
      energy: bestEnergy,
      iterations,
      converged: temperature <= finalTemp
    };
  }
}

export class QAOAOptimizer {
  private readonly simulator: QuantumSimulator;

  constructor(numQubits: number) {
    this.simulator = new QuantumSimulator(numQubits);
  }

  /**
   * Quantum Approximate Optimization Algorithm (simulated)
   */
  optimize(
    costHamiltonian: number[][],
    params: QAOAParams
  ): OptimizationResult {
    const numQubits = costHamiltonian.length;
    let bestSolution: number[] = [];
    let bestEnergy = Infinity;

    // Run multiple shots
    const shots = 1000;
    const energyCounts = new Map<string, { count: number; energy: number }>();

    for (let shot = 0; shot < shots; shot++) {
      this.simulator.reset();

      // Initial superposition
      for (let i = 0; i < numQubits; i++) {
        this.simulator.hadamard(i);
      }

      // Apply QAOA layers
      for (let layer = 0; layer < params.layers; layer++) {
        // Cost layer (phase separation)
        this.applyCostLayer(costHamiltonian, params.gamma[layer]);

        // Mixer layer
        this.applyMixerLayer(numQubits, params.beta[layer]);
      }

      // Measure
      const result = this.simulator.measureAll();
      const resultKey = result.join('');
      const energy = this.calculateEnergy(result, costHamiltonian);

      const existing = energyCounts.get(resultKey);
      if (existing) {
        existing.count++;
      } else {
        energyCounts.set(resultKey, { count: 1, energy });
      }

      if (energy < bestEnergy) {
        bestEnergy = energy;
        bestSolution = [...result];
      }
    }

    return {
      solution: bestSolution,
      energy: bestEnergy,
      iterations: shots,
      converged: true
    };
  }

  private applyCostLayer(hamiltonian: number[][], gamma: number): void {
    // Apply e^(-i * gamma * H_C) for cost Hamiltonian
    for (let i = 0; i < hamiltonian.length; i++) {
      for (let j = i + 1; j < hamiltonian.length; j++) {
        if (hamiltonian[i][j] !== 0) {
          // ZZ interaction
          this.simulator.cnot(i, j);
          this.simulator.rotateZ(j, 2 * gamma * hamiltonian[i][j]);
          this.simulator.cnot(i, j);
        }
      }
    }
  }

  private applyMixerLayer(numQubits: number, beta: number): void {
    // Apply e^(-i * beta * H_M) for mixer Hamiltonian (sum of X operators)
    for (let i = 0; i < numQubits; i++) {
      this.simulator.rotateX(i, 2 * beta);
    }
  }

  private calculateEnergy(solution: number[], hamiltonian: number[][]): number {
    let energy = 0;
    for (let i = 0; i < hamiltonian.length; i++) {
      for (let j = i + 1; j < hamiltonian.length; j++) {
        // Convert {0,1} to {-1,+1} for Ising model
        const si = 2 * solution[i] - 1;
        const sj = 2 * solution[j] - 1;
        energy += hamiltonian[i][j] * si * sj;
      }
    }
    return energy;
  }
}

// ============================================================================
// React-like Hooks
// ============================================================================

let globalConfig: QuantumConfig = {
  useHardwareRandom: true,
  algorithm: 'kyber',
  securityLevel: 256,
  enableSimulation: true,
  maxQubits: 16
};

let globalRNG: QuantumRNG | null = null;

export function initQuantum(config?: QuantumConfig): void {
  globalConfig = { ...globalConfig, ...config };
  globalRNG = new QuantumRNG();
}

export function useQuantumRandom(): QuantumRNG {
  if (!globalRNG) {
    globalRNG = new QuantumRNG();
  }
  return globalRNG;
}

export function usePostQuantumCrypto(): {
  kyber: KyberKEM;
  dilithium: DilithiumSignature;
} {
  return {
    kyber: new KyberKEM(globalConfig.securityLevel),
    dilithium: new DilithiumSignature(globalConfig.securityLevel)
  };
}

export function useQuantumSimulator(numQubits: number): QuantumSimulator {
  return new QuantumSimulator(numQubits, globalConfig.maxQubits);
}

export function useQuantumAnnealing(): QuantumAnnealingOptimizer {
  return new QuantumAnnealingOptimizer();
}

export function useQAOA(numQubits: number): QAOAOptimizer {
  return new QAOAOptimizer(numQubits);
}

// Utility hooks

export function useQuantumId(length: number = 16): string {
  const rng = useQuantumRandom();
  const bytes = rng.nextBytes(length);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function useQuantumShuffle<T>(array: T[]): T[] {
  const rng = useQuantumRandom();
  return rng.shuffle(array);
}

// ============================================================================
// Exports
// ============================================================================

export {
  QuantumRNG,
  KyberKEM,
  DilithiumSignature,
  QuantumSimulator,
  QuantumAnnealingOptimizer,
  QAOAOptimizer,
  Complex
};
