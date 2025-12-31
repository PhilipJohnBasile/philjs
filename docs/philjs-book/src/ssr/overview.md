# SSR Overview

PhilJS ships with SSR and streaming helpers in `@philjs/ssr`.

## Node Server Example

```ts
import http from "node:http";
import { handleRequest } from "@philjs/ssr";
import { router } from "./server/router";

const server = http.createServer(async (req, res) => {
  const response = await handleRequest(req, router);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(await response.text());
});

server.listen(3000);
```

The response includes streamed HTML and any required hydration data.
