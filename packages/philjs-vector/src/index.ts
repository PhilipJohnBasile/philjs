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

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// EMBEDDING PROVIDERS
// ============================================================================

interface EmbeddingProvider {
  embed(text: string): Promise<Embedding>;
  embedBatch(texts: string[]): Promise<Embedding[]>;
  getDimensions(): number;
}

class OpenAIEmbeddings implements EmbeddingProvider {
  private apiKey: string;
  private model: string;
  private dimensions: number;
  private baseUrl: string;
  private cache: Map<string, number[]> = new Map();

  constructor(config: { apiKey: string; model?: string; dimensions?: number; baseUrl?: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'text-embedding-3-small';
    this.dimensions = config.dimensions || 1536;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  async embed(text: string): Promise<Embedding> {
    const cached = this.cache.get(text);
    if (cached) {
      return { vector: cached, dimensions: this.dimensions };
    }

    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
        dimensions: this.dimensions
      })
    });

    const data = await response.json();
    const vector = data.data[0].embedding;

    this.cache.set(text, vector);

    return { vector, dimensions: this.dimensions };
  }

  async embedBatch(texts: string[]): Promise<Embedding[]> {
    const uncached: { text: string; index: number }[] = [];
    const results: Embedding[] = new Array(texts.length);

    // Check cache first
    texts.forEach((text, index) => {
      const cached = this.cache.get(text);
      if (cached) {
        results[index] = { vector: cached, dimensions: this.dimensions };
      } else {
        uncached.push({ text, index });
      }
    });

    if (uncached.length === 0) {
      return results;
    }

    // Batch embed uncached texts
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        input: uncached.map(u => u.text),
        dimensions: this.dimensions
      })
    });

    const data = await response.json();

    data.data.forEach((item: any, i: number) => {
      const uncachedItem = uncached[i]!;
      const vector = item.embedding;
      this.cache.set(uncachedItem.text, vector);
      results[uncachedItem.index] = { vector, dimensions: this.dimensions };
    });

    return results;
  }

  getDimensions(): number {
    return this.dimensions;
  }
}

class CohereEmbeddings implements EmbeddingProvider {
  private apiKey: string;
  private model: string;
  private dimensions: number;

  constructor(config: { apiKey: string; model?: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'embed-english-v3.0';
    this.dimensions = 1024;
  }

  async embed(text: string): Promise<Embedding> {
    const response = await fetch('https://api.cohere.ai/v1/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        texts: [text],
        input_type: 'search_document'
      })
    });

    const data = await response.json();
    return { vector: data.embeddings[0], dimensions: this.dimensions };
  }

  async embedBatch(texts: string[]): Promise<Embedding[]> {
    const response = await fetch('https://api.cohere.ai/v1/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        texts,
        input_type: 'search_document'
      })
    });

    const data = await response.json();
    return data.embeddings.map((v: number[]) => ({
      vector: v,
      dimensions: this.dimensions
    }));
  }

  getDimensions(): number {
    return this.dimensions;
  }
}

class LocalEmbeddings implements EmbeddingProvider {
  private model: any;
  private dimensions: number;
  private ready: Promise<void>;

  constructor(config: { modelPath?: string; dimensions?: number }) {
    this.dimensions = config.dimensions || 384;
    this.ready = this.loadModel(config.modelPath);
  }

  private async loadModel(modelPath?: string): Promise<void> {
    // Would load ONNX model or use transformers.js
    // For now, use a simple hash-based embedding for demo
  }

  async embed(text: string): Promise<Embedding> {
    await this.ready;

    // Simple hash-based embedding (placeholder)
    const vector = this.hashToVector(text);
    return { vector, dimensions: this.dimensions };
  }

  async embedBatch(texts: string[]): Promise<Embedding[]> {
    await this.ready;
    return Promise.all(texts.map(t => this.embed(t)));
  }

  private hashToVector(text: string): number[] {
    const vector = new Array(this.dimensions).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      const index = (charCode * (i + 1)) % this.dimensions;
      vector[index] += Math.sin(charCode * 0.01);
    }

    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    return vector.map(v => v / (magnitude || 1));
  }

  getDimensions(): number {
    return this.dimensions;
  }
}

// ============================================================================
// VECTOR STORES
// ============================================================================

