/**
 * LLM Integration for PhilJS Python
 */

import type { LLMConfig, ChatRequest, ChatResponse, ChatMessage } from './types.js';

/**
 * LLM client for interacting with language models via Python backend
 */
export class LLM {
  private config: LLMConfig;
  private baseUrl: string;

  constructor(config: LLMConfig) {
    this.config = {
      temperature: 0.7,
      maxTokens: 4096,
      timeout: 60000,
      ...config,
    };
    this.baseUrl = config.baseUrl || 'http://localhost:8000';
  }

  /**
   * Send a chat completion request
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify({
        model: request.model || this.config.model,
        messages: request.messages,
        temperature: request.temperature ?? this.config.temperature,
        max_tokens: request.maxTokens ?? this.config.maxTokens,
        stream: request.stream ?? false,
        tools: request.tools,
        tool_choice: request.toolChoice,
      }),
      signal: AbortSignal.timeout(this.config.timeout!),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM request failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Stream a chat completion
   */
  async *stream(request: ChatRequest): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify({
        ...request,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error('Stream request failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch {
          // Ignore parse errors for incomplete chunks
        }
      }
    }
  }

  /**
   * Simple completion helper
   */
  async complete(prompt: string): Promise<string> {
    const response = await this.chat({
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0]?.message?.content || '';
  }

  /**
   * Generate with system prompt
   */
  async generate(systemPrompt: string, userPrompt: string): Promise<string> {
    const response = await this.chat({
      model: this.config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    return response.choices[0]?.message?.content || '';
  }
}

/**
 * Create a configured LLM client
 */
export function createLLM(config: LLMConfig): LLM {
  return new LLM(config);
}

/**
 * Default LLM instance using environment variables
 */
export const llm = new LLM({
  provider: 'openai',
  model: process.env.PHILJS_LLM_MODEL || 'gpt-4-turbo-preview',
  apiKey: process.env.OPENAI_API_KEY,
  baseUrl: process.env.PHILJS_LLM_URL || 'http://localhost:8000',
});
