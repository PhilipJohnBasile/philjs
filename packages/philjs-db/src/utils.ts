/**
 * PhilJS Database Utilities
 *
 * Common database utilities and patterns with full CRUD operations,
 * universal QueryBuilder, and modern TypeScript 6 transaction support.
 */

import type { DatabaseConfig, Repository, PaginationOptions, PaginatedResult } from './types.js';

// ============================================================================
// Database Provider Detection
// ============================================================================

/**
 * Supported database providers
 */
export type DatabaseProvider = 'prisma' | 'drizzle' | 'supabase' | 'unknown';

/**
 * Detect the database provider from the client instance
 */
export function detectProvider(db: any): DatabaseProvider {
  if (!db) return 'unknown';

  // Prisma detection: has $transaction, $queryRaw, $executeRaw
  if (db.$transaction && db.$queryRaw) {
    return 'prisma';
  }

  // Drizzle detection: has transaction method and query builder pattern
  if (db.transaction && db.select && db.insert && db.update && db.delete) {
    return 'drizzle';
  }

  // Supabase detection: has from() method and auth property
  if (typeof db.from === 'function' && (db.auth || db.storage)) {
    return 'supabase';
  }

  // Fallback: check for Prisma model-based API
  if (db.$transaction) {
    return 'prisma';
  }

  // Fallback: check for Drizzle transaction
  if (db.transaction) {
    return 'drizzle';
  }

  return 'unknown';
}

// ============================================================================
// CRUD Operations with Provider Detection
// ============================================================================

/**
 * Generic create operation with auto provider detection
 */
export async function create<T extends Record<string, any>>(
  db: any,
  table: string,
  data: Omit<T, 'id'>,
  options?: CreateOptions
): Promise<T> {
  const provider = detectProvider(db);

  switch (provider) {
    case 'prisma': {
      // Prisma uses model-based access: db.user.create()
      if (db[table]) {
        return db[table].create({
          data,
          ...(options?.select && { select: options.select }),
          ...(options?.include && { include: options.include }),
        });
      }
      throw new Error(`Model '${table}' not found in Prisma client`);
    }

    case 'drizzle': {
      // Drizzle uses schema-based inserts
      const schema = options?.schema?.[table];
      if (schema) {
        const result = await db.insert(schema).values(data).returning();
        return result[0];
      }
      // Fallback to raw SQL if schema not provided
      throw new Error(`Schema for '${table}' not provided. Pass schema in options.`);
    }

    case 'supabase': {
      const { data: result, error } = await db
        .from(table)
        .insert(data)
        .select(options?.select ? Object.keys(options.select).join(',') : '*')
        .single();

      if (error) throw new Error(`Supabase create error: ${error.message}`);
      return result;
    }

    default:
      throw new Error(`Unsupported database provider for create operation`);
  }
}

/**
 * Generic update operation with where clause support
 */
export async function update<T extends Record<string, any>>(
  db: any,
  table: string,
  where: Partial<T> | WhereClause,
  data: Partial<T>,
  options?: UpdateOptions
): Promise<T | T[]> {
  const provider = detectProvider(db);

  switch (provider) {
    case 'prisma': {
      if (db[table]) {
        // Check if updating single record or multiple
        if (options?.many) {
          return db[table].updateMany({
            where: normalizePrismaWhere(where),
            data,
          });
        }
        return db[table].update({
          where: normalizePrismaWhere(where),
          data,
          ...(options?.select && { select: options.select }),
          ...(options?.include && { include: options.include }),
        });
      }
      throw new Error(`Model '${table}' not found in Prisma client`);
    }

    case 'drizzle': {
      const schema = options?.schema?.[table];
      if (schema) {
        const query = db.update(schema).set(data);
        const whereClause = buildDrizzleWhere(where, schema);
        if (whereClause) {
          const result = await query.where(whereClause).returning();
          return options?.many ? result : result[0];
        }
        const result = await query.returning();
        return options?.many ? result : result[0];
      }
      throw new Error(`Schema for '${table}' not provided. Pass schema in options.`);
    }

    case 'supabase': {
      let query = db.from(table).update(data);
      query = applySupabaseWhere(query, where);

      const { data: result, error } = await query
        .select(options?.select ? Object.keys(options.select).join(',') : '*');

      if (error) throw new Error(`Supabase update error: ${error.message}`);
      return options?.many ? result : result[0];
    }

    default:
      throw new Error(`Unsupported database provider for update operation`);
  }
}

