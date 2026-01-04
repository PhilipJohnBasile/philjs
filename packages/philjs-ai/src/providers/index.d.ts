/**
 * AI Providers Module
 *
 * Provider implementations for different AI services
 */
export * from './openai.js';
export * from './anthropic.js';
export * from './local.js';
export * from './gemini.js';
export * from './cohere.js';
export * from './lmstudio.js';
import type { AIProvider } from '../types.js';
import { type OpenAIConfig } from './openai.js';
import { type AnthropicConfig } from './anthropic.js';
import { type LocalConfig } from './local.js';
import { type GeminiConfig } from './gemini.js';
import { type CohereConfig } from './cohere.js';
import { type LMStudioConfig } from './lmstudio.js';
/**
 * Provider configuration type
 */
export type ProviderConfig = {
    type: 'openai';
    config: OpenAIConfig;
} | {
    type: 'anthropic';
    config: AnthropicConfig;
} | {
    type: 'local';
    config?: LocalConfig;
} | {
    type: 'gemini';
    config: GeminiConfig;
} | {
    type: 'cohere';
    config: CohereConfig;
} | {
    type: 'lmstudio';
    config?: LMStudioConfig;
};
/**
 * Create a provider from configuration
 */
export declare function createProvider(providerConfig: ProviderConfig): AIProvider;
/**
 * Auto-detect provider from environment variables
 */
export declare function autoDetectProvider(): AIProvider;
/**
 * Provider registry for managing multiple providers
 */
export declare class ProviderRegistry {
    private providers;
    private defaultProvider;
    /**
     * Register a provider
     */
    register(name: string, provider: AIProvider, isDefault?: boolean): void;
    /**
     * Get a provider by name
     */
    get(name: string): AIProvider | undefined;
    /**
     * Get the default provider
     */
    getDefault(): AIProvider;
    /**
     * Set the default provider
     */
    setDefault(name: string): void;
    /**
     * List all registered providers
     */
    list(): string[];
    /**
     * Remove a provider
     */
    remove(name: string): boolean;
    /**
     * Clear all providers
     */
    clear(): void;
}
/**
 * Global provider registry instance
 */
export declare const providerRegistry: ProviderRegistry;
//# sourceMappingURL=index.d.ts.map