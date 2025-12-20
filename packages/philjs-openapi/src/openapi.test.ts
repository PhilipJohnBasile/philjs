/**
 * PhilJS OpenAPI Tests
 */

import { describe, it, expect } from 'vitest';
import { createAPI, openapi, group, securitySchemes, errorResponses } from './openapi';
import { zodToJsonSchema, isZodSchema, extractExample } from './zod-to-schema';

// Mock Zod-like schemas for testing
function createMockZodSchema(config: {
  typeName: string;
  shape?: () => Record<string, unknown>;
  checks?: Array<{ kind: string; value?: unknown }>;
  values?: readonly unknown[];
  type?: unknown;
  innerType?: unknown;
  defaultValue?: () => unknown;
  description?: string;
}) {
  return {
    _def: {
      typeName: config.typeName,
      shape: config.shape,
      checks: config.checks,
      values: config.values,
      type: config.type,
      innerType: config.innerType,
      defaultValue: config.defaultValue,
      description: config.description,
    },
    description: config.description,
  };
}

describe('zodToJsonSchema', () => {
  it('should convert string schema', () => {
    const schema = createMockZodSchema({
      typeName: 'ZodString',
      checks: [
        { kind: 'min', value: 1 },
        { kind: 'max', value: 100 },
      ],
    });

    const result = zodToJsonSchema(schema);

    expect(result).toEqual({
      type: 'string',
      minLength: 1,
      maxLength: 100,
    });
  });

  it('should convert email format', () => {
    const schema = createMockZodSchema({
      typeName: 'ZodString',
      checks: [{ kind: 'email' }],
    });

    const result = zodToJsonSchema(schema);

    expect(result).toEqual({
      type: 'string',
      format: 'email',
    });
  });

  it('should convert number schema', () => {
    const schema = createMockZodSchema({
      typeName: 'ZodNumber',
      checks: [
        { kind: 'min', value: 0 },
        { kind: 'max', value: 100 },
      ],
    });

    const result = zodToJsonSchema(schema);

    expect(result).toEqual({
      type: 'number',
      minimum: 0,
      maximum: 100,
    });
  });

  it('should convert integer schema', () => {
    const schema = createMockZodSchema({
      typeName: 'ZodNumber',
      checks: [{ kind: 'int' }],
    });

    const result = zodToJsonSchema(schema);

    expect(result).toEqual({
      type: 'integer',
    });
  });

  it('should convert boolean schema', () => {
    const schema = createMockZodSchema({ typeName: 'ZodBoolean' });
    const result = zodToJsonSchema(schema);
    expect(result).toEqual({ type: 'boolean' });
  });

  it('should convert array schema', () => {
    const itemSchema = createMockZodSchema({ typeName: 'ZodString' });
    const schema = createMockZodSchema({
      typeName: 'ZodArray',
      type: itemSchema,
      checks: [{ kind: 'min', value: 1 }],
    });

    const result = zodToJsonSchema(schema);

    expect(result).toEqual({
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
    });
  });

  it('should convert object schema', () => {
    const nameSchema = createMockZodSchema({ typeName: 'ZodString' });
    const ageSchema = createMockZodSchema({
      typeName: 'ZodOptional',
      innerType: createMockZodSchema({ typeName: 'ZodNumber' }),
    });

    const schema = createMockZodSchema({
      typeName: 'ZodObject',
      shape: () => ({
        name: nameSchema,
        age: ageSchema,
      }),
    });

    const result = zodToJsonSchema(schema);

    expect(result.type).toBe('object');
    expect(result.properties).toHaveProperty('name');
    expect(result.properties).toHaveProperty('age');
    expect(result.required).toContain('name');
    expect(result.required).not.toContain('age');
  });

  it('should convert enum schema', () => {
    const schema = createMockZodSchema({
      typeName: 'ZodEnum',
      values: ['admin', 'user', 'guest'],
    });

    const result = zodToJsonSchema(schema);

    expect(result).toEqual({
      type: 'string',
      enum: ['admin', 'user', 'guest'],
    });
  });

  it('should convert date schema', () => {
    const schema = createMockZodSchema({ typeName: 'ZodDate' });
    const result = zodToJsonSchema(schema);
    expect(result).toEqual({ type: 'string', format: 'date-time' });
  });

  it('should handle default values', () => {
    const innerSchema = createMockZodSchema({ typeName: 'ZodString' });
    const schema = createMockZodSchema({
      typeName: 'ZodDefault',
      innerType: innerSchema,
      defaultValue: () => 'default-value',
    });

    const result = zodToJsonSchema(schema);

    expect(result).toEqual({
      type: 'string',
      default: 'default-value',
    });
  });

  it('should include description', () => {
    const schema = createMockZodSchema({
      typeName: 'ZodString',
      description: 'User email address',
    });

    const result = zodToJsonSchema(schema);

    expect(result.description).toBe('User email address');
  });
});

