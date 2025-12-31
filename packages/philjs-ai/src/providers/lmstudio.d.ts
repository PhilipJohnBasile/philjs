/**
 * LM Studio provider implementation (OpenAI-compatible local models)
 */
import type { AIProvider, CompletionOptions } from '../types.js';
export interface LMStudioConfig {
    baseURL?: string;
    defaultModel?: string;
}
export declare class LMStudioProvider implements AIProvider {
    name: string;
    private baseURL;
    private defaultModel;
    constructor(config?: LMStudioConfig);
    generateCompletion(prompt: string, options?: CompletionOptions): Promise<string>;
    generateStreamCompletion(prompt: string, options?: CompletionOptions): AsyncIterableIterator<string>;
}
/**
 * Create an LM Studio provider instance
 */
export declare function createLMStudioProvider(config?: LMStudioConfig): LMStudioProvider;
//# sourceMappingURL=lmstudio.d.ts.map