/**
 * Route Mocking Utilities
 *
 * Mock loaders and actions for route components
 */
import { signal } from '@philjs/core';
/**
 * Create a mock loader
 */
export function createMockLoader(loadFn) {
    const data$ = signal(null);
    const loading$ = signal(false);
    const error$ = signal(null);
    const calls = [];
    return {
        data: data$,
        loading: loading$,
        error: error$,
        async load(params) {
            calls.push({ ...(params !== undefined ? { params } : {}), timestamp: Date.now() });
            loading$.set(true);
            error$.set(null);
            try {
                const result = await loadFn(params);
                data$.set(result);
            }
            catch (err) {
                error$.set(err);
            }
            finally {
                loading$.set(false);
            }
        },
        getCalls: () => calls,
    };
}
/**
 * Create a mock action
 */
export function createMockAction(submitFn) {
    const data$ = signal(null);
    const submitting$ = signal(false);
    const error$ = signal(null);
    const calls = [];
    return {
        data: data$,
        submitting: submitting$,
        error: error$,
        async submit(data) {
            calls.push({ data, timestamp: Date.now() });
            submitting$.set(true);
            error$.set(null);
            try {
                const result = await submitFn(data);
                data$.set(result);
            }
            catch (err) {
                error$.set(err);
            }
            finally {
                submitting$.set(false);
            }
        },
        getCalls: () => calls,
    };
}
/**
 * Create a mock loader with data
 */
export function createMockLoaderWithData(data) {
    return createMockLoader(async () => data);
}
/**
 * Create a mock loader with error
 */
export function createMockLoaderWithError(errorMessage) {
    return createMockLoader(async () => {
        throw new Error(errorMessage);
    });
}
//# sourceMappingURL=route-mocks.js.map