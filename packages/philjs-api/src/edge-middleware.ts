/**
 * PhilJS Edge Middleware System
 *
 * Next.js-style edge middleware for PhilJS applications.
 * Works with Cloudflare Workers, Vercel Edge, Deno Deploy, and other edge runtimes.
 *
 * Features:
 * - Request/response rewriting at edge
 * - Middleware chaining
 * - Edge runtime compatible
 * - URL rewrites and redirects
 * - Header manipulation
 * - Geolocation support
 * - A/B testing at edge
 * - Edge caching
 */

// ============================================================================
// Types
// ============================================================================

export interface EdgeRequest {
  /** Request URL */
  url: URL;
  /** HTTP method */
  method: string;
  /** Request headers */
  headers: Headers;
  /** Original Request object */
  raw: Request;
  /** Geolocation data (if available) */
  geo?: GeolocationData;
  /** Client IP address */
  ip?: string;
  /** User agent */
  userAgent?: string;
  /** Cookies */
  cookies: Map<string, string>;
}

export interface EdgeContext {
  /** The request */
  request: EdgeRequest;
  /** Next middleware in chain */
  next: () => Promise<Response>;
  /** Rewrite URL without redirect */
  rewrite: (url: string | URL) => void;
  /** Redirect to URL */
  redirect: (url: string | URL, status?: 301 | 302 | 303 | 307 | 308) => Response;
  /** Get/set cookies */
  cookies: CookieStore;
  /** Geolocation data */
  geo: GeolocationData;
  /** Platform-specific context */
  platform?: unknown;
}

export interface CookieStore {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: CookieOptions): void;
  delete(name: string): void;
  has(name: string): boolean;
  getAll(): Map<string, string>;
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

export interface GeolocationData {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  continent?: string;
  postalCode?: string;
}

export type EdgeMiddleware = (context: EdgeContext) => Response | Promise<Response> | void | Promise<void>;

export interface EdgeMiddlewareConfig {
  /** Middleware function */
  middleware: EdgeMiddleware;
  /** Matcher patterns (supports glob patterns) */
  matcher?: string | string[];
  /** Runtime (optional, for optimization hints) */
  runtime?: 'edge' | 'nodejs';
}

const removedHeadersKey = Symbol('removedHeaders');

function getRemovedHeaders(context: EdgeContext): Set<string> {
  const stored = (context as any)[removedHeadersKey] as Set<string> | undefined;
  if (stored) {
    return stored;
  }
  const created = new Set<string>();
  (context as any)[removedHeadersKey] = created;
  return created;
}

// ============================================================================
// Cookie Store Implementation
// ============================================================================

class CookieStoreImpl implements CookieStore {
  private cookies: Map<string, string>;
  private setCookies: Array<{ name: string; value: string; options?: CookieOptions }> = [];

  constructor(cookieHeader?: string | null) {
    this.cookies = new Map();
    if (cookieHeader) {
      cookieHeader.split(';').forEach((cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          this.cookies.set(name, decodeURIComponent(value));
        }
      });
    }
  }

  get(name: string): string | undefined {
    return this.cookies.get(name);
  }

  set(name: string, value: string, options?: CookieOptions): void {
    this.cookies.set(name, value);
    if (options !== undefined) {
      this.setCookies.push({ name, value, options });
    } else {
      this.setCookies.push({ name, value });
    }
  }

  delete(name: string): void {
    this.cookies.delete(name);
    this.setCookies.push({ name, value: '', options: { maxAge: 0 } });
  }

  has(name: string): boolean {
    return this.cookies.has(name);
  }

  getAll(): Map<string, string> {
    return new Map(this.cookies);
  }

  getSetCookieHeaders(): string[] {
    return this.setCookies.map(({ name, value, options }) =>
      serializeCookie(name, value, options)
    );
  }
}

// ============================================================================
// Edge Context Implementation
// ============================================================================

