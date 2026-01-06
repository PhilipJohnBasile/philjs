// @philjs/drizzle - Drizzle ORM adapter for PhilJS
// Type-safe SQL with signals

import { signal, computed, effect, batch, type Signal, type Computed } from '@philjs/core';

// ============================================================================
// Types
// ============================================================================

export type DatabaseDialect = 'postgresql' | 'mysql' | 'sqlite' | 'turso' | 'planetscale' | 'neon' | 'd1';

export interface DrizzleConfig {
  dialect: DatabaseDialect;
  connection: string | ConnectionConfig;
  schema?: Record<string, unknown>;
  logger?: boolean | DrizzleLogger;
  pool?: PoolConfig;
  ssl?: boolean | SSLConfig;
}

export interface ConnectionConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  connectionString?: string;
}

export interface SSLConfig {
  rejectUnauthorized?: boolean;
  ca?: string;
  key?: string;
  cert?: string;
}

export interface PoolConfig {
  min?: number;
  max?: number;
  idleTimeoutMillis?: number;
  acquireTimeoutMillis?: number;
}

export interface DrizzleLogger {
  logQuery(query: string, params?: unknown[]): void;
}

export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  stale: boolean;
}

export interface PaginationState<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  loading: boolean;
  error: Error | null;
}

export interface MutationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  success: boolean;
}

export interface DrizzleHook<T> {
  data: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  refetch: () => Promise<void>;
  mutate: (data: T | null) => void;
}

export interface TransactionHook {
  execute: <T>(fn: (tx: DrizzleTransaction) => Promise<T>) => Promise<T>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
}

export interface TransactionOptions {
  isolationLevel?: 'read uncommitted' | 'read committed' | 'repeatable read' | 'serializable';
  accessMode?: 'read only' | 'read write';
  deferrable?: boolean;
}

export interface DrizzleTransaction {
  query: <T>(sql: SQLQuery) => Promise<T[]>;
  execute: (sql: SQLQuery) => Promise<ExecuteResult>;
  rollback: () => Promise<void>;
}

export interface SQLQuery {
  sql: string;
  params?: unknown[];
}

export interface ExecuteResult {
  rowsAffected: number;
  insertId?: number | string;
}

export interface QueryBuilder<T = unknown> {
  select: (...columns: Column[]) => QueryBuilder<T>;
  from: (table: Table) => QueryBuilder<T>;
  where: (condition: Condition) => QueryBuilder<T>;
  andWhere: (condition: Condition) => QueryBuilder<T>;
  orWhere: (condition: Condition) => QueryBuilder<T>;
  join: (table: Table, condition: Condition) => QueryBuilder<T>;
  leftJoin: (table: Table, condition: Condition) => QueryBuilder<T>;
  rightJoin: (table: Table, condition: Condition) => QueryBuilder<T>;
  fullJoin: (table: Table, condition: Condition) => QueryBuilder<T>;
  groupBy: (...columns: Column[]) => QueryBuilder<T>;
  having: (condition: Condition) => QueryBuilder<T>;
  orderBy: (column: Column, direction?: 'asc' | 'desc') => QueryBuilder<T>;
  limit: (count: number) => QueryBuilder<T>;
  offset: (count: number) => QueryBuilder<T>;
  distinct: () => QueryBuilder<T>;
  union: (query: QueryBuilder) => QueryBuilder<T>;
  unionAll: (query: QueryBuilder) => QueryBuilder<T>;
  toSQL: () => SQLQuery;
  execute: () => Promise<T[]>;
}

export interface QueryBuilderOptions {
  schema?: Record<string, unknown>;
  logging?: boolean;
}

export type Column = string | { name: string; alias?: string; table?: string };
export type Table = string | { name: string; alias?: string; schema?: string };
export type Condition = { column: string; operator: Operator; value: unknown } | string;
export type Operator = '=' | '!=' | '<' | '>' | '<=' | '>=' | 'like' | 'ilike' | 'in' | 'not in' | 'is null' | 'is not null' | 'between';

export interface SchemaDefinition {
  tables: TableDefinition[];
  enums?: EnumDefinition[];
  indexes?: IndexDefinition[];
}

export interface TableDefinition {
  name: string;
  schema?: string;
  columns: ColumnDefinition[];
  primaryKey?: string | string[];
  foreignKeys?: ForeignKeyDefinition[];
  indexes?: IndexDefinition[];
  checks?: CheckConstraint[];
}

export interface ColumnDefinition {
  name: string;
  type: ColumnType;
  nullable?: boolean;
  default?: unknown;
  primaryKey?: boolean;
  unique?: boolean;
  references?: { table: string; column: string; onDelete?: ReferenceAction; onUpdate?: ReferenceAction };
  check?: string;
}

export type ColumnType =
  | 'serial' | 'bigserial' | 'smallserial'
  | 'integer' | 'bigint' | 'smallint'
  | 'real' | 'double precision' | 'numeric' | 'decimal'
  | 'varchar' | 'char' | 'text'
  | 'boolean'
  | 'date' | 'time' | 'timestamp' | 'timestamptz' | 'interval'
  | 'uuid'
  | 'json' | 'jsonb'
  | 'bytea'
  | 'inet' | 'cidr' | 'macaddr'
  | 'point' | 'line' | 'lseg' | 'box' | 'path' | 'polygon' | 'circle';

export type ReferenceAction = 'cascade' | 'restrict' | 'no action' | 'set null' | 'set default';

export interface EnumDefinition {
  name: string;
  values: string[];
}

export interface IndexDefinition {
  name: string;
  table: string;
  columns: string[];
  unique?: boolean;
  where?: string;
  using?: 'btree' | 'hash' | 'gist' | 'gin' | 'spgist' | 'brin';
}

export interface ForeignKeyDefinition {
  columns: string[];
  references: { table: string; columns: string[] };
  onDelete?: ReferenceAction;
  onUpdate?: ReferenceAction;
}

export interface CheckConstraint {
  name: string;
  expression: string;
}

export interface MigrationConfig {
  migrationsFolder: string;
  migrationsTable?: string;
  migrationsSchema?: string;
}

export interface Migration {
  id: string;
  name: string;
  hash: string;
  executedAt?: Date;
}

export interface RelationConfig<T = unknown> {
  type: 'one' | 'many';
  from: keyof T;
  to: { table: string; column: string };
  through?: { table: string; fromColumn: string; toColumn: string };
}

// ============================================================================
// Global State
// ============================================================================

interface DrizzleInstance {
  config: DrizzleConfig;
  client: unknown;
  schema: Record<string, unknown>;
  connected: boolean;
}

let drizzleInstance: DrizzleInstance | null = null;
const queryCache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
const subscriptions = new Map<string, Set<() => void>>();

// ============================================================================
// Connection Management
// ============================================================================

export async function connect(config: DrizzleConfig): Promise<void> {
  if (drizzleInstance?.connected) {
    return;
  }

  const client = await createClient(config);

  drizzleInstance = {
    config,
    client,
    schema: config.schema || {},
    connected: true,
  };

  if (config.logger === true) {
    console.log(`[Drizzle] Connected to ${config.dialect} database`);
  }
}

async function createClient(config: DrizzleConfig): Promise<unknown> {
  // Client creation is dialect-specific
  // In production, this would import the appropriate driver
  return {
    dialect: config.dialect,
    connection: config.connection,
    query: async (sql: string, params?: unknown[]) => {
      if (config.logger === true) {
        console.log(`[Drizzle] Query: ${sql}`, params);
      }
      // Simulated query execution
      return [];
    },
    execute: async (sql: string, params?: unknown[]) => {
      if (config.logger === true) {
        console.log(`[Drizzle] Execute: ${sql}`, params);
      }
      return { rowsAffected: 0 };
    },
  };
}

