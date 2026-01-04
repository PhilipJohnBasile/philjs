/**
 * PhilJS Security - Security Headers Middleware
 *
 * Apply security headers to protect against common attacks.
 */

import type {
  SecurityHeadersConfig,
  HSTSConfig,
  ExpectCTConfig,
  PermissionsPolicyConfig,
  SecurityMiddleware,
} from '../types.js';
import { buildCSP, getCSPHeaderName, generateNonce, cspPresets } from './csp.js';

/**
 * Default security headers configuration
 */
const defaultConfig: SecurityHeadersConfig = {
  contentSecurityPolicy: cspPresets.default,
  crossOriginEmbedderPolicy: 'require-corp',
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginResourcePolicy: 'same-origin',
  expectCT: false,
  referrerPolicy: 'strict-origin-when-cross-origin',
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: false,
  },
  noSniff: true,
  dnsPrefetchControl: false,
  ieNoOpen: true,
  frameguard: 'deny',
  permittedCrossDomainPolicies: 'none',
  hidePoweredBy: true,
  xssFilter: false, // Deprecated, rely on CSP instead
  originAgentCluster: true,
  permissionsPolicy: {
    accelerometer: [],
    camera: [],
    geolocation: [],
    gyroscope: [],
    magnetometer: [],
    microphone: [],
    payment: [],
    usb: [],
  },
};

/**
 * Build HSTS header value
 */
function buildHSTS(config: HSTSConfig): string {
  const parts: string[] = [];

  parts.push(`max-age=${config.maxAge ?? 31536000}`);

  if (config.includeSubDomains) {
    parts.push('includeSubDomains');
  }

  if (config.preload) {
    parts.push('preload');
  }

  return parts.join('; ');
}

/**
 * Build Expect-CT header value
 */
function buildExpectCT(config: ExpectCTConfig): string {
  const parts: string[] = [];

  parts.push(`max-age=${config.maxAge ?? 86400}`);

  if (config.enforce) {
    parts.push('enforce');
  }

  if (config.reportUri) {
    parts.push(`report-uri="${config.reportUri}"`);
  }

  return parts.join(', ');
}

/**
 * Build Permissions-Policy header value
 */
function buildPermissionsPolicy(config: PermissionsPolicyConfig): string {
  const parts: string[] = [];

  const featureMap: Record<keyof PermissionsPolicyConfig, string> = {
    accelerometer: 'accelerometer',
    ambientLightSensor: 'ambient-light-sensor',
    autoplay: 'autoplay',
    battery: 'battery',
    camera: 'camera',
    displayCapture: 'display-capture',
    documentDomain: 'document-domain',
    encryptedMedia: 'encrypted-media',
    executionWhileNotRendered: 'execution-while-not-rendered',
    executionWhileOutOfViewport: 'execution-while-out-of-viewport',
    fullscreen: 'fullscreen',
    geolocation: 'geolocation',
    gyroscope: 'gyroscope',
    layoutAnimations: 'layout-animations',
    legacyImageFormats: 'legacy-image-formats',
    magnetometer: 'magnetometer',
    microphone: 'microphone',
    midi: 'midi',
    navigationOverride: 'navigation-override',
    oversizedImages: 'oversized-images',
    payment: 'payment',
    pictureInPicture: 'picture-in-picture',
    publicKeyCredentialsGet: 'publickey-credentials-get',
    speakerSelection: 'speaker-selection',
    syncXhr: 'sync-xhr',
    unoptimizedImages: 'unoptimized-images',
    unsizedMedia: 'unsized-media',
    usb: 'usb',
    screenWakeLock: 'screen-wake-lock',
    webShare: 'web-share',
    xrSpatialTracking: 'xr-spatial-tracking',
  };

  for (const [key, value] of Object.entries(config)) {
    const feature = featureMap[key as keyof PermissionsPolicyConfig];
    if (!feature || !Array.isArray(value)) {
      continue;
    }

    if (value.length === 0) {
      parts.push(`${feature}=()`);
    } else {
      const origins = value.map((v) => (v === 'self' ? 'self' : `"${v}"`)).join(' ');
      parts.push(`${feature}=(${origins})`);
    }
  }

  return parts.join(', ');
}

/**
 * Security headers middleware options
 */
export interface SecurityHeadersOptions extends SecurityHeadersConfig {
  /** Generate and include nonce for CSP */
  generateNonce?: boolean;
  /** Custom nonce generator function */
  nonceGenerator?: () => string;
  /** Add nonce to response for use in templates */
  exposeNonce?: boolean;
}

/**
 * Create security headers middleware
 *
 * Applies security headers to all responses:
 * - Content-Security-Policy
 * - Strict-Transport-Security
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - And many more...
 *
 * @param config - Security headers configuration
 * @returns Middleware function
 *
 * @example
 * ```typescript
 * const headersMiddleware = securityHeaders({
 *   contentSecurityPolicy: {
 *     directives: {
 *       defaultSrc: ["'self'"],
 *       scriptSrc: ["'self'", "https://cdn.example.com"],
 *     },
 *   },
 *   hsts: {
 *     maxAge: 31536000,
 *     includeSubDomains: true,
 *   },
 * });
 * ```
 */
