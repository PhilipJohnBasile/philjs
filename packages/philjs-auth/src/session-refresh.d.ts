/**
 * Session Refresh Management
 *
 * Automatic token refresh and session management
 */
import type { AuthSession } from './types.js';
/**
 * Token refresh configuration
 */
export interface RefreshConfig {
    /**
     * Refresh token before this many milliseconds before expiry
     */
    refreshBeforeExpiry?: number;
    /**
     * Check interval in milliseconds
     */
    checkInterval?: number;
    /**
     * Callback when refresh fails
     */
    onRefreshFailed?: (error: Error) => void;
    /**
     * Callback when refresh succeeds
     */
    onRefreshSuccess?: (token: string) => void;
    /**
     * Automatically refresh on window focus
     */
    refreshOnFocus?: boolean;
    /**
     * Automatically refresh on network reconnect
     */
    refreshOnReconnect?: boolean;
}
/**
 * Session refresh manager
 */
export declare class SessionRefreshManager {
    private config;
    private intervalId;
    private isRefreshing;
    private lastRefresh;
    constructor(config?: RefreshConfig);
    /**
     * Start automatic token refresh
     */
    start(): void;
    /**
     * Stop automatic token refresh
     */
    stop(): void;
    /**
     * Check if token needs refresh and refresh if needed
     */
    checkAndRefresh(): Promise<void>;
    /**
     * Force refresh the token
     */
    refresh(): Promise<void>;
    /**
     * Get refresh status
     */
    getStatus(): {
        isRefreshing: import("@philjs/core/signals").Memo<boolean>;
        lastRefresh: import("@philjs/core/signals").Memo<number>;
    };
}
/**
 * Get or create global refresh manager
 */
export declare function getSessionRefreshManager(config?: RefreshConfig): SessionRefreshManager;
/**
 * Start automatic session refresh
 */
export declare function startSessionRefresh(config?: RefreshConfig): SessionRefreshManager;
/**
 * Stop automatic session refresh
 */
export declare function stopSessionRefresh(): void;
/**
 * Logout everywhere - revoke all sessions
 */
export declare function logoutEverywhere(): Promise<void>;
/**
 * Session persistence utilities
 */
export declare const SessionPersistence: {
    /**
     * Save session to storage
     */
    save(session: AuthSession, storage?: "local" | "session"): void;
    /**
     * Load session from storage
     */
    load(storage?: "local" | "session"): AuthSession | null;
    /**
     * Clear session from storage
     */
    clear(storage?: "local" | "session"): void;
    /**
     * Clear all sessions from all storage
     */
    clearAll(): void;
};
//# sourceMappingURL=session-refresh.d.ts.map