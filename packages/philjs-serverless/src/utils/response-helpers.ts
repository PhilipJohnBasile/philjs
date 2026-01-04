/**
 * PhilJS Serverless Response Helpers
 *
 * Convenient functions for creating HTTP responses.
 */

/**
 * Common content types
 */
export const ContentType = {
  JSON: 'application/json',
  HTML: 'text/html; charset=utf-8',
  TEXT: 'text/plain; charset=utf-8',
  XML: 'application/xml',
  FORM: 'application/x-www-form-urlencoded',
  MULTIPART: 'multipart/form-data',
  OCTET_STREAM: 'application/octet-stream',
  CSS: 'text/css; charset=utf-8',
  JS: 'application/javascript; charset=utf-8',
  SVG: 'image/svg+xml',
} as const;

/**
 * JSON response options
 */
export interface JsonResponseOptions {
  /** HTTP status code */
  status?: number;
  /** Response headers */
  headers?: HeadersInit;
  /** Pretty print JSON */
  pretty?: boolean;
}

/**
 * Create a JSON response
 *
 * @example
 * ```typescript
 * // Simple JSON response
 * return json({ message: 'Hello, World!' });
 *
 * // With status code
 * return json({ id: 1, name: 'User' }, 201);
 *
 * // With options
 * return json(data, { status: 200, headers: { 'X-Custom': 'value' } });
 * ```
 */
export function json(
  data: unknown,
  statusOrOptions?: number | JsonResponseOptions
): Response {
  let status = 200;
  let headers: HeadersInit = {};
  let pretty = false;

  if (typeof statusOrOptions === 'number') {
    status = statusOrOptions;
  } else if (statusOrOptions) {
    status = statusOrOptions.status ?? 200;
    headers = statusOrOptions.headers ?? {};
    pretty = statusOrOptions.pretty ?? false;
  }

  const body = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);

  return new Response(body, {
    status,
    headers: {
      'Content-Type': ContentType.JSON,
      ...headers,
    },
  });
}

/**
 * HTML response options
 */
export interface HtmlResponseOptions {
  /** HTTP status code */
  status?: number;
  /** Response headers */
  headers?: HeadersInit;
}

/**
 * Create an HTML response
 *
 * @example
 * ```typescript
 * // Simple HTML response
 * return html('<h1>Hello, World!</h1>');
 *
 * // With status code
 * return html('<h1>Not Found</h1>', 404);
 *
 * // With options
 * return html(content, { status: 200, headers: { 'X-Custom': 'value' } });
 * ```
 */
export function html(
  content: string,
  statusOrOptions?: number | HtmlResponseOptions
): Response {
  let status = 200;
  let headers: HeadersInit = {};

  if (typeof statusOrOptions === 'number') {
    status = statusOrOptions;
  } else if (statusOrOptions) {
    status = statusOrOptions.status ?? 200;
    headers = statusOrOptions.headers ?? {};
  }

  return new Response(content, {
    status,
    headers: {
      'Content-Type': ContentType.HTML,
      ...headers,
    },
  });
}

/**
 * Create a text response
 *
 * @example
 * ```typescript
 * return text('Hello, World!');
 * return text('Not Found', 404);
 * ```
 */
export function text(
  content: string,
  statusOrOptions?: number | HtmlResponseOptions
): Response {
  let status = 200;
  let headers: HeadersInit = {};

  if (typeof statusOrOptions === 'number') {
    status = statusOrOptions;
  } else if (statusOrOptions) {
    status = statusOrOptions.status ?? 200;
    headers = statusOrOptions.headers ?? {};
  }

  return new Response(content, {
    status,
    headers: {
      'Content-Type': ContentType.TEXT,
      ...headers,
    },
  });
}

/**
 * Redirect options
 */
export interface RedirectOptions {
  /** HTTP status code (301, 302, 303, 307, 308) */
  status?: 301 | 302 | 303 | 307 | 308;
  /** Response headers */
  headers?: HeadersInit;
}

/**
 * Create a redirect response
 *
 * @example
 * ```typescript
 * // Temporary redirect (302)
 * return redirect('/new-location');
 *
 * // Permanent redirect (301)
 * return redirect('/new-location', 301);
 *
 * // With options
 * return redirect('/new-location', { status: 307 });
 * ```
 */
export function redirect(
  url: string,
  statusOrOptions?: number | RedirectOptions
): Response {
  let status = 302;
  let headers: HeadersInit = {};

  if (typeof statusOrOptions === 'number') {
    status = statusOrOptions;
  } else if (statusOrOptions) {
    status = statusOrOptions.status ?? 302;
    headers = statusOrOptions.headers ?? {};
  }

  return new Response(null, {
    status,
    headers: {
      Location: url,
      ...headers,
    },
  });
}

/**
 * Create a 204 No Content response
 *
 * @example
 * ```typescript
 * return noContent();
 * return noContent({ 'X-Custom': 'value' });
 * ```
 */
