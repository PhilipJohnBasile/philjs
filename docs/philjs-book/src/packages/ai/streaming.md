# Streaming Responses

Streaming yields tokens as they arrive, enabling real-time UI updates without waiting for a full completion. This creates a more responsive user experience, especially for long-form content.

## Why Streaming?

- **Better UX**: Users see content immediately instead of waiting
- **Perceived speed**: The app feels faster even if total time is the same
- **Cancellation**: Users can stop generation early if not useful
- **Memory efficiency**: Process token-by-token instead of buffering

## Basic Streaming

### Provider Streaming

All @philjs/ai providers support streaming via `generateStreamCompletion`:

```typescript
import { createOpenAIProvider } from '@philjs/ai';

const provider = createOpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });

// Stream returns an AsyncIterableIterator<string>
for await (const chunk of provider.generateStreamCompletion(
  'Write a short story about reactive programming',
  {
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 1000,
  }
)) {
  process.stdout.write(chunk); // Print as it arrives
}
```

### With Signals (Reactive UI)

```typescript
import { createOpenAIProvider } from '@philjs/ai';
import { signal, effect } from '@philjs/core';

const provider = createOpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });
const output = signal('');
const isStreaming = signal(false);

async function streamResponse(prompt: string) {
  output.set('');
  isStreaming.set(true);

  try {
    for await (const chunk of provider.generateStreamCompletion(prompt)) {
      output.set(output() + chunk);
    }
  } finally {
    isStreaming.set(false);
  }
}

// In a component
function StreamingChat() {
  return (
    <div>
      <button
        onClick={() => streamResponse('Explain signals in 3 paragraphs')}
        disabled={isStreaming()}
      >
        Generate
      </button>
      <div class={isStreaming() ? 'streaming' : ''}>
        {output() || 'Click to generate...'}
      </div>
    </div>
  );
}
```

## Cached Provider Streaming

The `CachedAIProvider` also supports streaming with cache integration:

```typescript
import { createCachedProvider, createMemoryCache, createOpenAIProvider } from '@philjs/ai';

const cachedProvider = createCachedProvider(
  createOpenAIProvider({ apiKey: 'sk-...' }),
  {
    storage: createMemoryCache(),
    ttl: 30 * 60 * 1000,
  }
);

// First call streams from API and caches the result
for await (const chunk of cachedProvider.generateStreamCompletion('Hello')) {
  console.log(chunk);
}

// Second call yields entire cached response immediately
for await (const chunk of cachedProvider.generateStreamCompletion('Hello')) {
  console.log(chunk); // Full response in one chunk
}
```

## Streaming Structured Output

Stream responses while validating against a Zod schema:

```typescript
import { streamStructured } from '@philjs/ai';
import { z } from 'zod';

const schema = z.object({
  title: z.string(),
  chapters: z.array(z.object({
    name: z.string(),
    summary: z.string(),
  })),
});

// Stream with incremental validation
for await (const partial of streamStructured(
  provider,
  'Create an outline for a book about signals',
  schema
)) {
  if (partial.complete) {
    // Final validated result
    console.log('Complete:', partial.data);
  } else {
    // Partial JSON (not yet valid)
    console.log('Streaming:', partial.raw);
  }
}
```

## Observable Provider Streaming

Track streaming metrics in real-time:

```typescript
import { createObservableProvider, createOpenAIProvider, ConsoleExporter } from '@philjs/ai';

const observable = createObservableProvider(
  createOpenAIProvider({ apiKey: 'sk-...' }),
  {
    trackTokens: true,
    trackCosts: true,
    exporters: [new ConsoleExporter()],
  }
);

let tokenCount = 0;
for await (const chunk of observable.generateStreamCompletion(prompt)) {
  tokenCount++;
  console.log(`Token ${tokenCount}:`, chunk);
}

// Get final metrics
const metrics = observable.getMetrics();
console.log('Stream complete:', metrics);
```

## Stream Control

### Cancellation

Stop consuming the iterator to cancel the stream:

```typescript
const controller = { cancelled: false };

async function streamWithCancel(prompt: string) {
  for await (const chunk of provider.generateStreamCompletion(prompt)) {
    if (controller.cancelled) {
      console.log('Stream cancelled');
      break; // Stops consuming, cleans up the stream
    }
    output.set(output() + chunk);
  }
}

// Later: cancel the stream
controller.cancelled = true;
```

### With AbortController (Fetch-style)

```typescript
async function streamWithAbort(prompt: string, signal: AbortSignal) {
  try {
    for await (const chunk of provider.generateStreamCompletion(prompt)) {
      if (signal.aborted) break;
      output.set(output() + chunk);
    }
  } catch (error) {
    if (signal.aborted) {
      console.log('Aborted');
    } else {
      throw error;
    }
  }
}

// Usage
const controller = new AbortController();
streamWithAbort('Generate a long story', controller.signal);

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);
```

