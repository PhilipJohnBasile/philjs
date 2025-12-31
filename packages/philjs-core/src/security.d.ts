/**
 * Security utilities for PhilJS framework.
 * Provides input sanitization, XSS prevention, and safe JSON parsing.
 */
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
export declare function escapeHtml(str: string): string;
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
export declare function escapeAttr(str: string): string;
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
export declare function escapeJs(str: string): string;
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
export declare function escapeUrl(str: string): string;
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
export declare function sanitizeHtml(html: string, options?: SanitizeOptions): string;
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
export declare function safeJsonParse<T = unknown>(json: string, reviver?: (key: string, value: unknown) => unknown): T;
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
export declare function sanitizeUrl(url: string, allowedDomains?: string[]): string | null;
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
export declare function generateSecureToken(length?: number): Promise<string>;
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
export declare function isValidEmail(email: string): boolean;
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
export declare function createCspNonce(): Promise<string>;
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
export declare function constantTimeEqual(a: string, b: string): boolean;
//# sourceMappingURL=security.d.ts.map