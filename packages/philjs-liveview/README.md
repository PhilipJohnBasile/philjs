# PhilJS LiveView

Server-driven UI for PhilJS - Phoenix LiveView-style real-time rendering with minimal client JavaScript.

## Features

- **Server-Rendered HTML** - Initial HTML rendered on server, updates via WebSocket
- **DOM Diffing** - Efficient patching with morphdom-style updates
- **Minimal Client JS** - Only ~10KB of client code needed
- **LiveComponents** - Stateful components within views
- **Form Handling** - Built-in validation and file uploads
- **Navigation** - SPA-like navigation without full page reloads
- **Hooks** - Client-side JavaScript interop
- **PubSub** - Real-time broadcasting between views

## Installation

```bash
npm install philjs-liveview
```

## Quick Start

### Server-Side

```typescript
import { createLiveViewServer, createLiveView } from 'philjs-liveview/server';

// Create a LiveView
const CounterView = createLiveView({
  mount: (socket) => {
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
    <div class="counter">
      <h1>Count: ${state.count}</h1>
      <button phx-click="increment">+</button>
      <button phx-click="decrement">-</button>
    </div>
  `,
});

// Create server
const server = createLiveViewServer({ secret: 'your-secret-key' });
server.register('/', CounterView);

// Handle requests
app.get('*', (req) => server.handleRequest(req));
app.ws('/live/websocket', (ws, req) => server.handleSocket(ws, req));
```

### Client-Side

```typescript
import { initLiveView } from 'philjs-liveview/client';

// Auto-initialize from container with data-phx-main
initLiveView();
```

## PHX Attributes

### Event Bindings

```html
<!-- Click events -->
<button phx-click="action_name">Click Me</button>

<!-- Click with value -->
<button phx-click="delete" phx-value-id="123">Delete</button>

<!-- Form events -->
<form phx-submit="save" phx-change="validate">
  <input name="email" phx-debounce="300" />
  <button type="submit">Save</button>
</form>

<!-- Key events -->
<input phx-keydown="search" phx-keydown-key="Enter" />

<!-- Focus/blur -->
<input phx-focus="show_suggestions" phx-blur="hide_suggestions" />
```

### Loading States

```html
<!-- Disable during submission -->
<button phx-click="save" phx-disable-with="Saving...">
  Save
</button>

<!-- Loading indicator -->
<div phx-loading-class="opacity-50">
  Content
</div>
```

### Navigation

```html
<!-- Live patch (keeps socket, updates URL) -->
<a href="/users/123" phx-link="patch">View User</a>

<!-- Live redirect (new socket) -->
<a href="/dashboard" phx-link="redirect">Dashboard</a>

<!-- Replace history -->
<a href="/page/2" phx-link="patch" phx-link-replace>Page 2</a>
```

## LiveComponents

Stateful components that live within a LiveView:

```typescript
import { createLiveComponent } from 'philjs-liveview/server';

const Modal = createLiveComponent({
  id: (props) => `modal-${props.name}`,

  mount: () => ({ open: false }),

  handleEvent: (event, state) => {
    if (event.type === 'toggle') {
      return { open: !state.open };
    }
    return state;
  },

  render: (state, props) => `
    <div id="${props.name}" class="modal ${state.open ? 'open' : ''}">
      <div class="modal-backdrop" phx-click="toggle"></div>
      <div class="modal-content">
        ${props.children}
      </div>
    </div>
  `,
});
```

## Hooks

Client-side JavaScript interop:

```typescript
import { registerHooks } from 'philjs-liveview/client';

registerHooks({
  InfiniteScroll: {
    mounted() {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          this.pushEvent('load-more', {});
        }
      });
      observer.observe(this.el);
    },
  },

  Chart: {
    mounted() {
      this.chart = new Chart(this.el, { /* ... */ });

      this.handleEvent('update-data', (data) => {
        this.chart.update(data);
      });
    },

    destroyed() {
      this.chart.destroy();
    },
  },
});
```

Use hooks in templates:

```html
<div phx-hook="InfiniteScroll"></div>
<canvas phx-hook="Chart"></canvas>
```

## Forms

### Validation

```typescript
import { validateForm } from 'philjs-liveview';

