/**
 * CSRF protection for actions.
 */
/**
 * Generate a CSRF token.
 */
export declare function generateCSRFToken(): string;
/**
 * Store for CSRF tokens (in production, use Redis or similar).
 */
declare class TokenStore {
    private tokens;
    private cleanupInterval;
    constructor();
    set(sessionId: string, token: string, ttl?: number): void;
    get(sessionId: string): string | null;
    verify(sessionId: string, token: string): boolean;
    cleanup(): void;
    destroy(): void;
}
export declare const csrfStore: TokenStore;
/**
 * Middleware to add CSRF protection to actions.
 */
export declare function csrfProtection(options?: {
    skip?: (request: Request) => boolean;
    getSessionId: (request: Request) => string;
}): {
    generateToken: (request: Request) => string;
    verifyRequest: (request: Request) => boolean;
};
/**
 * Create a CSRF input field for forms.
 */
export declare function csrfField(token: string): string;
/**
 * Extract CSRF token from request.
 */
export declare function extractCSRFToken(request: Request): Promise<string | null>;
export {};
//# sourceMappingURL=csrf.d.ts.map