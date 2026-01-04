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
export declare class IntegrationTestContext implements TestContext {
    private cookies;
    private session;
    private baseUrl;
    private headers;
    private timeout;
    db?: any;
    constructor(options?: IntegrationTestOptions);
    request(url: string, options?: RequestInit): Promise<Response>;
    getCookies(): Record<string, string>;
    setCookie(name: string, value: string): void;
    clearCookies(): void;
    getSession(): any;
    setSession(data: any): void;
}
/**
 * Create integration test suite
 */
export declare function createIntegrationTest(options?: IntegrationTestOptions): {
    context: TestContext;
    beforeAll: () => Promise<void>;
    afterAll: () => Promise<void>;
    beforeEach: () => Promise<void>;
    afterEach: () => Promise<void>;
};
/**
 * Create API test helper
 */
export declare function createAPITestHelper(context: TestContext): APITestHelper;
/**
 * Create database test helper
 */
export declare function createDatabaseTestHelper(db: any): {
    /**
     * Clear all tables
     */
    clearAll(): Promise<void>;
    /**
     * Seed table with data
     */
    seed<T>(table: string, data: T[]): Promise<void>;
    /**
     * Count records in table
     */
    count(table: string): Promise<number>;
    /**
     * Find record by ID
     */
    findById<T>(table: string, id: string | number): Promise<T | null>;
    /**
     * Truncate table
     */
    truncate(table: string): Promise<void>;
    /**
     * Run raw SQL
     */
    raw(sql: string, params?: any[]): Promise<any>;
};
/**
 * Create authentication test helper
 */
export declare function createAuthTestHelper(context: TestContext): {
    /**
     * Login as user
     */
    login(credentials: {
        email: string;
        password: string;
    }): Promise<void>;
    /**
     * Logout
     */
    logout(): Promise<void>;
    /**
     * Check if authenticated
     */
    isAuthenticated(): Promise<boolean>;
    /**
     * Get current user
     */
    getCurrentUser<T = any>(): Promise<T | null>;
    /**
     * Set auth token
     */
    setToken(token: string): void;
    /**
     * Clear auth
     */
    clearAuth(): void;
};
/**
 * Test multiple routes in sequence
 */
export declare function testRouteFlow(context: TestContext, routes: Array<{
    url: string;
    method?: string;
    body?: any;
    expectedStatus?: number;
    assert?: (response: Response) => Promise<void>;
}>): Promise<void>;
/**
 * Measure response time
 */
export declare function measureResponseTime(context: TestContext, url: string, options?: RequestInit): Promise<number>;
/**
 * Test performance benchmark
 */
export declare function benchmarkRoute(context: TestContext, url: string, iterations?: number): Promise<{
    min: number;
    max: number;
    avg: number;
    median: number;
}>;
/**
 * Test HTML snapshot
 */
export declare function expectHTMLSnapshot(context: TestContext, url: string): Promise<void>;
/**
 * Test JSON snapshot
 */
export declare function expectJSONSnapshot(context: TestContext, url: string): Promise<void>;
/**
 * Wait for condition
 */
export declare function waitFor(condition: () => boolean | Promise<boolean>, timeout?: number): Promise<void>;
/**
 * Retry function
 */
export declare function retry<T>(fn: () => T | Promise<T>, options?: {
    retries?: number;
    delay?: number;
}): Promise<T>;
//# sourceMappingURL=integration.d.ts.map