const validations = [
  { field: 'email', rule: 'required', message: 'Email is required' },
  { field: 'email', rule: 'email', message: 'Invalid email' },
  { field: 'password', rule: 'min', params: 8, message: 'Password must be at least 8 characters' },
];

const UserForm = createLiveView({
  mount: () => ({
    data: { email: '', password: '' },
    errors: {},
  }),

  handleEvent: (event, state) => {
    if (event.type === 'validate') {
      const errors = validateForm(event.value, validations);
      return { ...state, data: event.value, errors };
    }
    if (event.type === 'submit') {
      const errors = validateForm(event.value, validations);
      if (Object.keys(errors).length === 0) {
        // Save user
      }
      return { ...state, errors };
    }
    return state;
  },

  render: (state) => `
    <form phx-submit="submit" phx-change="validate">
      <input name="email" value="${state.data.email}" />
      ${state.errors.email ? `<span class="error">${state.errors.email.join(', ')}</span>` : ''}

      <input name="password" type="password" />
      ${state.errors.password ? `<span class="error">${state.errors.password.join(', ')}</span>` : ''}

      <button type="submit">Sign Up</button>
    </form>
  `,
});
```

### File Uploads

```typescript
const UploadView = createLiveView({
  mount: () => ({
    uploads: [],
  }),

  handleEvent: (event, state, socket) => {
    if (event.type === 'phx:upload') {
      // Handle uploaded files
      return { uploads: [...state.uploads, ...event.value.files] };
    }
    return state;
  },

  render: (state) => `
    <form phx-submit="save">
      <input type="file" name="avatar" phx-hook="FileUpload" multiple />
      <ul>
        ${state.uploads.map(f => `<li>${f.name}</li>`).join('')}
      </ul>
      <button type="submit">Upload</button>
    </form>
  `,
});
```

## PubSub

Real-time broadcasting between views:

```typescript
import { createMemoryPubSub } from 'philjs-liveview/server';

const pubsub = createMemoryPubSub();

// In a LiveView
const ChatView = createLiveView({
  mount: (socket) => {
    // Subscribe to chat messages
    const unsubscribe = pubsub.subscribe('chat:lobby', (event, payload) => {
      socket.assign({ messages: [...socket.state.messages, payload] });
    });

    socket.onLeave = () => unsubscribe();

    return { messages: [] };
  },

  handleEvent: (event, state, socket) => {
    if (event.type === 'send_message') {
      // Broadcast to all subscribers
      pubsub.broadcast('chat:lobby', 'new_message', {
        text: event.value.text,
        user: socket.session.user,
      });
    }
    return state;
  },

  render: (state) => `
    <div class="chat">
      <ul>
        ${state.messages.map(m => `<li>${m.user}: ${m.text}</li>`).join('')}
      </ul>
      <form phx-submit="send_message">
        <input name="text" />
        <button type="submit">Send</button>
      </form>
    </div>
  `,
});
```

## Built-in Hooks

- **InfiniteScroll** - Load more content on scroll
- **Focus** - Focus element on mount/update
- **Clipboard** - Copy to clipboard
- **LocalTime** - Convert UTC to local time
- **Sortable** - Drag and drop sorting
- **Debounce** - Debounce input events
- **Countdown** - Countdown timer

## Template Helpers

```typescript
import { html, raw, when, each, input, errorTag } from 'philjs-liveview';

const render = (state) => html`
  <div>
    ${when(state.loading, '<div class="spinner"></div>')}

    ${each(
      state.items,
      (item) => item.id,
      (item) => html`<li>${item.name}</li>`
    )}

    ${input('email', { type: 'email', value: state.email, required: true })}
    ${errorTag(state.errors, 'email')}

    ${raw('<script>alert("trusted")</script>')}
  </div>
`;
```

## Comparison with Similar Frameworks

| Feature | PhilJS LiveView | Phoenix LiveView | Laravel Livewire | Dioxus LiveView |
|---------|-----------------|------------------|------------------|-----------------|
| Language | TypeScript | Elixir | PHP | Rust |
| DOM Diffing | morphdom-style | morphdom | morphdom | Virtual DOM |
| Components | Yes | Yes | Yes | Yes |
| Hooks | Yes | Yes | Yes | N/A |
| File Upload | Yes | Yes | Yes | Planned |
| SSR | Yes | Yes | Yes | Yes |

## License

MIT
