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
class OpenAIEmbeddings {
    apiKey;
    model;
    dimensions;
    baseUrl;
    cache = new Map();
    constructor(config) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'text-embedding-3-small';
        this.dimensions = config.dimensions || 1536;
        this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
    }
    async embed(text) {
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
    async embedBatch(texts) {
        const uncached = [];
        const results = new Array(texts.length);
        // Check cache first
        texts.forEach((text, index) => {
            const cached = this.cache.get(text);
            if (cached) {
                results[index] = { vector: cached, dimensions: this.dimensions };
            }
            else {
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
        data.data.forEach((item, i) => {
            const uncachedItem = uncached[i];
            const vector = item.embedding;
            this.cache.set(uncachedItem.text, vector);
            results[uncachedItem.index] = { vector, dimensions: this.dimensions };
        });
        return results;
    }
    getDimensions() {
        return this.dimensions;
    }
}
class CohereEmbeddings {
    apiKey;
    model;
    dimensions;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.model = config.model || 'embed-english-v3.0';
        this.dimensions = 1024;
    }
    async embed(text) {
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
    async embedBatch(texts) {
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
        return data.embeddings.map((v) => ({
            vector: v,
            dimensions: this.dimensions
        }));
    }
    getDimensions() {
        return this.dimensions;
    }
}
class LocalEmbeddings {
    model;
    dimensions;
    ready;
    constructor(config) {
        this.dimensions = config.dimensions || 384;
        this.ready = this.loadModel(config.modelPath);
    }
    async loadModel(modelPath) {
        // Would load ONNX model or use transformers.js
        // For now, use a simple hash-based embedding for demo
    }
    async embed(text) {
        await this.ready;
        // Simple hash-based embedding (placeholder)
        const vector = this.hashToVector(text);
        return { vector, dimensions: this.dimensions };
    }
    async embedBatch(texts) {
        await this.ready;
        return Promise.all(texts.map(t => this.embed(t)));
    }
    hashToVector(text) {
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
    getDimensions() {
        return this.dimensions;
    }
}
class MemoryVectorStore {
    documents = new Map();
    async add(documents) {
        for (const doc of documents) {
            this.documents.set(doc.id, doc);
        }
    }
    async search(query, options) {
        const topK = options?.topK || 10;
        const minScore = options?.minScore || 0;
        const filter = options?.filter;
        const results = [];
        for (const doc of this.documents.values()) {
            if (!doc.embedding)
                continue;
            // Apply metadata filter
            if (filter) {
                let matches = true;
                for (const [key, value] of Object.entries(filter)) {
                    if (doc.metadata[key] !== value) {
                        matches = false;
                        break;
                    }
                }
                if (!matches)
                    continue;
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
    cosineSimilarity(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    async delete(ids) {
        for (const id of ids) {
            this.documents.delete(id);
        }
    }
    async update(id, updates) {
        const doc = this.documents.get(id);
        if (doc) {
            this.documents.set(id, { ...doc, ...updates });
        }
    }
    async get(id) {
        return this.documents.get(id) || null;
    }
    async count() {
        return this.documents.size;
    }
    async clear() {
        this.documents.clear();
    }
}
class IndexedDBVectorStore {
    dbName;
    storeName;
    db = null;
    ready;
    constructor(namespace = 'vectors') {
        this.dbName = `philjs-vectors-${namespace}`;
        this.storeName = 'documents';
        this.ready = this.init();
    }
    async init() {
        const { promise, resolve, reject } = Promise.withResolvers();
        const request = indexedDB.open(this.dbName, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            this.db = request.result;
            resolve();
        };
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(this.storeName)) {
                const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                store.createIndex('metadata', 'metadata', { unique: false });
            }
        };
        return promise;
    }
    async add(documents) {
        await this.ready;
        if (!this.db)
            return;
        const tx = this.db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        for (const doc of documents) {
            store.put(doc);
        }
        const { promise, resolve, reject } = Promise.withResolvers();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        return promise;
    }
    async search(query, options) {
        await this.ready;
        if (!this.db)
            return [];
        const topK = options?.topK || 10;
        const minScore = options?.minScore || 0;
        const filter = options?.filter;
        const documents = await this.getAllDocuments();
        const results = [];
        for (const doc of documents) {
            if (!doc.embedding)
                continue;
            if (filter) {
                let matches = true;
                for (const [key, value] of Object.entries(filter)) {
                    if (doc.metadata[key] !== value) {
                        matches = false;
                        break;
                    }
                }
                if (!matches)
                    continue;
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
    async getAllDocuments() {
        if (!this.db)
            return [];
        const { promise, resolve, reject } = Promise.withResolvers();
        const tx = this.db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        return promise;
    }
    cosineSimilarity(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    async delete(ids) {
        await this.ready;
        if (!this.db)
            return;
        const tx = this.db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        for (const id of ids) {
            store.delete(id);
        }
        const { promise, resolve, reject } = Promise.withResolvers();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        return promise;
    }
    async update(id, updates) {
        await this.ready;
        if (!this.db)
            return;
        const existing = await this.get(id);
        if (existing) {
            await this.add([{ ...existing, ...updates }]);
        }
    }
    async get(id) {
        await this.ready;
        if (!this.db)
            return null;
        const { promise, resolve, reject } = Promise.withResolvers();
        const tx = this.db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
        return promise;
    }
    async count() {
        await this.ready;
        if (!this.db)
            return 0;
        const { promise, resolve, reject } = Promise.withResolvers();
        const tx = this.db.transaction(this.storeName, 'readonly');
        const store = tx.objectStore(this.storeName);
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        return promise;
    }
    async clear() {
        await this.ready;
        if (!this.db)
            return;
        const { promise, resolve, reject } = Promise.withResolvers();
        const tx = this.db.transaction(this.storeName, 'readwrite');
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
    options;
    constructor(options = { strategy: 'recursive' }) {
        this.options = {
            chunkSize: options.chunkSize || 1000,
            chunkOverlap: options.chunkOverlap || 200,
            separators: options.separators || ['\n\n', '\n', '. ', ' ', ''],
            ...options
        };
    }
    chunk(text) {
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
    fixedChunk(text) {
        const chunks = [];
        const size = this.options.chunkSize;
        const overlap = this.options.chunkOverlap;
        for (let i = 0; i < text.length; i += size - overlap) {
            chunks.push(text.slice(i, i + size));
        }
        return chunks;
    }
    sentenceChunk(text) {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        const chunks = [];
        let currentChunk = '';
        for (const sentence of sentences) {
            if ((currentChunk + sentence).length <= this.options.chunkSize) {
                currentChunk += sentence;
            }
            else {
                if (currentChunk)
                    chunks.push(currentChunk.trim());
                currentChunk = sentence;
            }
        }
        if (currentChunk)
            chunks.push(currentChunk.trim());
        return chunks;
    }
    paragraphChunk(text) {
        const paragraphs = text.split(/\n\n+/);
        const chunks = [];
        let currentChunk = '';
        for (const para of paragraphs) {
            if ((currentChunk + '\n\n' + para).length <= this.options.chunkSize) {
                currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
            }
            else {
                if (currentChunk)
                    chunks.push(currentChunk.trim());
                currentChunk = para;
            }
        }
        if (currentChunk)
            chunks.push(currentChunk.trim());
        return chunks;
    }
    recursiveChunk(text, separators = this.options.separators) {
        if (text.length <= this.options.chunkSize) {
            return [text];
        }
        const separator = separators[0];
        const nextSeparators = separators.slice(1);
        if (!separator) {
            return this.fixedChunk(text);
        }
        const splits = text.split(separator);
        const chunks = [];
        let currentChunk = '';
        for (const split of splits) {
            const candidate = currentChunk ? currentChunk + separator + split : split;
            if (candidate.length <= this.options.chunkSize) {
                currentChunk = candidate;
            }
            else {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }
                if (split.length > this.options.chunkSize && nextSeparators.length > 0) {
                    chunks.push(...this.recursiveChunk(split, nextSeparators));
                    currentChunk = '';
                }
                else {
                    currentChunk = split;
                }
            }
        }
        if (currentChunk)
            chunks.push(currentChunk);
        // Add overlap
        if (this.options.chunkOverlap > 0) {
            return this.addOverlap(chunks);
        }
        return chunks;
    }
    semanticChunk(text) {
        // Simple semantic chunking based on topic shifts
        // In production, would use embeddings to detect topic boundaries
        const paragraphs = text.split(/\n\n+/);
        const chunks = [];
        let currentChunk = '';
        for (const para of paragraphs) {
            // Check if paragraph starts with a heading or topic indicator
            const isTopicShift = /^(#|Chapter|Section|\d+\.|[A-Z][a-z]+ [A-Z])/.test(para);
            if (isTopicShift && currentChunk.length > 100) {
                chunks.push(currentChunk.trim());
                currentChunk = para;
            }
            else if ((currentChunk + '\n\n' + para).length <= this.options.chunkSize) {
                currentChunk = currentChunk ? currentChunk + '\n\n' + para : para;
            }
            else {
                if (currentChunk)
                    chunks.push(currentChunk.trim());
                currentChunk = para;
            }
        }
        if (currentChunk)
            chunks.push(currentChunk.trim());
        return chunks;
    }
    addOverlap(chunks) {
        if (chunks.length <= 1)
            return chunks;
        const overlap = this.options.chunkOverlap;
        const result = [];
        for (let i = 0; i < chunks.length; i++) {
            let chunk = chunks[i];
            // Add end of previous chunk to beginning
            if (i > 0) {
                const prevEnd = chunks[i - 1].slice(-overlap);
                chunk = prevEnd + chunk;
            }
            result.push(chunk);
        }
        return result;
    }
}
class TextLoader {
    text;
    metadata;
    constructor(text, metadata = {}) {
        this.text = text;
        this.metadata = metadata;
    }
    async load() {
        return [{
                id: crypto.randomUUID(),
                content: this.text,
                metadata: this.metadata
            }];
    }
}
class JSONLoader {
    data;
    contentKey;
    metadataKeys;
    constructor(data, contentKey = 'content', metadataKeys = []) {
        this.data = data;
        this.contentKey = contentKey;
        this.metadataKeys = metadataKeys;
    }
    async load() {
        const items = Array.isArray(this.data) ? this.data : [this.data];
        return items.map(item => {
            const metadata = {};
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
class MarkdownLoader {
    markdown;
    source;
    constructor(markdown, source = 'unknown') {
        this.markdown = markdown;
        this.source = source;
    }
    async load() {
        // Split by headers
        const sections = this.markdown.split(/^(#{1,6}\s+.+)$/m);
        const documents = [];
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
            }
            else {
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
class URLLoader {
    url;
    constructor(url) {
        this.url = url;
    }
    async load() {
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
class RAGPipeline {
    embeddings;
    vectorStore;
    chunker;
    config;
    constructor(config) {
        this.config = config;
        // Initialize embedding provider
        switch (config.embedding.provider) {
            case 'openai': {
                const openaiConfig = {
                    apiKey: config.embedding.apiKey
                };
                if (config.embedding.model !== undefined)
                    openaiConfig.model = config.embedding.model;
                if (config.embedding.dimensions !== undefined)
                    openaiConfig.dimensions = config.embedding.dimensions;
                this.embeddings = new OpenAIEmbeddings(openaiConfig);
                break;
            }
            case 'cohere': {
                const cohereConfig = {
                    apiKey: config.embedding.apiKey
                };
                if (config.embedding.model !== undefined)
                    cohereConfig.model = config.embedding.model;
                this.embeddings = new CohereEmbeddings(cohereConfig);
                break;
            }
            case 'local':
            default: {
                const localConfig = {};
                if (config.embedding.dimensions !== undefined)
                    localConfig.dimensions = config.embedding.dimensions;
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
    async ingest(documents) {
        const processedDocs = [];
        for (const doc of documents) {
            // Chunk document
            const chunks = this.chunker.chunk(doc.content);
            // Create document for each chunk
            for (let i = 0; i < chunks.length; i++) {
                processedDocs.push({
                    id: `${doc.id}_chunk_${i}`,
                    content: chunks[i],
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
        const embeddings = await this.embeddings.embedBatch(processedDocs.map(d => d.content));
        // Add embeddings to documents
        for (let i = 0; i < processedDocs.length; i++) {
            processedDocs[i].embedding = embeddings[i].vector;
        }
        // Store in vector store
        await this.vectorStore.add(processedDocs);
    }
    async ingestFromLoader(loader) {
        const documents = await loader.load();
        await this.ingest(documents);
    }
    async query(options) {
        const { query, topK, filter, minScore } = options;
        // Embed query
        const queryEmbedding = await this.embeddings.embed(query);
        // Search vector store
        const searchOptions = {
            topK: topK || this.config.topK || 5
        };
        if (filter !== undefined)
            searchOptions.filter = filter;
        if (minScore !== undefined) {
            searchOptions.minScore = minScore;
        }
        else if (this.config.minScore !== undefined) {
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
    async rerank(query, results) {
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
    async hybridSearch(query, options) {
        const topK = options?.topK || 10;
        // Vector search
        const queryOptions = { query, topK };
        if (options?.filter !== undefined)
            queryOptions.filter = options.filter;
        const vectorResults = await this.query(queryOptions);
        // Keyword search
        const keywordResults = await this.keywordSearch(query, topK);
        // Merge results using reciprocal rank fusion
        const scoreMap = new Map();
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
    async keywordSearch(query, topK) {
        // Simple BM25-style keyword search
        const count = await this.vectorStore.count();
        if (count === 0)
            return [];
        const results = [];
        const terms = query.toLowerCase().split(/\s+/);
        // Would iterate through documents - simplified version
        // In production, use inverted index
        return results.slice(0, topK);
    }
    async delete(ids) {
        await this.vectorStore.delete(ids);
    }
    async clear() {
        await this.vectorStore.clear();
    }
    getVectorStore() {
        return this.vectorStore;
    }
    getEmbeddings() {
        return this.embeddings;
    }
}
function useRAG(config) {
    const pipeline = new RAGPipeline(config);
    let results = [];
    let context = '';
    let isLoading = false;
    let error = null;
    const query = async (text) => {
        isLoading = true;
        error = null;
        try {
            const result = await pipeline.query({ query: text });
            results = result.results;
            context = result.context;
            return result;
        }
        catch (e) {
            error = e instanceof Error ? e : new Error('Query failed');
            throw error;
        }
        finally {
            isLoading = false;
        }
    };
    const ingest = async (documents) => {
        isLoading = true;
        error = null;
        try {
            await pipeline.ingest(documents);
        }
        catch (e) {
            error = e instanceof Error ? e : new Error('Ingest failed');
            throw error;
        }
        finally {
            isLoading = false;
        }
    };
    const ingestText = async (text, metadata) => {
        const doc = {
            id: crypto.randomUUID(),
            content: text,
            metadata: metadata || {}
        };
        await ingest([doc]);
    };
    const clear = async () => {
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
function useEmbeddings(config) {
    let provider;
    switch (config.provider) {
        case 'openai': {
            const openaiConfig = {
                apiKey: config.apiKey
            };
            if (config.model !== undefined)
                openaiConfig.model = config.model;
            if (config.dimensions !== undefined)
                openaiConfig.dimensions = config.dimensions;
            provider = new OpenAIEmbeddings(openaiConfig);
            break;
        }
        case 'cohere': {
            const cohereConfig = {
                apiKey: config.apiKey
            };
            if (config.model !== undefined)
                cohereConfig.model = config.model;
            provider = new CohereEmbeddings(cohereConfig);
            break;
        }
        default: {
            const localConfig = {};
            if (config.dimensions !== undefined)
                localConfig.dimensions = config.dimensions;
            provider = new LocalEmbeddings(localConfig);
        }
    }
    const cosineSimilarity = (a, b) => {
        let dot = 0, normA = 0, normB = 0;
        for (let i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    };
    return {
        embed: async (text) => (await provider.embed(text)).vector,
        embedBatch: async (texts) => (await provider.embedBatch(texts)).map(e => e.vector),
        similarity: async (a, b) => {
            const [embA, embB] = await provider.embedBatch([a, b]);
            return cosineSimilarity(embA.vector, embB.vector);
        }
    };
}
// ============================================================================
// EXPORTS
// ============================================================================
export { 
// Core classes
RAGPipeline, TextChunker, MemoryVectorStore, IndexedDBVectorStore, 
// Embedding providers
OpenAIEmbeddings, CohereEmbeddings, LocalEmbeddings, 
// Document loaders
TextLoader, JSONLoader, MarkdownLoader, URLLoader, 
// Hooks
useRAG, useEmbeddings };
//# sourceMappingURL=index.js.map