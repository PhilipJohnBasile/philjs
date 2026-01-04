/**
 * API Mocking Utilities
 *
 * Mock API endpoints using MSW
 */
export interface MockAPIHandler {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    response: any;
    status?: number;
    delay?: number;
}
/**
 * Create a mock API handler
 */
export declare function createMockAPI(handlers: MockAPIHandler[]): import("msw").HttpHandler[];
/**
 * Create a mock API error response
 */
export declare function createMockError(path: string, message: string, status?: number, method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'): import("msw").HttpHandler;
/**
 * Create a mock API with delay
 */
export declare function createMockDelayedAPI(path: string, response: any, delay: number, method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'): import("msw").HttpHandler;
/**
 * Create a mock paginated API
 */
export declare function createMockPaginatedAPI(path: string, data: any[], pageSize?: number): import("msw").HttpHandler;
//# sourceMappingURL=api-mocks.d.ts.map