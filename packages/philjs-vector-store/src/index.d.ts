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
export type DistanceMetric = 'cosine' | 'euclidean' | 'dot' | 'manhattan' | 'hamming' | 'jaccard';
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
/**
 * Initialize the WASM module (called automatically on first use)
 */
declare function initWasm(): Promise<any>;
/**
 * High-performance vector database for semantic search.
 *
 * Uses WASM-compiled VecStore for fast, in-browser vector operations.
 */
export declare class VectorStore {
    private store;
    private config;
    private _count;
    private constructor();
    /**
     * Create a new VectorStore instance
     */
    static create(config: VectorStoreConfig): Promise<VectorStore>;
    /**
     * Insert or update a vector
     *
     * @param id - Unique identifier for the vector
     * @param vector - The embedding vector (array of numbers or Float32Array)
     * @param metadata - Optional metadata to associate with the vector
     */
    upsert(id: string, vector: number[] | Float32Array, metadata?: VectorMetadata): Promise<void>;
    /**
     * Batch insert or update multiple vectors
     *
     * @param items - Array of items to insert
     */
    upsertBatch(items: Array<{
        id: string;
        vector: number[] | Float32Array;
        metadata?: VectorMetadata;
    }>): Promise<void>;
    /**
     * Query for similar vectors
     *
     * @param vector - The query vector
     * @param options - Query options
     * @returns Array of search results sorted by similarity
     */
    query(vector: number[] | Float32Array, options?: QueryOptions): Promise<SearchResult[]>;
    /**
     * Hybrid search combining vector similarity and keyword matching
     */
    hybridSearch(vector: number[] | Float32Array, options?: HybridSearchOptions): Promise<SearchResult[]>;
    /**
     * Delete a vector by ID
     */
    delete(id: string): Promise<boolean>;
    /**
     * Delete multiple vectors by IDs
     */
    deleteBatch(ids: string[]): Promise<number>;
    /**
     * Get a vector by ID
     */
    get(id: string): Promise<{
        vector: Float32Array;
        metadata?: VectorMetadata;
    } | null>;
    /**
     * Check if a vector exists
     */
    has(id: string): Promise<boolean>;
    /**
     * Clear all vectors from the store
     */
    clear(): Promise<void>;
    /**
     * Get store statistics
     */
    stats(): Promise<StoreStats>;
    /**
     * Number of vectors in the store
     */
    get count(): number;
    /**
     * Dimensions of vectors in this store
     */
    get dimensions(): number;
    /**
     * Distance metric used by this store
     */
    get metric(): DistanceMetric;
    /**
     * Validate that a vector has the correct dimensions
     */
    private validateVector;
}
/**
 * Compute cosine similarity between two vectors
 */
export declare function cosineSimilarity(a: number[] | Float32Array, b: number[] | Float32Array): number;
/**
 * Compute Euclidean distance between two vectors
 */
export declare function euclideanDistance(a: number[] | Float32Array, b: number[] | Float32Array): number;
/**
 * Normalize a vector to unit length
 */
export declare function normalizeVector(vector: number[] | Float32Array): Float32Array;
export { initWasm as initVectorStore };
export default VectorStore;
//# sourceMappingURL=index.d.ts.map