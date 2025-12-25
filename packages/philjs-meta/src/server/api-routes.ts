/**
 * PhilJS Meta - API Route Handlers
 *
 * Implements type-safe API route handlers with:
 * - GET, POST, PUT, PATCH, DELETE handlers
 * - Type-safe request/response
 * - Schema validation
 * - Error handling
 */

import type { MiddlewareContext, MiddlewareFunction } from './middleware';

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * API request context
 */
export interface APIContext<
  Params = Record<string, string | string[]>,
  Body = unknown,
  Query = Record<string, string | string[]>
> {
  /** Request object */
  request: Request;

  /** Route parameters */
  params: Params;

  /** Query parameters */
  query: Query;

  /** Parsed request body */
  body: Body;

  /** Request headers */
  headers: Headers;

  /** Response headers to set */
  responseHeaders: Headers;

  /** Request cookies */
  cookies: Record<string, string>;

  /** Request ID */
  requestId: string;

  /** Client IP */
  ip: string;

  /** Local storage from middleware */
  locals: Map<string, unknown>;
}

/**
 * API response helpers
 */
export const APIResponse = {
  /**
   * JSON response
   */
  json<T>(data: T, init?: ResponseInit): Response {
    return new Response(JSON.stringify(data), {
      status: 200,
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  },

  /**
   * Success response
   */
  ok<T>(data: T, init?: ResponseInit): Response {
    return APIResponse.json({ success: true, data }, init);
  },

  /**
   * Created response (201)
   */
  created<T>(data: T, init?: ResponseInit): Response {
    return APIResponse.json(data, { status: 201, ...init });
  },

  /**
   * No content response (204)
   */
  noContent(): Response {
    return new Response(null, { status: 204 });
  },

  /**
   * Bad request response (400)
   */
  badRequest(message: string = 'Bad Request', errors?: Record<string, string[]>): Response {
    return APIResponse.json(
      { success: false, error: message, errors },
      { status: 400 }
    );
  },

  /**
   * Unauthorized response (401)
   */
  unauthorized(message: string = 'Unauthorized'): Response {
    return APIResponse.json({ success: false, error: message }, { status: 401 });
  },

  /**
   * Forbidden response (403)
   */
  forbidden(message: string = 'Forbidden'): Response {
    return APIResponse.json({ success: false, error: message }, { status: 403 });
  },

  /**
   * Not found response (404)
   */
  notFound(message: string = 'Not Found'): Response {
    return APIResponse.json({ success: false, error: message }, { status: 404 });
  },

  /**
   * Method not allowed response (405)
   */
  methodNotAllowed(allowed: HttpMethod[]): Response {
    return new Response(JSON.stringify({ success: false, error: 'Method Not Allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        Allow: allowed.join(', '),
      },
    });
  },

  /**
   * Conflict response (409)
   */
  conflict(message: string = 'Conflict'): Response {
    return APIResponse.json({ success: false, error: message }, { status: 409 });
  },

  /**
   * Unprocessable entity response (422)
   */
  unprocessableEntity(errors: Record<string, string[]>): Response {
    return APIResponse.json(
      { success: false, error: 'Validation Failed', errors },
      { status: 422 }
    );
  },

  /**
   * Too many requests response (429)
   */
  tooManyRequests(retryAfter: number): Response {
    return new Response(
      JSON.stringify({ success: false, error: 'Too Many Requests' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
        },
      }
    );
  },

  /**
   * Internal server error response (500)
   */
  internalError(message: string = 'Internal Server Error'): Response {
    return APIResponse.json({ success: false, error: message }, { status: 500 });
  },

  /**
   * Redirect response
   */
  redirect(url: string, status: 301 | 302 | 303 | 307 | 308 = 302): Response {
    return new Response(null, {
      status,
      headers: { Location: url },
    });
  },

  /**
   * Stream response
   */
  stream(
    stream: ReadableStream,
    contentType: string = 'application/octet-stream',
    init?: ResponseInit
  ): Response {
    return new Response(stream, {
      ...init,
      headers: {
        'Content-Type': contentType,
        ...init?.headers,
      },
    });
  },

  /**
   * SSE (Server-Sent Events) response
   */
  sse(stream: ReadableStream<string>): Response {
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  },
};

/**
 * API handler function type
 */
export type APIHandler<
  Params = Record<string, string | string[]>,
  Body = unknown,
  Query = Record<string, string | string[]>
> = (context: APIContext<Params, Body, Query>) => Response | Promise<Response>;

/**
 * Route handler configuration
 */
export interface RouteHandlerConfig<
  Params = Record<string, string | string[]>,
  Body = unknown,
  Query = Record<string, string | string[]>
> {
  /** Handler for GET requests */
  GET?: APIHandler<Params, Body, Query>;

  /** Handler for POST requests */
  POST?: APIHandler<Params, Body, Query>;

  /** Handler for PUT requests */
  PUT?: APIHandler<Params, Body, Query>;

  /** Handler for PATCH requests */
  PATCH?: APIHandler<Params, Body, Query>;

  /** Handler for DELETE requests */
  DELETE?: APIHandler<Params, Body, Query>;

  /** Handler for HEAD requests */
  HEAD?: APIHandler<Params, Body, Query>;

  /** Handler for OPTIONS requests */
  OPTIONS?: APIHandler<Params, Body, Query>;

  /** Middleware for this route */
  middleware?: MiddlewareFunction[];

  /** Request body schema for validation */
  bodySchema?: Schema<Body>;

  /** Query params schema for validation */
  querySchema?: Schema<Query>;
}

/**
 * Simple schema interface for validation
 */
export interface Schema<T> {
  parse(data: unknown): T;
  safeParse(data: unknown): { success: true; data: T } | { success: false; error: SchemaError };
}

/**
 * Schema error
 */
export interface SchemaError {
  message: string;
  path: (string | number)[];
  issues: SchemaIssue[];
}

export interface SchemaIssue {
  message: string;
  path: (string | number)[];
  code: string;
}

/**
 * Create API route handler
 */
export function createAPIRoute<
  Params = Record<string, string | string[]>,
  Body = unknown,
  Query = Record<string, string | string[]>
>(
  config: RouteHandlerConfig<Params, Body, Query>
): APIRouteHandler {
  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;
  const allowedMethods = methods.filter((m) => config[m]);

  return {
    allowedMethods,
    config,

    async handle(middlewareContext: MiddlewareContext): Promise<Response> {
      const method = middlewareContext.request.method as HttpMethod;
      const handler = config[method];

      if (!handler) {
        return APIResponse.methodNotAllowed(allowedMethods);
      }

      try {
        // Parse query parameters
        const query = parseQueryParams(middlewareContext.url.searchParams);

        // Validate query if schema provided
        if (config.querySchema) {
          const result = config.querySchema.safeParse(query);
          if (!result.success) {
            return APIResponse.badRequest('Invalid query parameters', formatSchemaErrors(result.error));
          }
        }

        // Parse and validate body if needed
        let body: Body = undefined as Body;
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
          try {
            const contentType = middlewareContext.request.headers.get('content-type') || '';

            if (contentType.includes('application/json')) {
              body = await middlewareContext.request.json();
            } else if (contentType.includes('application/x-www-form-urlencoded')) {
              const text = await middlewareContext.request.text();
              const params = new URLSearchParams(text);
              const formBody: Record<string, string> = {};
              params.forEach((value, key) => {
                formBody[key] = value;
              });
              body = formBody as Body;
            } else if (contentType.includes('multipart/form-data')) {
              const formData = await middlewareContext.request.formData();
              const formBody: Record<string, unknown> = {};
              formData.forEach((value, key) => {
                formBody[key] = value;
              });
              body = formBody as Body;
            }
          } catch {
            return APIResponse.badRequest('Invalid request body');
          }

          // Validate body if schema provided
          if (config.bodySchema) {
            const result = config.bodySchema.safeParse(body);
            if (!result.success) {
              return APIResponse.unprocessableEntity(formatSchemaErrors(result.error));
            }
            body = result.data;
          }
        }

        // Create API context
        const context: APIContext<Params, Body, Query> = {
          request: middlewareContext.request,
          params: middlewareContext.params as Params,
          query: query as Query,
          body,
          headers: middlewareContext.request.headers,
          responseHeaders: middlewareContext.responseHeaders,
          cookies: parseCookies(middlewareContext.request.headers.get('cookie') || ''),
          requestId: middlewareContext.requestId,
          ip: middlewareContext.ip,
          locals: middlewareContext.locals,
        };

        // Execute handler
        return await handler(context);
      } catch (error) {
        console.error('API route error:', error);

        if (error instanceof Response) {
          return error;
        }

        return APIResponse.internalError(
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : String(error)
            : 'Internal Server Error'
        );
      }
    },
  };
}

/**
 * API route handler interface
 */
export interface APIRouteHandler {
  allowedMethods: HttpMethod[];
  config: RouteHandlerConfig;
  handle(context: MiddlewareContext): Promise<Response>;
}

/**
 * Parse query parameters
 */
function parseQueryParams(searchParams: URLSearchParams): Record<string, string | string[]> {
  const params: Record<string, string | string[]> = {};

  searchParams.forEach((value, key) => {
    const existing = params[key];
    if (existing) {
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        params[key] = [existing, value];
      }
    } else {
      params[key] = value;
    }
  });

  return params;
}

