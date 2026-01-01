# AI Integration

PhilJS provides type-safe AI integration that makes it easy to build AI-powered features directly into your web applications. The `@philjs/ai` package offers a unique, strongly-typed approach to working with AI providers, ensuring type safety from prompts to responses.

## Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Complete Examples](#complete-examples)
- [Provider Integration](#provider-integration)
- [Best Practices](#best-practices)
- [Advanced Usage](#advanced-usage)

## Overview

PhilJS AI integration stands out with these unique features:

- **Type-Safe Prompts**: Define input and output types for your AI interactions
- **PII Policy Enforcement**: Built-in controls for sensitive data
- **Cost Budget Management**: Track and limit AI spending per prompt
- **Provider Agnostic**: Works with any AI API (OpenAI, Anthropic, custom endpoints)
- **Streaming Support**: Handle real-time AI responses
- **Framework Integration**: Seamless integration with PhilJS components and signals

### Why Type-Safe AI?

Traditional AI integrations lack type safety, leading to runtime errors and unpredictable behavior. PhilJS AI ensures:

```typescript
// ❌ Traditional approach - no type safety
const response = await openai.chat({ prompt: "Hello" });
const data = response.text; // What type is this? Unknown!

// ✅ PhilJS approach - fully typed
const chatPrompt = createPrompt<{ message: string }, { reply: string }>({
  in: { message: "" },
  out: { reply: "" }
});
const response = await ai.generate(chatPrompt, { message: "Hello" });
const reply: string = response.text; // TypeScript knows this is a string!
```

## Installation

```bash
npm install @philjs/ai
# or
pnpm add @philjs/ai
# or
yarn add @philjs/ai
```

## Quick Start

Here's a minimal example to get started:

```typescript
import { createPrompt, createAI, providers } from '@philjs/ai';

// 1. Define a typed prompt specification
const chatPrompt = createPrompt({
  in: { message: "" },
  out: { reply: "" },
  policy: {
    pii: "block",
    costBudgetCents: 10
  }
});

// 2. Create an AI client with a provider
const ai = createAI(providers.http("https://api.openai.com/v1/chat"));

// 3. Generate a response (fully typed!)
const response = await ai.generate(chatPrompt, {
  message: "What is PhilJS?"
});

console.log(response.text); // AI's response
```

## API Reference

### `createPrompt<TInput, TOutput>(spec)`

Creates a type-safe prompt specification.

**Type Parameters:**
- `TInput`: The input data type for the prompt
- `TOutput`: The expected output data type from the AI

**Parameters:**
- `spec: PromptSpec<TInput, TOutput>`: Prompt specification object
  - `in: TInput`: Example/shape of input data
  - `out: TOutput`: Example/shape of output data
  - `policy?: object`: Optional policy controls
    - `pii?: "block" | "allow"`: PII handling policy (default: "allow")
    - `costBudgetCents?: number`: Maximum cost in cents per call

**Returns:** `PromptSpec<TInput, TOutput>` - A typed prompt specification

**Example:**
```typescript
type UserQuery = { question: string; context?: string };
type AIAnswer = { answer: string; confidence: number; sources: string[] };

const qaPrompt = createPrompt<UserQuery, AIAnswer>({
  in: { question: "", context: "" },
  out: { answer: "", confidence: 0, sources: [] },
  policy: {
    pii: "block",
    costBudgetCents: 50
  }
});
```

### `createAI(provider)`

Creates an AI client that uses the specified provider.

**Parameters:**
- `provider: Provider`: AI provider configuration

**Returns:** AI client with `generate()` method

**Methods:**
- `async generate<TI, TO>(spec: PromptSpec<TI, TO>, input: TI, opts?: object): Promise<{ text: string }>`
  - Generates an AI response based on the prompt and input
  - Automatically enforces PII and cost policies
  - Returns typed response

**Example:**
```typescript
const ai = createAI(providers.http("https://api.anthropic.com/v1/messages"));

const result = await ai.generate(
  chatPrompt,
  { message: "Hello!" },
  { temperature: 0.7, maxTokens: 100 }
);
```

### `providers`

Built-in provider configurations.

#### `providers.http(url)`

HTTP provider that POSTs to an AI endpoint.

**Parameters:**
- `url: string`: The AI API endpoint URL

**Returns:** `Provider` object

**Example:**
```typescript
const openaiProvider = providers.http("https://api.openai.com/v1/chat/completions");
const ai = createAI(openaiProvider);
```

#### `providers.echo()`

Echo provider for testing (returns the prompt as-is).

**Returns:** `Provider` object

**Example:**
```typescript
const testAI = createAI(providers.echo());
const response = await testAI.generate(chatPrompt, { message: "Test" });
console.log(response.text); // "Echo: {\"spec\":...,\"input\":{\"message\":\"Test\"}}"
```

### Custom Providers

You can create custom providers for any AI service:

```typescript
import type { Provider } from '@philjs/ai';

const customProvider: Provider = {
  name: "my-custom-ai",
  async generate(prompt: string, opts?: Record<string, any>): Promise<string> {
    const response = await fetch("https://my-ai-api.com/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, ...opts })
    });

    const data = await response.json();
    return data.generatedText;
  }
};

const ai = createAI(customProvider);
```

## Complete Examples

### Example 1: AI-Powered Chatbot

```typescript
import { signal } from '@philjs/core';
import { createPrompt, createAI, providers } from '@philjs/ai';

// Define chat types
type ChatMessage = { role: 'user' | 'assistant'; content: string };
type ChatInput = { messages: ChatMessage[] };
type ChatOutput = { reply: string };

// Create typed prompt
const chatPrompt = createPrompt<ChatInput, ChatOutput>({
  in: { messages: [] },
  out: { reply: "" },
  policy: {
    pii: "allow", // Chat may contain user info
    costBudgetCents: 100 // Max $1 per message
  }
});

// Initialize AI
const ai = createAI(providers.http(import.meta.env.VITE_AI_ENDPOINT));

function ChatBot() {
  const messages = signal<ChatMessage[]>([]);
  const input = signal("");
  const loading = signal(false);

  const sendMessage = async () => {
    if (!input()) return;

    // Add user message
    messages.set([...messages(), {
      role: 'user',
      content: input()
    }]);
    input.set("");
    loading.set(true);

    try {
      // Generate AI response
      const response = await ai.generate(chatPrompt, {
        messages: messages()
      });

      // Add AI response
      messages.set([...messages(), {
        role: 'assistant',
        content: response.text
      }]);
    } catch (error) {
      console.error("AI error:", error);
    } finally {
      loading.set(false);
    }
  };

  return (
    <div class="chatbot">
      <div class="messages">
        {messages().map(msg => (
          <div class={`message ${msg.role}`}>
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <div class="input-area">
        <input
          type="text"
          value={input()}
          onInput={(e) => input.set(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          disabled={loading()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} disabled={loading()}>
          {loading() ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
}
```

### Example 2: Content Generation with Streaming

```typescript
import { signal } from '@philjs/core';
import { createPrompt, createAI, providers } from '@philjs/ai';

type GenerateInput = { topic: string; style: 'formal' | 'casual' };
type GenerateOutput = { content: string };

const generatePrompt = createPrompt<GenerateInput, GenerateOutput>({
  in: { topic: "", style: "casual" },
  out: { content: "" },
  policy: {
    costBudgetCents: 200 // Max $2 per generation
  }
});

const ai = createAI(providers.http(import.meta.env.VITE_AI_ENDPOINT));

function ContentGenerator() {
  const topic = signal("");
  const style = signal<'formal' | 'casual'>("casual");
  const generatedContent = signal("");
  const generating = signal(false);

  const generate = async () => {
    if (!topic()) return;

    generating.set(true);
    generatedContent.set("");

    try {
      const response = await ai.generate(generatePrompt, {
        topic: topic(),
        style: style()
      });

      generatedContent.set(response.text);
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      generating.set(false);
    }
  };

  return (
    <div class="generator">
      <h2>Content Generator</h2>

      <input
        type="text"
        value={topic()}
        onInput={(e) => topic.set(e.target.value)}
        placeholder="Enter a topic..."
      />

      <select value={style()} onChange={(e) => style.set(e.target.value as any)}>
        <option value="casual">Casual</option>
        <option value="formal">Formal</option>
      </select>

      <button onClick={generate} disabled={generating()}>
        {generating() ? "Generating..." : "Generate Content"}
      </button>

      {generatedContent() && (
        <div class="result">
          <h3>Generated Content:</h3>
          <div class="content">{generatedContent()}</div>
        </div>
      )}
    </div>
  );
}
```

### Example 3: Form Auto-Completion

```typescript
import { signal, effect } from '@philjs/core';
import { createPrompt, createAI, providers } from '@philjs/ai';

type AutocompleteInput = { partial: string; context: string };
type AutocompleteOutput = { suggestions: string[] };

const autocompletePrompt = createPrompt<AutocompleteInput, AutocompleteOutput>({
  in: { partial: "", context: "" },
  out: { suggestions: [] },
  policy: {
    pii: "block",
    costBudgetCents: 5 // Very cheap for autocomplete
  }
});

const ai = createAI(providers.http(import.meta.env.VITE_AI_ENDPOINT));

function SmartForm() {
  const description = signal("");
  const suggestions = signal<string[]>([]);

  // Auto-suggest as user types
  effect(() => {
    const text = description();
    if (text.length > 10) {
      ai.generate(autocompletePrompt, {
        partial: text,
        context: "product description"
      }).then(result => {
        // Parse suggestions from response
        try {
          const data = JSON.parse(result.text);
          suggestions.set(data.suggestions || []);
        } catch {
          suggestions.set([]);
        }
      });
    }
  });

  return (
    <div>
      <textarea
        value={description()}
        onInput={(e) => description.set(e.target.value)}
        placeholder="Describe your product..."
      />

      {suggestions().length > 0 && (
        <div class="suggestions">
          <h4>Suggestions:</h4>
          {suggestions().map(s => (
            <button onClick={() => description.set(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Provider Integration

### OpenAI Integration

```typescript
import { createAI, createPrompt } from '@philjs/ai';

const openaiProvider = {
  name: "openai",
  async generate(prompt: string, opts?: any) {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: opts?.model || "gpt-4",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: opts?.temperature || 0.7,
        max_tokens: opts?.maxTokens || 500
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  }
};

const ai = createAI(openaiProvider);
```

### Anthropic Claude Integration

```typescript
const anthropicProvider = {
  name: "anthropic",
  async generate(prompt: string, opts?: any) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: opts?.model || "claude-3-opus-20240229",
        max_tokens: opts?.maxTokens || 1024,
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    return data.content[0].text;
  }
};
```

### Local AI Models (Ollama)

```typescript
const ollamaProvider = {
  name: "ollama",
  async generate(prompt: string, opts?: any) {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: opts?.model || "llama2",
        prompt: prompt,
        stream: false
      })
    });

    const data = await response.json();
    return data.response;
  }
};

