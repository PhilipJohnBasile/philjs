# Client-Side LiveView

This document covers the client-side implementation of `@philjs/liveview`, including the WebSocket connection, event handling, hooks system, and client-side navigation.

## Overview

The LiveView client runtime handles:

- WebSocket connection to the server
- DOM patching with efficient diffing
- Event binding (`phx-click`, `phx-change`, etc.)
- Client-side hooks lifecycle
- Form handling and file uploads
- Navigation without full page reloads

## Quick Start

### Automatic Initialization

The simplest way to connect a LiveView is using `initLiveView`:

```typescript
import { initLiveView } from '@philjs/liveview/client';

// Automatically finds container with data-phx-main attribute
const client = initLiveView({
  debug: true,  // Enable console logging
});
```

### Required HTML Structure

```html
<!DOCTYPE html>
<html>
<head>
  <meta name="csrf-token" content="your-csrf-token">
</head>
<body>
  <div
    data-phx-main
    data-phx-view="my-view"
    data-phx-session="encoded-session-token"
    data-phx-static="encoded-static-token"
  >
    <!-- Server-rendered content -->
  </div>
</body>
</html>
```

### Manual Initialization

For more control, create the client manually:

```typescript
import { createLiveViewClient } from '@philjs/liveview/client';

const client = createLiveViewClient({
  url: 'wss://example.com/live/websocket',
  csrfToken: document.querySelector('meta[name="csrf-token"]')?.content,
  debug: true,
  params: {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  reconnect: {
    maxAttempts: 10,
    initialDelay: 1000,
    maxDelay: 30000,
  },
});

// Connect to a specific container
client.connect('#my-live-view');

// Or connect to an element directly
const container = document.getElementById('live-view');
client.connect(container);
```

## LiveViewClient API

### Constructor Options

```typescript
interface LiveViewClientOptions {
  /** WebSocket URL */
  url: string;

  /** CSRF token for request verification */
  csrfToken?: string;

  /** Enable debug logging */
  debug?: boolean;

  /** Custom params sent on connect */
  params?: Record<string, any>;

  /** Reconnection configuration */
  reconnect?: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
  };
}
```

### Methods

#### connect()

Connect to a LiveView container:

```typescript
client.connect('#my-container');
// or
client.connect(document.getElementById('container'));
```

#### disconnect()

Cleanly disconnect from the server:

```typescript
client.disconnect();
```

#### pushEvent()

Push an event to the server:

```typescript
// Simple event
client.pushEvent('increment', { amount: 1 });

// Event with target (for components)
client.pushEvent('close', {}, '#modal');
```

#### pushEventTo()

Push an event to a specific component:

```typescript
client.pushEventTo('#user-card-123', 'refresh', { force: true });
```

#### handleEvent()

Register a handler for server-pushed events:

```typescript
client.handleEvent('notification', (payload) => {
  showToast(payload.message, payload.type);
});

client.handleEvent('scroll_to', (payload) => {
  document.getElementById(payload.target)?.scrollIntoView();
});

client.handleEvent('focus', (payload) => {
  document.querySelector(payload.selector)?.focus();
});
```

#### registerHooks()

Register custom client-side hooks:

```typescript
client.registerHooks({
  MyHook: {
    mounted() {
      console.log('Element mounted:', this.el);
    },
  },
});
```

## SocketConnection

The `SocketConnection` class manages the WebSocket connection to the server.

### Configuration

```typescript
import { SocketConnection } from '@philjs/liveview';

const socket = new SocketConnection({
  url: 'wss://example.com/live/websocket',
  params: {
    _csrf_token: csrfToken,
    user_agent: navigator.userAgent,
  },
  heartbeatIntervalMs: 30000,  // Default: 30 seconds
  timeout: 10000,              // Default: 10 seconds
  reconnectAfterMs: (tries) => {
    // Exponential backoff
    return [1000, 2000, 5000, 10000][Math.min(tries, 3)];
  },
  onOpen: () => console.log('Connected'),
  onClose: () => console.log('Disconnected'),
  onError: (error) => console.error('Error:', error),
});
```

