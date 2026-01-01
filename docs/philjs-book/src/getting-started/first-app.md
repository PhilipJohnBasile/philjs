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

## Add styling

Create `src/App.css`:

```css
main {
  font-family: system-ui, -apple-system, sans-serif;
  padding: 2rem;
}
button {
  margin-right: 0.5rem;
}
```

Import it in `App.tsx` and confirm styling works with Vite HMR.

## Add a route

Install the router (if not scaffolded):

```bash
pnpm add @philjs/router
```

Create `src/routes.tsx`:

```tsx
import { createAppRouter, Link } from '@philjs/router';
import { App } from './App';

function About() { return <p>About PhilJS</p>; }

createAppRouter({
  target: '#app',
  routes: [
    { path: '/', component: App },
    { path: '/about', component: About },
  ],
});
```

Update `main.tsx` to import `routes.tsx` instead of rendering `<App />` directly. Navigate between routes to confirm client routing works.

## Add a loader

```tsx
const routes = [
  {
    path: '/',
    loader: async () => ({ message: 'Hello from loader' }),
    component: ({ data }) => <p>{data.message}</p>,
  },
];
```

Reload; the loader runs before render. This mirrors how you will fetch real data.

## Add a test

```tsx
import { render, screen, fireEvent } from '@philjs/testing';
import { App } from './App';

it('increments', () => {
  render(() => <App />);
  fireEvent.click(screen.getByRole('button', { name: /increment/i }));
  expect(screen.getByText(/count: 1/i)).toBeInTheDocument();
});
```

Run `pnpm test` to confirm setup.

## Checklist

- [ ] Counter renders and updates.
- [ ] Routing works between `/` and `/about`.
- [ ] Loader returns data for `/`.
- [ ] Test suite runs.
- [ ] Styles load with HMR.