const ai = createAI(ollamaProvider);
```

## Best Practices

### 1. Always Define PII Policies

```typescript
// ✅ Good - explicitly handle PII
const userPrompt = createPrompt({
  in: { userData: {} },
  out: { analysis: "" },
  policy: {
    pii: "block" // or "allow" with proper consent
  }
});

// ❌ Bad - no PII consideration
const userPrompt = createPrompt({
  in: { userData: {} },
  out: { analysis: "" }
});
```

### 2. Set Cost Budgets

```typescript
// ✅ Good - prevent runaway costs
const expensivePrompt = createPrompt({
  in: { largeDocument: "" },
  out: { summary: "" },
  policy: {
    costBudgetCents: 500 // Max $5
  }
});
```

### 3. Handle Errors Gracefully

```typescript
async function generateWithFallback() {
  try {
    const response = await ai.generate(prompt, input);
    return response.text;
  } catch (error) {
    if (error.message.includes("cost budget")) {
      console.error("Cost budget exceeded");
      return "Content unavailable due to cost limits";
    }
    if (error.message.includes("PII")) {
      console.error("PII policy violation");
      return "Cannot process sensitive data";
    }
    throw error; // Re-throw unknown errors
  }
}
```

### 4. Use Debouncing for Real-Time Features

```typescript
import { signal, effect } from '@philjs/core';