/**
 * Parse cookies
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) {
      cookies[name] = rest.join('=');
    }
  });

  return cookies;
}

/**
 * Format schema errors for response
 */
function formatSchemaErrors(error: SchemaError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  }

  return errors;
}

/**
 * Type-safe route parameter extractor
 */
export type ExtractParams<T extends string> = T extends `${string}[...${infer Param}]${infer Rest}`
  ? { [K in Param]: string[] } & ExtractParams<Rest>
  : T extends `${string}[${infer Param}]${infer Rest}`
  ? { [K in Param]: string } & ExtractParams<Rest>
  : Record<string, never>;

/**
 * Create type-safe API handler
 */
export function defineAPIHandler<
  Path extends string,
  Body = unknown,
  Query = Record<string, string>
>(
  _path: Path,
  config: RouteHandlerConfig<ExtractParams<Path>, Body, Query>
): APIRouteHandler {
  return createAPIRoute(config as RouteHandlerConfig);
}

/**
 * SSE (Server-Sent Events) utilities
 */
export const SSE = {
  /**
   * Create an SSE stream
   */
  createStream(): SSEStream {
    let controller: ReadableStreamDefaultController<string> | null = null;

    const stream = new ReadableStream<string>({
      start(c) {
        controller = c;
      },
    });

    return {
      stream,

      send(event: SSEEvent): void {
        if (!controller) return;

        let message = '';
        if (event.id) message += `id: ${event.id}\n`;
        if (event.event) message += `event: ${event.event}\n`;
        if (event.retry) message += `retry: ${event.retry}\n`;

        const data = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
        message += `data: ${data}\n\n`;

        controller.enqueue(message);
      },

      close(): void {
        if (controller) {
          controller.close();
        }
      },
    };
  },

  /**
   * Create an SSE response
   */
  response(handler: (stream: SSEStream) => void | Promise<void>): Response {
    const sseStream = SSE.createStream();

    // Run handler asynchronously
    Promise.resolve(handler(sseStream)).catch((error) => {
      console.error('SSE handler error:', error);
      sseStream.close();
    });

    return APIResponse.sse(
      sseStream.stream.pipeThrough(new TextEncoderStream())
    );
  },
};

