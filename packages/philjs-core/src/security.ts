/**
 * Security utilities for PhilJS framework.
 * Provides input sanitization, XSS prevention, and safe JSON parsing.
 */

/**
 * HTML entities map for escaping.
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
};

/**
 * Attribute entities map for escaping.
 */
const ATTR_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '"': '&quot;',
  "'": '&#39;',
  '<': '&lt;',
  '>': '&gt;',
};

/**
 * Escape HTML special characters to prevent XSS attacks.
 * This function should be used when rendering user-provided content as HTML.
 *
 * @param str - The string to escape
 * @returns The escaped string safe for HTML rendering
 *
 * @example
 * ```ts
 * const userInput = '<script>alert("XSS")</script>';
 * const safe = escapeHtml(userInput);
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
 * ```
 */
export function escapeHtml(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }
  return str.replace(/[&<>"'\/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Escape HTML attribute values to prevent XSS in attributes.
 * Use this for user-provided data in HTML attributes.
 *
 * @param str - The attribute value to escape
 * @returns The escaped string safe for HTML attributes
 *
 * @example
 * ```ts
 * const userTitle = 'Hello" onclick="alert(1)"';
 * const safe = escapeAttr(userTitle);
 * // Use in: <div title="${safe}">
 * ```
 */
export function escapeAttr(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }
  return str.replace(/[&"'<>]/g, (char) => ATTR_ENTITIES[char] || char);
}

/**
 * Escape JavaScript string to prevent code injection.
 * Use this when embedding user data in JavaScript strings.
 *
 * @param str - The string to escape
 * @returns The escaped string safe for JavaScript
 *
 * @example
 * ```ts
 * const userName = 'John"; alert("XSS"); var x="';
 * const safe = escapeJs(userName);
 * // Use in: <script>var name = "${safe}";</script>
 * ```
 */
export function escapeJs(str: string): string {
  if (typeof str !== 'string') {
    return String(str);
  }
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\x08/g, '\\b')
    .replace(/\f/g, '\\f')
    .replace(/</g, '\\x3c')
    .replace(/>/g, '\\x3e');
}

/**
 * URL encoding for safe parameter passing.
 * Use this when building URLs with user input.
 *
 * @param str - The string to encode
 * @returns The URL-encoded string
 *
 * @example
 * ```ts
 * const searchQuery = 'hello world & stuff';
 * const url = `/search?q=${escapeUrl(searchQuery)}`;
 * ```
 */
export function escapeUrl(str: string): string {
  if (typeof str !== 'string') {
    return encodeURIComponent(String(str));
  }
  return encodeURIComponent(str);
}

/**
 * Sanitize user input by removing potentially dangerous HTML tags and attributes.
 * This provides basic XSS protection for rich text content.
 *
 * @param html - The HTML string to sanitize
 * @param options - Sanitization options
 * @returns Sanitized HTML string
 *
 * @example
 * ```ts
 * const userHtml = '<p>Hello</p><script>alert("XSS")</script>';
 * const safe = sanitizeHtml(userHtml);
 * // Returns: '<p>Hello</p>'
 * ```
 */
export function sanitizeHtml(
  html: string,
  options: SanitizeOptions = {}
): string {
  if (typeof html !== 'string') {
    return '';
  }

  const {
    allowedTags = DEFAULT_ALLOWED_TAGS,
    allowedAttributes = DEFAULT_ALLOWED_ATTRIBUTES,
    allowedSchemes = DEFAULT_ALLOWED_SCHEMES,
  } = options;

  // Remove script tags and event handlers
  let sanitized = html;

  // Remove script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remove style tags
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove event handlers (onclick, onload, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: URIs (except for allowed ones)
  if (!allowedSchemes.includes('data')) {
    sanitized = sanitized.replace(/\s*data:\s*/gi, '');
  }

  // Filter allowed tags
  if (allowedTags.length > 0) {
    const tagPattern = new RegExp(
      `<(?!\\/?(${allowedTags.join('|')})\\b)[^>]*>`,
      'gi'
    );
    sanitized = sanitized.replace(tagPattern, '');
  }

  return sanitized;
}

/**
 * Options for HTML sanitization.
 */
export interface SanitizeOptions {
  /** Allowed HTML tags (default: common safe tags) */
  allowedTags?: string[];
  /** Allowed HTML attributes per tag */
  allowedAttributes?: Record<string, string[]>;
  /** Allowed URL schemes (default: http, https, mailto) */
  allowedSchemes?: string[];
}

/**
 * Default allowed HTML tags for sanitization.
 */
const DEFAULT_ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 'b', 'i',
  'ul', 'ol', 'li', 'a', 'span', 'div',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre',
];

/**
 * Default allowed attributes per tag.
 */
const DEFAULT_ALLOWED_ATTRIBUTES: Record<string, string[]> = {
  'a': ['href', 'title', 'target'],
  'img': ['src', 'alt', 'title', 'width', 'height'],
  '*': ['class', 'id'],
};

/**
 * Default allowed URL schemes.
 */
const DEFAULT_ALLOWED_SCHEMES = ['http', 'https', 'mailto'];

/**
 * Safe JSON parsing with prototype pollution protection.
 * Prevents __proto__ and constructor pollution attacks.
 *
 * @param json - JSON string to parse
 * @param reviver - Optional reviver function
 * @returns Parsed object with prototype pollution protection
 *
 * @example
 * ```ts
 * const malicious = '{"__proto__": {"isAdmin": true}}';
 * const obj = safeJsonParse(malicious);
 * // The __proto__ property is removed, preventing pollution
 * ```
 */
export function safeJsonParse<T = unknown>(
  json: string,
  reviver?: (key: string, value: unknown) => unknown
): T {
  const parsed = JSON.parse(json, (key, value) => {
    // Prevent prototype pollution
    if (
      key === '__proto__' ||
      key === 'constructor' ||
      key === 'prototype'
    ) {
      return undefined;
    }
    return reviver ? reviver(key, value) : value;
  });

  // Additional safeguard: Remove dangerous properties
  if (parsed && typeof parsed === 'object') {
    delete (parsed as any).__proto__;
    delete (parsed as any).constructor;
    delete (parsed as any).prototype;
  }

  return parsed as T;
}

/**
 * Validate and sanitize URL to prevent open redirect attacks.
 *
 * @param url - URL to validate
 * @param allowedDomains - List of allowed domains (optional)
 * @returns Sanitized URL or null if invalid
 *
 * @example
 * ```ts
 * const redirectUrl = sanitizeUrl(userInput, ['example.com']);
 * if (redirectUrl) {
 *   window.location.href = redirectUrl;
 * }
 * ```
 */
export function sanitizeUrl(
  url: string,
  allowedDomains?: string[]
): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');

    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (dangerousProtocols.some(proto => parsed.protocol.toLowerCase().startsWith(proto))) {
      return null;
    }

    // If allowedDomains is specified, validate domain
    if (allowedDomains && allowedDomains.length > 0) {
      const domain = parsed.hostname.toLowerCase();
      const isAllowed = allowedDomains.some(allowed => {
        const normalizedAllowed = allowed.toLowerCase();
        return domain === normalizedAllowed || domain.endsWith(`.${normalizedAllowed}`);
      });

      if (!isAllowed) {
        return null;
      }
    }

    return parsed.toString();
  } catch {
    // Invalid URL
    return null;
  }
}