describe('isZodSchema', () => {
  it('should return true for valid Zod schema', () => {
    const schema = createMockZodSchema({ typeName: 'ZodString' });
    expect(isZodSchema(schema)).toBe(true);
  });

  it('should return false for non-Zod objects', () => {
    expect(isZodSchema(null)).toBe(false);
    expect(isZodSchema(undefined)).toBe(false);
    expect(isZodSchema({})).toBe(false);
    expect(isZodSchema({ _def: {} })).toBe(false);
    expect(isZodSchema('string')).toBe(false);
  });
});

describe('extractExample', () => {
  it('should extract default value', () => {
    const schema = createMockZodSchema({
      typeName: 'ZodDefault',
      innerType: createMockZodSchema({ typeName: 'ZodString' }),
      defaultValue: () => 'example',
    });

    expect(extractExample(schema)).toBe('example');
  });

  it('should extract literal value', () => {
    const schema = {
      _def: {
        typeName: 'ZodLiteral',
        value: 'active',
      },
    };

    expect(extractExample(schema)).toBe('active');
  });

  it('should extract first enum value', () => {
    const schema = createMockZodSchema({
      typeName: 'ZodEnum',
      values: ['admin', 'user', 'guest'],
    });

    expect(extractExample(schema)).toBe('admin');
  });
});

describe('createAPI', () => {
  it('should create API definition', () => {
    const api = createAPI({
      'GET /users': {
        handler: async () => [],
      },
      'POST /users': {
        handler: async () => ({}),
      },
    });

    expect(api).toHaveProperty('GET /users');
    expect(api).toHaveProperty('POST /users');
  });
});

