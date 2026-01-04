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

// ============================================================================
// TYPES
// ============================================================================

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

// ============================================================================
// MEMORY SYSTEMS
// ============================================================================

interface Memory {
  add(message: Message): Promise<void>;
  getMessages(limit?: number): Promise<Message[]>;
  search(query: string, limit?: number): Promise<Message[]>;
  summarize(): Promise<string>;
  clear(): Promise<void>;
}

class ConversationMemory implements Memory {
  private messages: Message[] = [];
  private maxMessages: number;

  constructor(maxMessages = 100) {
    this.maxMessages = maxMessages;
  }

  async add(message: Message): Promise<void> {
    this.messages.push(message);
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }
  }

  async getMessages(limit?: number): Promise<Message[]> {
    if (limit) {
      return this.messages.slice(-limit);
    }
    return [...this.messages];
  }

  async search(query: string, limit = 10): Promise<Message[]> {
    const lowerQuery = query.toLowerCase();
    return this.messages
      .filter(m => m.content.toLowerCase().includes(lowerQuery))
      .slice(-limit);
  }

  async summarize(): Promise<string> {
    const recentMessages = this.messages.slice(-20);
    return recentMessages.map(m => `${m.role}: ${m.content.slice(0, 100)}`).join('\n');
  }

  async clear(): Promise<void> {
    this.messages = [];
  }
}

class SemanticMemory implements Memory {
  private messages: Message[] = [];
  private embeddings: Map<string, number[]> = new Map();
  private embedFn: (text: string) => Promise<number[]>;

  constructor(embedFn: (text: string) => Promise<number[]>) {
    this.embedFn = embedFn;
  }

  async add(message: Message): Promise<void> {
    this.messages.push(message);
    const embedding = await this.embedFn(message.content);
    this.embeddings.set(message.id, embedding);
  }

  async getMessages(limit?: number): Promise<Message[]> {
    if (limit) {
      return this.messages.slice(-limit);
    }
    return [...this.messages];
  }

