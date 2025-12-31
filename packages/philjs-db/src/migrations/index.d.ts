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
export { MigrationManager } from './manager.js';
export { MigrationCLI } from './cli.js';
export { PostgresMigrationAdapter } from './adapters/postgres.js';
export { MySQLMigrationAdapter } from './adapters/mysql.js';
export { SQLiteMigrationAdapter } from './adapters/sqlite.js';
export { SchemaDiffGenerator } from './schema-diff.js';
export { AutoMigrationGenerator, BackupManager, DataMigrationHelper, } from './auto-migration.js';
export { PrismaMigrationIntegration, PrismaSchemaParser } from './integrations/prisma.js';
export { DrizzleMigrationIntegration, DrizzleSchemaParser } from './integrations/drizzle.js';
export type { DatabaseType, MigrationConfig, Migration, MigrationContext, MigrationRecord, MigrationStatus, MigrationResult, MigrationFile, MigrationConflict, MigrationError, SchemaBuilder, TableBuilder, ColumnBuilder, ForeignKeyBuilder, DataMigrationHelpers, SchemaDiff, TableDiff, ColumnDiff, IndexDiff, ForeignKeyDiff, ColumnDefinition, IndexDefinition, ForeignKeyDefinition, BackupConfig, SeedConfig, Seed, AutoMigrationOptions, DryRunResult, } from './types.js';
//# sourceMappingURL=index.d.ts.map