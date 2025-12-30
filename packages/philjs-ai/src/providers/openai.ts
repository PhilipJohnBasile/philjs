/**
 * OpenAI provider implementation
 */

import OpenAI from 'openai';
import type { AIProvider, CompletionOptions } from '../types.js';

export interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
  defaultModel?: string;
}

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI;
  private defaultModel: string;

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      organization: config.organization,
    });
    this.defaultModel = config.defaultModel || 'gpt-4-turbo-preview';
  }

  async generateCompletion(prompt: string, options?: CompletionOptions): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

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

  async *generateStreamCompletion(prompt: string, options?: CompletionOptions): AsyncIterableIterator<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

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
export function createOpenAIProvider(config: OpenAIConfig): OpenAIProvider {
  return new OpenAIProvider(config);
}