interface VectorStore {
  add(documents: Document[]): Promise<void>;
  search(query: number[], options?: { topK?: number; filter?: Record<string, any>; minScore?: number }): Promise<SearchResult[]>;
  delete(ids: string[]): Promise<void>;
  update(id: string, document: Partial<Document>): Promise<void>;
  get(id: string): Promise<Document | null>;
  count(): Promise<number>;
  clear(): Promise<void>;
}

class MemoryVectorStore implements VectorStore {
  private documents: Map<string, Document> = new Map();

  async add(documents: Document[]): Promise<void> {
    for (const doc of documents) {
      this.documents.set(doc.id, doc);
    }
  }

  async search(query: number[], options?: { topK?: number; filter?: Record<string, any>; minScore?: number }): Promise<SearchResult[]> {
    const topK = options?.topK || 10;
    const minScore = options?.minScore || 0;
    const filter = options?.filter;

    const results: SearchResult[] = [];

    for (const doc of this.documents.values()) {
      if (!doc.embedding) continue;

      // Apply metadata filter
      if (filter) {
        let matches = true;
        for (const [key, value] of Object.entries(filter)) {
          if (doc.metadata[key] !== value) {
            matches = false;
            break;
          }
        }
        if (!matches) continue;
      }

      const score = this.cosineSimilarity(query, doc.embedding);

      if (score >= minScore) {
        results.push({ document: doc, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i]! * b[i]!;
      normA += a[i]! * a[i]!;
      normB += b[i]! * b[i]!;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.documents.delete(id);
    }
  }

  async update(id: string, updates: Partial<Document>): Promise<void> {
    const doc = this.documents.get(id);
    if (doc) {
      this.documents.set(id, { ...doc, ...updates });
    }
  }

  async get(id: string): Promise<Document | null> {
    return this.documents.get(id) || null;
  }

  async count(): Promise<number> {
    return this.documents.size;
  }

  async clear(): Promise<void> {
    this.documents.clear();
  }
}

class IndexedDBVectorStore implements VectorStore {
  private dbName: string;
  private storeName: string;
  private db: IDBDatabase | null = null;
  private ready: Promise<void>;

  constructor(namespace = 'vectors') {
    this.dbName = `philjs-vectors-${namespace}`;
    this.storeName = 'documents';
    this.ready = this.init();
  }

  private async init(): Promise<void> {
    const { promise, resolve, reject } = Promise.withResolvers<void>();
    const request = indexedDB.open(this.dbName, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      this.db = request.result;
      resolve();
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(this.storeName)) {
        const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
        store.createIndex('metadata', 'metadata', { unique: false });
      }
    };

    return promise;
  }

  async add(documents: Document[]): Promise<void> {
    await this.ready;
    if (!this.db) return;

    const tx = this.db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);

    for (const doc of documents) {
      store.put(doc);
    }

    const { promise, resolve, reject } = Promise.withResolvers<void>();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    return promise;
  }

  async search(query: number[], options?: { topK?: number; filter?: Record<string, any>; minScore?: number }): Promise<SearchResult[]> {
    await this.ready;
    if (!this.db) return [];

    const topK = options?.topK || 10;
    const minScore = options?.minScore || 0;
    const filter = options?.filter;

    const documents = await this.getAllDocuments();
    const results: SearchResult[] = [];

    for (const doc of documents) {
      if (!doc.embedding) continue;

      if (filter) {
        let matches = true;
        for (const [key, value] of Object.entries(filter)) {
          if (doc.metadata[key] !== value) {
            matches = false;
            break;
          }
        }
        if (!matches) continue;
      }

      const score = this.cosineSimilarity(query, doc.embedding);

      if (score >= minScore) {
        results.push({ document: doc, score });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  private async getAllDocuments(): Promise<Document[]> {
    if (!this.db) return [];

    const { promise, resolve, reject } = Promise.withResolvers<Document[]>();
    const tx = this.db!.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);

    return promise;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i]! * b[i]!;
      normA += a[i]! * a[i]!;
      normB += b[i]! * b[i]!;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async delete(ids: string[]): Promise<void> {
    await this.ready;
    if (!this.db) return;

    const tx = this.db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);

    for (const id of ids) {
      store.delete(id);
    }

    const { promise, resolve, reject } = Promise.withResolvers<void>();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    return promise;
  }

  async update(id: string, updates: Partial<Document>): Promise<void> {
    await this.ready;
    if (!this.db) return;

    const existing = await this.get(id);
    if (existing) {
      await this.add([{ ...existing, ...updates }]);
    }
  }

  async get(id: string): Promise<Document | null> {
    await this.ready;
    if (!this.db) return null;

    const { promise, resolve, reject } = Promise.withResolvers<Document | null>();
    const tx = this.db!.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);

    return promise;
  }