### Connection Methods

```typescript
// Connect to server
socket.connect();

// Disconnect
socket.disconnect();

// Check connection status
if (socket.isConnected) {
  // ...
}
```

### Channel Management

```typescript
// Get or create a channel
const channel = socket.channel('lv:my-view:session-123');

// Join a channel
const response = await socket.join('lv:my-view:session-123', {
  url: window.location.href,
  params: {},
  session: sessionToken,
  static: staticToken,
});

// Leave a channel
socket.leave('lv:my-view:session-123');

// Push message to channel
socket.push('lv:my-view:session-123', 'event', { type: 'click', value: 42 });

// Push with reply
const reply = await socket.pushWithReply('lv:my-view:session-123', 'event', payload);
```

### Channel State

```typescript
interface Channel {
  topic: string;
  state: 'closed' | 'joining' | 'joined' | 'leaving' | 'errored';
  joinRef: number;
  onMessage: (message: any) => void;
  onClose: () => void;
  onError: (error: Error) => void;
}
```

## Event Serialization

LiveView automatically serializes DOM events for transmission to the server.

### Standard Event Serialization

```typescript
import { serializeEvent } from '@philjs/liveview';

const event = serializeEvent('click', buttonElement);
// { type: 'click', target: 'button-id', value: undefined }

const formEvent = serializeEvent('submit', formElement);
// { type: 'submit', target: 'form-id', value: { field1: 'value1', ... } }

const inputEvent = serializeEvent('change', inputElement);
// { type: 'change', target: 'input-id', value: 'input value' }
```

### Keyboard Event Serialization

```typescript
import { serializeKeyEvent } from '@philjs/liveview';

const keyEvent = serializeKeyEvent('keydown', keyboardEvent, inputElement);
// {
//   type: 'keydown',
//   target: 'input-id',
//   key: 'Enter',
//   keyCode: 13,
//   meta: {
//     altKey: false,
//     ctrlKey: false,
//     metaKey: false,
//     shiftKey: false,
//   }
// }
```

## PHX Event Bindings

The client automatically binds handlers to elements with `phx-*` attributes.

### Click Events

```html
<button phx-click="increment">+1</button>

<!-- With values -->
<button phx-click="select" phx-value-id="123" phx-value-type="product">
  Select
</button>

<!-- Disable during processing -->
<button phx-click="save" phx-disable-with="Saving...">Save</button>
```

### Form Events

```html
<!-- Submit event -->
<form phx-submit="create_user">
  <input name="email" type="email" required />
  <button type="submit">Create</button>
</form>

<!-- Change event (live validation) -->
<form phx-change="validate">
  <input name="email" phx-debounce="300" />
</form>

<!-- Combined -->
<form phx-submit="save" phx-change="validate">
  <input name="title" phx-debounce="blur" />
  <button type="submit">Save</button>
</form>
```

### Focus Events

```html
<input phx-blur="validate_field" name="email" />
<input phx-focus="show_help" name="password" />
```

### Keyboard Events

```html
<!-- Any key -->
<input phx-keydown="handle_key" />

<!-- Specific key -->
<input phx-keydown="submit" phx-keydown-key="Enter" />
<input phx-keyup="cancel" phx-keyup-key="Escape" />
```

### Window Events

```html
<div phx-window-scroll="handle_scroll"></div>
```

### Event Modifiers

```html
<!-- Debounce input (wait for typing to stop) -->
<input phx-change="search" phx-debounce="300" />

<!-- Debounce on blur (validate when leaving field) -->
<input phx-change="validate" phx-debounce="blur" />

<!-- Target specific component -->
<button phx-click="close" phx-target="#modal">Close</button>

<!-- Target closest component -->
<button phx-click="refresh" phx-target="closest .component">Refresh</button>
```

## Client-Side Hooks

Hooks provide client-side JavaScript interop for elements that need custom behavior beyond PHX bindings.

