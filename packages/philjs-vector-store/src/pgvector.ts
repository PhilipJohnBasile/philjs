/**
 * PhilJS pgvector Support
 */

import { signal } from '@philjs/core';

export interface VectorSearchOptions {
    vector: number[];
    limit?: number;
    threshold?: number;
}

export function usePgVector(pool: any, tableName: string) {
    const results = signal<any[]>([]);
    const loading = signal(false);

    const search = async (options: VectorSearchOptions) => {
        loading.set(true);
        const { vector, limit = 10, threshold = 0.8 } = options;

        const query = `
      SELECT *, 1 - (embedding <=> $1::vector) as similarity
      FROM ${tableName}
      WHERE 1 - (embedding <=> $1::vector) > $2
      ORDER BY embedding <=> $1::vector
      LIMIT $3
    `;

        const result = await pool.query(query, [`[${vector.join(',')}]`, threshold, limit]);
        results.set(result.rows);
        loading.set(false);
        return result.rows;
    };

    const insert = async (data: { id: string; embedding: number[]; metadata?: any }) => {
        const query = `
      INSERT INTO ${tableName} (id, embedding, metadata)
      VALUES ($1, $2::vector, $3)
      ON CONFLICT (id) DO UPDATE SET embedding = $2::vector, metadata = $3
    `;
        await pool.query(query, [data.id, `[${data.embedding.join(',')}]`, data.metadata || {}]);
    };

    return { results, loading, search, insert };
}

export function createPgVectorTable(pool: any, tableName: string, dimensions: number) {
    return pool.query(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id TEXT PRIMARY KEY,
      embedding vector(${dimensions}),
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS ${tableName}_embedding_idx ON ${tableName} USING ivfflat (embedding vector_cosine_ops);
  `);
}
