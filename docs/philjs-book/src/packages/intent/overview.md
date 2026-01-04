# @philjs/intent - Intent-Based Development

The `@philjs/intent` package brings intent-based development to PhilJS, enabling you to describe WHAT you want and letting the framework figure out HOW to implement it. This paradigm shift allows natural language component descriptions, goal-oriented programming, and AI-powered code synthesis.

## Installation

```bash
npm install @philjs/intent
# or
pnpm add @philjs/intent
# or
bun add @philjs/intent
```

## Features

- **Natural Language Descriptions** - Describe components in plain English
- **Goal-Oriented Programming** - Focus on outcomes, not implementation details
- **Automatic Implementation Selection** - Built-in templates for common patterns
- **AI-Powered Code Synthesis** - Integration with OpenAI and Anthropic
- **Constraint-Based Development** - Define must/should/must-not requirements
- **Self-Optimizing Code Paths** - Optimize for performance, readability, size, or accessibility
- **Learning System** - Improves from user corrections over time
- **Caching** - Fast resolution of previously resolved intents
- **Built-in Templates** - Counter, forms, lists, modals, and API fetching

## Quick Start

```typescript
import { initIntent, intent } from '@philjs/intent';

// Initialize the intent resolver
initIntent({
  provider: 'local',  // Use built-in templates
  cache: true,        // Enable caching
  learning: true      // Learn from corrections
});

// Create and resolve an intent
const result = await intent('create a counter that starts at 10')
  .must('be accessible')
  .should('use TypeScript')
  .prioritize('readability')
  .resolve();

console.log(result.implementation);
// Outputs a fully functional counter component
```

## Core Concepts

### Intent Declaration

Intents are declarative descriptions of what you want to build. Instead of writing implementation code, you describe your goals:

```typescript
import { intent } from '@philjs/intent';

// Simple intent
const simpleIntent = intent('create a login form');

// Intent with constraints
const complexIntent = intent('create a sortable list of products')
  .must('support keyboard navigation')
  .must('handle 1000+ items efficiently')
  .should('animate sorting transitions')
  .mustNot('use external dependencies')
  .prefer('CSS Grid over Flexbox')
  .prioritize('performance');
```

### Constraint Types

| Type | Description | Behavior |
|------|-------------|----------|
| `must` | Hard requirement | Resolution fails if not met |
| `should` | Soft requirement | Generates warning if not met |
| `must-not` | Prohibition | Resolution fails if violated |
| `prefer` | Preference hint | Used when choosing between alternatives |

### Priority Options

| Priority | Optimizes For |
|----------|---------------|
| `performance` | Runtime speed, minimal re-renders |
| `readability` | Clean, maintainable code |
| `size` | Minimal bundle footprint |
| `accessibility` | WCAG compliance, screen reader support |

## Built-in Templates

The package includes ready-to-use templates for common UI patterns:

### Counter Component

```typescript
const result = await intent('create a counter')
  .resolve();

// Or with initial value
const result = await intent('create a counter that starts at 100')
  .resolve();
```

**Generated Output:**

```tsx
import { createSignal } from '@philjs/core';

export function Counter() {
  const [count, setCount] = createSignal(100);

  return (
    <div>
      <p>Count: {count()}</p>
      <button onClick={() => setCount(c => c + 1)}>Increment</button>
      <button onClick={() => setCount(c => c - 1)}>Decrement</button>
    </div>
  );
}
```

### Form Templates

```typescript
// Login form
await intent('create a login form').resolve();

// Signup form with more fields
await intent('create a signup form').resolve();

// Contact form
await intent('create a contact form').resolve();

// Newsletter subscription
await intent('create a newsletter form').resolve();
```

**Login Form Output:**

```tsx
import { createSignal } from '@philjs/core';

export function LoginForm() {
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = { email: email(), password: password() };
      console.log('Submitting:', data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          value={email()}
          onInput={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          value={password()}
          onInput={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error() && <p style="color: red">{error()}</p>}
      <button type="submit" disabled={loading()}>
        {loading() ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
}
```

### List Components

```typescript
// Basic list
await intent('create a list of users').resolve();

// Sortable list
await intent('create a sortable list of products').resolve();

// Filterable/searchable list
await intent('create a searchable list of items').resolve();

// Combined features
await intent('create a sortable filterable list of tasks').resolve();
```

**Filterable List Output:**

```tsx
import { createSignal, createMemo } from '@philjs/core';

interface ItemsItem {
  id: string;
  name: string;
}

export function ItemsList() {
  const [items, setItems] = createSignal<ItemsItem[]>([]);
  const [search, setSearch] = createSignal('');

  const displayedItems = createMemo(() => {
    let result = [...items()];
    const searchTerm = search().toLowerCase();
    if (searchTerm) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchTerm)
      );
    }
    return result;
  });

  return (
    <div>
      <input
        type="search"
        placeholder="Search items..."
        value={search()}
        onInput={(e) => setSearch(e.target.value)}
      />
      <ul>
        {displayedItems().map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Modal Components

```typescript
// Basic modal
await intent('create a modal').resolve();

// Confirmation modal
await intent('create a confirmation modal').resolve();

