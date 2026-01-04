/**
 * Content Security Policy (CSP) utilities for PhilJS SSR.
 * Provides helpers for generating CSP headers with nonce support.
 */
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
export declare const DEFAULT_CSP_DIRECTIVES: CSPDirectives;
/**
 * Strict CSP directives (more restrictive).
 */
export declare const STRICT_CSP_DIRECTIVES: CSPDirectives;
/**
 * Development-friendly CSP directives (less restrictive).
 */
export declare const DEV_CSP_DIRECTIVES: CSPDirectives;
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
export declare function generateNonce(size?: number): string;
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
export declare function buildCSP(options?: CSPOptions): CSPResult;
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
export declare function mergeCSP(base: CSPDirectives, override: CSPDirectives): CSPDirectives;
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
export declare function createCSPMiddleware(options?: CSPOptions): () => {
    headers: {
        header: string;
        value: string;
    };
    nonce: string | undefined;
};
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
export declare function parseCSP(cspHeader: string): CSPDirectives;
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
export declare function validateCSP(directives: CSPDirectives): string[];
//# sourceMappingURL=csp.d.ts.map