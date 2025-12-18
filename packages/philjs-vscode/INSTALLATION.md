# PhilJS VS Code Extension - Installation & Usage Guide

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "PhilJS"
4. Click "Install"

### From Command Line

```bash
code --install-extension philjs.philjs-vscode
```

### From VSIX File

```bash
code --install-extension philjs-vscode-1.0.0.vsix
```

## Quick Start

### 1. Create a New Component

**Method 1: Command Palette**
```
Ctrl+Shift+P (Cmd+Shift+P on Mac)
Type: PhilJS: Create Component
Enter component name: MyComponent
```

**Method 2: Keyboard Shortcut**
```
Ctrl+Shift+C (Cmd+Shift+C on Mac)
```

**Method 3: Snippet**
```typescript
pfc<Tab>
```

### 2. Use Snippets

Type a snippet prefix and press Tab:

```typescript
// Signal
psig<Tab>
// Expands to:
const name = signal(initialValue);

// Component with Signal
pfcs<Tab>
// Expands to full component with signal state

// Effect with Cleanup
peffc<Tab>
// Expands to effect with cleanup function

// Route
proute<Tab>
// Expands to route component with loader
```

### 3. IntelliSense

Start typing PhilJS APIs and press Ctrl+Space for completions:

```typescript
import { sig|  // Press Ctrl+Space
// Shows: signal, Signal<T>

const count = signal(0);
count.|  // Press Ctrl+Space
// Shows: get(), set(), update(), subscribe()
```

### 4. Quick Fixes

The extension provides automatic fixes for common issues:

**Problem**: Signal used without .get() in JSX
```tsx
<div>{count}</div>  // Warning: Add .get()
```

**Solution**: Click the lightbulb or press Ctrl+. (Cmd+.)
```tsx
<div>{count.get()}</div>  // Fixed!
```

## Features Guide

### Code Completion

The extension provides intelligent completions for:

**Core APIs**
- `signal()` - Create reactive signal
- `computed()` - Derived values
- `effect()` - Side effects
- `memo()` - Memoize components

**Router APIs**
- `useNavigate()` - Navigate programmatically
- `useParams()` - Get route parameters
- `useLoaderData()` - Get loader data
- `Link` - Navigation component

**SSR APIs**
- `renderToString()` - Server-side rendering
- `hydrate()` - Client-side hydration

**Island APIs**
- `island()` - Create island component

### Hover Documentation

Hover over any PhilJS function to see:
- Function signature
- Parameter types
- Usage example
- Link to documentation

```typescript
const count = signal(0);
//          ^ Hover here for documentation
```

### Signature Help

Get parameter hints while typing:

```typescript
signal(|)  // Shows: initialValue: T
effect(|)  // Shows: fn: () => void | (() => void)
```

### Go to Definition

Jump to definitions with F12 or Ctrl+Click:

```typescript
const MyComponent = () => { /* ... */ };

// In another file:
<MyComponent />  // F12 jumps to definition
```

### Diagnostics

Real-time error detection:

**Signal Access**
```tsx
// ❌ Warning
<div>{count}</div>

// ✅ Correct
<div>{count.get()}</div>
```

**Effect Cleanup**
```typescript
// ℹ️ Info: Consider adding cleanup
effect(async () => {
  await fetchData();
});

// ✅ Better
effect(() => {
  const controller = new AbortController();
  // ...
  return () => controller.abort();
});
```

### Code Actions

Right-click to access refactoring options:

**Extract to Signal**
1. Select a value
2. Right-click > PhilJS Refactor > Extract to Signal
3. Enter signal name

```typescript
// Before
const value = calculateExpensiveValue();

// After
const value = signal(calculateExpensiveValue());
```

**Wrap in memo()**
1. Place cursor on component
2. Right-click > PhilJS Refactor > Wrap in memo()

```typescript
// Before
export function MyComponent(props) { /* ... */ }

// After
export const MyComponent = memo((props) => { /* ... */ });
```

### Code Generators

Generate complete files with proper structure:

**Component Generator**
```
Command: PhilJS: Create Component
Name: UserProfile

Creates:
src/components/UserProfile/
  ├── UserProfile.tsx     # Component
  ├── UserProfile.test.tsx # Tests
  └── index.ts             # Exports
```

**Route Generator**
```
Command: PhilJS: Create Route
Name: users

Creates:
src/routes/users/
  ├── index.tsx    # Route component
  └── loader.ts    # Data loader
```

**Store Generator**
```
Command: PhilJS: Create Store
Name: user

Creates:
src/stores/user.ts  # Complete store with actions
```

## Configuration

### Settings

Open VS Code settings and search for "PhilJS":

```json
{
  // Enable/disable IntelliSense
  "philjs.enableIntelliSense": true,

  // Highlight signal usage
  "philjs.signalHighlighting": true,

  // Component directory
  "philjs.componentDirectory": "src/components",

  // Routes directory
  "philjs.routesDirectory": "src/routes",

  // Format on save
  "philjs.formatOnSave": false,

  // Auto-import
  "philjs.autoImport": true
}
```

