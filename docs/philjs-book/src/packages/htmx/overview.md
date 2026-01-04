# @philjs/htmx

HTMX compatibility layer for PhilJS, enabling HTML-first development with HTMX-style `hx-*` attributes and PhilJS reactivity integration.

## Introduction

`@philjs/htmx` provides a complete HTMX-compatible layer that allows you to use declarative HTML attributes for AJAX requests, DOM updates, and dynamic interactions without writing JavaScript. It seamlessly integrates with PhilJS reactivity for progressive enhancement.

### Key Features

- **HTMX Attribute Support**: Full support for `hx-get`, `hx-post`, `hx-put`, `hx-patch`, `hx-delete`
- **Flexible Targeting**: Update any element with `hx-target` and various swap strategies
- **Advanced Triggers**: Event-based, polling, intersection-based, and modified triggers
- **Extensions System**: Extensible architecture with built-in extensions
- **Server-Side Helpers**: Utilities for building HTMX-compatible server responses
- **PhilJS Integration**: Works seamlessly with PhilJS signals and reactivity

## Installation

```bash
npm install @philjs/htmx
```

## Quick Start

### HTML-First Approach

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { initHTMX, injectStyles } from '@philjs/htmx';

    // Initialize HTMX processing
    initHTMX();
    injectStyles();
  </script>
</head>
<body>
  <!-- Click to load users -->
  <button hx-get="/api/users" hx-target="#user-list" hx-swap="innerHTML">
    Load Users
  </button>

  <div id="user-list"></div>
</body>
</html>
```

### TypeScript Integration

```typescript
import { initHTMX, htmx, injectStyles } from '@philjs/htmx';

// Initialize with custom configuration
initHTMX({
  defaultSwapStyle: 'innerHTML',
  timeout: 5000,
  debug: true,
  onError: (error) => console.error('HTMX Error:', error),
});

injectStyles();

// Programmatic AJAX request
htmx.ajax('GET', '/api/users', {
  target: '#user-list',
  swap: 'innerHTML',
});
```

---

## HTML Attributes

### HTTP Method Attributes

These attributes specify the HTTP method and URL for AJAX requests.

#### hx-get

Makes a GET request to the specified URL.

```html
<!-- Load content on click -->
<button hx-get="/api/data">Load Data</button>

<!-- Load with specific target -->
<button hx-get="/api/users" hx-target="#users">Load Users</button>
```

#### hx-post

Makes a POST request, typically for form submissions.

```html
<!-- Submit form data -->
<form hx-post="/api/users" hx-target="#result">
  <input name="name" placeholder="Name" />
  <input name="email" placeholder="Email" />
  <button type="submit">Create User</button>
</form>

<!-- Button with values -->
<button hx-post="/api/like" hx-vals='{"postId": "123"}'>
  Like Post
</button>
```

#### hx-put

Makes a PUT request for updating resources.

```html
<form hx-put="/api/users/123" hx-target="#user-details">
  <input name="name" value="Updated Name" />
  <button type="submit">Update</button>
</form>
```

#### hx-patch

Makes a PATCH request for partial updates.

```html
<button hx-patch="/api/users/123/status" hx-vals='{"status": "active"}'>
  Activate User
</button>
```

#### hx-delete

Makes a DELETE request for removing resources.

```html
<button hx-delete="/api/users/123" hx-target="#user-row" hx-swap="outerHTML">
  Delete User
</button>
```

---

### Targeting and Swapping

#### hx-target

Specifies which element should receive the response content.

```html
<!-- Target by ID -->
<button hx-get="/api/content" hx-target="#content-area">
  Load Content
</button>

<!-- Target self (default) -->
<div hx-get="/api/status" hx-target="this">
  Click to refresh
</div>

<!-- Target using CSS selector -->
<button hx-get="/api/sidebar" hx-target=".sidebar-content">
  Refresh Sidebar
</button>

<!-- Target parent -->
<button hx-get="/api/item" hx-target="closest .card">
  Update Card
</button>
```

#### hx-swap

Controls how the response content is inserted into the target.

| Value | Description |
|-------|-------------|
| `innerHTML` | Replace inner content (default) |
| `outerHTML` | Replace entire element |
| `beforebegin` | Insert before the element |
| `afterbegin` | Insert at the start of element |
| `beforeend` | Insert at the end of element |
| `afterend` | Insert after the element |
| `delete` | Remove the target element |
| `none` | No DOM update |

```html
<!-- Replace inner content (default) -->
<div hx-get="/api/content" hx-swap="innerHTML">
  Content here
