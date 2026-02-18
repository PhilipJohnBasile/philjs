/**
 * Tests for PhilJS AdonisJS Integration
 *
 * Comprehensive tests for the full AdonisJS integration including
 * SSR middleware, API controllers, validation, security, and more.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  // Error classes
  HttpError,
  ValidationException,
  AuthenticationException,
  AuthorizationException,
  NotFoundException,
  RateLimitException,
  // Error factory
  E,
  // Adapter
  PhilAdonisAdapter,
  // SSR Cache
  SSRCache,
  // Middleware factories
  createSSRMiddleware,
  createRateLimitMiddleware,
  createSecurityMiddleware,
  createCorsMiddleware,
  // Rate limiter
  RateLimiter,
  globalRateLimiter,
  // Health check
  HealthCheckService,
  createHealthCheckController,
  // Event emitter
  PhilJSEventEmitter,
  // Signal store
  SignalStore,
  // SSE
  createSSEStream,
  // Validation
  validate,
  validateOrThrow,
  // Response helpers
  response,
  // Request helpers
  request,
  // Signal re-exports
  signal,
  computed,
  effect,
  batch,
  // Types
  type IoCContainer,
  type ServiceProvider,
  type HttpContext,
  type HttpRequest,
  type HttpResponse,
  type CookieOptions,
  type SessionManager,
  type AuthManager,
  type AuthGuard,
  type ViewRenderer,
  type TagDefinition,
  type BouncerAuthorization,
  type Logger,
  type RenderContext,
  type MetaInfo,
  type OpenGraphInfo,
  type TwitterCardInfo,
  type SSRResult,
  type RenderFunction,
  type StreamRenderFunction,
  type PhilJSProviderConfig,
  type SSRMiddlewareOptions,
  type ResourceConfig,
  type RateLimitConfig,
  type SecurityConfig,
  type CorsConfig,
  type HealthCheck,
  type HealthCheckResult,
  type PhilJSEvent,
  type SSEEvent,
  type ValidationRule,
} from './index';

// Mock HTTP Context factory
function createMockContext(overrides: Partial<HttpContext> = {}): HttpContext {
  return {
    request: {
      url: () => '/test',
      method: () => 'GET',
      param: vi.fn(() => ''),
      params: () => ({}),
      input: vi.fn(() => ''),
      all: () => ({}),
      body: () => ({}),
      headers: () => ({}),
      header: vi.fn(() => undefined),
      cookie: vi.fn(() => undefined),
      cookies: () => ({}),
      ip: () => '127.0.0.1',
      ips: () => ['127.0.0.1'],
      accepts: () => null,
      is: () => null,
      hasBody: () => false,
      ajax: () => false,
      pjax: () => false,
      secure: () => false,
      hostname: () => 'localhost',
      protocol: () => 'http',
      intended: () => '/test',
      completeUrl: () => 'http://localhost/test',
    },
    response: {
      status: vi.fn().mockReturnThis(),
      header: vi.fn().mockReturnThis(),
      type: vi.fn().mockReturnThis(),
      send: vi.fn(),
      json: vi.fn(),
      html: vi.fn(),
      redirect: vi.fn(),
      cookie: vi.fn().mockReturnThis(),
      clearCookie: vi.fn().mockReturnThis(),
      download: vi.fn(),
      stream: vi.fn(),
      abort: vi.fn() as any,
      safeStatus: vi.fn().mockReturnThis(),
      getStatus: () => 200,
      getBody: () => null,
    },
    params: {},
    logger: {
      trace: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      child: vi.fn().mockReturnThis(),
    },
    ...overrides,
  };
}

describe('PhilJS AdonisJS Integration', () => {
  describe('Type Definitions', () => {
    describe('IoCContainer', () => {
      it('should define container interface', () => {
        const container: IoCContainer = {
          bind: vi.fn(),
          singleton: vi.fn(),
          use: vi.fn(),
          make: vi.fn(),
          alias: vi.fn(),
        };
        expect(container.bind).toBeDefined();
        expect(container.singleton).toBeDefined();
      });
    });

    describe('ServiceProvider', () => {
      it('should define provider interface', () => {
        const provider: ServiceProvider = {
          register: vi.fn(),
          boot: vi.fn(),
          shutdown: vi.fn(),
          ready: vi.fn(),
        };
        expect(provider.register).toBeDefined();
        expect(provider.boot).toBeDefined();
      });
    });

    describe('HttpContext', () => {
      it('should have required properties', () => {
        const ctx = createMockContext();
        expect(ctx.request).toBeDefined();
        expect(ctx.response).toBeDefined();
        expect(ctx.params).toBeDefined();
        expect(ctx.logger).toBeDefined();
      });
    });

    describe('CookieOptions', () => {
      it('should accept cookie options', () => {
        const options: CookieOptions = {
          domain: 'example.com',
          expires: new Date(),
          httpOnly: true,
          maxAge: 3600,
          path: '/',
          sameSite: 'strict',
          secure: true,
        };
        expect(options.httpOnly).toBe(true);
      });
    });

    describe('RenderContext', () => {
      it('should have correct structure', () => {
        const context: RenderContext = {
          url: 'http://localhost/test',
          path: '/test',
          query: { page: '1' },
          headers: { 'content-type': 'application/json' },
          cookies: { session: 'abc123' },
          state: { user: null },
          signals: {},
          meta: { title: 'Test Page' },
          auth: { user: null, isLoggedIn: false },
        };
        expect(context.url).toBeDefined();
        expect(context.meta?.title).toBe('Test Page');
      });
    });

    describe('MetaInfo', () => {
      it('should accept all meta properties', () => {
        const meta: MetaInfo = {
          title: 'Page Title',
          description: 'Page description',
          keywords: ['keyword1', 'keyword2'],
          canonical: 'https://example.com/page',
          openGraph: {
            title: 'OG Title',
            description: 'OG Description',
            image: 'https://example.com/image.jpg',
            url: 'https://example.com/page',
            type: 'website',
            siteName: 'Example',
          },
          twitter: {
            card: 'summary_large_image',
            site: '@example',
            creator: '@creator',
            title: 'Twitter Title',
            description: 'Twitter Description',
            image: 'https://example.com/image.jpg',
          },
          jsonLd: [{ '@type': 'WebPage' }],
        };
        expect(meta.openGraph?.type).toBe('website');
        expect(meta.twitter?.card).toBe('summary_large_image');
      });
    });

    describe('SSRResult', () => {
      it('should have correct structure', () => {
        const result: SSRResult = {
          html: '<div>Hello</div>',
          head: '<meta name="test">',
          css: '.class { color: red; }',
          state: { count: 0 },
          statusCode: 200,
          headers: { 'X-Custom': 'value' },
          redirect: undefined,
        };
        expect(result.html).toContain('Hello');
        expect(result.statusCode).toBe(200);
      });
    });
  });

  describe('Error Classes', () => {
    describe('HttpError', () => {
      it('should create HTTP error with status', () => {
        const error = new HttpError(400, 'Bad Request');
        expect(error.status).toBe(400);
        expect(error.message).toBe('Bad Request');
        expect(error.name).toBe('HttpError');
      });

      it('should accept error options', () => {
        const error = new HttpError(400, 'Bad Request', {
          code: 'E_BAD_REQUEST',
          details: { field: 'email' },
          expose: true,
        });
        expect(error.code).toBe('E_BAD_REQUEST');
        expect(error.details).toEqual({ field: 'email' });
        expect(error.expose).toBe(true);
      });

      it('should expose by default for client errors', () => {
        const clientError = new HttpError(400, 'Bad Request');
        expect(clientError.expose).toBe(true);

        const serverError = new HttpError(500, 'Internal Error');
        expect(serverError.expose).toBe(false);
      });
    });

    describe('ValidationException', () => {
      it('should create validation exception', () => {
        const error = new ValidationException(true, {
          email: ['Email is required'],
        });
        expect(error.status).toBe(422);
        expect(error.flashToSession).toBe(true);
        expect(error.messages.email).toContain('Email is required');
      });

      it('should create from messages', () => {
        const error = ValidationException.fromMessages({
          name: ['Name is required'],
          email: ['Invalid email format'],
        });
        expect(error.messages.name).toBeDefined();
        expect(error.messages.email).toBeDefined();
      });
    });

    describe('AuthenticationException', () => {
      it('should create authentication exception', () => {
        const error = new AuthenticationException('Invalid credentials', 'api', '/login');
        expect(error.status).toBe(401);
        expect(error.guard).toBe('api');
        expect(error.redirectTo).toBe('/login');
      });

      it('should use defaults', () => {
        const error = new AuthenticationException();
        expect(error.message).toBe('Unauthenticated');
        expect(error.guard).toBe('web');
      });
    });

    describe('AuthorizationException', () => {
      it('should create authorization exception', () => {
        const error = new AuthorizationException('Cannot delete');
        expect(error.status).toBe(403);
        expect(error.message).toBe('Cannot delete');
      });
    });

    describe('NotFoundException', () => {
      it('should create not found exception', () => {
        const error = new NotFoundException('User not found');
        expect(error.status).toBe(404);
        expect(error.message).toBe('User not found');
      });
    });

    describe('RateLimitException', () => {
      it('should create rate limit exception', () => {
        const error = new RateLimitException(60, 'Too many requests');
        expect(error.status).toBe(429);
        expect(error.retryAfter).toBe(60);
      });
    });
  });

  describe('Error Factory (E)', () => {
    it('should create unauthorized error', () => {
      const error = E.unauthorized('Login required', 'api', '/login');
      expect(error).toBeInstanceOf(AuthenticationException);
      expect(error.status).toBe(401);
    });

    it('should create forbidden error', () => {
      const error = E.forbidden('Access denied');
      expect(error).toBeInstanceOf(AuthorizationException);
      expect(error.status).toBe(403);
    });

    it('should create not found error', () => {
      const error = E.notFound('Resource missing');
      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.status).toBe(404);
    });

    it('should create bad request error', () => {
      const error = E.badRequest('Invalid data', { field: 'email' });
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(400);
      expect(error.details).toEqual({ field: 'email' });
    });

    it('should create conflict error', () => {
      const error = E.conflict('Resource exists');
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(409);
    });

    it('should create validation error', () => {
      const error = E.validation({ email: ['Invalid'] });
      expect(error).toBeInstanceOf(ValidationException);
      expect(error.status).toBe(422);
    });

    it('should create rate limit error', () => {
      const error = E.tooManyRequests(120);
      expect(error).toBeInstanceOf(RateLimitException);
      expect(error.retryAfter).toBe(120);
    });

    it('should create internal error', () => {
      const error = E.internal('Server error');
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(500);
      expect(error.expose).toBe(false);
    });
  });

  describe('PhilAdonisAdapter', () => {
    let container: IoCContainer;
    let adapter: PhilAdonisAdapter;

    beforeEach(() => {
      const bindings = new Map();
      container = {
        bind: vi.fn((key, factory) => bindings.set(key, factory)),
        singleton: vi.fn((key, factory) => bindings.set(key, factory)),
        use: vi.fn((key) => bindings.get(key)?.()),
        make: vi.fn((key) => bindings.get(key)?.()),
        alias: vi.fn(),
      };
      adapter = new PhilAdonisAdapter(container);
    });

    it('should register service', () => {
      const service = { name: 'test' };
      adapter.registerService('TestService', service);
      expect(container.bind).toHaveBeenCalled();
    });

    it('should register singleton', () => {
      const factory = () => ({ name: 'test' });
      adapter.registerSingleton('TestService', factory);
      expect(container.singleton).toHaveBeenCalled();
    });

    it('should check if service exists', () => {
      adapter.registerService('TestService', {});
      expect(adapter.hasService('TestService')).toBe(true);
      expect(adapter.hasService('NonExistent')).toBe(false);
    });

    it('should get all services', () => {
      adapter.registerService('Service1', { id: 1 });
      adapter.registerService('Service2', { id: 2 });
      const services = adapter.getAllServices();
      expect(services.size).toBe(2);
    });
  });

  describe('SSRCache', () => {
    let cache: SSRCache;

    beforeEach(() => {
      cache = new SSRCache(1000);
    });

    afterEach(() => {
      cache.destroy();
    });

    it('should set and get values', () => {
      const result: SSRResult = { html: '<div>Test</div>' };
      cache.set('key1', result);
      expect(cache.get('key1')).toEqual(result);
    });

    it('should return undefined for missing keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });

    it('should check if key exists', () => {
      cache.set('key1', { html: 'test' });
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
    });

    it('should delete values', () => {
      cache.set('key1', { html: 'test' });
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should clear all values', () => {
      cache.set('key1', { html: 'test1' });
      cache.set('key2', { html: 'test2' });
      cache.clear();
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
    });

    it('should accept custom TTL per entry', () => {
      cache.set('key1', { html: 'test' }, 5000);
      expect(cache.get('key1')).toBeDefined();
    });

    it('should expire entries after TTL', async () => {
      const shortCache = new SSRCache(50);
      shortCache.set('key1', { html: 'test' });
      await new Promise((r) => setTimeout(r, 100));
      expect(shortCache.get('key1')).toBeUndefined();
      shortCache.destroy();
    });
  });

  describe('SSR Middleware', () => {
    it('should create middleware function', () => {
      const middleware = createSSRMiddleware({
        render: async () => ({ html: '<div>Test</div>' }),
      });
      expect(typeof middleware).toBe('function');
    });

    it('should skip excluded paths', async () => {
      const render = vi.fn(async () => ({ html: '<div>Test</div>' }));
      const middleware = createSSRMiddleware({ render, excludePaths: ['/api'] });

      const ctx = createMockContext({
        request: { ...createMockContext().request, url: () => '/api/users' },
      });
      const next = vi.fn();

      await middleware(ctx, next);
      expect(next).toHaveBeenCalled();
      expect(render).not.toHaveBeenCalled();
    });

    it('should skip non-GET requests', async () => {
      const render = vi.fn(async () => ({ html: '<div>Test</div>' }));
      const middleware = createSSRMiddleware({ render });

      const ctx = createMockContext({
        request: { ...createMockContext().request, method: () => 'POST' },
      });
      const next = vi.fn();

      await middleware(ctx, next);
      expect(next).toHaveBeenCalled();
      expect(render).not.toHaveBeenCalled();
    });
  });

  describe('Rate Limiter', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter();
    });

    afterEach(() => {
      limiter.destroy();
    });

    it('should allow requests within limit', () => {
      const config: RateLimitConfig = { requests: 5, duration: 60 };
      const result = limiter.check('user1', config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should block requests over limit', () => {
      const config: RateLimitConfig = { requests: 2, duration: 60 };
      limiter.check('user1', config);
      limiter.check('user1', config);
      const result = limiter.check('user1', config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after duration', async () => {
      const config: RateLimitConfig = { requests: 1, duration: 0.05 };
      limiter.check('user1', config);
      await new Promise((r) => setTimeout(r, 100));
      const result = limiter.check('user1', config);
      expect(result.allowed).toBe(true);
    });

    it('should increment count', () => {
      const config: RateLimitConfig = { requests: 5, duration: 60 };
      limiter.increment('user1', config);
      limiter.increment('user1', config);
      const result = limiter.check('user1', config);
      expect(result.remaining).toBe(2);
    });

    it('should decrement count', () => {
      const config: RateLimitConfig = { requests: 5, duration: 60 };
      limiter.increment('user1', config);
      limiter.increment('user1', config);
      limiter.decrement('user1');
      const result = limiter.check('user1', config);
      expect(result.remaining).toBe(3);
    });
  });

  describe('Rate Limit Middleware', () => {
    afterEach(() => {
      globalRateLimiter.destroy();
    });

    it('should create middleware function', () => {
      const middleware = createRateLimitMiddleware({
        requests: 100,
        duration: 60,
      });
      expect(typeof middleware).toBe('function');
    });

    it('should set rate limit headers', async () => {
      const middleware = createRateLimitMiddleware({
        requests: 100,
        duration: 60,
      });
      const ctx = createMockContext();
      const next = vi.fn();

      await middleware(ctx, next);

      expect(ctx.response.header).toHaveBeenCalledWith('X-RateLimit-Limit', '100');
      expect(ctx.response.header).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(String));
    });
  });

  describe('Security Middleware', () => {
    it('should create middleware function', () => {
      const middleware = createSecurityMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('should set default security headers', async () => {
      const middleware = createSecurityMiddleware();
      const ctx = createMockContext();
      const next = vi.fn();

      await middleware(ctx, next);

      expect(ctx.response.header).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(ctx.response.header).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(ctx.response.header).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
    });

    it('should respect custom config', async () => {
      const middleware = createSecurityMiddleware({
        xFrameOptions: 'SAMEORIGIN',
        xContentTypeOptions: false,
      });
      const ctx = createMockContext();
      const next = vi.fn();

      await middleware(ctx, next);

      expect(ctx.response.header).toHaveBeenCalledWith('X-Frame-Options', 'SAMEORIGIN');
    });

    it('should set HSTS header', async () => {
      const middleware = createSecurityMiddleware({
        strictTransportSecurity: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      });
      const ctx = createMockContext();
      const next = vi.fn();

      await middleware(ctx, next);

      expect(ctx.response.header).toHaveBeenCalledWith(
        'Strict-Transport-Security',
        expect.stringContaining('max-age=31536000')
      );
    });

    it('should set CSP header', async () => {
      const middleware = createSecurityMiddleware({
        contentSecurityPolicy: {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'"],
        },
      });
      const ctx = createMockContext();
      const next = vi.fn();

      await middleware(ctx, next);

      expect(ctx.response.header).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("default-src 'self'")
      );
    });
  });

  describe('CORS Middleware', () => {
    it('should create middleware function', () => {
      const middleware = createCorsMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('should set CORS headers', async () => {
      const middleware = createCorsMiddleware({ origin: '*' });
      const ctx = createMockContext();
      const next = vi.fn();

      await middleware(ctx, next);

      expect(ctx.response.header).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        '*'
      );
    });

    it('should handle preflight requests', async () => {
      const middleware = createCorsMiddleware();
      const ctx = createMockContext({
        request: {
          ...createMockContext().request,
          method: () => 'OPTIONS',
          header: () => 'http://example.com',
        },
      });
      const next = vi.fn();

      await middleware(ctx, next);

      expect(ctx.response.header).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        expect.any(String)
      );
      expect(ctx.response.status).toHaveBeenCalledWith(204);
    });

    it('should allow specific origins', async () => {
      const middleware = createCorsMiddleware({
        origin: ['http://example.com', 'http://app.com'],
      });
      const ctx = createMockContext({
        request: {
          ...createMockContext().request,
          header: (key: string) =>
            key === 'origin' ? 'http://example.com' : undefined,
        },
      });
      const next = vi.fn();

      await middleware(ctx, next);

      expect(ctx.response.header).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'http://example.com'
      );
    });

    it('should support credentials', async () => {
      const middleware = createCorsMiddleware({ credentials: true });
      const ctx = createMockContext();
      const next = vi.fn();

      await middleware(ctx, next);

      expect(ctx.response.header).toHaveBeenCalledWith(
        'Access-Control-Allow-Credentials',
        'true'
      );
    });
  });

  describe('HealthCheckService', () => {
    let healthService: HealthCheckService;

    beforeEach(() => {
      healthService = new HealthCheckService();
    });

    it('should register health checks', () => {
      healthService.register({
        name: 'database',
        check: async () => ({ status: 'healthy' }),
      });
      // No error means success
    });

    it('should run all checks', async () => {
      healthService.register({
        name: 'database',
        check: async () => ({ status: 'healthy', message: 'Connected' }),
      });
      healthService.register({
        name: 'cache',
        check: async () => ({ status: 'healthy' }),
      });

      const result = await healthService.run();
      expect(result.status).toBe('healthy');
      expect(result.checks).toHaveLength(2);
    });

    it('should report unhealthy when check fails', async () => {
      healthService.register({
        name: 'database',
        check: async () => ({ status: 'unhealthy', message: 'Connection lost' }),
        critical: true,
      });

      const result = await healthService.run();
      expect(result.status).toBe('unhealthy');
    });

    it('should report degraded for non-critical failures', async () => {
      healthService.register({
        name: 'database',
        check: async () => ({ status: 'healthy' }),
        critical: true,
      });
      healthService.register({
        name: 'cache',
        check: async () => ({ status: 'unhealthy' }),
        critical: false,
      });

      const result = await healthService.run();
      expect(result.status).toBe('degraded');
    });

    it('should handle check exceptions', async () => {
      healthService.register({
        name: 'failing',
        check: async () => {
          throw new Error('Check failed');
        },
      });

      const result = await healthService.run();
      expect(result.checks[0].status).toBe('unhealthy');
      expect(result.checks[0].message).toBe('Check failed');
    });

    it('should check readiness', async () => {
      healthService.register({
        name: 'critical',
        check: async () => ({ status: 'healthy' }),
        critical: true,
      });

      const ready = await healthService.isReady();
      expect(ready).toBe(true);
    });

    it('should check liveness', () => {
      expect(healthService.isAlive()).toBe(true);
    });
  });

  describe('Health Check Controller', () => {
    it('should create controller', () => {
      const healthService = new HealthCheckService();
      const controller = createHealthCheckController(healthService);

      expect(controller.index).toBeDefined();
      expect(controller.liveness).toBeDefined();
      expect(controller.readiness).toBeDefined();
    });

    it('should return health status', async () => {
      const healthService = new HealthCheckService();
      healthService.register({
        name: 'test',
        check: async () => ({ status: 'healthy' }),
      });

      const controller = createHealthCheckController(healthService);
      const ctx = createMockContext();

      await controller.index(ctx);

      expect(ctx.response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          checks: expect.any(Array),
        })
      );
    });
  });

  describe('PhilJSEventEmitter', () => {
    let emitter: PhilJSEventEmitter;

    beforeEach(() => {
      emitter = new PhilJSEventEmitter();
    });

    afterEach(() => {
      emitter.removeAllListeners();
    });

    it('should register and emit events', async () => {
      const handler = vi.fn();
      emitter.on('test', handler);

      await emitter.emit('test', { value: 42 });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'test',
          data: { value: 42 },
        })
      );
    });

    it('should return unsubscribe function', async () => {
      const handler = vi.fn();
      const unsubscribe = emitter.on('test', handler);

      await emitter.emit('test', {});
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      await emitter.emit('test', {});
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support once listeners', async () => {
      const handler = vi.fn();
      emitter.once('test', handler);

      await emitter.emit('test', {});
      await emitter.emit('test', {});

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support wildcard listeners', async () => {
      const handler = vi.fn();
      emitter.on('*', handler);

      await emitter.emit('event1', {});
      await emitter.emit('event2', {});

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should remove specific listener', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      emitter.on('test', handler1);
      emitter.on('test', handler2);

      emitter.off('test', handler1);
      await emitter.emit('test', {});

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should remove all listeners for event', async () => {
      const handler = vi.fn();
      emitter.on('test', handler);
      emitter.on('test', handler);

      emitter.off('test');
      await emitter.emit('test', {});

      expect(handler).not.toHaveBeenCalled();
    });

    it('should remove all listeners', async () => {
      const handler = vi.fn();
      emitter.on('event1', handler);
      emitter.on('event2', handler);

      emitter.removeAllListeners();
      await emitter.emit('event1', {});
      await emitter.emit('event2', {});

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('SignalStore', () => {
    let store: SignalStore;

    beforeEach(() => {
      store = new SignalStore();
    });

    afterEach(() => {
      store.clear();
    });

    it('should create and get signals', () => {
      const s = store.createSignal('count', 0);
      expect(s()).toBe(0);
    });

    it('should return existing signal if already created', () => {
      const s1 = store.createSignal('count', 0);
      const s2 = store.createSignal('count', 100);
      expect(s1).toBe(s2);
      expect(s1()).toBe(0);
    });

    it('should create computed signals', () => {
      store.createSignal('count', 5);
      const doubled = store.createComputed('doubled', () => {
        const count = store.getSignal<number>('count');
        return count ? count() * 2 : 0;
      });
      expect(doubled()).toBe(10);
    });

    it('should get signal by key', () => {
      store.createSignal('test', 'value');
      const s = store.getSignal<string>('test');
      expect(s?.()).toBe('value');
    });

    it('should return undefined for missing signal', () => {
      expect(store.getSignal('missing')).toBeUndefined();
    });

    it('should serialize state', () => {
      store.createSignal('name', 'John');
      store.createSignal('age', 30);

      const state = store.serialize();
      expect(state).toEqual({ name: 'John', age: 30 });
    });

    it('should hydrate state', () => {
      const s = store.createSignal('count', 0);
      store.hydrate({ count: 42 });
      expect(s()).toBe(42);
    });

    it('should clear all signals', () => {
      store.createSignal('test', 'value');
      store.clear();
      expect(store.getSignal('test')).toBeUndefined();
    });
  });

  describe('Validation', () => {
    describe('validate', () => {
      it('should validate required fields', () => {
        const result = validate(
          { name: '' },
          { name: { type: 'string', required: true } }
        );
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.errors.name).toContain('This field is required');
        }
      });

      it('should validate string type', () => {
        const result = validate(
          { name: 123 },
          { name: { type: 'string' } }
        );
        expect(result.valid).toBe(false);
      });

      it('should validate number type', () => {
        const result = validate(
          { age: 'not a number' },
          { age: { type: 'number' } }
        );
        expect(result.valid).toBe(false);
      });

      it('should validate email type', () => {
        const result = validate(
          { email: 'invalid' },
          { email: { type: 'email' } }
        );
        expect(result.valid).toBe(false);
      });

      it('should validate url type', () => {
        const result = validate(
          { website: 'not-a-url' },
          { website: { type: 'url' } }
        );
        expect(result.valid).toBe(false);
      });

      it('should validate uuid type', () => {
        const result = validate(
          { id: 'not-a-uuid' },
          { id: { type: 'uuid' } }
        );
        expect(result.valid).toBe(false);
      });

      it('should validate minLength', () => {
        const result = validate(
          { password: 'abc' },
          { password: { type: 'string', minLength: 8 } }
        );
        expect(result.valid).toBe(false);
      });

      it('should validate maxLength', () => {
        const result = validate(
          { name: 'a'.repeat(100) },
          { name: { type: 'string', maxLength: 50 } }
        );
        expect(result.valid).toBe(false);
      });

      it('should validate min value', () => {
        const result = validate(
          { age: 5 },
          { age: { type: 'number', min: 18 } }
        );
        expect(result.valid).toBe(false);
      });

      it('should validate max value', () => {
        const result = validate(
          { score: 150 },
          { score: { type: 'number', max: 100 } }
        );
        expect(result.valid).toBe(false);
      });

      it('should validate pattern', () => {
        const result = validate(
          { code: 'abc' },
          { code: { type: 'string', pattern: /^\d{4}$/ } }
        );
        expect(result.valid).toBe(false);
      });

      it('should validate enum', () => {
        const result = validate(
          { status: 'invalid' },
          { status: { type: 'string', enum: ['active', 'inactive'] } }
        );
        expect(result.valid).toBe(false);
      });

      it('should validate custom rules', () => {
        const result = validate(
          { value: 5 },
          {
            value: {
              type: 'number',
              custom: (v) => v % 2 === 0 || 'Must be even',
            },
          }
        );
        expect(result.valid).toBe(false);
      });

      it('should pass valid data', () => {
        const result = validate(
          { name: 'John', email: 'john@example.com', age: 25 },
          {
            name: { type: 'string', required: true, minLength: 2 },
            email: { type: 'email', required: true },
            age: { type: 'number', min: 18 },
          }
        );
        expect(result.valid).toBe(true);
      });

      it('should skip undefined optional fields', () => {
        const result = validate(
          { name: 'John' },
          {
            name: { type: 'string', required: true },
            age: { type: 'number' },
          }
        );
        expect(result.valid).toBe(true);
      });
    });

    describe('validateOrThrow', () => {
      it('should return data on valid input', () => {
        const data = validateOrThrow(
          { name: 'John' },
          { name: { type: 'string', required: true } }
        );
        expect(data.name).toBe('John');
      });

      it('should throw ValidationException on invalid input', () => {
        expect(() =>
          validateOrThrow(
            { email: 'invalid' },
            { email: { type: 'email', required: true } }
          )
        ).toThrow(ValidationException);
      });
    });
  });

  describe('Response Helpers', () => {
    it('should send success response', () => {
      const ctx = createMockContext();
      response.success(ctx, { id: 1 }, { message: 'OK' });

      expect(ctx.response.json).toHaveBeenCalledWith({
        success: true,
        data: { id: 1 },
        message: 'OK',
      });
    });

    it('should send created response', () => {
      const ctx = createMockContext();
      response.created(ctx, { id: 1 });

      expect(ctx.response.status).toHaveBeenCalledWith(201);
      expect(ctx.response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: { id: 1 },
        })
      );
    });

    it('should send paginated response', () => {
      const ctx = createMockContext();
      response.paginated(ctx, [{ id: 1 }, { id: 2 }], {
        page: 1,
        perPage: 10,
        total: 50,
      });

      expect(ctx.response.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.any(Array),
          meta: expect.objectContaining({
            page: 1,
            perPage: 10,
            total: 50,
            totalPages: 5,
            hasNext: true,
            hasPrev: false,
          }),
        })
      );
    });

    it('should send no content response', () => {
      const ctx = createMockContext();
      response.noContent(ctx);

      expect(ctx.response.status).toHaveBeenCalledWith(204);
      expect(ctx.response.send).toHaveBeenCalledWith(null);
    });

    it('should send error response', () => {
      const ctx = createMockContext();
      response.error(ctx, 400, 'Bad Request', 'E_BAD_REQUEST');

      expect(ctx.response.status).toHaveBeenCalledWith(400);
      expect(ctx.response.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Bad Request',
          code: 'E_BAD_REQUEST',
        },
      });
    });
  });

  describe('Request Helpers', () => {
    it('should parse pagination', () => {
      const ctx = createMockContext({
        request: {
          ...createMockContext().request,
          input: vi.fn((key, def) => {
            if (key === 'page') return '2';
            if (key === 'per_page') return '25';
            return def;
          }),
        },
      });

      const pagination = request.pagination(ctx);
      expect(pagination.page).toBe(2);
      expect(pagination.perPage).toBe(25);
      expect(pagination.offset).toBe(25);
    });

    it('should use pagination defaults', () => {
      const ctx = createMockContext();
      const pagination = request.pagination(ctx);
      expect(pagination.page).toBe(1);
      expect(pagination.perPage).toBe(20);
    });

    it('should parse sorting', () => {
      const ctx = createMockContext({
        request: {
          ...createMockContext().request,
          input: vi.fn((key, def) => {
            if (key === 'sort_by') return 'name';
            if (key === 'sort_order') return 'asc';
            return def;
          }),
        },
      });

      const sorting = request.sorting(ctx, ['name', 'created_at']);
      expect(sorting.sortBy).toBe('name');
      expect(sorting.sortOrder).toBe('asc');
    });

    it('should validate allowed sort fields', () => {
      const ctx = createMockContext({
        request: {
          ...createMockContext().request,
          input: vi.fn((key, def) => {
            if (key === 'sort_by') return 'invalid_field';
            return def;
          }),
        },
      });

      const sorting = request.sorting(ctx, ['name', 'created_at'], 'created_at');
      expect(sorting.sortBy).toBe('created_at');
    });

    it('should parse filters', () => {
      const ctx = createMockContext({
        request: {
          ...createMockContext().request,
          input: vi.fn((key) => {
            if (key === 'status') return 'active';
            if (key === 'category') return 'tech';
            return undefined;
          }),
        },
      });

      const filters = request.filters(ctx, ['status', 'category', 'unused']);
      expect(filters).toEqual({ status: 'active', category: 'tech' });
    });
  });

  describe('Signal Re-exports', () => {
    it('should export signal function', () => {
      expect(typeof signal).toBe('function');
    });

    it('should export computed function', () => {
      expect(typeof computed).toBe('function');
    });

    it('should export effect function', () => {
      expect(typeof effect).toBe('function');
    });

    it('should export batch function', () => {
      expect(typeof batch).toBe('function');
    });

    it('should export globalRateLimiter', () => {
      expect(globalRateLimiter).toBeInstanceOf(RateLimiter);
    });
  });
});
