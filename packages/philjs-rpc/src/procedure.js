/**
 * Procedure builder for philjs-rpc.
 * Provides a fluent API for defining type-safe RPC procedures.
 */
// ============================================================================
// Procedure Builder
// ============================================================================
/**
 * Builder class for creating procedures with input validation and middleware.
 */
class ProcedureBuilder {
    inputSchema;
    middlewares = [];
    constructor(inputSchema, middlewares = []) {
        this.inputSchema = inputSchema ?? undefined;
        this.middlewares = middlewares;
    }
    /**
     * Add input validation schema.
     *
     * @example
     * ```ts
     * procedure
     *   .input(z.object({ id: z.string() }))
     *   .query(async ({ input }) => {
     *     // input is typed as { id: string }
     *     return db.users.findUnique({ where: { id: input.id } });
     *   });
     * ```
     */
    input(schema) {
        return new ProcedureBuilder(schema, this.middlewares);
    }
    /**
     * Add middleware to the procedure.
     *
     * @example
     * ```ts
     * procedure
     *   .use(authMiddleware)
     *   .use(loggerMiddleware)
     *   .query(async ({ ctx }) => {
     *     return ctx.user; // User is in context from authMiddleware
     *   });
     * ```
     */
    use(middleware) {
        return new ProcedureBuilder(this.inputSchema, [...this.middlewares, middleware]);
    }
    /**
     * Create a query procedure (read-only operation).
     *
     * @example
     * ```ts
     * const listUsers = procedure.query(async () => {
     *   return db.users.findMany();
     * });
     * ```
     */
    query(handler) {
        return this.createProcedure('query', handler);
    }
    /**
     * Create a mutation procedure (write operation).
     *
     * @example
     * ```ts
     * const createUser = procedure
     *   .input(z.object({ name: z.string(), email: z.string().email() }))
     *   .mutation(async ({ input }) => {
     *     return db.users.create({ data: input });
     *   });
     * ```
     */
    mutation(handler) {
        return this.createProcedure('mutation', handler);
    }
    /**
     * Create a subscription procedure (real-time data stream).
     *
     * @example
     * ```ts
     * const onMessage = procedure
     *   .input(z.object({ roomId: z.string() }))
     *   .subscription(async function* ({ input }) {
     *     const room = await getRoom(input.roomId);
     *
     *     for await (const message of room.messages) {
     *       yield message;
     *     }
     *   });
     * ```
     */
    subscription(handler) {
        // Convert subscription handler to regular handler
        // The actual subscription execution is handled by the server
        return this.createProcedure('subscription', handler);
    }
    /**
     * Internal method to create a procedure definition.
     */
    createProcedure(type, handler) {
        const def = {
            type,
            handler: handler,
            middlewares: this.middlewares,
        };
        if (this.inputSchema !== undefined) {
            def.inputSchema = this.inputSchema;
        }
        return {
            _type: type,
            _input: undefined,
            _output: undefined,
            _context: undefined,
            _def: def,
        };
    }
}
/**
 * Main procedure builder instance.
 * Use this to create new procedures.
 *
 * @example
 * ```ts
 * import { procedure } from 'philjs-rpc';
 * import { z } from 'zod';
 *
 * // Simple query
 * const listUsers = procedure.query(async () => {
 *   return db.users.findMany();
 * });
 *
 * // Query with input
 * const getUserById = procedure
 *   .input(z.object({ id: z.string() }))
 *   .query(async ({ input }) => {
 *     return db.users.findUnique({ where: { id: input.id } });
 *   });
 *
 * // Mutation with input validation
 * const createUser = procedure
 *   .input(z.object({
 *     name: z.string().min(1),
 *     email: z.string().email(),
 *   }))
 *   .mutation(async ({ input }) => {
 *     return db.users.create({ data: input });
 *   });
 *
 * // With middleware
 * const deleteUser = procedure
 *   .use(authMiddleware)
 *   .use(adminMiddleware)
 *   .input(z.object({ id: z.string() }))
 *   .mutation(async ({ input, ctx }) => {
 *     return db.users.delete({ where: { id: input.id } });
 *   });
 * ```
 */
export const procedure = new ProcedureBuilder();
// ============================================================================
// Procedure Execution
// ============================================================================
/**
 * Execute a procedure with the given input and context.
 * Handles input validation and middleware execution.
 */
export async function executeProcedure(proc, opts) {
    const { input: rawInput, ctx, path } = opts;
    const { inputSchema, handler, middlewares, type } = proc._def;
    // Validate input
    let validatedInput;
    if (inputSchema) {
        try {
            validatedInput = inputSchema.parse(rawInput);
        }
        catch (error) {
            const { RPCError } = await import('./types.js');
            throw new RPCError({
                code: 'BAD_REQUEST',
                message: error instanceof Error ? error.message : 'Invalid input',
                cause: error,
            });
        }
    }
    else {
        validatedInput = rawInput;
    }
    // Execute middleware chain and handler
    if (middlewares.length > 0) {
        const { executeMiddlewareChain } = await import('./middleware.js');
        const result = await executeMiddlewareChain(middlewares, {
            ctx,
            input: validatedInput,
            type,
            path,
            handler: async (ctxFromMiddleware) => handler({ input: validatedInput, ctx: ctxFromMiddleware }),
        });
        if (!result.ok) {
            throw result.error;
        }
        return result.data;
    }
    // No middleware, execute handler directly
    return handler({ input: validatedInput, ctx });
}
// ============================================================================
// Type Utilities
// ============================================================================
/**
 * Create a procedure builder with a custom base context.
 * Useful for creating organization-specific procedure builders.
 *
 * @example
 * ```ts
 * interface AuthContext extends ProcedureContext {
 *   user: { id: string; email: string };
 * }
 *
 * const authedProcedure = createProcedureBuilder<AuthContext>();
 *
 * const getProfile = authedProcedure.query(async ({ ctx }) => {
 *   return ctx.user; // Typed!
 * });
 * ```
 */
export function createProcedureBuilder() {
    return new ProcedureBuilder();
}
/**
 * Check if a value is a procedure definition.
 */
export function isProcedure(value) {
    return (typeof value === 'object' &&
        value !== null &&
        '_type' in value &&
        '_def' in value &&
        typeof value._def.handler === 'function');
}
/**
 * Check if a procedure is a query.
 */
export function isQuery(proc) {
    return proc._type === 'query';
}
/**
 * Check if a procedure is a mutation.
 */
export function isMutation(proc) {
    return proc._type === 'mutation';
}
/**
 * Check if a procedure is a subscription.
 */
export function isSubscription(proc) {
    return proc._type === 'subscription';
}
//# sourceMappingURL=procedure.js.map