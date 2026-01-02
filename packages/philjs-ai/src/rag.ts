/**
 * PhilJS AI - RAG (Retrieval Augmented Generation)
 *
 * Vector storage, similarity search, and context augmentation.
 */

import { signal, memo } from '@philjs/core';
import type { AIProvider } from './types.js';

// Message type for RAG conversations
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Extended AIProvider interface with embedding support
interface EmbeddingAIProvider extends AIProvider {
  embed?(texts: string[]): Promise<number[][]>;
  chat?(messages: Message[], options?: { systemPrompt?: string }): Promise<string>;
}

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// In-Memory Vector Store
// ============================================================================

export class InMemoryVectorStore implements VectorStore {
  name = 'memory';
  private documents: Map<string, Document> = new Map();

  async add(documents: Document[]): Promise<void> {
    for (const doc of documents) {
      this.documents.set(doc.id, doc);
    }
  }

  async search(query: number[], topK = 5): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    for (const doc of this.documents.values()) {
      if (!doc.embedding) continue;

      const score = cosineSimilarity(query, doc.embedding);
      results.push({ document: doc, score });
    }

    // ES2023+: Use toSorted for non-mutating sort
    return results
      .toSorted((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.documents.delete(id);
    }
  }

  async clear(): Promise<void> {
    this.documents.clear();
  }

  getAll(): Document[] {
    return Array.from(this.documents.values());
  }
}

// ============================================================================
// Vector Database Adapters
// ============================================================================

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
export class PineconeVectorStore implements VectorStore {
  name = 'pinecone';
  private config: PineconeConfig;
  private baseUrl: string;
  private namespace: string;

  constructor(config: PineconeConfig) {
    this.config = config;
    this.namespace = config.namespace || '';
    // Pinecone serverless URL format
    this.baseUrl = config.baseUrl ||
      `https://${config.indexName}-${config.environment}.svc.pinecone.io`;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Api-Key': this.config.apiKey,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Pinecone API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async add(documents: Document[]): Promise<void> {
    if (documents.length === 0) return;

    // Validate all documents have embeddings
    for (const doc of documents) {
      if (!doc.embedding) {
        throw new Error(`Document ${doc.id} missing embedding`);
      }
    }

    // Pinecone upsert format
    const vectors = documents.map(doc => ({
      id: doc.id,
      values: doc.embedding!,
      metadata: {
        content: doc.content,
        ...doc.metadata,
      },
    }));

    // Batch upserts (Pinecone limit is 100 vectors per request)
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await this.request('/vectors/upsert', 'POST', {
        vectors: batch,
        namespace: this.namespace,
      });
    }
  }

  async search(query: number[], topK = 5): Promise<SearchResult[]> {
    const response = await this.request<{
      matches: Array<{
        id: string;
        score: number;
        metadata?: Record<string, unknown>;
      }>;
    }>('/query', 'POST', {
      vector: query,
      topK,
      includeMetadata: true,
      namespace: this.namespace,
    });

    return response.matches.map(match => ({
      document: {
        id: match.id,
        content: (match.metadata?.content as string) || '',
        metadata: match.metadata,
        embedding: undefined, // Not returned by query
      },
      score: match.score,
    }));
  }

  async delete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    await this.request('/vectors/delete', 'POST', {
      ids,
      namespace: this.namespace,
    });
  }

  async clear(): Promise<void> {
    await this.request('/vectors/delete', 'POST', {
      deleteAll: true,
      namespace: this.namespace,
    });
  }

  /**
   * Get index statistics
   */
  async stats(): Promise<{
    totalVectorCount: number;
    dimension: number;
    namespaces: Record<string, { vectorCount: number }>;
  }> {
    return this.request('/describe_index_stats', 'POST', {});
  }

  /**
   * Fetch vectors by ID
   */
  async fetch(ids: string[]): Promise<Map<string, Document>> {
    const response = await this.request<{
      vectors: Record<string, {
        id: string;
        values: number[];
        metadata?: Record<string, unknown>;
      }>;
    }>('/vectors/fetch', 'POST', {
      ids,
      namespace: this.namespace,
    });

    const result = new Map<string, Document>();
    for (const [id, vector] of Object.entries(response.vectors)) {
      result.set(id, {
        id,
        content: (vector.metadata?.content as string) || '',
        metadata: vector.metadata,
        embedding: vector.values,
      });
    }
    return result;
  }
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
export class ChromaVectorStore implements VectorStore {
  name = 'chroma';
  private config: ChromaConfig;
  private collectionId: string | null = null;
  private tenant: string;
  private database: string;

