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
export { MigrationManager } from './manager.js';
export { MigrationCLI } from './cli.js';
// Adapters
export { PostgresMigrationAdapter } from './adapters/postgres.js';
export { MySQLMigrationAdapter } from './adapters/mysql.js';
export { SQLiteMigrationAdapter } from './adapters/sqlite.js';
// Tools
export { SchemaDiffGenerator } from './schema-diff.js';
export { AutoMigrationGenerator, BackupManager, DataMigrationHelper, } from './auto-migration.js';
// Integrations
export { PrismaMigrationIntegration, PrismaSchemaParser } from './integrations/prisma.js';
export { DrizzleMigrationIntegration, DrizzleSchemaParser } from './integrations/drizzle.js';
//# sourceMappingURL=index.js.map