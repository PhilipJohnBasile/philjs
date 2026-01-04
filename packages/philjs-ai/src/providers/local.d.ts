/**
 * Local LLM provider (Ollama) implementation
 */
import type { AIProvider, CompletionOptions } from '../types.js';
export interface LocalConfig {
    baseURL?: string;
    defaultModel?: string;
}
export declare class LocalProvider implements AIProvider {
    name: string;
    private baseURL;
    private defaultModel;
    constructor(config?: LocalConfig);
    generateCompletion(prompt: string, options?: CompletionOptions): Promise<string>;
    generateStreamCompletion(prompt: string, options?: CompletionOptions): AsyncIterableIterator<string>;
}
/**
 * Create a local LLM provider instance
 */
export declare function createLocalProvider(config?: LocalConfig): LocalProvider;
//# sourceMappingURL=local.d.ts.map