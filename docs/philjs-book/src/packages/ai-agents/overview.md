# @philjs/ai-agents

The `@philjs/ai-agents` package provides multi-agent AI orchestration for PhilJS applications, including agent definition, tool calling, memory systems, streaming responses, and workflow pipelines.

## Installation

```bash
npm install @philjs/ai-agents
```

## Features

- **Agent Definition** - Create agents with tools and capabilities
- **Multi-Agent Orchestration** - Route and handoff between agents
- **Tool/Function Calling** - Type-safe tool definitions and execution
- **Memory Systems** - Conversation, semantic, and episodic memory
- **Streaming Responses** - Real-time streaming with tool execution
- **Workflows** - Sequential agent pipelines with conditions
- **Supervisor/Worker** - Hierarchical agent delegation
- **LLM Clients** - OpenAI and Anthropic support

## Quick Start

```typescript
import {
  createAgent,
  OpenAIClient,
  calculatorTool,
} from '@philjs/ai-agents';

// Create LLM client
const client = new OpenAIClient(process.env.OPENAI_API_KEY!);

// Build an agent
const agent = createAgent()
  .name('Assistant')
  .description('A helpful AI assistant')
  .systemPrompt('You are a helpful assistant that can perform calculations.')
  .model('gpt-4-turbo-preview')
  .tool(calculatorTool)
  .temperature(0.7)
  .build(client);

// Chat with the agent
const response = await agent.chat('What is 25 * 4 + 10?');
console.log(response.message.content);

// Stream responses
for await (const chunk of agent.stream('Tell me a story')) {
  if (chunk.type === 'text') {
    process.stdout.write(chunk.content || '');
  }
}
```

---

## Agent Builder

Create agents with a fluent builder API:

```typescript
import { createAgent, Agent, AgentBuilder } from '@philjs/ai-agents';
import type { AgentConfig, ToolDefinition } from '@philjs/ai-agents';

const agent = createAgent()
  // Required
  .name('ResearchAgent')
  .systemPrompt(`You are a research assistant.
    You help users find and summarize information.
    Use the web_search tool to find information.`)

  // Optional configuration
  .description('Specialized in research and fact-checking')
  .model('gpt-4-turbo-preview')
  .provider('openai')
  .temperature(0.3)
  .maxTokens(4096)

  // Capabilities for routing
  .capabilities(['research', 'fact-checking', 'summarization'])

  // Add tools
  .tool(webSearchTool)
  .tool(calculatorTool)

  // Memory configuration
  .memory({
    type: 'conversation',
    maxMessages: 50,
  })

  // Build with LLM client
  .build(openaiClient);
```

### Agent Configuration

```typescript
interface AgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  model?: string;
  provider?: 'openai' | 'anthropic' | 'google' | 'local';
  tools?: ToolDefinition[];
  maxTokens?: number;
  temperature?: number;
  memory?: MemoryConfig;
  capabilities?: string[];
}
```

---

## Tools

### Defining Tools

```typescript
import type { ToolDefinition, AgentContext } from '@philjs/ai-agents';

const weatherTool: ToolDefinition = {
  name: 'get_weather',
  description: 'Get the current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name or coordinates',
      },
      units: {
        type: 'string',
        description: 'Temperature units',
        enum: ['celsius', 'fahrenheit'],
      },
    },
    required: ['location'],
  },
  handler: async (args, context: AgentContext) => {
    const { location, units = 'celsius' } = args;

    // Call weather API
    const response = await fetch(
      `https://api.weather.com/current?q=${location}&units=${units}`
    );
    const data = await response.json();

    return {
      location: data.location,
      temperature: data.temp,
      conditions: data.conditions,
      humidity: data.humidity,
    };
  },
};

// Add to agent
agent.addTool(weatherTool);
```

### Built-in Tools

```typescript
import {
  webSearchTool,
  calculatorTool,
  codeExecutorTool,
} from '@philjs/ai-agents';

// Web search
// Searches the web for information
const searchResult = await webSearchTool.handler({
  query: 'PhilJS framework',
  numResults: 5,
});

