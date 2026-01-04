# @philjs/vector-store

WASM-powered vector database for similarity search with HNSW indexing, multiple distance metrics, and metadata filtering.

## Installation

```bash
npm install @philjs/vector-store
```

## Features

- **WASM Backend** - High-performance vector operations
- **HNSW Indexing** - Hierarchical Navigable Small World graphs
- **Multiple Distance Metrics** - Cosine, Euclidean, Dot Product, Manhattan, Hamming, Jaccard
- **Metadata Filtering** - Filter results by document metadata
- **Hybrid Search** - Combine vector similarity with text search
- **Batch Operations** - Efficient bulk insert/update/delete
- **Persistence** - IndexedDB storage with export/import

## Quick Start

```typescript
import { VectorStore, cosineSimilarity } from '@philjs/vector-store';

// Create store
const store = new VectorStore({
  dimensions: 1536,
  metric: 'cosine',
  indexType: 'hnsw',
});

await store.initialize();

// Add vectors
await store.upsert([
  {
    id: 'doc-1',
    vector: embeddings[0],
    metadata: { title: 'Introduction', category: 'docs' },
  },
  {
    id: 'doc-2',
    vector: embeddings[1],
    metadata: { title: 'Getting Started', category: 'docs' },
  },
]);

// Query similar vectors
const results = await store.query({
  vector: queryEmbedding,
  topK: 10,
  filter: { category: 'docs' },
});

console.log(results);
// [{ id: 'doc-1', score: 0.95, metadata: {...} }, ...]
```

## VectorStore

### Configuration

```typescript
import { VectorStore } from '@philjs/vector-store';

const store = new VectorStore({
  dimensions: 1536,           // Vector dimensions (required)
  metric: 'cosine',           // Distance metric
  indexType: 'hnsw',          // Index type: 'hnsw' | 'flat'

  // HNSW parameters
  hnswM: 16,                  // Max connections per node
  hnswEfConstruction: 200,    // Construction quality
  hnswEfSearch: 50,           // Search quality

  // Storage
  storageKey: 'vectors',      // IndexedDB key
  persistOnChange: true,      // Auto-persist changes

  // Performance
  batchSize: 1000,            // Batch operation size
  useWasm: true,              // Use WASM acceleration
});

await store.initialize();
```

### Distance Metrics

```typescript
// Cosine similarity (normalized dot product)
const store = new VectorStore({ dimensions: 1536, metric: 'cosine' });

// Euclidean distance (L2)
const store = new VectorStore({ dimensions: 1536, metric: 'euclidean' });

// Dot product (inner product)
const store = new VectorStore({ dimensions: 1536, metric: 'dot' });

// Manhattan distance (L1)
const store = new VectorStore({ dimensions: 1536, metric: 'manhattan' });

// Hamming distance (binary vectors)
const store = new VectorStore({ dimensions: 1536, metric: 'hamming' });

// Jaccard similarity (set similarity)
const store = new VectorStore({ dimensions: 1536, metric: 'jaccard' });
```

### Upserting Vectors

```typescript
// Single vector
await store.upsert({
  id: 'doc-1',
  vector: [0.1, 0.2, 0.3, ...],
  metadata: {
    title: 'Document Title',
    category: 'article',
    timestamp: Date.now(),
  },
});

// Batch upsert
await store.upsert([
  { id: 'doc-1', vector: vec1, metadata: { type: 'a' } },
  { id: 'doc-2', vector: vec2, metadata: { type: 'b' } },
  { id: 'doc-3', vector: vec3, metadata: { type: 'a' } },
]);

// Update existing (same ID)
await store.upsert({
  id: 'doc-1',
  vector: updatedVector,
  metadata: { title: 'Updated Title' },
});
```

### Querying Vectors

```typescript
// Basic query
const results = await store.query({
  vector: queryVector,
  topK: 10,
});

// With metadata filter
const results = await store.query({
  vector: queryVector,
  topK: 5,
  filter: {
    category: 'docs',
    status: 'published',
  },
});

// With score threshold
const results = await store.query({
  vector: queryVector,
  topK: 10,
  minScore: 0.8,        // Only results with score >= 0.8
});

// Include vectors in results
const results = await store.query({
  vector: queryVector,
  topK: 10,
  includeVectors: true,
});

// Results structure
results.forEach(result => {
  console.log({
    id: result.id,
    score: result.score,         // Similarity score
    metadata: result.metadata,
    vector: result.vector,       // If includeVectors: true
  });
});
```

### Advanced Filtering

