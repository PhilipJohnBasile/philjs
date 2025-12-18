# PhilJS for VS Code

Official VS Code extension for PhilJS - Snippets, IntelliSense, and tooling.

## Installation

Install from the VS Code Marketplace:

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "PhilJS"
4. Click Install

Or install from command line:

```bash
code --install-extension philjs.philjs-vscode
```

## Features

### IntelliSense

Smart code completion for PhilJS APIs:

- Signal creation and methods
- Memo and effect functions
- Router hooks and components
- SSR utilities
- Component props

### Snippets

Quick code generation with intelligent snippets:

| Trigger | Description |
|---------|-------------|
| `psignal` | Create a signal |
| `pmemo` | Create a memo |
| `peffect` | Create an effect |
| `pcomponent` | Create a component |
| `proute` | Create a route component |
| `ploader` | Create a route loader |
| `papi` | Create an API route |
| `pisland` | Create an island component |

### Commands

Access PhilJS commands from the Command Palette (Ctrl+Shift+P / Cmd+Shift+P):

- **PhilJS: Create Component** - Generate a new component
- **PhilJS: Create Route** - Generate a new route
- **PhilJS: Create Page** - Generate a new page
- **PhilJS: Create Hook** - Generate a custom hook
- **PhilJS: Create Store** - Generate a state store
- **PhilJS: Open DevTools** - Open PhilJS DevTools

### Signal Highlighting

Visual indicators for signal usage in your code:

- Signal declarations highlighted
- Signal reads highlighted differently from writes
- Memo and effect dependencies tracked

### Diagnostics

Real-time error detection:

- Unused signals
- Missing effect cleanup
- Invalid signal usage
- Type errors in PhilJS APIs

### Go to Definition

Navigate to signal and component definitions with F12 or Ctrl+Click.

### Hover Information

View documentation and type information on hover.

## Usage

### Creating Components

1. Open Command Palette (Ctrl+Shift+P)
2. Type "PhilJS: Create Component"
3. Enter component name
4. Choose options (TypeScript, with tests, with styles)

Or use the snippet:

```typescript
pcomponent<Tab>
```

Expands to:

```typescript
import { signal } from 'philjs-core';

export function ComponentName() {
  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

### Creating Signals

Type `psignal` and press Tab:

```typescript
const name = signal(initialValue);
```

### Creating Effects

Type `peffect` and press Tab:

```typescript
effect(() => {
  // Effect body

  return () => {
    // Cleanup
  };
});
```

### Creating Routes

1. Command Palette > "PhilJS: Create Route"
2. Enter route name
3. Auto-generates route file with loader

```typescript
// src/routes/users.tsx
import { RouteLoader } from 'philjs-router';

export const loader: RouteLoader = async ({ params, request }) => {
  const users = await fetchUsers();
  return { users };
};

export default function UsersPage({ data }) {
  return (
    <div>
      <h1>Users</h1>
      <ul>
        {data.users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Configuration

Configure the extension in VS Code settings:

```json
{
  // Enable/disable PhilJS IntelliSense
  "philjs.enableIntelliSense": true,

  // Highlight signal usage
  "philjs.signalHighlighting": true,

  // Default directory for components
  "philjs.componentDirectory": "src/components",

  // Default directory for routes
  "philjs.routesDirectory": "src/routes",

  // Format on save with PhilJS formatter
  "philjs.formatOnSave": true,

  // Enable experimental features
  "philjs.experimental": false
}
```

## Snippets Reference

### Core Snippets

**Signal:**
```typescript
psignal<Tab>
// Creates:
const name = signal(initialValue);
```

**Memo:**
```typescript
pmemo<Tab>
// Creates:
const computed = memo(() => {
  return calculation;
});
```

**Effect:**
```typescript
peffect<Tab>
// Creates:
effect(() => {
  // Effect logic

  return () => {
    // Cleanup
  };
});
```

### Component Snippets

**Component:**
```typescript
pcomponent<Tab>
// Creates:
export function ComponentName() {
  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

**Island Component:**
```typescript
pisland<Tab>
// Creates:
import { island } from 'philjs-islands';

export default island(function ComponentName() {
  const state = signal(0);

  return (
    <div>
      {/* Interactive island content */}
    </div>
  );
});
```

### Router Snippets

**Route:**
```typescript
proute<Tab>
// Creates:
export default function RouteName() {
  return (
    <div>
      {/* Route content */}
    </div>
  );
}
```

**Loader:**
```typescript
ploader<Tab>
// Creates:
export const loader: RouteLoader = async ({ params, request }) => {
  // Load data
  return { data };
};
```

**API Route:**
```typescript
papi<Tab>
// Creates:
export async function GET(request: Request) {
  return new Response(JSON.stringify({ data }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

## Keyboard Shortcuts

| Shortcut | Command |
|----------|---------|
| `Ctrl+Shift+C` | Create Component |
| `Ctrl+Shift+R` | Create Route |
| `Ctrl+Shift+H` | Create Hook |
| `F12` | Go to Definition |
| `Shift+F12` | Find References |

## Troubleshooting

### IntelliSense Not Working

1. Ensure TypeScript version >= 5.0
2. Restart VS Code
3. Run "TypeScript: Restart TS Server" from Command Palette

### Snippets Not Triggering

1. Check that snippet suggestions are enabled in settings
2. Verify file extension is .tsx or .ts
3. Try typing trigger and pressing Ctrl+Space

### Commands Not Appearing

1. Ensure extension is activated
2. Check Output panel for errors (Help > Toggle Developer Tools)
3. Reinstall the extension

## Contributing

Found a bug or want to suggest a feature? Open an issue on the [PhilJS repository](https://github.com/philjs/philjs).

## Documentation

For more information about PhilJS, see the [PhilJS documentation](../../docs).

## License

MIT
