/**
 * Anthropic (Claude) provider implementation
 */
import Anthropic from '@anthropic-ai/sdk';
export class AnthropicProvider {
    name = 'anthropic';
    client;
    defaultModel;
    constructor(config) {
        this.client = new Anthropic({
            apiKey: config.apiKey,
            baseURL: config.baseURL,
        });
        this.defaultModel = config.defaultModel || 'claude-3-5-sonnet-20241022';
    }
    async generateCompletion(prompt, options) {
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
    async *generateStreamCompletion(prompt, options) {
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
}
/**
 * Create an Anthropic provider instance
 */
export function createAnthropicProvider(config) {
    return new AnthropicProvider(config);
}
//# sourceMappingURL=anthropic.js.map