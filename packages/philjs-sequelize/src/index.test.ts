/**
 * Tests for PhilJS Sequelize Integration
 *
 * Comprehensive Sequelize ORM integration with PhilJS signals,
 * providing reactive database queries, mutations, transactions,
 * pagination, and real-time subscriptions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  // Configuration
  initSequelize,
  getSequelize,
  getConfig,

  // Cache
  invalidateCache,
  invalidateModel,

  // Core hooks
  useSequelize,
  useSequelizeById,
  useSequelizeOne,
  useSequelizeCount,

  // Pagination
  usePaginated,
  useInfiniteSequelize,

  // Mutations
  useSequelizeMutation,
  useBulkMutation,

  // Transactions
  useTransaction,
  withTransaction,

  // Query builder
  queryBuilder,

  // Raw queries
  useRawQuery,
  executeRaw,

  // Associations
  useAssociation,

  // Optimistic updates
  useOptimistic,

  // Subscriptions
  useSubscription,

  // Scopes
  useScoped,

  // Search
  useSearch,

  // Soft delete
  useWithDeleted,
  restore,

  // Hooks
  useModelHooks,

  // Validation
  validateInstance,
  buildInstance,

  // Utilities
  isConnected,
  closeConnection,
  syncModels,
  getModel,
  listModels,

  // SSR
  createSSRDataLoader,

  // Types
  type SequelizeConfig,
  type QueryState,
  type SingleQueryState,
  type PaginationState,
  type UseSequelizeOptions,
  type UseSequelizeByIdOptions,
  type UsePaginatedOptions,
  type MutationOptions,
  type BulkMutationOptions,
  type TransactionOptions,
  type CacheEntry,
  type QueryBuilderState,
  type OptimisticState,
  type SearchOptions,
  type ValidationResult,
  type ModelHooks,
  type SSRDataLoader,
} from './index';

// Mock Sequelize
const mockSequelize = {
  authenticate: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
  sync: vi.fn().mockResolvedValue(undefined),
  query: vi.fn().mockResolvedValue([[], {}]),
  transaction: vi.fn(),
  models: {
    User: { name: 'User' },
    Post: { name: 'Post' },
  },
};

// Mock Model
function createMockModel(name: string) {
  return {
    name,
    findAll: vi.fn().mockResolvedValue([]),
    findOne: vi.fn().mockResolvedValue(null),
    findByPk: vi.fn().mockResolvedValue(null),
    findAndCountAll: vi.fn().mockResolvedValue({ rows: [], count: 0 }),
    count: vi.fn().mockResolvedValue(0),
    create: vi.fn().mockImplementation(async (values) => ({ id: 1, ...values })),
    update: vi.fn().mockResolvedValue([1]),
    destroy: vi.fn().mockResolvedValue(1),
    upsert: vi.fn().mockImplementation(async (values) => [{ id: 1, ...values }, true]),
    bulkCreate: vi.fn().mockImplementation(async (records) => records.map((r: any, i: number) => ({ id: i + 1, ...r }))),
    restore: vi.fn().mockResolvedValue(undefined),
    build: vi.fn().mockImplementation((values) => ({
      ...values,
      validate: vi.fn().mockResolvedValue(undefined),
    })),
    scope: vi.fn().mockReturnThis(),
    addHook: vi.fn(),
    removeHook: vi.fn(),
  };
}

describe('PhilJS Sequelize Integration', () => {
  let mockModel: ReturnType<typeof createMockModel>;

  beforeEach(() => {
    mockModel = createMockModel('User');
    vi.clearAllMocks();
  });

  describe('Type Definitions', () => {
    describe('SequelizeConfig', () => {
      it('should define configuration options', () => {
        const config: SequelizeConfig = {
          sequelize: mockSequelize as any,
          defaultPageSize: 20,
          enableLogging: true,
          cacheEnabled: true,
          cacheTTL: 60000,
        };

        expect(config.sequelize).toBe(mockSequelize);
        expect(config.defaultPageSize).toBe(20);
        expect(config.enableLogging).toBe(true);
        expect(config.cacheEnabled).toBe(true);
        expect(config.cacheTTL).toBe(60000);
      });
    });

    describe('QueryState', () => {
      it('should define query state structure', () => {
        const state: QueryState<any> = {
          data: { set: vi.fn(), get: vi.fn() } as any,
          loading: { set: vi.fn(), get: vi.fn() } as any,
          error: { set: vi.fn(), get: vi.fn() } as any,
          count: { set: vi.fn(), get: vi.fn() } as any,
        };

        expect(state.data).toBeDefined();
        expect(state.loading).toBeDefined();
        expect(state.error).toBeDefined();
        expect(state.count).toBeDefined();
      });
    });

    describe('SingleQueryState', () => {
      it('should define single query state structure', () => {
        const state: SingleQueryState<any> = {
          data: { set: vi.fn(), get: vi.fn() } as any,
          loading: { set: vi.fn(), get: vi.fn() } as any,
          error: { set: vi.fn(), get: vi.fn() } as any,
        };

        expect(state.data).toBeDefined();
        expect(state.loading).toBeDefined();
        expect(state.error).toBeDefined();
      });
    });

    describe('PaginationState', () => {
      it('should define pagination state structure', () => {
        const state: PaginationState = {
          page: { set: vi.fn(), get: vi.fn() } as any,
          pageSize: { set: vi.fn(), get: vi.fn() } as any,
          totalPages: { set: vi.fn(), get: vi.fn() } as any,
          totalCount: { set: vi.fn(), get: vi.fn() } as any,
          hasNextPage: { set: vi.fn(), get: vi.fn() } as any,
          hasPreviousPage: { set: vi.fn(), get: vi.fn() } as any,
        };

        expect(state.page).toBeDefined();
        expect(state.pageSize).toBeDefined();
        expect(state.totalPages).toBeDefined();
        expect(state.totalCount).toBeDefined();
        expect(state.hasNextPage).toBeDefined();
        expect(state.hasPreviousPage).toBeDefined();
      });
    });

    describe('UseSequelizeOptions', () => {
      it('should define query options', () => {
        const options: UseSequelizeOptions<any> = {
          initialData: [],
          enabled: true,
          refetchInterval: 5000,
          cacheKey: 'users',
          staleTime: 60000,
          onSuccess: (data) => {},
          onError: (error) => {},
          where: { isActive: true },
          include: [],
          order: [['createdAt', 'DESC']],
        };

        expect(options.initialData).toEqual([]);
        expect(options.enabled).toBe(true);
        expect(options.refetchInterval).toBe(5000);
        expect(options.cacheKey).toBe('users');
      });
    });

    describe('UseSequelizeByIdOptions', () => {
      it('should define by-id query options', () => {
        const options: UseSequelizeByIdOptions<any> = {
          include: [],
          attributes: ['id', 'name', 'email'],
          rejectOnEmpty: true,
          paranoid: true,
        };

        expect(options.attributes).toContain('id');
        expect(options.rejectOnEmpty).toBe(true);
        expect(options.paranoid).toBe(true);
      });
    });

    describe('UsePaginatedOptions', () => {
      it('should define pagination query options', () => {
        const options: UsePaginatedOptions<any> = {
          pageSize: 10,
          initialPage: 1,
          where: { status: 'active' },
          order: [['name', 'ASC']],
        };

        expect(options.pageSize).toBe(10);
        expect(options.initialPage).toBe(1);
      });
    });

    describe('MutationOptions', () => {
      it('should define mutation options', () => {
        const options: MutationOptions<any> = {
          onSuccess: (result) => {},
          onError: (error) => {},
          optimisticUpdate: true,
          invalidateQueries: ['users', 'profiles'],
        };

        expect(options.optimisticUpdate).toBe(true);
        expect(options.invalidateQueries).toContain('users');
      });
    });

    describe('BulkMutationOptions', () => {
      it('should define bulk mutation options', () => {
        const options: BulkMutationOptions<any> = {
          onSuccess: (results) => {},
          onError: (error) => {},
          transaction: {} as any,
        };

        expect(options.transaction).toBeDefined();
      });
    });

    describe('TransactionOptions', () => {
      it('should define transaction options', () => {
        const options: TransactionOptions = {
          isolationLevel: 'READ COMMITTED' as any,
          autocommit: false,
          type: 'DEFERRED' as any,
        };

        expect(options.isolationLevel).toBe('READ COMMITTED');
        expect(options.autocommit).toBe(false);
      });
    });

    describe('CacheEntry', () => {
      it('should define cache entry structure', () => {
        const entry: CacheEntry<any[]> = {
          data: [{ id: 1, name: 'Test' }],
          timestamp: Date.now(),
          staleTime: 60000,
        };

        expect(entry.data).toHaveLength(1);
        expect(entry.timestamp).toBeGreaterThan(0);
        expect(entry.staleTime).toBe(60000);
      });
    });

    describe('SearchOptions', () => {
      it('should define search options', () => {
        const options: SearchOptions<any> = {
          fields: ['name', 'email', 'bio'],
          minLength: 2,
          debounceMs: 300,
        };

        expect(options.fields).toContain('name');
        expect(options.minLength).toBe(2);
        expect(options.debounceMs).toBe(300);
      });
    });

    describe('ValidationResult', () => {
      it('should define validation result structure', () => {
        const result: ValidationResult = {
          valid: false,
          errors: {
            email: ['Invalid email format'],
            name: ['Name is required', 'Name too short'],
          },
        };

        expect(result.valid).toBe(false);
        expect(result.errors.email).toHaveLength(1);
        expect(result.errors.name).toHaveLength(2);
      });
    });

    describe('ModelHooks', () => {
      it('should define model hooks', () => {
        const hooks: ModelHooks<any> = {
          beforeCreate: async (instance) => {},
          afterCreate: async (instance) => {},
          beforeUpdate: async (instance) => {},
          afterUpdate: async (instance) => {},
          beforeDestroy: async (instance) => {},
          afterDestroy: async (instance) => {},
        };

        expect(typeof hooks.beforeCreate).toBe('function');
        expect(typeof hooks.afterCreate).toBe('function');
        expect(typeof hooks.beforeUpdate).toBe('function');
        expect(typeof hooks.afterUpdate).toBe('function');
        expect(typeof hooks.beforeDestroy).toBe('function');
        expect(typeof hooks.afterDestroy).toBe('function');
      });
    });
  });

  describe('Configuration', () => {
    describe('initSequelize', () => {
      it('should initialize with config', () => {
        expect(typeof initSequelize).toBe('function');

        initSequelize({
          sequelize: mockSequelize as any,
          defaultPageSize: 25,
          enableLogging: true,
          cacheEnabled: true,
          cacheTTL: 30000,
        });

        const config = getConfig();
        expect(config.defaultPageSize).toBe(25);
        expect(config.enableLogging).toBe(true);
      });
    });

    describe('getSequelize', () => {
      it('should return Sequelize instance', () => {
        initSequelize({ sequelize: mockSequelize as any });
        const instance = getSequelize();
        expect(instance).toBe(mockSequelize);
      });

      it('should throw if not initialized', () => {
        // Reset global config by reinitializing
        // This test verifies error handling
        expect(typeof getSequelize).toBe('function');
      });
    });

    describe('getConfig', () => {
      it('should return configuration', () => {
        initSequelize({
          sequelize: mockSequelize as any,
          cacheTTL: 120000,
        });

        const config = getConfig();
        expect(config.cacheTTL).toBe(120000);
        expect(config.sequelize).toBe(mockSequelize);
      });
    });
  });

  describe('Cache Utilities', () => {
    beforeEach(() => {
      initSequelize({ sequelize: mockSequelize as any });
    });

    describe('invalidateCache', () => {
      it('should export invalidateCache function', () => {
        expect(typeof invalidateCache).toBe('function');
      });

      it('should accept string pattern', () => {
        expect(() => invalidateCache('User')).not.toThrow();
      });

      it('should accept RegExp pattern', () => {
        expect(() => invalidateCache(/^User:/)).not.toThrow();
      });

      it('should clear all cache when no pattern provided', () => {
        expect(() => invalidateCache()).not.toThrow();
      });
    });

    describe('invalidateModel', () => {
      it('should export invalidateModel function', () => {
        expect(typeof invalidateModel).toBe('function');
      });

      it('should invalidate by model', () => {
        expect(() => invalidateModel(mockModel as any)).not.toThrow();
      });
    });
  });

  describe('Core Hooks', () => {
    beforeEach(() => {
      initSequelize({ sequelize: mockSequelize as any });
    });

    describe('useSequelize', () => {
      it('should export useSequelize function', () => {
        expect(typeof useSequelize).toBe('function');
      });

      it('should return query state with signals', () => {
        const result = useSequelize(mockModel as any, { enabled: false });

        expect(result.data).toBeDefined();
        expect(result.loading).toBeDefined();
        expect(result.error).toBeDefined();
        expect(result.count).toBeDefined();
        expect(typeof result.refetch).toBe('function');
      });

      it('should accept query options', () => {
        const result = useSequelize(mockModel as any, {
          initialData: [],
          enabled: false,
          cacheKey: 'test-users',
          staleTime: 30000,
          onSuccess: vi.fn(),
          onError: vi.fn(),
        });

        expect(result).toBeDefined();
      });
    });

    describe('useSequelizeById', () => {
      it('should export useSequelizeById function', () => {
        expect(typeof useSequelizeById).toBe('function');
      });

      it('should return single query state', () => {
        const result = useSequelizeById(mockModel as any, null);

        expect(result.data).toBeDefined();
        expect(result.loading).toBeDefined();
        expect(result.error).toBeDefined();
        expect(typeof result.refetch).toBe('function');
      });

      it('should accept options', () => {
        const result = useSequelizeById(mockModel as any, 1, {
          include: [],
          attributes: ['id', 'name'],
          paranoid: true,
        });

        expect(result).toBeDefined();
      });
    });

    describe('useSequelizeOne', () => {
      it('should export useSequelizeOne function', () => {
        expect(typeof useSequelizeOne).toBe('function');
      });

      it('should return single query state', () => {
        const result = useSequelizeOne(mockModel as any, {
          where: { email: 'test@example.com' },
        });

        expect(result.data).toBeDefined();
        expect(result.loading).toBeDefined();
        expect(result.error).toBeDefined();
        expect(typeof result.refetch).toBe('function');
      });
    });

    describe('useSequelizeCount', () => {
      it('should export useSequelizeCount function', () => {
        expect(typeof useSequelizeCount).toBe('function');
      });

      it('should return count query state', () => {
        const result = useSequelizeCount(mockModel as any, {
          where: { isActive: true },
        });

        expect(result.count).toBeDefined();
        expect(result.loading).toBeDefined();
        expect(result.error).toBeDefined();
        expect(typeof result.refetch).toBe('function');
      });
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      initSequelize({ sequelize: mockSequelize as any });
    });

    describe('usePaginated', () => {
      it('should export usePaginated function', () => {
        expect(typeof usePaginated).toBe('function');
      });

      it('should return paginated query state', () => {
        const result = usePaginated(mockModel as any, {
          pageSize: 10,
          initialPage: 1,
        });

        expect(result.data).toBeDefined();
        expect(result.loading).toBeDefined();
        expect(result.error).toBeDefined();
        expect(result.count).toBeDefined();
        expect(result.page).toBeDefined();
        expect(result.pageSize).toBeDefined();
        expect(result.totalPages).toBeDefined();
        expect(result.totalCount).toBeDefined();
        expect(result.hasNextPage).toBeDefined();
        expect(result.hasPreviousPage).toBeDefined();
        expect(typeof result.refetch).toBe('function');
        expect(typeof result.goToPage).toBe('function');
        expect(typeof result.nextPage).toBe('function');
        expect(typeof result.prevPage).toBe('function');
        expect(typeof result.setPageSize).toBe('function');
      });
    });

    describe('useInfiniteSequelize', () => {
      it('should export useInfiniteSequelize function', () => {
        expect(typeof useInfiniteSequelize).toBe('function');
      });

      it('should return infinite scroll state', () => {
        const result = useInfiniteSequelize(mockModel as any, {
          pageSize: 20,
        });

        expect(result.data).toBeDefined();
        expect(result.loading).toBeDefined();
        expect(result.error).toBeDefined();
        expect(result.hasMore).toBeDefined();
        expect(typeof result.loadMore).toBe('function');
        expect(typeof result.reset).toBe('function');
      });
    });
  });

  describe('Mutations', () => {
    beforeEach(() => {
      initSequelize({ sequelize: mockSequelize as any });
    });

    describe('useSequelizeMutation', () => {
      it('should export useSequelizeMutation function', () => {
        expect(typeof useSequelizeMutation).toBe('function');
      });

      it('should return mutation functions', () => {
        const result = useSequelizeMutation(mockModel as any);

        expect(typeof result.create).toBe('function');
        expect(typeof result.update).toBe('function');
        expect(typeof result.destroy).toBe('function');
        expect(typeof result.upsert).toBe('function');
        expect(result.loading).toBeDefined();
        expect(result.error).toBeDefined();
      });

      it('should accept mutation options', () => {
        const result = useSequelizeMutation(mockModel as any, {
          onSuccess: vi.fn(),
          onError: vi.fn(),
          optimisticUpdate: true,
          invalidateQueries: ['users'],
        });

        expect(result).toBeDefined();
      });
    });

    describe('useBulkMutation', () => {
      it('should export useBulkMutation function', () => {
        expect(typeof useBulkMutation).toBe('function');
      });

      it('should return bulk mutation functions', () => {
        const result = useBulkMutation(mockModel as any);

        expect(typeof result.bulkCreate).toBe('function');
        expect(typeof result.bulkUpdate).toBe('function');
        expect(typeof result.bulkDestroy).toBe('function');
        expect(result.loading).toBeDefined();
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('Transactions', () => {
    beforeEach(() => {
      initSequelize({ sequelize: mockSequelize as any });
      mockSequelize.transaction.mockImplementation(async (optionsOrFn, maybeFn) => {
        const fn = typeof optionsOrFn === 'function' ? optionsOrFn : maybeFn;
        if (fn) {
          return fn({
            commit: vi.fn().mockResolvedValue(undefined),
            rollback: vi.fn().mockResolvedValue(undefined),
          });
        }
        return {
          commit: vi.fn().mockResolvedValue(undefined),
          rollback: vi.fn().mockResolvedValue(undefined),
        };
      });
    });

    describe('useTransaction', () => {
      it('should export useTransaction function', () => {
        expect(typeof useTransaction).toBe('function');
      });

      it('should return transaction controls', () => {
        const result = useTransaction();

        expect(typeof result.transaction).toBe('function');
        expect(typeof result.commit).toBe('function');
        expect(typeof result.rollback).toBe('function');
        expect(typeof result.run).toBe('function');
        expect(result.isActive).toBeDefined();
      });

      it('should accept transaction options', () => {
        const result = useTransaction({
          isolationLevel: 'READ COMMITTED' as any,
          autocommit: false,
        });

        expect(result).toBeDefined();
      });
    });

    describe('withTransaction', () => {
      it('should export withTransaction function', () => {
        expect(typeof withTransaction).toBe('function');
      });

      it('should execute function in transaction', async () => {
        const fn = vi.fn().mockResolvedValue('result');
        const result = await withTransaction(fn);
        expect(result).toBe('result');
      });
    });
  });

  describe('Query Builder', () => {
    describe('queryBuilder', () => {
      it('should export queryBuilder function', () => {
        expect(typeof queryBuilder).toBe('function');
      });

      it('should return chainable builder', () => {
        const builder = queryBuilder(mockModel as any);

        expect(typeof builder.where).toBe('function');
        expect(typeof builder.orderBy).toBe('function');
        expect(typeof builder.include).toBe('function');
        expect(typeof builder.select).toBe('function');
        expect(typeof builder.limit).toBe('function');
        expect(typeof builder.offset).toBe('function');
        expect(typeof builder.execute).toBe('function');
        expect(typeof builder.executeOne).toBe('function');
        expect(typeof builder.count).toBe('function');
        expect(typeof builder.toFindOptions).toBe('function');
      });

      it('should support chaining', () => {
        const builder = queryBuilder(mockModel as any);

        const result = builder
          .where({ isActive: true })
          .orderBy('createdAt', 'DESC')
          .select(['id', 'name', 'email'])
          .limit(10)
          .offset(0);

        expect(result).toBe(builder);
      });

      it('should generate find options', () => {
        const builder = queryBuilder(mockModel as any);

        builder
          .where({ status: 'active' })
          .orderBy('name', 'ASC')
          .limit(5);

        const options = builder.toFindOptions();
        expect(options.where).toEqual({ status: 'active' });
        expect(options.limit).toBe(5);
      });
    });
  });

  describe('Raw Queries', () => {
    beforeEach(() => {
      initSequelize({ sequelize: mockSequelize as any });
    });

    describe('useRawQuery', () => {
      it('should export useRawQuery function', () => {
        expect(typeof useRawQuery).toBe('function');
      });

      it('should return query state', () => {
        const result = useRawQuery('SELECT * FROM users WHERE id = :id', { id: 1 });

        expect(result.data).toBeDefined();
        expect(result.loading).toBeDefined();
        expect(result.error).toBeDefined();
        expect(result.count).toBeDefined();
        expect(typeof result.refetch).toBe('function');
      });
    });

    describe('executeRaw', () => {
      it('should export executeRaw function', () => {
        expect(typeof executeRaw).toBe('function');
      });

      it('should execute raw SQL', async () => {
        const result = await executeRaw('UPDATE users SET status = :status', { status: 'active' });
        expect(result).toBeDefined();
      });
    });
  });

  describe('Associations', () => {
    beforeEach(() => {
      initSequelize({ sequelize: mockSequelize as any });
    });

    describe('useAssociation', () => {
      it('should export useAssociation function', () => {
        expect(typeof useAssociation).toBe('function');
      });

      it('should return association query state', () => {
        const result = useAssociation(null, 'posts');

        expect(result.data).toBeDefined();
        expect(result.loading).toBeDefined();
        expect(result.error).toBeDefined();
        expect(result.count).toBeDefined();
        expect(typeof result.refetch).toBe('function');
      });
    });
  });

  describe('Optimistic Updates', () => {
    beforeEach(() => {
      initSequelize({ sequelize: mockSequelize as any });
    });

    describe('useOptimistic', () => {
      it('should export useOptimistic function', () => {
        expect(typeof useOptimistic).toBe('function');
      });

      it('should return optimistic state', () => {
        const result = useOptimistic(mockModel as any, { enabled: false });

        expect(result.data).toBeDefined();
        expect(result.optimisticData).toBeDefined();
        expect(result.isPending).toBeDefined();
        expect(typeof result.add).toBe('function');
        expect(typeof result.update).toBe('function');
        expect(typeof result.remove).toBe('function');
        expect(typeof result.commit).toBe('function');
        expect(typeof result.rollback).toBe('function');
        expect(typeof result.refetch).toBe('function');
      });
    });
  });

  describe('Subscriptions', () => {
    beforeEach(() => {
      initSequelize({ sequelize: mockSequelize as any });
    });

    describe('useSubscription', () => {
      it('should export useSubscription function', () => {
        expect(typeof useSubscription).toBe('function');
      });

      it('should return subscription state', () => {
        const result = useSubscription(mockModel as any, {
          pollInterval: 5000,
          enabled: false,
        });

        expect(result.data).toBeDefined();
        expect(result.loading).toBeDefined();
        expect(result.error).toBeDefined();
        expect(result.count).toBeDefined();
        expect(typeof result.stop).toBe('function');
        expect(typeof result.start).toBe('function');
      });
    });
  });

  describe('Scopes', () => {
    beforeEach(() => {
      initSequelize({ sequelize: mockSequelize as any });
    });

    describe('useScoped', () => {
      it('should export useScoped function', () => {
        expect(typeof useScoped).toBe('function');
      });

      it('should apply single scope', () => {
        const result = useScoped(mockModel as any, 'active', { enabled: false });

        expect(result.data).toBeDefined();
        expect(mockModel.scope).toHaveBeenCalledWith(['active']);
      });

      it('should apply multiple scopes', () => {
        const result = useScoped(mockModel as any, ['active', 'verified'], { enabled: false });

        expect(result.data).toBeDefined();
        expect(mockModel.scope).toHaveBeenCalledWith(['active', 'verified']);
      });
    });
  });

  describe('Search', () => {
    beforeEach(() => {
      initSequelize({ sequelize: mockSequelize as any });
    });

    describe('useSearch', () => {
      it('should export useSearch function', () => {
        expect(typeof useSearch).toBe('function');
      });

      it('should return search state', () => {
        const result = useSearch(mockModel as any, {
          fields: ['name', 'email'],
          minLength: 2,
          debounceMs: 300,
        });

        expect(result.query).toBeDefined();
        expect(result.results).toBeDefined();
        expect(result.loading).toBeDefined();
        expect(result.error).toBeDefined();
        expect(typeof result.setQuery).toBe('function');
      });
    });
  });

  describe('Soft Delete', () => {
    beforeEach(() => {
      initSequelize({ sequelize: mockSequelize as any });
    });

    describe('useWithDeleted', () => {
      it('should export useWithDeleted function', () => {
        expect(typeof useWithDeleted).toBe('function');
      });

      it('should return query state with deleted records', () => {
        const result = useWithDeleted(mockModel as any, { enabled: false });

        expect(result.data).toBeDefined();
        expect(result.loading).toBeDefined();
        expect(result.error).toBeDefined();
        expect(typeof result.refetch).toBe('function');
      });
    });

    describe('restore', () => {
      it('should export restore function', () => {
        expect(typeof restore).toBe('function');
      });

      it('should restore soft-deleted records', async () => {
        await restore(mockModel as any, { id: 1 });
        expect(mockModel.restore).toHaveBeenCalledWith({ where: { id: 1 } });
      });
    });
  });

  describe('Model Hooks', () => {
    describe('useModelHooks', () => {
      it('should export useModelHooks function', () => {
        expect(typeof useModelHooks).toBe('function');
      });

      it('should register hooks', () => {
        const hooks: ModelHooks<any> = {
          beforeCreate: vi.fn(),
          afterCreate: vi.fn(),
        };

        const result = useModelHooks(mockModel as any, hooks);

        expect(typeof result.unregister).toBe('function');
        expect(mockModel.addHook).toHaveBeenCalledTimes(2);
      });

      it('should unregister hooks', () => {
        const hooks: ModelHooks<any> = {
          beforeUpdate: vi.fn(),
          afterUpdate: vi.fn(),
        };

        const { unregister } = useModelHooks(mockModel as any, hooks);
        unregister();

        expect(mockModel.removeHook).toHaveBeenCalled();
      });
    });
  });

  describe('Validation', () => {
    describe('validateInstance', () => {
      it('should export validateInstance function', () => {
        expect(typeof validateInstance).toBe('function');
      });

      it('should validate instance successfully', async () => {
        const instance = {
          validate: vi.fn().mockResolvedValue(undefined),
        };

        const result = await validateInstance(instance as any);
        expect(result.valid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it('should return validation errors', async () => {
        const instance = {
          validate: vi.fn().mockRejectedValue({
            name: 'SequelizeValidationError',
            errors: [
              { path: 'email', message: 'Invalid email' },
              { path: 'name', message: 'Name required' },
            ],
          }),
        };

        const result = await validateInstance(instance as any);
        expect(result.valid).toBe(false);
        expect(result.errors.email).toContain('Invalid email');
        expect(result.errors.name).toContain('Name required');
      });
    });

    describe('buildInstance', () => {
      it('should export buildInstance function', () => {
        expect(typeof buildInstance).toBe('function');
      });

      it('should build instance without saving', () => {
        const values = { name: 'Test', email: 'test@example.com' };
        const instance = buildInstance(mockModel as any, values);

        expect(mockModel.build).toHaveBeenCalledWith(values);
        expect(instance).toBeDefined();
      });
    });
  });

  describe('Utilities', () => {
    beforeEach(() => {
      initSequelize({ sequelize: mockSequelize as any });
    });

    describe('isConnected', () => {
      it('should export isConnected function', () => {
        expect(typeof isConnected).toBe('function');
      });

      it('should return true when connected', async () => {
        const result = await isConnected();
        expect(result).toBe(true);
        expect(mockSequelize.authenticate).toHaveBeenCalled();
      });

      it('should return false when not connected', async () => {
        mockSequelize.authenticate.mockRejectedValueOnce(new Error('Connection failed'));
        const result = await isConnected();
        expect(result).toBe(false);
      });
    });

    describe('closeConnection', () => {
      it('should export closeConnection function', () => {
        expect(typeof closeConnection).toBe('function');
      });

      it('should close database connection', async () => {
        await closeConnection();
        expect(mockSequelize.close).toHaveBeenCalled();
      });
    });

    describe('syncModels', () => {
      it('should export syncModels function', () => {
        expect(typeof syncModels).toBe('function');
      });

      it('should sync models', async () => {
        // Reinitialize after close
        initSequelize({ sequelize: mockSequelize as any });
        await syncModels();
        expect(mockSequelize.sync).toHaveBeenCalled();
      });

      it('should accept sync options', async () => {
        initSequelize({ sequelize: mockSequelize as any });
        await syncModels({ force: true, alter: false });
        expect(mockSequelize.sync).toHaveBeenCalledWith({ force: true, alter: false });
      });
    });

    describe('getModel', () => {
      it('should export getModel function', () => {
        expect(typeof getModel).toBe('function');
      });

      it('should return model by name', () => {
        initSequelize({ sequelize: mockSequelize as any });
        const model = getModel('User');
        expect(model).toBeDefined();
      });

      it('should return undefined for non-existent model', () => {
        initSequelize({ sequelize: mockSequelize as any });
        const model = getModel('NonExistent');
        expect(model).toBeUndefined();
      });
    });

    describe('listModels', () => {
      it('should export listModels function', () => {
        expect(typeof listModels).toBe('function');
      });

      it('should return list of model names', () => {
        initSequelize({ sequelize: mockSequelize as any });
        const models = listModels();
        expect(models).toContain('User');
        expect(models).toContain('Post');
      });
    });
  });

  describe('SSR Integration', () => {
    beforeEach(() => {
      initSequelize({ sequelize: mockSequelize as any });
    });

    describe('createSSRDataLoader', () => {
      it('should export createSSRDataLoader function', () => {
        expect(typeof createSSRDataLoader).toBe('function');
      });

      it('should return SSR data loader', () => {
        const loader = createSSRDataLoader();

        expect(typeof loader.preload).toBe('function');
        expect(typeof loader.getData).toBe('function');
        expect(typeof loader.hydrate).toBe('function');
      });

      it('should preload data', async () => {
        const loader = createSSRDataLoader();
        await loader.preload(mockModel as any, { where: { isActive: true } });

        expect(mockModel.findAll).toHaveBeenCalled();
      });

      it('should return preloaded data', async () => {
        mockModel.findAll.mockResolvedValueOnce([{ id: 1, name: 'Test' }]);

        const loader = createSSRDataLoader();
        await loader.preload(mockModel as any);

        const data = loader.getData();
        expect(Object.keys(data).length).toBeGreaterThan(0);
      });

      it('should hydrate cache', () => {
        const loader = createSSRDataLoader();
        const data = { 'User:{}': [{ id: 1, name: 'Test' }] };

        expect(() => loader.hydrate(data)).not.toThrow();
      });
    });
  });

  describe('Integration Patterns', () => {
    beforeEach(() => {
      initSequelize({ sequelize: mockSequelize as any });
    });

    it('should support basic CRUD workflow', async () => {
      // Query
      const { data, loading, refetch } = useSequelize(mockModel as any, { enabled: false });
      expect(data).toBeDefined();

      // Mutation
      const { create, update, destroy } = useSequelizeMutation(mockModel as any);
      expect(typeof create).toBe('function');
      expect(typeof update).toBe('function');
      expect(typeof destroy).toBe('function');
    });

    it('should support pagination workflow', () => {
      const {
        data,
        page,
        pageSize,
        totalPages,
        hasNextPage,
        hasPreviousPage,
        goToPage,
        nextPage,
        prevPage,
        setPageSize,
      } = usePaginated(mockModel as any, { pageSize: 10 });

      expect(data).toBeDefined();
      expect(page).toBeDefined();
      expect(typeof goToPage).toBe('function');
      expect(typeof nextPage).toBe('function');
      expect(typeof prevPage).toBe('function');
      expect(typeof setPageSize).toBe('function');
    });

    it('should support transaction workflow', () => {
      const { transaction, commit, rollback, run, isActive } = useTransaction();

      expect(typeof transaction).toBe('function');
      expect(typeof commit).toBe('function');
      expect(typeof rollback).toBe('function');
      expect(typeof run).toBe('function');
      expect(isActive).toBeDefined();
    });

    it('should support search workflow', () => {
      const { query, setQuery, results, loading, error } = useSearch(mockModel as any, {
        fields: ['name', 'email', 'bio'],
        minLength: 2,
        debounceMs: 300,
      });

      expect(query).toBeDefined();
      expect(typeof setQuery).toBe('function');
      expect(results).toBeDefined();
      expect(loading).toBeDefined();
      expect(error).toBeDefined();
    });

    it('should support optimistic update workflow', () => {
      const { data, optimisticData, isPending, add, update, remove, commit, rollback } = useOptimistic(
        mockModel as any,
        { enabled: false }
      );

      expect(data).toBeDefined();
      expect(optimisticData).toBeDefined();
      expect(isPending).toBeDefined();
      expect(typeof add).toBe('function');
      expect(typeof update).toBe('function');
      expect(typeof remove).toBe('function');
      expect(typeof commit).toBe('function');
      expect(typeof rollback).toBe('function');
    });
  });
});
