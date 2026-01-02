# @philjs/ai - AI Integration Package

The `@philjs/ai` package provides tools for integrating AI capabilities into PhilJS applications, including RAG (Retrieval-Augmented Generation), code generation, analysis, and tool calling.

## Installation

```bash
npm install @philjs/ai
# or
pnpm add @philjs/ai
# or
bun add @philjs/ai
```

## Features

- **RAG (Retrieval-Augmented Generation)** - Document retrieval and context enhancement
- **Code Generation** - AI-powered component and function generation
- **Code Analysis** - Static analysis with AI insights
- **Tool Calling** - Function calling with AI models
- **Multi-Provider Support** - OpenAI, Anthropic, local models

## Quick Start

```tsx
import { createAI, useAI, useChat } from '@philjs/ai';

// Initialize AI client
const ai = createAI({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo'
});

function ChatInterface() {
  const { messages, sendMessage, isLoading } = useChat({
    ai,
    systemPrompt: 'You are a helpful assistant.'
  });

  return (
    <div class="chat">
      <MessageList messages={messages()} />
      <ChatInput
        onSubmit={sendMessage}
        disabled={isLoading()}
      />
    </div>
  );
}
```

## RAG (Retrieval-Augmented Generation)

### Setting Up RAG

```tsx
import {
  createRAG,
  createVectorStore,
  createEmbeddings
} from '@philjs/ai';

// Create embeddings provider
const embeddings = createEmbeddings({
  provider: 'openai',
  model: 'text-embedding-3-small'
});

// Create vector store
const vectorStore = createVectorStore({
  type: 'memory', // or 'pinecone', 'qdrant', 'supabase'
  embeddings
});

// Create RAG pipeline
const rag = createRAG({
  vectorStore,
  llm: ai,
  retrievalOptions: {
    topK: 5,
    minScore: 0.7
  }
});
```

### Indexing Documents

```tsx
// Index documents
await rag.index([
  {
    id: 'doc-1',
    content: 'PhilJS is a modern JavaScript framework...',
    metadata: { source: 'docs', category: 'introduction' }
  },
  {
    id: 'doc-2',
    content: 'Signals provide fine-grained reactivity...',
    metadata: { source: 'docs', category: 'core' }
  }
]);

// Index from files
await rag.indexFromFiles('./docs/**/*.md', {
  chunkSize: 1000,
  chunkOverlap: 200,
  extractMetadata: (file) => ({
    source: file.path,
    modified: file.mtime
  })
});

// Index from URL
await rag.indexFromURL('https://philjs.dev/docs', {
  maxDepth: 3,
  includePatterns: ['/docs/*']
});
```

### Querying with RAG

```tsx
// Simple query
const response = await rag.query('How do signals work in PhilJS?');
console.log(response.answer);
console.log(response.sources); // Retrieved documents

// With streaming
const stream = await rag.queryStream('Explain the router features');
for await (const chunk of stream) {
  process.stdout.write(chunk);
}

// In a component
function RAGChat() {
  const { query, answer, sources, isLoading } = useRAG({ rag });

  const handleAsk = async (question: string) => {
    await query(question);
  };

  return (
    <div>
      <SearchInput onSubmit={handleAsk} />
      {isLoading() && <Spinner />}
      {answer() && (
        <>
          <Answer text={answer()} />
          <Sources items={sources()} />
        </>
      )}
    </div>
  );
}
```

## Code Generation

### Component Generation

```tsx
import { generateComponent, generateFunction } from '@philjs/ai';

// Generate a component from description
const component = await generateComponent({
  ai,
  description: 'A user profile card with avatar, name, bio, and social links',
  framework: 'philjs',
  styling: 'tailwind',
  typescript: true
});

console.log(component.code);
// export function UserProfileCard({ user }: UserProfileCardProps) { ... }

console.log(component.types);
// interface UserProfileCardProps { ... }

// Generate with specific requirements
const form = await generateComponent({
  ai,
  description: 'A contact form',
  requirements: [
    'Use PhilJS forms with validation',
    'Include name, email, subject, message fields',
    'Show loading state on submit',
    'Display success/error messages'
  ],
  examples: ['./components/ExampleForm.tsx']
});
```

### Function Generation

```tsx
// Generate utility functions
const sortFunction = await generateFunction({
  ai,
  description: 'Sort an array of objects by multiple keys with direction',
  signature: 'sortByKeys<T>(array: T[], keys: SortKey<T>[]): T[]',
  tests: [
    'sortByKeys([{a:1,b:2}, {a:2,b:1}], [{key:"a", dir:"asc"}]) // [{a:1},{a:2}]'
  ]
});

// Generate API endpoint
const endpoint = await generateFunction({
  ai,
  description: 'REST endpoint for user CRUD operations',
  context: {
    database: 'Prisma',
    authentication: 'JWT',
    validation: 'Zod'
  }
});
```

## Code Analysis

### Static Analysis with AI

```tsx
import { analyzeCode, analyzeProject } from '@philjs/ai';

// Analyze a single file
const analysis = await analyzeCode({
  ai,
  code: readFileSync('./src/components/Dashboard.tsx', 'utf-8'),
  checks: ['performance', 'accessibility', 'security', 'best-practices']
});

console.log(analysis.issues);
// [
//   { type: 'performance', severity: 'warning', message: '...', line: 42 },
//   { type: 'accessibility', severity: 'error', message: '...', line: 67 }
// ]

console.log(analysis.suggestions);
// [
//   { type: 'refactor', description: '...', code: '...' }
// ]

// Analyze entire project
const projectAnalysis = await analyzeProject({
  ai,
  root: './src',
  include: ['**/*.tsx', '**/*.ts'],
  exclude: ['**/*.test.ts'],
  checks: ['architecture', 'patterns', 'dependencies']
});

console.log(projectAnalysis.summary);
console.log(projectAnalysis.recommendations);
```

