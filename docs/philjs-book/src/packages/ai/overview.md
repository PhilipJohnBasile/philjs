# @philjs/ai - AI-Powered Development

**The most comprehensive AI toolkit for JavaScript frameworks.**

@philjs/ai brings artificial intelligence directly into your development workflow with support for multiple AI providers, intelligent code generation, automated testing, RAG pipelines, vision capabilities, caching, observability, and much more.

## Installation

```bash
npm install @philjs/ai
# or
pnpm add @philjs/ai
# or
bun add @philjs/ai
```

## Why @philjs/ai?

Building AI-powered applications typically requires:
- Managing multiple AI provider SDKs
- Handling streaming, caching, and rate limiting
- Building RAG pipelines from scratch
- Writing boilerplate for structured outputs
- Tracking costs and usage

@philjs/ai provides a unified, type-safe API that handles all of this.

## Feature Overview

| Feature | Description |
|---------|-------------|
| **Multi-Provider** | OpenAI, Anthropic, Gemini, Cohere, LM Studio, Ollama |
| **AI Assistant** | Natural language code generation, chat, refactoring |
| **Code Generation** | Components, pages, APIs, functions from descriptions |
| **Code Analysis** | Anti-pattern detection, optimization suggestions |
| **RAG Pipeline** | Vector stores, document loaders, chunking |
| **Vision** | GPT-4V, Claude Vision for image analysis |
| **Tool Calling** | Build AI agents with function calling |
| **Structured Output** | Zod validation for type-safe AI responses |
| **Caching** | Memory and Redis caching with semantic matching |
| **Observability** | Token tracking, cost monitoring, telemetry |
| **LSP Integration** | Language server for IDE support |

## Quick Start

```typescript
import { createAIClient, createOpenAIProvider, autoDetectProvider } from '@philjs/ai';

// Create a provider
const provider = createOpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY
});

// Or auto-detect from environment variables
const autoProvider = autoDetectProvider();

// Create a full-featured AI client
const ai = createAIClient(provider);

// Generate a component from natural language
const component = await ai.generateComponent(
  'A user profile card with avatar, name, and bio',
  'UserProfileCard'
);

// Analyze code
const analysis = await ai.analyzeComponent(component.code);

// Refactor with AI
const optimized = await ai.refactorCode(
  component.code,
  'optimize for performance'
);

// Generate tests
const tests = await ai.generateTestSuite(component.code);
```

## AI Providers

### OpenAI Provider

```typescript
import { createOpenAIProvider, OpenAIProvider } from '@philjs/ai';

const provider = createOpenAIProvider({
  apiKey: 'sk-...',
  baseURL: 'https://api.openai.com/v1', // optional
  organization: 'org-...', // optional
  defaultModel: 'gpt-4o', // default
  embeddingModel: 'text-embedding-3-small', // default
});

// Or instantiate directly
const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
  defaultModel: 'gpt-4-turbo',
});
```

**Supported Features:**
- Text completion (GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo)
- Vision (GPT-4V, GPT-4o)
- Embeddings (text-embedding-3-small, text-embedding-3-large)
- JSON mode for structured output

### Anthropic Provider

```typescript
import { createAnthropicProvider, AnthropicProvider } from '@philjs/ai';

const provider = createAnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultModel: 'claude-3-5-sonnet-20241022',
});

// Vision support
const result = await provider.analyzeImage(
  { type: 'url', url: 'https://example.com/chart.png' },
  'What trends do you see in this chart?'
);
```

**Supported Features:**
- Text completion (Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku)
- Vision (Claude 3 models)
- 200K context window

### Gemini Provider

```typescript
import { createGeminiProvider } from '@philjs/ai';

const provider = createGeminiProvider({
  apiKey: process.env.GOOGLE_AI_API_KEY,
  model: 'gemini-pro',
});
```

### Cohere Provider

```typescript
import { createCohereProvider } from '@philjs/ai';

const provider = createCohereProvider({
  apiKey: process.env.COHERE_API_KEY,
  model: 'command-r-plus',
});
```

### LM Studio Provider

```typescript
import { createLMStudioProvider } from '@philjs/ai';

const provider = createLMStudioProvider({
  baseURL: 'http://localhost:1234/v1',
  model: 'local-model',
});
```

### Local Provider (Ollama)

```typescript
import { createLocalProvider } from '@philjs/ai';

const provider = createLocalProvider({
  baseURL: 'http://localhost:11434',
  model: 'llama3',
});
```

### Auto-Detection

