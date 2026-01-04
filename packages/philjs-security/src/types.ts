/**
 * PhilJS Security Types
 *
 * Core type definitions for security configuration.
 */

/**
 * CSRF Configuration
 */
export interface CSRFConfig {
  /** Secret key for token generation */
  secret?: string;
  /** Cookie name for CSRF token (default: '_csrf') */
  cookieName?: string;
  /** Header name for CSRF token (default: 'X-CSRF-Token') */
  headerName?: string;
  /** Form field name for CSRF token (default: '_csrf') */
  fieldName?: string;
  /** HTTP methods to ignore (default: ['GET', 'HEAD', 'OPTIONS']) */
  ignoreMethods?: string[];
  /** Cookie options */
  cookie?: CSRFCookieOptions;
  /** Custom token length (default: 32) */
  tokenLength?: number;
}

/**
 * CSRF Cookie Options
 */
export interface CSRFCookieOptions {
  /** Cookie path (default: '/') */
  path?: string;
  /** Cookie domain */
  domain?: string;
  /** Secure cookie flag (default: true in production) */
  secure?: boolean;
  /** HttpOnly cookie flag (default: true) */
  httpOnly?: boolean;
  /** SameSite cookie attribute (default: 'strict') */
  sameSite?: 'strict' | 'lax' | 'none';
  /** Max age in seconds */
  maxAge?: number;
}

/**
 * Security Headers Configuration
 */
export interface SecurityHeadersConfig {
  /** Content Security Policy */
  contentSecurityPolicy?: CSPConfig | false;
  /** Cross-Origin-Embedder-Policy */
  crossOriginEmbedderPolicy?: 'require-corp' | 'credentialless' | 'unsafe-none' | false;
  /** Cross-Origin-Opener-Policy */
  crossOriginOpenerPolicy?: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none' | false;
  /** Cross-Origin-Resource-Policy */
  crossOriginResourcePolicy?: 'same-origin' | 'same-site' | 'cross-origin' | false;
  /** Expect-CT header */
  expectCT?: ExpectCTConfig | false;
  /** Referrer-Policy */
  referrerPolicy?: ReferrerPolicy | false;
  /** Strict-Transport-Security */
  hsts?: HSTSConfig | false;
  /** X-Content-Type-Options */
  noSniff?: boolean;
  /** X-DNS-Prefetch-Control */
  dnsPrefetchControl?: boolean;
  /** X-Download-Options */
  ieNoOpen?: boolean;
  /** X-Frame-Options */
  frameguard?: 'deny' | 'sameorigin' | false;
  /** X-Permitted-Cross-Domain-Policies */
  permittedCrossDomainPolicies?: 'none' | 'master-only' | 'by-content-type' | 'all' | false;
  /** X-Powered-By */
  hidePoweredBy?: boolean;
  /** X-XSS-Protection */
  xssFilter?: boolean;
  /** Origin-Agent-Cluster */
  originAgentCluster?: boolean;
  /** Permissions-Policy */
  permissionsPolicy?: PermissionsPolicyConfig | false;
}

/**
 * Content Security Policy Configuration
 */
export interface CSPConfig {
  /** Use report-only mode */
  reportOnly?: boolean;
  /** Report URI for violations */
  reportUri?: string;
  /** Reporting endpoint */
  reportTo?: string;
  /** Use nonces for scripts and styles */
  useNonces?: boolean;
  /** Directives */
  directives?: CSPDirectives;
}

/**
 * CSP Directives
 */
export interface CSPDirectives {
  /** default-src */
  defaultSrc?: string[];
  /** script-src */
  scriptSrc?: string[];
  /** script-src-elem */
  scriptSrcElem?: string[];
  /** script-src-attr */
  scriptSrcAttr?: string[];
  /** style-src */
  styleSrc?: string[];
  /** style-src-elem */
  styleSrcElem?: string[];
  /** style-src-attr */
  styleSrcAttr?: string[];
  /** img-src */
  imgSrc?: string[];
  /** font-src */
  fontSrc?: string[];
  /** connect-src */
  connectSrc?: string[];
  /** media-src */
  mediaSrc?: string[];
  /** object-src */
  objectSrc?: string[];
  /** prefetch-src */
  prefetchSrc?: string[];
  /** child-src */
  childSrc?: string[];
  /** frame-src */
  frameSrc?: string[];
  /** worker-src */
  workerSrc?: string[];
  /** frame-ancestors */
  frameAncestors?: string[];
  /** form-action */
  formAction?: string[];
  /** upgrade-insecure-requests */
  upgradeInsecureRequests?: boolean;
  /** block-all-mixed-content */
  blockAllMixedContent?: boolean;
  /** base-uri */
  baseUri?: string[];
  /** manifest-src */
  manifestSrc?: string[];
  /** navigate-to */
  navigateTo?: string[];
  /** sandbox */
  sandbox?: string[];
  /** require-trusted-types-for */
  requireTrustedTypesFor?: string[];
  /** trusted-types */
  trustedTypes?: string[];
  /** report-uri (deprecated, use reportUri in CSPConfig) */
  reportUri?: string;
}

/**
 * HSTS Configuration
 */
export interface HSTSConfig {
  /** Max age in seconds (default: 31536000 - 1 year) */
  maxAge?: number;
  /** Include subdomains */
  includeSubDomains?: boolean;
  /** Preload directive */
  preload?: boolean;
}

/**
 * Expect-CT Configuration
 */
export interface ExpectCTConfig {
  /** Max age in seconds */
  maxAge?: number;
  /** Enforce mode */
  enforce?: boolean;
  /** Report URI */
  reportUri?: string;
}

/**
 * Referrer Policy values
 */
