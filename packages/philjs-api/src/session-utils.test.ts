/**
 * Session Utilities Tests
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  commitSession,
  destroySession,
  getOrCreateSession,
  requireSession,
  sessionMiddleware,
  applySessionToResponse,
  clearSessionData,
  getSessionValue,
  setSessionValue,
  mergeSessionData,
  createTypedSessionUtils,
  sessionTimeoutMiddleware,
  sessionValidatorMiddleware,
  regenerateSession,
  type RequestWithSession,
} from './session-utils';
import type { Session, SessionData, SessionStorage } from './session';

interface TestSessionData extends SessionData {
  userId?: string;
  username?: string;
  count?: number;
  lastActivity?: number;
}

// Mock session storage
function createMockStorage(): SessionStorage<TestSessionData> {
  const sessions = new Map<string, TestSessionData>();

  return {
    async getSession(request: Request): Promise<Session<TestSessionData>> {
      const sessionId = 'test-session-id';
      const data = sessions.get(sessionId) || {};

      return {
        id: sessionId,
        data,
        get(key) {
          return data[key];
        },
        set(key, value) {
          data[key] = value;
        },
        delete(key) {
          delete data[key];
        },
        has(key) {
          return key in data;
        },
        clear() {
          Object.keys(data).forEach(k => delete data[k as keyof TestSessionData]);
        },
        flash(key, value) {
          data[key] = value;
        },
        getFlash(key) {
          const value = data[key];
          delete data[key];
          return value;
        },
      };
    },

    async commitSession(session: Session<TestSessionData>): Promise<string> {
      sessions.set(session.id, session.data);
      return `session=${session.id}; Path=/; HttpOnly`;
    },

    async destroySession(session: Session<TestSessionData>): Promise<string> {
      sessions.delete(session.id);
      return `session=; Path=/; Max-Age=0`;
    },
  };
}

describe('Session Utilities', () => {
  let storage: SessionStorage<TestSessionData>;
  let request: Request;

  beforeEach(() => {
    storage = createMockStorage();
    request = new Request('http://localhost/');
  });

  describe('commitSession', () => {
    it('should commit session', async () => {
      const session = await storage.getSession(request);
      session.set('userId', '123');

      const setCookie = await commitSession(storage, session);

      expect(setCookie).toContain('session=');
      expect(setCookie).toContain('Path=/');
    });
  });

  describe('destroySession', () => {
    it('should destroy session', async () => {
      const session = await storage.getSession(request);

      const setCookie = await destroySession(storage, session);

      expect(setCookie).toContain('Max-Age=0');
    });
  });

  describe('getOrCreateSession', () => {
    it('should get existing session', async () => {
      const session = await getOrCreateSession(storage, request);

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
    });

    it('should create new session if none exists', async () => {
      const session = await getOrCreateSession(storage, request);

      expect(session).toBeDefined();
      expect(session.data).toEqual({});
    });
  });

  describe('requireSession', () => {
    it('should return session if exists', async () => {
      // Set up session with data
      const session1 = await storage.getSession(request);
      session1.set('userId', '123');
      await storage.commitSession(session1);

      const session2 = await requireSession(storage, request);

      expect(session2).toBeDefined();
    });

    it('should throw if session is empty', async () => {
      await expect(requireSession(storage, request)).rejects.toThrow('Session required');
    });

    it('should use custom error message', async () => {
      await expect(
        requireSession(storage, request, 'Custom error')
      ).rejects.toThrow('Custom error');
    });
  });

  describe('sessionMiddleware', () => {
    it('should attach session to request', async () => {
      const middleware = sessionMiddleware({ storage });

      let capturedRequest: Request | null = null;

      await middleware(request, async (req) => {
        capturedRequest = req;
        return new Response('OK');
      });

      expect((capturedRequest as RequestWithSession<TestSessionData>)?.session).toBeDefined();
    });

    it('should auto-commit session by default', async () => {
      const middleware = sessionMiddleware({ storage });

      const response = await middleware(request, async (req) => {
        const reqWithSession = req as RequestWithSession<TestSessionData>;
        reqWithSession.session?.set('userId', '123');
        return new Response('OK');
      });

      expect(response.headers.has('Set-Cookie')).toBe(true);
    });

    it('should not auto-commit when disabled', async () => {
      const middleware = sessionMiddleware({ storage, autoCommit: false });

      const response = await middleware(request, async () => {
        return new Response('OK');
      });

      expect(response.headers.has('Set-Cookie')).toBe(false);
    });
  });

  describe('applySessionToResponse', () => {
    it('should add Set-Cookie header to response', async () => {
      const session = await storage.getSession(request);
      session.set('userId', '123');

      const originalResponse = new Response('OK');
      const response = await applySessionToResponse(storage, session, originalResponse);

      expect(response.headers.has('Set-Cookie')).toBe(true);
    });

    it('should preserve response body and status', async () => {
      const session = await storage.getSession(request);
      const originalResponse = new Response('Test Body', { status: 201 });

      const response = await applySessionToResponse(storage, session, originalResponse);

      expect(response.status).toBe(201);
      expect(await response.text()).toBe('Test Body');
    });
  });

  describe('clearSessionData', () => {
    it('should clear all session data', async () => {
      const session = await storage.getSession(request);
      session.set('userId', '123');
      session.set('username', 'test');

      clearSessionData(session);

      expect(session.get('userId')).toBeUndefined();
      expect(session.get('username')).toBeUndefined();
    });
  });

  describe('getSessionValue', () => {
    it('should get existing value', async () => {
      const session = await storage.getSession(request);
      session.set('userId', '123');

      const value = getSessionValue(session, 'userId', 'default');

      expect(value).toBe('123');
    });

    it('should return default for missing value', async () => {
      const session = await storage.getSession(request);

      const value = getSessionValue(session, 'userId', 'default');

      expect(value).toBe('default');
    });
  });

  describe('setSessionValue', () => {
    it('should set value without validator', async () => {
      const session = await storage.getSession(request);

      const result = setSessionValue(session, 'userId', '123');

      expect(result).toBe(true);
      expect(session.get('userId')).toBe('123');
    });

    it('should validate before setting', async () => {
      const session = await storage.getSession(request);
      const validator = (value: number) => value > 0;

      const result1 = setSessionValue(session, 'count', 5, validator);
      expect(result1).toBe(true);
      expect(session.get('count')).toBe(5);

      const result2 = setSessionValue(session, 'count', -1, validator);
      expect(result2).toBe(false);
      expect(session.get('count')).toBe(5); // Should not change
    });
  });

  describe('mergeSessionData', () => {
    it('should merge data into session', async () => {
      const session = await storage.getSession(request);
      session.set('userId', '123');

      mergeSessionData(session, {
        username: 'testuser',
        count: 5,
      });

      expect(session.get('userId')).toBe('123');
      expect(session.get('username')).toBe('testuser');
      expect(session.get('count')).toBe(5);
    });

    it('should overwrite existing values', async () => {
      const session = await storage.getSession(request);
      session.set('count', 1);

      mergeSessionData(session, { count: 5 });

      expect(session.get('count')).toBe(5);
    });
  });

  describe('createTypedSessionUtils', () => {
    it('should create utility object', async () => {
      const utils = createTypedSessionUtils(storage);

      expect(typeof utils.get).toBe('function');
      expect(typeof utils.commit).toBe('function');
      expect(typeof utils.destroy).toBe('function');
      expect(typeof utils.getOrCreate).toBe('function');
      expect(typeof utils.require).toBe('function');
    });

    it('should work with all utility methods', async () => {
      const utils = createTypedSessionUtils(storage);

      const session = await utils.get(request);
      session.set('userId', '123');

      const value = utils.getValue(session, 'userId', 'default');
      expect(value).toBe('123');

      utils.merge(session, { username: 'test' });
      expect(session.get('username')).toBe('test');

      const setCookie = await utils.commit(session);
      expect(setCookie).toContain('session=');
    });
  });

  describe('sessionTimeoutMiddleware', () => {
    it('should allow request within timeout', async () => {
      const middleware = sessionTimeoutMiddleware(storage, 3600);

      const response = await middleware(request, async () => {
        return new Response('OK');
      });

      expect(response.status).toBe(200);
    });

    it('should update last activity', async () => {
      const middleware = sessionTimeoutMiddleware(storage, 3600);

      let session: Session<TestSessionData> | undefined;

      await middleware(request, async (req) => {
        session = await storage.getSession(req);
        return new Response('OK');
      });

      expect(session?.get('lastActivity')).toBeDefined();
    });

    it('should reject expired session', async () => {
      // Create session with old activity
      const session1 = await storage.getSession(request);
      session1.set('lastActivity', Date.now() - 7200000); // 2 hours ago
      await storage.commitSession(session1);

      const middleware = sessionTimeoutMiddleware(storage, 3600); // 1 hour timeout

      const response = await middleware(request, async () => {
        return new Response('OK');
      });

      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Session expired');
    });
  });

  describe('sessionValidatorMiddleware', () => {
    it('should allow valid session', async () => {
      const validator = (session: Session<TestSessionData>) => {
        return session.get('userId') !== undefined;
      };

      const session = await storage.getSession(request);
      session.set('userId', '123');
      await storage.commitSession(session);

      const middleware = sessionValidatorMiddleware(storage, validator);

      const response = await middleware(request, async () => {
        return new Response('OK');
      });

      expect(response.status).toBe(200);
    });

    it('should reject invalid session', async () => {
      const validator = (session: Session<TestSessionData>) => {
        return session.get('userId') !== undefined;
      };

      const middleware = sessionValidatorMiddleware(storage, validator);

      const response = await middleware(request, async () => {
        return new Response('OK');
      });

      expect(response.status).toBe(401);
      expect(await response.text()).toBe('Invalid session');
    });

    it('should support async validator', async () => {
      const validator = async (session: Session<TestSessionData>) => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return true;
      };

      const middleware = sessionValidatorMiddleware(storage, validator);

      const response = await middleware(request, async () => {
        return new Response('OK');
      });

      expect(response.status).toBe(200);
    });
  });

  describe('regenerateSession', () => {
    it('should create new session with same data', async () => {
      const oldSession = await storage.getSession(request);
      oldSession.set('userId', '123');
      oldSession.set('username', 'test');

      const newSession = await regenerateSession(storage, oldSession);

      expect(newSession.id).not.toBe(oldSession.id);
      expect(newSession.get('userId')).toBe('123');
      expect(newSession.get('username')).toBe('test');
    });

    it('should not affect old session data', async () => {
      const oldSession = await storage.getSession(request);
      oldSession.set('userId', '123');

      const newSession = await regenerateSession(storage, oldSession);
      newSession.set('userId', '456');

      expect(oldSession.get('userId')).toBe('123');
      expect(newSession.get('userId')).toBe('456');
    });
  });
});
