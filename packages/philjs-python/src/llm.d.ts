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
export declare function detectProvider(model: string): 'openai' | 'anthropic';
/**
 * LLM client for interacting with language models via Python backend
 */
export declare class LLM {
    private config;
    private baseUrl;
    constructor(config: LLMConfig);
    /**
     * Get the detected or configured provider for a model
     */
    getProvider(model?: string): string;
    /**
     * Send a chat completion request
     */
    chat(request: ChatRequest): Promise<ChatResponse>;
    /**
     * Stream a chat completion - yields content chunks
     */
    stream(request: ChatRequest): AsyncGenerator<string, void, unknown>;
    /**
     * Stream a chat completion - yields full chunk objects
     */
    streamChunks(request: ChatRequest): AsyncGenerator<StreamChunk, void, unknown>;
    /**
     * Collect full streamed response
     */
    streamToString(request: ChatRequest): Promise<string>;
    /**
     * Simple completion helper
     */
    complete(prompt: string): Promise<string>;
    /**
     * Generate with system prompt
     */
    generate(systemPrompt: string, userPrompt: string): Promise<string>;
    /**
     * Multi-turn conversation helper
     */
    converse(messages: ChatMessage[], options?: {
        temperature?: number;
        maxTokens?: number;
    }): Promise<{
        response: string;
        messages: ChatMessage[];
    }>;
    /**
     * Chat with tool/function calling
     */
    chatWithTools(messages: ChatMessage[], tools: LLMTool[], options?: {
        temperature?: number;
        maxTokens?: number;
        toolChoice?: ChatRequest['toolChoice'];
    }): Promise<ChatResponse>;
    /**
     * Execute a tool call and continue conversation
     */
    executeToolAndContinue(messages: ChatMessage[], tools: LLMTool[], toolExecutor: (name: string, args: Record<string, unknown>) => Promise<unknown>): Promise<{
        response: string;
        messages: ChatMessage[];
    }>;
    /**
     * Check server health and available providers
     */
    checkHealth(): Promise<{
        status: string;
        providers: Record<string, boolean>;
    }>;
}
/**
 * Create a configured LLM client
 */
export declare function createLLM(config: LLMConfig): LLM;
/**
 * Create an OpenAI-configured LLM client
 */
export declare function createOpenAI(options?: {
    model?: string;
    apiKey?: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
}): LLM;
/**
 * Create an Anthropic-configured LLM client
 */
export declare function createAnthropic(options?: {
    model?: string;
    apiKey?: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
}): LLM;
export declare const llm: LLM;
//# sourceMappingURL=llm.d.ts.map