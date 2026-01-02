/**
 * Session Refresh Management
 *
 * Automatic token refresh and session management
 */

import { signal, computed } from '@philjs/core/signals';
import type { AuthSession } from './types.js';
import { getAuthProvider } from './hooks.js';

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

const DEFAULT_CONFIG: Required<RefreshConfig> = {
  refreshBeforeExpiry: 5 * 60 * 1000, // 5 minutes
  checkInterval: 60 * 1000, // 1 minute
  onRefreshFailed: (error) => console.error('Token refresh failed:', error),
  onRefreshSuccess: () => {},
  refreshOnFocus: true,
  refreshOnReconnect: true,
};

/**
 * Session refresh manager
 */
export class SessionRefreshManager {
  private config: Required<RefreshConfig>;
  private intervalId: number | null = null;
  private isRefreshing = signal(false);
  private lastRefresh = signal<number>(Date.now());

  constructor(config: RefreshConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start automatic token refresh
   */
  start(): void {
    if (this.intervalId !== null) {
      return; // Already started
    }

    // Set up interval check
    this.intervalId = window.setInterval(() => {
      this.checkAndRefresh();
    }, this.config.checkInterval);

    // Refresh on window focus
    if (this.config.refreshOnFocus) {
      window.addEventListener('focus', () => this.checkAndRefresh());
    }

    // Refresh on network reconnect
    if (this.config.refreshOnReconnect) {
      window.addEventListener('online', () => this.checkAndRefresh());
    }

    // Initial check
    this.checkAndRefresh();
  }

  /**
   * Stop automatic token refresh
   */
  stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Check if token needs refresh and refresh if needed
   */
  async checkAndRefresh(): Promise<void> {
    if (this.isRefreshing()) {
      return; // Already refreshing
    }

    try {
      const provider = getAuthProvider();
      const session = provider.session();

      if (!session || !session.expiresAt) {
        return; // No session or no expiry
      }

      const now = Date.now();
      const expiresAt = session.expiresAt;
      const timeUntilExpiry = expiresAt - now;

      // Check if token needs refresh
      if (timeUntilExpiry <= this.config.refreshBeforeExpiry) {
        await this.refresh();
      }
    } catch (error) {
      // Silently fail - don't interrupt user experience
      console.debug('Token refresh check failed:', error);
    }
  }

  /**
   * Force refresh the token
   */
  async refresh(): Promise<void> {
    if (this.isRefreshing()) {
      return; // Already refreshing
    }

    try {
      this.isRefreshing.set(true);

      const provider = getAuthProvider();

      if (!provider.refreshToken) {
        throw new Error('Token refresh not supported by provider');
      }

      const newToken = await provider.refreshToken();

      this.lastRefresh.set(Date.now());
      this.config.onRefreshSuccess(newToken);
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Token refresh failed');
      this.config.onRefreshFailed(err);
      throw err;
    } finally {
      this.isRefreshing.set(false);
    }
  }

  /**
   * Get refresh status
   */
  getStatus() {
    return {
      isRefreshing: computed(() => this.isRefreshing()),
      lastRefresh: computed(() => this.lastRefresh()),
    };
  }
}

/**
 * Global session refresh manager instance
 */
let globalRefreshManager: SessionRefreshManager | null = null;

/**
 * Get or create global refresh manager
 */
export function getSessionRefreshManager(config?: RefreshConfig): SessionRefreshManager {
  if (!globalRefreshManager) {
    globalRefreshManager = new SessionRefreshManager(config);
  }
  return globalRefreshManager;
}

/**
 * Start automatic session refresh
 */
export function startSessionRefresh(config?: RefreshConfig): SessionRefreshManager {
  const manager = getSessionRefreshManager(config);
  manager.start();
  return manager;
}

/**
 * Stop automatic session refresh
 */
export function stopSessionRefresh(): void {
  if (globalRefreshManager) {
    globalRefreshManager.stop();
  }
}

/**
 * Logout everywhere - revoke all sessions
 */
export async function logoutEverywhere(): Promise<void> {
  try {
    const provider = getAuthProvider();

    // Sign out locally
    await provider.signOut();

    // Call logout everywhere endpoint (provider-specific)
    const token = await provider.getToken();
    if (token) {
      await fetch('/api/auth/logout-everywhere', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
    }

    // Stop refresh manager
    stopSessionRefresh();
  } catch (error) {
    console.error('Logout everywhere failed:', error);
    throw error;
  }
}

/**
 * Session persistence utilities
 */
export const SessionPersistence = {
  /**
   * Save session to storage
   */
  save(session: AuthSession, storage: 'local' | 'session' = 'local'): void {
    const storageObj = storage === 'local' ? localStorage : sessionStorage;

    try {
      storageObj.setItem('philjs_auth_session', JSON.stringify(session));
    } catch (error) {
      console.error('Failed to persist session:', error);
    }
  },

  /**
   * Load session from storage
   */
  load(storage: 'local' | 'session' = 'local'): AuthSession | null {
    const storageObj = storage === 'local' ? localStorage : sessionStorage;

    try {
      const stored = storageObj.getItem('philjs_auth_session');
      if (!stored) return null;

      const session: AuthSession = JSON.parse(stored);

      // Check if expired
      if (session.expiresAt && Date.now() >= session.expiresAt) {
        this.clear(storage);
        return null;
      }

      return session;
    } catch (error) {
      console.error('Failed to load session:', error);
      return null;
    }
  },

  /**
   * Clear session from storage
   */
  clear(storage: 'local' | 'session' = 'local'): void {
    const storageObj = storage === 'local' ? localStorage : sessionStorage;
    storageObj.removeItem('philjs_auth_session');
  },

  /**
   * Clear all sessions from all storage
   */
  clearAll(): void {
    this.clear('local');
    this.clear('session');
  },
};