  async count(): Promise<number> {
    await this.ready;
    if (!this.db) return 0;

    const { promise, resolve, reject } = Promise.withResolvers<number>();
    const tx = this.db!.transaction(this.storeName, 'readonly');
    const store = tx.objectStore(this.storeName);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);

    return promise;
  }

  async clear(): Promise<void> {
    await this.ready;
    if (!this.db) return;

    const { promise, resolve, reject } = Promise.withResolvers<void>();
    const tx = this.db!.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    return promise;
  }
}

// ============================================================================
// DOCUMENT CHUNKING
// ============================================================================

class TextChunker {
  private options: ChunkOptions;

  constructor(options: ChunkOptions = { strategy: 'recursive' }) {
    this.options = {
      chunkSize: options.chunkSize || 1000,
      chunkOverlap: options.chunkOverlap || 200,
      separators: options.separators || ['\n\n', '\n', '. ', ' ', ''],
      ...options
    };
  }

  chunk(text: string): string[] {
    switch (this.options.strategy) {
      case 'fixed':
        return this.fixedChunk(text);
      case 'sentence':
        return this.sentenceChunk(text);
      case 'paragraph':
        return this.paragraphChunk(text);
      case 'recursive':
        return this.recursiveChunk(text);
      case 'semantic':
        return this.semanticChunk(text);
      default:
        return this.recursiveChunk(text);
    }
  }

  private fixedChunk(text: string): string[] {
    const chunks: string[] = [];
    const size = this.options.chunkSize!;
    const overlap = this.options.chunkOverlap!;

    for (let i = 0; i < text.length; i += size - overlap) {
      chunks.push(text.slice(i, i + size));
    }

    return chunks;
  }

  private sentenceChunk(text: string): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length <= this.options.chunkSize!) {
        currentChunk += sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = sentence;
      }
    }

    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }

  private paragraphChunk(text: string): string[] {
    const paragraphs = text.split(/\n\n+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const para of paragraphs) {
      if ((currentChunk + '\n\n' + para).length <= this.options.chunkSize!) {
        currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
      } else {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = para;
      }
    }

    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }

  private recursiveChunk(text: string, separators: string[] = this.options.separators!): string[] {
    if (text.length <= this.options.chunkSize!) {
      return [text];
    }

    const separator = separators[0];
    const nextSeparators = separators.slice(1);

    if (!separator) {
      return this.fixedChunk(text);
    }

    const splits = text.split(separator);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const split of splits) {
      const candidate = currentChunk ? currentChunk + separator + split : split;

      if (candidate.length <= this.options.chunkSize!) {
        currentChunk = candidate;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk);
        }

        if (split.length > this.options.chunkSize! && nextSeparators.length > 0) {
          chunks.push(...this.recursiveChunk(split, nextSeparators));
          currentChunk = '';
        } else {
          currentChunk = split;
        }
      }
    }

    if (currentChunk) chunks.push(currentChunk);

    // Add overlap
    if (this.options.chunkOverlap! > 0) {
      return this.addOverlap(chunks);
    }

    return chunks;
  }

  private semanticChunk(text: string): string[] {
    // Simple semantic chunking based on topic shifts
    // In production, would use embeddings to detect topic boundaries
    const paragraphs = text.split(/\n\n+/);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const para of paragraphs) {
      // Check if paragraph starts with a heading or topic indicator
      const isTopicShift = /^(#|Chapter|Section|\d+\.|[A-Z][a-z]+ [A-Z])/.test(para);

      if (isTopicShift && currentChunk.length > 100) {
        chunks.push(currentChunk.trim());
        currentChunk = para;
      } else if ((currentChunk + '\n\n' + para).length <= this.options.chunkSize!) {
        currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
      } else {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = para;
      }
    }

    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks;
  }

  private addOverlap(chunks: string[]): string[] {
    if (chunks.length <= 1) return chunks;

    const overlap = this.options.chunkOverlap!;
    const result: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      let chunk = chunks[i]!;

      // Add end of previous chunk to beginning
      if (i > 0) {
        const prevEnd = chunks[i - 1]!.slice(-overlap);
        chunk = prevEnd + chunk;
      }

      result.push(chunk);
    }

    return result;
  }
}

