/**
 * PhilJS Cookie Utilities
 *
 * Typed cookie handling with signing support.
 */
import { createHmac, timingSafeEqual } from 'crypto';
/**
 * Get a cookie value from request headers
 */
export function getCookie(request, name) {
    const cookies = parseCookies(request.headers.get('cookie') || '');
    return cookies[name];
}
/**
 * Set a cookie (returns Set-Cookie header value)
 */
export function setCookie(name, value, options = {}) {
    return serializeCookie(name, value, options);
}
/**
 * Delete a cookie (returns Set-Cookie header value)
 */
export function deleteCookie(name, options = {}) {
    return serializeCookie(name, '', {
        ...options,
        maxAge: 0,
        expires: new Date(0),
    });
}
/**
 * Parse cookies from Cookie header
 */
export function parseCookies(cookieHeader) {
    const cookies = Object.create(null);
    if (!cookieHeader)
        return cookies;
    cookieHeader.split(';').forEach((cookie) => {
        const [name, ...rest] = cookie.trim().split('=');
        if (name) {
            const value = rest.join('=');
            try {
                cookies[name] = decodeURIComponent(value);
            }
            catch {
                cookies[name] = value;
            }
        }
    });
    return cookies;
}
/**
 * Serialize a cookie
 */
export function serializeCookie(name, value, options = {}) {
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
export function createSignedCookie(name, value, secret) {
    const signature = sign(value, secret);
    return `${value}.${signature}`;
}
/**
 * Verify and extract signed cookie value
 */
export function verifySignedCookie(signedValue, secret) {
    const [value, signature] = signedValue.split('.');
    if (!value || !signature) {
        return null;
    }
    const expectedSignature = sign(value, secret);
    // Use timing-safe comparison
    if (signature.length === expectedSignature.length &&
        timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return value;
    }
    return null;
}
/**
 * Sign a value with HMAC-SHA256
 */
function sign(value, secret) {
    return createHmac('sha256', secret).update(value).digest('base64url');
}
/**
 * Create a cookie jar for managing multiple cookies
 */
export function createCookieJar(request) {
    const cookies = parseCookies(request.headers.get('cookie') || '');
    const setCookies = [];
    return {
        get(name) {
            return cookies[name];
        },
        set(name, value, options) {
            cookies[name] = value;
            setCookies.push(serializeCookie(name, value, options));
        },
        delete(name, options) {
            delete cookies[name];
            setCookies.push(deleteCookie(name, options));
        },
        has(name) {
            return Object.hasOwn(cookies, name);
        },
        getAll() {
            return { ...cookies };
        },
        getSetCookieHeaders() {
            return setCookies;
        },
        applyToResponse(response) {
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
//# sourceMappingURL=cookies.js.map