function createEdgeContext(
  request: Request,
  geo: GeolocationData,
  platform?: unknown,
  fetcher?: (request: Request) => Promise<Response> | Response
): EdgeContext & { executeNext: (middleware: EdgeMiddleware[]) => Promise<Response> } {
  const url = new URL(request.url);
  const cookieStore = new CookieStoreImpl(request.headers.get('cookie'));
  const effectiveFetch = fetcher ?? fetch;

  let rewriteUrl: URL | null = null;
  let redirectResponse: Response | null = null;

  const ip = extractIP(request);
  const userAgent = request.headers.get('user-agent') || undefined;
  const edgeRequest: EdgeRequest = {
    url,
    method: request.method,
    headers: request.headers,
    raw: request,
    geo,
    cookies: cookieStore.getAll(),
  };
  if (ip !== undefined) {
    edgeRequest.ip = ip;
  }
  if (userAgent !== undefined) {
    edgeRequest.userAgent = userAgent;
  }

  const context: EdgeContext & { executeNext: (middleware: EdgeMiddleware[]) => Promise<Response> } = {
    request: edgeRequest,
    next: async () => {
      // This will be overridden during execution
      return new Response(null, { status: 500 });
    },
    rewrite(url: string | URL) {
      rewriteUrl = typeof url === 'string' ? new URL(url, edgeRequest.url) : url;
    },
    redirect(url: string | URL, status = 302) {
      const location = typeof url === 'string' ? url : url.toString();
      redirectResponse = new Response(null, {
        status,
        headers: { Location: location },
      });
      return redirectResponse;
    },
    cookies: cookieStore,
    geo,
    platform,
    async executeNext(middleware: EdgeMiddleware[]): Promise<Response> {
      let index = 0;

      const dispatch = async (): Promise<Response> => {
        // Check for redirect
        if (redirectResponse) {
          return redirectResponse;
        }

        // Execute next middleware
        if (index < middleware.length) {
          const mw = middleware[index++];
          const oldNext = context.next;
          context.next = dispatch;

          const result = await mw!(context);
          context.next = oldNext;

          // If middleware returned a response, use it
          if (result instanceof Response) {
            return result;
          }

          // If redirect was set, return it
          if (redirectResponse) {
            return redirectResponse;
          }

          // Continue to next middleware
          return dispatch();
        }

        // All middleware executed, handle rewrite or pass through
        if (rewriteUrl) {
          const rewriteRequest = new Request(rewriteUrl, request);
          return await effectiveFetch(rewriteRequest);
        }

        // Default: fetch the original request
        return await effectiveFetch(request);
      };

      const response = await dispatch();

      // Apply set-cookie headers
      const setCookies = cookieStore.getSetCookieHeaders();
      if (setCookies.length > 0) {
        const newHeaders = new Headers(response.headers);
        setCookies.forEach((cookie) => newHeaders.append('Set-Cookie', cookie));
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      }

      return response;
    },
  };

  return context;
}

// ============================================================================
// Middleware Execution
// ============================================================================

/**
 * Execute edge middleware
 */
export async function executeEdgeMiddleware(
  request: Request,
  middlewares: EdgeMiddleware | EdgeMiddleware[],
  options: {
    geo?: GeolocationData;
    platform?: unknown;
    fetch?: (request: Request) => Promise<Response> | Response;
  } = {}
): Promise<Response> {
  const middlewareArray = Array.isArray(middlewares) ? middlewares : [middlewares];
  const geo = options.geo || await detectGeolocation(request);
  const context = createEdgeContext(request, geo, options.platform, options.fetch);

  return context.executeNext(middlewareArray);
}

/**
 * Compose multiple middlewares into a single middleware
 */
export function composeEdgeMiddleware(...middlewares: EdgeMiddleware[]): EdgeMiddleware {
  return async (context) => {
    const baseNext = context.next;
    let index = -1;

    const dispatch = async (i: number): Promise<Response> => {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      index = i;

      const middleware = middlewares[i];
      if (!middleware) {
        return baseNext();
      }

      const oldNext = context.next;
      context.next = () => dispatch(i + 1);

      try {
        const result = await middleware(context);
        return result instanceof Response ? result : await dispatch(i + 1);
      } finally {
        context.next = oldNext;
      }
    };

    return dispatch(0);
  };
}

/**
 * Create a middleware config
 */
export function defineEdgeMiddleware(config: EdgeMiddlewareConfig): EdgeMiddlewareConfig {
  return config;
}

/**
 * Check if request matches middleware matcher
 */
export function matchesPattern(url: URL, pattern: string | string[]): boolean {
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  const pathname = url.pathname;

  for (const p of patterns) {
    // Simple glob matching
    const regex = new RegExp(
      '^' +
        p
          .replace(/\./g, '\\.')
          .replace(/\*/g, '.*')
          .replace(/\?/g, '.') +
        '$'
    );

    if (regex.test(pathname)) {
      return true;
    }
  }

  return false;
}

// ============================================================================
// URL Rewriting & Redirects
// ============================================================================

/**
 * Rewrite middleware - rewrite URLs without redirecting
 */
