/**
 * @philjs/ai-agents - Multi-agent AI orchestration for PhilJS
 *
 * Features:
 * - Agent definition with tools and capabilities
 * - Multi-agent orchestration and handoffs
 * - Tool/function calling with type safety
 * - Memory systems (conversation, semantic, episodic)
 * - Streaming responses with tool execution
 * - Agent workflows and pipelines
 * - Supervisor/worker patterns
 * - Human-in-the-loop integration
 * - Observability and tracing
 */
type MessageRole = 'system' | 'user' | 'assistant' | 'tool';
interface Message {
    id: string;
    role: MessageRole;
    content: string;
    name?: string;
    toolCallId?: string;
    toolCalls?: ToolCall[];
    metadata?: Record<string, any>;
    timestamp: Date;
}
interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, any>;
}
interface ToolResult {
    toolCallId: string;
    result: any;
    error?: string;
}
interface ToolDefinition {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, {
            type: string;
            description: string;
            enum?: string[];
            items?: any;
        }>;
        required?: string[];
    };
    handler: (args: Record<string, any>, context: AgentContext) => Promise<any>;
}
interface AgentConfig {
    name: string;
    description: string;
    systemPrompt: string;
    model?: string | undefined;
    provider?: 'openai' | 'anthropic' | 'google' | 'local' | undefined;
    tools?: ToolDefinition[] | undefined;
    maxTokens?: number | undefined;
    temperature?: number | undefined;
    memory?: MemoryConfig | undefined;
    capabilities?: string[] | undefined;
}
interface MemoryConfig {
    type: 'conversation' | 'semantic' | 'episodic' | 'hybrid';
    maxMessages?: number;
    vectorStore?: string;
    summarizeAfter?: number;
}
interface AgentContext {
    agentId: string;
    conversationId: string;
    userId?: string | undefined;
    memory: Memory;
    metadata: Record<string, any>;
    abortSignal?: AbortSignal | undefined;
}
interface AgentResponse {
    message: Message;
    toolCalls?: ToolCall[];
    toolResults?: ToolResult[];
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
}
interface StreamChunk {
    type: 'text' | 'tool_call_start' | 'tool_call_args' | 'tool_result' | 'done' | 'error';
    content?: string;
    toolCall?: Partial<ToolCall>;
    toolResult?: ToolResult;
    error?: string;
}
interface Memory {
    add(message: Message): Promise<void>;
    getMessages(limit?: number): Promise<Message[]>;
    search(query: string, limit?: number): Promise<Message[]>;
    summarize(): Promise<string>;
    clear(): Promise<void>;
}
declare class ConversationMemory implements Memory {
    private messages;
    private maxMessages;
    constructor(maxMessages?: number);
    add(message: Message): Promise<void>;
    getMessages(limit?: number): Promise<Message[]>;
    search(query: string, limit?: number): Promise<Message[]>;
    summarize(): Promise<string>;
    clear(): Promise<void>;
}
declare class SemanticMemory implements Memory {
    private messages;
    private embeddings;
    private embedFn;
    constructor(embedFn: (text: string) => Promise<number[]>);
    add(message: Message): Promise<void>;
    getMessages(limit?: number): Promise<Message[]>;
    search(query: string, limit?: number): Promise<Message[]>;
    private cosineSimilarity;
    summarize(): Promise<string>;
    clear(): Promise<void>;
}
declare class EpisodicMemory implements Memory {
    private episodes;
    private currentEpisode;
    private summarizeFn;
    constructor(summarizeFn: (messages: Message[]) => Promise<string>);
    add(message: Message): Promise<void>;
    endEpisode(): Promise<void>;
    getMessages(limit?: number): Promise<Message[]>;
    search(query: string, limit?: number): Promise<Message[]>;
    summarize(): Promise<string>;
    clear(): Promise<void>;
}
declare class Agent {
    readonly id: string;
    readonly name: string;
    readonly config: AgentConfig;
    private memory;
    private tools;
    private llmClient;
    constructor(config: AgentConfig, llmClient: LLMClient);
    chat(userMessage: string, context?: Partial<AgentContext>): Promise<AgentResponse>;
    stream(userMessage: string, context?: Partial<AgentContext>): AsyncGenerator<StreamChunk>;
    private runLoop;
    private runStreamLoop;
    getMemory(): Memory;
    addTool(tool: ToolDefinition): void;
    removeTool(name: string): void;
}
interface LLMRequest {
    messages: Message[];
    tools?: ToolDefinition[] | undefined;
    model?: string | undefined;
    maxTokens?: number | undefined;
    temperature?: number | undefined;
}
interface LLMClient {
    complete(request: LLMRequest): Promise<AgentResponse>;
    stream(request: LLMRequest): AsyncGenerator<StreamChunk>;
}
declare class OpenAIClient implements LLMClient {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string, baseUrl?: string);
    complete(request: LLMRequest): Promise<AgentResponse>;
    stream(request: LLMRequest): AsyncGenerator<StreamChunk>;
}
declare class AnthropicClient implements LLMClient {
    private apiKey;
    private baseUrl;
    constructor(apiKey: string, baseUrl?: string);
    complete(request: LLMRequest): Promise<AgentResponse>;
    stream(request: LLMRequest): AsyncGenerator<StreamChunk>;
}
interface HandoffRequest {
    fromAgent: string;
    toAgent: string;
    context: Record<string, any>;
    reason: string;
}
interface OrchestratorConfig {
    agents: Agent[];
    router?: (message: string, agents: Agent[]) => Promise<Agent>;
    maxHandoffs?: number;
}
declare class AgentOrchestrator {
    private agents;
    private router;
    private maxHandoffs;
    private handoffHistory;
    constructor(config: OrchestratorConfig);
    private defaultRouter;
    route(message: string): Promise<Agent>;
    chat(message: string, context?: Partial<AgentContext>): Promise<AgentResponse>;
    stream(message: string, context?: Partial<AgentContext>): AsyncGenerator<StreamChunk>;
    handoff(request: HandoffRequest): Promise<void>;
    getAgent(name: string): Agent | undefined;
    addAgent(agent: Agent): void;
    removeAgent(name: string): void;
    getHandoffHistory(): HandoffRequest[];
}
interface SupervisorConfig {
    supervisor: Agent;
    workers: Agent[];
    delegationPrompt?: string;
}
declare class SupervisorOrchestrator {
    private supervisor;
    private workers;
    private delegationPrompt;
    constructor(config: SupervisorConfig);
    run(task: string, context?: Partial<AgentContext>): Promise<AgentResponse>;
    stream(task: string, context?: Partial<AgentContext>): AsyncGenerator<StreamChunk>;
}
interface WorkflowStep {
    name: string;
    agent: Agent;
    inputMapper?: (prevOutput: any, context: Record<string, any>) => string;
    outputMapper?: (response: AgentResponse) => any;
    condition?: (context: Record<string, any>) => boolean;
}
declare class AgentWorkflow {
    private steps;
    private context;
    addStep(step: WorkflowStep): this;
    setContext(context: Record<string, any>): this;
    run(initialInput: string): Promise<{
        output: any;
        trace: Array<{
            step: string;
            input: string;
            output: any;
        }>;
    }>;
}
declare const webSearchTool: ToolDefinition;
declare const calculatorTool: ToolDefinition;
declare const codeExecutorTool: ToolDefinition;
interface UseAgentResult {
    messages: Message[];
    isLoading: boolean;
    error: Error | null;
    send: (message: string) => Promise<void>;
    streamingContent: string;
    clear: () => void;
}
declare function useAgent(agent: Agent): UseAgentResult;
declare function useOrchestrator(orchestrator: AgentOrchestrator): UseAgentResult;
declare class AgentBuilder {
    private config;
    private tools;
    name(name: string): this;
    description(description: string): this;
    systemPrompt(prompt: string): this;
    model(model: string): this;
    provider(provider: AgentConfig['provider']): this;
    temperature(temp: number): this;
    maxTokens(tokens: number): this;
    capabilities(caps: string[]): this;
    tool(tool: ToolDefinition): this;
    memory(config: MemoryConfig): this;
    build(llmClient: LLMClient): Agent;
}
declare function createAgent(): AgentBuilder;
export { Agent, AgentOrchestrator, SupervisorOrchestrator, AgentWorkflow, AgentBuilder, ConversationMemory, SemanticMemory, EpisodicMemory, OpenAIClient, AnthropicClient, webSearchTool, calculatorTool, codeExecutorTool, useAgent, useOrchestrator, createAgent, type Message, type ToolCall, type ToolResult, type ToolDefinition, type AgentConfig, type AgentContext, type AgentResponse, type StreamChunk, type Memory, type MemoryConfig, type HandoffRequest, type OrchestratorConfig, type SupervisorConfig, type WorkflowStep, type LLMClient, type LLMRequest, type UseAgentResult };
//# sourceMappingURL=index.d.ts.map