export async function disconnect(): Promise<void> {
  if (!drizzleInstance) {
    return;
  }

  // Close connection pool
  drizzleInstance.connected = false;
  drizzleInstance = null;

  // Clear caches
  queryCache.clear();
  subscriptions.clear();
}

export function getClient(): unknown {
  if (!drizzleInstance) {
    throw new Error('Drizzle not connected. Call connect() first.');
  }
  return drizzleInstance.client;
}

export function isConnected(): boolean {
  return drizzleInstance?.connected ?? false;
}

export function getDialect(): DatabaseDialect | null {
  return drizzleInstance?.config.dialect ?? null;
}

// ============================================================================
// Core Query Hook
// ============================================================================

export function useDrizzle<T>(
  queryFn: () => SQLQuery | Promise<SQLQuery>,
  options: {
    enabled?: boolean | Signal<boolean>;
    refetchInterval?: number;
    staleTime?: number;
    cacheKey?: string;
    initialData?: T[];
    transform?: (data: unknown[]) => T[];
  } = {}
): DrizzleHook<T[]> & {
  state: Computed<QueryState<T[]>>;
  invalidate: () => void;
} {
  const {
    enabled = true,
    refetchInterval,
    staleTime = 5 * 60 * 1000,
    cacheKey,
    initialData,
    transform,
  } = options;

  const data = signal<T[] | null>(initialData ?? null);
  const loading = signal(false);
  const error = signal<Error | null>(null);
  const stale = signal(false);

  const state = computed<QueryState<T[]>>(() => ({
    data: data(),
    loading: loading(),
    error: error(),
    stale: stale(),
  }));

  const getCacheKey = (sql: SQLQuery): string => {
    return cacheKey || `${sql.sql}:${JSON.stringify(sql.params || [])}`;
  };

  const checkCache = (key: string): { data: T[]; fresh: boolean } | null => {
    const cached = queryCache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    const fresh = age < staleTime;

    return { data: cached.data as T[], fresh };
  };

  const setCache = (key: string, value: T[]): void => {
    queryCache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl: staleTime,
    });
  };

  const executeQuery = async (): Promise<void> => {
    if (!drizzleInstance?.connected) {
      error.set(new Error('Database not connected'));
      return;
    }

    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (!isEnabled) {
      return;
    }

    loading.set(true);
    error.set(null);

    try {
      const sqlQuery = await queryFn();
      const key = getCacheKey(sqlQuery);

      // Check cache first
      const cached = checkCache(key);
      if (cached) {
        data.set(cached.data);
        stale.set(!cached.fresh);
        if (cached.fresh) {
          loading.set(false);
          return;
        }
      }

      // Execute query
      const client = drizzleInstance.client as { query: (sql: string, params?: unknown[]) => Promise<unknown[]> };
      const result = await client.query(sqlQuery.sql, sqlQuery.params);

      const transformedData = transform ? transform(result) : result as T[];

      batch(() => {
        data.set(transformedData);
        loading.set(false);
        stale.set(false);
      });

      setCache(key, transformedData);

      // Notify subscribers
      const subs = subscriptions.get(key);
      if (subs) {
        subs.forEach(cb => cb());
      }
    } catch (err) {
      batch(() => {
        error.set(err instanceof Error ? err : new Error(String(err)));
        loading.set(false);
      });
    }
  };

  const invalidate = (): void => {
    if (cacheKey) {
      queryCache.delete(cacheKey);
    }
    stale.set(true);
    executeQuery();
  };

  const mutate = (newData: T[] | null): void => {
    data.set(newData);
  };

  // Initial fetch
  effect(() => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (isEnabled) {
      executeQuery();
    }
  });

  // Refetch interval
  if (refetchInterval && refetchInterval > 0) {
    const interval = setInterval(() => {
      const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
      if (isEnabled) {
        executeQuery();
      }
    }, refetchInterval);

    // Cleanup would be handled by component lifecycle
  }

  return {
    data,
    loading,
    error,
    state,
    refetch: executeQuery,
    mutate,
    invalidate,
  };
}

// ============================================================================
// Single Record Hook
// ============================================================================

export function useDrizzleOne<T>(
  queryFn: () => SQLQuery | Promise<SQLQuery>,
  options: {
    enabled?: boolean | Signal<boolean>;
    staleTime?: number;
    cacheKey?: string;
    initialData?: T;
  } = {}
): DrizzleHook<T> & {
  state: Computed<QueryState<T>>;
  invalidate: () => void;
} {
  const result = useDrizzle<T>(queryFn, {
    ...options,
    initialData: options.initialData ? [options.initialData] : undefined,
    transform: (data) => data as T[],
  });

  const singleData = computed(() => {
    const d = result.data();
    return d && d.length > 0 ? d[0] : null;
  });

  const state = computed<QueryState<T>>(() => ({
    data: singleData(),
    loading: result.loading(),
    error: result.error(),
    stale: false,
  }));

  return {
    data: signal(singleData()),
    loading: result.loading,
    error: result.error,
    state,
    refetch: result.refetch,
    mutate: (data: T | null) => result.mutate(data ? [data] : null),
    invalidate: result.invalidate,
  };
}

// ============================================================================
// Paginated Query Hook
// ============================================================================

export function usePaginated<T>(
  queryFn: (page: number, pageSize: number) => SQLQuery | Promise<SQLQuery>,
  countFn: () => SQLQuery | Promise<SQLQuery>,
  options: {
    initialPage?: number;
    pageSize?: number;
    enabled?: boolean | Signal<boolean>;
    staleTime?: number;
  } = {}
): {
  state: Computed<PaginationState<T>>;
  data: Signal<T[]>;
  page: Signal<number>;
  pageSize: Signal<number>;
  total: Signal<number>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  refetch: () => Promise<void>;
} {
  const {
    initialPage = 1,
    pageSize: initialPageSize = 20,
    enabled = true,
    staleTime = 5 * 60 * 1000,
  } = options;

  const data = signal<T[]>([]);
  const page = signal(initialPage);
  const pageSize = signal(initialPageSize);
  const total = signal(0);
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const totalPages = computed(() => Math.ceil(total() / pageSize()));
  const hasNext = computed(() => page() < totalPages());
  const hasPrev = computed(() => page() > 1);

  const state = computed<PaginationState<T>>(() => ({
    data: data(),
    page: page(),
    pageSize: pageSize(),
    total: total(),
    totalPages: totalPages(),
    hasNext: hasNext(),
    hasPrev: hasPrev(),
    loading: loading(),
    error: error(),
  }));

  const fetchData = async (): Promise<void> => {
    if (!drizzleInstance?.connected) {
      error.set(new Error('Database not connected'));
      return;
    }

    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (!isEnabled) {
      return;
    }

    loading.set(true);
    error.set(null);

    try {
      const client = drizzleInstance.client as { query: (sql: string, params?: unknown[]) => Promise<unknown[]> };

      // Get count
      const countQuery = await countFn();
      const countResult = await client.query(countQuery.sql, countQuery.params);
      const countValue = (countResult[0] as { count: number })?.count || 0;

      // Get data
      const dataQuery = await queryFn(page(), pageSize());
      const result = await client.query(dataQuery.sql, dataQuery.params);

      batch(() => {
        data.set(result as T[]);
        total.set(countValue);
        loading.set(false);
      });
    } catch (err) {
      batch(() => {
        error.set(err instanceof Error ? err : new Error(String(err)));
        loading.set(false);
      });
    }
  };

  const goToPage = (newPage: number): void => {
    const maxPage = totalPages();
    const validPage = Math.max(1, Math.min(newPage, maxPage || 1));
    page.set(validPage);
  };

  const nextPage = (): void => {
    if (hasNext()) {
      page.set(page() + 1);
    }
  };

  const prevPage = (): void => {
    if (hasPrev()) {
      page.set(page() - 1);
    }
  };

  const setPageSize = (size: number): void => {
    pageSize.set(size);
    page.set(1); // Reset to first page
  };

  // Refetch when page or pageSize changes
  effect(() => {
    const _page = page();
    const _pageSize = pageSize();
    fetchData();
  });

  return {
    state,
    data,
    page,
    pageSize,
    total,
    loading,
    error,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    refetch: fetchData,
  };
}