  constructor(config: ChromaConfig) {
    this.config = config;
    this.tenant = config.tenant || 'default_tenant';
    this.database = config.database || 'default_database';
  }

  private get baseUrl(): string {
    return `${this.config.url}/api/v1`;
  }

  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: unknown
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Chroma API error: ${response.status} - ${error}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  /**
   * Ensure collection exists and get its ID
   */
  private async ensureCollection(): Promise<string> {
    if (this.collectionId) return this.collectionId;

    try {
      // Try to get existing collection
      const collection = await this.request<{ id: string }>(
        `/collections/${this.config.collectionName}?tenant=${this.tenant}&database=${this.database}`
      );
      this.collectionId = collection.id;
    } catch {
      // Create collection if it doesn't exist
      const collection = await this.request<{ id: string }>(
        `/collections?tenant=${this.tenant}&database=${this.database}`,
        'POST',
        { name: this.config.collectionName }
      );
      this.collectionId = collection.id;
    }

    return this.collectionId;
  }

  async add(documents: Document[]): Promise<void> {
    if (documents.length === 0) return;

    const collectionId = await this.ensureCollection();

    // Validate embeddings
    for (const doc of documents) {
      if (!doc.embedding) {
        throw new Error(`Document ${doc.id} missing embedding`);
      }
    }

    // Chroma add format
    await this.request(
      `/collections/${collectionId}/add`,
      'POST',
      {
        ids: documents.map(d => d.id),
        embeddings: documents.map(d => d.embedding!),
        documents: documents.map(d => d.content),
        metadatas: documents.map(d => d.metadata || {}),
      }
    );
  }

  async search(query: number[], topK = 5): Promise<SearchResult[]> {
    const collectionId = await this.ensureCollection();

    const response = await this.request<{
      ids: string[][];
      distances: number[][];
      documents: (string | null)[][];
      metadatas: (Record<string, unknown> | null)[][];
    }>(
      `/collections/${collectionId}/query`,
      'POST',
      {
        query_embeddings: [query],
        n_results: topK,
        include: ['documents', 'metadatas', 'distances'],
      }
    );

    // Chroma returns nested arrays (one per query)
    const ids = response.ids[0] || [];
    const distances = response.distances[0] || [];
    const documents = response.documents[0] || [];
    const metadatas = response.metadatas[0] || [];

    return ids.map((id, i) => ({
      document: {
        id,
        content: documents[i] || '',
        metadata: metadatas[i] || undefined,
      },
      // Chroma returns L2 distance, convert to similarity score (0-1)
      score: 1 / (1 + (distances[i] || 0)),
    }));
  }

  async delete(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const collectionId = await this.ensureCollection();

    await this.request(
      `/collections/${collectionId}/delete`,
      'POST',
      { ids }
    );
  }

  async clear(): Promise<void> {
    try {
      // Delete and recreate collection
      await this.request(
        `/collections/${this.config.collectionName}?tenant=${this.tenant}&database=${this.database}`,
        'DELETE'
      );
      this.collectionId = null;
    } catch {
      // Collection might not exist
    }
  }

  /**
   * Get collection info
   */
  async info(): Promise<{ id: string; name: string; count: number }> {
    const collectionId = await this.ensureCollection();
    const count = await this.request<number>(
      `/collections/${collectionId}/count`
    );
    return {
      id: collectionId,
      name: this.config.collectionName,
      count,
    };
  }

  /**
   * Update documents
   */
  async update(documents: Document[]): Promise<void> {
    if (documents.length === 0) return;

    const collectionId = await this.ensureCollection();

    await this.request(
      `/collections/${collectionId}/update`,
      'POST',
      {
        ids: documents.map(d => d.id),
        embeddings: documents.filter(d => d.embedding).map(d => d.embedding),
        documents: documents.map(d => d.content),
        metadatas: documents.map(d => d.metadata || {}),
      }
    );
  }

