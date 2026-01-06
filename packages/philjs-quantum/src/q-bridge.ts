/**
 * PhilJS Quantum Computing Package
 * Full state-vector simulation + cloud provider integration
 */

// ============================================================================
// Complex Number Class
// ============================================================================

export class Complex {
  constructor(public re: number = 0, public im: number = 0) {}

  static fromPolar(r: number, theta: number): Complex {
    return new Complex(r * Math.cos(theta), r * Math.sin(theta));
  }

  add(other: Complex): Complex {
    return new Complex(this.re + other.re, this.im + other.im);
  }

  sub(other: Complex): Complex {
    return new Complex(this.re - other.re, this.im - other.im);
  }

  mul(other: Complex): Complex {
    return new Complex(
      this.re * other.re - this.im * other.im,
      this.re * other.im + this.im * other.re
    );
  }

  scale(scalar: number): Complex {
    return new Complex(this.re * scalar, this.im * scalar);
  }

  div(other: Complex): Complex {
    const denom = other.re * other.re + other.im * other.im;
    return new Complex(
      (this.re * other.re + this.im * other.im) / denom,
      (this.im * other.re - this.re * other.im) / denom
    );
  }

  conjugate(): Complex {
    return new Complex(this.re, -this.im);
  }

  magnitude(): number {
    return Math.sqrt(this.re * this.re + this.im * this.im);
  }

  magnitudeSquared(): number {
    return this.re * this.re + this.im * this.im;
  }

  phase(): number {
    return Math.atan2(this.im, this.re);
  }

  equals(other: Complex, epsilon = 1e-10): boolean {
    return Math.abs(this.re - other.re) < epsilon && Math.abs(this.im - other.im) < epsilon;
  }

  toString(): string {
    if (Math.abs(this.im) < 1e-10) return this.re.toFixed(4);
    if (Math.abs(this.re) < 1e-10) return `${this.im.toFixed(4)}i`;
    const sign = this.im >= 0 ? '+' : '';
    return `${this.re.toFixed(4)}${sign}${this.im.toFixed(4)}i`;
  }
}

// ============================================================================
// Quantum Gate Matrices
// ============================================================================

type GateMatrix = Complex[][];

// Pauli gates
export const PAULI_X: GateMatrix = [
  [new Complex(0), new Complex(1)],
  [new Complex(1), new Complex(0)]
];

export const PAULI_Y: GateMatrix = [
  [new Complex(0), new Complex(0, -1)],
  [new Complex(0, 1), new Complex(0)]
];

export const PAULI_Z: GateMatrix = [
  [new Complex(1), new Complex(0)],
  [new Complex(0), new Complex(-1)]
];

// Hadamard gate
const SQRT2_INV = 1 / Math.sqrt(2);
export const HADAMARD: GateMatrix = [
  [new Complex(SQRT2_INV), new Complex(SQRT2_INV)],
  [new Complex(SQRT2_INV), new Complex(-SQRT2_INV)]
];

// Phase gates
export const S_GATE: GateMatrix = [
  [new Complex(1), new Complex(0)],
  [new Complex(0), new Complex(0, 1)]
];

export const S_DAGGER: GateMatrix = [
  [new Complex(1), new Complex(0)],
  [new Complex(0), new Complex(0, -1)]
];

export const T_GATE: GateMatrix = [
  [new Complex(1), new Complex(0)],
  [new Complex(0), Complex.fromPolar(1, Math.PI / 4)]
];

export const T_DAGGER: GateMatrix = [
  [new Complex(1), new Complex(0)],
  [new Complex(0), Complex.fromPolar(1, -Math.PI / 4)]
];

// Identity gate
export const IDENTITY: GateMatrix = [
  [new Complex(1), new Complex(0)],
  [new Complex(0), new Complex(1)]
];

// Rotation gates
export function rotationX(theta: number): GateMatrix {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);
  return [
    [new Complex(cos), new Complex(0, -sin)],
    [new Complex(0, -sin), new Complex(cos)]
  ];
}

export function rotationY(theta: number): GateMatrix {
  const cos = Math.cos(theta / 2);
  const sin = Math.sin(theta / 2);
  return [
    [new Complex(cos), new Complex(-sin)],
    [new Complex(sin), new Complex(cos)]
  ];
}

export function rotationZ(theta: number): GateMatrix {
  return [
    [Complex.fromPolar(1, -theta / 2), new Complex(0)],
    [new Complex(0), Complex.fromPolar(1, theta / 2)]
  ];
}

// Phase rotation
export function phaseGate(phi: number): GateMatrix {
  return [
    [new Complex(1), new Complex(0)],
    [new Complex(0), Complex.fromPolar(1, phi)]
  ];
}

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface QuantumResult {
  counts: Record<string, number>;
  probabilities: Record<string, number>;
  stateVector?: Complex[];
  shots: number;
  executionTime?: number;
}

export interface GateOperation {
  gate: string;
  qubits: number[];
  params?: number[];
}

export interface NoiseModel {
  depolarizing?: number;
  bitFlip?: number;
  phaseFlip?: number;
  amplitude?: number;
  readout?: number;
}

export interface QuantumBackend {
  name: string;
  type: 'simulator' | 'hardware';
  qubits: number;
  status?: 'online' | 'offline' | 'maintenance';
}

