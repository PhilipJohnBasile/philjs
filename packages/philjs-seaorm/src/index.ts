/**
 * @philjs/seaorm - Entity-based Database Queries
 *
 * SeaORM integration for PhilJS with reactive queries,
 * active record pattern, and type-safe database operations.
 */

// ============================================================================
// Error Types
// ============================================================================

/**
 * ORM Error class
 */
export class OrmError extends Error {
  constructor(
    message: string,
    public readonly code: OrmErrorCode = 'UNKNOWN'
  ) {
    super(message);
    this.name = 'OrmError';
  }

  static connection(message: string): OrmError {
    return new OrmError(message, 'CONNECTION');
  }

  static query(message: string): OrmError {
    return new OrmError(message, 'QUERY');
  }

  static notFound(entity: string): OrmError {
    return new OrmError(`${entity} not found`, 'NOT_FOUND');
  }

  static validation(message: string): OrmError {
    return new OrmError(message, 'VALIDATION');
  }
}

/**
 * ORM Error codes
 */
export type OrmErrorCode =
  | 'CONNECTION'
  | 'QUERY'
  | 'NOT_FOUND'
  | 'VALIDATION'
  | 'CONSTRAINT'
  | 'TRANSACTION'
  | 'UNKNOWN';

/**
 * ORM Result type
 */
export type OrmResult<T> = Promise<T>;

// ============================================================================
// Database Connection Types
// ============================================================================

/**
 * Database backend type
 */
export type DbBackend = 'postgres' | 'mysql' | 'sqlite';

/**
 * Connection options
 */
export interface ConnectOptions {
  url: string;
  maxConnections?: number;
  minConnections?: number;
  connectTimeoutSecs?: number;
  idleTimeoutSecs?: number;
  sqlxLogging?: boolean;
}

/**
 * Database connection interface
 */
export interface DatabaseConnection {
  /** Execute raw SQL */
  execute(sql: string, params?: unknown[]): Promise<ExecResult>;
  /** Query with raw SQL */
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  /** Query one with raw SQL */
  queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>;
  /** Begin transaction */
  begin(): Promise<DatabaseTransaction>;
  /** Close connection */
  close(): Promise<void>;
  /** Get backend type */
  getBackend(): DbBackend;
}

/**
 * Database transaction interface
 */
export interface DatabaseTransaction extends DatabaseConnection {
  /** Commit transaction */
  commit(): Promise<void>;
  /** Rollback transaction */
  rollback(): Promise<void>;
}

/**
 * Execution result
 */
export interface ExecResult {
  rowsAffected: number;
  lastInsertId?: number | string;
}

// ============================================================================
// Entity Types
// ============================================================================

/**
 * Base entity model
 */
export interface Model {
  [key: string]: unknown;
}

/**
 * Entity trait - defines table and columns
 */
export interface Entity<M extends Model = Model> {
  tableName: string;
  columns: Column[];
  primaryKey: string | string[];
  find(): SelectQueryBuilder<M>;
  findOne(id: unknown): Promise<M | null>;
  insert(model: Partial<M>): Promise<M>;
  update(model: Partial<M>): Promise<M>;
  delete(id: unknown): Promise<void>;
}

/**
 * Column definition
 */
export interface Column {
  name: string;
  type: ColumnType;
  nullable: boolean;
  primaryKey: boolean;
  autoIncrement: boolean;
  unique: boolean;
  default?: unknown;
}

/**
 * Column types
 */
export type ColumnType =
  | 'integer'
  | 'bigInteger'
  | 'smallInteger'
  | 'float'
  | 'double'
  | 'decimal'
  | 'string'
  | 'text'
  | 'boolean'
  | 'date'
  | 'time'
  | 'datetime'
  | 'timestamp'
  | 'json'
  | 'jsonb'
  | 'uuid'
  | 'binary'
  | 'enum';

// ============================================================================
// Query Builder Types
// ============================================================================

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Condition operator
 */
export type ConditionOp =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'notLike'
  | 'in'
  | 'notIn'
  | 'isNull'
  | 'isNotNull'
  | 'between';

/**
 * Filter condition
 */
export interface FilterCondition {
  column: string;
  op: ConditionOp;
  value?: unknown;
}

/**
 * Select query builder
 */
