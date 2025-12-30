/**
 * PhilJS Enhanced Cookie Sessions
 *
 * Secure cookie-based sessions with signing, encryption, rotation, and CSRF protection.
 */

import { createHmac, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import type { SessionData, Session, SessionStorage } from './session.js';
import { serializeCookie, parseCookies } from './cookies.js';

/**
 * Cookie session options
 */
export interface CookieSessionOptions {
  /** Cookie name */
  name?: string;
  /** Secret for signing (min 32 chars recommended) */
  secret: string;
  /** Optional encryption secret (min 32 chars, enables encryption) */
  encryptionSecret?: string;
  /** Cookie path */
  path?: string;
  /** Cookie domain */
  domain?: string;
  /** HTTPS only */
  secure?: boolean;
  /** HTTP only (no JS access) */
  httpOnly?: boolean;
  /** Same-site policy */
  sameSite?: 'strict' | 'lax' | 'none';
  /** Max age in seconds */
  maxAge?: number;
  /** Enable session rotation */
  rotate?: boolean;
  /** Rotation interval in seconds */
  rotateInterval?: number;
  /** Enable CSRF protection */
  csrf?: boolean;
  /** CSRF token field name */
  csrfFieldName?: string;
}

/**
 * Cookie session storage implementation
 */
export interface CookieSessionStorage<T extends SessionData> extends SessionStorage<T> {
  /** Verify CSRF token */
  verifyCSRF(request: Request, token: string): Promise<boolean>;
  /** Generate CSRF token */
  generateCSRF(session: Session<T>): string;
  /** Rotate session */
  rotateSession(session: Session<T>): void;
}

/**
 * Internal session data with metadata
 */
interface InternalSessionData<T extends SessionData> extends SessionData {
  /** User data */
  data: T;
  /** Creation timestamp */
  createdAt: number;
  /** Last rotation timestamp */
  rotatedAt?: number;
  /** CSRF token */
  csrfToken?: string;
}

/**
 * Create enhanced cookie-based session storage
 */
export function createCookieSessionStorage<T extends SessionData = SessionData>(
  options: CookieSessionOptions
): CookieSessionStorage<T> {
  const {
    name = 'session',
    secret,
    encryptionSecret,
    path = '/',
    domain,
    secure = true,
    httpOnly = true,
    sameSite = 'lax',
    maxAge,
    rotate = false,
    rotateInterval = 3600, // 1 hour default
    csrf = true,
    csrfFieldName = 'csrf_token',
  } = options;

  // Validate secrets
  if (secret.length < 32) {
    throw new Error('Session secret must be at least 32 characters long');
  }

  if (encryptionSecret && encryptionSecret.length < 32) {
    throw new Error('Encryption secret must be at least 32 characters long');
  }

  /**
   * Encrypt data
   */
  function encrypt(data: string): string {
    if (!encryptionSecret) return data;

    const iv = randomBytes(16);
    const key = deriveKey(encryptionSecret);
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(data, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    // Format: iv.authTag.encrypted
    return `${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted}`;
  }

  /**
   * Decrypt data
   */
  function decrypt(encryptedData: string): string | null {
    if (!encryptionSecret) return encryptedData;

    try {
      const [ivB64, authTagB64, encrypted] = encryptedData.split('.');
      if (!ivB64 || !authTagB64 || !encrypted) return null;

      const iv = Buffer.from(ivB64, 'base64');
      const authTag = Buffer.from(authTagB64, 'base64');
      const key = deriveKey(encryptionSecret);

      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch {
      return null;
    }
  }

  /**
   * Sign data
   */
  function sign(data: string): string {
    const signature = createHmac('sha256', secret).update(data).digest('base64url');
    return `${data}.${signature}`;
  }

  /**
   * Verify and unsign data
   */
  function unsign(signedData: string): string | null {
    const lastDotIndex = signedData.lastIndexOf('.');
    if (lastDotIndex === -1) return null;

    const data = signedData.slice(0, lastDotIndex);
    const signature = signedData.slice(lastDotIndex + 1);

    const expectedSignature = createHmac('sha256', secret).update(data).digest('base64url');

    // Timing-safe comparison
    if (signature.length !== expectedSignature.length) return null;
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null;

    return data;
  }

  /**
   * Serialize session data
   */
  function serialize(sessionData: InternalSessionData<T>): string {
    const json = JSON.stringify(sessionData);
    const encrypted = encrypt(json);
    const signed = sign(encrypted);
    return signed;
  }

  /**
   * Deserialize session data
   */
  function deserialize(cookieValue: string): InternalSessionData<T> | null {
    const unsigned = unsign(cookieValue);
    if (!unsigned) return null;

    const decrypted = decrypt(unsigned);
    if (!decrypted) return null;

    try {
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  /**
   * Check if session needs rotation
   */
  function needsRotation(sessionData: InternalSessionData<T>): boolean {
    if (!rotate) return false;

    const lastRotation = sessionData.rotatedAt || sessionData.createdAt;
    const elapsed = (Date.now() - lastRotation) / 1000;

    return elapsed > rotateInterval;
  }

  /**
   * Create session object
   */
  function createSession(sessionData: InternalSessionData<T>): Session<T> {
    return {
      id: generateSessionId(),
      data: sessionData.data,
      get<K extends keyof T>(key: K): T[K] | undefined {
        return sessionData.data[key];
      },
      set<K extends keyof T>(key: K, value: T[K]): void {
        sessionData.data[key] = value;
      },
      delete<K extends keyof T>(key: K): void {
        delete sessionData.data[key];
      },
      has<K extends keyof T>(key: K): boolean {
        return key in sessionData.data;
      },
      clear(): void {
        sessionData.data = {} as T;
      },
      flash<K extends keyof T>(key: K, value: T[K]): void {
        // Flash implementation can use a special key
        (sessionData.data as any)[`__flash_${String(key)}`] = value;
      },
      getFlash<K extends keyof T>(key: K): T[K] | undefined {
        const flashKey = `__flash_${String(key)}` as keyof T;
        const value = sessionData.data[flashKey] as T[K] | undefined;
        delete sessionData.data[flashKey];
        return value;
      },
    };
  }

  // Implementation
  const storage: CookieSessionStorage<T> = {
    async getSession(request: Request): Promise<Session<T>> {
      const cookies = parseCookies(request.headers.get('cookie') || '');
      const cookieValue = cookies[name];

      let sessionData: InternalSessionData<T>;

      if (cookieValue) {
        const deserialized = deserialize(cookieValue);
        if (deserialized) {
          sessionData = deserialized;
        } else {
          // Invalid/tampered session, create new
          sessionData = createInitialSessionData();
        }
      } else {
        sessionData = createInitialSessionData();
      }

      return createSession(sessionData);
    },

    async commitSession(session: Session<T>): Promise<string> {
      const sessionData: InternalSessionData<T> = {
        data: session.data,
        createdAt: Date.now(),
        rotatedAt: Date.now(),
      };
      if (csrf) {
        sessionData.csrfToken = generateCSRFToken();
      }

      // Rotate if needed
      if (needsRotation(sessionData)) {
        storage.rotateSession(session);
      }

      const serialized = serialize(sessionData);

      const cookieOpts: Parameters<typeof serializeCookie>[2] = {
        path,
        secure,
        httpOnly,
        sameSite,
      };
      if (domain !== undefined) {
        cookieOpts.domain = domain;
      }
      if (maxAge !== undefined) {
        cookieOpts.maxAge = maxAge;
      }

      return serializeCookie(name, serialized, cookieOpts);
    },

    async destroySession(): Promise<string> {
      return serializeCookie(name, '', {
        path,
        maxAge: 0,
      });
    },

    async verifyCSRF(request: Request, token: string): Promise<boolean> {
      if (!csrf) return true;

      const session = await storage.getSession(request);
      const cookies = parseCookies(request.headers.get('cookie') || '');
      const cookieValue = cookies[name];

      if (!cookieValue) return false;

      const sessionData = deserialize(cookieValue);
      if (!sessionData || !sessionData.csrfToken) return false;

      return timingSafeEqual(
        Buffer.from(token),
        Buffer.from(sessionData.csrfToken)
      );
    },

    generateCSRF(session: Session<T>): string {
      if (!csrf) {
        throw new Error('CSRF protection is not enabled');
      }

      return generateCSRFToken();
    },

    rotateSession(session: Session<T>): void {
      // Create new session with rotated timestamp
      // This is called automatically during commit if rotation is enabled
      (session as any).rotatedAt = Date.now();
    },
  };

  return storage;
}

/**
 * Create initial session data
 */
function createInitialSessionData<T extends SessionData>(): InternalSessionData<T> {
  return {
    data: {} as T,
    createdAt: Date.now(),
  };
}

/**
 * Generate CSRF token
 */
function generateCSRFToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Generate session ID
 */
function generateSessionId(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Derive encryption key from secret
 */
function deriveKey(secret: string): Buffer {
  return createHmac('sha256', secret).update('encryption').digest();
}

/**
 * Timing-safe comparison
 */
function timingSafeEqual(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i]! ^ b[i]!;
  }

  return result === 0;
}

/**
 * CSRF middleware
 */
export function csrfMiddleware<T extends SessionData>(
  storage: CookieSessionStorage<T>
) {
  return async (request: Request, next: () => Promise<Response>): Promise<Response> => {
    // Only check CSRF for state-changing methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const token = request.headers.get('X-CSRF-Token') ||
                    request.headers.get('X-Requested-With');

      if (!token) {
        return new Response('CSRF token missing', { status: 403 });
      }

      const isValid = await storage.verifyCSRF(request, token);
      if (!isValid) {
        return new Response('CSRF token invalid', { status: 403 });
      }
    }

    return next();
  };
}

/**
 * Session rotation middleware
 */
export function sessionRotationMiddleware<T extends SessionData>(
  storage: CookieSessionStorage<T>
) {
  return async (request: Request, next: () => Promise<Response>): Promise<Response> => {
    const session = await storage.getSession(request);

    // Rotate session
    storage.rotateSession(session);

    const response = await next();

    // Commit rotated session
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
