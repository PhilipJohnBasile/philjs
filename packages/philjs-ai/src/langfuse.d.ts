/**
 * PhilJS Langfuse Adapter
 */
export interface LangfuseConfig {
    publicKey: string;
    secretKey: string;
    baseUrl?: string;
}
export declare function initLangfuse(cfg: LangfuseConfig): void;
export declare class LangfuseClient {
    createTrace(name: string, input: any): Promise<`${string}-${string}-${string}-${string}-${string}`>;
    endTrace(id: string, output: any): Promise<void>;
}
export declare function useLangfuseTrace(): {
    traceId: import("@philjs/core").Signal<string>;
    start: (name: string, input: any) => Promise<`${string}-${string}-${string}-${string}-${string}`>;
    end: (output: any) => Promise<void>;
};
