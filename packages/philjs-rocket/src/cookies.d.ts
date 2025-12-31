/**
 * PhilJS Rocket Cookies
 *
 * Cookie handling utilities for Rocket framework.
 * Provides typed cookie management with signing and encryption.
 */
/**
 * Cookie options
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
/**
 * Cookie representation
 */
export interface Cookie {
    /** Cookie name */
    name: string;
    /** Cookie value */
    value: string;
    /** Cookie options */
    options?: CookieOptions;
}
/**
 * Private cookie (encrypted)
 */
export interface PrivateCookie extends Cookie {
    /** Whether the cookie is encrypted */
    encrypted: true;
}
/**
 * Cookie jar for managing cookies
 */
export interface CookieJar {
    /** Get a cookie by name */
    get(name: string): Cookie | undefined;
    /** Get a private (encrypted) cookie */
    getPrivate(name: string): Cookie | undefined;
    /** Set a cookie */
    add(cookie: Cookie): void;
    /** Set a private (encrypted) cookie */
    addPrivate(cookie: Cookie): void;
    /** Remove a cookie */
    remove(name: string): void;
    /** Remove a private cookie */
    removePrivate(name: string): void;
    /** Get all cookies */
    getAll(): Cookie[];
    /** Get Set-Cookie headers */
    getSetCookieHeaders(): string[];
}
/**
 * Parse a cookie header string into cookies
 */
export declare function parseCookies(cookieHeader: string): Map<string, string>;
/**
 * Serialize a cookie to Set-Cookie header value
 */
export declare function serializeCookie(cookie: Cookie): string;
/**
 * Create a cookie jar
 */
export declare function createCookieJar(cookieHeader?: string): CookieJarImpl;
/**
 * Cookie jar implementation
 */
export declare class CookieJarImpl implements CookieJar {
    private cookies;
    private privateCookies;
    private setCookies;
    private secretKey?;
    constructor(cookieHeader?: string, secretKey?: string);
    /**
     * Set the secret key for private cookies
     */
    setSecretKey(key: string): void;
    /**
     * Get a cookie by name
     */
    get(name: string): Cookie | undefined;
    /**
     * Get a private (encrypted) cookie
     */
    getPrivate(name: string): Cookie | undefined;
    /**
     * Set a cookie
     */
    add(cookie: Cookie): void;
    /**
     * Set a private (encrypted) cookie
     */
    addPrivate(cookie: Cookie): void;
    /**
     * Remove a cookie
     */
    remove(name: string): void;
    /**
     * Remove a private cookie
     */
    removePrivate(name: string): void;
    /**
     * Get all cookies
     */
    getAll(): Cookie[];
    /**
     * Get Set-Cookie headers
     */
    getSetCookieHeaders(): string[];
    /**
     * Apply cookies to a response
     */
    applyToResponse(response: Response): Response;
    private encrypt;
    private decrypt;
}
/**
 * Create a cookie
 */
export declare function cookie(name: string, value: string, options?: CookieOptions): Cookie;
/**
 * Create a session cookie (expires when browser closes)
 */
export declare function sessionCookie(name: string, value: string, options?: Omit<CookieOptions, 'maxAge' | 'expires'>): Cookie;
/**
 * Create a persistent cookie
 */
export declare function persistentCookie(name: string, value: string, maxAgeDays: number, options?: Omit<CookieOptions, 'maxAge'>): Cookie;
/**
 * Create a removal cookie
 */
export declare function removalCookie(name: string, options?: Pick<CookieOptions, 'path' | 'domain'>): Cookie;
/**
 * Sign a cookie value
 */
export declare function signCookie(value: string, secret: string): Promise<string>;
/**
 * Verify a signed cookie value
 */
export declare function verifyCookie(signedValue: string, secret: string): Promise<string | null>;
/**
 * Flash message type
 */
export interface FlashMessage {
    kind: 'info' | 'success' | 'warning' | 'error';
    message: string;
}
/**
 * Set a flash message
 */
export declare function setFlash(jar: CookieJar, kind: FlashMessage['kind'], message: string): void;
/**
 * Get and consume a flash message
 */
export declare function getFlash(jar: CookieJar): FlashMessage | null;
/**
 * Set a success flash message
 */
export declare function flashSuccess(jar: CookieJar, message: string): void;
/**
 * Set an error flash message
 */
export declare function flashError(jar: CookieJar, message: string): void;
/**
 * Set an info flash message
 */
export declare function flashInfo(jar: CookieJar, message: string): void;
/**
 * Set a warning flash message
 */
export declare function flashWarning(jar: CookieJar, message: string): void;
/**
 * Generate Rust cookie handling code
 */
export declare function generateRustCookieCode(): string;
//# sourceMappingURL=cookies.d.ts.map