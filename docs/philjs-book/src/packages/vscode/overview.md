# @philjs/vscode

Official Visual Studio Code extension for PhilJS development. Provides comprehensive IDE support including IntelliSense, snippets, code generators, diagnostics, and integrated tooling.

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "PhilJS"
4. Click Install

### From VSIX

```bash
code --install-extension philjs-vscode-0.1.0.vsix
```

## Features

### IntelliSense

The extension provides intelligent code completion for all PhilJS APIs:

- **Signal methods**: `.get()`, `.set()`, `.update()`, `.subscribe()`
- **Core primitives**: `signal`, `computed`, `effect`, `memo`
- **Lifecycle hooks**: `onMount`, `onCleanup`, `onError`
- **Context API**: `createContext`, `useContext`
- **Router hooks**: `useNavigate`, `useParams`, `useSearchParams`, `useLoaderData`, `useLocation`
- **SSR utilities**: `renderToString`, `hydrate`
- **Islands**: `island`

```typescript
// Trigger completions with Ctrl+Space
const count = signal(0);
count.  // Shows: get(), set(), update(), subscribe()

// JSX completions with <
<Button  // Shows all PhilJS UI components
```

### Snippets

Quick code generation with snippet prefixes:

| Prefix | Description |
|--------|-------------|
| `psig`, `signal` | Create a signal |
| `pcomp`, `computed` | Create a computed value |
| `peff`, `effect` | Create an effect |
| `peffc`, `effectc` | Effect with cleanup |
| `pmount`, `onmount` | OnMount lifecycle hook |
| `pclean`, `oncleanup` | OnCleanup hook |
| `pfc`, `philcomponent` | Functional component |
| `pfcs`, `philcomponentsignal` | Component with signal state |
| `pmemo`, `philmemo` | Memoized component |
| `pctx`, `philcontext` | Context with provider and hook |
| `phook`, `philhook` | Custom hook |
| `pstore`, `philstore` | State store |
| `proute`, `philroute` | Route with loader |
| `ppage`, `philpage` | Page with SEO meta tags |
| `pisland`, `philisland` | Island component |
| `papi`, `philapi` | API route handlers |
| `ploader`, `philloader` | Route loader |
| `paction`, `philaction` | Form action |
| `perror`, `philerror` | Error boundary |
| `psuspense`, `philsuspense` | Suspense wrapper |
| `pform`, `philform` | Form component |
| `peffa`, `phileffectasync` | Async effect with AbortController |
| `ptest`, `philtest` | Component test |
| `pssr`, `philssr` | SSR component |
| `pmiddleware`, `philmiddleware` | Route middleware |
| `pserver`, `philserver` | Server component |
| `pws`, `philwebsocket` | WebSocket hook |

**Import snippets:**

| Prefix | Description |
|--------|-------------|
| `ipc`, `importphilcore` | Import from @philjs/core |
| `ipr`, `importphilrouter` | Import from philjs-router |
| `ipu`, `importphilui` | Import from philjs-ui |

### Code Generators

Generate boilerplate code through commands:

#### philjs.createComponent

Generates a component with:
- TypeScript interface for props
- Component file with proper structure
- Index file for clean exports
- Test file with basic test cases

```typescript
// Generated: src/components/MyComponent/MyComponent.tsx
import { JSX } from '@philjs/core';

export interface MyComponentProps {
  children?: JSX.Element;
  className?: string;
}

export function MyComponent(props: MyComponentProps) {
  const { children, className = '' } = props;

  return (
    <div className={`mycomponent ${className}`}>
      {children}
    </div>
  );
}
```

#### philjs.createRoute

Generates a route with:
- Route component file
- Loader function for data fetching
- Type-safe loader data access

```typescript
// Generated: src/routes/users/index.tsx
import { JSX } from '@philjs/core';
import { useLoaderData } from 'philjs-router';
import type { loader } from './loader';

export default function UsersRoute() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="users-route">
      <h1>Users</h1>
      {/* Route content */}
    </div>
  );
}
```

#### philjs.createPage

Generates a page with SEO meta tags:

```typescript
// Generated: src/pages/about.tsx
import { JSX } from '@philjs/core';
import { Head, Title, Meta } from 'philjs-meta';

export function AboutPage() {
  return (
    <>
      <Head>
        <Title>About</Title>
        <Meta name="description" content="About page" />
      </Head>

      <main className="about-page">
        <h1>About</h1>
        {/* Page content */}
      </main>
    </>
  );
}

export default AboutPage;
```

#### philjs.createHook

Generates a custom hook with signal-based state:

