/**
 * PhilJS Prisma Integration
 *
 * Prisma ORM utilities for PhilJS applications.
 */

export interface PrismaConfig {
  /** Log queries */
  log?: ('query' | 'info' | 'warn' | 'error')[];
  /** Error formatting */
  errorFormat?: 'pretty' | 'colorless' | 'minimal';
}

let prismaClient: any = null;

/**
 * Create and configure Prisma client
 */
export function createPrismaClient(config: PrismaConfig = {}) {
  if (prismaClient) return prismaClient;

  // Dynamic import to avoid bundling Prisma if not used
  const initPrisma = async () => {
    const { PrismaClient } = await import('@prisma/client');

    prismaClient = new PrismaClient({
      log: config.log || ['error', 'warn'],
      errorFormat: config.errorFormat || 'pretty',
    });

    // Handle graceful shutdown
    if (typeof process !== 'undefined') {
      process.on('beforeExit', async () => {
        await prismaClient.$disconnect();
      });
    }

    return prismaClient;
  };

  return initPrisma();
}

/**
 * Get Prisma client instance
 */
export function usePrisma<T = any>(): T {
  if (!prismaClient) {
    throw new Error('Prisma client not initialized. Call createPrismaClient() first.');
  }
  return prismaClient;
}

/**
 * Higher-order function to inject Prisma client
 */
export function withPrisma<T extends (...args: any[]) => any>(fn: (prisma: any, ...args: Parameters<T>) => ReturnType<T>) {
  return (...args: Parameters<T>): ReturnType<T> => {
    const prisma = usePrisma();
    return fn(prisma, ...args);
  };
}

/**
 * Prisma context provider for components
 */
export function PrismaProvider(props: { children: any }) {
  // In a real implementation, this would use PhilJS context
  return props.children;
}

/**
 * Example Prisma schema
 */
export const examplePrismaSchema = `
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
}
`;

/**
 * Example usage with PhilJS
 */
export const exampleUsage = `
// src/lib/db.ts
import { createPrismaClient } from '@philjs/db/prisma';

export const prisma = createPrismaClient({
  log: ['query', 'error'],
});

// src/routes/api/users/+server.ts
import { defineAPIRoute, json } from '@philjs/api';
import { prisma } from '$lib/db';

export const GET = defineAPIRoute({
  handler: async () => {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true },
    });
    return json(users);
  },
});

export const POST = defineAPIRoute({
  handler: async ({ request }) => {
    const { email, name, password } = request.body;

    const user = await prisma.user.create({
      data: { email, name, password },
    });

    return json(user, { status: 201 });
  },
});
`;

/**
 * Transaction helper
 */
export async function withPrismaTransaction<T>(
  fn: (tx: any) => Promise<T>
): Promise<T> {
  const prisma = usePrisma();
  return prisma.$transaction(fn);
}

/**
 * Paginated query helper
 */
export async function paginatedQuery<T>(
  model: any,
  options: {
    page?: number;
    perPage?: number;
    where?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    include?: Record<string, boolean | object>;
  } = {}
): Promise<{
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}> {
  const { page = 1, perPage = 10, where = {}, orderBy, include } = options;
  const skip = (page - 1) * perPage;

  const [data, total] = await Promise.all([
    model.findMany({
      where,
      orderBy,
      include,
      skip,
      take: perPage,
    }),
    model.count({ where }),
  ]);

  return {
    data,
    meta: {
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    },
  };
}