  /**
   * Get documents by ID
   */
  async get(ids: string[]): Promise<Document[]> {
    const collectionId = await this.ensureCollection();

    const response = await this.request<{
      ids: string[];
      documents: (string | null)[];
      metadatas: (Record<string, unknown> | null)[];
      embeddings: (number[] | null)[];
    }>(
      `/collections/${collectionId}/get`,
      'POST',
      {
        ids,
        include: ['documents', 'metadatas', 'embeddings'],
      }
    );

    return response.ids.map((id, i) => ({
      id,
      content: response.documents[i] || '',
      metadata: response.metadatas[i] || undefined,
      embedding: response.embeddings[i] || undefined,
    }));
  }
}

export interface QdrantConfig {
  url: string;
  collectionName: string;
  apiKey?: string;
}

export class QdrantVectorStore implements VectorStore {
  name = 'qdrant';
  private config: QdrantConfig;

  constructor(config: QdrantConfig) {
    this.config = config;
  }

  async add(documents: Document[]): Promise<void> {
    console.log(`Adding ${documents.length} documents to Qdrant`);
  }

  async search(query: number[], topK = 5): Promise<SearchResult[]> {
    return [];
  }

  async delete(ids: string[]): Promise<void> {}
  async clear(): Promise<void> {}
}

// ============================================================================
// RAG Pipeline
// ============================================================================

export class RAGPipeline {
  private provider: EmbeddingAIProvider;
  private vectorStore: VectorStore;
  private topK: number;
  private minScore: number;
  private systemPrompt: string;

  constructor(options: RAGOptions) {
    this.provider = options.provider as EmbeddingAIProvider;
    this.vectorStore = options.vectorStore;
    this.topK = options.topK || 5;
    this.minScore = options.minScore || 0.7;
    this.systemPrompt = options.systemPrompt ||
      'You are a helpful assistant. Use the following context to answer questions. If the context doesn\'t contain relevant information, say so.';
  }

  async ingest(documents: Document[]): Promise<void> {
    if (!this.provider.embed) {
      throw new Error('Provider does not support embeddings');
    }

    const contents = documents.map(d => d.content);
    const embeddings = await this.provider.embed(contents);

    const docsWithEmbeddings = documents.map((doc, i) => ({
      ...doc,
      embedding: embeddings[i]!,
    }));

    await this.vectorStore.add(docsWithEmbeddings);
  }

  async query(question: string): Promise<{ answer: string; sources: SearchResult[] }> {
    if (!this.provider.embed) {
      throw new Error('Provider does not support embeddings');
    }

    // Get embedding for question
    const [questionEmbedding] = await this.provider.embed([question]);

    // Search for relevant documents
    const results = await this.vectorStore.search(questionEmbedding!, this.topK);
    const relevantResults = results.filter(r => r.score >= this.minScore);

    // Build context
    const context = relevantResults
      .map((r, i) => `[${i + 1}] ${r.document.content}`)
      .join('\n\n');

    // Generate answer using generateCompletion
    const prompt = `${question}\n\nContext:\n${context}`;

    const response = await this.provider.generateCompletion(prompt, {
      systemPrompt: this.systemPrompt,
    });

    return {
      answer: response,
      sources: relevantResults,
    };
  }

  async clear(): Promise<void> {
    await this.vectorStore.clear();
  }
}

// ============================================================================
// Document Loaders
// ============================================================================

export interface DocumentLoader {
  load(): Promise<Document[]>;
}

export class TextLoader implements DocumentLoader {
  private content: string;
  private metadata?: Record<string, any>;

  constructor(content: string, metadata?: Record<string, any>) {
    this.content = content;
    if (metadata !== undefined) this.metadata = metadata;
  }

  async load(): Promise<Document[]> {
    const doc: Document = {
      id: generateId(),
      content: this.content,
    };
    if (this.metadata !== undefined) doc.metadata = this.metadata;
    return [doc];
  }
}

export class JSONLoader implements DocumentLoader {
  private data: any;
  private contentKey: string;