// ============================================================================
// Infinite Query Hook
// ============================================================================

export function useInfinite<T>(
  queryFn: (cursor: unknown, pageSize: number) => SQLQuery | Promise<SQLQuery>,
  options: {
    pageSize?: number;
    getNextCursor?: (data: T[]) => unknown;
    enabled?: boolean | Signal<boolean>;
  } = {}
): {
  data: Signal<T[]>;
  loading: Signal<boolean>;
  loadingMore: Signal<boolean>;
  error: Signal<Error | null>;
  hasMore: Signal<boolean>;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  reset: () => void;
} {
  const {
    pageSize = 20,
    getNextCursor = (data) => (data as Array<{ id: unknown }>).at(-1)?.id,
    enabled = true,
  } = options;

  const data = signal<T[]>([]);
  const loading = signal(false);
  const loadingMore = signal(false);
  const error = signal<Error | null>(null);
  const cursor = signal<unknown>(null);
  const hasMore = signal(true);

  const fetchData = async (isLoadMore = false): Promise<void> => {
    if (!drizzleInstance?.connected) {
      error.set(new Error('Database not connected'));
      return;
    }

    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (!isEnabled) {
      return;
    }

    if (isLoadMore) {
      loadingMore.set(true);
    } else {
      loading.set(true);
    }
    error.set(null);

    try {
      const client = drizzleInstance.client as { query: (sql: string, params?: unknown[]) => Promise<unknown[]> };
      const sqlQuery = await queryFn(cursor(), pageSize);
      const result = await client.query(sqlQuery.sql, sqlQuery.params) as T[];

      batch(() => {
        if (isLoadMore) {
          data.set([...data(), ...result]);
        } else {
          data.set(result);
        }

        if (result.length < pageSize) {
          hasMore.set(false);
        } else {
          cursor.set(getNextCursor(result));
        }

        loading.set(false);
        loadingMore.set(false);
      });
    } catch (err) {
      batch(() => {
        error.set(err instanceof Error ? err : new Error(String(err)));
        loading.set(false);
        loadingMore.set(false);
      });
    }
  };

  const loadMore = async (): Promise<void> => {
    if (!hasMore() || loadingMore()) {
      return;
    }
    await fetchData(true);
  };

  const reset = (): void => {
    batch(() => {
      data.set([]);
      cursor.set(null);
      hasMore.set(true);
    });
    fetchData();
  };

  // Initial fetch
  effect(() => {
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled;
    if (isEnabled) {
      fetchData();
    }
  });

  return {
    data,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refetch: () => fetchData(),
    reset,
  };
}

// ============================================================================
// Mutation Hook
// ============================================================================

export function useMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => SQLQuery | Promise<SQLQuery>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
    onError?: (error: Error, variables: TVariables) => void | Promise<void>;
    onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void | Promise<void>;
    invalidateKeys?: string[];
    optimisticUpdate?: (variables: TVariables) => void;
    rollback?: (error: Error, variables: TVariables) => void;
  } = {}
): {
  state: Computed<MutationState<TData>>;
  data: Signal<TData | null>;
  loading: Signal<boolean>;
  error: Signal<Error | null>;
  success: Signal<boolean>;
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  reset: () => void;
} {
  const {
    onSuccess,
    onError,
    onSettled,
    invalidateKeys,
    optimisticUpdate,
    rollback,
  } = options;

  const data = signal<TData | null>(null);
  const loading = signal(false);
  const error = signal<Error | null>(null);
  const success = signal(false);

  const state = computed<MutationState<TData>>(() => ({
    data: data(),
    loading: loading(),
    error: error(),
    success: success(),
  }));

  const executeMutation = async (variables: TVariables): Promise<TData> => {
    if (!drizzleInstance?.connected) {
      throw new Error('Database not connected');
    }

    loading.set(true);
    error.set(null);
    success.set(false);

    // Apply optimistic update
    if (optimisticUpdate) {
      optimisticUpdate(variables);
    }

    try {
      const client = drizzleInstance.client as { execute: (sql: string, params?: unknown[]) => Promise<unknown> };
      const sqlQuery = await mutationFn(variables);
      const result = await client.execute(sqlQuery.sql, sqlQuery.params) as TData;

      batch(() => {
        data.set(result);
        loading.set(false);
        success.set(true);
      });

      // Invalidate cache keys
      if (invalidateKeys) {
        invalidateKeys.forEach(key => queryCache.delete(key));
      }

      if (onSuccess) {
        await onSuccess(result, variables);
      }

      if (onSettled) {
        await onSettled(result, null, variables);
      }

      return result;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));

      // Rollback optimistic update
      if (rollback) {
        rollback(errorObj, variables);
      }

      batch(() => {
        error.set(errorObj);
        loading.set(false);
        success.set(false);
      });

      if (onError) {
        await onError(errorObj, variables);
      }

      if (onSettled) {
        await onSettled(null, errorObj, variables);
      }

      throw errorObj;
    }
  };

  const reset = (): void => {
    batch(() => {
      data.set(null);
      loading.set(false);
      error.set(null);
      success.set(false);
    });
  };

  return {
    state,
    data,
    loading,
    error,
    success,
    mutate: executeMutation,
    mutateAsync: executeMutation,
    reset,
  };
}

// ============================================================================
// Transaction Hook
// ============================================================================

export function useTransaction(
  options: TransactionOptions = {}
): TransactionHook & {
  state: Computed<{ loading: boolean; error: Error | null }>;
} {
  const loading = signal(false);
  const error = signal<Error | null>(null);

  const state = computed(() => ({
    loading: loading(),
    error: error(),
  }));

  const execute = async <T>(fn: (tx: DrizzleTransaction) => Promise<T>): Promise<T> => {
    if (!drizzleInstance?.connected) {
      throw new Error('Database not connected');
    }

    loading.set(true);
    error.set(null);

    const client = drizzleInstance.client as {
      query: (sql: string, params?: unknown[]) => Promise<unknown[]>;
      execute: (sql: string, params?: unknown[]) => Promise<ExecuteResult>;
    };

    try {
      // Begin transaction
      await client.execute('BEGIN');

      if (options.isolationLevel) {
        await client.execute(`SET TRANSACTION ISOLATION LEVEL ${options.isolationLevel.toUpperCase()}`);
      }

      if (options.accessMode) {
        await client.execute(`SET TRANSACTION ${options.accessMode.toUpperCase()}`);
      }

      const tx: DrizzleTransaction = {
        query: async <R>(sql: SQLQuery): Promise<R[]> => {
          return await client.query(sql.sql, sql.params) as R[];
        },
        execute: async (sql: SQLQuery): Promise<ExecuteResult> => {
          return await client.execute(sql.sql, sql.params);
        },
        rollback: async (): Promise<void> => {
          await client.execute('ROLLBACK');
        },
      };

      const result = await fn(tx);
      await client.execute('COMMIT');

      loading.set(false);
      return result;
    } catch (err) {
      await client.execute('ROLLBACK');

      const errorObj = err instanceof Error ? err : new Error(String(err));
      batch(() => {
        error.set(errorObj);
        loading.set(false);
      });

      throw errorObj;
    }
  };

  return {
    execute,
    loading,
    error,
    state,
  };
}

