/**
 * Integration Testing Utilities
 *
 * End-to-end integration testing for PhilJS applications:
 * - Full application testing
 * - API integration testing
 * - Database integration testing
 * - Multi-route testing
 * - Session and authentication testing
 */

import type { Signal } from 'philjs-core/signals';

// ============================================================================
// Types
// ============================================================================

export interface IntegrationTestOptions {
  /**
   * Base URL for the application
   */
  baseUrl?: string;

  /**
   * Database setup function
   */
  setupDatabase?: () => Promise<void>;

  /**
   * Database teardown function
   */
  teardownDatabase?: () => Promise<void>;

  /**
   * Seed data function
   */
  seedData?: () => Promise<void>;

  /**
   * Clean up function
   */
  cleanup?: () => Promise<void>;

  /**
   * Custom headers
   */
  headers?: Record<string, string>;

  /**
   * Timeout for requests (ms)
   */
  timeout?: number;
}

export interface TestContext {
  /**
   * Make HTTP request
   */
  request: (url: string, options?: RequestInit) => Promise<Response>;

  /**
   * Get current cookies
   */
  getCookies: () => Record<string, string>;

  /**
   * Set cookie
   */
  setCookie: (name: string, value: string) => void;

  /**
   * Clear cookies
   */
  clearCookies: () => void;

  /**
   * Get session data
   */
  getSession: () => any;

  /**
   * Set session data
   */
  setSession: (data: any) => void;

  /**
   * Database access
   */
  db?: any;
}

export interface APITestHelper {
  /**
   * GET request
   */
  get: (url: string, options?: RequestInit) => Promise<Response>;

  /**
   * POST request
   */
  post: (url: string, body?: any, options?: RequestInit) => Promise<Response>;

  /**
   * PUT request
   */
  put: (url: string, body?: any, options?: RequestInit) => Promise<Response>;

  /**
   * PATCH request
   */
  patch: (url: string, body?: any, options?: RequestInit) => Promise<Response>;

  /**
   * DELETE request
   */
  delete: (url: string, options?: RequestInit) => Promise<Response>;

  /**
   * Expect response status
   */
  expectStatus: (response: Response, status: number) => Promise<void>;

  /**
   * Expect response JSON
   */
  expectJson: <T = any>(response: Response, expected: T) => Promise<void>;

  /**
   * Expect response to contain
   */
  expectToContain: (response: Response, text: string) => Promise<void>;
}

// ============================================================================
// Integration Test Context
// ============================================================================

export class IntegrationTestContext implements TestContext {
  private cookies: Map<string, string> = new Map();
  private session: any = {};
  private baseUrl: string;
  private headers: Record<string, string>;
  private timeout: number;
  public db?: any;

  constructor(options: IntegrationTestOptions = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.headers = options.headers || {};
    this.timeout = options.timeout || 30000;
  }

  async request(url: string, options: RequestInit = {}): Promise<Response> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

    const headers = new Headers(options.headers);

    // Add cookies
    if (this.cookies.size > 0) {
      const cookieHeader = Array.from(this.cookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join('; ');
      headers.set('Cookie', cookieHeader);
    }

    // Add custom headers
    for (const [key, value] of Object.entries(this.headers)) {
      headers.set(key, value);
    }

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    // Parse set-cookie headers
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const cookies = setCookie.split(',');
      for (const cookie of cookies) {
        const [nameValue] = cookie.split(';');
        const [name, value] = nameValue.split('=');
        this.cookies.set(name.trim(), value.trim());
      }
    }

    return response;
  }

  getCookies(): Record<string, string> {
    return Object.fromEntries(this.cookies);
  }

  setCookie(name: string, value: string): void {
    this.cookies.set(name, value);
  }

  clearCookies(): void {
    this.cookies.clear();
  }

  getSession(): any {
    return this.session;
  }

  setSession(data: any): void {
    this.session = data;
  }
}

// ============================================================================
// Test Suite Helpers
// ============================================================================

/**
 * Create integration test suite
 */
export function createIntegrationTest(
  options: IntegrationTestOptions = {}
): {
  context: TestContext;
  beforeAll: () => Promise<void>;
  afterAll: () => Promise<void>;
  beforeEach: () => Promise<void>;
  afterEach: () => Promise<void>;
} {
  const context = new IntegrationTestContext(options);

  return {
    context,
    beforeAll: async () => {
      if (options.setupDatabase) {
        await options.setupDatabase();
      }
    },
    afterAll: async () => {
      if (options.teardownDatabase) {
        await options.teardownDatabase();
      }
    },
    beforeEach: async () => {
      if (options.seedData) {
        await options.seedData();
      }
    },
    afterEach: async () => {
      if (options.cleanup) {
        await options.cleanup();
      }
      context.clearCookies();
    },
  };
}

// ============================================================================
// API Testing Helpers
// ============================================================================

/**
 * Create API test helper
 */
export function createAPITestHelper(context: TestContext): APITestHelper {
  return {
    get: (url, options) => context.request(url, { ...options, method: 'GET' }),

    post: (url, body, options) =>
      context.request(url, {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: JSON.stringify(body),
      }),

    put: (url, body, options) =>
      context.request(url, {
        ...options,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: JSON.stringify(body),
      }),

    patch: (url, body, options) =>
      context.request(url, {
        ...options,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: JSON.stringify(body),
      }),

    delete: (url, options) =>
      context.request(url, { ...options, method: 'DELETE' }),

    expectStatus: async (response, status) => {
      expect(response.status).toBe(status);
    },

    expectJson: async (response, expected) => {
      const json = await response.json();
      expect(json).toEqual(expected);
    },

    expectToContain: async (response, text) => {
      const body = await response.text();
      expect(body).toContain(text);
    },
  };
}

