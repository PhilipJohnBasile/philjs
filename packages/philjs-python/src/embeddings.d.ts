/**
 * Vector Embeddings Integration for PhilJS Python
 *
 * Full-featured TypeScript client for embedding generation via Python backend.
 * Supports automatic batching, caching, and similarity search operations.
 */
import type { EmbeddingsConfig, EmbeddingsRequest, EmbeddingsResponse } from './types.js';
/**
 * Similarity search result
 */
export interface SimilarityResult {
    text: string;
    score: number;
    index: number;
    embedding?: number[];
}
/**
 * Batch processing options
 */
export interface BatchOptions {
    batchSize?: number;
    concurrency?: number;
    onProgress?: (completed: number, total: number) => void;
}
/**
 * Embeddings client for generating vector embeddings via Python backend
 */
export declare class Embeddings {
    private config;
    private baseUrl;
    private cache;
    private cacheEnabled;
    constructor(config: EmbeddingsConfig);
    /**
     * Enable embedding cache for repeated texts
     */
    enableCache(): this;
    /**
     * Disable embedding cache
     */
    disableCache(): this;
    /**
     * Clear the embedding cache
     */
    clearCache(): this;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        enabled: boolean;
    };
    /**
     * Generate cache key for text
     */
    private getCacheKey;
    /**
     * Generate embeddings for text input with automatic batching
     */
    generate(request: EmbeddingsRequest): Promise<EmbeddingsResponse>;
    /**
     * Generate embeddings for a single text
     */
    embed(text: string): Promise<number[]>;
    /**
     * Generate embeddings for multiple texts
     */
    embedMany(texts: string[]): Promise<number[][]>;
    /**
     * Generate embeddings with progress tracking for large batches
     */
    embedBatch(texts: string[], options?: BatchOptions): Promise<{
        embeddings: number[][];
        totalTokens: number;
    }>;
    /**
     * Calculate cosine similarity between two vectors
     */
    static cosineSimilarity(a: number[], b: number[]): number;
    /**
     * Calculate Euclidean distance between two vectors
     */
    static euclideanDistance(a: number[], b: number[]): number;
    /**
     * Calculate dot product between two vectors
     */
    static dotProduct(a: number[], b: number[]): number;
    /**
     * Normalize a vector to unit length
     */
    static normalize(vector: number[]): number[];
    /**
     * Find most similar texts from a corpus
     */
    findSimilar(query: string, corpus: string[], topK?: number, options?: {
        includeEmbeddings?: boolean;
    }): Promise<SimilarityResult[]>;
    /**
     * Find similar items using pre-computed embeddings
     */
    findSimilarFromEmbeddings(queryEmbedding: number[], corpusEmbeddings: number[][], texts: string[], topK?: number): SimilarityResult[];
    /**
     * Cluster texts by similarity using k-means-like approach
     */
    clusterTexts(texts: string[], numClusters: number): Promise<Array<{
        centroid: number;
        texts: string[];
        indices: number[];
    }>>;
    /**
     * Calculate semantic similarity between two texts
     */
    similarity(text1: string, text2: string): Promise<number>;
    /**
     * Deduplicate texts based on semantic similarity threshold
     */
    deduplicate(texts: string[], similarityThreshold?: number): Promise<{
        unique: string[];
        duplicates: Array<{
            text: string;
            duplicateOf: string;
        }>;
    }>;
}
/**
 * Create a configured Embeddings client
 */
export declare function createEmbeddings(config: EmbeddingsConfig): Embeddings;
/**
 * Create an OpenAI embeddings client with text-embedding-3-small
 */
export declare function createOpenAIEmbeddings(options?: {
    model?: string;
    dimensions?: number;
    apiKey?: string;
    baseUrl?: string;
}): Embeddings;
/**
 * Create an OpenAI embeddings client with text-embedding-3-large
 */
export declare function createOpenAILargeEmbeddings(options?: {
    dimensions?: number;
    apiKey?: string;
    baseUrl?: string;
}): Embeddings;
export declare const embeddings: Embeddings;
//# sourceMappingURL=embeddings.d.ts.map