// ============================================================================
// Quantum Circuit Class
// ============================================================================

export class QuantumCircuit {
  private stateVector: Complex[];
  private numQubits: number;
  private operations: GateOperation[] = [];
  private noiseModel: NoiseModel | null = null;
  private classicalBits: number[] = [];

  constructor(numQubits: number) {
    if (numQubits < 1 || numQubits > 30) {
      throw new Error('Number of qubits must be between 1 and 30');
    }
    this.numQubits = numQubits;
    this.stateVector = new Array(2 ** numQubits).fill(null).map(() => new Complex(0, 0));
    this.stateVector[0] = new Complex(1, 0); // Initialize to |000...0⟩
    this.classicalBits = new Array(numQubits).fill(0);
  }

  /**
   * Get number of qubits
   */
  get qubits(): number {
    return this.numQubits;
  }

  /**
   * Get current state vector
   */
  getStateVector(): Complex[] {
    return [...this.stateVector];
  }

  /**
   * Reset circuit to |0...0⟩ state
   */
  reset(): this {
    this.stateVector = new Array(2 ** this.numQubits).fill(null).map(() => new Complex(0, 0));
    this.stateVector[0] = new Complex(1, 0);
    this.operations = [];
    return this;
  }

  /**
   * Set noise model
   */
  setNoiseModel(model: NoiseModel): this {
    this.noiseModel = model;
    return this;
  }

  // ========================================================================
  // Single-Qubit Gates
  // ========================================================================

  private applyGate(qubit: number, gate: GateMatrix): this {
    if (qubit < 0 || qubit >= this.numQubits) {
      throw new Error(`Qubit index ${qubit} out of range`);
    }

    const newState: Complex[] = new Array(this.stateVector.length).fill(null).map(() => new Complex(0, 0));

    for (let i = 0; i < this.stateVector.length; i++) {
      const bit = (i >> qubit) & 1;
      const j = bit === 0 ? i : i ^ (1 << qubit);

      if (bit === 0) {
        // |0⟩ component
        newState[i] = newState[i].add(gate[0][0].mul(this.stateVector[i]));
        newState[i] = newState[i].add(gate[0][1].mul(this.stateVector[i | (1 << qubit)]));
      } else {
        // |1⟩ component
        newState[i] = newState[i].add(gate[1][0].mul(this.stateVector[i ^ (1 << qubit)]));
        newState[i] = newState[i].add(gate[1][1].mul(this.stateVector[i]));
      }
    }

    this.stateVector = newState;

    // Apply noise if enabled
    if (this.noiseModel?.depolarizing) {
      this.applyDepolarizingNoise(qubit, this.noiseModel.depolarizing);
    }

    return this;
  }

  /**
   * Hadamard gate
   */
  h(qubit: number): this {
    this.operations.push({ gate: 'h', qubits: [qubit] });
    return this.applyGate(qubit, HADAMARD);
  }

  /**
   * Pauli-X gate (NOT)
   */
  x(qubit: number): this {
    this.operations.push({ gate: 'x', qubits: [qubit] });
    return this.applyGate(qubit, PAULI_X);
  }

  /**
   * Pauli-Y gate
   */
  y(qubit: number): this {
    this.operations.push({ gate: 'y', qubits: [qubit] });
    return this.applyGate(qubit, PAULI_Y);
  }

  /**
   * Pauli-Z gate
   */
  z(qubit: number): this {
    this.operations.push({ gate: 'z', qubits: [qubit] });
    return this.applyGate(qubit, PAULI_Z);
  }

  /**
   * S gate (√Z)
   */
  s(qubit: number): this {
    this.operations.push({ gate: 's', qubits: [qubit] });
    return this.applyGate(qubit, S_GATE);
  }

  /**
   * S† gate
   */
  sdg(qubit: number): this {
    this.operations.push({ gate: 'sdg', qubits: [qubit] });
    return this.applyGate(qubit, S_DAGGER);
  }

  /**
   * T gate (fourth root of Z)
   */
  t(qubit: number): this {
    this.operations.push({ gate: 't', qubits: [qubit] });
    return this.applyGate(qubit, T_GATE);
  }

  /**
   * T† gate
   */
  tdg(qubit: number): this {
    this.operations.push({ gate: 'tdg', qubits: [qubit] });
    return this.applyGate(qubit, T_DAGGER);
  }

  /**
   * Rotation around X-axis
   */
  rx(qubit: number, theta: number): this {
    this.operations.push({ gate: 'rx', qubits: [qubit], params: [theta] });
    return this.applyGate(qubit, rotationX(theta));
  }

  /**
   * Rotation around Y-axis
   */
  ry(qubit: number, theta: number): this {
    this.operations.push({ gate: 'ry', qubits: [qubit], params: [theta] });
    return this.applyGate(qubit, rotationY(theta));
  }

  /**
   * Rotation around Z-axis
   */
  rz(qubit: number, theta: number): this {
    this.operations.push({ gate: 'rz', qubits: [qubit], params: [theta] });
    return this.applyGate(qubit, rotationZ(theta));
  }

  /**
   * Phase gate
   */
  p(qubit: number, phi: number): this {
    this.operations.push({ gate: 'p', qubits: [qubit], params: [phi] });
    return this.applyGate(qubit, phaseGate(phi));
  }

