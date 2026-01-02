# Tool Calling & AI Agents

Tool calling lets AI models invoke your functions to perform actions, retrieve data, or interact with external systems. @philjs/ai provides a comprehensive tool system with type-safe definitions, built-in tools, and an agent framework.

## Why Tool Calling?

AI models can reason but can't act. Tool calling bridges this gap:
- **Data retrieval**: Search databases, APIs, files
- **Computation**: Calculate, transform, validate
- **Actions**: Send emails, create records, trigger workflows
- **Integration**: Connect to any service with an API

## Defining Tools

### Basic Tool Definition

```typescript
import { tool, createTool } from '@philjs/ai';

// Using the tool() builder
const greetTool = tool({
  name: 'greet',
  description: 'Return a personalized greeting for a user',
  parameters: {
    name: {
      type: 'string',
      description: 'The name of the person to greet',
      required: true,
    },
    formal: {
      type: 'boolean',
      description: 'Whether to use formal greeting',
      required: false,
    },
  },
  handler: async ({ name, formal }) => {
    const greeting = formal ? `Good day, ${name}` : `Hey ${name}!`;
    return { message: greeting };
  },
});

// Execute the tool
const result = await greetTool.execute({ name: 'Alice', formal: true });
console.log(result); // { message: 'Good day, Alice' }
```

### Convenience Function

```typescript
import { createTool } from '@philjs/ai';

const searchTool = createTool(
  'search_products',
  'Search for products in the catalog',
  {
    query: { type: 'string', description: 'Search query', required: true },
    category: {
      type: 'string',
      description: 'Product category',
      enum: ['electronics', 'clothing', 'books', 'home'],
      required: false,
    },
    maxResults: {
      type: 'number',
      description: 'Maximum results to return',
      required: false,
    },
  },
  async ({ query, category, maxResults = 10 }) => {
    const products = await searchProductCatalog(query, { category, limit: maxResults });
    return { products, count: products.length };
  }
);
```

### Complex Parameter Types

```typescript
const analyzeDataTool = tool({
  name: 'analyze_data',
  description: 'Analyze a dataset with specified metrics',
  parameters: {
    // Array parameter
    dataPoints: {
      type: 'array',
      description: 'Array of numeric data points',
      required: true,
      items: {
        type: 'number',
        description: 'A numeric value',
      },
    },
    // Object parameter
    options: {
      type: 'object',
      description: 'Analysis options',
      required: false,
      properties: {
        includeOutliers: {
          type: 'boolean',
          description: 'Include outlier detection',
        },
        precision: {
          type: 'number',
          description: 'Decimal precision for results',
        },
      },
    },
    // Enum parameter
    metrics: {
      type: 'string',
      description: 'Metrics to calculate',
      enum: ['mean', 'median', 'mode', 'stddev', 'all'],
      required: true,
    },
  },
  handler: async ({ dataPoints, options, metrics }) => {
    // Perform analysis
    return { result: { mean: 42, median: 40 } };
  },
});
```

## Built-in Tools

@philjs/ai includes several ready-to-use tools:

### Web Search Tool

```typescript
import { webSearchTool } from '@philjs/ai';

// Configure with your search provider
const search = tool({
  ...webSearchTool,
  handler: async ({ query, maxResults = 5 }) => {
    // Integrate with Serper, Tavily, SerpAPI, etc.
    const response = await fetch('https://api.search.com/search', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${SEARCH_API_KEY}` },
      body: JSON.stringify({ q: query, num: maxResults }),
    });
    return response.json();
  },
});
```

### Calculator Tool

Safe mathematical expression evaluation (no eval/Function):

```typescript
import { calculatorTool } from '@philjs/ai';

await calculatorTool.execute({ expression: '10 * 4 + 2' });
// { result: 42 }

await calculatorTool.execute({ expression: '(100 - 20) / 4' });
// { result: 20 }

await calculatorTool.execute({ expression: '15 % 4' });
// { result: 3 }

// Handles errors safely
await calculatorTool.execute({ expression: '10 / 0' });
// { error: 'Division by zero' }
```

### Weather Tool

```typescript
import { weatherTool } from '@philjs/ai';

// Configure with weather API
const weather = tool({
  ...weatherTool,
  handler: async ({ location, units = 'celsius' }) => {
    const data = await fetchWeatherAPI(location);
    const temp = units === 'fahrenheit'
      ? data.temp * 9/5 + 32
      : data.temp;
    return {
      temperature: temp,
      units,
      conditions: data.conditions,
      humidity: data.humidity,
    };
  },
});
```

### Code Execution Tool

```typescript
import { codeExecutionTool } from '@philjs/ai';

// Use with sandboxed execution (Web Workers, isolated-vm, etc.)
const codeExec = tool({
  ...codeExecutionTool,
  handler: async ({ code, language = 'javascript' }) => {
    // Execute in sandbox
    const result = await sandbox.evaluate(code, { timeout: 5000 });
    return { output: result, success: true };
  },
});
```

### File Read Tool

```typescript
import { fileReadTool } from '@philjs/ai';
import { readFile } from 'fs/promises';

