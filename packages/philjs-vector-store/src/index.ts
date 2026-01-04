/**
 * PhilJS Vector Store
 *
 * High-performance vector database with WASM-powered semantic search.
 * Built on VecStore - "The SQLite of vector search".
 *
 * Features:
 * - HNSW-based indexing for fast similarity search
 * - Multiple distance metrics (cosine, euclidean, dot product, etc.)
 * - Metadata filtering with SQL-like expressions
 * - Hybrid search combining vector + keyword matching
 * - In-memory and persistent storage options
 *
 * @example
 * ```typescript
 * import { VectorStore } from '@philjs/vector-store';
 *
 * // Initialize a store with 384 dimensions (e.g., for sentence transformers)
 * const store = await VectorStore.create({ dimensions: 384 });
 *
 * // Add vectors with metadata
 * await store.upsert('doc-1', embedding, { title: 'Hello World', category: 'greeting' });
 *
 * // Query for similar vectors
 * const results = await store.query(queryEmbedding, { k: 5 });
 *
 * // Query with metadata filter
 * const filtered = await store.query(queryEmbedding, {
 *   k: 5,
 *   filter: "category = 'greeting'"
 * });
 * ```
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Configuration for creating a VectorStore instance
 */
export interface VectorStoreConfig {
  /** Number of dimensions for vectors (e.g., 384, 768, 1536) */
  dimensions: number;

  /** Distance metric to use for similarity */
  metric?: DistanceMetric;

  /** HNSW M parameter - number of connections per layer */
  m?: number;

  /** HNSW ef_construction parameter - size of dynamic candidate list during construction */
  efConstruction?: number;

  /** HNSW ef_search parameter - size of dynamic candidate list during search */
  efSearch?: number;
}

/**
 * Supported distance metrics for vector similarity
 */
export type DistanceMetric =
  | 'cosine'      // Cosine similarity (default)
  | 'euclidean'   // Euclidean distance (L2)
  | 'dot'         // Dot product
  | 'manhattan'   // Manhattan distance (L1)
  | 'hamming'     // Hamming distance
  | 'jaccard';    // Jaccard similarity

/**
 * Metadata that can be attached to vectors
 */
export type VectorMetadata = Record<string, string | number | boolean | null>;

/**
 * A single search result
 */
export interface SearchResult {
  /** Unique identifier of the vector */
  id: string;
  /** Similarity/distance score */
  score: number;
  /** Associated metadata */
  metadata?: VectorMetadata;
  /** The vector itself (if includeVectors is true) */
  vector?: Float32Array;
}

/**
 * Options for querying vectors
 */
export interface QueryOptions {
  /** Number of results to return */
  k?: number;
  /** Metadata filter expression (SQL-like) */
  filter?: string;
  /** Include vectors in results */
  includeVectors?: boolean;
  /** Include metadata in results */
  includeMetadata?: boolean;
  /** Minimum score threshold */
  minScore?: number;
}

/**
 * Options for hybrid search combining vector and keyword matching
 */
export interface HybridSearchOptions extends QueryOptions {
  /** Text query for BM25 keyword matching */
  text?: string;
  /** Weight for vector similarity (0-1) */
  vectorWeight?: number;
  /** Weight for keyword matching (0-1) */
  keywordWeight?: number;
}

/**
 * Statistics about the vector store
 */
export interface StoreStats {
  /** Total number of vectors */
  count: number;
  /** Dimensions of vectors */
  dimensions: number;
  /** Distance metric used */
  metric: DistanceMetric;
  /** Memory usage in bytes (approximate) */
  memoryBytes?: number;
}

// ============================================================================
// WASM Module Singleton
// ============================================================================

let wasmModule: any = null;
let wasmInitPromise: Promise<any> | null = null;
let fallbackWarned = false;

/**
 * Initialize the WASM module (called automatically on first use)
 */
async function initWasm(): Promise<any> {
  if (wasmModule) return wasmModule;

  if (wasmInitPromise) return wasmInitPromise;

  wasmInitPromise = (async () => {
    try {
      // Dynamic import of vecstore-wasm
      const wasm = await import('vecstore-wasm');

      // Initialize the WASM module if it has an init function
      if (typeof wasm.default === 'function') {
        await wasm.default();
      }

      wasmModule = wasm;
      return wasm;
    } catch (error) {
      const fallback = createFallbackModule(error);
      wasmModule = fallback;
      return fallback;
    }
  })();

  return wasmInitPromise;
}

