/**
 * OpenAI provider implementation
 *
 * Supports:
 * - Text generation (GPT-4, GPT-4 Turbo, GPT-3.5)
 * - Vision (GPT-4V, GPT-4o)
 * - Embeddings (text-embedding-3-small, text-embedding-3-large)
 * - Structured output with JSON mode
 */
import OpenAI from 'openai';
import type { AIProvider, CompletionOptions, ImageInput, VisionOptions, VisionResult, ProviderResponse } from '../types.js';
export interface OpenAIConfig {
    apiKey: string;
    baseURL?: string;
    organization?: string;
    defaultModel?: string;
    embeddingModel?: string;
}
export declare class OpenAIProvider implements AIProvider {
    name: string;
    private client;
    private defaultModel;
    private embeddingModel;
    constructor(config: OpenAIConfig);
    generateCompletion(prompt: string, options?: CompletionOptions): Promise<ProviderResponse>;
    generateStreamCompletion(prompt: string, options?: CompletionOptions): AsyncIterableIterator<string>;
    /**
     * Analyze images using GPT-4V / GPT-4o vision capabilities
     *
     * @example
     * ```typescript
     * const result = await provider.analyzeImage(
     *   { type: 'url', url: 'https://example.com/image.jpg' },
     *   'What is in this image?'
     * );
     * console.log(result.content);
     * ```
     */
    analyzeImage(image: ImageInput, prompt: string, options?: VisionOptions): Promise<VisionResult>;
    /**
     * Format image input for OpenAI Vision API
     */
    private formatImageContent;
    /**
     * Generate embeddings for text
     *
     * @example
     * ```typescript
     * const embeddings = await provider.embed(['Hello world', 'How are you?']);
     * console.log(embeddings[0].length); // 1536 for text-embedding-3-small
     * ```
     */
    embed(texts: string[]): Promise<number[][]>;
    /**
     * Generate structured JSON output
     *
     * @example
     * ```typescript
     * const result = await provider.generateJSON<{ name: string; age: number }>(
     *   'Extract the person info: John is 30 years old',
     *   { name: 'string', age: 'number' }
     * );
     * console.log(result); // { name: 'John', age: 30 }
     * ```
     */
    generateJSON<T = Record<string, unknown>>(prompt: string, schema?: Record<string, unknown>, options?: CompletionOptions): Promise<T>;
    /**
     * Analyze multiple images together
     */
    compareImages(images: ImageInput[], prompt: string, options?: VisionOptions): Promise<VisionResult>;
    /**
     * Extract structured data from an image
     */
    extractFromImage<T = Record<string, unknown>>(image: ImageInput, extractionPrompt: string, options?: VisionOptions): Promise<T>;
    /**
     * Get the underlying OpenAI client for advanced usage
     */
    getClient(): OpenAI;
}
/**
 * Create an OpenAI provider instance
 */
export declare function createOpenAIProvider(config: OpenAIConfig): OpenAIProvider;
//# sourceMappingURL=openai.d.ts.map