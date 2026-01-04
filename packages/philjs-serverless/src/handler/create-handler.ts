/**
 * PhilJS Serverless Handler Factory
 *
 * Creates a unified request handler that works across all deployment platforms.
 */

import type {
  Handler,
  Middleware,
  HandlerOptions,
  ServerlessContext,
  Platform,
} from '../types.js';
import {
  createContext,
  createPlatformContext,
  initColdStartTracking,
  markWarm,
  isColdStart,
} from './context.js';
import { compose } from './middleware.js';

// Initialize cold start tracking on module load
initColdStartTracking();

/**
 * Default error handler
 */
function defaultErrorHandler<State>(
  error: Error,
  ctx: ServerlessContext<State>
): Response {
  console.error('[Serverless Error]', {
    message: error.message,
    stack: error.stack,
    path: ctx.path,
    method: ctx.method,
    requestId: ctx.platform.requestId,
  });

  const isDev = typeof process !== 'undefined' && process.env?.['NODE_ENV'] !== 'production';

  return new Response(
    JSON.stringify({
      error: 'Internal Server Error',
      message: isDev ? error.message : 'An unexpected error occurred',
      ...(isDev && { stack: error.stack }),
      requestId: ctx.platform.requestId,
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': ctx.platform.requestId ?? '',
      },
    }
  );
}

/**
 * Apply response headers from context to response
 */
