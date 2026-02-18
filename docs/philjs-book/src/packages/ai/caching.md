# Caching

The caching layer in `@philjs/ai` provides high-performance response caching to reduce API costs and latency. It supports exact matching and semantic similarity matching using embeddings.

## Features

- **Multi-Level Storage**: Adapters for In-Memory and Redis storage.
- **Semantic Caching**: Cache hits based on meaning rather than exact text (uses vector similarity).
- **Function Decorators**: Easily cache existing AI functions.
- **Stats Tracking**: Monitor hit rates, saved tokens, and avoided costs.

## Usage

### Basic Provider Caching

Wrap any provider with `createCachedProvider` to enable caching.

```typescript
import { createCachedProvider, createMemoryCache } from '@philjs/ai';
import { openaiProvider } from '@philjs/ai/providers';

const cachedProvider = createCachedProvider(openaiProvider, {
  storage: createMemoryCache(),
  ttl: 60 * 60 * 1000, // 1 hour
});

// First call: Hits API (Cache Miss)
const result1 = await cachedProvider.generateCompletion('Explain quantum physics');

// Second call: Returns cached result instantly (Cache Hit)
const result2 = await cachedProvider.generateCompletion('Explain quantum physics');
```

### Semantic Caching

Enable semantic matching to return cached results for prompts with similar meaning but different wording. This requires an embedding provider.

```typescript
const semanticCache = createCachedProvider(openaiProvider, {
  storage: createRedisCache(redisClient),
  semanticMatching: true,
  similarityThreshold: 0.95, // 0-1 confidence
  embeddingProvider: openaiProvider, // Used to generate embeddings for keys
});

// "Hello world" -> Cache Miss
await semanticCache.generateCompletion('Hello world');

// "Hi world" -> Cache Hit (if similarity > 0.95)
await semanticCache.generateCompletion('Hi world');
```

## Function Decorator

Use the `withCache` decorator to add caching to any async function that returns a string.

```typescript
import { withCache, createMemoryCache } from '@philjs/ai';

const analyzeSentiment = withCache(
  async (text: string) => {
    // Expensive API call here
    return api.classify(text);
  },
  {
    storage: createMemoryCache(),
    ttl: 30 * 60 * 1000 // 30 mins
  }
);

// Results are cached based on arguments
const result = await analyzeSentiment('I love this product');
```

## Storage Backends

### Memory Storage
Fast, local, ephemeral. Good for development or serverless instances with short lifespans.

```typescript
import { createMemoryCache } from '@philjs/ai';

const storage = createMemoryCache(1000); // Storage up to 1000 entries
```

### Redis Storage
Distributed, persistent. Recommended for production.

```typescript
import { createRedisCache } from '@philjs/ai';
import { createClient } from 'redis';

const client = createClient({ url: 'redis://localhost:6379' });
await client.connect();

const storage = createRedisCache(client, 'philjs:ai:cache:');
```

## Configuration

### CacheConfig

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `storage` | `CacheStorage` | required | Backend storage implementation |
| `ttl` | `number` | `3600000` | Time-to-live in ms (1 hour) |
| `maxSize` | `number` | `1000` | Max entries (Memory storage only) |
| `semanticMatching` | `boolean` | `false` | Enable vector similarity matching |
| `similarityThreshold` | `number` | `0.95` | Cosine similarity threshold (0-1) |
| `embeddingProvider` | `AIProvider` | - | Provider for generating embeddings |
