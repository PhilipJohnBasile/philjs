/**
 * PhilJS Rocket Cookies
 *
 * Cookie handling utilities for Rocket framework.
 * Provides typed cookie management with signing and encryption.
 */

// ============================================================================
// Cookie Types
// ============================================================================

/**
 * Cookie options
 */
export interface CookieOptions {
  /** Max age in seconds */
  maxAge?: number;
  /** Expiration date */
  expires?: Date;
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
}

/**
 * Cookie representation
 */
export interface Cookie {
  /** Cookie name */
  name: string;
  /** Cookie value */
  value: string;
  /** Cookie options */
  options?: CookieOptions;
}

/**
 * Private cookie (encrypted)
 */
export interface PrivateCookie extends Cookie {
  /** Whether the cookie is encrypted */
  encrypted: true;
}

/**
 * Cookie jar for managing cookies
 */
export interface CookieJar {
  /** Get a cookie by name */
  get(name: string): Cookie | undefined;
  /** Get a private (encrypted) cookie */
  getPrivate(name: string): Cookie | undefined;
  /** Set a cookie */
  add(cookie: Cookie): void;
  /** Set a private (encrypted) cookie */
  addPrivate(cookie: Cookie): void;
  /** Remove a cookie */
  remove(name: string): void;
  /** Remove a private cookie */
  removePrivate(name: string): void;
  /** Get all cookies */
  getAll(): Cookie[];
  /** Get Set-Cookie headers */
  getSetCookieHeaders(): string[];
}

// ============================================================================
// Cookie Implementation
// ============================================================================

/**
 * Parse a cookie header string into cookies
 */
export function parseCookies(cookieHeader: string): Map<string, string> {
  const cookies = new Map<string, string>();

  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name) {
      const value = rest.join('=');
      try {
        cookies.set(name.trim(), decodeURIComponent(value));
      } catch {
        cookies.set(name.trim(), value);
      }
    }
  });

  return cookies;
}

/**
 * Serialize a cookie to Set-Cookie header value
 */
export function serializeCookie(cookie: Cookie): string {
  const { name, value, options = {} } = cookie;

  let str = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (options.maxAge !== undefined) {
    str += `; Max-Age=${Math.floor(options.maxAge)}`;
  }

  if (options.expires) {
    str += `; Expires=${options.expires.toUTCString()}`;
  }

  if (options.path) {
    str += `; Path=${options.path}`;
  }

  if (options.domain) {
    str += `; Domain=${options.domain}`;
  }

  if (options.secure) {
    str += '; Secure';
  }

  if (options.httpOnly) {
    str += '; HttpOnly';
  }

  if (options.sameSite) {
    str += `; SameSite=${options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1)}`;
  }

  return str;
}

/**
 * Create a cookie jar
 */
export function createCookieJar(cookieHeader?: string): CookieJarImpl {
  return new CookieJarImpl(cookieHeader);
}

/**
 * Cookie jar implementation
 */
export class CookieJarImpl implements CookieJar {
  private cookies: Map<string, Cookie> = new Map();
  private privateCookies: Map<string, Cookie> = new Map();
  private setCookies: Cookie[] = [];
  private secretKey?: string;

  constructor(cookieHeader?: string, secretKey?: string) {
    if (secretKey !== undefined) {
      this.secretKey = secretKey;
    }

    if (cookieHeader) {
      const parsed = parseCookies(cookieHeader);
      parsed.forEach((value, name) => {
        this.cookies.set(name, { name, value });
      });
    }
  }

  /**
   * Set the secret key for private cookies
   */
  setSecretKey(key: string): void {
    this.secretKey = key;
  }

  /**
   * Get a cookie by name
   */
  get(name: string): Cookie | undefined {
    return this.cookies.get(name);
  }

  /**
   * Get a private (encrypted) cookie
   */
  getPrivate(name: string): Cookie | undefined {
    const cookie = this.cookies.get(name);
    if (!cookie || !this.secretKey) return undefined;

    try {
      const decrypted = this.decrypt(cookie.value);
      return { ...cookie, value: decrypted };
    } catch {
      return undefined;
    }
  }

  /**
   * Set a cookie
   */
  add(cookie: Cookie): void {
    // Apply default options
    const fullCookie: Cookie = {
      ...cookie,
      options: {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        ...cookie.options,
      },
    };

    this.cookies.set(cookie.name, fullCookie);
    this.setCookies.push(fullCookie);
  }

  /**
   * Set a private (encrypted) cookie
   */
  addPrivate(cookie: Cookie): void {
    if (!this.secretKey) {
      throw new Error('Secret key required for private cookies');
    }

    const encrypted = this.encrypt(cookie.value);
    const fullCookie: Cookie = {
      ...cookie,
      value: encrypted,
      options: {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        ...cookie.options,
      },
    };

    this.privateCookies.set(cookie.name, { ...cookie });
    this.cookies.set(cookie.name, fullCookie);
    this.setCookies.push(fullCookie);
  }

