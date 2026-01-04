/**
 * Google Gemini provider implementation
 */
export class GeminiProvider {
    name = 'gemini';
    apiKey;
    baseURL;
    defaultModel;
    constructor(config) {
        this.apiKey = config.apiKey;
        this.baseURL = config.baseURL || 'https://generativelanguage.googleapis.com/v1beta';
        this.defaultModel = config.defaultModel || 'gemini-1.5-pro';
    }
    async generateCompletion(prompt, options) {
        const model = options?.model || this.defaultModel;
        const url = `${this.baseURL}/models/${model}:generateContent?key=${this.apiKey}`;
        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: options?.systemPrompt
                                ? `${options.systemPrompt}\n\n${prompt}`
                                : prompt,
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: options?.temperature ?? 0.7,
                maxOutputTokens: options?.maxTokens ?? 4096,
                stopSequences: options?.stopSequences,
            },
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(`Gemini API error: ${data.error.message}`);
        }
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    async *generateStreamCompletion(prompt, options) {
        const model = options?.model || this.defaultModel;
        const url = `${this.baseURL}/models/${model}:streamGenerateContent?key=${this.apiKey}&alt=sse`;
        const requestBody = {
            contents: [
                {
                    parts: [
                        {
                            text: options?.systemPrompt
                                ? `${options.systemPrompt}\n\n${prompt}`
                                : prompt,
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: options?.temperature ?? 0.7,
                maxOutputTokens: options?.maxTokens ?? 4096,
                stopSequences: options?.stopSequences,
            },
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
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
                        try {
                            const data = JSON.parse(line.slice(6));
                            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (text) {
                                yield text;
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
 * Create a Gemini provider instance
 */
export function createGeminiProvider(config) {
    return new GeminiProvider(config);
}
//# sourceMappingURL=gemini.js.map