/**
 * PhilJS Database Integration
 *
 * Database utilities for PhilJS applications:
 * - Prisma ORM integration
 * - Drizzle ORM integration
 * - Supabase integration
 */
// Prisma
export { createPrismaClient, usePrisma, withPrisma, PrismaProvider, } from './prisma';
// Drizzle
export { createDrizzleClient, useDrizzle, withDrizzle, DrizzleProvider, } from './drizzle';
// Supabase
export { createSupabaseClient, useSupabase, withSupabase, SupabaseProvider, useSupabaseAuth, useSupabaseStorage, } from './supabase';
// Generic utilities
export { createDatabaseConnection, withTransaction, createRepository, paginate, softDelete, } from './utils';
//# sourceMappingURL=index.js.map