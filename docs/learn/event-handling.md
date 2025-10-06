# Event Handling

Learn how to handle user interactions like clicks, form inputs, keyboard events, and more in PhilJS.

## What You'll Learn

- Adding event handlers to elements
- Event types and TypeScript
- Event handler patterns
- Preventing default behavior
- Event propagation
- Best practices

## Basic Event Handling

Add event handlers using `on*` props:

```typescript
function Button() {
  const handleClick = () => {
    console.log('Button clicked!');
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### Inline Handlers

```typescript
// Simple inline handler
<button onClick={() => console.log('Clicked!')}>
  Click
</button>

// With signal updates
const count = signal(0);

<button onClick={() => count.set(c => c + 1)}>
  Count: {count()}
</button>
```

### Named Handlers

```typescript
function Form() {
  const handleSubmit = (e: Event) => {
    e.preventDefault();
    console.log('Form submitted');
  };

  const handleReset = () => {
    console.log('Form reset');
  };

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit">Submit</button>
      <button type="button" onClick={handleReset}>Reset</button>
    </form>
  );
}
```

## Common Events

### Click Events

```typescript
function ClickExample() {
  const clicks = signal(0);

  return (
    <div>
      <button onClick={() => clicks.set(c => c + 1)}>
        Clicked {clicks()} times
      </button>

      <button onDblClick={() => console.log('Double clicked!')}>
        Double click me
      </button>

      <div
        onContextMenu={(e) => {
          e.preventDefault();
          console.log('Right clicked!');
        }}
      >
        Right click me
      </div>
    </div>
  );
}
```

### Input Events

```typescript
function InputExample() {
  const value = signal('');

  return (
    <div>
      <input
        value={value()}
        onInput={(e) => value.set(e.target.value)}
        placeholder="Type here"
      />

      <textarea
        value={value()}
        onChange={(e) => value.set(e.target.value)}
      />

      <p>You typed: {value()}</p>
    </div>
  );
}
```

**onInput vs onChange:**
- `onInput` fires on every keystroke
- `onChange` fires when input loses focus

### Keyboard Events

```typescript
function KeyboardExample() {
  const handleKeyDown = (e: KeyboardEvent) => {
    console.log('Key:', e.key);

    if (e.key === 'Enter') {
      console.log('Enter pressed!');
    }

    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      console.log('Ctrl+S pressed!');
    }
  };

  return (
    <div>
      <input
        onKeyDown={handleKeyDown}
        onKeyPress={(e) => console.log('Key press:', e.key)}
        onKeyUp={(e) => console.log('Key up:', e.key)}
      />
    </div>
  );
}
```

### Mouse Events

```typescript
function MouseExample() {
  const position = signal({ x: 0, y: 0 });
  const isOver = signal(false);

  return (
    <div
      onMouseMove={(e) => position.set({ x: e.clientX, y: e.clientY })}
      onMouseEnter={() => isOver.set(true)}
      onMouseLeave={() => isOver.set(false)}
      style={{
        padding: '2rem',
        background: isOver() ? '#f0f0f0' : '#fff'
      }}
    >
      <p>Mouse position: {position().x}, {position().y}</p>
      <p>Hovering: {isOver() ? 'Yes' : 'No'}</p>
    </div>
  );
}
```

### Focus Events

```typescript
function FocusExample() {
  const isFocused = signal(false);

  return (
    <input
      onFocus={() => isFocused.set(true)}
      onBlur={() => isFocused.set(false)}
      style={{
        border: isFocused() ? '2px solid blue' : '1px solid gray'
      }}
      placeholder="Focus me"
    />
  );
}
```

### Form Events

```typescript
function FormExample() {
  const email = signal('');
  const password = signal('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();

    console.log('Submitting:', {
      email: email(),
      password: password()
    });
  };

  const handleReset = () => {
    email.set('');
    password.set('');
  };

  return (
    <form onSubmit={handleSubmit} onReset={handleReset}>
      <input
        type="email"
        value={email()}
        onInput={(e) => email.set(e.target.value)}
      />
      <input
        type="password"
        value={password()}
        onInput={(e) => password.set(e.target.value)}
      />
      <button type="submit">Submit</button>
      <button type="reset">Reset</button>
    </form>
  );
}
```

## TypeScript Event Types

Use proper TypeScript types for event handlers:

```typescript
// Mouse events
const handleClick = (e: MouseEvent) => {
  console.log('Clicked at', e.clientX, e.clientY);
};

// Keyboard events
const handleKeyDown = (e: KeyboardEvent) => {
  console.log('Key:', e.key, 'Code:', e.code);
};

// Form events
const handleSubmit = (e: SubmitEvent) => {
  e.preventDefault();
};

