/**
 * Job Definition System
 *
 * Type-safe job definitions with middleware support and concurrency control.
 */
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
export function defineJob(options) {
    const { name, handler, middleware = [], onBefore, onComplete, onFail, onProgress, onFinally, ...jobOptions } = options;
    // Build hooks object excluding undefined values for exactOptionalPropertyTypes
    const hooks = {};
    if (onBefore !== undefined)
        hooks.onBefore = onBefore;
    if (onComplete !== undefined)
        hooks.onComplete = onComplete;
    if (onFail !== undefined)
        hooks.onFail = onFail;
    if (onProgress !== undefined)
        hooks.onProgress = onProgress;
    if (onFinally !== undefined)
        hooks.onFinally = onFinally;
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
        hooks,
        middleware,
    };
}
/**
 * Create a middleware for job validation
 */
export function createValidationMiddleware(validate, errorMessage = 'Invalid job payload') {
    return async (payload, _context, next) => {
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
export function createLoggingMiddleware() {
    return async (_payload, context, next) => {
        const startTime = Date.now();
        context.log(`[${context.jobId}] Starting job`);
        try {
            const result = await next();
            const duration = Date.now() - startTime;
            context.log(`[${context.jobId}] Completed in ${duration}ms`);
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            context.log(`[${context.jobId}] Failed after ${duration}ms:`, error);
            throw error;
        }
    };
}
/**
 * Create a middleware for rate limiting
 */
export function createRateLimitMiddleware(maxPerMinute) {
    const timestamps = [];
    return async (_payload, _context, next) => {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        // Remove old timestamps
        while (timestamps.length > 0 && timestamps[0] < oneMinuteAgo) {
            timestamps.shift();
        }
        if (timestamps.length >= maxPerMinute) {
            const oldestTimestamp = timestamps[0];
            if (oldestTimestamp !== undefined) {
                const waitTime = oldestTimestamp + 60000 - now;
                throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)}s`);
            }
        }
        timestamps.push(now);
        return next();
    };
}
/**
 * Create a middleware for retrying on specific errors
 */
export function createRetryMiddleware(shouldRetry, maxRetries = 3, delay = 1000) {
    return async (_payload, context, next) => {
        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                return await next();
            }
            catch (error) {
                lastError = error;
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
export function composeMiddleware(...middleware) {
    return async (payload, context, next) => {
        let index = 0;
        const dispatch = async () => {
            if (index >= middleware.length) {
                return next();
            }
            const mw = middleware[index++];
            return mw(payload, context, dispatch);
        };
        return dispatch();
    };
}
//# sourceMappingURL=job.js.map