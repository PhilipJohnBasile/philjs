/**
 * PhilJS Haystack Adapter
 *
 * Integration with Haystack pipelines.
 */
export interface HaystackPipeline {
    name: string;
    run: (query: string, params?: Record<string, any>) => Promise<any>;
}
export interface HaystackConfig {
    baseUrl: string;
    apiKey?: string;
}
export declare function initHaystack(cfg: HaystackConfig): void;
export declare function useHaystackQuery(pipelineName: string): {
    result: import("@philjs/core").Signal<any>;
    loading: import("@philjs/core").Signal<boolean>;
    error: import("@philjs/core").Signal<Error>;
    query: (input: string, params?: Record<string, any>) => Promise<any>;
};
export declare function useHaystackRAG(pipelineName: string): {
    ask: (question: string) => Promise<{
        answer: any;
        documents: any;
        metadata: any;
    }>;
    result: import("@philjs/core").Signal<any>;
    loading: import("@philjs/core").Signal<boolean>;
    error: import("@philjs/core").Signal<Error>;
};