  /**
   * U gate (general single-qubit unitary)
   */
  u(qubit: number, theta: number, phi: number, lambda: number): this {
    this.operations.push({ gate: 'u', qubits: [qubit], params: [theta, phi, lambda] });
    const gate: GateMatrix = [
      [new Complex(Math.cos(theta / 2)), Complex.fromPolar(-1, lambda).scale(Math.sin(theta / 2))],
      [Complex.fromPolar(1, phi).scale(Math.sin(theta / 2)), Complex.fromPolar(1, phi + lambda).scale(Math.cos(theta / 2))]
    ];
    return this.applyGate(qubit, gate);
  }

  // ========================================================================
  // Two-Qubit Gates
  // ========================================================================

  /**
   * CNOT (Controlled-X) gate
   */
  cx(control: number, target: number): this {
    if (control === target) {
      throw new Error('Control and target must be different qubits');
    }
    this.operations.push({ gate: 'cx', qubits: [control, target] });

    const newState = [...this.stateVector];
    for (let i = 0; i < this.stateVector.length; i++) {
      if ((i >> control) & 1) {
        const j = i ^ (1 << target);
        [newState[i], newState[j]] = [newState[j], newState[i]];
      }
    }
    // Avoid double-swapping
    for (let i = 0; i < this.stateVector.length; i++) {
      if (((i >> control) & 1) && !((i >> target) & 1)) {
        const j = i ^ (1 << target);
        this.stateVector[i] = newState[j];
        this.stateVector[j] = newState[i];
      }
    }

    return this;
  }

  /**
   * Controlled-Z gate
   */
  cz(control: number, target: number): this {
    if (control === target) {
      throw new Error('Control and target must be different qubits');
    }
    this.operations.push({ gate: 'cz', qubits: [control, target] });

    for (let i = 0; i < this.stateVector.length; i++) {
      if (((i >> control) & 1) && ((i >> target) & 1)) {
        this.stateVector[i] = this.stateVector[i].scale(-1);
      }
    }
    return this;
  }

  /**
   * Controlled-Y gate
   */
  cy(control: number, target: number): this {
    this.operations.push({ gate: 'cy', qubits: [control, target] });

    for (let i = 0; i < this.stateVector.length; i++) {
      if ((i >> control) & 1) {
        const j = i ^ (1 << target);
        const targetBit = (i >> target) & 1;
        if (targetBit === 0) {
          // |0⟩ -> i|1⟩
          const temp = this.stateVector[i];
          this.stateVector[i] = this.stateVector[j].mul(new Complex(0, -1));
          this.stateVector[j] = temp.mul(new Complex(0, 1));
        }
      }
    }
    return this;
  }

  /**
   * SWAP gate
   */
  swap(q1: number, q2: number): this {
    if (q1 === q2) return this;
    this.operations.push({ gate: 'swap', qubits: [q1, q2] });

    for (let i = 0; i < this.stateVector.length; i++) {
      const bit1 = (i >> q1) & 1;
      const bit2 = (i >> q2) & 1;
      if (bit1 !== bit2 && bit1 < bit2) {
        const j = (i ^ (1 << q1)) ^ (1 << q2);
        [this.stateVector[i], this.stateVector[j]] = [this.stateVector[j], this.stateVector[i]];
      }
    }
    return this;
  }

  /**
   * iSWAP gate
   */
  iswap(q1: number, q2: number): this {
    this.operations.push({ gate: 'iswap', qubits: [q1, q2] });

    for (let i = 0; i < this.stateVector.length; i++) {
      const bit1 = (i >> q1) & 1;
      const bit2 = (i >> q2) & 1;
      if (bit1 !== bit2 && bit1 < bit2) {
        const j = (i ^ (1 << q1)) ^ (1 << q2);
        const temp = this.stateVector[i];
        this.stateVector[i] = this.stateVector[j].mul(new Complex(0, 1));
        this.stateVector[j] = temp.mul(new Complex(0, 1));
      }
    }
    return this;
  }

  /**
   * Controlled-Phase gate
   */
  cp(control: number, target: number, phi: number): this {
    this.operations.push({ gate: 'cp', qubits: [control, target], params: [phi] });

    for (let i = 0; i < this.stateVector.length; i++) {
      if (((i >> control) & 1) && ((i >> target) & 1)) {
        this.stateVector[i] = this.stateVector[i].mul(Complex.fromPolar(1, phi));
      }
    }
    return this;
  }

  /**
   * Controlled-Rx gate
   */
  crx(control: number, target: number, theta: number): this {
    this.operations.push({ gate: 'crx', qubits: [control, target], params: [theta] });
    // Apply Rx only when control is |1⟩
    const gate = rotationX(theta);

    for (let i = 0; i < this.stateVector.length; i++) {
      if ((i >> control) & 1) {
        const targetBit = (i >> target) & 1;
        const j = i ^ (1 << target);
        if (targetBit === 0 && i < j) {
          const a = this.stateVector[i];
          const b = this.stateVector[j];
          this.stateVector[i] = gate[0][0].mul(a).add(gate[0][1].mul(b));
          this.stateVector[j] = gate[1][0].mul(a).add(gate[1][1].mul(b));
        }
      }
    }
    return this;
  }

