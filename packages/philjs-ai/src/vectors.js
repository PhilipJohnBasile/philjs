/**
 * PhilJS AI - Vector Store Implementation
 *
 * Production-grade vector storage with actual similarity search.
 */
import { createHash } from 'crypto';
/**
 * Generate a unique ID for documents
 */
function generateId() {
    return `vec_${Date.now().toString(36)}_${createHash('sha256')
        .update(Math.random().toString())
        .digest('hex')
        .slice(0, 8)}`;
}
/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
    if (a.length !== b.length) {
        throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0)
        return 0;
    return dotProduct / magnitude;
}
/**
 * In-memory vector store with actual cosine similarity search.
 *
 * @example
 * ```typescript
 * import { VectorStore } from '@philjs/ai';
 * import { createOpenAIProvider } from '@philjs/ai/providers/openai';
 *
 * const provider = createOpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });
 * const store = new VectorStore({ embeddingProvider: provider });
 *
 * // Add documents
 * await store.add('Machine learning is a subset of AI', { topic: 'ML' });
 * await store.add('Deep learning uses neural networks', { topic: 'DL' });
 *
 * // Search for similar documents
 * const results = await store.search('What is artificial intelligence?', 5);
 * ```
 */
export class VectorStore {
    documents = new Map();
    embeddingProvider;
    embeddingModel;
    dimension;
    constructor(config = {}) {
        if (config.embeddingProvider)
            this.embeddingProvider = config.embeddingProvider;
        this.embeddingModel = config.embeddingModel || 'text-embedding-3-small';
        this.dimension = config.dimension || 1536;
    }
    /**
     * Generate embeddings for text using the configured provider
     */
    async embed(texts) {
        if (!this.embeddingProvider?.embed) {
            console.warn('VectorStore: No embedding provider configured. Using simple text-based matching.');
            // Return simple bag-of-words style embeddings for fallback
            return texts.map(text => this.createSimpleEmbedding(text));
        }
        try {
            return await this.embeddingProvider.embed(texts);
        }
        catch (error) {
            console.error('VectorStore: Embedding generation failed:', error);
            throw error;
        }
    }
    /**
     * Create a simple hash-based embedding for fallback (not semantic, but deterministic)
     */
    createSimpleEmbedding(text) {
        const embedding = new Array(this.dimension).fill(0);
        const words = text.toLowerCase().split(/\s+/);
        for (const word of words) {
            const hash = createHash('md5').update(word).digest();
            for (let i = 0; i < hash.length && i < this.dimension; i++) {
                embedding[i % this.dimension] += hash[i] / 255;
            }
        }
        // Normalize
        const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
        if (magnitude > 0) {
            for (let i = 0; i < embedding.length; i++) {
                embedding[i] /= magnitude;
            }
        }
        return embedding;
    }
    /**
     * Add a document to the store with automatic embedding generation
     */
    async add(content, metadata) {
        const id = generateId();
        const [embedding] = await this.embed([content]);
        this.documents.set(id, {
            id,
            content,
            ...(metadata && { metadata }),
            embedding
        });
        return id;
    }
    /**
     * Add multiple documents in batch for efficiency
     */
    async addBatch(documents) {
        if (documents.length === 0)
            return [];
        const contents = documents.map(d => d.content);
        const embeddings = await this.embed(contents);
        const ids = [];
        for (let i = 0; i < documents.length; i++) {
            const id = generateId();
            const doc = documents[i];
            this.documents.set(id, {
                id,
                content: doc.content,
                ...(doc.metadata && { metadata: doc.metadata }),
                embedding: embeddings[i],
            });
            ids.push(id);
        }
        return ids;
    }
    /**
     * Search for similar documents using cosine similarity
     */
    async search(query, limit = 5) {
        if (this.documents.size === 0)
            return [];
        const embeddings = await this.embed([query]);
        const queryEmbedding = embeddings[0];
        const scored = [];
        for (const doc of this.documents.values()) {
            if (!doc.embedding)
                continue;
            const score = cosineSimilarity(queryEmbedding, doc.embedding);
            scored.push({ ...doc, score });
        }
        // Sort by similarity score (highest first)
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, limit);
    }
    /**
     * Get a document by ID
     */
    get(id) {
        return this.documents.get(id);
    }
    /**
     * Delete a document by ID
     */
    delete(id) {
        return this.documents.delete(id);
    }
    /**
     * Clear all documents
     */
    clear() {
        this.documents.clear();
    }
    /**
     * Get the number of documents in the store
     */
    get size() {
        return this.documents.size;
    }
    /**
     * Get all documents (without embeddings for efficiency)
     */
    getAll() {
        return Array.from(this.documents.values()).map(({ id, content, metadata }) => ({
            id,
            content,
            ...(metadata && { metadata }),
        }));
    }
    /**
     * Update the embedding provider
     */
    setEmbeddingProvider(provider) {
        this.embeddingProvider = provider;
    }
}
/**
 * Create a vector store instance
 */
export function createVectorStore(config) {
    return new VectorStore(config);
}
//# sourceMappingURL=vectors.js.map