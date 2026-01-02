import { describe, it, expect, beforeEach } from 'vitest';
import { SessionManager } from './session.js';

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    localStorage.clear();
    sessionManager = new SessionManager();
  });

  it('should initialize with no user', () => {
    expect(sessionManager.session().user).toBeNull();
    expect(sessionManager.isAuthenticated()).toBe(false);
  });

  it('should set session', () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test User' };
    sessionManager.setSession(user, 'token123', 3600000);

    expect(sessionManager.session().user).toEqual(user);
    expect(sessionManager.session().token).toBe('token123');
    expect(sessionManager.isAuthenticated()).toBe(true);
  });

  it('should update user', () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test User' };
    sessionManager.setSession(user);

    sessionManager.updateUser({ name: 'Updated Name' });

    expect(sessionManager.user()?.name).toBe('Updated Name');
    expect(sessionManager.user()?.email).toBe('test@example.com');
  });

  it('should clear session', () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test User' };
    sessionManager.setSession(user);

    sessionManager.clearSession();

    expect(sessionManager.session().user).toBeNull();
    expect(sessionManager.isAuthenticated()).toBe(false);
  });

  it('should detect expired session', () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test User' };
    sessionManager.setSession(user, 'token', -1000); // Expired

    expect(sessionManager.isExpired()).toBe(true);
    expect(sessionManager.isAuthenticated()).toBe(false);
  });

  it('should refresh session', () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test User' };
    sessionManager.setSession(user, 'token', 1000);

    const oldExpiry = sessionManager.session().expiresAt;

    sessionManager.refreshSession(5000);

    const newExpiry = sessionManager.session().expiresAt;
    expect(newExpiry).toBeGreaterThan(oldExpiry!);
  });

  it('should persist session to localStorage', () => {
    const manager = new SessionManager({ storeTokenClientSide: true });
    const user = { id: '1', email: 'test@example.com', name: 'Test User' };
    manager.setSession(user, 'token123');

    const stored = localStorage.getItem('philjs_session');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.user).toEqual(user);
    expect(parsed.token).toBe('token123');
  });

  it('should load session from localStorage', () => {
    const user = { id: '1', email: 'test@example.com', name: 'Test User' };
    const session = {
      user,
      token: 'token123',
      expiresAt: Date.now() + 3600000
    };

    localStorage.setItem('philjs_session', JSON.stringify(session));

    const newManager = new SessionManager({ storeTokenClientSide: true });
    expect(newManager.session().user).toEqual(user);
    expect(newManager.session().token).toBe('token123');
  });
});
