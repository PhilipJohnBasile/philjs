# PhilJS 2026 Web Standards

This document outlines the modern web standards PhilJS follows for maximum performance, ease of adoption, and future-proofing.

## Core Principles

1. **No Build Step Required** - Works with native ES modules and import maps
2. **No Virtual DOM** - Direct DOM manipulation with fine-grained reactivity
3. **No JSX Required** - Tagged template literals as primary authoring syntax
4. **TypeScript-First** - Full type safety without runtime overhead
5. **Standards-Aligned** - Uses native browser APIs whenever possible

## JavaScript/TypeScript Standards

### ES2025+ Target (ESNext)

PhilJS targets ES2025 via ESNext (TypeScript 6) and uses the latest JavaScript features:

```typescript
// Private class fields
class Counter {
  #count = 0;
  increment() { this.#count++; }
}

// Array.groupBy
const grouped = items.groupBy(item => item.category);

// Promise.withResolvers
const { promise, resolve, reject } = Promise.withResolvers();

// Top-level await
await import('@philjs/core');
```

### TC39 Signals (Stage 1 → Stage 3 expected 2025-2026)

PhilJS provides a TC39-compatible signals API:

```typescript
import { getSignalImpl, hasNativeSignals } from '@philjs/core/tc39-signals';

const Signal = await getSignalImpl();

if (!hasNativeSignals()) {
  console.log('Using the polyfill for TC39 Signals.');
}

// State signal (writable)
const count = new Signal.State(0);
count.get(); // 0
count.set(5);

// Computed signal (derived)
const doubled = new Signal.Computed(() => count.get() * 2);

// Watcher for effects
const watcher = new Signal.subtle.Watcher(() => {
  console.log('Count:', count.get());
});
watcher.watch(count);
```

When native Signals ship, PhilJS will seamlessly transition to the native implementation. For always-on polyfill installs, import `@philjs/core/tc39-signals-polyfill`.

### Native Decorators (Stage 3)

PhilJS uses Stage 3 decorators for web components:

```typescript
import { PhilElement, state, property, query } from '@philjs/core/element';

class MyCounter extends PhilElement {
  @state() accessor count = 0;
  @property({ type: Number, reflect: true }) accessor step = 1;
  @query('button') accessor button: HTMLButtonElement;

  render() {
    return html`<button @click=${() => this.count += this.step}>${this.count}</button>`;
  }
}
```

### Import Attributes

```typescript
import styles from './styles.css' with { type: 'css' };
import data from './config.json' with { type: 'json' };
```

### Explicit Resource Management

```typescript
using connection = await database.connect();
// Connection auto-closes when scope exits
```

## HTML/Templating Standards

### Tagged Template Literals (No JSX)

PhilJS uses tagged templates instead of JSX:

```typescript
import { html, render } from '@philjs/core/html';

const template = html`
  <div class="card">
    <h1>${title}</h1>
    <p>${description}</p>
    <button @click=${handleClick}>Click me</button>
  </div>
`;

render(template, document.getElementById('app'));
```

**Syntax:**
- `${expr}` - Interpolation (auto-reactive for signals)
- `@event` - Event binding (`@click`, `@input`, etc.)
- `.prop` - Property binding (`.value=${val}`)
- `?attr` - Boolean attribute (`?disabled=${isDisabled}`)

### Declarative Shadow DOM

```html
<phil-card>
  <template shadowrootmode="open">
    <style>:host { display: block; }</style>
    <slot></slot>
  </template>
  Card content here
</phil-card>
```

## CSS Standards

### CSS Nesting (Native)

```css
.card {
  padding: 1rem;

  & .title {
    font-weight: bold;
  }

  &:hover {
    background: var(--hover-bg);
  }
}
```

### CSS @scope

```css
@scope (.card) to (.card-content) {
  /* Only applies to direct children of .card, not inside .card-content */
  p { margin: 0; }
}
```

### CSS Layers

```css
@layer reset, base, components, utilities;

@layer reset {
  * { margin: 0; padding: 0; }
}

@layer components {
  .button { /* ... */ }
}
```

### Container Queries

```css
.card-container {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card { flex-direction: row; }
}
```

### CSS Custom States

```css
/* For custom elements with ::state() */
phil-toggle::state(checked) {
  background: green;
}

phil-toggle::state(loading) {
  opacity: 0.5;
  cursor: wait;
}
```

### Anchor Positioning (2025)

```css
.tooltip {
  position: absolute;
  anchor-name: --tooltip;
  top: anchor(--trigger bottom);
  left: anchor(--trigger center);
}
```

## Web Component Standards

### Form-Associated Custom Elements

```typescript
class PhilInput extends PhilElement {
  static formAssociated = true;

  constructor() {
    super();
    // this.internals is automatically available
  }

  set value(v: string) {
    this.setFormValue(v);
  }

  validate() {
    if (!this.value) {
      this.setValidity({ valueMissing: true }, 'Required');
    } else {
      this.setValidity({});
    }
  }
}
```