// Calculator
// Evaluates mathematical expressions
const calcResult = await calculatorTool.handler({
  expression: '(100 * 1.15) + 50',
});

// Code executor
// Executes JavaScript in a sandbox
const codeResult = await codeExecutorTool.handler({
  code: 'return [1, 2, 3].map(x => x * 2)',
});
```

### Dynamic Tool Registration

```typescript
// Add tool at runtime
agent.addTool({
  name: 'database_query',
  description: 'Query the database',
  parameters: {
    type: 'object',
    properties: {
      sql: { type: 'string', description: 'SQL query' },
    },
    required: ['sql'],
  },
  handler: async (args, context) => {
    // Execute query with context
    const userId = context.userId;
    return await db.query(args.sql, { userId });
  },
});

// Remove tool
agent.removeTool('database_query');
```

---

## Memory Systems

### Conversation Memory

Simple message history with limit:

```typescript
import { ConversationMemory } from '@philjs/ai-agents';

const memory = new ConversationMemory(100); // Keep last 100 messages

// Add messages
await memory.add({
  id: '1',
  role: 'user',
  content: 'Hello!',
  timestamp: new Date(),
});

// Get messages
const messages = await memory.getMessages(10); // Last 10

// Search messages
const results = await memory.search('weather', 5);

// Get summary
const summary = await memory.summarize();

// Clear
await memory.clear();
```

### Semantic Memory

Vector-based similarity search:

```typescript
import { SemanticMemory } from '@philjs/ai-agents';

// Create with embedding function
const memory = new SemanticMemory(async (text) => {
  // Call embedding API
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
});

// Add messages (automatically embedded)
await memory.add(message);

// Semantic search
const similar = await memory.search('How do I fix the bug?', 5);
// Returns messages with similar meaning, not just keywords
```

### Episodic Memory

Groups messages into summarized episodes:

```typescript
import { EpisodicMemory } from '@philjs/ai-agents';

// Create with summarization function
const memory = new EpisodicMemory(async (messages) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'Summarize this conversation in 2-3 sentences.',
      },
      {
        role: 'user',
        content: messages.map((m) => `${m.role}: ${m.content}`).join('\n'),
      },
    ],
  });
  return response.choices[0].message.content;
});

// Messages auto-grouped into episodes
await memory.add(message);

// End episode explicitly
await memory.endEpisode();

// Search across episode summaries
const results = await memory.search('project deadline');

// Full summary across all episodes
const fullSummary = await memory.summarize();
```

### Memory Configuration

```typescript
interface MemoryConfig {
  type: 'conversation' | 'semantic' | 'episodic' | 'hybrid';
  maxMessages?: number;
  vectorStore?: string;
  summarizeAfter?: number;
}

const agent = createAgent()
  .name('MemoryAgent')
  .systemPrompt('...')
  .memory({
    type: 'semantic',
    maxMessages: 1000,
  })
  .build(client);
```

---

## LLM Clients

### OpenAI Client

```typescript
import { OpenAIClient } from '@philjs/ai-agents';

const client = new OpenAIClient(
  process.env.OPENAI_API_KEY!,
  'https://api.openai.com/v1' // Optional custom base URL
);

// Use with agent
const agent = createAgent()
  .name('GPT Agent')
  .model('gpt-4-turbo-preview')
  .systemPrompt('You are helpful.')
  .build(client);
```

### Anthropic Client

```typescript
import { AnthropicClient } from '@philjs/ai-agents';

const client = new AnthropicClient(
  process.env.ANTHROPIC_API_KEY!,
  'https://api.anthropic.com/v1'
);

const agent = createAgent()
  .name('Claude Agent')
  .model('claude-3-opus-20240229')
  .systemPrompt('You are helpful.')
  .build(client);
```

### Custom LLM Client

```typescript
import type { LLMClient, LLMRequest, AgentResponse, StreamChunk } from '@philjs/ai-agents';

class CustomClient implements LLMClient {
  async complete(request: LLMRequest): Promise<AgentResponse> {
    // Implement your LLM call
    const response = await yourLLM.call({
      messages: request.messages,
      tools: request.tools,
      ...
    });

    return {
      message: {
        id: response.id,
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
      },
      finishReason: 'stop',
    };
  }