let debounceTimer: number;

effect(() => {
  const userInput = input();

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    // Only call AI after 500ms of no typing
    const result = await ai.generate(prompt, { text: userInput });
    suggestions.set(result.text);
  }, 500);
});
```

### 5. Cache Responses When Appropriate

```typescript
const responseCache = new Map<string, string>();

async function generateCached(input: any) {
  const key = JSON.stringify(input);

  if (responseCache.has(key)) {
    return { text: responseCache.get(key)! };
  }

  const response = await ai.generate(prompt, input);
  responseCache.set(key, response.text);

  return response;
}
```

## Advanced Usage

### Rate Limiting AI Calls

```typescript
import { signal } from '@philjs/core';

class RateLimitedAI {
  private queue: Array<() => Promise<any>> = [];
  private processing = signal(false);
  private lastCall = 0;
  private minInterval = 1000; // 1 second between calls

  async generate(prompt: any, input: any) {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastCall;

        if (timeSinceLastCall < this.minInterval) {
          await new Promise(r => setTimeout(r, this.minInterval - timeSinceLastCall));
        }

        try {
          const result = await ai.generate(prompt, input);
          this.lastCall = Date.now();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing() || this.queue.length === 0) return;

    this.processing.set(true);

    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      await task();
    }

    this.processing.set(false);
  }
}

