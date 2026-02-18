# API Reference

The `@philjs/ai` package is organized into several sub-modules. You can import from the main package or specific subpaths.

## Core Exports

Available via `import { ... } from '@philjs/ai'`

| Export | Description |
|--------|-------------|
| `createAI` | Main entry point for creating AI clients |
| `createObservableProvider` | Wrapper for adding telemetry and cost tracking |
| `createCachedProvider` | Wrapper for adding caching to providers |
| `withCache` | Function decorator for caching results |

## Sub-modules

### Providers
`import { ... } from '@philjs/ai/providers'`

| Export | Description |
|--------|-------------|
| `openaiProvider` | OpenAI API integration |
| `anthropicProvider` | Anthropic Claude integration |
| `googleProvider` | Google Gemini integration |
| `mistralProvider` | Mistral AI integration |
| `ollamaProvider` | Local Ollama integration |

### Codegen
`import { ... } from '@philjs/ai/codegen'`

- `generateCode`: Generate code from natural language prompts.
- `explainCode`: Get explanations for code snippets.
- `refactorCode`: Automated refactoring suggestions.

### Testing
`import { ... } from '@philjs/ai/testing'`

- `generateTests`: Create unit tests for functions.
- `fuzzTest`: AI-driven fuzz testing.

### Refactor
`import { ... } from '@philjs/ai/refactor'`

- `detectSmells`: Identify code smells.
- `suggestImprovements`: Get optimization suggestions.

### Docs
`import { ... } from '@philjs/ai/docs'`

- `generateDocs`: Generate JSDoc/TSDoc comments.
- `generateReadme`: Create README files from code analysis.

## Types

Detailed type definitions are available for all interfaces.

```typescript
import type { 
  AIProvider, 
  CompletionOptions, 
  ProviderResponse,
  AIMetrics,
  CacheConfig
} from '@philjs/ai';
```
