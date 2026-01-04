# @philjs/quantum - Quantum-Ready Primitives

The `@philjs/quantum` package provides quantum-ready primitives for future computing, including post-quantum cryptography, quantum random number generation, quantum state simulation, and quantum-inspired optimization algorithms.

**NO OTHER FRAMEWORK HAS THIS.**

## Installation

```bash
npm install @philjs/quantum
# or
pnpm add @philjs/quantum
# or
bun add @philjs/quantum
```

## Features

- **Quantum-Safe Cryptography** - Post-quantum encryption with Kyber KEM and Dilithium signatures
- **Quantum Random Number Generation** - Cryptographically secure random number generation
- **Quantum State Simulation** - Full quantum circuit simulation with up to 16 qubits
- **Quantum-Inspired Optimization** - Simulated quantum annealing and QAOA algorithms
- **Complex Number Operations** - Complete complex number arithmetic for quantum computations
- **React-like Hooks** - Easy-to-use hooks for quantum operations in your components

## Quick Start

```typescript
import {
  initQuantum,
  useQuantumRandom,
  usePostQuantumCrypto,
  useQuantumSimulator,
  useQuantumId
} from '@philjs/quantum';

// Initialize with configuration
initQuantum({
  securityLevel: 256,
  maxQubits: 16
});

// Generate quantum-secure random ID
const id = useQuantumId(16);
console.log(id); // e.g., "a3f8b2c4d5e6f7a8b9c0d1e2f3a4b5c6"

// Use post-quantum cryptography
const { kyber, dilithium } = usePostQuantumCrypto();

// Generate quantum-safe key pair
const keyPair = kyber.generateKeyPair();

// Create a quantum simulator
const simulator = useQuantumSimulator(3);
simulator.hadamard(0);
simulator.cnot(0, 1);
const result = simulator.measureAll();
```

---

## Complex Number Operations

The `Complex` namespace provides complete complex number arithmetic essential for quantum computations.

### Creating Complex Numbers

```typescript
import { Complex } from '@philjs/quantum';

// Create a complex number (real + imaginary)
const z1 = Complex.create(3, 4);    // 3 + 4i
const z2 = Complex.create(1, -2);   // 1 - 2i
const real = Complex.create(5);     // 5 + 0i (pure real)
```

### Arithmetic Operations

```typescript
import { Complex } from '@philjs/quantum';

const a = Complex.create(3, 4);
const b = Complex.create(1, 2);

// Addition: (3+4i) + (1+2i) = 4+6i
const sum = Complex.add(a, b);

// Subtraction: (3+4i) - (1+2i) = 2+2i
const diff = Complex.sub(a, b);

// Multiplication: (3+4i) * (1+2i) = -5+10i
const product = Complex.mul(a, b);

// Division: (3+4i) / (1+2i)
const quotient = Complex.div(a, b);

// Scale by a real number
const scaled = Complex.scale(a, 2); // 6+8i
```

### Complex Number Properties

```typescript
import { Complex } from '@philjs/quantum';

const z = Complex.create(3, 4);

// Conjugate: 3 - 4i
const conj = Complex.conjugate(z);

// Magnitude (absolute value): |3+4i| = 5
const mag = Complex.magnitude(z);

// Phase angle (argument)
const phase = Complex.phase(z);

// Euler's formula: e^(i*theta)
const euler = Complex.exp(Math.PI / 4); // cos(pi/4) + i*sin(pi/4)
```

### Complex Type

```typescript
interface Complex {
  real: number;
  imag: number;
}
```

---

## Quantum Random Number Generator

The `QuantumRNG` class provides cryptographically secure random number generation using the Web Crypto API when available.

### Basic Usage

```typescript
import { QuantumRNG } from '@philjs/quantum';

// Create RNG with custom buffer size
const rng = new QuantumRNG(512);

// Generate random bytes
const byte = rng.nextByte();           // Single byte (0-255)
const bytes = rng.nextBytes(32);       // 32 random bytes

// Generate random integers
const dice = rng.nextInt(6);           // 0 to 6 (inclusive)
const percent = rng.nextInt(100);      // 0 to 100

// Generate random floats
const float = rng.nextFloat();         // 0.0 to 1.0

// Generate Gaussian-distributed random numbers
const normal = rng.nextGaussian(0, 1); // mean=0, stdDev=1
```

