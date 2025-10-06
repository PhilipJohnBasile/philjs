import type { IncomingMessage } from "node:http";
import {
  streamHTML,
  serializeState,
  buildCSP,
  buildLinkHeader,
  createNonce,
  createCookie,
  type EarlyHint,
  type LoaderCtx,
  type ActionCtx
} from "philjs-ssr";
import { createAI, providers } from "philjs-ai";
import { html, unsafeHTML } from "./template";
import { matchRoute } from "./router";
import { createMockDb } from "./mock-db";
const db = createMockDb();

const aiEndpoint = process.env.PHIL_AI_ENDPOINT ?? "http://localhost:8787/ai";
const ai = createAI(providers.http(aiEndpoint));

const sessionCookie = createCookie<{ lastRoute: string; lastSeen: number }>("philjs.session", {
  secrets: readSessionSecrets(),
  secure: process.env.NODE_ENV !== "development",
  sameSite: "Lax",
  httpOnly: true,
  maxAge: 60 * 60 * 24 * 7
});

export async function render(req: IncomingMessage) {
  const { request, body } = await prepareRequest(req);
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
              <div>
                <h1>404 - Not Found</h1>
                <p>The page ${url.pathname} could not be located.</p>
              </div>
            </main>
          </body>
        </html>
      `}`
    };
  }

  const module = match.entry.module;
  const loader = typeof module.loader === "function" ? module.loader : async () => ({});
  const action = typeof module.action === "function" ? module.action : undefined;
  const Component = typeof module.default === "function" ? module.default : undefined;

  const nonce = createNonce();
  const aiOrigin = safeOrigin(aiEndpoint);
  const csp = buildCSP({
    nonce,
    directives: {
      "connect-src": aiOrigin ? [`'self'`, aiOrigin] : [`'self'`]
    }
  });
  const earlyHints: EarlyHint[] = [
    {
      href: "/src/entry-client.ts",
      rel: "modulepreload",
      as: "script",
      priority: "high"
    }
  ];

  if (aiOrigin) {
    earlyHints.push({ href: aiOrigin, rel: "preconnect" });
  }

  let actionResult: unknown = null;
  const method = request.method ?? "GET";

  if (/^POST$/i.test(method) && action) {
    const actionRequest = new Request(request.url, {
      method,
      headers: request.headers,
      body: body ? Buffer.from(body) : undefined
    });

    const formData = await readFormData(actionRequest);

    const actionCtx: ActionCtx = {
      params: match.params,
      request: actionRequest,
      env: process.env,
      db,
      ai,
      formData
    };
    actionResult = await action(actionCtx);
  }

  const loaderRequest = /^POST$/i.test(method)
    ? new Request(request.url, { method: "GET", headers: request.headers })
    : request;

  const loaderCtx: LoaderCtx = {
    params: match.params,
    request: loaderRequest,
    env: process.env,
    db,
    ai
  };

  const data = await loader(loaderCtx);

  const session = sessionCookie.parse(request.headers.get("cookie"))?.value ?? {};
  const bodyHtml = Component
    ? await Promise.resolve(Component({ data, actionData: actionResult, params: match.params }))
    : "";

  const statePayload = serializeState({ data, actionData: actionResult, params: match.params });
  const setCookieHeader = sessionCookie.serialize({
    ...session,
    lastRoute: match.entry.id,
    lastSeen: Date.now()
  });
  const linkHeader = buildLinkHeader(earlyHints);

  const parts = async function* () {
    yield "<!DOCTYPE html>";
    yield html`
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="view-transition" content="same-origin" />
          <title>PhilJS Storefront</title>
          <link rel="manifest" href="/manifest.json" />
          <link rel="icon" href="/favicon.ico" />
          <style>
            ${globalStyles}
          </style>
        </head>
        <body data-route=${match.entry.id}>
          <div id="app">${unsafeHTML(bodyHtml)}</div>
          ${unsafeHTML(
            `<script nonce="${nonce}">window.__PHIL_STATE__=${JSON.stringify(statePayload)};</script>`
          )}
          ${unsafeHTML(
            `<script nonce="${nonce}" type="module" src="/src/entry-client.ts" fetchpriority="high"></script>`
          )}
        </body>
      </html>
    `;
  };

  return {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      [csp.header]: csp.value,
      "set-cookie": setCookieHeader,
      ...(linkHeader ? { link: linkHeader } : {})
    },
    body: streamHTML(parts()),
    earlyHints
  };
}

async function prepareRequest(req: IncomingMessage): Promise<{ request: Request; body?: Buffer }> {
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

  let body: Buffer | undefined;
  const method = req.method ?? "GET";
  if (!/^(GET|HEAD)$/i.test(method)) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    body = Buffer.concat(chunks);
  }

  return {
    request: new Request(url.href, {
      method,
      headers,
      body
    }),
    body
  };
}

async function readFormData(request: Request): Promise<FormData> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const text = await request.text();
    const payload = text ? JSON.parse(text) : {};
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      formData.set(key, String(value));
    });
    return formData;
  }

  if (typeof request.formData === "function") {
    return request.formData();
  }

  return new FormData();
}

const globalStyles = `
  :root {
    color-scheme: light dark;
    font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
    --brand: #2563eb;
    --brand-dark: #1d4ed8;
    --surface: rgba(255, 255, 255, 0.9);
    --border: rgba(148, 163, 184, 0.6);
  }
  body {
    margin: 0;
    padding: 2rem clamp(1rem, 4vw, 4rem);
    min-height: 100vh;
    background: linear-gradient(145deg, #f8fafc, #e2e8f0);
    color: #0f172a;
  }
  header {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 2rem;
  }
  h1 {
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    margin: 0;
  }
  h2 {
    margin: 2.5rem 0 1rem;
  }
  .product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: clamp(1.5rem, 4vw, 2.5rem);
    list-style: none;
    padding: 0;
  }
  .product-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 1.75rem;
    box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
    display: grid;
    gap: 0.75rem;
  }
  .product-card a {
    color: var(--brand);
    text-decoration: none;
    font-weight: 600;
  }
  main {
    display: grid;
    gap: 1.5rem;
  }
  form {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 18px;
    padding: 1.5rem;
    display: grid;
    gap: 1rem;
    max-width: 460px;
  }
  label {
    font-weight: 600;
    display: grid;
    gap: 0.5rem;
  }
  input[type="number"] {
    font: inherit;
    padding: 0.65rem 0.75rem;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: white;
    width: 120px;
  }
  button {
    appearance: none;
    border: none;
    border-radius: 9999px;
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    cursor: pointer;
    background: var(--brand);
    color: white;
    transition: transform 120ms ease, box-shadow 120ms ease;
  }
  button:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 20px rgba(37, 99, 235, 0.25);
  }
  aside[island] {
    background: rgba(15, 23, 42, 0.05);
    border-radius: 18px;
    padding: 1.5rem;
  }
  @media (max-width: 640px) {
    body {
      padding: 1.5rem 1rem;
    }
  }
`;

function safeOrigin(url: string) {
  try {
    return new URL(url).origin;
  } catch (error) {
    console.warn("Invalid AI endpoint URL", { url, error });
    return null;
  }
}

function readSessionSecrets() {
  const list = (process.env.PHIL_SESSION_SECRETS ?? process.env.PHIL_SESSION_SECRET ?? "").split(",");
  const secrets = list.map((value) => value.trim()).filter(Boolean);
  if (secrets.length) return secrets;
  return ["philjs-dev-secret"];
}