// ============================================================================
// Database Testing Helpers
// ============================================================================

/**
 * Create database test helper
 */
export function createDatabaseTestHelper(db: any) {
  return {
    /**
     * Clear all tables
     */
    async clearAll(): Promise<void> {
      // Implementation depends on ORM
      console.log('[Test] Clearing database...');
    },

    /**
     * Seed table with data
     */
    async seed<T>(table: string, data: T[]): Promise<void> {
      console.log(`[Test] Seeding ${table} with ${data.length} records`);
      // Implementation depends on ORM
    },

    /**
     * Count records in table
     */
    async count(table: string): Promise<number> {
      // Implementation depends on ORM
      return 0;
    },

    /**
     * Find record by ID
     */
    async findById<T>(table: string, id: string | number): Promise<T | null> {
      // Implementation depends on ORM
      return null;
    },

    /**
     * Truncate table
     */
    async truncate(table: string): Promise<void> {
      console.log(`[Test] Truncating ${table}`);
      // Implementation depends on ORM
    },

    /**
     * Run raw SQL
     */
    async raw(sql: string, params?: any[]): Promise<any> {
      // Implementation depends on ORM
      return null;
    },
  };
}

// ============================================================================
// Authentication Testing
// ============================================================================

/**
 * Create authentication test helper
 */
export function createAuthTestHelper(context: TestContext) {
  return {
    /**
     * Login as user
     */
    async login(credentials: { email: string; password: string }): Promise<void> {
      const response = await context.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.statusText}`);
      }
    },

    /**
     * Logout
     */
    async logout(): Promise<void> {
      await context.request('/api/auth/logout', { method: 'POST' });
      context.clearCookies();
    },

    /**
     * Check if authenticated
     */
    async isAuthenticated(): Promise<boolean> {
      const response = await context.request('/api/auth/me');
      return response.ok;
    },

    /**
     * Get current user
     */
    async getCurrentUser<T = any>(): Promise<T | null> {
      const response = await context.request('/api/auth/me');

      if (!response.ok) {
        return null;
      }

      return response.json();
    },

    /**
     * Set auth token
     */
    setToken(token: string): void {
      context.setCookie('auth_token', token);
    },

    /**
     * Clear auth
     */
    clearAuth(): void {
      context.clearCookies();
    },
  };
}

// ============================================================================
// Multi-Route Testing
// ============================================================================

/**
 * Test multiple routes in sequence
 */
export async function testRouteFlow(
  context: TestContext,
  routes: Array<{
    url: string;
    method?: string;
    body?: any;
    expectedStatus?: number;
    assert?: (response: Response) => Promise<void>;
  }>
): Promise<void> {
  for (const route of routes) {
    const {
      url,
      method = 'GET',
      body,
      expectedStatus = 200,
      assert: assertFn,
    } = route;

    const response = await context.request(url, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
    });

    expect(response.status).toBe(expectedStatus);

    if (assertFn) {
      await assertFn(response);
    }
  }
}

// ============================================================================
// Performance Testing
// ============================================================================

/**
 * Measure response time
 */
export async function measureResponseTime(
  context: TestContext,
  url: string,
  options?: RequestInit
): Promise<number> {
  const start = Date.now();
  await context.request(url, options);
  return Date.now() - start;
}

/**
 * Test performance benchmark
 */
export async function benchmarkRoute(
  context: TestContext,
  url: string,
  iterations = 10
): Promise<{
  min: number;
  max: number;
  avg: number;
  median: number;
}> {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const time = await measureResponseTime(context, url);
    times.push(time);
  }

  times.sort((a, b) => a - b);

  return {
    min: times[0],
    max: times[times.length - 1],
    avg: times.reduce((sum, t) => sum + t, 0) / times.length,
    median: times[Math.floor(times.length / 2)],
  };
}

// ============================================================================
// Snapshot Testing
// ============================================================================

/**
 * Test HTML snapshot
 */
export async function expectHTMLSnapshot(
  context: TestContext,
  url: string
): Promise<void> {
  const response = await context.request(url);
  const html = await response.text();

  // Remove dynamic content
  const normalized = html
    .replace(/data-test-id="[^"]+"/g, '')
    .replace(/<!--.*?-->/gs, '')
    .replace(/\s+/g, ' ')
    .trim();

  expect(normalized).toMatchSnapshot();
}

/**
 * Test JSON snapshot
 */
export async function expectJSONSnapshot(
  context: TestContext,
  url: string
): Promise<void> {
  const response = await context.request(url);
  const json = await response.json();

  expect(json).toMatchSnapshot();
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Wait for condition
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Retry function
 */
export async function retry<T>(
  fn: () => T | Promise<T>,
  options: {
    retries?: number;
    delay?: number;
  } = {}
): Promise<T> {
  const { retries = 3, delay = 1000 } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Retry failed');
}

// Global expect function
declare global {
  function expect(value: any): any;
}