</div>

<!-- Replace entire element -->
<div hx-get="/api/new-element" hx-swap="outerHTML">
  Will be replaced
</div>

<!-- Append to list -->
<ul id="messages">
  <button hx-get="/api/more-messages" hx-target="#messages" hx-swap="beforeend">
    Load More
  </button>
</ul>

<!-- Prepend new items -->
<button hx-get="/api/notification" hx-target="#notifications" hx-swap="afterbegin">
  Check Notifications
</button>

<!-- Delete after action -->
<button hx-delete="/api/items/123" hx-target="closest .item" hx-swap="delete">
  Remove
</button>

<!-- Silent action (no DOM update) -->
<button hx-post="/api/track" hx-swap="none">
  Track Click
</button>
```

#### hx-select

Select a portion of the response to swap.

```html
<!-- Only swap the #results portion of the response -->
<button hx-get="/search?q=test" hx-target="#results" hx-select="#results">
  Search
</button>
```

---

### Request Data

#### hx-vals

Include additional values in the request as JSON.

```html
<!-- Static values -->
<button hx-post="/api/action" hx-vals='{"action": "approve", "id": 123}'>
  Approve
</button>

<!-- With form data -->
<form hx-post="/api/submit" hx-vals='{"source": "web", "version": "2.0"}'>
  <input name="message" />
  <button type="submit">Submit</button>
</form>
```

#### hx-headers

Include custom HTTP headers with the request.

```html
<!-- Add authorization header -->
<button hx-get="/api/protected" hx-headers='{"Authorization": "Bearer token123"}'>
  Access Protected
</button>

<!-- Custom content type -->
<button hx-post="/api/json" hx-headers='{"Content-Type": "application/json"}'>
  Send JSON
</button>
```

#### hx-include

Include values from other elements in the request.

```html
<!-- Include values from a form -->
<form id="search-form">
  <input name="query" placeholder="Search..." />
  <input name="category" placeholder="Category" />
</form>

<button hx-get="/api/search" hx-include="#search-form" hx-target="#results">
  Search
</button>

<!-- Include specific input -->
<input id="filter-input" name="filter" />
<button hx-get="/api/data" hx-include="#filter-input">
  Apply Filter
</button>
```

---

### Navigation and History

#### hx-push-url

Update the browser URL after a successful request.

```html
<!-- Push the request URL -->
<a hx-get="/page/about" hx-push-url="true" hx-target="#main">
  About
</a>

<!-- Push a custom URL -->
<button hx-get="/api/search?q=test" hx-push-url="/search/test" hx-target="#results">
  Search
</button>
```

---

### Loading Indicators

#### hx-indicator

Show a loading indicator during requests.

```html
<!-- Show spinner during request -->
<button hx-get="/api/slow" hx-indicator="#spinner">
  Load Slow Data
</button>
<span id="spinner" class="htmx-indicator">Loading...</span>

<!-- Multiple indicators -->
<div>
  <button hx-post="/api/save" hx-indicator=".save-indicator">
    Save
  </button>
  <span class="save-indicator htmx-indicator">Saving...</span>
</div>
```

The default CSS classes for indicators:

```css
.htmx-indicator {
  opacity: 0;
  transition: opacity 200ms ease-in;
}

.htmx-request .htmx-indicator {
  opacity: 1;
}

.htmx-request.htmx-indicator {
  opacity: 1;
}
```

Use `injectStyles()` to automatically inject these styles:

```typescript
import { injectStyles } from '@philjs/htmx';
injectStyles();
```

---

## Triggers

### Basic Events

The `hx-trigger` attribute specifies what event triggers the request.

```html
<!-- Click (default for buttons) -->
<button hx-get="/api/data" hx-trigger="click">Click Me</button>

<!-- Change (default for inputs) -->
<input hx-get="/api/search" hx-trigger="change" hx-target="#results" />

<!-- Submit (default for forms) -->
<form hx-post="/api/submit" hx-trigger="submit">
  <button type="submit">Submit</button>
</form>

<!-- Input event for real-time -->
<input hx-get="/api/autocomplete" hx-trigger="input" hx-target="#suggestions" />

<!-- Focus/blur events -->
<input hx-get="/api/validate" hx-trigger="blur" />

