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
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array as unknown as number[]));
}

/**
 * Build CSP header string
 */
export function buildCSP(config: CSPConfig): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(config.directives)) {
    if (value === true) {
      parts.push(key);
    } else if (Array.isArray(value)) {
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
export const strictCSP: CSPDirectives = {
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
export const relaxedCSP: CSPDirectives = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ['*'],
  'connect-src': ['*'],
};