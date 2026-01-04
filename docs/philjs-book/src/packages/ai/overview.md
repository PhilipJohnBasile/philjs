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

## Core Concepts

### Provider Interface

All AI providers implement the `AIProvider` interface:

```typescript
interface AIProvider {
  name: string;
  generateCompletion(prompt: string, options?: CompletionOptions): Promise<string>;
  generateStreamCompletion?(prompt: string, options?: CompletionOptions): AsyncIterableIterator<string>;
  analyzeImage?(image: ImageInput, prompt: string, options?: VisionOptions): Promise<VisionResult>;
  embed?(texts: string[]): Promise<number[][]>;
}

interface CompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  systemPrompt?: string;
}
```

### The AI Client

The `createAIClient()` function creates a comprehensive client with all capabilities:

```typescript
import { createAIClient, createOpenAIProvider } from '@philjs/ai';

const ai = createAIClient(createOpenAIProvider({ apiKey: 'sk-...' }));

// Access all generators and tools
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

The AI client provides high-level convenience methods:

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

## Documentation Structure

This documentation is organized into the following sections:

- **[Providers](./providers.md)** - Multi-provider support (OpenAI, Anthropic, Gemini, Cohere, LM Studio, Ollama)
- **[Code Generation](./codegen.md)** - AI-powered component, page, API, and function generation
- **[RAG](./rag.md)** - Retrieval-Augmented Generation with vector stores
- **[Streaming](./streaming.md)** - Streaming responses for real-time UI
- **[Tool Calling](./tools.md)** - Build AI agents with function calling
- **[Caching](./caching.md)** - Prompt caching with memory and Redis backends
- **[Structured Output](./structured-output.md)** - Type-safe responses with Zod validation
- **[Observability](./observability.md)** - Token tracking, cost monitoring, telemetry
- **[API Reference](./api-reference.md)** - Complete API documentation

## TypeScript Types

All major types are exported for use:

```typescript
import type {
  AIProvider,
  CompletionOptions,
  ImageInput,
  VisionOptions,
  VisionResult,
  ToolDefinition,
  ToolCall,
  Document,
  VectorStore,
  SearchResult,
  RAGOptions,
  CacheConfig,
  CacheStats,
  AIMetrics,
  AIEvent,
  AIBudget,
} from '@philjs/ai';
```

## Best Practices

1. **Use streaming for long responses** - Provides better user experience
2. **Implement caching** - Reduces costs and improves latency
3. **Handle rate limits gracefully** - Use retry logic with exponential backoff
4. **Validate AI outputs** - Use structured output with Zod schemas
5. **Use structured output** - For reliable, type-safe parsing
6. **Provide context** - Better results with RAG and project context
7. **Monitor costs** - Use observability to track token usage and spending
8. **Set budgets** - Prevent runaway costs with budget limits

## Next Steps

- [Providers Deep Dive](./providers.md)
- [Code Generation](./codegen.md)
- [RAG Pipeline](./rag.md)
- [Tool Calling](./tools.md)
- [Streaming](./streaming.md)
- [Caching](./caching.md)
- [Structured Output](./structured-output.md)
- [Observability](./observability.md)
- [API Reference](./api-reference.md)