// ============================================================================
// Query Builder
// ============================================================================

export function createQueryBuilder<T = unknown>(
  options: QueryBuilderOptions = {}
): QueryBuilder<T> {
  const parts: {
    select: Column[];
    from: Table | null;
    joins: Array<{ type: string; table: Table; condition: Condition }>;
    where: Array<{ type: 'and' | 'or'; condition: Condition }>;
    groupBy: Column[];
    having: Condition | null;
    orderBy: Array<{ column: Column; direction: 'asc' | 'desc' }>;
    limit: number | null;
    offset: number | null;
    distinct: boolean;
    unions: Array<{ type: 'union' | 'union all'; query: QueryBuilder }>;
  } = {
    select: [],
    from: null,
    joins: [],
    where: [],
    groupBy: [],
    having: null,
    orderBy: [],
    limit: null,
    offset: null,
    distinct: false,
    unions: [],
  };

  const formatColumn = (col: Column): string => {
    if (typeof col === 'string') return col;
    let result = col.table ? `${col.table}.${col.name}` : col.name;
    if (col.alias) result += ` AS ${col.alias}`;
    return result;
  };

  const formatTable = (table: Table): string => {
    if (typeof table === 'string') return table;
    let result = table.schema ? `${table.schema}.${table.name}` : table.name;
    if (table.alias) result += ` AS ${table.alias}`;
    return result;
  };

  const formatCondition = (cond: Condition): string => {
    if (typeof cond === 'string') return cond;
    const { column, operator, value } = cond;

    if (operator === 'is null' || operator === 'is not null') {
      return `${column} ${operator.toUpperCase()}`;
    }

    if (operator === 'in' || operator === 'not in') {
      const values = Array.isArray(value) ? value : [value];
      return `${column} ${operator.toUpperCase()} (${values.map(() => '?').join(', ')})`;
    }

    if (operator === 'between') {
      return `${column} BETWEEN ? AND ?`;
    }

    return `${column} ${operator.toUpperCase()} ?`;
  };

  const getConditionParams = (cond: Condition): unknown[] => {
    if (typeof cond === 'string') return [];
    const { operator, value } = cond;

    if (operator === 'is null' || operator === 'is not null') {
      return [];
    }

    if (operator === 'in' || operator === 'not in') {
      return Array.isArray(value) ? value : [value];
    }

    if (operator === 'between') {
      return Array.isArray(value) ? value.slice(0, 2) : [value, value];
    }

    return [value];
  };

  const builder: QueryBuilder<T> = {
    select: (...columns: Column[]) => {
      parts.select.push(...columns);
      return builder;
    },
    from: (table: Table) => {
      parts.from = table;
      return builder;
    },
    where: (condition: Condition) => {
      parts.where.push({ type: 'and', condition });
      return builder;
    },
    andWhere: (condition: Condition) => {
      parts.where.push({ type: 'and', condition });
      return builder;
    },
    orWhere: (condition: Condition) => {
      parts.where.push({ type: 'or', condition });
      return builder;
    },
    join: (table: Table, condition: Condition) => {
      parts.joins.push({ type: 'INNER JOIN', table, condition });
      return builder;
    },
    leftJoin: (table: Table, condition: Condition) => {
      parts.joins.push({ type: 'LEFT JOIN', table, condition });
      return builder;
    },
    rightJoin: (table: Table, condition: Condition) => {
      parts.joins.push({ type: 'RIGHT JOIN', table, condition });
      return builder;
    },
    fullJoin: (table: Table, condition: Condition) => {
      parts.joins.push({ type: 'FULL OUTER JOIN', table, condition });
      return builder;
    },
    groupBy: (...columns: Column[]) => {
      parts.groupBy.push(...columns);
      return builder;
    },
    having: (condition: Condition) => {
      parts.having = condition;
      return builder;
    },
    orderBy: (column: Column, direction: 'asc' | 'desc' = 'asc') => {
      parts.orderBy.push({ column, direction });
      return builder;
    },
    limit: (count: number) => {
      parts.limit = count;
      return builder;
    },
    offset: (count: number) => {
      parts.offset = count;
      return builder;
    },
    distinct: () => {
      parts.distinct = true;
      return builder;
    },
    union: (query: QueryBuilder) => {
      parts.unions.push({ type: 'union', query });
      return builder;
    },
    unionAll: (query: QueryBuilder) => {
      parts.unions.push({ type: 'union all', query });
      return builder;
    },
    toSQL: (): SQLQuery => {
      const sqlParts: string[] = [];
      const params: unknown[] = [];

      // SELECT
      const selectClause = parts.distinct ? 'SELECT DISTINCT' : 'SELECT';
      const columns = parts.select.length > 0
        ? parts.select.map(formatColumn).join(', ')
        : '*';
      sqlParts.push(`${selectClause} ${columns}`);

      // FROM
      if (parts.from) {
        sqlParts.push(`FROM ${formatTable(parts.from)}`);
      }

      // JOINS
      for (const join of parts.joins) {
        sqlParts.push(`${join.type} ${formatTable(join.table)} ON ${formatCondition(join.condition)}`);
        params.push(...getConditionParams(join.condition));
      }

      // WHERE
      if (parts.where.length > 0) {
        const whereClauses = parts.where.map((w, i) => {
          const prefix = i === 0 ? 'WHERE' : w.type.toUpperCase();
          return `${prefix} ${formatCondition(w.condition)}`;
        });
        sqlParts.push(whereClauses.join(' '));

        for (const w of parts.where) {
          params.push(...getConditionParams(w.condition));
        }
      }

      // GROUP BY
      if (parts.groupBy.length > 0) {
        sqlParts.push(`GROUP BY ${parts.groupBy.map(formatColumn).join(', ')}`);
      }

      // HAVING
      if (parts.having) {
        sqlParts.push(`HAVING ${formatCondition(parts.having)}`);
        params.push(...getConditionParams(parts.having));
      }

      // ORDER BY
      if (parts.orderBy.length > 0) {
        const orderClauses = parts.orderBy.map(o =>
          `${formatColumn(o.column)} ${o.direction.toUpperCase()}`
        );
        sqlParts.push(`ORDER BY ${orderClauses.join(', ')}`);
      }

      // LIMIT
      if (parts.limit !== null) {
        sqlParts.push(`LIMIT ${parts.limit}`);
      }

      // OFFSET
      if (parts.offset !== null) {
        sqlParts.push(`OFFSET ${parts.offset}`);
      }

      let sql = sqlParts.join(' ');

      // UNIONS
      for (const union of parts.unions) {
        const unionQuery = union.query.toSQL();
        sql += ` ${union.type.toUpperCase()} ${unionQuery.sql}`;
        if (unionQuery.params) {
          params.push(...unionQuery.params);
        }
      }

      return { sql, params };
    },
    execute: async (): Promise<T[]> => {
      if (!drizzleInstance?.connected) {
        throw new Error('Database not connected');
      }

      const sqlQuery = builder.toSQL();
      const client = drizzleInstance.client as { query: (sql: string, params?: unknown[]) => Promise<unknown[]> };
      const result = await client.query(sqlQuery.sql, sqlQuery.params);

      if (options.logging) {
        console.log('[QueryBuilder]', sqlQuery.sql, sqlQuery.params);
      }

      return result as T[];
    },
  };

  return builder;
}