```typescript
// Generated: src/hooks/useCounter.ts
import { signal } from '@philjs/core';

export function useCounter(initialValue: string = '') {
  const state = signal(initialValue);

  const setValue = (newValue: string) => {
    state.set(newValue);
  };

  return {
    value: state.get(),
    setValue,
  };
}
```

#### philjs.createStore

Generates a state store with actions:

```typescript
// Generated: src/stores/user.ts
import { signal, computed } from '@philjs/core';

interface UserState {
  items: string[];
  loading: boolean;
}

const state = signal<UserState>({
  items: [],
  loading: false,
});

export const userStore = {
  get items() {
    return state.get().items;
  },

  get loading() {
    return state.get().loading;
  },

  itemCount: computed(() => state.get().items.length),

  addItem(item: string) {
    const current = state.get();
    state.set({
      ...current,
      items: [...current.items, item],
    });
  },

  removeItem(item: string) {
    const current = state.get();
    state.set({
      ...current,
      items: current.items.filter(i => i !== item),
    });
  },

  setLoading(loading: boolean) {
    state.set({ ...state.get(), loading });
  },

  reset() {
    state.set({ items: [], loading: false });
  },
};
```

#### philjs.openDevTools

Opens an integrated terminal and starts the PhilJS development server:

```bash
npx philjs dev
```

## Providers

### PhilJSCompletionProvider

Provides intelligent autocompletion for:

- PhilJS core functions and methods
- Signal method completions (`.get()`, `.set()`, `.update()`)
- JSX component completions
- Import statement completions

**Trigger characters**: `.`, `<`, `/`, `"`, `'`

```typescript
// Signal completions
const count = signal(0);
count.get()    // Autocompletes signal methods

// JSX completions
<Button        // Autocompletes UI components
<Link          // Autocompletes router components

// Import completions
import { } from '@philjs/core';  // Autocompletes package names
```

### PhilJSHoverProvider

Shows inline documentation when hovering over PhilJS APIs:

- Function signatures
- Parameter descriptions
- Usage examples
- Links to documentation

```typescript
// Hover over 'signal' to see:
// signal<T>(initialValue: T): Signal<T>
// Creates a reactive signal that triggers updates when its value changes.
//
// Example:
// const count = signal(0);
// count.get(); // 0
// count.set(1); // triggers reactivity
```

**Documented APIs:**
- `signal` - Reactive state primitive
- `computed` - Derived values
- `effect` - Side effects
- `memo` - Component memoization
- `onMount` - Mount lifecycle
- `onCleanup` - Cleanup lifecycle
- `createContext` - Context creation
- `useContext` - Context consumption

### PhilJSDefinitionProvider

Enables "Go to Definition" (F12) for:

- **Component references in JSX**: Jump to component source
- **Signal references**: Jump to signal declaration
- **Import statements**: Navigate to source files

```typescript
// Ctrl+Click or F12 on MyComponent
<MyComponent />  // Jumps to MyComponent.tsx

// Ctrl+Click on count
count.get()  // Jumps to: const count = signal(0);
```

### PhilJSDiagnosticsProvider

Real-time error detection and warnings:

#### Signal Usage Errors

```typescript
// Warning: Signal 'count' should be accessed with .get() for reactivity
const count = signal(0);
return <div>{count}</div>;  // Should be {count.get()}

// Warning: Avoid calling signal.set() directly in render
return (
  <div>{count.set(1)}</div>  // Move to event handler or effect
);
```

#### Effect Issues

```typescript
// Info: Empty effect body
effect(() => {});  // Did you forget the implementation?

// Info: Async effects should handle cleanup
effect(async () => {  // Consider using AbortController
  const data = await fetchData();
});
```

#### Memo Usage

```typescript
// Hint: memo() is unnecessary for components without props
const Component = memo(() => <div>Static</div>);
```

#### Context Errors

```typescript
// Error: useContext should be called inside a component function
const value = useContext(ThemeContext);  // Move inside component
```

### PhilJSSignatureHelpProvider

Shows parameter hints while typing function calls:

```typescript
signal(|)           // Shows: signal<T>(initialValue: T): Signal<T>
computed(|)         // Shows: computed<T>(fn: () => T): Computed<T>
effect(|)           // Shows: effect(fn: () => void | (() => void)): void
memo(|)             // Shows: memo<P>(component: Component<P>, equals?: ...): Component<P>
renderToString(|)   // Shows: renderToString(element: JSX.Element, options?: SSROptions): Promise<string>
island(|)           // Shows: island<P>(component: Component<P>, options?: IslandOptions): Component<P>
```

### PhilJSCodeActionsProvider

Quick fixes and refactoring actions:

#### Quick Fixes

