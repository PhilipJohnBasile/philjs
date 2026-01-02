/**
 * Auth0 Authentication Provider Adapter
 *
 * Integrates Auth0 with PhilJS auth system
 */

import { signal, type Signal } from '@philjs/core/signals';
import { BaseAuthProvider } from '../auth-provider.js';
import type { User, AuthSession } from '../types.js';

/**
 * Auth0 configuration
 */
export interface Auth0Config {
  domain: string;
  clientId: string;
  clientSecret?: string;
  audience?: string;
  redirectUri: string;
  scope?: string;
}

/**
 * Auth0 auth provider
 */
export class Auth0AuthProvider extends BaseAuthProvider {
  readonly name = 'auth0';
  readonly user: Signal<User | null>;
  readonly session: Signal<AuthSession | null>;
  readonly loading: Signal<boolean>;

  private config: Auth0Config;
  private auth0Client: any = null;

  constructor(config: Auth0Config) {
    super();
    this.config = {
      ...config,
      scope: config.scope || 'openid profile email',
    };
    this.user = signal<User | null>(null);
    this.session = signal<AuthSession | null>(null);
    this.loading = signal(true);
  }

  async initialize(): Promise<void> {
    try {
      // Dynamically import Auth0
      const { Auth0Client } = await import('@auth0/auth0-spa-js');

      this.auth0Client = new Auth0Client({
        domain: this.config.domain,
        clientId: this.config.clientId,
        authorizationParams: {
          redirect_uri: this.config.redirectUri,
          audience: this.config.audience,
          scope: this.config.scope,
        },
      });

      // Check if returning from redirect
      const query = window.location.search;
      if (query.includes('code=') && query.includes('state=')) {
        await this.auth0Client.handleRedirectCallback();
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // Check if authenticated
      const isAuthenticated = await this.auth0Client.isAuthenticated();
      if (isAuthenticated) {
        await this.updateAuthState();
      }

      this.loading.set(false);
    } catch (error) {
      this.loading.set(false);
      this.handleError(error, 'Failed to initialize Auth0');
    }
  }

  async signInWithEmail(email: string, password: string): Promise<User> {
    // Auth0 typically uses redirect-based flow
    // For username/password, we need to use the Authentication API
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email address');
    }

    if (!this.validatePassword(password)) {
      throw new Error('Password must be at least 8 characters');
    }

    try {
      // Use Resource Owner Password flow (not recommended for production)
      const response = await fetch(`https://${this.config.domain}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'password',
          username: email,
          password,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          audience: this.config.audience,
          scope: this.config.scope,
        }),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();

      // Store token and get user info
      await this.auth0Client.loginWithCredentials?.({
        username: email,
        password,
      });

      await this.updateAuthState();
      return this.getCurrentUser();
    } catch (error) {
      this.handleError(error, 'Failed to sign in');
    }
  }

  async signUpWithEmail(
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ): Promise<User> {
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email address');
    }

    if (!this.validatePassword(password)) {
      throw new Error('Password must be at least 8 characters');
    }

    try {
      // Use Auth0 Management API for signup
      const response = await fetch(`https://${this.config.domain}/dbconnections/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.config.clientId,
          email,
          password,
          connection: 'Username-Password-Authentication',
          user_metadata: metadata,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.description || 'Signup failed');
      }

      // Sign in after successful signup
      return await this.signInWithEmail(email, password);
    } catch (error) {
      this.handleError(error, 'Failed to sign up');
    }
  }

  async signInWithOAuth(provider: string): Promise<void> {
    try {
      await this.auth0Client.loginWithRedirect({
        authorizationParams: {
          connection: provider,
        },
      });
    } catch (error) {
      this.handleError(error, `Failed to sign in with ${provider}`);
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.auth0Client.logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      });
      this.user.set(null);
      this.session.set(null);
    } catch (error) {
      this.handleError(error, 'Failed to sign out');
    }
  }

  async getToken(): Promise<string | null> {
    try {
      return await this.auth0Client.getTokenSilently();
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  async refreshToken(): Promise<string> {
    try {
      return await this.auth0Client.getTokenSilently({ cacheMode: 'off' });
    } catch (error) {
      this.handleError(error, 'Failed to refresh token');
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      const response = await fetch(`https://${this.config.domain}/dbconnections/change_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.config.clientId,
          email,
          connection: 'Username-Password-Authentication',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send password reset email');
      }
    } catch (error) {
      this.handleError(error, 'Failed to send password reset');
    }
  }

  private async updateAuthState(): Promise<void> {
    try {
      const auth0User = await this.auth0Client.getUser();

      if (auth0User) {
        const user: User = {
          id: auth0User.sub || '',
          email: auth0User.email,
          name: auth0User.name,
          avatar: auth0User.picture,
          metadata: auth0User,
        };

        const claims = await this.auth0Client.getIdTokenClaims();
        const session: AuthSession = {
          user,
          expiresAt: claims?.exp ? claims.exp * 1000 : undefined,
        };

        this.user.set(user);
        this.session.set(session);
      } else {
        this.user.set(null);
        this.session.set(null);
      }
    } catch (error) {
      console.error('Failed to update auth state:', error);
    }
  }

  private getCurrentUser(): User {
    const user = this.user();
    if (!user) {
      throw new Error('No user available');
    }
    return user;
  }
}