export type ReferrerPolicy =
  | 'no-referrer'
  | 'no-referrer-when-downgrade'
  | 'origin'
  | 'origin-when-cross-origin'
  | 'same-origin'
  | 'strict-origin'
  | 'strict-origin-when-cross-origin'
  | 'unsafe-url';

/**
 * Permissions Policy Configuration
 */
export interface PermissionsPolicyConfig {
  /** Accelerometer */
  accelerometer?: string[];
  /** Ambient light sensor */
  ambientLightSensor?: string[];
  /** Autoplay */
  autoplay?: string[];
  /** Battery */
  battery?: string[];
  /** Camera */
  camera?: string[];
  /** Display capture */
  displayCapture?: string[];
  /** Document domain */
  documentDomain?: string[];
  /** Encrypted media */
  encryptedMedia?: string[];
  /** Execution while not rendered */
  executionWhileNotRendered?: string[];
  /** Execution while out of viewport */
  executionWhileOutOfViewport?: string[];
  /** Fullscreen */
  fullscreen?: string[];
  /** Geolocation */
  geolocation?: string[];
  /** Gyroscope */
  gyroscope?: string[];
  /** Layout animations */
  layoutAnimations?: string[];
  /** Legacy image formats */
  legacyImageFormats?: string[];
  /** Magnetometer */
  magnetometer?: string[];
  /** Microphone */
  microphone?: string[];
  /** Midi */
  midi?: string[];
  /** Navigation override */
  navigationOverride?: string[];
  /** Oversized images */
  oversizedImages?: string[];
  /** Payment */
  payment?: string[];
  /** Picture in picture */
  pictureInPicture?: string[];
  /** Public key credentials get */
  publicKeyCredentialsGet?: string[];
  /** Speaker selection */
  speakerSelection?: string[];
  /** Sync xhr */
  syncXhr?: string[];
  /** Unoptimized images */
  unoptimizedImages?: string[];
  /** Unsized media */
  unsizedMedia?: string[];
  /** USB */
  usb?: string[];
  /** Screen wake lock */
  screenWakeLock?: string[];
  /** Web share */
  webShare?: string[];
  /** XR spatial tracking */
  xrSpatialTracking?: string[];
}

/**
 * Sanitize Configuration
 */
export interface SanitizeConfig {
  /** Allowed HTML tags */
  allowedTags?: string[];
  /** Allowed attributes per tag */
  allowedAttributes?: Record<string, string[]>;
  /** Allowed URL schemes */
  allowedSchemes?: string[];
  /** Allow data URLs */
  allowDataUrls?: boolean;
  /** Strip all HTML */
  stripAll?: boolean;
  /** Custom sanitization function */
  customSanitizer?: (html: string) => string;
  /** Use DOMPurify if available */
  useDOMPurify?: boolean;
}

/**
 * Input Validation Configuration
 */
export interface InputValidationConfig {
  /** Maximum string length */
  maxLength?: number;
  /** Minimum string length */
  minLength?: number;
  /** Allowed pattern (regex) */
  pattern?: RegExp;
  /** Required field */
  required?: boolean;
  /** Custom validation function */
  validate?: (value: unknown) => boolean | string;
  /** Sanitize input */
  sanitize?: boolean;
  /** Trim whitespace */
  trim?: boolean;
}

/**
 * Rate Limiting Configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests */
  max?: number;
  /** Window size in milliseconds */
  windowMs?: number;
  /** Key generator function */
  keyGenerator?: (request: Request) => string;
  /** Skip function */
  skip?: (request: Request) => boolean;
  /** Handler for rate limited requests */
  handler?: (request: Request, retryAfter: number) => Response;
  /** Store for rate limit data */
  store?: RateLimitStore;
  /** Include headers in response */
  standardHeaders?: boolean;
  /** Legacy headers (X-RateLimit-*) */
  legacyHeaders?: boolean;
  /** Skip successful requests */
  skipSuccessfulRequests?: boolean;
  /** Skip failed requests */
  skipFailedRequests?: boolean;
  /** Message for rate limited requests */
  message?: string;
  /** Status code for rate limited requests (default: 429) */
  statusCode?: number;
}

/**
 * Rate Limit Store Interface
 */
export interface RateLimitStore {
  /** Increment the counter for a key */
  increment(key: string): Promise<RateLimitInfo>;
  /** Decrement the counter for a key */
  decrement(key: string): Promise<void>;
  /** Reset the counter for a key */
  resetKey(key: string): Promise<void>;
  /** Reset all counters */
  resetAll(): Promise<void>;
}

/**
 * Rate Limit Info
 */
export interface RateLimitInfo {
  /** Total number of requests */
  totalHits: number;
  /** Timestamp when the window resets */
  resetTime: Date;
}

/**
 * Middleware Context (compatible with @philjs/api)
 */
export interface SecurityContext {
  /** The request object */
  request: Request;
  /** Get a cookie value */
  getCookie: (name: string) => string | undefined;
  /** Set a cookie */
  setCookie: (name: string, value: string, options?: CookieOptions) => void;
  /** Response headers to set */
  responseHeaders: Headers;
}

/**
 * Cookie Options
 */
export interface CookieOptions {
  /** Max age in seconds */
  maxAge?: number;
  /** Expiration date */
  expires?: Date;
  /** Cookie path */
  path?: string;
  /** Cookie domain */
  domain?: string;
  /** Secure flag */
  secure?: boolean;
  /** HttpOnly flag */
  httpOnly?: boolean;
  /** SameSite attribute */
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Security Middleware Function
 */
export type SecurityMiddleware = (
  request: Request,
  next: () => Promise<Response>
) => Promise<Response>;
