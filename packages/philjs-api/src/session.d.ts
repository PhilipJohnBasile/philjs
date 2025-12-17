/**
 * PhilJS Session Management
 *
 * Server-side session handling with multiple storage backends.
 */
export interface SessionData {
    [key: string]: unknown;
}
export interface Session<T extends SessionData = SessionData> {
    /** Session ID */
    id: string;
    /** Session data */
    data: T;
    /** Get a value */
    get<K extends keyof T>(key: K): T[K] | undefined;
    /** Set a value */
    set<K extends keyof T>(key: K, value: T[K]): void;
    /** Delete a value */
    delete<K extends keyof T>(key: K): void;
    /** Check if key exists */
    has<K extends keyof T>(key: K): boolean;
    /** Clear all data */
    clear(): void;
    /** Flash data (available for one request) */
    flash<K extends keyof T>(key: K, value: T[K]): void;
    /** Get flashed data */
    getFlash<K extends keyof T>(key: K): T[K] | undefined;
}
export interface SessionOptions {
    /** Cookie name */
    cookieName?: string;
    /** Cookie options */
    cookie?: {
        path?: string;
        domain?: string;
        secure?: boolean;
        httpOnly?: boolean;
        sameSite?: 'strict' | 'lax' | 'none';
        maxAge?: number;
    };
    /** Secret for signing */
    secret: string;
}
export interface SessionStorage<T extends SessionData = SessionData> {
    /** Get session from request */
    getSession(request: Request): Promise<Session<T>>;
    /** Commit session changes */
    commitSession(session: Session<T>): Promise<string>;
    /** Destroy session */
    destroySession(session: Session<T>): Promise<string>;
}
/**
 * Create a session storage
 */
export declare function createSessionStorage<T extends SessionData = SessionData>(options: {
    cookie: SessionOptions;
    createData: (data: T, expiresAt?: Date) => Promise<string>;
    readData: (id: string) => Promise<T | null>;
    updateData: (id: string, data: T, expiresAt?: Date) => Promise<void>;
    deleteData: (id: string) => Promise<void>;
}): SessionStorage<T>;
/**
 * Create a cookie-based session storage (stateless)
 */
export declare function createCookieSessionStorage<T extends SessionData = SessionData>(options: SessionOptions): SessionStorage<T>;
/**
 * Create a memory-based session storage (for development)
 */
export declare function createMemorySessionStorage<T extends SessionData = SessionData>(options: SessionOptions): SessionStorage<T>;
/**
 * Helper to get session from storage
 */
export declare function getSession<T extends SessionData>(storage: SessionStorage<T>, request: Request): Promise<Session<T>>;
/**
 * Helper to commit session
 */
export declare function commitSession<T extends SessionData>(storage: SessionStorage<T>, session: Session<T>): Promise<string>;
/**
 * Helper to destroy session
 */
export declare function destroySession<T extends SessionData>(storage: SessionStorage<T>, session: Session<T>): Promise<string>;
//# sourceMappingURL=session.d.ts.map