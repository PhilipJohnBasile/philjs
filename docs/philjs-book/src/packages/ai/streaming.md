# Streaming responses

Streaming yields tokens as they arrive so UI can update without waiting for a full completion.

## Streaming with providers

`AIProvider` exposes `generateStreamCompletion` when a model supports streaming.

```ts
import { createOpenAIProvider } from '@philjs/ai';
import { signal } from '@philjs/core';

const provider = createOpenAIProvider({ apiKey: process.env.OPENAI_API_KEY });
const output = signal('');

if (!provider.generateStreamCompletion) {
  throw new Error('Provider does not support streaming');
}

for await (const chunk of provider.generateStreamCompletion(
  'Write a short story about PhilJS',
  { model: 'gpt-4-turbo-preview' }
)) {
  output.set(output() + chunk);
}
```

## Canceling a stream

Stop consuming the iterator when you want to abort.

```ts
let tokens = 0;
for await (const chunk of provider.generateStreamCompletion(prompt)) {
  tokens += chunk.length;
  if (tokens > 2000) break;
}
```

## UI pattern

In components, store the stream in a signal and render the partial output on each tick.

## Next steps

- Code generation: [Codegen](./codegen.md)
- Tool calling: [Tools](./tools.md)
