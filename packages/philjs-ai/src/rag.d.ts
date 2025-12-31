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
}
export declare class PineconeVectorStore implements VectorStore {
    name: string;
    private config;
    constructor(config: PineconeConfig);
    add(documents: Document[]): Promise<void>;
    search(query: number[], topK?: number): Promise<SearchResult[]>;
    delete(ids: string[]): Promise<void>;
    clear(): Promise<void>;
}
export interface ChromaConfig {
    url: string;
    collectionName: string;
}
export declare class ChromaVectorStore implements VectorStore {
    name: string;
    private config;
    constructor(config: ChromaConfig);
    add(documents: Document[]): Promise<void>;
    search(query: number[], topK?: number): Promise<SearchResult[]>;
    delete(ids: string[]): Promise<void>;
    clear(): Promise<void>;
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
    sources: () => any;
    isLoading: () => any;
    error: () => any;
    clear: () => Promise<void>;
};
export declare function euclideanDistance(a: number[], b: number[]): number;
//# sourceMappingURL=rag.d.ts.map