export function noContent(headers?: HeadersInit): Response {
  const init: ResponseInit = { status: 204 };
  if (headers !== undefined) {
    init.headers = headers;
  }
  return new Response(null, init);
}

/**
 * Create a 201 Created response with optional body
 *
 * @example
 * ```typescript
 * return created({ id: 1, name: 'New Resource' });
 * return created(resource, '/resources/1');
 * ```
 */
export function created(
  data?: unknown,
  locationOrOptions?: string | { location?: string; headers?: HeadersInit }
): Response {
  let location: string | undefined;
  let headers: HeadersInit = {};

  if (typeof locationOrOptions === 'string') {
    location = locationOrOptions;
  } else if (locationOrOptions) {
    location = locationOrOptions.location;
    headers = locationOrOptions.headers ?? {};
  }

  const responseHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  if (location) {
    responseHeaders['Location'] = location;
  }

  if (data !== undefined) {
    responseHeaders['Content-Type'] = ContentType.JSON;
    return new Response(JSON.stringify(data), {
      status: 201,
      headers: responseHeaders,
    });
  }

  return new Response(null, {
    status: 201,
    headers: responseHeaders,
  });
}

/**
 * Create an error response
 *
 * @example
 * ```typescript
 * // Bad Request
 * return error('Invalid input', 400);
 *
 * // Internal Server Error
 * return error('Something went wrong');
 *
 * // With additional details
 * return error({ message: 'Validation failed', errors: [...] }, 422);
 * ```
 */
export function error(
  messageOrData: string | { message: string; [key: string]: unknown },
  status = 500,
  headers?: HeadersInit
): Response {
  const data = typeof messageOrData === 'string' ? { error: messageOrData } : messageOrData;

  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': ContentType.JSON,
      ...headers,
    },
  });
}

/**
 * Create a 400 Bad Request response
 */
export function badRequest(
  messageOrData: string | { message: string; [key: string]: unknown } = 'Bad Request'
): Response {
  return error(messageOrData, 400);
}

/**
 * Create a 401 Unauthorized response
 */
export function unauthorized(
  messageOrData: string | { message: string; [key: string]: unknown } = 'Unauthorized'
): Response {
  return error(messageOrData, 401);
}

/**
 * Create a 403 Forbidden response
 */
export function forbidden(
  messageOrData: string | { message: string; [key: string]: unknown } = 'Forbidden'
): Response {
  return error(messageOrData, 403);
}

/**
 * Create a 404 Not Found response
 */
export function notFound(
  messageOrData: string | { message: string; [key: string]: unknown } = 'Not Found'
): Response {
  return error(messageOrData, 404);
}

/**
 * Create a 422 Unprocessable Entity response
 */
export function unprocessable(
  messageOrData: string | { message: string; [key: string]: unknown } = 'Unprocessable Entity'
): Response {
  return error(messageOrData, 422);
}

/**
 * Create a 429 Too Many Requests response
 */
export function tooManyRequests(
  messageOrData: string | { message: string; [key: string]: unknown } = 'Too Many Requests',
  retryAfter?: number
): Response {
  const headers: HeadersInit = {};
  if (retryAfter !== undefined) {
    headers['Retry-After'] = retryAfter.toString();
  }
  return error(messageOrData, 429, headers);
}

/**
 * Create a 500 Internal Server Error response
 */
export function serverError(
  messageOrData: string | { message: string; [key: string]: unknown } = 'Internal Server Error'
): Response {
  return error(messageOrData, 500);
}

/**
 * Create a 503 Service Unavailable response
 */
export function serviceUnavailable(
  messageOrData: string | { message: string; [key: string]: unknown } = 'Service Unavailable',
  retryAfter?: number
): Response {
  const headers: HeadersInit = {};
  if (retryAfter !== undefined) {
    headers['Retry-After'] = retryAfter.toString();
  }
  return error(messageOrData, 503, headers);
}

/**
 * Create a file/binary response
 *
 * @example
 * ```typescript
 * return file(pdfBuffer, 'application/pdf', 'document.pdf');
 * ```
 */
export function file(
  data: ArrayBuffer | ReadableStream,
  contentType: string,
  filename?: string,
  options?: { status?: number; headers?: HeadersInit }
): Response {
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    ...(options?.headers as Record<string, string>),
  };

  if (filename) {
    headers['Content-Disposition'] = `attachment; filename="${filename}"`;
  }

  return new Response(data, {
    status: options?.status ?? 200,
    headers,
  });
}

/**
 * Create a streaming response
 *
 * @example
 * ```typescript
 * return stream(readableStream, 'text/event-stream');
 * ```
 */
export function stream(
  body: ReadableStream,
  contentType = 'application/octet-stream',
  options?: { status?: number; headers?: HeadersInit }
): Response {
  return new Response(body, {
    status: options?.status ?? 200,
    headers: {
      'Content-Type': contentType,
      'Transfer-Encoding': 'chunked',
      ...(options?.headers as Record<string, string>),
    },
  });
}
