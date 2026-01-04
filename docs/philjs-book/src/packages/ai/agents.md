
# AI Agents (`@philjs/ai`)

The `@philjs/ai` package provides the core primitives for building autonomous agents.

## Features

### `Agent` Class
The `Agent` class orchestrates LLM interactions, memory management, and tool execution.

```typescript
import { Agent } from '@philjs/ai';

const agent = new Agent({ model: 'gpt-4o' });
const response = await agent.run("Analyze the database schema.");
```

### Vector Store
Embeddings and similarity search simulation.

### RAG (Retrieval-Augmented Generation)
Connect your data to the AI context window.