// ============================================================================
// Insert Builder
// ============================================================================

export function createInsertBuilder<T extends Record<string, unknown>>(
  table: Table
): {
  values: (data: T | T[]) => { toSQL: () => SQLQuery; execute: () => Promise<ExecuteResult>; returning: (...columns: Column[]) => { toSQL: () => SQLQuery; execute: () => Promise<T[]> } };
  onConflict: (config: { target: string | string[]; action: 'do nothing' | 'do update'; set?: Partial<T> }) => { values: (data: T | T[]) => { toSQL: () => SQLQuery; execute: () => Promise<ExecuteResult> } };
} {
  let conflictConfig: { target: string | string[]; action: string; set?: Partial<T> } | null = null;

  const formatTable = (t: Table): string => {
    if (typeof t === 'string') return t;
    return t.schema ? `${t.schema}.${t.name}` : t.name;
  };

  return {
    values: (data: T | T[]) => {
      const rows = Array.isArray(data) ? data : [data];
      if (rows.length === 0) {
        throw new Error('Cannot insert empty data');
      }

      const columns = Object.keys(rows[0]);
      const placeholders = rows.map(() =>
        `(${columns.map(() => '?').join(', ')})`
      ).join(', ');
      const params = rows.flatMap(row => columns.map(col => row[col]));

      let sql = `INSERT INTO ${formatTable(table)} (${columns.join(', ')}) VALUES ${placeholders}`;

      if (conflictConfig) {
        const target = Array.isArray(conflictConfig.target)
          ? conflictConfig.target.join(', ')
          : conflictConfig.target;

        if (conflictConfig.action === 'do nothing') {
          sql += ` ON CONFLICT (${target}) DO NOTHING`;
        } else if (conflictConfig.set) {
          const updates = Object.entries(conflictConfig.set)
            .map(([key]) => `${key} = EXCLUDED.${key}`)
            .join(', ');
          sql += ` ON CONFLICT (${target}) DO UPDATE SET ${updates}`;
        }
      }

      return {
        toSQL: () => ({ sql, params }),
        execute: async (): Promise<ExecuteResult> => {
          if (!drizzleInstance?.connected) {
            throw new Error('Database not connected');
          }
          const client = drizzleInstance.client as { execute: (sql: string, params?: unknown[]) => Promise<ExecuteResult> };
          return await client.execute(sql, params);
        },
        returning: (...returnColumns: Column[]) => {
          const returnClause = returnColumns.length > 0
            ? returnColumns.map(c => typeof c === 'string' ? c : c.name).join(', ')
            : '*';
          const returningSql = `${sql} RETURNING ${returnClause}`;

          return {
            toSQL: () => ({ sql: returningSql, params }),
            execute: async (): Promise<T[]> => {
              if (!drizzleInstance?.connected) {
                throw new Error('Database not connected');
              }
              const client = drizzleInstance.client as { query: (sql: string, params?: unknown[]) => Promise<unknown[]> };
              return await client.query(returningSql, params) as T[];
            },
          };
        },
      };
    },
    onConflict: (config) => {
      conflictConfig = config;
      return {
        values: (data: T | T[]) => {
          const rows = Array.isArray(data) ? data : [data];
          if (rows.length === 0) {
            throw new Error('Cannot insert empty data');
          }

          const columns = Object.keys(rows[0]);
          const placeholders = rows.map(() =>
            `(${columns.map(() => '?').join(', ')})`
          ).join(', ');
          const params = rows.flatMap(row => columns.map(col => row[col]));

          const target = Array.isArray(config.target)
            ? config.target.join(', ')
            : config.target;

          let sql = `INSERT INTO ${formatTable(table)} (${columns.join(', ')}) VALUES ${placeholders}`;

          if (config.action === 'do nothing') {
            sql += ` ON CONFLICT (${target}) DO NOTHING`;
          } else if (config.set) {
            const updates = Object.entries(config.set)
              .map(([key]) => `${key} = EXCLUDED.${key}`)
              .join(', ');
            sql += ` ON CONFLICT (${target}) DO UPDATE SET ${updates}`;
          }

          return {
            toSQL: () => ({ sql, params }),
            execute: async (): Promise<ExecuteResult> => {
              if (!drizzleInstance?.connected) {
                throw new Error('Database not connected');
              }
              const client = drizzleInstance.client as { execute: (sql: string, params?: unknown[]) => Promise<ExecuteResult> };
              return await client.execute(sql, params);
            },
          };
        },
      };
    },
  };
}

// ============================================================================
// Update Builder
// ============================================================================

export function createUpdateBuilder<T extends Record<string, unknown>>(
  table: Table
): {
  set: (data: Partial<T>) => {
    where: (condition: Condition) => { toSQL: () => SQLQuery; execute: () => Promise<ExecuteResult>; returning: (...columns: Column[]) => { toSQL: () => SQLQuery; execute: () => Promise<T[]> } };
    toSQL: () => SQLQuery;
    execute: () => Promise<ExecuteResult>;
  };
} {
  const formatTable = (t: Table): string => {
    if (typeof t === 'string') return t;
    return t.schema ? `${t.schema}.${t.name}` : t.name;
  };

  const formatCondition = (cond: Condition): string => {
    if (typeof cond === 'string') return cond;
    const { column, operator, value } = cond;

    if (operator === 'is null' || operator === 'is not null') {
      return `${column} ${operator.toUpperCase()}`;
    }

    if (operator === 'in' || operator === 'not in') {
      const values = Array.isArray(value) ? value : [value];
      return `${column} ${operator.toUpperCase()} (${values.map(() => '?').join(', ')})`;
    }

    return `${column} ${operator} ?`;
  };

  const getConditionParams = (cond: Condition): unknown[] => {
    if (typeof cond === 'string') return [];
    const { operator, value } = cond;

    if (operator === 'is null' || operator === 'is not null') {
      return [];
    }

    if (operator === 'in' || operator === 'not in') {
      return Array.isArray(value) ? value : [value];
    }

    return [value];
  };

  return {
    set: (data: Partial<T>) => {
      const entries = Object.entries(data);
      if (entries.length === 0) {
        throw new Error('Cannot update with empty data');
      }

      const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
      const setParams = entries.map(([, value]) => value);

      let baseSQL = `UPDATE ${formatTable(table)} SET ${setClause}`;
      let whereCondition: Condition | null = null;

      return {
        where: (condition: Condition) => {
          whereCondition = condition;
          const sql = `${baseSQL} WHERE ${formatCondition(condition)}`;
          const params = [...setParams, ...getConditionParams(condition)];

          return {
            toSQL: () => ({ sql, params }),
            execute: async (): Promise<ExecuteResult> => {
              if (!drizzleInstance?.connected) {
                throw new Error('Database not connected');
              }
              const client = drizzleInstance.client as { execute: (sql: string, params?: unknown[]) => Promise<ExecuteResult> };
              return await client.execute(sql, params);
            },
            returning: (...returnColumns: Column[]) => {
              const returnClause = returnColumns.length > 0
                ? returnColumns.map(c => typeof c === 'string' ? c : c.name).join(', ')
                : '*';
              const returningSql = `${sql} RETURNING ${returnClause}`;

              return {
                toSQL: () => ({ sql: returningSql, params }),
                execute: async (): Promise<T[]> => {
                  if (!drizzleInstance?.connected) {
                    throw new Error('Database not connected');
                  }
                  const client = drizzleInstance.client as { query: (sql: string, params?: unknown[]) => Promise<unknown[]> };
                  return await client.query(returningSql, params) as T[];
                },
              };
            },
          };
        },
        toSQL: () => ({ sql: baseSQL, params: setParams }),
        execute: async (): Promise<ExecuteResult> => {
          if (!drizzleInstance?.connected) {
            throw new Error('Database not connected');
          }
          const client = drizzleInstance.client as { execute: (sql: string, params?: unknown[]) => Promise<ExecuteResult> };
          return await client.execute(baseSQL, setParams);
        },
      };
    },
  };
}

