/**
 * PhilJS Enhanced Cookie Sessions
 *
 * Secure cookie-based sessions with signing, encryption, rotation, and CSRF protection.
 */
import type { SessionData, Session, SessionStorage } from './session.js';
/**
 * Cookie session options
 */
export interface CookieSessionOptions {
    /** Cookie name */
    name?: string;
    /** Secret for signing (min 32 chars recommended) */
    secret: string;
    /** Optional encryption secret (min 32 chars, enables encryption) */
    encryptionSecret?: string;
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
    /** Max age in seconds */
    maxAge?: number;
    /** Enable session rotation */
    rotate?: boolean;
    /** Rotation interval in seconds */
    rotateInterval?: number;
    /** Enable CSRF protection */
    csrf?: boolean;
    /** CSRF token field name */
    csrfFieldName?: string;
}
/**
 * Cookie session storage implementation
 */
export interface CookieSessionStorage<T extends SessionData> extends SessionStorage<T> {
    /** Verify CSRF token */
    verifyCSRF(request: Request, token: string): Promise<boolean>;
    /** Generate CSRF token */
    generateCSRF(session: Session<T>): string;
    /** Rotate session */
    rotateSession(session: Session<T>): void;
}
/**
 * Create enhanced cookie-based session storage
 */
export declare function createCookieSessionStorage<T extends SessionData = SessionData>(options: CookieSessionOptions): CookieSessionStorage<T>;
/**
 * CSRF middleware
 */
export declare function csrfMiddleware<T extends SessionData>(storage: CookieSessionStorage<T>): (request: Request, next: () => Promise<Response>) => Promise<Response>;
/**
 * Session rotation middleware
 */
export declare function sessionRotationMiddleware<T extends SessionData>(storage: CookieSessionStorage<T>): (request: Request, next: () => Promise<Response>) => Promise<Response>;
//# sourceMappingURL=cookie-session.d.ts.map