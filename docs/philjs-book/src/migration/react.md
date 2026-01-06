# Chapter 9: Escaping React

"The best rewrite is the one that never happens."

Rewriting an application from scratch is the most dangerous thing a software team can do. It stalls features, introduces regressions, and burns out developers.

PhilJS is designed for the **Strangler Fig Application** pattern. You do not rewrite your React app. You strangle it, piece by piece, until it is gone.

## The Strategy: Routes First

Do not try to migrate leaf components (buttons, inputs) first. It leads to improved components inside a sluggish runtime.

Migrate **Routes**.

1.  Set up PhilJS as a proxy in front of your legacy React app (e.g., via Nginx or Vercel Rewrites).
2.  Pick a low-risk route (e.g., `/about` or `/settings`).
3.  Build that route in PhilJS.
4.  Direct traffic for that specific URL to the PhilJS app.
5.  Repeat.

## Running React inside PhilJS

Sometimes you have a complex React component (like a heavy Data Grid or Map) that you cannot rewrite yet.

PhilJS allows you to mount React islands directly.

```typescript
// Wrapper.tsx (PhilJS)
import { ReactIsland } from "@philjs/compat-react";
import LegacyGrid from "./LegacyGrid"; // The React component

export function GridWrapper(props) {
  return (
    <ReactIsland
      component={LegacyGrid}
      props={props}
      client:visible // Lazy load the entire React runtime only when visible
    />
  );
}
```

This creates an isolated React Root for just that div. The rest of your page remains lightweight PhilJS.

## The Migration Checklist

### 1. Identify Global State
React apps often trap state in a global Context.
*   **Strategy**: Move global state to the URL (Chapter 4) or to a platform-agnostic store (like NanoStores or plain Signals) that both frameworks can read.

### 2. Identify Hooks
*   `useState` -> `signal()`
*   `useMemo` -> `memo()`
*   `useEffect` -> `effect()` (But refer to Chapter 2: avoid effects for state syncing!)

### 3. Identify Data Fetching
*   `useEffect(() => fetch)` -> **Loaders**.
Move your data fetching out of the component and into the Route Loader (Chapter 4). This is the biggest performance win you will get.

## The End State

Eventually, your React app becomes just a few islands floating in a PhilJS ocean. At that point, you can rewrite the final few components and remove `react` and `react-dom` from your `package.json`.

Release the baggage. The future is lighter.
