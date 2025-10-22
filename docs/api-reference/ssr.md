# SSR API

The `philjs-ssr` package provides the server runtime that pairs with the high-level router. It knows how to execute loaders, serialize `Result` values, hydrate nested layouts, and stream HTML. This guide covers the request handler, server adapters, and streaming helpers that ship today.

---

## Quick Start

```ts
// routes.ts
import type { RouteDefinition } from "philjs-router";
import { Ok } from "philjs-core";

export const routes: RouteDefinition[] = [
  {
    path: "/",
    component: ({ data }) => `<h1>${data.title}</h1>`,
    loader: async () => Ok({ title: "Welcome to PhilJS" }),
  },
];
```

```ts
// server.ts
import { createServer } from "node:http";
import { createNodeHttpHandler } from "philjs-ssr";
import { routes } from "./routes";

const handler = createNodeHttpHandler({ routes });
const server = createServer(handler);
server.listen(3000);
```

The handler will execute matching route loaders, serialize their data or errors into `window.__PHILJS_ROUTE_*__`, and return a full HTML document ready to hydrate on the client.

---

## Core Request Handler

### `handleRequest(request, options)`

Low-level building block that powers every adapter.

```ts
import { handleRequest } from "philjs-ssr";
import { createRouteMatcher } from "philjs-router";
import { routes } from "./routes";

const match = createRouteMatcher(routes);
const response = await handleRequest(request, { match });
```

**Parameters**

- `request: Request` – the incoming Fetch API request.
- `options.match: RouteMatcher` – generated from `createRouteMatcher(routes)`.
- `options.baseUrl?: string` – base URL used when computing route URLs (handy for reverse proxies).
- `options.render?: (component: VNode) => string | Promise<string>` – override the server renderer (defaults to `philjs-core`’s `renderToString`).

**Loader execution**

- The handler passes `{ request, url, params, headers, method, formData? }` to your route loader.
- If the loader returns a `Result`, the helper unwraps it and hydrates either `data` or `error`.
- Throwing from a loader populates `error` and still renders the component so you can surface graceful fallbacks.

**Component props**

Route components receive `params`, `data`, `error`, the current `url`, and a stub `navigate` function (throws on the server) so they can reuse the same prop signature in SSR and the browser.

---

## Server Adapters

All adapters share the same options bag:

```ts
type PhilJSServerOptions = {
  routes: RouteDefinition[];
  baseUrl?: string;
  render?: (component: VNode) => string | Promise<string>;
  routeOptions?: RouteManifestOptions;
};
```

Most apps only provide `routes`; the rest are optional.

> `VNode` comes from `philjs-core` and matches the JSX runtime output of your components.

### `createFetchHandler(options)`

Returns a `(request: Request) => Promise<Response>` function that you can plug into any Fetch-compatible runtime.

```ts
const handler = createFetchHandler({ routes });
addEventListener("fetch", (event) => {
  event.respondWith(handler(event.request));
});
```

### `createNodeHttpHandler(options)`

Wraps the Fetch handler for Node’s built-in `http` server.

```ts
import { createServer } from "node:http";
import { createNodeHttpHandler } from "philjs-ssr";
import { routes } from "./routes";

const server = createServer(createNodeHttpHandler({ routes }));
server.listen(3000, () => {
  console.log("PhilJS SSR running at http://localhost:3000");
});
```

### `createExpressMiddleware(options)`

Connect-style middleware for Express. It responds to every request it handles and forwards errors to `next(err)` so you can rely on default Express error handling.

```ts
import express from "express";
import { createExpressMiddleware } from "philjs-ssr";
import { routes } from "./routes";

const app = express();
app.use(createExpressMiddleware({ routes }));
app.listen(3000);
```

> If you need body parsing for API routes, register those middleware before the PhilJS handler so POST bodies are still readable.

### `createViteMiddleware(options)`

Useful during local development when you want Vite to serve assets and fall back to PhilJS for SSR.

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { createViteMiddleware } from "philjs-ssr";
import { routes } from "./routes";

export default defineConfig({
  server: {
    middlewareMode: true,
  },
  plugins: [
    {
      name: "philjs-ssr",
      configureServer(server) {
        server.middlewares.use(createViteMiddleware({ routes }));
      },
    },
  ],
});
```

### `createWorkerHandler(options)`

Returns a fetch handler you can deploy to Cloudflare Workers, Service Workers, Bun, Deno, or any runtime that expects `(request: Request) => Response`.

```ts
import { createWorkerHandler } from "philjs-ssr";
import { routes } from "./routes";

const handler = createWorkerHandler({ routes });

export default {
  fetch(request: Request) {
    return handler(request);
  },
};
```

---

## Data Hydration & Error Surfacing

The request handler automatically serializes loader data, errors, and params into the following globals:

- `window.__PHILJS_ROUTE_DATA__[pathname]`
- `window.__PHILJS_ROUTE_ERROR__[pathname]`
- `window.__PHILJS_ROUTE_INFO__.current`

The high-level router reads these during the first client navigation so loaders aren’t re-run unnecessarily.

Because loaders support the `Result` helpers from `philjs-core`, you can return `Ok(data)` or `Err(problem)` and render consistent fallbacks across SSR and the client.

---

## Streaming Responses

For long rendering chains you can opt into streaming HTML. The streaming helpers are independent from the route-aware handler, so you can decide where to integrate them.

### `renderToStreamingResponse(vnode, options?)`

```ts
import { renderToStreamingResponse, Suspense } from "philjs-ssr";

const stream = await renderToStreamingResponse(
  <App>
    <Suspense fallback={<p>Loading…</p>}>
      <SlowComponent />
    </Suspense>
  </App>,
  {
    onShellReady: () => console.log("Shell flushed"),
    onComplete: () => console.log("All content sent"),
  }
);

return new Response(stream, {
  headers: { "Content-Type": "text/html; charset=utf-8" },
});
```

Streaming keeps the same hydration contract as the regular handler: suspense boundaries progressively inject HTML on the client.

---

## Typed Manifests

Pair the SSR adapters with the router helpers to generate types for your loaders and params:

```ts
import { createRouteManifest, generateRouteTypes } from "philjs-router";
import { routes } from "./routes";

export const manifest = createRouteManifest(routes);
const dts = generateRouteTypes(routes, { moduleName: "./routes" });
```

Use the manifest for static generation or build-time validation, and ship the generated `.d.ts` file to provide strongly typed `params` across your app.
