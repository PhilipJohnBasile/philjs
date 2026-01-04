# Server-Side LiveView

This document covers the server-side implementation of `@philjs/liveview`, including creating LiveViews, the LiveView lifecycle, template rendering, and state management.

## Creating a LiveView

The `createLiveView` function is the primary way to define a LiveView component that runs on the server.

```typescript
import { createLiveView } from '@philjs/liveview';

const MyView = createLiveView<MyState>({
  mount: (socket) => {
    // Return initial state
    return { count: 0 };
  },

  handleEvent: (event, state, socket) => {
    // Handle client events
    return state;
  },

  render: (state) => {
    // Return HTML string
    return `<div>${state.count}</div>`;
  },
});
```

### Function Signature

```typescript
function createLiveView<S extends LiveViewState>(
  definition: LiveViewDefinition<S>
): LiveViewDefinition<S>
```

### LiveViewDefinition Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `mount` | `(socket: LiveSocket) => S \| Promise<S>` | Yes | Initialize state when view mounts |
| `handleEvent` | `(event, state, socket) => S \| Promise<S>` | No | Handle client events |
| `handleParams` | `(params, uri, socket) => S \| Promise<S>` | No | Handle URL parameter changes |
| `handleInfo` | `(info, state, socket) => S \| Promise<S>` | No | Handle internal messages |
| `render` | `(state, assigns?) => string` | Yes | Render state to HTML |
| `terminate` | `(reason, state) => void` | No | Cleanup when view terminates |

## LiveView Lifecycle

A LiveView goes through several lifecycle phases:

```
1. HTTP Request
   └── Server renders initial HTML (SSR)
       └── Client receives HTML
           └── Client connects WebSocket
               └── mount() called
                   └── View active
                       ├── handleEvent() - client events
                       ├── handleParams() - URL changes
                       ├── handleInfo() - internal messages
                       └── terminate() - cleanup
```

### mount()

Called when the LiveView is first mounted. This is where you initialize your state, typically by fetching data from a database or external API.

```typescript
interface UserState {
  user: User | null;
  posts: Post[];
  loading: boolean;
}

const ProfileView = createLiveView<UserState>({
  mount: async (socket) => {
    // Access session data
    const userId = socket.session.userId;

    // Fetch data
    const user = await db.users.findById(userId);
    const posts = await db.posts.findByUserId(userId);

    return {
      user,
      posts,
      loading: false,
    };
  },
  // ...
});
```

**Key points about mount:**
- Can be synchronous or asynchronous
- Has access to `socket.session` for session data
- Has access to `socket.params` for URL parameters
- Should return the initial state object

### handleEvent()

Called when the client triggers a PHX event (e.g., `phx-click`, `phx-submit`).

```typescript
interface LiveViewEvent {
  type: string;       // Event name from phx-click, etc.
  value?: any;        // Event value (form data, phx-value-*, etc.)
  target?: string;    // Element ID that triggered the event
  key?: string;       // Key for keyboard events
  keyCode?: number;   // Key code for keyboard events
  meta?: Record<string, any>; // Modifier keys for keyboard events
}
```

**Example:**

```typescript
const TodoView = createLiveView<TodoState>({
  handleEvent: (event, state, socket) => {
    switch (event.type) {
      case 'add_todo':
        return {
          ...state,
          todos: [...state.todos, { id: Date.now(), text: event.value.text, done: false }],
        };

      case 'toggle_todo':
        return {
          ...state,
          todos: state.todos.map(todo =>
            todo.id === Number(event.value) ? { ...todo, done: !todo.done } : todo
          ),
        };

      case 'delete_todo':
        return {
          ...state,
          todos: state.todos.filter(todo => todo.id !== Number(event.value)),
        };

      default:
        return state;
    }
  },
  // ...
});
```

**Accessing event values:**

```html
<!-- phx-value-* attributes become event.value -->
<button phx-click="select_item" phx-value-id="123" phx-value-name="Product">
  Select
</button>
```