// ============================================================================
// Delete Builder
// ============================================================================

export function createDeleteBuilder<T = unknown>(
  table: Table
): {
  where: (condition: Condition) => { toSQL: () => SQLQuery; execute: () => Promise<ExecuteResult>; returning: (...columns: Column[]) => { toSQL: () => SQLQuery; execute: () => Promise<T[]> } };
} {
  const formatTable = (t: Table): string => {
    if (typeof t === 'string') return t;
    return t.schema ? `${t.schema}.${t.name}` : t.name;
  };

  const formatCondition = (cond: Condition): string => {
    if (typeof cond === 'string') return cond;
    const { column, operator, value } = cond;

    if (operator === 'is null' || operator === 'is not null') {
      return `${column} ${operator.toUpperCase()}`;
    }

    if (operator === 'in' || operator === 'not in') {
      const values = Array.isArray(value) ? value : [value];
      return `${column} ${operator.toUpperCase()} (${values.map(() => '?').join(', ')})`;
    }

    return `${column} ${operator} ?`;
  };

  const getConditionParams = (cond: Condition): unknown[] => {
    if (typeof cond === 'string') return [];
    const { operator, value } = cond;

    if (operator === 'is null' || operator === 'is not null') {
      return [];
    }

    if (operator === 'in' || operator === 'not in') {
      return Array.isArray(value) ? value : [value];
    }

    return [value];
  };

  return {
    where: (condition: Condition) => {
      const sql = `DELETE FROM ${formatTable(table)} WHERE ${formatCondition(condition)}`;
      const params = getConditionParams(condition);

      return {
        toSQL: () => ({ sql, params }),
        execute: async (): Promise<ExecuteResult> => {
          if (!drizzleInstance?.connected) {
            throw new Error('Database not connected');
          }
          const client = drizzleInstance.client as { execute: (sql: string, params?: unknown[]) => Promise<ExecuteResult> };
          return await client.execute(sql, params);
        },
        returning: (...returnColumns: Column[]) => {
          const returnClause = returnColumns.length > 0
            ? returnColumns.map(c => typeof c === 'string' ? c : c.name).join(', ')
            : '*';
          const returningSql = `${sql} RETURNING ${returnClause}`;

          return {
            toSQL: () => ({ sql: returningSql, params }),
            execute: async (): Promise<T[]> => {
              if (!drizzleInstance?.connected) {
                throw new Error('Database not connected');
              }
              const client = drizzleInstance.client as { query: (sql: string, params?: unknown[]) => Promise<unknown[]> };
              return await client.query(returningSql, params) as T[];
            },
          };
        },
      };
    },
  };
}

// ============================================================================
// Raw Query
// ============================================================================

export function useRawQuery<T>(
  sql: string,
  params?: unknown[],
  options: {
    enabled?: boolean | Signal<boolean>;
    staleTime?: number;
    cacheKey?: string;
  } = {}
): DrizzleHook<T[]> {
  return useDrizzle<T>(() => ({ sql, params }), options);
}

export async function executeRaw<T>(sql: string, params?: unknown[]): Promise<T[]> {
  if (!drizzleInstance?.connected) {
    throw new Error('Database not connected');
  }

  const client = drizzleInstance.client as { query: (sql: string, params?: unknown[]) => Promise<unknown[]> };
  return await client.query(sql, params) as T[];
}

export async function executeRawMutation(sql: string, params?: unknown[]): Promise<ExecuteResult> {
  if (!drizzleInstance?.connected) {
    throw new Error('Database not connected');
  }

  const client = drizzleInstance.client as { execute: (sql: string, params?: unknown[]) => Promise<ExecuteResult> };
  return await client.execute(sql, params);
}

// ============================================================================
// Relations Hook
// ============================================================================

export function useRelations<T, R = unknown>(
  queryFn: () => SQLQuery | Promise<SQLQuery>,
  relations: {
    [K in keyof R]?: RelationConfig<T>;
  },
  options: {
    enabled?: boolean | Signal<boolean>;
    staleTime?: number;
  } = {}
): DrizzleHook<T & { [K in keyof R]?: R[K] }> & {
  loadRelation: <K extends keyof R>(key: K) => Promise<R[K]>;
  prefetchRelations: () => Promise<void>;
} {
  const mainQuery = useDrizzle<T>(queryFn, options);
  const relationData = signal<Partial<R>>({});

  const loadRelation = async <K extends keyof R>(key: K): Promise<R[K]> => {
    const config = relations[key];
    if (!config) {
      throw new Error(`Relation ${String(key)} not configured`);
    }

    const parentData = mainQuery.data();
    if (!parentData || parentData.length === 0) {
      return [] as unknown as R[K];
    }

    const parentIds = parentData.map(item => (item as Record<string, unknown>)[config.from as string]);

    let sql: string;
    let params: unknown[];

    if (config.through) {
      // Many-to-many through join table
      sql = `
        SELECT t.* FROM ${config.to.table} t
        JOIN ${config.through.table} j ON j.${config.through.toColumn} = t.${config.to.column}
        WHERE j.${config.through.fromColumn} IN (${parentIds.map(() => '?').join(', ')})
      `;
      params = parentIds;
    } else {
      sql = `SELECT * FROM ${config.to.table} WHERE ${config.to.column} IN (${parentIds.map(() => '?').join(', ')})`;
      params = parentIds;
    }

    const result = await executeRaw<unknown>(sql, params);

    relationData.set({
      ...relationData(),
      [key]: result,
    });

    return result as R[K];
  };

  const prefetchRelations = async (): Promise<void> => {
    await Promise.all(
      (Object.keys(relations) as Array<keyof R>).map(key => loadRelation(key))
    );
  };

  const combinedData = computed(() => {
    const main = mainQuery.data();
    const rels = relationData();

    if (!main) return null;

    return main.map(item => ({
      ...item,
      ...rels,
    })) as Array<T & { [K in keyof R]?: R[K] }>;
  });

  return {
    data: combinedData as Signal<Array<T & { [K in keyof R]?: R[K] }> | null>,
    loading: mainQuery.loading,
    error: mainQuery.error,
    refetch: mainQuery.refetch,
    mutate: (data) => mainQuery.mutate(data as T[] | null),
    loadRelation,
    prefetchRelations,
  };
}

// ============================================================================
// Optimistic Updates
// ============================================================================

