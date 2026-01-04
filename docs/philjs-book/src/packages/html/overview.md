# @philjs/html

HTML-first reactive framework providing HTMX and Alpine.js compatible attributes for building reactive UIs with minimal JavaScript.

## Installation

```bash
npm install @philjs/html
```

## Features

- **Alpine.js-style Directives** - `x-data`, `x-text`, `x-show`, `x-if`, `x-for`, `x-model`
- **HTMX Compatibility** - Server-driven UI updates with `hx-get`, `hx-post`, etc.
- **PhilJS Signals** - Powered by the same reactive primitives as `@philjs/core`
- **Minimal Runtime** - Ultra-lightweight (<3KB) option for simple apps
- **Auto-initialization** - Zero-config setup via script attributes
- **Custom Directives** - Extensible directive system

## Quick Start

### Via CDN (Simplest)

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/@philjs/html"></script>
</head>
<body>
  <div x-data="{ count: 0 }">
    <span x-text="count"></span>
    <button @click="count++">Increment</button>
  </div>
</body>
</html>
```

### Via NPM

```typescript
import { init } from '@philjs/html';

// Initialize when DOM is ready
init();
```

## Alpine.js-Style Directives

### x-data

Initialize a reactive data scope on an element:

```html
<div x-data="{ name: 'World', count: 0 }">
  <h1>Hello, <span x-text="name"></span>!</h1>
  <p>Count: <span x-text="count"></span></p>
  <button @click="count++">Increment</button>
</div>
```

### x-text

Set text content reactively (HTML escaped for security):

```html
<div x-data="{ message: 'Hello!' }">
  <span x-text="message"></span>
  <span x-text="message.toUpperCase()"></span>
  <span x-text="`Count is ${count}`"></span>
</div>
```

### x-html

Set innerHTML reactively (**use with trusted content only**):

```html
<div x-data="{ content: '<strong>Bold</strong>' }">
  <!-- WARNING: Only use with sanitized/trusted content -->
  <div x-html="content"></div>
</div>
```

### x-show

Toggle element visibility:

```html
<div x-data="{ visible: true }">
  <p x-show="visible">I'm visible!</p>
  <button @click="visible = !visible">Toggle</button>
</div>
```

### x-if

Conditional rendering (removes/adds element from DOM):

```html
<div x-data="{ loggedIn: false }">
  <template x-if="loggedIn">
    <p>Welcome back!</p>
  </template>
  <template x-if="!loggedIn">
    <p>Please log in</p>
  </template>
</div>
```

### x-for

List rendering:

```html
<div x-data="{ items: ['Apple', 'Banana', 'Cherry'] }">
  <ul>
    <li x-for="item in items" x-text="item"></li>
  </ul>
</div>

<!-- With index -->
<div x-data="{ items: ['A', 'B', 'C'] }">
  <ul>
    <li x-for="(item, index) in items">
      <span x-text="index"></span>: <span x-text="item"></span>
    </li>
  </ul>
</div>
```

### x-bind / :attr

Bind attributes reactively:

```html
<div x-data="{ isActive: true, color: 'red' }">
  <!-- Full syntax -->
  <div x-bind:class="{ active: isActive }">...</div>

  <!-- Shorthand -->
  <div :class="{ active: isActive, 'text-bold': true }">...</div>
  <div :style="{ color: color }">...</div>
  <button :disabled="!isActive">Click me</button>
  <a :href="'/users/' + userId">Profile</a>
</div>
```

### x-on / @event

Handle events:

```html
<div x-data="{ count: 0 }">
  <!-- Full syntax -->
  <button x-on:click="count++">Increment</button>

  <!-- Shorthand -->
  <button @click="count++">Increment</button>

  <!-- With modifiers -->
  <button @click.prevent="handleSubmit()">Submit</button>
  <button @click.stop="doSomething()">Stop Propagation</button>
  <button @click.once="runOnce()">Once Only</button>
  <div @click.self="onlySelf()">Only direct clicks</div>

  <!-- Keyboard events -->
  <input @keydown.enter="submit()" />
  <input @keydown.escape="cancel()" />
