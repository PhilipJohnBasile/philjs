/**
 * PhilJS Security - Content Security Policy Builder
 *
 * Build and manage CSP headers with nonce support.
 */

import type { CSPConfig, CSPDirectives } from '../types.js';

/**
 * Map directive names to CSP header format
 */
const directiveNames: Record<keyof CSPDirectives, string> = {
  defaultSrc: 'default-src',
  scriptSrc: 'script-src',
  scriptSrcElem: 'script-src-elem',
  scriptSrcAttr: 'script-src-attr',
  styleSrc: 'style-src',
  styleSrcElem: 'style-src-elem',
  styleSrcAttr: 'style-src-attr',
  imgSrc: 'img-src',
  fontSrc: 'font-src',
  connectSrc: 'connect-src',
  mediaSrc: 'media-src',
  objectSrc: 'object-src',
  prefetchSrc: 'prefetch-src',
  childSrc: 'child-src',
  frameSrc: 'frame-src',
  workerSrc: 'worker-src',
  frameAncestors: 'frame-ancestors',
  formAction: 'form-action',
  upgradeInsecureRequests: 'upgrade-insecure-requests',
  blockAllMixedContent: 'block-all-mixed-content',
  baseUri: 'base-uri',
  manifestSrc: 'manifest-src',
  navigateTo: 'navigate-to',
  sandbox: 'sandbox',
  requireTrustedTypesFor: 'require-trusted-types-for',
  trustedTypes: 'trusted-types',
  reportUri: 'report-uri',
};

/**
 * Default CSP directives for secure applications
 */
export const defaultCSPDirectives: CSPDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", 'data:', 'https:'],
  fontSrc: ["'self'"],
  connectSrc: ["'self'"],
  mediaSrc: ["'self'"],
  objectSrc: ["'none'"],
  frameSrc: ["'none'"],
  frameAncestors: ["'self'"],
  formAction: ["'self'"],
  baseUri: ["'self'"],
  upgradeInsecureRequests: true,
};

/**
 * Generate a cryptographically secure nonce
 *
 * @returns Base64-encoded nonce string
 *
 * @example
 * ```typescript
 * const nonce = generateNonce();
 * // Use in CSP: 'nonce-{nonce}'
 * // Use in script tag: <script nonce="{nonce}">
 * ```
 */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // Convert to base64
  if (typeof btoa !== 'undefined') {
    return btoa(String.fromCharCode(...bytes));
  }

  // Node.js fallback
  return Buffer.from(bytes).toString('base64');
}

/**
 * Build a CSP header string from configuration
 *
 * @param config - CSP configuration
 * @param nonce - Optional nonce to include in script-src and style-src
 * @returns CSP header string
 *
 * @example
 * ```typescript
 * const csp = buildCSP({
 *   directives: {
 *     defaultSrc: ["'self'"],
 *     scriptSrc: ["'self'", "https://cdn.example.com"],
 *     styleSrc: ["'self'", "'unsafe-inline'"],
 *   },
 * });
 * // Result: "default-src 'self'; script-src 'self' https://cdn.example.com; style-src 'self' 'unsafe-inline'"
 * ```
 */
export function buildCSP(config: CSPConfig = {}, nonce?: string): string {
  const directives = config.directives || defaultCSPDirectives;
  const parts: string[] = [];

  for (const [key, value] of Object.entries(directives)) {
    if (value === undefined || value === false) {
      continue;
    }

    const directiveName = directiveNames[key as keyof CSPDirectives];
    if (!directiveName) {
      continue;
    }

    // Boolean directives
    if (value === true) {
      parts.push(directiveName);
      continue;
    }

    // String directive (e.g., report-uri)
    if (typeof value === 'string') {
      parts.push(`${directiveName} ${value}`);
      continue;
    }

    // Array directives
    if (Array.isArray(value)) {
      let sources = [...value];

      // Add nonce to script and style sources if provided
      if (nonce && config.useNonces !== false) {
        if (key === 'scriptSrc' || key === 'scriptSrcElem') {
          sources.push(`'nonce-${nonce}'`);
        }
        if (key === 'styleSrc' || key === 'styleSrcElem') {
          sources.push(`'nonce-${nonce}'`);
        }
      }

      if (sources.length > 0) {
        parts.push(`${directiveName} ${sources.join(' ')}`);
      }
    }
  }

  // Add report-uri if specified
  if (config.reportUri) {
    parts.push(`report-uri ${config.reportUri}`);
  }

  // Add report-to if specified
  if (config.reportTo) {
    parts.push(`report-to ${config.reportTo}`);
  }

  return parts.join('; ');
}

/**
 * Get the CSP header name based on configuration
 *
 * @param reportOnly - Whether to use report-only mode
 * @returns CSP header name
 */
export function getCSPHeaderName(reportOnly?: boolean): string {
  return reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
}

