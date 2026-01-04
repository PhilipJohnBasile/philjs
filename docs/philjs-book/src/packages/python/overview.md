# @philjs/python - Python AI/ML Bindings

**High-performance Python integration for AI/ML workloads in PhilJS applications.**

@philjs/python provides seamless TypeScript bindings for Python-based AI/ML operations, including LLM inference (OpenAI, Anthropic), vector embeddings, ML model serving, and RAG pipelines. It bridges the gap between JavaScript frontends and Python's rich AI ecosystem.

## Installation

```bash
npm install @philjs/python
# or
pnpm add @philjs/python
# or
bun add @philjs/python
```

**Peer Dependencies:**

```bash
npm install @philjs/core @philjs/ai
```

**Python Requirements:**

```bash
# Ensure Python 3.10+ is installed
python3 --version

# Install Python dependencies
pip install fastapi uvicorn openai anthropic
```

## Why @philjs/python?

Building AI-powered applications often requires:
- Managing Python AI libraries from JavaScript
- Running LLM inference servers
- Generating and managing vector embeddings
- Coordinating between TypeScript frontends and Python ML backends

@philjs/python provides:
- **Unified TypeScript API** for Python AI operations
- **Multi-provider support** for OpenAI, Anthropic, and local models
- **Built-in rate limiting** with token bucket algorithm
- **Automatic retry logic** with exponential backoff
- **Streaming support** for real-time responses
- **Vector operations** with similarity search and clustering

## Feature Overview

| Feature | Description |
|---------|-------------|
| **LLM Inference** | OpenAI (GPT-4, o1, o3), Anthropic (Claude 3.5, Opus 4), local models |
| **Vector Embeddings** | text-embedding-3-small/large with auto-batching |
| **Streaming** | Server-Sent Events for real-time responses |
| **Tool Calling** | Function calling with OpenAI and Anthropic format |
| **Rate Limiting** | Token bucket algorithm with per-model limits |
| **Retry Logic** | Exponential backoff with jitter |
| **Caching** | In-memory embedding cache |
| **Similarity Search** | Cosine, Euclidean, and dot product metrics |
| **Clustering** | K-means text clustering via embeddings |

## Quick Start

```typescript
import { createPythonServer, llm, embeddings } from '@philjs/python';

// Start the Python AI server
const server = await createPythonServer({
  port: 8000,
  gpuEnabled: true,
});

// LLM chat completion
const response = await llm.chat({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: 'What is PhilJS?' },
  ],
});

console.log(response.choices[0].message.content);

// Generate embeddings
const vectors = await embeddings.generate({
  model: 'text-embedding-3-small',
  input: ['Hello world', 'How are you?'],
});

console.log(vectors.embeddings[0].length); // 1536 dimensions

// Stop server when done
await server.stop();
```

---

## Server Setup

### createPythonServer()

Creates and starts a FastAPI-based Python server for AI/ML operations.

```typescript
import { createPythonServer, PythonServer } from '@philjs/python';

const server = await createPythonServer({
  port: 8000,           // Server port (default: 8000)
  host: '0.0.0.0',      // Bind address (default: '0.0.0.0')
  workers: 4,           // Uvicorn workers (default: 1)
  pythonPath: 'python3', // Python executable path
  virtualEnv: './venv', // Optional virtual environment
  gpuEnabled: true,     // Enable CUDA (default: false)
});

// Check if server is running
console.log(server.isRunning()); // true

// Stop the server
await server.stop();
```

### Server Configuration

```typescript
interface PythonServerConfig {
  port?: number;          // HTTP port (default: 8000)
  host?: string;          // Bind address (default: '0.0.0.0')
  workers?: number;       // Uvicorn worker count (default: 1)
  pythonPath?: string;    // Python executable (default: 'python3')
  virtualEnv?: string;    // Virtual environment path
  requirements?: string[]; // Additional pip packages
  gpuEnabled?: boolean;   // Enable GPU/CUDA (default: false)
}
```

### Environment Variables

The Python server respects these environment variables:

```bash
# API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Server Configuration
PHILJS_PORT=8000
PHILJS_HOST=0.0.0.0
PHILJS_WORKERS=4
PHILJS_DEV=true          # Enable hot reload

# Rate Limiting
PHILJS_RPM=60            # Requests per minute
PHILJS_TPM=100000        # Tokens per minute

# Retry Configuration
PHILJS_MAX_RETRIES=5
PHILJS_RETRY_DELAY=1.0
PHILJS_TIMEOUT=60

# Embeddings
PHILJS_EMBEDDING_BATCH_SIZE=100
```

### Initialize Python Project

Set up a new Python AI project with dependencies:

```typescript
import { initPythonProject } from '@philjs/python';

await initPythonProject('./my-project');
// Creates:
// - my-project/python/requirements.txt
// - my-project/python/server.py
```

**Generated requirements.txt:**

```text
fastapi>=0.109.0
uvicorn>=0.27.0
pydantic>=2.5.0
openai>=1.10.0
anthropic>=0.18.0
langchain>=0.1.0
sentence-transformers>=2.3.0
chromadb>=0.4.0
torch>=2.1.0
transformers>=4.37.0
```

---

## LLM Module

The LLM module provides a TypeScript client for interacting with language models through the Python backend.

### Creating an LLM Client

```typescript
import { LLM, createLLM, createOpenAI, createAnthropic } from '@philjs/python';

// Generic LLM client
const llm = createLLM({
  provider: 'openai',
  model: 'gpt-4-turbo-preview',
  baseUrl: 'http://localhost:8000',
  temperature: 0.7,
  maxTokens: 4096,
  timeout: 60000,
});

// OpenAI-specific client
const openai = createOpenAI({
  model: 'gpt-4o',
  apiKey: process.env.OPENAI_API_KEY,
});

// Anthropic-specific client
const anthropic = createAnthropic({
  model: 'claude-3-5-sonnet-20241022',
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

### llm.chat() - Chat Completions

Send multi-turn conversations to the LLM:

```typescript
import { llm } from '@philjs/python';

const response = await llm.chat({
  model: 'gpt-4',
  messages: [
    { role: 'system', content: 'You are a helpful coding assistant.' },
    { role: 'user', content: 'How do I create a signal in PhilJS?' },
  ],
  temperature: 0.7,
  maxTokens: 2048,
});

console.log(response.id);                              // Response ID
console.log(response.model);                           // Model used
console.log(response.choices[0].message.content);      // Response text
console.log(response.choices[0].finishReason);         // 'stop', 'length', etc.
console.log(response.usage.totalTokens);               // Token usage
```

### llm.complete() - Simple Completions

For single-turn prompts:

```typescript
const result = await llm.complete('Explain reactive programming in one paragraph.');
console.log(result); // Text response
```

### llm.generate() - With System Prompt

```typescript
const result = await llm.generate(
  'You are an expert TypeScript developer.',
  'Write a debounce function with proper types.'
);
console.log(result);
```

### Streaming Responses

Stream responses in real-time:

```typescript
// Stream content only
for await (const chunk of llm.stream({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Write a poem about signals' }],
})) {
  process.stdout.write(chunk);
}

// Stream full chunks with metadata
for await (const chunk of llm.streamChunks({
  model: 'claude-3-5-sonnet-20241022',
  messages: [{ role: 'user', content: 'Explain reactivity' }],
})) {
  console.log({
    id: chunk.id,
    model: chunk.model,
    content: chunk.content,
    finishReason: chunk.finishReason,
  });
}