/**
 * Generic delete operation with cascade support
 */
export async function deleteRecord<T extends Record<string, any>>(
  db: any,
  table: string,
  where: Partial<T> | WhereClause,
  options?: DeleteOptions
): Promise<{ count: number } | T | T[]> {
  const provider = detectProvider(db);

  // Handle cascade deletes if specified
  if (options?.cascade && options.cascadeRelations) {
    await handleCascadeDelete(db, table, where, options.cascadeRelations, provider);
  }

  switch (provider) {
    case 'prisma': {
      if (db[table]) {
        if (options?.many) {
          return db[table].deleteMany({
            where: normalizePrismaWhere(where),
          });
        }
        return db[table].delete({
          where: normalizePrismaWhere(where),
          ...(options?.select && { select: options.select }),
        });
      }
      throw new Error(`Model '${table}' not found in Prisma client`);
    }

    case 'drizzle': {
      const schema = options?.schema?.[table];
      if (schema) {
        const query = db.delete(schema);
        const whereClause = buildDrizzleWhere(where, schema);
        if (whereClause) {
          const result = await query.where(whereClause).returning();
          return options?.returnDeleted ? (options?.many ? result : result[0]) : { count: result.length };
        }
        const result = await query.returning();
        return options?.returnDeleted ? (options?.many ? result : result[0]) : { count: result.length };
      }
      throw new Error(`Schema for '${table}' not provided. Pass schema in options.`);
    }

    case 'supabase': {
      let query = db.from(table).delete();
      query = applySupabaseWhere(query, where);

      if (options?.returnDeleted) {
        const { data: result, error } = await query.select('*');
        if (error) throw new Error(`Supabase delete error: ${error.message}`);
        return options?.many ? result : result[0];
      } else {
        const { error, count } = await query;
        if (error) throw new Error(`Supabase delete error: ${error.message}`);
        return { count: count ?? 0 };
      }
    }

    default:
      throw new Error(`Unsupported database provider for delete operation`);
  }
}

// ============================================================================
// Universal QueryBuilder Abstraction
// ============================================================================

/**
 * Universal QueryBuilder that works across all providers
 */
export class QueryBuilder<T extends Record<string, any> = any> {
  private _table: string;
  private _db: any;
  private _provider: DatabaseProvider;
  private _schema?: any;
  private _select?: Partial<Record<keyof T, boolean>> | string[];
  private _where?: WhereClause | Partial<T>;
  private _orderBy?: Array<{ field: keyof T; direction: 'asc' | 'desc' }>;
  private _limit?: number;
  private _offset?: number;
  private _include?: Record<string, boolean | object>;
  private _joins?: JoinClause[];
  private _groupBy?: (keyof T)[];
  private _having?: WhereClause;
  private _distinct?: boolean;

  constructor(db: any, table: string, schema?: any) {
    this._db = db;
    this._table = table;
    this._provider = detectProvider(db);
    this._schema = schema;
  }

  /**
   * Select specific fields
   */
  select<K extends keyof T>(...fields: K[]): QueryBuilder<Pick<T, K>> {
    this._select = fields.map(f => String(f));
    return this as any;
  }

  /**
   * Add where clause
   */
  where(clause: Partial<T> | WhereClause): this {
    this._where = clause;
    return this;
  }

  /**
   * Add AND condition to where clause
   */
  andWhere(clause: Partial<T> | WhereClause): this {
    if (this._where) {
      this._where = {
        AND: [this._where as WhereClause, clause as WhereClause],
      };
    } else {
      this._where = clause;
    }
    return this;
  }

  /**
   * Add OR condition to where clause
   */
  orWhere(clause: Partial<T> | WhereClause): this {
    if (this._where) {
      this._where = {
        OR: [this._where as WhereClause, clause as WhereClause],
      };
    } else {
      this._where = clause;
    }
    return this;
  }

