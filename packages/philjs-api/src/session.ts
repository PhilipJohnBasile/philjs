/**
 * PhilJS Session Management
 *
 * Server-side session handling with multiple storage backends.
 */

import { createSignedCookie, verifySignedCookie, serializeCookie, parseCookies } from './cookies';

export interface SessionData {
  [key: string]: unknown;
}

export interface Session<T extends SessionData = SessionData> {
  /** Session ID */
  id: string;
  /** Session data */
  data: T;
  /** Get a value */
  get<K extends keyof T>(key: K): T[K] | undefined;
  /** Set a value */
  set<K extends keyof T>(key: K, value: T[K]): void;
  /** Delete a value */
  delete<K extends keyof T>(key: K): void;
  /** Check if key exists */
  has<K extends keyof T>(key: K): boolean;
  /** Clear all data */
  clear(): void;
  /** Flash data (available for one request) */
  flash<K extends keyof T>(key: K, value: T[K]): void;
  /** Get flashed data */
  getFlash<K extends keyof T>(key: K): T[K] | undefined;
}

export interface SessionOptions {
  /** Cookie name */
  cookieName?: string;
  /** Cookie options */
  cookie?: {
    path?: string;
    domain?: string;
    secure?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
  };
  /** Secret for signing */
  secret: string;
}

export interface SessionStorage<T extends SessionData = SessionData> {
  /** Get session from request */
  getSession(request: Request): Promise<Session<T>>;
  /** Commit session changes */
  commitSession(session: Session<T>): Promise<string>;
  /** Destroy session */
  destroySession(session: Session<T>): Promise<string>;
}

/**
 * Create a session storage
 */
export function createSessionStorage<T extends SessionData = SessionData>(options: {
  cookie: SessionOptions;
  createData: (data: T, expiresAt?: Date) => Promise<string>;
  readData: (id: string) => Promise<T | null>;
  updateData: (id: string, data: T, expiresAt?: Date) => Promise<void>;
  deleteData: (id: string) => Promise<void>;
}): SessionStorage<T> {
  const { cookie: cookieOptions, createData, readData, updateData, deleteData } = options;

  return {
    async getSession(request: Request): Promise<Session<T>> {
      const cookies = parseCookies(request.headers.get('cookie') || '');
      const signedSessionId = cookies[cookieOptions.cookieName || 'session'];

      let sessionId: string | null = null;
      let data: T = {} as T;

      if (signedSessionId) {
        sessionId = verifySignedCookie(signedSessionId, cookieOptions.secret);
        if (sessionId) {
          const storedData = await readData(sessionId);
          if (storedData) {
            data = storedData;
          }
        }
      }

      const flashData: Partial<T> = {};

      return createSession(sessionId || generateSessionId(), data, flashData);
    },

    async commitSession(session: Session<T>): Promise<string> {
      if (session.id) {
        await updateData(session.id, session.data);
      } else {
        const newId = await createData(session.data);
        (session as any).id = newId;
      }

      const signedId = createSignedCookie(
        cookieOptions.cookieName || 'session',
        session.id,
        cookieOptions.secret
      );

      return serializeCookie(cookieOptions.cookieName || 'session', signedId, {
        path: cookieOptions.cookie?.path || '/',
        domain: cookieOptions.cookie?.domain,
        secure: cookieOptions.cookie?.secure ?? true,
        httpOnly: cookieOptions.cookie?.httpOnly ?? true,
        sameSite: cookieOptions.cookie?.sameSite || 'lax',
        maxAge: cookieOptions.cookie?.maxAge,
      });
    },

    async destroySession(session: Session<T>): Promise<string> {
      if (session.id) {
        await deleteData(session.id);
      }

      return serializeCookie(cookieOptions.cookieName || 'session', '', {
        path: cookieOptions.cookie?.path || '/',
        maxAge: 0,
      });
    },
  };
}

/**
 * Create a cookie-based session storage (stateless)
 */
export function createCookieSessionStorage<T extends SessionData = SessionData>(
  options: SessionOptions
): SessionStorage<T> {
  return {
    async getSession(request: Request): Promise<Session<T>> {
      const cookies = parseCookies(request.headers.get('cookie') || '');
      const signedData = cookies[options.cookieName || 'session'];

      let data: T = {} as T;

      if (signedData) {
        const rawData = verifySignedCookie(signedData, options.secret);
        if (rawData) {
          try {
            data = JSON.parse(rawData);
          } catch {
            data = {} as T;
          }
        }
      }

      return createSession(generateSessionId(), data, {});
    },

    async commitSession(session: Session<T>): Promise<string> {
      const jsonData = JSON.stringify(session.data);
      const signedData = createSignedCookie(
        options.cookieName || 'session',
        jsonData,
        options.secret
      );

      return serializeCookie(options.cookieName || 'session', signedData, {
        path: options.cookie?.path || '/',
        domain: options.cookie?.domain,
        secure: options.cookie?.secure ?? true,
        httpOnly: options.cookie?.httpOnly ?? true,
        sameSite: options.cookie?.sameSite || 'lax',
        maxAge: options.cookie?.maxAge,
      });
    },

    async destroySession(): Promise<string> {
      return serializeCookie(options.cookieName || 'session', '', {
        path: options.cookie?.path || '/',
        maxAge: 0,
      });
    },
  };
}

/**
 * Create a memory-based session storage (for development)
 */
export function createMemorySessionStorage<T extends SessionData = SessionData>(
  options: SessionOptions
): SessionStorage<T> {
  const sessions = new Map<string, { data: T; expiresAt?: Date }>();

  return createSessionStorage<T>({
    cookie: options,
    async createData(data, expiresAt) {
      const id = generateSessionId();
      sessions.set(id, { data, expiresAt });
      return id;
    },
    async readData(id) {
      const session = sessions.get(id);
      if (!session) return null;
      if (session.expiresAt && session.expiresAt < new Date()) {
        sessions.delete(id);
        return null;
      }
      return session.data;
    },
    async updateData(id, data, expiresAt) {
      sessions.set(id, { data, expiresAt });
    },
    async deleteData(id) {
      sessions.delete(id);
    },
  });
}

/**
 * Helper to get session from storage
 */
export async function getSession<T extends SessionData>(
  storage: SessionStorage<T>,
  request: Request
): Promise<Session<T>> {
  return storage.getSession(request);
}

/**
 * Helper to commit session
 */
export async function commitSession<T extends SessionData>(
  storage: SessionStorage<T>,
  session: Session<T>
): Promise<string> {
  return storage.commitSession(session);
}

/**
 * Helper to destroy session
 */
export async function destroySession<T extends SessionData>(
  storage: SessionStorage<T>,
  session: Session<T>
): Promise<string> {
  return storage.destroySession(session);
}

/**
 * Create a session object
 */
function createSession<T extends SessionData>(
  id: string,
  data: T,
  flashData: Partial<T>
): Session<T> {
  return {
    id,
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
      for (const key of Object.keys(data)) {
        delete data[key as keyof T];
      }
    },
    flash(key, value) {
      flashData[key] = value;
    },
    getFlash(key) {
      const value = flashData[key];
      delete flashData[key];
      return value;
    },
  };
}

/**
 * Generate a random session ID
 */
function generateSessionId(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}
