# @philjs/liveview - Complete Reference

The `@philjs/liveview` package provides Phoenix LiveView-style server-driven UI for PhilJS. It enables real-time, interactive web applications where the server maintains state and renders HTML, sending minimal DOM patches over WebSocket connections.

## Installation

```bash
npm install @philjs/liveview
# or
pnpm add @philjs/liveview
# or
bun add @philjs/liveview
```

## Features

- **Server-Rendered HTML with Real-Time Updates** - Server maintains state and renders HTML
- **DOM Diffing and Patching** - Efficient updates via morphdom-style diffing
- **Optimistic UI Updates** - Instant feedback with server reconciliation
- **Form Handling with Validation** - Built-in form serialization and validation
- **Navigation Without Full Page Reloads** - Live patching and redirects
- **Client-Side Hooks** - JavaScript interop for complex interactions
- **Minimal JavaScript Footprint** - Small client runtime
- **PubSub Broadcasting** - Real-time multi-user updates
- **File Upload Support** - Progress tracking and validation
- **Built-in Hooks** - InfiniteScroll, Clipboard, Sortable, and more

## Package Exports

| Export | Description |
|--------|-------------|
| `@philjs/liveview` | Main entry point with all exports |
| `@philjs/liveview/client` | Client-side runtime |
| `@philjs/liveview/server` | Server-side runtime |

## Quick Start

### Server-Side LiveView

```typescript
import { createLiveView, createLiveViewServer } from '@philjs/liveview/server';

// Define a LiveView
const CounterView = createLiveView({
  mount: (socket) => {
    // Return initial state
    return { count: 0 };
  },

  handleEvent: (event, state, socket) => {
    switch (event.type) {
      case 'increment':
        return { count: state.count + 1 };
      case 'decrement':
        return { count: state.count - 1 };
      default:
        return state;
    }
  },

  render: (state) => `
    <div>
      <h1>Count: ${state.count}</h1>
      <button phx-click="increment">+</button>
      <button phx-click="decrement">-</button>
    </div>
  `,
});

// Create server and register view
const server = createLiveViewServer({ secret: 'your-secret-key' });
server.register('/counter', CounterView);
```

### Client-Side Connection

```typescript
import { initLiveView, registerHooks } from '@philjs/liveview/client';

// Register custom hooks (optional)
registerHooks({
  MyCustomHook: {
    mounted() {
      console.log('Element mounted:', this.el);
    },
    updated() {
      console.log('Element updated');
    },
  },
});

// Initialize LiveView connection
const client = initLiveView({
  debug: true,
});
```

### HTML Setup

```html
<!DOCTYPE html>
<html>
<head>
  <meta name="csrf-token" content="your-csrf-token">
</head>
<body>
  <div
    data-phx-main
    data-phx-view="counter"
    data-phx-session="..."
    data-phx-static="..."
  >
    <!-- Server-rendered content here -->
  </div>
  <script type="module">
    import { initLiveView } from '/live/client.js';
    initLiveView({ debug: true });
  </script>
</body>
</html>
```

## Architecture

```
@philjs/liveview
├── Server Layer
│   ├── LiveViewServer      - HTTP and WebSocket handling
│   ├── createLiveView()    - LiveView factory
│   ├── createLiveComponent() - Component factory
│   ├── mountLiveView()     - View instance management
│   └── PubSub              - Broadcasting system
│
├── Client Layer
│   ├── LiveViewClient      - WebSocket client
│   ├── SocketConnection    - Connection management
│   ├── Event Binding       - phx-click, phx-change, etc.
│   └── Hook System         - Client-side JavaScript interop
│
├── Diffing Layer
│   ├── createDiffer()      - Virtual DOM differ
│   ├── parseHtml()         - HTML to VDOM parser
│   ├── diffVdom()          - Compute minimal patches
│   └── applyPatches()      - Apply DOM updates
│
├── Forms Layer
│   ├── serializeForm()     - Form data extraction
│   ├── validateForm()      - Validation engine
│   ├── File Uploads        - Upload handling
│   └── createFormState()   - Form state management
│
└── Navigation Layer
    ├── livePatch()         - Partial navigation
    ├── liveRedirect()      - Full navigation
    ├── Scroll Management   - Position preservation
    └── Loading States      - Navigation indicators
```

---

## Creating LiveViews

### createLiveView()

Creates a new LiveView definition that can be registered with the server.

