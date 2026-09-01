
// PhilJS Vector Store
// RAG Optimization

export interface VectorIndex {
  vectors: Float32Array[];
  metadata: any[];
}

export type VectorLike = number[] | Float32Array;
export type DistanceMetric = 'cosine' | 'euclidean';

export function cosineSimilarity(first: VectorLike, second: VectorLike): number {
  if (first.length !== second.length) throw new Error('dimension mismatch');
  let dot = 0;
  let firstMagnitude = 0;
  let secondMagnitude = 0;
  for (let index = 0; index < first.length; index++) {
    const a = first[index]!;
    const b = second[index]!;
    dot += a * b;
    firstMagnitude += a * a;
    secondMagnitude += b * b;
  }
  const denominator = Math.sqrt(firstMagnitude * secondMagnitude);
  return denominator === 0 ? 0 : dot / denominator;
}

export function euclideanDistance(first: VectorLike, second: VectorLike): number {
  if (first.length !== second.length) throw new Error('dimension mismatch');
  let squaredDistance = 0;
  for (let index = 0; index < first.length; index++) {
    squaredDistance += (first[index]! - second[index]!) ** 2;
  }
  return Math.sqrt(squaredDistance);
}

export function normalizeVector(vector: VectorLike): number[] {
  const magnitude = Math.sqrt(Array.from(vector).reduce((sum, value) => sum + value * value, 0));
  return magnitude === 0 ? Array.from(vector) : Array.from(vector, (value) => value / magnitude);
}

export class VectorStore {
  private index: VectorIndex = { vectors: [], metadata: [] };
  private entries = new Map<string, { vector: Float32Array; metadata?: unknown }>();

  constructor(
    public readonly dimensions: number = 0,
    public readonly metric: DistanceMetric = 'cosine'
  ) {}

  static async create(options: { dimensions: number; metric?: DistanceMetric }): Promise<VectorStore> {
    if (!Number.isInteger(options.dimensions) || options.dimensions <= 0) {
      throw new RangeError('dimensions must be a positive integer');
    }
    return new VectorStore(options.dimensions, options.metric ?? 'cosine');
  }

  get count(): number {
    return this.entries.size;
  }

  async upsert(id: string, vector: VectorLike, metadata?: unknown): Promise<void> {
    if (vector.length !== this.dimensions) throw new Error('dimension mismatch');
    this.entries.set(id, { vector: Float32Array.from(vector), metadata });
  }

  async upsertBatch(items: Array<{ id: string; vector: VectorLike; metadata?: unknown }>): Promise<void> {
    for (const item of items) await this.upsert(item.id, item.vector, item.metadata);
  }

  async query(vector: VectorLike, options: { k?: number } = {}) {
    if (vector.length !== this.dimensions) throw new Error('dimension mismatch');
    const results = Array.from(this.entries, ([id, entry]) => ({
      id,
      metadata: entry.metadata,
      score: this.metric === 'cosine'
        ? cosineSimilarity(vector, entry.vector)
        : -euclideanDistance(vector, entry.vector),
    }));
    return results.sort((left, right) => right.score - left.score).slice(0, Math.max(0, options.k ?? 10));
  }

  async delete(id: string): Promise<boolean> {
    return this.entries.delete(id);
  }

  async stats() {
    return { count: this.count, dimensions: this.dimensions, metric: this.metric };
  }

  add(vector: Float32Array, meta: any) {
    this.index.vectors.push(vector);
    this.index.metadata.push(meta);
    if (this.dimensions === 0 || vector.length === this.dimensions) {
      this.entries.set(`vector-${this.entries.size}`, { vector, metadata: meta });
    }
  }

  async optimizeIndex() {
    console.log('[VectorStore] Quantizing vectors for faster retrieval...');

    // 1. Calculate global min/max for scalar quantization
    let globalMin = Infinity;
    let globalMax = -Infinity;

    for (const vec of this.index.vectors) {
      for (let i = 0; i < vec.length; i++) {
        const val = vec[i]!;
        if (val < globalMin) globalMin = val;
        if (val > globalMax) globalMax = val;
      }
    }

    const range = globalMax - globalMin;
    if (range === 0) return true; // No variation

    // 2. Quantize to 8-bit ints
    const quantizedVectors: Uint8Array[] = this.index.vectors.map(vec => {
      const qVec = new Uint8Array(vec.length);
      for (let i = 0; i < vec.length; i++) {
        // Map [min, max] -> [0, 255]
        const normalized = (vec[i]! - globalMin) / range;
        qVec[i] = Math.floor(normalized * 255);
      }
      return qVec;
    });

    // 3. Store the quantized version (simulated replacement)
    // In a real system we would replace this.index.vectors or save to disk
    console.log(`[VectorStore] Quantized ${this.index.vectors.length} vectors. compression_ratio=4x`);
    
    // @ts-ignore - Storing quantized data for demo
    this.index.quantized = { vectors: quantizedVectors, min: globalMin, range };
    
    return true;
  }
}
