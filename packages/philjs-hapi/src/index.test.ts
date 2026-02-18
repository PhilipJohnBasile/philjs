/**
 * Tests for PhilJS Hapi Plugin
 *
 * Comprehensive tests for the Hapi.js integration including
 * SSR plugin, security, rate limiting, sessions, and API helpers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  // Plugins
  philjsPlugin,
  plugin,
  securityPlugin,
  rateLimitPlugin,
  sessionPlugin,
  healthPlugin,
  errorHandlerPlugin,
  // Error classes
  HttpError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  // Error factory
  errors,
  // API helpers
  createHandler,
  createApiRoutes,
  // Response helpers
  success,
  paginated,
  created,
  noContent,
  // Request helpers
  parsePagination,
  parseSort,
  createRenderContext,
  // SSE helpers
  createSignalStream,
  // Validation helpers
  validate,
  // Graceful shutdown
  gracefulShutdown,
  // Types
  type RenderContext,
  type MetaInfo,
  type AuthInfo,
  type SSRResult,
  type PhilJSPluginOptions,
  type CacheOptions,
  type RateLimitOptions,
  type SecurityOptions,
  type ContentSecurityPolicy,
  type HSTSOptions,
  type CrossOriginOptions,
  type CorsOptions,
  type SessionOptions,
  type SessionCookieOptions,
  type SessionData,
  type HealthCheckOptions,
  type HealthCheckResult,
  type SSEEvent,
  type SSEOptions,
  type ErrorHandlerOptions,
  type ApiHandlerContext,
  type ApiHandler,
  type GracefulShutdownOptions,
  type ValidationSchema,
} from './index';

// Mock request and response toolkit
function createMockRequest(overrides: Partial<any> = {}): any {
  return {
    url: {
      href: 'http://localhost/test',
    },
    path: '/test',
    query: {},
    params: {},
    payload: null,
    headers: {},
    state: {},
    info: {
      remoteAddress: '127.0.0.1',
    },
    auth: {
      isAuthenticated: false,
      credentials: null,
      artifacts: null,
    },
    app: {},
    ...overrides,
  };
}

function createMockH(): any {
  const response = {
    code: vi.fn().mockReturnThis(),
    type: vi.fn().mockReturnThis(),
    header: vi.fn().mockReturnThis(),
    state: vi.fn().mockReturnThis(),
    takeover: vi.fn().mockReturnThis(),
  };

  return {
    response: vi.fn().mockReturnValue(response),
    redirect: vi.fn().mockReturnValue({ code: vi.fn().mockReturnThis() }),
    continue: Symbol('continue'),
  };
}

describe('PhilJS Hapi Plugin', () => {
  describe('Type Definitions', () => {
    describe('RenderContext', () => {
      it('should have correct structure', () => {
        const context: RenderContext = {
          url: 'http://localhost/test',
          path: '/test',
          query: { page: '1' },
          headers: { 'content-type': 'text/html' },
          cookies: { session: 'abc123' },
          state: { user: null },
          signals: { count: 0 },
          meta: { title: 'Test Page' },
          auth: { isAuthenticated: false },
        };
        expect(context.url).toBe('http://localhost/test');
        expect(context.meta?.title).toBe('Test Page');
      });
    });

    describe('MetaInfo', () => {
      it('should accept all meta properties', () => {
        const meta: MetaInfo = {
          title: 'Page Title',
          description: 'Description',
          keywords: ['keyword1', 'keyword2'],
          openGraph: { title: 'OG Title', image: '/image.jpg' },
          twitter: { card: 'summary' },
          canonical: 'https://example.com/page',
          robots: 'index,follow',
        };
        expect(meta.keywords).toHaveLength(2);
        expect(meta.openGraph?.title).toBe('OG Title');
      });
    });

    describe('AuthInfo', () => {
      it('should have correct structure', () => {
        const auth: AuthInfo = {
          isAuthenticated: true,
          credentials: { userId: 1, email: 'test@example.com' },
          artifacts: { token: 'abc123' },
        };
        expect(auth.isAuthenticated).toBe(true);
        expect(auth.credentials?.userId).toBe(1);
      });
    });

    describe('SSRResult', () => {
      it('should have correct structure', () => {
        const result: SSRResult = {
          html: '<div>Hello</div>',
          head: '<title>Test</title>',
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

    describe('PhilJSPluginOptions', () => {
      it('should accept all plugin options', () => {
        const options: PhilJSPluginOptions = {
          ssr: true,
          render: async (url, ctx) => ({ html: '<div></div>' }),
          streamRender: async (url, ctx) => (null as any),
          excludeRoutes: ['/api', '/health'],
          includeRoutes: ['/app'],
          streaming: false,
          onError: (error, request, h) => h.response('Error'),
          beforeRender: (ctx, request) => {},
          afterRender: (result, ctx) => {},
          template: '<!DOCTYPE html><!--ssr-outlet-->',
          cache: { enabled: true, ttl: 60000 },
        };
        expect(options.ssr).toBe(true);
        expect(options.excludeRoutes).toContain('/api');
      });
    });

    describe('CacheOptions', () => {
      it('should accept all cache options', () => {
        const cache: CacheOptions = {
          enabled: true,
          ttl: 300000,
          keyGenerator: (url, ctx) => `cache:${url}`,
          useServerCache: true,
          segment: 'ssr',
          routes: ['/static'],
          excludeRoutes: ['/dynamic'],
        };
        expect(cache.enabled).toBe(true);
        expect(cache.ttl).toBe(300000);
      });
    });

    describe('RateLimitOptions', () => {
      it('should accept all rate limit options', () => {
        const options: RateLimitOptions = {
          max: 100,
          window: 60000,
          keyGenerator: (request) => request.info.remoteAddress,
          skip: (request) => request.path.startsWith('/health'),
          onExceeded: (request, h) => h.response({ error: 'Rate limited' }),
          useServerCache: false,
          segment: 'ratelimit',
          headers: true,
        };
        expect(options.max).toBe(100);
        expect(options.window).toBe(60000);
      });
    });

    describe('SecurityOptions', () => {
      it('should accept all security options', () => {
        const csp: ContentSecurityPolicy = {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'"],
          connectSrc: ["'self'"],
          mediaSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
          childSrc: ["'self'"],
          workerSrc: ["'self'"],
          frameAncestors: ["'self'"],
          formAction: ["'self'"],
          baseUri: ["'self'"],
          upgradeInsecureRequests: true,
          blockAllMixedContent: true,
          reportUri: '/csp-report',
        };

        const hsts: HSTSOptions = {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        };

        const crossOrigin: CrossOriginOptions = {
          embedderPolicy: 'require-corp',
          openerPolicy: 'same-origin',
          resourcePolicy: 'same-origin',
        };

        const options: SecurityOptions = {
          csp,
          frameOptions: 'DENY',
          contentTypeOptions: true,
          xssProtection: true,
          referrerPolicy: 'strict-origin-when-cross-origin',
          hsts,
          permissionsPolicy: { camera: [], microphone: [] },
          crossOrigin,
        };

        expect(options.frameOptions).toBe('DENY');
        expect(options.hsts?.maxAge).toBe(31536000);
      });
    });

    describe('SessionOptions', () => {
      it('should accept all session options', () => {
        const cookie: SessionCookieOptions = {
          path: '/',
          domain: 'example.com',
          ttl: 86400000,
          isSecure: true,
          isHttpOnly: true,
          isSameSite: 'Strict',
          clearInvalid: true,
          strictHeader: true,
          encoding: 'iron',
          password: 'long-secret-key',
        };

        const options: SessionOptions = {
          secret: 'my-secret',
          cookieName: 'sid',
          cookie,
          useServerCache: true,
          segment: 'sessions',
          generateId: () => 'custom-id',
        };

        expect(options.secret).toBe('my-secret');
        expect(options.cookie?.isHttpOnly).toBe(true);
      });
    });

    describe('HealthCheckOptions', () => {
      it('should accept all health check options', () => {
        const options: HealthCheckOptions = {
          path: '/health',
          readinessPath: '/health/ready',
          livenessPath: '/health/live',
          checks: {
            database: async () => ({ status: 'healthy' }),
            cache: async () => ({ status: 'healthy', message: 'Connected' }),
          },
          includeSystemInfo: true,
          auth: false,
        };

        expect(options.path).toBe('/health');
        expect(options.checks?.database).toBeDefined();
      });
    });

    describe('HealthCheckResult', () => {
      it('should have correct structure', () => {
        const result: HealthCheckResult = {
          status: 'healthy',
          message: 'All systems operational',
          details: { connections: 5 },
          latency: 10,
        };
        expect(result.status).toBe('healthy');
        expect(result.latency).toBe(10);
      });
    });

    describe('SSEEvent', () => {
      it('should have correct structure', () => {
        const event: SSEEvent = {
          id: '1',
          event: 'update',
          data: { count: 5 },
          retry: 3000,
        };
        expect(event.event).toBe('update');
        expect(event.data.count).toBe(5);
      });
    });

    describe('SSEOptions', () => {
      it('should accept all SSE options', () => {
        const options: SSEOptions = {
          retry: 3000,
          keepAlive: 30000,
          heartbeat: ':ping\n\n',
        };
        expect(options.retry).toBe(3000);
        expect(options.keepAlive).toBe(30000);
      });
    });
  });

  describe('Error Classes', () => {
    describe('HttpError', () => {
      it('should create error with status code', () => {
        const error = new HttpError(400, 'Bad Request');
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Bad Request');
        expect(error.name).toBe('HttpError');
      });

      it('should accept error options', () => {
        const error = new HttpError(400, 'Bad Request', {
          code: 'BAD_REQUEST',
          details: { field: 'email' },
          expose: true,
        });
        expect(error.code).toBe('BAD_REQUEST');
        expect(error.details).toEqual({ field: 'email' });
        expect(error.expose).toBe(true);
      });

      it('should expose client errors by default', () => {
        const clientError = new HttpError(400, 'Bad Request');
        expect(clientError.expose).toBe(true);

        const serverError = new HttpError(500, 'Internal Error');
        expect(serverError.expose).toBe(false);
      });
    });

    describe('ValidationError', () => {
      it('should create validation error with errors array', () => {
        const error = new ValidationError([
          { field: 'email', message: 'Invalid email', value: 'invalid' },
          { field: 'name', message: 'Required' },
        ]);
        expect(error.statusCode).toBe(400);
        expect(error.errors).toHaveLength(2);
        expect(error.errors[0].field).toBe('email');
      });
    });

    describe('AuthenticationError', () => {
      it('should create authentication error', () => {
        const error = new AuthenticationError('Invalid token');
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Invalid token');
        expect(error.code).toBe('AUTHENTICATION_REQUIRED');
      });

      it('should use default message', () => {
        const error = new AuthenticationError();
        expect(error.message).toBe('Authentication required');
      });
    });

    describe('AuthorizationError', () => {
      it('should create authorization error', () => {
        const error = new AuthorizationError('Cannot delete');
        expect(error.statusCode).toBe(403);
        expect(error.message).toBe('Cannot delete');
        expect(error.code).toBe('ACCESS_DENIED');
      });
    });

    describe('NotFoundError', () => {
      it('should create not found error with resource', () => {
        const error = new NotFoundError('User');
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('User not found');
        expect(error.resource).toBe('User');
      });

      it('should use default message without resource', () => {
        const error = new NotFoundError();
        expect(error.message).toBe('Resource not found');
      });
    });

    describe('ConflictError', () => {
      it('should create conflict error', () => {
        const error = new ConflictError('User already exists');
        expect(error.statusCode).toBe(409);
        expect(error.message).toBe('User already exists');
      });
    });

    describe('RateLimitError', () => {
      it('should create rate limit error with retry after', () => {
        const error = new RateLimitError(60);
        expect(error.statusCode).toBe(429);
        expect(error.retryAfter).toBe(60);
        expect(error.message).toBe('Too many requests');
      });
    });
  });

  describe('Error Factory', () => {
    it('should create bad request error', () => {
      const error = errors.badRequest('Invalid input', { field: 'email' });
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'email' });
    });

    it('should create unauthorized error', () => {
      const error = errors.unauthorized('Token expired');
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.statusCode).toBe(401);
    });

    it('should create forbidden error', () => {
      const error = errors.forbidden('Access denied');
      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.statusCode).toBe(403);
    });

    it('should create not found error', () => {
      const error = errors.notFound('User');
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('User not found');
    });

    it('should create method not allowed error', () => {
      const error = errors.methodNotAllowed('POST');
      expect(error.statusCode).toBe(405);
      expect(error.message).toContain('POST');
    });

    it('should create conflict error', () => {
      const error = errors.conflict('Already exists');
      expect(error).toBeInstanceOf(ConflictError);
      expect(error.statusCode).toBe(409);
    });

    it('should create gone error', () => {
      const error = errors.gone('Resource deleted');
      expect(error.statusCode).toBe(410);
    });

    it('should create unprocessable error', () => {
      const error = errors.unprocessable('Invalid data', { errors: [] });
      expect(error.statusCode).toBe(422);
    });

    it('should create too many requests error', () => {
      const error = errors.tooManyRequests(120);
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.retryAfter).toBe(120);
    });

    it('should create internal error', () => {
      const error = errors.internal('Server error');
      expect(error.statusCode).toBe(500);
      expect(error.expose).toBe(false);
    });

    it('should create not implemented error', () => {
      const error = errors.notImplemented('Feature');
      expect(error.statusCode).toBe(501);
      expect(error.message).toContain('Feature');
    });

    it('should create bad gateway error', () => {
      const error = errors.badGateway();
      expect(error.statusCode).toBe(502);
      expect(error.expose).toBe(false);
    });

    it('should create service unavailable error', () => {
      const error = errors.serviceUnavailable();
      expect(error.statusCode).toBe(503);
    });

    it('should create gateway timeout error', () => {
      const error = errors.gatewayTimeout();
      expect(error.statusCode).toBe(504);
    });
  });

  describe('Plugins', () => {
    describe('philjsPlugin', () => {
      it('should have correct name and version', () => {
        expect(philjsPlugin.name).toBe('philjs');
        expect(philjsPlugin.version).toBe('1.0.0');
      });

      it('should have register function', () => {
        expect(typeof philjsPlugin.register).toBe('function');
      });

      it('should be exported as default and plugin', () => {
        expect(plugin).toBe(philjsPlugin);
      });
    });

    describe('securityPlugin', () => {
      it('should have correct name', () => {
        expect(securityPlugin.name).toBe('philjs-security');
      });

      it('should have register function', () => {
        expect(typeof securityPlugin.register).toBe('function');
      });
    });

    describe('rateLimitPlugin', () => {
      it('should have correct name', () => {
        expect(rateLimitPlugin.name).toBe('philjs-rate-limit');
      });

      it('should have register function', () => {
        expect(typeof rateLimitPlugin.register).toBe('function');
      });
    });

    describe('sessionPlugin', () => {
      it('should have correct name', () => {
        expect(sessionPlugin.name).toBe('philjs-session');
      });

      it('should have register function', () => {
        expect(typeof sessionPlugin.register).toBe('function');
      });
    });

    describe('healthPlugin', () => {
      it('should have correct name', () => {
        expect(healthPlugin.name).toBe('philjs-health');
      });

      it('should have register function', () => {
        expect(typeof healthPlugin.register).toBe('function');
      });
    });

    describe('errorHandlerPlugin', () => {
      it('should have correct name', () => {
        expect(errorHandlerPlugin.name).toBe('philjs-error-handler');
      });

      it('should have register function', () => {
        expect(typeof errorHandlerPlugin.register).toBe('function');
      });
    });
  });

  describe('API Helpers', () => {
    describe('createHandler', () => {
      it('should be a function', () => {
        expect(typeof createHandler).toBe('function');
      });

      it('should create handler that wraps context', async () => {
        const handler = createHandler(async (ctx) => {
          return { received: ctx.payload, params: ctx.params };
        });

        const request = createMockRequest({
          payload: { name: 'John' },
          params: { id: '1' },
          app: {},
          auth: { isAuthenticated: false, credentials: null, artifacts: null },
        });
        const h = createMockH();

        await handler(request, h);

        expect(h.response).toHaveBeenCalled();
      });
    });

    describe('createApiRoutes', () => {
      it('should be a function', () => {
        expect(typeof createApiRoutes).toBe('function');
      });

      it('should create route helpers', () => {
        const mockServer = {
          route: vi.fn(),
        };

        const api = createApiRoutes(mockServer as any, '/api');

        expect(typeof api.get).toBe('function');
        expect(typeof api.post).toBe('function');
        expect(typeof api.put).toBe('function');
        expect(typeof api.patch).toBe('function');
        expect(typeof api.delete).toBe('function');
      });

      it('should register routes with prefix', () => {
        const mockServer = {
          route: vi.fn(),
        };

        const api = createApiRoutes(mockServer as any, '/api/v1');
        api.get('/users', async () => ({ users: [] }));

        expect(mockServer.route).toHaveBeenCalledWith(
          expect.objectContaining({
            method: 'GET',
            path: '/api/v1/users',
          })
        );
      });
    });
  });

  describe('Response Helpers', () => {
    describe('success', () => {
      it('should create success response without message', () => {
        const result = success({ id: 1, name: 'John' });
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ id: 1, name: 'John' });
        expect(result.message).toBeUndefined();
      });

      it('should create success response with message', () => {
        const result = success({ id: 1 }, 'Created successfully');
        expect(result.success).toBe(true);
        expect(result.message).toBe('Created successfully');
      });
    });

    describe('paginated', () => {
      it('should create paginated response', () => {
        const result = paginated([{ id: 1 }, { id: 2 }], 1, 10, 50);

        expect(result.data).toHaveLength(2);
        expect(result.pagination.page).toBe(1);
        expect(result.pagination.pageSize).toBe(10);
        expect(result.pagination.total).toBe(50);
        expect(result.pagination.totalPages).toBe(5);
        expect(result.pagination.hasNext).toBe(true);
        expect(result.pagination.hasPrev).toBe(false);
      });

      it('should calculate hasNext and hasPrev correctly', () => {
        const result1 = paginated([], 1, 10, 10);
        expect(result1.pagination.hasNext).toBe(false);
        expect(result1.pagination.hasPrev).toBe(false);

        const result2 = paginated([], 3, 10, 50);
        expect(result2.pagination.hasNext).toBe(true);
        expect(result2.pagination.hasPrev).toBe(true);

        const result3 = paginated([], 5, 10, 50);
        expect(result3.pagination.hasNext).toBe(false);
        expect(result3.pagination.hasPrev).toBe(true);
      });
    });

    describe('created', () => {
      it('should create 201 response', () => {
        const h = createMockH();
        created(h, { id: 1 });

        expect(h.response).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
      });

      it('should add location header', () => {
        const h = createMockH();
        const response = created(h, { id: 1 }, '/users/1');

        expect(response.header).toHaveBeenCalledWith('Location', '/users/1');
      });
    });

    describe('noContent', () => {
      it('should create 204 response', () => {
        const h = createMockH();
        noContent(h);

        expect(h.response).toHaveBeenCalledWith();
      });
    });
  });

  describe('Request Helpers', () => {
    describe('parsePagination', () => {
      it('should parse pagination with defaults', () => {
        const result = parsePagination({});
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(20);
        expect(result.offset).toBe(0);
      });

      it('should parse pagination from query', () => {
        const result = parsePagination({ page: '3', pageSize: '50' });
        expect(result.page).toBe(3);
        expect(result.pageSize).toBe(50);
        expect(result.offset).toBe(100);
      });

      it('should respect max page size', () => {
        const result = parsePagination({ pageSize: '500' }, { maxPageSize: 100 });
        expect(result.pageSize).toBe(100);
      });

      it('should enforce minimum page of 1', () => {
        const result = parsePagination({ page: '-5' });
        expect(result.page).toBe(1);
      });

      it('should use custom defaults', () => {
        const result = parsePagination({}, { page: 2, pageSize: 30 });
        expect(result.page).toBe(2);
        expect(result.pageSize).toBe(30);
      });

      it('should handle limit alias for pageSize', () => {
        const result = parsePagination({ limit: '25' });
        expect(result.pageSize).toBe(25);
      });
    });

    describe('parseSort', () => {
      it('should return null for no sort', () => {
        const result = parseSort({}, ['name', 'created_at']);
        expect(result).toBeNull();
      });

      it('should parse sort from query', () => {
        const result = parseSort({ sortBy: 'name', sortOrder: 'desc' }, ['name', 'created_at']);
        expect(result).toEqual({ field: 'name', order: 'desc' });
      });

      it('should parse sort with - prefix for desc', () => {
        const result = parseSort({ sortBy: '-name' }, ['name', 'created_at']);
        expect(result).toEqual({ field: 'name', order: 'desc' });
      });

      it('should validate against allowed fields', () => {
        const result = parseSort({ sortBy: 'invalid' }, ['name', 'created_at']);
        expect(result).toBeNull();
      });

      it('should return default sort if provided', () => {
        const result = parseSort({}, ['name'], { field: 'created_at', order: 'desc' });
        expect(result).toEqual({ field: 'created_at', order: 'desc' });
      });

      it('should handle sort/order aliases', () => {
        const result = parseSort({ sort: 'name', order: 'asc' }, ['name']);
        expect(result).toEqual({ field: 'name', order: 'asc' });
      });
    });

    describe('createRenderContext', () => {
      it('should create render context from request', () => {
        const request = createMockRequest({
          url: { href: 'http://localhost/test?page=1' },
          path: '/test',
          query: { page: '1' },
          headers: { 'content-type': 'text/html' },
          state: { session: 'abc' },
          auth: {
            isAuthenticated: true,
            credentials: { userId: 1 },
            artifacts: null,
          },
        });

        const context = createRenderContext(request);

        expect(context.url).toBe('http://localhost/test?page=1');
        expect(context.path).toBe('/test');
        expect(context.query).toEqual({ page: '1' });
        expect(context.auth?.isAuthenticated).toBe(true);
      });
    });
  });

  describe('SSE Helpers', () => {
    describe('createSignalStream', () => {
      it('should be a function', () => {
        expect(typeof createSignalStream).toBe('function');
      });

      it('should create async iterable', () => {
        let value = 0;
        const stream = createSignalStream(() => value, { interval: 10 });

        expect(stream[Symbol.asyncIterator]).toBeDefined();
      });

      it('should yield initial value if configured', async () => {
        let value = 42;
        const stream = createSignalStream(() => value, {
          interval: 10,
          includeInitial: true,
        });

        const iterator = stream[Symbol.asyncIterator]();
        const first = await iterator.next();

        expect(first.value).toEqual({ event: 'initial', data: 42 });
      });
    });
  });

  describe('Validation Helpers', () => {
    describe('validate', () => {
      it('should validate string type', () => {
        const result = validate('hello', { type: 'string' });
        expect(result.valid).toBe(true);
        expect(result.value).toBe('hello');
      });

      it('should fail for wrong string type', () => {
        const result = validate(123, { type: 'string' });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('root: expected string');
      });

      it('should validate string minLength', () => {
        const result = validate('ab', { type: 'string', minLength: 3 });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('root: minimum length is 3');
      });

      it('should validate string maxLength', () => {
        const result = validate('abcdef', { type: 'string', maxLength: 3 });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('root: maximum length is 3');
      });

      it('should validate string pattern', () => {
        const result = validate('abc', { type: 'string', pattern: '^\\d+$' });
        expect(result.valid).toBe(false);
      });

      it('should validate string enum', () => {
        const result = validate('invalid', { type: 'string', enum: ['a', 'b', 'c'] });
        expect(result.valid).toBe(false);
      });

      it('should validate number type', () => {
        const result = validate(42, { type: 'number' });
        expect(result.valid).toBe(true);
        expect(result.value).toBe(42);
      });

      it('should coerce string to number', () => {
        const result = validate('42', { type: 'number' });
        expect(result.valid).toBe(true);
        expect(result.value).toBe(42);
      });

      it('should validate number min', () => {
        const result = validate(5, { type: 'number', min: 10 });
        expect(result.valid).toBe(false);
      });

      it('should validate number max', () => {
        const result = validate(50, { type: 'number', max: 10 });
        expect(result.valid).toBe(false);
      });

      it('should validate boolean type', () => {
        const result = validate(true, { type: 'boolean' });
        expect(result.valid).toBe(true);
      });

      it('should coerce string to boolean', () => {
        const result = validate('true', { type: 'boolean' });
        expect(result.valid).toBe(true);
        expect(result.value).toBe(true);
      });

      it('should validate array type', () => {
        const result = validate([1, 2, 3], { type: 'array' });
        expect(result.valid).toBe(true);
      });

      it('should validate array items', () => {
        const result = validate(['a', 1, 'c'], {
          type: 'array',
          items: { type: 'string' },
        });
        expect(result.valid).toBe(false);
      });

      it('should validate object type', () => {
        const result = validate({ name: 'John' }, { type: 'object' });
        expect(result.valid).toBe(true);
      });

      it('should validate object properties', () => {
        const result = validate(
          { name: 'John', age: 30 },
          {
            type: 'object',
            properties: {
              name: { type: 'string' },
              age: { type: 'number' },
            },
          }
        );
        expect(result.valid).toBe(true);
        expect(result.value).toEqual({ name: 'John', age: 30 });
      });

      it('should validate required fields', () => {
        const result = validate(
          { name: 'John' },
          {
            type: 'object',
            required: ['name', 'email'],
            properties: {
              name: { type: 'string' },
              email: { type: 'string' },
            },
          }
        );
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('root.email: required');
      });

      it('should use default values', () => {
        const result = validate(undefined, { type: 'string', default: 'default' });
        expect(result.valid).toBe(true);
        expect(result.value).toBe('default');
      });
    });
  });

  describe('Graceful Shutdown', () => {
    describe('gracefulShutdown', () => {
      it('should be a function', () => {
        expect(typeof gracefulShutdown).toBe('function');
      });

      it('should accept graceful shutdown options', () => {
        const options: GracefulShutdownOptions = {
          timeout: 30000,
          signals: ['SIGTERM', 'SIGINT'],
          beforeShutdown: async () => {},
          onShutdown: () => {},
        };

        expect(options.timeout).toBe(30000);
        expect(options.signals).toContain('SIGTERM');
      });
    });
  });

  describe('ValidationSchema', () => {
    it('should support all schema types', () => {
      const stringSchema: ValidationSchema<string> = {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        pattern: '^[a-z]+$',
        enum: ['a', 'b'],
        default: 'a',
      };

      const numberSchema: ValidationSchema<number> = {
        type: 'number',
        min: 0,
        max: 100,
        default: 50,
      };

      const booleanSchema: ValidationSchema<boolean> = {
        type: 'boolean',
        default: false,
      };

      const arraySchema: ValidationSchema<string[]> = {
        type: 'array',
        items: { type: 'string' },
      };

      const objectSchema: ValidationSchema<{ name: string }> = {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
        },
      };

      expect(stringSchema.type).toBe('string');
      expect(numberSchema.type).toBe('number');
      expect(booleanSchema.type).toBe('boolean');
      expect(arraySchema.type).toBe('array');
      expect(objectSchema.type).toBe('object');
    });
  });
});