```typescript
function createLiveView<S extends LiveViewState>(
  definition: LiveViewDefinition<S>
): LiveViewDefinition<S>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `definition.mount` | `(socket: LiveSocket) => S \| Promise<S>` | Called when view is mounted, returns initial state |
| `definition.handleEvent` | `(event, state, socket) => S \| Promise<S>` | Handle client events |
| `definition.handleParams` | `(params, uri, socket) => S \| Promise<S>` | Handle URL parameter changes |
| `definition.handleInfo` | `(info, state, socket) => S \| Promise<S>` | Handle internal pub/sub messages |
| `definition.render` | `(state, assigns?) => string` | Render state to HTML string |
| `definition.terminate` | `(reason, state) => void` | Cleanup when view unmounts |

**Example - Todo List:**

```typescript
interface TodoState {
  todos: Array<{ id: number; text: string; completed: boolean }>;
  filter: 'all' | 'active' | 'completed';
  newTodo: string;
}

const TodoView = createLiveView<TodoState>({
  mount: async (socket) => {
    // Fetch initial todos from database
    const todos = await db.getTodos(socket.session.userId);
    return {
      todos,
      filter: 'all',
      newTodo: '',
    };
  },

  handleEvent: (event, state, socket) => {
    switch (event.type) {
      case 'add_todo':
        if (!state.newTodo.trim()) return state;
        const newTodo = {
          id: Date.now(),
          text: state.newTodo,
          completed: false,
        };
        return {
          ...state,
          todos: [...state.todos, newTodo],
          newTodo: '',
        };

      case 'toggle_todo':
        return {
          ...state,
          todos: state.todos.map(t =>
            t.id === event.value ? { ...t, completed: !t.completed } : t
          ),
        };

      case 'delete_todo':
        return {
          ...state,
          todos: state.todos.filter(t => t.id !== event.value),
        };

      case 'set_filter':
        return { ...state, filter: event.value };

      case 'update_new_todo':
        return { ...state, newTodo: event.value };

      default:
        return state;
    }
  },

  handleParams: (params, uri, socket) => {
    // Handle URL filter parameter
    const filter = params.filter || 'all';
    return { ...socket.state, filter };
  },

  render: (state) => {
    const filteredTodos = state.todos.filter(todo => {
      if (state.filter === 'active') return !todo.completed;
      if (state.filter === 'completed') return todo.completed;
      return true;
    });

    return `
      <div class="todo-app">
        <h1>Todos</h1>

        <form phx-submit="add_todo">
          <input
            type="text"
            name="text"
            value="${state.newTodo}"
            phx-change="update_new_todo"
            phx-debounce="300"
            placeholder="What needs to be done?"
          />
          <button type="submit">Add</button>
        </form>

        <div class="filters">
          <button phx-click="set_filter" phx-value-filter="all"
                  class="${state.filter === 'all' ? 'active' : ''}">All</button>
          <button phx-click="set_filter" phx-value-filter="active"
                  class="${state.filter === 'active' ? 'active' : ''}">Active</button>
          <button phx-click="set_filter" phx-value-filter="completed"
                  class="${state.filter === 'completed' ? 'active' : ''}">Completed</button>
        </div>

        <ul class="todo-list">
          ${filteredTodos.map(todo => `
            <li phx-key="${todo.id}" class="${todo.completed ? 'completed' : ''}">
              <input
                type="checkbox"
                ${todo.completed ? 'checked' : ''}
                phx-click="toggle_todo"
                phx-value-id="${todo.id}"
              />
              <span>${todo.text}</span>
              <button phx-click="delete_todo" phx-value-id="${todo.id}">Delete</button>
            </li>
          `).join('')}
        </ul>

        <p>${state.todos.filter(t => !t.completed).length} items left</p>
      </div>
    `;
  },
});
```

---

## LiveSocket API

The `LiveSocket` object is passed to all lifecycle callbacks and provides methods for interacting with the client.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique socket identifier |
| `state` | `LiveViewState` | Current view state |
| `session` | `LiveViewSession` | Session data |
| `params` | `LiveViewParams` | URL parameters |
| `clientId` | `string` | Connected client identifier |

### Methods

#### pushEvent()

Push an event to the client.

```typescript
socket.pushEvent(event: string, payload: any): void
```

```typescript
// In handleEvent
handleEvent: (event, state, socket) => {
  if (event.type === 'save') {
    // After saving, notify client
    socket.pushEvent('saved', { timestamp: Date.now() });
  }
  return state;
}
```

#### pushRedirect()

Redirect the client to a new URL.

```typescript
socket.pushRedirect(to: string, options?: {
  replace?: boolean;
  flash?: { type: FlashType; message: string };
}): void
```

```typescript
handleEvent: (event, state, socket) => {
  if (event.type === 'logout') {
    socket.pushRedirect('/login', {
      replace: true,
      flash: { type: 'info', message: 'You have been logged out' }
    });
  }
  return state;
}
```

#### pushPatch()

Navigate to a new URL while preserving the socket connection.

```typescript
socket.pushPatch(to: string, options?: { replace?: boolean }): void
```

```typescript
handleEvent: (event, state, socket) => {
  if (event.type === 'view_item') {
    socket.pushPatch(`/items/${event.value}`, { replace: false });
  }
  return state;
}
```

#### assign()

Update the socket state.

```typescript
socket.assign(state: Partial<LiveViewState>): void
```

```typescript
handleEvent: (event, state, socket) => {
  socket.assign({ loading: true });
  // State is now updated
  return { ...state, loading: true };
}
```

#### putFlash()

Add a flash message.

```typescript
socket.putFlash(type: FlashType, message: string): void
```

```typescript
handleEvent: (event, state, socket) => {
  socket.putFlash('success', 'Item saved successfully!');
  return state;
}
```

#### setTemporaryAssigns()

Mark state keys as temporary (cleared after render).

```typescript
socket.setTemporaryAssigns(keys: string[]): void
```

```typescript
mount: (socket) => {
  // Large data that shouldn't be kept in memory
  socket.setTemporaryAssigns(['largeList']);
  return { largeList: fetchLargeList() };
}
```

---

## LiveComponents

LiveComponents are stateful components that live within a LiveView. They have their own state and can handle events independently.

### createLiveComponent()

```typescript
function createLiveComponent<S extends LiveViewState, P = any>(
  definition: LiveComponentDefinition<S, P>
): LiveComponentDefinition<S, P>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `definition.id` | `string \| ((props) => string)` | Unique component identifier |
| `definition.mount` | `(socket, props) => S \| Promise<S>` | Initialize component state |
| `definition.update` | `(props, state, socket) => S \| Promise<S>` | Handle prop updates |
| `definition.handleEvent` | `(event, state, socket) => S \| Promise<S>` | Handle component events |
| `definition.render` | `(state, props) => string` | Render component HTML |
| `definition.preload` | `(propsList) => Promise<propsList>` | Batch data loading |

