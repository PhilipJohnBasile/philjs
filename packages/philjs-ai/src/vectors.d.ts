/**
 * PhilJS AI - Vector Store Implementation
 *
 * Production-grade vector storage with actual similarity search.
 */
import type { AIProvider } from './types.js';
export interface VectorDocument {
    id: string;
    content: string;
    metadata?: Record<string, any> | undefined;
    embedding?: number[] | undefined;
}
export interface VectorStoreConfig {
    /**
     * Embedding provider that implements the embed() method.
     * If not provided, no embeddings will be generated and search will use basic text matching.
     */
    embeddingProvider?: AIProvider;
    /**
     * Default model for embeddings (e.g., 'text-embedding-3-small')
     */
    embeddingModel?: string;
    /**
     * Dimension of embeddings (default: 1536 for OpenAI)
     */
    dimension?: number;
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
export declare class VectorStore {
    private documents;
    private embeddingProvider?;
    private embeddingModel;
    private dimension;
    constructor(config?: VectorStoreConfig);
    /**
     * Generate embeddings for text using the configured provider
     */
    private embed;
    /**
     * Create a simple hash-based embedding for fallback (not semantic, but deterministic)
     */
    private createSimpleEmbedding;
    /**
     * Add a document to the store with automatic embedding generation
     */
    add(content: string, metadata?: Record<string, any>): Promise<string>;
    /**
     * Add multiple documents in batch for efficiency
     */
    addBatch(documents: Array<{
        content: string;
        metadata?: Record<string, any>;
    }>): Promise<string[]>;
    /**
     * Search for similar documents using cosine similarity
     */
    search(query: string, limit?: number): Promise<Array<VectorDocument & {
        score: number;
    }>>;
    /**
     * Get a document by ID
     */
    get(id: string): VectorDocument | undefined;
    /**
     * Delete a document by ID
     */
    delete(id: string): boolean;
    /**
     * Clear all documents
     */
    clear(): void;
    /**
     * Get the number of documents in the store
     */
    get size(): number;
    /**
     * Get all documents (without embeddings for efficiency)
     */
    getAll(): VectorDocument[];
    /**
     * Update the embedding provider
     */
    setEmbeddingProvider(provider: AIProvider): void;
}
/**
 * Create a vector store instance
 */
export declare function createVectorStore(config?: VectorStoreConfig): VectorStore;
//# sourceMappingURL=vectors.d.ts.map