- **Add .get() to signal access**: Auto-fix signal usage in JSX
- **Add cleanup function to effect**: Add return statement with cleanup
- **Import from package**: Add missing imports

```typescript
// Quick fix available: Add .get() to signal access
{count}  // Ctrl+. to fix to {count.get()}

// Quick fix available: Import from '@philjs/core'
signal(0)  // Ctrl+. to add import statement
```

#### Refactoring Actions

- **Extract to signal**: Convert a value to a signal
- **Wrap component in memo()**: Add memoization
- **Convert to island component**: Make component an island

### PhilJSFormattingProvider

Code formatting for PhilJS patterns:

- Consistent signal declaration formatting
- JSX expression formatting with `.get()` calls
- Effect block formatting

## Configuration

Configure the extension in VS Code settings:

```json
{
  "philjs.enableIntelliSense": true,
  "philjs.signalHighlighting": true,
  "philjs.componentDirectory": "src/components",
  "philjs.routesDirectory": "src/routes"
}
```

### Settings Reference

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `philjs.enableIntelliSense` | boolean | `true` | Enable PhilJS IntelliSense features |
| `philjs.signalHighlighting` | boolean | `true` | Highlight signal usage in code |
| `philjs.componentDirectory` | string | `"src/components"` | Default directory for generated components |
| `philjs.routesDirectory` | string | `"src/routes"` | Default directory for generated routes |

## Commands

Access commands via Command Palette (Ctrl+Shift+P / Cmd+Shift+P):

| Command | Description |
|---------|-------------|
| `PhilJS: Create Component` | Generate a new component with tests |
| `PhilJS: Create Route` | Generate a route with loader |
| `PhilJS: Create Page` | Generate a page with SEO meta |
| `PhilJS: Create Hook` | Generate a custom hook |
| `PhilJS: Create Store` | Generate a state store |
| `PhilJS: Open DevTools` | Start development server |

Click the PhilJS status bar item to access a quick pick menu with all commands.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Space` | Trigger IntelliSense completions |
| `Ctrl+.` | Show quick fixes and refactorings |
| `F12` | Go to definition |
| `Alt+F12` | Peek definition |
| `Shift+F12` | Find all references |
| `F2` | Rename symbol |

## Status Bar

The extension adds a status bar item showing:

- PhilJS activation status
- Signal count in the current file
- Quick access to PhilJS commands

The status bar is visible only when editing PhilJS files (files importing from `@philjs/core`, `philjs-router`, or `philjs-ssr`).

## Language Support

The extension activates for:

- TypeScript (`.ts`)
- TypeScript React (`.tsx`)
- JavaScript (`.js`)
- JavaScript React (`.jsx`)

## Snippet Examples

### Component with Signal State

Type `pfcs` and press Tab:

```typescript
import { JSX, signal } from '@philjs/core';

export function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Value: {count.get()}</p>
      <button onClick={() => count.update(n => n + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### Context with Provider

Type `pctx` and press Tab:

```typescript
import { createContext, useContext, JSX } from '@philjs/core';

interface ThemeValue {
  mode: string;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider(props: { children: JSX.Element }) {
  const value: ThemeValue = {
    mode: 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {props.children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

### Async Effect with Cleanup

Type `peffa` and press Tab:

```typescript
effect(() => {
  const controller = new AbortController();

  (async () => {
    try {
      const data = await fetch('/api/data', { signal: controller.signal });
      // Handle data
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(error);
      }
    }
  })();

  return () => {
    controller.abort();
  };
});
```

### Island Component

Type `pisland` and press Tab:

```typescript
import { JSX, signal } from '@philjs/core';
import { island } from 'philjs-islands';

export default island(function InteractiveCounter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count.get()}</p>
      <button onClick={() => count.update(n => n + 1)}>
        Increment
      </button>
    </div>
  );
});
```

## Troubleshooting

### IntelliSense Not Working

1. Ensure the file imports from a PhilJS package
2. Check that `philjs.enableIntelliSense` is enabled
3. Reload VS Code window (Ctrl+Shift+P > "Reload Window")

### Snippets Not Appearing

1. Start typing the prefix (e.g., `psig`)
2. Press Ctrl+Space to trigger suggestions
3. Check that the file language is TypeScript/JavaScript

### Diagnostics Not Showing

1. Ensure the file contains PhilJS imports
2. Check the Problems panel (Ctrl+Shift+M)
3. Verify diagnostics are enabled in settings

## Related Packages

- [@philjs/core](../core/overview.md) - Core reactive primitives
- [@philjs/router](../router/overview.md) - File-based routing
- [@philjs/ssr](../ssr/overview.md) - Server-side rendering
- [@philjs/testing](../testing/overview.md) - Testing utilities
