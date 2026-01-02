/**
 * Anthropic (Claude) provider implementation
 *
 * Supports:
 * - Text generation (completion and streaming)
 * - Vision (image analysis with Claude 3+)
 * - Prompt caching for reduced latency
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  AIProvider,
  CompletionOptions,
  ImageInput,
  VisionOptions,
  VisionResult,
} from '../types.js';

export interface AnthropicConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
  /** Enable prompt caching (beta) */
  enableCaching?: boolean;
}

type ImageMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  private client: Anthropic;
  private defaultModel: string;
  private enableCaching: boolean;

  constructor(config: AnthropicConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
    this.defaultModel = config.defaultModel || 'claude-sonnet-4-20250514';
    this.enableCaching = config.enableCaching ?? false;
  }

  async generateCompletion(prompt: string, options?: CompletionOptions): Promise<string> {
    const response = await this.client.messages.create({
      model: options?.model || this.defaultModel,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.7,
      ...(options?.systemPrompt && { system: options.systemPrompt }),
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      ...(options?.stopSequences && { stop_sequences: options.stopSequences }),
    });

    const content = response.content[0];
    if (content?.type === 'text') {
      return content.text;
    }
    return '';
  }

  async *generateStreamCompletion(prompt: string, options?: CompletionOptions): AsyncIterableIterator<string> {
    const stream = await this.client.messages.stream({
      model: options?.model || this.defaultModel,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.7,
      ...(options?.systemPrompt && { system: options.systemPrompt }),
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      ...(options?.stopSequences && { stop_sequences: options.stopSequences }),
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }

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
  async analyzeImage(
    image: ImageInput,
    prompt: string,
    options?: VisionOptions
  ): Promise<VisionResult> {
    const imageContent = await this.formatImageContent(image);
    const additionalImages = options?.additionalImages
      ? await Promise.all(options.additionalImages.map(img => this.formatImageContent(img)))
      : [];

    const content: Anthropic.MessageCreateParams['messages'][0]['content'] = [
      imageContent,
      ...additionalImages,
      { type: 'text', text: prompt },
    ];

    const response = await this.client.messages.create({
      model: options?.model || this.defaultModel,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.7,
      ...(options?.systemPrompt && { system: options.systemPrompt }),
      messages: [
        {
          role: 'user',
          content,
        },
      ],
    });

    const textContent = response.content.find(c => c.type === 'text');

    return {
      content: textContent?.type === 'text' ? textContent.text : '',
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  /**
   * Format image input for Claude API
   */
  private async formatImageContent(
    image: ImageInput
  ): Promise<Anthropic.ImageBlockParam> {
    if (image.type === 'url') {
      // Fetch the image and convert to base64
      const response = await fetch(image.url);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const contentType = response.headers.get('content-type') || 'image/jpeg';

      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: contentType as ImageMediaType,
          data: base64,
        },
      };
    } else if (image.type === 'base64') {
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: image.mediaType,
          data: image.data,
        },
      };
    } else if (image.type === 'file') {
      // Read file and convert to base64 (Node.js environment)
      const fs = await import('fs/promises');
      const buffer = await fs.readFile(image.path);
      const base64 = buffer.toString('base64');
      const ext = image.path.split('.').pop()?.toLowerCase();
      const mediaType = ext === 'png' ? 'image/png'
        : ext === 'gif' ? 'image/gif'
        : ext === 'webp' ? 'image/webp'
        : 'image/jpeg';

      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType as ImageMediaType,
          data: base64,
        },
      };
    }

    throw new Error(`Unsupported image input type: ${(image as ImageInput).type}`);
  }

  /**
   * Generate embeddings (not natively supported by Anthropic)
   * Use a third-party embedding model or fallback
   */
  async embed(_texts: string[]): Promise<number[][]> {
    throw new Error(
      'Anthropic does not provide embedding models. ' +
      'Use OpenAI, Cohere, or another provider for embeddings.'
    );
  }

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
  async compareImages(
    images: ImageInput[],
    prompt: string,
    options?: VisionOptions
  ): Promise<VisionResult> {
    if (images.length === 0) {
      throw new Error('At least one image is required');
    }

    const [firstImage, ...rest] = images;
    return this.analyzeImage(firstImage!, prompt, {
      ...options,
      additionalImages: rest,
    });
  }

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
  async extractFromImage<T = Record<string, unknown>>(
    image: ImageInput,
    extractionPrompt: string,
    options?: VisionOptions
  ): Promise<T> {
    const systemPrompt = `You are a data extraction assistant. Extract the requested information from the image and return it as valid JSON. Only return the JSON object, no additional text or markdown formatting.`;

    const result = await this.analyzeImage(image, extractionPrompt, {
      ...options,
      systemPrompt,
      temperature: 0.1, // Low temperature for deterministic extraction
    });

    try {
      return JSON.parse(result.content) as T;
    } catch {
      throw new Error(`Failed to parse extraction result as JSON: ${result.content}`);
    }
  }
}

/**
 * Create an Anthropic provider instance
 */
export function createAnthropicProvider(config: AnthropicConfig): AnthropicProvider {
  return new AnthropicProvider(config);
}