### Defining Hooks

```typescript
import { registerHooks } from '@philjs/liveview/client';

registerHooks({
  // Chart integration
  ChartHook: {
    mounted() {
      const data = JSON.parse(this.el.dataset.chartData);
      this.chart = new Chart(this.el, { data });
    },

    updated() {
      const newData = JSON.parse(this.el.dataset.chartData);
      this.chart.update(newData);
    },

    destroyed() {
      this.chart.destroy();
    },
  },

  // Map integration
  MapHook: {
    mounted() {
      this.map = new mapboxgl.Map({
        container: this.el,
        center: [this.el.dataset.lng, this.el.dataset.lat],
        zoom: 12,
      });

      this.map.on('click', (e) => {
        this.pushEvent('map_click', {
          lat: e.lngLat.lat,
          lng: e.lngLat.lng,
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

    destroyed() {
      this.map.remove();
    },
  },
});
```

### Using Hooks in HTML

```html
<div
  id="my-chart"
  phx-hook="ChartHook"
  data-chart-data='{"labels":["Jan","Feb","Mar"],"values":[10,20,15]}'
></div>

<div
  id="my-map"
  phx-hook="MapHook"
  data-lat="40.7128"
  data-lng="-74.0060"
></div>
```

### Hook Lifecycle Methods

| Method | When Called |
|--------|-------------|
| `mounted()` | Element is added to the DOM |
| `beforeUpdate()` | Before the element is updated by a diff |
| `updated()` | After the element is updated |
| `beforeDestroy()` | Before the element is removed |
| `destroyed()` | After the element is removed |
| `disconnected()` | Socket connection lost |
| `reconnected()` | Socket connection restored |

### Hook Context

Within hook methods, `this` provides access to:

```typescript
interface HookContext {
  /** The DOM element */
  el: HTMLElement;

  /** Push event to server */
  pushEvent(event: string, payload: any, target?: string): void;

  /** Push event to specific component */
  pushEventTo(selector: string, event: string, payload: any): void;

  /** Register handler for server events */
  handleEvent(event: string, callback: (payload: any) => void): void;

  /** Upload files */
  upload(name: string, files: FileList): void;
}
```

### Hook Examples

#### Video Player Hook

```typescript
registerHooks({
  VideoPlayer: {
    mounted() {
      this.player = new VideoPlayer(this.el);

      this.player.on('play', () => {
        this.pushEvent('video_play', { time: this.player.currentTime });
      });

      this.player.on('ended', () => {
        this.pushEvent('video_ended', {});
      });

      this.handleEvent('seek', ({ time }) => {
        this.player.seek(time);
      });

      this.handleEvent('set_quality', ({ quality }) => {
        this.player.setQuality(quality);
      });
    },

    destroyed() {
      this.player.destroy();
    },
  },
});
```

#### Autocomplete Hook

```typescript
registerHooks({
  Autocomplete: {
    mounted() {
      this.input = this.el.querySelector('input');
      this.dropdown = this.el.querySelector('.dropdown');

      this.input.addEventListener('input', (e) => {
        this.pushEvent('search', { query: e.target.value });
      });

      this.handleEvent('suggestions', ({ items }) => {
        this.renderSuggestions(items);
      });
    },

    renderSuggestions(items) {
      this.dropdown.innerHTML = items
        .map((item) => `<li data-value="${item.id}">${item.name}</li>`)
        .join('');

      this.dropdown.querySelectorAll('li').forEach((li) => {
        li.addEventListener('click', () => {
          this.pushEvent('select', { id: li.dataset.value });
        });
      });
    },
  },
});
```

### Built-in Hooks

LiveView includes several built-in hooks:

#### InfiniteScroll

Triggers load-more events when scrolling near the bottom:

```html
<div id="posts">
  ${posts.map(post => `<article>${post.content}</article>`).join('')}

  <div phx-hook="InfiniteScroll" phx-load-more="load_more_posts">
    Loading more...
  </div>
</div>
```

