/**
 * Content Security Policy (CSP) utilities for PhilJS SSR.
 * Provides helpers for generating CSP headers with nonce support.
 */

import { randomBytes } from 'node:crypto';

/**
 * CSP directive values can be strings or arrays of strings.
 */
export type CSPDirectiveValue = string | string[];

/**
 * CSP directives configuration.
 */
export interface CSPDirectives {
  /** Default source for all fetch directives */
  'default-src'?: CSPDirectiveValue;
  /** Valid sources for scripts */
  'script-src'?: CSPDirectiveValue;
  /** Valid sources for stylesheets */
  'style-src'?: CSPDirectiveValue;
  /** Valid sources for images */
  'img-src'?: CSPDirectiveValue;
  /** Valid sources for fonts */
  'font-src'?: CSPDirectiveValue;
  /** Valid sources for AJAX/WebSocket/EventSource */
  'connect-src'?: CSPDirectiveValue;
  /** Valid sources for <object>, <embed>, <applet> */
  'object-src'?: CSPDirectiveValue;
  /** Valid sources for media (audio, video) */
  'media-src'?: CSPDirectiveValue;
  /** Valid sources for frames */
  'frame-src'?: CSPDirectiveValue;
  /** Valid sources for workers */
  'worker-src'?: CSPDirectiveValue;
  /** Valid sources for manifests */
  'manifest-src'?: CSPDirectiveValue;
  /** Valid ancestors for embedding (frame-ancestors) */
  'frame-ancestors'?: CSPDirectiveValue;
  /** Valid targets for form submissions */
  'form-action'?: CSPDirectiveValue;
  /** Valid base URIs for the document */
  'base-uri'?: CSPDirectiveValue;
  /** Upgrade insecure requests */
  'upgrade-insecure-requests'?: boolean;
  /** Block all mixed content */
  'block-all-mixed-content'?: boolean;
  /** Require SRI for scripts and styles */
  'require-sri-for'?: CSPDirectiveValue;
  /** Report URI for violations */
  'report-uri'?: string;
  /** Report-To endpoint for violations */
  'report-to'?: string;
  /** Allow additional custom directives */
  [key: string]: CSPDirectiveValue | boolean | undefined;
}

/**
 * Options for building CSP headers.
 */
export interface CSPOptions {
  /** CSP directives configuration */
  directives?: CSPDirectives;
  /** Use report-only mode (doesn't enforce, only reports) */
  reportOnly?: boolean;
  /** Nonce for inline scripts/styles */
  nonce?: string;
  /** Generate a new nonce automatically */
  autoNonce?: boolean;
}

/**
 * CSP builder result.
 */
export interface CSPResult {
  /** The CSP header value */
  value: string;
  /** The header name (either Content-Security-Policy or Content-Security-Policy-Report-Only) */
  header: string;
  /** The generated nonce (if autoNonce was enabled) */
  nonce?: string;
}

/**
 * Default secure CSP directives for PhilJS applications.
 */
export const DEFAULT_CSP_DIRECTIVES: CSPDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"], // Allow inline styles for CSS-in-JS
  'img-src': ["'self'", 'data:', 'blob:', 'https:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'"],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'frame-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': true,
};

/**
 * Strict CSP directives (more restrictive).
 */
