/**
 * PhilJS Cookie Utilities
 *
 * Typed cookie handling with signing support.
 */

import { createHmac, timingSafeEqual } from 'crypto';

export interface CookieOptions {
  /** Max age in seconds */
  maxAge?: number;
  /** Expiration date */
  expires?: Date;
  /** Cookie path */
  path?: string;
  /** Cookie domain */
  domain?: string;
  /** HTTPS only */
  secure?: boolean;
  /** HTTP only (no JS access) */
  httpOnly?: boolean;
  /** Same-site policy */
  sameSite?: 'strict' | 'lax' | 'none';
}

export interface CookieSerializeOptions extends CookieOptions {
  /** Encode function */
  encode?: (value: string) => string;
}

/**
 * Get a cookie value from request headers
 */
export function getCookie(request: Request, name: string): string | undefined {
  const cookies = parseCookies(request.headers.get('cookie') || '');
  return cookies[name];
}

/**
 * Set a cookie (returns Set-Cookie header value)
 */
export function setCookie(
  name: string,
  value: string,
  options: CookieSerializeOptions = {}
): string {
  return serializeCookie(name, value, options);
}

/**
 * Delete a cookie (returns Set-Cookie header value)
 */
export function deleteCookie(name: string, options: CookieOptions = {}): string {
  return serializeCookie(name, '', {
    ...options,
    maxAge: 0,
    expires: new Date(0),
  });
}

/**
 * Parse cookies from Cookie header
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

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
 * Serialize a cookie
 */
export function serializeCookie(
  name: string,
  value: string,
  options: CookieSerializeOptions = {}
): string {
  const encode = options.encode || encodeURIComponent;

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
 * Create a signed cookie value
 */
export function createSignedCookie(
  name: string,
  value: string,
  secret: string
): string {
  const signature = sign(value, secret);
  return `${value}.${signature}`;
}

/**
 * Verify and extract signed cookie value
 */
export function verifySignedCookie(
  signedValue: string,
  secret: string
): string | null {
  const [value, signature] = signedValue.split('.');

  if (!value || !signature) {
    return null;
  }

  const expectedSignature = sign(value, secret);

  // Use timing-safe comparison
  if (
    signature.length === expectedSignature.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return value;
  }

  return null;
}

/**
 * Sign a value with HMAC-SHA256
 */
function sign(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

/**
 * Create a cookie jar for managing multiple cookies
 */
export function createCookieJar(request: Request) {
  const cookies = parseCookies(request.headers.get('cookie') || '');
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
      return name in cookies;
    },

    getAll(): Record<string, string> {
      return { ...cookies };
    },

    getSetCookieHeaders(): string[] {
      return setCookies;
    },

    applyToResponse(response: Response): Response {
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