#### Focus

Automatically focuses element on mount and update:

```html
<input phx-hook="Focus" name="search" placeholder="Search..." />
```

#### Clipboard

Copy text to clipboard on click:

```html
<!-- Copy static text -->
<button phx-hook="Clipboard" data-clipboard-text="Hello World">
  Copy
</button>

<!-- Copy from another element -->
<input id="code" value="ABC123" readonly />
<button phx-hook="Clipboard" data-clipboard-target="#code">
  Copy Code
</button>
```

#### LocalTime

Converts UTC timestamps to local time:

```html
<time
  phx-hook="LocalTime"
  data-utc="2024-01-15T10:30:00Z"
  data-format="datetime"
>
  2024-01-15T10:30:00Z
</time>

<!-- Format options: 'date', 'time', 'datetime', 'relative' -->
<time phx-hook="LocalTime" data-utc="${timestamp}" data-format="relative">
  Loading...
</time>
```

#### Sortable

Drag and drop sorting:

```html
<ul phx-hook="Sortable" phx-sortable-group="todos">
  <li phx-sortable-item phx-sortable-id="1">Item 1</li>
  <li phx-sortable-item phx-sortable-id="2">Item 2</li>
  <li phx-sortable-item phx-sortable-id="3">Item 3</li>
</ul>
```

Server handler:

```typescript
handleEvent: (event, state) => {
  if (event.type === 'reorder') {
    const { from, to, id, group } = event.value;
    // Reorder items in state
  }
  return state;
}
```

#### Debounce

Adds debounce to any input:

```html
<input
  phx-hook="Debounce"
  phx-debounce-delay="500"
  phx-change="search"
/>
```

#### Countdown

Displays countdown timer:

```html
<div
  phx-hook="Countdown"
  data-countdown-to="2024-12-31T23:59:59Z"
>
  Loading...
</div>
```

Triggers `countdown:complete` event when finished.

## Navigation

LiveView supports two types of navigation without full page reloads.

### Live Patch

Navigates while preserving the WebSocket connection. The server's `handleParams` is called:

```typescript
import { livePatch } from '@philjs/liveview/client';

// Navigate to new URL
livePatch('/products?category=shoes');

// Replace current history entry
livePatch('/products?page=2', { replace: true });
```

In templates:

```html
<a href="/products/123" phx-link="patch">View Product</a>
<a href="/search?q=test" phx-link="patch" phx-link-replace>Search</a>
```

### Live Redirect

Full navigation that closes the current socket and opens a new one:

```typescript
import { liveRedirect } from '@philjs/liveview/client';

liveRedirect('/checkout');
liveRedirect('/login', { replace: true });
```

In templates:

```html
<a href="/dashboard" phx-link="redirect">Go to Dashboard</a>
```

### Navigation State

```typescript
import { getNavigation, onNavigate } from '@philjs/liveview';

// Get current navigation state
const nav = getNavigation();
// { path: '/products', params: URLSearchParams, mode: 'push' }

// Subscribe to navigation events
const unsubscribe = onNavigate((event) => {
  console.log('Navigation:', event.type, event.to);
  // event.type: 'patch' | 'redirect' | 'popstate'
});

// Cleanup
unsubscribe();
```

### URL Helpers

```typescript
import { parseUrl, buildUrl, updateParams } from '@philjs/liveview';

// Parse URL
const { path, params, hash } = parseUrl('/products?category=shoes#section');

// Build URL
const url = buildUrl('/products', {
  category: 'shoes',
  colors: ['red', 'blue'],
});
// "/products?category=shoes&colors=red&colors=blue"

// Update current params
const newUrl = updateParams({ page: '2', sort: 'price' });
```

### Scroll Management

```typescript
import {
  saveScrollPosition,
  restoreScrollPosition,
  scrollToTarget,
} from '@philjs/liveview';

// Save position before navigation
saveScrollPosition();

// Restore after navigation
restoreScrollPosition();

// Scroll to specific element
scrollToTarget('#section-2');

// Scroll to top
scrollToTarget();
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

Loading automatically adds/removes `phx-loading` class to body.

### Page Title

```typescript
import { setPageTitle } from '@philjs/liveview';

