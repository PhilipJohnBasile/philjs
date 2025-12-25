# PhilJS HTML

HTML-first reactive framework with HTMX and Alpine.js compatibility.

Build interactive UIs by enhancing HTML with reactive attributes - no build step required.

## Features

- **Alpine.js Compatible** - Use `x-data`, `x-text`, `x-show`, `x-on`, etc.
- **HTMX Compatible** - Use `hx-get`, `hx-post`, `hx-target`, etc.
- **Minimal Runtime** - Optional <3KB mode for ultra-light apps
- **PhilJS Signals** - Powered by efficient fine-grained reactivity
- **No Build Required** - Works directly in the browser

## Installation

```bash
npm install philjs-html
```

Or use directly in HTML:

```html
<script src="https://unpkg.com/philjs-html"></script>
```

## Quick Start

### Alpine-Style Reactivity

```html
<div x-data="{ count: 0 }">
  <span x-text="count"></span>
  <button @click="count++">+</button>
  <button @click="count--">-</button>
</div>
```

### HTMX-Style Server Interactions

```html
<button hx-get="/api/users" hx-target="#users-list" hx-swap="innerHTML">
  Load Users
</button>

<div id="users-list"></div>
```

### Combined

```html
<div x-data="{ loading: false }">
  <button
    hx-get="/api/data"
    hx-target="#result"
    @htmx:beforeRequest="loading = true"
    @htmx:afterRequest="loading = false"
    :disabled="loading"
  >
    <span x-show="!loading">Load Data</span>
    <span x-show="loading">Loading...</span>
  </button>

  <div id="result"></div>
</div>
```

## Alpine.js Directives

### x-data

Initialize reactive data:

```html
<div x-data="{ open: false, items: [] }">
  <!-- reactive scope -->
</div>
```

### x-text / x-html

Set content:

```html
<span x-text="message"></span>
<div x-html="htmlContent"></div>
```

### x-show / x-if

Conditional rendering:

```html
<div x-show="isVisible">Toggles visibility</div>
<template x-if="condition">
  <div>Conditionally rendered</div>
</template>
```

### x-for

List rendering:

```html
<ul>
  <template x-for="item in items">
    <li x-text="item.name"></li>
  </template>
</ul>

<!-- With index -->
<template x-for="(item, index) in items">
  <li x-text="`${index}: ${item}`"></li>
</template>
```

### x-on / @

Event handling:

```html
<button x-on:click="handleClick">Click</button>
<button @click="count++">+</button>
<button @click.prevent="submit">Submit</button>
<input @keyup.enter="search" />
```

Modifiers: `.prevent`, `.stop`, `.once`, `.self`, `.capture`

### x-model

Two-way binding:

```html
<input x-model="name" />
<textarea x-model="bio"></textarea>
<select x-model="selected">
  <option>A</option>
  <option>B</option>
</select>
```

### x-bind / :

Attribute binding:

```html
<div x-bind:class="{ active: isActive }"></div>
<img :src="imageUrl" />
<button :disabled="loading">Submit</button>
```

### x-ref

Element references:

```html
<input x-ref="input" />
<button @click="$refs.input.focus()">Focus</button>
```

### x-effect

Side effects:

```html
<div x-effect="console.log('Count is', count)"></div>
```

### x-transition

Transitions:

```html
<div
  x-show="open"
  x-transition:enter="transition ease-out duration-300"
  x-transition:enter-start="opacity-0"
  x-transition:enter-end="opacity-100"
  x-transition:leave="transition ease-in duration-200"
  x-transition:leave-start="opacity-100"
  x-transition:leave-end="opacity-0"
>
  Content
</div>
```

## HTMX Attributes

### HTTP Methods

```html
<button hx-get="/api/data">GET</button>
<form hx-post="/api/submit">POST</form>
<button hx-put="/api/update">PUT</button>
<button hx-patch="/api/patch">PATCH</button>
<button hx-delete="/api/delete">DELETE</button>
```

### Targeting

```html
<button hx-get="/api" hx-target="#result">Load into #result</button>
<button hx-get="/api" hx-target="closest .container">Load into closest</button>
<button hx-get="/api" hx-target="this">Replace self</button>
```

### Swapping

```html
<button hx-get="/api" hx-swap="innerHTML">Replace inner (default)</button>
<button hx-get="/api" hx-swap="outerHTML">Replace element</button>
<button hx-get="/api" hx-swap="beforeend">Append</button>
<button hx-get="/api" hx-swap="afterbegin">Prepend</button>
```

### Triggers

```html
<input hx-get="/search" hx-trigger="keyup changed delay:500ms" />
<div hx-get="/poll" hx-trigger="every 5s">Polling</div>
<div hx-get="/data" hx-trigger="revealed">Load on visible</div>
```

### Values & Headers

```html
<button hx-get="/api" hx-vals='{"key": "value"}'>With values</button>
<button hx-get="/api" hx-headers='{"X-Custom": "value"}'>With headers</button>
```

### Indicators

```html
<button hx-get="/api" hx-indicator="#spinner">
  Load
  <span id="spinner" class="htmx-indicator">Loading...</span>
</button>
```

## Global Stores

```html
<script>
  PhilJSHTML.store('app', {
    user: null,
    theme: 'light',
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light';
    }
  });
</script>

<div x-data>
  <span x-text="$store('app').theme"></span>
  <button @click="$store('app').toggleTheme()">Toggle</button>
</div>
```

## Reusable Components

```html
<script>
  PhilJSHTML.data('counter', () => ({
    count: 0,
    increment() { this.count++ },
    decrement() { this.count-- }
  }));
</script>

<div x-data="counter">
  <span x-text="count"></span>
  <button @click="increment">+</button>
</div>
```

## Minimal Mode

For ultra-lightweight apps (<3KB):

```html
<script src="philjs-html/minimal" data-minimal></script>

<div x-data="{ count: 0 }">
  <span x-text="count"></span>
  <button @click="count++">+</button>
</div>
```

Minimal mode includes: `x-data`, `x-text`, `x-show`, `x-on`, `x-model`, `x-bind`

## Configuration

```javascript
import { init, configureHtmx } from 'philjs-html';

// Configure HTMX
configureHtmx({
  timeout: 10000,
  withCredentials: true,
  headers: { 'X-Requested-With': 'PhilJS' }
});

// Manual initialization
init({
  alpine: true,
  htmx: true,
  minimal: false,
  root: document.getElementById('app')
});
```

## Events

### Alpine Events

```html
<div @custom-event.window="handleEvent">
  <button @click="$dispatch('custom-event', { data: 123 })">
    Dispatch
  </button>
</div>
```

### HTMX Events

```html
<div
  @htmx:beforeRequest="loading = true"
  @htmx:afterRequest="loading = false"
  @htmx:error="handleError"
>
  ...
</div>
```

## License

MIT
