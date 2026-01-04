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
export type { RocketConfig, RocketSSRConfig, RocketLiveViewConfig, RocketCORSConfig, RocketSecurityConfig, RocketStaticConfig, RocketSessionConfig, FairingContext, FairingResponse, FairingHooks, GuardContext, GuardOutcome, GuardDefinition, ResponderOptions, HtmlResponderOptions, JsonResponderOptions, StreamResponderOptions, MetaTag, Script, TemplateContext, FlashMessage, TemplateEngineOptions, TemplateHelper, WebSocketOptions, WebSocketMessage, WebSocketConnection, LiveViewHandler, LiveViewMessage, LiveViewPatch, } from './types.js';
export { RocketServer, createRocketServer, createDevServer, createProdServer, DEFAULT_SERVER_CONFIG, } from './server.js';
export type { RocketServerConfig, RocketServerBuild, RouteDefinition, RouteHandler, RouteContext, RouteResponse, CatcherDefinition, CatcherHandler, CatcherRequest, } from './server.js';
export { ResponseBuilder, html, json, text, redirect, notFound, badRequest, unauthorized, forbidden, serverError, noContent, created, withMiddleware, createHandler, createAsyncHandler, get, post, put, del, patch, parseJson, parseForm, parseMultipart, getParam, requireParam, getQuery, getHeader, generateRustHandler, generateRustHandlerWithBody, } from './handlers.js';
export type { HttpMethod, RequestData, HandlerContext, SessionData, Handler, AsyncHandler, Middleware, } from './handlers.js';
export type { CookieJar as HandlerCookieJar, CookieOptions as HandlerCookieOptions } from './handlers.js';
export { SSRMiddleware, CORSMiddleware, SecurityMiddleware, CompressionMiddleware, RateLimitMiddleware, TracingMiddleware, createSSRMiddleware, createCORSMiddleware, createSecurityMiddleware, createCompressionMiddleware, createRateLimitMiddleware, createTracingMiddleware, } from './middleware.js';
export type { SSRMiddlewareConfig, CORSMiddlewareConfig, SecurityMiddlewareConfig, CompressionMiddlewareConfig, RateLimitMiddlewareConfig, TracingMiddlewareConfig, } from './middleware.js';
export { PhilJsFairing, SSRFairing, LiveViewFairing, StateFairing, MetricsFairing, CustomFairing, FairingComposer, createFairing, composeFairings, } from './fairing.js';
export type { SSRFairingConfig, LiveViewFairingConfig, StateFairingConfig, MetricsFairingConfig, } from './fairing.js';
export { RequestGuard, SSRContextGuard, AuthGuard, CSRFGuard, JsonBodyGuard, FormDataGuard, PathGuard, QueryGuard, createGuard, combineGuards, } from './guards.js';
export type { SSRContextData, AuthUser, AuthGuardConfig, CSRFGuardConfig, JsonBodyGuardConfig, QueryGuardConfig, } from './guards.js';
export { HtmlResponder, JsonResponder, StreamResponder, RedirectResponder, ErrorResponder, } from './responders.js';
export { html as htmlResponder, json as jsonResponder, stream as streamResponder, redirect as redirectResponder, error as errorResponder, } from './responders.js';
export { TemplateEngine, LayoutBuilder, ComponentRegistry, FlashMessages, CSRFField, Pagination, FormErrors, createTemplateEngine, createLayoutBuilder, createComponentRegistry, } from './templates.js';
export type { TemplateEngineType, TemplateEngineConfig, LayoutConfig, ComponentTemplate, } from './templates.js';
export { WebSocketConfig, LiveViewSocketBuilder, BroadcastManager, PresenceTracker, DEFAULT_WS_OPTIONS, configureWebSocket, createLiveViewSocket, createBroadcastManager, createPresenceTracker, createMessageEncoder, createMessageDecoder, } from './websocket.js';
export type { LiveViewState, LiveViewClientMessage, LiveViewServerMessage, BroadcastChannel, PresenceEntry, PresenceState, } from './websocket.js';
export { createManagedState, createStateManager, createRequestState, GlobalState, createGlobalState, createSelector, createDerivedSelector, generateRustState, generateRustStateGuard, } from './state.js';
export type { ManagedState, StateConfig, StateManager, RequestState, AppState, Selector, } from './state.js';
export { FormValidator, createFormValidator, parseFormData, parseMultipartFormData, generateCsrfToken, csrfField, validateCsrf, FormBuilder, createForm, generateRustFormStruct, } from './forms.js';
export type { FieldType, FormField, FormSchema, FormValidationResult, UploadedFile, FormDataWithFiles, } from './forms.js';
export { parseCookies, serializeCookie, createCookieJar, CookieJarImpl, cookie, sessionCookie, persistentCookie, removalCookie, signCookie, verifyCookie, setFlash, getFlash, flashSuccess, flashError, flashInfo, flashWarning, generateRustCookieCode, } from './cookies.js';
export type { CookieOptions as RocketCookieOptions, Cookie, PrivateCookie, CookieJar as RocketCookieJar, FlashMessage as RocketFlashMessage, } from './cookies.js';
export { SSRRenderer, createSSRContext, generateSEOMeta, generateJsonLd, createSSRRenderer, createStreamingRenderer, generateRustSSRCode, } from './ssr.js';
export type { SSRContext, SSRResult, HeadContent, MetaTag as SSRMetaTag, LinkTag, ScriptTag, StyleTag, RenderFunction, SSRRendererConfig, } from './ssr.js';
import type { RocketConfig, RocketSSRConfig, RocketLiveViewConfig, RocketCORSConfig, RocketSecurityConfig } from './types.js';
/**
 * Create a PhilJS-enabled Rocket application configuration
 */
export declare function createRocketApp(config?: RocketConfig): RocketAppBuilder;
/**
 * Rocket application builder for PhilJS integration
 */
export declare class RocketAppBuilder {
    private config;
    constructor(config: RocketConfig);
    /**
     * Enable SSR with optional configuration
     */
    withSSR(options?: Partial<RocketSSRConfig>): this;
    /**
     * Enable LiveView with optional configuration
     */
    withLiveView(options?: Partial<RocketLiveViewConfig>): this;
    /**
     * Enable CORS with optional configuration
     */
    withCORS(options?: Partial<RocketCORSConfig>): this;
    /**
     * Configure security headers
     */
    withSecurity(options?: Partial<RocketSecurityConfig>): this;
    /**
     * Build the final configuration
     */
    build(): RocketConfig;
    /**
     * Generate Rust configuration code
     */
    toRustConfig(): string;
}
//# sourceMappingURL=index.d.ts.map