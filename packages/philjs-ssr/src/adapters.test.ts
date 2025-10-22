import { describe, it, expect } from "vitest";
import { createServer } from "node:http";
import { once } from "node:events";
import { Ok } from "philjs-core";
import type { RouteDefinition } from "philjs-router";
import {
  createFetchHandler,
  createNodeHttpHandler,
  createExpressMiddleware,
  createViteMiddleware,
  createWorkerHandler,
} from "./adapters.js";

const routes: RouteDefinition[] = [
  {
    path: "/",
    component: ({ data }) => `Hello ${data}`,
    loader: async () => Ok("PhilJS"),
  },
];

describe("philjs-ssr adapters", () => {
  it("renders route via fetch handler", async () => {
    const handler = createFetchHandler({ routes });
    const response = await handler(new Request("http://localhost/"));
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Hello PhilJS");
  });

  it("serves requests via Node HTTP handler", async () => {
    const server = createServer(createNodeHttpHandler({ routes }));
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Unexpected server address");
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/`);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Hello PhilJS");

    server.close();
    await once(server, "close");
  });

  it("handles requests through Express-style middleware", async () => {
    const middleware = createExpressMiddleware({ routes });
    const server = createServer((req, res) => {
      middleware(req, res, (err?: unknown) => {
        if (err) {
          res.statusCode = 500;
          res.end("Error");
        } else if (!res.headersSent) {
          res.statusCode = 404;
          res.end("Next");
        }
      });
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Unexpected server address");
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/`);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Hello PhilJS");

    server.close();
    await once(server, "close");
  });

  it("handles requests through Vite-style middleware", async () => {
    const middleware = createViteMiddleware({ routes });
    const server = createServer((req, res) => {
      middleware(req, res, (err?: unknown) => {
        if (err) {
          res.statusCode = 500;
          res.end("Error");
        } else if (!res.headersSent) {
          res.statusCode = 404;
          res.end("Next");
        }
      });
    });

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Unexpected server address");
    }

    const response = await fetch(`http://127.0.0.1:${address.port}/`);
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Hello PhilJS");

    server.close();
    await once(server, "close");
  });

  it("responds via worker handler", async () => {
    const handler = createWorkerHandler({ routes });
    const response = await handler(new Request("http://localhost/"));
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain("Hello PhilJS");
  });
});
