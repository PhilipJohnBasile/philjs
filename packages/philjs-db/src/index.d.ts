/**
 * PhilJS Database Integration
 *
 * Database utilities for PhilJS applications:
 * - Prisma ORM integration
 * - Drizzle ORM integration
 * - Supabase integration
 */
export { createPrismaClient, usePrisma, withPrisma, PrismaProvider, } from './prisma';
export { createDrizzleClient, useDrizzle, withDrizzle, DrizzleProvider, } from './drizzle';
export { createSupabaseClient, useSupabase, withSupabase, SupabaseProvider, useSupabaseAuth, useSupabaseStorage, } from './supabase';
export { createDatabaseConnection, withTransaction, createRepository, paginate, softDelete, } from './utils';
export type { DatabaseConfig, Repository, PaginationOptions, PaginatedResult, } from './types';
//# sourceMappingURL=index.d.ts.map