<!-- Keyboard events -->
<input hx-get="/api/search" hx-trigger="keyup" hx-target="#results" />
```

### Special Triggers

#### load

Trigger immediately when the element is loaded.

```html
<!-- Load content on page load -->
<div hx-get="/api/initial-data" hx-trigger="load">
  Loading...
</div>
```

#### revealed

Trigger when the element scrolls into view.

```html
<!-- Lazy load when visible -->
<img hx-get="/api/image/123" hx-trigger="revealed" hx-swap="outerHTML" />

<!-- Infinite scroll -->
<div hx-get="/api/more-content" hx-trigger="revealed" hx-swap="afterend">
  Load more when visible
</div>
```

#### intersect

Trigger based on intersection observer (similar to revealed).

```html
<div hx-get="/api/analytics" hx-trigger="intersect" hx-swap="none">
  Track when visible
</div>
```

#### every (Polling)

Trigger at regular intervals for polling.

```html
<!-- Poll every 5 seconds -->
<div hx-get="/api/status" hx-trigger="every 5s">
  Status: Unknown
</div>

<!-- Poll every 500 milliseconds -->
<div hx-get="/api/live-data" hx-trigger="every 500ms">
  Live data here
</div>

<!-- Poll every 30 seconds -->
<div hx-get="/api/notifications" hx-trigger="every 30s" hx-target="#notification-count">
  0
</div>
```

### Trigger Modifiers

#### once

Only trigger once.

```html
<button hx-get="/api/welcome" hx-trigger="click once">
  Show Welcome (only once)
</button>

<div hx-get="/api/analytics" hx-trigger="revealed once" hx-swap="none">
  Track first view
</div>
```

#### changed

Only trigger if the value has changed.

```html
<input hx-get="/api/search" hx-trigger="keyup changed" hx-target="#results" />
```

#### delay

Wait before triggering (debounce).

```html
<!-- Wait 500ms after last keyup -->
<input
  hx-get="/api/search"
  hx-trigger="keyup delay:500ms"
  hx-target="#results"
  placeholder="Search..."
/>

<!-- Wait 1 second after input stops -->
<textarea
  hx-post="/api/autosave"
  hx-trigger="input delay:1000ms"
  hx-swap="none"
></textarea>
```

#### throttle

Limit trigger frequency.

```html
<!-- At most once per 500ms -->
<input
  hx-get="/api/validate"
  hx-trigger="input throttle:500ms"
  hx-target="#validation"
/>

<!-- Throttle scroll events -->
<div
  hx-get="/api/scroll-position"
  hx-trigger="scroll throttle:200ms"
  hx-swap="none"
></div>
```

#### from

Listen for events from another element.

```html
<div hx-get="/api/update" hx-trigger="click from:#external-button">
  Updated by external button
</div>

<button id="external-button">Update Content</button>
```

#### target

Specify a CSS filter for the event target.

```html
<table hx-get="/api/row-action" hx-trigger="click target:tr">
  <tr><td>Row 1</td></tr>
  <tr><td>Row 2</td></tr>
</table>
```

#### consume

Stop event propagation.

```html
<button hx-post="/api/action" hx-trigger="click consume">
  Action (stops propagation)
</button>
```

### Combining Modifiers

```html
<!-- Debounced search with change detection -->
<input
  hx-get="/api/search"
  hx-trigger="keyup changed delay:300ms"
  hx-target="#results"
  placeholder="Type to search..."
/>

<!-- One-time lazy load -->
<div
  hx-get="/api/heavy-content"
  hx-trigger="revealed once"
>
  Loading...
</div>
```

---

## Configuration

### HTMXConfig Options

```typescript
import { initHTMX } from '@philjs/htmx';

initHTMX({
  // Default swap style for all requests
  defaultSwapStyle: 'innerHTML', // 'innerHTML' | 'outerHTML' | etc.

  // Default delay before swap (ms)
  defaultSwapDelay: 0,

  // Settle delay for CSS transitions (ms)
  defaultSettleDelay: 20,

  // Enable browser history integration
  historyEnabled: true,

  // Request timeout in milliseconds (0 = no timeout)
  timeout: 0,

  // Include credentials in requests
  withCredentials: false,

  // CSS class for loading indicators
  indicatorClass: 'htmx-indicator',

  // CSS class added during request
  requestClass: 'htmx-request',

  // Scroll behavior for navigation
  scrollBehavior: 'smooth', // 'smooth' | 'auto'

  // Enable debug logging
  debug: false,

  // Global error handler
  onError: (error) => {
    console.error('HTMX Error:', error.type, error.message);
  },

  // Before request hook (return false to cancel)
  onBeforeRequest: (event) => {
    console.log('Request to:', event.path);
    return true; // Allow request
  },

  // After request hook
  onAfterRequest: (event) => {
    console.log('Response received:', event.successful);
  },

  // Before swap hook (return false to cancel)
  onBeforeSwap: (event) => {
    console.log('Swapping:', event.swapStyle);
    return true; // Allow swap
  },

  // After swap hook
  onAfterSwap: (event) => {
    console.log('Swap complete');
  },
});
```

### Runtime Configuration

```typescript
import { htmx } from '@philjs/htmx';