export function securityHeaders(config: SecurityHeadersOptions = {}): SecurityMiddleware {
  const mergedConfig = {
    ...defaultConfig,
    ...config,
  };

  return async (request: Request, next: () => Promise<Response>) => {
    const response = await next();
    const headers = new Headers(response.headers);

    // Generate nonce if needed
    let nonce: string | undefined;
    const cspConfig = mergedConfig.contentSecurityPolicy;
    const shouldGenerateNonce =
      config.generateNonce ||
      (cspConfig !== undefined && cspConfig !== false && cspConfig.useNonces);
    if (shouldGenerateNonce) {
      nonce = config.nonceGenerator ? config.nonceGenerator() : generateNonce();
    }

    // Content-Security-Policy
    if (cspConfig !== undefined && cspConfig !== false) {
      const cspValue = buildCSP(cspConfig, nonce);
      const cspHeader = getCSPHeaderName(cspConfig.reportOnly);
      headers.set(cspHeader, cspValue);
    }

    // Cross-Origin-Embedder-Policy
    if (mergedConfig.crossOriginEmbedderPolicy !== false && mergedConfig.crossOriginEmbedderPolicy) {
      headers.set('Cross-Origin-Embedder-Policy', mergedConfig.crossOriginEmbedderPolicy);
    }

    // Cross-Origin-Opener-Policy
    if (mergedConfig.crossOriginOpenerPolicy !== false && mergedConfig.crossOriginOpenerPolicy) {
      headers.set('Cross-Origin-Opener-Policy', mergedConfig.crossOriginOpenerPolicy);
    }

    // Cross-Origin-Resource-Policy
    if (mergedConfig.crossOriginResourcePolicy !== false && mergedConfig.crossOriginResourcePolicy) {
      headers.set('Cross-Origin-Resource-Policy', mergedConfig.crossOriginResourcePolicy);
    }

    // Expect-CT (deprecated but still used)
    if (mergedConfig.expectCT !== false && mergedConfig.expectCT) {
      headers.set('Expect-CT', buildExpectCT(mergedConfig.expectCT));
    }

    // Referrer-Policy
    if (mergedConfig.referrerPolicy !== false && mergedConfig.referrerPolicy) {
      headers.set('Referrer-Policy', mergedConfig.referrerPolicy);
    }

    // Strict-Transport-Security
    if (mergedConfig.hsts !== false) {
      const hstsConfig =
        typeof mergedConfig.hsts === 'object' ? mergedConfig.hsts : { maxAge: 31536000 };
      headers.set('Strict-Transport-Security', buildHSTS(hstsConfig));
    }

    // X-Content-Type-Options
    if (mergedConfig.noSniff) {
      headers.set('X-Content-Type-Options', 'nosniff');
    }

    // X-DNS-Prefetch-Control
    if (mergedConfig.dnsPrefetchControl !== undefined) {
      headers.set('X-DNS-Prefetch-Control', mergedConfig.dnsPrefetchControl ? 'on' : 'off');
    }

    // X-Download-Options
    if (mergedConfig.ieNoOpen) {
      headers.set('X-Download-Options', 'noopen');
    }

    // X-Frame-Options
    if (mergedConfig.frameguard !== false) {
      headers.set(
        'X-Frame-Options',
        mergedConfig.frameguard === 'sameorigin' ? 'SAMEORIGIN' : 'DENY'
      );
    }

    // X-Permitted-Cross-Domain-Policies
    if (mergedConfig.permittedCrossDomainPolicies !== false && mergedConfig.permittedCrossDomainPolicies) {
      headers.set('X-Permitted-Cross-Domain-Policies', mergedConfig.permittedCrossDomainPolicies);
    }

    // X-Powered-By (remove it)
    if (mergedConfig.hidePoweredBy) {
      headers.delete('X-Powered-By');
    }

    // X-XSS-Protection (deprecated, disabled by default)
    if (mergedConfig.xssFilter) {
      headers.set('X-XSS-Protection', '1; mode=block');
    } else {
      // Explicitly disable as it can introduce vulnerabilities
      headers.set('X-XSS-Protection', '0');
    }

    // Origin-Agent-Cluster
    if (mergedConfig.originAgentCluster) {
      headers.set('Origin-Agent-Cluster', '?1');
    }

    // Permissions-Policy
    if (mergedConfig.permissionsPolicy !== false && mergedConfig.permissionsPolicy) {
      headers.set('Permissions-Policy', buildPermissionsPolicy(mergedConfig.permissionsPolicy));
    }

    // Expose nonce for templates if requested
    if (config.exposeNonce && nonce) {
      headers.set('X-Nonce', nonce);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  };
}

/**
 * Security headers presets
 */
export const securityHeadersPresets = {
  /**
   * Strict preset - maximum security
   */
  strict: {
    contentSecurityPolicy: cspPresets.strict,
    crossOriginEmbedderPolicy: 'require-corp',
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-origin',
    referrerPolicy: 'no-referrer',
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    frameguard: 'deny',
    permittedCrossDomainPolicies: 'none',
    hidePoweredBy: true,
    originAgentCluster: true,
    permissionsPolicy: {
      accelerometer: [],
      camera: [],
      geolocation: [],
      gyroscope: [],
      magnetometer: [],
      microphone: [],
      payment: [],
      usb: [],
    },
  } satisfies SecurityHeadersConfig,

  /**
   * Default preset - balanced security
   */
  default: defaultConfig,

  /**
   * API preset - for JSON APIs
   */
  api: {
    contentSecurityPolicy: cspPresets.api,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: 'same-origin',
    referrerPolicy: 'no-referrer',
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
    noSniff: true,
    frameguard: 'deny',
    hidePoweredBy: true,
    permissionsPolicy: false,
  } satisfies SecurityHeadersConfig,

  /**
   * Relaxed preset - for development or legacy apps
   */
  relaxed: {
    contentSecurityPolicy: cspPresets.relaxed,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    referrerPolicy: 'strict-origin-when-cross-origin',
    hsts: false,
    noSniff: true,
    frameguard: 'sameorigin',
    hidePoweredBy: true,
  } satisfies SecurityHeadersConfig,
};