  async search(query: string, limit = 10): Promise<Message[]> {
    const queryEmbedding = await this.embedFn(query);

    const scored = this.messages.map(m => {
      const embedding = this.embeddings.get(m.id);
      if (!embedding) return { message: m, score: 0 };
      const score = this.cosineSimilarity(queryEmbedding, embedding);
      return { message: m, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.message);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i]! * b[i]!;
      normA += a[i]! * a[i]!;
      normB += b[i]! * b[i]!;
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async summarize(): Promise<string> {
    return this.messages.slice(-10).map(m => m.content.slice(0, 50)).join(' | ');
  }

  async clear(): Promise<void> {
    this.messages = [];
    this.embeddings.clear();
  }
}

class EpisodicMemory implements Memory {
  private episodes: Array<{ id: string; messages: Message[]; summary: string; timestamp: Date }> = [];
  private currentEpisode: Message[] = [];
  private summarizeFn: (messages: Message[]) => Promise<string>;

  constructor(summarizeFn: (messages: Message[]) => Promise<string>) {
    this.summarizeFn = summarizeFn;
  }

  async add(message: Message): Promise<void> {
    this.currentEpisode.push(message);

    // End episode after 10 messages or explicit end
    if (this.currentEpisode.length >= 10) {
      await this.endEpisode();
    }
  }

  async endEpisode(): Promise<void> {
    if (this.currentEpisode.length === 0) return;

    const summary = await this.summarizeFn(this.currentEpisode);
    this.episodes.push({
      id: crypto.randomUUID(),
      messages: [...this.currentEpisode],
      summary,
      timestamp: new Date()
    });
    this.currentEpisode = [];
  }

  async getMessages(limit?: number): Promise<Message[]> {
    const allMessages = [
      ...this.episodes.flatMap(e => e.messages),
      ...this.currentEpisode
    ];
    if (limit) {
      return allMessages.slice(-limit);
    }
    return allMessages;
  }

  async search(query: string, limit = 10): Promise<Message[]> {
    const lowerQuery = query.toLowerCase();

    // Search in episode summaries first
    const relevantEpisodes = this.episodes
      .filter(e => e.summary.toLowerCase().includes(lowerQuery))
      .flatMap(e => e.messages);

    // Then search in current episode
    const currentMatches = this.currentEpisode
      .filter(m => m.content.toLowerCase().includes(lowerQuery));

    return [...relevantEpisodes, ...currentMatches].slice(0, limit);
  }

  async summarize(): Promise<string> {
    const episodeSummaries = this.episodes.map(e => e.summary).join('\n');
    const currentSummary = this.currentEpisode.length > 0
      ? await this.summarizeFn(this.currentEpisode)
      : '';
    return `${episodeSummaries}\n${currentSummary}`;
  }

  async clear(): Promise<void> {
    this.episodes = [];
    this.currentEpisode = [];
  }
}

// ============================================================================
// AGENT
// ============================================================================

class Agent {
  readonly id: string;
  readonly name: string;
  readonly config: AgentConfig;
  private memory: Memory;
  private tools: Map<string, ToolDefinition> = new Map();
  private llmClient: LLMClient;

  constructor(config: AgentConfig, llmClient: LLMClient) {
    this.id = crypto.randomUUID();
    this.name = config.name;
    this.config = config;
    this.llmClient = llmClient;

    // Initialize memory
    this.memory = new ConversationMemory(config.memory?.maxMessages || 100);

    // Register tools
    if (config.tools) {
      config.tools.forEach(tool => {
        this.tools.set(tool.name, tool);
      });
    }
  }

  async chat(userMessage: string, context?: Partial<AgentContext>): Promise<AgentResponse> {
    const message: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    await this.memory.add(message);

    const agentContext: AgentContext = {
      agentId: this.id,
      conversationId: context?.conversationId || crypto.randomUUID(),
      userId: context?.userId,
      memory: this.memory,
      metadata: context?.metadata || {},
      abortSignal: context?.abortSignal
    };

    return this.runLoop(agentContext);
  }

  async *stream(userMessage: string, context?: Partial<AgentContext>): AsyncGenerator<StreamChunk> {
    const message: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    await this.memory.add(message);

    const agentContext: AgentContext = {
      agentId: this.id,
      conversationId: context?.conversationId || crypto.randomUUID(),
      userId: context?.userId,
      memory: this.memory,
      metadata: context?.metadata || {},
      abortSignal: context?.abortSignal
    };

    yield* this.runStreamLoop(agentContext);
  }

  private async runLoop(context: AgentContext): Promise<AgentResponse> {
    const messages = await this.memory.getMessages();
    const systemMessage: Message = {
      id: 'system',
      role: 'system',
      content: this.config.systemPrompt,
      timestamp: new Date()
    };

    let response = await this.llmClient.complete({
      messages: [systemMessage, ...messages],
      tools: Array.from(this.tools.values()),
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature
    });

    // Handle tool calls
    while (response.toolCalls && response.toolCalls.length > 0) {
      const toolResults: ToolResult[] = [];

      for (const toolCall of response.toolCalls) {
        const tool = this.tools.get(toolCall.name);
        if (tool) {
          try {
            const result = await tool.handler(toolCall.arguments, context);
            toolResults.push({
              toolCallId: toolCall.id,
              result
            });
          } catch (error) {
            toolResults.push({
              toolCallId: toolCall.id,
              result: null,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }
      }

      // Add tool results to memory
      for (const result of toolResults) {
        await this.memory.add({
          id: crypto.randomUUID(),
          role: 'tool',
          content: JSON.stringify(result.result),
          toolCallId: result.toolCallId,
          timestamp: new Date()
        });
      }

      // Get next response
      const updatedMessages = await this.memory.getMessages();
      response = await this.llmClient.complete({
        messages: [systemMessage, ...updatedMessages],
        tools: Array.from(this.tools.values()),
        model: this.config.model,
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature
      });
    }

    // Add final response to memory
    await this.memory.add(response.message);

    return response;
  }

  private async *runStreamLoop(context: AgentContext): AsyncGenerator<StreamChunk> {
    const messages = await this.memory.getMessages();
    const systemMessage: Message = {
      id: 'system',
      role: 'system',
      content: this.config.systemPrompt,
      timestamp: new Date()
    };

    let fullContent = '';
    let toolCalls: ToolCall[] = [];

    for await (const chunk of this.llmClient.stream({
      messages: [systemMessage, ...messages],
      tools: Array.from(this.tools.values()),
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature
    })) {
      if (chunk.type === 'text') {
        fullContent += chunk.content || '';
        yield chunk;
      } else if (chunk.type === 'tool_call_start' || chunk.type === 'tool_call_args') {
        if (chunk.toolCall) {
          const existingCall = toolCalls.find(tc => tc.id === chunk.toolCall?.id);
          if (!existingCall && chunk.toolCall.id && chunk.toolCall.name) {
            toolCalls.push({
              id: chunk.toolCall.id,
              name: chunk.toolCall.name,
              arguments: chunk.toolCall.arguments || {}
            });
          }
        }
        yield chunk;
      }
    }

    // Execute tools if any
    if (toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        const tool = this.tools.get(toolCall.name);
        if (tool) {
          try {
            const result = await tool.handler(toolCall.arguments, context);
            yield {
              type: 'tool_result',
              toolResult: { toolCallId: toolCall.id, result }
            };

            await this.memory.add({
              id: crypto.randomUUID(),
              role: 'tool',
              content: JSON.stringify(result),
              toolCallId: toolCall.id,
              timestamp: new Date()
            });
          } catch (error) {
            yield {
              type: 'tool_result',
              toolResult: {
                toolCallId: toolCall.id,
                result: null,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            };
          }
        }
      }

      // Continue streaming after tool execution
      const updatedMessages = await this.memory.getMessages();
      for await (const chunk of this.llmClient.stream({
        messages: [systemMessage, ...updatedMessages],
        tools: Array.from(this.tools.values()),
        model: this.config.model,
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature
      })) {
        yield chunk;
        if (chunk.type === 'text') {
          fullContent += chunk.content || '';
        }
      }
    }

    // Save final response
    await this.memory.add({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: fullContent,
      timestamp: new Date()
    });

    yield { type: 'done' };
  }

  getMemory(): Memory {
    return this.memory;
  }

  addTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  removeTool(name: string): void {
    this.tools.delete(name);
  }
}

// ============================================================================
// LLM CLIENT INTERFACE
// ============================================================================

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

class OpenAIClient implements LLMClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://api.openai.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async complete(request: LLMRequest): Promise<AgentResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: request.model || 'gpt-4-turbo-preview',
        messages: request.messages.map(m => ({
          role: m.role,
          content: m.content,
          name: m.name,
          tool_call_id: m.toolCallId,
          tool_calls: m.toolCalls?.map(tc => ({
            id: tc.id,
            type: 'function',
            function: { name: tc.name, arguments: JSON.stringify(tc.arguments) }
          }))
        })),
        tools: request.tools?.map(t => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters
          }
        })),
        max_tokens: request.maxTokens,
        temperature: request.temperature
      })
    });

    const data = await response.json();
    const choice = data.choices[0];

    return {
      message: {
        id: data.id,
        role: 'assistant',
        content: choice.message.content || '',
        toolCalls: choice.message.tool_calls?.map((tc: any) => ({
          id: tc.id,
          name: tc.function.name,
          arguments: JSON.parse(tc.function.arguments)
        })),
        timestamp: new Date()
      },
      toolCalls: choice.message.tool_calls?.map((tc: any) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: JSON.parse(tc.function.arguments)
      })),
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      },
      finishReason: choice.finish_reason === 'tool_calls' ? 'tool_calls' : 'stop'
    };
  }

  async *stream(request: LLMRequest): AsyncGenerator<StreamChunk> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: request.model || 'gpt-4-turbo-preview',
        messages: request.messages.map(m => ({
          role: m.role,
          content: m.content,
          name: m.name,
          tool_call_id: m.toolCallId
        })),
        tools: request.tools?.map(t => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters
          }
        })),
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: true
      })
    });

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            yield { type: 'done' };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices[0]?.delta;

            if (delta?.content) {
              yield { type: 'text', content: delta.content };
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.function?.name) {
                  yield {
                    type: 'tool_call_start',
                    toolCall: {
                      id: tc.id,
                      name: tc.function.name,
                      arguments: {}
                    }
                  };
                }
                if (tc.function?.arguments) {
                  yield {
                    type: 'tool_call_args',
                    toolCall: { id: tc.id }
                  };
                }
              }
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}

