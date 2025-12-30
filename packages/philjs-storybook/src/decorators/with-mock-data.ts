/**
 * Mock Data Decorator
 *
 * Wraps stories with mock data providers
 */

import { signal } from 'philjs-core';

export interface MockDataConfig {
  data: Record<string, any>;
  delay?: number;
  shouldFail?: boolean;
  errorMessage?: string;
}

export interface WithMockDataOptions {
  mocks?: Record<string, MockDataConfig>;
}

/**
 * Decorator that provides mock data to stories
 */
export function withMockData(options: WithMockDataOptions = {}) {
  const { mocks = {} } = options;

  return (storyFn: () => any, context: any) => {
    // Create mock data signals
    const mockData: Record<string, ReturnType<typeof signal<Record<string, any>>>> = {};
    const loading: Record<string, ReturnType<typeof signal<boolean>>> = {};
    const errors: Record<string, ReturnType<typeof signal<string | null>>> = {};

    for (const key of Object.keys(mocks)) {
      const config = mocks[key]!;
      mockData[key] = signal<Record<string, any>>(config.data);
      loading[key] = signal(false);
      errors[key] = signal<string | null>(null);
    }

    // Mock fetch function
    const mockFetch = async (key: string): Promise<any> => {
      const config = mocks[key];
      if (!config) {
        throw new Error(`No mock data configured for key: ${key}`);
      }

      loading[key]!.set(true);
      errors[key]!.set(null);

      try {
        if (config.delay) {
          await new Promise((resolve) => setTimeout(resolve, config.delay));
        }

        if (config.shouldFail) {
          throw new Error(config.errorMessage ?? 'Mock fetch failed');
        }

        return config.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors[key]!.set(message);
        throw err;
      } finally {
        loading[key]!.set(false);
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
