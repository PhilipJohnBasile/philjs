/**
 * Security Headers
 */
/**
 * Apply security headers to a Headers object
 */
export function applySecurityHeaders(headers, config) {
    // X-Frame-Options
    if (config.frameOptions !== false) {
        headers.set('X-Frame-Options', config.frameOptions || 'DENY');
    }
    // X-Content-Type-Options
    if (config.contentTypeOptions !== false) {
        headers.set('X-Content-Type-Options', 'nosniff');
    }
    // X-XSS-Protection
    if (config.xssProtection !== false) {
        headers.set('X-XSS-Protection', '1; mode=block');
    }
    // Referrer-Policy
    if (config.referrerPolicy) {
        headers.set('Referrer-Policy', config.referrerPolicy);
    }
    // Permissions-Policy
    if (config.permissionsPolicy) {
        const policy = Object.entries(config.permissionsPolicy)
            .map(([key, value]) => `${key}=(${value.join(' ')})`)
            .join(', ');
        headers.set('Permissions-Policy', policy);
    }
    // HSTS
    if (config.hsts) {
        let value = `max-age=${config.hsts.maxAge}`;
        if (config.hsts.includeSubDomains)
            value += '; includeSubDomains';
        if (config.hsts.preload)
            value += '; preload';
        headers.set('Strict-Transport-Security', value);
    }
    // COOP
    if (config.coop) {
        headers.set('Cross-Origin-Opener-Policy', config.coop);
    }
    // COEP
    if (config.coep) {
        headers.set('Cross-Origin-Embedder-Policy', config.coep);
    }
    // CORP
    if (config.corp) {
        headers.set('Cross-Origin-Resource-Policy', config.corp);
    }
}
/**
 * Preset: Strict security headers
 */
export const strictHeaders = {
    frameOptions: 'DENY',
    contentTypeOptions: true,
    xssProtection: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
    coop: 'same-origin',
    coep: 'require-corp',
    corp: 'same-origin',
    permissionsPolicy: {
        camera: [],
        microphone: [],
        geolocation: [],
    },
};
//# sourceMappingURL=headers.js.map