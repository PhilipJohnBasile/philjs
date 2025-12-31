/**
 * Route Mocking Utilities
 *
 * Mock loaders and actions for route components
 */
import { signal } from 'philjs-core';
export interface MockLoader<T = any> {
    data: ReturnType<typeof signal<T | null>>;
    loading: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<Error | null>>;
    load: (params?: Record<string, any>) => Promise<void>;
    getCalls: () => Array<{
        params?: Record<string, any>;
        timestamp: number;
    }>;
}
export interface MockAction<T = any> {
    data: ReturnType<typeof signal<T | null>>;
    submitting: ReturnType<typeof signal<boolean>>;
    error: ReturnType<typeof signal<Error | null>>;
    submit: (data: any) => Promise<void>;
    getCalls: () => Array<{
        data: any;
        timestamp: number;
    }>;
}
/**
 * Create a mock loader
 */
export declare function createMockLoader<T = any>(loadFn: (params?: Record<string, any>) => Promise<T>): MockLoader<T>;
/**
 * Create a mock action
 */
export declare function createMockAction<T = any>(submitFn: (data: any) => Promise<T>): MockAction<T>;
/**
 * Create a mock loader with data
 */
export declare function createMockLoaderWithData<T = any>(data: T): MockLoader<T>;
/**
 * Create a mock loader with error
 */
export declare function createMockLoaderWithError(errorMessage: string): MockLoader<any>;
//# sourceMappingURL=route-mocks.d.ts.map