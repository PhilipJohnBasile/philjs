/**
 * PhilJS AI - RAG (Retrieval Augmented Generation)
 *
 * Vector storage, similarity search, and context augmentation.
 */
import type { AIProvider } from './types.js';
export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export interface Document {
    id: string;
    content: string;
    metadata?: Record<string, any>;
    embedding?: number[];
}
export interface VectorStore {
    name: string;
    add(documents: Document[]): Promise<void>;
    search(query: number[], topK?: number): Promise<SearchResult[]>;
    delete(ids: string[]): Promise<void>;
    clear(): Promise<void>;
}
export interface SearchResult {
    document: Document;
    score: number;
}
export interface RAGOptions {
    provider: AIProvider;
    vectorStore: VectorStore;
    topK?: number;
    minScore?: number;
    systemPrompt?: string;
}
export declare class InMemoryVectorStore implements VectorStore {
    name: string;
    private documents;
    add(documents: Document[]): Promise<void>;
    search(query: number[], topK?: number): Promise<SearchResult[]>;
    delete(ids: string[]): Promise<void>;
    clear(): Promise<void>;
    getAll(): Document[];
}
export interface PineconeConfig {
    apiKey: string;
    environment: string;
    indexName: string;
    namespace?: string;
    baseUrl?: string;
}
/**
 * Pinecone Vector Store
 *
 * Full implementation using Pinecone REST API.
 * Supports serverless and pod-based indexes.
 *
 * @example
 * ```typescript
 * const store = new PineconeVectorStore({
 *   apiKey: process.env.PINECONE_API_KEY!,
 *   environment: 'us-east-1',
 *   indexName: 'my-index',
 * });
 * ```
 */
export declare class PineconeVectorStore implements VectorStore {
    name: string;
    private config;
    private baseUrl;
    private namespace;
    constructor(config: PineconeConfig);
    private request;
    add(documents: Document[]): Promise<void>;
    search(query: number[], topK?: number): Promise<SearchResult[]>;
    delete(ids: string[]): Promise<void>;
    clear(): Promise<void>;
    /**
     * Get index statistics
     */
    stats(): Promise<{
        totalVectorCount: number;
        dimension: number;
        namespaces: Record<string, {
            vectorCount: number;
        }>;
    }>;
    /**
     * Fetch vectors by ID
     */
    fetch(ids: string[]): Promise<Map<string, Document>>;
}
export interface ChromaConfig {
    url: string;
    collectionName: string;
    tenant?: string;
    database?: string;
}
/**
 * ChromaDB Vector Store
 *
 * Full implementation using Chroma REST API.
 * Supports local and cloud Chroma instances.
 *
 * @example
 * ```typescript
 * const store = new ChromaVectorStore({
 *   url: 'http://localhost:8000',
 *   collectionName: 'my-collection',
 * });
 * ```
 */
export declare class ChromaVectorStore implements VectorStore {
    name: string;
    private config;
    private collectionId;
    private tenant;
    private database;
    constructor(config: ChromaConfig);
    private get baseUrl();
    private request;
    /**
     * Ensure collection exists and get its ID
     */
    private ensureCollection;
    add(documents: Document[]): Promise<void>;
    search(query: number[], topK?: number): Promise<SearchResult[]>;
    delete(ids: string[]): Promise<void>;
    clear(): Promise<void>;
    /**
     * Get collection info
     */
    info(): Promise<{
        id: string;
        name: string;
        count: number;
    }>;
    /**
     * Update documents
     */
    update(documents: Document[]): Promise<void>;
    /**
     * Get documents by ID
     */
    get(ids: string[]): Promise<Document[]>;
}
export interface QdrantConfig {
    url: string;
    collectionName: string;
    apiKey?: string;
}
export declare class QdrantVectorStore implements VectorStore {
    name: string;
    private config;
    constructor(config: QdrantConfig);
    add(documents: Document[]): Promise<void>;
    search(query: number[], topK?: number): Promise<SearchResult[]>;
    delete(ids: string[]): Promise<void>;
    clear(): Promise<void>;
}
export declare class RAGPipeline {
    private provider;
    private vectorStore;
    private topK;
    private minScore;
    private systemPrompt;
    constructor(options: RAGOptions);
    ingest(documents: Document[]): Promise<void>;
    query(question: string): Promise<{
        answer: string;
        sources: SearchResult[];
    }>;
    clear(): Promise<void>;
}
export interface DocumentLoader {
    load(): Promise<Document[]>;
}
export declare class TextLoader implements DocumentLoader {
    private content;
    private metadata?;
    constructor(content: string, metadata?: Record<string, any>);
    load(): Promise<Document[]>;
}
export declare class JSONLoader implements DocumentLoader {
    private data;
    private contentKey;
    constructor(data: any, contentKey?: string);
    load(): Promise<Document[]>;
}
export declare class MarkdownLoader implements DocumentLoader {
    private content;
    constructor(content: string);
    load(): Promise<Document[]>;
}
export interface TextSplitter {
    split(text: string): string[];
}
export declare class RecursiveCharacterSplitter implements TextSplitter {
    private chunkSize;
    private chunkOverlap;
    private separators;
    constructor(options?: {
        chunkSize?: number;
        chunkOverlap?: number;
        separators?: string[];
    });
    split(text: string): string[];
}
export declare class TokenSplitter implements TextSplitter {
    private maxTokens;
    private overlap;
    constructor(options?: {
        maxTokens?: number;
        overlap?: number;
    });
    split(text: string): string[];
}
export declare function useRAG(options: RAGOptions): {
    query: (question: string) => Promise<string | null>;
    ingest: (documents: Document[]) => Promise<void>;
    sources: () => SearchResult[];
    isLoading: () => boolean;
    error: () => Error | null;
    clear: () => Promise<void>;
};
export declare function euclideanDistance(a: number[], b: number[]): number;
//# sourceMappingURL=rag.d.ts.map