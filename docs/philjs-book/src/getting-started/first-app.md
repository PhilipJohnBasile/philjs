# Your First App

This chapter builds a minimal PhilJS app with signals and JSX.

## 1. Create the component

`src/App.tsx`

```tsx
import { signal } from "@philjs/core";

const count = signal(0);

export function App() {
  return (
    <main>
      <h1>PhilJS Counter</h1>
      <p>Count: {count}</p>
      <button onClick={() => count.set((c) => c + 1)}>Increment</button>
      <button onClick={() => count.set((c) => c - 1)}>Decrement</button>
    </main>
  );
}
```

## 2. Create the entry point

`src/main.tsx`

```tsx
import { render } from "@philjs/core";
import { App } from "./App";

const root = document.getElementById("app");
if (!root) throw new Error("Missing #app root");

render(<App />, root);
```

## 3. Ensure the HTML shell exists

```html
<div id="app"></div>
```

## 4. Run the app

```bash
pnpm dev
```

Open the dev server URL to see your counter.