// Server-side file reading
const fileRead = tool({
  ...fileReadTool,
  handler: async ({ path }) => {
    // Validate path is within allowed directories
    if (!isPathAllowed(path)) {
      return { error: 'Access denied' };
    }
    const content = await readFile(path, 'utf-8');
    return { content, path };
  },
});
```

## Tool Executor

Manage and execute multiple tools:

```typescript
import { ToolExecutor, calculatorTool, weatherTool, createTool } from '@philjs/ai';

const executor = new ToolExecutor();

// Register built-in tools
executor.register(calculatorTool);
executor.register(weatherTool);

// Register custom tools
executor.register(createTool(
  'get_user',
  'Get user by ID',
  { userId: { type: 'string', description: 'User ID', required: true } },
  async ({ userId }) => fetchUser(userId)
));

// Register multiple at once
executor.registerAll([tool1, tool2, tool3]);

// Execute a tool call
const result = await executor.execute({
  id: 'call_123',
  name: 'calculator',
  arguments: { expression: '2 + 2' },
});

// Execute multiple tool calls in parallel
const results = await executor.executeAll([
  { id: 'call_1', name: 'calculator', arguments: { expression: '10 * 5' } },
  { id: 'call_2', name: 'get_weather', arguments: { location: 'Tokyo' } },
]);

// Get tool definitions
const tools = executor.getToolDefinitions();

// Convert to provider-specific formats
const openaiTools = executor.toOpenAIFormat();
const anthropicTools = executor.toAnthropicFormat();
```

### Using with Providers

```typescript
import { createOpenAIProvider, ToolExecutor } from '@philjs/ai';
import OpenAI from 'openai';

const provider = createOpenAIProvider({ apiKey: 'sk-...' });
const executor = new ToolExecutor();
executor.registerAll([calculatorTool, weatherTool, searchTool]);

// Make completion with tools
const client = provider.getClient();
const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'What is 15% of 240?' }],
  tools: executor.toOpenAIFormat(),
});

// Handle tool calls
if (response.choices[0].message.tool_calls) {
  for (const toolCall of response.choices[0].message.tool_calls) {
    const result = await executor.execute({
      id: toolCall.id,
      name: toolCall.function.name,
      arguments: JSON.parse(toolCall.function.arguments),
    });
    console.log('Tool result:', result);
  }
}
```

## AI Agents

Build autonomous agents that reason and use tools:

```typescript
import { Agent, createAgent, tool } from '@philjs/ai';

// Define agent tools
const tools = [
  tool({
    name: 'search_knowledge',
    description: 'Search the knowledge base',
    parameters: {
      query: { type: 'string', description: 'Search query', required: true },
    },
    handler: async ({ query }) => searchKnowledgeBase(query),
  }),
  tool({
    name: 'send_email',
    description: 'Send an email',
    parameters: {
      to: { type: 'string', description: 'Recipient email', required: true },
      subject: { type: 'string', description: 'Email subject', required: true },
      body: { type: 'string', description: 'Email body', required: true },
    },
    handler: async (args) => sendEmail(args),
  }),
];

// Create an agent
const agent = createAgent({
  name: 'research-assistant',
  description: 'A research assistant that can search and summarize information',
  systemPrompt: `You are a helpful research assistant. Use the available tools to find information and help users with their questions. Think step by step.`,
  tools,
  maxIterations: 10,
});

// Run the agent
const answer = await agent.run(
  'Find information about PhilJS signals and email me a summary at user@example.com',
  (step) => {
    // Track agent progress
    console.log(`[${step.type}]`, step.content);
    if (step.toolCall) {
      console.log('  Tool:', step.toolCall.name);
      console.log('  Args:', step.toolCall.arguments);
    }
    if (step.toolResult) {
      console.log('  Result:', step.toolResult);
    }
  }
);

console.log('Final answer:', answer);
```

### Agent Steps

Agents emit steps as they work:

```typescript
interface AgentStep {
  type: 'thought' | 'action' | 'observation' | 'final_answer';
  content: string;
  toolCall?: ToolCall;
  toolResult?: any;
}

// Example agent execution trace:
// [thought] I need to search for information about PhilJS signals
// [action] Calling search_knowledge with query "PhilJS signals"
// [observation] Found 5 relevant articles...
// [thought] Now I'll summarize this and send an email
// [action] Calling send_email with summary
// [observation] Email sent successfully
// [final_answer] I've searched for information about PhilJS signals and sent a summary to your email.
```

## Parameter Definition Reference

```typescript
interface ParameterDef {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;      // Default: true
  enum?: string[];         // For string types with fixed values
  items?: ParameterDef;    // For array types
  properties?: Record<string, ParameterDef>;  // For object types
}
```

## Type-Safe Tool Definition

```typescript
import type { ToolDefinition, ToolCall } from '@philjs/ai';

// ToolDefinition type
interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;  // JSON Schema
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

// ToolCall type (from AI response)
interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}
```

## Best Practices

1. **Clear descriptions**: Write precise tool descriptions so the AI knows when to use them
2. **Validate inputs**: Check parameters before executing
3. **Handle errors**: Return error objects instead of throwing
4. **Sandbox execution**: Use isolated environments for code execution
5. **Rate limit**: Protect external API tools from abuse
6. **Log calls**: Track tool usage for debugging and monitoring

## Next Steps

- [RAG Pipeline](./rag.md) - Retrieval augmented generation
- [Streaming](./streaming.md) - Handle streaming responses
- [Overview](./overview.md) - Full @philjs/ai reference