// Update configuration at runtime
htmx.config({
  debug: true,
  timeout: 10000,
});
```

### Event Types

```typescript
interface HTMXError {
  type: 'network' | 'timeout' | 'abort' | 'parse' | 'swap';
  message: string;
  element?: Element;
  xhr?: Response;
}

interface HTMXRequestEvent {
  element: Element;
  target: Element;
  verb: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  headers: Record<string, string>;
  parameters: Record<string, string>;
}

interface HTMXResponseEvent {
  element: Element;
  target: Element;
  xhr: Response;
  successful: boolean;
  html: string;
}

interface HTMXSwapEvent {
  element: Element;
  target: Element;
  html: string;
  swapStyle: SwapStyle;
}
```

---

## Programmatic API

The `htmx` object provides programmatic access to HTMX functionality.

### htmx.ajax()

Make AJAX requests programmatically.

```typescript
import { htmx } from '@philjs/htmx';

// Simple GET request
await htmx.ajax('GET', '/api/users', {
  target: '#user-list',
});

// POST with values
await htmx.ajax('POST', '/api/users', {
  target: '#result',
  values: {
    name: 'John Doe',
    email: 'john@example.com',
  },
});

// Full options
await htmx.ajax('PUT', '/api/users/123', {
  target: '#user-details',
  swap: 'outerHTML',
  values: { name: 'Updated Name' },
  headers: { 'X-Custom-Header': 'value' },
  select: '.user-card', // Only swap this part of response
  indicator: '#loading-spinner',
});
```

### htmx.process()

Process HTMX attributes on dynamically added elements.

```typescript
import { htmx } from '@philjs/htmx';

// Add new HTML with HTMX attributes
container.innerHTML = `
  <button hx-get="/api/data" hx-target="#result">
    Load Data
  </button>
`;

// Process the new elements
htmx.process(container);
```

### htmx.trigger()

Trigger custom events on elements.

```typescript
import { htmx } from '@philjs/htmx';

// Trigger event by selector
htmx.trigger('#my-element', 'custom-event', { data: 'value' });

// Trigger event on element
const element = document.getElementById('my-element');
htmx.trigger(element, 'refresh');
```

### htmx.refresh()

Re-issue the HTMX request for an element.

```typescript
import { htmx } from '@philjs/htmx';

// Refresh element with hx-get/post/etc.
const element = document.querySelector('[hx-get="/api/data"]');
htmx.refresh(element);
```

### Utility Methods

```typescript
import { htmx } from '@philjs/htmx';

// Find elements with HTMX attributes
const buttons = htmx.find('[hx-get]');

// Class manipulation
htmx.addClass(element, 'active');
htmx.removeClass(element, 'loading');
htmx.toggleClass(element, 'expanded');

// Remove with animation
htmx.remove(element, 300); // 300ms swap delay

// Find closest ancestor
const card = htmx.closest(element, '.card');
```

---

## Extensions System

### Defining Extensions

```typescript
import { defineExtension, removeExtension } from '@philjs/htmx';

// Define a custom extension
defineExtension({
  name: 'my-extension',

  // Handle HTMX events
  onEvent: (name, event) => {
    if (name === 'htmx:beforeRequest') {
      console.log('Request starting...');
    }
    return true; // Continue processing
  },

  // Transform response before swap
  transformResponse: (text, xhr, element) => {
    // Modify response HTML
    return text.replace(/old/g, 'new');
  },

  // Check if swap style is inline
  isInlineSwap: (swapStyle) => {
    return swapStyle === 'my-custom-swap';
  },

  // Handle custom swap styles
  handleSwap: (swapStyle, target, fragment) => {
    if (swapStyle === 'my-custom-swap') {
      // Custom swap logic
      target.appendChild(fragment);
      return true; // Handled
    }
    return false; // Use default handling
  },

  // Custom parameter encoding
  encodeParameters: (xhr, parameters, element) => {
    return JSON.stringify(parameters);
  },
});