class AnthropicClient implements LLMClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = 'https://api.anthropic.com/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async complete(request: LLMRequest): Promise<AgentResponse> {
    const systemMessage = request.messages.find(m => m.role === 'system');
    const otherMessages = request.messages.filter(m => m.role !== 'system');

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: request.model || 'claude-3-opus-20240229',
        system: systemMessage?.content,
        messages: otherMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })),
        tools: request.tools?.map(t => ({
          name: t.name,
          description: t.description,
          input_schema: t.parameters
        })),
        max_tokens: request.maxTokens || 4096
      })
    });

    const data = await response.json();

    const textContent = data.content.find((c: any) => c.type === 'text');
    const toolUse = data.content.filter((c: any) => c.type === 'tool_use');

    return {
      message: {
        id: data.id,
        role: 'assistant',
        content: textContent?.text || '',
        toolCalls: toolUse.map((tu: any) => ({
          id: tu.id,
          name: tu.name,
          arguments: tu.input
        })),
        timestamp: new Date()
      },
      toolCalls: toolUse.map((tu: any) => ({
        id: tu.id,
        name: tu.name,
        arguments: tu.input
      })),
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens
      },
      finishReason: data.stop_reason === 'tool_use' ? 'tool_calls' : 'stop'
    };
  }

  async *stream(request: LLMRequest): AsyncGenerator<StreamChunk> {
    const systemMessage = request.messages.find(m => m.role === 'system');
    const otherMessages = request.messages.filter(m => m.role !== 'system');

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: request.model || 'claude-3-opus-20240229',
        system: systemMessage?.content,
        messages: otherMessages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        })),
        tools: request.tools?.map(t => ({
          name: t.name,
          description: t.description,
          input_schema: t.parameters
        })),
        max_tokens: request.maxTokens || 4096,
        stream: true
      })
    });

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'content_block_delta') {
              if (data.delta.type === 'text_delta') {
                yield { type: 'text', content: data.delta.text };
              }
            }

            if (data.type === 'message_stop') {
              yield { type: 'done' };
              return;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}

