/**
 * Content Security Policy (CSP)
 */
/**
 * Generate a random nonce for CSP
 */
export function generateNonce() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array));
}
/**
 * Build CSP header string
 */
export function buildCSP(config) {
    const parts = [];
    for (const [key, value] of Object.entries(config.directives)) {
        if (value === true) {
            parts.push(key);
        }
        else if (Array.isArray(value)) {
            let values = value;
            if (config.nonce && (key === 'script-src' || key === 'style-src')) {
                values = [...values, `'nonce-${config.nonce}'`];
            }
            parts.push(`${key} ${values.join(' ')}`);
        }
    }
    return parts.join('; ');
}
/**
 * Preset: Strict CSP
 */
export const strictCSP = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'strict-dynamic'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': true,
};
/**
 * Preset: Relaxed CSP (for development)
 */
export const relaxedCSP = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ['*'],
    'connect-src': ['*'],
};
//# sourceMappingURL=csp.js.map