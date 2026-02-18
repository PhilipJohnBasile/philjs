/**
 * Vision Language Model (VLM) Provider Abstractions
 */

export interface VLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | VLMContent[];
}

export interface VLMContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'auto' | 'low' | 'high';
  };
}

export interface VLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: 'stop' | 'length' | 'content_filter';
}

export interface VLMProvider {
  name: string;
  analyze(image: string, prompt: string, options?: VLMOptions): Promise<VLMResponse>;
  analyzeMultiple(images: string[], prompt: string, options?: VLMOptions): Promise<VLMResponse>;
}

export interface VLMOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * OpenAI Vision Provider (GPT-4o, GPT-4 Vision)
 */
export class OpenAIProvider implements VLMProvider {
  readonly name = 'openai';
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(apiKey: string, model = 'gpt-4o', baseUrl = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }

  async analyze(image: string, prompt: string, options: VLMOptions = {}): Promise<VLMResponse> {
    return this.analyzeMultiple([image], prompt, options);
  }

  async analyzeMultiple(images: string[], prompt: string, options: VLMOptions = {}): Promise<VLMResponse> {
    const content: VLMContent[] = images.map((img) => ({
      type: 'image_url' as const,
      image_url: {
        url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`,
        detail: 'high' as const,
      },
    }));

    content.push({ type: 'text', text: prompt });

    const messages: VLMMessage[] = [];
    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        max_tokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${error}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string }; finish_reason: string }>;
      usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      model: string;
    };

    return {
      content: data.choices[0]?.message.content ?? '',
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      },
      model: data.model,
      finishReason: data.choices[0]?.finish_reason as VLMResponse['finishReason'],
    };
  }
}

/**
 * Anthropic Vision Provider (Claude 3.5 Sonnet, Claude 3 Opus)
 */
export class AnthropicProvider implements VLMProvider {
  readonly name = 'anthropic';
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(apiKey: string, model = 'claude-sonnet-4-20250514', baseUrl = 'https://api.anthropic.com/v1') {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
  }

  async analyze(image: string, prompt: string, options: VLMOptions = {}): Promise<VLMResponse> {
    return this.analyzeMultiple([image], prompt, options);
  }

  async analyzeMultiple(images: string[], prompt: string, options: VLMOptions = {}): Promise<VLMResponse> {
    const content: Array<{ type: string; source?: object; text?: string }> = images.map((img) => {
      const base64 = img.startsWith('data:') ? img.split(',')[1] : img;
      const mediaType = img.startsWith('data:') ? img.split(';')[0]?.split(':')[1] : 'image/jpeg';

      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType ?? 'image/jpeg',
          data: base64,
        },
      };
    });

    content.push({ type: 'text', text: prompt });

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options.maxTokens ?? 4096,
        system: options.systemPrompt,
        messages: [{ role: 'user', content }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${error}`);
    }

    const data = await response.json() as {
      content: Array<{ type: string; text: string }>;
      usage: { input_tokens: number; output_tokens: number };
      model: string;
      stop_reason: string;
    };

    const textContent = data.content.find((c) => c.type === 'text');

    return {
      content: textContent?.text ?? '',
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      },
      model: data.model,
      finishReason: data.stop_reason === 'end_turn' ? 'stop' : undefined,
    };
  }
}

/**
 * Google Gemini Vision Provider
 */
export class GeminiProvider implements VLMProvider {
  readonly name = 'gemini';
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model = 'gemini-1.5-pro') {
    this.apiKey = apiKey;
    this.model = model;
  }

  async analyze(image: string, prompt: string, options: VLMOptions = {}): Promise<VLMResponse> {
    return this.analyzeMultiple([image], prompt, options);
  }

  async analyzeMultiple(images: string[], prompt: string, options: VLMOptions = {}): Promise<VLMResponse> {
    const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [];

    if (options.systemPrompt) {
      parts.push({ text: options.systemPrompt });
    }

    for (const img of images) {
      const base64 = img.startsWith('data:') ? img.split(',')[1] : img;
      const mimeType = img.startsWith('data:') ? img.split(';')[0]?.split(':')[1] : 'image/jpeg';

      parts.push({
        inline_data: {
          mime_type: mimeType ?? 'image/jpeg',
          data: base64 ?? '',
        },
      });
    }

    parts.push({ text: prompt });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          maxOutputTokens: options.maxTokens ?? 4096,
          temperature: options.temperature ?? 0.7,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} ${error}`);
    }

    const data = await response.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> }; finishReason: string }>;
      usageMetadata: { promptTokenCount: number; candidatesTokenCount: number; totalTokenCount: number };
    };

    return {
      content: data.candidates[0]?.content.parts[0]?.text ?? '',
      usage: {
        promptTokens: data.usageMetadata.promptTokenCount,
        completionTokens: data.usageMetadata.candidatesTokenCount,
        totalTokens: data.usageMetadata.totalTokenCount,
      },
      model: this.model,
      finishReason: data.candidates[0]?.finishReason === 'STOP' ? 'stop' : undefined,
    };
  }
}

/**
 * Create a provider based on configuration
 */
export function createProvider(
  provider: 'openai' | 'anthropic' | 'gemini',
  apiKey: string,
  model?: string
): VLMProvider {
  switch (provider) {
    case 'openai':
      return new OpenAIProvider(apiKey, model);
    case 'anthropic':
      return new AnthropicProvider(apiKey, model);
    case 'gemini':
      return new GeminiProvider(apiKey, model);
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
