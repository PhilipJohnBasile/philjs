/**
 * Anthropic (Claude) provider implementation
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, CompletionOptions } from '../types.js';

export interface AnthropicConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
}

export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  private client: Anthropic;
  private defaultModel: string;

  constructor(config: AnthropicConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
    this.defaultModel = config.defaultModel || 'claude-3-5-sonnet-20241022';
  }

  async generateCompletion(prompt: string, options?: CompletionOptions): Promise<string> {
    const response = await this.client.messages.create({
      model: options?.model || this.defaultModel,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.7,
      system: options?.systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      stop_sequences: options?.stopSequences,
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  }

  async *generateStreamCompletion(prompt: string, options?: CompletionOptions): AsyncIterableIterator<string> {
    const stream = await this.client.messages.stream({
      model: options?.model || this.defaultModel,
      max_tokens: options?.maxTokens ?? 4096,
      temperature: options?.temperature ?? 0.7,
      system: options?.systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      stop_sequences: options?.stopSequences,
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
export function createAnthropicProvider(config: AnthropicConfig): AnthropicProvider {
  return new AnthropicProvider(config);
}