### Array Shuffling

```typescript
import { QuantumRNG } from '@philjs/quantum';

const rng = new QuantumRNG();
const deck = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Cryptographically secure shuffle
const shuffled = rng.shuffle(deck);
```

### QuantumRNG API

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `constructor` | `bufferSize?: number` | `QuantumRNG` | Create RNG with buffer size (default: 256) |
| `nextByte` | - | `number` | Random byte (0-255) |
| `nextBytes` | `n: number` | `Uint8Array` | n random bytes |
| `nextInt` | `max: number` | `number` | Random integer 0 to max |
| `nextFloat` | - | `number` | Random float 0.0 to 1.0 |
| `nextGaussian` | `mean?: number, stdDev?: number` | `number` | Gaussian random number |
| `shuffle` | `array: T[]` | `T[]` | Shuffled copy of array |

---

## Post-Quantum Cryptography

The package provides simulated implementations of NIST-approved post-quantum cryptographic algorithms.

### Kyber Key Encapsulation Mechanism (KEM)

Kyber is a lattice-based key encapsulation mechanism resistant to quantum computer attacks.

```typescript
import { KyberKEM } from '@philjs/quantum';

// Create Kyber KEM with 256-bit security
const kyber = new KyberKEM(256);

// Generate key pair
const keyPair = kyber.generateKeyPair();
console.log('Public key:', keyPair.publicKey);
console.log('Private key:', keyPair.privateKey);
console.log('Algorithm:', keyPair.algorithm);      // 'KYBER'
console.log('Security level:', keyPair.securityLevel); // 256

// Encapsulate a shared secret using the public key
const encapsulated = kyber.encapsulate(keyPair.publicKey);
console.log('Ciphertext:', encapsulated.ciphertext);
console.log('Shared secret:', encapsulated.sharedSecret);

// Decapsulate to recover the shared secret
const recovered = kyber.decapsulate(
  encapsulated.ciphertext,
  keyPair.privateKey
);
```

### Dilithium Digital Signatures

Dilithium is a lattice-based digital signature scheme.

```typescript
import { DilithiumSignature } from '@philjs/quantum';

// Create Dilithium signer with 256-bit security
const dilithium = new DilithiumSignature(256);

// Generate signing key pair
const keyPair = dilithium.generateKeyPair();

// Sign a message
const message = new TextEncoder().encode('Hello, Quantum World!');
const signature = dilithium.sign(message, keyPair.privateKey);

console.log('Signature:', signature.signature);
console.log('Algorithm:', signature.algorithm); // 'DILITHIUM'

// Verify the signature
const isValid = dilithium.verify(
  message,
  signature,
  keyPair.publicKey
);
console.log('Signature valid:', isValid);
```

### Security Levels

Both `KyberKEM` and `DilithiumSignature` support three security levels:

| Level | Description |
|-------|-------------|
| `128` | NIST Level 1 - AES-128 equivalent |
| `192` | NIST Level 3 - AES-192 equivalent |
| `256` | NIST Level 5 - AES-256 equivalent (recommended) |

---

## Quantum State Simulator

The `QuantumSimulator` class provides a full-featured quantum circuit simulator supporting common quantum gates and measurements.

### Creating a Simulator

```typescript
import { QuantumSimulator } from '@philjs/quantum';

// Create a 3-qubit simulator
const sim = new QuantumSimulator(3);

// Create with custom max qubits limit
const largeSim = new QuantumSimulator(8, 20);
```

### Single-Qubit Gates

```typescript
import { QuantumSimulator } from '@philjs/quantum';

const sim = new QuantumSimulator(3);

// Hadamard gate - creates superposition
sim.hadamard(0);

// Pauli gates
sim.pauliX(0);  // NOT gate / bit flip
sim.pauliY(0);  // Y rotation
sim.pauliZ(0);  // Phase flip

// Phase gates
sim.sGate(0);   // S gate (pi/2 phase)
sim.tGate(0);   // T gate (pi/4 phase)

// Rotation gates with angle parameter
sim.rotateX(0, Math.PI / 4);  // Rotate around X axis
sim.rotateY(0, Math.PI / 4);  // Rotate around Y axis
sim.rotateZ(0, Math.PI / 4);  // Rotate around Z axis
```

### Two-Qubit Gates

