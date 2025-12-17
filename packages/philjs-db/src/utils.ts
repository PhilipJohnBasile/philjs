/**
 * PhilJS Database Utilities
 *
 * Common database utilities and patterns.
 */

import type { DatabaseConfig, Repository, PaginationOptions, PaginatedResult } from './types';

/**
 * Create a database connection based on config
 */
export async function createDatabaseConnection(config: DatabaseConfig) {
  switch (config.type) {
    case 'prisma':
      const { createPrismaClient } = await import('./prisma');
      return createPrismaClient(config.options);

    case 'drizzle':
      const { createDrizzleClient } = await import('./drizzle');
      return createDrizzleClient({
        type: config.options.dialect as any,
        connectionString: config.connectionString,
        logger: config.options.logging,
      });

    case 'supabase':
      const { createSupabaseClient } = await import('./supabase');
      return createSupabaseClient({
        url: config.connectionString,
        anonKey: config.options.anonKey,
      });

    default:
      throw new Error(`Unknown database type: ${config.type}`);
  }
}

/**
 * Transaction wrapper
 */
export async function withTransaction<T>(
  db: any,
  fn: (tx: any) => Promise<T>
): Promise<T> {
  if (db.$transaction) {
    // Prisma
    return db.$transaction(fn);
  } else if (db.transaction) {
    // Drizzle
    return db.transaction(fn);
  } else {
    // Fallback - no transaction support
    return fn(db);
  }
}

/**
 * Create a repository with common CRUD operations
 */
export function createRepository<T extends { id: string | number }>(
  db: any,
  tableName: string
): Repository<T> {
  return {
    async findAll(options?: PaginationOptions): Promise<PaginatedResult<T>> {
      return paginate(db, tableName, options || {});
    },

    async findById(id: string | number): Promise<T | null> {
      // Implementation depends on ORM
      if (db[tableName]) {
        // Prisma
        return db[tableName].findUnique({ where: { id } });
      }
      // Generic
      return null;
    },

    async findOne(where: Partial<T>): Promise<T | null> {
      if (db[tableName]) {
        return db[tableName].findFirst({ where });
      }
      return null;
    },

    async findMany(where: Partial<T>): Promise<T[]> {
      if (db[tableName]) {
        return db[tableName].findMany({ where });
      }
      return [];
    },

    async create(data: Omit<T, 'id'>): Promise<T> {
      if (db[tableName]) {
        return db[tableName].create({ data });
      }
      throw new Error('Create not implemented');
    },

    async update(id: string | number, data: Partial<T>): Promise<T> {
      if (db[tableName]) {
        return db[tableName].update({ where: { id }, data });
      }
      throw new Error('Update not implemented');
    },

    async delete(id: string | number): Promise<void> {
      if (db[tableName]) {
        await db[tableName].delete({ where: { id } });
        return;
      }
      throw new Error('Delete not implemented');
    },

    async count(where?: Partial<T>): Promise<number> {
      if (db[tableName]) {
        return db[tableName].count({ where });
      }
      return 0;
    },
  };
}

/**
 * Pagination helper
 */
export async function paginate<T>(
  db: any,
  tableName: string,
  options: PaginationOptions
): Promise<PaginatedResult<T>> {
  const { page = 1, perPage = 10, where = {}, orderBy } = options;
  const skip = (page - 1) * perPage;

  // Prisma-style pagination
  if (db[tableName]) {
    const [data, total] = await Promise.all([
      db[tableName].findMany({
        where,
        orderBy,
        skip,
        take: perPage,
      }),
      db[tableName].count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
        hasNextPage: page * perPage < total,
        hasPrevPage: page > 1,
      },
    };
  }

  // Fallback
  return {
    data: [],
    meta: {
      total: 0,
      page,
      perPage,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    },
  };
}

/**
 * Soft delete helper
 */
export async function softDelete(
  db: any,
  tableName: string,
  id: string | number
): Promise<void> {
  if (db[tableName]) {
    await db[tableName].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

/**
 * Restore soft deleted record
 */
export async function restore(
  db: any,
  tableName: string,
  id: string | number
): Promise<void> {
  if (db[tableName]) {
    await db[tableName].update({
      where: { id },
      data: { deletedAt: null },
    });
  }
}

/**
 * Database health check
 */
export async function healthCheck(db: any): Promise<{ healthy: boolean; latency: number }> {
  const start = Date.now();

  try {
    if (db.$queryRaw) {
      // Prisma
      await db.$queryRaw`SELECT 1`;
    } else if (db.execute) {
      // Drizzle
      await db.execute('SELECT 1');
    }

    return {
      healthy: true,
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      healthy: false,
      latency: Date.now() - start,
    };
  }
}
