/**
 * @philjs/security
 *
 * Runtime security protection - CSP, CSRF, XSS prevention
 */

export * from './csp.js';
export * from './csrf.js';
export * from './headers.js';
export * from './sanitize.js';

export interface SecurityConfig {
  csp?: import('./csp.js').CSPConfig;
  csrf?: import('./csrf.js').CSRFConfig;
  headers?: import('./headers.js').SecurityHeadersConfig;
}

/**
 * Create a security middleware
 */
export function createSecurityMiddleware(config: SecurityConfig = {}) {
  return async (request: Request, next: () => Promise<Response>) => {
    // CSRF protection
    if (config.csrf) {
      const { validateCSRFToken } = await import('./csrf.js');
      const isValid = await validateCSRFToken(request, config.csrf);
      if (!isValid && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
        return new Response('Invalid CSRF token', { status: 403 });
      }
    }

    // Call next handler
    const response = await next();

    // Add security headers
    const headers = new Headers(response.headers);

    if (config.csp) {
      const { buildCSP } = await import('./csp.js');
      headers.set('Content-Security-Policy', buildCSP(config.csp));
    }

    if (config.headers) {
      const { applySecurityHeaders } = await import('./headers.js');
      applySecurityHeaders(headers, config.headers);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}