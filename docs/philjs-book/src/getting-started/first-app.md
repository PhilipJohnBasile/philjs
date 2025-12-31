# Your First App

Create two files: `src/App.tsx` and `src/main.tsx`.

## App Component

```tsx
import { signal } from "@philjs/core";

export function App() {
  const count = signal(0);

  return (
    <main>
      <h1>PhilJS Counter</h1>
      <p>Count: {count()}</p>
      <button onClick={() => count.set(count() + 1)}>Increment</button>
    </main>
  );
}
```

## Entry Point

```tsx
import { render } from "@philjs/core";
import { App } from "./App";

render(() => <App />, document.getElementById("app")!);
```

Run `pnpm dev` and open the local URL printed by the dev server.