// Collect streamed response
const fullResponse = await llm.streamToString({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

### Multi-turn Conversations

```typescript
const { response, messages } = await llm.converse([
  { role: 'user', content: 'What is PhilJS?' },
]);

// Continue the conversation
const { response: reply, messages: updated } = await llm.converse(
  [...messages, { role: 'user', content: 'How does it compare to React?' }],
  { temperature: 0.5 }
);
```

### Tool/Function Calling

```typescript
import type { LLMTool } from '@philjs/python';

const tools: LLMTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' },
          units: { type: 'string', enum: ['celsius', 'fahrenheit'] },
        },
        required: ['location'],
      },
    },
  },
];

// Chat with tools
const response = await llm.chatWithTools(
  [{ role: 'user', content: 'What is the weather in Tokyo?' }],
  tools,
  { toolChoice: 'auto' }
);

// Check for tool calls
if (response.choices[0].message.functionCall) {
  const { name, arguments: args } = response.choices[0].message.functionCall;
  console.log(`Tool: ${name}, Args: ${args}`);
}

// Execute tool and continue
const result = await llm.executeToolAndContinue(
  [{ role: 'user', content: 'What is the weather in Tokyo?' }],
  tools,
  async (name, args) => {
    if (name === 'get_weather') {
      return { temperature: 22, conditions: 'Sunny' };
    }
    throw new Error(`Unknown tool: ${name}`);
  }
);

console.log(result.response); // "The weather in Tokyo is 22C and sunny."
```

### Model Configuration

```typescript
interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'local' | 'ollama' | 'huggingface';
  model: string;
  apiKey?: string;
  baseUrl?: string;
  temperature?: number;  // 0.0 - 2.0 (default: 0.7)
  maxTokens?: number;    // Max response tokens (default: 4096)
  timeout?: number;      // Request timeout in ms (default: 60000)
}
```

### Supported Models

**OpenAI:**
- `gpt-4`, `gpt-4-turbo`, `gpt-4-turbo-preview`
- `gpt-4o`, `gpt-4o-mini`
- `gpt-3.5-turbo`, `gpt-3.5-turbo-16k`
- `o1`, `o1-mini`, `o1-preview`, `o3-mini`

**Anthropic:**
- `claude-3-opus`, `claude-3-sonnet`, `claude-3-haiku`
- `claude-3-5-sonnet`, `claude-3-5-haiku`
- `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`
- `claude-sonnet-4-20250514`, `claude-opus-4-20250514`

### Provider Auto-Detection

```typescript
import { detectProvider } from '@philjs/python';

detectProvider('gpt-4');                    // 'openai'
detectProvider('claude-3-5-sonnet');        // 'anthropic'
detectProvider('o1-preview');               // 'openai'
detectProvider('text-davinci-003');         // 'openai'
```

---

## Embeddings Module

Generate and work with vector embeddings for semantic search and RAG applications.

### Creating an Embeddings Client

```typescript
import {
  Embeddings,
  createEmbeddings,
  createOpenAIEmbeddings,
  createOpenAILargeEmbeddings
} from '@philjs/python';

// Generic embeddings client
const embeddings = createEmbeddings({
  provider: 'openai',
  model: 'text-embedding-3-small',
  baseUrl: 'http://localhost:8000',
  dimensions: 1536,
});

// OpenAI small embeddings (1536 dimensions)
const smallEmbeddings = createOpenAIEmbeddings();

// OpenAI large embeddings (3072 dimensions)
const largeEmbeddings = createOpenAILargeEmbeddings({
  dimensions: 3072, // Can reduce for efficiency
});
```

### embeddings.generate() - Generate Vectors

```typescript
import { embeddings } from '@philjs/python';

// Single text
const response = await embeddings.generate({
  model: 'text-embedding-3-small',
  input: 'Hello, world!',
});
console.log(response.embeddings[0].length); // 1536

// Multiple texts (auto-batched)
const batchResponse = await embeddings.generate({
  model: 'text-embedding-3-small',
  input: [
    'First document about PhilJS',
    'Second document about signals',
    'Third document about reactivity',
  ],
});
console.log(batchResponse.embeddings.length); // 3

// With custom dimensions
const reducedResponse = await embeddings.generate({
  model: 'text-embedding-3-large',
  input: 'Some text',
  dimensions: 256, // Reduce dimensions for efficiency
});
```

### Helper Methods

```typescript
// Embed single text
const vector = await embeddings.embed('Hello world');
console.log(vector.length); // 1536

// Embed multiple texts
const vectors = await embeddings.embedMany([
  'Document one',
  'Document two',
  'Document three',
]);
console.log(vectors.length); // 3
```

### Batch Processing with Progress

```typescript
const texts = Array.from({ length: 10000 }, (_, i) => `Document ${i}`);

const { embeddings: vectors, totalTokens } = await embeddings.embedBatch(
  texts,
  {
    batchSize: 100,
    onProgress: (completed, total) => {
      console.log(`Progress: ${completed}/${total}`);
    },
  }
);

console.log(`Generated ${vectors.length} embeddings using ${totalTokens} tokens`);
```

### Embedding Cache

Enable caching to avoid re-computing embeddings for repeated texts:

```typescript
const embeddings = createOpenAIEmbeddings()
  .enableCache();

// First call - hits API
const v1 = await embeddings.embed('Hello world');

// Second call - returns cached
const v2 = await embeddings.embed('Hello world');

// Check cache stats
console.log(embeddings.getCacheStats());
// { size: 1, enabled: true }

// Clear cache
embeddings.clearCache();

// Disable cache
embeddings.disableCache();
```

### Model Options

| Model | Dimensions | Description |
|-------|-----------|-------------|
| `text-embedding-3-small` | 1536 | Fast, cost-effective |
| `text-embedding-3-large` | 3072 | Higher quality, more expensive |
| `text-embedding-ada-002` | 1536 | Legacy model |

---

## Similarity Search

Built-in vector similarity operations for semantic search.

### Cosine Similarity

```typescript
import { Embeddings } from '@philjs/python';

const similarity = Embeddings.cosineSimilarity(vectorA, vectorB);
console.log(similarity); // 0.0 - 1.0 (1.0 = identical)
```

### Euclidean Distance

```typescript
const distance = Embeddings.euclideanDistance(vectorA, vectorB);
console.log(distance); // Lower = more similar
```

### Dot Product

```typescript
const product = Embeddings.dotProduct(vectorA, vectorB);
```

### Normalize Vectors

```typescript
const normalized = Embeddings.normalize(vector);
// Vector with unit length (magnitude = 1)
```

### Find Similar Texts

```typescript
const corpus = [
  'PhilJS is a reactive JavaScript framework',
  'React is a library for building UIs',
  'Vue is a progressive framework',
  'Signals provide fine-grained reactivity',
];

const results = await embeddings.findSimilar(
  'What is PhilJS?',
  corpus,
  3, // Return top 3 results
  { includeEmbeddings: true }
);

for (const result of results) {
  console.log(`${result.text} (score: ${result.score.toFixed(3)})`);
}
// PhilJS is a reactive JavaScript framework (score: 0.892)
// Signals provide fine-grained reactivity (score: 0.756)
// React is a library for building UIs (score: 0.634)
```

### Find Similar with Pre-computed Embeddings

```typescript
// Pre-compute corpus embeddings once
const corpusEmbeddings = await embeddings.embedMany(corpus);

// Query multiple times without re-embedding corpus
const queryVector = await embeddings.embed('reactive programming');

const results = embeddings.findSimilarFromEmbeddings(
  queryVector,
  corpusEmbeddings,
  corpus,
  5
);
```

### Semantic Text Similarity

```typescript
const similarity = await embeddings.similarity(
  'The quick brown fox',
  'A fast auburn fox'
);
console.log(similarity); // ~0.85
```

---

## Clustering

Group similar texts using K-means clustering on embeddings.

```typescript
const texts = [
  'JavaScript is a programming language',
  'Python is great for AI',
  'TypeScript adds types to JS',
  'Machine learning uses Python',
  'PhilJS is a JS framework',
  'TensorFlow is an ML library',
];

const clusters = await embeddings.clusterTexts(texts, 2);

for (const cluster of clusters) {
  console.log(`\nCluster ${cluster.centroid}:`);
  for (const text of cluster.texts) {
    console.log(`  - ${text}`);
  }
}
// Cluster 0:
//   - JavaScript is a programming language
//   - TypeScript adds types to JS
//   - PhilJS is a JS framework
// Cluster 1:
//   - Python is great for AI
//   - Machine learning uses Python
//   - TensorFlow is an ML library
```

---

## Deduplication

Remove semantically duplicate texts:

```typescript
const texts = [
  'Hello world',
  'Hello, World!',           // Near-duplicate
  'Hi there, world',         // Near-duplicate
  'Goodbye world',           // Different
  'Farewell, world!',        // Near-duplicate of above
];

const { unique, duplicates } = await embeddings.deduplicate(
  texts,
  0.90 // Similarity threshold (0.0 - 1.0)
);

console.log('Unique texts:', unique);
// ['Hello world', 'Goodbye world']

console.log('Duplicates:', duplicates);
// [
//   { text: 'Hello, World!', duplicateOf: 'Hello world' },
//   { text: 'Hi there, world', duplicateOf: 'Hello world' },
//   { text: 'Farewell, world!', duplicateOf: 'Goodbye world' },
// ]
```

---

## Integration with PhilJS AI

@philjs/python integrates seamlessly with @philjs/ai for enhanced AI capabilities.

### RAG Pipeline Integration

```typescript
import { createRAG, createVectorStore } from '@philjs/ai';
import { createPythonServer, embeddings, llm } from '@philjs/python';

// Start Python backend
const server = await createPythonServer({ gpuEnabled: true });

// Create RAG pipeline using Python embeddings
const rag = createRAG({
  vectorStore: createVectorStore({
    type: 'memory',
    embeddings: {
      embed: (text) => embeddings.embed(text),
      embedMany: (texts) => embeddings.embedMany(texts),
    },
  }),
  llm: {
    generate: async (prompt) => {
      const response = await llm.chat({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
      });
      return response.choices[0].message.content || '';
    },
  },
});

// Index documents
await rag.index([
  { id: '1', content: 'PhilJS uses signals for reactivity...' },
  { id: '2', content: 'The router supports nested routes...' },
]);

// Query with RAG
const answer = await rag.query('How does PhilJS handle reactivity?');
console.log(answer);
```

### Using with @philjs/ai Providers

```typescript
import { createAIClient, createOpenAIProvider } from '@philjs/ai';
import { llm, embeddings } from '@philjs/python';

// Use @philjs/ai for high-level operations
const ai = createAIClient(createOpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY,
}));

// Use @philjs/python for low-level Python operations
const component = await ai.generateComponent(
  'A data table with sorting',
  'DataTable'
);

// Generate embeddings for the component code
const codeEmbedding = await embeddings.embed(component.code);

// Use for semantic code search
const similarComponents = await embeddings.findSimilar(
  component.code,
  existingComponents,
  5
);
```

### Hybrid TypeScript/Python Pipeline

```typescript
import { createPythonServer, llm } from '@philjs/python';

// Custom Python function for specialized ML tasks
const server = await createPythonServer();

// Call custom Python functions
const result = await server.call({
  name: 'custom_analysis',
  module: 'my_ml_module',
  function: 'analyze_sentiment',
  args: ['This product is amazing!'],
  kwargs: { language: 'en' },
});

console.log(result); // { sentiment: 'positive', score: 0.95 }
```

---

## Python Server API Reference

The Python server exposes these REST endpoints:

### Health Check

```
GET /health
```

```json
{
  "status": "ok",
  "providers": {
    "openai": true,
    "anthropic": true
  }
}
```

### Chat Completions

```
POST /v1/chat/completions
```

```json
{
  "model": "gpt-4",
  "messages": [
    { "role": "user", "content": "Hello" }
  ],
  "temperature": 0.7,
  "max_tokens": 4096,
  "stream": false,
  "tools": [],
  "tool_choice": "auto",
  "provider": null
}
```

### Embeddings

```
POST /v1/embeddings
```

```json
{
  "model": "text-embedding-3-small",
  "input": ["Hello", "World"],
  "dimensions": null,
  "provider": null
}
```

### Generic Function Call

```
POST /call
```

```json
{
  "name": "my_function",
  "module": "my_module",
  "function": "process_data",
  "args": [1, 2, 3],
  "kwargs": { "option": true }
}
```

---

## Performance Optimization

### Rate Limiting Configuration

```python
# server.py - Configure rate limits
rate_limiter = RateLimiter(
    requests_per_minute=60,
    tokens_per_minute=100000,
    burst_multiplier=1.5
)
```

### Embedding Batch Size

For large document sets, adjust batch size:

```bash
export PHILJS_EMBEDDING_BATCH_SIZE=100
```

```typescript
// Or in code
const { embeddings } = await embeddings.embedBatch(texts, {
  batchSize: 50, // Smaller batches for rate limit compliance
});
```

### GPU Acceleration

Enable CUDA for faster inference:

```typescript
const server = await createPythonServer({
  gpuEnabled: true,
});
```

```bash
# Or via environment
export CUDA_VISIBLE_DEVICES=0
```

### Connection Pooling

Reuse the LLM client for multiple requests:

```typescript
// Create once
const llm = createOpenAI({ model: 'gpt-4' });

// Reuse for all requests
await Promise.all([
  llm.complete('Prompt 1'),
  llm.complete('Prompt 2'),
  llm.complete('Prompt 3'),
]);
```

### Caching Strategy

```typescript
// Enable embedding cache for repeated texts
const embeddings = createOpenAIEmbeddings().enableCache();

// Pre-compute and store embeddings
const documentEmbeddings = await embeddings.embedMany(documents);

// Store in your database/vector store
await vectorStore.upsert(documents.map((doc, i) => ({
  id: doc.id,
  embedding: documentEmbeddings[i],
  metadata: doc.metadata,
})));
```

### Streaming for Large Responses

```typescript
// Use streaming for long responses
for await (const chunk of llm.stream({
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Write a long essay...' }],
})) {
  // Process chunks as they arrive
  await processChunk(chunk);
}
```

### Retry Configuration

```bash
# Configure retries for reliability
export PHILJS_MAX_RETRIES=5
export PHILJS_RETRY_DELAY=1.0
export PHILJS_TIMEOUT=120
```

---

## TypeScript Types

```typescript
import type {
  // LLM Types
  LLMConfig,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  LLMTool,
  StreamChunk,

  // Embeddings Types
  EmbeddingsConfig,
  EmbeddingsRequest,
  EmbeddingsResponse,
  SimilarityResult,
  BatchOptions,

  // Server Types
  PythonServerConfig,
  PythonFunction,

  // Model Types
  ModelConfig,
  ModelInput,
  ModelOutput,

  // RAG Types
  RAGConfig,
  RAGQuery,
  RAGResponse,
} from '@philjs/python';
```

---

## Error Handling

```typescript
import { llm, embeddings } from '@philjs/python';

try {
  const response = await llm.chat({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello' }],
  });
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Handle rate limiting - automatic retry is built-in
    console.log('Rate limited, request will be retried');
  } else if (error.message.includes('timeout')) {
    // Handle timeout
    console.log('Request timed out');
  } else {
    // Handle other errors
    console.error('LLM error:', error.message);
  }
}

// Check server health
try {
  const health = await llm.checkHealth();
  console.log('Status:', health.status);
  console.log('OpenAI available:', health.providers.openai);
  console.log('Anthropic available:', health.providers.anthropic);
} catch {
  console.error('Server not reachable');
}
```

---

## Best Practices

1. **Start the server once** - Create `PythonServer` at application startup
2. **Reuse clients** - Create LLM/Embeddings clients once and reuse
3. **Enable embedding cache** - For repeated texts in RAG applications
4. **Use streaming** - For better UX with long responses
5. **Batch embeddings** - Use `embedBatch()` for large document sets
6. **Pre-compute embeddings** - Store document embeddings in a vector database
7. **Handle rate limits** - Built-in retry handles most cases automatically
8. **Set appropriate timeouts** - Increase for complex queries
9. **Monitor token usage** - Track `response.usage.totalTokens`
10. **Use GPU** - Enable `gpuEnabled: true` for production workloads

---

## Next Steps

- [RAG Pipeline Guide](../ai/rag.md)
- [Vector Store Integration](../vector-store/overview.md)
- [LLM UI Components](../llm-ui/overview.md)
- [AI Agents](../ai-agents/overview.md)