```typescript
handleEvent: (event, state, socket) => {
  // event.type === 'select_item'
  // event.value === { id: '123', name: 'Product' }
  return state;
}
```

### handleParams()

Called when URL parameters change via live navigation (`livePatch`). This allows the view to respond to URL changes without remounting.

```typescript
const ProductsView = createLiveView<ProductState>({
  mount: async (socket) => {
    const category = socket.params.category || 'all';
    const products = await db.products.findByCategory(category);
    return { products, category, page: 1 };
  },

  handleParams: async (params, uri, socket) => {
    // Params changed via live navigation
    const category = params.category || 'all';
    const page = Number(params.page) || 1;

    const products = await db.products.findByCategory(category, { page });

    return {
      ...socket.state,
      products,
      category,
      page,
    };
  },
  // ...
});
```

**Use cases:**
- Pagination without full page reload
- Filter changes
- Search queries
- Tab navigation

### handleInfo()

Called when the view receives an internal message, typically from PubSub broadcasts or background processes.

```typescript
const ChatView = createLiveView<ChatState>({
  mount: (socket) => {
    // Subscribe to chat room
    server.subscribe(socket.id, `chat:${socket.params.roomId}`);
    return { messages: [], typing: [] };
  },

  handleInfo: (info, state, socket) => {
    switch (info.event) {
      case 'new_message':
        return {
          ...state,
          messages: [...state.messages, info.payload],
        };

      case 'user_typing':
        return {
          ...state,
          typing: [...state.typing, info.payload.user],
        };

      case 'user_stopped_typing':
        return {
          ...state,
          typing: state.typing.filter(u => u !== info.payload.user),
        };

      default:
        return state;
    }
  },
  // ...
});
```

### terminate()

Called when the view is unmounted (user navigates away, disconnects, or closes the browser).

```typescript
const GameView = createLiveView<GameState>({
  mount: (socket) => {
    // Join game lobby
    gameService.join(socket.id, socket.params.gameId);
    return { game: null, players: [] };
  },

  terminate: (reason, state) => {
    // Cleanup when user leaves
    gameService.leave(socket.id, state.gameId);

    // Log the termination
    console.log(`User left game: ${reason}`);
  },
  // ...
});
```

**Common termination reasons:**
- `'leave'` - User navigated away
- `'shutdown'` - Server shutting down
- `'timeout'` - Connection timed out

## The LiveSocket Object

The `LiveSocket` object is passed to all lifecycle callbacks and provides methods for interacting with the client.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique socket identifier |
| `state` | `LiveViewState` | Current view state |
| `session` | `LiveViewSession` | Session data (user info, etc.) |
| `params` | `LiveViewParams` | URL parameters |
| `clientId` | `string` | Connected client identifier |

### Methods

#### socket.assign()

Update the socket's internal state. This is useful when you need to update state without returning a new state object.

```typescript
handleEvent: async (event, state, socket) => {
  if (event.type === 'load_more') {
    socket.assign({ loading: true });

    const moreItems = await fetchMoreItems(state.page + 1);

    return {
      ...state,
      items: [...state.items, ...moreItems],
      page: state.page + 1,
      loading: false,
    };
  }
  return state;
}
```

#### socket.pushEvent()

Push an event to the client. This triggers handlers registered with `handleEvent` on the client side.

```typescript
handleEvent: async (event, state, socket) => {
  if (event.type === 'save') {
    try {
      await saveData(state.form);
      socket.pushEvent('save_success', { message: 'Saved successfully!' });
    } catch (error) {
      socket.pushEvent('save_error', { message: error.message });
    }
  }
  return state;
}
```

Client-side handling:

```typescript
client.handleEvent('save_success', (payload) => {
  showToast(payload.message);
});
```

#### socket.pushRedirect()

Redirect the client to a new URL. This closes the current socket connection.

```typescript
handleEvent: (event, state, socket) => {
  if (event.type === 'logout') {
    // Clear session, then redirect
    socket.pushRedirect('/login', {
      replace: true,
      flash: { type: 'info', message: 'You have been logged out' },
    });
  }
  return state;
}
```

