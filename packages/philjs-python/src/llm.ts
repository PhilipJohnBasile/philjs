/**
 * LLM Integration for PhilJS Python
 *
 * Full-featured TypeScript client for LLM operations via Python backend.
 * Supports OpenAI and Anthropic models with streaming, tool calling,
 * and automatic provider detection.
 */

import type { LLMConfig, ChatRequest, ChatResponse, ChatMessage, LLMTool } from './types.js';

/**
 * Stream chunk from SSE response
 */
export interface StreamChunk {
  id: string;
  model: string;
  content: string | null;
  finishReason: string | null;
  toolCalls?: Array<{
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

/**
 * Provider detection utility
 */
export function detectProvider(model: string): 'openai' | 'anthropic' {
  const modelLower = model.toLowerCase();

  if (modelLower.startsWith('gpt-') || modelLower.startsWith('o1') || modelLower.startsWith('o3')) {
    return 'openai';
  }
  if (modelLower.startsWith('claude')) {
    return 'anthropic';
  }
  if (modelLower.startsWith('text-')) {
    return 'openai';
  }

  // Default to OpenAI
  return 'openai';
}

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
   * Get the detected or configured provider for a model
   */
  getProvider(model?: string): string {
    if (this.config.provider && this.config.provider !== 'local') {
      return this.config.provider;
    }
    return detectProvider(model || this.config.model);
  }

  /**
   * Send a chat completion request
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model || this.config.model;
    const provider = this.getProvider(model);

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? this.config.temperature,
        max_tokens: request.maxTokens ?? this.config.maxTokens,
        stream: false,
        tools: request.tools,
        tool_choice: request.toolChoice,
        provider,
      }),
      signal: AbortSignal.timeout(this.config.timeout!),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM request failed: ${error}`);
    }

    const data = await response.json();

    // Normalize response format
    return {
      id: data.id,
      model: data.model,
      choices: data.choices.map((c: Record<string, unknown>) => ({
        index: c['index'] as number,
        message: c['message'] as ChatMessage,
        finishReason: (c['finish_reason'] || c['finishReason']) as ChatResponse['choices'][0]['finishReason'],
      })),
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? data.usage?.promptTokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? data.usage?.completionTokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? data.usage?.totalTokens ?? 0,
      },
    };
  }

  /**
   * Stream a chat completion - yields content chunks
   */
  async *stream(request: ChatRequest): AsyncGenerator<string, void, unknown> {
    for await (const chunk of this.streamChunks(request)) {
      if (chunk.content) {
        yield chunk.content;
      }
    }
  }

  /**
   * Stream a chat completion - yields full chunk objects
   */
  async *streamChunks(request: ChatRequest): AsyncGenerator<StreamChunk, void, unknown> {
    const model = request.model || this.config.model;
    const provider = this.getProvider(model);

    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? this.config.temperature,
        max_tokens: request.maxTokens ?? this.config.maxTokens,
        stream: true,
        tools: request.tools,
        tool_choice: request.toolChoice,
        provider,
      }),
      signal: AbortSignal.timeout(this.config.timeout!),
    });

    if (!response.ok || !response.body) {
      const error = response.ok ? 'No response body' : await response.text();
      throw new Error(`Stream request failed: ${error}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;

        const data = line.slice(6).trim();
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);

          // Check for error
          if (parsed.error) {
            throw new Error(parsed.error);
          }

          const choice = parsed.choices?.[0];
          if (!choice) continue;

          yield {
            id: parsed.id || '',
            model: parsed.model || model,
            content: choice.delta?.content || null,
            finishReason: choice.finish_reason || null,
            toolCalls: choice.delta?.tool_calls,
          };
        } catch (e) {
          // Only throw if it's an actual error, not a parse error from incomplete chunk
          if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
            throw e;
          }
        }
      }
    }

    // Process any remaining buffer
    if (buffer.startsWith('data: ')) {
      const data = buffer.slice(6).trim();
      if (data && data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data);
          const choice = parsed.choices?.[0];
          if (choice) {
            yield {
              id: parsed.id || '',
              model: parsed.model || model,
              content: choice.delta?.content || null,
              finishReason: choice.finish_reason || null,
              toolCalls: choice.delta?.tool_calls,
            };
          }
        } catch {
          // Ignore incomplete final chunk
        }
      }
    }
  }

  /**
   * Collect full streamed response
   */
  async streamToString(request: ChatRequest): Promise<string> {
    const chunks: string[] = [];
    for await (const chunk of this.stream(request)) {
      chunks.push(chunk);
    }
    return chunks.join('');
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

  /**
   * Multi-turn conversation helper
   */
  async converse(
    messages: ChatMessage[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<{ response: string; messages: ChatMessage[] }> {
    const request: ChatRequest = {
      model: this.config.model,
      messages,
    };
    if (options?.temperature !== undefined) request.temperature = options.temperature;
    if (options?.maxTokens !== undefined) request.maxTokens = options.maxTokens;
    const response = await this.chat(request);

    const assistantMessage = response.choices[0]?.message;
    if (!assistantMessage) {
      throw new Error('No response from model');
    }

    return {
      response: assistantMessage.content || '',
      messages: [...messages, assistantMessage],
    };
  }

  /**
   * Chat with tool/function calling
   */
  async chatWithTools(
    messages: ChatMessage[],
    tools: LLMTool[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      toolChoice?: ChatRequest['toolChoice'];
    }
  ): Promise<ChatResponse> {
    const request: ChatRequest = {
      model: this.config.model,
      messages,
      tools,
      toolChoice: options?.toolChoice ?? 'auto',
    };
    if (options?.temperature !== undefined) request.temperature = options.temperature;
    if (options?.maxTokens !== undefined) request.maxTokens = options.maxTokens;
    return this.chat(request);
  }

  /**
   * Execute a tool call and continue conversation
   */
  async executeToolAndContinue(
    messages: ChatMessage[],
    tools: LLMTool[],
    toolExecutor: (name: string, args: Record<string, unknown>) => Promise<unknown>
  ): Promise<{ response: string; messages: ChatMessage[] }> {
    const response = await this.chatWithTools(messages, tools);
    const assistantMessage = response.choices[0]?.message;

    if (!assistantMessage) {
      throw new Error('No response from model');
    }

    const updatedMessages = [...messages, assistantMessage];

    // Check for tool calls
    if (assistantMessage.functionCall) {
      const { name, arguments: argsStr } = assistantMessage.functionCall;
      const args = JSON.parse(argsStr);
      const result = await toolExecutor(name, args);

      // Add tool result to messages
      const toolResultMessage: ChatMessage = {
        role: 'function',
        name,
        content: JSON.stringify(result),
      };
      updatedMessages.push(toolResultMessage);

      // Get final response
      const finalResponse = await this.chat({
        model: this.config.model,
        messages: updatedMessages,
      });

      const finalMessage = finalResponse.choices[0]?.message;
      if (finalMessage) {
        updatedMessages.push(finalMessage);
      }

      return {
        response: finalMessage?.content || '',
        messages: updatedMessages,
      };
    }

    return {
      response: assistantMessage.content || '',
      messages: updatedMessages,
    };
  }

  /**
   * Check server health and available providers
   */
  async checkHealth(): Promise<{ status: string; providers: Record<string, boolean> }> {
    const response = await fetch(`${this.baseUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error('Health check failed');
    }

    return response.json();
  }
}