### Element Internals & ARIA

```typescript
class PhilButton extends PhilElement {
  onConnect() {
    this.setAriaRole('button');
    this.setAriaLabel('Click me');
    this.internals.ariaPressed = 'false';
  }
}
```

### Scoped Custom Element Registries (Stage 2)

```typescript
// Future: Scoped registries for Shadow DOM
const registry = new CustomElementRegistry();
registry.define('my-button', MyButton);
shadowRoot.customElements = registry;
```

## Browser APIs

### View Transitions API

```typescript
import { startViewTransition, crossfade } from '@philjs/core/view-transitions';

// Simple transition
await startViewTransition(() => {
  updateContent();
});

// Preset transition
await crossfade(() => updatePage());

// Slide transition
await slide(() => updatePage(), 'left');
```

### Navigation API

```typescript
import { createRouter, navigate, useLocation } from '@philjs/core/navigation';

const router = createRouter({
  '/': () => html`<home-page></home-page>`,
  '/about': () => html`<about-page></about-page>`,
  '/users/:id': ({ params }) => html`<user-page id="${params.id}"></user-page>`,
});

router.start();

// Navigate with view transition
await navigate('/about');
```

### Popover API

```html
<button popovertarget="menu">Open Menu</button>
<div id="menu" popover>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</div>
```

### Scheduler API

```typescript
// Low-priority background task
scheduler.postTask(() => analytics.send(), { priority: 'background' });

// Yield to main thread
await scheduler.yield();

// High-priority user input
scheduler.postTask(() => render(), { priority: 'user-blocking' });
```

### Scroll-Driven Animations

```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.card {
  animation: fade-in linear;
  animation-timeline: view();
  animation-range: entry 0% entry 100%;
}
```

### Speculation Rules

```html
<script type="speculationrules">
{
  "prerender": [
    { "where": { "href_matches": "/products/*" } }
  ],
  "prefetch": [
    { "where": { "href_matches": "/api/*" } }
  ]
}
</script>
```

## Module Standards

### Import Maps (No Bundler)

```html
<script type="importmap">
{
  "imports": {
    "@philjs/core": "/pkg/philjs-core/index.js",
    "@philjs/router": "/pkg/philjs-router/index.js"
  }
}
</script>

<script type="module">
  import { signal, html } from '@philjs/core';
  // Works without a bundler!
</script>
```

### Module Preload

```html
<link rel="modulepreload" href="/pkg/philjs-core/index.js">
<link rel="modulepreload" href="/pkg/philjs-router/index.js">
```

## Performance Standards

### INP Optimization

```typescript
// Yield to main thread between expensive operations
async function processItems(items) {
  for (const item of items) {
    await scheduler.yield();
    process(item);
  }
}

// Or use requestIdleCallback for non-critical work
requestIdleCallback(() => {
  sendAnalytics();
});
```

### Priority Hints

```html
<img fetchpriority="high" src="hero.jpg" alt="Hero">
<img fetchpriority="low" src="footer-logo.jpg" alt="Logo">
<script fetchpriority="low" src="analytics.js"></script>
```

## Security Standards

### Trusted Types

```typescript
const policy = trustedTypes.createPolicy('philjs', {
  createHTML: (input) => DOMPurify.sanitize(input),
});

element.innerHTML = policy.createHTML(userInput);
```

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'">
```

## Accessibility Standards

### ARIA 1.3

- `aria-description` for extended descriptions
- `aria-braillelabel` for braille displays
- Improved combobox patterns

### Inert Attribute

```html
<dialog open>
  <h2>Modal Title</h2>
  <p>Modal content</p>
</dialog>
<main inert>
  <!-- This content is non-interactive while modal is open -->
</main>
```

## Browser Targets (Baseline 2024)

PhilJS supports:
- Chrome 120+
- Firefox 121+
- Safari 17.2+
- Edge 120+

No support for:
- Internet Explorer (any version)
- Legacy Edge (EdgeHTML)
- Safari < 17

## Build Configuration

### TypeScript Config

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ESNext", "DOM", "DOM.Iterable", "Decorators"],
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "useDefineForClassFields": true,
    "experimentalDecorators": false,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

### Package.json

```json
{
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "engines": {
    "node": ">=20"
  }
}
```

## Migration from JSX

If migrating from JSX:

```tsx
// Before (JSX)
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}

// After (Tagged Templates)
function Counter() {
  const count = signal(0);
  return html`<button @click=${() => count.set(c => c + 1)}>${count}</button>`;
}
```

Key differences:
- `onClick` → `@click`
- `className` → `class`
- `{value}` → `${value}`
- `useState()` → `signal()`
- Components return `TemplateResult` not JSX elements