#### socket.pushPatch()

Navigate to a new URL while preserving the socket connection. This triggers `handleParams`.

```typescript
handleEvent: (event, state, socket) => {
  if (event.type === 'change_page') {
    socket.pushPatch(`/products?page=${event.value}`, { replace: false });
  }
  return state;
}
```

#### socket.putFlash()

Add a flash message to be displayed to the user.

```typescript
handleEvent: async (event, state, socket) => {
  if (event.type === 'delete_item') {
    await db.items.delete(event.value);
    socket.putFlash('success', 'Item deleted successfully');
    return { ...state, items: state.items.filter(i => i.id !== event.value) };
  }
  return state;
}
```

#### socket.setTemporaryAssigns()

Mark state keys as temporary. These are cleared after each render, which is useful for large datasets that don't need to be kept in memory.

```typescript
mount: async (socket) => {
  // Mark 'largeDataset' as temporary - cleared after render
  socket.setTemporaryAssigns(['largeDataset']);

  const largeDataset = await fetchLargeDataset();
  return {
    summary: computeSummary(largeDataset),
    largeDataset, // Will be cleared after initial render
  };
}
```

## Template Rendering

The `render` function returns an HTML string that represents the current state.

### Basic Rendering

```typescript
render: (state) => `
  <div class="container">
    <h1>Welcome, ${state.user.name}</h1>
    <p>You have ${state.notifications.length} notifications</p>
  </div>
`
```

### Template Helpers

#### html - Safe HTML Escaping

```typescript
import { html } from '@philjs/liveview';

render: (state) => html`
  <div>
    <p>User input: ${state.userInput}</p>  <!-- Auto-escaped -->
  </div>
`
```

#### raw - Raw HTML (No Escaping)

```typescript
import { raw } from '@philjs/liveview';

render: (state) => `
  <div>
    ${raw(state.htmlContent)}  <!-- Not escaped - use carefully! -->
  </div>
`
```

#### when - Conditional Rendering

```typescript
import { when } from '@philjs/liveview';

render: (state) => `
  <div>
    ${when(state.isLoggedIn, '<a href="/profile">Profile</a>')}
    ${when(!state.isLoggedIn, '<a href="/login">Login</a>')}
  </div>
`
```

#### each - List Rendering with Keys

```typescript
import { each } from '@philjs/liveview';

render: (state) => `
  <ul>
    ${each(
      state.items,
      (item) => item.id,  // Key function - important for efficient diffing
      (item) => `<li>${item.name}</li>`
    )}
  </ul>
`
```

### PHX Bindings in Templates

```html
<!-- Click events -->
<button phx-click="increment">+1</button>

<!-- Click with value -->
<button phx-click="select" phx-value-id="${item.id}">Select</button>

<!-- Form submission -->
<form phx-submit="save">
  <input name="title" value="${state.title}" />
  <button type="submit">Save</button>
</form>

<!-- Form change (live validation) -->
<form phx-change="validate" phx-submit="save">
  <input name="email" phx-debounce="300" />
</form>

<!-- Target specific component -->
<button phx-click="close" phx-target="#modal">Close</button>

<!-- Disable during submission -->
<button phx-click="save" phx-disable-with="Saving...">Save</button>

<!-- Keyboard events -->
<input phx-keydown="search" phx-keydown-key="Enter" />

<!-- Keys for efficient list diffing -->
<li phx-key="${item.id}">${item.name}</li>
```

### Form Input Helper

```typescript
import { input, errorTag } from '@philjs/liveview';

render: (state) => `
  <form phx-submit="save" phx-change="validate">
    ${input('email', {
      type: 'email',
      value: state.form.email,
      phxChange: true,
      phxDebounce: 300,
      class: 'form-input',
      placeholder: 'Enter email',
      required: true,
    })}
    ${errorTag(state.errors, 'email')}

    <button type="submit">Submit</button>
  </form>
`
```

## State Management

### Immutable State Updates

Always return new state objects rather than mutating existing state:

```typescript
// Good - immutable update
handleEvent: (event, state) => ({
  ...state,
  count: state.count + 1,
})

// Bad - mutating state
handleEvent: (event, state) => {
  state.count += 1;  // Don't do this!
  return state;
}
```

### Nested State Updates

```typescript
interface AppState {
  user: {
    profile: {
      name: string;
      settings: {
        theme: string;
        notifications: boolean;
      };
    };
  };
}

handleEvent: (event, state) => {
  if (event.type === 'update_theme') {
    return {
      ...state,
      user: {
        ...state.user,
        profile: {
          ...state.user.profile,
          settings: {
            ...state.user.profile.settings,
            theme: event.value,
          },
        },
      },
    };
  }
  return state;
}
```

### Async State Updates

```typescript
handleEvent: async (event, state, socket) => {
  if (event.type === 'fetch_data') {
    // Show loading state
    socket.assign({ loading: true });

    try {
      const data = await fetchData(event.value);
      return { ...state, data, loading: false, error: null };
    } catch (error) {
      return { ...state, loading: false, error: error.message };
    }
  }
  return state;
}
```

## LiveView Server

### Creating the Server

```typescript
import { createLiveViewServer } from '@philjs/liveview/server';

const server = createLiveViewServer({
  secret: process.env.SESSION_SECRET,  // Required for session signing
  ssr: true,  // Enable server-side rendering
  rateLimit: {
    maxEventsPerSecond: 100,
    maxConnectionsPerIP: 10,
  },
  pubSub: {
    adapter: 'memory',  // 'memory' | 'redis' | 'postgres'
  },
});
```

### Registering Views

```typescript
// Register at exact path
server.register('/', HomeView);
server.register('/about', AboutView);

// Register with path parameters
server.register('/users/:id', UserView);
server.register('/products/:category/:id', ProductView);

// Register with catch-all
server.register('/docs/*', DocsView);
```

### Registering Components

```typescript
import { Modal, Dropdown, Tooltip } from './components';

server.registerComponent('Modal', Modal);
server.registerComponent('Dropdown', Dropdown);
server.registerComponent('Tooltip', Tooltip);
```

### HTTP Request Handling

```typescript
// Express
app.get('*', async (req, res) => {
  const response = await server.handleRequest(req);
  res.status(response.status);
  for (const [key, value] of response.headers) {
    res.setHeader(key, value);
  }
  res.send(await response.text());
});

// Hono
app.get('*', async (c) => {
  return server.handleRequest(c.req.raw);
});
```

### WebSocket Handling

```typescript
// Express with ws
const wss = new WebSocket.Server({ server: httpServer, path: '/live/websocket' });
wss.on('connection', (ws, req) => {
  server.handleSocket(ws, req);
});

// Using middleware helpers
import { liveViewMiddleware, liveViewWebSocketHandler } from '@philjs/liveview/server';

app.use(liveViewMiddleware(server));
app.ws('/live/websocket', liveViewWebSocketHandler(server));
```

## PubSub and Broadcasting

### Creating PubSub

```typescript
import { createMemoryPubSub } from '@philjs/liveview/server';

const pubSub = createMemoryPubSub();
```

### Subscribing and Broadcasting

```typescript
const NotificationsView = createLiveView({
  mount: (socket) => {
    // Subscribe to user's notifications channel
    server.subscribe(socket.id, `notifications:${socket.session.userId}`);
    return { notifications: [] };
  },

  handleEvent: (event, state, socket) => {
    if (event.type === 'mark_read') {
      // Broadcast to all user's sessions
      server.broadcast(`notifications:${socket.session.userId}`, 'notification_read', {
        id: event.value,
      });
    }
    return state;
  },

  handleInfo: (info, state) => {
    if (info.event === 'new_notification') {
      return { ...state, notifications: [...state.notifications, info.payload] };
    }
    if (info.event === 'notification_read') {
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === info.payload.id ? { ...n, read: true } : n
        ),
      };
    }
    return state;
  },

  terminate: (reason, state) => {
    server.unsubscribe(socket.id, `notifications:${socket.session.userId}`);
  },
});
```

