# Component Rendering

The `@philjs/testing` package provides a powerful `render` function for rendering PhilJS components in a test environment. This chapter covers all rendering APIs and options.

## Basic Rendering

### The render Function

The `render` function mounts a PhilJS component into a DOM container for testing:

```typescript
import { render, cleanup } from '@philjs/testing';
import { Counter } from './Counter';

describe('Counter', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders correctly', () => {
    const result = render(<Counter initialValue={0} />);

    // Access the container
    expect(result.container.textContent).toContain('0');
  });
});
```

### Render Result

The `render` function returns a `RenderResult` object with the following properties and methods:

```typescript
interface RenderResult {
  // DOM references
  container: HTMLElement;     // The rendered container element
  baseElement: HTMLElement;   // The base element (default: document.body)

  // Methods
  debug: (el?: HTMLElement) => void;  // Print DOM to console
  rerender: (ui: any) => void;        // Re-render with new JSX
  unmount: () => void;                // Unmount the component
  asFragment: () => DocumentFragment; // Get DOM as fragment

  // Bound queries (see Queries chapter)
  getByRole: (role: string, options?: {}) => HTMLElement;
  getByText: (text: string | RegExp, options?: {}) => HTMLElement;
  getByTestId: (testId: string) => HTMLElement;
  // ... all @testing-library/dom queries
}
```

### Example: Using Render Result

```typescript
import { render } from '@philjs/testing';
import { TodoList } from './TodoList';

it('displays todos and allows interaction', () => {
  const { container, getByRole, getByText, rerender, unmount, debug } = render(
    <TodoList todos={['Buy milk', 'Walk dog']} />
  );

  // Check initial render
  expect(container.querySelectorAll('li')).toHaveLength(2);
  expect(getByText('Buy milk')).toBeInTheDocument();

  // Debug output (helpful for development)
  debug(); // Prints: <div>...</div>

  // Re-render with new props
  rerender(<TodoList todos={['Buy milk', 'Walk dog', 'Read book']} />);
  expect(container.querySelectorAll('li')).toHaveLength(3);

  // Cleanup
  unmount();
});
```

## Render Options

### Custom Container

By default, `render` creates a new `<div>` element and appends it to `document.body`. You can provide a custom container:

```typescript
import { render } from '@philjs/testing';

// Create custom container
const container = document.createElement('section');
container.id = 'app';
document.body.appendChild(container);

const result = render(<App />, { container });

// Component is rendered inside the custom container
expect(result.container).toBe(container);
expect(result.container.id).toBe('app');
```

### Base Element

The `baseElement` option sets the root element for queries. This is useful when testing portals or modals:

```typescript
import { render, screen } from '@philjs/testing';

const result = render(<Modal isOpen={true} />, {
  baseElement: document.body,
});

// Queries can find elements in portals
expect(screen.getByRole('dialog')).toBeInTheDocument();
```

### Wrapper Component

Use the `wrapper` option to wrap your component with providers:

```typescript
import { render } from '@philjs/testing';
import { ThemeProvider } from '@philjs/theme';
import { AuthProvider } from '@philjs/auth';
import { Button } from './Button';

// Single wrapper
const { getByRole } = render(<Button>Click me</Button>, {
  wrapper: ({ children }) => (
    <ThemeProvider theme="dark">{children}</ThemeProvider>
  ),
});

// Multiple wrappers
const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <ThemeProvider theme="dark">
      {children}
    </ThemeProvider>
  </AuthProvider>
);

const { getByRole } = render(<Button>Click me</Button>, {
  wrapper: AllProviders,
});
```

### Hydration Mode

For testing server-rendered content, use the `hydrate` option:

```typescript
import { render } from '@philjs/testing';

// Pre-render HTML (simulating SSR)
const container = document.createElement('div');
container.innerHTML = '<button>Click me</button>';

// Hydrate instead of render
const result = render(<Button>Click me</Button>, {
  container,
  hydrate: true,
});

// Component hydrates the existing DOM
expect(result.getByRole('button')).toHaveTextContent('Click me');
```

## Re-rendering

### Updating Props

Use `rerender` to update a component with new props:

```typescript
import { render } from '@philjs/testing';
import { UserProfile } from './UserProfile';

it('updates when user changes', () => {
  const { getByText, rerender } = render(
    <UserProfile user={{ name: 'John', age: 30 }} />
  );

  expect(getByText('John')).toBeInTheDocument();
  expect(getByText('30')).toBeInTheDocument();

  // Re-render with new props
  rerender(<UserProfile user={{ name: 'Jane', age: 25 }} />);

  expect(getByText('Jane')).toBeInTheDocument();
  expect(getByText('25')).toBeInTheDocument();
});
```