// Input events
const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  console.log('Value:', target.value);
};

// Focus events
const handleFocus = (e: FocusEvent) => {
  console.log('Focused');
};

// Drag events
const handleDrag = (e: DragEvent) => {
  console.log('Dragging');
};
```

### Generic Event Handler Type

```typescript
type EventHandler<T = Event> = (event: T) => void;

const onClick: EventHandler<MouseEvent> = (e) => {
  console.log(e.clientX);
};

const onKeyPress: EventHandler<KeyboardEvent> = (e) => {
  console.log(e.key);
};
```

## Event Handler Patterns

### Toggle Pattern

```typescript
function ToggleButton() {
  const isOn = signal(false);

  const toggle = () => isOn.set(v => !v);

  return (
    <button onClick={toggle}>
      {isOn() ? 'ON' : 'OFF'}
    </button>
  );
}
```

### Increment/Decrement Pattern

```typescript
function Counter() {
  const count = signal(0);

  return (
    <div>
      <button onClick={() => count.set(c => c - 1)}>-</button>
      <span>{count()}</span>
      <button onClick={() => count.set(c => c + 1)}>+</button>
    </div>
  );
}
```

### Passing Arguments

```typescript
function TodoList({ todos }: { todos: Signal<Todo[]> }) {
  const removeTodo = (id: number) => {
    todos.set(todos().filter(t => t.id !== id));
  };

  const toggleTodo = (id: number) => {
    todos.set(
      todos().map(t =>
        t.id === id ? { ...t, done: !t.done } : t
      )
    );
  };

  return (
    <ul>
      {todos().map(todo => (
        <li key={todo.id}>
          <input
            type="checkbox"
            checked={todo.done}
            onChange={() => toggleTodo(todo.id)}
          />
          <span>{todo.text}</span>
          <button onClick={() => removeTodo(todo.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

### Throttling

```typescript
function ThrottledInput() {
  const query = signal('');
  let timeout: number;

  const handleInput = (e: Event) => {
    const value = (e.target as HTMLInputElement).value;

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      query.set(value);
    }, 300);
  };

  return (
    <div>
      <input onInput={handleInput} placeholder="Search..." />
      <p>Searching for: {query()}</p>
    </div>
  );
}
```

### Debouncing

```typescript
function DebouncedSearch() {
  const searchTerm = signal('');
  const debouncedTerm = signal('');

  effect(() => {
    const term = searchTerm();
    const timer = setTimeout(() => {
      debouncedTerm.set(term);
    }, 500);

    return () => clearTimeout(timer);
  });

  return (
    <div>
      <input
        value={searchTerm()}
        onInput={(e) => searchTerm.set(e.target.value)}
      />
      <p>Searching for: {debouncedTerm()}</p>
    </div>
  );
}
```

## Preventing Default Behavior

Use `e.preventDefault()` to stop default actions:

```typescript
function Examples() {
  return (
    <div>
      {/* Prevent form submission */}
      <form onSubmit={(e) => {
        e.preventDefault();
        console.log('Handle form manually');
      }}>
        <button type="submit">Submit</button>
      </form>

      {/* Prevent link navigation */}
      <a href="/page" onClick={(e) => {
        e.preventDefault();
        console.log('Custom navigation');
      }}>
        Click me
      </a>

      {/* Prevent context menu */}
      <div onContextMenu={(e) => {
        e.preventDefault();
        console.log('Custom context menu');
      }}>
        Right click me
      </div>
    </div>
  );
}
```

## Event Propagation

### Stopping Propagation

```typescript
function NestedButtons() {
  return (
    <div onClick={() => console.log('Outer clicked')}>
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevents outer div from receiving event
          console.log('Inner clicked');
        }}
      >
        Click me
      </button>
    </div>
  );
}
```

### Event Bubbling

```typescript
function BubblingExample() {
  const handleParentClick = () => {
    console.log('Parent clicked');
  };

  const handleChildClick = (e: MouseEvent) => {
    console.log('Child clicked');
    // Event bubbles to parent after this
  };

  return (
    <div onClick={handleParentClick} style={{ padding: '2rem', background: '#eee' }}>
      Parent
      <div onClick={handleChildClick} style={{ padding: '1rem', background: '#ddd' }}>
        Child
      </div>
    </div>
  );
}
```

## Complex Event Handlers

### Multi-key Combinations

```typescript
function KeyCombinations() {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl/Cmd + S
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      console.log('Save');
    }

    // Ctrl + Shift + K
    if (e.ctrlKey && e.shiftKey && e.key === 'k') {
      e.preventDefault();
      console.log('Special action');
    }

    // Arrow keys
    if (e.key === 'ArrowUp') {
      console.log('Up');
    }
    if (e.key === 'ArrowDown') {
      console.log('Down');
    }
  };

  return (
    <input
      onKeyDown={handleKeyDown}
      placeholder="Try Ctrl+S or arrow keys"
    />
  );
}
```

### Drag and Drop

```typescript
function DragDropExample() {
  const draggedItem = signal<string | null>(null);

  const handleDragStart = (item: string) => (e: DragEvent) => {
    draggedItem.set(item);
    e.dataTransfer!.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
  };

  const handleDrop = (zone: string) => (e: DragEvent) => {
    e.preventDefault();
    console.log(`Dropped ${draggedItem()} in ${zone}`);
    draggedItem.set(null);
  };

  return (
    <div>
      <div
        draggable
        onDragStart={handleDragStart('Item 1')}
      >
        Drag me
      </div>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop('Zone A')}
        style={{ minHeight: '100px', background: '#f0f0f0' }}
      >
        Drop here
      </div>
    </div>
  );
}
```

### File Upload

```typescript
function FileUpload() {
  const files = signal<File[]>([]);

  const handleFileChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files) {
      files.set(Array.from(input.files));
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer?.files) {
      files.set(Array.from(e.dataTransfer.files));
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={{ padding: '2rem', border: '2px dashed #ccc' }}
    >
      <input type="file" multiple onChange={handleFileChange} />

      <p>Or drag files here</p>

      <ul>
        {files().map((file, i) => (
          <li key={i}>{file.name} ({file.size} bytes)</li>
        ))}
      </ul>
    </div>
  );
}
```

## Best Practices

### Use Arrow Functions for Simple Handlers

```typescript
// ✅ Good - concise
<button onClick={() => count.set(c => c + 1)}>+</button>

// ❌ Verbose
const increment = () => count.set(c => c + 1);
<button onClick={increment}>+</button>
```

### Extract Complex Handlers

```typescript
// ❌ Too complex inline
<form onSubmit={(e) => {
  e.preventDefault();
  if (!email().includes('@')) return;
  if (password().length < 8) return;
  fetch('/api/login', { /* ... */ });
}}>

// ✅ Extracted
const handleSubmit = (e: Event) => {
  e.preventDefault();

  if (!email().includes('@')) {
    alert('Invalid email');
    return;
  }

  if (password().length < 8) {
    alert('Password too short');
    return;
  }

  fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email: email(), password: password() })
  });
};

<form onSubmit={handleSubmit}>
```

### Type Your Handlers

```typescript
// ✅ Good - typed
const handleClick = (e: MouseEvent) => {
  console.log(e.clientX);
};

// ❌ Untyped
const handleClick = (e) => {
  console.log(e.clientX);
};
```

### Don't Create New Functions Every Render

```typescript
// ❌ Bad - if used in a re-rendering context
function Component() {
  return todos().map(todo => (
    <div onClick={() => handleClick(todo.id)}>
      {todo.text}
    </div>
  ));
}

// ✅ Good - but PhilJS doesn't re-render, so less of a concern
function Component() {
  const handleClick = (id: number) => () => {
    console.log(id);
  };

  return todos().map(todo => (
    <div onClick={handleClick(todo.id)}>
      {todo.text}
    </div>
  ));
}
```

## Common Mistakes

### Calling Handler Instead of Passing It

```typescript
// ❌ Wrong - calls immediately
<button onClick={handleClick()}>Click</button>

// ✅ Correct - passes function
<button onClick={handleClick}>Click</button>

// ✅ Also correct - arrow function
<button onClick={() => handleClick()}>Click</button>
```

### Forgetting to Prevent Default

```typescript
// ❌ Form submits and reloads page
<form onSubmit={handleSubmit}>
  <button>Submit</button>
</form>

// ✅ Prevents reload
const handleSubmit = (e: Event) => {
  e.preventDefault();
  // Handle submit
};
```

### Wrong Event Type

```typescript
// ❌ onChange on input (doesn't fire on every keystroke)
<input onChange={(e) => value.set(e.target.value)} />

// ✅ Use onInput for live updates
<input onInput={(e) => value.set(e.target.value)} />
```

## Summary

You've learned:

✅ Add event handlers with `on*` props
✅ Handle clicks, inputs, keyboard, mouse, and more
✅ Use TypeScript types for event safety
✅ Prevent default behavior with `e.preventDefault()`
✅ Stop propagation with `e.stopPropagation()`
✅ Implement common patterns like toggle, debounce, drag-drop
✅ Follow best practices for clean, maintainable code

Event handling in PhilJS is straightforward and type-safe!

---

**Next:** [Forms and Inputs →](./forms.md) Master form handling and validation
