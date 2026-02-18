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
import { signal } from '@philjs/core';
// Default models
const DEFAULT_MODELS = {
    chat: '@cf/meta/llama-2-7b-chat-int8',
    embedding: '@cf/baai/bge-base-en-v1.5',
    imageGeneration: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
    imageClassification: '@cf/microsoft/resnet-50',
    tts: '@cf/myshell/melotts',
    stt: '@cf/openai/whisper',
    translation: '@cf/meta/m2m100-1.2b',
};
// State
let aiBinding = null;
let defaultConfig = {};
// Signals for reactive state
const loadingSignal = signal(false);
const errorSignal = signal(null);
/**
 * Creates a Workers AI client
 */
export function createWorkersAI(ai, config) {
    aiBinding = ai;
    defaultConfig = config || {};
    return {
        chat,
        embed,
        generateImage,
        classifyImage,
        textToSpeech,
        speechToText,
        translate,
        run: runModel,
        isLoading: () => loadingSignal(),
        error: () => errorSignal(),
    };
}
/**
 * React hook for Workers AI in components
 */
export function useWorkersAI() {
    return {
        chat,
        embed,
        generateImage,
        classifyImage,
        textToSpeech,
        speechToText,
        translate,
        run: runModel,
        isLoading: loadingSignal,
        error: errorSignal,
    };
}
/**
 * Chat completion with LLM
 */
export async function chat(options) {
    if (!aiBinding)
        throw new Error('Workers AI not configured. Call createWorkersAI first.');
    const model = options.model || defaultConfig.defaultModel || DEFAULT_MODELS.chat;
    try {
        loadingSignal.set(true);
        errorSignal.set(null);
        if (options.stream) {
            return streamChat(model, options);
        }
        const response = await aiBinding.run(model, {
            messages: options.messages,
            max_tokens: options.max_tokens,
            temperature: options.temperature,
            top_p: options.top_p,
            top_k: options.top_k,
            repetition_penalty: options.repetition_penalty,
            frequency_penalty: options.frequency_penalty,
            presence_penalty: options.presence_penalty,
            seed: options.seed,
        });
        return {
            text: response.response || response.result || '',
            usage: response.usage,
        };
    }
    catch (error) {
        errorSignal.set(error);
        throw error;
    }
    finally {
        loadingSignal.set(false);
    }
}
/**
 * Streaming chat completion
 */
async function streamChat(model, options) {
    if (!aiBinding)
        throw new Error('Workers AI not configured');
    const response = await aiBinding.run(model, {
        messages: options.messages,
        stream: true,
        max_tokens: options.max_tokens,
        temperature: options.temperature,
    });
    // Handle streaming response
    let fullText = '';
    if (response instanceof ReadableStream) {
        const reader = response.getReader();
        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]')
                        break;
                    try {
                        const json = JSON.parse(data);
                        if (json.response) {
                            fullText += json.response;
                        }
                    }
                    catch {
                        // Ignore parse errors for partial chunks
                    }
                }
            }
        }
    }
    return { text: fullText };
}
/**
 * Generate text embeddings
 */
export async function embed(options) {
    if (!aiBinding)
        throw new Error('Workers AI not configured');
    const model = options.model || DEFAULT_MODELS.embedding;
    try {
        loadingSignal.set(true);
        errorSignal.set(null);
        const texts = Array.isArray(options.text) ? options.text : [options.text];
        const response = await aiBinding.run(model, { text: texts });
        return {
            vectors: response.data || response,
            shape: [texts.length, response.data?.[0]?.length || 768],
        };
    }
    catch (error) {
        errorSignal.set(error);
        throw error;
    }
    finally {
        loadingSignal.set(false);
    }
}
/**
 * Generate images from text
 */
export async function generateImage(options) {
    if (!aiBinding)
        throw new Error('Workers AI not configured');
    const model = options.model || DEFAULT_MODELS.imageGeneration;
    try {
        loadingSignal.set(true);
        errorSignal.set(null);
        const response = await aiBinding.run(model, {
            prompt: options.prompt,
            negative_prompt: options.negative_prompt,
            width: options.width || 1024,
            height: options.height || 1024,
            num_steps: options.num_steps || 20,
            guidance: options.guidance || 7.5,
            seed: options.seed,
        });
        return new Uint8Array(response);
    }
    catch (error) {
        errorSignal.set(error);
        throw error;
    }
    finally {
        loadingSignal.set(false);
    }
}
/**
 * Classify images
 */
export async function classifyImage(options) {
    if (!aiBinding)
        throw new Error('Workers AI not configured');
    const model = options.model || DEFAULT_MODELS.imageClassification;
    try {
        loadingSignal.set(true);
        errorSignal.set(null);
        const response = await aiBinding.run(model, {
            image: [...new Uint8Array(options.image)],
        });
        return response;
    }
    catch (error) {
        errorSignal.set(error);
        throw error;
    }
    finally {
        loadingSignal.set(false);
    }
}
/**
 * Convert text to speech
 */