export function rewriteMiddleware(rules: Record<string, string>): EdgeMiddleware {
  return (context) => {
    const pathname = context.request.url.pathname;

    for (const [pattern, destination] of Object.entries(rules)) {
      const regex = new RegExp(
        '^' + pattern.replace(/\*/g, '(.*)').replace(/:\w+/g, '([^/]+)') + '$'
      );
      const match = pathname.match(regex);

      if (match) {
        let rewritePath = destination;
        match.slice(1).forEach((group, i) => {
          rewritePath = rewritePath.replace(`$${i + 1}`, group);
        });

        const newUrl = new URL(rewritePath, context.request.url);
        context.rewrite(newUrl);
        return;
      }
    }
  };
}

/**
 * Redirect middleware - redirect based on patterns
 */
export function redirectMiddleware(
  rules: Record<string, string | { destination: string; permanent?: boolean }>
): EdgeMiddleware {
  return (context) => {
    const pathname = context.request.url.pathname;

    for (const [pattern, config] of Object.entries(rules)) {
      const regex = new RegExp(
        '^' + pattern.replace(/\*/g, '(.*)').replace(/:\w+/g, '([^/]+)') + '$'
      );
      const match = pathname.match(regex);

      if (match) {
        const destination = typeof config === 'string' ? config : config.destination;
        const permanent = typeof config === 'object' ? config.permanent : false;

        let redirectPath = destination;
        match.slice(1).forEach((group, i) => {
          redirectPath = redirectPath.replace(`$${i + 1}`, group);
        });

        return context.redirect(redirectPath, permanent ? 301 : 302);
      }
    }
  };
}

// ============================================================================
// Header Manipulation
// ============================================================================

/**
 * Add headers middleware
 */
export function addHeadersMiddleware(headers: Record<string, string>): EdgeMiddleware {
  return async (context) => {
    const response = await context.next();
    const newHeaders = new Headers(response.headers);
    const removed = getRemovedHeaders(context);

    for (const [key, value] of Object.entries(headers)) {
      if (removed.has(key.toLowerCase())) continue;
      newHeaders.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}

/**
 * Remove headers middleware
 */
export function removeHeadersMiddleware(headers: string[]): EdgeMiddleware {
  return async (context) => {
    const removed = getRemovedHeaders(context);
    headers.forEach((header) => removed.add(header.toLowerCase()));

    const response = await context.next();
    const newHeaders = new Headers(response.headers);

    headers.forEach((header) => newHeaders.delete(header));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(options: {
  csp?: string;
  hsts?: boolean;
  nosniff?: boolean;
  xssProtection?: boolean;
  frameOptions?: 'DENY' | 'SAMEORIGIN';
} = {}): EdgeMiddleware {
  return async (context) => {
    const response = await context.next();
    const headers = new Headers(response.headers);

    if (options.csp) {
      headers.set('Content-Security-Policy', options.csp);
    }

    if (options.hsts !== false) {
      headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    if (options.nosniff !== false) {
      headers.set('X-Content-Type-Options', 'nosniff');
    }

    if (options.xssProtection !== false) {
      headers.set('X-XSS-Protection', '1; mode=block');
    }

    if (options.frameOptions) {
      headers.set('X-Frame-Options', options.frameOptions);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract IP address from request
 */
function extractIP(request: Request): string | undefined {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]!.trim() ||
    undefined
  );
}

/**
 * Detect geolocation from request
 */
async function detectGeolocation(request: Request): Promise<GeolocationData> {
  // Try Cloudflare Workers
  const cf = (request as any).cf;
  if (cf) {
    return {
      country: cf.country,
      region: cf.region,
      city: cf.city,
      latitude: cf.latitude,
      longitude: cf.longitude,
      timezone: cf.timezone,
      continent: cf.continent,
      postalCode: cf.postalCode,
    };
  }

  // Try Vercel Edge
  if (request.headers.has('x-vercel-ip-country')) {
    const country = request.headers.get('x-vercel-ip-country') || undefined;
    const region = request.headers.get('x-vercel-ip-country-region') || undefined;
    const city = request.headers.get('x-vercel-ip-city') || undefined;
    const geo: GeolocationData = {
      latitude: parseFloat(request.headers.get('x-vercel-ip-latitude') || ''),
      longitude: parseFloat(request.headers.get('x-vercel-ip-longitude') || ''),
    };
    if (country !== undefined) {
      geo.country = country;
    }
    if (region !== undefined) {
      geo.region = region;
    }
    if (city !== undefined) {
      geo.city = city;
    }
    return geo;
  }

  // Try generic Cloudflare proxy
  if (request.headers.has('cf-ipcountry')) {
    const country = request.headers.get('cf-ipcountry') || undefined;
    const geo: GeolocationData = {};
    if (country !== undefined) {
      geo.country = country;
    }
    return geo;
  }

  return {};
}

/**
 * Serialize cookie
 */
function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.maxAge !== undefined) {
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
