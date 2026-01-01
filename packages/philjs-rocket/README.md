# @philjs/rocket

Rocket web framework integration for PhilJS applications. Seamlessly connect Rust Rocket backends with PhilJS frontend components for full-stack type safety.

## Installation

```bash
npm install @philjs/rocket
# or
yarn add @philjs/rocket
# or
pnpm add @philjs/rocket
```

**Rust (Cargo.toml):**
```toml
[dependencies]
philjs-rocket = "0.1"
rocket = "0.5"
```

## Basic Usage

**TypeScript:**
```tsx
import { createRocketClient, useRocketQuery } from '@philjs/rocket';

const client = createRocketClient({
  baseUrl: 'http://localhost:8000',
});

function Products() {
  const { data, error } = useRocketQuery('/api/products');

  if (error) return <Error message={error} />;
  return <ProductGrid products={data} />;
}
```

**Rust:**
```rust
use philjs_rocket::{PhilJS, TypeScript};
use rocket::{get, routes, serde::json::Json};

#[derive(Serialize, TypeScript)]
struct Product {
    id: u64,
    name: String,
    price: f64,
}

#[get("/api/products")]
async fn get_products() -> Json<Vec<Product>> {
    Json(fetch_products().await)
}

#[launch]
fn rocket() -> _ {
    PhilJS::generate_types("./frontend/src/types");

    rocket::build()
        .mount("/", routes![get_products])
}
```

## Features

- **Type Bridge** - Generate TypeScript from Rocket route types
- **API Client** - Typed client matching Rocket endpoints
- **Request Guards** - Type-safe request validation
- **Fairings** - CORS, auth, and logging fairings
- **Forms** - Multipart form and file handling
- **State Management** - Shared state between routes
- **WebSocket** - Real-time WebSocket support
- **SSR** - Server-side rendering integration
- **Error Catchers** - Unified error handling
- **Testing** - Integration testing utilities

## Hooks

| Hook | Description |
|------|-------------|
| `useRocketQuery` | Fetch from Rocket endpoint |
| `useRocketMutation` | Mutations with type safety |
| `useRocketForm` | Form submission handling |
| `useRocketAuth` | Authentication integration |

## Request Guards

```rust
use philjs_rocket::guards::PhilJSAuth;

#[get("/api/protected")]
async fn protected(auth: PhilJSAuth) -> Json<UserData> {
    Json(auth.user_data())
}
```

## CLI

