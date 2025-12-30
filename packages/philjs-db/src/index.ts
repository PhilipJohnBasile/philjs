/**
 * PhilJS Database Integration
 *
 * Database utilities for PhilJS applications:
 * - Supabase integration
 * - Type-safe database utilities
 * - Database migrations (multi-database support)
 *
 * Note: Prisma and Drizzle integrations are available via separate entry points
 * once you have the required peer dependencies installed:
 * - philjs-db/prisma - requires @prisma/client
 * - philjs-db/drizzle - requires drizzle-orm
 */

// Supabase
export {
  createSupabaseClient,
  useSupabase,
  withSupabase,
  SupabaseProvider,
  useSupabaseAuth,
  useSupabaseStorage,
} from './supabase.js';

// Type-Safe Database Utilities
export {
  TypeSafeQueryBuilder,
  Operators,
  SchemaValidator,
  RelationshipBuilder,
  MigrationBuilder,
  query,
  validator,
  migration,
  relationship,
  is,
  assert,
  pick,
  omit,
} from './type-safe-db.js';

export type {
  InferModel,
  InferSelect,
  InferInsert,
  InferUpdate,
  RelationshipType,
  Relationship,
  QueryOptions,
  WhereClause,
  OrderByClause,
  SchemaConstraints,
  ValidationResult,
  ValidationError,
  MigrationOperation,
  ColumnDefinition,
  DeepPartial,
  DeepRequired,
  Exact,
} from './type-safe-db.js';

// Generic utilities
export {
  createDatabaseConnection,
  withTransaction,
  createRepository,
  paginate,
  softDelete,
  // CRUD operations with provider detection
  create,
  update,
  deleteRecord,
  detectProvider,
  // Universal QueryBuilder
  QueryBuilder,
  queryBuilder,
  // Transaction support with Symbol.asyncDispose
  Transaction,
  TransactionRollbackError,
  createTransaction,
  transaction,
} from './utils.js';

export type {
  DatabaseProvider,
  WhereClause as UtilsWhereClause,
  JoinClause,
  JoinCondition,
  CreateOptions,
  UpdateOptions,
  DeleteOptions,
  CascadeRelation,
} from './utils.js';

export type {
  DatabaseConfig,
  Repository,
  PaginationOptions,
  PaginatedResult,
} from './types.js';

// Migrations
export {
  MigrationManager,
  MigrationCLI,
  PostgresMigrationAdapter,
  MySQLMigrationAdapter,
  SQLiteMigrationAdapter,
  SchemaDiffGenerator,
  AutoMigrationGenerator,
  BackupManager,
  DataMigrationHelper,
  PrismaMigrationIntegration,
  PrismaSchemaParser,
  DrizzleMigrationIntegration,
  DrizzleSchemaParser,
} from './migrations/index.js';

export type {
  DatabaseType,
  MigrationConfig,
  Migration,
  MigrationContext,
  MigrationRecord,
  MigrationStatus,
  MigrationResult,
  MigrationFile,
  MigrationConflict,
  MigrationError,
  SchemaBuilder,
  TableBuilder,
  ColumnBuilder,
  ForeignKeyBuilder,
  DataMigrationHelpers,
  SchemaDiff,
  TableDiff,
  ColumnDiff,
  IndexDiff,
  ForeignKeyDiff,
  BackupConfig,
  SeedConfig,
  Seed,
  AutoMigrationOptions,
  DryRunResult,
} from './migrations/index.js';