  async *stream(request: LLMRequest): AsyncGenerator<StreamChunk> {
    for await (const chunk of yourLLM.stream(request)) {
      yield { type: 'text', content: chunk.text };
    }
    yield { type: 'done' };
  }
}
```

---

## Streaming

### Basic Streaming

```typescript
for await (const chunk of agent.stream('Write a poem')) {
  switch (chunk.type) {
    case 'text':
      process.stdout.write(chunk.content || '');
      break;

    case 'tool_call_start':
      console.log('\nCalling tool:', chunk.toolCall?.name);
      break;

    case 'tool_call_args':
      // Tool arguments streaming
      break;

    case 'tool_result':
      console.log('Tool result:', chunk.toolResult?.result);
      break;

    case 'done':
      console.log('\nComplete!');
      break;

    case 'error':
      console.error('Error:', chunk.error);
      break;
  }
}
```

### Stream Chunk Types

```typescript
interface StreamChunk {
  type:
    | 'text'
    | 'tool_call_start'
    | 'tool_call_args'
    | 'tool_result'
    | 'done'
    | 'error';
  content?: string;
  toolCall?: Partial<ToolCall>;
  toolResult?: ToolResult;
  error?: string;
}
```

---

## Multi-Agent Orchestration

### Agent Orchestrator

Route messages to specialized agents:

```typescript
import { AgentOrchestrator } from '@philjs/ai-agents';
import type { OrchestratorConfig } from '@philjs/ai-agents';

const orchestrator = new AgentOrchestrator({
  agents: [
    researchAgent,
    codingAgent,
    writingAgent,
    mathAgent,
  ],

  // Custom routing logic
  router: async (message, agents) => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('code') || lowerMessage.includes('programming')) {
      return agents.find((a) => a.name === 'CodingAgent')!;
    }

    if (lowerMessage.includes('write') || lowerMessage.includes('essay')) {
      return agents.find((a) => a.name === 'WritingAgent')!;
    }

    // Default to research agent
    return agents.find((a) => a.name === 'ResearchAgent')!;
  },

  maxHandoffs: 5, // Prevent infinite loops
});

// Chat - automatically routes to best agent
const response = await orchestrator.chat('Write me a Python function');

// Stream
for await (const chunk of orchestrator.stream('Research AI trends')) {
  // ...
}
```

### Agent Handoffs

```typescript
import type { HandoffRequest } from '@philjs/ai-agents';

// Manual handoff between agents
await orchestrator.handoff({
  fromAgent: 'ResearchAgent',
  toAgent: 'WritingAgent',
  context: {
    researchFindings: 'Key findings about AI...',
    topic: 'Artificial Intelligence',
  },
  reason: 'Research complete, ready for article writing',
});

// Get handoff history
const history = orchestrator.getHandoffHistory();
```

---

## Supervisor-Worker Pattern

Hierarchical delegation with a supervisor agent:

```typescript
import { SupervisorOrchestrator } from '@philjs/ai-agents';
import type { SupervisorConfig } from '@philjs/ai-agents';

const supervisor = new SupervisorOrchestrator({
  supervisor: createAgent()
    .name('Supervisor')
    .systemPrompt('You coordinate a team of specialists.')
    .build(client),

  workers: [
    dataAnalystAgent,
    researcherAgent,
    writerAgent,
    reviewerAgent,
  ],

  delegationPrompt: `
    You are a project supervisor. Analyze tasks and delegate to workers:
    - DataAnalyst: Data analysis and statistics
    - Researcher: Finding information
    - Writer: Creating content
    - Reviewer: Quality checking

    Break complex tasks into subtasks and coordinate results.
  `,
});

// Supervisor analyzes task and delegates
const result = await supervisor.run(
  'Research AI trends, analyze the data, write a report, and review it'
);

// Streaming with delegation
for await (const chunk of supervisor.stream('Create a market analysis')) {
  // See supervisor's thinking and worker outputs
}
```

---

## Workflows

Sequential agent pipelines:

```typescript
import { AgentWorkflow } from '@philjs/ai-agents';
import type { WorkflowStep } from '@philjs/ai-agents';

