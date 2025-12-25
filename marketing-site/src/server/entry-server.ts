import type { IncomingMessage } from "node:http";
import {
  streamHTML,
  serializeState,
  buildCSP,
  buildLinkHeader,
  createNonce,
  type EarlyHint,
  type LoaderCtx
} from "philjs-ssr";
import { html, unsafeHTML } from "./template";
import { matchRoute } from "./router";
import globalStyles from "../styles/global.css?inline";

export async function render(req: IncomingMessage) {
  const { request } = await prepareRequest(req);
  const url = new URL(request.url);

  const match = matchRoute(url.pathname);
  if (!match) {
    return {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
      body: `<!DOCTYPE html>${html`
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>Not Found - PhilJS</title>
          </head>
          <body>
            <main style="display:grid;place-items:center;height:100vh;font-family:system-ui;">
              <div style="text-align:center;">
                <h1>404 - Not Found</h1>
                <p>The page ${url.pathname} could not be located.</p>
                <a href="/" style="color:#2563eb;">Return Home</a>
              </div>
            </main>
          </body>
        </html>
      `}`
    };
  }

  const module = match.entry.module;
  const loader = typeof module.loader === "function" ? module.loader : async () => ({});
  const Component = typeof module.default === "function" ? module.default : undefined;

  const nonce = createNonce();
  const csp = buildCSP({
    nonce,
    directives: {
      "connect-src": [`'self'`]
    }
  });

  const earlyHints: EarlyHint[] = [
    {
      href: "/src/entry-client.tsx",
      rel: "modulepreload",
      as: "script",
      priority: "high"
    }
  ];

  const loaderCtx: LoaderCtx = {
    params: match.params,
    request,
    env: process.env
  };

  const data = await loader(loaderCtx);
  const meta = (typeof data === "object" && data !== null
    ? (data as { title?: string; description?: string })
    : {}) as { title?: string; description?: string };
  const pageTitle = meta.title ?? "PhilJS - Signals-first Framework for the Modern Web";
  const pageDescription =
    meta.description ??
    "PhilJS is a signals-first framework with SSR, islands, and a full ecosystem of packages for data, auth, and deployment.";

  const bodyHtml = Component ? await Promise.resolve(Component({ data, params: match.params })) : "";

  const statePayload = serializeState({ data, params: match.params });
  const linkHeader = buildLinkHeader(earlyHints);

  const parts = async function* () {
    yield "<!DOCTYPE html>";
    yield html`
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="view-transition" content="same-origin" />
          <meta name="description" content="${pageDescription}" />
          <title>${pageTitle}</title>
          <link rel="manifest" href="/manifest.json" />
          <link rel="icon" href="/favicon.ico" />
          <style>
            ${globalStyles}
          </style>
        </head>
        <body data-route="${match.entry.id}">
          <div id="app">${unsafeHTML(bodyHtml)}</div>
          ${unsafeHTML(
            `<script nonce="${nonce}">window.__PHIL_STATE__=${JSON.stringify(statePayload)};</script>`
          )}
          ${unsafeHTML(
            `<script nonce="${nonce}" type="module" src="/src/entry-client.tsx" fetchpriority="high"></script>`
          )}
        </body>
      </html>
    `;
  };

  return {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=3600",
      [csp.header]: csp.value,
      ...(linkHeader ? { link: linkHeader } : {})
    },
    body: streamHTML(parts()),
    earlyHints
  };
}

async function prepareRequest(req: IncomingMessage): Promise<{ request: Request }> {
  const origin = `http://${req.headers.host ?? "localhost"}`;
  const url = new URL(req.url ?? "/", origin);
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((item) => headers.append(key, item));
    } else {
      headers.set(key, value);
    }
  }

  return {
    request: new Request(url.href, {
      method: req.method ?? "GET",
      headers
    })
  };
}
