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
export { createSupabaseClient, useSupabase, withSupabase, SupabaseProvider, useSupabaseAuth, useSupabaseStorage, } from './supabase.js';
// Type-Safe Database Utilities
export { TypeSafeQueryBuilder, Operators, SchemaValidator, RelationshipBuilder, MigrationBuilder, query, validator, migration, relationship, is, assert, pick, omit, } from './type-safe-db.js';
// Generic utilities
export { createDatabaseConnection, withTransaction, createRepository, paginate, softDelete, restore, healthCheck, 
// CRUD operations with provider detection
create, update, deleteRecord, detectProvider, 
// Universal QueryBuilder
QueryBuilder, queryBuilder, 
// Transaction support with Symbol.asyncDispose
Transaction, TransactionRollbackError, createTransaction, transaction, } from './utils.js';
// Migrations
export { MigrationManager, MigrationCLI, PostgresMigrationAdapter, MySQLMigrationAdapter, SQLiteMigrationAdapter, SchemaDiffGenerator, AutoMigrationGenerator, BackupManager, DataMigrationHelper, PrismaMigrationIntegration, PrismaSchemaParser, DrizzleMigrationIntegration, DrizzleSchemaParser, } from './migrations/index.js';
//# sourceMappingURL=index.js.map