/**
 * PhilJS API Routes
 *
 * Full-stack API routes for PhilJS applications.
 * Similar to Next.js API routes, Remix actions, and SvelteKit form actions.
 */

// Core API utilities
export {
  createAPIHandler,
  defineAPIRoute,
  json,
  text,
  html,
  redirect,
  notFound,
  badRequest,
  unauthorized,
  forbidden,
  serverError,
} from './server';

export type {
  APIHandler,
  APIContext,
  APIRequest,
  APIResponse,
  RouteHandler,
} from './server';

// Cookie utilities
export {
  getCookie,
  setCookie,
  deleteCookie,
  parseCookies,
  serializeCookie,
  createSignedCookie,
  verifySignedCookie,
} from './cookies';

export type { CookieOptions, CookieSerializeOptions } from './cookies';

// Session management
export {
  createSessionStorage,
  getSession,
  commitSession,
  destroySession,
  createCookieSessionStorage,
  createMemorySessionStorage,
} from './session';

export type {
  Session,
  SessionStorage,
  SessionData,
  SessionOptions,
} from './session';

// Client utilities
export {
  apiClient,
  createAPIClient,
  useFetch,
  useMutation,
} from './client';

export type { APIClientOptions, FetchOptions } from './client';

// Environment variables
export { getEnv, getPublicEnv, requireEnv } from './env';

// Validation
export { validate, createValidator, ValidationError } from './validation';
export type { ValidationSchema, ValidationResult } from './validation';

// Middleware
export {
  composeMiddleware,
  conditionalMiddleware,
  geolocationMiddleware,
  abTestMiddleware,
  rateLimitMiddleware,
  corsMiddleware,
  securityHeadersMiddleware,
  requestIDMiddleware,
  compressionMiddleware,
} from './middleware';

export type {
  Middleware,
  GeolocationData,
  GeolocationMiddlewareOptions,
  ABTest,
  ABTestVariant,
  ABTestMiddlewareOptions,
  RateLimitOptions,
  RateLimitStore,
  CORSOptions,
  SecurityHeadersOptions,
  RequestIDOptions,
  CompressionOptions,
} from './middleware';

// Flash Messages
export {
  setFlash,
  setFlashSuccess,
  setFlashError,
  setFlashWarning,
  setFlashInfo,
  getFlashMessages,
  getFlashMessagesByCategory,
  peekFlashMessages,
  clearFlashMessages,
  hasFlashMessages,
  createFlashUtils,
  serializeFlashMessages,
  deserializeFlashMessages,
  flashMiddleware,
} from './flash';

export type {
  FlashCategory,
  FlashMessage,
  FlashSessionData,
  ToastOptions,
  FlashMessageWithToast,
} from './flash';

// Enhanced Cookie Sessions
export {
  createCookieSessionStorage as createEnhancedCookieSessionStorage,
  csrfMiddleware,
  sessionRotationMiddleware,
} from './cookie-session';

export type {
  CookieSessionOptions,
  CookieSessionStorage,
} from './cookie-session';

// Session Utilities
export {
  commitSession as commitSessionHelper,
  destroySession as destroySessionHelper,
  getOrCreateSession,
  requireSession,
  sessionMiddleware,
  applySessionToResponse,
  clearSessionData,
  getSessionValue,
  setSessionValue,
  mergeSessionData,
  createTypedSessionUtils,
  sessionTimeoutMiddleware,
  sessionValidatorMiddleware,
  regenerateSession,
} from './session-utils';

export type {
  SessionMiddlewareOptions,
  RequestWithSession,
  TypedSession,
} from './session-utils';

// Edge Middleware
export {
  executeEdgeMiddleware,
  composeEdgeMiddleware,
  defineEdgeMiddleware,
  rewriteMiddleware,
  redirectMiddleware,
  addHeadersMiddleware,
  removeHeadersMiddleware,
  securityHeadersMiddleware as edgeSecurityHeadersMiddleware,
  matchesPattern,
} from './edge-middleware';

export type {
  EdgeMiddleware,
  EdgeContext,
  EdgeRequest,
  EdgeMiddlewareConfig,
  CookieStore,
} from './edge-middleware';

// Geolocation
export {
  CloudflareProvider,
  VercelProvider,
  CloudflareProxyProvider,
  DenoDeployProvider,
  detectGeolocation,
  geolocationMiddleware as edgeGeolocationMiddleware,
  geoRedirectMiddleware,
  redirectByCountry,
  detectLanguageFromGeo,
  detectLanguageFromHeader,
  detectLanguage,
  languageDetectionMiddleware,
  localizedRedirectMiddleware,
  geoDistance,
  isWithinRadius,
  useGeolocation,
  injectGeolocationData,
  DEFAULT_LANGUAGE_MAP,
} from './geolocation';

export type {
  GeoLocationProvider,
  GeoRedirectRule,
  GeoLanguageMapping,
  GeolocationOptions,
} from './geolocation';

// Edge A/B Testing
export {
  abTestingMiddleware as edgeABTestingMiddleware,
  variantInjectionMiddleware,
  variantMiddleware,
  variantRewriteMiddleware,
  multivariateTestingMiddleware,
  injectVariantData,
  selectVariantDeterministic,
  calculateSignificance,
  GoogleAnalyticsProvider,
  createAnalyticsProvider,
  useVariant,
  isVariant,
  getActiveExperiments,
} from './edge-ab-testing';

export type {
  Variant,
  Experiment,
  TargetingRules,
  ExperimentAssignment,
  ABTestingOptions,
  MultivariateExperiment,
  AnalyticsProvider,
  VariantStats,
} from './edge-ab-testing';

// Edge Cache
export {
  edgeCacheMiddleware,
  cacheControlMiddleware,
  generateCacheKey,
  generateETag,
  etagMiddleware,
  lastModifiedMiddleware,
  purgeCacheTags,
  purgeCacheKey,
  purgeAllCache,
  cloudflareCacheMiddleware,
  varyMiddleware,
  staticAssetCache,
  apiCache,
  pageCache,
} from './edge-cache';

export type {
  CacheOptions,
  CacheControlOptions,
  CacheEntry,
  CacheStore,
  CloudflareCacheOptions,
} from './edge-cache';