```typescript
// Equality
const results = await store.query({
  vector: queryVector,
  topK: 10,
  filter: { status: 'active' },
});

// Array contains
const results = await store.query({
  vector: queryVector,
  topK: 10,
  filter: { tags: { $contains: 'typescript' } },
});

// Comparison operators
const results = await store.query({
  vector: queryVector,
  topK: 10,
  filter: {
    score: { $gte: 0.5 },
    views: { $lt: 1000 },
  },
});

// Logical operators
const results = await store.query({
  vector: queryVector,
  topK: 10,
  filter: {
    $or: [
      { category: 'tutorial' },
      { category: 'guide' },
    ],
    $and: [
      { status: 'published' },
      { language: 'en' },
    ],
  },
});
```

### Hybrid Search

```typescript
// Combine vector similarity with text search
const results = await store.hybridSearch({
  vector: queryVector,
  text: 'machine learning tutorial',
  topK: 10,
  vectorWeight: 0.7,    // 70% vector similarity
  textWeight: 0.3,      // 30% text match
  textFields: ['title', 'content'],
});
```

### Deleting Vectors

```typescript
// Delete by ID
await store.delete('doc-1');

// Batch delete
await store.delete(['doc-1', 'doc-2', 'doc-3']);

// Delete by filter
await store.deleteByFilter({
  category: 'deprecated',
});

// Clear all vectors
await store.clear();
```

### Getting Vectors

```typescript
// Get by ID
const doc = await store.get('doc-1');
console.log(doc);
// { id: 'doc-1', vector: [...], metadata: {...} }

// Get multiple
const docs = await store.getMany(['doc-1', 'doc-2']);

// Check existence
const exists = await store.has('doc-1');

// Get count
const count = await store.count();

// Get all IDs
const ids = await store.listIds();
```

### Persistence

```typescript
// Export to JSON
const data = await store.export();
console.log(data);
// { vectors: [...], metadata: {...}, config: {...} }

// Save to file
const json = JSON.stringify(await store.export());
fs.writeFileSync('vectors.json', json);

// Import from JSON
const imported = JSON.parse(fs.readFileSync('vectors.json'));
await store.import(imported);

// Force persist to IndexedDB
await store.persist();
```

### Statistics

```typescript
const stats = await store.getStats();
console.log({
  count: stats.count,           // Total vectors
  dimensions: stats.dimensions,  // Vector dimensions
  indexType: stats.indexType,   // Index type
  metric: stats.metric,         // Distance metric
  memoryUsage: stats.memoryUsage, // Approximate memory
});
```

## Utility Functions

### Distance Calculations

```typescript
import {
  cosineSimilarity,
  euclideanDistance,
  dotProduct,
  manhattanDistance,
  hammingDistance,
  jaccardSimilarity,
} from '@philjs/vector-store';

const vecA = [1, 2, 3];
const vecB = [4, 5, 6];

// Cosine similarity (0 to 1)
const cosine = cosineSimilarity(vecA, vecB);

// Euclidean distance
const euclidean = euclideanDistance(vecA, vecB);

// Dot product
const dot = dotProduct(vecA, vecB);

// Manhattan distance (L1)
const manhattan = manhattanDistance(vecA, vecB);

// Hamming distance (binary)
const hamming = hammingDistance([1, 0, 1], [1, 1, 0]);

// Jaccard similarity (sets)
const jaccard = jaccardSimilarity([1, 2, 3], [2, 3, 4]);
```

### Vector Operations

```typescript
import {
  normalizeVector,
  addVectors,
  subtractVectors,
  scaleVector,
  averageVectors,
} from '@philjs/vector-store';

// Normalize to unit length
const normalized = normalizeVector([3, 4]); // [0.6, 0.8]

// Add vectors
const sum = addVectors([1, 2], [3, 4]); // [4, 6]

// Subtract vectors
const diff = subtractVectors([5, 6], [1, 2]); // [4, 4]

// Scale vector
const scaled = scaleVector([1, 2], 3); // [3, 6]

// Average multiple vectors
const avg = averageVectors([
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
]); // [4, 5, 6]
```

## React-style Hooks

### useVectorStore

```typescript
import { useVectorStore } from '@philjs/vector-store';

function SearchComponent() {
  const {
    store,
    isReady,
    count,
    upsert,
    query,
    remove,
  } = useVectorStore({
    dimensions: 1536,
    metric: 'cosine',
  });

  const handleSearch = async (embedding: number[]) => {
    const results = await query({
      vector: embedding,
      topK: 10,
    });
    return results;
  };

  const handleAdd = async (doc: Document) => {
    await upsert({
      id: doc.id,
      vector: doc.embedding,
      metadata: { title: doc.title },
    });
  };

  return /* ... */;
}
```

### useVectorSearch

