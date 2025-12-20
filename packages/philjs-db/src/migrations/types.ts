/**
 * PhilJS Database Migration Types
 */

export type DatabaseType = 'postgres' | 'mysql' | 'sqlite' | 'mongodb';

export interface MigrationConfig {
  /** Database type */
  type: DatabaseType;
  /** Connection string or config */
  connection: string | Record<string, unknown>;
  /** Directory for migration files */
  migrationsDir?: string;
  /** Migration table name */
  tableName?: string;
  /** Enable transaction support */
  transactional?: boolean;
  /** Backup before migration */
  backup?: boolean;
  /** Seed data directory */
  seedsDir?: string;
  /** Schema file path */
  schemaFile?: string;
}

export interface Migration {
  /** Migration version/timestamp */
  version: string;
  /** Migration name */
  name: string;
  /** Up migration function */
  up: (context: MigrationContext) => Promise<void>;
  /** Down migration function */
  down: (context: MigrationContext) => Promise<void>;
  /** Migration dependencies */
  dependencies?: string[];
  /** Transaction mode */
  transaction?: boolean;
}

export interface MigrationContext {
  /** Database connection */
  db: unknown;
  /** SQL query executor */
  sql: (query: string, params?: unknown[]) => Promise<unknown>;
  /** Schema builder */
  schema: SchemaBuilder;
  /** Data migration helpers */
  data: DataMigrationHelpers;
  /** Database type */
  type: DatabaseType;
}

export interface SchemaBuilder {
  createTable(name: string, callback: (table: TableBuilder) => void): void;
  dropTable(name: string): void;
  alterTable(name: string, callback: (table: TableBuilder) => void): void;
  renameTable(oldName: string, newName: string): void;
  hasTable(name: string): Promise<boolean>;
  raw(sql: string): void;
}

export interface TableBuilder {
  // Column types
  increments(name: string): ColumnBuilder;
  integer(name: string): ColumnBuilder;
  bigInteger(name: string): ColumnBuilder;
  string(name: string, length?: number): ColumnBuilder;
  text(name: string): ColumnBuilder;
  boolean(name: string): ColumnBuilder;
  date(name: string): ColumnBuilder;
  datetime(name: string): ColumnBuilder;
  timestamp(name: string): ColumnBuilder;
  timestamps(useTimestamps?: boolean): void;
  json(name: string): ColumnBuilder;
  jsonb(name: string): ColumnBuilder;
  uuid(name: string): ColumnBuilder;
  decimal(name: string, precision?: number, scale?: number): ColumnBuilder;
  float(name: string, precision?: number, scale?: number): ColumnBuilder;
  enum(name: string, values: string[]): ColumnBuilder;

  // Indexes
  primary(columns: string | string[]): void;
  unique(columns: string | string[]): void;
  index(columns: string | string[]): void;
  foreign(column: string): ForeignKeyBuilder;

  // Column operations
  dropColumn(name: string): void;
  renameColumn(oldName: string, newName: string): void;

  // Table operations
  dropPrimary(): void;
  dropUnique(columns: string | string[]): void;
  dropIndex(columns: string | string[]): void;
  dropForeign(column: string): void;
}

export interface ColumnBuilder {
  primary(): this;
  nullable(): this;
  notNullable(): this;
  unique(): this;
  unsigned(): this;
  defaultTo(value: unknown): this;
  references(column: string): this;
  inTable(table: string): this;
  onDelete(action: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'): this;
  onUpdate(action: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'): this;
  index(): this;
  comment(text: string): this;
}

export interface ForeignKeyBuilder {
  references(column: string): this;
  inTable(table: string): this;
  onDelete(action: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'): this;
  onUpdate(action: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION'): this;
}

export interface DataMigrationHelpers {
  /** Insert data */
  insert(table: string, data: Record<string, unknown> | Record<string, unknown>[]): Promise<void>;
  /** Update data */
  update(table: string, where: Record<string, unknown>, data: Record<string, unknown>): Promise<void>;
  /** Delete data */
  delete(table: string, where: Record<string, unknown>): Promise<void>;
  /** Raw query */
  raw(sql: string, params?: unknown[]): Promise<unknown>;
  /** Batch insert */
  batchInsert(table: string, data: Record<string, unknown>[], batchSize?: number): Promise<void>;
}

export interface MigrationRecord {
  id: number;
  version: string;
  name: string;
  executed_at: Date;
  execution_time: number;
  batch: number;
}

export interface MigrationStatus {
  pending: MigrationFile[];
  executed: MigrationRecord[];
  conflicts: MigrationConflict[];
}

export interface MigrationFile {
  version: string;
  name: string;
  filename: string;
  filepath: string;
}

export interface MigrationConflict {
  type: 'missing' | 'modified' | 'duplicate';
  migration: string;
  message: string;
}

export interface MigrationResult {
  success: boolean;
  migrations: string[];
  errors: MigrationError[];
  duration: number;
}

export interface MigrationError {
  migration: string;
  error: Error;
  timestamp: Date;
}

export interface SchemaDiff {
  tables: {
    created: TableDiff[];
    dropped: string[];
    modified: TableModification[];
  };
  columns: ColumnDiff[];
  indexes: IndexDiff[];
  foreignKeys: ForeignKeyDiff[];
}

export interface TableDiff {
  name: string;
  columns: ColumnDefinition[];
  indexes: IndexDefinition[];
  foreignKeys: ForeignKeyDefinition[];
}

export interface TableModification {
  name: string;
  changes: {
    columns: ColumnDiff[];
    indexes: IndexDiff[];
    foreignKeys: ForeignKeyDiff[];
  };
}

export interface ColumnDiff {
  table: string;
  type: 'added' | 'removed' | 'modified';
  name: string;
  oldDefinition?: ColumnDefinition;
  newDefinition?: ColumnDefinition;
}

export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  default?: unknown;
  length?: number;
  precision?: number;
  scale?: number;
  unsigned?: boolean;
  autoIncrement?: boolean;
  comment?: string;
}

export interface IndexDiff {
  table: string;
  type: 'added' | 'removed' | 'modified';
  name: string;
  columns: string[];
  unique: boolean;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique: boolean;
}

export interface ForeignKeyDiff {
  table: string;
  type: 'added' | 'removed' | 'modified';
  name: string;
  column: string;
  references: {
    table: string;
    column: string;
  };
  onDelete?: string;
  onUpdate?: string;
}

export interface ForeignKeyDefinition {
  name: string;
  column: string;
  references: {
    table: string;
    column: string;
  };
  onDelete?: string;
  onUpdate?: string;
}

export interface BackupConfig {
  enabled: boolean;
  directory?: string;
  filename?: string;
  compress?: boolean;
  retention?: number; // days
}

export interface SeedConfig {
  directory: string;
  files?: string[];
  environment?: string;
}

export interface Seed {
  name: string;
  run: (context: MigrationContext) => Promise<void>;
  dependencies?: string[];
}

export interface AutoMigrationOptions {
  /** Compare with current schema */
  compare: boolean;
  /** Generate migration name */
  name?: string;
  /** Dry run mode */
  dryRun?: boolean;
  /** Include data migrations */
  includeData?: boolean;
}

export interface DryRunResult {
  sql: string[];
  warnings: string[];
  estimatedDuration: number;
}