### Code Review

```tsx
import { reviewCode, reviewPR } from '@philjs/ai';

// Review code changes
const review = await reviewCode({
  ai,
  diff: gitDiff,
  context: {
    projectType: 'web-app',
    guidelines: './CONTRIBUTING.md'
  }
});

console.log(review.summary);
console.log(review.comments); // Line-by-line comments
console.log(review.approval); // 'approve' | 'request-changes' | 'comment'

// Review GitHub PR
const prReview = await reviewPR({
  ai,
  repo: 'owner/repo',
  pr: 123,
  githubToken: process.env.GITHUB_TOKEN
});
```

## Tool Calling

### Defining Tools

```tsx
import { defineTool, createToolkit } from '@philjs/ai';

// Define a tool
const weatherTool = defineTool({
  name: 'get_weather',
  description: 'Get the current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name or coordinates'
      },
      units: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        default: 'celsius'
      }
    },
    required: ['location']
  },
  execute: async ({ location, units }) => {
    const weather = await fetchWeather(location, units);
    return {
      temperature: weather.temp,
      conditions: weather.conditions,
      humidity: weather.humidity
    };
  }
});

// Create toolkit
const toolkit = createToolkit([
  weatherTool,
  searchTool,
  calculatorTool
]);
```

### Using Tools in Chat

```tsx
const { messages, sendMessage } = useChat({
  ai,
  tools: toolkit,
  onToolCall: (tool, args) => {
    console.log(`Calling ${tool.name} with`, args);
  }
});

// User: "What's the weather in Tokyo?"
// AI: [calls get_weather tool]
// AI: "The current weather in Tokyo is 22°C with partly cloudy skies."
```

### Structured Output

```tsx
import { generateStructured } from '@philjs/ai';

// Generate structured data
const product = await generateStructured({
  ai,
  prompt: 'Generate a product listing for a wireless mouse',
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      description: { type: 'string' },
      price: { type: 'number' },
      features: { type: 'array', items: { type: 'string' } },
      category: { enum: ['electronics', 'accessories', 'peripherals'] }
    },
    required: ['name', 'description', 'price', 'features', 'category']
  }
});

// product is fully typed and validated
console.log(product.name);     // "Pro Wireless Mouse X1"
console.log(product.features); // ["2.4GHz wireless", "USB-C charging", ...]
```

## Multi-Provider Support

```tsx
import { createAI } from '@philjs/ai';

// OpenAI
const openai = createAI({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4-turbo'
});

// Anthropic
const anthropic = createAI({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-opus'
});

// Local (Ollama)
const local = createAI({
  provider: 'ollama',
  baseUrl: 'http://localhost:11434',
  model: 'llama3'
});

// Azure OpenAI
const azure = createAI({
  provider: 'azure',
  apiKey: process.env.AZURE_API_KEY,
  endpoint: process.env.AZURE_ENDPOINT,
  deployment: 'gpt-4'
});

// Use interchangeably
const response = await openai.chat([
  { role: 'user', content: 'Hello!' }
]);
```

## Streaming

```tsx
import { useChat, useCompletion } from '@philjs/ai';

// Streaming chat
function StreamingChat() {
  const { messages, sendMessage, streamingMessage } = useChat({
    ai,
    stream: true
  });

  return (
    <div>
      {messages().map(msg => (
        <Message key={msg.id} {...msg} />
      ))}
      {streamingMessage() && (
        <Message role="assistant" content={streamingMessage()} streaming />
      )}
    </div>
  );
}

// Streaming completion
function StreamingEditor() {
  const { complete, completion, isStreaming } = useCompletion({
    ai,
    stream: true
  });

  return (
    <div>
      <button onClick={() => complete('Write a poem about')}>
        Generate
      </button>
      <pre class={isStreaming() ? 'streaming' : ''}>
        {completion()}
      </pre>
    </div>
  );
}
```

## Caching and Rate Limiting

```tsx
const ai = createAI({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 1000
  },
  rateLimit: {
    requestsPerMinute: 60,
    tokensPerMinute: 100000
  },
  retry: {
    attempts: 3,
    delay: 1000,
    backoff: 'exponential'
  }
});
```

## TypeScript Types

```tsx
import type {
  AIClient,
  ChatMessage,
  ChatResponse,
  Tool,
  ToolCall,
  RAGConfig,
  EmbeddingResult,
  AnalysisResult
} from '@philjs/ai';

// Type-safe tool definition
const tool: Tool<{ query: string }, SearchResult[]> = {
  name: 'search',
  description: 'Search the web',
  parameters: { /* ... */ },
  execute: async ({ query }) => {
    return await searchWeb(query);
  }
};
```

## Best Practices

1. **Use streaming for long responses** - Better UX
2. **Implement caching** - Reduce costs and latency
3. **Handle rate limits gracefully** - Use queuing
4. **Validate AI outputs** - Don't trust blindly
5. **Use structured output** - For reliable parsing
6. **Provide context** - Better results with RAG
7. **Monitor costs** - Track token usage

## Next Steps

- [RAG Deep Dive](./rag.md)
- [Code Generation](./codegen.md)
- [Tool Calling](./tools.md)
- [Streaming](./streaming.md)
