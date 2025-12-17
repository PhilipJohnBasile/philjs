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
/**
 * Create and configure Prisma client
 */
export declare function createPrismaClient(config?: PrismaConfig): any;
/**
 * Get Prisma client instance
 */
export declare function usePrisma<T = any>(): T;
/**
 * Higher-order function to inject Prisma client
 */
export declare function withPrisma<T extends (...args: any[]) => any>(fn: (prisma: any, ...args: Parameters<T>) => ReturnType<T>): (...args: Parameters<T>) => ReturnType<T>;
/**
 * Prisma context provider for components
 */
export declare function PrismaProvider(props: {
    children: any;
}): any;
/**
 * Example Prisma schema
 */
export declare const examplePrismaSchema = "\n// prisma/schema.prisma\ngenerator client {\n  provider = \"prisma-client-js\"\n}\n\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")\n}\n\nmodel User {\n  id        String   @id @default(cuid())\n  email     String   @unique\n  name      String?\n  password  String\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  posts     Post[]\n}\n\nmodel Post {\n  id        String   @id @default(cuid())\n  title     String\n  content   String?\n  published Boolean  @default(false)\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n  author    User     @relation(fields: [authorId], references: [id])\n  authorId  String\n}\n";
/**
 * Example usage with PhilJS
 */
export declare const exampleUsage = "\n// src/lib/db.ts\nimport { createPrismaClient } from '@philjs/db/prisma';\n\nexport const prisma = createPrismaClient({\n  log: ['query', 'error'],\n});\n\n// src/routes/api/users/+server.ts\nimport { defineAPIRoute, json } from '@philjs/api';\nimport { prisma } from '$lib/db';\n\nexport const GET = defineAPIRoute({\n  handler: async () => {\n    const users = await prisma.user.findMany({\n      select: { id: true, email: true, name: true },\n    });\n    return json(users);\n  },\n});\n\nexport const POST = defineAPIRoute({\n  handler: async ({ request }) => {\n    const { email, name, password } = request.body;\n\n    const user = await prisma.user.create({\n      data: { email, name, password },\n    });\n\n    return json(user, { status: 201 });\n  },\n});\n";
/**
 * Transaction helper
 */
export declare function withPrismaTransaction<T>(fn: (tx: any) => Promise<T>): Promise<T>;
/**
 * Paginated query helper
 */
export declare function paginatedQuery<T>(model: any, options?: {
    page?: number;
    perPage?: number;
    where?: Record<string, unknown>;
    orderBy?: Record<string, 'asc' | 'desc'>;
    include?: Record<string, boolean | object>;
}): Promise<{
    data: T[];
    meta: {
        total: number;
        page: number;
        perPage: number;
        totalPages: number;
    };
}>;
//# sourceMappingURL=prisma.d.ts.map