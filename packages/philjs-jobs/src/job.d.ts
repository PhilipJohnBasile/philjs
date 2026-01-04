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
export type JobHandler<TPayload = any, TResult = any> = (payload: TPayload, context: JobContext) => TResult | Promise<TResult>;
export type JobMiddleware<TPayload = any> = (payload: TPayload, context: JobContext, next: () => Promise<any>) => Promise<any>;
export interface JobDefinition<TPayload = any, TResult = any> {
    name: string;
    handler: JobHandler<TPayload, TResult>;
    options: JobOptions;
    hooks: JobHooks<TPayload, TResult>;
    middleware: JobMiddleware<TPayload>[];
}
export interface DefineJobOptions<TPayload = any, TResult = any> extends JobOptions, JobHooks<TPayload, TResult> {
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
export declare function defineJob<TPayload = any, TResult = any>(options: DefineJobOptions<TPayload, TResult>): JobDefinition<TPayload, TResult>;
/**
 * Create a middleware for job validation
 */
export declare function createValidationMiddleware<TPayload>(validate: (payload: TPayload) => boolean | Promise<boolean>, errorMessage?: string): JobMiddleware<TPayload>;
/**
 * Create a middleware for job logging
 */
export declare function createLoggingMiddleware<TPayload>(): JobMiddleware<TPayload>;
/**
 * Create a middleware for rate limiting
 */
export declare function createRateLimitMiddleware<TPayload>(maxPerMinute: number): JobMiddleware<TPayload>;
/**
 * Create a middleware for retrying on specific errors
 */
export declare function createRetryMiddleware<TPayload>(shouldRetry: (error: Error) => boolean, maxRetries?: number, delay?: number): JobMiddleware<TPayload>;
/**
 * Compose multiple middleware into a single middleware
 */
export declare function composeMiddleware<TPayload>(...middleware: JobMiddleware<TPayload>[]): JobMiddleware<TPayload>;
//# sourceMappingURL=job.d.ts.map