export interface SelectQueryBuilder<M extends Model = Model> {
  /** Filter results */
  filter(column: string, op: ConditionOp, value?: unknown): SelectQueryBuilder<M>;
  /** Add where clause */
  where(column: string, value: unknown): SelectQueryBuilder<M>;
  /** Add OR where clause */
  orWhere(column: string, value: unknown): SelectQueryBuilder<M>;
  /** Add AND condition group */
  and(conditions: FilterCondition[]): SelectQueryBuilder<M>;
  /** Add OR condition group */
  or(conditions: FilterCondition[]): SelectQueryBuilder<M>;
  /** Order by column */
  orderBy(column: string, order?: SortOrder): SelectQueryBuilder<M>;
  /** Limit results */
  limit(count: number): SelectQueryBuilder<M>;
  /** Offset results */
  offset(count: number): SelectQueryBuilder<M>;
  /** Select specific columns */
  select(columns: string[]): SelectQueryBuilder<M>;
  /** Include relation */
  include<R extends Model>(relation: string): SelectQueryBuilder<M & { [K in typeof relation]: R }>;
  /** Execute and get all results */
  all(db: DatabaseConnection): Promise<M[]>;
  /** Execute and get one result */
  one(db: DatabaseConnection): Promise<M | null>;
  /** Execute and count results */
  count(db: DatabaseConnection): Promise<number>;
  /** Check if any results exist */
  exists(db: DatabaseConnection): Promise<boolean>;
  /** Paginate results */
  paginate(params: PaginationParams, db: DatabaseConnection): Promise<PaginatedResult<M>>;
}

/**
 * Insert query builder
 */
export interface InsertQueryBuilder<M extends Model = Model> {
  /** Set values */
  values(data: Partial<M>): InsertQueryBuilder<M>;
  /** Set multiple values */
  valuesMany(data: Partial<M>[]): InsertQueryBuilder<M>;
  /** Execute insert */
  exec(db: DatabaseConnection): Promise<M>;
  /** Execute insert many */
  execMany(db: DatabaseConnection): Promise<M[]>;
}

/**
 * Update query builder
 */
export interface UpdateQueryBuilder<M extends Model = Model> {
  /** Set value */
  set(column: string, value: unknown): UpdateQueryBuilder<M>;
  /** Set multiple values */
  setMany(data: Partial<M>): UpdateQueryBuilder<M>;
  /** Add where clause */
  where(column: string, value: unknown): UpdateQueryBuilder<M>;
  /** Execute update */
  exec(db: DatabaseConnection): Promise<ExecResult>;
}

/**
 * Delete query builder
 */
export interface DeleteQueryBuilder {
  /** Add where clause */
  where(column: string, value: unknown): DeleteQueryBuilder;
  /** Execute delete */
  exec(db: DatabaseConnection): Promise<ExecResult>;
}

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * Cursor pagination parameters
 */
export interface CursorParams {
  cursor?: string;
  limit: number;
  direction?: 'forward' | 'backward';
}

/**
 * Cursor pagination result
 */
export interface CursorResult<T> {
  items: T[];
  nextCursor?: string;
  prevCursor?: string;
  hasMore: boolean;
}

// ============================================================================
// Reactive Types
// ============================================================================

/**
 * Reactive entity query
 */
export interface ReactiveEntity<M extends Model = Model> {
  /** Create reactive query */
  find(): ReactiveQueryBuilder<M>;
  /** Subscribe to changes */
  subscribe(callback: (items: M[]) => void): () => void;
}

/**
 * Reactive query builder
 */
export interface ReactiveQueryBuilder<M extends Model = Model> extends SelectQueryBuilder<M> {
  /** Get as PhilJS resource */
  asResource(db: DatabaseConnection): EntityResource<M[]>;
  /** Get single as resource */
  asOneResource(db: DatabaseConnection): EntityResource<M | null>;
}

/**
 * Entity resource (PhilJS integration)
 */
export interface EntityResource<T> {
  /** Get current value */
  get(): T | undefined;
  /** Loading state */
  loading(): boolean;
  /** Error state */
  error(): Error | undefined;
  /** Refetch data */
  refetch(): Promise<void>;
  /** Mutate data */
  mutate(data: T): void;
}

// ============================================================================
// Hook Types
// ============================================================================

/**
 * Entity hook
 */
export interface EntityHook<M extends Model = Model> {
  name: string;
  run(model: M, context: HookContext): Promise<M>;
}

/**
 * Hook context
 */
export interface HookContext {
  operation: 'insert' | 'update' | 'delete';
  db: DatabaseConnection;
  original?: unknown;
}

/**
 * Before hook
 */
export type BeforeHook<M extends Model = Model> = (
  model: M,
  context: HookContext
) => Promise<M>;

/**
 * After hook
 */
export type AfterHook<M extends Model = Model> = (
  model: M,
  context: HookContext
) => Promise<void>;

/**
 * Validation hook
 */
export type ValidationHook<M extends Model = Model> = (
  model: M
) => Promise<ValidationResult>;

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// ============================================================================
// Migration Types
// ============================================================================

/**
 * Migration
 */
export interface Migration {
  name: string;
  timestamp: number;
  up(db: DatabaseConnection): Promise<void>;
  down(db: DatabaseConnection): Promise<void>;
}

/**
 * Migration status
 */
export interface MigrationStatus {
  name: string;
  timestamp: number;
  applied: boolean;
  appliedAt?: Date;
}

/**
 * Migrator
 */
export interface Migrator {
  /** Run pending migrations */
  up(db: DatabaseConnection): Promise<void>;
  /** Rollback last migration */
  down(db: DatabaseConnection): Promise<void>;
  /** Get migration status */
  status(db: DatabaseConnection): Promise<MigrationStatus[]>;
  /** Get pending migrations */
  pending(db: DatabaseConnection): Promise<Migration[]>;
}

