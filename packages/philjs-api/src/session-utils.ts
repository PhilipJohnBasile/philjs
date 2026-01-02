/**
 * PhilJS Session Utilities
 *
 * Helper functions and middleware for session management.
 */

import type { Session, SessionData, SessionStorage } from './session.js';

/**
 * Session middleware options
 */
export interface SessionMiddlewareOptions<T extends SessionData> {
  /** Session storage */
  storage: SessionStorage<T>;
  /** Auto-commit session on response */
  autoCommit?: boolean;
  /** Session key in request context */
  contextKey?: string;
}

/**
 * Extended request with session
 */
export interface RequestWithSession<T extends SessionData> extends Request {
  session?: Session<T>;
}

/**
 * Commit session helper
 *
 * Commits session changes and returns Set-Cookie header value.
 */
export async function commitSession<T extends SessionData>(
  storage: SessionStorage<T>,
  session: Session<T>
): Promise<string> {
  return storage.commitSession(session);
}

/**
 * Destroy session helper
 *
 * Destroys session and returns Set-Cookie header value for clearing the cookie.
 */
export async function destroySession<T extends SessionData>(
  storage: SessionStorage<T>,
  session: Session<T>
): Promise<string> {
  return storage.destroySession(session);
}

/**
 * Get or create session
 *
 * Gets existing session or creates a new one if it doesn't exist.
 */
export async function getOrCreateSession<T extends SessionData>(
  storage: SessionStorage<T>,
  request: Request
): Promise<Session<T>> {
  return storage.getSession(request);
}

/**
 * Require session
 *
 * Gets session or throws error if not found.
 */
export async function requireSession<T extends SessionData>(
  storage: SessionStorage<T>,
  request: Request,
  errorMessage = 'Session required'
): Promise<Session<T>> {
  const session = await storage.getSession(request);

  if (!session || Object.keys(session.data).length === 0) {
    throw new Error(errorMessage);
  }

  return session;
}

/**
 * Session middleware
 *
 * Automatically attaches session to request and commits on response.
 */
export function sessionMiddleware<T extends SessionData>(
  options: SessionMiddlewareOptions<T>
) {
  const { storage, autoCommit = true, contextKey = 'session' } = options;

  return async (request: Request, next: (req: Request) => Promise<Response>): Promise<Response> => {
    // Get session
    const session = await storage.getSession(request);

    // Attach to request (using a simple extension pattern)
    const requestWithSession = request as RequestWithSession<T>;
    requestWithSession.session = session;

    // Process request
    const response = await next(requestWithSession);

    // Auto-commit if enabled
    if (autoCommit) {
      const setCookie = await storage.commitSession(session);
      const headers = new Headers(response.headers);
      headers.append('Set-Cookie', setCookie);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    }

    return response;
  };
}

/**
 * Apply session to response
 *
 * Helper to commit session and apply Set-Cookie header to response.
 */
