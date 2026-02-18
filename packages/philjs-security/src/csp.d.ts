/**
 * Content Security Policy (CSP)
 */
export interface CSPDirectives {
    'default-src'?: string[];
    'script-src'?: string[];
    'style-src'?: string[];
    'img-src'?: string[];
    'font-src'?: string[];
    'connect-src'?: string[];
    'media-src'?: string[];
    'object-src'?: string[];
    'frame-src'?: string[];
    'frame-ancestors'?: string[];
    'worker-src'?: string[];
    'child-src'?: string[];
    'base-uri'?: string[];
    'form-action'?: string[];
    'upgrade-insecure-requests'?: boolean;
    'block-all-mixed-content'?: boolean;
    'report-uri'?: string[];
    'report-to'?: string;
}
export interface CSPConfig {
    directives: CSPDirectives;
    reportOnly?: boolean;
    nonce?: string;
}
/**
 * Generate a random nonce for CSP
 */
export declare function generateNonce(): string;
/**
 * Build CSP header string
 */
export declare function buildCSP(config: CSPConfig): string;
/**
 * Preset: Strict CSP
 */
export declare const strictCSP: CSPDirectives;
/**
 * Preset: Relaxed CSP (for development)
 */
export declare const relaxedCSP: CSPDirectives;
