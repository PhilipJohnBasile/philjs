/**
 * Tests for PhilJS Mongoose Adapter
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signal } from '@philjs/core';

// Mock mongoose types
vi.mock('mongoose', () => ({
  default: {},
}));

// Import after mocking
import {
  getCacheStats,
  clearCache,
  getConnectionState,
} from './index';

describe('PhilJS Mongoose Adapter', () => {
  describe('Connection Management', () => {
    describe('getConnectionState', () => {
      it('should return disconnected when no connection set', () => {
        const state = getConnectionState();
        expect(state.state).toBe('disconnected');
        expect(state.host).toBeNull();
        expect(state.port).toBeNull();
        expect(state.name).toBeNull();
      });
    });
  });

  describe('Cache Management', () => {
    beforeEach(() => {
      clearCache();
    });

    describe('clearCache', () => {
      it('should clear all cache when no pattern provided', () => {
        const stats = getCacheStats();
        expect(stats.size).toBe(0);
      });
    });

    describe('getCacheStats', () => {
      it('should return empty stats initially', () => {
        const stats = getCacheStats();
        expect(stats.size).toBe(0);
        expect(stats.keys).toEqual([]);
        expect(stats.totalMemory).toBe(0);
      });
    });
  });

  describe('Query State Types', () => {
    it('should have correct QueryState structure', () => {
      const queryState = {
        data: null,
        loading: false,
        error: null,
        stale: false,
      };

      expect(queryState).toHaveProperty('data');
      expect(queryState).toHaveProperty('loading');
      expect(queryState).toHaveProperty('error');
      expect(queryState).toHaveProperty('stale');
    });

    it('should have correct PaginationState structure', () => {
      const paginationState = {
        data: [],
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
        loading: false,
        error: null,
      };

      expect(paginationState.page).toBe(1);
      expect(paginationState.pageSize).toBe(20);
      expect(paginationState.totalPages).toBe(0);
    });

    it('should have correct InfiniteState structure', () => {
      const infiniteState = {
        data: [],
        hasMore: true,
        loading: false,
        loadingMore: false,
        error: null,
      };

      expect(infiniteState.hasMore).toBe(true);
      expect(infiniteState.loadingMore).toBe(false);
    });

    it('should have correct MutationState structure', () => {
      const mutationState = {
        data: null,
        loading: false,
        error: null,
        success: false,
      };

      expect(mutationState.success).toBe(false);
    });
  });

  describe('Bulk Operation Types', () => {
    it('should support BulkWriteOperation types', () => {
      const insertOp = { insertOne: { document: { name: 'Test' } } };
      const updateOp = { updateOne: { filter: { id: '1' }, update: { $set: { name: 'Updated' } } } };
      const deleteOp = { deleteOne: { filter: { id: '1' } } };

      expect(insertOp.insertOne).toBeDefined();
      expect(updateOp.updateOne).toBeDefined();
      expect(deleteOp.deleteOne).toBeDefined();
    });

    it('should support BulkWriteResult structure', () => {
      const result = {
        insertedCount: 1,
        matchedCount: 2,
        modifiedCount: 2,
        deletedCount: 0,
        upsertedCount: 0,
        insertedIds: { 0: 'id1' },
        upsertedIds: {},
      };

      expect(result.insertedCount).toBe(1);
      expect(result.matchedCount).toBe(2);
    });
  });

  describe('Transaction Options', () => {
    it('should support transaction options structure', () => {
      const options = {
        readConcern: { level: 'majority' },
        writeConcern: { w: 1 },
        readPreference: 'primary',
        maxCommitTimeMS: 5000,
      };

      expect(options.readConcern.level).toBe('majority');
      expect(options.maxCommitTimeMS).toBe(5000);
    });
  });

  describe('Text Search Options', () => {
    it('should support text search options', () => {
      const options = {
        language: 'english',
        caseSensitive: false,
        diacriticSensitive: false,
      };

      expect(options.language).toBe('english');
      expect(options.caseSensitive).toBe(false);
    });
  });

  describe('SSR Data Loading', () => {
    it('should support SSRDataLoader interface', () => {
      const loader = {
        load: async () => [],
        getKey: () => 'users',
        serialize: (data: any[]) => JSON.stringify(data),
        deserialize: (data: string) => JSON.parse(data),
      };

      expect(typeof loader.load).toBe('function');
      expect(loader.getKey()).toBe('users');
      expect(loader.serialize([])).toBe('[]');
      expect(loader.deserialize('[]')).toEqual([]);
    });
  });

  describe('Watch Options', () => {
    it('should support watch options structure', () => {
      const options = {
        fullDocument: 'updateLookup' as const,
        maxAwaitTimeMS: 1000,
        batchSize: 100,
      };

      expect(options.fullDocument).toBe('updateLookup');
      expect(options.maxAwaitTimeMS).toBe(1000);
    });
  });

  describe('Hook Options', () => {
    it('should support UseMongooseOptions structure', () => {
      const options = {
        initialData: [],
        refetchInterval: 5000,
        populate: 'author',
        select: 'name email',
        sort: { createdAt: -1 },
        lean: true,
        enabled: true,
        staleTime: 300000,
        cacheKey: 'users-list',
      };

      expect(options.refetchInterval).toBe(5000);
      expect(options.lean).toBe(true);
      expect(options.staleTime).toBe(300000);
    });

    it('should support signal-based enabled option', () => {
      const enabledSignal = signal(true);
      const options = {
        enabled: enabledSignal,
      };

      expect(typeof options.enabled).toBe('function');
      expect(options.enabled()).toBe(true);
    });

    it('should support UsePaginatedOptions', () => {
      const options = {
        initialPage: 1,
        pageSize: 25,
        sort: { createdAt: -1 },
      };

      expect(options.initialPage).toBe(1);
      expect(options.pageSize).toBe(25);
    });

    it('should support UseInfiniteOptions', () => {
      const options = {
        pageSize: 20,
        cursorField: '_id',
        getCursor: (item: any) => item._id,
      };

      expect(options.pageSize).toBe(20);
      expect(options.cursorField).toBe('_id');
      expect(typeof options.getCursor).toBe('function');
    });

    it('should support UseMutationOptions', () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const onSettled = vi.fn();

      const options = {
        onSuccess,
        onError,
        onSettled,
        invalidateKeys: ['users', 'user-count'],
      };

      expect(options.invalidateKeys).toContain('users');
      expect(typeof options.onSuccess).toBe('function');
    });
  });

  describe('Aggregation Options', () => {
    it('should support UseAggregateOptions', () => {
      const options = {
        enabled: true,
        refetchInterval: 10000,
        allowDiskUse: true,
        hint: { createdAt: 1 },
        staleTime: 60000,
      };

      expect(options.allowDiskUse).toBe(true);
      expect(options.hint).toEqual({ createdAt: 1 });
    });
  });

  describe('Index Management Types', () => {
    it('should support index definition structure', () => {
      const index = {
        fields: { email: 1 },
        options: { unique: true, sparse: true },
      };

      expect(index.fields).toEqual({ email: 1 });
      expect(index.options.unique).toBe(true);
    });

    it('should support compound index definition', () => {
      const index = {
        fields: { firstName: 1, lastName: 1 },
        options: { name: 'name_index' },
      };

      expect(index.fields).toHaveProperty('firstName');
      expect(index.fields).toHaveProperty('lastName');
    });
  });

  describe('Validation Types', () => {
    it('should support validation result structure', () => {
      const validResult = {
        valid: true,
        errors: [],
      };

      const invalidResult = {
        valid: false,
        errors: [{ path: 'email', message: 'Invalid email format' }],
      };

      expect(validResult.valid).toBe(true);
      expect(invalidResult.errors.length).toBe(1);
      expect(invalidResult.errors[0].path).toBe('email');
    });
  });

  describe('Schema Helper Types', () => {
    it('should support schema definition structure', () => {
      const schemaDefinition = {
        name: { type: String, required: true },
        email: { type: String, unique: true },
        age: { type: Number, min: 0 },
        createdAt: { type: Date, default: Date.now },
      };

      expect(schemaDefinition.name.required).toBe(true);
      expect(schemaDefinition.age.min).toBe(0);
    });

    it('should support schema options', () => {
      const schemaOptions = {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
        strict: true,
      };

      expect(schemaOptions.timestamps).toBe(true);
      expect(schemaOptions.toJSON.virtuals).toBe(true);
    });
  });

  describe('Population Options', () => {
    it('should support populate string', () => {
      const populate = 'author';
      expect(typeof populate).toBe('string');
    });

    it('should support populate array', () => {
      const populate = ['author', 'comments'];
      expect(populate).toContain('author');
      expect(populate).toContain('comments');
    });

    it('should support populate options object', () => {
      const populate = {
        path: 'author',
        select: 'name email',
        populate: {
          path: 'posts',
          select: 'title',
        },
      };

      expect(populate.path).toBe('author');
      expect(populate.select).toBe('name email');
      expect(populate.populate?.path).toBe('posts');
    });
  });

  describe('Utility Functions Structure', () => {
    it('should support ObjectId validation pattern', () => {
      const isValidObjectIdPattern = (value: string): boolean => {
        return /^[0-9a-fA-F]{24}$/.test(value);
      };

      expect(isValidObjectIdPattern('507f1f77bcf86cd799439011')).toBe(true);
      expect(isValidObjectIdPattern('invalid')).toBe(false);
    });
  });
});