```typescript
import { autoDetectProvider } from '@philjs/ai';

// Automatically detects from environment variables:
// - OPENAI_API_KEY -> OpenAI
// - ANTHROPIC_API_KEY -> Anthropic
// - GOOGLE_AI_API_KEY -> Gemini
// - COHERE_API_KEY -> Cohere
const provider = autoDetectProvider();
```

## AI Assistant

The `AIAssistant` class provides a unified interface for AI-powered development:

```typescript
import { AIAssistant, createAIAssistant, createOpenAIProvider } from '@philjs/ai';

const assistant = new AIAssistant({
  provider: createOpenAIProvider({ apiKey: 'sk-...' }),
  projectContext: {
    name: 'my-app',
    rootPath: '/path/to/project',
    files: new Map(),
    dependencies: ['@philjs/core', '@philjs/router'],
    type: 'philjs',
  },
  defaultOptions: {
    temperature: 0.3,
    maxTokens: 4096,
  },
  enableCache: true,
  debug: false,
});

// Natural language code generation
const result = await assistant.generateCode({
  description: 'A todo list with drag-and-drop reordering',
  type: 'component',
  context: {
    includeTests: true,
    includeDocs: true
  },
});

// Chat with context
const response = await assistant.chat(
  'How can I add keyboard shortcuts to this component?'
);

// Get refactoring suggestions
const suggestions = await assistant.refactor({
  code: myCode,
  focus: ['performance', 'accessibility'],
  maxSuggestions: 5,
});

// Explain code
const explanation = await assistant.explainCode(myCode);

// Review code
const review = await assistant.reviewCode(myCode, {
  focus: ['bugs', 'performance', 'security'],
});

// Error explanation
const errorHelp = await assistant.explainError(
  'TypeError: Cannot read property "map" of undefined',
  myCode
);
```

## AI Client

The `createAIClient` function creates a comprehensive client with all code generation capabilities:

```typescript
import { createAIClient, createOpenAIProvider } from '@philjs/ai';

const ai = createAIClient(createOpenAIProvider({ apiKey: 'sk-...' }));

// Access all generators
ai.componentGenerator    // Component generation
ai.pageGenerator         // Page generation
ai.apiGenerator          // API generation
ai.autocomplete          // Code completion
ai.refactoring           // Refactoring engine
ai.testGenerator         // Test generation
ai.docGenerator          // Documentation generation
ai.codeGenerator         // Unified code generation
ai.analyzer              // Code analysis

// Enhanced modules
ai.naturalLanguageGenerator  // Natural language to code
ai.componentSuggester        // Component suggestions
ai.advancedRefactoring       // Advanced refactoring
ai.documentationGenerator    // Enhanced documentation
ai.advancedTestGenerator     // Enhanced test generation
ai.typeInferenceHelper       // Type inference
ai.schemaToComponent         // Schema to component
```

### Convenience Methods

```typescript
// Generate component
const component = await ai.generateComponent(
  'A pricing card with monthly/yearly toggle',
  'PricingCard'
);

// Generate function
const func = await ai.generateFunction(
  'Calculate compound interest with monthly contributions'
);

// Generate page
const page = await ai.generatePage(
  'A dashboard with charts and user stats',
  'Dashboard',
  '/dashboard'
);

// Generate CRUD API
const api = await ai.generateAPI('products', {
  id: 'string',
  name: 'string',
  price: 'number',
});

// Refactor code
const refactored = await ai.refactorCode(code, 'convert to signals');

// Explain code
const explanation = await ai.explainCode(code);

// Generate tests
const tests = await ai.generateTests(code, 'unit');

// Analyze component
const analysis = await ai.analyzeComponent(code);

// Detect anti-patterns
const antiPatterns = await ai.detectAntiPatterns(code);

// Get inline completion (Copilot-style)
const completion = await ai.getInlineCompletion(prefix, suffix);

// Add documentation
const documented = await ai.addDocs(code, 'jsdoc');

// Generate from natural language
const generated = await ai.generateFromDescription(
  'Create a form that validates email and password'
);

// Parse intent
const intent = await ai.parseIntent('Make a button that submits data');

// Suggest components for context
const suggestions = await ai.suggestComponents({
  fileContent: currentFile,
  cursorPosition: { line: 10, column: 5 },
  filePath: './src/App.tsx',
});

// Infer types
const types = await ai.inferTypes(jsCode);

// Convert JS to TS
const tsCode = await ai.jsToTs(jsCode);

// Generate from schema
const components = await ai.componentsFromSchema(jsonSchema, {
  schemaType: 'json-schema',
  componentTypes: ['form', 'table', 'detail'],
});
```

## Vision Capabilities

