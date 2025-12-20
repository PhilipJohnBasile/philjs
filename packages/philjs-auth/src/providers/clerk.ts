/**
 * Clerk Authentication Provider Adapter
 *
 * Integrates Clerk with PhilJS auth system
 */

import { signal, type Signal } from 'philjs-core/signals';
import { BaseAuthProvider } from '../auth-provider.js';
import type { User, AuthSession } from '../types.js';

/**
 * Clerk configuration
 */
export interface ClerkConfig {
  publishableKey: string;
  secretKey?: string;
  signInUrl?: string;
  signUpUrl?: string;
  afterSignInUrl?: string;
  afterSignUpUrl?: string;
}

/**
 * Clerk auth provider
 */
export class ClerkAuthProvider extends BaseAuthProvider {
  readonly name = 'clerk';
  readonly user: Signal<User | null>;
  readonly session: Signal<AuthSession | null>;
  readonly loading: Signal<boolean>;

  private config: ClerkConfig;
  private clerkInstance: any = null;

  constructor(config: ClerkConfig) {
    super();
    this.config = config;
    this.user = signal<User | null>(null);
    this.session = signal<AuthSession | null>(null);
    this.loading = signal(true);
  }

  async initialize(): Promise<void> {
    try {
      // Dynamically import Clerk
      const { Clerk } = await import('@clerk/clerk-js');

      this.clerkInstance = new Clerk(this.config.publishableKey);
      await this.clerkInstance.load();

      // Set up listeners for auth state changes
      this.clerkInstance.addListener((state: any) => {
        this.updateAuthState(state);
      });

      // Initial state
      this.updateAuthState(this.clerkInstance);

      this.loading.set(false);
    } catch (error) {
      this.loading.set(false);
      this.handleError(error, 'Failed to initialize Clerk');
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
      const signIn = await this.clerkInstance.client.signIn.create({
        identifier: email,
        password,
      });

      if (signIn.status === 'complete') {
        await this.clerkInstance.setActive({ session: signIn.createdSessionId });
        return this.getCurrentUser();
      }

      throw new Error('Sign in failed');
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
      const signUp = await this.clerkInstance.client.signUp.create({
        emailAddress: email,
        password,
        unsafeMetadata: metadata,
      });

      if (signUp.status === 'complete') {
        await this.clerkInstance.setActive({ session: signUp.createdSessionId });
        return this.getCurrentUser();
      }

      // May need email verification
      if (signUp.status === 'missing_requirements') {
        throw new Error('Email verification required');
      }

      throw new Error('Sign up failed');
    } catch (error) {
      this.handleError(error, 'Failed to sign up');
    }
  }

  async signInWithOAuth(provider: string): Promise<void> {
    try {
      await this.clerkInstance.authenticateWithRedirect({
        strategy: `oauth_${provider}`,
        redirectUrl: this.config.afterSignInUrl || '/dashboard',
        redirectUrlComplete: this.config.afterSignInUrl || '/dashboard',
      });
    } catch (error) {
      this.handleError(error, `Failed to sign in with ${provider}`);
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.clerkInstance.signOut();
      this.user.set(null);
      this.session.set(null);
    } catch (error) {
      this.handleError(error, 'Failed to sign out');
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const session = this.clerkInstance.session;
      if (!session) return null;

      return await session.getToken();
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  }

  async updateUser(updates: Partial<User>): Promise<User> {
    try {
      const clerkUser = this.clerkInstance.user;
      if (!clerkUser) {
        throw new Error('No user signed in');
      }

      await clerkUser.update({
        firstName: updates.name?.split(' ')[0],
        lastName: updates.name?.split(' ').slice(1).join(' '),
        unsafeMetadata: updates.metadata,
      });

      return this.getCurrentUser();
    } catch (error) {
      this.handleError(error, 'Failed to update user');
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await this.clerkInstance.client.signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
    } catch (error) {
      this.handleError(error, 'Failed to send password reset');
    }
  }

  private updateAuthState(clerkState: any): void {
    const clerkUser = clerkState.user;
    const clerkSession = clerkState.session;

    if (clerkUser && clerkSession) {
      const user: User = {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress,
        name: clerkUser.fullName || clerkUser.firstName || undefined,
        avatar: clerkUser.imageUrl,
        metadata: clerkUser.publicMetadata,
      };

      const session: AuthSession = {
        user,
        expiresAt: clerkSession.expireAt,
      };

      this.user.set(user);
      this.session.set(session);
    } else {
      this.user.set(null);
      this.session.set(null);
    }
  }

  private getCurrentUser(): User {
    const user = this.user.get();
    if (!user) {
      throw new Error('No user available');
    }
    return user;
  }
}
