# @philjs/vector-store

High-performance vector database for PhilJS with WASM-powered semantic search.

Built on [VecStore](https://github.com/philipjohnbasile/vecstore) - "The SQLite of vector search".

## Features

- **HNSW-based indexing** - Fast approximate nearest neighbor search
- **Multiple distance metrics** - Cosine, Euclidean, dot product, and more
- **Metadata filtering** - SQL-like filter expressions
- **Hybrid search** - Combine vector similarity with BM25 keyword matching
- **WASM-powered** - Runs entirely in the browser, no server required
- **TypeScript-first** - Full type definitions included

## Installation

```bash
npm install @philjs/vector-store
# or
pnpm add @philjs/vector-store
```

## Quick Start

```typescript
import { VectorStore } from '@philjs/vector-store';

// Create a store with 384 dimensions (e.g., for sentence transformers)
const store = await VectorStore.create({ dimensions: 384 });

// Add vectors with metadata
await store.upsert('doc-1', embedding1, { title: 'Hello World', category: 'greeting' });
await store.upsert('doc-2', embedding2, { title: 'Goodbye', category: 'farewell' });

// Query for similar vectors
const results = await store.query(queryEmbedding, { k: 5 });
console.log(results);
// [
//   { id: 'doc-1', score: 0.95, metadata: { title: 'Hello World', ... } },
//   { id: 'doc-2', score: 0.82, metadata: { title: 'Goodbye', ... } },
// ]

// Query with metadata filter
const filtered = await store.query(queryEmbedding, {
  k: 5,
  filter: "category = 'greeting'"
});
```

## API Reference

### VectorStore.create(config)

Create a new vector store instance.

```typescript
const store = await VectorStore.create({
  dimensions: 384,        // Required: vector dimensions
  metric: 'cosine',       // Optional: 'cosine' | 'euclidean' | 'dot' | etc.
  m: 16,                  // Optional: HNSW M parameter
  efConstruction: 200,    // Optional: HNSW ef_construction
  efSearch: 50,           // Optional: HNSW ef_search
});
```

### store.upsert(id, vector, metadata?)

Insert or update a vector.

```typescript
await store.upsert(
  'doc-1',
  [0.1, 0.2, 0.3, ...],  // number[] or Float32Array
  { title: 'Document 1', author: 'John' }  // optional metadata
);
```

### store.upsertBatch(items)

Batch insert multiple vectors.

```typescript
await store.upsertBatch([
  { id: 'doc-1', vector: embedding1, metadata: { title: 'First' } },
  { id: 'doc-2', vector: embedding2, metadata: { title: 'Second' } },
]);
```

### store.query(vector, options?)

Search for similar vectors.

```typescript
const results = await store.query(queryVector, {
  k: 10,                    // Number of results
  filter: "author = 'John'", // Metadata filter
  includeVectors: false,     // Include vectors in results
  includeMetadata: true,     // Include metadata in results
  minScore: 0.5,            // Minimum similarity score
});
```

### store.hybridSearch(vector, options?)

Combine vector similarity with keyword matching.

```typescript
const results = await store.hybridSearch(queryVector, {
  text: 'search query',
  vectorWeight: 0.7,
  keywordWeight: 0.3,
  k: 10,
});
```

### store.delete(id)

Delete a vector by ID.

```typescript
const deleted = await store.delete('doc-1');
```

### store.stats()

Get store statistics.

```typescript
const stats = await store.stats();
// { count: 1000, dimensions: 384, metric: 'cosine', memoryBytes: 1234567 }
```

## Utility Functions

```typescript
import {
  cosineSimilarity,
  euclideanDistance,
  normalizeVector
} from '@philjs/vector-store';

// Compute similarity between two vectors
const sim = cosineSimilarity(vectorA, vectorB);

// Compute distance
const dist = euclideanDistance(vectorA, vectorB);

// Normalize to unit length
const normalized = normalizeVector(vector);
```

## Distance Metrics

| Metric | Description | Best For |
|--------|-------------|----------|
| `cosine` | Cosine similarity (default) | Text embeddings |
| `euclidean` | Euclidean distance (L2) | General purpose |
| `dot` | Dot product | Normalized vectors |
| `manhattan` | Manhattan distance (L1) | Sparse vectors |
| `hamming` | Hamming distance | Binary vectors |
| `jaccard` | Jaccard similarity | Set comparison |

## Performance

VecStore is optimized for fast similarity search:

- 0.2ms search latency for 100K vectors
- Sub-linear scaling with HNSW indexing
- Efficient memory usage with quantization support

## Use Cases

- **Semantic Search** - Find documents similar to a query
- **Recommendation Systems** - Find similar items
- **RAG (Retrieval-Augmented Generation)** - Retrieve context for LLMs
- **Image Search** - Find visually similar images
- **Anomaly Detection** - Find outliers in vector space

## License

MIT