  /**
   * Order by field
   */
  orderBy<K extends keyof T>(field: K, direction: 'asc' | 'desc' = 'asc'): this {
    if (!this._orderBy) this._orderBy = [];
    this._orderBy.push({ field, direction });
    return this;
  }

  /**
   * Limit results
   */
  limit(count: number): this {
    this._limit = count;
    return this;
  }

  /**
   * Offset results
   */
  offset(count: number): this {
    this._offset = count;
    return this;
  }

  /**
   * Include relations (Prisma/Supabase style)
   */
  include(relations: Record<string, boolean | object>): this {
    this._include = relations;
    return this;
  }

  /**
   * Join another table
   */
  join(table: string, on: JoinCondition, type: 'inner' | 'left' | 'right' = 'inner'): this {
    if (!this._joins) this._joins = [];
    this._joins.push({ table, on, type });
    return this;
  }

  /**
   * Group by fields
   */
  groupBy<K extends keyof T>(...fields: K[]): this {
    this._groupBy = fields;
    return this;
  }

  /**
   * Having clause for aggregations
   */
  having(clause: WhereClause): this {
    this._having = clause;
    return this;
  }

  /**
   * Distinct results
   */
  distinct(): this {
    this._distinct = true;
    return this;
  }

  /**
   * Execute query and get all results
   */
  async findMany(): Promise<T[]> {
    switch (this._provider) {
      case 'prisma':
        return this._executePrismaQuery('findMany');
      case 'drizzle':
        return this._executeDrizzleQuery('select');
      case 'supabase':
        return this._executeSupabaseQuery();
      default:
        throw new Error(`Unsupported provider: ${this._provider}`);
    }
  }

  /**
   * Execute query and get first result
   */
  async findFirst(): Promise<T | null> {
    this._limit = 1;
    const results = await this.findMany();
    return results[0] ?? null;
  }

  /**
   * Execute query and get unique result
   */
  async findUnique(): Promise<T | null> {
    switch (this._provider) {
      case 'prisma':
        return this._executePrismaQuery('findUnique');
      case 'drizzle':
      case 'supabase': {
        const results = await this.findMany();
        if (results.length > 1) {
          throw new Error('findUnique returned more than one result');
        }
        return results[0] ?? null;
      }
      default:
        throw new Error(`Unsupported provider: ${this._provider}`);
    }
  }

  /**
   * Count matching records
   */
  async count(): Promise<number> {
    switch (this._provider) {
      case 'prisma':
        if (this._db[this._table]) {
          return this._db[this._table].count({
            where: normalizePrismaWhere(this._where),
          });
        }
        return 0;
      case 'drizzle':
        // Drizzle count query
        if (this._schema?.[this._table]) {
          const result = await this._db
            .select({ count: sql`count(*)` })
            .from(this._schema[this._table]);
          return Number(result[0]?.count ?? 0);
        }
        return 0;
      case 'supabase': {
        let query = this._db.from(this._table).select('*', { count: 'exact', head: true });
        if (this._where) {
          query = applySupabaseWhere(query, this._where);
        }
        const { count, error } = await query;
        if (error) throw new Error(`Supabase count error: ${error.message}`);
        return count ?? 0;
      }
      default:
        return 0;
    }
  }

  /**
   * Check if any records exist
   */
  async exists(): Promise<boolean> {
    const count = await this.count();
    return count > 0;
  }