</div>
```

**Available Modifiers:**
- `.prevent` - Call `e.preventDefault()`
- `.stop` - Call `e.stopPropagation()`
- `.self` - Only trigger if target is the element itself
- `.once` - Only trigger once
- `.capture` - Use capture mode
- `.passive` - Use passive listener

### x-model

Two-way data binding for form inputs:

```html
<div x-data="{ name: '', agreed: false, color: 'red' }">
  <!-- Text input -->
  <input type="text" x-model="name" />
  <p>Hello, <span x-text="name"></span></p>

  <!-- Checkbox -->
  <input type="checkbox" x-model="agreed" />
  <span x-text="agreed ? 'Agreed' : 'Not agreed'"></span>

  <!-- Radio buttons -->
  <input type="radio" value="red" x-model="color" /> Red
  <input type="radio" value="blue" x-model="color" /> Blue

  <!-- Select -->
  <select x-model="color">
    <option value="red">Red</option>
    <option value="blue">Blue</option>
  </select>
</div>
```

### x-ref

Get references to DOM elements:

```html
<div x-data="{ }">
  <input type="text" x-ref="nameInput" />
  <button @click="$refs.nameInput.focus()">Focus Input</button>
</div>
```

### x-init

Run code when element is initialized:

```html
<div x-data="{ items: [] }" x-init="items = await fetchItems()">
  <ul>
    <li x-for="item in items" x-text="item.name"></li>
  </ul>
</div>
```

### x-cloak

Hide element until processed (prevents FOUC):

```html
<style>
  [x-cloak] { display: none !important; }
</style>

<div x-data="{ ready: false }" x-cloak>
  <!-- Hidden until Alpine initializes -->
</div>
```

## Alpine.js Extended Features

### x-transition

Apply CSS transitions to show/hide:

```html
<div x-data="{ open: false }">
  <button @click="open = !open">Toggle</button>

  <div x-show="open" x-transition>
    Fades in/out
  </div>

  <!-- Custom transition classes -->
  <div
    x-show="open"
    x-transition:enter="transition ease-out duration-300"
    x-transition:enter-start="opacity-0 transform scale-95"
    x-transition:enter-end="opacity-100 transform scale-100"
    x-transition:leave="transition ease-in duration-200"
    x-transition:leave-start="opacity-100 transform scale-100"
    x-transition:leave-end="opacity-0 transform scale-95"
  >
    Custom transition
  </div>
</div>
```

### x-effect

Run side effects when dependencies change:

```html
<div x-data="{ count: 0 }" x-effect="console.log('Count changed:', count)">
  <button @click="count++">Increment</button>
</div>
```

### x-teleport

Move element to another location in the DOM:

```html
<div x-data="{ open: false }">
  <button @click="open = true">Open Modal</button>

  <template x-teleport="body">
    <div x-show="open" class="modal">
      Modal content teleported to body
    </div>
  </template>
</div>
```

### Magic Properties

```html
<div x-data="{ count: 0 }">
  <!-- $el - Current element -->
  <button @click="$el.classList.toggle('active')">Toggle Class</button>

  <!-- $refs - Element references -->
  <input x-ref="input" />
  <button @click="$refs.input.focus()">Focus</button>

  <!-- $dispatch - Dispatch custom events -->
  <button @click="$dispatch('custom-event', { data: 'hello' })">
    Dispatch
  </button>

  <!-- $nextTick - Wait for DOM update -->
  <button @click="count++; $nextTick(() => console.log('Updated!'))">
    Increment
  </button>

  <!-- $watch - Watch for changes -->
  <div x-init="$watch('count', (value, old) => console.log(value, old))">
    <span x-text="count"></span>
  </div>

  <!-- $store - Access global stores -->
  <span x-text="$store('user').name"></span>
</div>
```

### Reusable Components (Alpine.data)

```typescript
import { data } from '@philjs/html';

// Define reusable component
data('counter', () => ({
  count: 0,
  increment() {
    this.count++;
  },
  decrement() {
    this.count--;
  },
}));

data('dropdown', () => ({
  open: false,
  toggle() {
    this.open = !this.open;
  },
}));
```

```html
<!-- Use the component -->
<div x-data="counter">
  <span x-text="count"></span>
  <button @click="increment()">+</button>
  <button @click="decrement()">-</button>
</div>

<div x-data="dropdown">
  <button @click="toggle()">Menu</button>
  <ul x-show="open">
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</div>
```

### Global Stores (Alpine.store)

```typescript
import { store } from '@philjs/html';

// Create global store
store('user', {
  name: 'John',
  email: 'john@example.com',
  isLoggedIn: true,
  logout() {
    this.isLoggedIn = false;
    this.name = '';
  },
});

store('cart', {
  items: [],
  total: 0,
  addItem(item) {
    this.items.push(item);
    this.total += item.price;
  },
});
```

```html
<!-- Access store from any component -->
<div x-data>
  <span x-text="$store('user').name"></span>
  <button @click="$store('user').logout()">Logout</button>