function createFallbackModule(error: unknown): { createStore: (config: Required<VectorStoreConfig>) => Promise<MemoryVecStore> } {
  if (!fallbackWarned) {
    fallbackWarned = true;
    const isTest = typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'test';
    if (!isTest) {
      console.warn(
        `[PhilJS] vecstore-wasm unavailable, using JS fallback (${error instanceof Error ? error.message : String(error)}).`
      );
    }
  }

  return {
    async createStore(config: Required<VectorStoreConfig>) {
      return new MemoryVecStore(config);
    },
  };
}

class MemoryVecStore {
  private vectors = new Map<string, { vector: Float32Array; metadata?: VectorMetadata }>();
  private config: Required<VectorStoreConfig>;

  constructor(config: Required<VectorStoreConfig>) {
    this.config = config;
  }

  async upsert(id: string, vector: Float32Array, metadata?: VectorMetadata): Promise<void> {
    this.vectors.set(id, { vector, metadata });
  }

  async upsertBatch(items: Array<{ id: string; vector: Float32Array; metadata?: VectorMetadata }>): Promise<void> {
    for (const item of items) {
      this.vectors.set(item.id, { vector: item.vector, metadata: item.metadata });
    }
  }

  async query(vector: Float32Array, k: number): Promise<Array<{ id: string; score: number; metadata?: VectorMetadata; vector?: Float32Array }>> {
    const results: Array<{ id: string; score: number; metadata?: VectorMetadata; vector?: Float32Array }> = [];

    for (const [id, entry] of this.vectors.entries()) {
      const score = scoreVector(this.config.metric, vector, entry.vector);
      results.push({
        id,
        score,
        metadata: entry.metadata,
        vector: entry.vector,
      });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  async delete(id: string): Promise<boolean> {
    return this.vectors.delete(id);
  }

  async deleteBatch(ids: string[]): Promise<number> {
    let deleted = 0;
    for (const id of ids) {
      if (this.vectors.delete(id)) deleted++;
    }
    return deleted;
  }

  async get(id: string): Promise<{ vector: Float32Array; metadata?: VectorMetadata } | null> {
    return this.vectors.get(id) ?? null;
  }

  async has(id: string): Promise<boolean> {
    return this.vectors.has(id);
  }

  async clear(): Promise<void> {
    this.vectors.clear();
  }

  async stats(): Promise<{ count: number; memoryBytes?: number }> {
    return { count: this.vectors.size };
  }

  async count(): Promise<number> {
    return this.vectors.size;
  }
}

function scoreVector(metric: DistanceMetric, a: Float32Array, b: Float32Array): number {
  switch (metric) {
    case 'euclidean':
      return 1 / (1 + euclideanDistance(a, b));
    case 'dot':
      return dotProduct(a, b);
    case 'manhattan':
      return 1 / (1 + manhattanDistance(a, b));
    case 'hamming':
      return 1 - hammingDistance(a, b) / a.length;
    case 'jaccard':
      return jaccardSimilarity(a, b);
    case 'cosine':
    default:
      return cosineSimilarity(a, b);
  }
}

function dotProduct(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i]! * b[i]!;
  }
  return sum;
}

function manhattanDistance(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.abs(a[i]! - b[i]!);
  }
  return sum;
}

function hammingDistance(a: Float32Array, b: Float32Array): number {
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) diff++;
  }
  return diff;
}

function jaccardSimilarity(a: Float32Array, b: Float32Array): number {
  let intersection = 0;
  let union = 0;
  for (let i = 0; i < a.length; i++) {
    const av = a[i]!;
    const bv = b[i]!;
    const aPresent = av !== 0;
    const bPresent = bv !== 0;
    if (aPresent || bPresent) union++;
    if (aPresent && bPresent && av === bv) intersection++;
  }
  return union === 0 ? 0 : intersection / union;
}

// ============================================================================
// VectorStore Class
// ============================================================================

/**
 * High-performance vector database for semantic search.
 *
 * Uses WASM-compiled VecStore for fast, in-browser vector operations.
 */