**Example - Modal Component:**

```typescript
interface ModalState {
  open: boolean;
}

interface ModalProps {
  title: string;
  children: string;
}

const Modal = createLiveComponent<ModalState, ModalProps>({
  id: 'modal',

  mount: () => ({ open: false }),

  handleEvent: (event, state) => {
    switch (event.type) {
      case 'open':
        return { open: true };
      case 'close':
        return { open: false };
      case 'toggle':
        return { open: !state.open };
      default:
        return state;
    }
  },

  render: (state, props) => `
    <div class="modal-wrapper">
      <button phx-click="toggle" phx-target="#modal">
        ${state.open ? 'Close' : 'Open'} Modal
      </button>

      ${state.open ? `
        <div class="modal-overlay" phx-click="close" phx-target="#modal">
          <div class="modal" onclick="event.stopPropagation()">
            <header>
              <h2>${props.title}</h2>
              <button phx-click="close" phx-target="#modal">&times;</button>
            </header>
            <div class="modal-body">
              ${props.children}
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `,
});
```

### Using LiveComponents in Views

```typescript
import { liveComponent, liveComponentByName } from '@philjs/liveview';

const PageView = createLiveView({
  render: (state) => `
    <div class="page">
      <h1>My Page</h1>

      ${liveComponent(Modal, {
        title: 'Welcome',
        children: '<p>This is modal content</p>'
      })}

      <!-- Or by registered name -->
      ${liveComponentByName('Modal', {
        title: 'Another Modal',
        children: '<p>More content</p>'
      }, { id: 'modal-2' })}
    </div>
  `,
});
```

### Async Components

Create components that fetch data asynchronously:

```typescript
const UserCard = createAsyncComponent<{ userId: string }, User>(
  // Fetch function
  async (props) => {
    const response = await fetch(`/api/users/${props.userId}`);
    return response.json();
  },

  // Render with data
  (user, props) => `
    <div class="user-card">
      <img src="${user.avatar}" alt="${user.name}" />
      <h3>${user.name}</h3>
      <p>${user.email}</p>
    </div>
  `,

  // Loading fallback
  (props) => `<div class="skeleton">Loading user ${props.userId}...</div>`
);
```

### Slots

Components can define slots for content projection:

```typescript
const Card = createLiveComponent({
  render: (state, props) => `
    <div class="card">
      <header>${renderSlot(props.slots, 'header')}</header>
      <main>${renderSlot(props.slots, 'default')}</main>
      ${hasSlot(props.slots, 'footer') ? `
        <footer>${renderSlot(props.slots, 'footer')}</footer>
      ` : ''}
    </div>
  `,
});
```

---

## PHX Bindings

LiveView uses `phx-*` attributes to bind events to server handlers.

### Event Bindings

| Attribute | Event | Description |
|-----------|-------|-------------|
| `phx-click` | click | Handle click events |
| `phx-change` | change/input | Handle form changes |
| `phx-submit` | submit | Handle form submission |
| `phx-blur` | blur | Handle focus loss |
| `phx-focus` | focus | Handle focus gain |
| `phx-keydown` | keydown | Handle key press |
| `phx-keyup` | keyup | Handle key release |
| `phx-window-scroll` | scroll | Handle window scroll |

### Modifiers

```html
<!-- Debounce input -->
<input phx-change="search" phx-debounce="300" />

