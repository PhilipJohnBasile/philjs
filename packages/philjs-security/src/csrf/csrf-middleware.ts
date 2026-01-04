/**
 * PhilJS Security - CSRF Middleware
 *
 * Implements the double-submit cookie pattern for CSRF protection.
 */

import type { CSRFConfig, SecurityMiddleware } from '../types.js';
import { generateCSRFToken, verifyTokenPair } from './csrf-token.js';

/**
 * Default CSRF configuration
 */
const defaultConfig: Required<CSRFConfig> = {
  secret: '',
  cookieName: '_csrf',
  headerName: 'X-CSRF-Token',
  fieldName: '_csrf',
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  cookie: {
    path: '/',
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
  },
  tokenLength: 32,
};

/**
 * Parse cookies from request
 */
function parseCookies(request: Request): Map<string, string> {
  const cookies = new Map<string, string>();
  const cookieHeader = request.headers.get('cookie');

  if (cookieHeader) {
    cookieHeader.split(';').forEach((cookie) => {
      const [name, ...valueParts] = cookie.trim().split('=');
      if (name) {
        cookies.set(name.trim(), valueParts.join('='));
      }
    });
  }

  return cookies;
}

/**
 * Serialize cookie for Set-Cookie header
 */
function serializeCookie(
  name: string,
  value: string,
  options: CSRFConfig['cookie'] = {}
): string {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options?.path) {
    cookie += `; Path=${options.path}`;
  }
  if (options?.domain) {
    cookie += `; Domain=${options.domain}`;
  }
  if (options?.secure) {
    cookie += '; Secure';
  }
  if (options?.httpOnly) {
    cookie += '; HttpOnly';
  }
  if (options?.sameSite) {
    cookie += `; SameSite=${options.sameSite}`;
  }
  if (options?.maxAge) {
    cookie += `; Max-Age=${options.maxAge}`;
  }

  return cookie;
}

/**
 * Get CSRF token from request (header or body)
 */
async function getTokenFromRequest(
  request: Request,
  headerName: string,
  fieldName: string
): Promise<string | null> {
  // Check header first
  const headerToken = request.headers.get(headerName);
  if (headerToken) {
    return headerToken;
  }

  // Check body for form submissions
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/x-www-form-urlencoded')) {
    try {
      const clonedRequest = request.clone();
      const body = await clonedRequest.text();
      const params = new URLSearchParams(body);
      return params.get(fieldName);
    } catch {
      return null;
    }
  }

  if (contentType.includes('application/json')) {
    try {
      const clonedRequest = request.clone();
      const body = await clonedRequest.json();
      return body?.[fieldName] || null;
    } catch {
      return null;
    }
  }

  if (contentType.includes('multipart/form-data')) {
    try {
      const clonedRequest = request.clone();
      const formData = await clonedRequest.formData();
      const value = formData.get(fieldName);
      return typeof value === 'string' ? value : null;
    } catch {
      return null;
    }
  }

  // Check query string as fallback
  const url = new URL(request.url);
  return url.searchParams.get(fieldName);
}

/**
 * Create CSRF protection middleware
 *
 * Implements the double-submit cookie pattern:
 * 1. Sets a CSRF token in a cookie
 * 2. Requires the same token in a header or form field
 * 3. Validates that both tokens match
 *
 * @param config - CSRF configuration
 * @returns Middleware function
 *
 * @example
 * ```typescript
 * const csrfMiddleware = csrf({
 *   secret: process.env.CSRF_SECRET,
 *   cookie: {
 *     secure: process.env.NODE_ENV === 'production',
 *   },
 * });
 *
 * // Apply to routes
 * app.use(csrfMiddleware);
 * ```
 */