export class VectorStore {
  private store: any;
  private config: Required<VectorStoreConfig>;
  private _count: number = 0;

  private constructor(store: any, config: Required<VectorStoreConfig>) {
    this.store = store;
    this.config = config;
  }

  /**
   * Create a new VectorStore instance
   */
  static async create(config: VectorStoreConfig): Promise<VectorStore> {
    const wasm = await initWasm();

    const fullConfig: Required<VectorStoreConfig> = {
      dimensions: config.dimensions,
      metric: config.metric ?? 'cosine',
      m: config.m ?? 16,
      efConstruction: config.efConstruction ?? 200,
      efSearch: config.efSearch ?? 50,
    };

    // Create the underlying WASM store
    // Note: The exact API depends on vecstore-wasm's exports
    let store: any;

    if (wasm.WasmVecStore) {
      // If WasmVecStore class is exported
      store = new wasm.WasmVecStore(fullConfig.dimensions);
    } else if (wasm.createStore) {
      // Alternative: factory function
      store = await wasm.createStore(fullConfig);
    } else if (wasm.VecStore) {
      store = new wasm.VecStore(fullConfig.dimensions);
    } else {
      throw new Error('vecstore-wasm does not export a recognized store constructor');
    }

    return new VectorStore(store, fullConfig);
  }

  /**
   * Insert or update a vector
   *
   * @param id - Unique identifier for the vector
   * @param vector - The embedding vector (array of numbers or Float32Array)
   * @param metadata - Optional metadata to associate with the vector
   */
  async upsert(
    id: string,
    vector: number[] | Float32Array,
    metadata?: VectorMetadata
  ): Promise<void> {
    this.validateVector(vector);

    const float32Vector = vector instanceof Float32Array
      ? vector
      : new Float32Array(vector);

    // Call the WASM store's upsert method
    if (this.store.upsert) {
      await this.store.upsert(id, float32Vector, metadata);
    } else if (this.store.add) {
      await this.store.add(id, float32Vector, metadata);
    } else if (this.store.insert) {
      await this.store.insert(id, float32Vector, metadata);
    }

    this._count++;
  }

  /**
   * Batch insert or update multiple vectors
   *
   * @param items - Array of items to insert
   */
  async upsertBatch(
    items: Array<{ id: string; vector: number[] | Float32Array; metadata?: VectorMetadata }>
  ): Promise<void> {
    // If the store supports batch operations, use them
    if (this.store.upsertBatch) {
      const batchData = items.map(item => ({
        id: item.id,
        vector: item.vector instanceof Float32Array
          ? item.vector
          : new Float32Array(item.vector),
        metadata: item.metadata,
      }));
      await this.store.upsertBatch(batchData);
      this._count += items.length;
    } else {
      // Fallback to sequential inserts
      for (const item of items) {
        await this.upsert(item.id, item.vector, item.metadata);
      }
    }
  }

  /**
   * Query for similar vectors
   *
   * @param vector - The query vector
   * @param options - Query options
   * @returns Array of search results sorted by similarity
   */
  async query(
    vector: number[] | Float32Array,
    options: QueryOptions = {}
  ): Promise<SearchResult[]> {
    this.validateVector(vector);

    const {
      k = 10,
      filter,
      includeVectors = false,
      includeMetadata = true,
      minScore,
    } = options;

    const float32Vector = vector instanceof Float32Array
      ? vector
      : new Float32Array(vector);

    let results: any[];

    // Try different query method signatures
    if (filter && this.store.queryWithFilter) {
      results = await this.store.queryWithFilter(float32Vector, k, filter);
    } else if (this.store.query) {
      results = await this.store.query(float32Vector, k);
    } else if (this.store.search) {
      results = await this.store.search(float32Vector, k);
    } else {
      throw new Error('Store does not support query operations');
    }

    // Transform results to our format
    let searchResults: SearchResult[] = (results || []).map((r: any) => ({
      id: r.id ?? r.key ?? r.label,
      score: r.score ?? r.distance ?? r.similarity ?? 0,
      metadata: includeMetadata ? r.metadata : undefined,
      vector: includeVectors ? r.vector : undefined,
    }));

    // Apply minimum score filter if specified
    if (minScore !== undefined) {
      searchResults = searchResults.filter(r => r.score >= minScore);
    }

    return searchResults;
  }

