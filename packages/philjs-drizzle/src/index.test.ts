/**
 * Tests for PhilJS Drizzle ORM Adapter
 *
 * Comprehensive tests for the type-safe SQL adapter with signals integration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  // Connection
  connect,
  disconnect,
  getClient,
  isConnected,
  getDialect,
  // Hooks
  useDrizzle,
  useDrizzleOne,
  usePaginated,
  useInfinite,
  useMutation,
  useTransaction,
  useRawQuery,
  useRelations,
  useOptimistic,
  useSubscription,
  // Query Builders
  createQueryBuilder,
  createInsertBuilder,
  createUpdateBuilder,
  createDeleteBuilder,
  // Raw queries
  executeRaw,
  executeRawMutation,
  // Schema utilities
  defineSchema,
  generateSQL,
  // Migration utilities
  runMigrations,
  rollbackMigration,
  getMigrationStatus,
  // SSR utilities
  createSSRDataLoader,
  prefetchForSSR,
  hydrateFromSSR,
  // Cache utilities
  clearCache,
  getCacheStats,
  warmCache,
  // SQL helpers
  sql,
  // Batch operations
  batchExecute,
  batchQuery,
  // Prepared statements
  prepare,
  // Types
  type DrizzleConfig,
  type ConnectionConfig,
  type SSLConfig,
  type PoolConfig,
  type DrizzleLogger,
  type QueryState,
  type PaginationState,
  type MutationState,
  type DrizzleHook,
  type TransactionHook,
  type TransactionOptions,
  type DrizzleTransaction,
  type SQLQuery,
  type ExecuteResult,
  type QueryBuilder,
  type QueryBuilderOptions,
  type Column,
  type Table,
  type Condition,
  type Operator,
  type SchemaDefinition,
  type TableDefinition,
  type ColumnDefinition,
  type ColumnType,
  type ReferenceAction,
  type EnumDefinition,
  type IndexDefinition,
  type ForeignKeyDefinition,
  type CheckConstraint,
  type MigrationConfig,
  type Migration,
  type RelationConfig,
  type SSRDataLoader,
  type PreparedStatement,
  type DatabaseDialect,
} from './index';

describe('PhilJS Drizzle ORM Adapter', () => {
  describe('Type Definitions', () => {
    describe('DatabaseDialect', () => {
      it('should support all database dialects', () => {
        const dialects: DatabaseDialect[] = [
          'postgresql',
          'mysql',
          'sqlite',
          'turso',
          'planetscale',
          'neon',
          'd1',
        ];
        expect(dialects.length).toBe(7);
      });
    });

    describe('DrizzleConfig', () => {
      it('should accept all configuration options', () => {
        const config: DrizzleConfig = {
          dialect: 'postgresql',
          connection: 'postgres://localhost:5432/db',
          schema: { users: {} },
          logger: true,
          pool: { min: 2, max: 10 },
          ssl: { rejectUnauthorized: true },
        };
        expect(config.dialect).toBe('postgresql');
        expect(config.logger).toBe(true);
      });

      it('should accept connection config object', () => {
        const connectionConfig: ConnectionConfig = {
          host: 'localhost',
          port: 5432,
          user: 'admin',
          password: 'secret',
          database: 'mydb',
          connectionString: 'postgres://localhost:5432/mydb',
        };
        const config: DrizzleConfig = {
          dialect: 'postgresql',
          connection: connectionConfig,
        };
        expect((config.connection as ConnectionConfig).host).toBe('localhost');
      });
    });

    describe('SSLConfig', () => {
      it('should accept SSL configuration', () => {
        const ssl: SSLConfig = {
          rejectUnauthorized: true,
          ca: 'ca-cert',
          key: 'client-key',
          cert: 'client-cert',
        };
        expect(ssl.rejectUnauthorized).toBe(true);
      });
    });

    describe('PoolConfig', () => {
      it('should accept pool configuration', () => {
        const pool: PoolConfig = {
          min: 2,
          max: 20,
          idleTimeoutMillis: 30000,
          acquireTimeoutMillis: 10000,
        };
        expect(pool.max).toBe(20);
      });
    });

    describe('DrizzleLogger', () => {
      it('should define logQuery method', () => {
        const logger: DrizzleLogger = {
          logQuery: vi.fn(),
        };
        logger.logQuery('SELECT * FROM users', [1, 2]);
        expect(logger.logQuery).toHaveBeenCalledWith('SELECT * FROM users', [1, 2]);
      });
    });

    describe('QueryState', () => {
      it('should have correct structure', () => {
        const state: QueryState<string[]> = {
          data: ['item1', 'item2'],
          loading: false,
          error: null,
          stale: false,
        };
        expect(state.data).toHaveLength(2);
        expect(state.loading).toBe(false);
      });
    });

    describe('PaginationState', () => {
      it('should have correct structure', () => {
        const state: PaginationState<{ id: number }> = {
          data: [{ id: 1 }, { id: 2 }],
          page: 1,
          pageSize: 20,
          total: 100,
          totalPages: 5,
          hasNext: true,
          hasPrev: false,
          loading: false,
          error: null,
        };
        expect(state.totalPages).toBe(5);
        expect(state.hasNext).toBe(true);
      });
    });

    describe('MutationState', () => {
      it('should have correct structure', () => {
        const state: MutationState<{ id: number }> = {
          data: { id: 1 },
          loading: false,
          error: null,
          success: true,
        };
        expect(state.success).toBe(true);
      });
    });

    describe('TransactionOptions', () => {
      it('should accept all transaction options', () => {
        const options: TransactionOptions = {
          isolationLevel: 'serializable',
          accessMode: 'read write',
          deferrable: true,
        };
        expect(options.isolationLevel).toBe('serializable');
      });
    });

    describe('SQLQuery', () => {
      it('should have sql and params', () => {
        const query: SQLQuery = {
          sql: 'SELECT * FROM users WHERE id = ?',
          params: [1],
        };
        expect(query.sql).toContain('SELECT');
        expect(query.params).toEqual([1]);
      });
    });

    describe('ExecuteResult', () => {
      it('should have rowsAffected and insertId', () => {
        const result: ExecuteResult = {
          rowsAffected: 1,
          insertId: 42,
        };
        expect(result.rowsAffected).toBe(1);
        expect(result.insertId).toBe(42);
      });
    });

    describe('Column type', () => {
      it('should accept string column', () => {
        const col: Column = 'user_id';
        expect(col).toBe('user_id');
      });

      it('should accept column object', () => {
        const col: Column = { name: 'user_id', alias: 'userId', table: 'users' };
        expect(col.name).toBe('user_id');
        expect(col.alias).toBe('userId');
      });
    });

    describe('Table type', () => {
      it('should accept string table', () => {
        const table: Table = 'users';
        expect(table).toBe('users');
      });

      it('should accept table object', () => {
        const table: Table = { name: 'users', alias: 'u', schema: 'public' };
        expect(table.name).toBe('users');
        expect(table.schema).toBe('public');
      });
    });

    describe('Condition type', () => {
      it('should accept string condition', () => {
        const cond: Condition = 'id = 1';
        expect(cond).toBe('id = 1');
      });

      it('should accept condition object', () => {
        const cond: Condition = { column: 'id', operator: '=', value: 1 };
        expect(cond.column).toBe('id');
        expect(cond.operator).toBe('=');
      });
    });

    describe('Operator type', () => {
      it('should support all operators', () => {
        const operators: Operator[] = [
          '=', '!=', '<', '>', '<=', '>=',
          'like', 'ilike', 'in', 'not in',
          'is null', 'is not null', 'between',
        ];
        expect(operators.length).toBe(13);
      });
    });

    describe('ColumnType', () => {
      it('should support numeric types', () => {
        const numericTypes: ColumnType[] = [
          'serial', 'bigserial', 'smallserial',
          'integer', 'bigint', 'smallint',
          'real', 'double precision', 'numeric', 'decimal',
        ];
        expect(numericTypes).toContain('integer');
      });

      it('should support string types', () => {
        const stringTypes: ColumnType[] = ['varchar', 'char', 'text'];
        expect(stringTypes).toContain('text');
      });

      it('should support date/time types', () => {
        const dateTypes: ColumnType[] = [
          'date', 'time', 'timestamp', 'timestamptz', 'interval',
        ];
        expect(dateTypes).toContain('timestamp');
      });

      it('should support JSON types', () => {
        const jsonTypes: ColumnType[] = ['json', 'jsonb'];
        expect(jsonTypes).toContain('jsonb');
      });

      it('should support geometric types', () => {
        const geoTypes: ColumnType[] = [
          'point', 'line', 'lseg', 'box', 'path', 'polygon', 'circle',
        ];
        expect(geoTypes).toContain('point');
      });
    });

    describe('ReferenceAction', () => {
      it('should support all reference actions', () => {
        const actions: ReferenceAction[] = [
          'cascade', 'restrict', 'no action', 'set null', 'set default',
        ];
        expect(actions).toContain('cascade');
      });
    });

    describe('SchemaDefinition', () => {
      it('should accept complete schema definition', () => {
        const schema: SchemaDefinition = {
          tables: [
            {
              name: 'users',
              columns: [
                { name: 'id', type: 'serial', primaryKey: true },
                { name: 'email', type: 'varchar', unique: true, nullable: false },
              ],
              primaryKey: 'id',
            },
          ],
          enums: [{ name: 'status', values: ['active', 'inactive'] }],
          indexes: [
            { name: 'idx_email', table: 'users', columns: ['email'], unique: true },
          ],
        };
        expect(schema.tables).toHaveLength(1);
        expect(schema.enums).toHaveLength(1);
      });
    });

    describe('TableDefinition', () => {
      it('should accept all table options', () => {
        const table: TableDefinition = {
          name: 'posts',
          schema: 'blog',
          columns: [
            { name: 'id', type: 'serial', primaryKey: true },
            { name: 'title', type: 'varchar', nullable: false },
            {
              name: 'author_id',
              type: 'integer',
              references: { table: 'users', column: 'id', onDelete: 'cascade' },
            },
          ],
          primaryKey: ['id'],
          foreignKeys: [
            {
              columns: ['author_id'],
              references: { table: 'users', columns: ['id'] },
              onDelete: 'cascade',
            },
          ],
          indexes: [{ name: 'idx_title', table: 'posts', columns: ['title'] }],
          checks: [{ name: 'title_not_empty', expression: "title != ''" }],
        };
        expect(table.schema).toBe('blog');
        expect(table.foreignKeys).toHaveLength(1);
      });
    });

    describe('ColumnDefinition', () => {
      it('should accept all column options', () => {
        const column: ColumnDefinition = {
          name: 'created_at',
          type: 'timestamptz',
          nullable: false,
          default: 'CURRENT_TIMESTAMP',
          primaryKey: false,
          unique: false,
          references: {
            table: 'other',
            column: 'id',
            onDelete: 'cascade',
            onUpdate: 'no action',
          },
          check: 'created_at > NOW() - INTERVAL 1 YEAR',
        };
        expect(column.type).toBe('timestamptz');
        expect(column.references?.onDelete).toBe('cascade');
      });
    });

    describe('IndexDefinition', () => {
      it('should accept all index options', () => {
        const index: IndexDefinition = {
          name: 'idx_users_active',
          table: 'users',
          columns: ['status', 'created_at'],
          unique: true,
          where: "status = 'active'",
          using: 'btree',
        };
        expect(index.using).toBe('btree');
        expect(index.where).toContain('active');
      });
    });

    describe('ForeignKeyDefinition', () => {
      it('should accept composite foreign keys', () => {
        const fk: ForeignKeyDefinition = {
          columns: ['tenant_id', 'user_id'],
          references: { table: 'users', columns: ['tenant_id', 'id'] },
          onDelete: 'cascade',
          onUpdate: 'restrict',
        };
        expect(fk.columns).toHaveLength(2);
        expect(fk.references.columns).toHaveLength(2);
      });
    });

    describe('MigrationConfig', () => {
      it('should accept migration configuration', () => {
        const config: MigrationConfig = {
          migrationsFolder: './migrations',
          migrationsTable: 'schema_migrations',
          migrationsSchema: 'public',
        };
        expect(config.migrationsFolder).toBe('./migrations');
      });
    });

    describe('Migration', () => {
      it('should have correct structure', () => {
        const migration: Migration = {
          id: '001',
          name: '20240101_create_users',
          hash: 'abc123',
          executedAt: new Date(),
        };
        expect(migration.name).toContain('create_users');
      });
    });

    describe('RelationConfig', () => {
      it('should accept one relation', () => {
        const relation: RelationConfig<{ userId: number }> = {
          type: 'one',
          from: 'userId',
          to: { table: 'users', column: 'id' },
        };
        expect(relation.type).toBe('one');
      });

      it('should accept many-to-many through relation', () => {
        const relation: RelationConfig<{ id: number }> = {
          type: 'many',
          from: 'id',
          to: { table: 'tags', column: 'id' },
          through: { table: 'post_tags', fromColumn: 'post_id', toColumn: 'tag_id' },
        };
        expect(relation.through?.table).toBe('post_tags');
      });
    });
  });

  describe('Connection Management', () => {
    beforeEach(async () => {
      await disconnect();
    });

    afterEach(async () => {
      await disconnect();
    });

    describe('connect', () => {
      it('should be a function', () => {
        expect(typeof connect).toBe('function');
      });

      it('should connect to database', async () => {
        await connect({
          dialect: 'postgresql',
          connection: 'postgres://localhost:5432/test',
        });
        expect(isConnected()).toBe(true);
      });

      it('should not reconnect if already connected', async () => {
        await connect({
          dialect: 'postgresql',
          connection: 'postgres://localhost:5432/test',
        });
        const firstClient = getClient();
        await connect({
          dialect: 'postgresql',
          connection: 'postgres://localhost:5432/test',
        });
        expect(getClient()).toBe(firstClient);
      });
    });

    describe('disconnect', () => {
      it('should be a function', () => {
        expect(typeof disconnect).toBe('function');
      });

      it('should disconnect from database', async () => {
        await connect({
          dialect: 'postgresql',
          connection: 'postgres://localhost:5432/test',
        });
        expect(isConnected()).toBe(true);
        await disconnect();
        expect(isConnected()).toBe(false);
      });
    });

    describe('getClient', () => {
      it('should throw if not connected', () => {
        expect(() => getClient()).toThrow('Drizzle not connected');
      });

      it('should return client when connected', async () => {
        await connect({
          dialect: 'postgresql',
          connection: 'postgres://localhost:5432/test',
        });
        const client = getClient();
        expect(client).toBeDefined();
      });
    });

    describe('isConnected', () => {
      it('should return false initially', () => {
        expect(isConnected()).toBe(false);
      });

      it('should return true after connection', async () => {
        await connect({
          dialect: 'postgresql',
          connection: 'postgres://localhost:5432/test',
        });
        expect(isConnected()).toBe(true);
      });
    });

    describe('getDialect', () => {
      it('should return null if not connected', () => {
        expect(getDialect()).toBeNull();
      });

      it('should return dialect when connected', async () => {
        await connect({
          dialect: 'mysql',
          connection: 'mysql://localhost:3306/test',
        });
        expect(getDialect()).toBe('mysql');
      });
    });
  });

  describe('Query Hooks', () => {
    beforeEach(async () => {
      await connect({
        dialect: 'postgresql',
        connection: 'postgres://localhost:5432/test',
      });
    });

    afterEach(async () => {
      await disconnect();
    });

    describe('useDrizzle', () => {
      it('should be a function', () => {
        expect(typeof useDrizzle).toBe('function');
      });

      it('should return hook object with signals', () => {
        const hook = useDrizzle(() => ({ sql: 'SELECT * FROM users' }));
        expect(hook.data).toBeDefined();
        expect(hook.loading).toBeDefined();
        expect(hook.error).toBeDefined();
        expect(hook.state).toBeDefined();
        expect(typeof hook.refetch).toBe('function');
        expect(typeof hook.mutate).toBe('function');
        expect(typeof hook.invalidate).toBe('function');
      });

      it('should accept options', () => {
        const hook = useDrizzle(
          () => ({ sql: 'SELECT * FROM users' }),
          {
            enabled: true,
            refetchInterval: 5000,
            staleTime: 60000,
            cacheKey: 'users-list',
            initialData: [{ id: 1 }],
            transform: (data) => data as { id: number }[],
          }
        );
        expect(hook).toBeDefined();
      });
    });

    describe('useDrizzleOne', () => {
      it('should be a function', () => {
        expect(typeof useDrizzleOne).toBe('function');
      });

      it('should return hook for single record', () => {
        const hook = useDrizzleOne(() => ({
          sql: 'SELECT * FROM users WHERE id = ?',
          params: [1],
        }));
        expect(hook.data).toBeDefined();
        expect(hook.state).toBeDefined();
        expect(typeof hook.invalidate).toBe('function');
      });
    });

    describe('usePaginated', () => {
      it('should be a function', () => {
        expect(typeof usePaginated).toBe('function');
      });

      it('should return pagination hook', () => {
        const hook = usePaginated(
          (page, pageSize) => ({
            sql: `SELECT * FROM users LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
          }),
          () => ({ sql: 'SELECT COUNT(*) as count FROM users' })
        );
        expect(hook.state).toBeDefined();
        expect(hook.data).toBeDefined();
        expect(hook.page).toBeDefined();
        expect(hook.pageSize).toBeDefined();
        expect(hook.total).toBeDefined();
        expect(typeof hook.goToPage).toBe('function');
        expect(typeof hook.nextPage).toBe('function');
        expect(typeof hook.prevPage).toBe('function');
        expect(typeof hook.setPageSize).toBe('function');
      });

      it('should accept pagination options', () => {
        const hook = usePaginated(
          (page, pageSize) => ({ sql: `SELECT * FROM users LIMIT ${pageSize}` }),
          () => ({ sql: 'SELECT COUNT(*) FROM users' }),
          { initialPage: 2, pageSize: 50, enabled: true, staleTime: 30000 }
        );
        expect(hook).toBeDefined();
      });
    });

    describe('useInfinite', () => {
      it('should be a function', () => {
        expect(typeof useInfinite).toBe('function');
      });

      it('should return infinite query hook', () => {
        const hook = useInfinite(
          (cursor, pageSize) => ({
            sql: `SELECT * FROM users WHERE id > ? LIMIT ${pageSize}`,
            params: [cursor || 0],
          }),
          { pageSize: 20 }
        );
        expect(hook.data).toBeDefined();
        expect(hook.loading).toBeDefined();
        expect(hook.loadingMore).toBeDefined();
        expect(hook.error).toBeDefined();
        expect(hook.hasMore).toBeDefined();
        expect(typeof hook.loadMore).toBe('function');
        expect(typeof hook.refetch).toBe('function');
        expect(typeof hook.reset).toBe('function');
      });
    });

    describe('useMutation', () => {
      it('should be a function', () => {
        expect(typeof useMutation).toBe('function');
      });

      it('should return mutation hook', () => {
        const hook = useMutation((data: { name: string }) => ({
          sql: 'INSERT INTO users (name) VALUES (?)',
          params: [data.name],
        }));
        expect(hook.state).toBeDefined();
        expect(hook.data).toBeDefined();
        expect(hook.loading).toBeDefined();
        expect(hook.error).toBeDefined();
        expect(hook.success).toBeDefined();
        expect(typeof hook.mutate).toBe('function');
        expect(typeof hook.mutateAsync).toBe('function');
        expect(typeof hook.reset).toBe('function');
      });

      it('should accept mutation options', () => {
        const onSuccess = vi.fn();
        const onError = vi.fn();
        const onSettled = vi.fn();
        const optimisticUpdate = vi.fn();
        const rollback = vi.fn();

        const hook = useMutation(
          (data: { name: string }) => ({
            sql: 'INSERT INTO users (name) VALUES (?)',
            params: [data.name],
          }),
          {
            onSuccess,
            onError,
            onSettled,
            invalidateKeys: ['users-list'],
            optimisticUpdate,
            rollback,
          }
        );
        expect(hook).toBeDefined();
      });
    });

    describe('useTransaction', () => {
      it('should be a function', () => {
        expect(typeof useTransaction).toBe('function');
      });

      it('should return transaction hook', () => {
        const hook = useTransaction();
        expect(hook.loading).toBeDefined();
        expect(hook.error).toBeDefined();
        expect(hook.state).toBeDefined();
        expect(typeof hook.execute).toBe('function');
      });

      it('should accept transaction options', () => {
        const hook = useTransaction({
          isolationLevel: 'read committed',
          accessMode: 'read write',
          deferrable: false,
        });
        expect(hook).toBeDefined();
      });
    });

    describe('useRawQuery', () => {
      it('should be a function', () => {
        expect(typeof useRawQuery).toBe('function');
      });

      it('should return query hook for raw SQL', () => {
        const hook = useRawQuery<{ id: number }>(
          'SELECT * FROM users WHERE status = ?',
          ['active'],
          { enabled: true, staleTime: 60000, cacheKey: 'active-users' }
        );
        expect(hook.data).toBeDefined();
        expect(hook.loading).toBeDefined();
        expect(hook.error).toBeDefined();
      });
    });

    describe('useRelations', () => {
      it('should be a function', () => {
        expect(typeof useRelations).toBe('function');
      });

      it('should return relations hook', () => {
        interface Post { id: number; authorId: number }
        interface Author { id: number; name: string }

        const hook = useRelations<Post, { author: Author }>(
          () => ({ sql: 'SELECT * FROM posts' }),
          {
            author: { type: 'one', from: 'authorId', to: { table: 'users', column: 'id' } },
          }
        );
        expect(hook.data).toBeDefined();
        expect(typeof hook.loadRelation).toBe('function');
        expect(typeof hook.prefetchRelations).toBe('function');
      });
    });

    describe('useOptimistic', () => {
      it('should be a function', () => {
        expect(typeof useOptimistic).toBe('function');
      });

      it('should return optimistic update hook', () => {
        interface User { id: number; name: string }

        const hook = useOptimistic<User>(() => ({ sql: 'SELECT * FROM users' }));
        expect(hook.data).toBeDefined();
        expect(typeof hook.optimisticInsert).toBe('function');
        expect(typeof hook.optimisticUpdate).toBe('function');
        expect(typeof hook.optimisticDelete).toBe('function');
        expect(typeof hook.rollback).toBe('function');
      });
    });

    describe('useSubscription', () => {
      it('should be a function', () => {
        expect(typeof useSubscription).toBe('function');
      });

      it('should return subscription hook', () => {
        const onData = vi.fn();
        const hook = useSubscription(
          () => ({ sql: 'SELECT * FROM notifications' }),
          { pollingInterval: 5000, onData }
        );
        expect(hook.data).toBeDefined();
        expect(hook.isPaused).toBeDefined();
        expect(typeof hook.pause).toBe('function');
        expect(typeof hook.resume).toBe('function');
      });
    });
  });

  describe('Query Builders', () => {
    beforeEach(async () => {
      await connect({
        dialect: 'postgresql',
        connection: 'postgres://localhost:5432/test',
      });
    });

    afterEach(async () => {
      await disconnect();
    });

    describe('createQueryBuilder', () => {
      it('should be a function', () => {
        expect(typeof createQueryBuilder).toBe('function');
      });

      it('should return query builder with chainable methods', () => {
        const builder = createQueryBuilder();
        expect(typeof builder.select).toBe('function');
        expect(typeof builder.from).toBe('function');
        expect(typeof builder.where).toBe('function');
        expect(typeof builder.andWhere).toBe('function');
        expect(typeof builder.orWhere).toBe('function');
        expect(typeof builder.join).toBe('function');
        expect(typeof builder.leftJoin).toBe('function');
        expect(typeof builder.rightJoin).toBe('function');
        expect(typeof builder.fullJoin).toBe('function');
        expect(typeof builder.groupBy).toBe('function');
        expect(typeof builder.having).toBe('function');
        expect(typeof builder.orderBy).toBe('function');
        expect(typeof builder.limit).toBe('function');
        expect(typeof builder.offset).toBe('function');
        expect(typeof builder.distinct).toBe('function');
        expect(typeof builder.union).toBe('function');
        expect(typeof builder.unionAll).toBe('function');
        expect(typeof builder.toSQL).toBe('function');
        expect(typeof builder.execute).toBe('function');
      });

      it('should build simple SELECT query', () => {
        const { sql, params } = createQueryBuilder()
          .select('id', 'name')
          .from('users')
          .toSQL();

        expect(sql).toContain('SELECT');
        expect(sql).toContain('id, name');
        expect(sql).toContain('FROM users');
      });

      it('should build SELECT with WHERE clause', () => {
        const { sql, params } = createQueryBuilder()
          .select('*')
          .from('users')
          .where({ column: 'status', operator: '=', value: 'active' })
          .toSQL();

        expect(sql).toContain('WHERE');
        expect(sql).toContain('status');
        expect(params).toContain('active');
      });

      it('should support multiple WHERE conditions', () => {
        const { sql } = createQueryBuilder()
          .select('*')
          .from('users')
          .where({ column: 'status', operator: '=', value: 'active' })
          .andWhere({ column: 'role', operator: '=', value: 'admin' })
          .orWhere({ column: 'role', operator: '=', value: 'superadmin' })
          .toSQL();

        expect(sql).toContain('WHERE');
        expect(sql).toContain('AND');
        expect(sql).toContain('OR');
      });

      it('should support JOINs', () => {
        const { sql } = createQueryBuilder()
          .select('users.id', 'posts.title')
          .from('users')
          .leftJoin('posts', 'users.id = posts.author_id')
          .toSQL();

        expect(sql).toContain('LEFT JOIN');
        expect(sql).toContain('posts');
      });

      it('should support GROUP BY and HAVING', () => {
        const { sql } = createQueryBuilder()
          .select('status', 'COUNT(*)')
          .from('users')
          .groupBy('status')
          .having({ column: 'COUNT(*)', operator: '>', value: 5 })
          .toSQL();

        expect(sql).toContain('GROUP BY');
        expect(sql).toContain('HAVING');
      });

      it('should support ORDER BY, LIMIT, and OFFSET', () => {
        const { sql } = createQueryBuilder()
          .select('*')
          .from('users')
          .orderBy('created_at', 'desc')
          .limit(10)
          .offset(20)
          .toSQL();

        expect(sql).toContain('ORDER BY');
        expect(sql).toContain('DESC');
        expect(sql).toContain('LIMIT 10');
        expect(sql).toContain('OFFSET 20');
      });

      it('should support DISTINCT', () => {
        const { sql } = createQueryBuilder()
          .distinct()
          .select('email')
          .from('users')
          .toSQL();

        expect(sql).toContain('SELECT DISTINCT');
      });

      it('should support column aliases', () => {
        const { sql } = createQueryBuilder()
          .select({ name: 'user_name', alias: 'userName' })
          .from('users')
          .toSQL();

        expect(sql).toContain('AS userName');
      });

      it('should support IS NULL operator', () => {
        const { sql, params } = createQueryBuilder()
          .select('*')
          .from('users')
          .where({ column: 'deleted_at', operator: 'is null', value: null })
          .toSQL();

        expect(sql).toContain('IS NULL');
        expect(params).toHaveLength(0);
      });

      it('should support IN operator', () => {
        const { sql, params } = createQueryBuilder()
          .select('*')
          .from('users')
          .where({ column: 'status', operator: 'in', value: ['active', 'pending'] })
          .toSQL();

        expect(sql).toContain('IN');
        expect(params).toContain('active');
        expect(params).toContain('pending');
      });

      it('should support BETWEEN operator', () => {
        const { sql, params } = createQueryBuilder()
          .select('*')
          .from('users')
          .where({ column: 'age', operator: 'between', value: [18, 65] })
          .toSQL();

        expect(sql).toContain('BETWEEN');
        expect(params).toContain(18);
        expect(params).toContain(65);
      });
    });

    describe('createInsertBuilder', () => {
      it('should be a function', () => {
        expect(typeof createInsertBuilder).toBe('function');
      });

      it('should build INSERT query', () => {
        const builder = createInsertBuilder<{ name: string; email: string }>('users');
        const { sql, params } = builder
          .values({ name: 'John', email: 'john@example.com' })
          .toSQL();

        expect(sql).toContain('INSERT INTO users');
        expect(sql).toContain('VALUES');
        expect(params).toContain('John');
        expect(params).toContain('john@example.com');
      });

      it('should support bulk insert', () => {
        const builder = createInsertBuilder<{ name: string }>('users');
        const { sql, params } = builder
          .values([{ name: 'John' }, { name: 'Jane' }])
          .toSQL();

        expect(sql).toContain('VALUES');
        expect(params).toHaveLength(2);
      });

      it('should support ON CONFLICT DO NOTHING', () => {
        const builder = createInsertBuilder<{ email: string }>('users');
        const { sql } = builder
          .onConflict({ target: 'email', action: 'do nothing' })
          .values({ email: 'test@example.com' })
          .toSQL();

        expect(sql).toContain('ON CONFLICT');
        expect(sql).toContain('DO NOTHING');
      });

      it('should support ON CONFLICT DO UPDATE', () => {
        const builder = createInsertBuilder<{ email: string; name: string }>('users');
        const { sql } = builder
          .onConflict({ target: 'email', action: 'do update', set: { name: 'Updated' } })
          .values({ email: 'test@example.com', name: 'Test' })
          .toSQL();

        expect(sql).toContain('ON CONFLICT');
        expect(sql).toContain('DO UPDATE SET');
      });

      it('should support RETURNING clause', () => {
        const builder = createInsertBuilder<{ name: string }>('users');
        const { sql } = builder
          .values({ name: 'John' })
          .returning('id', 'name')
          .toSQL();

        expect(sql).toContain('RETURNING');
        expect(sql).toContain('id, name');
      });
    });

    describe('createUpdateBuilder', () => {
      it('should be a function', () => {
        expect(typeof createUpdateBuilder).toBe('function');
      });

      it('should build UPDATE query', () => {
        const builder = createUpdateBuilder<{ name: string; email: string }>('users');
        const { sql, params } = builder
          .set({ name: 'John Updated' })
          .where({ column: 'id', operator: '=', value: 1 })
          .toSQL();

        expect(sql).toContain('UPDATE users SET');
        expect(sql).toContain('WHERE');
        expect(params).toContain('John Updated');
        expect(params).toContain(1);
      });

      it('should support RETURNING clause', () => {
        const builder = createUpdateBuilder<{ name: string }>('users');
        const { sql } = builder
          .set({ name: 'Updated' })
          .where({ column: 'id', operator: '=', value: 1 })
          .returning('*')
          .toSQL();

        expect(sql).toContain('RETURNING');
      });
    });

    describe('createDeleteBuilder', () => {
      it('should be a function', () => {
        expect(typeof createDeleteBuilder).toBe('function');
      });

      it('should build DELETE query', () => {
        const builder = createDeleteBuilder('users');
        const { sql, params } = builder
          .where({ column: 'id', operator: '=', value: 1 })
          .toSQL();

        expect(sql).toContain('DELETE FROM users');
        expect(sql).toContain('WHERE');
        expect(params).toContain(1);
      });

      it('should support RETURNING clause', () => {
        const builder = createDeleteBuilder<{ id: number }>('users');
        const { sql } = builder
          .where({ column: 'id', operator: '=', value: 1 })
          .returning('id')
          .toSQL();

        expect(sql).toContain('RETURNING');
      });
    });
  });

  describe('Raw Query Functions', () => {
    describe('executeRaw', () => {
      it('should be a function', () => {
        expect(typeof executeRaw).toBe('function');
      });

      it('should throw if not connected', async () => {
        await disconnect();
        await expect(executeRaw('SELECT * FROM users')).rejects.toThrow('Database not connected');
      });
    });

    describe('executeRawMutation', () => {
      it('should be a function', () => {
        expect(typeof executeRawMutation).toBe('function');
      });

      it('should throw if not connected', async () => {
        await disconnect();
        await expect(executeRawMutation('DELETE FROM users')).rejects.toThrow('Database not connected');
      });
    });
  });

  describe('Schema Utilities', () => {
    describe('defineSchema', () => {
      it('should be a function', () => {
        expect(typeof defineSchema).toBe('function');
      });

      it('should return schema definition', () => {
        const schema = defineSchema({
          tables: [
            {
              name: 'users',
              columns: [
                { name: 'id', type: 'serial', primaryKey: true },
                { name: 'name', type: 'varchar' },
              ],
            },
          ],
        });
        expect(schema.tables).toHaveLength(1);
      });
    });

    describe('generateSQL', () => {
      it('should be a function', () => {
        expect(typeof generateSQL).toBe('function');
      });

      it('should generate CREATE TABLE statements', () => {
        const schema = defineSchema({
          tables: [
            {
              name: 'users',
              columns: [
                { name: 'id', type: 'serial', primaryKey: true },
                { name: 'name', type: 'varchar', nullable: false },
                { name: 'email', type: 'varchar', unique: true },
              ],
            },
          ],
        });

        const statements = generateSQL(schema, 'postgresql');
        expect(statements.length).toBeGreaterThan(0);
        expect(statements[0]).toContain('CREATE TABLE');
        expect(statements[0]).toContain('users');
      });

      it('should generate enum types for PostgreSQL', () => {
        const schema = defineSchema({
          tables: [{ name: 'users', columns: [{ name: 'id', type: 'serial' }] }],
          enums: [{ name: 'status', values: ['active', 'inactive', 'pending'] }],
        });

        const statements = generateSQL(schema, 'postgresql');
        expect(statements.some(s => s.includes('CREATE TYPE'))).toBe(true);
        expect(statements.some(s => s.includes('ENUM'))).toBe(true);
      });

      it('should generate indexes', () => {
        const schema = defineSchema({
          tables: [
            {
              name: 'users',
              columns: [
                { name: 'id', type: 'serial' },
                { name: 'email', type: 'varchar' },
              ],
              indexes: [
                { name: 'idx_email', table: 'users', columns: ['email'], unique: true },
              ],
            },
          ],
        });

        const statements = generateSQL(schema, 'postgresql');
        expect(statements.some(s => s.includes('CREATE UNIQUE INDEX'))).toBe(true);
      });

      it('should generate foreign key constraints', () => {
        const schema = defineSchema({
          tables: [
            {
              name: 'posts',
              columns: [
                { name: 'id', type: 'serial' },
                { name: 'author_id', type: 'integer' },
              ],
              foreignKeys: [
                {
                  columns: ['author_id'],
                  references: { table: 'users', columns: ['id'] },
                  onDelete: 'cascade',
                },
              ],
            },
          ],
        });

        const statements = generateSQL(schema, 'postgresql');
        expect(statements[0]).toContain('FOREIGN KEY');
        expect(statements[0]).toContain('REFERENCES');
        expect(statements[0]).toContain('ON DELETE CASCADE');
      });

      it('should generate check constraints', () => {
        const schema = defineSchema({
          tables: [
            {
              name: 'users',
              columns: [
                { name: 'id', type: 'serial' },
                { name: 'age', type: 'integer' },
              ],
              checks: [{ name: 'age_positive', expression: 'age > 0' }],
            },
          ],
        });

        const statements = generateSQL(schema, 'postgresql');
        expect(statements[0]).toContain('CONSTRAINT age_positive CHECK');
      });
    });
  });

  describe('Migration Utilities', () => {
    beforeEach(async () => {
      await connect({
        dialect: 'postgresql',
        connection: 'postgres://localhost:5432/test',
      });
    });

    afterEach(async () => {
      await disconnect();
    });

    describe('runMigrations', () => {
      it('should be a function', () => {
        expect(typeof runMigrations).toBe('function');
      });
    });

    describe('rollbackMigration', () => {
      it('should be a function', () => {
        expect(typeof rollbackMigration).toBe('function');
      });
    });

    describe('getMigrationStatus', () => {
      it('should be a function', () => {
        expect(typeof getMigrationStatus).toBe('function');
      });
    });
  });

  describe('SSR Utilities', () => {
    describe('createSSRDataLoader', () => {
      it('should be a function', () => {
        expect(typeof createSSRDataLoader).toBe('function');
      });

      it('should create SSR data loader', () => {
        const loader = createSSRDataLoader('users', async () => [{ id: 1 }]);
        expect(loader.getKey()).toBe('users');
        expect(typeof loader.load).toBe('function');
        expect(typeof loader.serialize).toBe('function');
        expect(typeof loader.deserialize).toBe('function');
      });

      it('should serialize and deserialize data', () => {
        const loader = createSSRDataLoader('test', async () => ({ foo: 'bar' }));
        const data = { foo: 'bar' };
        const serialized = loader.serialize(data);
        const deserialized = loader.deserialize(serialized);
        expect(deserialized).toEqual(data);
      });
    });

    describe('prefetchForSSR', () => {
      it('should be a function', () => {
        expect(typeof prefetchForSSR).toBe('function');
      });

      it('should prefetch data from multiple loaders', async () => {
        const loader1 = createSSRDataLoader('users', async () => [{ id: 1 }]);
        const loader2 = createSSRDataLoader('posts', async () => [{ id: 2 }]);

        const results = await prefetchForSSR([loader1, loader2]);
        expect(results.get('users')).toEqual([{ id: 1 }]);
        expect(results.get('posts')).toEqual([{ id: 2 }]);
      });
    });

    describe('hydrateFromSSR', () => {
      it('should be a function', () => {
        expect(typeof hydrateFromSSR).toBe('function');
      });

      it('should return null in non-browser environment', () => {
        const result = hydrateFromSSR('test');
        expect(result).toBeNull();
      });
    });
  });

  describe('Cache Utilities', () => {
    describe('clearCache', () => {
      it('should be a function', () => {
        expect(typeof clearCache).toBe('function');
      });

      it('should clear all cache when no key provided', () => {
        warmCache('test1', { data: 1 });
        warmCache('test2', { data: 2 });
        clearCache();
        expect(getCacheStats().size).toBe(0);
      });

      it('should clear specific key', () => {
        warmCache('test1', { data: 1 });
        warmCache('test2', { data: 2 });
        clearCache('test1');
        const stats = getCacheStats();
        expect(stats.keys).not.toContain('test1');
        expect(stats.keys).toContain('test2');
      });
    });

    describe('getCacheStats', () => {
      it('should be a function', () => {
        expect(typeof getCacheStats).toBe('function');
      });

      it('should return cache statistics', () => {
        clearCache();
        warmCache('test', { data: 'value' });
        const stats = getCacheStats();
        expect(stats.size).toBe(1);
        expect(stats.keys).toContain('test');
        expect(stats.totalMemory).toBeGreaterThan(0);
      });
    });

    describe('warmCache', () => {
      it('should be a function', () => {
        expect(typeof warmCache).toBe('function');
      });

      it('should add data to cache', () => {
        clearCache();
        warmCache('new-key', { foo: 'bar' });
        const stats = getCacheStats();
        expect(stats.keys).toContain('new-key');
      });

      it('should accept custom TTL', () => {
        clearCache();
        warmCache('ttl-key', { data: 1 }, 60000);
        const stats = getCacheStats();
        expect(stats.keys).toContain('ttl-key');
      });
    });
  });

  describe('SQL Helpers', () => {
    beforeEach(async () => {
      await connect({
        dialect: 'postgresql',
        connection: 'postgres://localhost:5432/test',
      });
    });

    afterEach(async () => {
      await disconnect();
    });

    describe('sql.raw', () => {
      it('should create raw SQL query', () => {
        const query = sql.raw('SELECT NOW()');
        expect(query.sql).toBe('SELECT NOW()');
      });
    });

    describe('sql.param', () => {
      it('should create parameter placeholder', () => {
        const param = sql.param('value');
        expect(param.value).toBe('value');
        expect(param.__param).toBe(true);
      });
    });

    describe('sql.identifier', () => {
      it('should quote identifier for PostgreSQL', () => {
        const quoted = sql.identifier('table_name');
        expect(quoted).toBe('"table_name"');
      });
    });

    describe('sql.now', () => {
      it('should return CURRENT_TIMESTAMP for PostgreSQL', () => {
        expect(sql.now()).toBe('CURRENT_TIMESTAMP');
      });
    });

    describe('sql.uuid', () => {
      it('should return gen_random_uuid() for PostgreSQL', () => {
        expect(sql.uuid()).toBe('gen_random_uuid()');
      });
    });

    describe('sql.json', () => {
      it('should format JSON for PostgreSQL', () => {
        const result = sql.json({ foo: 'bar' });
        expect(result).toContain('::jsonb');
        expect(result).toContain('"foo"');
      });
    });

    describe('sql.array', () => {
      it('should format array for PostgreSQL', () => {
        const result = sql.array([1, 2, 3]);
        expect(result).toContain('ARRAY[');
        expect(result).toContain('1, 2, 3');
      });

      it('should quote string values', () => {
        const result = sql.array(['a', 'b']);
        expect(result).toContain("'a'");
        expect(result).toContain("'b'");
      });
    });

    describe('sql.coalesce', () => {
      it('should create COALESCE expression', () => {
        const result = sql.coalesce('name', "'Unknown'");
        expect(result).toBe("COALESCE(name, 'Unknown')");
      });
    });

    describe('sql.case', () => {
      it('should create CASE expression', () => {
        const result = sql.case(
          [
            { when: "status = 'active'", then: 1 },
            { when: "status = 'inactive'", then: 0 },
          ],
          -1
        );
        expect(result).toContain('CASE');
        expect(result).toContain('WHEN');
        expect(result).toContain('THEN');
        expect(result).toContain('ELSE');
        expect(result).toContain('END');
      });

      it('should work without ELSE clause', () => {
        const result = sql.case([{ when: 'true', then: 1 }]);
        expect(result).not.toContain('ELSE');
      });
    });
  });

  describe('Batch Operations', () => {
    describe('batchExecute', () => {
      it('should be a function', () => {
        expect(typeof batchExecute).toBe('function');
      });

      it('should throw if not connected', async () => {
        await disconnect();
        await expect(batchExecute([{ sql: 'DELETE FROM users' }])).rejects.toThrow('Database not connected');
      });
    });

    describe('batchQuery', () => {
      it('should be a function', () => {
        expect(typeof batchQuery).toBe('function');
      });

      it('should throw if not connected', async () => {
        await disconnect();
        await expect(batchQuery([{ sql: 'SELECT * FROM users' }])).rejects.toThrow('Database not connected');
      });
    });
  });

  describe('Prepared Statements', () => {
    describe('prepare', () => {
      it('should be a function', () => {
        expect(typeof prepare).toBe('function');
      });

      it('should return prepared statement object', () => {
        const stmt = prepare<[number], { id: number; name: string }>(
          'SELECT * FROM users WHERE id = ?'
        );
        expect(typeof stmt.execute).toBe('function');
        expect(typeof stmt.executeTakeFirst).toBe('function');
        expect(typeof stmt.all).toBe('function');
      });
    });
  });

  describe('Dialect-Specific Behavior', () => {
    afterEach(async () => {
      await disconnect();
    });

    it('should quote MySQL identifiers with backticks', async () => {
      await connect({ dialect: 'mysql', connection: 'mysql://localhost:3306/test' });
      expect(sql.identifier('table')).toBe('`table`');
    });

    it('should use NOW() for MySQL', async () => {
      await connect({ dialect: 'mysql', connection: 'mysql://localhost:3306/test' });
      expect(sql.now()).toBe('NOW()');
    });

    it('should use UUID() for MySQL', async () => {
      await connect({ dialect: 'mysql', connection: 'mysql://localhost:3306/test' });
      expect(sql.uuid()).toBe('UUID()');
    });

    it('should use datetime("now") for SQLite', async () => {
      await connect({ dialect: 'sqlite', connection: ':memory:' });
      expect(sql.now()).toBe("datetime('now')");
    });
  });
});