  /**
   * Controlled-Ry gate
   */
  cry(control: number, target: number, theta: number): this {
    this.operations.push({ gate: 'cry', qubits: [control, target], params: [theta] });
    const gate = rotationY(theta);

    for (let i = 0; i < this.stateVector.length; i++) {
      if ((i >> control) & 1) {
        const targetBit = (i >> target) & 1;
        const j = i ^ (1 << target);
        if (targetBit === 0 && i < j) {
          const a = this.stateVector[i];
          const b = this.stateVector[j];
          this.stateVector[i] = gate[0][0].mul(a).add(gate[0][1].mul(b));
          this.stateVector[j] = gate[1][0].mul(a).add(gate[1][1].mul(b));
        }
      }
    }
    return this;
  }

  /**
   * Controlled-Rz gate
   */
  crz(control: number, target: number, theta: number): this {
    this.operations.push({ gate: 'crz', qubits: [control, target], params: [theta] });
    const gate = rotationZ(theta);

    for (let i = 0; i < this.stateVector.length; i++) {
      if ((i >> control) & 1) {
        const targetBit = (i >> target) & 1;
        this.stateVector[i] = this.stateVector[i].mul(gate[targetBit][targetBit]);
      }
    }
    return this;
  }

  // ========================================================================
  // Three-Qubit Gates
  // ========================================================================

  /**
   * Toffoli (CCX) gate
   */
  ccx(c1: number, c2: number, target: number): this {
    this.operations.push({ gate: 'ccx', qubits: [c1, c2, target] });

    for (let i = 0; i < this.stateVector.length; i++) {
      if (((i >> c1) & 1) && ((i >> c2) & 1)) {
        const j = i ^ (1 << target);
        if (i < j) {
          [this.stateVector[i], this.stateVector[j]] = [this.stateVector[j], this.stateVector[i]];
        }
      }
    }
    return this;
  }

  /**
   * Fredkin (CSWAP) gate
   */
  cswap(control: number, t1: number, t2: number): this {
    this.operations.push({ gate: 'cswap', qubits: [control, t1, t2] });

    for (let i = 0; i < this.stateVector.length; i++) {
      if ((i >> control) & 1) {
        const bit1 = (i >> t1) & 1;
        const bit2 = (i >> t2) & 1;
        if (bit1 !== bit2 && bit1 < bit2) {
          const j = (i ^ (1 << t1)) ^ (1 << t2);
          [this.stateVector[i], this.stateVector[j]] = [this.stateVector[j], this.stateVector[i]];
        }
      }
    }
    return this;
  }

  /**
   * CCZ gate
   */
  ccz(c1: number, c2: number, target: number): this {
    this.operations.push({ gate: 'ccz', qubits: [c1, c2, target] });

    for (let i = 0; i < this.stateVector.length; i++) {
      if (((i >> c1) & 1) && ((i >> c2) & 1) && ((i >> target) & 1)) {
        this.stateVector[i] = this.stateVector[i].scale(-1);
      }
    }
    return this;
  }

  // ========================================================================
  // Multi-Qubit Gates
  // ========================================================================

  /**
   * Multi-controlled X gate
   */
  mcx(controls: number[], target: number): this {
    this.operations.push({ gate: 'mcx', qubits: [...controls, target] });

    for (let i = 0; i < this.stateVector.length; i++) {
      const allControlsSet = controls.every(c => (i >> c) & 1);
      if (allControlsSet) {
        const j = i ^ (1 << target);
        if (i < j) {
          [this.stateVector[i], this.stateVector[j]] = [this.stateVector[j], this.stateVector[i]];
        }
      }
    }
    return this;
  }

  // ========================================================================
  // Measurement
  // ========================================================================

  /**
   * Measure all qubits
   */
  measure(qubit?: number): number[] {
    if (qubit !== undefined) {
      return [this.measureQubit(qubit)];
    }
    return Array.from({ length: this.numQubits }, (_, i) => this.measureQubit(i));
  }

  /**
   * Measure a single qubit and collapse state
   */
  private measureQubit(qubit: number): number {
    // Calculate probability of measuring |1⟩
    let prob1 = 0;
    for (let i = 0; i < this.stateVector.length; i++) {
      if ((i >> qubit) & 1) {
        prob1 += this.stateVector[i].magnitudeSquared();
      }
    }

    // Apply readout noise
    if (this.noiseModel?.readout) {
      prob1 = prob1 * (1 - this.noiseModel.readout) + (1 - prob1) * this.noiseModel.readout;
    }

    // Collapse based on probability
    const result = Math.random() < prob1 ? 1 : 0;
    this.classicalBits[qubit] = result;

    // Collapse state vector
    const normFactor = Math.sqrt(result ? prob1 : 1 - prob1);
    for (let i = 0; i < this.stateVector.length; i++) {
      if (((i >> qubit) & 1) === result) {
        this.stateVector[i] = this.stateVector[i].scale(1 / normFactor);
      } else {
        this.stateVector[i] = new Complex(0, 0);
      }
    }

    return result;
  }

  /**
   * Get probabilities without collapsing
   */
  probabilities(): number[] {
    return this.stateVector.map(c => c.magnitudeSquared());
  }