```typescript
import { useVectorSearch } from '@philjs/vector-store';

function SearchUI() {
  const {
    results,
    isSearching,
    error,
    search,
    clear,
  } = useVectorSearch(store, {
    topK: 10,
    minScore: 0.7,
  });

  const handleQuery = async (text: string) => {
    const embedding = await getEmbedding(text);
    await search(embedding);
  };

  return (
    <div>
      <input onChange={(e) => handleQuery(e.target.value)} />
      {isSearching && <Spinner />}
      {results.map(r => (
        <Result key={r.id} score={r.score} data={r.metadata} />
      ))}
    </div>
  );
}
```

### useHybridSearch

```typescript
import { useHybridSearch } from '@philjs/vector-store';

function HybridSearchUI() {
  const {
    results,
    isSearching,
    search,
  } = useHybridSearch(store, {
    vectorWeight: 0.7,
    textWeight: 0.3,
    textFields: ['title', 'content'],
  });

  const handleSearch = async (query: string) => {
    const embedding = await getEmbedding(query);
    await search(embedding, query);
  };

  return /* ... */;
}
```

## Types Reference

```typescript
// Vector document
interface VectorDocument {
  id: string;
  vector: number[];
  metadata?: Record<string, any>;
}

// Query options
interface QueryOptions {
  vector: number[];
  topK?: number;
  filter?: FilterExpression;
  minScore?: number;
  includeVectors?: boolean;
}

// Query result
interface QueryResult {
  id: string;
  score: number;
  metadata?: Record<string, any>;
  vector?: number[];
}

// Filter expression
type FilterExpression = {
  [key: string]: FilterValue | FilterOperator;
} | {
  $and?: FilterExpression[];
  $or?: FilterExpression[];
};

type FilterOperator = {
  $eq?: any;
  $ne?: any;
  $gt?: number;
  $gte?: number;
  $lt?: number;
  $lte?: number;
  $in?: any[];
  $nin?: any[];
  $contains?: any;
};

// Store configuration
interface VectorStoreConfig {
  dimensions: number;
  metric?: 'cosine' | 'euclidean' | 'dot' | 'manhattan' | 'hamming' | 'jaccard';
  indexType?: 'hnsw' | 'flat';
  hnswM?: number;
  hnswEfConstruction?: number;
  hnswEfSearch?: number;
  storageKey?: string;
  persistOnChange?: boolean;
  batchSize?: number;
  useWasm?: boolean;
}

// Store statistics
interface VectorStoreStats {
  count: number;
  dimensions: number;
  indexType: string;
  metric: string;
  memoryUsage: number;
}
```

## API Reference

### VectorStore Methods

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize the store |
| `upsert(docs)` | Insert or update vectors |
| `query(options)` | Search similar vectors |
| `hybridSearch(options)` | Combined vector + text search |
| `get(id)` | Get vector by ID |
| `getMany(ids)` | Get multiple vectors |
| `has(id)` | Check if vector exists |
| `delete(ids)` | Delete vectors by ID |
| `deleteByFilter(filter)` | Delete by metadata filter |
| `clear()` | Remove all vectors |
| `count()` | Get vector count |
| `listIds()` | Get all IDs |
| `export()` | Export store data |
| `import(data)` | Import store data |
| `persist()` | Save to IndexedDB |
| `getStats()` | Get store statistics |

### Hooks

| Hook | Description |
|------|-------------|
| `useVectorStore(config)` | Vector store management |
| `useVectorSearch(store, options)` | Vector similarity search |
| `useHybridSearch(store, options)` | Hybrid vector + text search |

## Example: RAG Application

```typescript
import { VectorStore, useVectorSearch } from '@philjs/vector-store';
import { getEmbedding } from './embeddings';

// Initialize store
const store = new VectorStore({
  dimensions: 1536,
  metric: 'cosine',
  indexType: 'hnsw',
});

await store.initialize();

// Index documents
async function indexDocuments(documents: Document[]) {
  const vectors = await Promise.all(
    documents.map(async (doc) => ({
      id: doc.id,
      vector: await getEmbedding(doc.content),
      metadata: {
        title: doc.title,
        content: doc.content,
        source: doc.source,
      },
    }))
  );

  await store.upsert(vectors);
}

// Search component
function RAGSearch() {
  const { results, isSearching, search } = useVectorSearch(store, {
    topK: 5,
    minScore: 0.7,
  });

  const handleSearch = async (query: string) => {
    const embedding = await getEmbedding(query);
    await search(embedding);
  };

  return (
    <div>
      <SearchInput onSearch={handleSearch} />

      {isSearching && <LoadingSpinner />}

      <div className="results">
        {results.map(result => (
          <div key={result.id} className="result">
            <h3>{result.metadata.title}</h3>
            <p>{result.metadata.content}</p>
            <span className="score">
              Relevance: {(result.score * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```
