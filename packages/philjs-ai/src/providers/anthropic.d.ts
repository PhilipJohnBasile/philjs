/**
 * Anthropic (Claude) provider implementation
 */
import type { AIProvider, CompletionOptions } from '../types.js';
export interface AnthropicConfig {
    apiKey: string;
    baseURL?: string;
    defaultModel?: string;
}
export declare class AnthropicProvider implements AIProvider {
    name: string;
    private client;
    private defaultModel;
    constructor(config: AnthropicConfig);
    generateCompletion(prompt: string, options?: CompletionOptions): Promise<string>;
    generateStreamCompletion(prompt: string, options?: CompletionOptions): AsyncIterableIterator<string>;
}
/**
 * Create an Anthropic provider instance
 */
export declare function createAnthropicProvider(config: AnthropicConfig): AnthropicProvider;
//# sourceMappingURL=anthropic.d.ts.map