  /**
   * Hybrid search combining vector similarity and keyword matching
   */
  async hybridSearch(
    vector: number[] | Float32Array,
    options: HybridSearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      text,
      vectorWeight = 0.7,
      keywordWeight = 0.3,
      ...queryOptions
    } = options;

    if (this.store.hybridSearch) {
      const float32Vector = vector instanceof Float32Array
        ? vector
        : new Float32Array(vector);

      const results = await this.store.hybridSearch(
        float32Vector,
        text ?? '',
        queryOptions.k ?? 10,
        vectorWeight,
        keywordWeight
      );

      return (results || []).map((r: any) => ({
        id: r.id ?? r.key,
        score: r.score ?? 0,
        metadata: r.metadata,
      }));
    }

    // Fallback to regular query if hybrid not supported
    return this.query(vector, queryOptions);
  }

  /**
   * Delete a vector by ID
   */
  async delete(id: string): Promise<boolean> {
    if (this.store.delete) {
      const deleted = await this.store.delete(id);
      if (deleted) this._count--;
      return deleted;
    } else if (this.store.remove) {
      const removed = await this.store.remove(id);
      if (removed) this._count--;
      return removed;
    }
    return false;
  }

  /**
   * Delete multiple vectors by IDs
   */
  async deleteBatch(ids: string[]): Promise<number> {
    if (this.store.deleteBatch) {
      const count = await this.store.deleteBatch(ids);
      this._count -= count;
      return count;
    }

    let deleted = 0;
    for (const id of ids) {
      if (await this.delete(id)) deleted++;
    }
    return deleted;
  }

  /**
   * Get a vector by ID
   */
  async get(id: string): Promise<{ vector: Float32Array; metadata?: VectorMetadata } | null> {
    if (this.store.get) {
      return this.store.get(id);
    }
    return null;
  }

  /**
   * Check if a vector exists
   */
  async has(id: string): Promise<boolean> {
    if (this.store.has) {
      return this.store.has(id);
    }
    if (this.store.get) {
      return (await this.store.get(id)) !== null;
    }
    return false;
  }

  /**
   * Clear all vectors from the store
   */
  async clear(): Promise<void> {
    if (this.store.clear) {
      await this.store.clear();
    } else if (this.store.reset) {
      await this.store.reset();
    }
    this._count = 0;
  }

  /**
   * Get store statistics
   */
  async stats(): Promise<StoreStats> {
    const stats: StoreStats = {
      count: this._count,
      dimensions: this.config.dimensions,
      metric: this.config.metric,
    };

    if (this.store.stats) {
      const wasmStats = await this.store.stats();
      stats.count = wasmStats.count ?? stats.count;
      stats.memoryBytes = wasmStats.memoryBytes;
    }

    if (this.store.count) {
      stats.count = await this.store.count();
    }

    return stats;
  }

  /**
   * Number of vectors in the store
   */
  get count(): number {
    return this._count;
  }

  /**
   * Dimensions of vectors in this store
   */
  get dimensions(): number {
    return this.config.dimensions;
  }

  /**
   * Distance metric used by this store
   */
  get metric(): DistanceMetric {
    return this.config.metric;
  }

  /**
   * Validate that a vector has the correct dimensions
   */
  private validateVector(vector: number[] | Float32Array): void {
    const length = vector.length;
    if (length !== this.config.dimensions) {
      throw new Error(
        `Vector dimension mismatch: expected ${this.config.dimensions}, got ${length}`
      );
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[] | Float32Array, b: number[] | Float32Array): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Compute Euclidean distance between two vectors
 */
export function euclideanDistance(a: number[] | Float32Array, b: number[] | Float32Array): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i]! - b[i]!;
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Normalize a vector to unit length
 */
export function normalizeVector(vector: number[] | Float32Array): Float32Array {
  let sumSquares = 0;
  for (let i = 0; i < vector.length; i++) {
    sumSquares += vector[i]! * vector[i]!;
  }
  const norm = Math.sqrt(sumSquares);
  const normalized = new Float32Array(vector.length);

  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) {
      normalized[i] = vector[i]! / norm;
    }
  }

  return normalized;
}

// ============================================================================
// Re-exports
// ============================================================================

export { initWasm as initVectorStore };
export default VectorStore;
