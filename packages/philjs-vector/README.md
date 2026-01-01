# @philjs/vector

Vector embeddings and RAG pipelines for PhilJS - semantic search, document chunking, hybrid search

<!-- PACKAGE_GUIDE_START -->
## Overview

Vector embeddings and RAG pipelines for PhilJS - semantic search, document chunking, hybrid search

## Focus Areas

- philjs, vector, embeddings, rag, semantic-search, openai, cohere, indexeddb

## Entry Points

- packages/philjs-vector/src/index.ts

## Quick Start

```ts
import { // Core classes
  RAGPipeline, // Document loaders
  TextLoader, // Embedding providers
  OpenAIEmbeddings } from '@philjs/vector';
```

Wire the exported helpers into your app-specific workflow. See the API snapshot for the full surface.

## Exports at a Glance

- // Core classes
  RAGPipeline
- // Document loaders
  TextLoader
- // Embedding providers
  OpenAIEmbeddings
- // Hooks
  useRAG
- // Types
  type Document
- ChunkOptions
- CohereEmbeddings
- DocumentLoader
- Embedding
- EmbeddingProvider
- EmbeddingProviderConfig
- IndexedDBVectorStore
<!-- PACKAGE_GUIDE_END -->

## Install

```bash
pnpm add @philjs/vector
```
## Usage

```ts
import { // Core classes
  RAGPipeline, // Document loaders
  TextLoader, // Embedding providers
  OpenAIEmbeddings } from '@philjs/vector';
```

## Scripts

- pnpm run build
- pnpm run test

## Compatibility

- Node >=24
- TypeScript 6

<!-- API_SNAPSHOT_START -->
## API Snapshot

This section is generated from the package source. Run `node scripts/generate-package-atlas.mjs` to refresh.

### Entry Points
- Export keys: .
- Source files: packages/philjs-vector/src/index.ts

### Public API
- Direct exports: // Core classes
  RAGPipeline, // Document loaders
  TextLoader, // Embedding providers
  OpenAIEmbeddings, // Hooks
  useRAG, // Types
  type Document, ChunkOptions, CohereEmbeddings, DocumentLoader, Embedding, EmbeddingProvider, EmbeddingProviderConfig, IndexedDBVectorStore, JSONLoader, LocalEmbeddings, MarkdownLoader, MemoryVectorStore, RAGConfig, RAGQuery, RAGResult, SearchResult, TextChunker, URLLoader, UseRAGResult, VectorStore, VectorStoreConfig, useEmbeddings
- Re-exported names: (none detected)
- Re-exported modules: (none detected)
<!-- API_SNAPSHOT_END -->

## License

MIT
