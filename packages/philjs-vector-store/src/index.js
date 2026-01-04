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
// WASM Module Singleton
// ============================================================================
let wasmModule = null;
let wasmInitPromise = null;
let fallbackWarned = false;
/**
 * Initialize the WASM module (called automatically on first use)
 */
async function initWasm() {
    if (wasmModule)
        return wasmModule;
    if (wasmInitPromise)
        return wasmInitPromise;
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
        }
        catch (error) {
            const fallback = createFallbackModule(error);
            wasmModule = fallback;
            return fallback;
        }
    })();
    return wasmInitPromise;
}
function createFallbackModule(error) {
    if (!fallbackWarned) {
        fallbackWarned = true;
        const isTest = typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'test';
        if (!isTest) {
            console.warn(`[PhilJS] vecstore-wasm unavailable, using JS fallback (${error instanceof Error ? error.message : String(error)}).`);
        }
    }
    return {
        async createStore(config) {
            return new MemoryVecStore(config);
        },
    };
}
class MemoryVecStore {
    vectors = new Map();
    config;
    constructor(config) {
        this.config = config;
    }
    async upsert(id, vector, metadata) {
        this.vectors.set(id, { vector, metadata });
    }
    async upsertBatch(items) {
        for (const item of items) {
            this.vectors.set(item.id, { vector: item.vector, metadata: item.metadata });
        }
    }
    async query(vector, k) {
        const results = [];
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
    async delete(id) {
        return this.vectors.delete(id);
    }
    async deleteBatch(ids) {
        let deleted = 0;
        for (const id of ids) {
            if (this.vectors.delete(id))
                deleted++;
        }
        return deleted;
    }
    async get(id) {
        return this.vectors.get(id) ?? null;
    }
    async has(id) {
        return this.vectors.has(id);
    }
    async clear() {
        this.vectors.clear();
    }
    async stats() {
        return { count: this.vectors.size };
    }
    async count() {
        return this.vectors.size;
    }
}
function scoreVector(metric, a, b) {
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
function dotProduct(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += a[i] * b[i];
    }
    return sum;
}
function manhattanDistance(a, b) {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += Math.abs(a[i] - b[i]);
    }
    return sum;
}
function hammingDistance(a, b) {
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i])
            diff++;
    }
    return diff;
}
function jaccardSimilarity(a, b) {
    let intersection = 0;
    let union = 0;
    for (let i = 0; i < a.length; i++) {
        const av = a[i];
        const bv = b[i];
        const aPresent = av !== 0;
        const bPresent = bv !== 0;
        if (aPresent || bPresent)
            union++;
        if (aPresent && bPresent && av === bv)
            intersection++;
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
    store;
    config;
    _count = 0;
    constructor(store, config) {
        this.store = store;
        this.config = config;
    }
    /**
     * Create a new VectorStore instance
     */
    static async create(config) {
        const wasm = await initWasm();
        const fullConfig = {
            dimensions: config.dimensions,
            metric: config.metric ?? 'cosine',
            m: config.m ?? 16,
            efConstruction: config.efConstruction ?? 200,
            efSearch: config.efSearch ?? 50,
        };
        // Create the underlying WASM store
        // Note: The exact API depends on vecstore-wasm's exports
        let store;
        if (wasm.WasmVecStore) {
            // If WasmVecStore class is exported
            store = new wasm.WasmVecStore(fullConfig.dimensions);
        }
        else if (wasm.createStore) {
            // Alternative: factory function
            store = await wasm.createStore(fullConfig);
        }
        else if (wasm.VecStore) {
            store = new wasm.VecStore(fullConfig.dimensions);
        }
        else {
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
    async upsert(id, vector, metadata) {
        this.validateVector(vector);
        const float32Vector = vector instanceof Float32Array
            ? vector
            : new Float32Array(vector);
        // Call the WASM store's upsert method
        if (this.store.upsert) {
            await this.store.upsert(id, float32Vector, metadata);
        }
        else if (this.store.add) {
            await this.store.add(id, float32Vector, metadata);
        }
        else if (this.store.insert) {
            await this.store.insert(id, float32Vector, metadata);
        }
        this._count++;
    }
    /**
     * Batch insert or update multiple vectors
     *
     * @param items - Array of items to insert
     */
    async upsertBatch(items) {
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
        }
        else {
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
    async query(vector, options = {}) {
        this.validateVector(vector);
        const { k = 10, filter, includeVectors = false, includeMetadata = true, minScore, } = options;
        const float32Vector = vector instanceof Float32Array
            ? vector
            : new Float32Array(vector);
        let results;
        // Try different query method signatures
        if (filter && this.store.queryWithFilter) {
            results = await this.store.queryWithFilter(float32Vector, k, filter);
        }
        else if (this.store.query) {
            results = await this.store.query(float32Vector, k);
        }
        else if (this.store.search) {
            results = await this.store.search(float32Vector, k);
        }
        else {
            throw new Error('Store does not support query operations');
        }
        // Transform results to our format
        let searchResults = (results || []).map((r) => ({
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
    async hybridSearch(vector, options = {}) {
        const { text, vectorWeight = 0.7, keywordWeight = 0.3, ...queryOptions } = options;
        if (this.store.hybridSearch) {
            const float32Vector = vector instanceof Float32Array
                ? vector
                : new Float32Array(vector);
            const results = await this.store.hybridSearch(float32Vector, text ?? '', queryOptions.k ?? 10, vectorWeight, keywordWeight);
            return (results || []).map((r) => ({
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
    async delete(id) {
        if (this.store.delete) {
            const deleted = await this.store.delete(id);
            if (deleted)
                this._count--;
            return deleted;
        }
        else if (this.store.remove) {
            const removed = await this.store.remove(id);
            if (removed)
                this._count--;
            return removed;
        }
        return false;
    }
    /**
     * Delete multiple vectors by IDs
     */
    async deleteBatch(ids) {
        if (this.store.deleteBatch) {
            const count = await this.store.deleteBatch(ids);
            this._count -= count;
            return count;
        }
        let deleted = 0;
        for (const id of ids) {
            if (await this.delete(id))
                deleted++;
        }
        return deleted;
    }
    /**
     * Get a vector by ID
     */
    async get(id) {
        if (this.store.get) {
            return this.store.get(id);
        }
        return null;
    }
    /**
     * Check if a vector exists
     */
    async has(id) {
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
    async clear() {
        if (this.store.clear) {
            await this.store.clear();
        }
        else if (this.store.reset) {
            await this.store.reset();
        }
        this._count = 0;
    }
    /**
     * Get store statistics
     */
    async stats() {
        const stats = {
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
    get count() {
        return this._count;
    }
    /**
     * Dimensions of vectors in this store
     */
    get dimensions() {
        return this.config.dimensions;
    }
    /**
     * Distance metric used by this store
     */
    get metric() {
        return this.config.metric;
    }
    /**
     * Validate that a vector has the correct dimensions
     */
    validateVector(vector) {
        const length = vector.length;
        if (length !== this.config.dimensions) {
            throw new Error(`Vector dimension mismatch: expected ${this.config.dimensions}, got ${length}`);
        }
    }
}
// ============================================================================
// Utility Functions
// ============================================================================
/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(a, b) {
    if (a.length !== b.length) {
        throw new Error('Vectors must have the same length');
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
}
/**
 * Compute Euclidean distance between two vectors
 */
export function euclideanDistance(a, b) {
    if (a.length !== b.length) {
        throw new Error('Vectors must have the same length');
    }
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        const diff = a[i] - b[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum);
}
/**
 * Normalize a vector to unit length
 */
export function normalizeVector(vector) {
    let sumSquares = 0;
    for (let i = 0; i < vector.length; i++) {
        sumSquares += vector[i] * vector[i];
    }
    const norm = Math.sqrt(sumSquares);
    const normalized = new Float32Array(vector.length);
    if (norm > 0) {
        for (let i = 0; i < vector.length; i++) {
            normalized[i] = vector[i] / norm;
        }
    }
    return normalized;
}
// ============================================================================
// Re-exports
// ============================================================================
export { initWasm as initVectorStore };
export default VectorStore;
//# sourceMappingURL=index.js.map