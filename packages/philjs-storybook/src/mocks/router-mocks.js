/**
 * Router Mocking Utilities
 *
 * Create mock router for testing route components
 */
import { signal } from 'philjs-core';
/**
 * Create a mock router
 */
export function createMockRouter(initialPath = '/') {
    const pathname$ = signal(initialPath);
    const params$ = signal({});
    const searchParams$ = signal(new URLSearchParams());
    const calls = [];
    const router = {
        pathname: pathname$,
        params: params$,
        searchParams: searchParams$,
        navigate: (path) => {
            calls.push({ method: 'navigate', args: [path], timestamp: Date.now() });
            pathname$.set(path);
        },
        back: () => {
            calls.push({ method: 'back', args: [], timestamp: Date.now() });
        },
        forward: () => {
            calls.push({ method: 'forward', args: [], timestamp: Date.now() });
        },
        push: (path) => {
            calls.push({ method: 'push', args: [path], timestamp: Date.now() });
            pathname$.set(path);
        },
        replace: (path) => {
            calls.push({ method: 'replace', args: [path], timestamp: Date.now() });
            pathname$.set(path);
        },
        getCalls: () => calls,
    };
    return router;
}
/**
 * Create mock route params
 */
export function createMockParams(params) {
    return signal(params);
}
/**
 * Create mock search params
 */
export function createMockSearchParams(params = {}) {
    return signal(new URLSearchParams(params));
}
//# sourceMappingURL=router-mocks.js.map