</div>

<div x-data>
  <span>Cart: <span x-text="$store('cart').items.length"></span> items</span>
  <span>Total: $<span x-text="$store('cart').total"></span></span>
</div>
```

### Reusable Bindings (Alpine.bind)

```typescript
import { bind } from '@philjs/html';

// Define reusable bindings
bind('button', {
  type: 'button',
  class: 'btn btn-primary',
  ':disabled': (ctx) => ctx.data.loading?.() ?? false,
});
```

```html
<button x-bind="button">Click Me</button>
```

## HTMX Compatibility

### HTTP Methods

```html
<!-- GET request -->
<button hx-get="/api/users" hx-target="#users-list">
  Load Users
</button>

<!-- POST request -->
<form hx-post="/api/submit" hx-target="#result">
  <input name="email" />
  <button>Submit</button>
</form>

<!-- Other methods -->
<button hx-put="/api/item/1">Update</button>
<button hx-patch="/api/item/1">Partial Update</button>
<button hx-delete="/api/item/1">Delete</button>
```

### Targeting

```html
<!-- Target by ID -->
<button hx-get="/api/data" hx-target="#result">Load</button>

<!-- Target self -->
<button hx-get="/api/data" hx-target="this">Replace Me</button>

<!-- Target closest parent -->
<button hx-get="/api/data" hx-target="closest .card">Load</button>
```

### Swap Strategies

```html
<!-- Replace inner HTML (default) -->
<div hx-get="/api/data" hx-swap="innerHTML">...</div>

<!-- Replace entire element -->
<div hx-get="/api/data" hx-swap="outerHTML">...</div>

<!-- Insert positions -->
<div hx-get="/api/data" hx-swap="beforebegin">Insert before</div>
<div hx-get="/api/data" hx-swap="afterbegin">Insert at start</div>
<div hx-get="/api/data" hx-swap="beforeend">Insert at end</div>
<div hx-get="/api/data" hx-swap="afterend">Insert after</div>

<!-- Delete target -->
<div hx-delete="/api/item/1" hx-swap="delete">Delete me</div>

<!-- No swap (just trigger request) -->
<button hx-post="/api/action" hx-swap="none">Fire & Forget</button>
```

### Triggers

```html
<!-- Default triggers: click for most, submit for forms, change for inputs -->

<!-- Explicit trigger -->
<div hx-get="/api/data" hx-trigger="mouseenter">Hover me</div>

<!-- Multiple triggers -->
<div hx-get="/api/data" hx-trigger="click, keyup">...</div>

<!-- With modifiers -->
<input hx-get="/api/search" hx-trigger="keyup changed delay:500ms" />

<!-- Filter triggers -->
<input hx-get="/api/search" hx-trigger="keyup[target.value.length > 2]" />
```

### Request Configuration

```html
<!-- Include additional values -->
<button
  hx-post="/api/action"
  hx-vals='{"key": "value", "timestamp": 123}'
>
  Send Data
</button>

<!-- Include input values -->
<button hx-post="/api/action" hx-include="#email-input">
  Submit with Email
</button>

<!-- Custom headers -->
<button
  hx-get="/api/data"
  hx-headers='{"X-Custom-Header": "value"}'
>
  With Headers
</button>
```

### Loading Indicators

```html
<button hx-get="/api/data" hx-indicator="#spinner">
  Load
  <span id="spinner" class="htmx-indicator">Loading...</span>
</button>

<style>
  .htmx-indicator { display: none; }
  .htmx-indicator.htmx-request { display: inline; }
</style>
```

### Boosting Links and Forms

```html
<!-- Boost all links in a section -->
<nav hx-boost="true">
  <a href="/page1">Page 1</a>
  <a href="/page2">Page 2</a>
</nav>

<!-- Boost form submission -->
<form hx-boost="true" action="/submit" method="post">
  <input name="data" />
  <button>Submit</button>
</form>
```

### URL History

```html
<!-- Push URL to history -->
<a hx-get="/page" hx-push-url="true">Navigate</a>

<!-- Custom URL -->
<button hx-get="/api/data" hx-push-url="/custom-url">Load</button>
```

### HTMX Events

```html
<div
  hx-get="/api/data"
  @htmx:beforeRequest="console.log('Starting request')"
  @htmx:afterRequest="console.log('Request complete')"
  @htmx:error="console.error('Request failed')"
>
  Load Data
