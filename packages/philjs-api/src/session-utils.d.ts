/**
 * PhilJS Session Utilities
 *
 * Helper functions and middleware for session management.
 */
import type { Session, SessionData, SessionStorage } from './session.js';
/**
 * Session middleware options
 */
export interface SessionMiddlewareOptions<T extends SessionData> {
    /** Session storage */
    storage: SessionStorage<T>;
    /** Auto-commit session on response */
    autoCommit?: boolean;
    /** Session key in request context */
    contextKey?: string;
}
/**
 * Extended request with session
 */
export interface RequestWithSession<T extends SessionData> extends Request {
    session?: Session<T>;
}
/**
 * Commit session helper
 *
 * Commits session changes and returns Set-Cookie header value.
 */
export declare function commitSession<T extends SessionData>(storage: SessionStorage<T>, session: Session<T>): Promise<string>;
/**
 * Destroy session helper
 *
 * Destroys session and returns Set-Cookie header value for clearing the cookie.
 */
export declare function destroySession<T extends SessionData>(storage: SessionStorage<T>, session: Session<T>): Promise<string>;
/**
 * Get or create session
 *
 * Gets existing session or creates a new one if it doesn't exist.
 */
export declare function getOrCreateSession<T extends SessionData>(storage: SessionStorage<T>, request: Request): Promise<Session<T>>;
/**
 * Require session
 *
 * Gets session or throws error if not found.
 */
export declare function requireSession<T extends SessionData>(storage: SessionStorage<T>, request: Request, errorMessage?: string): Promise<Session<T>>;
/**
 * Session middleware
 *
 * Automatically attaches session to request and commits on response.
 */
export declare function sessionMiddleware<T extends SessionData>(options: SessionMiddlewareOptions<T>): (request: Request, next: (req: Request) => Promise<Response>) => Promise<Response>;
/**
 * Apply session to response
 *
 * Helper to commit session and apply Set-Cookie header to response.
 */
export declare function applySessionToResponse<T extends SessionData>(storage: SessionStorage<T>, session: Session<T>, response: Response): Promise<Response>;
/**
 * Clear session data
 *
 * Clears all session data without destroying the session.
 */
export declare function clearSessionData<T extends SessionData>(session: Session<T>): void;
/**
 * Session value getter with default
 */
export declare function getSessionValue<T extends SessionData, K extends keyof T>(session: Session<T>, key: K, defaultValue: T[K]): T[K];
/**
 * Session value setter with validation
 */
export declare function setSessionValue<T extends SessionData, K extends keyof T>(session: Session<T>, key: K, value: T[K], validator?: (value: T[K]) => boolean): boolean;
/**
 * Merge data into session
 */
export declare function mergeSessionData<T extends SessionData>(session: Session<T>, data: Partial<T>): void;
/**
 * Session typing helper
 */
export type TypedSession<T extends SessionData> = Session<T>;
/**
 * Create typed session utilities
 */
export declare function createTypedSessionUtils<T extends SessionData>(storage: SessionStorage<T>): {
    /**
     * Get session
     */
    get: (request: Request) => Promise<Session<T>>;
    /**
     * Commit session
     */
    commit: (session: Session<T>) => Promise<string>;
    /**
     * Destroy session
     */
    destroy: (session: Session<T>) => Promise<string>;
    /**
     * Get or create session
     */
    getOrCreate: (request: Request) => Promise<Session<T>>;
    /**
     * Require session
     */
    require: (request: Request, errorMessage?: string) => Promise<Session<T>>;
    /**
     * Apply to response
     */
    applyToResponse: (session: Session<T>, response: Response) => Promise<Response>;
    /**
     * Get value with default
     */
    getValue: <K extends keyof T>(session: Session<T>, key: K, defaultValue: T[K]) => T[K];
    /**
     * Set value with validation
     */
    setValue: <K extends keyof T>(session: Session<T>, key: K, value: T[K], validator?: (value: T[K]) => boolean) => boolean;
    /**
     * Merge data
     */
    merge: (session: Session<T>, data: Partial<T>) => void;
    /**
     * Clear data
     */
    clear: (session: Session<T>) => void;
    /**
     * Create middleware
     */
    middleware: (options?: Omit<SessionMiddlewareOptions<T>, "storage">) => (request: Request, next: (req: Request) => Promise<Response>) => Promise<Response>;
};
/**
 * Session timeout middleware
 */
export declare function sessionTimeoutMiddleware<T extends SessionData & {
    lastActivity?: number;
}>(storage: SessionStorage<T>, timeoutSeconds: number): (request: Request, next: (req: Request) => Promise<Response>) => Promise<Response>;
/**
 * Session validator middleware
 */
export declare function sessionValidatorMiddleware<T extends SessionData>(storage: SessionStorage<T>, validator: (session: Session<T>) => boolean | Promise<boolean>): (request: Request, next: (req: Request) => Promise<Response>) => Promise<Response>;
/**
 * Session regeneration
 *
 * Regenerates session ID while preserving data (useful after login/privilege escalation).
 */
export declare function regenerateSession<T extends SessionData>(storage: SessionStorage<T>, oldSession: Session<T>): Promise<Session<T>>;
//# sourceMappingURL=session-utils.d.ts.map