  /**
   * Remove a cookie
   */
  remove(name: string): void {
    this.cookies.delete(name);
    this.setCookies.push({
      name,
      value: '',
      options: {
        maxAge: 0,
        path: '/',
      },
    });
  }

  /**
   * Remove a private cookie
   */
  removePrivate(name: string): void {
    this.privateCookies.delete(name);
    this.remove(name);
  }

  /**
   * Get all cookies
   */
  getAll(): Cookie[] {
    return Array.from(this.cookies.values());
  }

  /**
   * Get Set-Cookie headers
   */
  getSetCookieHeaders(): string[] {
    return this.setCookies.map(serializeCookie);
  }

  /**
   * Apply cookies to a response
   */
  applyToResponse(response: Response): Response {
    const headers = new Headers(response.headers);

    for (const header of this.getSetCookieHeaders()) {
      headers.append('Set-Cookie', header);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  // Simple encryption for private cookies (use proper encryption in production)
  private encrypt(value: string): string {
    if (!this.secretKey) return value;

    // Simple XOR encryption (NOT SECURE - use proper encryption in production)
    const encoded = new TextEncoder().encode(value);
    const keyBytes = new TextEncoder().encode(this.secretKey);
    const result = new Uint8Array(encoded.length);

    for (let i = 0; i < encoded.length; i++) {
      result[i] = encoded[i]! ^ keyBytes[i % keyBytes.length]!;
    }

    return btoa(String.fromCharCode(...result));
  }

  private decrypt(encrypted: string): string {
    if (!this.secretKey) return encrypted;

    try {
      const decoded = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
      const keyBytes = new TextEncoder().encode(this.secretKey);
      const result = new Uint8Array(decoded.length);

      for (let i = 0; i < decoded.length; i++) {
        result[i] = decoded[i]! ^ keyBytes[i % keyBytes.length]!;
      }

      return new TextDecoder().decode(result);
    } catch {
      throw new Error('Failed to decrypt cookie');
    }
  }
}

// ============================================================================
// Cookie Helpers
// ============================================================================

/**
 * Create a cookie
 */
export function cookie(name: string, value: string, options?: CookieOptions): Cookie {
  const result: Cookie = { name, value };
  if (options !== undefined) {
    result.options = options;
  }
  return result;
}

/**
 * Create a session cookie (expires when browser closes)
 */
export function sessionCookie(name: string, value: string, options?: Omit<CookieOptions, 'maxAge' | 'expires'>): Cookie {
  return {
    name,
    value,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      ...options,
    },
  };
}

/**
 * Create a persistent cookie
 */
export function persistentCookie(
  name: string,
  value: string,
  maxAgeDays: number,
  options?: Omit<CookieOptions, 'maxAge'>
): Cookie {
  return {
    name,
    value,
    options: {
      maxAge: maxAgeDays * 24 * 60 * 60,
      httpOnly: true,
      sameSite: 'lax',
      ...options,
    },
  };
}

/**
 * Create a removal cookie
 */
export function removalCookie(name: string, options?: Pick<CookieOptions, 'path' | 'domain'>): Cookie {
  return {
    name,
    value: '',
    options: {
      maxAge: 0,
      path: '/',
      ...options,
    },
  };
}

// ============================================================================
// Cookie Signing
// ============================================================================

/**
 * Sign a cookie value
 */
export async function signCookie(value: string, secret: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
    return `${value}.${signatureBase64}`;
  }

  // Fallback without crypto.subtle
  return `${value}.${simpleHash(value + secret)}`;
}

/**
 * Verify a signed cookie value
 */
export async function verifyCookie(signedValue: string, secret: string): Promise<string | null> {
  const parts = signedValue.split('.');
  if (parts.length !== 2) return null;

  const [value, signature] = parts;
  if (value === undefined || signature === undefined) return null;

  const expectedSigned = await signCookie(value, secret);
  const [, expectedSignature] = expectedSigned.split('.');
  if (expectedSignature === undefined) return null;

  // Timing-safe comparison
  if (signature.length !== expectedSignature.length) return null;

  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return mismatch === 0 ? value : null;
}

/**
 * Simple hash function fallback
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ============================================================================
// Flash Messages
// ============================================================================

/**
 * Flash message type
 */
