# PhilJS Kitchen Sink

A comprehensive demonstration of all PhilJS framework features with end-to-end testing.

## Overview

The Kitchen Sink demo showcases every capability of PhilJS, including:

- **Signals & Reactivity** - Fine-grained reactive state management
- **Reactive Attributes** - Dynamic styles, classes, and attributes
- **Forms & Validation** - Controlled inputs and form validation patterns
- **Lists & Rendering** - Dynamic lists, filtering, and conditional rendering
- **Async & Data Fetching** - Loading states, error handling, and debouncing
- **Advanced Patterns** - Component composition, derived state, and custom hooks

## Getting Started

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

The app will be available at `http://localhost:3002` (or the next available port).

### Build

```bash
pnpm build
```

### Preview

```bash
pnpm preview
```

## Testing

### Run E2E Tests

```bash
pnpm test:e2e
```

This runs the comprehensive Playwright test suite that covers all demo features.

### Install Playwright Browsers

If you haven't installed Playwright browsers yet:

```bash
pnpx playwright install
```

## Features Demonstrated

### 1. Signals & Reactivity (`/src/demos/SignalsDemo.tsx`)

- Basic signals with read/write operations
- Computed values (memos) with automatic dependency tracking
- Effects with cleanup for side effects
- Batch updates for performance optimization
- Untrack for selective dependency tracking

**Test Coverage**: `tests/e2e/signals.spec.ts`

### 2. Reactive Attributes (`/src/demos/ReactiveAttributesDemo.tsx`)

- Reactive inline styles (objects)
- Reactive CSS classes
- Reactive HTML attributes
- Theme switching with reactive styles

**Test Coverage**: `tests/e2e/reactive-attributes.spec.ts`

### 3. Forms & Validation (`/src/demos/FormsDemo.tsx`)

- Controlled inputs (text, number, checkbox, radio, select)
- Form validation with real-time feedback
- Multi-step forms with state management
- Form submission handling

**Test Coverage**: `tests/e2e/forms.spec.ts`

### 4. Lists & Rendering (`/src/demos/ListsDemo.tsx`)

- Dynamic list rendering with keys
- Todo list with add/remove/toggle operations
- Filtering (all/active/completed)
- Conditional rendering patterns
- Fragment usage for multiple elements

**Test Coverage**: `tests/e2e/lists.spec.ts`

### 5. Async & Data Fetching (`/src/demos/AsyncDemo.tsx`)

- Fetch API integration
- Loading states and spinners
- Error handling patterns
- Debounced search input
- Async state management

**Test Coverage**: `tests/e2e/async.spec.ts`

### 6. Advanced Patterns (`/src/demos/AdvancedPatternsDemo.tsx`)

- Component composition and reusability
- Derived state with shopping cart calculations
- Custom hooks pattern (useCounter)
- Performance optimization with memos and batch

**Test Coverage**: `tests/e2e/advanced.spec.ts`

## Project Structure

```
kitchen-sink/
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Main app with navigation
│   └── demos/                # Demo components
│       ├── SignalsDemo.tsx
│       ├── ReactiveAttributesDemo.tsx
│       ├── FormsDemo.tsx
│       ├── ListsDemo.tsx
│       ├── AsyncDemo.tsx
│       └── AdvancedPatternsDemo.tsx
├── tests/
│   └── e2e/                  # Playwright E2E tests
│       ├── navigation.spec.ts
│       ├── signals.spec.ts
│       ├── reactive-attributes.spec.ts
│       ├── forms.spec.ts
│       ├── lists.spec.ts
│       ├── async.spec.ts
│       └── advanced.spec.ts
├── index.html                # HTML entry
├── package.json              # Dependencies
├── vite.config.ts            # Vite configuration
├── playwright.config.ts      # Playwright configuration
└── tsconfig.json             # TypeScript configuration
```

## Test Attributes

All interactive elements have `data-test` attributes for reliable E2E testing:

```tsx
<button data-test="increment" onClick={() => count.set(count() + 1)}>
  Increment
</button>
```

This enables stable tests that don't rely on implementation details:

```ts
await page.click('[data-test="increment"]');
await expect(page.locator('[data-test="count-value"]')).toHaveText('1');
```

## PhilJS Features Reference

### Creating Signals

```ts
import { signal } from 'philjs-core';

const count = signal(0);
console.log(count());     // Read: 0
count.set(5);             // Write: 5
count.set(c => c + 1);    // Update: 6
```

### Creating Memos

```ts
import { memo } from 'philjs-core';

const doubled = memo(() => count() * 2);
console.log(doubled());   // Auto-updates when count changes
```

### Creating Effects

```ts
import { effect, onCleanup } from 'philjs-core';

effect(() => {
  const interval = setInterval(() => {
    console.log(count());
  }, 1000);

  onCleanup(() => clearInterval(interval));
});
```

### Batch Updates

```ts
import { batch } from 'philjs-core';

batch(() => {
  count.set(1);
  name.set('Phil');
  // Only one re-render
});
```

### Untrack Reads

```ts
import { untrack } from 'philjs-core';

effect(() => {
  console.log(count());           // Tracked
  console.log(untrack(() => name())); // Not tracked
});
```

## Contributing

This demo serves as both documentation and a comprehensive test suite for PhilJS. When adding new features to PhilJS:

1. Add a demo section showing the feature
2. Add E2E tests covering the feature
3. Update this README with the feature documentation

## License

MIT
