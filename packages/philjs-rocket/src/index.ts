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

// Re-export types (primary source)
export type {
  RocketConfig,
  RocketSSRConfig,
  RocketLiveViewConfig,
  RocketCORSConfig,
  RocketSecurityConfig,
  RocketStaticConfig,
  RocketSessionConfig,
  FairingContext,
  FairingResponse,
  FairingHooks,
  GuardContext,
  GuardOutcome,
  GuardDefinition,
  ResponderOptions,
  HtmlResponderOptions,
  JsonResponderOptions,
  StreamResponderOptions,
  MetaTag,
  Script,
  TemplateContext,
  FlashMessage,
  TemplateEngineOptions,
  TemplateHelper,
  WebSocketOptions,
  WebSocketMessage,
  WebSocketConnection,
  LiveViewHandler,
  LiveViewMessage,
  LiveViewPatch,
} from './types.js';

// Server exports
export {
  RocketServer,
  createRocketServer,
  createDevServer,
  createProdServer,
  DEFAULT_SERVER_CONFIG,
} from './server.js';
export type {
  RocketServerConfig,
  RocketServerBuild,
  RouteDefinition,
  RouteHandler,
  RouteContext,
  RouteResponse,
  CatcherDefinition,
  CatcherHandler,
  CatcherRequest,
} from './server.js';

// Handler exports
export {
  ResponseBuilder,
  html,
  json,
  text,
  redirect,
  notFound,
  badRequest,
  unauthorized,
  forbidden,
  serverError,
  noContent,
  created,
  withMiddleware,
  createHandler,
  createAsyncHandler,
  get,
  post,
  put,
  del,
  patch,
  parseJson,
  parseForm,
  parseMultipart,
  getParam,
  requireParam,
  getQuery,
  getHeader,
  generateRustHandler,
  generateRustHandlerWithBody,
} from './handlers.js';
export type {
  HttpMethod,
  RequestData,
  HandlerContext,
  SessionData,
  Handler,
  AsyncHandler,
  Middleware,
} from './handlers.js';
export type { CookieJar as HandlerCookieJar, CookieOptions as HandlerCookieOptions } from './handlers.js';

// Middleware exports
export {
  SSRMiddleware,
  CORSMiddleware,
  SecurityMiddleware,
  CompressionMiddleware,
  RateLimitMiddleware,
  TracingMiddleware,
  createSSRMiddleware,
  createCORSMiddleware,
  createSecurityMiddleware,
  createCompressionMiddleware,
  createRateLimitMiddleware,
  createTracingMiddleware,
} from './middleware.js';
export type {
  SSRMiddlewareConfig,
  CORSMiddlewareConfig,
  SecurityMiddlewareConfig,
  CompressionMiddlewareConfig,
  RateLimitMiddlewareConfig,
  TracingMiddlewareConfig,
} from './middleware.js';

// Fairing exports
export {
  PhilJsFairing,
  SSRFairing,
  LiveViewFairing,
  StateFairing,
  MetricsFairing,
  CustomFairing,
  FairingComposer,
  createFairing,
  composeFairings,
} from './fairing.js';
export type {
  SSRFairingConfig,
  LiveViewFairingConfig,
  StateFairingConfig,
  MetricsFairingConfig,
} from './fairing.js';

// Guard exports
export {
  RequestGuard,
  SSRContextGuard,
  AuthGuard,
  CSRFGuard,
  JsonBodyGuard,
  FormDataGuard,
  PathGuard,
  QueryGuard,
  createGuard,
  combineGuards,
} from './guards.js';
export type {
  SSRContextData,
  AuthUser,
  AuthGuardConfig,
  CSRFGuardConfig,
  JsonBodyGuardConfig,
  QueryGuardConfig,
} from './guards.js';

// Responder exports
export {
  HtmlResponder,
  JsonResponder,
  StreamResponder,
  RedirectResponder,
  ErrorResponder,
} from './responders.js';
export {
  html as htmlResponder,
  json as jsonResponder,
  stream as streamResponder,
  redirect as redirectResponder,
  error as errorResponder,
} from './responders.js';

// Template exports
export {
  TemplateEngine,
  LayoutBuilder,
  ComponentRegistry,
  FlashMessages,
  CSRFField,
  Pagination,
  FormErrors,
  createTemplateEngine,
  createLayoutBuilder,
  createComponentRegistry,
} from './templates.js';
export type {
  TemplateEngineType,
  TemplateEngineConfig,
  LayoutConfig,
  ComponentTemplate,
} from './templates.js';