// Alert modal
await intent('create an alert modal').resolve();
```

**Modal with Hook Output:**

```tsx
import { createSignal, Show } from '@philjs/core';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  onConfirm?: () => void;
  children?: any;
}

export function Modal(props: ModalProps) {
  return (
    <Show when={props.isOpen}>
      <div
        class="modal-backdrop"
        onClick={props.onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
      >
        <div
          class="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            minWidth: '300px',
            maxWidth: '90vw'
          }}
        >
          {props.title && <h2>{props.title}</h2>}
          <div class="modal-body">{props.children}</div>
          <div class="modal-footer" style={{ marginTop: '16px', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={props.onClose}>Cancel</button>
            <button onClick={() => { props.onConfirm?.(); props.onClose(); }}>Confirm</button>
          </div>
        </div>
      </div>
    </Show>
  );
}

// Usage hook
export function useModal() {
  const [isOpen, setIsOpen] = createSignal(false);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen(v => !v)
  };
}
```

### API Data Fetching

```typescript
// Basic API fetch
await intent('fetch data from api').resolve();

// With specific endpoint
await intent('fetch data from api /api/users').resolve();

// Using get/load verbs
await intent('load data from endpoint /api/products').resolve();
```

**API Hook Output:**

```tsx
import { createSignal, onMount } from '@philjs/core';

interface DataResponse {
  [key: string]: unknown;
}

export function useApiData(endpoint: string = '/api/data') {
  const [data, setData] = createSignal<DataResponse | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<Error | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => fetchData();

  onMount(() => {
    fetchData();
  });

  return { data, loading, error, refetch };
}

// Component version
export function DataFetcher(props: { endpoint?: string; children: (data: any) => any }) {
  const { data, loading, error } = useApiData(props.endpoint);

  return (
    <>
      {loading() && <div>Loading...</div>}
      {error() && <div>Error: {error()!.message}</div>}
      {data() && props.children(data())}
    </>
  );
}
```

## IntentResolver Class

The `IntentResolver` class is the core engine for resolving intents into implementations.

### Creating a Resolver

```typescript
import { IntentResolver } from '@philjs/intent';

const resolver = new IntentResolver({
  provider: 'local',      // 'local' | 'openai' | 'anthropic'
  apiKey: '',             // Required for cloud providers
  model: 'gpt-4',         // Model to use
  cache: true,            // Cache resolved intents
  maxAttempts: 3,         // Maximum resolution attempts
  learning: true          // Learn from corrections
});
```

### Resolving Intents

```typescript
const intent: Intent = {
  id: 'my-intent',
  description: 'create a todo list',
  constraints: [
    { type: 'must', description: 'support drag and drop' },
    { type: 'should', description: 'persist to localStorage' }
  ],
  priority: 'accessibility'
};

const result = await resolver.resolve(intent);

console.log(result.implementation);  // The generated code
console.log(result.explanation);     // Why this implementation
console.log(result.confidence);      // 0-1 confidence score
console.log(result.warnings);        // Any constraint warnings
console.log(result.alternatives);    // Alternative implementations
```

### Adding Custom Templates

```typescript
resolver.addTemplate({
  name: 'data-table',
  pattern: /(?:create|make|build)\s+(?:a\s+)?data\s+table/i,
  resolve: (match, context) => {
    return `
import { createSignal } from '@philjs/core';

export function DataTable() {
  const [data, setData] = createSignal([]);
  const [sortColumn, setSortColumn] = createSignal('');
  const [sortDirection, setSortDirection] = createSignal<'asc' | 'desc'>('asc');

  // ... implementation
}`.trim();
  }
});
```

### Removing Templates

```typescript
resolver.removeTemplate('counter');
```

### Learning from Corrections

When the generated code needs adjustment, teach the resolver:

```typescript
// User corrected the implementation
const correctedCode = `
import { createSignal } from '@philjs/core';

export function Counter() {
  const [count, setCount] = createSignal(0);

  // User's improved version with better accessibility
  return (
    <div role="group" aria-label="Counter">
      <output aria-live="polite">Count: {count()}</output>
      <button
        aria-label="Decrease count"
        onClick={() => setCount(c => c - 1)}
      >
        -
      </button>
      <button
        aria-label="Increase count"
        onClick={() => setCount(c => c + 1)}
      >
        +
      </button>
    </div>
  );
}`;

// Teach the resolver
resolver.learn(originalIntent, correctedCode);

// Future resolutions will use the corrected version
```

### Clearing Learnings

```typescript
resolver.clearLearnings();
```

## AI Provider Integration

### OpenAI Configuration

```typescript
import { initIntent } from '@philjs/intent';

initIntent({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
  cache: true
});
```

### Anthropic Configuration

```typescript
import { initIntent } from '@philjs/intent';

initIntent({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-sonnet-20240229',
  cache: true
});
```

### Fallback Behavior

When AI providers are unavailable or the intent cannot be resolved:

```typescript
const result = await intent('create something very custom').resolve();

