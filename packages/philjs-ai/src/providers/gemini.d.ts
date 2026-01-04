/**
 * Google Gemini provider implementation
 */
import type { AIProvider, CompletionOptions } from '../types.js';
export interface GeminiConfig {
    apiKey: string;
    baseURL?: string;
    defaultModel?: string;
}
export declare class GeminiProvider implements AIProvider {
    name: string;
    private apiKey;
    private baseURL;
    private defaultModel;
    constructor(config: GeminiConfig);
    generateCompletion(prompt: string, options?: CompletionOptions): Promise<string>;
    generateStreamCompletion(prompt: string, options?: CompletionOptions): AsyncIterableIterator<string>;
}
/**
 * Create a Gemini provider instance
 */
export declare function createGeminiProvider(config: GeminiConfig): GeminiProvider;
//# sourceMappingURL=gemini.d.ts.map