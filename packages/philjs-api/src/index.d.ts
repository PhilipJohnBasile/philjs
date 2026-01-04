/**
 * PhilJS API Routes
 *
 * Full-stack API routes for PhilJS applications.
 * Similar to Next.js API routes, Remix actions, and SvelteKit form actions.
 */
export { createAPIHandler, defineAPIRoute, json, text, html, redirect, notFound, badRequest, unauthorized, forbidden, serverError, } from './server.js';
export type { APIHandler, APIContext, APIRequest, APIResponse, RouteHandler, } from './server.js';
export { getCookie, setCookie, deleteCookie, parseCookies, serializeCookie, createSignedCookie, verifySignedCookie, } from './cookies.js';
export type { CookieOptions, CookieSerializeOptions } from './cookies.js';
export { createSessionStorage, getSession, commitSession, destroySession, createCookieSessionStorage, createMemorySessionStorage, } from './session.js';
export type { Session, SessionStorage, SessionData, SessionOptions, } from './session.js';
export { apiClient, createAPIClient, useFetch, useMutation, } from './client.js';
export type { APIClientOptions, FetchOptions } from './client.js';
export { getEnv, getPublicEnv, requireEnv } from './env.js';
export { validate, createValidator, ValidationError } from './validation.js';
export type { ValidationSchema, ValidationResult } from './validation.js';
export { composeMiddleware, conditionalMiddleware, geolocationMiddleware, abTestMiddleware, rateLimitMiddleware, corsMiddleware, securityHeadersMiddleware, requestIDMiddleware, compressionMiddleware, } from './middleware.js';
export type { Middleware, GeolocationData, GeolocationMiddlewareOptions, ABTest, ABTestVariant, ABTestMiddlewareOptions, RateLimitOptions, RateLimitStore, CORSOptions, SecurityHeadersOptions, RequestIDOptions, CompressionOptions, } from './middleware.js';
export { setFlash, setFlashSuccess, setFlashError, setFlashWarning, setFlashInfo, getFlashMessages, getFlashMessagesByCategory, peekFlashMessages, clearFlashMessages, hasFlashMessages, createFlashUtils, serializeFlashMessages, deserializeFlashMessages, flashMiddleware, } from './flash.js';
export type { FlashCategory, FlashMessage, FlashSessionData, ToastOptions, FlashMessageWithToast, } from './flash.js';
export { createCookieSessionStorage as createEnhancedCookieSessionStorage, csrfMiddleware, sessionRotationMiddleware, } from './cookie-session.js';
export type { CookieSessionOptions, CookieSessionStorage, } from './cookie-session.js';
export { commitSession as commitSessionHelper, destroySession as destroySessionHelper, getOrCreateSession, requireSession, sessionMiddleware, applySessionToResponse, clearSessionData, getSessionValue, setSessionValue, mergeSessionData, createTypedSessionUtils, sessionTimeoutMiddleware, sessionValidatorMiddleware, regenerateSession, } from './session-utils.js';
export type { SessionMiddlewareOptions, RequestWithSession, TypedSession, } from './session-utils.js';
export { executeEdgeMiddleware, composeEdgeMiddleware, defineEdgeMiddleware, rewriteMiddleware, redirectMiddleware, addHeadersMiddleware, removeHeadersMiddleware, securityHeadersMiddleware as edgeSecurityHeadersMiddleware, matchesPattern, } from './edge-middleware.js';
export type { EdgeMiddleware, EdgeContext, EdgeRequest, EdgeMiddlewareConfig, CookieStore, } from './edge-middleware.js';
export { CloudflareProvider, VercelProvider, CloudflareProxyProvider, DenoDeployProvider, detectGeolocation, geolocationMiddleware as edgeGeolocationMiddleware, geoRedirectMiddleware, redirectByCountry, detectLanguageFromGeo, detectLanguageFromHeader, detectLanguage, languageDetectionMiddleware, localizedRedirectMiddleware, geoDistance, isWithinRadius, useGeolocation, injectGeolocationData, DEFAULT_LANGUAGE_MAP, } from './geolocation.js';
export type { GeoLocationProvider, GeoRedirectRule, GeoLanguageMapping, GeolocationOptions, } from './geolocation.js';
export { abTestingMiddleware as edgeABTestingMiddleware, variantInjectionMiddleware, variantMiddleware, variantRewriteMiddleware, multivariateTestingMiddleware, injectVariantData, selectVariantDeterministic, calculateSignificance, GoogleAnalyticsProvider, createAnalyticsProvider, useVariant, isVariant, getActiveExperiments, } from './edge-ab-testing.js';
export type { Variant, Experiment, TargetingRules, ExperimentAssignment, ABTestingOptions, MultivariateExperiment, AnalyticsProvider, VariantStats, } from './edge-ab-testing.js';
export { edgeCacheMiddleware, cacheControlMiddleware, generateCacheKey, generateETag, etagMiddleware, lastModifiedMiddleware, purgeCacheTags, purgeCacheKey, purgeAllCache, cloudflareCacheMiddleware, varyMiddleware, staticAssetCache, apiCache, pageCache, } from './edge-cache.js';
export type { CacheOptions, CacheControlOptions, CacheEntry, CacheStore, CloudflareCacheOptions, } from './edge-cache.js';
export { createServerAction, serverAction, registerAction, getAction, getAllActions, isServerAction, useServerAction, useFormAction, useOptimistic, setCSRFSecret, generateCSRFToken, verifyCSRFToken, setClientCSRFToken, getClientCSRFToken, serialize, deserialize, serializeFormData, deserializeFormData, handleServerActionRequest, serverActionsMiddleware, serverActionsExpressMiddleware, revalidatePath, revalidateTag, setRevalidationCallback, createCSRFInput, withCSRF, ServerActionError, } from './server-actions.js';
export type { ServerAction, ServerActionFn, ServerActionState, CreateServerActionOptions, UseServerActionOptions, UseServerActionReturn, UseFormActionReturn, UseOptimisticOptions, UseOptimisticReturn, ActionResult, SerializableValue, ServerActionReturnType, ServerActionInputType, } from './server-actions.js';
//# sourceMappingURL=index.d.ts.map