/**
 * SSE stream interface
 */
export interface SSEStream {
  stream: ReadableStream<string>;
  send(event: SSEEvent): void;
  close(): void;
}

/**
 * SSE event
 */
export interface SSEEvent {
  id?: string;
  event?: string;
  data: unknown;
  retry?: number;
}

/**
 * Request body types
 */
export type JSONBody<T> = T;
export type FormBody = Record<string, string>;
export type MultipartBody = Record<string, string | File>;

/**
 * Type-safe request body parser
 */
export async function parseBody<T>(request: Request, schema?: Schema<T>): Promise<T> {
  const contentType = request.headers.get('content-type') || '';

  let body: unknown;

  if (contentType.includes('application/json')) {
    body = await request.json();
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const formBody: Record<string, string> = {};
    params.forEach((value, key) => {
      formBody[key] = value;
    });
    body = formBody;
  } else if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const formBody: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      formBody[key] = value;
    });
    body = formBody;
  } else {
    body = await request.text();
  }

  if (schema) {
    return schema.parse(body);
  }

  return body as T;
}

/**
 * Zod-like schema builder for simple validation
 */
export const z = {
  string(): StringSchema {
    return new StringSchema();
  },

  number(): NumberSchema {
    return new NumberSchema();
  },

  boolean(): BooleanSchema {
    return new BooleanSchema();
  },

  object<T extends Record<string, BaseSchema>>(shape: T): ObjectSchema<T> {
    return new ObjectSchema(shape);
  },

  array<T extends BaseSchema>(schema: T): ArraySchema<T> {
    return new ArraySchema(schema);
  },

  enum<T extends string>(values: readonly T[]): EnumSchema<T> {
    return new EnumSchema(values);
  },
};

