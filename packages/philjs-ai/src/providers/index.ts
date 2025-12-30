/**
 * AI Providers Module
 *
 * Provider implementations for different AI services
 */

export * from './openai.js';
export * from './anthropic.js';
export * from './local.js';
export * from './gemini.js';
export * from './cohere.js';
export * from './lmstudio.js';

import type { AIProvider } from '../types.js';
import { OpenAIProvider, type OpenAIConfig } from './openai.js';
import { AnthropicProvider, type AnthropicConfig } from './anthropic.js';
import { LocalProvider, type LocalConfig } from './local.js';
import { GeminiProvider, type GeminiConfig } from './gemini.js';
import { CohereProvider, type CohereConfig } from './cohere.js';
import { LMStudioProvider, type LMStudioConfig } from './lmstudio.js';

/**
 * Provider configuration type
 */
export type ProviderConfig =
  | { type: 'openai'; config: OpenAIConfig }
  | { type: 'anthropic'; config: AnthropicConfig }
  | { type: 'local'; config?: LocalConfig }
  | { type: 'gemini'; config: GeminiConfig }
  | { type: 'cohere'; config: CohereConfig }
  | { type: 'lmstudio'; config?: LMStudioConfig };

/**
 * Create a provider from configuration
 */
export function createProvider(providerConfig: ProviderConfig): AIProvider {
  switch (providerConfig.type) {
    case 'openai':
      return new OpenAIProvider(providerConfig.config);
    case 'anthropic':
      return new AnthropicProvider(providerConfig.config);
    case 'local':
      return new LocalProvider(providerConfig.config);
    case 'gemini':
      return new GeminiProvider(providerConfig.config);
    case 'cohere':
      return new CohereProvider(providerConfig.config);
    case 'lmstudio':
      return new LMStudioProvider(providerConfig.config);
    default:
      throw new Error(`Unknown provider type: ${(providerConfig as ProviderConfig).type}`);
  }
}

/**
 * Auto-detect provider from environment variables
 */
export function autoDetectProvider(): AIProvider {
  // Check for OpenAI
  const openaiKey = process.env['OPENAI_API_KEY'];
  if (openaiKey) {
    return new OpenAIProvider({ apiKey: openaiKey });
  }

  // Check for Anthropic
  const anthropicKey = process.env['ANTHROPIC_API_KEY'];
  if (anthropicKey) {
    return new AnthropicProvider({ apiKey: anthropicKey });
  }

  // Check for Gemini
  const geminiKey = process.env['GEMINI_API_KEY'] || process.env['GOOGLE_AI_API_KEY'];
  if (geminiKey) {
    return new GeminiProvider({ apiKey: geminiKey });
  }

  // Check for Cohere
  const cohereKey = process.env['COHERE_API_KEY'];
  if (cohereKey) {
    return new CohereProvider({ apiKey: cohereKey });
  }

  // Check for LM Studio
  const lmstudioUrl = process.env['LMSTUDIO_URL'];
  if (lmstudioUrl) {
    return new LMStudioProvider({ baseURL: lmstudioUrl });
  }

  // Fall back to local (Ollama)
  const ollamaUrl = process.env['OLLAMA_URL'] || 'http://localhost:11434';
  return new LocalProvider({ baseURL: ollamaUrl });
}

/**
 * Provider registry for managing multiple providers
 */
export class ProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();
  private defaultProvider: string | null = null;

  /**
   * Register a provider
   */
  register(name: string, provider: AIProvider, isDefault: boolean = false): void {
    this.providers.set(name, provider);
    if (isDefault || this.providers.size === 1) {
      this.defaultProvider = name;
    }
  }

  /**
   * Get a provider by name
   */
  get(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get the default provider
   */
  getDefault(): AIProvider {
    if (!this.defaultProvider) {
      throw new Error('No default provider registered');
    }
    const provider = this.providers.get(this.defaultProvider);
    if (!provider) {
      throw new Error(`Default provider "${this.defaultProvider}" not found`);
    }
    return provider;
  }

  /**
   * Set the default provider
   */
  setDefault(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Provider "${name}" not found`);
    }
    this.defaultProvider = name;
  }

  /**
   * List all registered providers
   */
  list(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Remove a provider
   */
  remove(name: string): boolean {
    if (this.defaultProvider === name) {
      this.defaultProvider = null;
    }
    return this.providers.delete(name);
  }

  /**
   * Clear all providers
   */
  clear(): void {
    this.providers.clear();
    this.defaultProvider = null;
  }
}

/**
 * Global provider registry instance
 */
export const providerRegistry = new ProviderRegistry();
