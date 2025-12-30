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

import { signal, computed, type Signal } from 'philjs-core/signals';
import type { AuthSession, AuthConfig, User } from './types.js';

const DEFAULT_CONFIG: Required<AuthConfig> & { storeTokenClientSide: boolean } = {
  sessionKey: 'philjs_session',
  tokenKey: 'philjs_token',
  cookieName: 'philjs_auth',
  cookieDomain: '',
  cookieSecure: true,
  cookieSameSite: 'lax',
  sessionExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days
  storeTokenClientSide: false // Secure default: don't store tokens in localStorage
};

export class SessionManager {
  private sessionSignal: Signal<AuthSession>;
  private config: Required<AuthConfig> & { storeTokenClientSide: boolean };

  constructor(config: AuthConfig & { storeTokenClientSide?: boolean } = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize session from storage
    const initialSession = this.loadSession();
    this.sessionSignal = signal<AuthSession>(initialSession);
  }

  /**
   * Get current session as a signal (reactive)
   */
  get session(): Signal<AuthSession> {
    return this.sessionSignal;
  }

  /**
   * Computed signal for current user
   */
  get user() {
    return computed(() => this.sessionSignal().user);
  }

  /**
   * Computed signal for authentication status
   */
  get isAuthenticated() {
    return computed(() => {
      const session = this.sessionSignal();
      if (!session.user) return false;
      if (!session.expiresAt) return true;
      return Date.now() < session.expiresAt;
    });
  }

  /**
   * Computed signal for token
   */
  get token() {
    return computed(() => this.sessionSignal().token);
  }

  /**
   * Set user session
   */
  setSession(user: User, token?: string, expiresIn?: number): void {
    const expiresAt = expiresIn
      ? Date.now() + expiresIn
      : Date.now() + this.config.sessionExpiry!;

    const session: AuthSession = {
      user,
      token,
      expiresAt
    };

    this.sessionSignal.set(session);
    this.saveSession(session);
  }

  /**
   * Update user information
   */
  updateUser(updates: Partial<User>): void {
    const currentSession = this.sessionSignal();
    if (!currentSession.user) return;

    const updatedSession: AuthSession = {
      ...currentSession,
      user: { ...currentSession.user, ...updates }
    };

    this.sessionSignal.set(updatedSession);
    this.saveSession(updatedSession);
  }

  /**
   * Clear session (logout)
   */
  clearSession(): void {
    this.sessionSignal.set({ user: null });
    this.removeSession();
  }

  /**
   * Refresh session expiry
   */
  refreshSession(expiresIn?: number): void {
    const currentSession = this.sessionSignal();
    if (!currentSession.user) return;

    const expiresAt = expiresIn
      ? Date.now() + expiresIn
      : Date.now() + this.config.sessionExpiry!;

    const updatedSession: AuthSession = {
      ...currentSession,
      expiresAt
    };

    this.sessionSignal.set(updatedSession);
    this.saveSession(updatedSession);
  }

  /**
   * Check if session is expired
   */
  isExpired(): boolean {
    const session = this.sessionSignal();
    if (!session.expiresAt) return false;
    return Date.now() >= session.expiresAt;
  }

  /**
   * Load session from storage
   */
  private loadSession(): AuthSession {
    if (typeof window === 'undefined') {
      return { user: null };
    }

    try {
      // Try localStorage first
      const stored = localStorage.getItem(this.config.sessionKey!);
      if (stored) {
        const session: AuthSession = JSON.parse(stored);

        // Check if expired
        if (session.expiresAt && Date.now() >= session.expiresAt) {
          this.removeSession();
          return { user: null };
        }

        return session;
      }

      // Try cookie fallback
      const cookieValue = this.getCookie(this.config.cookieName!);
      if (cookieValue) {
        const session: AuthSession = JSON.parse(decodeURIComponent(cookieValue));

        // Check if expired
        if (session.expiresAt && Date.now() >= session.expiresAt) {
          this.removeSession();
          return { user: null };
        }

        return session;
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }

    return { user: null };
  }

  /**
   * Save session to storage
   *
   * Note: For security, tokens are only stored client-side if storeTokenClientSide is true.
   * By default, tokens are excluded from client-side storage to prevent XSS token theft.
   */
  private saveSession(session: AuthSession): void {
    if (typeof window === 'undefined') return;

    try {
      // Create a session copy, optionally excluding the token for security
      const sessionToStore: AuthSession = this.config.storeTokenClientSide
        ? session
        : { ...session, token: undefined };

      const serialized = JSON.stringify(sessionToStore);

      // Save to localStorage
      localStorage.setItem(this.config.sessionKey!, serialized);

      // Save to cookie for SSR (user info only, not tokens)
      const cookieSession = { ...session, token: undefined };
      this.setCookie(this.config.cookieName!, JSON.stringify(cookieSession), session.expiresAt);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }

  /**
   * Remove session from storage
   */
  private removeSession(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(this.config.sessionKey!);
      this.deleteCookie(this.config.cookieName!);
    } catch (error) {
      console.error('Failed to remove session:', error);
    }
  }

  /**
   * Set a cookie
   */
  private setCookie(name: string, value: string, expiresAt?: number): void {
    const encoded = encodeURIComponent(value);
    const expires = expiresAt ? new Date(expiresAt).toUTCString() : '';

    let cookie = `${name}=${encoded}`;
    if (expires) cookie += `; expires=${expires}`;
    if (this.config.cookieDomain) cookie += `; domain=${this.config.cookieDomain}`;
    if (this.config.cookieSecure) cookie += `; secure`;
    cookie += `; samesite=${this.config.cookieSameSite}`;
    cookie += `; path=/`;

    document.cookie = cookie;
  }

  /**
   * Get a cookie value
   */
  private getCookie(name: string): string | null {
    const matches = document.cookie.match(new RegExp(
      `(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1')}=([^;]*)`
    ));
    return matches ? decodeURIComponent(matches[1]!) : null;
  }

  /**
   * Delete a cookie
   */
  private deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}

/**
 * Create a session manager instance
 */
export function createSessionManager(config?: AuthConfig): SessionManager {
  return new SessionManager(config);
}

/**
 * Default session manager singleton
 */
let defaultManager: SessionManager | null = null;

export function getDefaultSessionManager(): SessionManager {
  if (!defaultManager) {
    defaultManager = new SessionManager();
  }
  return defaultManager;
}

export function setDefaultSessionManager(manager: SessionManager): void {
  defaultManager = manager;
}