// Remove an extension
removeExtension('my-extension');
```

### Built-in Extensions

#### json-enc

Encodes parameters as JSON for requests.

```typescript
// Already registered by default
defineExtension({
  name: 'json-enc',
  encodeParameters: (xhr, parameters, element) => {
    return JSON.stringify(parameters);
  },
});
```

#### class-tools

Provides `hx-classes` attribute for class manipulation after swap.

```html
<!-- Add/remove classes after swap -->
<div
  hx-get="/api/content"
  hx-classes="add active, remove loading"
>
  Content
</div>

<!-- Toggle class -->
<div hx-get="/api/expand" hx-classes="toggle expanded">
  Expandable
</div>
```

---

## Server-Side Helpers

### htmxResponse()

Create HTMX response headers for server responses.

```typescript
import { htmxResponse } from '@philjs/htmx';

// Express.js example
app.post('/api/action', (req, res) => {
  // Perform action...

  const headers = htmxResponse({
    // Trigger client-side event
    trigger: 'actionComplete',

    // Trigger with data
    trigger: { showMessage: { text: 'Success!', type: 'success' } },

    // Trigger after DOM settles
    triggerAfterSettle: 'focus-input',

    // Trigger after swap
    triggerAfterSwap: 'animate-in',

    // Update browser URL
    push: '/new-url',

    // Redirect to new page
    redirect: '/dashboard',

    // Force full page refresh
    refresh: true,

    // Change target element
    retarget: '#different-target',

    // Change swap strategy
    reswap: 'outerHTML',
  });

  // Set headers
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  res.send('<div>Updated content</div>');
});
```

### isHTMXRequest()

Check if a request came from HTMX.

```typescript
import { isHTMXRequest } from '@philjs/htmx';

app.get('/page', (req, res) => {
  if (isHTMXRequest(req)) {
    // Return partial HTML for HTMX
    res.send('<div>Partial content</div>');
  } else {
    // Return full page for regular requests
    res.send(`
      <!DOCTYPE html>
      <html>
        <body>
          <div>Full page with layout</div>
        </body>
      </html>
    `);
  }
});
```

### getHTMXInfo()

Get detailed information about an HTMX request.

```typescript
import { getHTMXInfo } from '@philjs/htmx';

app.post('/api/action', (req, res) => {
  const info = getHTMXInfo(req);

  console.log({
    isHTMX: info.isHTMX,       // true if HTMX request
    target: info.target,       // Target element ID
    trigger: info.trigger,     // Triggering element ID
    triggerName: info.triggerName, // Trigger element name
    prompt: info.prompt,       // Value from hx-prompt
    currentUrl: info.currentUrl,   // Current page URL
    boosted: info.boosted,     // True if boosted link
  });

  // Conditional response based on target
  if (info.target === 'sidebar') {
    res.send('<nav>Sidebar content</nav>');
  } else {
    res.send('<main>Main content</main>');
  }
});
```

---

## DOM Events

HTMX dispatches custom events during the request lifecycle.

### Listening to Events

```typescript
// Before request
document.addEventListener('htmx:beforeRequest', (event) => {
  console.log('Request starting:', event.detail);
});

// After request
document.addEventListener('htmx:afterRequest', (event) => {
  console.log('Request complete:', event.detail.successful);
});

// Response error
document.addEventListener('htmx:responseError', (event) => {
  console.error('Request failed:', event.detail);
});

// Before swap
document.addEventListener('htmx:beforeSwap', (event) => {
  console.log('About to swap:', event.detail.swapStyle);
});

// After swap
document.addEventListener('htmx:afterSwap', (event) => {
  console.log('Swap complete');
});

// Error
document.addEventListener('htmx:error', (event) => {
  console.error('HTMX error:', event.detail);
});
```

### Element-Specific Events

```html
<button
  hx-get="/api/data"
  hx-target="#result"
  onhtmx:beforeRequest="console.log('Starting...')"
  onhtmx:afterSwap="console.log('Done!')"
>
  Load Data
</button>
```

```typescript
const button = document.getElementById('my-button');

button.addEventListener('htmx:beforeRequest', (event) => {
  event.target.disabled = true;
});

