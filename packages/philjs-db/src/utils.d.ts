/**
 * PhilJS Database Utilities
 *
 * Common database utilities and patterns with full CRUD operations,
 * universal QueryBuilder, and modern TypeScript 6 transaction support.
 */
import type { DatabaseConfig, Repository, PaginationOptions, PaginatedResult } from './types.js';
/**
 * Supported database providers
 */
export type DatabaseProvider = 'prisma' | 'drizzle' | 'supabase' | 'unknown';
/**
 * Detect the database provider from the client instance
 */
export declare function detectProvider(db: any): DatabaseProvider;
/**
 * Generic create operation with auto provider detection
 */
export declare function create<T extends Record<string, any>>(db: any, table: string, data: Omit<T, 'id'>, options?: CreateOptions): Promise<T>;
/**
 * Generic update operation with where clause support
 */
export declare function update<T extends Record<string, any>>(db: any, table: string, where: Partial<T> | WhereClause, data: Partial<T>, options?: UpdateOptions): Promise<T | T[]>;
/**
 * Generic delete operation with cascade support
 */
export declare function deleteRecord<T extends Record<string, any>>(db: any, table: string, where: Partial<T> | WhereClause, options?: DeleteOptions): Promise<{
    count: number;
} | T | T[]>;
/**
 * Universal QueryBuilder that works across all providers
 */
export declare class QueryBuilder<T extends Record<string, any> = any> {
    private _table;
    private _db;
    private _provider;
    private _schema?;
    private _select?;
    private _where?;
    private _orderBy?;
    private _limit?;
    private _offset?;
    private _include?;
    private _joins?;
    private _groupBy?;
    private _having?;
    private _distinct?;
    constructor(db: any, table: string, schema?: any);
    /**
     * Select specific fields
     */
    select<K extends keyof T>(...fields: K[]): QueryBuilder<Pick<T, K>>;
    /**
     * Add where clause
     */
    where(clause: Partial<T> | WhereClause): this;
    /**
     * Add AND condition to where clause
     */
    andWhere(clause: Partial<T> | WhereClause): this;
    /**
     * Add OR condition to where clause
     */
    orWhere(clause: Partial<T> | WhereClause): this;
    /**
     * Order by field
     */
    orderBy<K extends keyof T>(field: K, direction?: 'asc' | 'desc'): this;
    /**
     * Limit results
     */
    limit(count: number): this;
    /**
     * Offset results
     */
    offset(count: number): this;
    /**
     * Include relations (Prisma/Supabase style)
     */
    include(relations: Record<string, boolean | object>): this;
    /**
     * Join another table
     */
    join(table: string, on: JoinCondition, type?: 'inner' | 'left' | 'right'): this;
    /**
     * Group by fields
     */
    groupBy<K extends keyof T>(...fields: K[]): this;
    /**
     * Having clause for aggregations
     */
    having(clause: WhereClause): this;
    /**
     * Distinct results
     */
    distinct(): this;
    /**
     * Execute query and get all results
     */
    findMany(): Promise<T[]>;
    /**
     * Execute query and get first result
     */
    findFirst(): Promise<T | null>;
    /**
     * Execute query and get unique result
     */
    findUnique(): Promise<T | null>;
    /**
     * Count matching records
     */
    count(): Promise<number>;
    /**
     * Check if any records exist
     */
    exists(): Promise<boolean>;
    private _executePrismaQuery;
    private _executeDrizzleQuery;
    private _executeSupabaseQuery;
}
/**
 * Create a new query builder
 */
export declare function queryBuilder<T extends Record<string, any>>(db: any, table: string, schema?: any): QueryBuilder<T>;
/**
 * Transaction context that implements Symbol.asyncDispose
 */
export declare class Transaction {
    private _db;
    private _provider;
    private _tx;
    /** @internal */
    _committed: boolean;
    /** @internal */
    _rolledBack: boolean;
    constructor(db: any, tx: any);
    /**
     * Get the transaction client for operations
     */
    get client(): any;
    /**
     * Commit the transaction
     */
    commit(): Promise<void>;
    /**
     * Rollback the transaction
     */
    rollback(): Promise<void>;
    /**
     * Check if transaction is active
     */
    get isActive(): boolean;
    /**
     * Symbol.asyncDispose implementation for TypeScript 6
     * Allows usage with `await using tx = ...` syntax
     */
    [Symbol.asyncDispose](): Promise<void>;
}
/**
 * Transaction rollback error
 */
export declare class TransactionRollbackError extends Error {
    constructor(message: string);
}
/**
 * Create a disposable transaction context
 * Usage with TypeScript 6:
 * ```
 * await using tx = await createTransaction(db);
 * await create(tx.client, 'users', userData);
 * await tx.commit();
 * ```
 */
export declare function createTransaction(db: any): Promise<Transaction>;
/**
 * Execute operations within a transaction (callback style)
 * Alternative to the `using` syntax for backward compatibility
 */
export declare function transaction<T>(db: any, fn: (tx: Transaction) => Promise<T>): Promise<T>;
export interface WhereClause {
    AND?: WhereClause[];
    OR?: WhereClause[];
    NOT?: WhereClause;
    [key: string]: any;
}
export interface JoinClause {
    table: string;
    on: JoinCondition;
    type: 'inner' | 'left' | 'right';
}
export interface JoinCondition {
    leftField: string;
    rightField: string;
    operator?: '=' | '!=' | '>' | '<' | '>=' | '<=';
}
export interface CreateOptions {
    select?: Record<string, boolean>;
    include?: Record<string, boolean>;
    schema?: Record<string, any>;
}
export interface UpdateOptions {
    select?: Record<string, boolean>;
    include?: Record<string, boolean>;
    schema?: Record<string, any>;
    many?: boolean;
}
export interface DeleteOptions {
    select?: Record<string, boolean>;
    schema?: Record<string, any>;
    many?: boolean;
    returnDeleted?: boolean;
    cascade?: boolean;
    cascadeRelations?: CascadeRelation[];
}
export interface CascadeRelation {
    table: string;
    foreignKey: string;
    cascade?: boolean;
    cascadeRelations?: CascadeRelation[];
}
/**
 * Create a database connection based on config
 *
 * Note: Currently only supports Supabase. Prisma and Drizzle support
 * can be added by installing the respective packages and using their
 * client creators directly.
 */
export declare function createDatabaseConnection(config: DatabaseConfig): Promise<any>;
/**
 * Transaction wrapper
 */
export declare function withTransaction<T>(db: any, fn: (tx: any) => Promise<T>): Promise<T>;
/**
 * Repository configuration options
 */
export interface RepositoryOptions {
    /** Drizzle schema object for the table */
    schema?: Record<string, any>;
    /** Primary key field name (defaults to 'id') */
    primaryKey?: string;
}
/**
 * Create a repository with common CRUD operations
 * Works with Prisma, Drizzle, and Supabase providers
 */
export declare function createRepository<T extends {
    id: string | number;
}>(db: any, tableName: string, options?: RepositoryOptions): Repository<T>;
/**
 * Pagination helper
 */
export declare function paginate<T>(db: any, tableName: string, options: PaginationOptions): Promise<PaginatedResult<T>>;
/**
 * Soft delete helper
 */
export declare function softDelete(db: any, tableName: string, id: string | number): Promise<void>;
/**
 * Restore soft deleted record
 */
export declare function restore(db: any, tableName: string, id: string | number): Promise<void>;
/**
 * Database health check
 */
export declare function healthCheck(db: any): Promise<{
    healthy: boolean;
    latency: number;
}>;
//# sourceMappingURL=utils.d.ts.map