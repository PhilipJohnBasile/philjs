# PhilJS for VS Code

> Official VS Code extension for PhilJS - IntelliSense, debugging, and code generation for the modern reactive framework.

[![Version](https://img.shields.io/visual-studio-marketplace/v/philjs.philjs-vscode)](https://marketplace.visualstudio.com/items?itemName=philjs.philjs-vscode)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/philjs.philjs-vscode)](https://marketplace.visualstudio.com/items?itemName=philjs.philjs-vscode)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/philjs.philjs-vscode)](https://marketplace.visualstudio.com/items?itemName=philjs.philjs-vscode)

Transform your PhilJS development experience with comprehensive IDE support, smart code completion, real-time diagnostics, and powerful code generation tools.

## Features

### IntelliSense

**Smart Auto-Completion**

Get intelligent suggestions for all PhilJS APIs as you type:

![Completion Demo](images/completion-demo.gif)

- Core primitives: `signal()`, `computed()`, `effect()`
- Lifecycle hooks: `onMount()`, `onCleanup()`, `onError()`
- Router hooks: `useNavigate()`, `useParams()`, `useLoaderData()`
- SSR functions: `renderToString()`, `hydrate()`
- Island components: `island()`
- JSX components: `Link`, `Route`, `Button`, `Input`, and more

**Rich Hover Documentation**

Hover over any PhilJS function to see detailed documentation:

![Hover Demo](images/hover-demo.gif)

- Function signatures with types
- Parameter descriptions
- Usage examples
- Links to official documentation

**Parameter Hints**

Get real-time parameter information as you type:

![Signature Demo](images/signature-demo.gif)

```typescript
signal(|)  // Shows: initialValue: T
effect(|)  // Shows: fn: () => void | (() => void)
```

### Real-Time Diagnostics

Catch mistakes before runtime with intelligent error detection:

![Diagnostics Demo](images/diagnostics-demo.gif)

**Common Issues Detected:**
- Signal access without `.get()` in JSX
- Signal mutations directly in render
- Empty effect bodies
- Async effects without cleanup
- Unnecessary `memo()` usage
- `useContext()` outside components

### Code Actions & Quick Fixes

One-click solutions for common problems:

![Code Actions Demo](images/code-actions-demo.gif)

**Quick Fixes:**
- Add `.get()` to signal access
- Add effect cleanup function
- Add missing imports
- Fix signal patterns

**Refactorings:**
- Extract value to signal
- Wrap component in `memo()`
- Convert to island component
- Add error boundary

### Code Generation

Generate complete, production-ready code with one command:

![Generator Demo](images/generator-demo.gif)

**Generators:**
- **Component**: Full component with props, types, and tests
- **Route**: Route component with loader
- **Page**: Page with SEO meta tags
- **Hook**: Custom hook with signals
- **Store**: State store with actions

Example generated component:
```typescript
/**
 * UserProfile Component
 */

import { JSX } from 'philjs-core';

export interface UserProfileProps {
  children?: JSX.Element;
  className?: string;
}

export function UserProfile(props: UserProfileProps) {
  const { children, className = '' } = props;

  return (
    <div className={`user-profile ${className}`}>
      {children}
    </div>
  );
}
```

### 30+ Code Snippets

Instant boilerplate for common patterns:

![Snippets Demo](images/snippets-demo.gif)

**Core Snippets:**
- `psig` → Signal creation
- `pcomp` → Computed value
- `peff` → Effect
- `peffc` → Effect with cleanup

**Component Snippets:**
- `pfc` → Functional component
- `pfcs` → Component with signal
- `pmemo` → Memoized component
- `pctx` → Context provider

**Router Snippets:**
- `proute` → Route component
- `ploader` → Route loader
- `papi` → API route

**Advanced Snippets:**
- `pisland` → Island component
- `pform` → Form component
- `perror` → Error boundary
- `ptest` → Component test

[View all snippets →](INSTALLATION.md#snippets-reference)

### Go to Definition

Navigate your codebase with ease:

- Jump to component definitions (F12)
- Find signal declarations
- Resolve imports
- Find all references (Shift+F12)

### Status Bar Integration

See PhilJS info at a glance:

![Status Bar](images/status-bar.png)

- Signal count in current file
- Click for quick command access
- Real-time updates

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Press `Ctrl+Shift+X` (or `Cmd+Shift+X` on Mac)
3. Search for "PhilJS"
4. Click Install

### From Command Line

```bash
code --install-extension philjs.philjs-vscode
```

## Quick Start

### 1. Create Your First Component

Press `Ctrl+Shift+C` (or `Cmd+Shift+C` on Mac):

```typescript
import { JSX, signal } from 'philjs-core';

export function Counter() {
  const count = signal(0);

  return (
    <div>
      <p>Count: {count.get()}</p>
      <button onClick={() => count.update(n => n + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### 2. Use IntelliSense

Start typing and press `Ctrl+Space`:

```typescript
import { sig|  // Auto-complete shows signal, Signal<T>

const count = signal(0);
count.|  // Shows: get(), set(), update(), subscribe()
```

### 3. Use Snippets

Type a prefix and press `Tab`:

```typescript
pfc<Tab>  // Expands to full component
psig<Tab>  // Expands to signal creation
peff<Tab>  // Expands to effect with cleanup
```

### 4. Get Quick Fixes

When you see a warning, press `Ctrl+.` (or `Cmd+.`):

```tsx
// Warning: Signal needs .get()
<div>{count}</div>

// Press Ctrl+. → "Add .get() to signal access"
<div>{count.get()}</div>
```

## Commands

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command | Description | Shortcut |
|---------|-------------|----------|
| PhilJS: Create Component | Generate new component | `Ctrl+Shift+C` |
| PhilJS: Create Route | Generate new route | `Ctrl+Shift+R` |
| PhilJS: Create Page | Generate new page | - |
| PhilJS: Create Hook | Generate custom hook | - |
| PhilJS: Create Store | Generate state store | - |
| PhilJS: Show Commands | Quick command menu | - |

## Configuration

Customize the extension in VS Code settings:

```json
{
  // Enable/disable IntelliSense
  "philjs.enableIntelliSense": true,

  // Enable real-time diagnostics
  "philjs.enableDiagnostics": true,

  // Highlight signal usage
  "philjs.signalHighlighting": true,

  // Default component directory
  "philjs.componentDirectory": "src/components",

  // Default routes directory
  "philjs.routesDirectory": "src/routes",

  // Format on save
  "philjs.formatOnSave": false,

  // Auto-import missing modules
  "philjs.autoImport": true
}
```

## Examples

### Creating a Form with Signals

```typescript
import { JSX, signal } from 'philjs-core';

export function ContactForm() {
  const formData = signal({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    await submitForm(formData.get());
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Name"
        value={formData.get().name}
        onInput={(e) =>
          formData.update((prev) => ({
            ...prev,
            name: e.target.value,
          }))
        }
      />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Creating a Route with Loader

Use `Ctrl+Shift+R` or `proute<Tab>`:

```typescript
import { JSX } from 'philjs-core';
import { useLoaderData } from 'philjs-router';

export async function loader({ params }) {
  const user = await fetchUser(params.id);
  return { user };
}

export default function UserProfile() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}
```

### Creating an Island Component

Use `pisland<Tab>`:

```typescript
import { JSX, signal } from 'philjs-core';
import { island } from 'philjs-islands';

export default island(function LikeButton() {
  const likes = signal(0);
  const liked = signal(false);

  const toggleLike = () => {
    if (liked.get()) {
      likes.update((n) => n - 1);
      liked.set(false);
    } else {
      likes.update((n) => n + 1);
      liked.set(true);
    }
  };

  return (
    <button onClick={toggleLike} className={liked.get() ? 'liked' : ''}>
      ❤️ {likes.get()}
    </button>
  );
});
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+C` | Create Component |
| `Ctrl+Shift+R` | Create Route |
| `Ctrl+.` | Quick Fix / Code Action |
| `F12` | Go to Definition |
| `Shift+F12` | Find All References |
| `Ctrl+Space` | Trigger Suggestions |

## Troubleshooting

### IntelliSense Not Working

1. Ensure TypeScript version >= 5.0: `tsc --version`
2. Restart TS Server: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"
3. Check extension is active: Look for PhilJS icon in status bar

### Snippets Not Triggering

1. Ensure file extension is `.tsx`, `.ts`, `.jsx`, or `.js`
2. Check settings: `Editor > Suggest > Snippets` should be enabled
3. Try `Ctrl+Space` to manually trigger

### Diagnostics Not Showing

1. Enable in settings: `"philjs.enableDiagnostics": true`
2. Check Problems panel: `Ctrl+Shift+M`
3. Ensure file imports PhilJS modules

## Contributing

We welcome contributions! See [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## Documentation

- [Installation Guide](INSTALLATION.md) - Detailed setup and usage
- [Development Guide](DEVELOPMENT.md) - For extension developers
- [PhilJS Docs](https://philjs.dev/docs) - Framework documentation

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release history.

## Support

- [GitHub Issues](https://github.com/philjs/philjs/issues)
- [Discord Community](https://discord.gg/philjs)
- [Documentation](https://philjs.dev/docs)

## License

MIT - see [LICENSE](../../LICENSE)

---

**Enjoy building with PhilJS!** 🚀

Made with ❤️ by the PhilJS team