<!-- Target specific component -->
<button phx-click="close" phx-target="#modal">Close</button>

<!-- Pass values -->
<button phx-click="select" phx-value-id="123">Select</button>

<!-- Disable button during submission -->
<button phx-click="save" phx-disable-with="Saving...">Save</button>

<!-- Key filtering -->
<input phx-keydown="submit" phx-keydown-key="Enter" />
```

### Form Bindings

```html
<form phx-submit="save" phx-change="validate">
  <input name="email" phx-blur="validate_email" />
  <input name="password" type="password" />
  <button type="submit">Submit</button>
</form>
```

---

## Client Hooks

Hooks provide client-side JavaScript interop for elements that need custom behavior.

### Registering Hooks

```typescript
import { registerHooks } from '@philjs/liveview/client';

registerHooks({
  ChartHook: {
    mounted() {
      // Initialize chart library
      this.chart = new Chart(this.el, {
        data: JSON.parse(this.el.dataset.chartData)
      });
    },

    updated() {
      // Update chart when element updates
      const newData = JSON.parse(this.el.dataset.chartData);
      this.chart.update(newData);
    },

    destroyed() {
      // Cleanup
      this.chart.destroy();
    }
  }
});
```

### Using Hooks in HTML

```html
<div phx-hook="ChartHook" data-chart-data='{"labels":["A","B"],"values":[1,2]}'></div>
```

### Hook Lifecycle

| Method | Description |
|--------|-------------|
| `mounted()` | Called when element is added to DOM |
| `beforeUpdate()` | Called before element is updated |
| `updated()` | Called after element is updated |
| `beforeDestroy()` | Called before element is removed |
| `destroyed()` | Called when element is removed |
| `disconnected()` | Called when socket disconnects |
| `reconnected()` | Called when socket reconnects |

### Hook Context

| Property/Method | Description |
|-----------------|-------------|
| `this.el` | The DOM element |
| `this.pushEvent(event, payload, target?)` | Push event to server |
| `this.pushEventTo(selector, event, payload)` | Push event to component |
| `this.handleEvent(event, callback)` | Handle server events |
| `this.upload(name, files)` | Upload files |

**Example - Interactive Map:**

```typescript
registerHooks({
  MapHook: {
    mounted() {
      this.map = new mapboxgl.Map({
        container: this.el,
        center: [this.el.dataset.lng, this.el.dataset.lat],
        zoom: 12
      });

      this.map.on('click', (e) => {
        this.pushEvent('map_click', {
          lat: e.lngLat.lat,
          lng: e.lngLat.lng
        });
      });

      // Handle server events
      this.handleEvent('add_marker', ({ lat, lng, title }) => {
        new mapboxgl.Marker()
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup().setHTML(title))
          .addTo(this.map);
      });
    },

    updated() {
      const center = [this.el.dataset.lng, this.el.dataset.lat];
      this.map.setCenter(center);
    },

    destroyed() {
      this.map.remove();
    }
  }
});
```

### Built-in Hooks

LiveView includes several built-in hooks:

| Hook | Description |
|------|-------------|
| `InfiniteScroll` | Triggers load-more on scroll |
| `Focus` | Focuses element on mount/update |
| `Clipboard` | Copy to clipboard functionality |
| `LocalTime` | Converts UTC to local time |
| `Sortable` | Drag and drop sorting |
| `Debounce` | Adds debounce to inputs |
| `Countdown` | Countdown timer |

**Example - Infinite Scroll:**

```html
<div id="posts">
  ${posts.map(post => `<article>${post.title}</article>`).join('')}

  <div phx-hook="InfiniteScroll" phx-load-more="load_more_posts">
    Loading more...
  </div>
