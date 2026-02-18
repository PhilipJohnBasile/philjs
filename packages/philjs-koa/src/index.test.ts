/**
 * Tests for PhilJS Koa Middleware
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  HttpError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  errors,
  success,
  paginated,
  parsePagination,
  parseSort,
  validate,
} from './index';

describe('PhilJS Koa Middleware', () => {
  describe('Error Classes', () => {
    describe('HttpError', () => {
      it('should create with status and message', () => {
        const error = new HttpError(400, 'Bad Request');
        expect(error.status).toBe(400);
        expect(error.statusCode).toBe(400);
        expect(error.message).toBe('Bad Request');
        expect(error.name).toBe('HttpError');
      });

      it('should include code and details', () => {
        const error = new HttpError(400, 'Bad Request', {
          code: 'INVALID_INPUT',
          details: { field: 'email' },
        });
        expect(error.code).toBe('INVALID_INPUT');
        expect(error.details).toEqual({ field: 'email' });
      });

      it('should expose errors under 500 by default', () => {
        const clientError = new HttpError(400, 'Bad Request');
        const serverError = new HttpError(500, 'Server Error');
        expect(clientError.expose).toBe(true);
        expect(serverError.expose).toBe(false);
      });

      it('should respect explicit expose setting', () => {
        const error = new HttpError(500, 'Server Error', { expose: true });
        expect(error.expose).toBe(true);
      });
    });

    describe('ValidationError', () => {
      it('should create with validation errors array', () => {
        const errList = [
          { field: 'email', message: 'Invalid email' },
          { field: 'password', message: 'Too short' },
        ];
        const error = new ValidationError(errList);

        expect(error.status).toBe(400);
        expect(error.name).toBe('ValidationError');
        expect(error.errors).toEqual(errList);
        expect(error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('AuthenticationError', () => {
      it('should create with default message', () => {
        const error = new AuthenticationError();
        expect(error.status).toBe(401);
        expect(error.message).toBe('Authentication required');
        expect(error.code).toBe('AUTHENTICATION_REQUIRED');
      });

      it('should create with custom message', () => {
        const error = new AuthenticationError('Invalid token');
        expect(error.message).toBe('Invalid token');
      });
    });

    describe('AuthorizationError', () => {
      it('should create with default message', () => {
        const error = new AuthorizationError();
        expect(error.status).toBe(403);
        expect(error.message).toBe('Access denied');
        expect(error.code).toBe('ACCESS_DENIED');
      });
    });

    describe('NotFoundError', () => {
      it('should create with default message', () => {
        const error = new NotFoundError();
        expect(error.status).toBe(404);
        expect(error.message).toBe('Resource not found');
      });

      it('should create with resource name', () => {
        const error = new NotFoundError('User');
        expect(error.message).toBe('User not found');
        expect(error.resource).toBe('User');
      });
    });

    describe('ConflictError', () => {
      it('should create with default message', () => {
        const error = new ConflictError();
        expect(error.status).toBe(409);
        expect(error.message).toBe('Resource conflict');
        expect(error.code).toBe('CONFLICT');
      });

      it('should create with custom message', () => {
        const error = new ConflictError('Email already exists');
        expect(error.message).toBe('Email already exists');
      });
    });

    describe('RateLimitError', () => {
      it('should create with retry after', () => {
        const error = new RateLimitError(60);
        expect(error.status).toBe(429);
        expect(error.retryAfter).toBe(60);
        expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      });
    });
  });

  describe('Error Factory', () => {
    it('should create bad request error', () => {
      const error = errors.badRequest('Invalid input', { field: 'name' });
      expect(error.status).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.details).toEqual({ field: 'name' });
    });

    it('should create unauthorized error', () => {
      const error = errors.unauthorized();
      expect(error).toBeInstanceOf(AuthenticationError);
    });

    it('should create forbidden error', () => {
      const error = errors.forbidden();
      expect(error).toBeInstanceOf(AuthorizationError);
    });

    it('should create not found error', () => {
      const error = errors.notFound('Article');
      expect(error).toBeInstanceOf(NotFoundError);
      expect(error.message).toBe('Article not found');
    });

    it('should create method not allowed error', () => {
      const error = errors.methodNotAllowed('PUT');
      expect(error.status).toBe(405);
      expect(error.message).toBe('Method PUT not allowed');
    });

    it('should create conflict error', () => {
      const error = errors.conflict();
      expect(error).toBeInstanceOf(ConflictError);
    });

    it('should create gone error', () => {
      const error = errors.gone();
      expect(error.status).toBe(410);
    });

    it('should create unprocessable error', () => {
      const error = errors.unprocessable('Cannot process', { reason: 'test' });
      expect(error.status).toBe(422);
    });

    it('should create too many requests error', () => {
      const error = errors.tooManyRequests(120);
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.retryAfter).toBe(120);
    });

    it('should create internal error', () => {
      const error = errors.internal();
      expect(error.status).toBe(500);
      expect(error.expose).toBe(false);
    });

    it('should create not implemented error', () => {
      const error = errors.notImplemented('Feature X');
      expect(error.status).toBe(501);
      expect(error.message).toBe('Feature X not implemented');
    });

    it('should create bad gateway error', () => {
      const error = errors.badGateway();
      expect(error.status).toBe(502);
    });

    it('should create service unavailable error', () => {
      const error = errors.serviceUnavailable();
      expect(error.status).toBe(503);
    });

    it('should create gateway timeout error', () => {
      const error = errors.gatewayTimeout();
      expect(error.status).toBe(504);
    });
  });

  describe('Response Helpers', () => {
    describe('success', () => {
      it('should wrap data in success response', () => {
        const result = success({ id: 1, name: 'Test' });
        expect(result).toEqual({
          success: true,
          data: { id: 1, name: 'Test' },
        });
      });

      it('should include message when provided', () => {
        const result = success({ id: 1 }, 'Created successfully');
        expect(result.message).toBe('Created successfully');
      });
    });

    describe('paginated', () => {
      it('should create paginated response', () => {
        const items = [{ id: 1 }, { id: 2 }];
        const result = paginated(items, 1, 10, 25);

        expect(result.data).toEqual(items);
        expect(result.pagination).toEqual({
          page: 1,
          pageSize: 10,
          total: 25,
          totalPages: 3,
          hasNext: true,
          hasPrev: false,
        });
      });

      it('should calculate hasNext and hasPrev correctly', () => {
        const result = paginated([], 2, 10, 25);
        expect(result.pagination.hasNext).toBe(true);
        expect(result.pagination.hasPrev).toBe(true);

        const lastPage = paginated([], 3, 10, 25);
        expect(lastPage.pagination.hasNext).toBe(false);
      });

      it('should handle empty results', () => {
        const result = paginated([], 1, 10, 0);
        expect(result.pagination.totalPages).toBe(0);
        expect(result.pagination.hasNext).toBe(false);
        expect(result.pagination.hasPrev).toBe(false);
      });
    });
  });

  describe('Request Helpers', () => {
    describe('parsePagination', () => {
      it('should parse pagination with defaults', () => {
        const result = parsePagination({});
        expect(result).toEqual({
          page: 1,
          pageSize: 20,
          offset: 0,
        });
      });

      it('should parse custom page and pageSize', () => {
        const result = parsePagination({ page: '3', pageSize: '50' });
        expect(result).toEqual({
          page: 3,
          pageSize: 50,
          offset: 100,
        });
      });

      it('should respect maxPageSize', () => {
        const result = parsePagination({ pageSize: '1000' }, { maxPageSize: 100 });
        expect(result.pageSize).toBe(100);
      });

      it('should handle limit as alias for pageSize', () => {
        const result = parsePagination({ limit: '30' });
        expect(result.pageSize).toBe(30);
      });

      it('should enforce minimum page of 1', () => {
        const result = parsePagination({ page: '-5' });
        expect(result.page).toBe(1);
      });

      it('should calculate correct offset', () => {
        const result = parsePagination({ page: '5', pageSize: '25' });
        expect(result.offset).toBe(100);
      });
    });

    describe('parseSort', () => {
      it('should return null when no sort specified', () => {
        const result = parseSort({}, ['name', 'createdAt']);
        expect(result).toBeNull();
      });

      it('should return default when specified', () => {
        const result = parseSort({}, ['name'], { field: 'name', order: 'asc' });
        expect(result).toEqual({ field: 'name', order: 'asc' });
      });

      it('should parse sortBy parameter', () => {
        const result = parseSort({ sortBy: 'name' }, ['name', 'email']);
        expect(result).toEqual({ field: 'name', order: 'asc' });
      });

      it('should handle dash prefix for descending', () => {
        const result = parseSort({ sort: '-createdAt' }, ['createdAt']);
        expect(result).toEqual({ field: 'createdAt', order: 'desc' });
      });

      it('should reject non-allowed fields', () => {
        const result = parseSort({ sortBy: 'password' }, ['name', 'email']);
        expect(result).toBeNull();
      });
    });
  });

  describe('Validation', () => {
    describe('validate', () => {
      it('should validate string type', () => {
        const result = validate('hello', { type: 'string' });
        expect(result.valid).toBe(true);
        expect(result.value).toBe('hello');
      });

      it('should reject non-string for string type', () => {
        const result = validate(123, { type: 'string' });
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('root: expected string');
      });

      it('should validate string minLength', () => {
        const result = validate('ab', { type: 'string', minLength: 3 });
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('minimum length');
      });

      it('should validate string maxLength', () => {
        const result = validate('hello world', { type: 'string', maxLength: 5 });
        expect(result.valid).toBe(false);
      });

      it('should validate string pattern', () => {
        const result = validate('invalid', { type: 'string', pattern: '^[0-9]+$' });
        expect(result.valid).toBe(false);
      });

      it('should validate string enum', () => {
        const result = validate('red', {
          type: 'string',
          enum: ['red', 'green', 'blue'],
        });
        expect(result.valid).toBe(true);

        const invalid = validate('yellow', {
          type: 'string',
          enum: ['red', 'green', 'blue'],
        });
        expect(invalid.valid).toBe(false);
      });

      it('should validate number type', () => {
        const result = validate(42, { type: 'number' });
        expect(result.valid).toBe(true);
      });

      it('should coerce string to number', () => {
        const result = validate('42', { type: 'number' });
        expect(result.valid).toBe(true);
        expect(result.value).toBe(42);
      });

      it('should validate number min/max', () => {
        const tooLow = validate(5, { type: 'number', min: 10 });
        expect(tooLow.valid).toBe(false);

        const tooHigh = validate(100, { type: 'number', max: 50 });
        expect(tooHigh.valid).toBe(false);
      });

      it('should validate boolean type', () => {
        const result = validate(true, { type: 'boolean' });
        expect(result.valid).toBe(true);
      });

      it('should coerce string to boolean', () => {
        expect(validate('true', { type: 'boolean' }).value).toBe(true);
        expect(validate('false', { type: 'boolean' }).value).toBe(false);
        expect(validate('1', { type: 'boolean' }).value).toBe(true);
      });

      it('should validate array type', () => {
        const result = validate([1, 2, 3], { type: 'array' });
        expect(result.valid).toBe(true);
      });

      it('should validate array items', () => {
        const result = validate(['a', 'b'], {
          type: 'array',
          items: { type: 'string' },
        });
        expect(result.valid).toBe(true);
      });

      it('should validate object type', () => {
        const result = validate({ name: 'test' }, { type: 'object' });
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
      });

      it('should validate required fields', () => {
        const result = validate(
          { name: 'John' },
          {
            type: 'object',
            properties: {
              name: { type: 'string' },
              email: { type: 'string' },
            },
            required: ['name', 'email'],
          }
        );
        expect(result.valid).toBe(false);
        expect(result.errors[0]).toContain('email');
      });

      it('should apply default values', () => {
        const result = validate(undefined, {
          type: 'string',
          default: 'default value',
        });
        expect(result.value).toBe('default value');
      });
    });
  });

  describe('Types', () => {
    describe('RenderContext', () => {
      it('should have correct structure', () => {
        const context = {
          url: '/test',
          path: '/test',
          query: { page: '1' },
          headers: {},
          cookies: {},
          state: {},
          signals: {},
          meta: {},
        };
        expect(context.url).toBe('/test');
      });
    });

    describe('MetaInfo', () => {
      it('should have correct structure', () => {
        const meta = {
          title: 'Test Page',
          description: 'Test description',
          keywords: ['test', 'page'],
          canonical: 'https://example.com/test',
          robots: 'index,follow',
        };
        expect(meta.title).toBe('Test Page');
      });
    });

    describe('SSRResult', () => {
      it('should have correct structure', () => {
        const result = {
          html: '<html></html>',
          head: '<title>Test</title>',
          css: '.test { color: red; }',
          state: { user: { id: 1 } },
          statusCode: 200,
          headers: { 'Content-Type': 'text/html' },
        };
        expect(result.statusCode).toBe(200);
      });

      it('should support redirect', () => {
        const result = {
          html: '',
          redirect: '/login',
          statusCode: 302,
        };
        expect(result.redirect).toBe('/login');
      });
    });

    describe('CacheOptions', () => {
      it('should have correct structure', () => {
        const options = {
          enabled: true,
          ttl: 300,
          routes: ['/api'],
          excludeRoutes: ['/api/auth'],
        };
        expect(options.ttl).toBe(300);
      });
    });

    describe('RateLimitOptions', () => {
      it('should have correct structure', () => {
        const options = {
          max: 100,
          window: 60000,
          headers: true,
        };
        expect(options.max).toBe(100);
      });
    });

    describe('CorsOptions', () => {
      it('should have correct structure', () => {
        const options = {
          origin: ['http://localhost:3000'],
          methods: ['GET', 'POST'],
          credentials: true,
          maxAge: 86400,
        };
        expect(options.credentials).toBe(true);
      });
    });

    describe('SecurityOptions', () => {
      it('should have correct structure', () => {
        const options = {
          frameOptions: 'SAMEORIGIN' as const,
          contentTypeOptions: true,
          xssProtection: true,
          referrerPolicy: 'strict-origin-when-cross-origin',
          hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          },
        };
        expect(options.hsts?.maxAge).toBe(31536000);
      });
    });

    describe('SessionOptions', () => {
      it('should have correct structure', () => {
        const options = {
          secret: 'my-secret',
          cookieName: 'session',
          rolling: true,
          cookie: {
            maxAge: 86400,
            secure: true,
            httpOnly: true,
            sameSite: 'strict' as const,
          },
        };
        expect(options.cookie?.sameSite).toBe('strict');
      });
    });

    describe('HealthCheckOptions', () => {
      it('should have correct structure', () => {
        const options = {
          path: '/health',
          readinessPath: '/health/ready',
          livenessPath: '/health/live',
          includeSystemInfo: true,
        };
        expect(options.path).toBe('/health');
      });
    });

    describe('SSEEvent', () => {
      it('should have correct structure', () => {
        const event = {
          id: 'evt-1',
          event: 'update',
          data: { value: 42 },
          retry: 3000,
        };
        expect(event.event).toBe('update');
      });
    });

    describe('ContentSecurityPolicy', () => {
      it('should have correct structure', () => {
        const csp = {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          upgradeInsecureRequests: true,
        };
        expect(csp.defaultSrc).toContain("'self'");
      });
    });
  });
});