// Simple title
setPageTitle('My Page');

// With prefix/suffix
setPageTitle('Products', 'MyApp', '(3 items)');
// Result: "MyApp | Products | (3 items)"
```

## DOM Diffing and Patching

The client applies DOM patches received from the server efficiently.

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

### Manual Patching

```typescript
import { applyPatches } from '@philjs/liveview';

const patches = [
  { type: 'update_attr', target: '#title', attr: 'class', value: 'active' },
  { type: 'replace', target: '#content', html: '<p>New content</p>' },
  { type: 'remove', target: '#old-element' },
];

applyPatches(containerElement, patches);
```

### Keys for Efficient Updates

Use `phx-key` for efficient list diffing:

```html
<ul>
  ${items.map(item => `
    <li phx-key="${item.id}">
      <span>${item.name}</span>
      <button phx-click="delete" phx-value-id="${item.id}">Delete</button>
    </li>
  `).join('')}
</ul>
```

## File Uploads

### HTML Setup

```html
<form phx-submit="upload" phx-change="validate_upload">
  <input
    type="file"
    name="avatar"
    phx-hook="UploadHook"
    accept="image/*"
    multiple
  />
  <button type="submit">Upload</button>
</form>
```

### Upload Hook

```typescript
registerHooks({
  UploadHook: {
    mounted() {
      this.el.addEventListener('change', (e) => {
        this.upload('avatar', e.target.files);
      });
    },
  },
});
```

### Server Handling

```typescript
handleEvent: (event, state) => {
  if (event.type === 'phx:upload') {
    const { name, files } = event.value;
    // files: [{ name, size, type }, ...]
    return { ...state, uploading: true };
  }
  return state;
}
```

## Error Handling

### Connection Errors

```typescript
const client = createLiveViewClient({
  // ...
  reconnect: {
    maxAttempts: 10,
    initialDelay: 1000,
    maxDelay: 30000,
  },
});

// Hooks are notified of disconnection
registerHooks({
  MyHook: {
    disconnected() {
      this.el.classList.add('offline');
      showOfflineBanner();
    },

    reconnected() {
      this.el.classList.remove('offline');
      hideOfflineBanner();
    },
  },
});
```

### Server Errors

Handle server-pushed error events:

```typescript
client.handleEvent('error', (payload) => {
  showErrorToast(payload.message);
});

client.handleEvent('validation_error', (payload) => {
  highlightField(payload.field, payload.message);
});
```

## Debugging

Enable debug mode for detailed logging:

```typescript
const client = initLiveView({ debug: true });
```

This logs:

- Connection events (connect, disconnect, reconnect)
- Channel join/leave
- Events sent/received
- DOM patches applied
- Navigation events

## Best Practices

### 1. Use Debouncing for Frequent Events

```html
<input phx-change="search" phx-debounce="300" />
```

### 2. Clean Up in destroyed()

```typescript
registerHooks({
  MyHook: {
    mounted() {
      this.timer = setInterval(() => {}, 1000);
      this.handler = (e) => {};
      window.addEventListener('resize', this.handler);
    },

    destroyed() {
      clearInterval(this.timer);
      window.removeEventListener('resize', this.handler);
    },
  },
});
```

### 3. Handle Disconnection Gracefully

```typescript
registerHooks({
  FormHook: {
    mounted() {
      this.unsavedChanges = false;
    },

    disconnected() {
      if (this.unsavedChanges) {
        this.showSaveWarning();
      }
    },
  },
});
```

### 4. Use Keys for Dynamic Lists

```html
<ul>
  ${items.map(item => `<li phx-key="${item.id}">${item.name}</li>`).join('')}
</ul>
```

### 5. Prefer Server State

Keep most state on the server. Use hooks only for client-specific behavior that cannot be handled server-side.
