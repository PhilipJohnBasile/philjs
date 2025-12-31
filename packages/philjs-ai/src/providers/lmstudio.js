/**
 * LM Studio provider implementation (OpenAI-compatible local models)
 */
export class LMStudioProvider {
    name = 'lmstudio';
    baseURL;
    defaultModel;
    constructor(config = {}) {
        this.baseURL = config.baseURL || 'http://localhost:1234/v1';
        this.defaultModel = config.defaultModel || 'local-model';
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
        const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: options?.model || this.defaultModel,
                messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 4096,
                stop: options?.stopSequences,
                stream: false,
            }),
        });
        if (!response.ok) {
            throw new Error(`LM Studio API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.choices[0]?.message?.content || '';
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
        const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: options?.model || this.defaultModel,
                messages,
                temperature: options?.temperature ?? 0.7,
                max_tokens: options?.maxTokens ?? 4096,
                stop: options?.stopSequences,
                stream: true,
            }),
        });
        if (!response.ok) {
            throw new Error(`LM Studio API error: ${response.statusText}`);
        }
        if (!response.body) {
            throw new Error('Response body is null');
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim());
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]')
                            continue;
                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices[0]?.delta?.content;
                            if (content) {
                                yield content;
                            }
                        }
                        catch {
                            // Skip invalid JSON
                        }
                    }
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
}
/**
 * Create an LM Studio provider instance
 */
export function createLMStudioProvider(config) {
    return new LMStudioProvider(config);
}
//# sourceMappingURL=lmstudio.js.map