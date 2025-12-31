/**
 * Streaming SSR with Suspense boundaries.
 */

import type { VNode } from "@philjs/core";

export type StreamContext = {
  /** Unique ID generator for suspense boundaries */
  suspenseId: number;
  /** Pending suspense boundaries */
  pending: Map<string, Promise<VNode>>;
  /** Resolved boundaries ready to inject */
  resolved: Map<string, string>;
};

/**
 * Render to a streaming response with progressive enhancement.
 */
export async function renderToStreamingResponse(
  vnode: VNode,
  options: {
    onShellReady?: () => void;
    onComplete?: () => void;
  } = {}
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const ctx: StreamContext = {
    suspenseId: 0,
    pending: new Map(),
    resolved: new Map(),
  };

  return new ReadableStream({
    async start(controller) {
      // Start HTML document
      controller.enqueue(encoder.encode(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PhilJS App</title>
  <script>
    // Streaming SSR client runtime
    window.__PHIL_SUSPENSE__ = {};
    function __phil_inject(id, html) {
      const el = document.getElementById('phil-suspense-' + id);
      if (el) {
        const temp = document.createElement('div');
        temp.innerHTML = html;
        el.replaceWith(...temp.childNodes);
      }
    }
  </script>
</head>
<body>
`));

      // Render initial shell
      const shellHtml = await renderWithSuspense(vnode, ctx);
      controller.enqueue(encoder.encode(shellHtml));

      // Shell ready callback
      options.onShellReady?.();

      // Stream pending suspense boundaries
      while (ctx.pending.size > 0) {
        const promises = Array.from(ctx.pending.entries());
        const settled = await Promise.race(
          promises.map(async ([id, promise]) => {
            try {
              const content = await promise;
              return { id, content, error: null };
            } catch (error) {
              return { id, content: null, error };
            }
          })
        );

        if (settled) {
          ctx.pending.delete(settled.id);

          if (settled.error) {
            // Inject error fallback
            const script = `<script>__phil_inject('${settled.id}', '<div class="error">Loading failed</div>');</script>\n`;
            controller.enqueue(encoder.encode(script));
          } else {
            // Render resolved content and inject
            const html = await renderWithSuspense(settled.content, ctx);
            const escaped = html.replace(/'/g, "\\'").replace(/\n/g, "\\n");
            const script = `<script>__phil_inject('${settled.id}', '${escaped}');</script>\n`;
            controller.enqueue(encoder.encode(script));
          }
        }
      }

      // End document
      controller.enqueue(encoder.encode(`</body>
</html>`));

      // Complete callback
      options.onComplete?.();

      controller.close();
    },
  });
}

/**
 * Render with suspense boundary support.
 */
async function renderWithSuspense(vnode: VNode, ctx: StreamContext): Promise<string> {
  if (vnode == null || typeof vnode === "boolean") {
    return "";
  }

  if (typeof vnode === "string" || typeof vnode === "number") {
    return escapeHtml(String(vnode));
  }

  if (Array.isArray(vnode)) {
    const parts = await Promise.all(vnode.map((v) => renderWithSuspense(v, ctx)));
    return parts.join("");
  }

  // Check for Suspense component
  if (isJSXElement(vnode) && vnode.type === Suspense) {
    const id = `suspense-${ctx.suspenseId++}`;
    const { children, fallback } = vnode.props as { children: VNode; fallback?: VNode };

    // Try to render children
    try {
      const content = await renderWithSuspense(children, ctx);
      return content;
    } catch (error) {
      // If it throws a promise (lazy component), show fallback
      if (error instanceof Promise) {
        ctx.pending.set(id, error.then(() => children) as Promise<VNode>);
        const fallbackHtml = fallback ? await renderWithSuspense(fallback, ctx) : "Loading...";
        return `<div id="phil-suspense-${id}">${fallbackHtml}</div>`;
      }
      throw error;
    }
  }

  // Regular rendering
  if (isJSXElement(vnode)) {
    const { type, props } = vnode;

    if (typeof type === "function") {
      const result = await type(props);
      return renderWithSuspense(result, ctx);
    }

    if (typeof type === "string") {
      return renderElement(type, props, ctx);
    }
  }

  return "";
}

/**
 * Render HTML element with streaming support.
 */
async function renderElement(
  tag: string,
  props: Record<string, any>,
  ctx: StreamContext
): Promise<string> {
  const { children, ...attrs } = props;
  const attrsString = renderAttrs(attrs);
  const openTag = attrsString ? `<${tag} ${attrsString}>` : `<${tag}>`;

  if (isVoidElement(tag)) {
    return openTag;
  }

  const childrenHtml = await renderWithSuspense(children, ctx);
  return `${openTag}${childrenHtml}</${tag}>`;
}

/**
 * Suspense component for lazy loading.
 */
export function Suspense(props: { children: VNode; fallback?: VNode }): VNode {
  return { type: Suspense, props } as any;
}

// Helper functions
function isJSXElement(value: any): value is { type: any; props: any } {
  return value && typeof value === "object" && "type" in value && "props" in value;
}

function isVoidElement(tag: string): boolean {
  return /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderAttrs(attrs: Record<string, any>): string {
  return Object.entries(attrs)
    .filter(([key, value]) => {
      if (value == null || value === false) return false;
      if (typeof value === "function") return false;
      if (key.startsWith("__")) return false;
      return true;
    })
    .map(([key, value]) => {
      const attrName = key === "className" ? "class" : key === "htmlFor" ? "for" : key;
      if (typeof value === "boolean") return value ? attrName : "";
      return `${attrName}="${escapeHtml(String(value))}"`;
    })
    .filter(Boolean)
    .join(" ");
}