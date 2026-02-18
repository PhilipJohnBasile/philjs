/**
 * Security Headers
 */
export interface SecurityHeadersConfig {
    /** X-Frame-Options */
    frameOptions?: 'DENY' | 'SAMEORIGIN' | false;
    /** X-Content-Type-Options */
    contentTypeOptions?: boolean;
    /** X-XSS-Protection */
    xssProtection?: boolean;
    /** Referrer-Policy */
    referrerPolicy?: string;
    /** Permissions-Policy */
    permissionsPolicy?: Record<string, string[]>;
    /** Strict-Transport-Security */
    hsts?: {
        maxAge: number;
        includeSubDomains?: boolean;
        preload?: boolean;
    } | false;
    /** Cross-Origin-Opener-Policy */
    coop?: 'unsafe-none' | 'same-origin-allow-popups' | 'same-origin';
    /** Cross-Origin-Embedder-Policy */
    coep?: 'unsafe-none' | 'require-corp' | 'credentialless';
    /** Cross-Origin-Resource-Policy */
    corp?: 'same-site' | 'same-origin' | 'cross-origin';
}
/**
 * Apply security headers to a Headers object
 */
export declare function applySecurityHeaders(headers: Headers, config: SecurityHeadersConfig): void;
/**
 * Preset: Strict security headers
 */
export declare const strictHeaders: SecurityHeadersConfig;
