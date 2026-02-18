# Retrieval-Augmented Generation (RAG)

The RAG pattern enhances AI responses by retrieving relevant context from your own data before generating an answer. `@philjs/ai` provides a complete pipeline for ingestion, vector storage, and retrieval.

## The RAG Pipeline

The `RAGPipeline` class orchestrates the entire process:
1. **Ingestion**: Loading documents and generating embeddings.
2. **Storage**: Saving vectors to a database (Pinecone, Chroma, Qdrant, or Memory).
3. **Retrieval**: Finding relevant context for a user query.
4. **Generation**: Augmenting the prompt and generating a response.

![RAG Pipeline](../assets/rag_pipeline_schematic.png)
*Figure 13-1: RAG Ingestion & Retrieval Pipeline*

## Basic Usage

```typescript
import { RAGPipeline, InMemoryVectorStore, TextLoader } from '@philjs/ai';
import { openaiProvider } from '@philjs/ai/providers';

// 1. Initialize the pipeline
const pipeline = new RAGPipeline({
  provider: openaiProvider,
  vectorStore: new InMemoryVectorStore(),
  topK: 3, // Number of context chunks to retrieve
  minScore: 0.7 // Minimum similarity threshold
});

// 2. Ingest Data
const documents = await new TextLoader(
  `PhilJS is a modern web framework...`, 
  { source: 'docs' }
).load();

await pipeline.ingest(documents);

// 3. Query
const result = await pipeline.query('What is PhilJS?');

console.log(result.answer);
console.log('Sources:', result.sources);
```

## Vector Stores

PhilJS supports multiple vector database backends.

### Pinecone
```typescript
import { PineconeVectorStore } from '@philjs/ai';

const store = new PineconeVectorStore({
  apiKey: process.env.PINECONE_API_KEY!,
  environment: 'us-east-1',
  indexName: 'my-app'
});
```

### ChromaDB
```typescript
import { ChromaVectorStore } from '@philjs/ai';

const store = new ChromaVectorStore({
  url: 'http://localhost:8000',
  collectionName: 'documents'
});
```

### Qdrant
```typescript
import { QdrantVectorStore } from '@philjs/ai';

const store = new QdrantVectorStore({
  url: 'http://localhost:6333',
  collectionName: 'knowledge-base'
});
```

## Document Loaders

Loaders help you ingest data from various sources.

- **TextLoader**: Load simple string content.
- **JSONLoader**: Parse and load JSON arrays or objects.
- **MarkdownLoader**: Intelligent splitting by headers.

```typescript
import { MarkdownLoader } from '@philjs/ai';

const loader = new MarkdownLoader('# Title\n\nSection 1...\n\n## Section 2...');
const docs = await loader.load(); // Returns split documents
```

## Advanced Retrieval

You can directly interact with the vector store for custom flows.

```typescript
// Search for vectors similar to a query embedding
const results = await store.search(queryEmbedding, 5);

// Filter by metadata (if supported by store)
// Note: Metadata filtering semantics vary by provider
```
