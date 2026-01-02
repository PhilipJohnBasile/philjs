# Tool calling

Tool calling lets models delegate structured work to your code. `@philjs/ai` provides a tool builder plus several built-in tools.

## Define a tool

```ts
import { tool } from '@philjs/ai';

const greetTool = tool({
  name: 'greet',
  description: 'Return a greeting for a name',
  parameters: {
    name: { type: 'string', description: 'Name to greet' }
  },
  handler: async ({ name }) => ({ message: `Hello ${name}` })
});

const result = await greetTool.execute({ name: 'Ada' });
console.log(result);
```

## Built-in tools

- `webSearchTool`
- `calculatorTool`
- `weatherTool`
- `codeExecutionTool`
- `fileReadTool`

```ts
import { calculatorTool } from '@philjs/ai';

const value = await calculatorTool.execute({ expression: '10 * 4 + 2' });
```

## Connecting tools to models

Use `ToolDefinition` to describe available tools and execute `ToolCall` payloads returned by your model.

## Next steps

- Retrieval pipelines: [RAG](./rag.md)
- Streaming completions: [AI streaming](./streaming.md)
