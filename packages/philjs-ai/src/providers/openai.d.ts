/**
 * OpenAI provider implementation
 */
import type { AIProvider, CompletionOptions } from '../types.js';
export interface OpenAIConfig {
    apiKey: string;
    baseURL?: string;
    organization?: string;
    defaultModel?: string;
}
export declare class OpenAIProvider implements AIProvider {
    name: string;
    private client;
    private defaultModel;
    constructor(config: OpenAIConfig);
    generateCompletion(prompt: string, options?: CompletionOptions): Promise<string>;
    generateStreamCompletion(prompt: string, options?: CompletionOptions): AsyncIterableIterator<string>;
}
/**
 * Create an OpenAI provider instance
 */
export declare function createOpenAIProvider(config: OpenAIConfig): OpenAIProvider;
//# sourceMappingURL=openai.d.ts.map