</div>
```

---

## Forms and Validation

### Form State Management

```typescript
import {
  createFormState,
  updateField,
  setErrors,
  validateForm
} from '@philjs/liveview';

const initialState = createFormState({
  email: '',
  password: '',
  confirmPassword: ''
});

// Update a field
const newState = updateField(state, 'email', 'user@example.com');

// Set validation errors
const withErrors = setErrors(state, {
  email: ['Invalid email format'],
  password: ['Password is required']
});
```

### Validation Rules

```typescript
import { validateForm, validateField } from '@philjs/liveview';

const validations = [
  { field: 'email', rule: 'required', message: 'Email is required' },
  { field: 'email', rule: 'email', message: 'Invalid email format' },
  { field: 'password', rule: 'required', message: 'Password is required' },
  { field: 'password', rule: 'min', params: 8, message: 'Password must be at least 8 characters' },
  { field: 'age', rule: 'number', message: 'Age must be a number' },
  { field: 'website', rule: 'url', message: 'Invalid URL' },
  {
    field: 'confirmPassword',
    rule: 'custom',
    params: {
      validate: (value, data) => value === data.password
    },
    message: 'Passwords must match'
  }
];

// Validate entire form
const errors = validateForm(formData, validations);

// Validate single field
const fieldErrors = validateField('email', 'test@example.com', validations);
```

### Built-in Validation Rules

| Rule | Description | Params |
|------|-------------|--------|
| `required` | Value must be present | - |
| `email` | Valid email format | - |
| `min` | Minimum length/value | `number` |
| `max` | Maximum length/value | `number` |
| `pattern` | Regex pattern match | `string` (regex) |
| `matches` | Must match another field | `{ value, field }` |
| `url` | Valid URL format | - |
| `number` | Must be numeric | - |
| `integer` | Must be integer | - |
| `date` | Valid date | - |
| `custom` | Custom validation | `{ validate: fn }` |

### Form Serialization

```typescript
import { serializeForm, deserializeToForm } from '@philjs/liveview';

// Serialize form to object
const form = document.querySelector('form');
const data = serializeForm(form);
// { email: 'user@example.com', tags: ['a', 'b'], nested: { field: 'value' } }

// Populate form from object
deserializeToForm(form, data);
```

### File Uploads

```typescript
import {
  createUploadState,
  configureUpload,
  addFiles,
  updateProgress,
  getEntries
} from '@philjs/liveview';

// Configure upload
const uploadState = createUploadState();
configureUpload(uploadState, {
  name: 'avatar',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxEntries: 1,
  accept: ['image/jpeg', 'image/png', '.gif'],
  autoUpload: true,
  onProgress: (percent) => console.log(`Upload: ${percent}%`)
});

// Add files
const { valid, invalid } = addFiles(uploadState, 'avatar', fileInput.files);
console.log('Valid files:', valid);
console.log('Invalid files:', invalid); // With error messages

// Track progress
updateProgress(uploadState, entryId, 50); // 50%

// Get entries
const entries = getEntries(uploadState, 'avatar');
```

---

## Navigation

### Live Patch

Navigate while preserving the WebSocket connection:

```typescript
import { livePatch } from '@philjs/liveview/client';

// Navigate to new URL
livePatch('/products?category=shoes');

// Replace history entry
livePatch('/products?page=2', { replace: true });
```

In templates:

```html
<a href="/products/123" phx-link="patch">View Product</a>
<a href="/products/123" phx-link="patch" phx-link-replace>View (replace)</a>
```

### Live Redirect

Full navigation that creates a new socket connection:

```typescript
import { liveRedirect } from '@philjs/liveview/client';

liveRedirect('/checkout');
liveRedirect('/login', { replace: true });
```

In templates:

```html
<a href="/dashboard" phx-link="redirect">Go to Dashboard</a>
```

### URL Helpers

```typescript
import {
  parseUrl,
  buildUrl,
  updateParams,
  getNavigation
} from '@philjs/liveview';

// Parse URL
const { path, params, hash } = parseUrl('/products?category=shoes#section');

// Build URL
const url = buildUrl('/products', {
  category: 'shoes',
  colors: ['red', 'blue']
});
// "/products?category=shoes&colors=red&colors=blue"

// Update current params
const newUrl = updateParams({ page: '2', sort: 'price' });

// Get current navigation state
const nav = getNavigation();
// { path: '/products', params: URLSearchParams, mode: 'push' }
```

### Scroll Management

```typescript
import {
  saveScrollPosition,
  restoreScrollPosition,
  scrollToTarget
} from '@philjs/liveview';

