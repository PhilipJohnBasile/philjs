/**
 * Tests for PhilJS Elysia Plugin
 *
 * High-performance Elysia plugin for PhilJS SSR on Bun with security,
 * session management, rate limiting, and more.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  // Main plugins
  philjs,
  security,
  cors,
  rateLimit,
  session,
  errorHandler,
  logger,
  healthCheck,
  websocket,
  createApp,
  // Error classes
  HttpError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServiceUnavailableError,
  errors,
  // In-memory stores
  InMemoryRateLimitStore,
  InMemorySessionStore,
  InMemoryCache,
  globalCache,
  // API helpers
  createHandler,
  response,
  request,
  // SSE
  sse,
  createSignalStream,
  // Validation
  validate,
  validateBody,
  // Graceful shutdown
  gracefulShutdown,
  // Types
  type RenderContext,
  type MetaInfo,
  type OpenGraphInfo,
  type TwitterCardInfo,
  type SSRResult,
  type RenderFunction,
  type StreamRenderFunction,
  type PhilJSPluginOptions,
  type SecurityOptions,
  type CSPOptions,
  type HSTSOptions,
  type ReferrerPolicy,
  type CORSOptions,
  type RateLimitOptions,
  type RateLimitStore,
  type SessionOptions,
  type SessionStore,
  type SessionData,
  type HealthCheckOptions,
  type HealthCheck,
  type HealthCheckResult,
  type ErrorHandlerOptions,
  type LoggerOptions,
  type WebSocketOptions,
  type ApiContext,
  type ApiHandler,
  type SSEOptions,
  type SSEEvent,
  type ValidationSchema,
  type CreateAppOptions,
} from './index';

describe('PhilJS Elysia Plugin', () => {
  describe('Type Definitions', () => {
    describe('RenderContext', () => {
      it('should define render context structure', () => {
        const context: RenderContext = {
          url: 'https://example.com/page',
          path: '/page',
          query: { foo: 'bar' },
          headers: { 'content-type': 'text/html' },
          cookies: { session: 'abc123' },
          state: { user: { id: 1 } },
          signals: { count: 0 },
          meta: { title: 'Test Page' },
        };
        expect(context.url).toBe('https://example.com/page');
        expect(context.path).toBe('/page');
        expect(context.query.foo).toBe('bar');
      });
    });

    describe('MetaInfo', () => {
      it('should define meta info structure', () => {
        const meta: MetaInfo = {
          title: 'Page Title',
          description: 'Page description',
          keywords: ['keyword1', 'keyword2'],
          canonical: 'https://example.com/page',
          openGraph: {
            title: 'OG Title',
            description: 'OG Description',
            image: 'https://example.com/image.png',
            url: 'https://example.com/page',
            type: 'website',
            siteName: 'Example Site',
          },
          twitter: {
            card: 'summary_large_image',
            site: '@example',
            creator: '@author',
            title: 'Twitter Title',
            description: 'Twitter Description',
            image: 'https://example.com/twitter-image.png',
          },
          jsonLd: [{ '@type': 'WebPage', name: 'Test' }],
        };
        expect(meta.title).toBe('Page Title');
        expect(meta.openGraph?.type).toBe('website');
        expect(meta.twitter?.card).toBe('summary_large_image');
      });
    });

    describe('OpenGraphInfo', () => {
      it('should define open graph structure', () => {
        const og: OpenGraphInfo = {
          title: 'OG Title',
          description: 'OG Description',
          image: 'https://example.com/og.png',
          url: 'https://example.com',
          type: 'article',
          siteName: 'My Site',
        };
        expect(og.type).toBe('article');
      });
    });

    describe('TwitterCardInfo', () => {
      it('should define twitter card structure', () => {
        const twitter: TwitterCardInfo = {
          card: 'summary',
          site: '@site',
          creator: '@creator',
          title: 'Title',
          description: 'Description',
          image: 'https://example.com/twitter.png',
        };
        expect(twitter.card).toBe('summary');
      });

      it('should accept all card types', () => {
        const cardTypes: TwitterCardInfo['card'][] = ['summary', 'summary_large_image', 'app', 'player'];
        expect(cardTypes.length).toBe(4);
      });
    });

    describe('SSRResult', () => {
      it('should define SSR result structure', () => {
        const result: SSRResult = {
          html: '<div>Hello</div>',
          head: '<title>Test</title>',
          css: '.test { color: red; }',
          state: { count: 0 },
          statusCode: 200,
          headers: { 'X-Custom': 'value' },
          redirect: undefined,
        };
        expect(result.html).toBe('<div>Hello</div>');
        expect(result.statusCode).toBe(200);
      });

      it('should handle redirect', () => {
        const result: SSRResult = {
          html: '',
          statusCode: 302,
          redirect: '/new-location',
        };
        expect(result.redirect).toBe('/new-location');
      });
    });

    describe('PhilJSPluginOptions', () => {
      it('should define plugin options', () => {
        const render: RenderFunction = (ctx) => ({ html: '<div>Test</div>' });
        const options: PhilJSPluginOptions = {
          render,
          template: '<!DOCTYPE html><html></html>',
          basePath: '/app',
          excludePaths: ['/api', '/static'],
          cacheControl: 'max-age=3600',
          enableStreaming: true,
          onError: (err, ctx) => ({ html: '<div>Error</div>', statusCode: 500 }),
        };
        expect(options.basePath).toBe('/app');
        expect(options.enableStreaming).toBe(true);
      });
    });

    describe('SecurityOptions', () => {
      it('should define security options', () => {
        const options: SecurityOptions = {
          contentSecurityPolicy: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'"],
          },
          xFrameOptions: 'DENY',
          xContentTypeOptions: true,
          xXssProtection: true,
          strictTransportSecurity: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          },
          referrerPolicy: 'strict-origin-when-cross-origin',
          permissionsPolicy: { camera: [], microphone: [] },
          crossOriginEmbedderPolicy: 'require-corp',
          crossOriginOpenerPolicy: 'same-origin',
          crossOriginResourcePolicy: 'same-origin',
        };
        expect(options.xFrameOptions).toBe('DENY');
        expect(options.strictTransportSecurity?.preload).toBe(true);
      });
    });

    describe('CSPOptions', () => {
      it('should define CSP options', () => {
        const csp: CSPOptions = {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", 'https://cdn.example.com'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'https://fonts.googleapis.com'],
          connectSrc: ["'self'", 'https://api.example.com'],
          mediaSrc: ["'none'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
          frameAncestors: ["'none'"],
          workerSrc: ["'self'"],
          childSrc: ["'none'"],
          formAction: ["'self'"],
          baseUri: ["'self'"],
          sandbox: ['allow-scripts', 'allow-same-origin'],
          reportUri: '/csp-report',
          reportTo: 'csp-endpoint',
          upgradeInsecureRequests: true,
          blockAllMixedContent: true,
        };
        expect(csp.upgradeInsecureRequests).toBe(true);
        expect(csp.sandbox).toContain('allow-scripts');
      });
    });

    describe('HSTSOptions', () => {
      it('should define HSTS options', () => {
        const hsts: HSTSOptions = {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        };
        expect(hsts.maxAge).toBe(31536000);
      });
    });

    describe('ReferrerPolicy', () => {
      it('should accept all referrer policy values', () => {
        const policies: ReferrerPolicy[] = [
          'no-referrer',
          'no-referrer-when-downgrade',
          'origin',
          'origin-when-cross-origin',
          'same-origin',
          'strict-origin',
          'strict-origin-when-cross-origin',
          'unsafe-url',
        ];
        expect(policies.length).toBe(8);
      });
    });

    describe('CORSOptions', () => {
      it('should define CORS options', () => {
        const options: CORSOptions = {
          origin: ['https://example.com', 'https://app.example.com'],
          methods: ['GET', 'POST', 'PUT', 'DELETE'],
          allowedHeaders: ['Content-Type', 'Authorization'],
          exposedHeaders: ['X-Request-Id'],
          credentials: true,
          maxAge: 86400,
          preflight: true,
        };
        expect(options.credentials).toBe(true);
        expect(options.maxAge).toBe(86400);
      });

      it('should accept function origin', () => {
        const options: CORSOptions = {
          origin: (origin) => origin.endsWith('.example.com'),
        };
        expect(typeof options.origin).toBe('function');
      });
    });

    describe('RateLimitOptions', () => {
      it('should define rate limit options', () => {
        const options: RateLimitOptions = {
          windowMs: 60000,
          max: 100,
          message: 'Too many requests',
          statusCode: 429,
          keyGenerator: (ctx) => 'user-id',
          skip: (ctx) => false,
          headers: true,
        };
        expect(options.windowMs).toBe(60000);
        expect(options.max).toBe(100);
      });
    });

    describe('RateLimitStore', () => {
      it('should define store interface', () => {
        const store: RateLimitStore = {
          increment: async (key) => ({ count: 1, resetTime: Date.now() + 60000 }),
          decrement: async (key) => {},
          reset: async (key) => {},
        };
        expect(typeof store.increment).toBe('function');
        expect(typeof store.decrement).toBe('function');
        expect(typeof store.reset).toBe('function');
      });
    });

    describe('SessionOptions', () => {
      it('should define session options', () => {
        const options: SessionOptions = {
          secret: 'super-secret-key',
          name: 'session.id',
          maxAge: 86400000,
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          path: '/',
          domain: '.example.com',
          rolling: true,
          renew: true,
        };
        expect(options.secret).toBe('super-secret-key');
        expect(options.sameSite).toBe('strict');
      });
    });

    describe('SessionStore', () => {
      it('should define session store interface', () => {
        const store: SessionStore = {
          get: async (id) => null,
          set: async (id, data, maxAge) => {},
          destroy: async (id) => {},
          touch: async (id, maxAge) => {},
        };
        expect(typeof store.get).toBe('function');
        expect(typeof store.set).toBe('function');
        expect(typeof store.destroy).toBe('function');
        expect(typeof store.touch).toBe('function');
      });
    });

    describe('SessionData', () => {
      it('should define session data structure', () => {
        const data: SessionData = {
          id: 'session-123',
          data: { userId: 1, role: 'admin' },
          createdAt: Date.now(),
          updatedAt: Date.now(),
          expiresAt: Date.now() + 86400000,
        };
        expect(data.id).toBe('session-123');
        expect(data.data.userId).toBe(1);
      });
    });

    describe('HealthCheckOptions', () => {
      it('should define health check options', () => {
        const options: HealthCheckOptions = {
          path: '/_health',
          livenessPath: '/_health/live',
          readinessPath: '/_health/ready',
          checks: [
            {
              name: 'database',
              check: async () => ({ status: 'healthy', latency: 10 }),
              critical: true,
            },
          ],
        };
        expect(options.path).toBe('/_health');
        expect(options.checks?.length).toBe(1);
      });
    });

    describe('HealthCheck', () => {
      it('should define health check structure', () => {
        const check: HealthCheck = {
          name: 'redis',
          check: async () => ({
            status: 'healthy',
            message: 'Connected',
            latency: 5,
            details: { host: 'localhost' },
          }),
          critical: true,
        };
        expect(check.name).toBe('redis');
        expect(check.critical).toBe(true);
      });
    });

    describe('HealthCheckResult', () => {
      it('should define health check result', () => {
        const result: HealthCheckResult = {
          status: 'healthy',
          message: 'All systems operational',
          latency: 15,
          details: { version: '1.0.0' },
        };
        expect(result.status).toBe('healthy');
      });

      it('should accept all status values', () => {
        const statuses: HealthCheckResult['status'][] = ['healthy', 'unhealthy', 'degraded'];
        expect(statuses.length).toBe(3);
      });
    });

    describe('ErrorHandlerOptions', () => {
      it('should define error handler options', () => {
        const options: ErrorHandlerOptions = {
          includeStackTrace: false,
          logErrors: true,
          onError: (error, ctx) => console.error(error),
        };
        expect(options.includeStackTrace).toBe(false);
        expect(options.logErrors).toBe(true);
      });
    });

    describe('LoggerOptions', () => {
      it('should define logger options', () => {
        const options: LoggerOptions = {
          level: 'info',
          format: 'json',
          skip: (ctx) => false,
          customFields: (ctx) => ({ requestId: 'req-123' }),
        };
        expect(options.level).toBe('info');
        expect(options.format).toBe('json');
      });

      it('should accept all log levels', () => {
        const levels: LoggerOptions['level'][] = ['debug', 'info', 'warn', 'error'];
        expect(levels.length).toBe(4);
      });

      it('should accept all formats', () => {
        const formats: LoggerOptions['format'][] = ['json', 'pretty', 'combined'];
        expect(formats.length).toBe(3);
      });
    });

    describe('WebSocketOptions', () => {
      it('should define websocket options', () => {
        const options: WebSocketOptions = {
          path: '/ws',
          heartbeat: 30000,
          maxPayload: 1024 * 1024,
          onConnect: (ws, ctx) => {},
          onMessage: (ws, message, ctx) => {},
          onClose: (ws, code, reason, ctx) => {},
          onError: (ws, error, ctx) => {},
        };
        expect(options.path).toBe('/ws');
        expect(options.heartbeat).toBe(30000);
      });
    });

    describe('ApiContext', () => {
      it('should define API context structure', () => {
        const ctx: ApiContext<{ name: string }, { id: string }, { page: string }> = {
          body: { name: 'Test' },
          params: { id: '123' },
          query: { page: '1' },
          headers: { 'content-type': 'application/json' },
          request: {} as Request,
          set: {},
          session: { userId: 1 },
        };
        expect(ctx.body.name).toBe('Test');
        expect(ctx.params.id).toBe('123');
      });
    });

    describe('SSEOptions', () => {
      it('should define SSE options', () => {
        const options: SSEOptions = {
          retry: 3000,
          headers: { 'X-Custom': 'value' },
        };
        expect(options.retry).toBe(3000);
      });
    });

    describe('SSEEvent', () => {
      it('should define SSE event structure', () => {
        const event: SSEEvent = {
          id: 'event-1',
          event: 'message',
          data: { text: 'Hello' },
          retry: 5000,
        };
        expect(event.id).toBe('event-1');
        expect(event.event).toBe('message');
      });
    });

    describe('ValidationSchema', () => {
      it('should define validation schema', () => {
        const schema: ValidationSchema = {
          type: 'string',
          required: true,
          minLength: 1,
          maxLength: 100,
          pattern: /^[a-z]+$/,
        };
        expect(schema.type).toBe('string');
        expect(schema.required).toBe(true);
      });

      it('should accept all types', () => {
        const types: ValidationSchema['type'][] = ['string', 'number', 'boolean', 'object', 'array'];
        expect(types.length).toBe(5);
      });

      it('should support nested object schema', () => {
        const schema: ValidationSchema = {
          type: 'object',
          required: true,
          properties: {
            name: { type: 'string', required: true },
            age: { type: 'number', min: 0, max: 150 },
          },
        };
        expect(schema.properties?.name.type).toBe('string');
      });

      it('should support array schema', () => {
        const schema: ValidationSchema = {
          type: 'array',
          items: { type: 'string', minLength: 1 },
        };
        expect(schema.items?.type).toBe('string');
      });

      it('should support custom validation', () => {
        const schema: ValidationSchema = {
          type: 'string',
          custom: (value) => value.startsWith('prefix_') || 'Must start with prefix_',
        };
        expect(typeof schema.custom).toBe('function');
      });
    });

    describe('CreateAppOptions', () => {
      it('should define create app options', () => {
        const render: RenderFunction = () => ({ html: '<div>Test</div>' });
        const options: CreateAppOptions = {
          render,
          security: { xFrameOptions: 'DENY' },
          cors: { origin: '*' },
          rateLimit: { max: 100 },
          session: { secret: 'secret' },
          logger: { level: 'info' },
          healthCheck: { path: '/_health' },
          errorHandler: { logErrors: true },
        };
        expect(typeof options.render).toBe('function');
      });

      it('should allow disabling plugins', () => {
        const render: RenderFunction = () => ({ html: '<div>Test</div>' });
        const options: CreateAppOptions = {
          render,
          security: false,
          cors: false,
          rateLimit: false,
          logger: false,
          healthCheck: false,
          errorHandler: false,
        };
        expect(options.security).toBe(false);
      });
    });
  });

  describe('Error Classes', () => {
    describe('HttpError', () => {
      it('should create HTTP error with status code', () => {
        const error = new HttpError(400, 'Bad Request');
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Bad Request');
        expect(error.name).toBe('HttpError');
        expect(error.expose).toBe(true);
      });

      it('should create 5xx error with expose false by default', () => {
        const error = new HttpError(500, 'Internal Error');
        expect(error.expose).toBe(false);
      });

      it('should accept options', () => {
        const error = new HttpError(400, 'Bad Request', {
          code: 'INVALID_INPUT',
          details: { field: 'email' },
          expose: false,
        });
        expect(error.code).toBe('INVALID_INPUT');
        expect(error.details).toEqual({ field: 'email' });
        expect(error.expose).toBe(false);
      });
    });

    describe('ValidationError', () => {
      it('should create validation error', () => {
        const errors = [
          { field: 'email', message: 'Invalid email', value: 'notanemail' },
          { field: 'name', message: 'Required' },
        ];
        const error = new ValidationError(errors);
        expect(error.statusCode).toBe(400);
        expect(error.name).toBe('ValidationError');
        expect(error.errors).toEqual(errors);
        expect(error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('AuthenticationError', () => {
      it('should create authentication error', () => {
        const error = new AuthenticationError();
        expect(error.statusCode).toBe(401);
        expect(error.message).toBe('Authentication required');
        expect(error.name).toBe('AuthenticationError');
        expect(error.code).toBe('AUTHENTICATION_ERROR');
      });

      it('should accept custom message', () => {
        const error = new AuthenticationError('Invalid token');
        expect(error.message).toBe('Invalid token');
      });
    });

    describe('AuthorizationError', () => {
      it('should create authorization error', () => {
        const error = new AuthorizationError();
        expect(error.statusCode).toBe(403);
        expect(error.message).toBe('Access denied');
        expect(error.name).toBe('AuthorizationError');
        expect(error.code).toBe('AUTHORIZATION_ERROR');
      });

      it('should accept custom message', () => {
        const error = new AuthorizationError('Insufficient permissions');
        expect(error.message).toBe('Insufficient permissions');
      });
    });

    describe('NotFoundError', () => {
      it('should create not found error', () => {
        const error = new NotFoundError();
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Resource not found');
        expect(error.name).toBe('NotFoundError');
        expect(error.code).toBe('NOT_FOUND');
      });

      it('should accept resource name', () => {
        const error = new NotFoundError('User');
        expect(error.message).toBe('User not found');
      });
    });

    describe('ConflictError', () => {
      it('should create conflict error', () => {
        const error = new ConflictError();
        expect(error.statusCode).toBe(409);
        expect(error.message).toBe('Resource conflict');
        expect(error.name).toBe('ConflictError');
        expect(error.code).toBe('CONFLICT');
      });

      it('should accept custom message', () => {
        const error = new ConflictError('Email already exists');
        expect(error.message).toBe('Email already exists');
      });
    });

    describe('RateLimitError', () => {
      it('should create rate limit error', () => {
        const error = new RateLimitError(60);
        expect(error.statusCode).toBe(429);
        expect(error.message).toBe('Too many requests');
        expect(error.name).toBe('RateLimitError');
        expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
        expect(error.retryAfter).toBe(60);
      });

      it('should accept custom message', () => {
        const error = new RateLimitError(120, 'Rate limit exceeded');
        expect(error.message).toBe('Rate limit exceeded');
        expect(error.retryAfter).toBe(120);
      });
    });

    describe('ServiceUnavailableError', () => {
      it('should create service unavailable error', () => {
        const error = new ServiceUnavailableError();
        expect(error.statusCode).toBe(503);
        expect(error.message).toBe('Service temporarily unavailable');
        expect(error.name).toBe('ServiceUnavailableError');
        expect(error.code).toBe('SERVICE_UNAVAILABLE');
      });

      it('should accept custom message', () => {
        const error = new ServiceUnavailableError('Database maintenance');
        expect(error.message).toBe('Database maintenance');
      });
    });
  });

  describe('Error Factory', () => {
    describe('errors object', () => {
      it('should create bad request error', () => {
        const error = errors.badRequest('Invalid input', { field: 'email' });
        expect(error.statusCode).toBe(400);
        expect(error.code).toBe('BAD_REQUEST');
        expect(error.details).toEqual({ field: 'email' });
      });

      it('should create unauthorized error', () => {
        const error = errors.unauthorized('Invalid credentials');
        expect(error.statusCode).toBe(401);
        expect(error instanceof AuthenticationError).toBe(true);
      });

      it('should create forbidden error', () => {
        const error = errors.forbidden('Access denied');
        expect(error.statusCode).toBe(403);
        expect(error instanceof AuthorizationError).toBe(true);
      });

      it('should create not found error', () => {
        const error = errors.notFound('User');
        expect(error.statusCode).toBe(404);
        expect(error instanceof NotFoundError).toBe(true);
      });

      it('should create method not allowed error', () => {
        const error = errors.methodNotAllowed('POST not allowed');
        expect(error.statusCode).toBe(405);
        expect(error.code).toBe('METHOD_NOT_ALLOWED');
      });

      it('should create conflict error', () => {
        const error = errors.conflict('Already exists');
        expect(error.statusCode).toBe(409);
        expect(error instanceof ConflictError).toBe(true);
      });

      it('should create gone error', () => {
        const error = errors.gone('Resource deleted');
        expect(error.statusCode).toBe(410);
        expect(error.code).toBe('GONE');
      });

      it('should create unprocessable error', () => {
        const error = errors.unprocessable('Cannot process', { reason: 'invalid state' });
        expect(error.statusCode).toBe(422);
        expect(error.code).toBe('UNPROCESSABLE_ENTITY');
      });

      it('should create too many requests error', () => {
        const error = errors.tooManyRequests(30);
        expect(error.statusCode).toBe(429);
        expect(error instanceof RateLimitError).toBe(true);
        expect(error.retryAfter).toBe(30);
      });

      it('should create internal error', () => {
        const error = errors.internal('Server error');
        expect(error.statusCode).toBe(500);
        expect(error.code).toBe('INTERNAL_ERROR');
        expect(error.expose).toBe(false);
      });

      it('should create not implemented error', () => {
        const error = errors.notImplemented('Feature coming soon');
        expect(error.statusCode).toBe(501);
        expect(error.code).toBe('NOT_IMPLEMENTED');
      });

      it('should create service unavailable error', () => {
        const error = errors.serviceUnavailable('Under maintenance');
        expect(error.statusCode).toBe(503);
        expect(error instanceof ServiceUnavailableError).toBe(true);
      });

      it('should create gateway timeout error', () => {
        const error = errors.gatewayTimeout('Upstream timeout');
        expect(error.statusCode).toBe(504);
        expect(error.code).toBe('GATEWAY_TIMEOUT');
      });
    });
  });

  describe('In-Memory Stores', () => {
    describe('InMemoryRateLimitStore', () => {
      it('should be a class', () => {
        expect(typeof InMemoryRateLimitStore).toBe('function');
      });

      it('should implement RateLimitStore interface', () => {
        const store = new InMemoryRateLimitStore(60000);
        expect(typeof store.increment).toBe('function');
        expect(typeof store.decrement).toBe('function');
        expect(typeof store.reset).toBe('function');
      });

      it('should track request counts', async () => {
        const store = new InMemoryRateLimitStore(60000);
        const result1 = await store.increment('key1');
        expect(result1.count).toBe(1);

        const result2 = await store.increment('key1');
        expect(result2.count).toBe(2);

        const result3 = await store.increment('key1');
        expect(result3.count).toBe(3);
      });

      it('should decrement count', async () => {
        const store = new InMemoryRateLimitStore(60000);
        await store.increment('key1');
        await store.increment('key1');
        await store.decrement('key1');
        const result = await store.increment('key1');
        expect(result.count).toBe(3);
      });

      it('should reset count', async () => {
        const store = new InMemoryRateLimitStore(60000);
        await store.increment('key1');
        await store.increment('key1');
        await store.reset('key1');
        const result = await store.increment('key1');
        expect(result.count).toBe(1);
      });
    });

    describe('InMemorySessionStore', () => {
      it('should be a class', () => {
        expect(typeof InMemorySessionStore).toBe('function');
      });

      it('should implement SessionStore interface', () => {
        const store = new InMemorySessionStore();
        expect(typeof store.get).toBe('function');
        expect(typeof store.set).toBe('function');
        expect(typeof store.destroy).toBe('function');
        expect(typeof store.touch).toBe('function');
      });

      it('should store and retrieve sessions', async () => {
        const store = new InMemorySessionStore();
        const sessionData: SessionData = {
          id: 'session-1',
          data: { userId: 1 },
          createdAt: Date.now(),
          updatedAt: Date.now(),
          expiresAt: Date.now() + 86400000,
        };

        await store.set('session-1', sessionData, 86400000);
        const retrieved = await store.get('session-1');
        expect(retrieved?.id).toBe('session-1');
        expect(retrieved?.data.userId).toBe(1);
      });

      it('should return null for non-existent session', async () => {
        const store = new InMemorySessionStore();
        const result = await store.get('non-existent');
        expect(result).toBeNull();
      });

      it('should destroy sessions', async () => {
        const store = new InMemorySessionStore();
        const sessionData: SessionData = {
          id: 'session-1',
          data: {},
          createdAt: Date.now(),
          updatedAt: Date.now(),
          expiresAt: Date.now() + 86400000,
        };

        await store.set('session-1', sessionData, 86400000);
        await store.destroy('session-1');
        const result = await store.get('session-1');
        expect(result).toBeNull();
      });
    });

    describe('InMemoryCache', () => {
      it('should be a class', () => {
        expect(typeof InMemoryCache).toBe('function');
      });

      it('should cache and retrieve values', () => {
        const cache = new InMemoryCache();
        cache.set('key1', { value: 'test' }, 60000);
        const result = cache.get<{ value: string }>('key1');
        expect(result?.value).toBe('test');
      });

      it('should return undefined for non-existent keys', () => {
        const cache = new InMemoryCache();
        const result = cache.get('non-existent');
        expect(result).toBeUndefined();
      });

      it('should delete cached values', () => {
        const cache = new InMemoryCache();
        cache.set('key1', 'value', 60000);
        const deleted = cache.delete('key1');
        expect(deleted).toBe(true);
        expect(cache.get('key1')).toBeUndefined();
      });

      it('should clear all cached values', () => {
        const cache = new InMemoryCache();
        cache.set('key1', 'value1', 60000);
        cache.set('key2', 'value2', 60000);
        cache.clear();
        expect(cache.get('key1')).toBeUndefined();
        expect(cache.get('key2')).toBeUndefined();
      });
    });

    describe('globalCache', () => {
      it('should be an instance of InMemoryCache', () => {
        expect(globalCache).toBeDefined();
        expect(typeof globalCache.get).toBe('function');
        expect(typeof globalCache.set).toBe('function');
        expect(typeof globalCache.delete).toBe('function');
        expect(typeof globalCache.clear).toBe('function');
      });
    });
  });

  describe('API Helpers', () => {
    describe('createHandler', () => {
      it('should be a function', () => {
        expect(typeof createHandler).toBe('function');
      });

      it('should create a handler function', () => {
        const handler = createHandler<{ name: string }, { id: string }, { page: string }, { success: boolean }>(
          async (ctx) => {
            return { success: true };
          }
        );
        expect(typeof handler).toBe('function');
      });
    });

    describe('response helpers', () => {
      it('should create success response', () => {
        const result = response.success({ id: 1, name: 'Test' }, { message: 'OK' });
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ id: 1, name: 'Test' });
        expect(result.message).toBe('OK');
      });

      it('should create success response without message', () => {
        const result = response.success({ id: 1 });
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ id: 1 });
        expect(result).not.toHaveProperty('message');
      });

      it('should create created response', () => {
        const result = response.created({ id: 1 }, 'User created');
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ id: 1 });
        expect(result.message).toBe('User created');
      });

      it('should create paginated response', () => {
        const items = [{ id: 1 }, { id: 2 }];
        const result = response.paginated(items, { page: 2, limit: 10, total: 45 });
        expect(result.success).toBe(true);
        expect(result.data).toEqual(items);
        expect(result.pagination.page).toBe(2);
        expect(result.pagination.limit).toBe(10);
        expect(result.pagination.total).toBe(45);
        expect(result.pagination.totalPages).toBe(5);
        expect(result.pagination.hasNext).toBe(true);
        expect(result.pagination.hasPrev).toBe(true);
      });

      it('should calculate pagination correctly for first page', () => {
        const result = response.paginated([], { page: 1, limit: 10, total: 25 });
        expect(result.pagination.hasNext).toBe(true);
        expect(result.pagination.hasPrev).toBe(false);
      });

      it('should calculate pagination correctly for last page', () => {
        const result = response.paginated([], { page: 3, limit: 10, total: 25 });
        expect(result.pagination.hasNext).toBe(false);
        expect(result.pagination.hasPrev).toBe(true);
      });

      it('should create no content response', () => {
        const result = response.noContent();
        expect(result instanceof Response).toBe(true);
        expect(result.status).toBe(204);
      });
    });

    describe('request helpers', () => {
      it('should parse pagination from query', () => {
        const result = request.parsePagination({ page: '3', limit: '25' });
        expect(result.page).toBe(3);
        expect(result.limit).toBe(25);
        expect(result.offset).toBe(50);
      });

      it('should use default pagination values', () => {
        const result = request.parsePagination({});
        expect(result.page).toBe(1);
        expect(result.limit).toBe(20);
        expect(result.offset).toBe(0);
      });

      it('should enforce minimum page of 1', () => {
        const result = request.parsePagination({ page: '0' });
        expect(result.page).toBe(1);
      });

      it('should enforce maximum limit of 100', () => {
        const result = request.parsePagination({ limit: '200' });
        expect(result.limit).toBe(100);
      });

      it('should parse sort from query', () => {
        const result = request.parseSort(
          { sortBy: 'name', sortOrder: 'asc' },
          ['name', 'createdAt', 'updatedAt']
        );
        expect(result.sortBy).toBe('name');
        expect(result.sortOrder).toBe('asc');
      });

      it('should use default sort values', () => {
        const result = request.parseSort({}, ['name', 'createdAt']);
        expect(result.sortBy).toBe('createdAt');
        expect(result.sortOrder).toBe('desc');
      });

      it('should reject invalid sort field', () => {
        const result = request.parseSort(
          { sortBy: 'invalid' },
          ['name', 'createdAt']
        );
        expect(result.sortBy).toBe('createdAt');
      });
    });
  });

  describe('SSE', () => {
    describe('sse function', () => {
      it('should be a function', () => {
        expect(typeof sse).toBe('function');
      });

      it('should return SSE helpers', () => {
        const sseHelper = sse();
        expect(typeof sseHelper.stream).toBe('function');
        expect(typeof sseHelper.send).toBe('function');
      });

      it('should accept options', () => {
        const sseHelper = sse({ retry: 5000, headers: { 'X-Custom': 'value' } });
        expect(sseHelper).toBeDefined();
      });

      it('should send array of events', () => {
        const sseHelper = sse();
        const events: SSEEvent[] = [
          { id: '1', event: 'update', data: { count: 1 } },
          { id: '2', event: 'update', data: { count: 2 } },
        ];
        const response = sseHelper.send(events);
        expect(response instanceof Response).toBe(true);
        expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      });
    });

    describe('createSignalStream', () => {
      it('should be a function', () => {
        expect(typeof createSignalStream).toBe('function');
      });

      it('should create an async generator', () => {
        let value = 0;
        const stream = createSignalStream(() => value, { interval: 100 });
        expect(stream[Symbol.asyncIterator]).toBeDefined();
      });

      it('should emit signal updates', async () => {
        let value = 0;
        const abortController = new AbortController();

        const stream = createSignalStream(() => value, {
          interval: 10,
          signal: abortController.signal,
        });

        const events: SSEEvent[] = [];
        const iterator = stream[Symbol.asyncIterator]();

        // Get first event
        value = 1;
        const result1 = await iterator.next();
        if (!result1.done) events.push(result1.value);

        // Change value and get second event
        value = 2;
        const result2 = await iterator.next();
        if (!result2.done) events.push(result2.value);

        abortController.abort();

        expect(events.length).toBe(2);
        expect(events[0].data).toBe(1);
        expect(events[1].data).toBe(2);
        expect(events[0].event).toBe('signal-update');
      });
    });
  });

  describe('Validation', () => {
    describe('validate function', () => {
      it('should validate required fields', () => {
        const schema = {
          name: { type: 'string' as const, required: true },
        };

        const result1 = validate({ name: 'Test' }, schema);
        expect(result1.valid).toBe(true);

        const result2 = validate({}, schema);
        expect(result2.valid).toBe(false);
        if (!result2.valid) {
          expect(result2.errors[0].field).toBe('name');
          expect(result2.errors[0].message).toBe('Field is required');
        }
      });

      it('should validate string type', () => {
        const schema = {
          name: { type: 'string' as const },
        };

        const result = validate({ name: 123 }, schema);
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.errors[0].message).toContain('Expected string');
        }
      });

      it('should validate string minLength', () => {
        const schema = {
          name: { type: 'string' as const, minLength: 3 },
        };

        const result = validate({ name: 'ab' }, schema);
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.errors[0].message).toContain('Minimum length is 3');
        }
      });

      it('should validate string maxLength', () => {
        const schema = {
          name: { type: 'string' as const, maxLength: 5 },
        };

        const result = validate({ name: 'abcdef' }, schema);
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.errors[0].message).toContain('Maximum length is 5');
        }
      });

      it('should validate string pattern', () => {
        const schema = {
          email: { type: 'string' as const, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        };

        const result1 = validate({ email: 'test@example.com' }, schema);
        expect(result1.valid).toBe(true);

        const result2 = validate({ email: 'invalid-email' }, schema);
        expect(result2.valid).toBe(false);
      });

      it('should validate number type', () => {
        const schema = {
          age: { type: 'number' as const },
        };

        const result = validate({ age: 'not-a-number' }, schema);
        expect(result.valid).toBe(false);
      });

      it('should validate number min', () => {
        const schema = {
          age: { type: 'number' as const, min: 0 },
        };

        const result = validate({ age: -1 }, schema);
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.errors[0].message).toContain('Minimum value is 0');
        }
      });

      it('should validate number max', () => {
        const schema = {
          age: { type: 'number' as const, max: 150 },
        };

        const result = validate({ age: 200 }, schema);
        expect(result.valid).toBe(false);
        if (!result.valid) {
          expect(result.errors[0].message).toContain('Maximum value is 150');
        }
      });

      it('should validate enum values', () => {
        const schema = {
          status: { type: 'string' as const, enum: ['active', 'inactive', 'pending'] },
        };

        const result1 = validate({ status: 'active' }, schema);
        expect(result1.valid).toBe(true);

        const result2 = validate({ status: 'invalid' }, schema);
        expect(result2.valid).toBe(false);
        if (!result2.valid) {
          expect(result2.errors[0].message).toContain('Must be one of:');
        }
      });

      it('should validate nested objects', () => {
        const schema = {
          user: {
            type: 'object' as const,
            required: true,
            properties: {
              name: { type: 'string' as const, required: true },
              age: { type: 'number' as const, min: 0 },
            },
          },
        };

        const result1 = validate({ user: { name: 'John', age: 25 } }, schema);
        expect(result1.valid).toBe(true);

        const result2 = validate({ user: { age: 25 } }, schema);
        expect(result2.valid).toBe(false);
        if (!result2.valid) {
          expect(result2.errors[0].field).toBe('user.name');
        }
      });

      it('should validate arrays', () => {
        const schema = {
          tags: {
            type: 'array' as const,
            items: { type: 'string' as const, minLength: 1 },
          },
        };

        const result1 = validate({ tags: ['tag1', 'tag2'] }, schema);
        expect(result1.valid).toBe(true);

        const result2 = validate({ tags: ['tag1', ''] }, schema);
        expect(result2.valid).toBe(false);
        if (!result2.valid) {
          expect(result2.errors[0].field).toBe('tags[1]');
        }
      });

      it('should support custom validation', () => {
        const schema = {
          password: {
            type: 'string' as const,
            custom: (value: string) =>
              value.length >= 8 && /[A-Z]/.test(value) && /[0-9]/.test(value) ||
              'Password must be at least 8 chars with uppercase and number',
          },
        };

        const result1 = validate({ password: 'Password1' }, schema);
        expect(result1.valid).toBe(true);

        const result2 = validate({ password: 'weak' }, schema);
        expect(result2.valid).toBe(false);
      });

      it('should return typed data on success', () => {
        interface User {
          name: string;
          age: number;
        }

        const schema = {
          name: { type: 'string' as const, required: true },
          age: { type: 'number' as const, required: true },
        };

        const result = validate<User>({ name: 'John', age: 30 }, schema);
        if (result.valid) {
          expect(result.data.name).toBe('John');
          expect(result.data.age).toBe(30);
        }
      });
    });

    describe('validateBody', () => {
      it('should be a function', () => {
        expect(typeof validateBody).toBe('function');
      });

      it('should create a validation middleware', () => {
        const validator = validateBody<{ name: string }>({
          name: { type: 'string', required: true },
        });
        expect(typeof validator).toBe('function');
      });

      it('should throw ValidationError on invalid data', () => {
        const validator = validateBody<{ name: string }>({
          name: { type: 'string', required: true },
        });

        expect(() => validator({ body: {} })).toThrow(ValidationError);
      });

      it('should return validated data on success', () => {
        const validator = validateBody<{ name: string }>({
          name: { type: 'string', required: true },
        });

        const result = validator({ body: { name: 'Test' } });
        expect(result).toEqual({ name: 'Test' });
      });
    });
  });

  describe('Plugins', () => {
    describe('philjs plugin', () => {
      it('should be a function', () => {
        expect(typeof philjs).toBe('function');
      });

      it('should create an Elysia plugin', () => {
        const render: RenderFunction = () => ({ html: '<div>Test</div>' });
        const plugin = philjs({ render });
        expect(plugin).toBeDefined();
      });
    });

    describe('security plugin', () => {
      it('should be a function', () => {
        expect(typeof security).toBe('function');
      });

      it('should create an Elysia plugin', () => {
        const plugin = security();
        expect(plugin).toBeDefined();
      });

      it('should accept custom options', () => {
        const plugin = security({
          xFrameOptions: 'SAMEORIGIN',
          strictTransportSecurity: { maxAge: 31536000 },
        });
        expect(plugin).toBeDefined();
      });
    });

    describe('cors plugin', () => {
      it('should be a function', () => {
        expect(typeof cors).toBe('function');
      });

      it('should create an Elysia plugin', () => {
        const plugin = cors();
        expect(plugin).toBeDefined();
      });

      it('should accept custom options', () => {
        const plugin = cors({
          origin: 'https://example.com',
          credentials: true,
        });
        expect(plugin).toBeDefined();
      });
    });

    describe('rateLimit plugin', () => {
      it('should be a function', () => {
        expect(typeof rateLimit).toBe('function');
      });

      it('should create an Elysia plugin', () => {
        const plugin = rateLimit();
        expect(plugin).toBeDefined();
      });

      it('should accept custom options', () => {
        const plugin = rateLimit({
          windowMs: 60000,
          max: 100,
        });
        expect(plugin).toBeDefined();
      });
    });

    describe('session plugin', () => {
      it('should be a function', () => {
        expect(typeof session).toBe('function');
      });

      it('should create an Elysia plugin', () => {
        const plugin = session({ secret: 'test-secret' });
        expect(plugin).toBeDefined();
      });

      it('should accept custom options', () => {
        const plugin = session({
          secret: 'test-secret',
          name: 'custom.sid',
          maxAge: 86400000,
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        });
        expect(plugin).toBeDefined();
      });
    });

    describe('errorHandler plugin', () => {
      it('should be a function', () => {
        expect(typeof errorHandler).toBe('function');
      });

      it('should create an Elysia plugin', () => {
        const plugin = errorHandler();
        expect(plugin).toBeDefined();
      });

      it('should accept custom options', () => {
        const plugin = errorHandler({
          includeStackTrace: false,
          logErrors: true,
          onError: (err) => console.error(err),
        });
        expect(plugin).toBeDefined();
      });
    });

    describe('logger plugin', () => {
      it('should be a function', () => {
        expect(typeof logger).toBe('function');
      });

      it('should create an Elysia plugin', () => {
        const plugin = logger();
        expect(plugin).toBeDefined();
      });

      it('should accept custom options', () => {
        const plugin = logger({
          level: 'debug',
          format: 'json',
        });
        expect(plugin).toBeDefined();
      });
    });

    describe('healthCheck plugin', () => {
      it('should be a function', () => {
        expect(typeof healthCheck).toBe('function');
      });

      it('should create an Elysia plugin', () => {
        const plugin = healthCheck();
        expect(plugin).toBeDefined();
      });

      it('should accept custom options', () => {
        const plugin = healthCheck({
          path: '/_health',
          checks: [
            {
              name: 'database',
              check: async () => ({ status: 'healthy' }),
              critical: true,
            },
          ],
        });
        expect(plugin).toBeDefined();
      });
    });

    describe('websocket plugin', () => {
      it('should be a function', () => {
        expect(typeof websocket).toBe('function');
      });

      it('should create an Elysia plugin', () => {
        const plugin = websocket();
        expect(plugin).toBeDefined();
      });

      it('should accept custom options', () => {
        const plugin = websocket({
          path: '/ws',
          heartbeat: 30000,
          onConnect: (ws) => console.log('Connected'),
          onMessage: (ws, msg) => console.log('Message:', msg),
        });
        expect(plugin).toBeDefined();
      });
    });
  });

  describe('createApp', () => {
    it('should be a function', () => {
      expect(typeof createApp).toBe('function');
    });

    it('should create an Elysia app with default plugins', () => {
      const render: RenderFunction = () => ({ html: '<div>Test</div>' });
      const app = createApp({ render });
      expect(app).toBeDefined();
    });

    it('should allow disabling specific plugins', () => {
      const render: RenderFunction = () => ({ html: '<div>Test</div>' });
      const app = createApp({
        render,
        security: false,
        cors: false,
        rateLimit: false,
        logger: false,
        healthCheck: false,
        errorHandler: false,
      });
      expect(app).toBeDefined();
    });

    it('should accept custom plugin configurations', () => {
      const render: RenderFunction = () => ({ html: '<div>Test</div>' });
      const app = createApp({
        render,
        security: { xFrameOptions: 'DENY' },
        cors: { origin: 'https://example.com' },
        rateLimit: { max: 50 },
        session: { secret: 'test-secret' },
        logger: { level: 'warn' },
        healthCheck: { path: '/health' },
        errorHandler: { logErrors: false },
      });
      expect(app).toBeDefined();
    });
  });

  describe('gracefulShutdown', () => {
    it('should be a function', () => {
      expect(typeof gracefulShutdown).toBe('function');
    });

    it('should return shutdown handler', () => {
      const server = { stop: vi.fn() };
      const result = gracefulShutdown(server);
      expect(typeof result.shutdown).toBe('function');
    });

    it('should accept options', () => {
      const server = { stop: vi.fn() };
      const onShutdown = vi.fn();
      const result = gracefulShutdown(server, {
        timeout: 60000,
        onShutdown,
      });
      expect(result).toBeDefined();
    });
  });
});
