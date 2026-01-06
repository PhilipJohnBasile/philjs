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
import { expect } from 'vitest';
// ============================================================================
// Integration Test Context
// ============================================================================
export class IntegrationTestContext {
    cookies = new Map();
    session = {};
    baseUrl;
    headers;
    timeout;
    db;
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'http://localhost:3000';
        this.headers = options.headers || {};
        this.timeout = options.timeout || 30000;
    }
    async request(url, options = {}) {
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
                if (nameValue) {
                    const [name, value] = nameValue.split('=');
                    if (name && value) {
                        this.cookies.set(name.trim(), value.trim());
                    }
                }
            }
        }
        return response;
    }
    getCookies() {
        return Object.fromEntries(this.cookies);
    }
    setCookie(name, value) {
        this.cookies.set(name, value);
    }
    clearCookies() {
        this.cookies.clear();
    }
    getSession() {
        return this.session;
    }
    setSession(data) {
        this.session = data;
    }
}
// ============================================================================
// Test Suite Helpers
// ============================================================================
/**
 * Create integration test suite
 */
export function createIntegrationTest(options = {}) {
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
export function createAPITestHelper(context) {
    return {
        get: (url, options) => context.request(url, { ...options, method: 'GET' }),
        post: (url, body, options) => context.request(url, {
            ...options,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            body: JSON.stringify(body),
        }),
        put: (url, body, options) => context.request(url, {
            ...options,
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            body: JSON.stringify(body),
        }),
        patch: (url, body, options) => context.request(url, {
            ...options,
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            body: JSON.stringify(body),
        }),
        delete: (url, options) => context.request(url, { ...options, method: 'DELETE' }),
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
export function createDatabaseTestHelper(db) {
    return {
        /**
         * Clear all tables
         */
        async clearAll() {
            // Implementation depends on ORM
        },
        /**
         * Seed table with data
         */
        async seed(table, data) {
            console.log(`[Test] Seeding ${table} with ${data.length} records`);
            // Implementation depends on ORM
        },
        /**
         * Count records in table
         */
        async count(table) {
            // Implementation depends on ORM
            return 0;
        },
        /**
         * Find record by ID
         */
        async findById(table, id) {
            // Implementation depends on ORM
            return null;
        },
        /**
         * Truncate table
         */
        async truncate(table) {
            console.log(`[Test] Truncating ${table}`);
            // Implementation depends on ORM
        },
        /**
         * Run raw SQL
         */
        async raw(sql, params) {
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
export function createAuthTestHelper(context) {
    return {
        /**
         * Login as user
         */
        async login(credentials) {
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
        async logout() {
            await context.request('/api/auth/logout', { method: 'POST' });
            context.clearCookies();
        },
        /**
         * Check if authenticated
         */
        async isAuthenticated() {
            const response = await context.request('/api/auth/me');
            return response.ok;
        },
        /**
         * Get current user
         */
        async getCurrentUser() {
            const response = await context.request('/api/auth/me');
            if (!response.ok) {
                return null;
            }
            return response.json();
        },
        /**
         * Set auth token
         */
        setToken(token) {
            context.setCookie('auth_token', token);
        },
        /**
         * Clear auth
         */
        clearAuth() {
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
export async function testRouteFlow(context, routes) {
    for (const route of routes) {
        const { url, method = 'GET', body, expectedStatus = 200, assert: assertFn, } = route;
        const requestInit = { method };
        if (body) {
            requestInit.body = JSON.stringify(body);
            requestInit.headers = { 'Content-Type': 'application/json' };
        }
        const response = await context.request(url, requestInit);
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
export async function measureResponseTime(context, url, options) {
    const start = Date.now();
    await context.request(url, options);
    return Date.now() - start;
}
/**
 * Test performance benchmark
 */
export async function benchmarkRoute(context, url, iterations = 10) {
    const times = [];
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
export async function expectHTMLSnapshot(context, url) {
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
export async function expectJSONSnapshot(context, url) {
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
export async function waitFor(condition, timeout = 5000) {
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
export async function retry(fn, options = {}) {
    const { retries = 3, delay = 1000 } = options;
    let lastError = null;
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            lastError = error;
            if (attempt < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError || new Error('Retry failed');
}
//# sourceMappingURL=integration.js.map