// WebSocket exports
export {
  WebSocketConfig,
  LiveViewSocketBuilder,
  BroadcastManager,
  PresenceTracker,
  DEFAULT_WS_OPTIONS,
  configureWebSocket,
  createLiveViewSocket,
  createBroadcastManager,
  createPresenceTracker,
  createMessageEncoder,
  createMessageDecoder,
} from './websocket.js';
export type {
  LiveViewState,
  LiveViewClientMessage,
  LiveViewServerMessage,
  BroadcastChannel,
  PresenceEntry,
  PresenceState,
} from './websocket.js';

// State exports
export {
  createManagedState,
  createStateManager,
  createRequestState,
  GlobalState,
  createGlobalState,
  createSelector,
  createDerivedSelector,
  generateRustState,
  generateRustStateGuard,
} from './state.js';
export type {
  ManagedState,
  StateConfig,
  StateManager,
  RequestState,
  AppState,
  Selector,
} from './state.js';

// Forms exports
export {
  FormValidator,
  createFormValidator,
  parseFormData,
  parseMultipartFormData,
  generateCsrfToken,
  csrfField,
  validateCsrf,
  FormBuilder,
  createForm,
  generateRustFormStruct,
} from './forms.js';
export type {
  FieldType,
  FormField,
  FormSchema,
  FormValidationResult,
  UploadedFile,
  FormDataWithFiles,
} from './forms.js';

// Cookie exports
export {
  parseCookies,
  serializeCookie,
  createCookieJar,
  CookieJarImpl,
  cookie,
  sessionCookie,
  persistentCookie,
  removalCookie,
  signCookie,
  verifyCookie,
  setFlash,
  getFlash,
  flashSuccess,
  flashError,
  flashInfo,
  flashWarning,
  generateRustCookieCode,
} from './cookies.js';
export type {
  CookieOptions as RocketCookieOptions,
  Cookie,
  PrivateCookie,
  CookieJar as RocketCookieJar,
  FlashMessage as RocketFlashMessage,
} from './cookies.js';

// SSR exports
export {
  SSRRenderer,
  createSSRContext,
  generateSEOMeta,
  generateJsonLd,
  createSSRRenderer,
  createStreamingRenderer,
  generateRustSSRCode,
} from './ssr.js';
export type {
  SSRContext,
  SSRResult,
  HeadContent,
  MetaTag as SSRMetaTag,
  LinkTag,
  ScriptTag,
  StyleTag,
  RenderFunction,
  SSRRendererConfig,
} from './ssr.js';

// ============================================================================
// Application Builder
// ============================================================================

import type {
  RocketConfig,
  RocketSSRConfig,
  RocketLiveViewConfig,
  RocketCORSConfig,
  RocketSecurityConfig,
} from './types.js';

/**
 * Create a PhilJS-enabled Rocket application configuration
 */
export function createRocketApp(config: RocketConfig = {}): RocketAppBuilder {
  return new RocketAppBuilder(config);
}

/**
 * Rocket application builder for PhilJS integration
 */
export class RocketAppBuilder {
  private config: RocketConfig;

  constructor(config: RocketConfig) {
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
  withSSR(options: Partial<RocketSSRConfig> = {}): this {
    this.config.ssr = { ...this.config.ssr, ...options, enabled: true };
    return this;
  }

  /**
   * Enable LiveView with optional configuration
   */
  withLiveView(options: Partial<RocketLiveViewConfig> = {}): this {
    this.config.liveview = { ...this.config.liveview, ...options, enabled: true };
    return this;
  }

  /**
   * Enable CORS with optional configuration
   */
  withCORS(options: Partial<RocketCORSConfig> = {}): this {
    this.config.cors = { ...this.config.cors, ...options, enabled: true };
    return this;
  }

  /**
   * Configure security headers
   */
  withSecurity(options: Partial<RocketSecurityConfig> = {}): this {
    this.config.security = { ...this.config.security, ...options, enabled: true };
    return this;
  }

  /**
   * Build the final configuration
   */
  build(): RocketConfig {
    return this.config;
  }

  /**
   * Generate Rust configuration code
   */
  toRustConfig(): string {
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
