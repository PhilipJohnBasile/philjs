/**
 * Cohere provider implementation
 */
export class CohereProvider {
    name = 'cohere';
    apiKey;
    baseURL;
    defaultModel;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseURL = config.baseURL || 'https://api.cohere.com/v1';
        this.defaultModel = config.defaultModel || 'command-r-plus';
    }
    async generateCompletion(prompt, options) {
        const url = `${this.baseURL}/generate`;
        const requestBody = {
            model: options?.model || this.defaultModel,
            prompt: options?.systemPrompt
                ? `${options.systemPrompt}\n\n${prompt}`
                : prompt,
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 4096,
            stop_sequences: options?.stopSequences,
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'X-Client-Name': 'philjs-ai',
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Cohere API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        return data.text || '';
    }
    async *generateStreamCompletion(prompt, options) {
        const url = `${this.baseURL}/generate`;
        const requestBody = {
            model: options?.model || this.defaultModel,
            prompt: options?.systemPrompt
                ? `${options.systemPrompt}\n\n${prompt}`
                : prompt,
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 4096,
            stop_sequences: options?.stopSequences,
            stream: true,
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                'X-Client-Name': 'philjs-ai',
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            throw new Error(`Cohere API error: ${response.statusText}`);
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
                        if (data.event_type === 'text-generation' && data.text) {
                            yield data.text;
                        }
                    }
                    catch {
                        // Skip invalid JSON
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
 * Create a Cohere provider instance
 */
export function createCohereProvider(config) {
    return new CohereProvider(config);
}
//# sourceMappingURL=cohere.js.map