export interface FlashMessage {
  kind: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

/**
 * Flash cookie name
 */
const FLASH_COOKIE_NAME = '_flash';

/**
 * Set a flash message
 */
export function setFlash(jar: CookieJar, kind: FlashMessage['kind'], message: string): void {
  const flash: FlashMessage = { kind, message };
  jar.add({
    name: FLASH_COOKIE_NAME,
    value: JSON.stringify(flash),
    options: {
      path: '/',
      httpOnly: true,
      maxAge: 60, // Short-lived
    },
  });
}

/**
 * Get and consume a flash message
 */
export function getFlash(jar: CookieJar): FlashMessage | null {
  const cookie = jar.get(FLASH_COOKIE_NAME);
  if (!cookie) return null;

  // Remove the flash cookie
  jar.remove(FLASH_COOKIE_NAME);

  try {
    return JSON.parse(cookie.value) as FlashMessage;
  } catch {
    return null;
  }
}

/**
 * Set a success flash message
 */
export function flashSuccess(jar: CookieJar, message: string): void {
  setFlash(jar, 'success', message);
}

/**
 * Set an error flash message
 */
export function flashError(jar: CookieJar, message: string): void {
  setFlash(jar, 'error', message);
}

/**
 * Set an info flash message
 */
export function flashInfo(jar: CookieJar, message: string): void {
  setFlash(jar, 'info', message);
}

/**
 * Set a warning flash message
 */
export function flashWarning(jar: CookieJar, message: string): void {
  setFlash(jar, 'warning', message);
}

// ============================================================================
// Rust Code Generation
// ============================================================================

/**
 * Generate Rust cookie handling code
 */
export function generateRustCookieCode(): string {
  return `
use rocket::http::{Cookie, CookieJar, SameSite};
use rocket::request::{FromRequest, Outcome};
use rocket::Request;
use serde::{Serialize, Deserialize};

/// Cookie helper for PhilJS
pub struct PhilJsCookies<'r> {
    jar: &'r CookieJar<'r>,
}

impl<'r> PhilJsCookies<'r> {
    /// Get a cookie value
    pub fn get(&self, name: &str) -> Option<String> {
        self.jar.get(name).map(|c| c.value().to_string())
    }

    /// Get a private (encrypted) cookie value
    pub fn get_private(&self, name: &str) -> Option<String> {
        self.jar.get_private(name).map(|c| c.value().to_string())
    }

    /// Set a cookie
    pub fn set(&self, name: &str, value: &str) {
        self.jar.add(Cookie::new(name.to_string(), value.to_string()));
    }

    /// Set a cookie with options
    pub fn set_with_options(
        &self,
        name: &str,
        value: &str,
        max_age: Option<i64>,
        path: Option<&str>,
        secure: bool,
        http_only: bool,
        same_site: SameSite,
    ) {
        let mut cookie = Cookie::new(name.to_string(), value.to_string());

        if let Some(age) = max_age {
            cookie.set_max_age(rocket::time::Duration::seconds(age));
        }
        if let Some(p) = path {
            cookie.set_path(p.to_string());
        }
        cookie.set_secure(secure);
        cookie.set_http_only(http_only);
        cookie.set_same_site(same_site);

        self.jar.add(cookie);
    }

    /// Set a private (encrypted) cookie
    pub fn set_private(&self, name: &str, value: &str) {
        self.jar.add_private(Cookie::new(name.to_string(), value.to_string()));
    }

    /// Remove a cookie
    pub fn remove(&self, name: &str) {
        self.jar.remove(Cookie::from(name.to_string()));
    }

    /// Remove a private cookie
    pub fn remove_private(&self, name: &str) {
        self.jar.remove_private(Cookie::from(name.to_string()));
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for PhilJsCookies<'r> {
    type Error = std::convert::Infallible;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        Outcome::Success(PhilJsCookies {
            jar: request.cookies(),
        })
    }
}

/// Flash message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FlashMessage {
    pub kind: String,
    pub message: String,
}

impl FlashMessage {
    pub fn new(kind: &str, message: &str) -> Self {
        Self {
            kind: kind.to_string(),
            message: message.to_string(),
        }
    }

    pub fn success(message: &str) -> Self {
        Self::new("success", message)
    }

    pub fn error(message: &str) -> Self {
        Self::new("error", message)
    }

    pub fn info(message: &str) -> Self {
        Self::new("info", message)
    }

    pub fn warning(message: &str) -> Self {
        Self::new("warning", message)
    }
}

/// Set a flash message
pub fn set_flash(cookies: &CookieJar<'_>, flash: FlashMessage) {
    let json = serde_json::to_string(&flash).unwrap_or_default();
    let mut cookie = Cookie::new("_flash", json);
    cookie.set_max_age(rocket::time::Duration::seconds(60));
    cookie.set_http_only(true);
    cookie.set_path("/");
    cookies.add(cookie);
}

/// Get and consume a flash message
pub fn get_flash(cookies: &CookieJar<'_>) -> Option<FlashMessage> {
    let cookie = cookies.get("_flash")?;
    let flash: FlashMessage = serde_json::from_str(cookie.value()).ok()?;
    cookies.remove(Cookie::from("_flash"));
    Some(flash)
}
`.trim();
}