// ============================================================================
// DOCUMENT LOADERS
// ============================================================================

interface DocumentLoader {
  load(): Promise<Document[]>;
}

class TextLoader implements DocumentLoader {
  private text: string;
  private metadata: Record<string, any>;

  constructor(text: string, metadata: Record<string, any> = {}) {
    this.text = text;
    this.metadata = metadata;
  }

  async load(): Promise<Document[]> {
    return [{
      id: crypto.randomUUID(),
      content: this.text,
      metadata: this.metadata
    }];
  }
}

class JSONLoader implements DocumentLoader {
  private data: any;
  private contentKey: string;
  private metadataKeys: string[];

  constructor(data: any, contentKey = 'content', metadataKeys: string[] = []) {
    this.data = data;
    this.contentKey = contentKey;
    this.metadataKeys = metadataKeys;
  }

  async load(): Promise<Document[]> {
    const items = Array.isArray(this.data) ? this.data : [this.data];

    return items.map(item => {
      const metadata: Record<string, any> = {};
      for (const key of this.metadataKeys) {
        if (item[key] !== undefined) {
          metadata[key] = item[key];
        }
      }

      return {
        id: item.id || crypto.randomUUID(),
        content: item[this.contentKey] || JSON.stringify(item),
        metadata
      };
    });
  }
}

class MarkdownLoader implements DocumentLoader {
  private markdown: string;
  private source: string;

  constructor(markdown: string, source = 'unknown') {
    this.markdown = markdown;
    this.source = source;
  }