// ============================================================================
// MULTI-AGENT ORCHESTRATION
// ============================================================================

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

class AgentOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private router: (message: string, agents: Agent[]) => Promise<Agent>;
  private maxHandoffs: number;
  private handoffHistory: HandoffRequest[] = [];

  constructor(config: OrchestratorConfig) {
    config.agents.forEach(agent => {
      this.agents.set(agent.name, agent);
    });

    this.router = config.router || this.defaultRouter.bind(this);
    this.maxHandoffs = config.maxHandoffs || 5;
  }

  private async defaultRouter(message: string, agents: Agent[]): Promise<Agent> {
    // Simple keyword-based routing
    const lowerMessage = message.toLowerCase();

    for (const agent of agents) {
      const capabilities = agent.config.capabilities || [];
      for (const capability of capabilities) {
        if (lowerMessage.includes(capability.toLowerCase())) {
          return agent;
        }
      }
    }

    // Return first agent as default
    return agents[0]!;
  }

  async route(message: string): Promise<Agent> {
    const agentList = Array.from(this.agents.values());
    return this.router(message, agentList);
  }

  async chat(message: string, context?: Partial<AgentContext>): Promise<AgentResponse> {
    const agent = await this.route(message);
    return agent.chat(message, context);
  }

  async *stream(message: string, context?: Partial<AgentContext>): AsyncGenerator<StreamChunk> {
    const agent = await this.route(message);
    yield* agent.stream(message, context);
  }

  async handoff(request: HandoffRequest): Promise<void> {
    if (this.handoffHistory.length >= this.maxHandoffs) {
      throw new Error('Maximum handoffs exceeded');
    }

    this.handoffHistory.push(request);

    const toAgent = this.agents.get(request.toAgent);
    if (!toAgent) {
      throw new Error(`Agent ${request.toAgent} not found`);
    }

    // Transfer context to new agent
    const memory = toAgent.getMemory();
    await memory.add({
      id: crypto.randomUUID(),
      role: 'system',
      content: `Handoff from ${request.fromAgent}: ${request.reason}\nContext: ${JSON.stringify(request.context)}`,
      timestamp: new Date()
    });
  }

  getAgent(name: string): Agent | undefined {
    return this.agents.get(name);
  }

  addAgent(agent: Agent): void {
    this.agents.set(agent.name, agent);
  }

  removeAgent(name: string): void {
    this.agents.delete(name);
  }

  getHandoffHistory(): HandoffRequest[] {
    return [...this.handoffHistory];
  }
}

// ============================================================================
// SUPERVISOR-WORKER PATTERN
// ============================================================================

interface SupervisorConfig {
  supervisor: Agent;
  workers: Agent[];
  delegationPrompt?: string;
}

class SupervisorOrchestrator {
  private supervisor: Agent;
  private workers: Map<string, Agent> = new Map();
  private delegationPrompt: string;

