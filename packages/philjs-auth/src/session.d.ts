/**
 * Session management with signals for reactive authentication state
 *
 * SECURITY NOTE: This module stores session data in localStorage/cookies for
 * client-side convenience. For maximum security with sensitive tokens:
 *
 * 1. Use HttpOnly cookies set by your server for access/refresh tokens
 * 2. Only store non-sensitive session metadata (user info) client-side
 * 3. Set `storeTokenClientSide: false` in config to avoid storing tokens
 * 4. Implement token refresh via HttpOnly cookie-based server endpoints
 *
 * The default configuration prioritizes usability. For high-security apps,
 * configure your server to manage tokens via HttpOnly cookies.
 */
import { type Signal } from 'philjs-core/signals';
import type { AuthSession, AuthConfig, User } from './types.js';
export declare class SessionManager {
    private sessionSignal;
    private config;
    constructor(config?: AuthConfig & {
        storeTokenClientSide?: boolean;
    });
    /**
     * Get current session as a signal (reactive)
     */
    get session(): Signal<AuthSession>;
    /**
     * Computed signal for current user
     */
    get user(): any;
    /**
     * Computed signal for authentication status
     */
    get isAuthenticated(): any;
    /**
     * Computed signal for token
     */
    get token(): any;
    /**
     * Set user session
     */
    setSession(user: User, token?: string, expiresIn?: number): void;
    /**
     * Update user information
     */
    updateUser(updates: Partial<User>): void;
    /**
     * Clear session (logout)
     */
    clearSession(): void;
    /**
     * Refresh session expiry
     */
    refreshSession(expiresIn?: number): void;
    /**
     * Check if session is expired
     */
    isExpired(): boolean;
    /**
     * Load session from storage
     */
    private loadSession;
    /**
     * Save session to storage
     *
     * Note: For security, tokens are only stored client-side if storeTokenClientSide is true.
     * By default, tokens are excluded from client-side storage to prevent XSS token theft.
     */
    private saveSession;
    /**
     * Remove session from storage
     */
    private removeSession;
    /**
     * Set a cookie
     */
    private setCookie;
    /**
     * Get a cookie value
     */
    private getCookie;
    /**
     * Delete a cookie
     */
    private deleteCookie;
}
/**
 * Create a session manager instance
 */
export declare function createSessionManager(config?: AuthConfig): SessionManager;
export declare function getDefaultSessionManager(): SessionManager;
export declare function setDefaultSessionManager(manager: SessionManager): void;
//# sourceMappingURL=session.d.ts.map