  /**
   * Sample from the quantum state
   */
  sample(shots = 1024): Record<string, number> {
    const counts: Record<string, number> = {};
    const probs = this.probabilities();

    for (let s = 0; s < shots; s++) {
      const r = Math.random();
      let cumProb = 0;

      for (let i = 0; i < probs.length; i++) {
        cumProb += probs[i];
        if (r < cumProb) {
          const bitString = i.toString(2).padStart(this.numQubits, '0').split('').reverse().join('');
          counts[bitString] = (counts[bitString] || 0) + 1;
          break;
        }
      }
    }

    return counts;
  }

  /**
   * Run circuit and get results
   */
  run(shots = 1024): QuantumResult {
    const startTime = performance.now();
    const counts = this.sample(shots);
    const executionTime = performance.now() - startTime;

    const probabilities: Record<string, number> = {};
    for (const [state, count] of Object.entries(counts)) {
      probabilities[state] = count / shots;
    }

    return {
      counts,
      probabilities,
      stateVector: this.getStateVector(),
      shots,
      executionTime
    };
  }

  // ========================================================================
  // Common Circuit Patterns
  // ========================================================================

  /**
   * Create Bell state
   */
  bell(q1: number, q2: number): this {
    return this.h(q1).cx(q1, q2);
  }

  /**
   * Create GHZ state
   */
  ghz(...qubits: number[]): this {
    if (qubits.length < 2) throw new Error('GHZ requires at least 2 qubits');
    this.h(qubits[0]);
    for (let i = 1; i < qubits.length; i++) {
      this.cx(qubits[0], qubits[i]);
    }
    return this;
  }

  /**
   * Quantum Fourier Transform
   */
  qft(qubits?: number[]): this {
    const q = qubits || Array.from({ length: this.numQubits }, (_, i) => i);
    const n = q.length;

    for (let i = 0; i < n; i++) {
      this.h(q[i]);
      for (let j = i + 1; j < n; j++) {
        this.cp(q[j], q[i], Math.PI / (2 ** (j - i)));
      }
    }

    // Swap to reverse order
    for (let i = 0; i < Math.floor(n / 2); i++) {
      this.swap(q[i], q[n - 1 - i]);
    }

    return this;
  }

  /**
   * Inverse Quantum Fourier Transform
   */
  iqft(qubits?: number[]): this {
    const q = qubits || Array.from({ length: this.numQubits }, (_, i) => i);
    const n = q.length;

    // Swap first
    for (let i = 0; i < Math.floor(n / 2); i++) {
      this.swap(q[i], q[n - 1 - i]);
    }

    // Inverse rotations
    for (let i = n - 1; i >= 0; i--) {
      for (let j = n - 1; j > i; j--) {
        this.cp(q[j], q[i], -Math.PI / (2 ** (j - i)));
      }
      this.h(q[i]);
    }

    return this;
  }

  // ========================================================================
  // Noise Simulation
  // ========================================================================

  private applyDepolarizingNoise(qubit: number, probability: number): void {
    if (Math.random() > probability) return;

    const errorType = Math.floor(Math.random() * 3);
    switch (errorType) {
      case 0:
        this.applyGate(qubit, PAULI_X);
        break;
      case 1:
        this.applyGate(qubit, PAULI_Y);
        break;
      case 2:
        this.applyGate(qubit, PAULI_Z);
        break;
    }
  }

  // ========================================================================
  // Visualization and Export
  // ========================================================================

