/**
 * PhilJS Rocket Handlers
 *
 * Request and response handler utilities for Rocket framework.
 * Provides type-safe request handling and response building.
 */

import type { RouteContext, RouteResponse } from './server.js';

// ============================================================================
// Request Types
// ============================================================================

/**
 * HTTP method type
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * Request data extracted from Rocket
 */
export interface RequestData {
  /** HTTP method */
  method: HttpMethod;
  /** Request URI */
  uri: string;
  /** Path parameters */
  params: Record<string, string>;
  /** Query parameters */
  query: Record<string, string>;
  /** Request headers */
  headers: Headers;
  /** Cookie values */
  cookies: Record<string, string>;
  /** Request body (parsed) */
  body?: unknown;
  /** Client IP address */
  clientIp?: string;
  /** Content type */
  contentType?: string;
  /** Accept header */
  accept?: string;
}

/**
 * Handler context with typed state
 */
export interface HandlerContext<TState = Record<string, unknown>> {
  /** Request data */
  request: RequestData;
  /** Application state */
  state: TState;
  /** Response builder */
  response: ResponseBuilder;
  /** Cookies */
  cookies: CookieJar;
  /** Session (if available) */
  session?: SessionData;
}

/**
 * Session data
 */
export interface SessionData {
  id: string;
  data: Record<string, unknown>;
  get<T>(key: string): T | undefined;
  set(key: string, value: unknown): void;
  delete(key: string): void;
  clear(): void;
}

/**
 * Cookie jar for managing cookies
 */
export interface CookieJar {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: CookieOptions): void;
  delete(name: string): void;
  getAll(): Record<string, string>;
}

/**
 * Cookie options
 */
export interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

// ============================================================================
// Handler Types
// ============================================================================

/**
 * Route handler function
 */
export type Handler<TBody = unknown, TResponse = unknown, TState = Record<string, unknown>> = (
  ctx: HandlerContext<TState> & { request: RequestData & { body: TBody } }
) => Promise<TResponse> | TResponse;

/**
 * Async handler function
 */
export type AsyncHandler<TBody = unknown, TResponse = unknown> = (
  ctx: HandlerContext & { request: RequestData & { body: TBody } }
) => Promise<TResponse>;

/**
 * Middleware function
 */
export type Middleware<TState = Record<string, unknown>> = (
  ctx: HandlerContext<TState>,
  next: () => Promise<RouteResponse>
) => Promise<RouteResponse>;

// ============================================================================
// Response Builder
// ============================================================================

/**
 * Response builder for constructing responses
 */
export class ResponseBuilder {
  private _status: number = 200;
  private _headers: Map<string, string> = new Map();
  private _body: string | Uint8Array | null = null;
  private _cookies: string[] = [];

  /**
   * Set response status
   */
  status(code: number): this {
    this._status = code;
    return this;
  }

  /**
   * Set response header
   */
  header(name: string, value: string): this {
    this._headers.set(name, value);
    return this;
  }

  /**
   * Set multiple headers
   */
  headers(headers: Record<string, string>): this {
    for (const [name, value] of Object.entries(headers)) {
      this._headers.set(name, value);
    }
    return this;
  }

  /**
   * Set Content-Type header
   */
  contentType(type: string): this {
    return this.header('Content-Type', type);
  }

  /**
   * Set cache control header
   */
  cache(maxAge: number, options?: { public?: boolean; immutable?: boolean }): this {
    let value = `max-age=${maxAge}`;
    if (options?.public) value = `public, ${value}`;
    if (options?.immutable) value = `${value}, immutable`;
    return this.header('Cache-Control', value);
  }

  /**
   * Disable caching
   */
  noCache(): this {
    return this.header('Cache-Control', 'no-store, no-cache, must-revalidate');
  }

  /**
   * Set a cookie
   */
  cookie(name: string, value: string, options?: CookieOptions): this {
    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`;
    if (options?.expires) cookie += `; Expires=${options.expires.toUTCString()}`;
    if (options?.path) cookie += `; Path=${options.path}`;
    if (options?.domain) cookie += `; Domain=${options.domain}`;
    if (options?.secure) cookie += '; Secure';
    if (options?.httpOnly) cookie += '; HttpOnly';
    if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`;

    this._cookies.push(cookie);
    return this;
  }