### Token Limit

Stop after a certain number of tokens:

```typescript
async function streamWithLimit(prompt: string, maxTokens: number) {
  let tokenCount = 0;
  let result = '';

  for await (const chunk of provider.generateStreamCompletion(prompt)) {
    result += chunk;
    tokenCount += chunk.split(/\s+/).length; // Rough token estimate

    if (tokenCount > maxTokens) {
      console.log(`Stopped at ~${tokenCount} tokens`);
      break;
    }
  }

  return result;
}
```

## UI Patterns

### Typing Effect

```typescript
function TypingMessage({ stream }: { stream: () => string }) {
  return (
    <div class="message">
      <span class="text">{stream()}</span>
      <span class="cursor blink">|</span>
    </div>
  );
}
```

### Progress Indicator

```typescript
function StreamingWithProgress() {
  const output = signal('');
  const tokenCount = signal(0);
  const isStreaming = signal(false);

  async function generate() {
    output.set('');
    tokenCount.set(0);
    isStreaming.set(true);

    for await (const chunk of provider.generateStreamCompletion(prompt)) {
      output.set(output() + chunk);
      tokenCount.set(tokenCount() + 1);
    }

    isStreaming.set(false);
  }

  return (
    <div>
      <button onClick={generate} disabled={isStreaming()}>
        Generate
      </button>
      {isStreaming() && <span>Tokens: {tokenCount()}</span>}
      <div>{output()}</div>
    </div>
  );
}
```

### Chat Interface

```typescript
import { signal, memo } from '@philjs/core';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

function ChatInterface() {
  const messages = signal<Message[]>([]);
  const currentStream = signal('');
  const isStreaming = signal(false);

  async function sendMessage(content: string) {
    // Add user message
    messages.set([
      ...messages(),
      { id: crypto.randomUUID(), role: 'user', content },
    ]);

    // Start streaming response
    isStreaming.set(true);
    currentStream.set('');

    const assistantId = crypto.randomUUID();
    messages.set([
      ...messages(),
      { id: assistantId, role: 'assistant', content: '', streaming: true },
    ]);

    let fullResponse = '';
    for await (const chunk of provider.generateStreamCompletion(content)) {
      fullResponse += chunk;
      currentStream.set(fullResponse);

      // Update the assistant message in place
      messages.set(
        messages().map(m =>
          m.id === assistantId ? { ...m, content: fullResponse } : m
        )
      );
    }

    // Mark as complete
    messages.set(
      messages().map(m =>
        m.id === assistantId ? { ...m, streaming: false } : m
      )
    );
    isStreaming.set(false);
  }

  return (
    <div class="chat">
      {messages().map(msg => (
        <div
          key={msg.id}
          class={`message ${msg.role} ${msg.streaming ? 'streaming' : ''}`}
        >
          {msg.content}
          {msg.streaming && <span class="cursor">|</span>}
        </div>
      ))}
      <ChatInput onSubmit={sendMessage} disabled={isStreaming()} />
    </div>
  );
}
```

## Error Handling

```typescript
async function streamWithErrorHandling(prompt: string) {
  const output = signal('');
  const error = signal<string | null>(null);
  const isStreaming = signal(false);

  try {
    isStreaming.set(true);
    error.set(null);

    for await (const chunk of provider.generateStreamCompletion(prompt)) {
      output.set(output() + chunk);
    }
  } catch (e) {
    if (e instanceof Error) {
      error.set(e.message);
    } else {
      error.set('An unknown error occurred');
    }
  } finally {
    isStreaming.set(false);
  }

  return { output, error, isStreaming };
}
```

## Server-Sent Events (SSE)

For server-side streaming to clients:

```typescript
// Server (Node.js / Edge)
export async function streamHandler(request: Request) {
  const { prompt } = await request.json();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      for await (const chunk of provider.generateStreamCompletion(prompt)) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Client
async function streamFromServer(prompt: string) {
  const response = await fetch('/api/stream', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        const { chunk } = JSON.parse(line.slice(6));
        output.set(output() + chunk);
      }
    }
  }
}
```

## Performance Tips

1. **Batch DOM updates**: Use signals to batch reactive updates
2. **Debounce rendering**: For very fast streams, consider debouncing
3. **Use CSS animations**: Animate cursor/typing indicators with CSS
4. **Memory management**: Clear old content to prevent memory growth

## Next Steps

- [Code Generation](./codegen.md) - AI-powered code generation
- [Tools & Agents](./tools.md) - Build AI agents with tool calling
- [RAG Pipeline](./rag.md) - Retrieval augmented generation
