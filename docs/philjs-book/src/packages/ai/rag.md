# Retrieval Augmented Generation (RAG)

RAG combines embeddings, vector search, and generation so answers are grounded in your data. In PhilJS, the pipeline is explicit and testable.

## Pipeline pieces

- `RAGPipeline` orchestrates ingest and query.
- `VectorStore` adapters store embeddings.
- `Document` represents content plus metadata.
- `TextLoader`, `JSONLoader`, `MarkdownLoader` convert raw data into documents.
- `RecursiveCharacterSplitter` and `TokenSplitter` chunk large inputs.

## Create a pipeline

```ts
import { RAGPipeline, InMemoryVectorStore } from '@philjs/ai';
import { createOpenAIProvider } from '@philjs/ai';

const provider = createOpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });

// The provider must implement embed() for RAG.
const rag = new RAGPipeline({
  provider,
  vectorStore: new InMemoryVectorStore(),
  topK: 5,
  minScore: 0.7,
  systemPrompt: 'Answer using the supplied context.'
});

await rag.ingest([
  { id: 'intro', content: 'PhilJS is a signals-first UI framework.' }
]);

const result = await rag.query('What is PhilJS?');
console.log(result.answer);
```

## useRAG in components

```tsx
import { useRAG, InMemoryVectorStore } from '@philjs/ai';
import { createOpenAIProvider } from '@philjs/ai';

const provider = createOpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });
const vectorStore = new InMemoryVectorStore();

const rag = useRAG({ provider, vectorStore });

await rag.ingest([{ id: 'doc', content: 'Signals update only what changes.' }]);
await rag.query('How do signals work?');
```

## Loaders and chunking

```ts
import {
  TextLoader,
  MarkdownLoader,
  RecursiveCharacterSplitter
} from '@philjs/ai';

const docs = await new TextLoader(longText, { source: 'notes' }).load();
const chunks = new RecursiveCharacterSplitter({
  chunkSize: 800,
  chunkOverlap: 100
}).split(longText);
```

## Vector store choices

- `InMemoryVectorStore` for tests and local tools.
- `PineconeVectorStore`, `ChromaVectorStore`, `QdrantVectorStore` for production.

## Next steps

- Code generation: [Codegen](./codegen.md)
- Tool calling: [Tools](./tools.md)
