/**
 * Cohere provider implementation
 */
import type { AIProvider, CompletionOptions } from '../types.js';
export interface CohereConfig {
    apiKey: string;
    baseURL?: string;
    defaultModel?: string;
}
export declare class CohereProvider implements AIProvider {
    name: string;
    private apiKey;
    private baseURL;
    private defaultModel;
    constructor(config: CohereConfig);
    generateCompletion(prompt: string, options?: CompletionOptions): Promise<string>;
    generateStreamCompletion(prompt: string, options?: CompletionOptions): AsyncIterableIterator<string>;
}
/**
 * Create a Cohere provider instance
 */
export declare function createCohereProvider(config: CohereConfig): CohereProvider;
//# sourceMappingURL=cohere.d.ts.map