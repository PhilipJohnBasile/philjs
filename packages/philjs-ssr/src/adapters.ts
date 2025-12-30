import type { IncomingMessage, ServerResponse } from "node:http";
import type { TLSSocket } from "node:tls";
import { createRouteMatcher } from "@philjs/router";
import type { RouteDefinition, RouteManifestOptions } from "@philjs/router";
import { handleRequest } from "./request-handler.js";
import type { RenderOptions } from "./request-handler.js";

export type PhilJSServerOptions = {
  routes: RouteDefinition[];
  baseUrl?: string;
  render?: RenderOptions["render"];
  routeOptions?: RouteManifestOptions;
};

export function createFetchHandler(options: PhilJSServerOptions) {
  const match = createRouteMatcher(options.routes, options.routeOptions);
  return (request: Request) => {
    const renderOptions: RenderOptions = { match };
    if (options.baseUrl !== undefined) {
      renderOptions.baseUrl = options.baseUrl;
    }
    if (options.render !== undefined) {
      renderOptions.render = options.render;
    }
    return handleRequest(request, renderOptions);
  };
}

export function createNodeHttpHandler(options: PhilJSServerOptions) {
  const fetchHandler = createFetchHandler(options);

  return async function nodeHandler(req: IncomingMessage, res: ServerResponse) {
    try {
      await processIncoming(fetchHandler, req, res, options.baseUrl);
    } catch (error) {
      console.error("PhilJS server error", error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      } else {
        res.end();
      }
    }
  };
}

export function createExpressMiddleware(options: PhilJSServerOptions) {
  const fetchHandler = createFetchHandler(options);

  return function philjsExpress(
    req: IncomingMessage,
    res: ServerResponse,
    next?: (err?: unknown) => void
  ) {
    processIncoming(fetchHandler, req, res, options.baseUrl).catch((error) => {
      console.error("PhilJS Express adapter error", error);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
      if (next) {
        next(error);
      }
    });
  };
}

export function createViteMiddleware(options: PhilJSServerOptions) {
  const fetchHandler = createFetchHandler(options);

  return function philjsVite(
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void
  ) {
    processIncoming(fetchHandler, req, res, options.baseUrl).catch((error) => {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
      next(error);
    });
  };
}

export function createWorkerHandler(options: PhilJSServerOptions) {
  const fetchHandler = createFetchHandler(options);
  return (request: Request) => fetchHandler(request);
}

type FetchHandler = (request: Request) => Promise<Response>;

async function processIncoming(
  fetchHandler: FetchHandler,
  req: IncomingMessage,
  res: ServerResponse,
  baseUrl?: string
) {
  const request = await toFetchRequest(req, baseUrl);
  const response = await fetchHandler(request);
  await sendNodeResponse(res, response, req.method ?? "GET");
}

async function toFetchRequest(req: IncomingMessage, baseUrl?: string): Promise<Request> {
  const origin = resolveOrigin(req, baseUrl);
  const url = new URL(req.url ?? "/", origin);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const entry of value) headers.append(key, entry);
    } else {
      headers.set(key, value);
    }
  }

  const method = req.method ?? "GET";
  const init: RequestInit = {
    method,
    headers,
  };

  if (method !== "GET" && method !== "HEAD") {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    init.body = Buffer.concat(chunks);
  }

  return new Request(url.toString(), init);
}

async function sendNodeResponse(
  res: ServerResponse,
  response: Response,
  method: string
) {
  res.statusCode = response.status;
  res.statusMessage = response.statusText;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (method === "HEAD") {
    res.end();
    return;
  }

  if (!response.body) {
    res.end();
    return;
  }

  const arrayBuffer = await response.arrayBuffer();
  res.end(Buffer.from(arrayBuffer));
}

function resolveOrigin(req: IncomingMessage, baseUrl?: string): string {
  if (baseUrl) return baseUrl;
  // Type guard to check if socket is a TLS socket
  const isTLS = req.socket && 'encrypted' in req.socket;
  const protocol = isTLS && (req.socket as TLSSocket).encrypted ? "https" : "http";
  const host = req.headers.host ?? "localhost";
  return `${protocol}://${host}`;
}
