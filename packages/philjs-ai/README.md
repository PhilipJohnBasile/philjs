
# @philjs/ai

The Neural Nervous System of the PhilJS Framework.

## Features
- **Agent Orchestration**: `Agent` class for managing LLM chains and tools.
- **Vectors**: Integrated `VectorStore` mocks for RAG applications.
- **Prompts**: Type-safe `PromptTemplate` system.

## Usage
```typescript
import { Agent } from '@philjs/ai';
const agent = new Agent({ model: 'gpt-4o' });
await agent.run("Analyze this repository");
```
