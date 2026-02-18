/**
 * @philjs/ai - Cloudflare Workers AI Provider
 *
 * Native integration with Cloudflare Workers AI for edge-native AI inference.
 * Supports all Workers AI models including LLMs, embeddings, and image models.
 *
 * @example
 * ```ts
 * import { createWorkersAI, useWorkersAI } from '@philjs/ai/workers-ai';
 *
 * // In a Cloudflare Worker
 * export default {
 *   async fetch(request, env) {
 *     const ai = createWorkersAI(env.AI);
 *
 *     const response = await ai.chat({
 *       model: '@cf/meta/llama-2-7b-chat-int8',
 *       messages: [{ role: 'user', content: 'Hello!' }],
 *     });
 *
 *     return new Response(response.text);
 *   }
 * };
 * ```
 */
import { type Signal } from '@philjs/core';
export interface WorkersAIConfig {
    /** Cloudflare AI binding from environment */
    ai: Ai;
    /** Default model to use */
    defaultModel?: string;
    /** Enable streaming by default */
    streaming?: boolean;
    /** Custom fetch function for testing */
    fetch?: typeof globalThis.fetch;
}
export interface Ai {
    run(model: string, inputs: Record<string, any>): Promise<any>;
}
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface ChatOptions {
    /** Model ID (e.g., '@cf/meta/llama-2-7b-chat-int8') */
    model?: string;
    /** Chat messages */
    messages: ChatMessage[];
    /** Enable streaming */
    stream?: boolean;
    /** Maximum tokens to generate */
    max_tokens?: number;
    /** Temperature for sampling (0-2) */
    temperature?: number;
    /** Top-p sampling */
    top_p?: number;
    /** Top-k sampling */
    top_k?: number;
    /** Repetition penalty */
    repetition_penalty?: number;
    /** Frequency penalty */
    frequency_penalty?: number;
    /** Presence penalty */
    presence_penalty?: number;
    /** Random seed for reproducibility */
    seed?: number;
}
export interface ChatResponse {
    text: string;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
export interface EmbeddingOptions {
    /** Model ID for embeddings */
    model?: string;
    /** Text to embed */
    text: string | string[];
}
export interface EmbeddingResponse {
    vectors: number[][];
    shape: [number, number];
}
export interface ImageGenerationOptions {
    /** Model ID for image generation */
    model?: string;
    /** Text prompt for image generation */
    prompt: string;
    /** Negative prompt */
    negative_prompt?: string;
    /** Image width */
    width?: number;
    /** Image height */
    height?: number;
    /** Number of inference steps */
    num_steps?: number;
    /** Guidance scale */
    guidance?: number;
    /** Random seed */
    seed?: number;
}
export interface ImageClassificationOptions {
    /** Model ID for classification */
    model?: string;
    /** Image data as ArrayBuffer or Uint8Array */
    image: ArrayBuffer | Uint8Array;
}
export interface TextToSpeechOptions {
    /** Model ID for TTS */
    model?: string;
    /** Text to convert to speech */
    text: string;
    /** Voice ID */
    voice?: string;
}
export interface SpeechToTextOptions {
    /** Model ID for STT */
    model?: string;
    /** Audio data */
    audio: ArrayBuffer | Uint8Array;
    /** Source language */
    source_lang?: string;
}
export interface TranslationOptions {
    /** Model ID for translation */
    model?: string;
    /** Text to translate */
    text: string;
    /** Source language */
    source_lang: string;
    /** Target language */
    target_lang: string;
}
/**
 * Creates a Workers AI client
 */
export declare function createWorkersAI(ai: Ai, config?: Partial<WorkersAIConfig>): {
    chat: typeof chat;
    embed: typeof embed;
    generateImage: typeof generateImage;
    classifyImage: typeof classifyImage;
    textToSpeech: typeof textToSpeech;
    speechToText: typeof speechToText;
    translate: typeof translate;
    run: typeof runModel;
    isLoading: () => boolean;
    error: () => Error;
};
/**
 * React hook for Workers AI in components
 */
export declare function useWorkersAI(): {
    chat: typeof chat;
    embed: typeof embed;
    generateImage: typeof generateImage;
    classifyImage: typeof classifyImage;
    textToSpeech: typeof textToSpeech;
    speechToText: typeof speechToText;
    translate: typeof translate;
    run: typeof runModel;
    isLoading: Signal<boolean>;
    error: Signal<Error>;
};
/**
 * Chat completion with LLM
 */
export declare function chat(options: ChatOptions): Promise<ChatResponse>;
/**
 * Generate text embeddings
 */
export declare function embed(options: EmbeddingOptions): Promise<EmbeddingResponse>;
/**
 * Generate images from text
 */
export declare function generateImage(options: ImageGenerationOptions): Promise<Uint8Array>;
/**
 * Classify images
 */
export declare function classifyImage(options: ImageClassificationOptions): Promise<Array<{
    label: string;
    score: number;
}>>;
/**
 * Convert text to speech
 */
export declare function textToSpeech(options: TextToSpeechOptions): Promise<Uint8Array>;
/**
 * Convert speech to text
 */
export declare function speechToText(options: SpeechToTextOptions): Promise<{
    text: string;
    language?: string;
}>;
/**
 * Translate text between languages
 */
export declare function translate(options: TranslationOptions): Promise<{
    text: string;
}>;
/**
 * Run any Workers AI model directly
 */
export declare function runModel<T = any>(model: string, inputs: Record<string, any>): Promise<T>;
export declare const models: {
    readonly chat: {
        readonly llama2_7b: "@cf/meta/llama-2-7b-chat-int8";
        readonly llama2_7b_fp16: "@cf/meta/llama-2-7b-chat-fp16";
        readonly mistral_7b: "@cf/mistral/mistral-7b-instruct-v0.1";
        readonly codellama_7b: "@cf/meta/codellama-7b-instruct";
        readonly deepseek_coder_7b: "@cf/deepseek-ai/deepseek-coder-6.7b-instruct";
        readonly gemma_7b: "@cf/google/gemma-7b-it";
        readonly phi2: "@cf/microsoft/phi-2";
        readonly openchat_3_5: "@cf/openchat/openchat-3.5-0106";
        readonly hermes_2_7b: "@cf/nousresearch/hermes-2-pro-mistral-7b";
    };
    readonly embedding: {
        readonly bge_base: "@cf/baai/bge-base-en-v1.5";
        readonly bge_large: "@cf/baai/bge-large-en-v1.5";
        readonly bge_small: "@cf/baai/bge-small-en-v1.5";
    };
    readonly imageGeneration: {
        readonly sdxl: "@cf/stabilityai/stable-diffusion-xl-base-1.0";
        readonly dreamshaper: "@cf/lykon/dreamshaper-8-lcm";
    };
    readonly imageClassification: {
        readonly resnet50: "@cf/microsoft/resnet-50";
    };
    readonly tts: {
        readonly melotts: "@cf/myshell/melotts";
    };
    readonly stt: {
        readonly whisper: "@cf/openai/whisper";
        readonly whisper_tiny: "@cf/openai/whisper-tiny-en";
    };
    readonly translation: {
        readonly m2m100: "@cf/meta/m2m100-1.2b";
    };
};
/**
 * Format messages for chat
 */
export declare function formatMessages(systemPrompt: string, userMessage: string, history?: ChatMessage[]): ChatMessage[];
/**
 * Calculate cosine similarity between two vectors
 */
export declare function cosineSimilarity(a: number[], b: number[]): number;
/**
 * Find most similar vectors from a list
 */
export declare function findSimilar(query: number[], vectors: number[][], topK?: number): Array<{
    index: number;
    score: number;
}>;