/**
 * Create a configured LLM client
 */
export function createLLM(config: LLMConfig): LLM {
  return new LLM(config);
}

/**
 * Create an OpenAI-configured LLM client
 */
export function createOpenAI(options?: {
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}): LLM {
  const config: LLMConfig = {
    provider: 'openai',
    model: options?.model || 'gpt-4-turbo-preview',
    baseUrl: options?.baseUrl || 'http://localhost:8000',
  };
  const apiKey = options?.apiKey || process.env['OPENAI_API_KEY'];
  if (apiKey !== undefined) config.apiKey = apiKey;
  if (options?.temperature !== undefined) config.temperature = options.temperature;
  if (options?.maxTokens !== undefined) config.maxTokens = options.maxTokens;
  return new LLM(config);
}

/**
 * Create an Anthropic-configured LLM client
 */
export function createAnthropic(options?: {
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}): LLM {
  const config: LLMConfig = {
    provider: 'anthropic',
    model: options?.model || 'claude-3-5-sonnet-20241022',
    baseUrl: options?.baseUrl || 'http://localhost:8000',
  };
  const apiKey = options?.apiKey || process.env['ANTHROPIC_API_KEY'];
  if (apiKey !== undefined) config.apiKey = apiKey;
  if (options?.temperature !== undefined) config.temperature = options.temperature;
  if (options?.maxTokens !== undefined) config.maxTokens = options.maxTokens;
  return new LLM(config);
}

/**
 * Default LLM instance using environment variables
 */
const defaultConfig: LLMConfig = {
  provider: 'openai',
  model: process.env['PHILJS_LLM_MODEL'] || 'gpt-4-turbo-preview',
  baseUrl: process.env['PHILJS_LLM_URL'] || 'http://localhost:8000',
};
const defaultApiKey = process.env['OPENAI_API_KEY'];
if (defaultApiKey !== undefined) defaultConfig.apiKey = defaultApiKey;
export const llm = new LLM(defaultConfig);
