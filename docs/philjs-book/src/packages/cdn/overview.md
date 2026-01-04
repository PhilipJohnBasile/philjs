# @philjs/cdn - Complete Reference

The `@philjs/cdn` package provides a single-file bundle for Alpine.js-style usage. No build step required - just include PhilJS via CDN and start building reactive UIs directly in HTML.

## Installation

### Via CDN (Recommended)

```html
<!-- unpkg -->
<script src="https://unpkg.com/@philjs/cdn"></script>

<!-- jsdelivr -->
<script src="https://unpkg.com/@philjs/cdn"></script>
```

### Via npm (for bundlers)

```bash
npm install @philjs/cdn
# or
pnpm add @philjs/cdn
# or
bun add @philjs/cdn
```

## Features

- **Zero Build Step** - Include via script tag and start coding immediately
- **Fine-Grained Reactivity** - Signals, memos, and effects with automatic dependency tracking
- **Template Literals** - Tagged `html` template for declarative rendering
- **Alpine.js-Style Directives** - Familiar `x-data`, `x-text`, `x-show`, `x-bind`, `x-on`, `x-model`, `x-for`, `x-if` directives
- **Two-Way Data Binding** - Automatic form input synchronization with `x-model`
- **Event Modifiers** - `.prevent`, `.stop`, `.once`, `.self` for event handling
- **Reactive Stores** - Create reactive stores with actions and subscriptions
- **Auto-Initialization** - Automatically detects and initializes `x-data` components
- **Tiny Bundle** - Minimal footprint for fast page loads
- **TypeScript Support** - Full type definitions included

## Quick Start

### Script-Based Usage

```html
<!DOCTYPE html>
<html>
<head>
  <title>PhilJS CDN Demo</title>
  <script src="https://unpkg.com/@philjs/cdn"></script>
</head>
<body>
  <div id="app"></div>

  <script>
    const { signal, effect, html, render } = PhilJS;

    // Create reactive state
    const count = signal(0);

    // React to changes
    effect(() => console.log('Count:', count()));

    // Render reactive UI
    render(
      html`<button onclick=${() => count.set(count() + 1)}>
        Clicked ${count} times
      </button>`,
      document.getElementById('app')
    );
  </script>
</body>
</html>
```

### Alpine.js-Style Usage

```html
<!DOCTYPE html>
<html>
<head>
  <title>PhilJS Alpine-Style Demo</title>
</head>
<body>
  <div x-data="{ count: 0 }">
    <p>Count: <span x-text="count"></span></p>
    <button @click="count++">Increment</button>
    <button @click="count--">Decrement</button>
  </div>

  <script src="https://unpkg.com/@philjs/cdn"></script>
  <script>PhilJS.init();</script>
</body>
</html>
```

## Reactivity System

### signal(initialValue)

Creates a reactive signal that holds a value and notifies subscribers when it changes.

```html
<script>
  const { signal } = PhilJS;

  // Create a signal with initial value
  const count = signal(0);

  // Read the value (triggers tracking)
  console.log(count()); // 0

  // Set a new value
  count.set(5);

  // Update based on previous value
  count.set(prev => prev + 1);

  // Update with a function
  count.update(n => n * 2);

  // Read without triggering tracking
  console.log(count.peek()); // 12
</script>
```

#### Signal Methods

| Method | Description |
|--------|-------------|
| `signal()` | Read the current value (tracks dependency) |
| `signal.set(value)` | Set a new value |
| `signal.set(fn)` | Set value using updater function |
| `signal.update(fn)` | Update value using function |
| `signal.peek()` | Read value without tracking |

### memo(fn)

Creates a computed/derived value that automatically updates when dependencies change.

```html
<script>
  const { signal, memo } = PhilJS;

  const firstName = signal('John');
  const lastName = signal('Doe');

  // Computed value that derives from signals
  const fullName = memo(() => `${firstName()} ${lastName()}`);

  console.log(fullName()); // "John Doe"

  firstName.set('Jane');
  console.log(fullName()); // "Jane Doe"
</script>
```

### effect(fn)

Creates a side effect that automatically re-runs when its dependencies change.

```html
<script>
  const { signal, effect } = PhilJS;

  const count = signal(0);

  // Effect runs immediately and re-runs on changes
  const cleanup = effect(() => {
    console.log('Count is now:', count());

    // Optional cleanup function
    return () => console.log('Cleaning up...');
  });

  count.set(1); // Logs: "Cleaning up...", then "Count is now: 1"

  // Stop the effect
  cleanup();
</script>
```

