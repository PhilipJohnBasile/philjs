/**
 * Tests for PhilJS Express Integration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  HttpError,
  errors,
  generateRequestId,
  success,
  errorResponse,
  paginated,
  parsePagination,
  parseSort,
  parseQuery,
  validate,
} from './index';

describe('PhilJS Express Integration', () => {
  describe('HttpError', () => {
    it('should create with status code and message', () => {
      const error = new HttpError(400, 'Bad Request');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad Request');
      expect(error.name).toBe('HttpError');
    });

    it('should include optional code and details', () => {
      const error = new HttpError(400, 'Validation failed', 'VALIDATION_ERROR', {
        field: 'email',
      });
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'email' });
    });

    it('should be an instance of Error', () => {
      const error = new HttpError(500, 'Server Error');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('Error Factory', () => {
    it('should create bad request error', () => {
      const error = errors.badRequest('Invalid input', { field: 'name' });
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.details).toEqual({ field: 'name' });
    });

    it('should create unauthorized error', () => {
      const error = errors.unauthorized();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('should create forbidden error', () => {
      const error = errors.forbidden();
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should create not found error', () => {
      const error = errors.notFound();
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    it('should create method not allowed error', () => {
      const error = errors.methodNotAllowed();
      expect(error.statusCode).toBe(405);
    });

    it('should create conflict error', () => {
      const error = errors.conflict('Email already exists', { email: 'test@test.com' });
      expect(error.statusCode).toBe(409);
      expect(error.details).toBeDefined();
    });

    it('should create gone error', () => {
      const error = errors.gone();
      expect(error.statusCode).toBe(410);
    });

    it('should create unprocessable entity error', () => {
      const error = errors.unprocessableEntity('Cannot process', { reason: 'invalid state' });
      expect(error.statusCode).toBe(422);
    });

    it('should create too many requests error', () => {
      const error = errors.tooManyRequests();
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('TOO_MANY_REQUESTS');
    });

    it('should create internal server error', () => {
      const error = errors.internal();
      expect(error.statusCode).toBe(500);
    });

    it('should create not implemented error', () => {
      const error = errors.notImplemented();
      expect(error.statusCode).toBe(501);
    });

    it('should create bad gateway error', () => {
      const error = errors.badGateway();
      expect(error.statusCode).toBe(502);
    });

    it('should create service unavailable error', () => {
      const error = errors.serviceUnavailable();
      expect(error.statusCode).toBe(503);
    });
  });

  describe('Request ID Generation', () => {
    it('should generate unique request IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateRequestId());
      }
      expect(ids.size).toBe(100);
    });

    it('should generate IDs with expected format', () => {
      const id = generateRequestId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(10);
      expect(id).toContain('-');
    });
  });

  describe('Response Helpers', () => {
    describe('success', () => {
      it('should create success response', () => {
        const result = success({ id: 1, name: 'Test' });
        expect(result).toEqual({
          success: true,
          message: 'Success',
          data: { id: 1, name: 'Test' },
        });
      });

      it('should include custom message', () => {
        const result = success({ id: 1 }, 'Created successfully');
        expect(result.message).toBe('Created successfully');
      });
    });

    describe('errorResponse', () => {
      it('should create error response', () => {
        const result = errorResponse('Something went wrong');
        expect(result).toEqual({
          success: false,
          error: { message: 'Something went wrong' },
        });
      });

      it('should include code and details', () => {
        const result = errorResponse('Validation failed', 'VALIDATION_ERROR', { field: 'email' });
        expect(result.error.code).toBe('VALIDATION_ERROR');
        expect(result.error.details).toEqual({ field: 'email' });
      });
    });

    describe('paginated', () => {
      it('should create paginated response', () => {
        const items = [{ id: 1 }, { id: 2 }];
        const result = paginated(items, 1, 10, 25);

        expect(result.items).toEqual(items);
        expect(result.pagination).toEqual({
          page: 1,
          pageSize: 10,
          total: 25,
          totalPages: 3,
        });
      });

      it('should calculate totalPages correctly', () => {
        expect(paginated([], 1, 10, 0).pagination.totalPages).toBe(0);
        expect(paginated([], 1, 10, 1).pagination.totalPages).toBe(1);
        expect(paginated([], 1, 10, 10).pagination.totalPages).toBe(1);
        expect(paginated([], 1, 10, 11).pagination.totalPages).toBe(2);
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

      it('should use custom defaults', () => {
        const result = parsePagination({}, { page: 2, pageSize: 50 });
        expect(result.page).toBe(2);
        expect(result.pageSize).toBe(50);
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

      it('should parse sort parameter', () => {
        const result = parseSort({ sort: 'name' }, ['name', 'email']);
        expect(result).toEqual({ field: 'name', order: 'asc' });
      });

      it('should parse orderBy parameter', () => {
        const result = parseSort({ orderBy: 'email' }, ['name', 'email']);
        expect(result).toEqual({ field: 'email', order: 'asc' });
      });

      it('should handle dash prefix for descending', () => {
        const result = parseSort({ sort: '-createdAt' }, ['createdAt']);
        expect(result).toEqual({ field: 'createdAt', order: 'desc' });
      });

      it('should reject non-allowed fields', () => {
        const result = parseSort({ sort: 'password' }, ['name', 'email']);
        expect(result).toBeNull();
      });
    });

    describe('parseQuery', () => {
      it('should parse string type', () => {
        const result = parseQuery({ name: 'John' }, { name: 'string' });
        expect(result.name).toBe('John');
      });

      it('should parse number type', () => {
        const result = parseQuery({ age: '25' }, { age: 'number' });
        expect(result.age).toBe(25);
      });

      it('should parse boolean type', () => {
        const result = parseQuery({ active: 'true' }, { active: 'boolean' });
        expect(result.active).toBe(true);

        const result2 = parseQuery({ active: '1' }, { active: 'boolean' });
        expect(result2.active).toBe(true);

        const result3 = parseQuery({ active: 'false' }, { active: 'boolean' });
        expect(result3.active).toBe(false);
      });

      it('should parse array type', () => {
        const result = parseQuery({ tags: ['a', 'b'] }, { tags: 'array' });
        expect(result.tags).toEqual(['a', 'b']);
      });

      it('should convert single value to array', () => {
        const result = parseQuery({ tags: 'single' }, { tags: 'array' });
        expect(result.tags).toEqual(['single']);
      });

      it('should skip undefined values', () => {
        const result = parseQuery({}, { name: 'string' });
        expect(result.name).toBeUndefined();
      });
    });
  });

  describe('Validation', () => {
    describe('validate', () => {
      it('should validate required fields', () => {
        const schema = {
          name: { type: 'string' as const, required: true },
        };

        const valid = validate(schema)({ name: 'John' });
        expect(valid.valid).toBe(true);

        const invalid = validate(schema)({});
        expect(invalid.valid).toBe(false);
        expect(invalid.errors).toContain('name is required');
      });

      it('should validate string type', () => {
        const schema = {
          name: { type: 'string' as const },
        };

        const valid = validate(schema)({ name: 'John' });
        expect(valid.valid).toBe(true);

        const invalid = validate(schema)({ name: 123 });
        expect(invalid.valid).toBe(false);
      });

      it('should validate number type', () => {
        const schema = {
          age: { type: 'number' as const },
        };

        const valid = validate(schema)({ age: 25 });
        expect(valid.valid).toBe(true);

        const invalid = validate(schema)({ age: 'not a number' });
        expect(invalid.valid).toBe(false);
      });

      it('should validate boolean type', () => {
        const schema = {
          active: { type: 'boolean' as const },
        };

        const valid = validate(schema)({ active: true });
        expect(valid.valid).toBe(true);
      });

      it('should validate array type', () => {
        const schema = {
          tags: { type: 'array' as const },
        };

        const valid = validate(schema)({ tags: ['a', 'b'] });
        expect(valid.valid).toBe(true);

        const invalid = validate(schema)({ tags: 'not array' });
        expect(invalid.valid).toBe(false);
      });

      it('should validate object type', () => {
        const schema = {
          data: { type: 'object' as const },
        };

        const valid = validate(schema)({ data: { key: 'value' } });
        expect(valid.valid).toBe(true);
      });

      it('should validate min/max for numbers', () => {
        const schema = {
          age: { type: 'number' as const, min: 18, max: 100 },
        };

        const valid = validate(schema)({ age: 25 });
        expect(valid.valid).toBe(true);

        const tooLow = validate(schema)({ age: 10 });
        expect(tooLow.valid).toBe(false);

        const tooHigh = validate(schema)({ age: 150 });
        expect(tooHigh.valid).toBe(false);
      });

      it('should validate min/max for strings (length)', () => {
        const schema = {
          name: { type: 'string' as const, min: 2, max: 50 },
        };

        const valid = validate(schema)({ name: 'John' });
        expect(valid.valid).toBe(true);

        const tooShort = validate(schema)({ name: 'J' });
        expect(tooShort.valid).toBe(false);
      });

      it('should validate pattern', () => {
        const schema = {
          email: { type: 'string' as const, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
        };

        const valid = validate(schema)({ email: 'test@example.com' });
        expect(valid.valid).toBe(true);

        const invalid = validate(schema)({ email: 'not-an-email' });
        expect(invalid.valid).toBe(false);
      });

      it('should validate enum', () => {
        const schema = {
          role: { type: 'string' as const, enum: ['admin', 'user', 'guest'] },
        };

        const valid = validate(schema)({ role: 'admin' });
        expect(valid.valid).toBe(true);

        const invalid = validate(schema)({ role: 'superuser' });
        expect(invalid.valid).toBe(false);
      });

      it('should validate with custom validator', () => {
        const schema = {
          password: {
            type: 'string' as const,
            validate: (value: string) => value.length >= 8 && /[A-Z]/.test(value),
          },
        };

        const valid = validate(schema)({ password: 'Password123' });
        expect(valid.valid).toBe(true);

        const invalid = validate(schema)({ password: 'weak' });
        expect(invalid.valid).toBe(false);
      });

      it('should return validated data on success', () => {
        const schema = {
          name: { type: 'string' as const, required: true },
          age: { type: 'number' as const },
        };

        const result = validate(schema)({ name: 'John', age: 30, extra: 'ignored' });
        expect(result.valid).toBe(true);
        expect(result.data).toEqual({ name: 'John', age: 30 });
      });
    });
  });

  describe('Type Definitions', () => {
    it('should have correct RenderContext structure', () => {
      const context = {
        url: '/test',
        method: 'GET',
        headers: {},
        cookies: {},
        query: {},
        params: {},
        body: null,
        state: {},
        startTime: Date.now(),
        requestId: 'test-id',
      };

      expect(context).toHaveProperty('url');
      expect(context).toHaveProperty('method');
      expect(context).toHaveProperty('requestId');
    });

    it('should have correct SSRResult structure', () => {
      const result = {
        html: '<html></html>',
        status: 200,
        headers: { 'Content-Type': 'text/html' },
        redirect: undefined,
        head: {
          title: 'Test Page',
          meta: [{ name: 'description', content: 'Test description' }],
        },
      };

      expect(result).toHaveProperty('html');
      expect(result.head?.title).toBe('Test Page');
    });

    it('should have correct SecurityHeadersOptions structure', () => {
      const options = {
        csp: { 'default-src': ["'self'"] },
        hsts: { maxAge: 31536000, includeSubDomains: true },
        frameOptions: 'SAMEORIGIN' as const,
        noSniff: true,
        referrerPolicy: 'strict-origin-when-cross-origin',
      };

      expect(options.csp).toBeDefined();
      expect(options.hsts?.maxAge).toBe(31536000);
    });

    it('should have correct RateLimitOptions structure', () => {
      const options = {
        windowMs: 60000,
        max: 100,
        skipSuccessfulRequests: false,
        keyGenerator: (req: any) => req.ip,
      };

      expect(options.windowMs).toBe(60000);
      expect(options.max).toBe(100);
    });

    it('should have correct SessionOptions structure', () => {
      const options = {
        secret: 'secret-key',
        name: 'session',
        cookie: {
          maxAge: 86400000,
          secure: true,
          httpOnly: true,
          sameSite: 'strict' as const,
        },
        regenerate: true,
      };

      expect(options.secret).toBe('secret-key');
      expect(options.cookie?.sameSite).toBe('strict');
    });

    it('should have correct CorsOptions structure', () => {
      const options = {
        origin: ['http://localhost:3000', 'https://example.com'],
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
        maxAge: 86400,
      };

      expect(options.origin).toContain('http://localhost:3000');
      expect(options.credentials).toBe(true);
    });

    it('should have correct HealthCheckOptions structure', () => {
      const options = {
        path: '/health',
        readinessPath: '/health/ready',
        livenessPath: '/health/live',
        checks: {
          database: async () => ({ healthy: true }),
          redis: async () => ({ healthy: true, message: 'Connected' }),
        },
        detailed: true,
      };

      expect(options.path).toBe('/health');
      expect(Object.keys(options.checks)).toContain('database');
    });

    it('should have correct GracefulShutdownOptions structure', () => {
      const options = {
        timeout: 30000,
        signals: ['SIGTERM', 'SIGINT'],
        onShutdown: [async () => console.log('Shutting down')],
        forceExit: true,
      };

      expect(options.timeout).toBe(30000);
      expect(options.signals).toContain('SIGTERM');
    });
  });
});