const rateLimitedAI = new RateLimitedAI();
```

### Composing Multiple AI Calls

```typescript
async function analyzeAndSummarize(text: string) {
  // Step 1: Analyze sentiment
  const sentimentResult = await ai.generate(sentimentPrompt, { text });

  // Step 2: Extract key points (uses sentiment result)
  const keyPointsResult = await ai.generate(keyPointsPrompt, {
    text,
    sentiment: sentimentResult.text
  });

  // Step 3: Generate summary (uses both)
  const summaryResult = await ai.generate(summaryPrompt, {
    text,
    sentiment: sentimentResult.text,
    keyPoints: keyPointsResult.text
  });

  return {
    sentiment: sentimentResult.text,
    keyPoints: keyPointsResult.text,
    summary: summaryResult.text
  };
}
```

### Integration with Server Actions

```typescript
// In your route:
export async function POST({ request }: { request: Request }) {
  const { message } = await request.json();

  const response = await ai.generate(chatPrompt, { message });

  return new Response(JSON.stringify({
    reply: response.text
  }), {
    headers: { "Content-Type": "application/json" }
  });
}

// In your component:
async function sendMessage() {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: input() })
  });

  const data = await response.json();
  messages.set([...messages(), { role: "assistant", content: data.reply }]);
}
```

## Security Considerations

### 1. Never Expose API Keys Client-Side

```typescript
// ❌ Bad - API key exposed to client
const ai = createAI(providers.http("https://api.openai.com/v1/chat", {
  apiKey: "sk-..." // This will be visible in browser!
}));

// ✅ Good - Use server-side proxy
const ai = createAI(providers.http("/api/ai-proxy"));

// Server-side (api/ai-proxy):
export async function POST({ request }) {
  const body = await request.json();

  const response = await fetch("https://api.openai.com/v1/chat", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` // Safe!
    },
    body: JSON.stringify(body)
  });

  return response;
}
```

### 2. Validate and Sanitize Input

```typescript
function sanitizeInput(text: string): string {
  // Remove potential injection attacks
  return text
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim()
    .substring(0, 10000); // Limit length
}

const response = await ai.generate(prompt, {
  message: sanitizeInput(userInput)
});
```

### 3. Implement Request Signing

```typescript
import crypto from 'crypto';

function signRequest(payload: any, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return hmac.digest('hex');
}

const payload = { message: userInput };
const signature = signRequest(payload, process.env.AI_SECRET!);

const response = await fetch("/api/ai", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Signature": signature
  },
  body: JSON.stringify(payload)
});
```

## Performance Tips

1. **Use Streaming for Long Responses**: Consider implementing streaming for better UX
2. **Implement Progressive Enhancement**: Show UI immediately, enhance with AI
3. **Prefetch Common Responses**: Cache frequently requested AI outputs
4. **Use Worker Threads**: Process AI responses in background for better performance
5. **Optimize Prompt Size**: Shorter prompts = faster responses and lower costs

## Related Documentation

- [Server-Side Rendering](./ssr.md) - Integrate AI on the server
- [State Management](../core/signals.md) - Managing AI response state
- [Error Boundaries](../error-handling/resilience.md) - Handling AI failures
- [Cost Tracking](./cost-tracking.md) - Monitor AI spending

## Troubleshooting

### Issue: PII Policy Violations

If you see PII policy errors, either:
1. Set `policy.pii: "allow"` (with user consent)
2. Remove PII from input data before sending

### Issue: Cost Budget Exceeded

Increase the budget or optimize prompts:
```typescript
policy: {
  costBudgetCents: 1000 // Increase from 100
}
```

### Issue: Slow Response Times

Consider:
1. Using a faster model
2. Reducing max tokens
3. Implementing response caching
4. Using streaming responses

---

**Next Steps:**
- Explore [Cost Tracking](./cost-tracking.md) to monitor AI spending
- Learn about [Usage Analytics](./usage-analytics.md) for optimization
- See [DevTools](./devtools.md) for debugging AI interactions