### batch(fn)

Batches multiple updates to prevent unnecessary re-renders.

```html
<script>
  const { signal, effect, batch } = PhilJS;

  const firstName = signal('John');
  const lastName = signal('Doe');

  effect(() => {
    console.log(`Name: ${firstName()} ${lastName()}`);
  });

  // Without batch: logs twice
  firstName.set('Jane');
  lastName.set('Smith');

  // With batch: logs once
  batch(() => {
    firstName.set('Bob');
    lastName.set('Jones');
  });
</script>
```

### untrack(fn)

Executes a function without tracking dependencies.

```html
<script>
  const { signal, effect, untrack } = PhilJS;

  const count = signal(0);
  const multiplier = signal(2);

  effect(() => {
    // Only re-runs when count changes, not multiplier
    const result = count() * untrack(() => multiplier());
    console.log('Result:', result);
  });

  multiplier.set(3); // Does NOT trigger effect
  count.set(5);      // Triggers effect: "Result: 15"
</script>
```

## Template System

### html Tagged Template

Creates reactive HTML templates with automatic event binding.

```html
<script>
  const { signal, html, render } = PhilJS;

  const items = signal(['Apple', 'Banana', 'Cherry']);
  const newItem = signal('');

  const template = html`
    <div>
      <h2>Shopping List</h2>
      <ul>
        ${() => items().map(item => html`<li>${item}</li>`)}
      </ul>
      <input
        type="text"
        value=${newItem}
        oninput=${(e) => newItem.set(e.target.value)}
      />
      <button onclick=${() => {
        if (newItem()) {
          items.set([...items(), newItem()]);
          newItem.set('');
        }
      }}>Add Item</button>
    </div>
  `;

  render(template, '#app');
</script>
```

### render(template, container)

Renders a template to a DOM element with reactive updates.

```html
<script>
  const { signal, html, render } = PhilJS;

  const visible = signal(true);

  // Container can be an element or selector
  render(
    html`<div>${() => visible() ? 'Visible!' : 'Hidden!'}</div>`,
    document.getElementById('app')
  );

  // Or using a selector
  render(
    html`<p>Hello World</p>`,
    '#container'
  );
</script>
```

## Alpine.js-Style Directives

### x-data

Initializes a reactive component with data.

```html
<div x-data="{ open: false, count: 0, name: 'PhilJS' }">
  <!-- Component content -->
</div>

<!-- With methods -->
<div x-data="{
  count: 0,
  increment() { this.count++ },
  decrement() { this.count-- }
}">
  <button @click="increment()">+</button>
  <span x-text="count"></span>
  <button @click="decrement()">-</button>
</div>
```

### x-text

Sets the text content of an element reactively.

```html
<div x-data="{ message: 'Hello, World!' }">
  <p x-text="message"></p>
  <input x-model="message" />
</div>
```

### x-html

Sets the inner HTML of an element (use with caution).

```html
<div x-data="{ content: '<strong>Bold text</strong>' }">
  <div x-html="content"></div>
</div>
```

### x-show

Toggles element visibility using CSS display.

```html
<div x-data="{ open: false }">
  <button @click="open = !open">Toggle</button>
  <div x-show="open">
    This content is conditionally visible
  </div>
</div>
```

### x-if

Conditionally renders an element using the `hidden` attribute.

```html
<div x-data="{ loggedIn: false }">
  <div x-if="loggedIn">Welcome back!</div>
  <div x-if="!loggedIn">Please log in</div>
</div>
```

### x-bind / :

Dynamically binds attributes.

```html
<div x-data="{ imageUrl: '/photo.jpg', isActive: true }">
  <!-- Full syntax -->
  <img x-bind:src="imageUrl" />

  <!-- Shorthand -->
  <img :src="imageUrl" />

  <!-- Class object binding -->
  <div :class="{ active: isActive, hidden: !isActive }">
    Conditional classes
  </div>

  <!-- Style object binding -->
  <div :style="{ color: isActive ? 'green' : 'red' }">
    Conditional styles
  </div>

  <!-- Boolean attributes -->
  <button :disabled="!isActive">Submit</button>
</div>
```

### x-on / @

Binds event listeners with optional modifiers.

