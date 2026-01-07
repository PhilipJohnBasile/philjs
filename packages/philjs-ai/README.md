# @philjs/ai

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

AI utilities for PhilJS - agent orchestration, code generation, analysis, RAG, and ML integration.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Installation

```bash
pnpm add @philjs/ai
```

## Features

- **Agent Orchestration** - Build autonomous agents with tool execution
- **Code Generation** - Generate components, routes, and tests with AI
- **Code Analysis** - Review code, detect issues, get refactoring suggestions
- **RAG (Retrieval Augmented Generation)** - Vector stores and document retrieval
- **Structured Outputs** - Type-safe AI responses with Zod schemas
- **Multi-Provider Support** - OpenAI, Anthropic, and local models
- **Streaming** - Real-time streaming completions
- **Vision** - Image analysis capabilities
- **Tool Calling** - Function execution with AI

## Usage

### Basic Agent

```typescript
import { Agent, Tool } from '@philjs/ai';

// Define tools for the agent
const searchTool = new Tool({
  name: 'search',
  description: 'Search the codebase for relevant files',
  execute: async (query: string) => {
    // Implementation
    return { files: ['src/index.ts', 'src/utils.ts'] };
  }
});

// Create an agent
const agent = new Agent({
  name: 'CodeAssistant',
  model: 'gpt-4o',
  instruction: 'You are a helpful coding assistant.',
  tools: [searchTool]
});

// Run the agent
const response = await agent.run('Find all utility functions');
console.log(response);
```

### Code Generation

```typescript
import { generateComponent, generateRoute, generateTests } from '@philjs/ai';

// Generate a PhilJS component
const component = await generateComponent({
  description: 'A counter component with increment/decrement buttons',
  includeTests: true,
  includeStyles: true,
  useSignals: true,
});

console.log(component.code);
console.log(component.tests);

// Generate a route with data loading
const route = await generateRoute({
  description: 'User profile page',
  path: '/users/:id',
  includeLoader: true,
  includeAction: true,
});

console.log(route.code);
```

### Code Review

```typescript
import { reviewCode } from '@philjs/ai';

const review = await reviewCode({
  code: `
    function getData() {
      return fetch('/api/data')
        .then(r => r.json());
    }
  `,
  reviewAspects: ['bugs', 'performance', 'security'],
});

console.log(review.issues);
console.log(review.suggestions);
console.log(review.overallScore);
```

### Refactoring Suggestions

```typescript
import { suggestRefactoring } from '@philjs/ai';

const suggestions = await suggestRefactoring({
  code: existingCode,
  focusAreas: ['signals', 'performance', 'accessibility'],
  includeExplanations: true,
});

for (const suggestion of suggestions) {
  console.log(`${suggestion.type}: ${suggestion.description}`);
  console.log(`Before:\n${suggestion.before}`);
  console.log(`After:\n${suggestion.after}`);
}
```

### RAG (Retrieval Augmented Generation)

```typescript
import { VectorStore, createRAGChain } from '@philjs/ai';

// Create a vector store
const store = new VectorStore();

// Add documents
await store.addDocuments([
  { id: '1', content: 'PhilJS uses signals for reactivity', metadata: { source: 'docs' } },
  { id: '2', content: 'Signals are fine-grained reactive primitives', metadata: { source: 'docs' } },
]);

// Create a RAG chain
const chain = createRAGChain({
  vectorStore: store,
  model: 'gpt-4o',
  topK: 5,
});

// Query with context
const answer = await chain.query('How does PhilJS handle reactivity?');
console.log(answer);
```

### Structured Outputs

```typescript
import { generateStructured } from '@philjs/ai';
import { z } from 'zod';

const schema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
  tags: z.array(z.string()),
});

const result = await generateStructured({
  prompt: 'Create a task for implementing user authentication',
  schema,
  model: 'gpt-4o',
});

// result is typed as { title: string, description: string, priority: 'low' | 'medium' | 'high', tags: string[] }
console.log(result.title, result.priority);
```

### Streaming Completions

```typescript
import { streamCompletion } from '@philjs/ai';

const stream = streamCompletion({
  prompt: 'Explain signals in PhilJS',
  model: 'gpt-4o',
});

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

### Vision Analysis

```typescript
import { analyzeImage } from '@philjs/ai';

const result = await analyzeImage({
  image: { type: 'url', url: 'https://example.com/screenshot.png' },
  prompt: 'Describe the UI elements in this screenshot',
  detail: 'high',
});

console.log(result.content);
console.log(result.detections);
```

### Migration Assistance

```typescript
import { migrateFromReact } from '@philjs/ai';

const result = await migrateFromReact({
  code: reactCode,
  preserveComments: true,
  convertHooks: true,
});

console.log(result.code);
console.log(result.changes);
console.log(result.manualSteps);
```

## Providers

### OpenAI

```typescript
import { createOpenAIProvider } from '@philjs/ai';

const provider = createOpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o',
});
```

### Anthropic

```typescript
import { createAnthropicProvider } from '@philjs/ai';

const provider = createAnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4-20250514',
});
```

## API

### Agent

- `new Agent(config)` - Create an AI agent
- `agent.run(input)` - Run the agent with input
- `agent.addTool(tool)` - Add a tool to the agent

### Code Generation

- `generateComponent(options)` - Generate a PhilJS component
- `generateRoute(options)` - Generate a route file
- `generateTests(options)` - Generate tests for code

### Code Analysis

- `reviewCode(options)` - Review code for issues
- `suggestRefactoring(options)` - Get refactoring suggestions
- `explainError(error)` - Get explanation for an error
- `generateDocumentation(options)` - Generate JSDoc/TSDoc

### RAG

- `VectorStore` - In-memory vector storage
- `createRAGChain(config)` - Create a RAG pipeline
- `embedTexts(texts)` - Generate embeddings

### Structured Outputs

- `generateStructured(options)` - Generate typed output with Zod schema

### Streaming

- `streamCompletion(options)` - Stream completion tokens

### Vision

- `analyzeImage(options)` - Analyze images with vision models

## Related Packages

- [@philjs/test](../philjs-test) - AI-powered testing
- [@philjs/docs](../philjs-docs) - Self-writing documentation

## Book

See the [Agents & AI](../../docs/philjs-book/src/packages/ai/agents.md) chapter in the PhilJS book.

## License

MIT
