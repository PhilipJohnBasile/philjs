/**
 * PhilJS Database Migrations
 *
 * Complete migration system with:
 * - Multi-database support (PostgreSQL, MySQL, SQLite, MongoDB)
 * - Migration versioning and tracking
 * - Up/down migrations with transaction support
 * - Schema diff generation
 * - Auto-migration from model changes
 * - CLI tools
 * - Prisma and Drizzle integration
 */

// Core
export { MigrationManager } from './manager';
export { MigrationCLI } from './cli';

// Adapters
export { PostgresMigrationAdapter } from './adapters/postgres';
export { MySQLMigrationAdapter } from './adapters/mysql';
export { SQLiteMigrationAdapter } from './adapters/sqlite';

// Tools
export { SchemaDiffGenerator } from './schema-diff';
export {
  AutoMigrationGenerator,
  BackupManager,
  DataMigrationHelper,
} from './auto-migration';

// Integrations
export { PrismaMigrationIntegration, PrismaSchemaParser } from './integrations/prisma';
export { DrizzleMigrationIntegration, DrizzleSchemaParser } from './integrations/drizzle';

// Types
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
  ColumnDefinition,
  IndexDefinition,
  ForeignKeyDefinition,
  BackupConfig,
  SeedConfig,
  Seed,
  AutoMigrationOptions,
  DryRunResult,
} from './types';
