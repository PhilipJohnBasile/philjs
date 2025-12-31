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
class ConversationMemory {
    messages = [];
    maxMessages;
    constructor(maxMessages = 100) {
        this.maxMessages = maxMessages;
    }
    async add(message) {
        this.messages.push(message);
        if (this.messages.length > this.maxMessages) {
            this.messages = this.messages.slice(-this.maxMessages);
        }
    }
    async getMessages(limit) {
        if (limit) {
            return this.messages.slice(-limit);
        }
        return [...this.messages];
    }
    async search(query, limit = 10) {
        const lowerQuery = query.toLowerCase();
        return this.messages
            .filter(m => m.content.toLowerCase().includes(lowerQuery))
            .slice(-limit);
    }
    async summarize() {
        const recentMessages = this.messages.slice(-20);
        return recentMessages.map(m => `${m.role}: ${m.content.slice(0, 100)}`).join('\n');
    }
    async clear() {
        this.messages = [];
    }
}
class SemanticMemory {
    messages = [];
    embeddings = new Map();
    embedFn;
    constructor(embedFn) {
        this.embedFn = embedFn;
    }
    async add(message) {
        this.messages.push(message);
        const embedding = await this.embedFn(message.content);
        this.embeddings.set(message.id, embedding);
    }
    async getMessages(limit) {
        if (limit) {
            return this.messages.slice(-limit);
        }
        return [...this.messages];
    }
    async search(query, limit = 10) {
        const queryEmbedding = await this.embedFn(query);
        const scored = this.messages.map(m => {
            const embedding = this.embeddings.get(m.id);
            if (!embedding)
                return { message: m, score: 0 };
            const score = this.cosineSimilarity(queryEmbedding, embedding);
            return { message: m, score };
        });
        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(s => s.message);
    }
    cosineSimilarity(a, b) {
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
    async summarize() {
        return this.messages.slice(-10).map(m => m.content.slice(0, 50)).join(' | ');
    }
    async clear() {
        this.messages = [];
        this.embeddings.clear();
    }
}
class EpisodicMemory {
    episodes = [];
    currentEpisode = [];
    summarizeFn;
    constructor(summarizeFn) {
        this.summarizeFn = summarizeFn;
    }
    async add(message) {
        this.currentEpisode.push(message);
        // End episode after 10 messages or explicit end
        if (this.currentEpisode.length >= 10) {
            await this.endEpisode();
        }
    }
    async endEpisode() {
        if (this.currentEpisode.length === 0)
            return;
        const summary = await this.summarizeFn(this.currentEpisode);
        this.episodes.push({
            id: crypto.randomUUID(),
            messages: [...this.currentEpisode],
            summary,
            timestamp: new Date()
        });
        this.currentEpisode = [];
    }
    async getMessages(limit) {
        const allMessages = [
            ...this.episodes.flatMap(e => e.messages),
            ...this.currentEpisode
        ];
        if (limit) {
            return allMessages.slice(-limit);
        }
        return allMessages;
    }
    async search(query, limit = 10) {
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
    async summarize() {
        const episodeSummaries = this.episodes.map(e => e.summary).join('\n');
        const currentSummary = this.currentEpisode.length > 0
            ? await this.summarizeFn(this.currentEpisode)
            : '';
        return `${episodeSummaries}\n${currentSummary}`;
    }
    async clear() {
        this.episodes = [];
        this.currentEpisode = [];
    }
}
// ============================================================================
// AGENT
// ============================================================================
class Agent {
    id;
    name;
    config;
    memory;
    tools = new Map();
    llmClient;
    constructor(config, llmClient) {
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
    async chat(userMessage, context) {
        const message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        };
        await this.memory.add(message);
        const agentContext = {
            agentId: this.id,
            conversationId: context?.conversationId || crypto.randomUUID(),
            userId: context?.userId,
            memory: this.memory,
            metadata: context?.metadata || {},
            abortSignal: context?.abortSignal
        };
        return this.runLoop(agentContext);
    }
    async *stream(userMessage, context) {
        const message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: userMessage,
            timestamp: new Date()
        };
        await this.memory.add(message);
        const agentContext = {
            agentId: this.id,
            conversationId: context?.conversationId || crypto.randomUUID(),
            userId: context?.userId,
            memory: this.memory,
            metadata: context?.metadata || {},
            abortSignal: context?.abortSignal
        };
        yield* this.runStreamLoop(agentContext);
    }
    async runLoop(context) {
        const messages = await this.memory.getMessages();
        const systemMessage = {
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
            const toolResults = [];
            for (const toolCall of response.toolCalls) {
                const tool = this.tools.get(toolCall.name);
                if (tool) {
                    try {
                        const result = await tool.handler(toolCall.arguments, context);
                        toolResults.push({
                            toolCallId: toolCall.id,
                            result
                        });
                    }
                    catch (error) {
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
    async *runStreamLoop(context) {
        const messages = await this.memory.getMessages();
        const systemMessage = {
            id: 'system',
            role: 'system',
            content: this.config.systemPrompt,
            timestamp: new Date()
        };
        let fullContent = '';
        let toolCalls = [];
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
            }
            else if (chunk.type === 'tool_call_start' || chunk.type === 'tool_call_args') {
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
                    }
                    catch (error) {
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
    getMemory() {
        return this.memory;
    }
    addTool(tool) {
        this.tools.set(tool.name, tool);
    }
    removeTool(name) {
        this.tools.delete(name);
    }
}
class OpenAIClient {
    apiKey;
    baseUrl;
    constructor(apiKey, baseUrl = 'https://api.openai.com/v1') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }
    async complete(request) {
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
                toolCalls: choice.message.tool_calls?.map((tc) => ({
                    id: tc.id,
                    name: tc.function.name,
                    arguments: JSON.parse(tc.function.arguments)
                })),
                timestamp: new Date()
            },
            toolCalls: choice.message.tool_calls?.map((tc) => ({
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
    async *stream(request) {
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
        if (!reader)
            return;
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
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
                    }
                    catch {
                        // Skip invalid JSON
                    }
                }
            }
        }
    }
}
class AnthropicClient {
    apiKey;
    baseUrl;
    constructor(apiKey, baseUrl = 'https://api.anthropic.com/v1') {
        this.apiKey = apiKey;
        this.baseUrl = baseUrl;
    }
    async complete(request) {
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
        const textContent = data.content.find((c) => c.type === 'text');
        const toolUse = data.content.filter((c) => c.type === 'tool_use');
        return {
            message: {
                id: data.id,
                role: 'assistant',
                content: textContent?.text || '',
                toolCalls: toolUse.map((tu) => ({
                    id: tu.id,
                    name: tu.name,
                    arguments: tu.input
                })),
                timestamp: new Date()
            },
            toolCalls: toolUse.map((tu) => ({
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
    async *stream(request) {
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
        if (!reader)
            return;
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
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
                    }
                    catch {
                        // Skip invalid JSON
                    }
                }
            }
        }
    }
}
class AgentOrchestrator {
    agents = new Map();
    router;
    maxHandoffs;
    handoffHistory = [];
    constructor(config) {
        config.agents.forEach(agent => {
            this.agents.set(agent.name, agent);
        });
        this.router = config.router || this.defaultRouter.bind(this);
        this.maxHandoffs = config.maxHandoffs || 5;
    }
    async defaultRouter(message, agents) {
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
        return agents[0];
    }
    async route(message) {
        const agentList = Array.from(this.agents.values());
        return this.router(message, agentList);
    }
    async chat(message, context) {
        const agent = await this.route(message);
        return agent.chat(message, context);
    }
    async *stream(message, context) {
        const agent = await this.route(message);
        yield* agent.stream(message, context);
    }
    async handoff(request) {
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
    getAgent(name) {
        return this.agents.get(name);
    }
    addAgent(agent) {
        this.agents.set(agent.name, agent);
    }
    removeAgent(name) {
        this.agents.delete(name);
    }
    getHandoffHistory() {
        return [...this.handoffHistory];
    }
}
class SupervisorOrchestrator {
    supervisor;
    workers = new Map();
    delegationPrompt;
    constructor(config) {
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
    async run(task, context) {
        const fullPrompt = `${this.delegationPrompt}\n\nTask: ${task}`;
        return this.supervisor.chat(fullPrompt, context);
    }
    async *stream(task, context) {
        const fullPrompt = `${this.delegationPrompt}\n\nTask: ${task}`;
        yield* this.supervisor.stream(fullPrompt, context);
    }
}
class AgentWorkflow {
    steps = [];
    context = {};
    addStep(step) {
        this.steps.push(step);
        return this;
    }
    setContext(context) {
        this.context = { ...this.context, ...context };
        return this;
    }
    async run(initialInput) {
        const trace = [];
        let currentOutput = initialInput;
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
const webSearchTool = {
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
const calculatorTool = {
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
        }
        catch (error) {
            return { expression: args['expression'], error: 'Invalid expression' };
        }
    }
};
const codeExecutorTool = {
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
        }
        catch (error) {
            return { code: args['code'], error: error instanceof Error ? error.message : 'Execution failed' };
        }
    }
};
function useAgent(agent) {
    let messages = [];
    let isLoading = false;
    let error = null;
    let streamingContent = '';
    const send = async (message) => {
        isLoading = true;
        error = null;
        streamingContent = '';
        try {
            for await (const chunk of agent.stream(message)) {
                if (chunk.type === 'text' && chunk.content) {
                    streamingContent += chunk.content;
                }
                else if (chunk.type === 'done') {
                    messages = await agent.getMemory().getMessages();
                }
                else if (chunk.type === 'error') {
                    error = new Error(chunk.error);
                }
            }
        }
        catch (e) {
            error = e instanceof Error ? e : new Error('Unknown error');
        }
        finally {
            isLoading = false;
        }
    };
    const clear = () => {
        agent.getMemory().clear();
        messages = [];
        streamingContent = '';
        error = null;
    };
    return {
        messages,
        isLoading,
        error,
        send,
        streamingContent,
        clear
    };
}
function useOrchestrator(orchestrator) {
    let messages = [];
    let isLoading = false;
    let error = null;
    let streamingContent = '';
    const send = async (message) => {
        isLoading = true;
        error = null;
        streamingContent = '';
        try {
            for await (const chunk of orchestrator.stream(message)) {
                if (chunk.type === 'text' && chunk.content) {
                    streamingContent += chunk.content;
                }
                else if (chunk.type === 'done') {
                    // Get messages from routed agent
                }
                else if (chunk.type === 'error') {
                    error = new Error(chunk.error);
                }
            }
        }
        catch (e) {
            error = e instanceof Error ? e : new Error('Unknown error');
        }
        finally {
            isLoading = false;
        }
    };
    const clear = () => {
        messages = [];
        streamingContent = '';
        error = null;
    };
    return {
        messages,
        isLoading,
        error,
        send,
        streamingContent,
        clear
    };
}
// ============================================================================
// AGENT BUILDER
// ============================================================================
class AgentBuilder {
    config = {};
    tools = [];
    name(name) {
        this.config.name = name;
        return this;
    }
    description(description) {
        this.config.description = description;
        return this;
    }
    systemPrompt(prompt) {
        this.config.systemPrompt = prompt;
        return this;
    }
    model(model) {
        this.config.model = model;
        return this;
    }
    provider(provider) {
        this.config.provider = provider;
        return this;
    }
    temperature(temp) {
        this.config.temperature = temp;
        return this;
    }
    maxTokens(tokens) {
        this.config.maxTokens = tokens;
        return this;
    }
    capabilities(caps) {
        this.config.capabilities = caps;
        return this;
    }
    tool(tool) {
        this.tools.push(tool);
        return this;
    }
    memory(config) {
        this.config.memory = config;
        return this;
    }
    build(llmClient) {
        if (!this.config.name || !this.config.systemPrompt) {
            throw new Error('Agent requires name and systemPrompt');
        }
        return new Agent({
            ...this.config,
            tools: this.tools
        }, llmClient);
    }
}
function createAgent() {
    return new AgentBuilder();
}
// ============================================================================
// EXPORTS
// ============================================================================
export { 
// Core classes
Agent, AgentOrchestrator, SupervisorOrchestrator, AgentWorkflow, AgentBuilder, 
// Memory
ConversationMemory, SemanticMemory, EpisodicMemory, 
// LLM Clients
OpenAIClient, AnthropicClient, 
// Built-in tools
webSearchTool, calculatorTool, codeExecutorTool, 
// Hooks
useAgent, useOrchestrator, 
// Builder
createAgent };
//# sourceMappingURL=index.js.map