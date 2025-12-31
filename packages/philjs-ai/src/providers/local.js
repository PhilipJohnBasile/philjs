/**
 * Local LLM provider (Ollama) implementation
 */
export class LocalProvider {
    name = 'local';
    baseURL;
    defaultModel;
    constructor(config = {}) {
        this.baseURL = config.baseURL || 'http://localhost:11434';
        this.defaultModel = config.defaultModel || 'codellama';
    }
    async generateCompletion(prompt, options) {
        const fullPrompt = options?.systemPrompt
            ? `${options.systemPrompt}\n\n${prompt}`
            : prompt;
        const response = await fetch(`${this.baseURL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: options?.model || this.defaultModel,
                prompt: fullPrompt,
                stream: false,
                options: {
                    temperature: options?.temperature ?? 0.7,
                    num_predict: options?.maxTokens ?? 4096,
                    stop: options?.stopSequences,
                },
            }),
        });
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.response || '';
    }
    async *generateStreamCompletion(prompt, options) {
        const fullPrompt = options?.systemPrompt
            ? `${options.systemPrompt}\n\n${prompt}`
            : prompt;
        const response = await fetch(`${this.baseURL}/api/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: options?.model || this.defaultModel,
                prompt: fullPrompt,
                stream: true,
                options: {
                    temperature: options?.temperature ?? 0.7,
                    num_predict: options?.maxTokens ?? 4096,
                    stop: options?.stopSequences,
                },
            }),
        });
        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`);
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
                    try {
                        const data = JSON.parse(line);
                        if (data.response) {
                            yield data.response;
                        }
                    }
                    catch {
                        // Skip invalid JSON lines
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
 * Create a local LLM provider instance
 */
export function createLocalProvider(config) {
    return new LocalProvider(config);
}
//# sourceMappingURL=local.js.map