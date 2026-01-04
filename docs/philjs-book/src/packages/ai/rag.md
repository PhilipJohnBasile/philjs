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
+--------------+    +--------------+    +--------------+
|  Documents   |--->|  Embeddings  |--->| Vector Store |
+--------------+    +--------------+    +--------------+
                                              |
+--------------+    +--------------+    +-----v--------+
|   Answer     |<---|    LLM       |<---|  Retrieved   |
+--------------+    +--------------+    |   Context    |
                                        +--------------+
```

## Core Components

### RAG Pipeline

The `RAGPipeline` class provides the complete RAG workflow:

```typescript
import { RAGPipeline, InMemoryVectorStore, createOpenAIProvider } from '@philjs/ai';

const provider = createOpenAIProvider({ apiKey: process.env.OPENAI_API_KEY! });

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

### RAG Pipeline Configuration

```typescript
interface RAGPipelineConfig {
  provider: AIProvider;                   // LLM provider (must support embed())
  vectorStore: VectorStore;               // Vector store for embeddings
  embeddingProvider?: AIProvider;         // Optional separate embedding provider
  chunkSize?: number;                     // Characters per chunk (default: 500)
  chunkOverlap?: number;                  // Overlap between chunks (default: 50)
  topK?: number;                          // Results to retrieve (default: 5)
  minScore?: number;                      // Minimum similarity (default: 0.7)
  systemPrompt?: string;                  // System prompt for generation
  responseFormat?: 'text' | 'markdown';   // Response format
}
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

// Add from files (with automatic loading and chunking)
await rag.ingestFromFiles('./docs/**/*.md', {
  loader: 'markdown',
  chunkSize: 500,
  extractMetadata: (file) => ({
    source: file.path,
    modified: file.mtime,
  }),
});

// Add from URL
await rag.ingestFromURL('https://philjs.dev/docs', {
  maxDepth: 3,
  includePatterns: ['/docs/*'],
});
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

### Query Result

```typescript
interface RAGQueryResult {
  answer: string;
  sources: SearchResult[];
  tokensUsed: {
    context: number;
    prompt: number;
    completion: number;
  };
}

interface SearchResult {
  document: Document;
  score: number;
}
```

## Document Loaders

### TextLoader

Load plain text files:

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

// Load multiple files
const docs = await loader.loadMany(['./file1.txt', './file2.txt']);
```

### JSONLoader

Load JSON files with customizable field mapping:

```typescript
import { JSONLoader } from '@philjs/ai';

const loader = new JSONLoader({
  contentField: 'text',      // Field containing content
  metadataFields: ['id', 'category', 'date'],
});

const docs = await loader.load('./data/articles.json');

// For JSON arrays
const arrayLoader = new JSONLoader({
  contentField: 'body',
  idField: 'id',
  metadataFields: ['title', 'author', 'tags'],
});
const docs = await arrayLoader.load('./data/posts.json');
```

### MarkdownLoader

Load markdown files with frontmatter support:

```typescript
import { MarkdownLoader } from '@philjs/ai';

const loader = new MarkdownLoader({
  splitOnHeadings: true,     // Create doc per heading
  extractFrontmatter: true,  // Parse YAML frontmatter
  includeCodeBlocks: true,   // Include code in content
  headingDepth: 2,           // Split depth (h2)
});

// Load single file
const docs = await loader.load('./README.md');

// Load with glob pattern
const docs = await loader.load('./docs/**/*.md');

// Custom processing
const loader = new MarkdownLoader({
  transform: (content, metadata) => ({
    content: content.toLowerCase(),
    metadata: { ...metadata, processed: true },
  }),
});
```

### PDFLoader

Load PDF documents:

```typescript
import { PDFLoader } from '@philjs/ai';

const loader = new PDFLoader({
  splitPages: true,          // Create doc per page
  extractImages: false,      // Skip image extraction
});

const docs = await loader.load('./manual.pdf');
```

### WebLoader

Load content from web pages:

```typescript
import { WebLoader } from '@philjs/ai';

const loader = new WebLoader({
  selector: 'article',       // CSS selector for content
  removeSelectors: ['nav', '.ads'],
  waitForSelector: '.content',
});

const docs = await loader.load('https://example.com/docs');

// Crawl multiple pages
const docs = await loader.crawl('https://example.com', {
  maxDepth: 2,
  maxPages: 100,
  includePatterns: ['/docs/*'],
  excludePatterns: ['/api/*'],
});
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

// Split with metadata preservation
const chunks = splitter.splitDocuments(documents);
```

### TokenSplitter

Split by token count (more accurate for LLMs):

```typescript
import { TokenSplitter } from '@philjs/ai';

const splitter = new TokenSplitter({
  chunkSize: 200,        // Tokens per chunk
  chunkOverlap: 20,      // Token overlap
  encoding: 'cl100k_base', // Tokenizer encoding (GPT-4)
});

const chunks = splitter.split(document);

// Get token count
const count = splitter.countTokens(text);
```