```typescript
import { QuantumSimulator } from '@philjs/quantum';

const sim = new QuantumSimulator(3);

// CNOT (Controlled-NOT) gate
sim.cnot(0, 1);  // Control on qubit 0, target on qubit 1

// CZ (Controlled-Z) gate
sim.cz(0, 1);

// SWAP gate
sim.swap(0, 1);  // Swap qubits 0 and 1
```

### Creating Entanglement

```typescript
import { QuantumSimulator } from '@philjs/quantum';

// Create a Bell state (maximally entangled pair)
const sim = new QuantumSimulator(2);

sim.hadamard(0);  // Put qubit 0 in superposition
sim.cnot(0, 1);   // Entangle qubits 0 and 1

// Now measuring qubit 0 will instantly determine qubit 1's state
const result = sim.measureAll();
console.log(result); // Either [0, 0] or [1, 1]
```

### Measurement

```typescript
import { QuantumSimulator } from '@philjs/quantum';

const sim = new QuantumSimulator(3);
sim.hadamard(0);
sim.hadamard(1);
sim.hadamard(2);

// Measure a single qubit (collapses that qubit's state)
const bit0 = sim.measure(0); // Returns 0 or 1

// Measure all qubits
const results = sim.measureAll(); // Returns [0/1, 0/1, 0/1]

// Get probabilities before measurement
const probabilities = sim.getProbabilities();
console.log(probabilities); // Array of 8 probabilities for 3 qubits
```

### State Inspection

```typescript
import { QuantumSimulator, Complex } from '@philjs/quantum';

const sim = new QuantumSimulator(2);
sim.hadamard(0);

// Get the full quantum state
const state = sim.getState();
console.log('Number of qubits:', state.numQubits);
console.log('Amplitudes:', state.amplitudes);
console.log('Measured:', state.measured);
console.log('Classical bits:', state.classicalBits);

// Get measurement probabilities
const probs = sim.getProbabilities();
// For 2 qubits: [P(00), P(01), P(10), P(11)]

// Reset to initial |00...0> state
sim.reset();
```

### Available Gates

| Gate | Method | Description |
|------|--------|-------------|
| H | `hadamard(qubit)` | Hadamard gate - creates superposition |
| X | `pauliX(qubit)` | Pauli-X (NOT) gate |
| Y | `pauliY(qubit)` | Pauli-Y gate |
| Z | `pauliZ(qubit)` | Pauli-Z (phase flip) gate |
| S | `sGate(qubit)` | S gate (sqrt of Z) |
| T | `tGate(qubit)` | T gate (sqrt of S) |
| RX | `rotateX(qubit, theta)` | X-axis rotation |
| RY | `rotateY(qubit, theta)` | Y-axis rotation |
| RZ | `rotateZ(qubit, theta)` | Z-axis rotation |
| CNOT | `cnot(control, target)` | Controlled-NOT gate |
| CZ | `cz(control, target)` | Controlled-Z gate |
| SWAP | `swap(qubit1, qubit2)` | Swap two qubits |

---

## Quantum-Inspired Optimization

### Quantum Annealing Optimizer

Simulated quantum annealing for solving combinatorial optimization problems.

```typescript
import { QuantumAnnealingOptimizer } from '@philjs/quantum';

const optimizer = new QuantumAnnealingOptimizer();

// Define a cost function to minimize
// Example: Find the minimum of f(x) = sum of (x_i - target)^2
const target = [1, 0, 1, 1, 0];
const costFunction = (solution: number[]) => {
  return solution.reduce((cost, bit, i) => {
    return cost + Math.pow(bit - target[i], 2);
  }, 0);
};

// Run optimization
const result = optimizer.optimize(
  costFunction,
  5, // number of binary variables
  {
    maxIterations: 10000,
    initialTemp: 100,
    finalTemp: 0.001,
    coolingRate: 0.99
  }
);

console.log('Best solution:', result.solution);
console.log('Energy (cost):', result.energy);
console.log('Iterations:', result.iterations);
console.log('Converged:', result.converged);
```

### QAOA Optimizer

Quantum Approximate Optimization Algorithm for graph optimization problems.

