/**
 * PhilJS AI - RAG (Retrieval Augmented Generation)
 *
 * Vector storage, similarity search, and context augmentation.
 */
import { signal, memo } from 'philjs-core';
// ============================================================================
// In-Memory Vector Store
// ============================================================================
export class InMemoryVectorStore {
    name = 'memory';
    documents = new Map();
    async add(documents) {
        for (const doc of documents) {
            this.documents.set(doc.id, doc);
        }
    }
    async search(query, topK = 5) {
        const results = [];
        for (const doc of this.documents.values()) {
            if (!doc.embedding)
                continue;
            const score = cosineSimilarity(query, doc.embedding);
            results.push({ document: doc, score });
        }
        // ES2023+: Use toSorted for non-mutating sort
        return results
            .toSorted((a, b) => b.score - a.score)
            .slice(0, topK);
    }
    async delete(ids) {
        for (const id of ids) {
            this.documents.delete(id);
        }
    }
    async clear() {
        this.documents.clear();
    }
    getAll() {
        return Array.from(this.documents.values());
    }
}
export class PineconeVectorStore {
    name = 'pinecone';
    config;
    constructor(config) {
        this.config = config;
    }
    async add(documents) {
        // Would integrate with Pinecone SDK
        console.log(`Adding ${documents.length} documents to Pinecone`);
    }
    async search(query, topK = 5) {
        // Would query Pinecone
        return [];
    }
    async delete(ids) {
        // Would delete from Pinecone
    }
    async clear() {
        // Would clear index
    }
}
export class ChromaVectorStore {
    name = 'chroma';
    config;
    constructor(config) {
        this.config = config;
    }
    async add(documents) {
        // Would integrate with ChromaDB
        console.log(`Adding ${documents.length} documents to Chroma`);
    }
    async search(query, topK = 5) {
        return [];
    }
    async delete(ids) { }
    async clear() { }
}
export class QdrantVectorStore {
    name = 'qdrant';
    config;
    constructor(config) {
        this.config = config;
    }
    async add(documents) {
        console.log(`Adding ${documents.length} documents to Qdrant`);
    }
    async search(query, topK = 5) {
        return [];
    }
    async delete(ids) { }
    async clear() { }
}
// ============================================================================
// RAG Pipeline
// ============================================================================
export class RAGPipeline {
    provider;
    vectorStore;
    topK;
    minScore;
    systemPrompt;
    constructor(options) {
        this.provider = options.provider;
        this.vectorStore = options.vectorStore;
        this.topK = options.topK || 5;
        this.minScore = options.minScore || 0.7;
        this.systemPrompt = options.systemPrompt ||
            'You are a helpful assistant. Use the following context to answer questions. If the context doesn\'t contain relevant information, say so.';
    }
    async ingest(documents) {
        if (!this.provider.embed) {
            throw new Error('Provider does not support embeddings');
        }
        const contents = documents.map(d => d.content);
        const embeddings = await this.provider.embed(contents);
        const docsWithEmbeddings = documents.map((doc, i) => ({
            ...doc,
            embedding: embeddings[i],
        }));
        await this.vectorStore.add(docsWithEmbeddings);
    }
    async query(question) {
        if (!this.provider.embed) {
            throw new Error('Provider does not support embeddings');
        }
        // Get embedding for question
        const [questionEmbedding] = await this.provider.embed([question]);
        // Search for relevant documents
        const results = await this.vectorStore.search(questionEmbedding, this.topK);
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
    async clear() {
        await this.vectorStore.clear();
    }
}
export class TextLoader {
    content;
    metadata;
    constructor(content, metadata) {
        this.content = content;
        if (metadata !== undefined)
            this.metadata = metadata;
    }
    async load() {
        const doc = {
            id: generateId(),
            content: this.content,
        };
        if (this.metadata !== undefined)
            doc.metadata = this.metadata;
        return [doc];
    }
}
export class JSONLoader {
    data;
    contentKey;
    constructor(data, contentKey = 'content') {
        this.data = data;
        this.contentKey = contentKey;
    }
    async load() {
        const items = Array.isArray(this.data) ? this.data : [this.data];
        return items.map(item => ({
            id: item.id || generateId(),
            content: item[this.contentKey] || JSON.stringify(item),
            metadata: item,
        }));
    }
}
export class MarkdownLoader {
    content;
    constructor(content) {
        this.content = content;
    }
    async load() {
        // Split by headers
        const sections = this.content.split(/^#{1,3}\s+/m).filter(Boolean);
        return sections.map(section => ({
            id: generateId(),
            content: section.trim(),
            metadata: { type: 'markdown' },
        }));
    }
}
export class RecursiveCharacterSplitter {
    chunkSize;
    chunkOverlap;
    separators;
    constructor(options = {}) {
        this.chunkSize = options.chunkSize || 1000;
        this.chunkOverlap = options.chunkOverlap || 200;
        this.separators = options.separators || ['\n\n', '\n', '. ', ' ', ''];
    }
    split(text) {
        const chunks = [];
        const splitRecursive = (text, separatorIndex) => {
            if (text.length <= this.chunkSize) {
                return [text];
            }
            const separator = this.separators[separatorIndex];
            if (separator === '') {
                // Last resort: split by character
                const result = [];
                for (let i = 0; i < text.length; i += this.chunkSize - this.chunkOverlap) {
                    result.push(text.slice(i, i + this.chunkSize));
                }
                return result;
            }
            const parts = text.split(separator);
            const result = [];
            let current = '';
            for (const part of parts) {
                if ((current + separator + part).length <= this.chunkSize) {
                    current = current ? current + separator + part : part;
                }
                else {
                    if (current)
                        result.push(current);
                    if (part.length > this.chunkSize) {
                        result.push(...splitRecursive(part, separatorIndex + 1));
                        current = '';
                    }
                    else {
                        current = part;
                    }
                }
            }
            if (current)
                result.push(current);
            return result;
        };
        return splitRecursive(text, 0);
    }
}
export class TokenSplitter {
    maxTokens;
    overlap;
    constructor(options = {}) {
        this.maxTokens = options.maxTokens || 500;
        this.overlap = options.overlap || 50;
    }
    split(text) {
        // Simple approximation: ~4 chars per token
        const charsPerToken = 4;
        const chunkSize = this.maxTokens * charsPerToken;
        const overlap = this.overlap * charsPerToken;
        const chunks = [];
        for (let i = 0; i < text.length; i += chunkSize - overlap) {
            chunks.push(text.slice(i, i + chunkSize));
        }
        return chunks;
    }
}
// ============================================================================
// useRAG Hook
// ============================================================================
export function useRAG(options) {
    const pipeline = new RAGPipeline(options);
    const sources = signal([]);
    const isLoading = signal(false);
    const error = signal(null);
    const query = async (question) => {
        isLoading.set(true);
        error.set(null);
        try {
            const result = await pipeline.query(question);
            sources.set(result.sources);
            return result.answer;
        }
        catch (err) {
            const e = err instanceof Error ? err : new Error(String(err));
            error.set(e);
            return null;
        }
        finally {
            isLoading.set(false);
        }
    };
    const ingest = async (documents) => {
        isLoading.set(true);
        try {
            await pipeline.ingest(documents);
        }
        catch (err) {
            error.set(err instanceof Error ? err : new Error(String(err)));
        }
        finally {
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
function generateId() {
    return Math.random().toString(36).slice(2, 11);
}
function cosineSimilarity(a, b) {
    if (a.length !== b.length)
        return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
}
export function euclideanDistance(a, b) {
    if (a.length !== b.length)
        return Infinity;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
}
//# sourceMappingURL=rag.js.map