### SentenceSplitter

Split on sentence boundaries:

```typescript
import { SentenceSplitter } from '@philjs/ai';

const splitter = new SentenceSplitter({
  chunkSize: 500,
  chunkOverlap: 50,
  minSentenceLength: 10,
});

const chunks = splitter.split(document);
```

### MarkdownSplitter

Split markdown preserving structure:

```typescript
import { MarkdownSplitter } from '@philjs/ai';

const splitter = new MarkdownSplitter({
  headingDepth: 2,       // Split at h2
  includeHeading: true,  // Include heading in chunk
  preserveCodeBlocks: true,
});

const chunks = splitter.split(markdownContent);
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

// Search with filter
const results = await store.search(queryEmbedding, 5, {
  category: 'core',
});

// Get stats
const stats = await store.stats();
// { count: 100 }

// Clear all documents
await store.clear();
```

### PineconeVectorStore

Production-ready vector database:

```typescript
import { PineconeVectorStore } from '@philjs/ai';

const store = new PineconeVectorStore({
  apiKey: process.env.PINECONE_API_KEY!,
  environment: 'us-east-1',
  indexName: 'my-index',
  namespace: 'default',     // Optional namespace
  dimension: 1536,          // Embedding dimension
});

// Initialize connection
await store.initialize();

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

// Ensure collection exists
await store.ensureCollection({
  dimension: 1536,
  distance: 'cosine',  // 'cosine' | 'euclidean' | 'dot'
});

await store.add(documents);
const results = await store.search(embedding, 5);

// Search with filters
const results = await store.search(embedding, 5, {
  must: [{ key: 'category', match: { value: 'core' } }],
});
```

### SupabaseVectorStore

Use Supabase pgvector extension:

```typescript
import { SupabaseVectorStore } from '@philjs/ai';

const store = new SupabaseVectorStore({
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_KEY!,
  tableName: 'documents',
  queryName: 'match_documents',  // RPC function name
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
    query,           // Function to query
    answer,          // Signal with answer
    sources,         // Signal with sources
    isLoading,       // Loading state
    error,           // Error state
    ingest,          // Function to add documents
    clear,           // Clear all documents
  } = useRAG({
    provider,
    vectorStore: new InMemoryVectorStore(),
    topK: 5,
    minScore: 0.7,
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
      {error() && <Error message={error()} />}
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
  rerankModel: 'cohere-rerank-v3',
  rerankTopK: 20,     // Retrieve more initially
  finalTopK: 5,       // Return fewer after reranking
});
```

### Multi-Query RAG

Generate multiple query variations for better recall:

```typescript
const results = await rag.multiQuery(question, {
  numQueries: 3,
  combineMethod: 'reciprocal_rank_fusion',
});
```

### Contextual Compression

Compress retrieved documents before generation:

```typescript
const rag = new RAGPipeline({
  provider,
  vectorStore: store,
  compression: {
    enabled: true,
    method: 'llm',  // Use LLM to summarize
    maxTokens: 1000,
  },
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

// Delete by filter
await rag.deleteByFilter({ source: 'old-docs' });

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
7. **Re-ranking**: Use re-ranking for higher quality results
8. **Caching**: Cache embeddings for repeated documents

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
console.log('Sources:', result.sources.map(s => s.document.metadata?.source));
```

## Example: Customer Support Bot

```typescript
import { RAGPipeline, ChromaVectorStore, JSONLoader, createOpenAIProvider } from '@philjs/ai';

const provider = createOpenAIProvider({ apiKey: env.OPENAI_API_KEY });
const store = new ChromaVectorStore({
  url: 'http://localhost:8000',
  collectionName: 'support-kb',
});

const rag = new RAGPipeline({
  provider,
  vectorStore: store,
  topK: 3,
  systemPrompt: `You are a helpful customer support agent. Answer questions based on the knowledge base. Be friendly and concise. If you don't know the answer, offer to connect the user with a human agent.`,
});

// Load FAQ and support articles
const faqLoader = new JSONLoader({
  contentField: 'answer',
  metadataFields: ['question', 'category'],
});

const faqs = await faqLoader.load('./kb/faqs.json');
await rag.addDocuments(faqs);

// Handle customer query
async function handleQuery(userQuestion: string) {
  const result = await rag.query(userQuestion);
  return {
    answer: result.answer,
    relatedArticles: result.sources.map(s => ({
      title: s.document.metadata?.question,
      category: s.document.metadata?.category,
    })),
  };
}
```

## Next Steps

- [Code Generation](./codegen.md) - AI-powered code generation
- [Tool Calling](./tools.md) - Build AI agents
- [Structured Output](./structured-output.md) - Type-safe responses
- [Caching](./caching.md) - Cache RAG responses
