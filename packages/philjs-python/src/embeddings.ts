/**
 * Vector Embeddings Integration for PhilJS Python
 */

import type { EmbeddingsConfig, EmbeddingsRequest, EmbeddingsResponse } from './types.js';

/**
 * Embeddings client for generating vector embeddings via Python backend
 */
export class Embeddings {
  private config: EmbeddingsConfig;
  private baseUrl: string;

  constructor(config: EmbeddingsConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'http://localhost:8000';
  }

  /**
   * Generate embeddings for text input
   */
  async generate(request: EmbeddingsRequest): Promise<EmbeddingsResponse> {
    const response = await fetch(`${this.baseUrl}/v1/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify({
        model: request.model || this.config.model,
        input: request.input,
        dimensions: request.dimensions ?? this.config.dimensions,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Embeddings request failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Generate embeddings for a single text
   */
  async embed(text: string): Promise<number[]> {
    const response = await this.generate({
      model: this.config.model,
      input: text,
    });
    return response.embeddings[0];
  }

  /**
   * Generate embeddings for multiple texts
   */
  async embedMany(texts: string[]): Promise<number[][]> {
    const response = await this.generate({
      model: this.config.model,
      input: texts,
    });
    return response.embeddings;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  static cosineSimilarity(a: number[], b: number[]): number {
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

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Find most similar texts from a corpus
   */
  async findSimilar(
    query: string,
    corpus: string[],
    topK = 5
  ): Promise<Array<{ text: string; score: number }>> {
    const [queryEmbedding, corpusEmbeddings] = await Promise.all([
      this.embed(query),
      this.embedMany(corpus),
    ]);

    const scores = corpusEmbeddings.map((embedding, index) => ({
      text: corpus[index],
      score: Embeddings.cosineSimilarity(queryEmbedding, embedding),
    }));

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

/**
 * Create a configured Embeddings client
 */
export function createEmbeddings(config: EmbeddingsConfig): Embeddings {
  return new Embeddings(config);
}

/**
 * Default embeddings instance using environment variables
 */
export const embeddings = new Embeddings({
  provider: 'openai',
  model: process.env.PHILJS_EMBEDDINGS_MODEL || 'text-embedding-3-small',
  apiKey: process.env.OPENAI_API_KEY,
  baseUrl: process.env.PHILJS_EMBEDDINGS_URL || 'http://localhost:8000',
});
