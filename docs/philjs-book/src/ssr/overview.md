# SSR Overview

PhilJS SSR is streaming-first and designed for islands. You can render routes directly with the server adapters.

## Basic Node server

```ts
import { createServer } from "node:http";
import { createNodeHttpHandler } from "@philjs/ssr";
import { createAppRouter } from "@philjs/router";

const routes = [
  { path: "/", component: () => <main>Home</main> },
  { path: "/about", component: () => <main>About</main> },
];

const handler = createNodeHttpHandler({ routes });

createServer(handler).listen(3000, () => {
  console.log("PhilJS SSR running on http://localhost:3000");
});
```

## Render to string

```tsx
import { renderToString } from "@philjs/core";

const html = renderToString(<main>Server render</main>);
```

## Streaming SSR

```tsx
import { renderToStream } from "@philjs/ssr";

const stream = renderToStream(<App />);
```
