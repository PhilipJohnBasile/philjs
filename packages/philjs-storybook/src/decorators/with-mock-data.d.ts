/**
 * Mock Data Decorator
 *
 * Wraps stories with mock data providers
 */
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
export declare function withMockData(options?: WithMockDataOptions): (storyFn: () => any, context: any) => any;
//# sourceMappingURL=with-mock-data.d.ts.map