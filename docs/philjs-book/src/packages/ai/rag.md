# Retrieval Augmented Generation (RAG)

RAG combines embeddings, vector search, and generation to create AI applications grounded in your data. Instead of relying solely on a model's training data, RAG retrieves relevant context from your documents before generating responses.

## Why RAG?

- **Accurate answers**: Grounded in your actual data
- **Up-to-date**: No need to retrain models
- **Source attribution**: Know where answers come from
- **Cost effective**: Smaller context than full documents
- **Privacy**: Keep data in your control

## Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Documents  │───>│  Embeddings  │───>│ Vector Store│
└─────────────┘    └──────────────┘    └─────────────┘
                                              │
┌─────────────┐    ┌──────────────┐    ┌──────▼──────┐
│   Answer    │<───│    LLM       │<───│  Retrieved  │
└─────────────┘    └──────────────┘    │   Context   │
                                       └─────────────┘
```

## Core Components

### RAG Pipeline

```typescript
import { RAGPipeline, InMemoryVectorStore, createOpenAIProvider } from '@philjs/ai';

const provider = createOpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });

const rag = new RAGPipeline({
  provider,                              // Must support embed()
  vectorStore: new InMemoryVectorStore(),
  chunkSize: 500,                        // Characters per chunk
  chunkOverlap: 50,                      // Overlap between chunks
  topK: 5,                               // Number of results to retrieve
  minScore: 0.7,                         // Minimum similarity score
  systemPrompt: 'Answer based on the provided context. If you cannot find the answer in the context, say so.',
});
```

### Adding Documents

```typescript
// Add documents directly
await rag.addDocuments([
  {
    content: 'PhilJS uses signals for fine-grained reactivity.',
    metadata: { source: 'docs', category: 'core' },
  },
  {
    content: 'Components are functions that return JSX.',
    metadata: { source: 'docs', category: 'components' },
  },
]);

// Add with custom IDs
await rag.addDocuments([
  {
    id: 'signals-intro',
    content: 'Signals are reactive primitives...',
    metadata: { source: 'guide' },
  },
]);
```

### Querying

```typescript
// Simple query
const result = await rag.query('How do signals work?');
console.log(result.answer);
console.log(result.sources); // Retrieved documents

// Query with options
const result = await rag.query('Explain reactivity', {
  topK: 10,
  minScore: 0.8,
  filter: { category: 'core' },
});

// Streaming query
for await (const chunk of rag.streamQuery('What is PhilJS?')) {
  process.stdout.write(chunk);
}
```

## Document Loaders

### TextLoader

```typescript
import { TextLoader } from '@philjs/ai';

const loader = new TextLoader();
const docs = await loader.load('./docs/guide.txt');
// [{ content: '...', metadata: { source: './docs/guide.txt' } }]

// From string
const docs = loader.loadFromString(textContent, {
  source: 'manual-input',
  category: 'notes',
});
```

### JSONLoader

```typescript
import { JSONLoader } from '@philjs/ai';

const loader = new JSONLoader({
  contentField: 'text',      // Field containing content
  metadataFields: ['id', 'category', 'date'],
});

const docs = await loader.load('./data/articles.json');
```

### MarkdownLoader

```typescript
import { MarkdownLoader } from '@philjs/ai';

const loader = new MarkdownLoader({
  splitOnHeadings: true,     // Create doc per heading
  extractFrontmatter: true,  // Parse YAML frontmatter
  includeCodeBlocks: true,   // Include code in content
});

const docs = await loader.load('./docs/**/*.md');
```

## Text Splitters

### RecursiveCharacterSplitter

Intelligent splitting that tries to preserve semantic boundaries:

```typescript
import { RecursiveCharacterSplitter } from '@philjs/ai';

const splitter = new RecursiveCharacterSplitter({
  chunkSize: 500,        // Target chunk size
  chunkOverlap: 50,      // Overlap between chunks
  separators: ['\n\n', '\n', '. ', ' '],  // Split priorities
});

const chunks = splitter.split(longDocument);
// [{ content: '...chunk 1...', metadata: { chunk: 0 } }, ...]
```

### TokenSplitter

Split by token count (more accurate for LLMs):

```typescript
import { TokenSplitter } from '@philjs/ai';

const splitter = new TokenSplitter({
  chunkSize: 200,        // Tokens per chunk
  chunkOverlap: 20,      // Token overlap
  encoding: 'cl100k_base', // Tokenizer encoding
});

const chunks = splitter.split(document);
```

## Vector Stores

### InMemoryVectorStore

Fast, no-setup store for development and testing:

```typescript
import { InMemoryVectorStore } from '@philjs/ai';

const store = new InMemoryVectorStore();

// Add documents with embeddings
await store.add([
  { id: 'doc1', content: '...', embedding: [...], metadata: {} },
]);

// Search
const results = await store.search(queryEmbedding, 5);
// [{ document, score }, ...]

// Get stats
const stats = await store.stats();
// { count: 100 }
```

### PineconeVectorStore

Production-ready vector database:

```typescript
import { PineconeVectorStore } from '@philjs/ai';

const store = new PineconeVectorStore({
  apiKey: process.env.PINECONE_API_KEY,
  environment: 'us-east-1',
  indexName: 'my-index',
  namespace: 'default',     // Optional namespace
  dimension: 1536,          // Embedding dimension
});

// Add documents (auto-batched)
await store.add([
  { id: 'doc1', content: '...', embedding: [...], metadata: { source: 'guide' } },
  // ... hundreds more
]);

// Search with metadata filter
const results = await store.search(queryEmbedding, 10, {
  source: { $eq: 'guide' },
});

// Get index stats
const stats = await store.stats();
// { totalVectorCount: 1000, dimension: 1536, namespaces: {...} }