```html
<div x-data="{ count: 0 }">
  <!-- Full syntax -->
  <button x-on:click="count++">Increment</button>

  <!-- Shorthand -->
  <button @click="count++">Increment</button>

  <!-- With modifiers -->
  <form @submit.prevent="handleSubmit()">
    <button type="submit">Submit</button>
  </form>

  <div @click.self="handleClick()">
    Only triggers if clicked directly (not on children)
  </div>

  <button @click.once="runOnce()">
    Only runs once
  </button>

  <a href="/page" @click.prevent.stop="customNav()">
    Prevents default and stops propagation
  </a>
</div>
```

#### Event Modifiers

| Modifier | Description |
|----------|-------------|
| `.prevent` | Calls `event.preventDefault()` |
| `.stop` | Calls `event.stopPropagation()` |
| `.once` | Only triggers handler once |
| `.self` | Only triggers if event target is the element itself |

### x-model

Two-way data binding for form inputs.

```html
<div x-data="{ name: '', email: '', agree: false, plan: 'free' }">
  <!-- Text input -->
  <input type="text" x-model="name" placeholder="Name" />

  <!-- Email input -->
  <input type="email" x-model="email" placeholder="Email" />

  <!-- Checkbox -->
  <label>
    <input type="checkbox" x-model="agree" />
    I agree to terms
  </label>

  <!-- Radio buttons -->
  <label>
    <input type="radio" x-model="plan" value="free" />
    Free Plan
  </label>
  <label>
    <input type="radio" x-model="plan" value="pro" />
    Pro Plan
  </label>

  <p>Name: <span x-text="name"></span></p>
  <p>Email: <span x-text="email"></span></p>
  <p>Agreed: <span x-text="agree"></span></p>
  <p>Plan: <span x-text="plan"></span></p>
</div>
```

### x-for

Iterates over arrays with template elements.

```html
<div x-data="{ items: ['Apple', 'Banana', 'Cherry'] }">
  <ul>
    <template x-for="item in items">
      <li>{{ item }}</li>
    </template>
  </ul>
</div>

<!-- With index -->
<div x-data="{ users: [{ name: 'Alice' }, { name: 'Bob' }] }">
  <ul>
    <template x-for="user in users">
      <li>{{ $index + 1 }}. {{ user.name }}</li>
    </template>
  </ul>
</div>
```

### x-ref

Creates a reference to a DOM element accessible via `$refs`.

```html
<div x-data="{ }">
  <input type="text" x-ref="input" />
  <button @click="$refs.input.focus()">Focus Input</button>
</div>
```

### Text Interpolation

Use double curly braces for text interpolation within elements.

```html
<div x-data="{ name: 'PhilJS', version: '0.1.0' }">
  <p>Welcome to {{ name }} version {{ version }}!</p>
</div>
```

## Stores

### createStore(initialState)

Creates a reactive store with state and actions.

```html
<script>
  const { createStore, effect } = PhilJS;

  // Create a store
  const counterStore = createStore({
    count: 0,
    increment() {
      this.count++;
    },
    decrement() {
      this.count--;
    },
    reset() {
      this.count = 0;
    }
  });

  // Read state
  console.log(counterStore.count); // 0

  // Call actions
  counterStore.increment();
  console.log(counterStore.count); // 1

  // Subscribe to changes
  const unsubscribe = counterStore.$subscribe(() => {
    console.log('Store updated:', counterStore.count);
  });

  counterStore.increment(); // Logs: "Store updated: 2"

  // Unsubscribe
  unsubscribe();
</script>
```

### Using Stores with Components

```html
<div id="app"></div>

<script>
  const { createStore, html, render, effect } = PhilJS;

  const todoStore = createStore({
    todos: [],
    filter: 'all',

    addTodo(text) {
      this.todos = [...this.todos, {
        id: Date.now(),
        text,
        completed: false
      }];
    },

    toggleTodo(id) {
      this.todos = this.todos.map(todo =>
        todo.id === id
          ? { ...todo, completed: !todo.completed }
          : todo
      );
    },

    get filtered() {
      switch (this.filter) {
        case 'active':
          return this.todos.filter(t => !t.completed);
        case 'completed':
          return this.todos.filter(t => t.completed);
        default:
          return this.todos;
      }
    }
  });

  render(
    html`
      <div>
        <input id="newTodo" type="text" placeholder="Add todo..." />
        <button onclick=${() => {
          const input = document.getElementById('newTodo');
          if (input.value) {
            todoStore.addTodo(input.value);
            input.value = '';
          }
        }}>Add</button>

        <ul>
          ${() => todoStore.filtered.map(todo => html`
            <li onclick=${() => todoStore.toggleTodo(todo.id)}
                style="text-decoration: ${todo.completed ? 'line-through' : 'none'}">
              ${todo.text}
            </li>
          `)}
        </ul>

        <div>
          <button onclick=${() => todoStore.filter = 'all'}>All</button>
          <button onclick=${() => todoStore.filter = 'active'}>Active</button>
          <button onclick=${() => todoStore.filter = 'completed'}>Completed</button>
        </div>
      </div>
    `,
    '#app'
  );
</script>
```

