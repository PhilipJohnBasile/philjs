/**
 * PhilJS Serverless Cookie Utilities
 *
 * Cookie handling for serverless functions.
 */

import type { CookieOptions, ServerlessContext } from '../types.js';

/**
 * Extended cookie options for serialization
 */
export interface CookieSerializeOptions extends CookieOptions {
  /** Encode function for cookie value */
  encode?: (value: string) => string;
}

/**
 * Parse cookies from a Cookie header string
 *
 * @example
 * ```typescript
 * const cookies = parseCookies('session=abc123; theme=dark');
 * // { session: 'abc123', theme: 'dark' }
 * ```
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = Object.create(null);

  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) {
      const value = rest.join('=');
      try {
        cookies[name] = decodeURIComponent(value);
      } catch {
        cookies[name] = value;
      }
    }
  });

  return cookies;
}

/**
 * Serialize a cookie to a Set-Cookie header value
 *
 * @example
 * ```typescript
 * const cookie = serializeCookie('session', 'abc123', {
 *   httpOnly: true,
 *   secure: true,
 *   maxAge: 3600,
 * });
 * ```
 */
export function serializeCookie(
  name: string,
  value: string,
  options: CookieSerializeOptions = {}
): string {
  const encode = options.encode ?? encodeURIComponent;

  let cookie = `${encode(name)}=${encode(value)}`;

  if (options.maxAge !== undefined) {
    cookie += `; Max-Age=${Math.floor(options.maxAge)}`;
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
    const sameSite = options.sameSite.toLowerCase();
    cookie += `; SameSite=${sameSite.charAt(0).toUpperCase() + sameSite.slice(1)}`;
  }

  return cookie;
}

/**
 * Get a cookie value from a request
 *
 * @example
 * ```typescript
 * const session = getCookie(request, 'session');
 * ```
 */
export function getCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = parseCookies(cookieHeader);
  return cookies[name];
}

/**
 * Get all cookies from a request
 */
export function getCookies(request: Request): Record<string, string> {
  const cookieHeader = request.headers.get('cookie') || '';
  return parseCookies(cookieHeader);
}

/**
 * Create a Set-Cookie header value
 *
 * @example
 * ```typescript
 * const setCookieHeader = setCookie('session', 'abc123', {
 *   httpOnly: true,
 *   secure: true,
 * });
 * ```
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {}
): string {
  return serializeCookie(name, value, options);
}

/**
 * Create a Set-Cookie header value that deletes a cookie
 *
 * @example
 * ```typescript
 * const deleteCookieHeader = deleteCookie('session');
 * ```
 */
export function deleteCookie(name: string, options: CookieOptions = {}): string {
  return serializeCookie(name, '', {
    ...options,
    maxAge: 0,
    expires: new Date(0),
  });
}

/**
 * Cookie jar for managing multiple cookies
 */
export interface CookieJar {
  /** Get a cookie value */
  get(name: string): string | undefined;
  /** Set a cookie */
  set(name: string, value: string, options?: CookieOptions): void;
  /** Delete a cookie */
  delete(name: string, options?: CookieOptions): void;
  /** Check if a cookie exists */
  has(name: string): boolean;
  /** Get all cookies */
  getAll(): Record<string, string>;
  /** Get all Set-Cookie headers */
  getSetCookieHeaders(): string[];
  /** Apply cookies to a response */
  applyToResponse(response: Response): Response;
}

/**
 * Create a cookie jar for managing cookies in a request/response cycle
 *
 * @example
 * ```typescript
 * const jar = createCookieJar(request);
 *
 * // Read cookies
 * const session = jar.get('session');
 *
 * // Set a cookie
 * jar.set('user', 'john', { httpOnly: true });
 *
 * // Delete a cookie
 * jar.delete('oldCookie');
 *
 * // Apply to response
 * return jar.applyToResponse(new Response('OK'));
 * ```
 */
export function createCookieJar(request: Request): CookieJar {
  const cookies = getCookies(request);
  const setCookies: string[] = [];

  return {
    get(name: string): string | undefined {
      return cookies[name];
    },

    set(name: string, value: string, options?: CookieOptions): void {
      cookies[name] = value;
      setCookies.push(serializeCookie(name, value, options));
    },

    delete(name: string, options?: CookieOptions): void {
      delete cookies[name];
      setCookies.push(deleteCookie(name, options));
    },

    has(name: string): boolean {
      return Object.hasOwn(cookies, name);
    },

    getAll(): Record<string, string> {
      return { ...cookies };
    },

    getSetCookieHeaders(): string[] {
      return [...setCookies];
    },

    applyToResponse(response: Response): Response {
      if (setCookies.length === 0) {
        return response;
      }

      const headers = new Headers(response.headers);
      setCookies.forEach((cookie) => {
        headers.append('Set-Cookie', cookie);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    },
  };
}

/**
 * Create a signed cookie value using HMAC
 *
 * @example
 * ```typescript
 * const signedValue = await signCookie('session', 'abc123', 'secret-key');
 * ```
 */
export async function signCookie(
  name: string,
  value: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(value)
  );

  const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${value}.${signatureBase64}`;
}

/**
 * Verify and extract a signed cookie value
 *
 * @example
 * ```typescript
 * const value = await verifyCookie('session', signedValue, 'secret-key');
 * if (value) {
 *   // Cookie is valid
 * }
 * ```
 */
export async function verifyCookie(
  name: string,
  signedValue: string,
  secret: string
): Promise<string | null> {
  const [value, signature] = signedValue.split('.');

  if (!value || !signature) {
    return null;
  }

  try {
    const expectedSignedValue = await signCookie(name, value, secret);
    const [, expectedSignature] = expectedSignedValue.split('.');

    // Timing-safe comparison
    if (signature.length !== expectedSignature!.length) {
      return null;
    }

    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature!.charCodeAt(i);
    }

    if (result === 0) {
      return value;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Cookie helper methods for ServerlessContext
 */
export function createCookieHelpers(ctx: ServerlessContext): {
  cookies: CookieJar;
  signCookie: (name: string, value: string, secret: string) => Promise<string>;
  verifyCookie: (name: string, signedValue: string, secret: string) => Promise<string | null>;
} {
  return {
    cookies: createCookieJar(ctx.request),
    signCookie,
    verifyCookie,
  };
}
