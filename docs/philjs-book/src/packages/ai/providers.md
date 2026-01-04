# AI Providers

@philjs/ai supports multiple AI providers through a unified interface. Each provider implements the `AIProvider` interface, allowing you to switch between providers without changing your application code.

## Provider Interface

All providers implement this common interface:

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

## OpenAI Provider

The OpenAI provider supports GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo, vision capabilities, and embeddings.

### Configuration

```typescript
import { createOpenAIProvider, OpenAIProvider } from '@philjs/ai';

// Using factory function
const provider = createOpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: 'https://api.openai.com/v1', // optional, for proxies
  organization: 'org-...',               // optional
  defaultModel: 'gpt-4o',                // default: 'gpt-4o'
  embeddingModel: 'text-embedding-3-small', // default
});

// Or instantiate directly
const provider = new OpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  defaultModel: 'gpt-4-turbo',
});
```

### OpenAIConfig

```typescript
interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
  organization?: string;
  defaultModel?: string;      // Default: 'gpt-4o'
  embeddingModel?: string;    // Default: 'text-embedding-3-small'
}
```

### Text Completion

```typescript
// Simple completion
const response = await provider.generateCompletion(
  'Explain quantum computing in simple terms',
  {
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: 'You are a helpful science teacher.',
  }
);

console.log(response);
```

### Streaming Completion

```typescript
// Streaming for real-time display
for await (const chunk of provider.generateStreamCompletion(
  'Write a short story about a robot',
  { model: 'gpt-4o', maxTokens: 500 }
)) {
  process.stdout.write(chunk);
}
```

### Vision (Image Analysis)

OpenAI supports GPT-4V and GPT-4o for image analysis:

```typescript
// Analyze an image by URL
const result = await provider.analyzeImage(
  { type: 'url', url: 'https://example.com/chart.png' },
  'What trends do you see in this chart?',
  { model: 'gpt-4o', detail: 'high' }
);

console.log(result.content);
console.log(result.usage); // { inputTokens, outputTokens, totalTokens }

// Analyze a local file
const fileResult = await provider.analyzeImage(
  { type: 'file', path: './screenshot.png' },
  'Describe the UI elements in this screenshot'
);

// Base64 encoded image
const base64Result = await provider.analyzeImage(
  {
    type: 'base64',
    data: imageBase64String,
    mediaType: 'image/png'
  },
  'What objects are visible?'
);

// Compare multiple images
const comparison = await provider.compareImages(
  [
    { type: 'file', path: './design-v1.png' },
    { type: 'file', path: './design-v2.png' },
  ],
  'What are the differences between these designs?'
);

// Extract structured data from images
interface Invoice {
  invoiceNumber: string;
  total: number;
  items: Array<{ name: string; price: number }>;
}

const invoice = await provider.extractFromImage<Invoice>(
  { type: 'url', url: 'https://example.com/invoice.png' },
  'Extract invoice number, total, and line items as JSON'
);
```

### Embeddings

```typescript
// Generate embeddings for text
const embeddings = await provider.embed([
  'Hello world',
  'How are you?',
  'Machine learning is fascinating'
]);

console.log(embeddings[0]!.length); // 1536 for text-embedding-3-small
```

### Structured JSON Output

```typescript
interface Person {
  name: string;
  age: number;
}

const result = await provider.generateJSON<Person>(
  'Extract: John is 30 years old',
  { name: 'string', age: 'number' }
);

console.log(result); // { name: 'John', age: 30 }
```

### Access Underlying Client

```typescript
// Get the OpenAI SDK client for advanced usage
const client = provider.getClient();
const images = await client.images.generate({ /* ... */ });
```

## Anthropic Provider

The Anthropic provider supports Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku, and vision capabilities.

### Configuration

```typescript
import { createAnthropicProvider, AnthropicProvider } from '@philjs/ai';

const provider = createAnthropicProvider({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  baseURL: 'https://api.anthropic.com', // optional
  defaultModel: 'claude-sonnet-4-20250514',
  enableCaching: true, // Enable prompt caching (beta)
});
```

### AnthropicConfig

```typescript
interface AnthropicConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;        // Default: 'claude-sonnet-4-20250514'
  enableCaching?: boolean;      // Enable prompt caching (beta)
}
```

### Text Completion

```typescript
const response = await provider.generateCompletion(
  'Explain the theory of relativity',
  {
    model: 'claude-sonnet-4-20250514',
    temperature: 0.5,
    maxTokens: 2000,
    systemPrompt: 'You are a physics professor.',
    stopSequences: ['END'],
  }
);
```

### Streaming