## Utilities

### nextTick()

Returns a promise that resolves on the next microtask.

```html
<script>
  const { signal, nextTick } = PhilJS;

  const count = signal(0);

  async function updateAndRead() {
    count.set(5);

    // Wait for DOM updates
    await nextTick();

    // DOM is now updated
    console.log(document.querySelector('#count').textContent);
  }
</script>
```

### onMount(fn)

Runs a function when the DOM is ready.

```html
<script>
  const { onMount, signal, render, html } = PhilJS;

  onMount(() => {
    console.log('DOM is ready!');

    // Fetch initial data
    fetch('/api/data')
      .then(r => r.json())
      .then(data => {
        // Update state
      });

    // Optional cleanup
    return () => {
      console.log('Cleaning up...');
    };
  });
</script>
```

### init(root)

Manually initializes PhilJS on a root element (or document.body by default).

```html
<script>
  const { init } = PhilJS;

  // Initialize on entire document
  init();

  // Or initialize on specific element
  init(document.getElementById('my-app'));
</script>
```

## Special Variables

When using Alpine-style directives, the following special variables are available:

| Variable | Description |
|----------|-------------|
| `$el` | Reference to the current component's root element |
| `$refs` | Object containing all `x-ref` elements |
| `$event` | The current event object in event handlers |
| `$index` | Current iteration index in `x-for` loops |

```html
<div x-data="{ items: [1, 2, 3] }">
  <button @click="console.log($el)">Log Element</button>

  <input x-ref="search" type="text" />
  <button @click="$refs.search.focus()">Focus</button>

  <button @click="console.log($event.target)">Log Target</button>

  <template x-for="item in items">
    <span>{{ $index }}: {{ item }}</span>
  </template>
</div>
```

## Types Reference

```typescript
/**
 * A reactive signal that holds a value
 */
interface Signal<T> {
  /** Read the current value (triggers tracking) */
  (): T;
  /** Set a new value or update function */
  set: (value: T | ((prev: T) => T)) => void;
  /** Update value using function */
  update: (fn: (prev: T) => T) => void;
  /** Read value without tracking */
  peek: () => T;
}

/**
 * Template result from html tagged template
 */
interface TemplateResult {
  strings: TemplateStringsArray;
  values: unknown[];
  __brand: 'template';
}

/**
 * Component data object for Alpine-style usage
 */
interface ComponentData {
  [key: string]: any;
  $el?: Element;
  $refs?: Record<string, Element>;
}

/**
 * Cleanup function returned from effect
 */
type Cleanup = () => void;

/**
 * Subscriber function for reactive updates
 */
type Subscriber = () => void;
```

## API Reference

| Export | Type | Description |
|--------|------|-------------|
| `signal(initialValue)` | Function | Creates a reactive signal |
| `memo(fn)` | Function | Creates a computed/derived value |
| `effect(fn)` | Function | Creates a reactive side effect |
| `batch(fn)` | Function | Batches multiple updates |
| `untrack(fn)` | Function | Executes without tracking |
| `html` | Tagged Template | Creates reactive HTML template |
| `render(template, container)` | Function | Renders template to DOM |
| `init(root?)` | Function | Initializes Alpine-style directives |
| `createStore(initialState)` | Function | Creates a reactive store |
| `nextTick()` | Function | Returns promise for next microtask |
| `onMount(fn)` | Function | Runs function when DOM ready |
| `PhilJS` | Object | Global namespace with all exports |
| `PhilJS.version` | String | Current version (e.g., "0.1.0") |

## Bundle Exports

The package provides multiple bundle formats:

| Export Path | Format | Description |
|-------------|--------|-------------|
| `@philjs/cdn` | ESM | Default ES module import |
| `@philjs/cdn/global` | IIFE | Global `PhilJS` variable |
| `@philjs/cdn/esm` | ESM | Explicit ES module |
| `@philjs/cdn/mini` | Minified | Ultra-small minified bundle |

## Examples

### Counter Component

```html
<div x-data="{ count: 0 }">
  <h1>Counter: <span x-text="count"></span></h1>
  <button @click="count++">+</button>
  <button @click="count--">-</button>
  <button @click="count = 0">Reset</button>
</div>

<script src="https://unpkg.com/@philjs/cdn"></script>
<script>PhilJS.init();</script>
```

### Todo List

```html
<div x-data="{
  todos: [],
  newTodo: '',
  addTodo() {
    if (this.newTodo.trim()) {
      this.todos = [...this.todos, {
        id: Date.now(),
        text: this.newTodo,
        done: false
      }];
      this.newTodo = '';
    }
  },
  toggleTodo(id) {
    this.todos = this.todos.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    );
  },
  removeTodo(id) {
    this.todos = this.todos.filter(t => t.id !== id);
  }
}">
  <h1>Todo List</h1>

  <form @submit.prevent="addTodo()">
    <input
      type="text"
      x-model="newTodo"
      placeholder="What needs to be done?"
    />
    <button type="submit">Add</button>
  </form>

  <ul>
    <template x-for="todo in todos">
      <li>
        <input
          type="checkbox"
          :checked="todo.done"
          @change="toggleTodo(todo.id)"
        />
        <span
          :style="{ textDecoration: todo.done ? 'line-through' : 'none' }"
          x-text="todo.text"
        ></span>
        <button @click="removeTodo(todo.id)">Delete</button>
      </li>
    </template>
  </ul>

  <p x-show="todos.length === 0">No todos yet!</p>
</div>

<script src="https://unpkg.com/@philjs/cdn"></script>
<script>PhilJS.init();</script>
```

### Fetch Data

```html
<div x-data="{
  users: [],
  loading: true,
  error: null,

  async init() {
    try {
      const res = await fetch('https://jsonplaceholder.typicode.com/users');
      this.users = await res.json();
    } catch (e) {
      this.error = e.message;
    } finally {
      this.loading = false;
    }
  }
}">
  <h1>Users</h1>

  <div x-show="loading">Loading...</div>
  <div x-show="error" x-text="error" style="color: red;"></div>

  <ul x-show="!loading && !error">
    <template x-for="user in users">
      <li>{{ user.name }} ({{ user.email }})</li>
    </template>
  </ul>
</div>

<script src="https://unpkg.com/@philjs/cdn"></script>
<script>
  PhilJS.init();
  // Call init method on components that have it
  document.querySelectorAll('[x-data]').forEach(el => {
    const data = el.__philjs_data;
    if (data && typeof data.init === 'function') {
      data.init();
    }
  });
</script>
```

### Modal Dialog

```html
<div x-data="{ showModal: false }">
  <button @click="showModal = true">Open Modal</button>

  <div
    x-show="showModal"
    style="position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;"
    @click.self="showModal = false"
  >
    <div style="background: white; padding: 2rem; border-radius: 8px;">
      <h2>Modal Title</h2>
      <p>This is modal content.</p>
      <button @click="showModal = false">Close</button>
    </div>
  </div>
</div>

<script src="https://unpkg.com/@philjs/cdn"></script>
<script>PhilJS.init();</script>
```

## Browser Support

The CDN bundle supports all modern browsers:

- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

For older browser support, include appropriate polyfills for:
- `Proxy`
- `MutationObserver`
- `queueMicrotask`

## Comparison with Alpine.js

| Feature | PhilJS CDN | Alpine.js |
|---------|-----------|-----------|
| Reactivity | Fine-grained signals | Proxy-based |
| Template syntax | `html` tagged template + directives | Directives only |
| Stores | `createStore()` | Alpine.store() |
| Bundle size | ~4KB | ~15KB |
| TypeScript | Full support | Partial |
| Programmatic API | Full (signal, effect, etc.) | Limited |

## Next Steps

- [Core Package](../core/overview.md) - Full PhilJS core for build-based projects
- [Signals Deep Dive](../core/signals.md) - Advanced reactivity patterns
- [Router](../router/overview.md) - Client-side routing