/**
 * Base schema class
 */
abstract class BaseSchema<T = unknown> implements Schema<T> {
  protected _optional = false;
  protected _nullable = false;

  abstract parse(data: unknown): T;

  safeParse(data: unknown): { success: true; data: T } | { success: false; error: SchemaError } {
    try {
      return { success: true, data: this.parse(data) };
    } catch (error) {
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: {
            message: error.message,
            path: error.path,
            issues: error.issues,
          },
        };
      }
      return {
        success: false,
        error: {
          message: String(error),
          path: [],
          issues: [{ message: String(error), path: [], code: 'unknown' }],
        },
      };
    }
  }

  optional(): this {
    this._optional = true;
    return this;
  }

  nullable(): this {
    this._nullable = true;
    return this;
  }
}

class ValidationError extends Error {
  constructor(
    message: string,
    public path: (string | number)[],
    public issues: SchemaIssue[]
  ) {
    super(message);
  }
}

class StringSchema extends BaseSchema<string> {
  private _minLength?: number;
  private _maxLength?: number;
  private _pattern?: RegExp;
  private _email = false;

  parse(data: unknown): string {
    if (this._optional && data === undefined) return undefined as string;
    if (this._nullable && data === null) return null as unknown as string;

    if (typeof data !== 'string') {
      throw new ValidationError('Expected string', [], [{ message: 'Expected string', path: [], code: 'invalid_type' }]);
    }

    if (this._minLength !== undefined && data.length < this._minLength) {
      throw new ValidationError(
        `String must be at least ${this._minLength} characters`,
        [],
        [{ message: `String must be at least ${this._minLength} characters`, path: [], code: 'too_small' }]
      );
    }

    if (this._maxLength !== undefined && data.length > this._maxLength) {
      throw new ValidationError(
        `String must be at most ${this._maxLength} characters`,
        [],
        [{ message: `String must be at most ${this._maxLength} characters`, path: [], code: 'too_big' }]
      );
    }

    if (this._pattern && !this._pattern.test(data)) {
      throw new ValidationError(
        'String does not match pattern',
        [],
        [{ message: 'String does not match pattern', path: [], code: 'invalid_string' }]
      );
    }

    if (this._email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
      throw new ValidationError(
        'Invalid email address',
        [],
        [{ message: 'Invalid email address', path: [], code: 'invalid_string' }]
      );
    }

    return data;
  }

  min(length: number): this {
    this._minLength = length;
    return this;
  }

  max(length: number): this {
    this._maxLength = length;
    return this;
  }

  regex(pattern: RegExp): this {
    this._pattern = pattern;
    return this;
  }

  email(): this {
    this._email = true;
    return this;
  }
}

class NumberSchema extends BaseSchema<number> {
  private _min?: number;
  private _max?: number;
  private _int = false;

  parse(data: unknown): number {
    if (this._optional && data === undefined) return undefined as number;
    if (this._nullable && data === null) return null as unknown as number;

    const num = typeof data === 'string' ? parseFloat(data) : data;

    if (typeof num !== 'number' || isNaN(num)) {
      throw new ValidationError('Expected number', [], [{ message: 'Expected number', path: [], code: 'invalid_type' }]);
    }

    if (this._int && !Number.isInteger(num)) {
      throw new ValidationError('Expected integer', [], [{ message: 'Expected integer', path: [], code: 'invalid_type' }]);
    }

    if (this._min !== undefined && num < this._min) {
      throw new ValidationError(
        `Number must be at least ${this._min}`,
        [],
        [{ message: `Number must be at least ${this._min}`, path: [], code: 'too_small' }]
      );
    }

    if (this._max !== undefined && num > this._max) {
      throw new ValidationError(
        `Number must be at most ${this._max}`,
        [],
        [{ message: `Number must be at most ${this._max}`, path: [], code: 'too_big' }]
      );
    }

    return num;
  }

  min(value: number): this {
    this._min = value;
    return this;
  }

  max(value: number): this {
    this._max = value;
    return this;
  }