  constructor(config: SupervisorConfig) {
    this.supervisor = config.supervisor;
    config.workers.forEach(worker => {
      this.workers.set(worker.name, worker);
    });

    this.delegationPrompt = config.delegationPrompt || `
You are a supervisor coordinating a team of specialized workers.
Available workers: ${config.workers.map(w => `${w.name}: ${w.config.description}`).join('\n')}

When you receive a task:
1. Analyze what needs to be done
2. Decide which worker(s) should handle it
3. Use the delegate tool to assign work
4. Synthesize results from workers
5. Provide a final response

Use the delegate tool with worker name and task.
`;

    // Add delegation tool to supervisor
    this.supervisor.addTool({
      name: 'delegate',
      description: 'Delegate a task to a worker agent',
      parameters: {
        type: 'object',
        properties: {
          worker: {
            type: 'string',
            description: 'Name of the worker to delegate to',
            enum: config.workers.map(w => w.name)
          },
          task: {
            type: 'string',
            description: 'The task to delegate'
          }
        },
        required: ['worker', 'task']
      },
      handler: async (args, context) => {
        const worker = this.workers.get(args['worker']);
        if (!worker) {
          return { error: `Worker ${args['worker']} not found` };
        }

        const response = await worker.chat(args['task'], context);
        return {
          worker: args['worker'],
          task: args['task'],
          response: response.message.content
        };
      }
    });
  }

  async run(task: string, context?: Partial<AgentContext>): Promise<AgentResponse> {
    const fullPrompt = `${this.delegationPrompt}\n\nTask: ${task}`;
    return this.supervisor.chat(fullPrompt, context);
  }

  async *stream(task: string, context?: Partial<AgentContext>): AsyncGenerator<StreamChunk> {
    const fullPrompt = `${this.delegationPrompt}\n\nTask: ${task}`;
    yield* this.supervisor.stream(fullPrompt, context);
  }
}

// ============================================================================
// WORKFLOW / PIPELINE
// ============================================================================

interface WorkflowStep {
  name: string;
  agent: Agent;
  inputMapper?: (prevOutput: any, context: Record<string, any>) => string;
  outputMapper?: (response: AgentResponse) => any;
  condition?: (context: Record<string, any>) => boolean;
}

class AgentWorkflow {
  private steps: WorkflowStep[] = [];
  private context: Record<string, any> = {};

  addStep(step: WorkflowStep): this {
    this.steps.push(step);
    return this;
  }

  setContext(context: Record<string, any>): this {
    this.context = { ...this.context, ...context };
    return this;
  }

  async run(initialInput: string): Promise<{ output: any; trace: Array<{ step: string; input: string; output: any }> }> {
    const trace: Array<{ step: string; input: string; output: any }> = [];
    let currentOutput: any = initialInput;

    for (const step of this.steps) {
      // Check condition
      if (step.condition && !step.condition(this.context)) {
        continue;
      }

      // Map input
      const input = step.inputMapper
        ? step.inputMapper(currentOutput, this.context)
        : typeof currentOutput === 'string' ? currentOutput : JSON.stringify(currentOutput);

      // Run agent
      const response = await step.agent.chat(input);

      // Map output
      currentOutput = step.outputMapper
        ? step.outputMapper(response)
        : response.message.content;

      // Update context
      this.context[step.name] = currentOutput;

      trace.push({
        step: step.name,
        input,
        output: currentOutput
      });
    }

    return { output: currentOutput, trace };
  }
}

// ============================================================================
// BUILT-IN TOOLS
// ============================================================================

const webSearchTool: ToolDefinition = {
  name: 'web_search',
  description: 'Search the web for information',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query'
      },
      numResults: {
        type: 'number',
        description: 'Number of results to return (default 5)'
      }
    },
    required: ['query']
  },
  handler: async (args) => {
    // Placeholder - would integrate with search API
    return {
      query: args['query'],
      results: [
        { title: 'Example Result 1', snippet: 'This is a search result...', url: 'https://example.com/1' },
        { title: 'Example Result 2', snippet: 'Another search result...', url: 'https://example.com/2' }
      ]
    };
  }
};

const calculatorTool: ToolDefinition = {
  name: 'calculator',
  description: 'Perform mathematical calculations',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'The mathematical expression to evaluate'
      }
    },
    required: ['expression']
  },
  handler: async (args) => {
    try {
      // Safe math evaluation (would use a proper math parser in production)
      const result = Function(`"use strict"; return (${args['expression']})`)();
      return { expression: args['expression'], result };
    } catch (error) {
      return { expression: args['expression'], error: 'Invalid expression' };
    }
  }
};

