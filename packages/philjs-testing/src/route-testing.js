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
// Signal factory (inline implementation to avoid runtime import issues)
function signal(value) {
    let current = value;
    const listeners = new Set();
    const getter = (() => current);
    getter.set = (valueOrFn) => {
        const newValue = typeof valueOrFn === 'function'
            ? valueOrFn(current)
            : valueOrFn;
        current = newValue;
        listeners.forEach(fn => fn(newValue));
    };
    getter.subscribe = (fn) => {
        listeners.add(fn);
        return () => listeners.delete(fn);
    };
    getter.peek = () => current;
    return getter;
}
// ============================================================================
// Route Testing
// ============================================================================
/**
 * Create mock route context
 */
export function createMockRoute(options = {}) {
    const { path: initialPath = '/', params: initialParams = {}, searchParams: initialSearchParams = {}, loaderData: initialLoaderData = null, actionData: initialActionData = null, navigation: initialNavigation = { state: 'idle' }, } = options;
    const path = signal(initialPath);
    const params = signal(initialParams);
    const searchParams = signal(new URLSearchParams(initialSearchParams));
    const loaderData = signal(initialLoaderData);
    const actionData = signal(initialActionData);
    const navigation = signal(initialNavigation);
    const navigate = (to, options = {}) => {
        navigation.set({ state: 'loading' });
        // Simulate navigation
        setTimeout(() => {
            path.set(to);
            const url = new URL(to, 'http://localhost');
            searchParams.set(url.searchParams);
            navigation.set({ state: 'idle' });
        }, 0);
    };
    const submit = async (formData, options = {}) => {
        navigation.set({ state: 'submitting' });
        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 0));
        navigation.set({ state: 'idle' });
    };
    const revalidate = async () => {
        navigation.set({ state: 'loading' });
        // Simulate revalidation
        await new Promise(resolve => setTimeout(resolve, 0));
        navigation.set({ state: 'idle' });
    };
    return {
        path,
        params,
        searchParams,
        loaderData,
        actionData,
        navigation,
        navigate,
        submit,
        revalidate,
    };
}
/**
 * Create mock loader
 */
export function createMockLoader(defaultValue) {
    const calls = [];
    let returnValue = defaultValue;
    let rejectedValue;
    const mockFn = async (args) => {
        calls.push(args);
        if (rejectedValue) {
            throw rejectedValue;
        }
        if (returnValue !== undefined) {
            return returnValue;
        }
        throw new Error('Mock loader has no return value');
    };
    return {
        mock: mockFn,
        mockReturnValue: (value) => {
            returnValue = value;
            rejectedValue = undefined;
        },
        mockRejectedValue: (error) => {
            rejectedValue = error;
            returnValue = undefined;
        },
        mockReset: () => {
            calls.length = 0;
            returnValue = defaultValue;
            rejectedValue = undefined;
        },
        callCount: () => calls.length,
        calls: () => [...calls],
    };
}
/**
 * Create mock action
 */
export function createMockAction(defaultValue) {
    const calls = [];
    let returnValue = defaultValue;
    let rejectedValue;
    const mockFn = async (args) => {
        calls.push(args);
        if (rejectedValue) {
            throw rejectedValue;
        }
        if (returnValue !== undefined) {
            return returnValue;
        }
        throw new Error('Mock action has no return value');
    };
    return {
        mock: mockFn,
        mockReturnValue: (value) => {
            returnValue = value;
            rejectedValue = undefined;
        },
        mockRejectedValue: (error) => {
            rejectedValue = error;
            returnValue = undefined;
        },
        mockReset: () => {
            calls.length = 0;
            returnValue = defaultValue;
            rejectedValue = undefined;
        },
        callCount: () => calls.length,
        calls: () => [...calls],
    };
}
/**
 * Create mock Request
 */
export function createMockRequest(url, options = {}) {
    const fullUrl = url.startsWith('http') ? url : `http://localhost${url}`;
    return new Request(fullUrl, options);
}
/**
 * Create mock FormData
 */
export function createMockFormData(data) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(data)) {
        formData.append(key, value);
    }
    return formData;
}
// ============================================================================
// Loader Testing Utilities
// ============================================================================
/**
 * Test loader function
 */
export async function testLoader(loader, options = {}) {
    const { url = '/', params = {}, context, } = options;
    const request = createMockRequest(url);
    return loader({ request, params, context });
}
/**
 * Test loader with params
 */
export async function testLoaderWithParams(loader, params) {
    return testLoader(loader, { params });
}
/**
 * Expect loader to return value
 */
export async function expectLoaderToReturn(loader, expectedValue, options) {
    const result = await testLoader(loader, options);
    expect(result).toEqual(expectedValue);
}
/**
 * Expect loader to throw error
 */
export async function expectLoaderToThrow(loader, expectedError, options) {
    await expect(testLoader(loader, options)).rejects.toThrow(expectedError);
}
// ============================================================================
// Action Testing Utilities
// ============================================================================
/**
 * Test action function
 */
export async function testAction(action, options = {}) {
    const { url = '/', method = 'POST', formData: formDataInput, params = {}, context, } = options;
    const formData = formDataInput instanceof FormData
        ? formDataInput
        : createMockFormData(formDataInput || {});
    const request = createMockRequest(url, {
        method,
        body: formData,
    });
    return action({ request, params, formData, context });
}
/**
 * Test POST action with form data
 */
export async function testPostAction(action, formData) {
    return testAction(action, { method: 'POST', formData });
}
/**
 * Expect action to return value
 */
export async function expectActionToReturn(action, expectedValue, options) {
    const result = await testAction(action, options);
    expect(result).toEqual(expectedValue);
}
/**
 * Expect action to throw error
 */
export async function expectActionToThrow(action, expectedError, options) {
    await expect(testAction(action, options)).rejects.toThrow(expectedError);
}
// ============================================================================
// Navigation Testing
// ============================================================================
/**
 * Test navigation
 */
export function testNavigation() {
    const history = [];
    let currentPath = '/';
    return {
        navigate: (to) => {
            history.push(to);
            currentPath = to;
        },
        getCurrentPath: () => currentPath,
        getHistory: () => [...history],
        clearHistory: () => {
            history.length = 0;
        },
    };
}
/**
 * Wait for navigation
 */
export async function waitForNavigation(context, expectedPath, timeout = 1000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        if (context.navigation().state === 'idle') {
            if (!expectedPath || context.path() === expectedPath) {
                return;
            }
        }
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error(`Navigation did not complete within ${timeout}ms`);
}
/**
 * Wait for loader data
 */
export async function waitForLoaderData(context, timeout = 1000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const data = context.loaderData();
        if (data !== null && data !== undefined) {
            return data;
        }
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error(`Loader data not available within ${timeout}ms`);
}
// ============================================================================
// Assertion Helpers
// ============================================================================
/**
 * Assert route params
 */
export function assertRouteParams(context, expected) {
    expect(context.params()).toEqual(expected);
}
/**
 * Assert search params
 */
export function assertSearchParams(context, expected) {
    const searchParams = context.searchParams();
    const actual = {};
    for (const [key, value] of searchParams) {
        actual[key] = value;
    }
    expect(actual).toEqual(expected);
}
/**
 * Assert navigation state
 */
export function assertNavigationState(context, expectedState) {
    expect(context.navigation().state).toBe(expectedState);
}
//# sourceMappingURL=route-testing.js.map