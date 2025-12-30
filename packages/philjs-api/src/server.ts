/**
 * PhilJS API Server Utilities
 *
 * Create and handle API routes with type safety.
 */

export interface APIRequest {
  /** Request URL */
  url: URL;
  /** HTTP method */
  method: string;
  /** Request headers */
  headers: Headers;
  /** URL parameters */
  params: Record<string, string>;
  /** Query parameters */
  query: Record<string, string>;
  /** Request body (parsed) */
  body: unknown;
  /** Raw request body */
  rawBody: string | null;
  /** Original Request object */
  raw: Request;
}

export interface APIContext {
  /** The request */
  request: APIRequest;
  /** Response helpers */
  response: ResponseHelpers;
  /** Get a cookie */
  getCookie: (name: string) => string | undefined;
  /** Set a cookie */
  setCookie: (name: string, value: string, options?: CookieOptions) => void;
  /** Delete a cookie */
  deleteCookie: (name: string) => void;
  /** Get session */
  getSession: () => Promise<Session>;
  /** Platform-specific context */
  platform?: unknown;
  /** Environment variables */
  env: Record<string, string | undefined>;
}

export interface ResponseHelpers {
  /** Set response header */
  setHeader: (name: string, value: string) => void;
  /** Set response status */
  setStatus: (status: number) => void;
  /** Append to response headers */
  appendHeader: (name: string, value: string) => void;
}

export interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

export interface Session {
  id: string;
  data: Record<string, unknown>;
  get: <T>(key: string) => T | undefined;
  set: (key: string, value: unknown) => void;
  delete: (key: string) => void;
  clear: () => void;
}

export type APIHandler = (context: APIContext) => Response | Promise<Response>;

export type RouteHandler = {
  GET?: APIHandler;
  POST?: APIHandler;
  PUT?: APIHandler;
  PATCH?: APIHandler;
  DELETE?: APIHandler;
  HEAD?: APIHandler;
  OPTIONS?: APIHandler;
};

export interface APIResponse {
  status: number;
  headers: Headers;
  body: unknown;
}

/**
 * Create an API handler from route handlers
 */
export function createAPIHandler(handlers: RouteHandler): APIHandler {
  return async (context) => {
    const method = context.request.method.toUpperCase() as keyof RouteHandler;
    const handler = handlers[method];

    if (!handler) {
      return new Response(
        JSON.stringify({ error: `Method ${method} not allowed` }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            Allow: Object.keys(handlers).join(', '),
          },
        }
      );
    }

    return handler(context);
  };
}

/**
 * Define an API route with type safety
 */
export function defineAPIRoute<
  TBody = unknown,
  TResponse = unknown
>(config: {
  method?: string | string[];
  handler: (
    context: APIContext & { request: APIRequest & { body: TBody } }
  ) => Response | Promise<Response>;
  middleware?: Array<(context: APIContext, next: () => Promise<Response>) => Promise<Response>>;
}): APIHandler {
  const { method, handler, middleware = [] } = config;
  const methods = method
    ? Array.isArray(method)
      ? method.map((m) => m.toUpperCase())
      : [method.toUpperCase()]
    : null;

  return async (context) => {
    // Check method
    if (methods && !methods.includes(context.request.method.toUpperCase())) {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Run middleware chain
    let index = 0;
    const next = async (): Promise<Response> => {
      if (index < middleware.length) {
        const mw = middleware[index++];
        return mw!(context, next);
      }
      return handler(context as any);
    };

    return next();
  };
}

/**
 * JSON response helper
 */
export function json<T>(data: T, init?: ResponseInit): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
}

/**
 * Text response helper
 */
export function text(data: string, init?: ResponseInit): Response {
  return new Response(data, {
    ...init,
    headers: {
      'Content-Type': 'text/plain',
      ...init?.headers,
    },
  });
}

/**
 * HTML response helper
 */
export function html(data: string, init?: ResponseInit): Response {
  return new Response(data, {
    ...init,
    headers: {
      'Content-Type': 'text/html',
      ...init?.headers,
    },
  });
}

/**
 * Redirect response helper
 */
export function redirect(url: string, status: 301 | 302 | 303 | 307 | 308 = 302): Response {
  return new Response(null, {
    status,
    headers: { Location: url },
  });
}

/**
 * Not found response helper
 */
export function notFound(message = 'Not Found'): Response {
  return json({ error: message }, { status: 404 });
}

/**
 * Bad request response helper
 */
export function badRequest(message = 'Bad Request', errors?: Record<string, string[]>): Response {
  return json({ error: message, errors }, { status: 400 });
}

/**
 * Unauthorized response helper
 */
export function unauthorized(message = 'Unauthorized'): Response {
  return json({ error: message }, { status: 401 });
}

/**
 * Forbidden response helper
 */
export function forbidden(message = 'Forbidden'): Response {
  return json({ error: message }, { status: 403 });
}

/**
 * Server error response helper
 */
export function serverError(message = 'Internal Server Error'): Response {
  return json({ error: message }, { status: 500 });
}

/**
 * Parse request body based on content type
 */
export async function parseBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return request.json();
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const text = await request.text();
    return Object.fromEntries(new URLSearchParams(text));
  }

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const data: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });
    return data;
  }

  return request.text();
}

/**
 * Create API context from request
 */
export async function createAPIContext(
  request: Request,
  params: Record<string, string> = {},
  platform?: unknown
): Promise<APIContext> {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams);
  const body = await parseBody(request);
  const rawBody = request.body ? await request.text() : null;

  const cookies = new Map<string, string>();
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies.set(name, decodeURIComponent(value));
      }
    });
  }

  const responseHeaders = new Headers();
  const responseCookies: string[] = [];
  let responseStatus = 200;

  return {
    request: {
      url,
      method: request.method,
      headers: request.headers,
      params,
      query,
      body,
      rawBody,
      raw: request,
    },
    response: {
      setHeader(name, value) {
        responseHeaders.set(name, value);
      },
      setStatus(status) {
        responseStatus = status;
      },
      appendHeader(name, value) {
        responseHeaders.append(name, value);
      },
    },
    getCookie(name) {
      return cookies.get(name);
    },
    setCookie(name, value, options = {}) {
      const cookie = serializeCookie(name, value, options);
      responseCookies.push(cookie);
    },
    deleteCookie(name) {
      const cookie = serializeCookie(name, '', { maxAge: 0 });
      responseCookies.push(cookie);
    },
    getSession: async () => {
      // Session implementation
      return {
        id: 'session-id',
        data: {},
        get: () => undefined,
        set: () => {},
        delete: () => {},
        clear: () => {},
      };
    },
    platform,
    env: process.env as Record<string, string | undefined>,
  };
}

function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.maxAge) {
    cookie += `; Max-Age=${options.maxAge}`;
  }
  if (options.expires) {
    cookie += `; Expires=${options.expires.toUTCString()}`;
  }
  if (options.path) {
    cookie += `; Path=${options.path}`;
  }
  if (options.domain) {
    cookie += `; Domain=${options.domain}`;
  }
  if (options.secure) {
    cookie += '; Secure';
  }
  if (options.httpOnly) {
    cookie += '; HttpOnly';
  }
  if (options.sameSite) {
    cookie += `; SameSite=${options.sameSite}`;
  }

  return cookie;
}