```bash
# Generate TypeScript types
npx philjs-rocket sync

# Watch and regenerate on changes
npx philjs-rocket watch
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./app, ./config, ./middleware, ./fairing, ./guards, ./handlers, ./responders, ./ssr, ./state, ./templates, ./websocket, ./server, ./forms, ./cookies
- Source files: packages/philjs-rocket/src/index.ts, packages/philjs-rocket/src/middleware.ts, packages/philjs-rocket/src/fairing.ts, packages/philjs-rocket/src/guards.ts, packages/philjs-rocket/src/handlers.ts, packages/philjs-rocket/src/responders.ts, packages/philjs-rocket/src/ssr.ts, packages/philjs-rocket/src/state.ts, packages/philjs-rocket/src/templates.ts, packages/philjs-rocket/src/websocket.ts, packages/philjs-rocket/src/server.ts, packages/philjs-rocket/src/forms.ts, packages/philjs-rocket/src/cookies.ts

### Public API
- Direct exports: AppState, AsyncHandler, AuthGuard, AuthGuardConfig, AuthUser, BroadcastChannel, BroadcastManager, CORSMiddleware, CORSMiddlewareConfig, CSRFField, CSRFGuard, CSRFGuardConfig, CatcherDefinition, CatcherHandler, CatcherRequest, ComponentRegistry, ComponentTemplate, CompressionMiddleware, CompressionMiddlewareConfig, Cookie, CookieJar, CookieJarImpl, CookieOptions, CustomFairing, DEFAULT_SERVER_CONFIG, DEFAULT_WS_OPTIONS, ErrorResponder, FairingComposer, FieldType, FlashMessage, FlashMessages, FormBuilder, FormDataGuard, FormDataWithFiles, FormErrors, FormField, FormSchema, FormValidationResult, FormValidator, GlobalState, Handler, HandlerContext, HeadContent, HtmlResponder, HttpMethod, JsonBodyGuard, JsonBodyGuardConfig, JsonResponder, LayoutBuilder, LayoutConfig, LinkTag, LiveViewClientMessage, LiveViewFairing, LiveViewFairingConfig, LiveViewServerMessage, LiveViewSocketBuilder, LiveViewState, ManagedState, MetaTag, MetricsFairing, MetricsFairingConfig, Middleware, Pagination, PathGuard, PresenceEntry, PresenceState, PresenceTracker, PrivateCookie, QueryGuard, QueryGuardConfig, RateLimitMiddleware, RateLimitMiddlewareConfig, RedirectResponder, RenderFunction, RequestData, RequestState, ResponseBuilder, RocketAppBuilder, RocketServer, RocketServerBuild, RocketServerConfig, RouteContext, RouteDefinition, RouteHandler, RouteResponse, SSRContext, SSRContextData, SSRContextGuard, SSRFairing, SSRFairingConfig, SSRMiddleware, SSRMiddlewareConfig, SSRRenderer, SSRRendererConfig, SSRResult, ScriptTag, SecurityMiddleware, SecurityMiddlewareConfig, Selector, SessionData, StateConfig, StateFairing, StateFairingConfig, StateManager, StreamResponder, StyleTag, TemplateEngine, TemplateEngineConfig, TemplateEngineType, TracingMiddleware, TracingMiddlewareConfig, UploadedFile, WebSocketConfig, badRequest, combineGuards, composeFairings, configureWebSocket, cookie, createAsyncHandler, createBroadcastManager, createCORSMiddleware, createComponentRegistry, createCompressionMiddleware, createCookieJar, createDerivedSelector, createDevServer, createFairing, createForm, createFormValidator, createGlobalState, createGuard, createHandler, createLayoutBuilder, createLiveViewSocket, createManagedState, createMessageDecoder, createMessageEncoder, createPresenceTracker, createProdServer, createRateLimitMiddleware, createRequestState, createRocketApp, createRocketServer, createSSRContext, createSSRMiddleware, createSSRRenderer, createSecurityMiddleware, createSelector, createStateManager, createStreamingRenderer, createTemplateEngine, createTracingMiddleware, created, csrfField, del, error, flashError, flashInfo, flashSuccess, flashWarning, forbidden, generateCsrfToken, generateJsonLd, generateRustCookieCode, generateRustFormStruct, generateRustHandler, generateRustHandlerWithBody, generateRustSSRCode, generateRustState, generateRustStateGuard, generateSEOMeta, get, getFlash, getHeader, getParam, getQuery, html, json, noContent, notFound, parseCookies, parseForm, parseFormData, parseJson, parseMultipart, parseMultipartFormData, patch, persistentCookie, post, put, redirect, removalCookie, requireParam, serializeCookie, serverError, sessionCookie, setFlash, signCookie, stream, text, unauthorized, validateCsrf, verifyCookie, withMiddleware
- Re-exported names: AppState, AsyncHandler, AuthGuard, AuthGuardConfig, AuthUser, BroadcastChannel, BroadcastManager, CORSMiddleware, CORSMiddlewareConfig, CSRFField, CSRFGuard, CSRFGuardConfig, CatcherDefinition, CatcherHandler, CatcherRequest, ComponentRegistry, ComponentTemplate, CompressionMiddleware, CompressionMiddlewareConfig, Cookie, CookieJarImpl, CustomFairing, DEFAULT_SERVER_CONFIG, DEFAULT_WS_OPTIONS, ErrorResponder, FairingComposer, FairingContext, FairingHooks, FairingResponse, FieldType, FlashMessage, FlashMessages, FormBuilder, FormDataGuard, FormDataWithFiles, FormErrors, FormField, FormSchema, FormValidationResult, FormValidator, GlobalState, GuardContext, GuardDefinition, GuardOutcome, Handler, HandlerContext, HandlerCookieJar, HandlerCookieOptions, HeadContent, HtmlResponder, HtmlResponderOptions, HttpMethod, JsonBodyGuard, JsonBodyGuardConfig, JsonResponder, JsonResponderOptions, LayoutBuilder, LayoutConfig, LinkTag, LiveViewClientMessage, LiveViewFairing, LiveViewFairingConfig, LiveViewHandler, LiveViewMessage, LiveViewPatch, LiveViewServerMessage, LiveViewSocketBuilder, LiveViewState, ManagedState, MetaTag, MetricsFairing, MetricsFairingConfig, Middleware, Pagination, PathGuard, PhilJsFairing, PresenceEntry, PresenceState, PresenceTracker, PrivateCookie, QueryGuard, QueryGuardConfig, RateLimitMiddleware, RateLimitMiddlewareConfig, RedirectResponder, RenderFunction, RequestData, RequestGuard, RequestState, ResponderOptions, ResponseBuilder, RocketCORSConfig, RocketConfig, RocketCookieJar, RocketCookieOptions, RocketFlashMessage, RocketLiveViewConfig, RocketSSRConfig, RocketSecurityConfig, RocketServer, RocketServerBuild, RocketServerConfig, RocketSessionConfig, RocketStaticConfig, RouteContext, RouteDefinition, RouteHandler, RouteResponse, SSRContext, SSRContextData, SSRContextGuard, SSRFairing, SSRFairingConfig, SSRMetaTag, SSRMiddleware, SSRMiddlewareConfig, SSRRenderer, SSRRendererConfig, SSRResult, Script, ScriptTag, SecurityMiddleware, SecurityMiddlewareConfig, Selector, SessionData, StateConfig, StateFairing, StateFairingConfig, StateManager, StreamResponder, StreamResponderOptions, StyleTag, TemplateContext, TemplateEngine, TemplateEngineConfig, TemplateEngineOptions, TemplateEngineType, TemplateHelper, TracingMiddleware, TracingMiddlewareConfig, UploadedFile, WebSocketConfig, WebSocketConnection, WebSocketMessage, WebSocketOptions, badRequest, combineGuards, composeFairings, configureWebSocket, cookie, createAsyncHandler, createBroadcastManager, createCORSMiddleware, createComponentRegistry, createCompressionMiddleware, createCookieJar, createDerivedSelector, createDevServer, createFairing, createForm, createFormValidator, createGlobalState, createGuard, createHandler, createLayoutBuilder, createLiveViewSocket, createManagedState, createMessageDecoder, createMessageEncoder, createPresenceTracker, createProdServer, createRateLimitMiddleware, createRequestState, createRocketServer, createSSRContext, createSSRMiddleware, createSSRRenderer, createSecurityMiddleware, createSelector, createStateManager, createStreamingRenderer, createTemplateEngine, createTracingMiddleware, created, csrfField, del, errorResponder, flashError, flashInfo, flashSuccess, flashWarning, forbidden, generateCsrfToken, generateJsonLd, generateRustCookieCode, generateRustFormStruct, generateRustHandler, generateRustHandlerWithBody, generateRustSSRCode, generateRustState, generateRustStateGuard, generateSEOMeta, get, getFlash, getHeader, getParam, getQuery, html, htmlResponder, json, jsonResponder, noContent, notFound, parseCookies, parseForm, parseFormData, parseJson, parseMultipart, parseMultipartFormData, patch, persistentCookie, post, put, redirect, redirectResponder, removalCookie, requireParam, serializeCookie, serverError, sessionCookie, setFlash, signCookie, streamResponder, text, unauthorized, validateCsrf, verifyCookie, withMiddleware
- Re-exported modules: ./cookies.js, ./fairing.js, ./forms.js, ./guards.js, ./handlers.js, ./middleware.js, ./responders.js, ./server.js, ./ssr.js, ./state.js, ./templates.js, ./types.js, ./websocket.js
<!-- API_SNAPSHOT_END -->

## License

MIT