const workflow = new AgentWorkflow();

// Define pipeline steps
workflow
  .addStep({
    name: 'research',
    agent: researchAgent,
    inputMapper: (input, context) => `Research: ${input}`,
    outputMapper: (response) => ({
      findings: response.message.content,
      sources: response.toolResults,
    }),
  })
  .addStep({
    name: 'analysis',
    agent: analysisAgent,
    inputMapper: (prev, context) =>
      `Analyze these findings: ${prev.findings}`,
    outputMapper: (response) => response.message.content,
  })
  .addStep({
    name: 'writing',
    agent: writingAgent,
    inputMapper: (prev, context) =>
      `Write a report based on: ${prev}`,
    condition: (context) => context.research?.findings?.length > 100,
  })
  .addStep({
    name: 'review',
    agent: reviewAgent,
    inputMapper: (prev) => `Review and improve: ${prev}`,
  });

// Set initial context
workflow.setContext({
  format: 'markdown',
  audience: 'technical',
});

// Run the workflow
const result = await workflow.run('Latest developments in quantum computing');

console.log('Final output:', result.output);
console.log('Trace:', result.trace);
// trace shows each step's input/output
```

---

## React Hooks

### useAgent

```typescript
import { useAgent } from '@philjs/ai-agents';
import type { UseAgentResult } from '@philjs/ai-agents';

function ChatComponent() {
  const {
    messages,
    isLoading,
    error,
    send,
    streamingContent,
    clear,
  } = useAgent(myAgent);

  async function handleSubmit(text: string) {
    await send(text);
  }

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id} className={msg.role}>
          {msg.content}
        </div>
      ))}

      {isLoading && (
        <div className="streaming">
          {streamingContent}
        </div>
      )}

      {error && <div className="error">{error.message}</div>}

      <input onSubmit={handleSubmit} />
      <button onClick={clear}>Clear</button>
    </div>
  );
}
```

### useOrchestrator

```typescript
import { useOrchestrator } from '@philjs/ai-agents';

function MultiAgentChat() {
  const {
    messages,
    isLoading,
    error,
    send,
    streamingContent,
    clear,
  } = useOrchestrator(orchestrator);

  // Same interface as useAgent
  // Automatically routes to appropriate agent
}
```

---

## Types Reference

```typescript
// Message
interface Message {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
  metadata?: Record<string, any>;
  timestamp: Date;
}

// Tool call
interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

// Tool result
interface ToolResult {
  toolCallId: string;
  result: any;
  error?: string;
}

// Agent response
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

// Agent context
interface AgentContext {
  agentId: string;
  conversationId: string;
  userId?: string;
  memory: Memory;
  metadata: Record<string, any>;
  abortSignal?: AbortSignal;
}
```

---

## API Reference

### Core Classes

| Export | Description |
|--------|-------------|
| `Agent` | AI agent class |
| `AgentBuilder` | Fluent agent builder |
| `createAgent` | Create builder instance |
| `AgentOrchestrator` | Multi-agent router |
| `SupervisorOrchestrator` | Supervisor-worker pattern |
| `AgentWorkflow` | Sequential pipelines |

### Memory

| Export | Description |
|--------|-------------|
| `ConversationMemory` | Simple message history |
| `SemanticMemory` | Vector-based memory |
| `EpisodicMemory` | Episode-based memory |

### LLM Clients

| Export | Description |
|--------|-------------|
| `OpenAIClient` | OpenAI API client |
| `AnthropicClient` | Anthropic API client |

### Built-in Tools

| Export | Description |
|--------|-------------|
| `webSearchTool` | Web search |
| `calculatorTool` | Math calculations |
| `codeExecutorTool` | Code execution |

### Hooks

| Export | Description |
|--------|-------------|
| `useAgent` | React hook for agent |
| `useOrchestrator` | Hook for orchestrator |

---

## Next Steps

- [AI Integration](../../integrations/ai.md)
- [@philjs/ai](../ai/overview.md)
- [RAG Patterns](../../patterns/rag.md)
