# @philjs/ai-agents

Multi-agent AI orchestration framework for PhilJS with tool calling, memory systems, and workflows.

![Node 24+](https://img.shields.io/badge/Node-24%2B-brightgreen)
![TypeScript 6](https://img.shields.io/badge/TypeScript-6-blue)

## Features

- Agent definition with tools and capabilities
- Multi-agent orchestration and handoffs
- Tool/function calling with type safety
- Memory systems (conversation, semantic, episodic)
- Streaming responses with tool execution
- Agent workflows and pipelines
- Supervisor/worker patterns
- Human-in-the-loop integration

## Installation

```bash
npm install @philjs/ai-agents
```

## Usage

### Creating an Agent

```typescript
import { createAgent, OpenAIClient, calculatorTool } from '@philjs/ai-agents';

const client = new OpenAIClient(process.env.OPENAI_API_KEY);

const agent = createAgent()
  .name('Assistant')
  .description('A helpful AI assistant')
  .systemPrompt('You are a helpful assistant that can perform calculations.')
  .model('gpt-4-turbo-preview')
  .temperature(0.7)
  .tool(calculatorTool)
  .build(client);

// Chat with the agent
const response = await agent.chat('What is 25 * 4?');
console.log(response.message.content);
```

### Streaming Responses

```typescript
for await (const chunk of agent.stream('Tell me a story')) {
  if (chunk.type === 'text') {
    process.stdout.write(chunk.content);
  } else if (chunk.type === 'tool_call_start') {
    console.log('Calling tool:', chunk.toolCall?.name);
  } else if (chunk.type === 'tool_result') {
    console.log('Tool result:', chunk.toolResult?.result);
  }
}
```

### Custom Tools

```typescript
import { Agent, ToolDefinition } from '@philjs/ai-agents';

const weatherTool: ToolDefinition = {
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name'
      }
    },
    required: ['location']
  },
  handler: async (args, context) => {
    const weather = await fetchWeather(args.location);
    return { temperature: weather.temp, conditions: weather.conditions };
  }
};

agent.addTool(weatherTool);
```

### Multi-Agent Orchestration

```typescript
import { AgentOrchestrator, Agent } from '@philjs/ai-agents';

const codeAgent = createAgent()
  .name('CodeAgent')
  .capabilities(['code', 'programming', 'debug'])
  .systemPrompt('You are a coding expert.')
  .build(client);

const mathAgent = createAgent()
  .name('MathAgent')
  .capabilities(['math', 'calculate', 'statistics'])
  .systemPrompt('You are a mathematics expert.')
  .build(client);

const orchestrator = new AgentOrchestrator({
  agents: [codeAgent, mathAgent],
  maxHandoffs: 5
});

// Automatically routes to the appropriate agent
const response = await orchestrator.chat('Write a function to calculate fibonacci');
```

### Supervisor Pattern

```typescript
import { SupervisorOrchestrator } from '@philjs/ai-agents';

const supervisor = new SupervisorOrchestrator({
  supervisor: managerAgent,
  workers: [researchAgent, writerAgent, editorAgent]
});

// Supervisor delegates tasks to workers
const result = await supervisor.run(
  'Research AI trends and write a blog post about them'
);
```

### Agent Workflows

```typescript
import { AgentWorkflow } from '@philjs/ai-agents';

const workflow = new AgentWorkflow()
  .addStep({
    name: 'research',
    agent: researchAgent,
    inputMapper: (input) => `Research: ${input}`
  })
  .addStep({
    name: 'draft',
    agent: writerAgent,
    inputMapper: (prev, ctx) => `Write based on: ${prev}`
  })
  .addStep({
    name: 'edit',
    agent: editorAgent,
    condition: (ctx) => ctx.research.length > 100
  });

const { output, trace } = await workflow.run('AI in healthcare');
```

### Memory Systems

```typescript
import { ConversationMemory, SemanticMemory, EpisodicMemory } from '@philjs/ai-agents';

// Simple conversation memory
const convMemory = new ConversationMemory(100);

// Semantic memory with embeddings
const semanticMemory = new SemanticMemory(async (text) => {
  return await embeddings.create(text);
});

// Episodic memory with summaries
const episodicMemory = new EpisodicMemory(async (messages) => {
  return await summarize(messages);
});
```

### React Hook

```typescript
import { useAgent } from '@philjs/ai-agents';

function ChatComponent() {
  const { messages, isLoading, streamingContent, send, clear } = useAgent(agent);

  return (
    <div>
      {messages.map(m => <Message key={m.id} {...m} />)}
      {isLoading && <div>{streamingContent}</div>}
      <input onSubmit={(e) => send(e.target.value)} />
    </div>
  );
}
```

## API Reference

### Core Classes

| Class | Description |
|-------|-------------|
| `Agent` | Single AI agent with tools and memory |
| `AgentOrchestrator` | Multi-agent routing and coordination |
| `SupervisorOrchestrator` | Supervisor delegates to worker agents |
| `AgentWorkflow` | Sequential agent pipeline |
| `AgentBuilder` | Fluent builder for creating agents |

### LLM Clients

| Client | Description |
|--------|-------------|
| `OpenAIClient` | OpenAI GPT models |
| `AnthropicClient` | Anthropic Claude models |

### Memory Systems

| Memory | Description |
|--------|-------------|
| `ConversationMemory` | Simple message history |
| `SemanticMemory` | Embedding-based retrieval |
| `EpisodicMemory` | Episode summaries |

### Built-in Tools

| Tool | Description |
|------|-------------|
| `webSearchTool` | Search the web |
| `calculatorTool` | Math calculations |
| `codeExecutorTool` | Execute JavaScript |

### Types

```typescript
interface AgentConfig {
  name: string;
  description: string;
  systemPrompt: string;
  model?: string;
  provider?: 'openai' | 'anthropic' | 'google' | 'local';
  tools?: ToolDefinition[];
  memory?: MemoryConfig;
  capabilities?: string[];
}

interface ToolDefinition {
  name: string;
  description: string;
  parameters: { type: 'object'; properties: Record<string, any> };
  handler: (args: Record<string, any>, context: AgentContext) => Promise<any>;
}
```

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-ai-agents/src/index.ts

### Public API
- Direct exports: // Builder
  createAgent, // Built-in tools
  webSearchTool, // Core classes
  Agent, // Hooks
  useAgent, // LLM Clients
  OpenAIClient, // Memory
  ConversationMemory, // Types
  type Message, AgentBuilder, AgentConfig, AgentContext, AgentOrchestrator, AgentResponse, AgentWorkflow, AnthropicClient, EpisodicMemory, HandoffRequest, LLMClient, LLMRequest, Memory, MemoryConfig, OrchestratorConfig, SemanticMemory, StreamChunk, SupervisorConfig, SupervisorOrchestrator, ToolCall, ToolDefinition, ToolResult, UseAgentResult, WorkflowStep, calculatorTool, codeExecutorTool, useOrchestrator
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