export function csrf(config: CSRFConfig = {}): SecurityMiddleware {
  const mergedConfig = {
    ...defaultConfig,
    ...config,
    cookie: {
      ...defaultConfig.cookie,
      ...config.cookie,
    },
  };

  if (!mergedConfig.secret) {
    throw new Error('CSRF secret is required. Set the "secret" option.');
  }

  const {
    secret,
    cookieName,
    headerName,
    fieldName,
    ignoreMethods,
    cookie: cookieOptions,
    tokenLength,
  } = mergedConfig;

  return async (request: Request, next: () => Promise<Response>) => {
    const method = request.method.toUpperCase();
    const cookies = parseCookies(request);

    // For safe methods, just ensure a token exists in the cookie
    if (ignoreMethods.includes(method)) {
      const response = await next();

      // Set token cookie if not present
      if (!cookies.has(cookieName)) {
        const token = await generateCSRFToken(secret, tokenLength);
        const newHeaders = new Headers(response.headers);
        newHeaders.append('Set-Cookie', serializeCookie(cookieName, token, cookieOptions));

        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders,
        });
      }

      return response;
    }

    // For unsafe methods, validate the token
    const cookieToken = cookies.get(cookieName);
    const requestToken = await getTokenFromRequest(request, headerName, fieldName);

    if (!cookieToken || !requestToken) {
      return new Response(
        JSON.stringify({
          error: 'CSRF token missing',
          message: 'A CSRF token is required for this request',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const isValid = await verifyTokenPair(cookieToken, requestToken, secret);

    if (!isValid) {
      return new Response(
        JSON.stringify({
          error: 'CSRF token invalid',
          message: 'The CSRF token provided is invalid or expired',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Token is valid, proceed with request
    const response = await next();

    // Rotate token after successful state-changing request
    const newToken = await generateCSRFToken(secret, tokenLength);
    const newHeaders = new Headers(response.headers);
    newHeaders.append('Set-Cookie', serializeCookie(cookieName, newToken, cookieOptions));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}

/**
 * Get CSRF token for use in forms/headers
 *
 * Call this to get a token to include in your forms or fetch requests.
 *
 * @param request - The incoming request
 * @param config - CSRF configuration
 * @returns The CSRF token or null if not set
 *
 * @example
 * ```typescript
 * const token = getCSRFToken(request);
 * // Include in form: <input type="hidden" name="_csrf" value={token} />
 * // Or in header: fetch(url, { headers: { 'X-CSRF-Token': token } })
 * ```
 */
export function getCSRFToken(request: Request, config: CSRFConfig = {}): string | null {
  const cookieName = config.cookieName || defaultConfig.cookieName;
  const cookies = parseCookies(request);
  return cookies.get(cookieName) || null;
}

/**
 * Create a new CSRF token and return it
 *
 * Useful for generating tokens for initial page loads.
 *
 * @param secret - Secret key for token generation
 * @param length - Token length
 * @returns Generated token
 *
 * @example
 * ```typescript
 * const token = await createCSRFToken(process.env.CSRF_SECRET);
 * ```
 */
export async function createCSRFToken(secret: string, length?: number): Promise<string> {
  return generateCSRFToken(secret, length);
}

/**
 * Verify CSRF token from request
 *
 * Manual verification for custom implementations.
 *
 * @param request - The incoming request
 * @param secret - Secret key
 * @param config - CSRF configuration
 * @returns Whether the token is valid
 *
 * @example
 * ```typescript
 * const isValid = await verifyCSRFToken(request, process.env.CSRF_SECRET);
 * if (!isValid) {
 *   return new Response('Forbidden', { status: 403 });
 * }
 * ```
 */
export async function verifyCSRFToken(
  request: Request,
  secret: string,
  config: CSRFConfig = {}
): Promise<boolean> {
  const cookieName = config.cookieName || defaultConfig.cookieName;
  const headerName = config.headerName || defaultConfig.headerName;
  const fieldName = config.fieldName || defaultConfig.fieldName;

  const cookies = parseCookies(request);
  const cookieToken = cookies.get(cookieName);
  const requestToken = await getTokenFromRequest(request, headerName, fieldName);

  if (!cookieToken || !requestToken) {
    return false;
  }

  return verifyTokenPair(cookieToken, requestToken, secret);
}
