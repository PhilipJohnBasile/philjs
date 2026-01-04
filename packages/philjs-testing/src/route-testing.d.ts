/**
 * Route Testing Utilities
 *
 * Comprehensive utilities for testing PhilJS routes:
 * - Route component testing
 * - Loader mocking
 * - Action mocking
 * - Navigation testing
 * - Route parameter testing
 */
import type { Signal } from '@philjs/core/signals';
export interface MockRouteOptions {
    /**
     * Route path
     */
    path?: string;
    /**
     * Route parameters
     */
    params?: Record<string, string>;
    /**
     * Search params
     */
    searchParams?: Record<string, string>;
    /**
     * Loader data
     */
    loaderData?: any;
    /**
     * Action data
     */
    actionData?: any;
    /**
     * Navigation state
     */
    navigation?: NavigationState;
    /**
     * Form data for actions
     */
    formData?: FormData;
}
export interface NavigationState {
    state: 'idle' | 'loading' | 'submitting';
    location?: {
        pathname: string;
        search: string;
        hash: string;
    };
}
export interface MockLoader<T = any> {
    /**
     * Mock loader function
     */
    mock: ((...args: any[]) => any) | ((args: LoaderArgs) => T | Promise<T>);
    /**
     * Set loader response
     */
    mockReturnValue: (value: T) => void;
    /**
     * Set loader error
     */
    mockRejectedValue: (error: Error) => void;
    /**
     * Reset loader mock
     */
    mockReset: () => void;
    /**
     * Get call count
     */
    callCount: () => number;
    /**
     * Get call arguments
     */
    calls: () => LoaderArgs[];
}
export interface MockAction<T = any> {
    /**
     * Mock action function
     */
    mock: ((...args: any[]) => any) | ((args: ActionArgs) => T | Promise<T>);
    /**
     * Set action response
     */
    mockReturnValue: (value: T) => void;
    /**
     * Set action error
     */
    mockRejectedValue: (error: Error) => void;
    /**
     * Reset action mock
     */
    mockReset: () => void;
    /**
     * Get call count
     */
    callCount: () => number;
    /**
     * Get call arguments
     */
    calls: () => ActionArgs[];
}
export interface LoaderArgs {
    request: Request;
    params: Record<string, string>;
    context?: any;
}
export interface ActionArgs {
    request: Request;
    params: Record<string, string>;
    formData?: FormData;
    context?: any;
}
export interface RouteTestContext {
    /**
     * Current path
     */
    path: Signal<string>;
    /**
     * Route params
     */
    params: Signal<Record<string, string>>;
    /**
     * Search params
     */
    searchParams: Signal<URLSearchParams>;
    /**
     * Loader data
     */
    loaderData: Signal<any>;
    /**
     * Action data
     */
    actionData: Signal<any>;
    /**
     * Navigation state
     */
    navigation: Signal<NavigationState>;
    /**
     * Navigate to path
     */
    navigate: (to: string, options?: NavigateOptions) => void;
    /**
     * Submit form
     */
    submit: (formData: FormData, options?: SubmitOptions) => Promise<void>;
    /**
     * Reload loader
     */
    revalidate: () => Promise<void>;
}
export interface NavigateOptions {
    replace?: boolean;
    state?: any;
}
export interface SubmitOptions {
    method?: 'get' | 'post' | 'put' | 'delete' | 'patch';
    action?: string;
    replace?: boolean;
}
/**
 * Create mock route context
 */
export declare function createMockRoute(options?: MockRouteOptions): RouteTestContext;
/**
 * Create mock loader
 */
export declare function createMockLoader<T = any>(defaultValue?: T): MockLoader<T>;
/**
 * Create mock action
 */
export declare function createMockAction<T = any>(defaultValue?: T): MockAction<T>;
/**
 * Create mock Request
 */
export declare function createMockRequest(url: string, options?: RequestInit): Request;
/**
 * Create mock FormData
 */
export declare function createMockFormData(data: Record<string, string | Blob>): FormData;
/**
 * Test loader function
 */
export declare function testLoader<T>(loader: (args: LoaderArgs) => T | Promise<T>, options?: {
    url?: string;
    params?: Record<string, string>;
    context?: any;
}): Promise<T>;
/**
 * Test loader with params
 */
export declare function testLoaderWithParams<T>(loader: (args: LoaderArgs) => T | Promise<T>, params: Record<string, string>): Promise<T>;
/**
 * Expect loader to return value
 */
export declare function expectLoaderToReturn<T>(loader: (args: LoaderArgs) => T | Promise<T>, expectedValue: T, options?: {
    url?: string;
    params?: Record<string, string>;
}): Promise<void>;
/**
 * Expect loader to throw error
 */
export declare function expectLoaderToThrow(loader: (args: LoaderArgs) => any, expectedError?: string | RegExp | Error, options?: {
    url?: string;
    params?: Record<string, string>;
}): Promise<void>;
/**
 * Test action function
 */
export declare function testAction<T>(action: (args: ActionArgs) => T | Promise<T>, options?: {
    url?: string;
    method?: string;
    formData?: FormData | Record<string, string>;
    params?: Record<string, string>;
    context?: any;
}): Promise<T>;
/**
 * Test POST action with form data
 */
export declare function testPostAction<T>(action: (args: ActionArgs) => T | Promise<T>, formData: Record<string, string>): Promise<T>;
/**
 * Expect action to return value
 */
export declare function expectActionToReturn<T>(action: (args: ActionArgs) => T | Promise<T>, expectedValue: T, options?: {
    formData?: Record<string, string>;
    params?: Record<string, string>;
}): Promise<void>;
/**
 * Expect action to throw error
 */
export declare function expectActionToThrow(action: (args: ActionArgs) => any, expectedError?: string | RegExp | Error, options?: {
    formData?: Record<string, string>;
    params?: Record<string, string>;
}): Promise<void>;
/**
 * Test navigation
 */
export declare function testNavigation(): {
    navigate: (to: string) => void;
    getCurrentPath: () => string;
    getHistory: () => string[];
    clearHistory: () => void;
};
/**
 * Wait for navigation
 */
export declare function waitForNavigation(context: RouteTestContext, expectedPath?: string, timeout?: number): Promise<void>;
/**
 * Wait for loader data
 */
export declare function waitForLoaderData(context: RouteTestContext, timeout?: number): Promise<any>;
/**
 * Assert route params
 */
export declare function assertRouteParams(context: RouteTestContext, expected: Record<string, string>): void;
/**
 * Assert search params
 */
export declare function assertSearchParams(context: RouteTestContext, expected: Record<string, string>): void;
/**
 * Assert navigation state
 */
export declare function assertNavigationState(context: RouteTestContext, expectedState: 'idle' | 'loading' | 'submitting'): void;
//# sourceMappingURL=route-testing.d.ts.map