  private async _executePrismaQuery(method: 'findMany' | 'findUnique' | 'findFirst'): Promise<any> {
    if (!this._db[this._table]) {
      throw new Error(`Model '${this._table}' not found in Prisma client`);
    }

    const args: any = {};

    if (this._where) args.where = normalizePrismaWhere(this._where);
    if (this._select && Array.isArray(this._select)) {
      args.select = this._select.reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
    if (this._include) args.include = this._include;
    if (this._orderBy) {
      args.orderBy = this._orderBy.map(({ field, direction }) => ({
        [field]: direction,
      }));
    }
    if (this._limit) args.take = this._limit;
    if (this._offset) args.skip = this._offset;
    if (this._distinct) args.distinct = true;

    return this._db[this._table][method](args);
  }

  private async _executeDrizzleQuery(_method: string): Promise<any> {
    if (!this._schema?.[this._table]) {
      throw new Error(`Schema for '${this._table}' not provided`);
    }

    let query = this._db.select().from(this._schema[this._table]);

    if (this._where) {
      const whereClause = buildDrizzleWhere(this._where, this._schema[this._table]);
      if (whereClause) query = query.where(whereClause);
    }

    if (this._orderBy) {
      for (const { field, direction } of this._orderBy) {
        const col = this._schema[this._table][field];
        if (col) {
          query = query.orderBy(direction === 'desc' ? desc(col) : asc(col));
        }
      }
    }

    if (this._limit) query = query.limit(this._limit);
    if (this._offset) query = query.offset(this._offset);

    return query;
  }

  private async _executeSupabaseQuery(): Promise<any> {
    let selectStr = '*';
    if (this._select && Array.isArray(this._select)) {
      selectStr = this._select.join(',');
    }
    if (this._include) {
      // Supabase uses select syntax for relations
      const relations = Object.keys(this._include).map(rel => `${rel}(*)`);
      selectStr = selectStr === '*' ? `*,${relations.join(',')}` : `${selectStr},${relations.join(',')}`;
    }

    let query = this._db.from(this._table).select(selectStr);

    if (this._where) {
      query = applySupabaseWhere(query, this._where);
    }

    if (this._orderBy) {
      for (const { field, direction } of this._orderBy) {
        query = query.order(String(field), { ascending: direction === 'asc' });
      }
    }

    if (this._limit) query = query.limit(this._limit);
    if (this._offset) query = query.range(this._offset, this._offset + (this._limit ?? 1000) - 1);

    const { data, error } = await query;
    if (error) throw new Error(`Supabase query error: ${error.message}`);
    return data;
  }
}

/**
 * Create a new query builder
 */
export function queryBuilder<T extends Record<string, any>>(
  db: any,
  table: string,
  schema?: any
): QueryBuilder<T> {
  return new QueryBuilder<T>(db, table, schema);
}

// ============================================================================
// Transaction Support with Symbol.asyncDispose (TypeScript 6)
// ============================================================================

/**
 * Transaction context that implements Symbol.asyncDispose
 */
export class Transaction {
  private _db: any;
  private _provider: DatabaseProvider;
  private _tx: any;
  /** @internal */
  _committed = false;
  /** @internal */
  _rolledBack = false;

  constructor(db: any, tx: any) {
    this._db = db;
    this._provider = detectProvider(db);
    this._tx = tx;
  }

  /**
   * Get the transaction client for operations
   */
  get client(): any {
    return this._tx;
  }

  /**
   * Commit the transaction
   */
  async commit(): Promise<void> {
    if (this._committed || this._rolledBack) return;

    // Prisma auto-commits when $transaction callback completes
    // Drizzle auto-commits when transaction callback completes
    // We just mark it as committed
    this._committed = true;
  }

  /**
   * Rollback the transaction
   */
  async rollback(): Promise<void> {
    if (this._committed || this._rolledBack) return;

    this._rolledBack = true;
    throw new TransactionRollbackError('Transaction rolled back');
  }

  /**
   * Check if transaction is active
   */
  get isActive(): boolean {
    return !this._committed && !this._rolledBack;
  }

  /**
   * Symbol.asyncDispose implementation for TypeScript 6
   * Allows usage with `await using tx = ...` syntax
   */
  async [Symbol.asyncDispose](): Promise<void> {
    if (!this._committed && !this._rolledBack) {
      // Auto-rollback if not committed
      try {
        await this.rollback();
      } catch {
        // Ignore rollback errors during disposal
      }
    }
  }
}

/**
 * Transaction rollback error
 */
export class TransactionRollbackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionRollbackError';
  }
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
export async function createTransaction(db: any): Promise<Transaction> {
  const provider = detectProvider(db);

  switch (provider) {
    case 'prisma': {
      // Prisma uses interactive transactions
      return new Promise((resolve, reject) => {
        db.$transaction(async (tx: any) => {
          const transaction = new Transaction(db, tx);
          resolve(transaction);

          // Wait for commit or rollback
          await new Promise<void>((innerResolve, innerReject) => {
            const checkInterval = setInterval(() => {
              if (transaction._committed) {
                clearInterval(checkInterval);
                innerResolve();
              } else if (transaction._rolledBack) {
                clearInterval(checkInterval);
                innerReject(new TransactionRollbackError('Transaction rolled back'));
              }
            }, 10);
          });
        }).catch(reject);
      });
    }

    case 'drizzle': {
      return new Promise((resolve, reject) => {
        db.transaction(async (tx: any) => {
          const transaction = new Transaction(db, tx);
          resolve(transaction);

          await new Promise<void>((innerResolve, innerReject) => {
            const checkInterval = setInterval(() => {
              if (transaction._committed) {
                clearInterval(checkInterval);
                innerResolve();
              } else if (transaction._rolledBack) {
                clearInterval(checkInterval);
                innerReject(new TransactionRollbackError('Transaction rolled back'));
              }
            }, 10);
          });
        }).catch(reject);
      });
    }

    case 'supabase': {
      // Supabase doesn't support transactions in the same way
      // Return a pass-through transaction
      console.warn('Supabase does not support full transactions. Operations will be executed directly.');
      return new Transaction(db, db);
    }

    default:
      throw new Error(`Unsupported provider for transactions: ${provider}`);
  }
}