describe('openapi', () => {
  it('should generate basic spec', () => {
    const api = createAPI({
      'GET /users': {
        summary: 'List users',
        handler: async () => [],
      },
    });

    const spec = openapi(api, {
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
    });

    expect(spec.openapi).toBe('3.1.0');
    expect(spec.info.title).toBe('Test API');
    expect(spec.info.version).toBe('1.0.0');
    expect(spec.paths).toHaveProperty('/users');
    expect(spec.paths['/users'].get).toBeDefined();
    expect(spec.paths['/users'].get?.summary).toBe('List users');
  });

  it('should convert path params', () => {
    const api = createAPI({
      'GET /users/:id': {
        handler: async () => ({}),
      },
    });

    const spec = openapi(api, {
      info: { title: 'Test', version: '1.0.0' },
    });

    expect(spec.paths).toHaveProperty('/users/{id}');
  });

  it('should include servers', () => {
    const api = createAPI({
      'GET /': { handler: async () => ({}) },
    });

    const spec = openapi(api, {
      info: { title: 'Test', version: '1.0.0' },
      servers: [{ url: 'https://api.example.com' }],
    });

    expect(spec.servers).toHaveLength(1);
    expect(spec.servers?.[0].url).toBe('https://api.example.com');
  });

  it('should include security schemes', () => {
    const api = createAPI({
      'GET /': { handler: async () => ({}) },
    });

    const spec = openapi(api, {
      info: { title: 'Test', version: '1.0.0' },
      securitySchemes: {
        bearerAuth: securitySchemes.bearer('JWT'),
      },
    });

    expect(spec.components?.securitySchemes).toHaveProperty('bearerAuth');
    expect(spec.components?.securitySchemes?.bearerAuth.type).toBe('http');
    expect(spec.components?.securitySchemes?.bearerAuth.scheme).toBe('bearer');
  });

  it('should handle route groups', () => {
    const userGroup = group({
      name: 'Users',
      description: 'User endpoints',
      basePath: '/api',
      routes: {
        'GET /users': { handler: async () => [] },
        'POST /users': { handler: async () => ({}) },
      },
    });

    const spec = openapi(userGroup, {
      info: { title: 'Test', version: '1.0.0' },
    });

    expect(spec.paths).toHaveProperty('/api/users');
    expect(spec.tags).toContainEqual({
      name: 'Users',
      description: 'User endpoints',
    });
  });

  it('should handle multiple route groups', () => {
    const usersGroup = group({
      name: 'Users',
      basePath: '/api/v1',
      routes: {
        'GET /users': { handler: async () => [] },
      },
    });

    const postsGroup = group({
      name: 'Posts',
      basePath: '/api/v1',
      routes: {
        'GET /posts': { handler: async () => [] },
      },
    });

    const spec = openapi([usersGroup, postsGroup], {
      info: { title: 'Test', version: '1.0.0' },
    });

    expect(spec.paths).toHaveProperty('/api/v1/users');
    expect(spec.paths).toHaveProperty('/api/v1/posts');
  });

  it('should generate operation IDs', () => {
    const api = createAPI({
      'GET /users': { handler: async () => [] },
      'POST /users': { handler: async () => ({}) },
      'GET /users/:id': { handler: async () => ({}) },
    });

    const spec = openapi(api, {
      info: { title: 'Test', version: '1.0.0' },
    });

    expect(spec.paths['/users'].get?.operationId).toBe('getUsers');
    expect(spec.paths['/users'].post?.operationId).toBe('postUsers');
    expect(spec.paths['/users/{id}'].get?.operationId).toBe('getUsers_id');
  });

  it('should include tags', () => {
    const api = createAPI({
      'GET /users': {
        tags: ['Users', 'Public'],
        handler: async () => [],
      },
    });

    const spec = openapi(api, {
      info: { title: 'Test', version: '1.0.0' },
    });

    expect(spec.paths['/users'].get?.tags).toEqual(['Users', 'Public']);
  });

  it('should handle deprecated routes', () => {
    const api = createAPI({
      'GET /old-endpoint': {
        deprecated: true,
        handler: async () => [],
      },
    });

    const spec = openapi(api, {
      info: { title: 'Test', version: '1.0.0' },
    });

    expect(spec.paths['/old-endpoint'].get?.deprecated).toBe(true);
  });
});

describe('securitySchemes', () => {
  it('should create bearer scheme', () => {
    const scheme = securitySchemes.bearer('JWT');
    expect(scheme.type).toBe('http');
    expect(scheme.scheme).toBe('bearer');
    expect(scheme.bearerFormat).toBe('JWT');
  });

  it('should create API key scheme', () => {
    const scheme = securitySchemes.apiKey('X-API-Key', 'header');
    expect(scheme.type).toBe('apiKey');
    expect(scheme.name).toBe('X-API-Key');
    expect(scheme.in).toBe('header');
  });

  it('should create basic scheme', () => {
    const scheme = securitySchemes.basic();
    expect(scheme.type).toBe('http');
    expect(scheme.scheme).toBe('basic');
  });

  it('should create OAuth2 authorization code scheme', () => {
    const scheme = securitySchemes.oauth2AuthorizationCode({
      authorizationUrl: 'https://auth.example.com/authorize',
      tokenUrl: 'https://auth.example.com/token',
      scopes: { read: 'Read access' },
    });

    expect(scheme.type).toBe('oauth2');
    expect(scheme.flows.authorizationCode).toBeDefined();
    expect(scheme.flows.authorizationCode?.authorizationUrl).toBe(
      'https://auth.example.com/authorize'
    );
  });

  it('should create OpenID Connect scheme', () => {
    const scheme = securitySchemes.openIdConnect('https://auth.example.com/.well-known/openid');
    expect(scheme.type).toBe('openIdConnect');
    expect(scheme.openIdConnectUrl).toBe('https://auth.example.com/.well-known/openid');
  });
});

describe('errorResponses', () => {
  it('should create bad request response', () => {
    const response = errorResponses.badRequest('Invalid input');
    expect(response.description).toBe('Invalid input');
    expect(response.content?.['application/json']).toBeDefined();
  });

  it('should create unauthorized response', () => {
    const response = errorResponses.unauthorized();
    expect(response.description).toBe('Unauthorized');
  });

  it('should create not found response', () => {
    const response = errorResponses.notFound('Resource not found');
    expect(response.description).toBe('Resource not found');
  });
});