  int(): this {
    this._int = true;
    return this;
  }
}

class BooleanSchema extends BaseSchema<boolean> {
  parse(data: unknown): boolean {
    if (this._optional && data === undefined) return undefined as boolean;
    if (this._nullable && data === null) return null as unknown as boolean;

    if (typeof data === 'boolean') return data;
    if (data === 'true') return true;
    if (data === 'false') return false;

    throw new ValidationError('Expected boolean', [], [{ message: 'Expected boolean', path: [], code: 'invalid_type' }]);
  }
}

class ObjectSchema<T extends Record<string, BaseSchema>> extends BaseSchema<{ [K in keyof T]: ReturnType<T[K]['parse']> }> {
  constructor(private shape: T) {
    super();
  }

  parse(data: unknown): { [K in keyof T]: ReturnType<T[K]['parse']> } {
    if (this._optional && data === undefined) return undefined as { [K in keyof T]: ReturnType<T[K]['parse']> };
    if (this._nullable && data === null) return null as unknown as { [K in keyof T]: ReturnType<T[K]['parse']> };

    if (typeof data !== 'object' || data === null) {
      throw new ValidationError('Expected object', [], [{ message: 'Expected object', path: [], code: 'invalid_type' }]);
    }

    const result: Record<string, unknown> = {};
    const issues: SchemaIssue[] = [];

    for (const [key, schema] of Object.entries(this.shape)) {
      try {
        result[key] = schema.parse((data as Record<string, unknown>)[key]);
      } catch (error) {
        if (error instanceof ValidationError) {
          issues.push(...error.issues.map((issue) => ({
            ...issue,
            path: [key, ...issue.path],
          })));
        }
      }
    }

    if (issues.length > 0) {
      throw new ValidationError('Validation failed', [], issues);
    }

    return result as { [K in keyof T]: ReturnType<T[K]['parse']> };
  }
}

class ArraySchema<T extends BaseSchema> extends BaseSchema<Array<ReturnType<T['parse']>>> {
  private _minLength?: number;
  private _maxLength?: number;

  constructor(private itemSchema: T) {
    super();
  }

  parse(data: unknown): Array<ReturnType<T['parse']>> {
    if (this._optional && data === undefined) return undefined as Array<ReturnType<T['parse']>>;
    if (this._nullable && data === null) return null as unknown as Array<ReturnType<T['parse']>>;

    if (!Array.isArray(data)) {
      throw new ValidationError('Expected array', [], [{ message: 'Expected array', path: [], code: 'invalid_type' }]);
    }

    if (this._minLength !== undefined && data.length < this._minLength) {
      throw new ValidationError(
        `Array must have at least ${this._minLength} items`,
        [],
        [{ message: `Array must have at least ${this._minLength} items`, path: [], code: 'too_small' }]
      );
    }

    if (this._maxLength !== undefined && data.length > this._maxLength) {
      throw new ValidationError(
        `Array must have at most ${this._maxLength} items`,
        [],
        [{ message: `Array must have at most ${this._maxLength} items`, path: [], code: 'too_big' }]
      );
    }

    const issues: SchemaIssue[] = [];
    const result: unknown[] = [];

    for (let i = 0; i < data.length; i++) {
      try {
        result.push(this.itemSchema.parse(data[i]));
      } catch (error) {
        if (error instanceof ValidationError) {
          issues.push(...error.issues.map((issue) => ({
            ...issue,
            path: [i, ...issue.path],
          })));
        }
      }
    }

    if (issues.length > 0) {
      throw new ValidationError('Validation failed', [], issues);
    }

    return result as Array<ReturnType<T['parse']>>;
  }

  min(length: number): this {
    this._minLength = length;
    return this;
  }

  max(length: number): this {
    this._maxLength = length;
    return this;
  }
}

class EnumSchema<T extends string> extends BaseSchema<T> {
  constructor(private values: readonly T[]) {
    super();
  }

  parse(data: unknown): T {
    if (this._optional && data === undefined) return undefined as T;
    if (this._nullable && data === null) return null as unknown as T;

    if (!this.values.includes(data as T)) {
      throw new ValidationError(
        `Expected one of: ${this.values.join(', ')}`,
        [],
        [{ message: `Expected one of: ${this.values.join(', ')}`, path: [], code: 'invalid_enum_value' }]
      );
    }

    return data as T;
  }
}