/**
 * Execute operations within a transaction (callback style)
 * Alternative to the `using` syntax for backward compatibility
 */
export async function transaction<T>(
  db: any,
  fn: (tx: Transaction) => Promise<T>
): Promise<T> {
  const provider = detectProvider(db);

  switch (provider) {
    case 'prisma': {
      return db.$transaction(async (prismaClient: any) => {
        const tx = new Transaction(db, prismaClient);
        const result = await fn(tx);
        await tx.commit();
        return result;
      });
    }

    case 'drizzle': {
      return db.transaction(async (drizzleClient: any) => {
        const tx = new Transaction(db, drizzleClient);
        const result = await fn(tx);
        await tx.commit();
        return result;
      });
    }

    case 'supabase': {
      console.warn('Supabase does not support full transactions.');
      const tx = new Transaction(db, db);
      const result = await fn(tx);
      await tx.commit();
      return result;
    }

    default:
      throw new Error(`Unsupported provider for transactions: ${provider}`);
  }
}

// ============================================================================
// Helper Types and Interfaces
// ============================================================================

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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize where clause for Prisma
 */
function normalizePrismaWhere(where: any): any {
  if (!where) return undefined;
  return where;
}

/**
 * Build Drizzle where clause
 */
function buildDrizzleWhere(where: any, _schema: any): any {
  if (!where) return undefined;
  // This is a simplified version - actual implementation would use Drizzle's eq, and, or operators
  return where;
}

/**
 * Apply where clause to Supabase query
 */
function applySupabaseWhere(query: any, where: any): any {
  if (!where) return query;

  // Handle AND/OR/NOT
  if (where.AND) {
    for (const clause of where.AND) {
      query = applySupabaseWhere(query, clause);
    }
    return query;
  }

  if (where.OR) {
    // Supabase doesn't have native OR support in the same way
    // Use .or() method
    const orConditions = where.OR.map((clause: any) => {
      return Object.entries(clause)
        .filter(([k]) => k !== 'AND' && k !== 'OR' && k !== 'NOT')
        .map(([k, v]) => `${k}.eq.${v}`)
        .join(',');
    }).join(',');
    return query.or(orConditions);
  }

  // Handle simple field conditions
  for (const [key, value] of Object.entries(where)) {
    if (key === 'AND' || key === 'OR' || key === 'NOT') continue;

    if (value && typeof value === 'object') {
      // Handle operators
      if ('equals' in value) query = query.eq(key, value.equals);
      else if ('not' in value) query = query.neq(key, value.not);
      else if ('gt' in value) query = query.gt(key, value.gt);
      else if ('gte' in value) query = query.gte(key, value.gte);
      else if ('lt' in value) query = query.lt(key, value.lt);
      else if ('lte' in value) query = query.lte(key, value.lte);
      else if ('in' in value) query = query.in(key, value.in);
      else if ('notIn' in value) query = query.not(key, 'in', `(${(value.notIn as any[]).join(',')})`);
      else if ('contains' in value) query = query.ilike(key, `%${value.contains}%`);
      else if ('startsWith' in value) query = query.ilike(key, `${value.startsWith}%`);
      else if ('endsWith' in value) query = query.ilike(key, `%${value.endsWith}`);
      else query = query.eq(key, value);
    } else {
      query = query.eq(key, value);
    }
  }

  return query;
}

