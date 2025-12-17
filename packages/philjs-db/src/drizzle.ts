/**
 * PhilJS Drizzle Integration
 *
 * Drizzle ORM utilities for PhilJS applications.
 */

export interface DrizzleConfig {
  /** Database connection string */
  connectionString: string;
  /** Database type */
  type: 'postgres' | 'mysql' | 'sqlite';
  /** Connection pool size */
  poolSize?: number;
  /** Enable logging */
  logger?: boolean;
}

let drizzleClient: any = null;

/**
 * Create and configure Drizzle client
 */
export async function createDrizzleClient(config: DrizzleConfig) {
  if (drizzleClient) return drizzleClient;

  const { type, connectionString, logger = false } = config;

  switch (type) {
    case 'postgres': {
      const { drizzle } = await import('drizzle-orm/postgres-js');
      const postgres = (await import('postgres')).default;
      const client = postgres(connectionString);
      drizzleClient = drizzle(client, { logger });
      break;
    }
    case 'mysql': {
      const { drizzle } = await import('drizzle-orm/mysql2');
      const mysql = await import('mysql2/promise');
      const pool = mysql.createPool(connectionString);
      drizzleClient = drizzle(pool, { logger, mode: 'default' });
      break;
    }
    case 'sqlite': {
      const { drizzle } = await import('drizzle-orm/better-sqlite3');
      const Database = (await import('better-sqlite3')).default;
      const sqlite = new Database(connectionString);
      drizzleClient = drizzle(sqlite, { logger });
      break;
    }
  }

  return drizzleClient;
}

/**
 * Get Drizzle client instance
 */
export function useDrizzle<T = any>(): T {
  if (!drizzleClient) {
    throw new Error('Drizzle client not initialized. Call createDrizzleClient() first.');
  }
  return drizzleClient;
}

/**
 * Higher-order function to inject Drizzle client
 */
export function withDrizzle<T extends (...args: any[]) => any>(
  fn: (db: any, ...args: Parameters<T>) => ReturnType<T>
) {
  return (...args: Parameters<T>): ReturnType<T> => {
    const db = useDrizzle();
    return fn(db, ...args);
  };
}

/**
 * Drizzle context provider
 */
export function DrizzleProvider(props: { children: any }) {
  return props.children;
}

/**
 * Example Drizzle schema
 */
export const exampleDrizzleSchema = `
// src/db/schema.ts
import { pgTable, serial, text, timestamp, boolean, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content'),
  published: boolean('published').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  authorId: serial('author_id').references(() => users.id),
});
`;

/**
 * Example usage with PhilJS
 */
export const exampleUsage = `
// src/lib/db.ts
import { createDrizzleClient } from '@philjs/db/drizzle';
import * as schema from './schema';

export const db = await createDrizzleClient({
  type: 'postgres',
  connectionString: process.env.DATABASE_URL!,
  logger: true,
});

// src/routes/api/users/+server.ts
import { defineAPIRoute, json } from '@philjs/api';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = defineAPIRoute({
  handler: async () => {
    const allUsers = await db.select().from(users);
    return json(allUsers);
  },
});

export const POST = defineAPIRoute({
  handler: async ({ request }) => {
    const { email, name, password } = request.body;

    const [user] = await db.insert(users).values({
      email,
      name,
      password,
    }).returning();

    return json(user, { status: 201 });
  },
});

// Query with conditions
export const getUserById = async (id: number) => {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
};
`;

/**
 * Transaction helper for Drizzle
 */
export async function withDrizzleTransaction<T>(
  fn: (tx: any) => Promise<T>
): Promise<T> {
  const db = useDrizzle();
  return db.transaction(fn);
}
