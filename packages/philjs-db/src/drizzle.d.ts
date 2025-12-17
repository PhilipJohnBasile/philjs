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
/**
 * Create and configure Drizzle client
 */
export declare function createDrizzleClient(config: DrizzleConfig): Promise<any>;
/**
 * Get Drizzle client instance
 */
export declare function useDrizzle<T = any>(): T;
/**
 * Higher-order function to inject Drizzle client
 */
export declare function withDrizzle<T extends (...args: any[]) => any>(fn: (db: any, ...args: Parameters<T>) => ReturnType<T>): (...args: Parameters<T>) => ReturnType<T>;
/**
 * Drizzle context provider
 */
export declare function DrizzleProvider(props: {
    children: any;
}): any;
/**
 * Example Drizzle schema
 */
export declare const exampleDrizzleSchema = "\n// src/db/schema.ts\nimport { pgTable, serial, text, timestamp, boolean, varchar } from 'drizzle-orm/pg-core';\n\nexport const users = pgTable('users', {\n  id: serial('id').primaryKey(),\n  email: varchar('email', { length: 255 }).notNull().unique(),\n  name: varchar('name', { length: 255 }),\n  password: text('password').notNull(),\n  createdAt: timestamp('created_at').defaultNow().notNull(),\n  updatedAt: timestamp('updated_at').defaultNow().notNull(),\n});\n\nexport const posts = pgTable('posts', {\n  id: serial('id').primaryKey(),\n  title: varchar('title', { length: 255 }).notNull(),\n  content: text('content'),\n  published: boolean('published').default(false).notNull(),\n  createdAt: timestamp('created_at').defaultNow().notNull(),\n  updatedAt: timestamp('updated_at').defaultNow().notNull(),\n  authorId: serial('author_id').references(() => users.id),\n});\n";
/**
 * Example usage with PhilJS
 */
export declare const exampleUsage = "\n// src/lib/db.ts\nimport { createDrizzleClient } from '@philjs/db/drizzle';\nimport * as schema from './schema';\n\nexport const db = await createDrizzleClient({\n  type: 'postgres',\n  connectionString: process.env.DATABASE_URL!,\n  logger: true,\n});\n\n// src/routes/api/users/+server.ts\nimport { defineAPIRoute, json } from '@philjs/api';\nimport { db } from '$lib/db';\nimport { users } from '$lib/db/schema';\nimport { eq } from 'drizzle-orm';\n\nexport const GET = defineAPIRoute({\n  handler: async () => {\n    const allUsers = await db.select().from(users);\n    return json(allUsers);\n  },\n});\n\nexport const POST = defineAPIRoute({\n  handler: async ({ request }) => {\n    const { email, name, password } = request.body;\n\n    const [user] = await db.insert(users).values({\n      email,\n      name,\n      password,\n    }).returning();\n\n    return json(user, { status: 201 });\n  },\n});\n\n// Query with conditions\nexport const getUserById = async (id: number) => {\n  const [user] = await db.select().from(users).where(eq(users.id, id));\n  return user;\n};\n";
/**
 * Transaction helper for Drizzle
 */
export declare function withDrizzleTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
//# sourceMappingURL=drizzle.d.ts.map