function applyResponseHeaders(response: Response, ctx: ServerlessContext): Response {
  const headers = new Headers(response.headers);

  // Apply headers from context
  ctx.responseHeaders.forEach((value, key) => {
    headers.set(key, value);
  });

  // Add timing headers
  headers.set('X-Response-Time', `${ctx.getElapsedTime()}ms`);

  // Add cold start header in development
  if (typeof process !== 'undefined' && process.env?.['NODE_ENV'] !== 'production') {
    headers.set('X-Cold-Start', ctx.platform.isColdStart ? 'true' : 'false');
  }

  // Add request ID header
  if (ctx.platform.requestId) {
    headers.set('X-Request-Id', ctx.platform.requestId);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Create a timeout promise
 */
function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${ms}ms`));
    }, ms);
  });
}

/**
 * Create a unified serverless handler
 *
 * @example
 * ```typescript
 * import { createHandler, json } from '@philjs/serverless';
 *
 * export default createHandler(async (ctx) => {
 *   return json({ message: 'Hello, World!' });
 * });
 * ```
 *
 * @example With middleware
 * ```typescript
 * import { createHandler, cors, logger, json } from '@philjs/serverless';
 *
 * export default createHandler(
 *   async (ctx) => {
 *     return json({ user: ctx.state.user });
 *   },
 *   {
 *     middleware: [cors(), logger()],
 *   }
 * );
 * ```
 */
export function createHandler<State = Record<string, unknown>>(
  handler: Handler<State>,
  options: HandlerOptions<State> = {}
): (request: Request, ...args: unknown[]) => Promise<Response> {
  const {
    middleware = [],
    initialState,
    onError = defaultErrorHandler,
    timeout,
    trackColdStart = true,
    detectPlatform: customDetectPlatform,
  } = options;

  // Create the composed middleware chain
  const middlewareChain = middleware.length > 0 ? compose(...middleware) : null;

  return async (request: Request, ...args: unknown[]): Promise<Response> => {
    // Extract platform-specific context from args
    const platformBindings = extractPlatformBindings(args);

    // Create platform context options - only include defined properties
    const platformOptions: Parameters<typeof createPlatformContext>[0] = {};
    if (platformBindings.bindings !== undefined) {
      platformOptions.bindings = platformBindings.bindings;
    }
    if (platformBindings.executionContext !== undefined) {
      platformOptions.executionContext = platformBindings.executionContext;
    }
    if (customDetectPlatform !== undefined) {
      platformOptions.customPlatform = customDetectPlatform();
    }
    if (platformBindings.awsContext !== undefined) {
      platformOptions.awsContext = platformBindings.awsContext;
    }

    const platformContext = createPlatformContext(platformOptions);

    // Create request context options - only include defined properties
    const contextOptions: Parameters<typeof createContext<State>>[1] = {
      platformContext,
    };
    if (initialState !== undefined) {
      contextOptions.initialState = initialState;
    }

    const ctx = createContext<State>(request, contextOptions);

    try {
      let response: Response;

      // Create the final handler that includes middleware
      const finalHandler = async (): Promise<Response> => {
        if (middlewareChain) {
          // Run through middleware chain
          return middlewareChain(ctx, async () => handler(ctx));
        } else {
          // No middleware, just run the handler
          return handler(ctx);
        }
      };

      // Apply timeout if specified
      if (timeout && timeout > 0) {
        response = await Promise.race([finalHandler(), createTimeout(timeout)]);
      } else {
        response = await finalHandler();
      }

      // Apply response headers
      response = applyResponseHeaders(response, ctx as ServerlessContext<Record<string, unknown>>);

      // Mark as warm after first successful request
      if (trackColdStart && isColdStart()) {
        markWarm();
      }

      return response;
    } catch (error) {
      // Handle errors
      const errorResponse = await onError(error as Error, ctx);
      return applyResponseHeaders(errorResponse, ctx as ServerlessContext<Record<string, unknown>>);
    }
  };
}

/**
 * Extract platform-specific bindings from handler arguments
 */
function extractPlatformBindings(args: unknown[]): {
  bindings?: Record<string, unknown>;
  executionContext?: { waitUntil: (promise: Promise<unknown>) => void };
  awsContext?: { getRemainingTimeInMillis?: () => number };
} {
  const result: {
    bindings?: Record<string, unknown>;
    executionContext?: { waitUntil: (promise: Promise<unknown>) => void };
    awsContext?: { getRemainingTimeInMillis?: () => number };
  } = {};

  for (const arg of args) {
    if (!arg || typeof arg !== 'object') continue;

    // Cloudflare Workers env and context
    if ('waitUntil' in (arg as object)) {
      result.executionContext = arg as { waitUntil: (promise: Promise<unknown>) => void };
    }

    // AWS Lambda context
    if ('getRemainingTimeInMillis' in (arg as object)) {
      result.awsContext = arg as { getRemainingTimeInMillis: () => number };
    }

    // Cloudflare bindings (env object with KV, D1, etc.)
    if (
      arg !== result.executionContext &&
      arg !== result.awsContext &&
      typeof arg === 'object'
    ) {
      // Check if this looks like a Cloudflare env object
      const keys = Object.keys(arg as object);
      const hasBindingLikeKeys = keys.some((key) => {
        const value = (arg as Record<string, unknown>)[key];
        return (
          typeof value === 'object' &&
          value !== null &&
          ('get' in value || 'put' in value || 'prepare' in value)
        );
      });

      if (hasBindingLikeKeys || keys.length > 0) {
        result.bindings = arg as Record<string, unknown>;
      }
    }
  }

  return result;
}

/**
 * Create a handler with typed state
 *
 * @example
 * ```typescript
 * interface AppState {
 *   user?: { id: string; name: string };
 *   startTime: number;
 * }
 *
 * const handler = createTypedHandler<AppState>(
 *   async (ctx) => {
 *     ctx.state.user = await getUser(ctx.getHeader('Authorization'));
 *     return json({ user: ctx.state.user });
 *   },
 *   { initialState: { startTime: Date.now() } }
 * );
 * ```
 */
export function createTypedHandler<State extends Record<string, unknown>>(
  handler: Handler<State>,
  options: HandlerOptions<State> = {}
): (request: Request, ...args: unknown[]) => Promise<Response> {
  return createHandler<State>(handler, options);
}

/**
 * Create an edge-optimized handler
 * Automatically applies best practices for edge deployment
 */
export function createEdgeHandler<State = Record<string, unknown>>(
  handler: Handler<State>,
  options: Omit<HandlerOptions<State>, 'trackColdStart'> = {}
): (request: Request, ...args: unknown[]) => Promise<Response> {
  return createHandler<State>(handler, {
    ...options,
    trackColdStart: true,
    timeout: options.timeout ?? 25000, // Default 25s for edge
  });
}

/**
 * Create a lambda-optimized handler
 * Automatically applies best practices for AWS Lambda deployment
 */
export function createLambdaHandler<State = Record<string, unknown>>(
  handler: Handler<State>,
  options: Omit<HandlerOptions<State>, 'trackColdStart'> = {}
): (request: Request, ...args: unknown[]) => Promise<Response> {
  return createHandler<State>(handler, {
    ...options,
    trackColdStart: true,
    // Lambda has its own timeout, so we don't set one here
  });
}
