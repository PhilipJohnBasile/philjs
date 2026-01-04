/**
 * Network Mocking for Testing
 *
 * Mock HTTP requests for testing:
 * - Request interception
 * - Response mocking
 * - Network delay simulation
 * - Error simulation
 */
export interface MockRequest {
    url: string;
    method: string;
    headers: Headers;
    body: unknown;
}
export interface MockResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: unknown;
    delay?: number;
}
export interface MockHandler {
    match: (request: MockRequest) => boolean;
    respond: (request: MockRequest) => MockResponse | Promise<MockResponse>;
}
export interface NetworkMock {
    get: (url: string | RegExp, response: MockResponseConfig) => NetworkMock;
    post: (url: string | RegExp, response: MockResponseConfig) => NetworkMock;
    put: (url: string | RegExp, response: MockResponseConfig) => NetworkMock;
    patch: (url: string | RegExp, response: MockResponseConfig) => NetworkMock;
    delete: (url: string | RegExp, response: MockResponseConfig) => NetworkMock;
    any: (url: string | RegExp, response: MockResponseConfig) => NetworkMock;
    intercept: (handler: MockHandler) => NetworkMock;
    reset: () => void;
    restore: () => void;
    history: () => MockRequest[];
    pending: () => number;
    waitForAll: () => Promise<void>;
    setNetworkDelay: (ms: number) => void;
    setOffline: (offline: boolean) => void;
}
export type MockResponseConfig = MockResponse | ((request: MockRequest) => MockResponse | Promise<MockResponse>) | unknown;
export interface NetworkStats {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageLatency: number;
    pendingRequests: number;
}
/**
 * Create network mock instance
 */
export declare function createNetworkMock(): NetworkMock;
/**
 * Create successful JSON response
 */
export declare function json(data: unknown, status?: number): MockResponse;
/**
 * Create error response
 */
export declare function error(status: number, message?: string): MockResponse;
/**
 * Create delayed response
 */
export declare function delayed(response: MockResponse, ms: number): MockResponse;
/**
 * Create response that fails N times before succeeding
 */
export declare function flaky(successResponse: MockResponse, failureCount?: number, failureResponse?: MockResponse): (request: MockRequest) => MockResponse;
/**
 * Create paginated response
 */
export declare function paginated<T>(items: T[], pageSize?: number): (request: MockRequest) => MockResponse;
/**
 * Match request by headers
 */
export declare function withHeaders(headers: Record<string, string>): (request: MockRequest) => boolean;
/**
 * Match request by body content
 */
export declare function withBody(bodyMatcher: Record<string, unknown> | ((body: unknown) => boolean)): (request: MockRequest) => boolean;
/**
 * Match request by query parameters
 */
export declare function withQuery(params: Record<string, string>): (request: MockRequest) => boolean;
/**
 * Assert request was made
 */
export declare function expectRequest(mock: NetworkMock, method: string, url: string | RegExp): void;
/**
 * Assert request count
 */
export declare function expectRequestCount(mock: NetworkMock, method: string, url: string | RegExp, count: number): void;
/**
 * Assert no requests were made
 */
export declare function expectNoRequests(mock: NetworkMock): void;
/**
 * Get network stats
 */
export declare function getNetworkStats(mock: NetworkMock): NetworkStats;
export interface GraphQLMock {
    query: (operationName: string, response: unknown) => GraphQLMock;
    mutation: (operationName: string, response: unknown) => GraphQLMock;
    subscription: (operationName: string, response: unknown) => GraphQLMock;
}
/**
 * Create GraphQL mock
 */
export declare function createGraphQLMock(endpoint?: string): GraphQLMock & NetworkMock;
export interface WebSocketMock {
    send: (data: unknown) => void;
    close: () => void;
    onMessage: (handler: (data: unknown) => void) => void;
    simulateMessage: (data: unknown) => void;
    simulateError: (error: Error) => void;
    simulateClose: (code?: number, reason?: string) => void;
}
/**
 * Create WebSocket mock
 */
export declare function createWebSocketMock(url: string): WebSocketMock;
//# sourceMappingURL=network-mocking.d.ts.map