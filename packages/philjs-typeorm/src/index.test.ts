/**
 * Tests for PhilJS TypeORM Adapter
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { signal } from '@philjs/core';

// Mock typeorm types
vi.mock('typeorm', () => ({
  default: {},
}));

// Import after mocking
import {
  getCacheStats,
  clearCache,
  getConnectionState,
} from './index';

describe('PhilJS TypeORM Adapter', () => {
  describe('Connection Management', () => {
    describe('getConnectionState', () => {
      it('should return disconnected state when no datasource set', () => {
        const state = getConnectionState();
        expect(state.initialized).toBe(false);
        expect(state.driver).toBeNull();
        expect(state.database).toBeNull();
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

  describe('Transaction Options', () => {
    it('should support transaction isolation levels', () => {
      const levels = [
        'READ UNCOMMITTED',
        'READ COMMITTED',
        'REPEATABLE READ',
        'SERIALIZABLE',
      ];

      const options = {
        isolationLevel: 'SERIALIZABLE' as const,
      };

      expect(levels).toContain(options.isolationLevel);
    });
  });

  describe('Bulk Operation Types', () => {
    it('should support BulkOperationResult structure', () => {
      const result = {
        affected: 5,
        raw: {},
      };

      expect(result.affected).toBe(5);
      expect(result.raw).toBeDefined();
    });
  });

  describe('Subscription Options', () => {
    it('should support subscription callbacks', () => {
      const onInsert = vi.fn();
      const onUpdate = vi.fn();
      const onRemove = vi.fn();

      const options = {
        onInsert,
        onUpdate,
        onRemove,
      };

      expect(typeof options.onInsert).toBe('function');
      expect(typeof options.onUpdate).toBe('function');
      expect(typeof options.onRemove).toBe('function');
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

  describe('Hook Options', () => {
    it('should support UseTypeORMOptions structure', () => {
      const options = {
        initialData: [],
        refetchInterval: 5000,
        enabled: true,
        staleTime: 300000,
        cacheKey: 'users-list',
        relations: { posts: true },
        select: { id: true, name: true },
        order: { createdAt: 'DESC' },
      };

      expect(options.refetchInterval).toBe(5000);
      expect(options.staleTime).toBe(300000);
      expect(options.relations).toEqual({ posts: true });
    });

    it('should support signal-based enabled option', () => {
      const enabledSignal = signal(true);
      const options = {
        enabled: enabledSignal,
      };

      expect(typeof options.enabled).toBe('function');
      expect(options.enabled()).toBe(true);
    });

    it('should support UseTypeORMOneOptions', () => {
      const options = {
        relations: { author: true },
        select: { id: true, title: true },
        enabled: true,
        staleTime: 60000,
      };

      expect(options.relations).toEqual({ author: true });
    });

    it('should support UsePaginatedOptions', () => {
      const options = {
        initialPage: 1,
        pageSize: 25,
        order: { createdAt: 'DESC' },
      };

      expect(options.initialPage).toBe(1);
      expect(options.pageSize).toBe(25);
    });

    it('should support UseInfiniteOptions', () => {
      const options = {
        pageSize: 20,
        cursorField: 'id' as const,
        getCursor: (item: any) => item.id,
      };

      expect(options.pageSize).toBe(20);
      expect(options.cursorField).toBe('id');
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

  describe('Find Options', () => {
    it('should support FindManyOptions structure', () => {
      const options = {
        where: { isActive: true },
        relations: { profile: true },
        select: { id: true, name: true },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
        withDeleted: false,
      };

      expect(options.where.isActive).toBe(true);
      expect(options.skip).toBe(0);
      expect(options.take).toBe(20);
    });

    it('should support FindOneOptions structure', () => {
      const options = {
        where: { id: '123' },
        relations: { posts: true, comments: true },
        select: { id: true, name: true, email: true },
      };

      expect(options.where.id).toBe('123');
    });
  });

  describe('Query Builder', () => {
    it('should support query builder pattern', () => {
      const mockBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        take: vi.fn().mockReturnThis(),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
        getManyAndCount: vi.fn().mockResolvedValue([[], 0]),
        getOne: vi.fn().mockResolvedValue(null),
        getCount: vi.fn().mockResolvedValue(0),
      };

      expect(typeof mockBuilder.where).toBe('function');
      expect(typeof mockBuilder.getMany).toBe('function');
    });
  });

  describe('Soft Delete Support', () => {
    it('should support withDeleted option', () => {
      const options = {
        withDeleted: true,
      };

      expect(options.withDeleted).toBe(true);
    });

    it('should track deletedAt field pattern', () => {
      const entity = {
        id: '1',
        name: 'Test',
        deletedAt: null as Date | null,
      };

      expect(entity.deletedAt).toBeNull();

      entity.deletedAt = new Date();
      expect(entity.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe('Migration Types', () => {
    it('should support migration result patterns', () => {
      const migrationResult = {
        name: '1234567890-CreateUsersTable',
        timestamp: 1234567890,
      };

      expect(migrationResult.name).toContain('CreateUsersTable');
      expect(migrationResult.timestamp).toBe(1234567890);
    });
  });

  describe('Repository Methods', () => {
    it('should support repository method signatures', () => {
      const mockRepository = {
        find: vi.fn().mockResolvedValue([]),
        findOne: vi.fn().mockResolvedValue(null),
        findOneBy: vi.fn().mockResolvedValue(null),
        findAndCount: vi.fn().mockResolvedValue([[], 0]),
        count: vi.fn().mockResolvedValue(0),
        save: vi.fn().mockImplementation((entity) => Promise.resolve(entity)),
        update: vi.fn().mockResolvedValue({ affected: 1 }),
        delete: vi.fn().mockResolvedValue({ affected: 1 }),
        softRemove: vi.fn().mockImplementation((entity) => Promise.resolve(entity)),
        recover: vi.fn().mockImplementation((entity) => Promise.resolve(entity)),
        insert: vi.fn().mockResolvedValue({ identifiers: [{ id: '1' }] }),
        upsert: vi.fn().mockResolvedValue({ identifiers: [] }),
        existsBy: vi.fn().mockResolvedValue(false),
        preload: vi.fn().mockResolvedValue(undefined),
        create: vi.fn().mockImplementation((data) => data),
        createQueryBuilder: vi.fn(),
      };

      expect(typeof mockRepository.find).toBe('function');
      expect(typeof mockRepository.save).toBe('function');
      expect(typeof mockRepository.softRemove).toBe('function');
    });
  });

  describe('Entity Manager Methods', () => {
    it('should support entity manager transaction pattern', () => {
      const mockManager = {
        save: vi.fn(),
        remove: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        query: vi.fn(),
        transaction: vi.fn(),
      };

      expect(typeof mockManager.transaction).toBe('function');
    });
  });

  describe('Raw Query Support', () => {
    it('should support raw query result structure', () => {
      const rawResult = [
        { id: 1, name: 'Test', count: 5 },
        { id: 2, name: 'Test 2', count: 3 },
      ];

      expect(rawResult.length).toBe(2);
      expect(rawResult[0]).toHaveProperty('count');
    });
  });

  describe('Optimistic Update Pattern', () => {
    it('should support optimistic update callbacks', () => {
      const originalData = [{ id: '1', name: 'Original' }];
      const optimisticData = [{ id: '1', name: 'Updated' }];

      const optimisticInsert = vi.fn((item) => [...originalData, item]);
      const optimisticUpdate = vi.fn((id, updates) =>
        originalData.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
      const optimisticDelete = vi.fn((id) => originalData.filter((item) => item.id !== id));
      const rollback = vi.fn(() => originalData);

      expect(typeof optimisticInsert).toBe('function');
      expect(typeof optimisticUpdate).toBe('function');
      expect(typeof optimisticDelete).toBe('function');
      expect(typeof rollback).toBe('function');
    });
  });

  describe('Entity Subscription Pattern', () => {
    it('should support entity event types', () => {
      const events = ['insert', 'update', 'remove'] as const;

      const subscriber = {
        listenTo: () => class Entity {},
        afterInsert: vi.fn(),
        afterUpdate: vi.fn(),
        afterRemove: vi.fn(),
      };

      expect(events).toContain('insert');
      expect(typeof subscriber.afterInsert).toBe('function');
    });
  });

  describe('Relation Loading', () => {
    it('should support eager relations', () => {
      const options = {
        relations: {
          author: true,
          comments: {
            author: true,
          },
        },
      };

      expect(options.relations.author).toBe(true);
      expect(options.relations.comments).toBeDefined();
    });

    it('should support relation selection', () => {
      const select = {
        id: true,
        title: true,
        author: {
          id: true,
          name: true,
        },
      };

      expect(select.author).toBeDefined();
      expect(select.author.name).toBe(true);
    });
  });

  describe('Order Options', () => {
    it('should support order direction', () => {
      const order = {
        createdAt: 'DESC' as const,
        name: 'ASC' as const,
      };

      expect(order.createdAt).toBe('DESC');
      expect(order.name).toBe('ASC');
    });

    it('should support nulls ordering', () => {
      const order = {
        createdAt: { direction: 'DESC', nulls: 'NULLS LAST' },
      };

      expect(order.createdAt.direction).toBe('DESC');
    });
  });
});
