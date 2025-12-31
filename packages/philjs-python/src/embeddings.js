/**
 * Vector Embeddings Integration for PhilJS Python
 *
 * Full-featured TypeScript client for embedding generation via Python backend.
 * Supports automatic batching, caching, and similarity search operations.
 */
/**
 * Embeddings client for generating vector embeddings via Python backend
 */
export class Embeddings {
    config;
    baseUrl;
    cache;
    cacheEnabled;
    constructor(config) {
        this.config = config;
        this.baseUrl = config.baseUrl || 'http://localhost:8000';
        this.cache = new Map();
        this.cacheEnabled = false;
    }
    /**
     * Enable embedding cache for repeated texts
     */
    enableCache() {
        this.cacheEnabled = true;
        return this;
    }
    /**
     * Disable embedding cache
     */
    disableCache() {
        this.cacheEnabled = false;
        return this;
    }
    /**
     * Clear the embedding cache
     */
    clearCache() {
        this.cache.clear();
        return this;
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            enabled: this.cacheEnabled,
        };
    }
    /**
     * Generate cache key for text
     */
    getCacheKey(text, model, dimensions) {
        return `${model}:${dimensions ?? 'default'}:${text}`;
    }
    /**
     * Generate embeddings for text input with automatic batching
     */
    async generate(request) {
        const model = request.model || this.config.model;
        const dimensions = request.dimensions ?? this.config.dimensions;
        // Handle single string input
        const inputs = Array.isArray(request.input) ? request.input : [request.input];
        // Check cache for already computed embeddings
        const cachedResults = new Map();
        const textsToEmbed = [];
        const indexMapping = new Map();
        if (this.cacheEnabled) {
            for (let i = 0; i < inputs.length; i++) {
                const cacheKey = this.getCacheKey(inputs[i], model, dimensions);
                const cached = this.cache.get(cacheKey);
                if (cached) {
                    cachedResults.set(i, cached);
                }
                else {
                    indexMapping.set(textsToEmbed.length, i);
                    textsToEmbed.push(inputs[i]);
                }
            }
        }
        else {
            for (let i = 0; i < inputs.length; i++) {
                indexMapping.set(i, i);
                textsToEmbed.push(inputs[i]);
            }
        }
        // If all embeddings are cached, return immediately
        if (textsToEmbed.length === 0) {
            const embeddings = [];
            for (let i = 0; i < inputs.length; i++) {
                embeddings.push(cachedResults.get(i));
            }
            return {
                model,
                embeddings,
                usage: { promptTokens: 0, totalTokens: 0 },
            };
        }
        // Make API request for uncached texts
        const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
            },
            body: JSON.stringify({
                model,
                input: textsToEmbed,
                dimensions,
                provider: this.config.provider,
            }),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Embeddings request failed: ${error}`);
        }
        const data = await response.json();
        // Normalize response format
        const apiEmbeddings = data.embeddings;
        // Store in cache if enabled
        if (this.cacheEnabled) {
            for (let i = 0; i < textsToEmbed.length; i++) {
                const cacheKey = this.getCacheKey(textsToEmbed[i], model, dimensions);
                this.cache.set(cacheKey, apiEmbeddings[i]);
            }
        }
        // Merge cached and new embeddings in correct order
        const finalEmbeddings = [];
        let apiIndex = 0;
        for (let i = 0; i < inputs.length; i++) {
            if (cachedResults.has(i)) {
                finalEmbeddings.push(cachedResults.get(i));
            }
            else {
                finalEmbeddings.push(apiEmbeddings[apiIndex++]);
            }
        }
        return {
            model,
            embeddings: finalEmbeddings,
            usage: {
                promptTokens: data.usage?.prompt_tokens ?? data.usage?.promptTokens ?? 0,
                totalTokens: data.usage?.total_tokens ?? data.usage?.totalTokens ?? 0,
            },
        };
    }
    /**
     * Generate embeddings for a single text
     */
    async embed(text) {
        const response = await this.generate({
            model: this.config.model,
            input: text,
        });
        return response.embeddings[0];
    }
    /**
     * Generate embeddings for multiple texts
     */
    async embedMany(texts) {
        const response = await this.generate({
            model: this.config.model,
            input: texts,
        });
        return response.embeddings;
    }
    /**
     * Generate embeddings with progress tracking for large batches
     */
    async embedBatch(texts, options = {}) {
        const { batchSize = 100, onProgress } = options;
        const allEmbeddings = [];
        let totalTokens = 0;
        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize);
            const response = await this.generate({
                model: this.config.model,
                input: batch,
            });
            allEmbeddings.push(...response.embeddings);
            totalTokens += response.usage.totalTokens;
            if (onProgress) {
                onProgress(Math.min(i + batchSize, texts.length), texts.length);
            }
        }
        return { embeddings: allEmbeddings, totalTokens };
    }
    /**
     * Calculate cosine similarity between two vectors
     */
    static cosineSimilarity(a, b) {
        if (a.length !== b.length) {
            throw new Error('Vectors must have same length');
        }
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }
    /**
     * Calculate Euclidean distance between two vectors
     */
    static euclideanDistance(a, b) {
        if (a.length !== b.length) {
            throw new Error('Vectors must have same length');
        }
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            const diff = a[i] - b[i];
            sum += diff * diff;
        }
        return Math.sqrt(sum);
    }
    /**
     * Calculate dot product between two vectors
     */
    static dotProduct(a, b) {
        if (a.length !== b.length) {
            throw new Error('Vectors must have same length');
        }
        let sum = 0;
        for (let i = 0; i < a.length; i++) {
            sum += a[i] * b[i];
        }
        return sum;
    }
    /**
     * Normalize a vector to unit length
     */
    static normalize(vector) {
        const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
        if (magnitude === 0)
            return vector;
        return vector.map(v => v / magnitude);
    }
    /**
     * Find most similar texts from a corpus
     */
    async findSimilar(query, corpus, topK = 5, options) {
        const [queryEmbedding, corpusEmbeddings] = await Promise.all([
            this.embed(query),
            this.embedMany(corpus),
        ]);
        const scores = corpusEmbeddings.map((embedding, index) => {
            const result = {
                text: corpus[index],
                score: Embeddings.cosineSimilarity(queryEmbedding, embedding),
                index,
            };
            if (options?.includeEmbeddings) {
                result.embedding = embedding;
            }
            return result;
        });
        return scores
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }
    /**
     * Find similar items using pre-computed embeddings
     */
    findSimilarFromEmbeddings(queryEmbedding, corpusEmbeddings, texts, topK = 5) {
        if (corpusEmbeddings.length !== texts.length) {
            throw new Error('Corpus embeddings and texts must have same length');
        }
        const scores = corpusEmbeddings.map((embedding, index) => ({
            text: texts[index],
            score: Embeddings.cosineSimilarity(queryEmbedding, embedding),
            index,
        }));
        return scores
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);
    }
    /**
     * Cluster texts by similarity using k-means-like approach
     */
    async clusterTexts(texts, numClusters) {
        if (numClusters > texts.length) {
            throw new Error('Number of clusters cannot exceed number of texts');
        }
        const embeddings = await this.embedMany(texts);
        // Initialize centroids using k-means++ strategy
        const centroids = [];
        const usedIndices = new Set();
        // First centroid: random
        const firstIndex = Math.floor(Math.random() * embeddings.length);
        centroids.push([...embeddings[firstIndex]]);
        usedIndices.add(firstIndex);
        // Remaining centroids: weighted by distance
        while (centroids.length < numClusters) {
            const distances = embeddings.map((emb, i) => {
                if (usedIndices.has(i))
                    return 0;
                return Math.min(...centroids.map(c => Embeddings.euclideanDistance(emb, c)));
            });
            const totalDistance = distances.reduce((a, b) => a + b, 0);
            let random = Math.random() * totalDistance;
            for (let i = 0; i < distances.length; i++) {
                random -= distances[i];
                if (random <= 0 && !usedIndices.has(i)) {
                    centroids.push([...embeddings[i]]);
                    usedIndices.add(i);
                    break;
                }
            }
        }
        // Iterate k-means
        const maxIterations = 50;
        let assignments = new Array(embeddings.length).fill(0);
        for (let iter = 0; iter < maxIterations; iter++) {
            // Assign points to nearest centroid
            const newAssignments = embeddings.map(emb => {
                let minDist = Infinity;
                let nearest = 0;
                for (let c = 0; c < centroids.length; c++) {
                    const dist = Embeddings.euclideanDistance(emb, centroids[c]);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = c;
                    }
                }
                return nearest;
            });
            // Check for convergence
            if (JSON.stringify(assignments) === JSON.stringify(newAssignments)) {
                break;
            }
            assignments = newAssignments;
            // Update centroids
            for (let c = 0; c < centroids.length; c++) {
                const clusterPoints = embeddings.filter((_, i) => assignments[i] === c);
                if (clusterPoints.length > 0) {
                    const dims = clusterPoints[0].length;
                    for (let d = 0; d < dims; d++) {
                        centroids[c][d] = clusterPoints.reduce((sum, p) => sum + p[d], 0) / clusterPoints.length;
                    }
                }
            }
        }
        // Build result
        const clusters = [];
        for (let c = 0; c < numClusters; c++) {
            const indices = assignments
                .map((a, i) => (a === c ? i : -1))
                .filter(i => i !== -1);
            clusters.push({
                centroid: c,
                texts: indices.map(i => texts[i]),
                indices,
            });
        }
        return clusters;
    }
    /**
     * Calculate semantic similarity between two texts
     */
    async similarity(text1, text2) {
        const [emb1, emb2] = await Promise.all([
            this.embed(text1),
            this.embed(text2),
        ]);
        return Embeddings.cosineSimilarity(emb1, emb2);
    }
    /**
     * Deduplicate texts based on semantic similarity threshold
     */
    async deduplicate(texts, similarityThreshold = 0.95) {
        const embeddings = await this.embedMany(texts);
        const unique = [];
        const uniqueEmbeddings = [];
        const duplicates = [];
        for (let i = 0; i < texts.length; i++) {
            let isDuplicate = false;
            let duplicateOf = '';
            for (let j = 0; j < uniqueEmbeddings.length; j++) {
                const similarity = Embeddings.cosineSimilarity(embeddings[i], uniqueEmbeddings[j]);
                if (similarity >= similarityThreshold) {
                    isDuplicate = true;
                    duplicateOf = unique[j];
                    break;
                }
            }
            if (isDuplicate) {
                duplicates.push({ text: texts[i], duplicateOf });
            }
            else {
                unique.push(texts[i]);
                uniqueEmbeddings.push(embeddings[i]);
            }
        }
        return { unique, duplicates };
    }
}
/**
 * Create a configured Embeddings client
 */
export function createEmbeddings(config) {
    return new Embeddings(config);
}
/**
 * Create an OpenAI embeddings client with text-embedding-3-small
 */
export function createOpenAIEmbeddings(options) {
    const config = {
        provider: 'openai',
        model: options?.model || 'text-embedding-3-small',
        baseUrl: options?.baseUrl || 'http://localhost:8000',
    };
    const apiKey = options?.apiKey || process.env['OPENAI_API_KEY'];
    if (apiKey !== undefined) {
        config.apiKey = apiKey;
    }
    if (options?.dimensions !== undefined) {
        config.dimensions = options.dimensions;
    }
    return new Embeddings(config);
}
/**
 * Create an OpenAI embeddings client with text-embedding-3-large
 */
export function createOpenAILargeEmbeddings(options) {
    const config = {
        provider: 'openai',
        model: 'text-embedding-3-large',
        dimensions: options?.dimensions || 3072,
        baseUrl: options?.baseUrl || 'http://localhost:8000',
    };
    const apiKey = options?.apiKey || process.env['OPENAI_API_KEY'];
    if (apiKey !== undefined) {
        config.apiKey = apiKey;
    }
    return new Embeddings(config);
}
/**
 * Default embeddings instance using environment variables
 */
const defaultConfig = {
    provider: 'openai',
    model: process.env['PHILJS_EMBEDDINGS_MODEL'] || 'text-embedding-3-small',
    baseUrl: process.env['PHILJS_EMBEDDINGS_URL'] || 'http://localhost:8000',
};
const defaultApiKey = process.env['OPENAI_API_KEY'];
if (defaultApiKey !== undefined) {
    defaultConfig.apiKey = defaultApiKey;
}
export const embeddings = new Embeddings(defaultConfig);
//# sourceMappingURL=embeddings.js.map