// Fetch specific documents
const docs = await store.fetch(['doc1', 'doc2']);

// Delete documents
await store.delete(['doc1', 'doc2']);
await store.deleteByFilter({ source: 'old-guide' });
```

### ChromaVectorStore

Open-source vector database:

```typescript
import { ChromaVectorStore } from '@philjs/ai';

const store = new ChromaVectorStore({
  url: 'http://localhost:8000',
  collectionName: 'my-collection',
  authToken: process.env.CHROMA_TOKEN,  // Optional
});

// Ensure collection exists
await store.ensureCollection({ dimension: 1536 });

// Add documents
await store.add(documents);

// Search
const results = await store.search(embedding, 5);

// Query with filters
const results = await store.query({
  queryEmbedding: embedding,
  nResults: 10,
  where: { category: 'core' },
  whereDocument: { $contains: 'signal' },
});

// Update document
await store.update('doc1', { content: 'updated...', metadata: {} });

// Get documents by ID
const docs = await store.get(['doc1', 'doc2']);
```

### QdrantVectorStore

High-performance vector database:

```typescript
import { QdrantVectorStore } from '@philjs/ai';

const store = new QdrantVectorStore({
  url: 'http://localhost:6333',
  collectionName: 'documents',
  apiKey: process.env.QDRANT_API_KEY,  // Optional
});

await store.add(documents);
const results = await store.search(embedding, 5);
```

## useRAG Hook

For PhilJS components:

```typescript
import { useRAG, InMemoryVectorStore, createOpenAIProvider } from '@philjs/ai';

function SearchComponent() {
  const provider = createOpenAIProvider({ apiKey: env.OPENAI_API_KEY });

  const {
    query,
    answer,
    sources,
    isLoading,
    ingest,
  } = useRAG({
    provider,
    vectorStore: new InMemoryVectorStore(),
    topK: 5,
  });

  // Load documents on mount
  effect(async () => {
    await ingest([
      { content: 'PhilJS documentation...', metadata: { source: 'docs' } },
    ]);
  });

  const handleSearch = async (question: string) => {
    await query(question);
  };

  return (
    <div>
      <SearchInput onSubmit={handleSearch} />
      {isLoading() && <Spinner />}
      {answer() && (
        <div>
          <Answer text={answer()} />
          <Sources items={sources()} />
        </div>
      )}
    </div>
  );
}
```

## Advanced Usage

### Custom Embedding Provider

```typescript
const rag = new RAGPipeline({
  provider: myProvider, // Must implement embed(texts: string[]): Promise<number[][]>
  vectorStore: store,
});

// Or use a separate embedding provider
const rag = new RAGPipeline({
  provider: chatProvider,
  embeddingProvider: createCohereProvider({ apiKey: '...' }),
  vectorStore: store,
});
```

### Hybrid Search

Combine vector search with keyword search:

```typescript
const results = await rag.hybridSearch(query, {
  vectorWeight: 0.7,
  keywordWeight: 0.3,
  topK: 10,
});
```

### Re-ranking

Improve result quality with re-ranking:

```typescript
const results = await rag.query(question, {
  rerank: true,
  rerankModel: 'cohere-rerank-v2',
  rerankTopK: 20,
  finalTopK: 5,
});
```

### Document Updates

```typescript
// Update existing document
await rag.updateDocument('doc-id', {
  content: 'Updated content...',
  metadata: { updated: new Date().toISOString() },
});

// Delete documents
await rag.deleteDocuments(['doc1', 'doc2']);

// Clear all
await rag.clear();
```

## Document Type

```typescript
interface Document {
  id?: string;           // Auto-generated if not provided
  content: string;       // Text content
  embedding?: number[];  // Vector embedding
  metadata?: {
    source?: string;
    category?: string;
    [key: string]: unknown;
  };
}

interface SearchResult {
  document: Document;
  score: number;         // Similarity score (0-1)
}
```

## Best Practices

1. **Chunk size**: 200-500 tokens works well for most use cases
2. **Overlap**: 10-20% overlap prevents losing context at boundaries
3. **Metadata**: Add source info for attribution
4. **Filtering**: Use metadata filters to scope searches
5. **Top K**: Start with 3-5, increase if answers lack context
6. **Min score**: Set threshold to filter irrelevant results (0.7-0.8)

## Example: Documentation Search

```typescript
import {
  RAGPipeline,
  PineconeVectorStore,
  MarkdownLoader,
  RecursiveCharacterSplitter,
  createOpenAIProvider,
} from '@philjs/ai';

// Setup
const provider = createOpenAIProvider({ apiKey: env.OPENAI_API_KEY });
const store = new PineconeVectorStore({
  apiKey: env.PINECONE_API_KEY,
  environment: 'us-east-1',
  indexName: 'docs',
});

const rag = new RAGPipeline({
  provider,
  vectorStore: store,
  chunkSize: 400,
  chunkOverlap: 40,
  topK: 5,
  systemPrompt: `You are a documentation assistant. Answer questions based on the provided context. Include code examples when relevant. If the answer isn't in the context, say "I couldn't find that in the documentation."`,
});

// Index documentation
const loader = new MarkdownLoader({ splitOnHeadings: true });
const docs = await loader.load('./docs/**/*.md');
await rag.addDocuments(docs);

// Query
const result = await rag.query('How do I create a signal?');
console.log(result.answer);
console.log('Sources:', result.sources.map(s => s.metadata.source));
```

## Next Steps

- [Code Generation](./codegen.md) - AI-powered code generation
- [Tools & Agents](./tools.md) - Build AI agents
- [Overview](./overview.md) - Full @philjs/ai reference