```typescript
for await (const chunk of provider.generateStreamCompletion(
  'Write a haiku about programming',
  { maxTokens: 100 }
)) {
  process.stdout.write(chunk);
}
```

### Vision

Claude 3 models support image analysis:

```typescript
// Single image
const result = await provider.analyzeImage(
  { type: 'url', url: 'https://example.com/diagram.png' },
  'Explain this architecture diagram'
);

// Multiple images
const comparison = await provider.compareImages(
  [image1, image2],
  'What are the differences between these images?'
);

// Structured extraction
const data = await provider.extractFromImage<{ total: number; date: string }>(
  receiptImage,
  'Extract the total amount and date from this receipt'
);
```

### Embeddings Note

Anthropic does not provide embedding models. Use OpenAI or Cohere for embeddings:

```typescript
// This will throw an error
await provider.embed(['text']); // Error: Anthropic does not provide embeddings
```

## Gemini Provider

Google's Gemini models for text generation.

### Configuration

```typescript
import { createGeminiProvider, GeminiProvider } from '@philjs/ai';

const provider = createGeminiProvider({
  apiKey: process.env.GEMINI_API_KEY!, // or GOOGLE_AI_API_KEY
  baseURL: 'https://generativelanguage.googleapis.com/v1beta', // optional
  defaultModel: 'gemini-1.5-pro',
});
```

### GeminiConfig

```typescript
interface GeminiConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string; // Default: 'gemini-1.5-pro'
}
```

### Usage

```typescript
// Standard completion
const response = await provider.generateCompletion(
  'Write a poem about the moon',
  {
    model: 'gemini-1.5-pro',
    temperature: 0.8,
    maxTokens: 500,
  }
);

// Streaming
for await (const chunk of provider.generateStreamCompletion(
  'Explain machine learning',
  { model: 'gemini-1.5-flash' }
)) {
  process.stdout.write(chunk);
}
```

## Cohere Provider

Cohere's Command models for text generation.

### Configuration

```typescript
import { createCohereProvider, CohereProvider } from '@philjs/ai';

const provider = createCohereProvider({
  apiKey: process.env.COHERE_API_KEY!,
  baseURL: 'https://api.cohere.com/v1', // optional
  defaultModel: 'command-r-plus',
});
```

### CohereConfig

```typescript
interface CohereConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string; // Default: 'command-r-plus'
}
```

### Usage

```typescript
const response = await provider.generateCompletion(
  'Summarize the key points of climate change',
  { temperature: 0.3 }
);

// Streaming
for await (const chunk of provider.generateStreamCompletion(
  'Write an article about renewable energy'
)) {
  process.stdout.write(chunk);
}
```

## LM Studio Provider

LM Studio provides OpenAI-compatible API for local models.

### Configuration

```typescript
import { createLMStudioProvider, LMStudioProvider } from '@philjs/ai';

const provider = createLMStudioProvider({
  baseURL: 'http://localhost:1234/v1', // Default LM Studio port
  defaultModel: 'local-model',
});

// Or with defaults
const provider = createLMStudioProvider();
```

### LMStudioConfig

```typescript
interface LMStudioConfig {
  baseURL?: string;      // Default: 'http://localhost:1234/v1'
  defaultModel?: string; // Default: 'local-model'
}
```

### Usage

```typescript
// Works the same as other providers
const response = await provider.generateCompletion(
  'Write a function to sort an array',
  { temperature: 0.2 }
);

// Streaming
for await (const chunk of provider.generateStreamCompletion(
  'Explain recursion with examples'
)) {
  process.stdout.write(chunk);
}
```

## Local Provider (Ollama)

Run models locally using Ollama.

### Configuration

```typescript
import { createLocalProvider, LocalProvider } from '@philjs/ai';

const provider = createLocalProvider({
  baseURL: 'http://localhost:11434', // Default Ollama port
  defaultModel: 'codellama',
});

// Or with defaults
const provider = createLocalProvider();
```

### LocalConfig

```typescript
interface LocalConfig {
  baseURL?: string;      // Default: 'http://localhost:11434'
  defaultModel?: string; // Default: 'codellama'
}
```

### Usage

```typescript
// Use any model available in Ollama
const response = await provider.generateCompletion(
  'Write a Python function to calculate factorial',
  { model: 'llama3' }
);

// Streaming
for await (const chunk of provider.generateStreamCompletion(
  'Explain the difference between let and const',
  { model: 'mistral' }
)) {
  process.stdout.write(chunk);
}
```

## Auto-Detection

Automatically detect and configure a provider based on environment variables:

```typescript
import { autoDetectProvider } from '@philjs/ai';

// Checks environment variables in order:
// 1. OPENAI_API_KEY -> OpenAI
// 2. ANTHROPIC_API_KEY -> Anthropic
// 3. GEMINI_API_KEY or GOOGLE_AI_API_KEY -> Gemini
// 4. COHERE_API_KEY -> Cohere
// 5. LMSTUDIO_URL -> LM Studio
// 6. Falls back to local Ollama

const provider = autoDetectProvider();

// Use the provider
const response = await provider.generateCompletion('Hello!');
```

## Provider Factory

Create providers dynamically from configuration:

```typescript
import { createProvider, ProviderConfig } from '@philjs/ai';

const config: ProviderConfig = {
  type: 'openai',
  config: {
    apiKey: process.env.OPENAI_API_KEY!,
    defaultModel: 'gpt-4o',
  }
};

const provider = createProvider(config);

// Works with all provider types
const anthropic = createProvider({
  type: 'anthropic',
  config: { apiKey: process.env.ANTHROPIC_API_KEY! }
});

const local = createProvider({
  type: 'local',
  config: { defaultModel: 'llama3' }
});
```

### ProviderConfig Type

```typescript
type ProviderConfig =
  | { type: 'openai'; config: OpenAIConfig }
  | { type: 'anthropic'; config: AnthropicConfig }
  | { type: 'local'; config?: LocalConfig }
  | { type: 'gemini'; config: GeminiConfig }
  | { type: 'cohere'; config: CohereConfig }
  | { type: 'lmstudio'; config?: LMStudioConfig };
```

## Provider Registry

Manage multiple providers in your application:

```typescript
import { ProviderRegistry, providerRegistry, createOpenAIProvider, createAnthropicProvider } from '@philjs/ai';

// Use the global registry
providerRegistry.register('openai', createOpenAIProvider({ apiKey: '...' }), true);
providerRegistry.register('anthropic', createAnthropicProvider({ apiKey: '...' }));

// Get providers
const openai = providerRegistry.get('openai');
const defaultProvider = providerRegistry.getDefault();

// List all providers
console.log(providerRegistry.list()); // ['openai', 'anthropic']

// Change default
providerRegistry.setDefault('anthropic');

// Remove provider
providerRegistry.remove('openai');

// Clear all
providerRegistry.clear();

// Create your own registry
const myRegistry = new ProviderRegistry();
myRegistry.register('fast', createOpenAIProvider({
  apiKey: '...',
  defaultModel: 'gpt-4o-mini'
}));
myRegistry.register('smart', createAnthropicProvider({
  apiKey: '...',
  defaultModel: 'claude-3-opus-20240229'
}));
```

## Vision Types

All vision-capable providers use these types:

```typescript
// Image input formats
type ImageInput =
  | { type: 'url'; url: string }
  | { type: 'base64'; data: string; mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' }
  | { type: 'file'; path: string };

// Vision options
interface VisionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  detail?: 'low' | 'high' | 'auto';  // Image detail level
  additionalImages?: ImageInput[];   // For multi-image analysis
}

// Vision result
interface VisionResult {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  detections?: VisionDetection[];
}

interface VisionDetection {
  label: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

## Provider Comparison

| Provider | Text | Streaming | Vision | Embeddings | Local |
|----------|------|-----------|--------|------------|-------|
| OpenAI | Yes | Yes | Yes (GPT-4V, GPT-4o) | Yes | No |
| Anthropic | Yes | Yes | Yes (Claude 3) | No | No |
| Gemini | Yes | Yes | Planned | Planned | No |
| Cohere | Yes | Yes | No | Yes | No |
| LM Studio | Yes | Yes | Model-dependent | Model-dependent | Yes |
| Local/Ollama | Yes | Yes | Model-dependent | Model-dependent | Yes |

## Best Practices

1. **Environment Variables** - Never hardcode API keys; use environment variables
2. **Auto-Detection** - Use `autoDetectProvider()` for flexibility
3. **Provider Registry** - Use registries for managing multiple providers
4. **Fallbacks** - Consider local providers as fallbacks for offline scenarios
5. **Model Selection** - Choose models based on task complexity and cost
6. **Rate Limiting** - Implement retry logic for rate-limited requests
7. **Error Handling** - Always handle API errors gracefully

```typescript
// Example with error handling
import { createOpenAIProvider } from '@philjs/ai';

const provider = createOpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function generateWithRetry(prompt: string, maxRetries = 3): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await provider.generateCompletion(prompt);
    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Exponential backoff
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Next Steps

- [Code Generation](./codegen.md) - Generate code with AI
- [RAG Pipeline](./rag.md) - Build retrieval-augmented generation
- [Caching](./caching.md) - Cache provider responses
- [Observability](./observability.md) - Track usage and costs
