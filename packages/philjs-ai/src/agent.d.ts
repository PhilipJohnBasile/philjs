import type { AIProvider, ToolDefinition } from './types.js';
export interface AgentConfig {
    name?: string;
    model?: string;
    apiKey?: string;
    endpoint?: string;
    temperature?: number;
    systemPrompt?: string;
    tools?: ToolDefinition[];
    maxSteps?: number;
    provider?: AIProvider;
}
export interface AgentResponse {
    content: string;
    toolCalls?: Array<{
        name: string;
        input: any;
        result: any;
    }>;
    usage?: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
    };
}
export declare class Agent {
    private config;
    private provider;
    private history;
    constructor(config: AgentConfig);
    /**
     * Executes a prompt using the configured LLM provider.
     * Supports automatic tool execution loop.
     */
    run(prompt: string): Promise<AgentResponse>;
    stream(prompt: string, onChunk: (chunk: string) => void): Promise<void>;
}
//# sourceMappingURL=agent.d.ts.map