### Partial Re-render

The component maintains its state between re-renders:

```typescript
import { render, fireEvent } from '@philjs/testing';
import { Counter } from './Counter';

it('preserves state across re-renders', () => {
  const { getByText, getByRole, rerender } = render(
    <Counter step={1} />
  );

  // Increment twice
  const button = getByRole('button', { name: 'Increment' });
  fireEvent.click(button);
  fireEvent.click(button);
  expect(getByText('2')).toBeInTheDocument();

  // Re-render with different step
  rerender(<Counter step={5} />);

  // State is preserved, but step changes
  expect(getByText('2')).toBeInTheDocument();

  // New increment uses new step
  fireEvent.click(button);
  expect(getByText('7')).toBeInTheDocument();
});
```

## Cleanup

### Automatic Cleanup

When using the Vitest or Jest setup files, cleanup happens automatically after each test:

```typescript
// test/setup.ts
import '@philjs/testing/vitest'; // or '@philjs/testing/jest'

// No need to call cleanup() in tests - it's automatic!
```

### Manual Cleanup

If not using the setup files, call `cleanup()` manually:

```typescript
import { render, cleanup } from '@philjs/testing';

describe('MyComponent', () => {
  afterEach(() => {
    cleanup();
  });

  it('test 1', () => {
    render(<MyComponent />);
    // ...
  });

  it('test 2', () => {
    render(<MyComponent />);
    // ...
  });
});
```

### What Cleanup Does

`cleanup()` performs the following actions:

1. Unmounts all rendered components
2. Removes all test containers from the DOM
3. Clears the internal mounted containers registry

```typescript
import { render, cleanup } from '@philjs/testing';

// Render multiple components
render(<Component1 />);
render(<Component2 />);
render(<Component3 />);

// cleanup() unmounts all three
cleanup();
```

## Document Fragment

### Getting a Fragment

Use `asFragment()` to get the rendered content as a `DocumentFragment`:

```typescript
import { render } from '@philjs/testing';
import { Card } from './Card';

it('matches snapshot', () => {
  const { asFragment } = render(
    <Card title="Hello" content="World" />
  );

  expect(asFragment()).toMatchSnapshot();
});
```

### Comparing Snapshots

Fragments are useful for comparing DOM structures:

```typescript
import { render } from '@philjs/testing';

it('renders consistently', () => {
  const { asFragment, rerender } = render(<Toggle on={false} />);

  const before = asFragment();

  rerender(<Toggle on={true} />);

  const after = asFragment();

  // Fragments are different
  expect(before).not.toEqual(after);
});
```

## Debug Utilities

### debug() Method

The `debug()` method prints the current DOM to the console:

```typescript
import { render } from '@philjs/testing';

it('helps debug rendering', () => {
  const { debug, container, getByRole } = render(<ComplexForm />);

  // Print entire container
  debug();

  // Print specific element
  debug(getByRole('form'));

  // Print with max length
  debug(container, { maxLength: 5000 });
});
```

### Example Debug Output

```
--- Debug Output ---
<div>
  <form>
    <label for="email">Email</label>
    <input id="email" type="email" />
    <label for="password">Password</label>
    <input id="password" type="password" />
    <button type="submit">
      Sign In
    </button>
  </form>
</div>
--------------------
```

## Testing with Signals

### Rendering Signal-Bound Components

PhilJS signals integrate seamlessly with the render function:

```typescript
import { render, fireEvent, waitFor } from '@philjs/testing';
import { signal } from '@philjs/core';

function Counter() {
  const count = signal(0);

  return (
    <div>
      <span data-testid="count">{count()}</span>
      <button onClick={() => count.set(count() + 1)}>
        Increment
      </button>
    </div>
  );
}

it('updates signal and re-renders', async () => {
  const { getByTestId, getByRole } = render(<Counter />);

  expect(getByTestId('count')).toHaveTextContent('0');

  fireEvent.click(getByRole('button'));

  await waitFor(() => {
    expect(getByTestId('count')).toHaveTextContent('1');
  });
});
```

### Testing External Signals

Test components that receive signals as props:

```typescript
import { render, waitFor } from '@philjs/testing';
import { signal } from '@philjs/core';
import { Display } from './Display';

it('reacts to external signal changes', async () => {
  const value = signal('initial');

  const { getByText } = render(<Display value={value} />);

  expect(getByText('initial')).toBeInTheDocument();

  // Update signal externally
  value.set('updated');

  await waitFor(() => {
    expect(getByText('updated')).toBeInTheDocument();
  });
});
```

## Common Patterns

### Testing Lists