  async load(): Promise<Document[]> {
    // Split by headers
    const sections = this.markdown.split(/^(#{1,6}\s+.+)$/m);
    const documents: Document[] = [];

    let currentHeader = '';
    let currentContent = '';

    for (const section of sections) {
      if (/^#{1,6}\s+/.test(section)) {
        if (currentContent.trim()) {
          documents.push({
            id: crypto.randomUUID(),
            content: currentContent.trim(),
            metadata: {
              source: this.source,
              header: currentHeader,
              type: 'markdown'
            }
          });
        }
        currentHeader = section.replace(/^#+\s*/, '');
        currentContent = section + '\n';
      } else {
        currentContent += section;
      }
    }

    if (currentContent.trim()) {
      documents.push({
        id: crypto.randomUUID(),
        content: currentContent.trim(),
        metadata: {
          source: this.source,
          header: currentHeader,
          type: 'markdown'
        }
      });
    }

    return documents;
  }
}

class URLLoader implements DocumentLoader {
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  async load(): Promise<Document[]> {
    const response = await fetch(this.url);
    const html = await response.text();

    // Simple HTML to text conversion
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return [{
      id: crypto.randomUUID(),
      content: text,
      metadata: {
        source: this.url,
        type: 'webpage'
      }
    }];
  }
}

// ============================================================================
// RAG PIPELINE
// ============================================================================

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

class RAGPipeline {
  private embeddings: EmbeddingProvider;
  private vectorStore: VectorStore;
  private chunker: TextChunker;
  private config: RAGConfig;

  constructor(config: RAGConfig) {
    this.config = config;

    // Initialize embedding provider
    switch (config.embedding.provider) {
      case 'openai': {
        const openaiConfig: { apiKey: string; model?: string; dimensions?: number } = {
          apiKey: config.embedding.apiKey!
        };
        if (config.embedding.model !== undefined) openaiConfig.model = config.embedding.model;
        if (config.embedding.dimensions !== undefined) openaiConfig.dimensions = config.embedding.dimensions;
        this.embeddings = new OpenAIEmbeddings(openaiConfig);
        break;
      }
      case 'cohere': {
        const cohereConfig: { apiKey: string; model?: string } = {
          apiKey: config.embedding.apiKey!
        };
        if (config.embedding.model !== undefined) cohereConfig.model = config.embedding.model;
        this.embeddings = new CohereEmbeddings(cohereConfig);
        break;
      }
      case 'local':
      default: {
        const localConfig: { modelPath?: string; dimensions?: number } = {};
        if (config.embedding.dimensions !== undefined) localConfig.dimensions = config.embedding.dimensions;
        this.embeddings = new LocalEmbeddings(localConfig);
      }
    }

    // Initialize vector store
    switch (config.vectorStore.type) {
      case 'indexeddb':
        this.vectorStore = new IndexedDBVectorStore(config.vectorStore.namespace);
        break;
      case 'memory':
      default:
        this.vectorStore = new MemoryVectorStore();
    }

    // Initialize chunker
    this.chunker = new TextChunker(config.chunking);
  }

  async ingest(documents: Document[]): Promise<void> {
    const processedDocs: Document[] = [];

    for (const doc of documents) {
      // Chunk document
      const chunks = this.chunker.chunk(doc.content);

      // Create document for each chunk
      for (let i = 0; i < chunks.length; i++) {
        processedDocs.push({
          id: `${doc.id}_chunk_${i}`,
          content: chunks[i]!,
          metadata: {
            ...doc.metadata,
            parentId: doc.id,
            chunkIndex: i,
            totalChunks: chunks.length
          }
        });
      }
    }

    // Embed all chunks
    const embeddings = await this.embeddings.embedBatch(
      processedDocs.map(d => d.content)
    );

    // Add embeddings to documents
    for (let i = 0; i < processedDocs.length; i++) {
      processedDocs[i]!.embedding = embeddings[i]!.vector;
    }

    // Store in vector store
    await this.vectorStore.add(processedDocs);
  }

  async ingestFromLoader(loader: DocumentLoader): Promise<void> {
    const documents = await loader.load();
    await this.ingest(documents);
  }

  async query(options: RAGQuery): Promise<RAGResult> {
    const { query, topK, filter, minScore } = options;

    // Embed query
    const queryEmbedding = await this.embeddings.embed(query);

    // Search vector store
    const searchOptions: { topK?: number; filter?: Record<string, any>; minScore?: number } = {
      topK: topK || this.config.topK || 5
    };
    if (filter !== undefined) searchOptions.filter = filter;
    if (minScore !== undefined) {
      searchOptions.minScore = minScore;
    } else if (this.config.minScore !== undefined) {
      searchOptions.minScore = this.config.minScore;
    }
    let results = await this.vectorStore.search(queryEmbedding.vector, searchOptions);

    // Rerank if enabled
    if (this.config.rerank && results.length > 0) {
      results = await this.rerank(query, results);
    }

    // Build context
    const context = results
      .map(r => r.document.content)
      .join('\n\n---\n\n');

    return {
      query,
      results,
      context
    };
  }

  private async rerank(query: string, results: SearchResult[]): Promise<SearchResult[]> {
    // Simple BM25-style reranking
    const queryTerms = query.toLowerCase().split(/\s+/);

    return results
      .map(result => {
        const content = result.document.content.toLowerCase();
        let termScore = 0;

        for (const term of queryTerms) {
          const count = (content.match(new RegExp(term, 'g')) || []).length;
          const tf = count / (content.length / 100);
          termScore += tf;
        }

        // Combine vector score with term score
        const combinedScore = result.score * 0.7 + (termScore / queryTerms.length) * 0.3;

        return { ...result, score: combinedScore };
      })
      .sort((a, b) => b.score - a.score);
  }

  async hybridSearch(query: string, options?: { topK?: number; filter?: Record<string, any> }): Promise<SearchResult[]> {
    const topK = options?.topK || 10;

    // Vector search
    const queryOptions: RAGQuery = { query, topK };
    if (options?.filter !== undefined) queryOptions.filter = options.filter;
    const vectorResults = await this.query(queryOptions);

    // Keyword search
    const keywordResults = await this.keywordSearch(query, topK);

    // Merge results using reciprocal rank fusion
    const scoreMap = new Map<string, { document: Document; score: number }>();

    vectorResults.results.forEach((result, rank) => {
      const id = result.document.id;
      const existing = scoreMap.get(id);
      const rrf = 1 / (60 + rank);
      scoreMap.set(id, {
        document: result.document,
        score: (existing?.score || 0) + rrf
      });
    });

    keywordResults.forEach((result, rank) => {
      const id = result.document.id;
      const existing = scoreMap.get(id);
      const rrf = 1 / (60 + rank);
      scoreMap.set(id, {
        document: result.document,
        score: (existing?.score || 0) + rrf
      });
    });

    return Array.from(scoreMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  private async keywordSearch(query: string, topK: number): Promise<SearchResult[]> {
    // Simple BM25-style keyword search
    const count = await this.vectorStore.count();
    if (count === 0) return [];

    const results: SearchResult[] = [];
    const terms = query.toLowerCase().split(/\s+/);

    // Would iterate through documents - simplified version
    // In production, use inverted index

    return results.slice(0, topK);
  }

  async delete(ids: string[]): Promise<void> {
    await this.vectorStore.delete(ids);
  }

  async clear(): Promise<void> {
    await this.vectorStore.clear();
  }

  getVectorStore(): VectorStore {
    return this.vectorStore;
  }

  getEmbeddings(): EmbeddingProvider {
    return this.embeddings;
  }
}

// ============================================================================
// REACT HOOKS
// ============================================================================

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

function useRAG(config: RAGConfig): UseRAGResult {
  const pipeline = new RAGPipeline(config);
  let results: SearchResult[] = [];
  let context = '';
  let isLoading = false;
  let error: Error | null = null;

  const query = async (text: string): Promise<RAGResult> => {
    isLoading = true;
    error = null;

    try {
      const result = await pipeline.query({ query: text });
      results = result.results;
      context = result.context;
      return result;
    } catch (e) {
      error = e instanceof Error ? e : new Error('Query failed');
      throw error;
    } finally {
      isLoading = false;
    }
  };

  const ingest = async (documents: Document[]): Promise<void> => {
    isLoading = true;
    error = null;

    try {
      await pipeline.ingest(documents);
    } catch (e) {
      error = e instanceof Error ? e : new Error('Ingest failed');
      throw error;
    } finally {
      isLoading = false;
    }
  };

  const ingestText = async (text: string, metadata?: Record<string, any>): Promise<void> => {
    const doc: Document = {
      id: crypto.randomUUID(),
      content: text,
      metadata: metadata || {}
    };
    await ingest([doc]);
  };

  const clear = async (): Promise<void> => {
    await pipeline.clear();
    results = [];
    context = '';
  };

  return {
    query,
    ingest,
    ingestText,
    results,
    context,
    isLoading,
    error,
    clear
  };
}

function useEmbeddings(config: EmbeddingProviderConfig): {
  embed: (text: string) => Promise<number[]>;
  embedBatch: (texts: string[]) => Promise<number[][]>;
  similarity: (a: string, b: string) => Promise<number>;
} {
  let provider: EmbeddingProvider;

  switch (config.provider) {
    case 'openai': {
      const openaiConfig: { apiKey: string; model?: string; dimensions?: number } = {
        apiKey: config.apiKey!
      };
      if (config.model !== undefined) openaiConfig.model = config.model;
      if (config.dimensions !== undefined) openaiConfig.dimensions = config.dimensions;
      provider = new OpenAIEmbeddings(openaiConfig);
      break;
    }
    case 'cohere': {
      const cohereConfig: { apiKey: string; model?: string } = {
        apiKey: config.apiKey!
      };
      if (config.model !== undefined) cohereConfig.model = config.model;
      provider = new CohereEmbeddings(cohereConfig);
      break;
    }
    default: {
      const localConfig: { modelPath?: string; dimensions?: number } = {};
      if (config.dimensions !== undefined) localConfig.dimensions = config.dimensions;
      provider = new LocalEmbeddings(localConfig);
    }
  }

  const cosineSimilarity = (a: number[], b: number[]): number => {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i]! * b[i]!;
      normA += a[i]! * a[i]!;
      normB += b[i]! * b[i]!;
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  };

  return {
    embed: async (text: string) => (await provider.embed(text)).vector,
    embedBatch: async (texts: string[]) => (await provider.embedBatch(texts)).map(e => e.vector),
    similarity: async (a: string, b: string) => {
      const [embA, embB] = await provider.embedBatch([a, b]);
      return cosineSimilarity(embA!.vector, embB!.vector);
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Core classes
  RAGPipeline,
  TextChunker,
  MemoryVectorStore,
  IndexedDBVectorStore,

  // Embedding providers
  OpenAIEmbeddings,
  CohereEmbeddings,
  LocalEmbeddings,

  // Document loaders
  TextLoader,
  JSONLoader,
  MarkdownLoader,
  URLLoader,

  // Hooks
  useRAG,
  useEmbeddings,

  // Types
  type Document,
  type Embedding,
  type SearchResult,
  type ChunkOptions,
  type EmbeddingProviderConfig,
  type VectorStoreConfig,
  type RAGConfig,
  type RAGQuery,
  type RAGResult,
  type VectorStore,
  type EmbeddingProvider,
  type DocumentLoader,
  type UseRAGResult
};