Analyze images with GPT-4V and Claude Vision:

```typescript
import { createOpenAIProvider, createAnthropicProvider } from '@philjs/ai';

const openai = createOpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = createAnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY });

// Analyze an image by URL
const result = await openai.analyzeImage(
  { type: 'url', url: 'https://example.com/chart.png' },
  'What trends do you see in this chart?'
);

console.log(result.content);
console.log(result.usage); // { inputTokens, outputTokens, totalTokens }

// Analyze a local file
const fileResult = await anthropic.analyzeImage(
  { type: 'file', path: './screenshot.png' },
  'Describe what you see in this UI'
);

// Base64 encoded image
const base64Result = await openai.analyzeImage(
  {
    type: 'base64',
    data: imageBase64String,
    mediaType: 'image/png'
  },
  'What is in this image?'
);

// Compare multiple images
const comparison = await openai.compareImages(
  [
    { type: 'file', path: './design-v1.png' },
    { type: 'file', path: './design-v2.png' },
  ],
  'What are the key differences between these designs?'
);

// Extract structured data from images
const invoice = await openai.extractFromImage<{
  invoiceNumber: string;
  total: number;
  items: Array<{ name: string; price: number }>;
}>(
  { type: 'url', url: 'https://example.com/invoice.png' },
  'Extract the invoice number, total, and line items as JSON'
);
```

### Vision Options

```typescript
interface VisionOptions {
  model?: string;           // Override model (e.g., 'gpt-4o')
  maxTokens?: number;       // Max response tokens
  temperature?: number;     // Response creativity
  systemPrompt?: string;    // Custom system prompt
  detail?: 'low' | 'high' | 'auto';  // Image detail level
  additionalImages?: ImageInput[];   // Multiple images
}

// High detail analysis
await provider.analyzeImage(image, prompt, {
  detail: 'high',
  maxTokens: 4096,
});
```

## Prompt Caching

Reduce API costs and latency with intelligent caching:

```typescript
import {
  CachedAIProvider,
  createCachedProvider,
  createMemoryCache,
  createRedisCache,
  createOpenAIProvider
} from '@philjs/ai';

// In-memory cache
const cachedProvider = createCachedProvider(
  createOpenAIProvider({ apiKey: 'sk-...' }),
  {
    storage: createMemoryCache(1000), // Max 1000 entries
    ttl: 30 * 60 * 1000,              // 30 minute TTL
    semanticMatching: false,
  }
);

// First call hits the API
const result1 = await cachedProvider.generateCompletion('Explain signals');

// Second call returns cached response instantly
const result2 = await cachedProvider.generateCompletion('Explain signals');

// Check cache statistics
const stats = await cachedProvider.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`Saved tokens: ${stats.savedTokens}`);
console.log(`Saved cost: $${stats.savedCost.toFixed(4)}`);

// Clear the cache
await cachedProvider.clearCache();

// Invalidate specific prompt
await cachedProvider.invalidate('Explain signals');
```

### Semantic Caching

Match semantically similar prompts to cache entries:

```typescript
const semanticCache = createCachedProvider(provider, {
  storage: createMemoryCache(1000),
  ttl: 60 * 60 * 1000, // 1 hour
  semanticMatching: true,
  similarityThreshold: 0.95, // 95% similarity required
  embeddingProvider: provider, // Must support embed()
});

// These will hit the same cache entry
await semanticCache.generateCompletion('What are signals?');
await semanticCache.generateCompletion('What is a signal?');
await semanticCache.generateCompletion('Explain what signals are');
```

### Redis Caching

```typescript
import { createClient } from 'redis';
import { createRedisCache, createCachedProvider } from '@philjs/ai';

const redis = createClient({ url: 'redis://localhost:6379' });
await redis.connect();

const cachedProvider = createCachedProvider(provider, {
  storage: createRedisCache(redis, 'myapp:ai:cache:'),
  ttl: 60 * 60 * 1000, // 1 hour
});
```

### Function Caching Decorator

```typescript
import { withCache, createMemoryCache } from '@philjs/ai';

const summarize = withCache(
  async (text: string) => provider.generateCompletion(`Summarize: ${text}`),
  { storage: createMemoryCache(), ttl: 30 * 60 * 1000 }
);

// Cached automatically
const summary1 = await summarize(longText);
const summary2 = await summarize(longText); // From cache
```

## Structured Output with Zod

Type-safe AI responses with automatic validation and retries:

```typescript
import {
  generateStructured,
  streamStructured,
  extractArray,
  extractWithFallback,
  commonSchemas,
  StructuredOutputError
} from '@philjs/ai';
import { z } from 'zod';

// Use built-in common schemas
const sentiment = await generateStructured(
  provider,
  'Analyze the sentiment: "This product is amazing!"',
  commonSchemas.sentiment
);
// { sentiment: 'positive', confidence: 0.95, explanation: '...' }

const entities = await generateStructured(
  provider,
  'Extract entities: John Smith works at Acme Corp in New York',
  commonSchemas.entities
);
// { entities: [{ text: 'John Smith', type: 'person' }, ...] }

// Custom schema
const userSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
  interests: z.array(z.string()),
  address: z.object({
    city: z.string(),
    country: z.string(),
  }).optional(),
});

const user = await generateStructured(
  provider,
  'Extract: John Doe, 30 years old, john@example.com, likes coding and music',
  userSchema,
  {
    maxRetries: 3,           // Retry on validation failure
    includeErrorInRetry: true, // Include error in retry prompt
    onValidationError: (error, attempt) => {
      console.log(`Attempt ${attempt} failed:`, error.errors);
    },
  }
);

console.log(user.data);     // Validated data
console.log(user.raw);      // Raw AI response
console.log(user.attempts); // Number of attempts
```

### Extract Arrays

```typescript
const products = await extractArray(
  provider,
  'List 5 popular smartphones with their prices',
  z.object({
    name: z.string(),
    brand: z.string(),
    price: z.number(),
  })
);
// [{ name: 'iPhone 15', brand: 'Apple', price: 999 }, ...]
```

### Streaming Structured Output

```typescript
const schema = z.object({
  items: z.array(z.object({
    name: z.string(),
    price: z.number(),
  })),
});

for await (const partial of streamStructured(provider, prompt, schema)) {
  if (partial.complete) {
    console.log('Final:', partial.data);
  } else {
    console.log('Partial:', partial.raw);
  }
}
```

### Built-in Schemas

```typescript
commonSchemas.sentiment    // Sentiment analysis
commonSchemas.entities     // Named entity recognition
commonSchemas.summary      // Text summarization
commonSchemas.classification // Category classification
commonSchemas.translation  // Language translation
```

## Observability & Telemetry

Track usage, costs, and performance:

```typescript
import {
  ObservableAIProvider,
  createObservableProvider,
  ConsoleExporter,
  HttpExporter,
  FileExporter,
  MODEL_COSTS,
  calculateCost,
  BudgetExceededError
} from '@philjs/ai';

const observable = createObservableProvider(provider, {
  trackTokens: true,
  trackCosts: true,
  budget: {
    maxCostUSD: 10.00,        // $10 budget
    maxTokens: 100000,        // 100K token limit
    warningThresholdPercent: 80,
    onWarning: (metrics) => {
      console.warn('Budget warning!', {
        cost: metrics.totalCost,
        tokens: metrics.totalTokens,
      });
    },
    onLimitExceeded: (type) => {
      throw new BudgetExceededError(`${type} budget exceeded`);
    },
  },
  exporters: [
    new ConsoleExporter(),  // Log to console
    new HttpExporter({      // Send to monitoring service
      endpoint: 'https://telemetry.example.com/ai',
      headers: { 'Authorization': 'Bearer ...' },
    }),
    new FileExporter({      // Write to file
      path: './ai-metrics.jsonl',
    }),
  ],
});

// All calls are tracked
await observable.generateCompletion('Hello');

// Get current metrics
const metrics = observable.getMetrics();
console.log(`Requests: ${metrics.totalRequests}`);
console.log(`Tokens: ${metrics.totalTokens}`);
console.log(`Cost: $${metrics.totalCost.toFixed(4)}`);
console.log(`Avg latency: ${metrics.averageLatency}ms`);
console.log(`Error rate: ${(metrics.errorRate * 100).toFixed(1)}%`);

// Get request history
const events = observable.getEvents();

// Reset metrics
observable.resetMetrics();

// Calculate cost for specific usage
const cost = calculateCost('gpt-4o', 1000, 500); // model, input, output tokens
```

### Model Costs

```typescript
// Built-in cost data for popular models
MODEL_COSTS['gpt-4o']                  // { input: 0.005, output: 0.015 }
MODEL_COSTS['gpt-4-turbo']             // { input: 0.01, output: 0.03 }
MODEL_COSTS['claude-3-5-sonnet']       // { input: 0.003, output: 0.015 }
MODEL_COSTS['claude-3-opus']           // { input: 0.015, output: 0.075 }
MODEL_COSTS['gemini-pro']              // { input: 0.00025, output: 0.0005 }
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
