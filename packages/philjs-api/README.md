# philjs-api

API routes and full-stack utilities for PhilJS applications.

## Features

- **Type-safe API routes** - End-to-end type safety from server to client
- **File-based routing** - Automatic API route generation
- **Middleware support** - Request/response interceptors
- **Request validation** - Schema validation with Zod
- **Session management** - Built-in session and cookie utilities
- **Flash messages** - Remix-style one-time messages with auto-cleanup
- **Enhanced cookie sessions** - Encrypted, signed, CSRF-protected sessions
- **Session utilities** - Timeout, validation, rotation middleware
- **CORS handling** - Cross-origin resource sharing support
- **Rate limiting** - Protect your API from abuse
- **WebSocket support** - Real-time communication

## Installation

```bash
pnpm add philjs-api
```

## Quick Start

### Create an API Route

Create `src/routes/api/users.ts`:

```typescript
import { defineAPIRoute, json } from 'philjs-api';
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string(),
  email: z.string().email()
});

export default defineAPIRoute({
  GET: async ({ request }) => {
    const users = await db.user.findMany();
    return json({ users });
  },

  POST: async ({ request }) => {
    const body = await request.json();
    const data = UserSchema.parse(body);

    const user = await db.user.create({ data });
    return json({ user }, { status: 201 });
  }
});
```

### Call from Client

```typescript
import { api } from 'philjs-api/client';

// Type-safe API calls
const { users } = await api.get('/api/users');
const { user } = await api.post('/api/users', {
  name: 'Alice',
  email: 'alice@example.com'
});
```

### Sessions and Cookies

```typescript
import { defineAPIRoute, createSession } from 'philjs-api';

const session = createSession({
  secret: process.env.SESSION_SECRET!,
  maxAge: 60 * 60 * 24 * 7 // 7 days
});

export default defineAPIRoute({
  POST: async ({ request }) => {
    const { email, password } = await request.json();
    const user = await authenticateUser(email, password);

    // Set session
    await session.set(request, 'userId', user.id);

    return json({ success: true });
  }
});
```

### Middleware

```typescript
import { defineAPIRoute, withAuth } from 'philjs-api';

export default defineAPIRoute({
  GET: withAuth(async ({ request, user }) => {
    // user is automatically available
    return json({ user });
  })
});
```

## Advanced Features

### Flash Messages

One-time messages that persist across redirects:

```typescript
import { setFlashSuccess, getFlashMessages } from 'philjs-api/flash';

// Set flash message
setFlashSuccess(session, 'Profile updated successfully!');

// Get and auto-clear
const messages = getFlashMessages(session);
```

### Enhanced Cookie Sessions

Secure sessions with encryption and CSRF protection:

```typescript
import { createCookieSessionStorage } from 'philjs-api/cookie-session';

const sessionStorage = createCookieSessionStorage({
  secret: process.env.SESSION_SECRET!,
  encryptionSecret: process.env.ENCRYPTION_SECRET!,
  csrf: true,
  rotate: true,
});
```

### Session Utilities

Helpers and middleware for session management:

```typescript
import { sessionMiddleware, sessionTimeoutMiddleware } from 'philjs-api/session-utils';

const middleware = sessionMiddleware({
  storage: sessionStorage,
  autoCommit: true,
});
```

See [FLASH_SESSIONS.md](./FLASH_SESSIONS.md) for complete documentation.

## Documentation

For more information, see the [PhilJS documentation](../../docs).

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./server, ./client, ./cookies, ./session, ./flash, ./cookie-session, ./session-utils, ./edge-middleware, ./geolocation, ./edge-ab-testing, ./edge-cache, ./server-actions
- Source files: packages/philjs-api/src/index.ts, packages/philjs-api/src/server.ts, packages/philjs-api/src/client.ts, packages/philjs-api/src/cookies.ts, packages/philjs-api/src/session.ts, packages/philjs-api/src/flash.ts, packages/philjs-api/src/cookie-session.ts, packages/philjs-api/src/session-utils.ts, packages/philjs-api/src/edge-middleware.ts, packages/philjs-api/src/geolocation.ts, packages/philjs-api/src/edge-ab-testing.ts, packages/philjs-api/src/edge-cache.ts, packages/philjs-api/src/server-actions.ts