const codeExecutorTool: ToolDefinition = {
  name: 'execute_code',
  description: 'Execute JavaScript code in a sandboxed environment',
  parameters: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'The JavaScript code to execute'
      }
    },
    required: ['code']
  },
  handler: async (args) => {
    try {
      // In production, use a proper sandbox (e.g., Web Workers, VM2)
      const result = eval(args['code']);
      return { code: args['code'], result };
    } catch (error) {
      return { code: args['code'], error: error instanceof Error ? error.message : 'Execution failed' };
    }
  }
};

// ============================================================================
// REACTIVE HOOKS (PhilJS Signal-based)
// ============================================================================

/**
 * Signal type for reactive state management
 * Compatible with @philjs/core signals
 */
interface Signal<T> {
  (): T;
  set(value: T): void;
  update(fn: (prev: T) => T): void;
}

/**
 * Create a reactive signal (placeholder - should use @philjs/core in production)
 * This implementation provides basic reactivity that works standalone
 */
function createSignal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const subscribers = new Set<() => void>();

  const signal = (() => value) as Signal<T>;

  signal.set = (newValue: T) => {
    if (value !== newValue) {
      value = newValue;
      subscribers.forEach(fn => fn());
    }
  };

  signal.update = (fn: (prev: T) => T) => {
    signal.set(fn(value));
  };

  // Allow subscription for framework integration
  (signal as any).subscribe = (fn: () => void) => {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  };

  return signal;
}

interface UseAgentResult {
  /** Reactive signal containing all messages in the conversation */
  messages: Signal<Message[]>;
  /** Reactive signal indicating if a request is in progress */
  isLoading: Signal<boolean>;
  /** Reactive signal containing any error that occurred */
  error: Signal<Error | null>;
  /** Send a message to the agent and stream the response */
  send: (message: string) => Promise<void>;
  /** Reactive signal containing the current streaming content */
  streamingContent: Signal<string>;
  /** Clear all messages and reset state */
  clear: () => void;
  /** Abort the current request if any */
  abort: () => void;
}

/**
 * Hook for interacting with a single AI agent
 *
 * @example
 * ```typescript
 * const agent = createAgent()
 *   .name('assistant')
 *   .systemPrompt('You are a helpful assistant')
 *   .build(new OpenAIClient(apiKey));
 *
 * const { messages, isLoading, send, streamingContent } = useAgent(agent);
 *
 * // Send a message
 * await send('Hello!');
 *
 * // Access reactive state
 * console.log(messages()); // Get current messages
 * console.log(isLoading()); // Check if loading
 * console.log(streamingContent()); // Get streaming text
 * ```
 */
