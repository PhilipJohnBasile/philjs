/**
 * Auth Hooks Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from 'philjs-core/signals';
import { setAuthProvider, useUser, useAuth, useHasPermission } from './hooks.js';
import { BaseAuthProvider } from './auth-provider.js';
import type { User, AuthSession } from './types.js';

class MockAuthProvider extends BaseAuthProvider {
  readonly name = 'mock';
  readonly user = signal<User | null>(null);
  readonly session = signal<AuthSession | null>(null);
  readonly loading = signal(false);

  async initialize(): Promise<void> {}

  async signInWithEmail(email: string, password: string): Promise<User> {
    const user: User = {
      id: '1',
      email,
      name: 'Test User',
    };
    this.user.set(user);
    return user;
  }

  async signUpWithEmail(email: string, password: string): Promise<User> {
    return this.signInWithEmail(email, password);
  }

  async signOut(): Promise<void> {
    this.user.set(null);
  }

  async getToken(): Promise<string | null> {
    return 'mock-token';
  }
}

describe('Auth Hooks', () => {
  let provider: MockAuthProvider;

  beforeEach(() => {
    provider = new MockAuthProvider({});
    setAuthProvider(provider);
  });

  describe('useUser', () => {
    it('returns null when not authenticated', () => {
      const user = useUser();
      expect(user).toBeNull();
    });

    it('returns user when authenticated', async () => {
      await provider.signInWithEmail('test@example.com', 'password');

      const user = useUser();
      expect(user).not.toBeNull();
      expect(user?.email).toBe('test@example.com');
    });
  });

  describe('useAuth', () => {
    it('provides auth methods', () => {
      const auth = useAuth();

      expect(auth).toHaveProperty('signIn');
      expect(auth).toHaveProperty('signUp');
      expect(auth).toHaveProperty('signOut');
      expect(auth).toHaveProperty('getToken');
    });

    it('signs in successfully', async () => {
      const auth = useAuth();
      const user = await auth.signIn('test@example.com', 'password');

      expect(user.email).toBe('test@example.com');
      expect(auth.isAuthenticated).toBe(true);
    });

    it('signs out successfully', async () => {
      const auth = useAuth();
      await auth.signIn('test@example.com', 'password');

      expect(auth.isAuthenticated).toBe(true);

      await auth.signOut();

      expect(useUser()).toBeNull();
    });

    it('gets token', async () => {
      const auth = useAuth();
      await auth.signIn('test@example.com', 'password');

      const token = await auth.getToken();
      expect(token).toBe('mock-token');
    });
  });

  describe('useHasPermission', () => {
    it('returns false when not authenticated', () => {
      const hasPermission = useHasPermission('admin');
      expect(hasPermission).toBe(false);
    });

    it('checks role in metadata', async () => {
      const user: User = {
        id: '1',
        email: 'admin@example.com',
        metadata: { role: 'admin' },
      };

      provider.user.set(user);

      const hasPermission = useHasPermission('admin');
      expect(hasPermission).toBe(true);
    });

    it('checks permissions array in metadata', async () => {
      const user: User = {
        id: '1',
        email: 'user@example.com',
        metadata: { permissions: ['read', 'write'] },
      };

      provider.user.set(user);

      expect(useHasPermission('read')).toBe(true);
      expect(useHasPermission('write')).toBe(true);
      expect(useHasPermission('delete')).toBe(false);
    });
  });
});