### Public API
- Direct exports: ABTestingOptions, APIClientOptions, APIContext, APIError, APIHandler, APIRequest, APIResponse, ActionResult, AnalyticsProvider, CacheControlOptions, CacheEntry, CacheOptions, CacheStore, CloudflareCacheOptions, CloudflareProvider, CloudflareProxyProvider, CookieOptions, CookieSerializeOptions, CookieSessionOptions, CookieSessionStorage, CookieStore, CreateServerActionOptions, DEFAULT_LANGUAGE_MAP, DenoDeployProvider, EdgeContext, EdgeMiddleware, EdgeMiddlewareConfig, EdgeRequest, Experiment, ExperimentAssignment, FetchOptions, FlashCategory, FlashMessage, FlashMessageWithToast, FlashSessionData, GeoLanguageMapping, GeoLocationProvider, GeoRedirectRule, GeolocationData, GeolocationOptions, GoogleAnalyticsProvider, MultivariateExperiment, RequestWithSession, ResponseHelpers, RouteHandler, SerializableValue, ServerAction, ServerActionError, ServerActionFn, ServerActionInputType, ServerActionReturnType, ServerActionState, Session, SessionData, SessionMiddlewareOptions, SessionOptions, SessionStorage, TargetingRules, ToastOptions, TypedSession, UseFormActionReturn, UseOptimisticOptions, UseOptimisticReturn, UseServerActionOptions, UseServerActionReturn, Variant, VariantStats, VercelProvider, abTestingMiddleware, addHeadersMiddleware, apiCache, apiClient, applySessionToResponse, badRequest, cacheControlMiddleware, calculateSignificance, clearFlashMessages, clearSessionData, cloudflareCacheMiddleware, commitSession, composeEdgeMiddleware, createAPIClient, createAPIContext, createAPIHandler, createAnalyticsProvider, createCSRFInput, createCookieJar, createCookieSessionStorage, createFlashUtils, createMemorySessionStorage, createServerAction, createSessionStorage, createSignedCookie, createTypedSessionUtils, csrfMiddleware, defineAPIRoute, defineEdgeMiddleware, deleteCookie, deserialize, deserializeFlashMessages, deserializeFormData, destroySession, detectGeolocation, detectLanguage, detectLanguageFromGeo, detectLanguageFromHeader, edgeCacheMiddleware, etagMiddleware, executeEdgeMiddleware, flashMiddleware, forbidden, generateCSRFToken, generateCacheKey, generateETag, geoDistance, geoRedirectMiddleware, geolocationMiddleware, getAction, getActiveExperiments, getAllActions, getClientCSRFToken, getCookie, getFlashMessages, getFlashMessagesByCategory, getOrCreateSession, getSession, getSessionValue, handleServerActionRequest, hasFlashMessages, html, injectGeolocationData, injectVariantData, isServerAction, isVariant, isWithinRadius, json, languageDetectionMiddleware, lastModifiedMiddleware, localizedRedirectMiddleware, matchesPattern, mergeSessionData, multivariateTestingMiddleware, notFound, pageCache, parseBody, parseCookies, peekFlashMessages, purgeAllCache, purgeCacheKey, purgeCacheTags, redirect, redirectByCountry, redirectMiddleware, regenerateSession, registerAction, removeHeadersMiddleware, requireSession, revalidatePath, revalidateTag, rewriteMiddleware, securityHeadersMiddleware, selectVariantDeterministic, serialize, serializeCookie, serializeFlashMessages, serializeFormData, serverAction, serverActionsExpressMiddleware, serverActionsMiddleware, serverError, sessionMiddleware, sessionRotationMiddleware, sessionTimeoutMiddleware, sessionValidatorMiddleware, setCSRFSecret, setClientCSRFToken, setCookie, setFlash, setFlashError, setFlashInfo, setFlashSuccess, setFlashWarning, setRevalidationCallback, setSessionValue, staticAssetCache, text, unauthorized, useFetch, useFlash, useFormAction, useGeolocation, useMutation, useOptimistic, useServerAction, useVariant, variantInjectionMiddleware, variantMiddleware, variantRewriteMiddleware, varyMiddleware, verifyCSRFToken, verifySignedCookie, withCSRF
- Re-exported names: // Action creation
  createServerAction, // CSRF Protection
  setCSRFSecret, // Errors
  ServerActionError, // Hooks
  useServerAction, // Progressive enhancement
  createCSRFInput, // Request handling
  handleServerActionRequest, // Revalidation
  revalidatePath, // Serialization
  serialize, ABTest, ABTestMiddlewareOptions, ABTestVariant, ABTestingOptions, APIClientOptions, APIContext, APIHandler, APIRequest, APIResponse, ActionResult, AnalyticsProvider, CORSOptions, CacheControlOptions, CacheEntry, CacheOptions, CacheStore, CloudflareCacheOptions, CloudflareProvider, CloudflareProxyProvider, CompressionOptions, CookieOptions, CookieSerializeOptions, CookieSessionOptions, CookieSessionStorage, CookieStore, CreateServerActionOptions, DEFAULT_LANGUAGE_MAP, DenoDeployProvider, EdgeContext, EdgeMiddleware, EdgeMiddlewareConfig, EdgeRequest, Experiment, ExperimentAssignment, FetchOptions, FlashCategory, FlashMessage, FlashMessageWithToast, FlashSessionData, GeoLanguageMapping, GeoLocationProvider, GeoRedirectRule, GeolocationData, GeolocationMiddlewareOptions, GeolocationOptions, GoogleAnalyticsProvider, Middleware, MultivariateExperiment, RateLimitOptions, RateLimitStore, RequestIDOptions, RequestWithSession, RouteHandler, SecurityHeadersOptions, SerializableValue, ServerAction, ServerActionFn, ServerActionInputType, ServerActionReturnType, ServerActionState, Session, SessionData, SessionMiddlewareOptions, SessionOptions, SessionStorage, TargetingRules, ToastOptions, TypedSession, UseFormActionReturn, UseOptimisticOptions, UseOptimisticReturn, UseServerActionOptions, UseServerActionReturn, ValidationError, ValidationResult, ValidationSchema, Variant, VariantStats, VercelProvider, abTestMiddleware, addHeadersMiddleware, apiCache, apiClient, applySessionToResponse, badRequest, cacheControlMiddleware, calculateSignificance, clearFlashMessages, clearSessionData, cloudflareCacheMiddleware, commitSession, commitSessionHelper, composeEdgeMiddleware, composeMiddleware, compressionMiddleware, conditionalMiddleware, corsMiddleware, createAPIClient, createAPIHandler, createAnalyticsProvider, createCookieSessionStorage, createEnhancedCookieSessionStorage, createFlashUtils, createMemorySessionStorage, createSessionStorage, createSignedCookie, createTypedSessionUtils, createValidator, csrfMiddleware, defineAPIRoute, defineEdgeMiddleware, deleteCookie, deserialize, deserializeFlashMessages, deserializeFormData, destroySession, destroySessionHelper, detectGeolocation, detectLanguage, detectLanguageFromGeo, detectLanguageFromHeader, edgeABTestingMiddleware, edgeCacheMiddleware, edgeGeolocationMiddleware, edgeSecurityHeadersMiddleware, etagMiddleware, executeEdgeMiddleware, flashMiddleware, forbidden, generateCSRFToken, generateCacheKey, generateETag, geoDistance, geoRedirectMiddleware, geolocationMiddleware, getAction, getActiveExperiments, getAllActions, getClientCSRFToken, getCookie, getEnv, getFlashMessages, getFlashMessagesByCategory, getOrCreateSession, getPublicEnv, getSession, getSessionValue, hasFlashMessages, html, injectGeolocationData, injectVariantData, isServerAction, isVariant, isWithinRadius, json, languageDetectionMiddleware, lastModifiedMiddleware, localizedRedirectMiddleware, matchesPattern, mergeSessionData, multivariateTestingMiddleware, notFound, pageCache, parseCookies, peekFlashMessages, purgeAllCache, purgeCacheKey, purgeCacheTags, rateLimitMiddleware, redirect, redirectByCountry, redirectMiddleware, regenerateSession, registerAction, removeHeadersMiddleware, requestIDMiddleware, requireEnv, requireSession, revalidateTag, rewriteMiddleware, securityHeadersMiddleware, selectVariantDeterministic, serializeCookie, serializeFlashMessages, serializeFormData, serverAction, serverActionsExpressMiddleware, serverActionsMiddleware, serverError, sessionMiddleware, sessionRotationMiddleware, sessionTimeoutMiddleware, sessionValidatorMiddleware, setClientCSRFToken, setCookie, setFlash, setFlashError, setFlashInfo, setFlashSuccess, setFlashWarning, setRevalidationCallback, setSessionValue, staticAssetCache, text, unauthorized, useFetch, useFormAction, useGeolocation, useMutation, useOptimistic, useVariant, validate, variantInjectionMiddleware, variantMiddleware, variantRewriteMiddleware, varyMiddleware, verifyCSRFToken, verifySignedCookie, withCSRF
- Re-exported modules: ./client.js, ./cookie-session.js, ./cookies.js, ./edge-ab-testing.js, ./edge-cache.js, ./edge-middleware.js, ./env.js, ./flash.js, ./geolocation.js, ./middleware.js, ./server-actions.js, ./server.js, ./session-utils.js, ./session.js, ./validation.js
<!-- API_SNAPSHOT_END -->

## License

MIT
