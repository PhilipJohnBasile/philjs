/**
 * Mock Data Decorator
 *
 * Wraps stories with mock data providers
 */
import { signal } from '@philjs/core';
/**
 * Decorator that provides mock data to stories
 */
export function withMockData(options = {}) {
    const { mocks = {} } = options;
    return (storyFn, context) => {
        // Create mock data signals
        const mockData = {};
        const loading = {};
        const errors = {};
        for (const key of Object.keys(mocks)) {
            const config = mocks[key];
            mockData[key] = signal(config.data);
            loading[key] = signal(false);
            errors[key] = signal(null);
        }
        // Mock fetch function
        const mockFetch = async (key) => {
            const config = mocks[key];
            if (!config) {
                throw new Error(`No mock data configured for key: ${key}`);
            }
            loading[key].set(true);
            errors[key].set(null);
            try {
                if (config.delay) {
                    await new Promise((resolve) => setTimeout(resolve, config.delay));
                }
                if (config.shouldFail) {
                    throw new Error(config.errorMessage ?? 'Mock fetch failed');
                }
                return config.data;
            }
            catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                errors[key].set(message);
                throw err;
            }
            finally {
                loading[key].set(false);
            }
        };
        // Attach mock utilities to context
        if (context && context.parameters) {
            context.parameters['mockData'] = {
                data: mockData,
                loading,
                errors,
                fetch: mockFetch,
            };
        }
        return storyFn();
    };
}
//# sourceMappingURL=with-mock-data.js.map