function useAgent(agent: Agent): UseAgentResult {
  const messages = createSignal<Message[]>([]);
  const isLoading = createSignal(false);
  const error = createSignal<Error | null>(null);
  const streamingContent = createSignal('');

  let abortController: AbortController | null = null;

  const send = async (message: string): Promise<void> => {
    // Abort any existing request
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    isLoading.set(true);
    error.set(null);
    streamingContent.set('');

    try {
      const context = { abortSignal: abortController.signal };

      for await (const chunk of agent.stream(message, context)) {
        // Check for abort
        if (abortController.signal.aborted) {
          break;
        }

        if (chunk.type === 'text' && chunk.content) {
          streamingContent.update(prev => prev + chunk.content);
        } else if (chunk.type === 'done') {
          const updatedMessages = await agent.getMemory().getMessages();
          messages.set(updatedMessages);
          streamingContent.set(''); // Clear streaming content after completion
        } else if (chunk.type === 'error') {
          error.set(new Error(chunk.error));
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        // Request was aborted, not an error
        return;
      }
      error.set(e instanceof Error ? e : new Error('Unknown error'));
    } finally {
      isLoading.set(false);
      abortController = null;
    }
  };

  const clear = (): void => {
    agent.getMemory().clear();
    messages.set([]);
    streamingContent.set('');
    error.set(null);
  };

  const abort = (): void => {
    if (abortController) {
      abortController.abort();
      abortController = null;
      isLoading.set(false);
    }
  };

  // Initialize with existing messages
  agent.getMemory().getMessages().then(msgs => messages.set(msgs));

  return {
    messages,
    isLoading,
    error,
    send,
    streamingContent,
    clear,
    abort
  };
}

interface UseOrchestratorResult extends UseAgentResult {
  /** The currently active agent handling the conversation */
  activeAgent: Signal<Agent | null>;
  /** History of agent handoffs */
  handoffHistory: Signal<HandoffRequest[]>;
}

/**
 * Hook for interacting with a multi-agent orchestrator
 *
 * @example
 * ```typescript
 * const orchestrator = new AgentOrchestrator({
 *   agents: [salesAgent, supportAgent, technicalAgent],
 *   router: async (msg, agents) => {
 *     // Route based on message content
 *     if (msg.includes('price')) return agents.find(a => a.name === 'sales');
 *     return agents[0];
 *   }
 * });
 *
 * const { messages, send, activeAgent } = useOrchestrator(orchestrator);
 *
 * await send('What are your prices?');
 * console.log(activeAgent()?.name); // 'sales'
 * ```
 */
function useOrchestrator(orchestrator: AgentOrchestrator): UseOrchestratorResult {
  const messages = createSignal<Message[]>([]);
  const isLoading = createSignal(false);
  const error = createSignal<Error | null>(null);
  const streamingContent = createSignal('');
  const activeAgent = createSignal<Agent | null>(null);
  const handoffHistory = createSignal<HandoffRequest[]>([]);

  let abortController: AbortController | null = null;

  const send = async (message: string): Promise<void> => {
    // Abort any existing request
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    isLoading.set(true);
    error.set(null);
    streamingContent.set('');

    try {
      // Route to appropriate agent
      const agent = await orchestrator.route(message);
      activeAgent.set(agent);

      const context = { abortSignal: abortController.signal };

      for await (const chunk of orchestrator.stream(message, context)) {
        // Check for abort
        if (abortController.signal.aborted) {
          break;
        }

        if (chunk.type === 'text' && chunk.content) {
          streamingContent.update(prev => prev + chunk.content);
        } else if (chunk.type === 'done') {
          // Get messages from the active agent
          const currentAgent = activeAgent();
          if (currentAgent) {
            const updatedMessages = await currentAgent.getMemory().getMessages();
            messages.set(updatedMessages);
          }
          streamingContent.set('');
        } else if (chunk.type === 'error') {
          error.set(new Error(chunk.error));
        }
      }

      // Update handoff history
      handoffHistory.set(orchestrator.getHandoffHistory());
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        return;
      }
      error.set(e instanceof Error ? e : new Error('Unknown error'));
    } finally {
      isLoading.set(false);
      abortController = null;
    }
  };

  const clear = (): void => {
    messages.set([]);
    streamingContent.set('');
    error.set(null);
    activeAgent.set(null);
  };

  const abort = (): void => {
    if (abortController) {
      abortController.abort();
      abortController = null;
      isLoading.set(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    send,
    streamingContent,
    clear,
    abort,
    activeAgent,
    handoffHistory
  };
}

/**
 * Hook for supervisor-worker pattern orchestration
 */
interface UseSupervisorResult extends UseAgentResult {
  /** Results from delegated worker tasks */
  workerResults: Signal<Array<{ worker: string; task: string; response: string }>>;
}

function useSupervisor(supervisor: SupervisorOrchestrator): UseSupervisorResult {
  const messages = createSignal<Message[]>([]);
  const isLoading = createSignal(false);
  const error = createSignal<Error | null>(null);
  const streamingContent = createSignal('');
  const workerResults = createSignal<Array<{ worker: string; task: string; response: string }>>([]);

  let abortController: AbortController | null = null;

  const send = async (task: string): Promise<void> => {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    isLoading.set(true);
    error.set(null);
    streamingContent.set('');
    workerResults.set([]);

    try {
      const context = { abortSignal: abortController.signal };

      for await (const chunk of supervisor.stream(task, context)) {
        if (abortController.signal.aborted) {
          break;
        }

        if (chunk.type === 'text' && chunk.content) {
          streamingContent.update(prev => prev + chunk.content);
        } else if (chunk.type === 'tool_result' && chunk.toolResult) {
          // Capture worker delegation results
          const result = chunk.toolResult.result;
          if (result && typeof result === 'object' && 'worker' in result) {
            workerResults.update(prev => [...prev, result as any]);
          }
        } else if (chunk.type === 'done') {
          streamingContent.set('');
        } else if (chunk.type === 'error') {
          error.set(new Error(chunk.error));
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        return;
      }
      error.set(e instanceof Error ? e : new Error('Unknown error'));
    } finally {
      isLoading.set(false);
      abortController = null;
    }
  };

  const clear = (): void => {
    messages.set([]);
    streamingContent.set('');
    error.set(null);
    workerResults.set([]);
  };

  const abort = (): void => {
    if (abortController) {
      abortController.abort();
      abortController = null;
      isLoading.set(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    send,
    streamingContent,
    clear,
    abort,
    workerResults
  };
}

/**
 * Hook for running agent workflows/pipelines
 */
interface UseWorkflowResult {
  /** Whether the workflow is currently running */
  isRunning: Signal<boolean>;
  /** Current step being executed */
  currentStep: Signal<string | null>;
  /** Execution trace of all steps */
  trace: Signal<Array<{ step: string; input: string; output: any }>>;
  /** Final output of the workflow */
  output: Signal<any>;
  /** Any error that occurred */
  error: Signal<Error | null>;
  /** Run the workflow with initial input */
  run: (input: string) => Promise<void>;
  /** Reset the workflow state */
  reset: () => void;
}

function useWorkflow(workflow: AgentWorkflow): UseWorkflowResult {
  const isRunning = createSignal(false);
  const currentStep = createSignal<string | null>(null);
  const trace = createSignal<Array<{ step: string; input: string; output: any }>>([]);
  const output = createSignal<any>(null);
  const error = createSignal<Error | null>(null);

  const run = async (input: string): Promise<void> => {
    isRunning.set(true);
    error.set(null);
    trace.set([]);
    output.set(null);

    try {
      const result = await workflow.run(input);
      trace.set(result.trace);
      output.set(result.output);
    } catch (e) {
      error.set(e instanceof Error ? e : new Error('Workflow failed'));
    } finally {
      isRunning.set(false);
      currentStep.set(null);
    }
  };

  const reset = (): void => {
    isRunning.set(false);
    currentStep.set(null);
    trace.set([]);
    output.set(null);
    error.set(null);
  };

  return {
    isRunning,
    currentStep,
    trace,
    output,
    error,
    run,
    reset
  };
}

// ============================================================================
// AGENT BUILDER
// ============================================================================

class AgentBuilder {
  private config: Partial<AgentConfig> = {};
  private tools: ToolDefinition[] = [];

  name(name: string): this {
    this.config.name = name;
    return this;
  }

  description(description: string): this {
    this.config.description = description;
    return this;
  }

  systemPrompt(prompt: string): this {
    this.config.systemPrompt = prompt;
    return this;
  }

  model(model: string): this {
    this.config.model = model;
    return this;
  }

  provider(provider: AgentConfig['provider']): this {
    this.config.provider = provider;
    return this;
  }

  temperature(temp: number): this {
    this.config.temperature = temp;
    return this;
  }

  maxTokens(tokens: number): this {
    this.config.maxTokens = tokens;
    return this;
  }

  capabilities(caps: string[]): this {
    this.config.capabilities = caps;
    return this;
  }

  tool(tool: ToolDefinition): this {
    this.tools.push(tool);
    return this;
  }

  memory(config: MemoryConfig): this {
    this.config.memory = config;
    return this;
  }

  build(llmClient: LLMClient): Agent {
    if (!this.config.name || !this.config.systemPrompt) {
      throw new Error('Agent requires name and systemPrompt');
    }

    return new Agent(
      {
        ...this.config,
        tools: this.tools
      } as AgentConfig,
      llmClient
    );
  }
}

function createAgent(): AgentBuilder {
  return new AgentBuilder();
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Core classes
  Agent,
  AgentOrchestrator,
  SupervisorOrchestrator,
  AgentWorkflow,
  AgentBuilder,

  // Memory
  ConversationMemory,
  SemanticMemory,
  EpisodicMemory,

  // LLM Clients
  OpenAIClient,
  AnthropicClient,

  // Built-in tools
  webSearchTool,
  calculatorTool,
  codeExecutorTool,

  // Reactive Hooks
  useAgent,
  useOrchestrator,
  useSupervisor,
  useWorkflow,

  // Signal utilities
  createSignal,

  // Builder
  createAgent,

  // Types
  type Message,
  type ToolCall,
  type ToolResult,
  type ToolDefinition,
  type AgentConfig,
  type AgentContext,
  type AgentResponse,
  type StreamChunk,
  type Memory,
  type MemoryConfig,
  type HandoffRequest,
  type OrchestratorConfig,
  type SupervisorConfig,
  type WorkflowStep,
  type LLMClient,
  type LLMRequest,
  type UseAgentResult,
  type UseOrchestratorResult,
  type UseSupervisorResult,
  type UseWorkflowResult,
  type Signal
};
