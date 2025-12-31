/**
 * Procedure builder for philjs-rpc.
 * Provides a fluent API for defining type-safe RPC procedures.
 */
import type { ProcedureType, ProcedureDefinition, ProcedureContext, ProcedureHandler, SubscriptionHandler, Schema, Middleware } from './types.js';
/**
 * Builder class for creating procedures with input validation and middleware.
 */
declare class ProcedureBuilder<TInput = void, TContext extends ProcedureContext = ProcedureContext> {
    private inputSchema;
    private middlewares;
    constructor(inputSchema?: Schema<TInput>, middlewares?: Middleware[]);
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
    input<TNewInput>(schema: Schema<TNewInput>): ProcedureBuilder<TNewInput, TContext>;
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
    use<TNewContext extends ProcedureContext>(middleware: Middleware<TInput, TNewContext>): ProcedureBuilder<TInput, TNewContext>;
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
    query<TOutput>(handler: ProcedureHandler<TInput, TOutput, TContext>): ProcedureDefinition<'query', TInput, TOutput, TContext>;
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
    mutation<TOutput>(handler: ProcedureHandler<TInput, TOutput, TContext>): ProcedureDefinition<'mutation', TInput, TOutput, TContext>;
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
    subscription<TOutput>(handler: SubscriptionHandler<TInput, TOutput, TContext>): ProcedureDefinition<'subscription', TInput, TOutput, TContext>;
    /**
     * Internal method to create a procedure definition.
     */
    private createProcedure;
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
export declare const procedure: ProcedureBuilder<void, ProcedureContext>;
/**
 * Execute a procedure with the given input and context.
 * Handles input validation and middleware execution.
 */
export declare function executeProcedure<TType extends ProcedureType, TInput, TOutput, TContext extends ProcedureContext>(proc: ProcedureDefinition<TType, TInput, TOutput, TContext>, opts: {
    input: unknown;
    ctx: TContext;
    path: string;
}): Promise<TOutput>;
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
export declare function createProcedureBuilder<TContext extends ProcedureContext = ProcedureContext>(): ProcedureBuilder<void, TContext>;
/**
 * Check if a value is a procedure definition.
 */
export declare function isProcedure(value: unknown): value is ProcedureDefinition<ProcedureType, unknown, unknown, ProcedureContext>;
/**
 * Check if a procedure is a query.
 */
export declare function isQuery(proc: ProcedureDefinition<ProcedureType, unknown, unknown, ProcedureContext>): proc is ProcedureDefinition<'query', unknown, unknown, ProcedureContext>;
/**
 * Check if a procedure is a mutation.
 */
export declare function isMutation(proc: ProcedureDefinition<ProcedureType, unknown, unknown, ProcedureContext>): proc is ProcedureDefinition<'mutation', unknown, unknown, ProcedureContext>;
/**
 * Check if a procedure is a subscription.
 */
export declare function isSubscription(proc: ProcedureDefinition<ProcedureType, unknown, unknown, ProcedureContext>): proc is ProcedureDefinition<'subscription', unknown, unknown, ProcedureContext>;
export type { ProcedureBuilder };
//# sourceMappingURL=procedure.d.ts.map