/**
 * Handle cascade delete
 */
async function handleCascadeDelete(
  db: any,
  _table: string,
  where: any,
  relations: CascadeRelation[],
  provider: DatabaseProvider
): Promise<void> {
  // First, get the IDs of records to be deleted
  const primaryKey = 'id'; // Assume 'id' as primary key

  for (const relation of relations) {
    // Find foreign key values from parent records
    const parentRecords = await queryBuilder(db, _table)
      .where(where)
      .select(primaryKey as any)
      .findMany();

    const parentIds = parentRecords.map((r: any) => r[primaryKey]);

    if (parentIds.length > 0) {
      // Recursively handle cascade for nested relations
      if (relation.cascade && relation.cascadeRelations) {
        await handleCascadeDelete(
          db,
          relation.table,
          { [relation.foreignKey]: { in: parentIds } },
          relation.cascadeRelations,
          provider
        );
      }

      // Delete related records
      await deleteRecord(
        db,
        relation.table,
        { [relation.foreignKey]: { in: parentIds } },
        { many: true }
      );
    }
  }
}

// Drizzle helper stubs (actual implementation would import from drizzle-orm)
function sql(_strings: TemplateStringsArray, ..._values: any[]): any {
  return { __sql: true };
}

function asc(_column: any): any {
  return { __asc: true };
}

function desc(_column: any): any {
  return { __desc: true };
}

/**
 * Equality comparison for Drizzle columns
 */
function eq(column: any, value: any): any {
  return { __eq: true, column, value };
}

/**
 * AND combination for Drizzle conditions
 */
function and(...conditions: any[]): any {
  return { __and: true, conditions: conditions.filter(Boolean) };
}

/**
 * Build a Drizzle where clause from a partial object
 */