button.addEventListener('htmx:afterRequest', (event) => {
  event.target.disabled = false;
});
```

---

## Complete Examples

### Search with Debounce

```html
<div class="search-container">
  <input
    type="text"
    hx-get="/api/search"
    hx-trigger="keyup changed delay:300ms"
    hx-target="#search-results"
    hx-indicator="#search-spinner"
    placeholder="Search..."
  />
  <span id="search-spinner" class="htmx-indicator">Searching...</span>

  <div id="search-results"></div>
</div>
```

### Infinite Scroll

```html
<div id="feed">
  <div class="post">Post 1</div>
  <div class="post">Post 2</div>

  <div
    hx-get="/api/posts?page=2"
    hx-trigger="revealed"
    hx-swap="outerHTML"
    hx-indicator="#loading"
  >
    <span id="loading" class="htmx-indicator">Loading more...</span>
  </div>
</div>
```

### Live Notifications

```html
<div
  id="notifications"
  hx-get="/api/notifications"
  hx-trigger="every 30s"
  hx-swap="innerHTML"
>
  <span class="badge">0</span>
</div>
```

### Modal Dialog

```html
<button hx-get="/api/modal/edit/123" hx-target="#modal-container">
  Edit Item
</button>

<div id="modal-container"></div>

<!-- Server response -->
<div class="modal" id="edit-modal">
  <form hx-put="/api/items/123" hx-target="#item-123" hx-swap="outerHTML">
    <input name="title" value="Current Title" />
    <button type="submit">Save</button>
    <button type="button" onclick="htmx.remove(this.closest('.modal'))">
      Cancel
    </button>
  </form>
</div>
```

### Form Validation

```html
<form hx-post="/api/register" hx-target="#form-result">
  <div>
    <input
      name="email"
      hx-get="/api/validate/email"
      hx-trigger="blur changed"
      hx-target="next .error"
    />
    <span class="error"></span>
  </div>

  <div>
    <input
      name="username"
      hx-get="/api/validate/username"
      hx-trigger="blur changed"
      hx-target="next .error"
    />
    <span class="error"></span>
  </div>

  <button type="submit">Register</button>
  <div id="form-result"></div>
</form>
```

### Delete with Confirmation

```html
<tr id="user-123">
  <td>John Doe</td>
  <td>john@example.com</td>
  <td>
    <button
      hx-delete="/api/users/123"
      hx-target="#user-123"
      hx-swap="outerHTML"
      hx-confirm="Are you sure you want to delete this user?"
    >
      Delete
    </button>
  </td>
</tr>
```

---

## API Reference

### Initialization

| Function | Description |
|----------|-------------|
| `initHTMX(config?)` | Initialize HTMX processing with optional configuration |
| `injectStyles()` | Inject default HTMX CSS styles |

### Programmatic API (htmx object)

| Method | Description |
|--------|-------------|
| `htmx.config(options)` | Update runtime configuration |
| `htmx.ajax(verb, path, options?)` | Make an AJAX request |
| `htmx.process(element)` | Process HTMX attributes on element |
| `htmx.trigger(element, event, detail?)` | Trigger custom event |
| `htmx.refresh(element)` | Re-issue element's request |
| `htmx.find(selector)` | Find elements matching selector |
| `htmx.addClass(element, class)` | Add CSS class |
| `htmx.removeClass(element, class)` | Remove CSS class |
| `htmx.toggleClass(element, class)` | Toggle CSS class |
| `htmx.remove(element, delay?)` | Remove element with optional delay |
| `htmx.closest(element, selector)` | Find closest ancestor |

### Extensions

| Function | Description |
|----------|-------------|
| `defineExtension(extension)` | Register an HTMX extension |
| `removeExtension(name)` | Remove an extension |

### Server Helpers

| Function | Description |
|----------|-------------|
| `htmxResponse(options)` | Create HTMX response headers |
| `isHTMXRequest(request)` | Check if request is from HTMX |
| `getHTMXInfo(request)` | Get HTMX request information |

---

## TypeScript Types

```typescript
import type {
  HTMXConfig,
  SwapStyle,
  TriggerEvent,
  TriggerSpec,
  TriggerModifier,
  HTMXRequestEvent,
  HTMXResponseEvent,
  HTMXSwapEvent,
  HTMXError,
  AjaxOptions,
  HTMXExtension,
} from '@philjs/htmx';
```