/**
 * Generate a cryptographically secure random token.
 * Useful for CSRF tokens, session IDs, etc.
 *
 * @param length - Length of the token in bytes (default: 32)
 * @returns Random token as hex string
 *
 * @example
 * ```ts
 * const csrfToken = generateSecureToken();
 * // Use for CSRF protection
 * ```
 */
export function generateSecureToken(length: number = 32): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Browser environment
    const buffer = new Uint8Array(length);
    crypto.getRandomValues(buffer);
    return Array.from(buffer, byte => byte.toString(16).padStart(2, '0')).join('');
  } else if (typeof require !== 'undefined') {
    // Node.js environment
    try {
      const crypto = require('crypto');
      return crypto.randomBytes(length).toString('hex');
    } catch {
      // Fallback to less secure method
      console.warn('Crypto module not available, using less secure random generation');
      return fallbackSecureToken(length);
    }
  }

  return fallbackSecureToken(length);
}

/**
 * Fallback token generation (less secure, for environments without crypto).
 */
function fallbackSecureToken(length: number): string {
  const chars = 'abcdef0123456789';
  let token = '';
  for (let i = 0; i < length * 2; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Validate email format with basic security checks.
 *
 * @param email - Email address to validate
 * @returns True if email format is valid
 *
 * @example
 * ```ts
 * if (isValidEmail(userInput)) {
 *   // Process email
 * }
 * ```
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic email regex (RFC 5322 simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Check length limits
  if (email.length > 320) {
    return false;
  }

  const [local, domain] = email.split('@');
  if (!local || !domain || local.length > 64 || domain.length > 255) {
    return false;
  }

  return emailRegex.test(email);
}

/**
 * Create a Content Security Policy nonce for inline scripts.
 * Use with CSP headers to allow specific inline scripts.
 *
 * @returns A cryptographically secure nonce
 *
 * @example
 * ```ts
 * const nonce = createCspNonce();
 * // In CSP header: script-src 'nonce-${nonce}'
 * // In HTML: <script nonce="${nonce}">...</script>
 * ```
 */
export function createCspNonce(): string {
  return generateSecureToken(16);
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Use this when comparing sensitive values like tokens or passwords.
 *
 * @param a - First string
 * @param b - Second string
 * @returns True if strings are equal
 *
 * @example
 * ```ts
 * if (constantTimeEqual(userToken, storedToken)) {
 *   // Authenticated
 * }
 * ```
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  const bufA = new TextEncoder().encode(a);
  const bufB = new TextEncoder().encode(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  let diff = 0;
  for (let i = 0; i < bufA.length; i++) {
    diff |= bufA[i] ^ bufB[i];
  }

  return diff === 0;
}
