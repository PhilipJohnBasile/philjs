/**
 * Integration tests for PhilJS Vector Store
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { VectorStore, cosineSimilarity, euclideanDistance, normalizeVector } from '../src/index';

describe('VectorStore', () => {
  let store: VectorStore;
  const dimensions = 4; // Small dimension for testing

  beforeAll(async () => {
    store = await VectorStore.create({ dimensions });
  });

  describe('creation', () => {
    it('should create a store with specified dimensions', () => {
      expect(store.dimensions).toBe(dimensions);
    });

    it('should default to cosine metric', () => {
      expect(store.metric).toBe('cosine');
    });

    it('should start with zero vectors', () => {
      expect(store.count).toBe(0);
    });
  });

  describe('upsert', () => {
    it('should insert a vector', async () => {
      const vector = [0.1, 0.2, 0.3, 0.4];
      await store.upsert('test-1', vector, { label: 'first' });
      expect(store.count).toBeGreaterThan(0);
    });

    it('should accept Float32Array', async () => {
      const vector = new Float32Array([0.5, 0.6, 0.7, 0.8]);
      await store.upsert('test-2', vector, { label: 'second' });
    });

    it('should reject vectors with wrong dimensions', async () => {
      const wrongVector = [0.1, 0.2]; // Wrong dimension
      await expect(store.upsert('wrong', wrongVector)).rejects.toThrow('dimension mismatch');
    });
  });

  describe('query', () => {
    it('should find similar vectors', async () => {
      const queryVector = [0.1, 0.2, 0.3, 0.4];
      const results = await store.query(queryVector, { k: 5 });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('score');
    });

    it('should respect k parameter', async () => {
      const queryVector = [0.1, 0.2, 0.3, 0.4];
      const results = await store.query(queryVector, { k: 1 });

      expect(results.length).toBeLessThanOrEqual(1);
    });
  });

  describe('batch operations', () => {
    it('should insert multiple vectors', async () => {
      const items = [
        { id: 'batch-1', vector: [0.1, 0.1, 0.1, 0.1] },
        { id: 'batch-2', vector: [0.2, 0.2, 0.2, 0.2] },
        { id: 'batch-3', vector: [0.3, 0.3, 0.3, 0.3] },
      ];

      await store.upsertBatch(items);
    });
  });

  describe('delete', () => {
    it('should delete a vector by id', async () => {
      const id = 'to-delete';
      await store.upsert(id, [0.9, 0.9, 0.9, 0.9]);
      const deleted = await store.delete(id);
      expect(deleted).toBe(true);
    });
  });

  describe('stats', () => {
    it('should return store statistics', async () => {
      const stats = await store.stats();

      expect(stats).toHaveProperty('count');
      expect(stats).toHaveProperty('dimensions');
      expect(stats).toHaveProperty('metric');
      expect(stats.dimensions).toBe(dimensions);
    });
  });
});

describe('Utility Functions', () => {
  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const v = [1, 0, 0, 0];
      expect(cosineSimilarity(v, v)).toBeCloseTo(1);
    });

    it('should return 0 for orthogonal vectors', () => {
      const a = [1, 0, 0, 0];
      const b = [0, 1, 0, 0];
      expect(cosineSimilarity(a, b)).toBeCloseTo(0);
    });

    it('should return -1 for opposite vectors', () => {
      const a = [1, 0, 0, 0];
      const b = [-1, 0, 0, 0];
      expect(cosineSimilarity(a, b)).toBeCloseTo(-1);
    });
  });

  describe('euclideanDistance', () => {
    it('should return 0 for identical vectors', () => {
      const v = [1, 2, 3, 4];
      expect(euclideanDistance(v, v)).toBe(0);
    });

    it('should compute correct distance', () => {
      const a = [0, 0, 0, 0];
      const b = [3, 4, 0, 0];
      expect(euclideanDistance(a, b)).toBe(5); // 3-4-5 triangle
    });
  });

  describe('normalizeVector', () => {
    it('should normalize to unit length', () => {
      const v = [3, 4, 0, 0];
      const normalized = normalizeVector(v);

      const length = Math.sqrt(
        normalized.reduce((sum, val) => sum + val * val, 0)
      );
      expect(length).toBeCloseTo(1);
    });

    it('should preserve direction', () => {
      const v = [2, 0, 0, 0];
      const normalized = normalizeVector(v);

      expect(normalized[0]).toBeCloseTo(1);
      expect(normalized[1]).toBeCloseTo(0);
    });
  });
});
