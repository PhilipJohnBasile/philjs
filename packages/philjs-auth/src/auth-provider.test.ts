/**
 * Auth Provider Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { signal } from '@philjs/core/signals';
import { BaseAuthProvider, AuthProviderFactory } from './auth-provider.js';
import type { User, AuthSession } from './types.js';

class MockAuthProvider extends BaseAuthProvider {
  readonly name = 'mock';
  readonly user = signal<User | null>(null);
  readonly session = signal<AuthSession | null>(null);
  readonly loading = signal(false);

  async initialize(): Promise<void> {
    this.loading.set(false);
  }

  async signInWithEmail(email: string, password: string): Promise<User> {
    const user: User = {
      id: '1',
      email,
      name: 'Test User',
    };

    this.user.set(user);

    const session: AuthSession = {
      user,
      token: 'mock-token',
      expiresAt: Date.now() + 3600000,
    };

    this.session.set(session);

    return user;
  }

  async signUpWithEmail(email: string, password: string): Promise<User> {
    return this.signInWithEmail(email, password);
  }

  async signOut(): Promise<void> {
    this.user.set(null);
    this.session.set(null);
  }

  async getToken(): Promise<string | null> {
    return this.session.get()?.token || null;
  }
}

describe('AuthProvider', () => {
  let provider: MockAuthProvider;

  beforeEach(() => {
    provider = new MockAuthProvider({});
  });

  describe('initialization', () => {
    it('initializes successfully', async () => {
      await provider.initialize();
      expect(provider.loading.get()).toBe(false);
    });
  });

  describe('sign in', () => {
    it('signs in with email and password', async () => {
      const user = await provider.signInWithEmail('test@example.com', 'password123');

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(provider.user.get()).toEqual(user);
    });

    it('validates email format', () => {
      expect(provider['validateEmail']('test@example.com')).toBe(true);
      expect(provider['validateEmail']('invalid-email')).toBe(false);
    });

    it('validates password strength', () => {
      expect(provider['validatePassword']('password123')).toBe(true);
      expect(provider['validatePassword']('short')).toBe(false);
    });
  });

  describe('sign up', () => {
    it('signs up with email and password', async () => {
      const user = await provider.signUpWithEmail('new@example.com', 'password123');

      expect(user).toBeDefined();
      expect(user.email).toBe('new@example.com');
    });
  });

  describe('sign out', () => {
    it('signs out and clears session', async () => {
      await provider.signInWithEmail('test@example.com', 'password123');
      expect(provider.user.get()).not.toBeNull();

      await provider.signOut();

      expect(provider.user.get()).toBeNull();
      expect(provider.session.get()).toBeNull();
    });
  });

  describe('token management', () => {
    it('returns token from session', async () => {
      await provider.signInWithEmail('test@example.com', 'password123');

      const token = await provider.getToken();
      expect(token).toBe('mock-token');
    });

    it('returns null when no session', async () => {
      const token = await provider.getToken();
      expect(token).toBeNull();
    });
  });
});

describe('AuthProviderFactory', () => {
  beforeEach(() => {
    // Clear registered providers
    AuthProviderFactory['providers'].clear();
  });

  it('registers a provider', () => {
    AuthProviderFactory.register('mock', MockAuthProvider);

    const providers = AuthProviderFactory.getProviders();
    expect(providers).toContain('mock');
  });

  it('creates a provider instance', () => {
    AuthProviderFactory.register('mock', MockAuthProvider);

    const provider = AuthProviderFactory.create({
      name: 'mock',
      config: {},
    });

    expect(provider).toBeInstanceOf(MockAuthProvider);
    expect(provider.name).toBe('mock');
  });

  it('throws error for unknown provider', () => {
    expect(() =>
      AuthProviderFactory.create({
        name: 'unknown',
        config: {},
      })
    ).toThrow('Unknown auth provider: unknown');
  });
});