```typescript
import { QAOAOptimizer } from '@philjs/quantum';

// Create QAOA optimizer for 4 qubits
const qaoa = new QAOAOptimizer(4);

// Define the cost Hamiltonian as an adjacency matrix
// Example: MaxCut problem on a simple graph
const costHamiltonian = [
  [0, 1, 0, 1],
  [1, 0, 1, 0],
  [0, 1, 0, 1],
  [1, 0, 1, 0]
];

// Set QAOA parameters
const params = {
  layers: 2,
  gamma: [0.5, 0.3],  // Cost layer angles
  beta: [0.4, 0.2]    // Mixer layer angles
};

// Run QAOA optimization
const result = qaoa.optimize(costHamiltonian, params);

console.log('Best solution:', result.solution);
console.log('Energy:', result.energy);
console.log('Shots:', result.iterations);
```

---

## React-like Hooks

The package provides convenient hooks for using quantum primitives in your components.

### Configuration

```typescript
import { initQuantum } from '@philjs/quantum';

// Initialize with global configuration
initQuantum({
  useHardwareRandom: true,    // Use hardware RNG when available
  algorithm: 'kyber',         // Default algorithm: 'kyber' | 'dilithium' | 'sphincs' | 'ntru'
  securityLevel: 256,         // Security level: 128 | 192 | 256
  enableSimulation: true,     // Enable quantum simulation
  maxQubits: 16               // Maximum qubits for simulation
});
```

### useQuantumRandom

Access the global quantum random number generator.

```typescript
import { useQuantumRandom } from '@philjs/quantum';

function MyComponent() {
  const rng = useQuantumRandom();

  const handleClick = () => {
    const value = rng.nextInt(100);
    console.log('Random value:', value);
  };

  return <button onClick={handleClick}>Generate Random</button>;
}
```

### usePostQuantumCrypto

Get instances of post-quantum cryptographic primitives.

```typescript
import { usePostQuantumCrypto } from '@philjs/quantum';

function SecureMessaging() {
  const { kyber, dilithium } = usePostQuantumCrypto();

  const encryptMessage = () => {
    const keyPair = kyber.generateKeyPair();
    const { ciphertext, sharedSecret } = kyber.encapsulate(keyPair.publicKey);
    // Use sharedSecret for symmetric encryption
  };

  const signMessage = (message: Uint8Array) => {
    const keyPair = dilithium.generateKeyPair();
    const signature = dilithium.sign(message, keyPair.privateKey);
    return signature;
  };
}
```

### useQuantumSimulator

Create a quantum circuit simulator.

```typescript
import { useQuantumSimulator } from '@philjs/quantum';

function QuantumCircuitBuilder() {
  const simulator = useQuantumSimulator(4);

  const runCircuit = () => {
    simulator.hadamard(0);
    simulator.cnot(0, 1);
    simulator.cnot(1, 2);
    const results = simulator.measureAll();
    console.log('Measurement results:', results);
  };
}
```

### useQuantumAnnealing

Get a quantum annealing optimizer.

```typescript
import { useQuantumAnnealing } from '@philjs/quantum';

function OptimizationComponent() {
  const optimizer = useQuantumAnnealing();

  const solve = () => {
    const result = optimizer.optimize(
      (solution) => /* cost function */,
      10 // number of variables
    );
    return result.solution;
  };
}
```

### useQAOA

Get a QAOA optimizer for a specific number of qubits.

```typescript
import { useQAOA } from '@philjs/quantum';

function QAOAComponent() {
  const qaoa = useQAOA(6);

  const solve = (hamiltonian: number[][], params: QAOAParams) => {
    return qaoa.optimize(hamiltonian, params);
  };
}
```

### useQuantumId

Generate a quantum-secure unique identifier.

```typescript
import { useQuantumId } from '@philjs/quantum';

function IdGenerator() {
  // Generate a 16-byte (32 hex chars) ID
  const id = useQuantumId(16);
  console.log(id); // "a3f8b2c4d5e6f7a8b9c0d1e2f3a4b5c6"

  // Generate a shorter 8-byte ID
  const shortId = useQuantumId(8);
}
```

### useQuantumShuffle

Shuffle an array using quantum randomness.

```typescript
import { useQuantumShuffle } from '@philjs/quantum';

function DeckShuffler() {
  const deck = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

  // Get a cryptographically shuffled deck
  const shuffledDeck = useQuantumShuffle(deck);
}
```

---

## Types Reference

### Configuration Types

```typescript
interface QuantumConfig {
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
```

### Cryptography Types