/**
 * Create a CSP with common presets
 */
export const cspPresets = {
  /**
   * Strict CSP preset - maximum security
   */
  strict: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      childSrc: ["'none'"],
      frameSrc: ["'none'"],
      workerSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
      upgradeInsecureRequests: true,
      blockAllMixedContent: true,
    },
    useNonces: true,
  } satisfies CSPConfig,

  /**
   * Default CSP preset - balanced security
   */
  default: {
    directives: defaultCSPDirectives,
    useNonces: false,
  } satisfies CSPConfig,

  /**
   * Relaxed CSP preset - for legacy applications
   */
  relaxed: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      fontSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https:'],
      mediaSrc: ["'self'", 'https:'],
      objectSrc: ["'none'"],
      frameSrc: ["'self'"],
      frameAncestors: ["'self'"],
      formAction: ["'self'"],
      baseUri: ["'self'"],
    },
    useNonces: false,
  } satisfies CSPConfig,

  /**
   * API-only CSP preset - for API servers
   */
  api: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'none'"],
    },
    useNonces: false,
  } satisfies CSPConfig,
};

/**
 * Merge CSP configurations
 *
 * @param base - Base configuration
 * @param overrides - Override configuration
 * @returns Merged configuration
 *
 * @example
 * ```typescript
 * const csp = mergeCSP(cspPresets.strict, {
 *   directives: {
 *     scriptSrc: ["'self'", "https://cdn.example.com"],
 *   },
 * });
 * ```
 */
export function mergeCSP(base: CSPConfig, overrides: CSPConfig): CSPConfig {
  return {
    ...base,
    ...overrides,
    directives: {
      ...base.directives,
      ...overrides.directives,
    },
  };
}

/**
 * Create a CSP builder for fluent API
 *
 * @returns CSP builder instance
 *
 * @example
 * ```typescript
 * const csp = createCSPBuilder()
 *   .defaultSrc("'self'")
 *   .scriptSrc("'self'", "https://cdn.example.com")
 *   .styleSrc("'self'", "'unsafe-inline'")
 *   .imgSrc("'self'", "data:", "https:")
 *   .build();
 * ```
 */
export function createCSPBuilder() {
  const directives: CSPDirectives = {};

  const builder = {
    defaultSrc(...sources: string[]) {
      directives.defaultSrc = sources;
      return builder;
    },
    scriptSrc(...sources: string[]) {
      directives.scriptSrc = sources;
      return builder;
    },
    scriptSrcElem(...sources: string[]) {
      directives.scriptSrcElem = sources;
      return builder;
    },
    scriptSrcAttr(...sources: string[]) {
      directives.scriptSrcAttr = sources;
      return builder;
    },
    styleSrc(...sources: string[]) {
      directives.styleSrc = sources;
      return builder;
    },
    styleSrcElem(...sources: string[]) {
      directives.styleSrcElem = sources;
      return builder;
    },
    styleSrcAttr(...sources: string[]) {
      directives.styleSrcAttr = sources;
      return builder;
    },
    imgSrc(...sources: string[]) {
      directives.imgSrc = sources;
      return builder;
    },
    fontSrc(...sources: string[]) {
      directives.fontSrc = sources;
      return builder;
    },
    connectSrc(...sources: string[]) {
      directives.connectSrc = sources;
      return builder;
    },
    mediaSrc(...sources: string[]) {
      directives.mediaSrc = sources;
      return builder;
    },
    objectSrc(...sources: string[]) {
      directives.objectSrc = sources;
      return builder;
    },
    frameSrc(...sources: string[]) {
      directives.frameSrc = sources;
      return builder;
    },
    childSrc(...sources: string[]) {
      directives.childSrc = sources;
      return builder;
    },
    workerSrc(...sources: string[]) {
      directives.workerSrc = sources;
      return builder;
    },
    frameAncestors(...sources: string[]) {
      directives.frameAncestors = sources;
      return builder;
    },
    formAction(...sources: string[]) {
      directives.formAction = sources;
      return builder;
    },
    baseUri(...sources: string[]) {
      directives.baseUri = sources;
      return builder;
    },
    sandbox(...values: string[]) {
      directives.sandbox = values;
      return builder;
    },
    upgradeInsecureRequests(enable: boolean = true) {
      directives.upgradeInsecureRequests = enable;
      return builder;
    },
    blockAllMixedContent(enable: boolean = true) {
      directives.blockAllMixedContent = enable;
      return builder;
    },
    build(options: Omit<CSPConfig, 'directives'> = {}): CSPConfig {
      return {
        ...options,
        directives,
      };
    },
    toString(options: Omit<CSPConfig, 'directives'> = {}, nonce?: string): string {
      return buildCSP({ ...options, directives }, nonce);
    },
  };

  return builder;
}