</div>
```

### Response Headers

The server can control behavior via response headers:

```typescript
// Server endpoint
app.get('/api/action', (req, res) => {
  // Redirect client
  res.set('HX-Redirect', '/new-page');

  // Refresh page
  res.set('HX-Refresh', 'true');

  // Trigger client-side events
  res.set('HX-Trigger', JSON.stringify({
    'showMessage': { message: 'Success!' },
    'refreshCart': null
  }));

  res.send('OK');
});
```

### HTMX Configuration

```typescript
import { configureHtmx } from '@philjs/html';

configureHtmx({
  // Default swap strategy
  defaultSwap: 'innerHTML',

  // Request timeout (ms)
  timeout: 10000,

  // Include credentials
  withCredentials: true,

  // Global headers
  headers: {
    'X-Requested-With': 'htmx',
  },

  // Enable history push
  historyEnabled: true,

  // Loading indicator class
  indicatorClass: 'htmx-indicator',

  // Disable buttons during request
  disableOnRequest: true,
});
```

## Minimal Runtime

For ultra-lightweight apps (<3KB):

```html
<!-- Use minimal runtime -->
<script src="https://unpkg.com/@philjs/html" data-minimal></script>

<!-- Or via API -->
<script>
  import { initMinimal } from '@philjs/html';
  initMinimal();
</script>
```

The minimal runtime includes only:
- `x-data` - Data scope
- `x-text` - Text binding
- `x-show` - Visibility toggle
- `x-on` / `@event` - Event handling
- `x-model` - Two-way binding
- `x-bind` / `:attr` - Attribute binding

```html
<div x-data="{ count: 0, name: '' }">
  <span x-text="count"></span>
  <button @click="count++">+</button>

  <input x-model="name" placeholder="Name" />
  <p x-show="name">Hello, <span x-text="name"></span>!</p>
</div>
```

## Configuration

### Script Attributes

```html
<!-- Disable HTMX -->
<script src="@philjs/html" data-no-htmx></script>

<!-- Disable Alpine -->
<script src="@philjs/html" data-no-alpine></script>

<!-- Use minimal runtime -->
<script src="@philjs/html" data-minimal></script>

<!-- Disable auto-initialization -->
<script src="@philjs/html" data-no-auto></script>
```

### Programmatic Configuration

```typescript
import { init, PhilJSHTML } from '@philjs/html';

// Full configuration
init({
  alpine: true,
  htmx: true,
  minimal: false,
  autoInit: false,
  root: document.getElementById('app'),
  htmxConfig: {
    timeout: 5000,
    withCredentials: true,
  },
});

// Or use the main API
PhilJSHTML.init({ minimal: true });
```

## Custom Directives

```typescript
import { directive } from '@philjs/html';

// Create a custom directive
directive('highlight', (el, expression, context) => {
  // expression = attribute value
  // context.data = reactive data
  // context.$el = current element
  // context.$refs = element references
  // context.$dispatch = event dispatcher

  el.style.backgroundColor = expression || 'yellow';

  // Return cleanup function
  return () => {
    el.style.backgroundColor = '';
  };
});
```

```html
<div x-data>
  <p x-highlight="lightblue">Highlighted text</p>
</div>
```

## Security Considerations

### XSS Prevention

```html
<!-- SAFE: x-text escapes HTML -->
<span x-text="userInput"></span>

<!-- UNSAFE: x-html renders raw HTML -->
<div x-html="userInput"></div> <!-- DANGER! -->

<!-- SAFE: Sanitize before using x-html -->
<script>
import { sanitizeHtml } from '@philjs/core/security';

// In your data
data('editor', () => ({
  content: sanitizeHtml(userContent),
}));
</script>
<div x-html="content"></div>
```

### CSP Compliance

The directive system uses `new Function()` for expression evaluation. If you have a strict CSP policy that blocks `unsafe-eval`:

1. Use the pre-compiled approach (coming soon)
2. Use only static templates
3. Move logic to separate JavaScript files

```html
<!-- CSP-safe: Logic in external file -->
<script src="app.js"></script>
<div x-data="myComponent">
  <span x-text="computedValue"></span>
</div>
```

```typescript
// app.js
import { data } from '@philjs/html';

data('myComponent', () => ({
  rawValue: 'hello',
  get computedValue() {
    return this.rawValue.toUpperCase();
  },
}));
```

## Types Reference

```typescript
// Directive handler
type DirectiveHandler = (
  el: HTMLElement,
  expression: string,
  context: DirectiveContext
) => void | (() => void);