```typescript
import { render } from '@philjs/testing';

it('renders a list of items', () => {
  const items = ['Apple', 'Banana', 'Cherry'];

  const { getAllByRole, container } = render(
    <ul>
      {items.map(item => <li key={item}>{item}</li>)}
    </ul>
  );

  const listItems = getAllByRole('listitem');
  expect(listItems).toHaveLength(3);
  expect(listItems[0]).toHaveTextContent('Apple');
});
```

### Testing Conditional Rendering

```typescript
import { render, fireEvent } from '@philjs/testing';

it('conditionally renders content', () => {
  const { getByRole, queryByText, rerender } = render(
    <ExpandableSection expanded={false} title="Details">
      Secret content
    </ExpandableSection>
  );

  // Content is hidden initially
  expect(queryByText('Secret content')).not.toBeInTheDocument();

  // Expand
  rerender(
    <ExpandableSection expanded={true} title="Details">
      Secret content
    </ExpandableSection>
  );

  expect(queryByText('Secret content')).toBeInTheDocument();
});
```

### Testing Forms

```typescript
import { render, fireEvent } from '@philjs/testing';

it('handles form submission', () => {
  const handleSubmit = vi.fn();

  const { getByLabelText, getByRole } = render(
    <LoginForm onSubmit={handleSubmit} />
  );

  fireEvent.change(getByLabelText('Email'), {
    target: { value: 'test@example.com' },
  });

  fireEvent.change(getByLabelText('Password'), {
    target: { value: 'secret123' },
  });

  fireEvent.click(getByRole('button', { name: 'Sign In' }));

  expect(handleSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'secret123',
  });
});
```

## Best Practices

### 1. One Render Per Test

Keep each test focused with a single render:

```typescript
// Good
it('displays the title', () => {
  const { getByRole } = render(<Card title="Hello" />);
  expect(getByRole('heading')).toHaveTextContent('Hello');
});

it('displays the content', () => {
  const { getByText } = render(<Card content="World" />);
  expect(getByText('World')).toBeInTheDocument();
});

// Avoid
it('displays title and content', () => {
  const { getByRole, getByText, rerender } = render(<Card title="Hello" />);
  expect(getByRole('heading')).toHaveTextContent('Hello');

  rerender(<Card content="World" />);
  expect(getByText('World')).toBeInTheDocument();
});
```

### 2. Use Accessible Queries

Prefer queries that reflect how users interact with your app:

```typescript
// Best - uses accessible role
getByRole('button', { name: 'Submit' });

// Good - uses visible text
getByText('Submit');

// Acceptable - uses label
getByLabelText('Email address');

// Last resort - uses test ID
getByTestId('submit-button');
```

### 3. Clean Up State

Ensure tests don't affect each other:

```typescript
describe('MyComponent', () => {
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = vi.fn();
  });

  afterEach(() => {
    cleanup();
    console.error = originalConsoleError;
  });

  // Tests...
});
```

### 4. Avoid Implementation Details

Test behavior, not internal structure:

```typescript
// Good - tests user-visible behavior
it('shows error on invalid email', async () => {
  const { getByLabelText, getByText } = render(<EmailForm />);

  fireEvent.change(getByLabelText('Email'), {
    target: { value: 'invalid-email' },
  });
  fireEvent.blur(getByLabelText('Email'));

  expect(getByText('Please enter a valid email')).toBeInTheDocument();
});

// Avoid - tests internal state
it('sets hasError to true', () => {
  const { container } = render(<EmailForm />);
  // Don't check internal state variables
});
```

## API Reference

### render(ui, options?)

Renders a component for testing.

**Parameters:**
- `ui` - The JSX element to render
- `options` - Optional configuration object
  - `container` - Custom container element
  - `baseElement` - Base element for queries
  - `wrapper` - Wrapper component for providers
  - `hydrate` - Use hydration instead of render

**Returns:** `RenderResult`

### cleanup()

Unmounts all rendered components and removes containers from the DOM.

### RenderResult

The object returned by `render()`:

| Property/Method | Description |
|----------------|-------------|
| `container` | The rendered container element |
| `baseElement` | The base element (document.body by default) |
| `debug(el?)` | Print DOM to console |
| `rerender(ui)` | Re-render with new JSX |
| `unmount()` | Unmount the component |
| `asFragment()` | Get DOM as DocumentFragment |
| `getBy*` | Queries that throw if not found |
| `queryBy*` | Queries that return null if not found |
| `findBy*` | Async queries that wait for element |

## Next Steps

- [Queries](./queries.md) - Learn about all available query methods
- [Events](./events.md) - Simulate user interactions
- [Async Utilities](./async.md) - Handle asynchronous testing