```typescript
interface QuantumKey {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  algorithm: string;
  securityLevel: number;
}

interface EncapsulatedKey {
  ciphertext: Uint8Array;
  sharedSecret: Uint8Array;
}

interface QuantumSignature {
  signature: Uint8Array;
  algorithm: string;
  publicKey: Uint8Array;
}
```

### Quantum State Types

```typescript
interface Complex {
  real: number;
  imag: number;
}

interface Qubit {
  alpha: Complex;
  beta: Complex;
}

interface QuantumState {
  amplitudes: Complex[];
  numQubits: number;
  measured: boolean;
  classicalBits: number[];
}
```

### Quantum Circuit Types

```typescript
interface QuantumCircuit {
  qubits: number;
  gates: QuantumGate[];
  measurements: number[];
}

interface QuantumGate {
  type: GateType;
  targets: number[];
  controls?: number[];
  params?: number[];
}

type GateType =
  | 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T'
  | 'CNOT' | 'CZ' | 'SWAP' | 'TOFFOLI'
  | 'RX' | 'RY' | 'RZ' | 'U' | 'PHASE';
```

### Optimization Types

```typescript
interface OptimizationResult {
  solution: number[];
  energy: number;
  iterations: number;
  converged: boolean;
}

interface QAOAParams {
  layers: number;
  gamma: number[];
  beta: number[];
}
```

---

## API Reference

### Classes

| Class | Description |
|-------|-------------|
| `QuantumRNG` | Cryptographically secure random number generator |
| `KyberKEM` | Post-quantum key encapsulation mechanism |
| `DilithiumSignature` | Post-quantum digital signature algorithm |
| `QuantumSimulator` | Quantum circuit simulator |
| `QuantumAnnealingOptimizer` | Simulated quantum annealing optimizer |
| `QAOAOptimizer` | Quantum Approximate Optimization Algorithm |

### Functions

| Function | Parameters | Return Type | Description |
|----------|------------|-------------|-------------|
| `initQuantum` | `config?: QuantumConfig` | `void` | Initialize global quantum configuration |
| `useQuantumRandom` | - | `QuantumRNG` | Get global RNG instance |
| `usePostQuantumCrypto` | - | `{ kyber, dilithium }` | Get crypto instances |
| `useQuantumSimulator` | `numQubits: number` | `QuantumSimulator` | Create simulator |
| `useQuantumAnnealing` | - | `QuantumAnnealingOptimizer` | Get annealing optimizer |
| `useQAOA` | `numQubits: number` | `QAOAOptimizer` | Get QAOA optimizer |
| `useQuantumId` | `length?: number` | `string` | Generate quantum-secure ID |
| `useQuantumShuffle` | `array: T[]` | `T[]` | Shuffle array with quantum RNG |

### Complex Namespace

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `Complex.create` | `real: number, imag?: number` | `Complex` | Create complex number |
| `Complex.add` | `a: Complex, b: Complex` | `Complex` | Add two complex numbers |
| `Complex.sub` | `a: Complex, b: Complex` | `Complex` | Subtract complex numbers |
| `Complex.mul` | `a: Complex, b: Complex` | `Complex` | Multiply complex numbers |
| `Complex.div` | `a: Complex, b: Complex` | `Complex` | Divide complex numbers |
| `Complex.conjugate` | `a: Complex` | `Complex` | Complex conjugate |
| `Complex.magnitude` | `a: Complex` | `number` | Absolute value |
| `Complex.phase` | `a: Complex` | `number` | Phase angle |
| `Complex.exp` | `theta: number` | `Complex` | Euler's formula e^(i*theta) |
| `Complex.scale` | `a: Complex, s: number` | `Complex` | Scale by real number |

---

## Important Notes

1. **Simulation vs. Real Hardware**: The cryptographic implementations in this package are simulated for educational and development purposes. For production use, integrate with actual post-quantum cryptography libraries like liboqs.

2. **Qubit Limitations**: The quantum simulator uses state vector simulation, which requires exponential memory. The default limit is 16 qubits (2^16 = 65,536 amplitudes).

3. **Security Considerations**: While the random number generation uses the Web Crypto API when available, the post-quantum cryptographic operations are simulated and should not be used for actual security-critical applications without proper library integration.

4. **Performance**: Quantum simulation is computationally intensive. For large circuits or many iterations, consider using Web Workers or running on a server.