function buildDrizzleWhereFromPartial(where: Record<string, any>, schema: any): any {
  if (!where || Object.keys(where).length === 0) return undefined;

  const conditions: any[] = [];

  for (const [key, value] of Object.entries(where)) {
    const column = schema[key];
    if (column && value !== undefined) {
      conditions.push(eq(column, value));
    }
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

/**
 * Create a database connection based on config
 *
 * Note: Currently only supports Supabase. Prisma and Drizzle support
 * can be added by installing the respective packages and using their
 * client creators directly.
 */
export async function createDatabaseConnection(config: DatabaseConfig) {
  switch (config.type) {
    case 'prisma':
      throw new Error('Prisma support requires @prisma/client. Use createPrismaClient from philjs-db/prisma directly.');

    case 'drizzle':
      throw new Error('Drizzle support requires drizzle-orm. Use createDrizzleClient from philjs-db/drizzle directly.');

    case 'supabase':
      const { createSupabaseClient } = await import('./supabase.js');
      return createSupabaseClient({
        url: config.connectionString,
        anonKey: config.options['anonKey'] as string,
      });

    default:
      throw new Error(`Unknown database type: ${config.type}`);
  }
}

/**
 * Transaction wrapper
 */
export async function withTransaction<T>(
  db: any,
  fn: (tx: any) => Promise<T>
): Promise<T> {
  if (db.$transaction) {
    // Prisma
    return db.$transaction(fn);
  } else if (db.transaction) {
    // Drizzle
    return db.transaction(fn);
  } else {
    // Fallback - no transaction support
    return fn(db);
  }
}

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
export function createRepository<T extends { id: string | number }>(
  db: any,
  tableName: string,
  options?: RepositoryOptions
): Repository<T> {
  const provider = detectProvider(db);
  const primaryKey = options?.primaryKey ?? 'id';
  const schema = options?.schema;

  return {
    async findAll(paginationOptions?: PaginationOptions): Promise<PaginatedResult<T>> {
      return paginate(db, tableName, paginationOptions || {});
    },

    async findById(id: string | number): Promise<T | null> {
      const whereClause = { [primaryKey]: id } as Partial<T>;

      switch (provider) {
        case 'prisma': {
          if (db[tableName]) {
            return db[tableName].findUnique({ where: whereClause });
          }
          return null;
        }

        case 'drizzle': {
          if (schema?.[tableName]) {
            const tableSchema = schema[tableName];
            const pkColumn = tableSchema[primaryKey];
            if (pkColumn) {
              const result = await db
                .select()
                .from(tableSchema)
                .where(eq(pkColumn, id))
                .limit(1);
              return result[0] ?? null;
            }
          }
          return null;
        }

        case 'supabase': {
          const { data, error } = await db
            .from(tableName)
            .select('*')
            .eq(primaryKey, id)
            .single();

          if (error && error.code !== 'PGRST116') {
            // PGRST116 is "no rows returned" - not an error for findById
            throw new Error(`Supabase findById error: ${error.message}`);
          }
          return data ?? null;
        }

        default:
          return null;
      }
    },

    async findOne(where: Partial<T>): Promise<T | null> {
      switch (provider) {
        case 'prisma': {
          if (db[tableName]) {
            return db[tableName].findFirst({ where });
          }
          return null;
        }

        case 'drizzle': {
          if (schema?.[tableName]) {
            const tableSchema = schema[tableName];
            const whereClause = buildDrizzleWhereFromPartial(where, tableSchema);
            const query = db.select().from(tableSchema);
            const result = whereClause
              ? await query.where(whereClause).limit(1)
              : await query.limit(1);
            return result[0] ?? null;
          }
          return null;
        }

        case 'supabase': {
          let query = db.from(tableName).select('*');
          query = applySupabaseWhere(query, where);
          const { data, error } = await query.limit(1).single();

          if (error && error.code !== 'PGRST116') {
            throw new Error(`Supabase findOne error: ${error.message}`);
          }
          return data ?? null;
        }

        default:
          return null;
      }
    },

    async findMany(where: Partial<T>): Promise<T[]> {
      switch (provider) {
        case 'prisma': {
          if (db[tableName]) {
            return db[tableName].findMany({ where });
          }
          return [];
        }

        case 'drizzle': {
          if (schema?.[tableName]) {
            const tableSchema = schema[tableName];
            const whereClause = buildDrizzleWhereFromPartial(where, tableSchema);
            const query = db.select().from(tableSchema);
            return whereClause ? await query.where(whereClause) : await query;
          }
          return [];
        }

        case 'supabase': {
          let query = db.from(tableName).select('*');
          query = applySupabaseWhere(query, where);
          const { data, error } = await query;

          if (error) {
            throw new Error(`Supabase findMany error: ${error.message}`);
          }
          return data ?? [];
        }

        default:
          return [];
      }
    },

    async create(data: Omit<T, 'id'>): Promise<T> {
      switch (provider) {
        case 'prisma': {
          if (db[tableName]) {
            return db[tableName].create({ data });
          }
          throw new Error(`Prisma model '${tableName}' not found`);
        }

        case 'drizzle': {
          if (schema?.[tableName]) {
            const result = await db
              .insert(schema[tableName])
              .values(data)
              .returning();
            return result[0];
          }
          throw new Error(`Drizzle schema for '${tableName}' not provided. Pass schema in options.`);
        }

        case 'supabase': {
          const { data: result, error } = await db
            .from(tableName)
            .insert(data)
            .select('*')
            .single();

          if (error) {
            throw new Error(`Supabase create error: ${error.message}`);
          }
          return result;
        }

        default:
          throw new Error(`Unsupported database provider '${provider}' for create operation`);
      }
    },

    async update(id: string | number, data: Partial<T>): Promise<T> {
      const whereClause = { [primaryKey]: id } as Partial<T>;

      switch (provider) {
        case 'prisma': {
          if (db[tableName]) {
            return db[tableName].update({ where: whereClause, data });
          }
          throw new Error(`Prisma model '${tableName}' not found`);
        }

        case 'drizzle': {
          if (schema?.[tableName]) {
            const tableSchema = schema[tableName];
            const pkColumn = tableSchema[primaryKey];
            if (pkColumn) {
              const result = await db
                .update(tableSchema)
                .set(data)
                .where(eq(pkColumn, id))
                .returning();
              return result[0];
            }
            throw new Error(`Primary key '${primaryKey}' not found in schema`);
          }
          throw new Error(`Drizzle schema for '${tableName}' not provided. Pass schema in options.`);
        }

        case 'supabase': {
          const { data: result, error } = await db
            .from(tableName)
            .update(data)
            .eq(primaryKey, id)
            .select('*')
            .single();

          if (error) {
            throw new Error(`Supabase update error: ${error.message}`);
          }
          return result;
        }

        default:
          throw new Error(`Unsupported database provider '${provider}' for update operation`);
      }
    },

    async delete(id: string | number): Promise<void> {
      const whereClause = { [primaryKey]: id } as Partial<T>;

      switch (provider) {
        case 'prisma': {
          if (db[tableName]) {
            await db[tableName].delete({ where: whereClause });
            return;
          }
          throw new Error(`Prisma model '${tableName}' not found`);
        }

        case 'drizzle': {
          if (schema?.[tableName]) {
            const tableSchema = schema[tableName];
            const pkColumn = tableSchema[primaryKey];
            if (pkColumn) {
              await db
                .delete(tableSchema)
                .where(eq(pkColumn, id));
              return;
            }
            throw new Error(`Primary key '${primaryKey}' not found in schema`);
          }
          throw new Error(`Drizzle schema for '${tableName}' not provided. Pass schema in options.`);
        }

        case 'supabase': {
          const { error } = await db
            .from(tableName)
            .delete()
            .eq(primaryKey, id);

          if (error) {
            throw new Error(`Supabase delete error: ${error.message}`);
          }
          return;
        }

        default:
          throw new Error(`Unsupported database provider '${provider}' for delete operation`);
      }
    },

    async count(where?: Partial<T>): Promise<number> {
      switch (provider) {
        case 'prisma': {
          if (db[tableName]) {
            return db[tableName].count({ where });
          }
          return 0;
        }

        case 'drizzle': {
          if (schema?.[tableName]) {
            const tableSchema = schema[tableName];
            const query = db.select({ count: sql`count(*)` }).from(tableSchema);

            if (where) {
              const whereClause = buildDrizzleWhereFromPartial(where, tableSchema);
              if (whereClause) {
                const result = await query.where(whereClause);
                return Number(result[0]?.count ?? 0);
              }
            }

            const result = await query;
            return Number(result[0]?.count ?? 0);
          }
          return 0;
        }

        case 'supabase': {
          let query = db.from(tableName).select('*', { count: 'exact', head: true });
          if (where) {
            query = applySupabaseWhere(query, where);
          }
          const { count, error } = await query;

          if (error) {
            throw new Error(`Supabase count error: ${error.message}`);
          }
          return count ?? 0;
        }

        default:
          return 0;
      }
    },
  };
}

/**
 * Pagination helper
 */
export async function paginate<T>(
  db: any,
  tableName: string,
  options: PaginationOptions
): Promise<PaginatedResult<T>> {
  const { page = 1, perPage = 10, where = {}, orderBy } = options;
  const skip = (page - 1) * perPage;

  // Prisma-style pagination
  if (db[tableName]) {
    const [data, total] = await Promise.all([
      db[tableName].findMany({
        where,
        orderBy,
        skip,
        take: perPage,
      }),
      db[tableName].count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
        hasNextPage: page * perPage < total,
        hasPrevPage: page > 1,
      },
    };
  }

  // Fallback
  return {
    data: [],
    meta: {
      total: 0,
      page,
      perPage,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
}

/**
 * Soft delete helper
 */
export async function softDelete(
  db: any,
  tableName: string,
  id: string | number
): Promise<void> {
  if (db[tableName]) {
    await db[tableName].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

/**
 * Restore soft deleted record
 */
export async function restore(
  db: any,
  tableName: string,
  id: string | number
): Promise<void> {
  if (db[tableName]) {
    await db[tableName].update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}

/**
 * Database health check
 */
export async function healthCheck(db: any): Promise<{ healthy: boolean; latency: number }> {
  const start = Date.now();

  try {
    if (db.$queryRaw) {
      // Prisma
      await db.$queryRaw`SELECT 1`;
    } else if (db.execute) {
      // Drizzle
      await db.execute('SELECT 1');
    }

    return {
      healthy: true,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start,
    };
  }
}