if (result.confidence === 0) {
  console.log(result.implementation);
  // "// Implement: \"create something very custom\""

  console.log(result.warnings);
  // ["Intent could not be resolved automatically"]
}
```

## useIntent Hook

For component-level intent resolution:

```typescript
import { useIntent } from '@philjs/intent';

function ComponentBuilder() {
  const { resolve, builder } = useIntent('create a shopping cart');

  // Add constraints dynamically
  builder
    .must('calculate totals')
    .should('support discount codes')
    .prioritize('performance');

  async function generate() {
    const result = await resolve();
    console.log(result.implementation);
  }

  return (
    <button onClick={generate}>
      Generate Component
    </button>
  );
}
```

## IntentBuilder API

The fluent builder API for constructing intents:

```typescript
import { intent } from '@philjs/intent';

const myIntent = intent('create a dashboard')
  // Hard requirements
  .must('display real-time metrics')
  .must('support dark mode', (result) => result.includes('dark'))

  // Soft requirements
  .should('animate transitions')
  .should('lazy load charts')

  // Prohibitions
  .mustNot('use jQuery')
  .mustNot('make synchronous API calls')

  // Preferences
  .prefer('CSS variables over inline styles')
  .prefer('semantic HTML elements')

  // Optimization target
  .prioritize('performance')

  // Additional context
  .inContext({
    component: 'AdminDashboard',
    dependencies: ['@philjs/charts', '@philjs/realtime'],
    targetFramework: 'philjs',
    existingCode: '// existing imports...',
    userPreferences: {
      theme: 'dark',
      language: 'typescript'
    }
  })

  // Get the intent object
  .build();

// Or resolve directly
const result = await intent('create a dashboard').resolve();
```

## Types Reference

### IntentConfig

```typescript
interface IntentConfig {
  /** AI provider for intent resolution */
  provider?: 'openai' | 'anthropic' | 'local';
  /** API key for cloud providers */
  apiKey?: string;
  /** Model to use */
  model?: string;
  /** Enable caching of resolved intents */
  cache?: boolean;
  /** Maximum resolution attempts */
  maxAttempts?: number;
  /** Enable learning from user corrections */
  learning?: boolean;
}
```

### Intent

```typescript
interface Intent {
  id: string;
  description: string;
  constraints?: Constraint[];
  context?: IntentContext;
  priority?: 'performance' | 'readability' | 'size' | 'accessibility';
}
```

### Constraint

```typescript
interface Constraint {
  type: 'must' | 'should' | 'must-not' | 'prefer';
  description: string;
  validate?: (result: unknown) => boolean;
}
```

### IntentContext

```typescript
interface IntentContext {
  component?: string;
  dependencies?: string[];
  targetFramework?: string;
  existingCode?: string;
  userPreferences?: Record<string, unknown>;
}
```

### ResolvedIntent

```typescript
interface ResolvedIntent {
  intent: Intent;
  implementation: string;
  explanation: string;
  alternatives?: AlternativeImplementation[];
  confidence: number;
  warnings?: string[];
}
```

### AlternativeImplementation

```typescript
interface AlternativeImplementation {
  implementation: string;
  tradeoffs: string;
  confidence: number;
}
```

### IntentTemplate

```typescript
interface IntentTemplate {
  name: string;
  pattern: RegExp;
  resolve: (match: RegExpMatchArray, context?: IntentContext) => string;
}
```

## API Reference

| Export | Type | Description |
|--------|------|-------------|
| `IntentResolver` | Class | Core resolver engine for processing intents |
| `intent` | Function | Creates an `IntentBuilder` for fluent intent construction |
| `initIntent` | Function | Initializes the global intent resolver |
| `getIntentResolver` | Function | Returns the global resolver instance |
| `useIntent` | Hook | Component-level intent resolution |
| `useModal` | Hook | Modal state management (from modal template) |
| `useApiData` | Hook | API data fetching (from API template) |
| `builtInTemplates` | Array | List of built-in intent templates |
| `Modal` | Component | Modal component (from modal template) |
| `DataFetcher` | Component | Data fetching component (from API template) |
| `Counter` | Component | Counter component (from counter template) |

## Best Practices

### 1. Be Specific in Descriptions

```typescript
// Less effective
intent('create a form')

// More effective
intent('create a signup form with email validation')
```

### 2. Use Constraints Wisely

```typescript
// Focus on important requirements
intent('create a data table')
  .must('handle 10,000 rows efficiently')
  .must('support column sorting')
  .should('enable row selection')
  .prefer('virtual scrolling')
```

### 3. Leverage Context

```typescript
intent('add pagination')
  .inContext({
    existingCode: existingListComponent,
    dependencies: ['@philjs/virtual'],
    userPreferences: {
      pageSize: 25,
      showPageNumbers: true
    }
  })
```

### 4. Enable Learning

```typescript
const resolver = new IntentResolver({
  learning: true
});

// When users correct generated code, teach the system
resolver.learn(intent, improvedImplementation);
```

### 5. Cache for Performance

```typescript
initIntent({
  cache: true  // Avoid re-resolving identical intents
});
```

## Compatibility

- Node.js >= 24
- TypeScript 6+
- Requires `@philjs/core` as peer dependency

## License

MIT
