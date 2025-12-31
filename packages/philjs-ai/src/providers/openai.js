/**
 * OpenAI provider implementation
 */
import OpenAI from 'openai';
export class OpenAIProvider {
    name = 'openai';
    client;
    defaultModel;
    constructor(config) {
        this.client = new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseURL,
            organization: config.organization,
        });
        this.defaultModel = config.defaultModel || 'gpt-4-turbo-preview';
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
}
/**
 * Create an OpenAI provider instance
 */
export function createOpenAIProvider(config) {
    return new OpenAIProvider(config);
}
//# sourceMappingURL=openai.js.map