// ============================================================================
// Relation Types
// ============================================================================

/**
 * Relation type
 */
export type RelationType = 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany';

/**
 * Relation definition
 */
export interface RelationDef {
  type: RelationType;
  entity: string;
  foreignKey: string;
  localKey?: string;
  through?: string;
  pivotTable?: string;
}

/**
 * Relation loader
 */
export interface RelationLoader<M extends Model = Model, R extends Model = Model> {
  /** Load related entities */
  load(models: M[], db: DatabaseConnection): Promise<Map<unknown, R | R[]>>;
  /** Load single relation */
  loadOne(model: M, db: DatabaseConnection): Promise<R | R[] | null>;
}

// ============================================================================
// Context Types
// ============================================================================

/**
 * Database provider context
 */
export interface DbProvider {
  /** Get database connection */
  getConnection(): DatabaseConnection;
  /** Execute in transaction */
  transaction<T>(fn: (tx: DatabaseTransaction) => Promise<T>): Promise<T>;
}

// ============================================================================
// Connection Functions
// ============================================================================

/**
 * Create database connection
 */
export async function connect(url: string): OrmResult<DatabaseConnection> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Create database connection with options
 */
export async function connectWithOptions(
  options: ConnectOptions
): OrmResult<DatabaseConnection> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Connection builder
 */
export class ConnectionBuilder {
  private options: ConnectOptions;

  constructor(url: string) {
    this.options = { url };
  }

  maxConnections(max: number): this {
    this.options.maxConnections = max;
    return this;
  }

  minConnections(min: number): this {
    this.options.minConnections = min;
    return this;
  }

  connectTimeoutSecs(secs: number): this {
    this.options.connectTimeoutSecs = secs;
    return this;
  }

  idleTimeoutSecs(secs: number): this {
    this.options.idleTimeoutSecs = secs;
    return this;
  }

  sqlxLogging(enabled: boolean): this {
    this.options.sqlxLogging = enabled;
    return this;
  }

  buildOptions(): ConnectOptions {
    return { ...this.options };
  }

  async connect(): OrmResult<DatabaseConnection> {
    return connectWithOptions(this.options);
  }
}

// ============================================================================
// Context Functions
// ============================================================================

/**
 * Provide database connection to context
 */
export function provideDb(db: DatabaseConnection): void {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Get database connection from context
 */
export function useDb(): DatabaseConnection {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

// ============================================================================
// Query Helpers
// ============================================================================

/**
 * Create filter builder
 */
export function filter(): FilterBuilder {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Filter builder
 */
export interface FilterBuilder {
  eq(column: string, value: unknown): FilterBuilder;
  ne(column: string, value: unknown): FilterBuilder;
  gt(column: string, value: unknown): FilterBuilder;
  gte(column: string, value: unknown): FilterBuilder;
  lt(column: string, value: unknown): FilterBuilder;
  lte(column: string, value: unknown): FilterBuilder;
  like(column: string, pattern: string): FilterBuilder;
  notLike(column: string, pattern: string): FilterBuilder;
  in(column: string, values: unknown[]): FilterBuilder;
  notIn(column: string, values: unknown[]): FilterBuilder;
  isNull(column: string): FilterBuilder;
  isNotNull(column: string): FilterBuilder;
  between(column: string, from: unknown, to: unknown): FilterBuilder;
  and(fn: (builder: FilterBuilder) => void): FilterBuilder;
  or(fn: (builder: FilterBuilder) => void): FilterBuilder;
  build(): FilterCondition[];
}

// ============================================================================
// Entity Helpers
// ============================================================================

/**
 * Define an entity
 */
export function defineEntity<M extends Model>(config: {
  tableName: string;
  columns: Column[];
  primaryKey: string | string[];
  relations?: Record<string, RelationDef>;
  hooks?: {
    beforeInsert?: BeforeHook<M>;
    afterInsert?: AfterHook<M>;
    beforeUpdate?: BeforeHook<M>;
    afterUpdate?: AfterHook<M>;
    beforeDelete?: BeforeHook<M>;
    afterDelete?: AfterHook<M>;
    validate?: ValidationHook<M>;
  };
}): Entity<M> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Create a reactive entity
 */
export function createReactiveEntity<M extends Model>(
  entity: Entity<M>
): ReactiveEntity<M> {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

// ============================================================================
// Migration Helpers
// ============================================================================

/**
 * Create migrator
 */
export function createMigrator(migrations: Migration[]): Migrator {
  throw new Error('This is a type stub. Use the Rust runtime.');
}

/**
 * Define a migration
 */
export function defineMigration(config: {
  name: string;
  up: (db: DatabaseConnection) => Promise<void>;
  down: (db: DatabaseConnection) => Promise<void>;
}): Migration {
  return {
    name: config.name,
    timestamp: Date.now(),
    up: config.up,
    down: config.down,
  };
}

// All types are exported at their declaration points above
