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
export class OpenAIProvider {
    name = 'openai';
    client;
    defaultModel;
    embeddingModel;
    constructor(config) {
        this.client = new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseURL,
            organization: config.organization,
        });
        this.defaultModel = config.defaultModel || 'gpt-4o';
        this.embeddingModel = config.embeddingModel || 'text-embedding-3-small';
    }
    async generateCompletion(prompt, options) {
        const messages = [];
        if (options?.systemPrompt) {
            messages.push({
                role: 'system',
                content: options.systemPrompt,
            });
        }
        messages.push({
            role: 'user',
            content: prompt,
        });
        const response = await this.client.chat.completions.create({
            model: options?.model || this.defaultModel,
            messages,
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 4096,
            ...(options?.stopSequences && { stop: options.stopSequences }),
        });
        return response.choices[0]?.message?.content || '';
    }
    async *generateStreamCompletion(prompt, options) {
        const messages = [];
        if (options?.systemPrompt) {
            messages.push({
                role: 'system',
                content: options.systemPrompt,
            });
        }
        messages.push({
            role: 'user',
            content: prompt,
        });
        const stream = await this.client.chat.completions.create({
            model: options?.model || this.defaultModel,
            messages,
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 4096,
            ...(options?.stopSequences && { stop: options.stopSequences }),
            stream: true,
        });
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
                yield content;
            }
        }
    }
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
    async analyzeImage(image, prompt, options) {
        const imageContent = await this.formatImageContent(image, options?.detail);
        const additionalImages = options?.additionalImages
            ? await Promise.all(options.additionalImages.map(img => this.formatImageContent(img, options?.detail)))
            : [];
        const content = [
            imageContent,
            ...additionalImages,
            { type: 'text', text: prompt },
        ];
        const messages = [];
        if (options?.systemPrompt) {
            messages.push({
                role: 'system',
                content: options.systemPrompt,
            });
        }
        messages.push({
            role: 'user',
            content,
        });
        const response = await this.client.chat.completions.create({
            model: options?.model || 'gpt-4o',
            messages,
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 4096,
        });
        const textContent = response.choices[0]?.message?.content || '';
        return {
            content: textContent,
            usage: {
                inputTokens: response.usage?.prompt_tokens || 0,
                outputTokens: response.usage?.completion_tokens || 0,
                totalTokens: response.usage?.total_tokens || 0,
            },
        };
    }
    /**
     * Format image input for OpenAI Vision API
     */
    async formatImageContent(image, detail = 'auto') {
        if (image.type === 'url') {
            return {
                type: 'image_url',
                image_url: {
                    url: image.url,
                    detail,
                },
            };
        }
        else if (image.type === 'base64') {
            return {
                type: 'image_url',
                image_url: {
                    url: `data:${image.mediaType};base64,${image.data}`,
                    detail,
                },
            };
        }
        else if (image.type === 'file') {
            // Read file and convert to base64
            const fs = await import('fs/promises');
            const buffer = await fs.readFile(image.path);
            const base64 = buffer.toString('base64');
            const ext = image.path.split('.').pop()?.toLowerCase();
            const mediaType = ext === 'png' ? 'image/png'
                : ext === 'gif' ? 'image/gif'
                    : ext === 'webp' ? 'image/webp'
                        : 'image/jpeg';
            return {
                type: 'image_url',
                image_url: {
                    url: `data:${mediaType};base64,${base64}`,
                    detail,
                },
            };
        }
        throw new Error(`Unsupported image input type: ${image.type}`);
    }
    /**
     * Generate embeddings for text
     *
     * @example
     * ```typescript
     * const embeddings = await provider.embed(['Hello world', 'How are you?']);
     * console.log(embeddings[0].length); // 1536 for text-embedding-3-small
     * ```
     */
    async embed(texts) {
        const response = await this.client.embeddings.create({
            model: this.embeddingModel,
            input: texts,
        });
        return response.data.map(item => item.embedding);
    }
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
    async generateJSON(prompt, schema, options) {
        const systemPrompt = schema
            ? `You are a data extraction assistant. Extract information and return it as JSON matching this schema: ${JSON.stringify(schema)}. Only return valid JSON, no additional text.`
            : 'You are a helpful assistant. Return your response as valid JSON only.';
        const response = await this.client.chat.completions.create({
            model: options?.model || this.defaultModel,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt },
            ],
            temperature: options?.temperature ?? 0.1,
            max_tokens: options?.maxTokens ?? 4096,
            response_format: { type: 'json_object' },
        });
        const content = response.choices[0]?.message?.content || '{}';
        return JSON.parse(content);
    }
    /**
     * Analyze multiple images together
     */
    async compareImages(images, prompt, options) {
        if (images.length === 0) {
            throw new Error('At least one image is required');
        }
        const [firstImage, ...rest] = images;
        return this.analyzeImage(firstImage, prompt, {
            ...options,
            additionalImages: rest,
        });
    }
    /**
     * Extract structured data from an image
     */
    async extractFromImage(image, extractionPrompt, options) {
        const result = await this.analyzeImage(image, extractionPrompt, {
            ...options,
            systemPrompt: 'Extract the requested information and return it as valid JSON only. No additional text or markdown.',
            temperature: 0.1,
        });
        try {
            return JSON.parse(result.content);
        }
        catch {
            throw new Error(`Failed to parse extraction result as JSON: ${result.content}`);
        }
    }
    /**
     * Get the underlying OpenAI client for advanced usage
     */
    getClient() {
        return this.client;
    }
}
/**
 * Create an OpenAI provider instance
 */
export function createOpenAIProvider(config) {
    return new OpenAIProvider(config);
}
//# sourceMappingURL=openai.js.map