export function useOptimistic<T extends { id: string | number }>(
  queryFn: () => SQLQuery | Promise<SQLQuery>,
  options: {
    enabled?: boolean | Signal<boolean>;
    staleTime?: number;
  } = {}
): DrizzleHook<T[]> & {
  optimisticInsert: (item: T) => void;
  optimisticUpdate: (id: string | number, updates: Partial<T>) => void;
  optimisticDelete: (id: string | number) => void;
  rollback: () => void;
} {
  const query = useDrizzle<T>(queryFn, options);
  const originalData = signal<T[] | null>(null);

  // Save original on first load
  effect(() => {
    const data = query.data();
    if (data && originalData() === null) {
      originalData.set([...data]);
    }
  });

  const optimisticInsert = (item: T): void => {
    const current = query.data();
    if (current) {
      if (originalData() === null) {
        originalData.set([...current]);
      }
      query.mutate([...current, item]);
    }
  };

  const optimisticUpdate = (id: string | number, updates: Partial<T>): void => {
    const current = query.data();
    if (current) {
      if (originalData() === null) {
        originalData.set([...current]);
      }
      const updated = current.map(item =>
        item.id === id ? { ...item, ...updates } : item
      );
      query.mutate(updated);
    }
  };

  const optimisticDelete = (id: string | number): void => {
    const current = query.data();
    if (current) {
      if (originalData() === null) {
        originalData.set([...current]);
      }
      query.mutate(current.filter(item => item.id !== id));
    }
  };

  const rollback = (): void => {
    const original = originalData();
    if (original) {
      query.mutate(original);
      originalData.set(null);
    }
  };

  return {
    ...query,
    optimisticInsert,
    optimisticUpdate,
    optimisticDelete,
    rollback,
  };
}

// ============================================================================
// Subscription / Real-time
// ============================================================================

export function useSubscription<T>(
  queryFn: () => SQLQuery | Promise<SQLQuery>,
  options: {
    pollingInterval?: number;
    enabled?: boolean | Signal<boolean>;
    onData?: (data: T[]) => void;
    staleTime?: number;
  } = {}
): DrizzleHook<T[]> & {
  pause: () => void;
  resume: () => void;
  isPaused: Signal<boolean>;
} {
  const { pollingInterval = 5000, onData, ...queryOptions } = options;

  const query = useDrizzle<T>(queryFn, {
    ...queryOptions,
    refetchInterval: pollingInterval,
  });

  const isPaused = signal(false);
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const startPolling = (): void => {
    if (intervalId) return;

    intervalId = setInterval(() => {
      if (!isPaused()) {
        query.refetch().then(() => {
          const data = query.data();
          if (data && onData) {
            onData(data);
          }
        });
      }
    }, pollingInterval);
  };

  const pause = (): void => {
    isPaused.set(true);
  };

  const resume = (): void => {
    isPaused.set(false);
  };

  // Start polling
  const isEnabled = typeof options.enabled === 'function' ? options.enabled() : options.enabled !== false;
  if (isEnabled) {
    startPolling();
  }

  return {
    ...query,
    pause,
    resume,
    isPaused,
  };
}

// ============================================================================
// Schema Utilities
// ============================================================================

export function defineSchema(definition: SchemaDefinition): SchemaDefinition {
  return definition;
}

export function generateSQL(schema: SchemaDefinition, dialect: DatabaseDialect = 'postgresql'): string[] {
  const statements: string[] = [];

  // Create enums (PostgreSQL only)
  if (dialect === 'postgresql' && schema.enums) {
    for (const enumDef of schema.enums) {
      const values = enumDef.values.map(v => `'${v}'`).join(', ');
      statements.push(`CREATE TYPE ${enumDef.name} AS ENUM (${values});`);
    }
  }

  // Create tables
  for (const table of schema.tables) {
    const tableName = table.schema ? `${table.schema}.${table.name}` : table.name;
    const columnDefs: string[] = [];

    for (const col of table.columns) {
      let colDef = `${col.name} ${col.type.toUpperCase()}`;

      if (col.primaryKey) colDef += ' PRIMARY KEY';
      if (!col.nullable && !col.primaryKey) colDef += ' NOT NULL';
      if (col.unique) colDef += ' UNIQUE';
      if (col.default !== undefined) colDef += ` DEFAULT ${formatDefault(col.default)}`;
      if (col.references) {
        colDef += ` REFERENCES ${col.references.table}(${col.references.column})`;
        if (col.references.onDelete) colDef += ` ON DELETE ${col.references.onDelete.toUpperCase()}`;
        if (col.references.onUpdate) colDef += ` ON UPDATE ${col.references.onUpdate.toUpperCase()}`;
      }
      if (col.check) colDef += ` CHECK (${col.check})`;

      columnDefs.push(colDef);
    }

    // Add composite primary key
    if (table.primaryKey && Array.isArray(table.primaryKey)) {
      columnDefs.push(`PRIMARY KEY (${table.primaryKey.join(', ')})`);
    }

    // Add foreign keys
    if (table.foreignKeys) {
      for (const fk of table.foreignKeys) {
        let fkDef = `FOREIGN KEY (${fk.columns.join(', ')}) REFERENCES ${fk.references.table}(${fk.references.columns.join(', ')})`;
        if (fk.onDelete) fkDef += ` ON DELETE ${fk.onDelete.toUpperCase()}`;
        if (fk.onUpdate) fkDef += ` ON UPDATE ${fk.onUpdate.toUpperCase()}`;
        columnDefs.push(fkDef);
      }
    }

    // Add check constraints
    if (table.checks) {
      for (const check of table.checks) {
        columnDefs.push(`CONSTRAINT ${check.name} CHECK (${check.expression})`);
      }
    }

    statements.push(`CREATE TABLE ${tableName} (\n  ${columnDefs.join(',\n  ')}\n);`);

    // Create table-level indexes
    if (table.indexes) {
      for (const idx of table.indexes) {
        const unique = idx.unique ? 'UNIQUE ' : '';
        const using = idx.using ? ` USING ${idx.using}` : '';
        const where = idx.where ? ` WHERE ${idx.where}` : '';
        statements.push(`CREATE ${unique}INDEX ${idx.name} ON ${tableName}${using} (${idx.columns.join(', ')})${where};`);
      }
    }
  }

  // Create global indexes
  if (schema.indexes) {
    for (const idx of schema.indexes) {
      const unique = idx.unique ? 'UNIQUE ' : '';
      const using = idx.using ? ` USING ${idx.using}` : '';
      const where = idx.where ? ` WHERE ${idx.where}` : '';
      statements.push(`CREATE ${unique}INDEX ${idx.name} ON ${idx.table}${using} (${idx.columns.join(', ')})${where};`);
    }
  }

  return statements;
}

function formatDefault(value: unknown): string {
  if (value === null) return 'NULL';
  if (typeof value === 'string') return `'${value}'`;
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number') return String(value);
  if (value instanceof Date) return `'${value.toISOString()}'`;
  return String(value);
}

// ============================================================================
// Migration Utilities
// ============================================================================