export async function applySessionToResponse<T extends SessionData>(
  storage: SessionStorage<T>,
  session: Session<T>,
  response: Response
): Promise<Response> {
  const setCookie = await storage.commitSession(session);
  const headers = new Headers(response.headers);
  headers.append('Set-Cookie', setCookie);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Clear session data
 *
 * Clears all session data without destroying the session.
 */
export function clearSessionData<T extends SessionData>(session: Session<T>): void {
  session.clear();
}

/**
 * Session value getter with default
 */
export function getSessionValue<T extends SessionData, K extends keyof T>(
  session: Session<T>,
  key: K,
  defaultValue: T[K]
): T[K] {
  const value = session.get(key);
  return value !== undefined ? value : defaultValue;
}

/**
 * Session value setter with validation
 */
export function setSessionValue<T extends SessionData, K extends keyof T>(
  session: Session<T>,
  key: K,
  value: T[K],
  validator?: (value: T[K]) => boolean
): boolean {
  if (validator && !validator(value)) {
    return false;
  }

  session.set(key, value);
  return true;
}

/**
 * Merge data into session
 */
export function mergeSessionData<T extends SessionData>(
  session: Session<T>,
  data: Partial<T>
): void {
  Object.entries(data).forEach(([key, value]) => {
    session.set(key as keyof T, value as T[keyof T]);
  });
}

/**
 * Session typing helper
 */
export type TypedSession<T extends SessionData> = Session<T>;

/**
 * Create typed session utilities
 */
export function createTypedSessionUtils<T extends SessionData>(storage: SessionStorage<T>) {
  return {
    /**
     * Get session
     */
    get: (request: Request) => storage.getSession(request),

    /**
     * Commit session
     */
    commit: (session: Session<T>) => storage.commitSession(session),

    /**
     * Destroy session
     */
    destroy: (session: Session<T>) => storage.destroySession(session),

    /**
     * Get or create session
     */
    getOrCreate: (request: Request) => getOrCreateSession(storage, request),

    /**
     * Require session
     */
    require: (request: Request, errorMessage?: string) =>
      requireSession(storage, request, errorMessage),

    /**
     * Apply to response
     */
    applyToResponse: (session: Session<T>, response: Response) =>
      applySessionToResponse(storage, session, response),

    /**
     * Get value with default
     */
    getValue: <K extends keyof T>(session: Session<T>, key: K, defaultValue: T[K]) =>
      getSessionValue(session, key, defaultValue),

    /**
     * Set value with validation
     */
    setValue: <K extends keyof T>(
      session: Session<T>,
      key: K,
      value: T[K],
      validator?: (value: T[K]) => boolean
    ) => setSessionValue(session, key, value, validator),

    /**
     * Merge data
     */
    merge: (session: Session<T>, data: Partial<T>) => mergeSessionData(session, data),

    /**
     * Clear data
     */
    clear: (session: Session<T>) => clearSessionData(session),

    /**
     * Create middleware
     */
    middleware: (options?: Omit<SessionMiddlewareOptions<T>, 'storage'>) =>
      sessionMiddleware({ ...options, storage }),
  };
}

/**
 * Session timeout middleware
 */
export function sessionTimeoutMiddleware<T extends SessionData & { lastActivity?: number }>(
  storage: SessionStorage<T>,
  timeoutSeconds: number
) {
  return async (request: Request, next: (req: Request) => Promise<Response>): Promise<Response> => {
    const session = await storage.getSession(request);
    const lastActivity = session.get('lastActivity' as keyof T) as number | undefined;

    // Check if session has timed out
    if (lastActivity) {
      const elapsed = (Date.now() - lastActivity) / 1000;
      if (elapsed > timeoutSeconds) {
        // Session timed out, destroy it
        const setCookie = await storage.destroySession(session);
        return new Response('Session expired', {
          status: 401,
          headers: {
            'Set-Cookie': setCookie,
          },
        });
      }
    }

    // Update last activity
    session.set('lastActivity' as keyof T, Date.now() as T[keyof T]);
    await storage.commitSession(session);

    const response = await next(request);

    // Commit session with updated activity
    const setCookie = await storage.commitSession(session);
    const headers = new Headers(response.headers);
    headers.append('Set-Cookie', setCookie);

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

/**
 * Session validator middleware
 */
export function sessionValidatorMiddleware<T extends SessionData>(
  storage: SessionStorage<T>,
  validator: (session: Session<T>) => boolean | Promise<boolean>
) {
  return async (request: Request, next: (req: Request) => Promise<Response>): Promise<Response> => {
    const session = await storage.getSession(request);
    const isValid = await validator(session);

    if (!isValid) {
      const setCookie = await storage.destroySession(session);
      return new Response('Invalid session', {
        status: 401,
        headers: {
          'Set-Cookie': setCookie,
        },
      });
    }

    return next(request);
  };
}

/**
 * Session regeneration
 *
 * Regenerates session ID while preserving data (useful after login/privilege escalation).
 */
export async function regenerateSession<T extends SessionData>(
  storage: SessionStorage<T>,
  oldSession: Session<T>
): Promise<Session<T>> {
  // Get the data
  const data = { ...oldSession.data } as T;
  const flashData: Partial<T> = {};

  return {
    id: generateNewSessionId(),
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
 * Generate new session ID
 */
function generateNewSessionId(): string {
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