// Save position before navigation
saveScrollPosition();

// Restore after navigation
restoreScrollPosition();

// Scroll to element or top
scrollToTarget('#section-2');
scrollToTarget(); // Scroll to top
```

### Loading States

```typescript
import { setLoading, onLoading, isLoading } from '@philjs/liveview';

// Subscribe to loading changes
onLoading((loading) => {
  document.body.classList.toggle('loading', loading);
});

// Check current state
if (isLoading()) {
  showSpinner();
}
```

---

## Server Setup

### Creating the Server

```typescript
import { createLiveViewServer, liveViewMiddleware } from '@philjs/liveview/server';

const server = createLiveViewServer({
  secret: process.env.SESSION_SECRET,
  ssr: true,
  rateLimit: {
    maxEventsPerSecond: 100,
    maxConnectionsPerIP: 10
  },
  pubSub: {
    adapter: 'memory' // or 'redis', 'postgres'
  }
});

// Register views
server.register('/', HomeView);
server.register('/products', ProductsView);
server.register('/products/:id', ProductDetailView);

// Register components
server.registerComponent('Modal', ModalComponent);
server.registerComponent('Dropdown', DropdownComponent);
```

### HTTP and WebSocket Handling

```typescript
// Handle HTTP requests
app.get('*', async (req, res) => {
  const response = await server.handleRequest(req);
  res.status(response.status);
  res.send(await response.text());
});

// Handle WebSocket connections
app.ws('/live/websocket', (ws, req) => {
  server.handleSocket(ws, req);
});
```

### Using Middleware

```typescript
import { liveViewMiddleware, liveViewWebSocketHandler } from '@philjs/liveview/server';

// Express/Hono middleware
app.use(liveViewMiddleware(server));

// WebSocket handler
app.ws('/live/websocket', liveViewWebSocketHandler(server));
```

### PubSub Broadcasting

```typescript
import { createMemoryPubSub } from '@philjs/liveview/server';

const pubSub = createMemoryPubSub();

// Subscribe to topic
const unsubscribe = pubSub.subscribe('chat:room-1', (event, payload) => {
  console.log('Received:', event, payload);
});

// Broadcast to all subscribers
pubSub.broadcast('chat:room-1', 'new_message', {
  user: 'Alice',
  text: 'Hello!'
});

// Broadcast from specific socket (excludes sender)
pubSub.broadcastFrom(socketId, 'chat:room-1', 'new_message', payload);

// Cleanup
unsubscribe();
```

### In LiveView Handlers

```typescript
const ChatView = createLiveView({
  mount: (socket) => {
    // Subscribe to room
    server.subscribe(socket.id, `chat:${socket.params.room}`);
    return { messages: [] };
  },

  handleEvent: (event, state, socket) => {
    if (event.type === 'send_message') {
      // Broadcast to room
      server.broadcast(`chat:${socket.params.room}`, 'new_message', {
        user: socket.session.user,
        text: event.value
      });
    }
    return state;
  },

  handleInfo: (info, state, socket) => {
    // Receive broadcasts
    if (info.event === 'new_message') {
      return {
        ...state,
        messages: [...state.messages, info.payload]
      };
    }
    return state;
  },

  terminate: (reason, state) => {
    // Cleanup subscriptions
  }
});
```

---

## DOM Diffing

LiveView uses an efficient diffing algorithm to compute minimal DOM patches.

### Differ API

```typescript
import { createDiffer, applyPatches } from '@philjs/liveview';

const differ = createDiffer();

// Compute patches
const patches = differ.diff(oldHtml, newHtml);

// Apply patches (client-side)
applyPatches(containerElement, patches);
```

### Patch Types

| Type | Description |
|------|-------------|
| `morph` | Full content replacement |
| `replace` | Replace specific element |
| `append` | Append to container |
| `prepend` | Prepend to container |
| `remove` | Remove element |
| `update_attr` | Update attribute |
| `remove_attr` | Remove attribute |

### Keyed Elements

Use `phx-key` for efficient list updates:

```typescript
render: (state) => `
  <ul>
    ${state.items.map(item => `
      <li phx-key="${item.id}">
        ${item.name}
      </li>
    `).join('')}
  </ul>
`
```

---

## Template Helpers

### HTML Escaping

```typescript
import { html, raw, when, each, input, errorTag } from '@philjs/liveview';

// Safe HTML with auto-escaping
const template = html`<div>${userInput}</div>`;

// Raw HTML (no escaping)
const rawHtml = raw('<strong>Bold</strong>');

// Conditional rendering
const content = when(isLoggedIn, '<a href="/profile">Profile</a>');