  constructor(data: any, contentKey = 'content') {
    this.data = data;
    this.contentKey = contentKey;
  }

  async load(): Promise<Document[]> {
    const items = Array.isArray(this.data) ? this.data : [this.data];
    return items.map(item => ({
      id: item.id || generateId(),
      content: item[this.contentKey] || JSON.stringify(item),
      metadata: item,
    }));
  }
}

export class MarkdownLoader implements DocumentLoader {
  private content: string;

  constructor(content: string) {
    this.content = content;
  }

  async load(): Promise<Document[]> {
    // Split by headers
    const sections = this.content.split(/^#{1,3}\s+/m).filter(Boolean);

    return sections.map(section => ({
      id: generateId(),
      content: section.trim(),
      metadata: { type: 'markdown' },
    }));
  }
}

// ============================================================================
// Text Splitters
// ============================================================================

export interface TextSplitter {
  split(text: string): string[];
}

export class RecursiveCharacterSplitter implements TextSplitter {
  private chunkSize: number;
  private chunkOverlap: number;
  private separators: string[];

  constructor(options: {
    chunkSize?: number;
    chunkOverlap?: number;
    separators?: string[];
  } = {}) {
    this.chunkSize = options.chunkSize || 1000;
    this.chunkOverlap = options.chunkOverlap || 200;
    this.separators = options.separators || ['\n\n', '\n', '. ', ' ', ''];
  }

  split(text: string): string[] {
    const chunks: string[] = [];

    const splitRecursive = (text: string, separatorIndex: number): string[] => {
      if (text.length <= this.chunkSize) {
        return [text];
      }

      const separator = this.separators[separatorIndex]!;
      if (separator === '') {
        // Last resort: split by character
        const result: string[] = [];
        for (let i = 0; i < text.length; i += this.chunkSize - this.chunkOverlap) {
          result.push(text.slice(i, i + this.chunkSize));
        }
        return result;
      }

      const parts = text.split(separator);
      const result: string[] = [];
      let current = '';

      for (const part of parts) {
        if ((current + separator + part).length <= this.chunkSize) {
          current = current ? current + separator + part : part;
        } else {
          if (current) result.push(current);
          if (part.length > this.chunkSize) {
            result.push(...splitRecursive(part, separatorIndex + 1));
            current = '';
          } else {
            current = part;
          }
        }
      }

      if (current) result.push(current);
      return result;
    };

    return splitRecursive(text, 0);
  }
}

export class TokenSplitter implements TextSplitter {
  private maxTokens: number;
  private overlap: number;

  constructor(options: { maxTokens?: number; overlap?: number } = {}) {
    this.maxTokens = options.maxTokens || 500;
    this.overlap = options.overlap || 50;
  }

  split(text: string): string[] {
    // Simple approximation: ~4 chars per token
    const charsPerToken = 4;
    const chunkSize = this.maxTokens * charsPerToken;
    const overlap = this.overlap * charsPerToken;

    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      chunks.push(text.slice(i, i + chunkSize));
    }

    return chunks;
  }
}

// ============================================================================
// useRAG Hook
// ============================================================================

export function useRAG(options: RAGOptions) {
  const pipeline = new RAGPipeline(options);

  const sources = signal<SearchResult[]>([]);
  const isLoading = signal(false);
  const error = signal<Error | null>(null);

  const query = async (question: string) => {
    isLoading.set(true);
    error.set(null);

    try {
      const result = await pipeline.query(question);
      sources.set(result.sources);
      return result.answer;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      error.set(e);
      return null;
    } finally {
      isLoading.set(false);
    }
  };

  const ingest = async (documents: Document[]) => {
    isLoading.set(true);
    try {
      await pipeline.ingest(documents);
    } catch (err) {
      error.set(err instanceof Error ? err : new Error(String(err)));
    } finally {
      isLoading.set(false);
    }
  };

  return {
    query,
    ingest,
    sources: () => sources(),
    isLoading: () => isLoading(),
    error: () => error(),
    clear: () => pipeline.clear(),
  };
}

// ============================================================================
// Utilities
// ============================================================================

function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i]! - b[i]!) ** 2;
  }
  return Math.sqrt(sum);
}
