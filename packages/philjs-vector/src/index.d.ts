/**
 * @philjs/vector - Vector embeddings and RAG pipelines for PhilJS
 *
 * Features:
 * - Multiple embedding providers (OpenAI, Cohere, local)
 * - In-memory and persistent vector stores
 * - Semantic search with filtering
 * - RAG pipeline with chunking strategies
 * - Document loaders (PDF, Markdown, HTML, JSON)
 * - Hybrid search (vector + keyword)
 * - Reranking for improved relevance
 * - Caching for embeddings
 */
interface Embedding {
    vector: number[];
    dimensions: number;
}
interface Document {
    id: string;
    content: string;
    metadata: Record<string, any>;
    embedding?: number[];
}
interface SearchResult {
    document: Document;
    score: number;
    highlights?: string[];
}
interface ChunkOptions {
    strategy: 'fixed' | 'sentence' | 'paragraph' | 'semantic' | 'recursive';
    chunkSize?: number;
    chunkOverlap?: number;
    separators?: string[];
}
interface EmbeddingProviderConfig {
    provider: 'openai' | 'cohere' | 'huggingface' | 'local';
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    dimensions?: number;
}
interface VectorStoreConfig {
    type: 'memory' | 'indexeddb' | 'external';
    namespace?: string;
    dimensions?: number;
}
interface RAGConfig {
    embedding: EmbeddingProviderConfig;
    vectorStore: VectorStoreConfig;
    chunking?: ChunkOptions;
    topK?: number;
    minScore?: number;
    rerank?: boolean;
}
interface EmbeddingProvider {
    embed(text: string): Promise<Embedding>;
    embedBatch(texts: string[]): Promise<Embedding[]>;
    getDimensions(): number;
}
declare class OpenAIEmbeddings implements EmbeddingProvider {
    private apiKey;
    private model;
    private dimensions;
    private baseUrl;
    private cache;
    constructor(config: {
        apiKey: string;
        model?: string;
        dimensions?: number;
        baseUrl?: string;
    });
    embed(text: string): Promise<Embedding>;
    embedBatch(texts: string[]): Promise<Embedding[]>;
    getDimensions(): number;
}
declare class CohereEmbeddings implements EmbeddingProvider {
    private apiKey;
    private model;
    private dimensions;
    constructor(config: {
        apiKey: string;
        model?: string;
    });
    embed(text: string): Promise<Embedding>;
    embedBatch(texts: string[]): Promise<Embedding[]>;
    getDimensions(): number;
}
declare class LocalEmbeddings implements EmbeddingProvider {
    private model;
    private dimensions;
    private ready;
    constructor(config: {
        modelPath?: string;
        dimensions?: number;
    });
    private loadModel;
    embed(text: string): Promise<Embedding>;
    embedBatch(texts: string[]): Promise<Embedding[]>;
    private hashToVector;
    getDimensions(): number;
}
interface VectorStore {
    add(documents: Document[]): Promise<void>;
    search(query: number[], options?: {
        topK?: number;
        filter?: Record<string, any>;
        minScore?: number;
    }): Promise<SearchResult[]>;
    delete(ids: string[]): Promise<void>;
    update(id: string, document: Partial<Document>): Promise<void>;
    get(id: string): Promise<Document | null>;
    count(): Promise<number>;
    clear(): Promise<void>;
}
declare class MemoryVectorStore implements VectorStore {
    private documents;
    add(documents: Document[]): Promise<void>;
    search(query: number[], options?: {
        topK?: number;
        filter?: Record<string, any>;
        minScore?: number;
    }): Promise<SearchResult[]>;
    private cosineSimilarity;
    delete(ids: string[]): Promise<void>;
    update(id: string, updates: Partial<Document>): Promise<void>;
    get(id: string): Promise<Document | null>;
    count(): Promise<number>;
    clear(): Promise<void>;
}
declare class IndexedDBVectorStore implements VectorStore {
    private dbName;
    private storeName;
    private db;
    private ready;
    constructor(namespace?: string);
    private init;
    add(documents: Document[]): Promise<void>;
    search(query: number[], options?: {
        topK?: number;
        filter?: Record<string, any>;
        minScore?: number;
    }): Promise<SearchResult[]>;
    private getAllDocuments;
    private cosineSimilarity;
    delete(ids: string[]): Promise<void>;
    update(id: string, updates: Partial<Document>): Promise<void>;
    get(id: string): Promise<Document | null>;
    count(): Promise<number>;
    clear(): Promise<void>;
}
declare class TextChunker {
    private options;
    constructor(options?: ChunkOptions);
    chunk(text: string): string[];
    private fixedChunk;
    private sentenceChunk;
    private paragraphChunk;
    private recursiveChunk;
    private semanticChunk;
    private addOverlap;
}
interface DocumentLoader {
    load(): Promise<Document[]>;
}
declare class TextLoader implements DocumentLoader {
    private text;
    private metadata;
    constructor(text: string, metadata?: Record<string, any>);
    load(): Promise<Document[]>;
}
declare class JSONLoader implements DocumentLoader {
    private data;
    private contentKey;
    private metadataKeys;
    constructor(data: any, contentKey?: string, metadataKeys?: string[]);
    load(): Promise<Document[]>;
}
declare class MarkdownLoader implements DocumentLoader {
    private markdown;
    private source;
    constructor(markdown: string, source?: string);
    load(): Promise<Document[]>;
}
declare class URLLoader implements DocumentLoader {
    private url;
    constructor(url: string);
    load(): Promise<Document[]>;
}
interface RAGQuery {
    query: string;
    topK?: number;
    filter?: Record<string, any>;
    minScore?: number;
    includeMetadata?: boolean;
}
interface RAGResult {
    query: string;
    results: SearchResult[];
    context: string;
}
declare class RAGPipeline {
    private embeddings;
    private vectorStore;
    private chunker;
    private config;
    constructor(config: RAGConfig);
    ingest(documents: Document[]): Promise<void>;
    ingestFromLoader(loader: DocumentLoader): Promise<void>;
    query(options: RAGQuery): Promise<RAGResult>;
    private rerank;
    hybridSearch(query: string, options?: {
        topK?: number;
        filter?: Record<string, any>;
    }): Promise<SearchResult[]>;
    private keywordSearch;
    delete(ids: string[]): Promise<void>;
    clear(): Promise<void>;
    getVectorStore(): VectorStore;
    getEmbeddings(): EmbeddingProvider;
}
interface UseRAGResult {
    query: (text: string) => Promise<RAGResult>;
    ingest: (documents: Document[]) => Promise<void>;
    ingestText: (text: string, metadata?: Record<string, any>) => Promise<void>;
    results: SearchResult[];
    context: string;
    isLoading: boolean;
    error: Error | null;
    clear: () => Promise<void>;
}
declare function useRAG(config: RAGConfig): UseRAGResult;
declare function useEmbeddings(config: EmbeddingProviderConfig): {
    embed: (text: string) => Promise<number[]>;
    embedBatch: (texts: string[]) => Promise<number[][]>;
    similarity: (a: string, b: string) => Promise<number>;
};
export { RAGPipeline, TextChunker, MemoryVectorStore, IndexedDBVectorStore, OpenAIEmbeddings, CohereEmbeddings, LocalEmbeddings, TextLoader, JSONLoader, MarkdownLoader, URLLoader, useRAG, useEmbeddings, type Document, type Embedding, type SearchResult, type ChunkOptions, type EmbeddingProviderConfig, type VectorStoreConfig, type RAGConfig, type RAGQuery, type RAGResult, type VectorStore, type EmbeddingProvider, type DocumentLoader, type UseRAGResult };
//# sourceMappingURL=index.d.ts.map