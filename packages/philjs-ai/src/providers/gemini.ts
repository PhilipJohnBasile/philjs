/**
 * Google Gemini provider implementation
 */

import type { AIProvider, CompletionOptions, ProviderResponse } from '../types.js';

export interface GeminiConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        functionCall?: {
          name: string;
          args: Record<string, unknown>;
        };
      }>;
    };
    finishReason?: string;
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  error?: {
    message?: string;
    code?: number;
  };
}

interface GeminiStreamChunk {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        functionCall?: {
          name: string;
          args: Record<string, unknown>;
        };
      }>;
    };
  }>;
}

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  private apiKey: string;
  private baseURL: string;
  private defaultModel: string;

  constructor(config: GeminiConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://generativelanguage.googleapis.com/v1beta';
    this.defaultModel = config.defaultModel || 'gemini-1.5-pro';
  }

  async generateCompletion(prompt: string, options?: CompletionOptions): Promise<ProviderResponse> {
    const model = options?.model || this.defaultModel;
    const url = `${this.baseURL}/models/${model}:generateContent?key=${this.apiKey}`;

    const requestBody: Record<string, unknown> = {
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

    const data = await response.json() as GeminiResponse;

    if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message}`);
    }

    // Extract text content
    const parts = data.candidates?.[0]?.content?.parts || [];
    const textParts = parts.filter(p => p.text).map(p => p.text!);
    const text = textParts.join('');

    // Extract function/tool calls
    const functionCalls = parts
      .filter(p => p.functionCall)
      .map((p, i) => ({
        id: `call_${i}`,
        name: p.functionCall!.name,
        arguments: p.functionCall!.args,
      }));

    // Extract usage metadata
    const usage = data.usageMetadata ? {
      inputTokens: data.usageMetadata.promptTokenCount || 0,
      outputTokens: data.usageMetadata.candidatesTokenCount || 0,
      totalTokens: data.usageMetadata.totalTokenCount || 0,
    } : {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    };

    return {
      content: text,
      ...(functionCalls.length > 0 && { toolCalls: functionCalls }),
      usage,
    };
  }

  async *generateStreamCompletion(prompt: string, options?: CompletionOptions): AsyncIterableIterator<string> {
    const model = options?.model || this.defaultModel;
    const url = `${this.baseURL}/models/${model}:streamGenerateContent?key=${this.apiKey}&alt=sse`;

    const requestBody: Record<string, unknown> = {
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
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as GeminiStreamChunk;
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                yield text;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

/**
 * Create a Gemini provider instance
 */
export function createGeminiProvider(config: GeminiConfig): GeminiProvider {
  return new GeminiProvider(config);
}
