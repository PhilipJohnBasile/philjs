/**
 * Cohere provider implementation
 */

import type { AIProvider, CompletionOptions, ProviderResponse } from '../types.js';

export interface CohereConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
}

interface CohereResponse {
  text?: string;
  generation_id?: string;
  finish_reason?: string;
  meta?: {
    tokens?: {
      input_tokens?: number;
      output_tokens?: number;
    };
    billed_units?: {
      input_tokens?: number;
      output_tokens?: number;
    };
  };
}

interface CohereStreamEvent {
  event_type: 'text-generation' | 'stream-start' | 'stream-end';
  text?: string;
}

export class CohereProvider implements AIProvider {
  name = 'cohere';
  private apiKey: string;
  private baseURL: string;
  private defaultModel: string;

  constructor(config: CohereConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.cohere.com/v1';
    this.defaultModel = config.defaultModel || 'command-r-plus';
  }

  async generateCompletion(prompt: string, options?: CompletionOptions): Promise<ProviderResponse> {
    const url = `${this.baseURL}/generate`;

    const requestBody: Record<string, unknown> = {
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

    const data = await response.json() as CohereResponse;

    // Extract token usage from Cohere response
    const inputTokens = data.meta?.tokens?.input_tokens
      ?? data.meta?.billed_units?.input_tokens
      ?? this.estimateTokens(prompt);
    const outputTokens = data.meta?.tokens?.output_tokens
      ?? data.meta?.billed_units?.output_tokens
      ?? this.estimateTokens(data.text || '');

    return {
      content: data.text || '',
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens
      }
    };
  }

  /** Estimate token count (~4 chars per token) */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  async *generateStreamCompletion(prompt: string, options?: CompletionOptions): AsyncIterableIterator<string> {
    const url = `${this.baseURL}/generate`;

    const requestBody: Record<string, unknown> = {
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
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line) as CohereStreamEvent;
            if (data.event_type === 'text-generation' && data.text) {
              yield data.text;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

/**
 * Create a Cohere provider instance
 */
export function createCohereProvider(config: CohereConfig): CohereProvider {
  return new CohereProvider(config);
}