// Directive context
interface DirectiveContext {
  data: Record<string, any>;
  $el: HTMLElement;
  $refs: Record<string, HTMLElement>;
  $dispatch: (event: string, detail?: any) => void;
}

// Alpine context (extended)
interface AlpineContext extends DirectiveContext {
  $nextTick: (callback: () => void) => Promise<void>;
  $watch: <T>(getter: () => T, callback: (value: T, old: T) => void) => () => void;
  $store: <T>(name: string) => T | undefined;
}

// HTMX configuration
interface HtmxConfig {
  defaultSwap: SwapStrategy;
  defaultTarget?: string;
  timeout: number;
  withCredentials: boolean;
  headers: Record<string, string>;
  historyEnabled: boolean;
  indicatorClass: string;
  disableOnRequest: boolean;
}

// Swap strategies
type SwapStrategy =
  | 'innerHTML'
  | 'outerHTML'
  | 'beforebegin'
  | 'afterbegin'
  | 'beforeend'
  | 'afterend'
  | 'delete'
  | 'none';

// PhilJS HTML configuration
interface PhilJSHTMLConfig {
  alpine: boolean;
  htmx: boolean;
  minimal: boolean;
  htmxConfig?: Partial<HtmxConfig>;
  autoInit: boolean;
  root?: HTMLElement;
}
```

## API Reference

### Directives Module

| Export | Description |
|--------|-------------|
| `directive(name, handler)` | Register custom directive |
| `getDirective(name)` | Get registered directive |
| `processElement(el, context)` | Process element for directives |
| `initDirectives(root?)` | Initialize directive system |

### Alpine Module

| Export | Description |
|--------|-------------|
| `data(name, factory)` | Define reusable component |
| `store(name, value)` | Create global store |
| `bind(name, bindings)` | Define reusable bindings |
| `initAlpine(root?)` | Initialize Alpine compatibility |
| `Alpine` | Alpine-compatible API object |

### HTMX Module

| Export | Description |
|--------|-------------|
| `configure(options)` | Configure HTMX behavior |
| `process(el)` | Process element for HTMX |
| `initHtmx(root?)` | Initialize HTMX compatibility |

### Minimal Module

| Export | Description |
|--------|-------------|
| `initMinimal(root?)` | Initialize minimal runtime |

### Runtime Module

| Export | Description |
|--------|-------------|
| `init(config?)` | Initialize PhilJS HTML |
| `PhilJSHTML` | Main API object |

## Examples

### Todo App

```html
<div x-data="todoApp">
  <form @submit.prevent="addTodo()">
    <input x-model="newTodo" placeholder="New todo" />
    <button>Add</button>
  </form>

  <ul>
    <li x-for="(todo, i) in todos">
      <input type="checkbox" x-model="todo.done" />
      <span :class="{ 'line-through': todo.done }" x-text="todo.text"></span>
      <button @click="removeTodo(i)">x</button>
    </li>
  </ul>

  <p x-show="todos.length === 0">No todos yet!</p>
</div>

<script type="module">
import { data, init } from '@philjs/html';

data('todoApp', () => ({
  newTodo: '',
  todos: [],

  addTodo() {
    if (this.newTodo.trim()) {
      this.todos.push({ text: this.newTodo, done: false });
      this.newTodo = '';
    }
  },

  removeTodo(index) {
    this.todos.splice(index, 1);
  },
}));

init();
</script>
```

### Live Search with HTMX

```html
<div>
  <input
    type="search"
    name="q"
    hx-get="/api/search"
    hx-trigger="keyup changed delay:300ms"
    hx-target="#results"
    placeholder="Search..."
  />

  <div id="results">
    <!-- Results loaded here -->
  </div>
</div>
```

### Modal with Alpine

```html
<div x-data="{ open: false }">
  <button @click="open = true">Open Modal</button>

  <template x-teleport="body">
    <div
      x-show="open"
      x-transition
      class="modal-overlay"
      @click.self="open = false"
    >
      <div class="modal-content">
        <h2>Modal Title</h2>
        <p>Modal content goes here...</p>
        <button @click="open = false">Close</button>
      </div>
    </div>
  </template>
</div>
```

### Infinite Scroll

```html
<div
  hx-get="/api/items?page=1"
  hx-trigger="load"
  hx-swap="innerHTML"
>
  Loading...
</div>

<!-- Server returns items with next page trigger -->
<div class="items">
  <!-- Item cards -->
</div>
<div
  hx-get="/api/items?page=2"
  hx-trigger="revealed"
  hx-swap="outerHTML"
>
  Loading more...
</div>
```
