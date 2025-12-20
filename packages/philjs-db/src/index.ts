/**
 * PhilJS Database Integration
 *
 * Database utilities for PhilJS applications:
 * - Prisma ORM integration (basic & advanced)
 * - Drizzle ORM integration (basic & advanced)
 * - Supabase integration
 * - Type-safe database utilities
 * - Database migrations (multi-database support)
 */

// Prisma - Basic
export {
  createPrismaClient,
  usePrisma,
  withPrisma,
  PrismaProvider,
  withPrismaTransaction,
  paginatedQuery,
} from './prisma';

// Prisma - Advanced
export {
  PrismaManager,
  usePrismaQuery,
  usePrismaMutation,
  loggingMiddleware,
  performanceMiddleware,
  errorTrackingMiddleware,
  softDeleteMiddleware,
  createQueryBuilder,
  paginatedPrismaQuery,
  batchCreate,
  upsertMany,
  safeTransaction,
} from './prisma-advanced';

export type {
  PrismaQueryOptions,
  PrismaMutationOptions,
  PrismaQueryResult,
  PrismaMutationResult,
  PrismaCache,
  PrismaMiddleware,
} from './prisma-advanced';

// Drizzle - Basic
export {
  createDrizzleClient,
  useDrizzle,
  withDrizzle,
  DrizzleProvider,
  withDrizzleTransaction,
} from './drizzle';

// Drizzle - Advanced
export {
  DrizzleManager,
  useDrizzleQuery,
  useDrizzleMutation,
  paginatedDrizzleQuery,
  batchInsert,
  upsert,
  softDelete as drizzleSoftDelete,
  safeTransaction as drizzleSafeTransaction,
  runMigrations,
  generateMigration,
  pushSchema,
  selectHelper,
  whereHelper,
  orderByHelper,
} from './drizzle-advanced';

export type {
  DrizzleQueryOptions,
  DrizzleMutationOptions,
  DrizzleQueryResult,
  DrizzleMutationResult,
  DrizzleCache,
  DrizzleBatchOptions,
} from './drizzle-advanced';

// Supabase
export {
  createSupabaseClient,
  useSupabase,
  withSupabase,
  SupabaseProvider,
  useSupabaseAuth,
  useSupabaseStorage,
} from './supabase';

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
} from './type-safe-db';

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
} from './type-safe-db';

// Generic utilities
export {
  createDatabaseConnection,
  withTransaction,
  createRepository,
  paginate,
  softDelete,
} from './utils';

export type {
  DatabaseConfig,
  Repository,
  PaginationOptions,
  PaginatedResult,
} from './types';

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
} from './migrations';

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
} from './migrations';