  /**
   * Delete a cookie
   */
  deleteCookie(name: string): this {
    return this.cookie(name, '', { maxAge: 0 });
  }

  /**
   * Build HTML response
   */
  html(content: string): RouteResponse {
    return this.contentType('text/html; charset=utf-8').body(content).build();
  }

  /**
   * Build JSON response
   */
  json<T>(data: T): RouteResponse {
    return this.contentType('application/json').body(JSON.stringify(data)).build();
  }

  /**
   * Build text response
   */
  text(content: string): RouteResponse {
    return this.contentType('text/plain; charset=utf-8').body(content).build();
  }

  /**
   * Set response body
   */
  body(content: string | Uint8Array): this {
    this._body = content;
    return this;
  }

  /**
   * Build the response
   */
  build(): RouteResponse {
    const headers: Record<string, string> = {};
    this._headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Add cookies to headers
    if (this._cookies.length > 0) {
      headers['Set-Cookie'] = this._cookies.join(', ');
    }

    return {
      status: this._status,
      headers,
      body: this._body || '',
    };
  }
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Create an HTML response
 */
export function html(content: string, status: number = 200): RouteResponse {
  return new ResponseBuilder().status(status).html(content);
}

/**
 * Create a JSON response
 */
export function json<T>(data: T, status: number = 200): RouteResponse {
  return new ResponseBuilder().status(status).json(data);
}

/**
 * Create a text response
 */
export function text(content: string, status: number = 200): RouteResponse {
  return new ResponseBuilder().status(status).text(content);
}

/**
 * Create a redirect response
 */
export function redirect(url: string, status: 301 | 302 | 303 | 307 | 308 = 302): RouteResponse {
  return new ResponseBuilder()
    .status(status)
    .header('Location', url)
    .body('')
    .build();
}

/**
 * Create a not found response
 */
export function notFound(message: string = 'Not Found'): RouteResponse {
  return json({ error: message }, 404);
}

/**
 * Create a bad request response
 */
export function badRequest(message: string = 'Bad Request', errors?: Record<string, string[]>): RouteResponse {
  return json({ error: message, errors }, 400);
}

/**
 * Create an unauthorized response
 */
export function unauthorized(message: string = 'Unauthorized'): RouteResponse {
  return json({ error: message }, 401);
}

/**
 * Create a forbidden response
 */
export function forbidden(message: string = 'Forbidden'): RouteResponse {
  return json({ error: message }, 403);
}

/**
 * Create a server error response
 */
export function serverError(message: string = 'Internal Server Error'): RouteResponse {
  return json({ error: message }, 500);
}

/**
 * Create a no content response
 */
export function noContent(): RouteResponse {
  return new ResponseBuilder().status(204).body('').build();
}

/**
 * Create a created response
 */
export function created<T>(data: T, location?: string): RouteResponse {
  const builder = new ResponseBuilder().status(201);
  if (location) builder.header('Location', location);
  return builder.json(data);
}

// ============================================================================
// Handler Composition
// ============================================================================

/**
 * Create a handler with middleware
 */
export function withMiddleware<TState = Record<string, unknown>>(
  handler: Handler<unknown, RouteResponse, TState>,
  ...middleware: Middleware<TState>[]
): Handler<unknown, RouteResponse, TState> {
  return async (ctx) => {
    let index = 0;

    const next = async (): Promise<RouteResponse> => {
      if (index < middleware.length) {
        const mw = middleware[index++]!;
        return mw(ctx as unknown as HandlerContext<TState>, next);
      }
      return handler(ctx);
    };

    return next();
  };
}

/**
 * Create a typed handler
 */
export function createHandler<TBody = unknown, TResponse = RouteResponse>(
  handler: Handler<TBody, TResponse>
): Handler<TBody, TResponse> {
  return handler;
}

/**
 * Create an async handler
 */
export function createAsyncHandler<TBody = unknown, TResponse = RouteResponse>(
  handler: AsyncHandler<TBody, TResponse>
): AsyncHandler<TBody, TResponse> {
  return handler;
}

// ============================================================================
// Route Definition Helpers
// ============================================================================

/**
 * Define a GET route handler
 */
export function get<TResponse = RouteResponse>(
  handler: Handler<never, TResponse>
): { method: 'GET'; handler: Handler<never, TResponse> } {
  return { method: 'GET', handler };
}

/**
 * Define a POST route handler
 */
export function post<TBody = unknown, TResponse = RouteResponse>(
  handler: Handler<TBody, TResponse>
): { method: 'POST'; handler: Handler<TBody, TResponse> } {
  return { method: 'POST', handler };
}

/**
 * Define a PUT route handler
 */
export function put<TBody = unknown, TResponse = RouteResponse>(
  handler: Handler<TBody, TResponse>
): { method: 'PUT'; handler: Handler<TBody, TResponse> } {
  return { method: 'PUT', handler };
}

/**
 * Define a DELETE route handler
 */
export function del<TResponse = RouteResponse>(
  handler: Handler<never, TResponse>
): { method: 'DELETE'; handler: Handler<never, TResponse> } {
  return { method: 'DELETE', handler };
}

/**
 * Define a PATCH route handler
 */
export function patch<TBody = unknown, TResponse = RouteResponse>(
  handler: Handler<TBody, TResponse>
): { method: 'PATCH'; handler: Handler<TBody, TResponse> } {
  return { method: 'PATCH', handler };
}

// ============================================================================
// Request Parsing
// ============================================================================

/**
 * Parse JSON body
 */
export async function parseJson<T>(request: Request): Promise<T> {
  const text = await request.text();
  return JSON.parse(text) as T;
}

/**
 * Parse form data
 */
export async function parseForm(request: Request): Promise<Record<string, string>> {
  const text = await request.text();
  const params = new URLSearchParams(text);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * Parse multipart form data
 */
export async function parseMultipart(request: Request): Promise<FormData> {
  return request.formData();
}

/**
 * Get a path parameter
 */
export function getParam(ctx: HandlerContext, name: string): string | undefined {
  return ctx.request.params[name];
}

/**
 * Get a required path parameter (throws if missing)
 */
export function requireParam(ctx: HandlerContext, name: string): string {
  const value = ctx.request.params[name];
  if (!value) {
    throw new Error(`Missing required parameter: ${name}`);
  }
  return value;
}

/**
 * Get a query parameter
 */
export function getQuery(ctx: HandlerContext, name: string): string | undefined {
  return ctx.request.query[name];
}

/**
 * Get a header value
 */
export function getHeader(ctx: HandlerContext, name: string): string | undefined {
  return ctx.request.headers.get(name) || undefined;
}

// ============================================================================
// Rust Code Generation
// ============================================================================

/**
 * Generate Rust handler code
 */
export function generateRustHandler(name: string, method: HttpMethod, path: string): string {
  const methodLower = method.toLowerCase();

  return `
use rocket::{${methodLower}, get, post, put, delete, patch};
use rocket::serde::json::Json;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ${name}Response {
    pub success: bool,
    pub message: String,
}

#[${methodLower}("${path}")]
pub async fn ${name.toLowerCase()}() -> Json<${name}Response> {
    Json(${name}Response {
        success: true,
        message: "OK".to_string(),
    })
}
`.trim();
}

/**
 * Generate Rust handler with body
 */
export function generateRustHandlerWithBody(
  name: string,
  method: HttpMethod,
  path: string,
  bodyType: string
): string {
  const methodLower = method.toLowerCase();

  return `
use rocket::{${methodLower}};
use rocket::serde::json::Json;
use serde::{Serialize, Deserialize};

#[derive(Debug, Deserialize)]
pub struct ${bodyType} {
    // Add fields here
}

#[derive(Debug, Serialize)]
pub struct ${name}Response {
    pub success: bool,
    pub message: String,
}

#[${methodLower}("${path}", format = "json", data = "<body>")]
pub async fn ${name.toLowerCase()}(body: Json<${bodyType}>) -> Json<${name}Response> {
    Json(${name}Response {
        success: true,
        message: "OK".to_string(),
    })
}
`.trim();
}
