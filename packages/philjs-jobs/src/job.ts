/**
 * Job Definition System
 *
 * Type-safe job definitions with middleware support and concurrency control.
 */

export interface JobContext {
  jobId: string;
  attemptsMade: number;
  timestamp: number;
  updateProgress: (progress: number) => Promise<void>;
  log: (...args: any[]) => void;
}

export interface JobOptions {
  /** Maximum number of retry attempts */
  attempts?: number;
  /** Backoff strategy for retries */
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  /** Job priority (higher = more priority) */
  priority?: number;
  /** Delay before processing (milliseconds) */
  delay?: number;
  /** Job timeout (milliseconds) */
  timeout?: number;
  /** Maximum number of jobs that can run concurrently */
  concurrency?: number;
  /** Remove job on completion */
  removeOnComplete?: boolean | number;
  /** Remove job on failure */
  removeOnFail?: boolean | number;
}

export interface JobHooks<TPayload = any, TResult = any> {
  /** Called before job execution */
  onBefore?: (payload: TPayload, context: JobContext) => void | Promise<void>;
  /** Called after successful job execution */
  onComplete?: (result: TResult, context: JobContext) => void | Promise<void>;
  /** Called when job fails */
  onFail?: (error: Error, context: JobContext) => void | Promise<void>;
  /** Called when job progress is updated */
  onProgress?: (progress: number, context: JobContext) => void | Promise<void>;
  /** Called after job execution (success or failure) */
  onFinally?: (context: JobContext) => void | Promise<void>;
}

export type JobHandler<TPayload = any, TResult = any> = (
  payload: TPayload,
  context: JobContext
) => TResult | Promise<TResult>;

export type JobMiddleware<TPayload = any> = (
  payload: TPayload,
  context: JobContext,
  next: () => Promise<any>
) => Promise<any>;

export interface JobDefinition<TPayload = any, TResult = any> {
  name: string;
  handler: JobHandler<TPayload, TResult>;
  options: JobOptions;
  hooks: JobHooks<TPayload, TResult>;
  middleware: JobMiddleware<TPayload>[];
}

export interface DefineJobOptions<TPayload = any, TResult = any>
  extends JobOptions, JobHooks<TPayload, TResult> {
  /** Job name */
  name: string;
  /** Job handler function */
  handler: JobHandler<TPayload, TResult>;
  /** Middleware chain */
  middleware?: JobMiddleware<TPayload>[];
}

/**
 * Define a type-safe background job
 *
 * @example
 * ```ts
 * const sendEmailJob = defineJob({
 *   name: 'send-email',
 *   handler: async (payload: { to: string; subject: string; body: string }, ctx) => {
 *     await ctx.updateProgress(0);
 *     await sendEmail(payload);
 *     await ctx.updateProgress(100);
 *     return { sent: true };
 *   },
 *   attempts: 3,
 *   backoff: { type: 'exponential', delay: 1000 },
 *   onComplete: (result, ctx) => {
 *     console.log(`Email sent successfully: ${ctx.jobId}`);
 *   },
 *   onFail: (error, ctx) => {
 *     console.error(`Failed to send email: ${error.message}`);
 *   }
 * });
 * ```
 */
export function defineJob<TPayload = any, TResult = any>(
  options: DefineJobOptions<TPayload, TResult>
): JobDefinition<TPayload, TResult> {
  const {
    name,
    handler,
    middleware = [],
    onBefore,
    onComplete,
    onFail,
    onProgress,
    onFinally,
    ...jobOptions
  } = options;

  return {
    name,
    handler,
    options: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      priority: 0,
      removeOnComplete: true,
      removeOnFail: false,
      ...jobOptions,
    },
    hooks: {
      onBefore,
      onComplete,
      onFail,
      onProgress,
      onFinally,
    },
    middleware,
  };
}

/**
 * Create a middleware for job validation
 */
export function createValidationMiddleware<TPayload>(
  validate: (payload: TPayload) => boolean | Promise<boolean>,
  errorMessage = 'Invalid job payload'
): JobMiddleware<TPayload> {
  return async (payload, context, next) => {
    const isValid = await validate(payload);
    if (!isValid) {
      throw new Error(errorMessage);
    }
    return next();
  };
}

/**
 * Create a middleware for job logging
 */
export function createLoggingMiddleware<TPayload>(): JobMiddleware<TPayload> {
  return async (payload, context, next) => {
    const startTime = Date.now();
    context.log(`[${context.jobId}] Starting job`);

    try {
      const result = await next();
      const duration = Date.now() - startTime;
      context.log(`[${context.jobId}] Completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      context.log(`[${context.jobId}] Failed after ${duration}ms:`, error);
      throw error;
    }
  };
}

/**
 * Create a middleware for rate limiting
 */
export function createRateLimitMiddleware<TPayload>(
  maxPerMinute: number
): JobMiddleware<TPayload> {
  const timestamps: number[] = [];

  return async (payload, context, next) => {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove old timestamps
    while (timestamps.length > 0 && timestamps[0] < oneMinuteAgo) {
      timestamps.shift();
    }

    if (timestamps.length >= maxPerMinute) {
      const oldestTimestamp = timestamps[0];
      const waitTime = oldestTimestamp + 60000 - now;
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)}s`);
    }

    timestamps.push(now);
    return next();
  };
}

/**
 * Create a middleware for retrying on specific errors
 */
export function createRetryMiddleware<TPayload>(
  shouldRetry: (error: Error) => boolean,
  maxRetries = 3,
  delay = 1000
): JobMiddleware<TPayload> {
  return async (payload, context, next) => {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await next();
      } catch (error) {
        lastError = error as Error;

        if (!shouldRetry(lastError) || attempt === maxRetries - 1) {
          throw lastError;
        }

        context.log(`Retry attempt ${attempt + 1}/${maxRetries} after error:`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }

    throw lastError;
  };
}

/**
 * Compose multiple middleware into a single middleware
 */
export function composeMiddleware<TPayload>(
  ...middleware: JobMiddleware<TPayload>[]
): JobMiddleware<TPayload> {
  return async (payload, context, next) => {
    let index = 0;

    const dispatch = async (): Promise<any> => {
      if (index >= middleware.length) {
        return next();
      }

      const mw = middleware[index++];
      return mw(payload, context, dispatch);
    };

    return dispatch();
  };
}
