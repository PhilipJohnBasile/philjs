# philjs-playground

Interactive browser playground for PhilJS - Try code without installing.

## Installation

```bash
pnpm add philjs-playground
```

## Usage

### Standalone Playground

Create a full-featured playground in your app:

```typescript
import { createPlayground } from 'philjs-playground';

const playground = createPlayground({
  container: '#playground',
  initialCode: `
    import { signal } from 'philjs-core';

    const count = signal(0);

    function App() {
      return (
        <button onClick={() => count.set(c => c + 1)}>
          Count: {count()}
        </button>
      );
    }

    export default App;
  `,
  theme: 'dark',
  autoRun: true,
  showConsole: true
});
```

### Individual Components

Use playground components separately:

```typescript
import { createEditor, createPreview, createConsole } from 'philjs-playground';

// Code editor with PhilJS syntax highlighting
const editor = createEditor({
  container: '#editor',
  language: 'typescript',
  theme: 'one-dark',
  onChange: (code) => {
    console.log('Code changed:', code);
  }
});

// Live preview panel
const preview = createPreview({
  container: '#preview',
  sandboxed: true
});

// Console output
const console = createConsole({
  container: '#console',
  maxMessages: 100
});

// Compile and run code
import { compileCode } from 'philjs-playground';

const result = await compileCode(editor.getValue());
if (result.success) {
  preview.run(result.code);
} else {
  console.error('Compilation failed:', result.errors);
}
```

## Features

- **CodeMirror Integration** - Powerful code editor with syntax highlighting
- **Live Preview** - Instant feedback with sandboxed execution
- **Console Output** - Capture and display console logs
- **Error Handling** - Beautiful error messages with stack traces
- **Examples Library** - Built-in examples and tutorials
- **TypeScript Support** - Full TypeScript compilation in the browser
- **Dark/Light Themes** - Customizable appearance
- **Auto-run Mode** - Execute code on change

## Configuration

### Playground Options

```typescript
interface PlaygroundConfig {
  // Target container element
  container: string | HTMLElement;

  // Initial code to display
  initialCode?: string;

  // Editor theme ('light' | 'dark' | 'one-dark')
  theme?: string;

  // Auto-run code on change
  autoRun?: boolean;

  // Debounce delay for auto-run (ms)
  debounce?: number;

  // Show console panel
  showConsole?: boolean;

  // Show examples sidebar
  showExamples?: boolean;

  // Enable TypeScript
  typescript?: boolean;

  // Custom imports to make available
  imports?: Record<string, any>;
}
```

### Editor Options

```typescript
interface EditorConfig {
  container: string | HTMLElement;
  language?: 'javascript' | 'typescript';
  theme?: string;
  lineNumbers?: boolean;
  lineWrapping?: boolean;
  tabSize?: number;
  onChange?: (code: string) => void;
}
```

### Preview Options

```typescript
interface PreviewConfig {
  container: string | HTMLElement;
  sandboxed?: boolean;
  onError?: (error: Error) => void;
  onMount?: () => void;
}
```

## API

### Playground

- `createPlayground(config)` - Create a full playground instance
- `playground.run()` - Execute current code
- `playground.setCode(code)` - Update editor code
- `playground.getCode()` - Get current code
- `playground.reset()` - Reset to initial code
- `playground.destroy()` - Clean up playground

### Editor

- `createEditor(config)` - Create editor instance
- `editor.getValue()` - Get current code
- `editor.setValue(code)` - Set editor code
- `editor.focus()` - Focus the editor
- `editor.destroy()` - Clean up editor

### Preview

- `createPreview(config)` - Create preview instance
- `preview.run(code)` - Execute compiled code
- `preview.clear()` - Clear preview
- `preview.destroy()` - Clean up preview

### Console

- `createConsole(config)` - Create console instance
- `console.log(...args)` - Log message
- `console.error(...args)` - Log error
- `console.warn(...args)` - Log warning
- `console.clear()` - Clear console
- `console.destroy()` - Clean up console

### Compiler

- `compileCode(code)` - Compile TypeScript/JSX to JavaScript
- `transpileCode(code)` - Transpile without type checking

## Examples

### Simple Counter

```typescript
const playground = createPlayground({
  container: '#playground',
  initialCode: `
    import { signal } from 'philjs-core';

    const count = signal(0);

    export default function Counter() {
      return (
        <div>
          <button onClick={() => count.set(c => c - 1)}>-</button>
          <span> {count()} </span>
          <button onClick={() => count.set(c => c + 1)}>+</button>
        </div>
      );
    }
  `
});
```

### Todo List

```typescript
const playground = createPlayground({
  container: '#playground',
  initialCode: `
    import { signal } from 'philjs-core';

    const todos = signal([]);
    const input = signal('');

    function addTodo() {
      if (input().trim()) {
        todos.set([...todos(), { text: input(), done: false }]);
        input.set('');
      }
    }

    export default function TodoApp() {
      return (
        <div>
          <input
            value={input()}
            onInput={(e) => input.set(e.target.value)}
            placeholder="Add todo..."
          />
          <button onClick={addTodo}>Add</button>
          <ul>
            {todos().map((todo, i) => (
              <li>
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => {
                    const updated = [...todos()];
                    updated[i].done = !updated[i].done;
                    todos.set(updated);
                  }}
                />
                {todo.text}
              </li>
            ))}
          </ul>
        </div>
      );
    }
  `
});
```

### Custom Theme

```typescript
const playground = createPlayground({
  container: '#playground',
  theme: {
    background: '#1e1e1e',
    foreground: '#d4d4d4',
    selection: '#264f78',
    lineNumber: '#858585',
    keyword: '#569cd6',
    string: '#ce9178',
    comment: '#6a9955'
  }
});
```

## Built-in Examples

Access pre-built examples:

```typescript
import { exampleCode, tutorialSteps } from 'philjs-playground';

// Load an example
playground.setCode(exampleCode.counter);
playground.setCode(exampleCode.todoList);
playground.setCode(exampleCode.fetchData);

// Start tutorial
tutorialSteps.forEach((step, i) => {
  console.log(`Step ${i + 1}: ${step.title}`);
  playground.setCode(step.code);
});
```

## Documentation

For more information, see the [PhilJS documentation](../../docs).

## License

MIT