### Keyboard Shortcuts

Default shortcuts:

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+C` | Create Component |
| `Ctrl+Shift+R` | Create Route |
| `Ctrl+.` | Quick Fix |
| `F12` | Go to Definition |
| `Shift+F12` | Find All References |

Customize in: File > Preferences > Keyboard Shortcuts

## Snippets Reference

### Core Snippets

| Prefix | Description |
|--------|-------------|
| `psig` | Signal |
| `pcomp` | Computed |
| `peff` | Effect |
| `peffc` | Effect with cleanup |
| `pmount` | onMount |
| `pclean` | onCleanup |

### Component Snippets

| Prefix | Description |
|--------|-------------|
| `pfc` | Functional component |
| `pfcs` | Component with signal |
| `pmemo` | Memoized component |
| `pctx` | Context provider |
| `phook` | Custom hook |

### Router Snippets

| Prefix | Description |
|--------|-------------|
| `proute` | Route component |
| `ploader` | Route loader |
| `paction` | Form action |
| `papi` | API route |

### Advanced Snippets

| Prefix | Description |
|--------|-------------|
| `pisland` | Island component |
| `pform` | Form component |
| `perror` | Error boundary |
| `psuspense` | Suspense component |
| `ptest` | Component test |

## Troubleshooting

### IntelliSense Not Working

**Check TypeScript Version**
```bash
tsc --version  # Should be >= 5.0
```

**Restart TS Server**
```
Ctrl+Shift+P > TypeScript: Restart TS Server
```

**Verify Extension is Active**
```
Ctrl+Shift+P > Developer: Show Running Extensions
Look for "PhilJS"
```

### Snippets Not Triggering

1. Ensure file extension is `.tsx`, `.ts`, `.jsx`, or `.js`
2. Check Editor > Suggest > Snippets in settings
3. Try Ctrl+Space to manually trigger

### Commands Not Appearing

1. Reload VS Code window
2. Check Output > Log (Extension Host) for errors
3. Reinstall extension if necessary

### Diagnostics Not Showing

1. Ensure `philjs.enableDiagnostics` is true
2. Check Problems panel (Ctrl+Shift+M)
3. Verify file contains PhilJS imports

## Tips & Tricks

### Productivity Boosters

**1. Use Snippet Prefixes**
```typescript
// Instead of typing everything
pfc<Tab>
// Instant component template
```

**2. Quick Imports**
```typescript
signal  // Undefined? Press Ctrl+.
// Auto-adds: import { signal } from 'philjs-core';
```

**3. Status Bar**
Click the PhilJS icon in status bar for quick access to commands.

**4. Multi-cursor Editing**
Create multiple signals at once:
```typescript
Ctrl+D to select next occurrence
psig<Tab> to create signals for all
```

### Advanced Usage

**Custom Component Template**

1. Create snippet in User Snippets
2. Use PhilJS base snippets as starting point
3. Customize for your project needs

**Workspace Settings**

Create `.vscode/settings.json` in project:
```json
{
  "philjs.componentDirectory": "app/components",
  "philjs.routesDirectory": "app/routes"
}
```

**Multi-root Workspaces**

Extension works across multiple roots:
- Settings can be per-root
- Generators respect root context

## Examples

### Creating a Counter Component

1. `Ctrl+Shift+C` to create component
2. Name: `Counter`
3. Generated file:

```typescript
import { JSX, signal } from 'philjs-core';

export interface CounterProps {
  children?: JSX.Element;
  className?: string;
}

export function Counter(props: CounterProps) {
  const { children, className = '' } = props;

  return (
    <div className={`counter ${className}`}>
      {children}
    </div>
  );
}
```

4. Add signal with `psig<Tab>`:

```typescript
const count = signal(0);
```

5. Use with auto-completion:

```typescript
<button onClick={() => count.update(n => n + 1)}>
  Count: {count.get()}
</button>
```

### Creating a Route with Loader

1. `Ctrl+Shift+R` to create route
2. Name: `users`
3. Modify loader:

```typescript
export async function loader() {
  const users = await fetchUsers();
  return { users };
}
```

4. Use in component:

```typescript
export default function UsersRoute() {
  const data = useLoaderData<typeof loader>();

  return (
    <div>
      {data.users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

## Getting Help

- Documentation: https://philjs.dev/docs
- GitHub Issues: https://github.com/philjs/philjs/issues
- Discord: https://discord.gg/philjs

## Updates

The extension auto-updates from the VS Code Marketplace.

To check for updates manually:
```
Extensions > PhilJS > Update
```

## Feedback

Help improve the extension:

- Report bugs on GitHub
- Suggest features in issues
- Rate and review on Marketplace
- Contribute on GitHub

Thank you for using PhilJS!
