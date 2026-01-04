/**
 * Anthropic (Claude) provider implementation
 *
 * Supports:
 * - Text generation (completion and streaming)
 * - Vision (image analysis with Claude 3+)
 * - Prompt caching for reduced latency
 */
import type { AIProvider, CompletionOptions, ImageInput, VisionOptions, VisionResult } from '../types.js';
export interface AnthropicConfig {
    apiKey: string;
    baseURL?: string;
    defaultModel?: string;
    /** Enable prompt caching (beta) */
    enableCaching?: boolean;
}
export declare class AnthropicProvider implements AIProvider {
    name: string;
    private client;
    private defaultModel;
    private enableCaching;
    constructor(config: AnthropicConfig);
    generateCompletion(prompt: string, options?: CompletionOptions): Promise<string>;
    generateStreamCompletion(prompt: string, options?: CompletionOptions): AsyncIterableIterator<string>;
    /**
     * Analyze images using Claude's vision capabilities
     *
     * @example
     * ```typescript
     * const result = await provider.analyzeImage(
     *   { type: 'url', url: 'https://example.com/image.jpg' },
     *   'Describe what you see in this image'
     * );
     * console.log(result.content);
     * ```
     */
    analyzeImage(image: ImageInput, prompt: string, options?: VisionOptions): Promise<VisionResult>;
    /**
     * Format image input for Claude API
     */
    private formatImageContent;
    /**
     * Generate embeddings (not natively supported by Anthropic)
     * Use a third-party embedding model or fallback
     */
    embed(_texts: string[]): Promise<number[][]>;
    /**
     * Analyze multiple images in a single request
     *
     * @example
     * ```typescript
     * const result = await provider.compareImages(
     *   [image1, image2],
     *   'What are the differences between these images?'
     * );
     * ```
     */
    compareImages(images: ImageInput[], prompt: string, options?: VisionOptions): Promise<VisionResult>;
    /**
     * Extract structured data from an image
     *
     * @example
     * ```typescript
     * const data = await provider.extractFromImage(
     *   receiptImage,
     *   'Extract: total, date, items[]',
     *   { model: 'claude-sonnet-4-20250514' }
     * );
     * ```
     */
    extractFromImage<T = Record<string, unknown>>(image: ImageInput, extractionPrompt: string, options?: VisionOptions): Promise<T>;
}
/**
 * Create an Anthropic provider instance
 */
export declare function createAnthropicProvider(config: AnthropicConfig): AnthropicProvider;
//# sourceMappingURL=anthropic.d.ts.map