export const STRICT_CSP_DIRECTIVES: CSPDirectives = {
  'default-src': ["'none'"],
  'script-src': ["'self'"],
  'style-src': ["'self'"],
  'img-src': ["'self'", 'data:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'media-src': ["'none'"],
  'object-src': ["'none'"],
  'frame-src': ["'none'"],
  'base-uri': ["'none'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': true,
};

/**
 * Development-friendly CSP directives (less restrictive).
 */
export const DEV_CSP_DIRECTIVES: CSPDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-eval'"], // Allow eval for HMR
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:', 'https:', 'http:'],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'ws:', 'wss:'], // Allow WebSocket for HMR
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'self'"],
};

/**
 * Generate a cryptographically secure nonce for CSP.
 *
 * @param size - Size of the nonce in bytes (default: 16)
 * @returns Base64-encoded nonce string
 *
 * @example
 * ```ts
 * const nonce = generateNonce();
 * // Use in CSP: script-src 'nonce-${nonce}'
 * // Use in HTML: <script nonce="${nonce}">...</script>
 * ```
 */
export function generateNonce(size: number = 16): string {
  return randomBytes(size).toString('base64');
}

/**
 * Build a Content Security Policy header.
 *
 * @param options - CSP configuration options
 * @returns CSP header information
 *
 * @example
 * ```ts
 * const csp = buildCSP({
 *   directives: {
 *     'script-src': ["'self'", 'https://cdn.example.com'],
 *     'style-src': ["'self'", "'unsafe-inline'"],
 *   },
 *   autoNonce: true,
 * });
 *
 * // Set header in response
 * response.headers.set(csp.header, csp.value);
 *
 * // Use nonce in HTML
 * <script nonce="${csp.nonce}">...</script>
 * ```
 */
export function buildCSP(options: CSPOptions = {}): CSPResult {
  const {
    directives = DEFAULT_CSP_DIRECTIVES,
    reportOnly = false,
    nonce,
    autoNonce = false,
  } = options;

  // Generate nonce if requested
  const generatedNonce = autoNonce ? generateNonce() : nonce;

  // Merge directives
  const mergedDirectives = { ...directives };

  // Add nonce to script-src and style-src if provided
  if (generatedNonce) {
    const nonceValue = `'nonce-${generatedNonce}'`;

    // Add to script-src
    const scriptSrc = normalizeDirectiveValue(mergedDirectives['script-src']);
    if (!scriptSrc.includes(nonceValue)) {
      mergedDirectives['script-src'] = [...scriptSrc, nonceValue];
    }

    // Add to style-src
    const styleSrc = normalizeDirectiveValue(mergedDirectives['style-src']);
    if (!styleSrc.includes(nonceValue)) {
      mergedDirectives['style-src'] = [...styleSrc, nonceValue];
    }
  }

  // Build CSP string
  const cspValue = serializeCSP(mergedDirectives);

  // Determine header name
  const headerName = reportOnly
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';

  return {
    value: cspValue,
    header: headerName,
    nonce: generatedNonce,
  };
}

/**
 * Serialize CSP directives to a header value string.
 */
function serializeCSP(directives: CSPDirectives): string {
  const parts: string[] = [];

  for (const [directive, value] of Object.entries(directives)) {
    if (value === undefined || value === null) {
      continue;
    }

    // Handle boolean directives
    if (typeof value === 'boolean') {
      if (value) {
        parts.push(directive);
      }
      continue;
    }

    // Handle string/array directives
    const values = normalizeDirectiveValue(value);
    if (values.length === 0) {
      parts.push(directive);
    } else {
      parts.push(`${directive} ${values.join(' ')}`);
    }
  }

  return parts.join('; ');
}

/**
 * Normalize directive value to an array of strings.
 */
function normalizeDirectiveValue(value: CSPDirectiveValue | boolean | undefined): string[] {
  if (value === undefined || value === null || typeof value === 'boolean') {
    return [];
  }

  if (typeof value === 'string') {
    return value.split(/\s+/).filter(Boolean);
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return [];
}

/**
 * Merge multiple CSP directive sets.
 * Useful for combining base policies with page-specific policies.
 *
 * @param base - Base CSP directives
 * @param override - Override CSP directives
 * @returns Merged directives
 *
 * @example
 * ```ts
 * const pageCSP = mergeCSP(DEFAULT_CSP_DIRECTIVES, {
 *   'script-src': ["'self'", 'https://analytics.example.com'],
 * });
 * ```
 */
export function mergeCSP(
  base: CSPDirectives,
  override: CSPDirectives
): CSPDirectives {
  const merged: CSPDirectives = { ...base };

  for (const [directive, value] of Object.entries(override)) {
    if (value === undefined || value === null) {
      continue;
    }

    // For boolean directives, just override
    if (typeof value === 'boolean') {
      merged[directive] = value;
      continue;
    }

    // For string/array directives, merge
    const baseValues = normalizeDirectiveValue(merged[directive]);
    const overrideValues = normalizeDirectiveValue(value);

    // Combine and deduplicate
    const combined = [...new Set([...baseValues, ...overrideValues])];
    merged[directive] = combined;
  }

  return merged;
}

/**
 * Create a CSP middleware for framework integration.
 * Returns a function that sets CSP headers on responses.
 *
 * @param options - CSP configuration options
 * @returns Middleware function
 *
 * @example
 * ```ts
 * const cspMiddleware = createCSPMiddleware({
 *   directives: DEFAULT_CSP_DIRECTIVES,
 *   autoNonce: true,
 * });
 *
 * // In request handler
 * const { headers, nonce } = cspMiddleware();
 * response.headers.set(headers.header, headers.value);
 * ```
 */
export function createCSPMiddleware(options: CSPOptions = {}) {
  return () => {
    const csp = buildCSP(options);
    return {
      headers: {
        header: csp.header,
        value: csp.value,
      },
      nonce: csp.nonce,
    };
  };
}

/**
 * Parse a CSP header value into directives object.
 * Useful for inspecting or modifying existing CSP headers.
 *
 * @param cspHeader - CSP header value string
 * @returns Parsed directives
 *
 * @example
 * ```ts
 * const directives = parseCSP("default-src 'self'; script-src 'self' 'unsafe-inline'");
 * // { 'default-src': ["'self'"], 'script-src': ["'self'", "'unsafe-inline'"] }
 * ```
 */
export function parseCSP(cspHeader: string): CSPDirectives {
  const directives: CSPDirectives = {};

  const parts = cspHeader.split(';').map(p => p.trim()).filter(Boolean);

  for (const part of parts) {
    const spaceIndex = part.indexOf(' ');

    if (spaceIndex === -1) {
      // Boolean directive
      directives[part] = true;
    } else {
      // Value directive
      const directive = part.substring(0, spaceIndex);
      const value = part.substring(spaceIndex + 1).trim();
      directives[directive] = value.split(/\s+/).filter(Boolean);
    }
  }

  return directives;
}

/**
 * Validate CSP directives for common security issues.
 * Returns warnings for potentially unsafe configurations.
 *
 * @param directives - CSP directives to validate
 * @returns Array of warning messages
 *
 * @example
 * ```ts
 * const warnings = validateCSP({
 *   'script-src': ["'unsafe-eval'", "'unsafe-inline'"],
 * });
 * // Returns warnings about unsafe directives
 * ```
 */
export function validateCSP(directives: CSPDirectives): string[] {
  const warnings: string[] = [];

  // Check for unsafe-eval
  const scriptSrc = normalizeDirectiveValue(directives['script-src']);
  if (scriptSrc.includes("'unsafe-eval'")) {
    warnings.push(
      "script-src contains 'unsafe-eval' which allows eval() and is dangerous"
    );
  }

  // Check for unsafe-inline without nonce or hash
  if (scriptSrc.includes("'unsafe-inline'")) {
    const hasNonce = scriptSrc.some(v => v.startsWith("'nonce-"));
    const hasHash = scriptSrc.some(v => v.startsWith("'sha"));
    if (!hasNonce && !hasHash) {
      warnings.push(
        "script-src contains 'unsafe-inline' without nonce or hash. Consider using nonces for better security."
      );
    }
  }

  // Check for wildcard sources
  if (scriptSrc.includes('*') || scriptSrc.includes('https:')) {
    warnings.push(
      "script-src contains wildcard or protocol-only source which may be too permissive"
    );
  }

  // Check for data: in script-src
  if (scriptSrc.includes('data:')) {
    warnings.push(
      "script-src contains 'data:' which can be used for XSS attacks"
    );
  }

  // Check for missing base-uri
  if (!directives['base-uri']) {
    warnings.push(
      "Missing 'base-uri' directive. Consider setting it to 'self' or 'none'"
    );
  }

  // Check for missing object-src
  if (!directives['object-src']) {
    warnings.push(
      "Missing 'object-src' directive. Consider setting it to 'none'"
    );
  }

  // Check for upgrade-insecure-requests in production
  if (!directives['upgrade-insecure-requests']) {
    warnings.push(
      "Consider enabling 'upgrade-insecure-requests' for production environments"
    );
  }

  return warnings;
}
