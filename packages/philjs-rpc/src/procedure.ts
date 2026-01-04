/**
 * Procedure builder for philjs-rpc.
 * Provides a fluent API for defining type-safe RPC procedures.
 */

import type {
  ProcedureType,
  ProcedureDefinition,
  ProcedureContext,
  ProcedureHandler,
  SubscriptionHandler,
  Schema,
  InferSchemaOutput,
  Middleware,
  RPCError,
} from './types.js';

// ============================================================================
// Procedure Builder
// ============================================================================

/**
 * Builder class for creating procedures with input validation and middleware.
 */
class ProcedureBuilder<
  TInput = void,
  TContext extends ProcedureContext = ProcedureContext
> {
  private inputSchema: Schema<TInput> | undefined;
  private middlewares: Middleware[] = [];

  constructor(
    inputSchema?: Schema<TInput>,
    middlewares: Middleware[] = []
  ) {
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
  input<TNewInput>(
    schema: Schema<TNewInput>
  ): ProcedureBuilder<TNewInput, TContext> {
    return new ProcedureBuilder<TNewInput, TContext>(
      schema,
      this.middlewares
    );
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
  use<TNewContext extends ProcedureContext>(
    middleware: Middleware<TInput, TNewContext>
  ): ProcedureBuilder<TInput, TNewContext> {
    return new ProcedureBuilder<TInput, TNewContext>(
      this.inputSchema,
      [...this.middlewares, middleware as unknown as Middleware]
    );
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
  query<TOutput>(
    handler: ProcedureHandler<TInput, TOutput, TContext>
  ): ProcedureDefinition<'query', TInput, TOutput, TContext> {
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
  mutation<TOutput>(
    handler: ProcedureHandler<TInput, TOutput, TContext>
  ): ProcedureDefinition<'mutation', TInput, TOutput, TContext> {
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
  subscription<TOutput>(
    handler: SubscriptionHandler<TInput, TOutput, TContext>
  ): ProcedureDefinition<'subscription', TInput, TOutput, TContext> {
    // Convert subscription handler to regular handler
    // The actual subscription execution is handled by the server
    return this.createProcedure('subscription', handler as any);
  }

  /**
   * Internal method to create a procedure definition.
   */
  private createProcedure<TType extends ProcedureType, TOutput>(
    type: TType,
    handler: ProcedureHandler<TInput, TOutput, TContext>
  ): ProcedureDefinition<TType, TInput, TOutput, TContext> {
    const def: ProcedureDefinition<TType, TInput, TOutput, TContext>['_def'] = {
      type,
      handler: handler as ProcedureHandler<TInput, TOutput, TContext>,
      middlewares: this.middlewares as unknown as Middleware<unknown, TContext>[],
    };

    if (this.inputSchema !== undefined) {
      def.inputSchema = this.inputSchema;
    }

    return {
      _type: type,
      _input: undefined as TInput,
      _output: undefined as TOutput,
      _context: undefined as unknown as TContext,
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
export async function executeProcedure<
  TType extends ProcedureType,
  TInput,
  TOutput,
  TContext extends ProcedureContext
>(
  proc: ProcedureDefinition<TType, TInput, TOutput, TContext>,
  opts: {
    input: unknown;
    ctx: TContext;
    path: string;
  }
): Promise<TOutput> {
  const { input: rawInput, ctx, path } = opts;
  const { inputSchema, handler, middlewares, type } = proc._def;

  // Validate input
  let validatedInput: TInput;
  if (inputSchema) {
    try {
      validatedInput = inputSchema.parse(rawInput) as TInput;
    } catch (error) {
      const { RPCError } = await import('./types.js');
      throw new RPCError({
        code: 'BAD_REQUEST',
        message: error instanceof Error ? error.message : 'Invalid input',
        cause: error,
      });
    }
  } else {
    validatedInput = rawInput as TInput;
  }

  // Execute middleware chain and handler
  if (middlewares.length > 0) {
    const { executeMiddlewareChain } = await import('./middleware.js');

    const result = await executeMiddlewareChain(middlewares as unknown as Middleware<unknown, ProcedureContext>[], {
      ctx,
      input: validatedInput,
      type,
      path,
      handler: async (ctxFromMiddleware) =>
        handler({ input: validatedInput, ctx: ctxFromMiddleware as TContext }),
    });

    if (!result.ok) {
      throw result.error;
    }

    return result.data as TOutput;
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
export function createProcedureBuilder<
  TContext extends ProcedureContext = ProcedureContext
>(): ProcedureBuilder<void, TContext> {
  return new ProcedureBuilder<void, TContext>();
}

/**
 * Check if a value is a procedure definition.
 */
export function isProcedure(
  value: unknown
): value is ProcedureDefinition<ProcedureType, unknown, unknown, ProcedureContext> {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_type' in value &&
    '_def' in value &&
    typeof (value as ProcedureDefinition<ProcedureType, unknown, unknown, ProcedureContext>)._def.handler === 'function'
  );
}

/**
 * Check if a procedure is a query.
 */
export function isQuery(
  proc: ProcedureDefinition<ProcedureType, unknown, unknown, ProcedureContext>
): proc is ProcedureDefinition<'query', unknown, unknown, ProcedureContext> {
  return proc._type === 'query';
}

/**
 * Check if a procedure is a mutation.
 */
export function isMutation(
  proc: ProcedureDefinition<ProcedureType, unknown, unknown, ProcedureContext>
): proc is ProcedureDefinition<'mutation', unknown, unknown, ProcedureContext> {
  return proc._type === 'mutation';
}

/**
 * Check if a procedure is a subscription.
 */
export function isSubscription(
  proc: ProcedureDefinition<ProcedureType, unknown, unknown, ProcedureContext>
): proc is ProcedureDefinition<'subscription', unknown, unknown, ProcedureContext> {
  return proc._type === 'subscription';
}

// Re-export ProcedureBuilder for type inference
export type { ProcedureBuilder };
