/**
 * Tests for PhilJS Fastify Plugin
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
  created,
  parsePagination,
  parseSort,
  validate,
  generateRequestId,
} from './index';

describe('PhilJS Fastify Plugin', () => {
  describe('Error Classes', () => {
    describe('HttpError', () => {
      it('should create with status code and message', () => {
        const error = new HttpError(400, 'Bad Request');
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

        expect(error.statusCode).toBe(400);
        expect(error.name).toBe('ValidationError');
        expect(error.errors).toEqual(errList);
        expect(error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('AuthenticationError', () => {
      it('should create with default message', () => {
        const error = new AuthenticationError();
        expect(error.statusCode).toBe(401);
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
        expect(error.statusCode).toBe(403);
        expect(error.message).toBe('Access denied');
        expect(error.code).toBe('ACCESS_DENIED');
      });
    });

    describe('NotFoundError', () => {
      it('should create with default message', () => {
        const error = new NotFoundError();
        expect(error.statusCode).toBe(404);
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
        expect(error.statusCode).toBe(409);
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
        expect(error.statusCode).toBe(429);
        expect(error.retryAfter).toBe(60);
        expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
      });
    });
  });

  describe('Error Factory', () => {
    it('should create bad request error', () => {
      const error = errors.badRequest('Invalid input', { field: 'name' });
      expect(error.statusCode).toBe(400);
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
      expect(error.statusCode).toBe(405);
      expect(error.message).toBe('Method PUT not allowed');
    });

    it('should create conflict error', () => {
      const error = errors.conflict('Resource already exists');
      expect(error.statusCode).toBe(409);
    });

    it('should create unprocessable error', () => {
      const error = errors.unprocessable('Cannot process', { reason: 'test' });
      expect(error.statusCode).toBe(422);
    });

    it('should create too many requests error', () => {
      const error = errors.tooManyRequests(120);
      expect(error).toBeInstanceOf(RateLimitError);
      expect(error.retryAfter).toBe(120);
    });

    it('should create internal error', () => {
      const error = errors.internal();
      expect(error.statusCode).toBe(500);
      expect(error.expose).toBe(false);
    });

    it('should create not implemented error', () => {
      const error = errors.notImplemented('Feature X');
      expect(error.statusCode).toBe(501);
      expect(error.message).toBe('Feature X not implemented');
    });

    it('should create bad gateway error', () => {
      const error = errors.badGateway();
      expect(error.statusCode).toBe(502);
    });

    it('should create service unavailable error', () => {
      const error = errors.serviceUnavailable();
      expect(error.statusCode).toBe(503);
    });

    it('should create gateway timeout error', () => {
      const error = errors.gatewayTimeout();
      expect(error.statusCode).toBe(504);
    });

    it('should create gone error', () => {
      const error = errors.gone();
      expect(error.statusCode).toBe(410);
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

    describe('created', () => {
      it('should create created response', () => {
        const result = created({ id: 1 });
        expect(result).toEqual({
          success: true,
          data: { id: 1 },
        });
      });

      it('should include location when provided', () => {
        const result = created({ id: 1 }, '/api/items/1');
        expect(result.location).toBe('/api/items/1');
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

      it('should handle NaN values', () => {
        const result = parsePagination({ page: 'abc', pageSize: 'xyz' });
        expect(result.page).toBe(1);
        expect(result.pageSize).toBe(20);
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

      it('should parse sort with order', () => {
        const result = parseSort({ sortBy: 'name', sortOrder: 'desc' }, ['name']);
        expect(result).toEqual({ field: 'name', order: 'desc' });
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

      it('should reject NaN for number type', () => {
        const result = validate('not a number', { type: 'number' });
        expect(result.valid).toBe(false);
      });

      it('should validate number min/max', () => {
        const tooLow = validate(5, { type: 'number', min: 10 });
        expect(tooLow.valid).toBe(false);

        const tooHigh = validate(100, { type: 'number', max: 50 });
        expect(tooHigh.valid).toBe(false);

        const inRange = validate(25, { type: 'number', min: 10, max: 50 });
        expect(inRange.valid).toBe(true);
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

        const invalid = validate([1, 2], {
          type: 'array',
          items: { type: 'string' },
        });
        expect(invalid.valid).toBe(false);
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

      it('should handle null values', () => {
        const result = validate(null, { type: 'string' });
        expect(result.value).toBeNull();
      });
    });
  });

  describe('Utilities', () => {
    describe('generateRequestId', () => {
      it('should generate unique IDs', () => {
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
  });
});
