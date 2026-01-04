/**
 * Type definitions for PhilJS Python AI/ML integration
 */
export interface LLMConfig {
    provider: 'openai' | 'anthropic' | 'local' | 'ollama' | 'huggingface';
    model: string;
    apiKey?: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
    timeout?: number;
}
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'function';
    content: string;
    name?: string;
    functionCall?: {
        name: string;
        arguments: string;
    };
}
export interface ChatRequest {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    tools?: LLMTool[];
    toolChoice?: 'auto' | 'none' | {
        type: 'function';
        function: {
            name: string;
        };
    };
}
export interface ChatResponse {
    id: string;
    model: string;
    choices: Array<{
        index: number;
        message: ChatMessage;
        finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter';
    }>;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
export interface LLMTool {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
}
export interface EmbeddingsConfig {
    provider: 'openai' | 'cohere' | 'huggingface' | 'local';
    model: string;
    apiKey?: string;
    baseUrl?: string;
    dimensions?: number;
}
export interface EmbeddingsRequest {
    model: string;
    input: string | string[];
    dimensions?: number;
}
export interface EmbeddingsResponse {
    model: string;
    embeddings: number[][];
    usage: {
        promptTokens: number;
        totalTokens: number;
    };
}
export interface ModelConfig {
    name: string;
    path: string;
    framework: 'pytorch' | 'tensorflow' | 'onnx' | 'transformers';
    device?: 'cpu' | 'cuda' | 'mps';
    dtype?: 'float32' | 'float16' | 'bfloat16' | 'int8';
    quantization?: '4bit' | '8bit' | 'none';
}
export interface ModelInput {
    [key: string]: unknown;
}
export interface ModelOutput {
    [key: string]: unknown;
}
export interface PythonServerConfig {
    port?: number;
    host?: string;
    workers?: number;
    pythonPath?: string;
    virtualEnv?: string;
    requirements?: string[];
    gpuEnabled?: boolean;
}
export interface PythonFunction {
    name: string;
    module: string;
    function: string;
    args?: unknown[];
    kwargs?: Record<string, unknown>;
}
export interface RAGConfig {
    vectorStore: 'pinecone' | 'weaviate' | 'qdrant' | 'chroma' | 'philjs';
    embeddings: EmbeddingsConfig;
    llm: LLMConfig;
    chunkSize?: number;
    chunkOverlap?: number;
    topK?: number;
}
export interface RAGQuery {
    query: string;
    filter?: Record<string, unknown>;
    topK?: number;
    rerank?: boolean;
}
export interface RAGResponse {
    answer: string;
    sources: Array<{
        content: string;
        metadata: Record<string, unknown>;
        score: number;
    }>;
}
//# sourceMappingURL=types.d.ts.map