### Broadcasting Patterns

```typescript
// Broadcast to all subscribers
server.broadcast('chat:room-1', 'new_message', { text: 'Hello!' });

// Broadcast from specific socket (excludes sender)
pubSub.broadcastFrom(socket.id, 'chat:room-1', 'new_message', { text: 'Hello!' });
```

## LiveComponents

LiveComponents are stateful components that live within a LiveView and can handle their own events.

### Creating a LiveComponent

```typescript
import { createLiveComponent } from '@philjs/liveview';

interface ModalState {
  open: boolean;
}

interface ModalProps {
  title: string;
  children: string;
}

const Modal = createLiveComponent<ModalState, ModalProps>({
  id: 'modal',  // Can also be a function: (props) => `modal-${props.id}`

  mount: () => ({ open: false }),

  handleEvent: (event, state) => {
    switch (event.type) {
      case 'open': return { open: true };
      case 'close': return { open: false };
      case 'toggle': return { open: !state.open };
      default: return state;
    }
  },

  render: (state, props) => `
    <div class="modal-wrapper">
      <button phx-click="toggle" phx-target="#modal">
        ${state.open ? 'Close' : 'Open'}
      </button>

      ${state.open ? `
        <div class="modal-overlay" phx-click="close" phx-target="#modal">
          <div class="modal">
            <header><h2>${props.title}</h2></header>
            <main>${props.children}</main>
          </div>
        </div>
      ` : ''}
    </div>
  `,
});
```

### Using Components in Views

```typescript
import { liveComponent, liveComponentByName } from '@philjs/liveview';

const PageView = createLiveView({
  render: (state) => `
    <div>
      ${liveComponent(Modal, {
        title: 'Welcome',
        children: '<p>Modal content</p>',
      })}

      <!-- Or by registered name -->
      ${liveComponentByName('Modal', {
        title: 'Another Modal',
        children: '<p>More content</p>',
      }, { id: 'modal-2' })}
    </div>
  `,
});
```

### Component Preloading

Optimize data fetching for lists of components:

```typescript
const UserCard = createLiveComponent<UserState, UserProps>({
  // Called once with all props for batch data loading
  preload: async (propsList) => {
    const userIds = propsList.map(p => p.userId);
    const users = await db.users.findByIds(userIds);

    return propsList.map(props => ({
      ...props,
      user: users.find(u => u.id === props.userId),
    }));
  },

  render: (state, props) => `
    <div class="user-card">
      <img src="${props.user.avatar}" />
      <h3>${props.user.name}</h3>
    </div>
  `,
});
```

## Best Practices

### 1. Keep State Minimal

Only store what you need for rendering:

```typescript
// Good
interface State {
  selectedId: string | null;
  items: Array<{ id: string; name: string }>;
}

// Avoid storing derived data
interface BadState {
  selectedId: string | null;
  items: Array<...>;
  selectedItem: Item;  // Can be derived from selectedId + items
  itemCount: number;   // Can be derived from items.length
}
```

### 2. Use Temporary Assigns for Large Data

```typescript
mount: async (socket) => {
  socket.setTemporaryAssigns(['rawData']);

  const rawData = await fetchLargeDataset();
  return {
    summary: computeSummary(rawData),
    rawData,  // Cleared after render
  };
}
```

### 3. Debounce Frequent Events

```html
<input phx-change="search" phx-debounce="300" />
```

### 4. Use Keys for Lists

```typescript
render: (state) => `
  <ul>
    ${state.items.map(item => `
      <li phx-key="${item.id}">${item.name}</li>
    `).join('')}
  </ul>
`
```

### 5. Handle Errors Gracefully

```typescript
handleEvent: async (event, state, socket) => {
  try {
    const result = await riskyOperation();
    return { ...state, result, error: null };
  } catch (error) {
    socket.putFlash('error', error.message);
    return { ...state, error: error.message };
  }
}
```
