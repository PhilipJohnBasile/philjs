# philjs-ai

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D24-brightgreen)](https://nodejs.org)
[![TypeScript Version](https://img.shields.io/badge/typescript-%3E%3D6-blue)](https://www.typescriptlang.org)
[![ESM Only](https://img.shields.io/badge/module-ESM%20only-yellow)](https://nodejs.org/api/esm.html)

AI adapter with typed prompts and safety hooks for PhilJS.

## Requirements

- **Node.js 24** or higher
- **TypeScript 6** or higher
- **ESM only** - CommonJS is not supported

## Features

- **Type-safe AI prompts** - Typed prompt templates with validation
- **Multiple AI providers** - OpenAI, Anthropic, Google, local models
- **Streaming support** - Real-time streaming responses
- **Safety hooks** - Content moderation and rate limiting
- **Cost tracking** - Monitor API usage and costs
- **Caching** - Intelligent response caching
- **Error handling** - Automatic retries and fallbacks

## Installation

```bash
pnpm add philjs-ai
```

## Quick Start

### Basic Usage

```typescript
import { createAIClient, prompt } from 'philjs-ai';

const ai = createAIClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4'
});

// Simple completion
const response = await ai.complete('What is PhilJS?');
console.log(response.text);

// Typed prompts
const userGreeting = prompt<{ name: string }>`
  Greet the user named {{name}} in a friendly way.
`;

const greeting = await ai.complete(userGreeting({ name: 'Alice' }));
console.log(greeting.text);
```

### Streaming Responses

```typescript
import { createAIClient } from 'philjs-ai';
import { signal } from 'philjs-core';

const ai = createAIClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY
});

const response = signal('');

await ai.stream('Write a short story about PhilJS', {
  onChunk: (chunk) => {
    response.set(response() + chunk);
  }
});
```

### With Safety Hooks

```typescript
import { createAIClient, moderateContent } from 'philjs-ai';

const ai = createAIClient({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  hooks: {
    beforeRequest: async (prompt) => {
      // Content moderation
      const safe = await moderateContent(prompt);
      if (!safe) {
        throw new Error('Inappropriate content detected');
      }
      return prompt;
    },
    afterResponse: async (response) => {
      // Log for monitoring
      console.log('Tokens used:', response.usage.totalTokens);
      return response;
    }
  }
});
```

## Supported Providers

- **OpenAI** - GPT-4, GPT-3.5, etc.
- **Anthropic** - Claude 3 Opus, Sonnet, Haiku
- **Google** - Gemini Pro
- **Local** - Ollama, LM Studio

## API Reference

### `createAIClient(config)`

Create an AI client instance.

### `ai.complete(prompt, options?)`

Generate a text completion.

### `ai.stream(prompt, options?)`

Stream a response in real-time.

### `prompt<T>`

Create a typed prompt template.

## Documentation

For more information, see the [PhilJS documentation](../../docs).

## License

MIT