// List rendering with keys
const list = each(
  items,
  (item, index) => item.id, // key function
  (item, index) => `<li>${item.name}</li>` // template
);
```

### Form Helpers

```typescript
// Generate input with phx bindings
const emailInput = input('email', {
  type: 'email',
  value: state.email,
  phxChange: true,
  phxBlur: true,
  phxDebounce: 300,
  class: 'form-input',
  placeholder: 'Enter email',
  required: true
});

// Render validation errors
const errors = errorTag(state.errors, 'email');
// <div class="error">Invalid email format</div>
```

---

## Types Reference

### Core Types

```typescript
interface LiveViewState {
  [key: string]: any;
}

interface LiveViewEvent {
  type: string;
  value?: any;
  target?: string;
  key?: string;
  keyCode?: number;
  meta?: Record<string, any>;
}

interface LiveViewParams {
  [key: string]: string | string[] | undefined;
}

interface LiveViewSession {
  [key: string]: any;
}

type FlashType = 'info' | 'success' | 'warning' | 'error';
```

### Socket Types

```typescript
interface LiveSocket {
  id: string;
  state: LiveViewState;
  session: LiveViewSession;
  params: LiveViewParams;
  clientId: string;
  pushEvent(event: string, payload: any): void;
  pushRedirect(to: string, options?: RedirectOptions): void;
  pushPatch(to: string, options?: PatchOptions): void;
  assign(state: Partial<LiveViewState>): void;
  putFlash(type: FlashType, message: string): void;
  getTemporaryAssigns(): string[];
  setTemporaryAssigns(keys: string[]): void;
}

interface RedirectOptions {
  replace?: boolean;
  flash?: { type: FlashType; message: string };
}

interface PatchOptions {
  replace?: boolean;
}
```

### Definition Types

```typescript
interface LiveViewDefinition<S extends LiveViewState = LiveViewState> {
  mount: (socket: LiveSocket) => S | Promise<S>;
  handleParams?: (params: LiveViewParams, uri: string, socket: LiveSocket) => S | Promise<S>;
  handleEvent?: (event: LiveViewEvent, state: S, socket: LiveSocket) => S | Promise<S>;
  handleInfo?: (info: any, state: S, socket: LiveSocket) => S | Promise<S>;
  render: (state: S, assigns?: Record<string, any>) => string;
  terminate?: (reason: string, state: S) => void;
}

interface LiveComponentDefinition<S extends LiveViewState = LiveViewState, P = any> {
  id?: string | ((props: P) => string);
  mount?: (socket: LiveSocket, props: P) => S | Promise<S>;
  update?: (props: P, state: S, socket: LiveSocket) => S | Promise<S>;
  handleEvent?: (event: LiveViewEvent, state: S, socket: LiveSocket) => S | Promise<S>;
  render: (state: S, props: P) => string;
  preload?: (listOfAssigns: P[]) => Promise<P[]>;
}
```

### Client Types

```typescript
interface LiveViewClientOptions {
  url: string;
  csrfToken?: string;
  debug?: boolean;
  params?: Record<string, any>;
  reconnect?: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
  };
}

interface ClientHook {
  mounted?: () => void;
  beforeUpdate?: () => void;
  updated?: () => void;
  beforeDestroy?: () => void;
  destroyed?: () => void;
  disconnected?: () => void;
  reconnected?: () => void;
  el?: HTMLElement;
  pushEvent?: (event: string, payload: any, target?: string) => void;
  pushEventTo?: (selector: string, event: string, payload: any) => void;
  handleEvent?: (event: string, callback: (payload: any) => void) => void;
  upload?: (name: string, files: FileList) => void;
}

type Hooks = Record<string, Partial<ClientHook>>;
```

### Form Types

```typescript
interface FormValidation {
  field: string;
  rule: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom';
  message: string;
  params?: any;
}

interface UploadConfig {
  name: string;
  maxFileSize?: number;
  maxEntries?: number;
  accept?: string[];
  autoUpload?: boolean;
  onProgress?: (percent: number) => void;
}

interface UploadEntry {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
  previewUrl?: string;
}
```

### Navigation Types

```typescript
interface LiveNavigation {
  path: string;
  params: URLSearchParams;
  mode: 'push' | 'replace' | 'patch';
}

interface NavigationEvent {
  type: 'link_click' | 'popstate' | 'patch' | 'redirect';
  to: string;
  replace?: boolean;
}
```

### Patch Types

```typescript
interface DOMPatch {
  type: 'morph' | 'append' | 'prepend' | 'replace' | 'remove' | 'update_attr' | 'remove_attr';
  target: string;
  html?: string;
  attr?: string;
  value?: string;
}

