/**
 * PhilJS Cookie Utilities
 *
 * Typed cookie handling with signing support.
 */
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
export declare function getCookie(request: Request, name: string): string | undefined;
/**
 * Set a cookie (returns Set-Cookie header value)
 */
export declare function setCookie(name: string, value: string, options?: CookieSerializeOptions): string;
/**
 * Delete a cookie (returns Set-Cookie header value)
 */
export declare function deleteCookie(name: string, options?: CookieOptions): string;
/**
 * Parse cookies from Cookie header
 */
export declare function parseCookies(cookieHeader: string): Record<string, string>;
/**
 * Serialize a cookie
 */
export declare function serializeCookie(name: string, value: string, options?: CookieSerializeOptions): string;
/**
 * Create a signed cookie value
 */
export declare function createSignedCookie(name: string, value: string, secret: string): string;
/**
 * Verify and extract signed cookie value
 */
export declare function verifySignedCookie(signedValue: string, secret: string): string | null;
/**
 * Create a cookie jar for managing multiple cookies
 */
export declare function createCookieJar(request: Request): {
    get(name: string): string | undefined;
    set(name: string, value: string, options?: CookieOptions): void;
    delete(name: string, options?: CookieOptions): void;
    has(name: string): boolean;
    getAll(): Record<string, string>;
    getSetCookieHeaders(): string[];
    applyToResponse(response: Response): Response;
};
//# sourceMappingURL=cookies.d.ts.map