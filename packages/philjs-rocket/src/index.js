/**
 * PhilJS Rocket Integration
 *
 * Rocket web framework bindings for PhilJS applications.
 * Provides fairings, guards, responders, and WebSocket support for
 * server-side rendering with PhilJS.
 *
 * @example
 * ```typescript
 * import { createRocketApp, createRocketServer } from 'philjs-rocket';
 * import type { RocketConfig } from 'philjs-rocket';
 *
 * const config: RocketConfig = {
 *   ssr: { streaming: true },
 *   liveview: { enabled: true },
 * };
 *
 * const app = createRocketApp(config);
 * const server = createRocketServer({ port: 8000, philjs: config });
 * ```
 *
 * @packageDocumentation
 */
// Server exports
export { RocketServer, createRocketServer, createDevServer, createProdServer, DEFAULT_SERVER_CONFIG, } from './server.js';
// Handler exports
export { ResponseBuilder, html, json, text, redirect, notFound, badRequest, unauthorized, forbidden, serverError, noContent, created, withMiddleware, createHandler, createAsyncHandler, get, post, put, del, patch, parseJson, parseForm, parseMultipart, getParam, requireParam, getQuery, getHeader, generateRustHandler, generateRustHandlerWithBody, } from './handlers.js';
// Middleware exports
export { SSRMiddleware, CORSMiddleware, SecurityMiddleware, CompressionMiddleware, RateLimitMiddleware, TracingMiddleware, createSSRMiddleware, createCORSMiddleware, createSecurityMiddleware, createCompressionMiddleware, createRateLimitMiddleware, createTracingMiddleware, } from './middleware.js';
// Fairing exports
export { PhilJsFairing, SSRFairing, LiveViewFairing, StateFairing, MetricsFairing, CustomFairing, FairingComposer, createFairing, composeFairings, } from './fairing.js';
// Guard exports
export { RequestGuard, SSRContextGuard, AuthGuard, CSRFGuard, JsonBodyGuard, FormDataGuard, PathGuard, QueryGuard, createGuard, combineGuards, } from './guards.js';
// Responder exports
export { HtmlResponder, JsonResponder, StreamResponder, RedirectResponder, ErrorResponder, } from './responders.js';
export { html as htmlResponder, json as jsonResponder, stream as streamResponder, redirect as redirectResponder, error as errorResponder, } from './responders.js';
// Template exports
export { TemplateEngine, LayoutBuilder, ComponentRegistry, FlashMessages, CSRFField, Pagination, FormErrors, createTemplateEngine, createLayoutBuilder, createComponentRegistry, } from './templates.js';
// WebSocket exports
export { WebSocketConfig, LiveViewSocketBuilder, BroadcastManager, PresenceTracker, DEFAULT_WS_OPTIONS, configureWebSocket, createLiveViewSocket, createBroadcastManager, createPresenceTracker, createMessageEncoder, createMessageDecoder, } from './websocket.js';
// State exports
export { createManagedState, createStateManager, createRequestState, GlobalState, createGlobalState, createSelector, createDerivedSelector, generateRustState, generateRustStateGuard, } from './state.js';
// Forms exports
export { FormValidator, createFormValidator, parseFormData, parseMultipartFormData, generateCsrfToken, csrfField, validateCsrf, FormBuilder, createForm, generateRustFormStruct, } from './forms.js';
// Cookie exports
export { parseCookies, serializeCookie, createCookieJar, CookieJarImpl, cookie, sessionCookie, persistentCookie, removalCookie, signCookie, verifyCookie, setFlash, getFlash, flashSuccess, flashError, flashInfo, flashWarning, generateRustCookieCode, } from './cookies.js';
// SSR exports
export { SSRRenderer, createSSRContext, generateSEOMeta, generateJsonLd, createSSRRenderer, createStreamingRenderer, generateRustSSRCode, } from './ssr.js';
/**
 * Create a PhilJS-enabled Rocket application configuration
 */
export function createRocketApp(config = {}) {
    return new RocketAppBuilder(config);
}
/**
 * Rocket application builder for PhilJS integration
 */
export class RocketAppBuilder {
    config;
    constructor(config) {
        this.config = {
            ssr: { enabled: true, streaming: false, hydration: true, ...config.ssr },
            liveview: { enabled: false, ...config.liveview },
            cors: { enabled: false, ...config.cors },
            security: { enabled: true, ...config.security },
            ...config,
        };
    }
    /**
     * Enable SSR with optional configuration
     */
    withSSR(options = {}) {
        this.config.ssr = { ...this.config.ssr, ...options, enabled: true };
        return this;
    }
    /**
     * Enable LiveView with optional configuration
     */
    withLiveView(options = {}) {
        this.config.liveview = { ...this.config.liveview, ...options, enabled: true };
        return this;
    }
    /**
     * Enable CORS with optional configuration
     */
    withCORS(options = {}) {
        this.config.cors = { ...this.config.cors, ...options, enabled: true };
        return this;
    }
    /**
     * Configure security headers
     */
    withSecurity(options = {}) {
        this.config.security = { ...this.config.security, ...options, enabled: true };
        return this;
    }
    /**
     * Build the final configuration
     */
    build() {
        return this.config;
    }
    /**
     * Generate Rust configuration code
     */
    toRustConfig() {
        return `
use philjs_rocket::prelude::*;

let config = PhilJsConfig::builder()
    .ssr(SsrConfig {
        enabled: ${this.config.ssr?.enabled ?? true},
        streaming: ${this.config.ssr?.streaming ?? false},
        hydration: ${this.config.ssr?.hydration ?? true},
    })
    .liveview(LiveViewConfig {
        enabled: ${this.config.liveview?.enabled ?? false},
    })
    .build();
`.trim();
    }
}
//# sourceMappingURL=index.js.map