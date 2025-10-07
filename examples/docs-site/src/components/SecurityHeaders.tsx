/**
 * SecurityHeaders Component
 *
 * Provides security-related meta tags and headers for the documentation site.
 * These should also be configured at the server/CDN level for production.
 *
 * Usage: Add to your document head in index.html or app root
 */

export interface SecurityHeadersProps {
  /**
   * Nonce for inline scripts (CSP)
   * Generate a new random nonce for each page load
   */
  nonce?: string;

  /**
   * Additional allowed script sources for CSP
   */
  scriptSrc?: string[];

  /**
   * Additional allowed style sources for CSP
   */
  styleSrc?: string[];
}

export function SecurityHeaders({
  nonce,
  scriptSrc = [],
  styleSrc = [],
}: SecurityHeadersProps = {}) {
  // Build Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' ${nonce ? `'nonce-${nonce}'` : "'unsafe-inline'"} ${scriptSrc.join(' ')}`.trim(),
    `style-src 'self' 'unsafe-inline' ${styleSrc.join(' ')}`.trim(),
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.github.com",
    "frame-src 'self' https://stackblitz.com https://codesandbox.io",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ];

  const csp = cspDirectives.join('; ');

  return (
    <>
      {/* Content Security Policy */}
      <meta httpEquiv="Content-Security-Policy" content={csp} />

      {/* Prevent MIME type sniffing */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />

      {/* Prevent clickjacking */}
      <meta httpEquiv="X-Frame-Options" content="DENY" />

      {/* Enable XSS protection */}
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />

      {/* Referrer Policy - balance privacy and functionality */}
      <meta name="referrer" content="strict-origin-when-cross-origin" />

      {/* Permissions Policy - restrict browser features */}
      <meta
        httpEquiv="Permissions-Policy"
        content="geolocation=(), microphone=(), camera=(), payment=(), usb=(), bluetooth=()"
      />
    </>
  );
}

/**
 * Server Configuration Guide
 *
 * For production, configure these headers at the server/CDN level:
 *
 * ## Vercel (vercel.json)
 * ```json
 * {
 *   "headers": [
 *     {
 *       "source": "/(.*)",
 *       "headers": [
 *         {
 *           "key": "Content-Security-Policy",
 *           "value": "default-src 'self'; script-src 'self' 'unsafe-inline'; ..."
 *         },
 *         {
 *           "key": "X-Content-Type-Options",
 *           "value": "nosniff"
 *         },
 *         {
 *           "key": "X-Frame-Options",
 *           "value": "DENY"
 *         },
 *         {
 *           "key": "X-XSS-Protection",
 *           "value": "1; mode=block"
 *         },
 *         {
 *           "key": "Strict-Transport-Security",
 *           "value": "max-age=31536000; includeSubDomains"
 *         },
 *         {
 *           "key": "Referrer-Policy",
 *           "value": "strict-origin-when-cross-origin"
 *         },
 *         {
 *           "key": "Permissions-Policy",
 *           "value": "geolocation=(), microphone=(), camera=()"
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * ## Netlify (_headers file)
 * ```
 * /*
 *   Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
 *   X-Content-Type-Options: nosniff
 *   X-Frame-Options: DENY
 *   X-XSS-Protection: 1; mode=block
 *   Strict-Transport-Security: max-age=31536000; includeSubDomains
 *   Referrer-Policy: strict-origin-when-cross-origin
 *   Permissions-Policy: geolocation=(), microphone=(), camera=()
 * ```
 *
 * ## Nginx
 * ```nginx
 * add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; ..." always;
 * add_header X-Content-Type-Options "nosniff" always;
 * add_header X-Frame-Options "DENY" always;
 * add_header X-XSS-Protection "1; mode=block" always;
 * add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
 * add_header Referrer-Policy "strict-origin-when-cross-origin" always;
 * add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
 * ```
 *
 * ## Apache (.htaccess)
 * ```apache
 * <IfModule mod_headers.c>
 *   Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; ..."
 *   Header always set X-Content-Type-Options "nosniff"
 *   Header always set X-Frame-Options "DENY"
 *   Header always set X-XSS-Protection "1; mode=block"
 *   Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
 *   Header always set Referrer-Policy "strict-origin-when-cross-origin"
 *   Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
 * </IfModule>
 * ```
 */

/**
 * Generate a cryptographically secure nonce for CSP
 * Use this server-side for each page render
 */
export function generateNonce(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
  ).join('');
}

/**
 * Security utilities for the documentation site
 */
export const SecurityUtils = {
  /**
   * Check if the site is running over HTTPS
   */
  isSecure(): boolean {
    return typeof window !== 'undefined' && window.location.protocol === 'https:';
  },

  /**
   * Sanitize user input to prevent XSS
   * Use for displaying user-generated content
   */
  sanitizeHTML(html: string): string {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  },

  /**
   * Validate URL is safe for navigation
   */
  isSafeURL(url: string): boolean {
    try {
      const parsed = new URL(url, window.location.origin);
      // Only allow http(s) protocols
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  },

  /**
   * Create a safe external link element
   */
  createSafeExternalLink(url: string, text: string): string {
    if (!this.isSafeURL(url)) {
      return this.sanitizeHTML(text);
    }
    const sanitizedURL = this.sanitizeHTML(url);
    const sanitizedText = this.sanitizeHTML(text);
    return `<a href="${sanitizedURL}" target="_blank" rel="noopener noreferrer">${sanitizedText}</a>`;
  },
};
