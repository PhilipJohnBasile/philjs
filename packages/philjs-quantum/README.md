# @philjs/quantum

Quantum-Ready Primitives for PhilJS - Prepare your applications for the quantum computing era with post-quantum cryptography, quantum random number generation, quantum state simulation, and quantum-inspired optimization algorithms.

## Installation

```bash
npm install @philjs/quantum
```

## Requirements

- Node.js >= 24
- TypeScript 6.x (for development)
- Browser with `crypto.getRandomValues` support (for QRNG)

## Basic Usage

```typescript
import {
  initQuantum,
  useQuantumRandom,
  usePostQuantumCrypto,
  useQuantumSimulator
} from '@philjs/quantum';

// Initialize quantum module
initQuantum({
  useHardwareRandom: true,
  algorithm: 'kyber',
  securityLevel: 256,
  maxQubits: 16
});

// Generate quantum-safe random numbers
const rng = useQuantumRandom();
const randomBytes = rng.nextBytes(32);
const randomInt = rng.nextInt(100);
const randomFloat = rng.nextFloat();

// Use post-quantum cryptography
const { kyber, dilithium } = usePostQuantumCrypto();

// Create a quantum simulator
const simulator = useQuantumSimulator(4); // 4 qubits
```

## Quantum Random Number Generator

```typescript
import { QuantumRNG, useQuantumRandom } from '@philjs/quantum';

const rng = new QuantumRNG(256); // 256 byte buffer

// Generate random values
const byte = rng.nextByte();           // 0-255
const bytes = rng.nextBytes(16);       // Uint8Array
const int = rng.nextInt(1000);         // 0-1000
const float = rng.nextFloat();         // 0.0-1.0
const gaussian = rng.nextGaussian(0, 1); // Normal distribution

// Shuffle an array
const shuffled = rng.shuffle([1, 2, 3, 4, 5]);

// Utility hooks
import { useQuantumId, useQuantumShuffle } from '@philjs/quantum';
const id = useQuantumId(16);              // 32-char hex string
const shuffledArray = useQuantumShuffle(['a', 'b', 'c']);
```

## Post-Quantum Cryptography

### Kyber Key Encapsulation

```typescript
import { KyberKEM } from '@philjs/quantum';

const kyber = new KyberKEM(256); // 128, 192, or 256 bit security

// Generate key pair
const keyPair = kyber.generateKeyPair();
console.log('Public key:', keyPair.publicKey);
console.log('Private key:', keyPair.privateKey);

// Encapsulate (sender)
const { ciphertext, sharedSecret } = kyber.encapsulate(keyPair.publicKey);

// Decapsulate (receiver)
const decapsulatedSecret = kyber.decapsulate(ciphertext, keyPair.privateKey);
```

### Dilithium Digital Signatures

```typescript
import { DilithiumSignature } from '@philjs/quantum';

const dilithium = new DilithiumSignature(256);

// Generate key pair
const keyPair = dilithium.generateKeyPair();

// Sign a message
const message = new TextEncoder().encode('Hello, quantum world!');
const signature = dilithium.sign(message, keyPair.privateKey);

// Verify signature
const isValid = dilithium.verify(message, signature, keyPair.publicKey);
```

## Quantum State Simulation

```typescript
import { QuantumSimulator, useQuantumSimulator } from '@philjs/quantum';

const sim = new QuantumSimulator(4); // 4 qubits

// Apply quantum gates
sim.hadamard(0);           // Superposition on qubit 0
sim.pauliX(1);             // NOT gate on qubit 1
sim.pauliY(2);             // Y gate
sim.pauliZ(3);             // Z gate
sim.sGate(0);              // S phase gate
sim.tGate(1);              // T gate

// Rotation gates
sim.rotateX(0, Math.PI / 4);
sim.rotateY(1, Math.PI / 2);
sim.rotateZ(2, Math.PI);

// Two-qubit gates
sim.cnot(0, 1);            // CNOT with control=0, target=1
sim.cz(1, 2);              // Controlled-Z
sim.swap(2, 3);            // SWAP qubits

// Measurement
const bit = sim.measure(0);      // Measure single qubit
const allBits = sim.measureAll(); // Measure all qubits

// Get state information
const state = sim.getState();
const probabilities = sim.getProbabilities();

// Reset to |0...0>
sim.reset();
```

## Quantum-Inspired Optimization

### Simulated Quantum Annealing

```typescript
import { QuantumAnnealingOptimizer, useQuantumAnnealing } from '@philjs/quantum';

const optimizer = new QuantumAnnealingOptimizer();

// Define a cost function (e.g., MAX-CUT problem)
const costFunction = (solution: number[]) => {
  // Return energy to minimize
  let cost = 0;
  for (let i = 0; i < solution.length - 1; i++) {
    if (solution[i] !== solution[i + 1]) cost--;
  }
  return cost;
};

const result = optimizer.optimize(costFunction, 10, {
  maxIterations: 10000,
  initialTemp: 100,
  finalTemp: 0.001,
  coolingRate: 0.99
});

console.log('Best solution:', result.solution);
console.log('Best energy:', result.energy);
console.log('Iterations:', result.iterations);
console.log('Converged:', result.converged);
```

### QAOA (Quantum Approximate Optimization Algorithm)