export async function runMigrations(config: MigrationConfig): Promise<Migration[]> {
  if (!drizzleInstance?.connected) {
    throw new Error('Database not connected');
  }

  const { migrationsTable = 'drizzle_migrations', migrationsSchema = 'public' } = config;
  const tableName = `${migrationsSchema}.${migrationsTable}`;

  // Ensure migrations table exists
  await executeRawMutation(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      hash VARCHAR(64) NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Get executed migrations
  const executed = await executeRaw<{ name: string; hash: string }>(`
    SELECT name, hash FROM ${tableName} ORDER BY id
  `);

  const executedNames = new Set(executed.map(m => m.name));
  const applied: Migration[] = [];

  // In production, this would read from the migrations folder
  // For now, return the executed migrations
  return executed.map((m, i) => ({
    id: String(i + 1),
    name: m.name,
    hash: m.hash,
    executedAt: new Date(),
  }));
}

export async function rollbackMigration(migrationName: string, config: MigrationConfig): Promise<void> {
  if (!drizzleInstance?.connected) {
    throw new Error('Database not connected');
  }

  const { migrationsTable = 'drizzle_migrations', migrationsSchema = 'public' } = config;
  const tableName = `${migrationsSchema}.${migrationsTable}`;

  await executeRawMutation(`DELETE FROM ${tableName} WHERE name = ?`, [migrationName]);
}

export async function getMigrationStatus(config: MigrationConfig): Promise<{
  applied: Migration[];
  pending: string[];
}> {
  if (!drizzleInstance?.connected) {
    throw new Error('Database not connected');
  }

  const { migrationsTable = 'drizzle_migrations', migrationsSchema = 'public' } = config;
  const tableName = `${migrationsSchema}.${migrationsTable}`;

  const applied = await executeRaw<{ id: number; name: string; hash: string; executed_at: Date }>(`
    SELECT * FROM ${tableName} ORDER BY id
  `);

  return {
    applied: applied.map(m => ({
      id: String(m.id),
      name: m.name,
      hash: m.hash,
      executedAt: m.executed_at,
    })),
    pending: [], // Would compare with filesystem in production
  };
}

// ============================================================================
// SSR Data Loader
// ============================================================================

export interface SSRDataLoader<T> {
  load: () => Promise<T>;
  getKey: () => string;
  serialize: (data: T) => string;
  deserialize: (data: string) => T;
}

export function createSSRDataLoader<T>(
  key: string,
  loader: () => Promise<T>
): SSRDataLoader<T> {
  return {
    load: loader,
    getKey: () => key,
    serialize: (data: T) => JSON.stringify(data),
    deserialize: (data: string) => JSON.parse(data) as T,
  };
}

export async function prefetchForSSR<T>(
  loaders: SSRDataLoader<T>[]
): Promise<Map<string, T>> {
  const results = new Map<string, T>();

  await Promise.all(
    loaders.map(async loader => {
      const data = await loader.load();
      results.set(loader.getKey(), data);
    })
  );

  return results;
}

export function hydrateFromSSR<T>(
  key: string,
  windowKey = '__DRIZZLE_DATA__'
): T | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const hydrationData = (window as Record<string, Record<string, string>>)[windowKey];
  if (!hydrationData || !hydrationData[key]) {
    return null;
  }

  try {
    return JSON.parse(hydrationData[key]) as T;
  } catch {
    return null;
  }
}

// ============================================================================
// Cache Management
// ============================================================================

export function clearCache(key?: string): void {
  if (key) {
    queryCache.delete(key);
  } else {
    queryCache.clear();
  }
}

export function getCacheStats(): {
  size: number;
  keys: string[];
  totalMemory: number;
} {
  const keys = Array.from(queryCache.keys());
  let totalMemory = 0;

  for (const [, value] of queryCache) {
    totalMemory += JSON.stringify(value.data).length;
  }

  return {
    size: queryCache.size,
    keys,
    totalMemory,
  };
}

export function warmCache<T>(key: string, data: T, ttl?: number): void {
  queryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttl || 5 * 60 * 1000,
  });
}

// ============================================================================
// Dialect-Specific Helpers
// ============================================================================

export const sql = {
  raw: (str: string): SQLQuery => ({ sql: str }),

  param: (value: unknown): { value: unknown; __param: true } => ({
    value,
    __param: true,
  }),

  identifier: (name: string): string => {
    const dialect = getDialect();
    switch (dialect) {
      case 'mysql':
        return `\`${name}\``;
      case 'sqlite':
      case 'postgresql':
      case 'neon':
      default:
        return `"${name}"`;
    }
  },

  now: (): string => {
    const dialect = getDialect();
    switch (dialect) {
      case 'mysql':
        return 'NOW()';
      case 'sqlite':
        return "datetime('now')";
      case 'postgresql':
      case 'neon':
      default:
        return 'CURRENT_TIMESTAMP';
    }
  },

  uuid: (): string => {
    const dialect = getDialect();
    switch (dialect) {
      case 'postgresql':
      case 'neon':
        return 'gen_random_uuid()';
      case 'mysql':
        return 'UUID()';
      case 'sqlite':
        return "lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))";
      default:
        return 'gen_random_uuid()';
    }
  },

  json: (value: unknown): string => {
    const dialect = getDialect();
    const json = JSON.stringify(value);
    switch (dialect) {
      case 'postgresql':
      case 'neon':
        return `'${json}'::jsonb`;
      default:
        return `'${json}'`;
    }
  },

  array: (values: unknown[]): string => {
    const dialect = getDialect();
    switch (dialect) {
      case 'postgresql':
      case 'neon':
        return `ARRAY[${values.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')}]`;
      default:
        return `(${values.map(v => typeof v === 'string' ? `'${v}'` : v).join(', ')})`;
    }
  },

  coalesce: (...values: unknown[]): string => {
    return `COALESCE(${values.join(', ')})`;
  },

  case: (conditions: Array<{ when: string; then: unknown }>, elseValue?: unknown): string => {
    const cases = conditions.map(c => `WHEN ${c.when} THEN ${c.then}`).join(' ');
    const elseClause = elseValue !== undefined ? ` ELSE ${elseValue}` : '';
    return `CASE ${cases}${elseClause} END`;
  },
};

// ============================================================================
// Batch Operations
// ============================================================================

export async function batchExecute(
  queries: SQLQuery[]
): Promise<ExecuteResult[]> {
  if (!drizzleInstance?.connected) {
    throw new Error('Database not connected');
  }

  const results: ExecuteResult[] = [];
  const client = drizzleInstance.client as { execute: (sql: string, params?: unknown[]) => Promise<ExecuteResult> };

  for (const query of queries) {
    const result = await client.execute(query.sql, query.params);
    results.push(result);
  }

  return results;
}

export async function batchQuery<T>(
  queries: SQLQuery[]
): Promise<T[][]> {
  if (!drizzleInstance?.connected) {
    throw new Error('Database not connected');
  }

  const results: T[][] = [];
  const client = drizzleInstance.client as { query: (sql: string, params?: unknown[]) => Promise<unknown[]> };

  for (const query of queries) {
    const result = await client.query(query.sql, query.params);
    results.push(result as T[]);
  }

  return results;
}

// ============================================================================
// Type Inference Helpers
// ============================================================================

export type InferModel<T> = T extends { $inferSelect: infer S } ? S : never;
export type InferInsert<T> = T extends { $inferInsert: infer I } ? I : never;

export type SelectResult<T extends Record<string, unknown>> = {
  [K in keyof T]: T[K] extends { dataType: 'number' } ? number
    : T[K] extends { dataType: 'string' } ? string
    : T[K] extends { dataType: 'boolean' } ? boolean
    : T[K] extends { dataType: 'date' } ? Date
    : T[K] extends { dataType: 'json' } ? unknown
    : unknown;
};

// ============================================================================
// Prepared Statements
// ============================================================================

export interface PreparedStatement<TParams = unknown[], TResult = unknown> {
  execute: (params: TParams) => Promise<TResult[]>;
  executeTakeFirst: (params: TParams) => Promise<TResult | null>;
  all: (params: TParams) => Promise<TResult[]>;
}

export function prepare<TParams extends unknown[] = unknown[], TResult = unknown>(
  sql: string
): PreparedStatement<TParams, TResult> {
  return {
    execute: async (params: TParams): Promise<TResult[]> => {
      return await executeRaw<TResult>(sql, params);
    },
    executeTakeFirst: async (params: TParams): Promise<TResult | null> => {
      const results = await executeRaw<TResult>(sql, params);
      return results[0] || null;
    },
    all: async (params: TParams): Promise<TResult[]> => {
      return await executeRaw<TResult>(sql, params);
    },
  };
}

// ============================================================================
// Export everything
// ============================================================================

export {
  // Re-export types for convenience
  type Signal,
  type Computed,
};