interface ViewPatch {
  patches: DOMPatch[];
  title?: string;
  events?: PushEvent[];
}
```

---

## API Reference

### Server Functions

| Function | Description |
|----------|-------------|
| `createLiveViewServer(options)` | Create a LiveView server instance |
| `createLiveView(definition)` | Create a LiveView definition |
| `createLiveComponent(definition)` | Create a LiveComponent definition |
| `createLiveSocket(id, state, options)` | Create a socket implementation |
| `mountLiveView(definition, socket)` | Mount a LiveView instance |
| `mountLiveComponent(definition, props, socket, parentId)` | Mount a component instance |
| `liveViewMiddleware(server)` | Express/Hono middleware |
| `liveViewWebSocketHandler(server)` | WebSocket handler |
| `createMemoryPubSub()` | Create in-memory PubSub |

### Client Functions

| Function | Description |
|----------|-------------|
| `createLiveViewClient(options)` | Create a LiveView client |
| `initLiveView(options?)` | Auto-initialize LiveView |
| `registerHooks(hooks)` | Register client hooks |
| `livePatch(to, options?)` | Navigate with live patch |
| `liveRedirect(to, options?)` | Navigate with redirect |

### Form Functions

| Function | Description |
|----------|-------------|
| `createFormState(initialData?)` | Create form state manager |
| `updateField(state, field, value)` | Update form field |
| `setErrors(state, errors)` | Set validation errors |
| `validateForm(data, validations)` | Validate form data |
| `validateField(field, value, validations, data?)` | Validate single field |
| `serializeForm(form)` | Serialize form to object |
| `deserializeToForm(form, data)` | Populate form from object |
| `createUploadState()` | Create upload state manager |
| `configureUpload(state, config)` | Configure upload |
| `addFiles(state, uploadName, files)` | Add files to queue |

### Navigation Functions

| Function | Description |
|----------|-------------|
| `initNavigation()` | Initialize navigation handling |
| `onNavigate(callback)` | Subscribe to navigation events |
| `getNavigation()` | Get current navigation state |
| `parseUrl(url)` | Parse URL components |
| `buildUrl(path, params?)` | Build URL from parts |
| `updateParams(params)` | Update URL parameters |
| `saveScrollPosition(key?)` | Save scroll position |
| `restoreScrollPosition(key?)` | Restore scroll position |
| `scrollToTarget(hash?)` | Scroll to element |
| `setPageTitle(title, prefix?, suffix?)` | Update page title |
| `setLoading(loading, target?)` | Set loading state |
| `onLoading(callback)` | Subscribe to loading changes |

### Differ Functions

| Function | Description |
|----------|-------------|
| `createDiffer()` | Create differ instance |
| `applyPatches(container, patches)` | Apply DOM patches |
| `parseHtml(html)` | Parse HTML to VDOM |
| `vnodeToHtml(node)` | Convert VDOM to HTML |

### Template Functions

| Function | Description |
|----------|-------------|
| `html` | Template tag with escaping |
| `raw(value)` | Raw HTML (no escaping) |
| `when(condition, content)` | Conditional rendering |
| `each(items, keyFn, template)` | List rendering |
| `input(name, options?)` | Generate input element |
| `errorTag(errors, field)` | Render field errors |

### Hook Functions

| Function | Description |
|----------|-------------|
| `registerHooks(hooks)` | Register hooks globally |
| `getHook(name)` | Get registered hook |
| `getAllHooks()` | Get all hooks |
| `mountHook(element, hookName, context)` | Mount hook on element |
| `updateHook(element)` | Trigger hook update |
| `destroyHook(element)` | Destroy hook |
| `disconnectHooks()` | Notify all hooks of disconnect |
| `reconnectHooks()` | Notify all hooks of reconnect |

---

## Comparison with Phoenix LiveView

| Feature | PhilJS LiveView | Phoenix LiveView |
|---------|-----------------|------------------|
| Language | TypeScript | Elixir |
| Server | Node.js/Bun/Deno | BEAM VM |
| State | JavaScript objects | Elixir maps |
| Diffing | Custom VDOM differ | Custom diff algorithm |
| PubSub | Memory/Redis/Postgres | PG2/Phoenix.PubSub |
| Uploads | Built-in | Built-in |
| Hooks | JavaScript | JavaScript |
| Components | LiveComponents | LiveComponents |

## Next Steps

- Build a real-time chat application
- Implement infinite scrolling lists
- Create interactive dashboards
- Add collaborative editing features
