/**
 * NextAuth Provider Adapter
 *
 * Integrates NextAuth with PhilJS auth system
 */

import { signal, type Signal } from '@philjs/core/signals';
import { BaseAuthProvider } from '../auth-provider.js';
import type { User, AuthSession } from '../types.js';

/**
 * NextAuth configuration
 */
export interface NextAuthConfig {
  basePath?: string;
  providers?: any[];
  callbacks?: {
    signIn?: (params: any) => Promise<boolean>;
    session?: (params: any) => Promise<any>;
    jwt?: (params: any) => Promise<any>;
  };
}

/**
 * NextAuth provider adapter
 */
export class NextAuthProvider extends BaseAuthProvider {
  readonly name = 'nextauth';
  readonly user: Signal<User | null>;
  readonly session: Signal<AuthSession | null>;
  readonly loading: Signal<boolean>;

  private config: NextAuthConfig;
  private sessionModule: any = null;

  constructor(config: NextAuthConfig = {}) {
    super();
    this.config = {
      basePath: '/api/auth',
      ...config,
    };
    this.user = signal<User | null>(null);
    this.session = signal<AuthSession | null>(null);
    this.loading = signal(true);
  }

  async initialize(): Promise<void> {
    try {
      // Dynamically import NextAuth client
      this.sessionModule = await import('next-auth/react');

      // Get initial session
      const session = await this.sessionModule.getSession();
      if (session) {
        this.updateAuthState(session);
      }

      // Listen for session changes
      if (typeof window !== 'undefined') {
        window.addEventListener('visibilitychange', async () => {
          if (document.visibilityState === 'visible') {
            const updatedSession = await this.sessionModule.getSession();
            this.updateAuthState(updatedSession);
          }
        });
      }

      this.loading.set(false);
    } catch (error) {
      this.loading.set(false);
      this.handleError(error, 'Failed to initialize NextAuth');
    }
  }

  async signInWithEmail(email: string, password: string): Promise<User> {
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email address');
    }

    if (!this.validatePassword(password)) {
      throw new Error('Password must be at least 8 characters');
    }

    try {
      const result = await this.sessionModule.signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (!result?.ok) {
        throw new Error('Sign in failed');
      }

      // Get updated session
      const session = await this.sessionModule.getSession();
      if (session?.user) {
        return this.mapNextAuthUser(session.user);
      }

      throw new Error('No user in session');
    } catch (error) {
      this.handleError(error, 'Failed to sign in');
    }
  }

  async signUpWithEmail(
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ): Promise<User> {
    // NextAuth doesn't have built-in signup - need to implement custom endpoint
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email address');
    }

    if (!this.validatePassword(password)) {
      throw new Error('Password must be at least 8 characters');
    }

    try {
      // Call custom signup API endpoint
      const response = await fetch(`${this.config.basePath}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          ...metadata,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signup failed');
      }

      // Sign in after successful signup
      return await this.signInWithEmail(email, password);
    } catch (error) {
      this.handleError(error, 'Failed to sign up');
    }
  }

  async signInWithOAuth(provider: string): Promise<void> {
    try {
      await this.sessionModule.signIn(provider, {
        callbackUrl: window.location.origin,
      });
    } catch (error) {
      this.handleError(error, `Failed to sign in with ${provider}`);
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.sessionModule.signOut({
        callbackUrl: window.location.origin,
      });
      this.user.set(null);
      this.session.set(null);
    } catch (error) {
      this.handleError(error, 'Failed to sign out');
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const session = await this.sessionModule.getSession();
      // NextAuth stores token in session
      return session?.accessToken || session?.user?.accessToken || null;
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  async updateUser(updates: Partial<User>): Promise<User> {
    try {
      // Call custom update endpoint
      const response = await fetch(`${this.config.basePath}/user/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const user = await response.json();

      // Refresh session
      const session = await this.sessionModule.getSession();
      this.updateAuthState(session);

      return this.mapNextAuthUser(user);
    } catch (error) {
      this.handleError(error, 'Failed to update user');
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      // Call custom password reset endpoint
      const response = await fetch(`${this.config.basePath}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to send password reset email');
      }
    } catch (error) {
      this.handleError(error, 'Failed to send password reset');
    }
  }

  private updateAuthState(session: any): void {
    if (session?.user) {
      const user = this.mapNextAuthUser(session.user);

      const authSession: AuthSession = {
        user,
        token: session.accessToken,
        expiresAt: session.expires ? new Date(session.expires).getTime() : undefined,
      };

      this.user.set(user);
      this.session.set(authSession);
    } else {
      this.user.set(null);
      this.session.set(null);
    }
  }

  private mapNextAuthUser(nextAuthUser: any): User {
    return {
      id: nextAuthUser.id || nextAuthUser.sub || '',
      email: nextAuthUser.email,
      name: nextAuthUser.name,
      avatar: nextAuthUser.image || nextAuthUser.picture,
      metadata: nextAuthUser,
    };
  }
}