export async function textToSpeech(options) {
    if (!aiBinding)
        throw new Error('Workers AI not configured');
    const model = options.model || DEFAULT_MODELS.tts;
    try {
        loadingSignal.set(true);
        errorSignal.set(null);
        const response = await aiBinding.run(model, {
            text: options.text,
            voice: options.voice,
        });
        return new Uint8Array(response);
    }
    catch (error) {
        errorSignal.set(error);
        throw error;
    }
    finally {
        loadingSignal.set(false);
    }
}
/**
 * Convert speech to text
 */
export async function speechToText(options) {
    if (!aiBinding)
        throw new Error('Workers AI not configured');
    const model = options.model || DEFAULT_MODELS.stt;
    try {
        loadingSignal.set(true);
        errorSignal.set(null);
        const response = await aiBinding.run(model, {
            audio: [...new Uint8Array(options.audio)],
            source_lang: options.source_lang,
        });
        return {
            text: response.text || response.transcription || '',
            language: response.detected_language,
        };
    }
    catch (error) {
        errorSignal.set(error);
        throw error;
    }
    finally {
        loadingSignal.set(false);
    }
}
/**
 * Translate text between languages
 */
export async function translate(options) {
    if (!aiBinding)
        throw new Error('Workers AI not configured');
    const model = options.model || DEFAULT_MODELS.translation;
    try {
        loadingSignal.set(true);
        errorSignal.set(null);
        const response = await aiBinding.run(model, {
            text: options.text,
            source_lang: options.source_lang,
            target_lang: options.target_lang,
        });
        return {
            text: response.translated_text || response.text || '',
        };
    }
    catch (error) {
        errorSignal.set(error);
        throw error;
    }
    finally {
        loadingSignal.set(false);
    }
}
/**
 * Run any Workers AI model directly
 */
export async function runModel(model, inputs) {
    if (!aiBinding)
        throw new Error('Workers AI not configured');
    try {
        loadingSignal.set(true);
        errorSignal.set(null);
        return await aiBinding.run(model, inputs);
    }
    catch (error) {
        errorSignal.set(error);
        throw error;
    }
    finally {
        loadingSignal.set(false);
    }
}
// Model catalog helpers
export const models = {
    chat: {
        llama2_7b: '@cf/meta/llama-2-7b-chat-int8',
        llama2_7b_fp16: '@cf/meta/llama-2-7b-chat-fp16',
        mistral_7b: '@cf/mistral/mistral-7b-instruct-v0.1',
        codellama_7b: '@cf/meta/codellama-7b-instruct',
        deepseek_coder_7b: '@cf/deepseek-ai/deepseek-coder-6.7b-instruct',
        gemma_7b: '@cf/google/gemma-7b-it',
        phi2: '@cf/microsoft/phi-2',
        openchat_3_5: '@cf/openchat/openchat-3.5-0106',
        hermes_2_7b: '@cf/nousresearch/hermes-2-pro-mistral-7b',
    },
    embedding: {
        bge_base: '@cf/baai/bge-base-en-v1.5',
        bge_large: '@cf/baai/bge-large-en-v1.5',
        bge_small: '@cf/baai/bge-small-en-v1.5',
    },
    imageGeneration: {
        sdxl: '@cf/stabilityai/stable-diffusion-xl-base-1.0',
        dreamshaper: '@cf/lykon/dreamshaper-8-lcm',
    },
    imageClassification: {
        resnet50: '@cf/microsoft/resnet-50',
    },
    tts: {
        melotts: '@cf/myshell/melotts',
    },
    stt: {
        whisper: '@cf/openai/whisper',
        whisper_tiny: '@cf/openai/whisper-tiny-en',
    },
    translation: {
        m2m100: '@cf/meta/m2m100-1.2b',
    },
};
// Utility functions
/**
 * Format messages for chat
 */
export function formatMessages(systemPrompt, userMessage, history = []) {
    return [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: userMessage }];
}
/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a, b) {
    if (a.length !== b.length) {
        throw new Error('Vectors must have the same length');
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        const valA = a[i] || 0;
        const valB = b[i] || 0;
        dotProduct += valA * valB;
        normA += valA * valA;
        normB += valB * valB;
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
/**
 * Find most similar vectors from a list
 */
export function findSimilar(query, vectors, topK = 5) {
    const scores = vectors.map((vector, index) => ({
        index,
        score: cosineSimilarity(query, vector),
    }));
    return scores.sort((a, b) => b.score - a.score).slice(0, topK);
}
//# sourceMappingURL=workers-ai.js.map