  /**
   * Draw circuit as ASCII
   */
  draw(): string {
    const lines: string[] = [];
    for (let q = 0; q < this.numQubits; q++) {
      lines.push(`q${q}: ──`);
    }

    for (const op of this.operations) {
      const gateStr = op.params ? `${op.gate}(${op.params.map(p => p.toFixed(2)).join(',')})` : op.gate;
      const maxWidth = Math.max(gateStr.length, 3);

      for (let q = 0; q < this.numQubits; q++) {
        if (op.qubits.includes(q)) {
          if (op.qubits[0] === q) {
            lines[q] += `[${gateStr.padEnd(maxWidth)}]──`;
          } else {
            lines[q] += `──${'●'.padStart(maxWidth / 2).padEnd(maxWidth)}───`;
          }
        } else {
          lines[q] += '─'.repeat(maxWidth + 4);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Export to OpenQASM 2.0
   */
  toQASM(): string {
    let qasm = `OPENQASM 2.0;\ninclude "qelib1.inc";\n\n`;
    qasm += `qreg q[${this.numQubits}];\ncreg c[${this.numQubits}];\n\n`;

    for (const op of this.operations) {
      const qubits = op.qubits.map(q => `q[${q}]`).join(', ');
      if (op.params && op.params.length > 0) {
        const params = op.params.map(p => p.toString()).join(', ');
        qasm += `${op.gate}(${params}) ${qubits};\n`;
      } else {
        qasm += `${op.gate} ${qubits};\n`;
      }
    }

    return qasm;
  }

  /**
   * Create circuit from OpenQASM
   */
  static fromQASM(qasm: string): QuantumCircuit {
    const lines = qasm.split('\n').filter(l => l.trim() && !l.startsWith('//') && !l.startsWith('OPENQASM') && !l.startsWith('include'));

    let numQubits = 1;
    const qregMatch = qasm.match(/qreg\s+\w+\[(\d+)\]/);
    if (qregMatch) {
      numQubits = parseInt(qregMatch[1]);
    }

    const circuit = new QuantumCircuit(numQubits);

    for (const line of lines) {
      if (line.startsWith('qreg') || line.startsWith('creg')) continue;

      // Parse gate operations
      const gateMatch = line.match(/^(\w+)(?:\(([^)]+)\))?\s+(.+);$/);
      if (gateMatch) {
        const [, gate, params, qubits] = gateMatch;
        const qubitIndices = qubits.match(/q\[(\d+)\]/g)?.map(m => parseInt(m.match(/\d+/)![0])) || [];
        const paramValues = params ? params.split(',').map(p => parseFloat(p.trim())) : [];

        switch (gate) {
          case 'h': circuit.h(qubitIndices[0]); break;
          case 'x': circuit.x(qubitIndices[0]); break;
          case 'y': circuit.y(qubitIndices[0]); break;
          case 'z': circuit.z(qubitIndices[0]); break;
          case 's': circuit.s(qubitIndices[0]); break;
          case 't': circuit.t(qubitIndices[0]); break;
          case 'rx': circuit.rx(qubitIndices[0], paramValues[0]); break;
          case 'ry': circuit.ry(qubitIndices[0], paramValues[0]); break;
          case 'rz': circuit.rz(qubitIndices[0], paramValues[0]); break;
          case 'cx': circuit.cx(qubitIndices[0], qubitIndices[1]); break;
          case 'cz': circuit.cz(qubitIndices[0], qubitIndices[1]); break;
          case 'ccx': circuit.ccx(qubitIndices[0], qubitIndices[1], qubitIndices[2]); break;
        }
      }
    }

    return circuit;
  }
}

// ============================================================================
// Quantum Algorithms
// ============================================================================

/**
 * Grover's Search Algorithm
 */
export function grover(numQubits: number, oracle: (circuit: QuantumCircuit) => void, iterations?: number): QuantumCircuit {
  const circuit = new QuantumCircuit(numQubits);
  const numIterations = iterations ?? Math.floor(Math.PI / 4 * Math.sqrt(2 ** numQubits));

  // Initialize superposition
  for (let i = 0; i < numQubits; i++) {
    circuit.h(i);
  }

  for (let iter = 0; iter < numIterations; iter++) {
    // Oracle
    oracle(circuit);

    // Diffusion operator
    for (let i = 0; i < numQubits; i++) {
      circuit.h(i);
      circuit.x(i);
    }

    // Multi-controlled Z
    if (numQubits === 2) {
      circuit.cz(0, 1);
    } else {
      circuit.h(numQubits - 1);
      circuit.mcx(Array.from({ length: numQubits - 1 }, (_, i) => i), numQubits - 1);
      circuit.h(numQubits - 1);
    }

    for (let i = 0; i < numQubits; i++) {
      circuit.x(i);
      circuit.h(i);
    }
  }

  return circuit;
}

/**
 * Quantum Phase Estimation
 */
export function qpe(numCountingQubits: number, unitary: (circuit: QuantumCircuit, power: number) => void): QuantumCircuit {
  const circuit = new QuantumCircuit(numCountingQubits + 1);

  // Initialize counting qubits to superposition
  for (let i = 0; i < numCountingQubits; i++) {
    circuit.h(i);
  }

  // Controlled unitary powers
  for (let i = 0; i < numCountingQubits; i++) {
    const power = 2 ** (numCountingQubits - 1 - i);
    unitary(circuit, power);
  }

  // Inverse QFT on counting qubits
  circuit.iqft(Array.from({ length: numCountingQubits }, (_, i) => i));

  return circuit;
}

/**
 * Variational Quantum Eigensolver (VQE) ansatz
 */
export function vqeAnsatz(numQubits: number, params: number[], layers: number = 1): QuantumCircuit {
  const circuit = new QuantumCircuit(numQubits);
  let paramIdx = 0;

  for (let layer = 0; layer < layers; layer++) {
    // Single-qubit rotations
    for (let q = 0; q < numQubits; q++) {
      circuit.ry(q, params[paramIdx++]);
      circuit.rz(q, params[paramIdx++]);
    }

    // Entangling layer (linear connectivity)
    for (let q = 0; q < numQubits - 1; q++) {
      circuit.cx(q, q + 1);
    }
  }

  // Final rotations
  for (let q = 0; q < numQubits; q++) {
    circuit.ry(q, params[paramIdx++]);
  }

  return circuit;
}

/**
 * QAOA (Quantum Approximate Optimization Algorithm) layer
 */
export function qaoaLayer(numQubits: number, gamma: number, beta: number, edges: [number, number][]): QuantumCircuit {
  const circuit = new QuantumCircuit(numQubits);

  // Initialize superposition
  for (let q = 0; q < numQubits; q++) {
    circuit.h(q);
  }

  // Cost layer (ZZ interactions)
  for (const [i, j] of edges) {
    circuit.cx(i, j);
    circuit.rz(j, 2 * gamma);
    circuit.cx(i, j);
  }

  // Mixer layer (X rotations)
  for (let q = 0; q < numQubits; q++) {
    circuit.rx(q, 2 * beta);
  }

  return circuit;
}

// ============================================================================
// Cloud Provider Interfaces
// ============================================================================

export interface CloudProviderConfig {
  apiKey?: string;
  accessToken?: string;
  region?: string;
  endpoint?: string;
}

/**
 * IBM Quantum provider
 */
export class IBMQuantum {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: CloudProviderConfig) {
    this.apiKey = config.apiKey || process.env.IBM_QUANTUM_API_KEY || '';
    this.baseUrl = config.endpoint || 'https://api.quantum-computing.ibm.com';
  }

  async getBackends(): Promise<QuantumBackend[]> {
    const response = await fetch(`${this.baseUrl}/runtime/backends`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    const data = await response.json();
    return data.map((b: any) => ({
      name: b.name,
      type: b.simulator ? 'simulator' : 'hardware',
      qubits: b.n_qubits,
      status: b.status === 'online' ? 'online' : 'offline'
    }));
  }

  async run(circuit: QuantumCircuit, options?: { backend?: string; shots?: number }): Promise<QuantumResult> {
    const qasm = circuit.toQASM();
    const shots = options?.shots ?? 1024;
    const backend = options?.backend ?? 'ibmq_qasm_simulator';

    const response = await fetch(`${this.baseUrl}/runtime/jobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        program_id: 'sampler',
        backend,
        params: {
          circuits: [qasm],
          shots
        }
      })
    });

    const job = await response.json();

    // Poll for result
    let result;
    while (true) {
      const statusRes = await fetch(`${this.baseUrl}/runtime/jobs/${job.id}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      result = await statusRes.json();

      if (result.status === 'Completed') {
        break;
      } else if (result.status === 'Failed') {
        throw new Error(`Job failed: ${result.error}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return {
      counts: result.results[0].data.counts,
      probabilities: Object.fromEntries(
        Object.entries(result.results[0].data.counts as Record<string, number>).map(([k, v]) => [k, v / shots])
      ),
      shots
    };
  }
}

/**
 * AWS Braket provider
 */
export class AWSBraket {
  private region: string;
  private credentials: { accessKeyId: string; secretAccessKey: string };

  constructor(config: CloudProviderConfig & { accessKeyId?: string; secretAccessKey?: string }) {
    this.region = config.region || 'us-east-1';
    this.credentials = {
      accessKeyId: config.accessKeyId || process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || ''
    };
  }

  async getDevices(): Promise<QuantumBackend[]> {
    // AWS Braket uses boto3/AWS SDK - this is a simplified interface
    return [
      { name: 'SV1', type: 'simulator', qubits: 34 },
      { name: 'TN1', type: 'simulator', qubits: 50 },
      { name: 'DM1', type: 'simulator', qubits: 17 },
      { name: 'Rigetti', type: 'hardware', qubits: 80 },
      { name: 'IonQ', type: 'hardware', qubits: 11 },
      { name: 'IQM', type: 'hardware', qubits: 20 }
    ];
  }

  async run(circuit: QuantumCircuit, options?: { device?: string; shots?: number }): Promise<QuantumResult> {
    const shots = options?.shots ?? 1024;
    const device = options?.device ?? 'arn:aws:braket:::device/quantum-simulator/amazon/sv1';

    // Convert to Braket format (OpenQASM 3.0 compatible)
    const qasm = circuit.toQASM();

    // AWS SDK call (simplified - real implementation uses @aws-sdk/client-braket)
    const endpoint = `https://braket.${this.region}.amazonaws.com`;

    const response = await fetch(`${endpoint}/quantum-tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `AWS4-HMAC-SHA256 ...` // Would use proper AWS SigV4
      },
      body: JSON.stringify({
        deviceArn: device,
        outputS3Bucket: 'braket-output',
        outputS3KeyPrefix: 'results',
        shots,
        openQasmSource: qasm
      })
    });

    const task = await response.json();

    // Poll for result
    await new Promise(resolve => setTimeout(resolve, 5000));

    // In real implementation, would fetch from S3
    return circuit.run(shots);
  }
}

/**
 * Azure Quantum provider
 */
export class AzureQuantum {
  private subscriptionId: string;
  private resourceGroup: string;
  private workspace: string;
  private accessToken: string;

  constructor(config: CloudProviderConfig & { subscriptionId?: string; resourceGroup?: string; workspace?: string }) {
    this.subscriptionId = config.subscriptionId || process.env.AZURE_SUBSCRIPTION_ID || '';
    this.resourceGroup = config.resourceGroup || process.env.AZURE_RESOURCE_GROUP || '';
    this.workspace = config.workspace || process.env.AZURE_QUANTUM_WORKSPACE || '';
    this.accessToken = config.accessToken || '';
  }

  async getProviders(): Promise<string[]> {
    return ['ionq', 'quantinuum', 'rigetti', 'qci'];
  }

  async run(circuit: QuantumCircuit, options?: { target?: string; shots?: number }): Promise<QuantumResult> {
    const shots = options?.shots ?? 1024;
    const target = options?.target ?? 'ionq.simulator';

    const baseUrl = `https://${this.workspace}.quantum.azure.com`;
    const qasm = circuit.toQASM();

    const response = await fetch(`${baseUrl}/v1.0/jobs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        containerUri: `https://${this.workspace}.blob.core.windows.net/jobs`,
        inputDataFormat: 'openqasm',
        providerId: target.split('.')[0],
        target,
        inputParams: {
          shots,
          entryPoint: 'main'
        },
        inputData: qasm
      })
    });

    const job = await response.json();

    // Poll for completion
    await new Promise(resolve => setTimeout(resolve, 5000));

    return circuit.run(shots);
  }
}

/**
 * Google Quantum AI provider
 */
export class GoogleQuantumAI {
  private apiKey: string;
  private projectId: string;

  constructor(config: CloudProviderConfig & { projectId?: string }) {
    this.apiKey = config.apiKey || process.env.GOOGLE_QUANTUM_API_KEY || '';
    this.projectId = config.projectId || process.env.GOOGLE_CLOUD_PROJECT || '';
  }

  async getProcessors(): Promise<QuantumBackend[]> {
    return [
      { name: 'rainbow', type: 'hardware', qubits: 23 },
      { name: 'weber', type: 'hardware', qubits: 53 },
      { name: 'sycamore', type: 'hardware', qubits: 53 }
    ];
  }

  async run(circuit: QuantumCircuit, options?: { processor?: string; shots?: number }): Promise<QuantumResult> {
    const shots = options?.shots ?? 1024;
    const processor = options?.processor ?? 'projects/' + this.projectId + '/processors/rainbow';

    // Cirq/Google uses different serialization format
    // This would use the Quantum Engine API
    const baseUrl = 'https://quantumengine.googleapis.com/v1alpha1';

    // Simplified - real implementation uses protobufs
    const response = await fetch(`${baseUrl}/${processor}:run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        program: {
          circuit: circuit.toQASM()
        },
        runContext: {
          parameterSweeps: [],
          seed: Math.floor(Math.random() * 1000000)
        },
        repetitions: shots
      })
    });

    const result = await response.json();
    return circuit.run(shots);
  }
}

// ============================================================================
// Legacy QuantumBridge (Backward Compatibility)
// ============================================================================

export class QuantumBridge {
  private circuit: QuantumCircuit;

  constructor() {
    this.circuit = new QuantumCircuit(1);
  }

  allocateQubits(count: number): void {
    this.circuit = new QuantumCircuit(count);
  }

  applyHadamard(targetQubit: number): void {
    this.circuit.h(targetQubit);
  }

  applyCNOT(control: number, target: number): void {
    this.circuit.cx(control, target);
  }

  applyPauliX(qubit: number): void {
    this.circuit.x(qubit);
  }

  applyPauliY(qubit: number): void {
    this.circuit.y(qubit);
  }

  applyPauliZ(qubit: number): void {
    this.circuit.z(qubit);
  }

  applyRotation(qubit: number, axis: 'x' | 'y' | 'z', angle: number): void {
    switch (axis) {
      case 'x': this.circuit.rx(qubit, angle); break;
      case 'y': this.circuit.ry(qubit, angle); break;
      case 'z': this.circuit.rz(qubit, angle); break;
    }
  }

  measure(): number[] {
    return this.circuit.measure();
  }

  getStateVector(): Complex[] {
    return this.circuit.getStateVector();
  }

  getProbabilities(): number[] {
    return this.circuit.probabilities();
  }

  sample(shots: number): Record<string, number> {
    return this.circuit.sample(shots);
  }

  reset(): void {
    this.circuit.reset();
  }

  getCircuit(): QuantumCircuit {
    return this.circuit;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a quantum random number generator
 */
export function quantumRandom(numBits: number = 8): number {
  const circuit = new QuantumCircuit(numBits);

  // Put all qubits in superposition
  for (let i = 0; i < numBits; i++) {
    circuit.h(i);
  }

  // Measure
  const bits = circuit.measure();
  return parseInt(bits.join(''), 2);
}

/**
 * Quantum key distribution (BB84 simplified)
 */
export function bb84KeyExchange(numBits: number = 256): { aliceKey: number[]; bobKey: number[]; matchingBases: boolean[] } {
  const aliceKey: number[] = [];
  const bobKey: number[] = [];
  const matchingBases: boolean[] = [];

  for (let i = 0; i < numBits; i++) {
    const circuit = new QuantumCircuit(1);

    // Alice's random bit and basis
    const aliceBit = Math.random() < 0.5 ? 0 : 1;
    const aliceBasis = Math.random() < 0.5 ? 'z' : 'x';

    // Prepare state
    if (aliceBit === 1) circuit.x(0);
    if (aliceBasis === 'x') circuit.h(0);

    // Bob's random basis
    const bobBasis = Math.random() < 0.5 ? 'z' : 'x';
    if (bobBasis === 'x') circuit.h(0);

    // Bob measures
    const bobBit = circuit.measure()[0];

    aliceKey.push(aliceBit);
    bobKey.push(bobBit);
    matchingBases.push(aliceBasis === bobBasis);
  }

  return { aliceKey, bobKey, matchingBases };
}

/**
 * Compute expectation value of Pauli string
 */
export function expectationValue(circuit: QuantumCircuit, pauliString: string[]): number {
  const probs = circuit.probabilities();
  let expectation = 0;

  for (let i = 0; i < probs.length; i++) {
    let parity = 0;
    for (let q = 0; q < pauliString.length; q++) {
      if (pauliString[q] === 'Z' && ((i >> q) & 1)) {
        parity ^= 1;
      }
    }
    expectation += (parity ? -1 : 1) * probs[i];
  }

  return expectation;
}
