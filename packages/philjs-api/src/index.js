/**
 * PhilJS API Routes
 *
 * Full-stack API routes for PhilJS applications.
 * Similar to Next.js API routes, Remix actions, and SvelteKit form actions.
 */
// Core API utilities
export { createAPIHandler, defineAPIRoute, json, text, html, redirect, notFound, badRequest, unauthorized, forbidden, serverError, } from './server.js';
// Cookie utilities
export { getCookie, setCookie, deleteCookie, parseCookies, serializeCookie, createSignedCookie, verifySignedCookie, } from './cookies.js';
// Session management
export { createSessionStorage, getSession, commitSession, destroySession, createCookieSessionStorage, createMemorySessionStorage, } from './session.js';
// Client utilities
export { apiClient, createAPIClient, useFetch, useMutation, } from './client.js';
// Environment variables
export { getEnv, getPublicEnv, requireEnv } from './env.js';
// Validation
export { validate, createValidator, ValidationError } from './validation.js';
// Middleware
export { composeMiddleware, conditionalMiddleware, geolocationMiddleware, abTestMiddleware, rateLimitMiddleware, corsMiddleware, securityHeadersMiddleware, requestIDMiddleware, compressionMiddleware, } from './middleware.js';
// Flash Messages
export { setFlash, setFlashSuccess, setFlashError, setFlashWarning, setFlashInfo, getFlashMessages, getFlashMessagesByCategory, peekFlashMessages, clearFlashMessages, hasFlashMessages, createFlashUtils, serializeFlashMessages, deserializeFlashMessages, flashMiddleware, } from './flash.js';
// Enhanced Cookie Sessions
export { createCookieSessionStorage as createEnhancedCookieSessionStorage, csrfMiddleware, sessionRotationMiddleware, } from './cookie-session.js';
// Session Utilities
export { commitSession as commitSessionHelper, destroySession as destroySessionHelper, getOrCreateSession, requireSession, sessionMiddleware, applySessionToResponse, clearSessionData, getSessionValue, setSessionValue, mergeSessionData, createTypedSessionUtils, sessionTimeoutMiddleware, sessionValidatorMiddleware, regenerateSession, } from './session-utils.js';
// Edge Middleware
export { executeEdgeMiddleware, composeEdgeMiddleware, defineEdgeMiddleware, rewriteMiddleware, redirectMiddleware, addHeadersMiddleware, removeHeadersMiddleware, securityHeadersMiddleware as edgeSecurityHeadersMiddleware, matchesPattern, } from './edge-middleware.js';
// Geolocation
export { CloudflareProvider, VercelProvider, CloudflareProxyProvider, DenoDeployProvider, detectGeolocation, geolocationMiddleware as edgeGeolocationMiddleware, geoRedirectMiddleware, redirectByCountry, detectLanguageFromGeo, detectLanguageFromHeader, detectLanguage, languageDetectionMiddleware, localizedRedirectMiddleware, geoDistance, isWithinRadius, useGeolocation, injectGeolocationData, DEFAULT_LANGUAGE_MAP, } from './geolocation.js';
// Edge A/B Testing
export { abTestingMiddleware as edgeABTestingMiddleware, variantInjectionMiddleware, variantMiddleware, variantRewriteMiddleware, multivariateTestingMiddleware, injectVariantData, selectVariantDeterministic, calculateSignificance, GoogleAnalyticsProvider, createAnalyticsProvider, useVariant, isVariant, getActiveExperiments, } from './edge-ab-testing.js';
// Edge Cache
export { edgeCacheMiddleware, cacheControlMiddleware, generateCacheKey, generateETag, etagMiddleware, lastModifiedMiddleware, purgeCacheTags, purgeCacheKey, purgeAllCache, cloudflareCacheMiddleware, varyMiddleware, staticAssetCache, apiCache, pageCache, } from './edge-cache.js';
// Server Actions (React 19 / Next.js 14 style)
export { 
// Action creation
createServerAction, serverAction, registerAction, getAction, getAllActions, isServerAction, 
// Hooks
useServerAction, useFormAction, useOptimistic, 
// CSRF Protection
setCSRFSecret, generateCSRFToken, verifyCSRFToken, setClientCSRFToken, getClientCSRFToken, 
// Serialization
serialize, deserialize, serializeFormData, deserializeFormData, 
// Request handling
handleServerActionRequest, serverActionsMiddleware, serverActionsExpressMiddleware, 
// Revalidation
revalidatePath, revalidateTag, setRevalidationCallback, 
// Progressive enhancement
createCSRFInput, withCSRF, 
// Errors
ServerActionError, } from './server-actions.js';
//# sourceMappingURL=index.js.map