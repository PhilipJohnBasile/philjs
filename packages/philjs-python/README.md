# philjs-python

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

Python bindings for PhilJS AI/ML server functions - LLM, embeddings, and ML model serving.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported
- **Python 3.11+** for Python-side features

## Installation

```bash
pnpm add @philjs/python
```

## Features

- **LLM Integration** - Connect to OpenAI, Anthropic, and local models
- **Embeddings** - Generate and manage vector embeddings
- **Model Serving** - Serve ML models via HTTP endpoints
- **PyTorch/TensorFlow** - Bridge to Python ML frameworks
- **LangChain Support** - Integration with LangChain workflows

## Quick Start

### LLM Client

```typescript
import { createLLMClient } from '@philjs/python/llm';

const llm = createLLMClient({
  provider: 'openai',
  model: 'gpt-4',
  apiKey: process.env.OPENAI_API_KEY,
});

const response = await llm.complete({
  prompt: 'Explain TypeScript generics',
  maxTokens: 500,
});

console.log(response.text);
```

### Embeddings

```typescript
import { createEmbeddingClient } from '@philjs/python/embeddings';

const embeddings = createEmbeddingClient({
  model: 'text-embedding-ada-002',
});

const vectors = await embeddings.embed([
  'Hello world',
  'TypeScript is great',
]);

console.log(vectors[0].length); // 1536 dimensions
```

### Python Server

```typescript
import { createPythonServer } from '@philjs/python/server';

const server = await createPythonServer({
  port: 8000,
  models: ['./models/sentiment.pt'],
});

// Call Python functions from TypeScript
const result = await server.invoke('predict_sentiment', {
  text: 'I love this product!',
});

console.log(result); // { sentiment: 'positive', score: 0.95 }
```

## ES2024 Features

### Promise.withResolvers() for Streaming

```typescript
import { createLLMClient } from '@philjs/python/llm';

const llm = createLLMClient({ provider: 'anthropic', model: 'claude-3' });

// Stream responses with cancellation support
function streamWithCancel(prompt: string) {
  const { promise, resolve, reject } = Promise.withResolvers<string>();
  let cancelled = false;
  let fullText = '';

  llm.stream({ prompt }).then(async (stream) => {
    for await (const chunk of stream) {
      if (cancelled) break;
      fullText += chunk.text;
    }
    if (!cancelled) resolve(fullText);
  }).catch(reject);

  return {
    promise,
    cancel: () => { cancelled = true; }
  };
}
```

### Object.groupBy() for Model Results

```typescript
import { createEmbeddingClient } from '@philjs/python/embeddings';

interface Document {
  id: string;
  text: string;
  category: string;
}

const embeddings = createEmbeddingClient({ model: 'text-embedding-ada-002' });

async function categorizeDocuments(docs: Document[]) {
  const results = await embeddings.embedBatch(docs.map(d => d.text));

  // Group documents by category using ES2024 Object.groupBy()
  const grouped = Object.groupBy(docs, doc => doc.category);

  return {
    technical: grouped.technical ?? [],
    business: grouped.business ?? [],
    general: grouped.general ?? [],
  };
}
```

### Resource Management with `using`

```typescript
import { createPythonServer } from '@philjs/python/server';

// Automatic cleanup with TypeScript 6 explicit resource management
async function runMLPipeline() {
  await using server = await createPythonServer({
    port: 8000,
    [Symbol.asyncDispose]: async () => {
      await server.shutdown();
      console.log('Python server shut down');
    }
  });

  // Server automatically shuts down when scope exits
  return server.invoke('train_model', { epochs: 10 });
}
```

## CLI

```bash
# Start Python server
philjs-python serve --port 8000

# Run Python script with PhilJS bridge
philjs-python run ./scripts/train.py

# Generate TypeScript types from Python
philjs-python types ./models/schema.py
```

## API Reference

### LLM

| Function | Description |
|----------|-------------|
| `createLLMClient(config)` | Create LLM client instance |
| `llm.complete(options)` | Generate text completion |
| `llm.stream(options)` | Stream text generation |
| `llm.chat(messages)` | Multi-turn chat completion |

### Embeddings

| Function | Description |
|----------|-------------|
| `createEmbeddingClient(config)` | Create embedding client |
| `embeddings.embed(texts)` | Generate embeddings |
| `embeddings.embedBatch(texts)` | Batch embed with progress |
| `embeddings.similarity(a, b)` | Calculate cosine similarity |

### Server

| Function | Description |
|----------|-------------|
| `createPythonServer(config)` | Start Python server |
| `server.invoke(fn, args)` | Call Python function |
| `server.shutdown()` | Stop the server |

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: ., ./cli, ./llm, ./embeddings, ./server
- Source files: packages/philjs-python/src/index.ts, packages/philjs-python/src/llm.ts, packages/philjs-python/src/embeddings.ts, packages/philjs-python/src/server.ts

### Public API
- Direct exports: BatchOptions, Embeddings, LLM, PythonServer, SimilarityResult, StreamChunk, checkPythonInstalled, createAnthropic, createEmbeddings, createLLM, createOpenAI, createOpenAIEmbeddings, createOpenAILargeEmbeddings, createPythonServer, detectProvider, embeddings, initPythonProject, llm
- Re-exported names: (none detected)
- Re-exported modules: ./embeddings.js, ./llm.js, ./server.js, ./types.js
<!-- API_SNAPSHOT_END -->

## License

MIT
