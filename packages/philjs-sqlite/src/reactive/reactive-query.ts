/**
 * Reactive Queries
 * Auto-updating SQL queries that react to database changes
 */

import type { SQLiteDB, Row, TableChangeEvent } from '../db/sqlite-wasm.js';

/**
 * Reactive query options
 */
export interface ReactiveQueryOptions<T> {
  /** SQL query */
  sql: string;
  /** Query parameters */
  params?: unknown[];
  /** Tables this query depends on (auto-detected if not provided) */
  dependencies?: string[];
  /** Transform function for results */
  transform?: (rows: Row[]) => T[];
  /** Debounce time in ms */
  debounce?: number;
}

/**
 * Reactive query state
 */
export interface ReactiveQueryState<T> {
  /** Current data */
  data: T[];
  /** Loading state */
  loading: boolean;
  /** Error if any */
  error: Error | null;
  /** Last updated timestamp */
  updatedAt: number;
}

/**
 * Reactive query instance
 */
export class ReactiveQuery<T extends Row = Row> {
  private db: SQLiteDB;
  private sql: string;
  private params: unknown[];
  private dependencies: Set<string>;
  private transform?: (rows: Row[]) => T[];
  private debounceMs: number;

  private state: ReactiveQueryState<T> = {
    data: [],
    loading: true,
    error: null,
    updatedAt: 0,
  };

  private listeners: Set<() => void> = new Set();
  private unsubscribes: Array<() => void> = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(db: SQLiteDB, options: ReactiveQueryOptions<T>) {
    this.db = db;
    this.sql = options.sql;
    this.params = options.params ?? [];
    this.dependencies = new Set(options.dependencies ?? this.extractTables(options.sql));
    this.transform = options.transform;
    this.debounceMs = options.debounce ?? 0;

    // Initial query
    this.execute();

    // Subscribe to table changes
    this.subscribeToChanges();
  }

  /**
   * Get current data
   */
  get data(): T[] {
    return this.state.data;
  }

  /**
   * Get loading state
   */
  get loading(): boolean {
    return this.state.loading;
  }

  /**
   * Get error
   */
  get error(): Error | null {
    return this.state.error;
  }

  /**
   * Get last update timestamp
   */
  get updatedAt(): number {
    return this.state.updatedAt;
  }

  /**
   * Execute query and update state
   */
  execute(): void {
    this.state.loading = true;
    this.state.error = null;

    try {
      const rows = this.db.query<T>(this.sql, this.params);
      const transformed = this.transform ? this.transform(rows) : rows;

      this.state.data = transformed;
      this.state.updatedAt = Date.now();
    } catch (err) {
      this.state.error = err instanceof Error ? err : new Error(String(err));
    } finally {
      this.state.loading = false;
      this.notifyListeners();
    }
  }

  /**
   * Manually refresh the query
   */
  refresh(): void {
    this.execute();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Update query parameters
   */
  setParams(params: unknown[]): void {
    this.params = params;
    this.execute();
  }

  /**
   * Cleanup subscriptions
   */
  dispose(): void {
    for (const unsubscribe of this.unsubscribes) {
      unsubscribe();
    }
    this.unsubscribes = [];
    this.listeners.clear();

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

  /**
   * Subscribe to database changes
   */
  private subscribeToChanges(): void {
    for (const table of this.dependencies) {
      const unsubscribe = this.db.onTableChange(table, this.handleChange.bind(this));
      this.unsubscribes.push(unsubscribe);
    }
  }

  /**
   * Handle table change event
   */
  private handleChange(event: TableChangeEvent): void {
    if (this.debounceMs > 0) {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(() => {
        this.execute();
        this.debounceTimer = null;
      }, this.debounceMs);
    } else {
      this.execute();
    }
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  /**
   * Extract table names from SQL
   */
  private extractTables(sql: string): string[] {
    const tables: string[] = [];
    const regex = /(?:FROM|JOIN|INTO|UPDATE)\s+[`"']?(\w+)[`"']?/gi;

    let match;
    while ((match = regex.exec(sql)) !== null) {
      if (match[1] && !tables.includes(match[1])) {
        tables.push(match[1]);
      }
    }

    return tables;
  }
}

/**
 * Create a reactive query
 */
export function createReactiveQuery<T extends Row = Row>(
  db: SQLiteDB,
  options: ReactiveQueryOptions<T>
): ReactiveQuery<T> {
  return new ReactiveQuery(db, options);
}

/**
 * Reactive query builder for type-safe queries
 */
export class QueryBuilder<T extends Row = Row> {
  private db: SQLiteDB;
  private _select: string = '*';
  private _from: string = '';
  private _where: string[] = [];
  private _orderBy: string[] = [];
  private _limit?: number;
  private _offset?: number;
  private _params: unknown[] = [];

  constructor(db: SQLiteDB) {
    this.db = db;
  }

  select(columns: string | string[]): this {
    this._select = Array.isArray(columns) ? columns.join(', ') : columns;
    return this;
  }

  from(table: string): this {
    this._from = table;
    return this;
  }

  where(condition: string, ...params: unknown[]): this {
    this._where.push(condition);
    this._params.push(...params);
    return this;
  }

  orderBy(column: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    this._orderBy.push(`${column} ${direction}`);
    return this;
  }

  limit(count: number): this {
    this._limit = count;
    return this;
  }

  offset(count: number): this {
    this._offset = count;
    return this;
  }

  /**
   * Build the SQL query
   */
  toSQL(): { sql: string; params: unknown[] } {
    let sql = `SELECT ${this._select} FROM ${this._from}`;

    if (this._where.length > 0) {
      sql += ` WHERE ${this._where.join(' AND ')}`;
    }

    if (this._orderBy.length > 0) {
      sql += ` ORDER BY ${this._orderBy.join(', ')}`;
    }

    if (this._limit !== undefined) {
      sql += ` LIMIT ${this._limit}`;
    }

    if (this._offset !== undefined) {
      sql += ` OFFSET ${this._offset}`;
    }

    return { sql, params: this._params };
  }

  /**
   * Execute as a one-time query
   */
  execute(): T[] {
    const { sql, params } = this.toSQL();
    return this.db.query<T>(sql, params);
  }

  /**
   * Create a reactive version of this query
   */
  reactive(options?: { debounce?: number }): ReactiveQuery<T> {
    const { sql, params } = this.toSQL();
    return createReactiveQuery<T>(this.db, {
      sql,
      params,
      dependencies: [this._from],
      debounce: options?.debounce,
    });
  }
}

/**
 * Create a query builder
 */
export function query<T extends Row = Row>(db: SQLiteDB): QueryBuilder<T> {
  return new QueryBuilder<T>(db);
}