```typescript
import { QAOAOptimizer, useQAOA } from '@philjs/quantum';

const qaoa = new QAOAOptimizer(4); // 4 qubits

// Define problem as Ising Hamiltonian (adjacency matrix)
const hamiltonian = [
  [0, 1, 0, 1],
  [1, 0, 1, 0],
  [0, 1, 0, 1],
  [1, 0, 1, 0]
];

const result = qaoa.optimize(hamiltonian, {
  layers: 3,
  gamma: [0.5, 0.7, 0.9],
  beta: [0.3, 0.2, 0.1]
});

console.log('Optimal solution:', result.solution);
console.log('Energy:', result.energy);
```

## Complex Number Operations

```typescript
import { Complex } from '@philjs/quantum';

const a = Complex.create(3, 4);      // 3 + 4i
const b = Complex.create(1, 2);      // 1 + 2i

const sum = Complex.add(a, b);       // 4 + 6i
const diff = Complex.sub(a, b);      // 2 + 2i
const prod = Complex.mul(a, b);      // -5 + 10i
const quot = Complex.div(a, b);      // 2.2 - 0.4i

const conj = Complex.conjugate(a);   // 3 - 4i
const mag = Complex.magnitude(a);    // 5
const phase = Complex.phase(a);      // atan2(4, 3)
const exp = Complex.exp(Math.PI);    // e^(i*pi) = -1
const scaled = Complex.scale(a, 2);  // 6 + 8i
```

## API Reference

### Initialization

- **`initQuantum(config?: QuantumConfig)`** - Initialize quantum module with options

### Hooks

- **`useQuantumRandom(): QuantumRNG`** - Get quantum RNG instance
- **`usePostQuantumCrypto()`** - Get Kyber and Dilithium instances
- **`useQuantumSimulator(numQubits): QuantumSimulator`** - Create quantum simulator
- **`useQuantumAnnealing(): QuantumAnnealingOptimizer`** - Get annealing optimizer
- **`useQAOA(numQubits): QAOAOptimizer`** - Get QAOA optimizer
- **`useQuantumId(length?): string`** - Generate random hex ID
- **`useQuantumShuffle<T>(array): T[]`** - Shuffle array randomly

### Classes

#### `QuantumRNG`

Cryptographically secure random number generator.

#### `KyberKEM`

Post-quantum key encapsulation mechanism.

**Methods:**
- `generateKeyPair(): QuantumKey`
- `encapsulate(publicKey): EncapsulatedKey`
- `decapsulate(ciphertext, privateKey): Uint8Array`

#### `DilithiumSignature`

Post-quantum digital signature algorithm.

**Methods:**
- `generateKeyPair(): QuantumKey`
- `sign(message, privateKey): QuantumSignature`
- `verify(message, signature, publicKey): boolean`

#### `QuantumSimulator`

Quantum state vector simulator.

**Single-qubit gates:**
- `hadamard(qubit)` - H gate
- `pauliX/Y/Z(qubit)` - Pauli gates
- `sGate/tGate(qubit)` - Phase gates
- `rotateX/Y/Z(qubit, theta)` - Rotation gates

**Two-qubit gates:**
- `cnot(control, target)` - Controlled-NOT
- `cz(control, target)` - Controlled-Z
- `swap(qubit1, qubit2)` - SWAP

**Measurement:**
- `measure(qubit): number` - Measure single qubit
- `measureAll(): number[]` - Measure all qubits
- `getProbabilities(): number[]` - Get state probabilities

#### `QuantumAnnealingOptimizer`

Simulated quantum annealing for combinatorial optimization.

#### `QAOAOptimizer`

Quantum Approximate Optimization Algorithm simulator.

### Configuration

```typescript
interface QuantumConfig {
  useHardwareRandom?: boolean;    // Use hardware RNG (default: true)
  algorithm?: 'kyber' | 'dilithium' | 'sphincs' | 'ntru';
  securityLevel?: 128 | 192 | 256;
  enableSimulation?: boolean;     // Enable quantum simulation (default: true)
  maxQubits?: number;             // Max qubits for simulation (default: 16)
}
```

### Types

- `QuantumKey` - Public/private key pair with algorithm info
- `EncapsulatedKey` - Ciphertext and shared secret
- `QuantumSignature` - Digital signature with metadata
- `Qubit` - Single qubit state (alpha, beta amplitudes)
- `Complex` - Complex number { real, imag }
- `QuantumState` - Full quantum state vector
- `QuantumCircuit` - Circuit definition
- `QuantumGate` - Gate with type, targets, and parameters
- `GateType` - All supported gate types
- `OptimizationResult` - Optimizer output
- `QAOAParams` - QAOA circuit parameters

## Security Note

The cryptographic implementations in this package are **simulated** for educational and development purposes. For production use, integrate with established post-quantum cryptography libraries such as:

- [liboqs](https://github.com/open-quantum-safe/liboqs) - Open Quantum Safe
- [NIST PQC](https://csrc.nist.gov/projects/post-quantum-cryptography) - Standardized algorithms

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-quantum/src/index.ts

### Public API
- Direct exports: Complex, DilithiumSignature, EncapsulatedKey, GateType, KyberKEM, OptimizationResult, QAOAOptimizer, QAOAParams, QuantumAnnealingOptimizer, QuantumCircuit, QuantumConfig, QuantumGate, QuantumKey, QuantumRNG, QuantumSignature, QuantumSimulator, QuantumState, Qubit, initQuantum, usePostQuantumCrypto, useQAOA, useQuantumAnnealing, useQuantumId, useQuantumRandom, useQuantumShuffle, useQuantumSimulator
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
