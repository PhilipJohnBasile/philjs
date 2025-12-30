/**
 * Partial Prerendering (PPR) Renderer
 *
 * Combines static shell prerendering with dynamic content streaming,
 * inspired by Next.js 14's Partial Prerendering feature.
 *
 * Key concepts:
 * - Static shell: Prerendered at build time, cached at edge
 * - Dynamic boundaries: Rendered at request time, streamed to client
 * - Suspense integration: Use Suspense for async content
 * - Dynamic component: Explicitly mark request-time content
 */

import type { VNode } from "philjs-core";
import type {
  PPRContext,
  PPRConfig,
  StaticShell,
  DynamicBoundary,
  DynamicBoundaryMetadata,
  ShellAssets,
  RequestTimeData,
  BoundaryResolution,
} from "./ppr-types.js";
import {
  PPR_PLACEHOLDER_START,
  PPR_PLACEHOLDER_END,
  PPR_FALLBACK_START,
  PPR_FALLBACK_END,
  hashContent,
} from "./ppr-types.js";
import { isDynamic, registerDynamicBoundary } from "./dynamic.js";
import { Suspense } from "./streaming.js";

// ============================================================================
// PPR Context Creation
// ============================================================================

/**
 * Create a new PPR rendering context
 */
export function createPPRContext(
  mode: "build" | "request",
  options: {
    placeholderPrefix?: string;
    requestData?: RequestTimeData;
  } = {}
): PPRContext {
  const ctx: PPRContext = {
    mode,
    boundaries: new Map(),
    boundaryId: 0,
    placeholderPrefix: options.placeholderPrefix || "ppr-",
    insideDynamicBoundary: false,
  };
  if (options.requestData !== undefined) {
    ctx.requestData = options.requestData;
  }
  return ctx;
}

// ============================================================================
// Build-Time Shell Rendering
// ============================================================================

/**
 * Render a component tree to a static shell at build time.
 * Dynamic boundaries are replaced with placeholder comments.
 */
export async function renderToStaticShell(
  vnode: VNode,
  path: string,
  config: PPRConfig = { ppr: true }
): Promise<StaticShell> {
  const ctx = createPPRContext("build", {
    placeholderPrefix: config.placeholderPrefix || "ppr-",
  });

  const html = await renderWithPPR(vnode, ctx);

  // Collect boundary metadata
  const boundaryMetadata = new Map<string, DynamicBoundaryMetadata>();
  for (const [id, boundary] of ctx.boundaries) {
    // Render fallback to HTML
    const fallbackHtml = boundary.fallback
      ? await renderStaticContent(boundary.fallback)
      : '<div class="ppr-loading">Loading...</div>';

    boundaryMetadata.set(id, {
      id,
      type: boundary.type,
      fallbackHtml,
      dataDependencies: boundary.dataDependencies || [],
      priority: boundary.priority || 5,
      startMarker: PPR_PLACEHOLDER_START(id),
      endMarker: PPR_PLACEHOLDER_END(id),
    });
  }

  // Extract and collect assets
  const assets = await extractAssets(html);
  const contentHash = await hashContent(html);

  return {
    path,
    html,
    boundaries: boundaryMetadata,
    buildTime: Date.now(),
    contentHash,
    assets,
  };
}

/**
 * Main PPR rendering function
 */
async function renderWithPPR(vnode: VNode, ctx: PPRContext): Promise<string> {
  if (vnode == null || typeof vnode === "boolean") {
    return "";
  }

  if (typeof vnode === "string" || typeof vnode === "number") {
    return escapeHtml(String(vnode));
  }

  if (Array.isArray(vnode)) {
    const parts = await Promise.all(vnode.map((v) => renderWithPPR(v, ctx)));
    return parts.join("");
  }

  if (!isJSXElement(vnode)) {
    return "";
  }

  const { type, props } = vnode;

  // Handle dynamic boundaries
  if (isDynamic(vnode) || (props && props['__dynamicType'])) {
    return await renderDynamicBoundary(vnode, ctx);
  }

  // Handle Suspense with dynamic prop
  if (type === Suspense) {
    const isDynamicSuspense = props['dynamic'] === true;
    if (isDynamicSuspense) {
      return await renderDynamicBoundary(
        {
          type: "dynamic" as any,
          props: {
            children: props['children'],
            fallback: props['fallback'],
            priority: props['priority'],
          },
        } as any,
        ctx
      );
    }
    // Regular Suspense - try to render synchronously
    return await renderWithPPR(props['children'] as VNode, ctx);
  }

  // Function components
  if (typeof type === "function") {
    try {
      const result = await type(props);
      return await renderWithPPR(result, ctx);
    } catch (error) {
      if (error instanceof Promise) {
        // Async component - mark as dynamic if at build time
        if (ctx.mode === "build") {
          return await renderDynamicBoundary(vnode, ctx);
        }
        // At request time, wait for the promise
        await error;
        const result = await type(props);
        return await renderWithPPR(result, ctx);
      }
      throw error;
    }
  }

  // HTML elements
  if (typeof type === "string") {
    return await renderElement(type, props, ctx);
  }

  return "";
}

/**
 * Render a dynamic boundary at build time
 */
async function renderDynamicBoundary(
  vnode: VNode,
  ctx: PPRContext
): Promise<string> {
  if (!isJSXElement(vnode)) {
    return "";
  }

  const props = vnode.props as any;
  const { id, placeholders } = registerDynamicBoundary(ctx, {
    children: props.children,
    fallback: props.fallback,
    priority: props.priority,
    dataDependencies: props.dataDependencies,
    id: props.id,
  });

  if (ctx.mode === "build") {
    // At build time: render placeholder with fallback
    const fallbackHtml = props.fallback
      ? await renderWithPPR(props.fallback, ctx)
      : '<div class="ppr-loading">Loading...</div>';

    return (
      placeholders.start +
      placeholders.fallbackStart +
      `<div id="${id}" data-ppr-boundary="true">` +
      fallbackHtml +
      "</div>" +
      placeholders.fallbackEnd +
      placeholders.end
    );
  } else {
    // At request time: render actual content
    const wasInside = ctx.insideDynamicBoundary;
    ctx.insideDynamicBoundary = true;
    const content = await renderWithPPR(props.children, ctx);
    ctx.insideDynamicBoundary = wasInside;
    return `<div id="${id}" data-ppr-boundary="true" data-ppr-resolved="true">${content}</div>`;
  }
}

/**
 * Render an HTML element
 */
async function renderElement(
  tag: string,
  props: Record<string, any>,
  ctx: PPRContext
): Promise<string> {
  const { children, ...attrs } = props || {};
  const attrsString = renderAttrs(attrs);
  const openTag = attrsString ? `<${tag} ${attrsString}>` : `<${tag}>`;

  if (isVoidElement(tag)) {
    return openTag;
  }

  const childrenHtml = children ? await renderWithPPR(children, ctx) : "";
  return `${openTag}${childrenHtml}</${tag}>`;
}

/**
 * Render static content (no PPR processing)
 */
async function renderStaticContent(vnode: VNode): Promise<string> {
  if (vnode == null || typeof vnode === "boolean") {
    return "";
  }

  if (typeof vnode === "string" || typeof vnode === "number") {
    return escapeHtml(String(vnode));
  }

  if (Array.isArray(vnode)) {
    const parts = await Promise.all(vnode.map(renderStaticContent));
    return parts.join("");
  }

  if (!isJSXElement(vnode)) {
    return "";
  }

  const { type, props } = vnode;

  if (typeof type === "function") {
    const result = await type(props);
    return await renderStaticContent(result);
  }

  if (typeof type === "string") {
    const { children, ...attrs } = props || {};
    const attrsString = renderAttrs(attrs);
    const openTag = attrsString ? `<${type} ${attrsString}>` : `<${type}>`;

    if (isVoidElement(type)) {
      return openTag;
    }

    const childrenHtml = children ? await renderStaticContent(children as VNode) : "";
    return `${openTag}${childrenHtml}</${type}>`;
  }

  return "";
}

// ============================================================================
// Request-Time Rendering
// ============================================================================

/**
 * Render a single dynamic boundary at request time
 */
export async function renderDynamicContent(
  boundary: DynamicBoundary,
  ctx: PPRContext
): Promise<BoundaryResolution> {
  const startTime = performance.now();

  try {
    ctx.insideDynamicBoundary = true;
    const html = await renderWithPPR(boundary.content, ctx);
    ctx.insideDynamicBoundary = false;

    return {
      id: boundary.id,
      html,
      resolveTime: performance.now() - startTime,
      cached: false,
    };
  } catch (error) {
    ctx.insideDynamicBoundary = false;
    return {
      id: boundary.id,
      html: `<div class="ppr-error">Error loading content</div>`,
      resolveTime: performance.now() - startTime,
      cached: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Render all dynamic boundaries for a shell
 */
export async function renderAllDynamicContent(
  shell: StaticShell,
  requestData: RequestTimeData,
  originalVNode: VNode
): Promise<Map<string, BoundaryResolution>> {
  const ctx = createPPRContext("request", { requestData });
  const results = new Map<string, BoundaryResolution>();

  // We need to re-render the component tree to get the actual content
  // because the shell only contains metadata, not the actual VNodes
  await renderWithPPR(originalVNode, ctx);

  // Now render each collected boundary
  for (const [id, boundary] of ctx.boundaries) {
    const resolution = await renderDynamicContent(boundary, ctx);
    results.set(id, resolution);
  }

  return results;
}

// ============================================================================
// Shell Injection
// ============================================================================

/**
 * Inject dynamic content into a static shell
 */
export function injectDynamicContent(
  shell: StaticShell,
  resolutions: Map<string, BoundaryResolution>
): string {
  let html = shell.html;

  for (const [id, resolution] of resolutions) {
    const metadata = shell.boundaries.get(id);
    if (!metadata) continue;

    // Find and replace the placeholder region
    const startMarker = metadata.startMarker;
    const endMarker = metadata.endMarker;

    const startIndex = html.indexOf(startMarker);
    const endIndex = html.indexOf(endMarker);

    if (startIndex !== -1 && endIndex !== -1) {
      const before = html.substring(0, startIndex);
      const after = html.substring(endIndex + endMarker.length);

      html =
        before +
        `<div id="${id}" data-ppr-boundary="true" data-ppr-resolved="true">${resolution.html}</div>` +
        after;
    }
  }

  return html;
}

// ============================================================================
// PPR Response Generation
// ============================================================================

/**
 * Generate a complete response with PPR.
 * Sends static shell immediately, then streams dynamic content.
 */
export async function generatePPRResponse(
  shell: StaticShell,
  vnode: VNode,
  request: Request,
  options: {
    onShellSent?: () => void;
    onBoundaryResolved?: (id: string) => void;
    onComplete?: () => void;
    timeout?: number;
  } = {}
): Promise<ReadableStream<Uint8Array>> {
  const encoder = new TextEncoder();
  const timeout = options.timeout || 10000;

  const requestData: RequestTimeData = {
    request,
    params: {},
    headers: request.headers,
    cookies: parseCookies(request.headers.get("cookie") || ""),
    timestamp: Date.now(),
  };

  return new ReadableStream({
    async start(controller) {
      try {
        // Send document start with PPR client runtime
        controller.enqueue(
          encoder.encode(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PhilJS App</title>
  ${generatePreloadTags(shell.assets)}
  <script>
    // PPR Client Runtime
    window.__PPR__ = {
      resolved: new Set(),
      pending: new Set(),
      inject: function(id, html) {
        const el = document.getElementById(id);
        if (el) {
          el.outerHTML = html;
          this.resolved.add(id);
          this.pending.delete(id);
          window.dispatchEvent(new CustomEvent('ppr:resolved', { detail: { id } }));
        }
      },
      onAllResolved: function(callback) {
        if (this.pending.size === 0) {
          callback();
        } else {
          window.addEventListener('ppr:resolved', () => {
            if (this.pending.size === 0) callback();
          });
        }
      }
    };
  </script>
  ${shell.assets.inlineCss ? `<style>${shell.assets.inlineCss}</style>` : ""}
</head>
<body>
`)
        );

        // Send static shell with fallbacks
        const shellWithFallbacks = replaceMarkersWithFallbacks(shell);
        controller.enqueue(encoder.encode(shellWithFallbacks));

        // Mark boundaries as pending
        const pendingIds = Array.from(shell.boundaries.keys());
        controller.enqueue(
          encoder.encode(
            `<script>${pendingIds.map((id) => `__PPR__.pending.add('${id}')`).join(";")}</script>\n`
          )
        );

        options.onShellSent?.();

        // Render and stream dynamic content
        const ctx = createPPRContext("request", { requestData });

        // Re-render to collect dynamic boundaries with actual content
        await renderWithPPR(vnode, ctx);

        // Sort boundaries by priority (higher first)
        const sortedBoundaries = Array.from(ctx.boundaries.entries()).sort(
          ([, a], [, b]) => (b.priority || 5) - (a.priority || 5)
        );

        // Render each boundary with timeout
        for (const [id, boundary] of sortedBoundaries) {
          try {
            const resolution = await Promise.race([
              renderDynamicContent(boundary, ctx),
              new Promise<BoundaryResolution>((_, reject) =>
                setTimeout(
                  () => reject(new Error("Timeout")),
                  timeout
                )
              ),
            ]);

            // Inject the content via script
            const escapedHtml = resolution.html
              .replace(/\\/g, "\\\\")
              .replace(/'/g, "\\'")
              .replace(/\n/g, "\\n")
              .replace(/\r/g, "\\r");

            const wrappedHtml = `<div id="${id}" data-ppr-boundary="true" data-ppr-resolved="true">${resolution.html}</div>`;
            const escapedWrapped = wrappedHtml
              .replace(/\\/g, "\\\\")
              .replace(/'/g, "\\'")
              .replace(/\n/g, "\\n")
              .replace(/\r/g, "\\r");

            controller.enqueue(
              encoder.encode(
                `<script>__PPR__.inject('${id}', '${escapedWrapped}');</script>\n`
              )
            );

            options.onBoundaryResolved?.(id);
          } catch (error) {
            // Send error fallback
            controller.enqueue(
              encoder.encode(
                `<script>__PPR__.inject('${id}', '<div data-ppr-error="true">Error loading content</div>');</script>\n`
              )
            );
          }
        }

        // Close document
        controller.enqueue(
          encoder.encode(`
<script>window.dispatchEvent(new CustomEvent('ppr:complete'));</script>
</body>
</html>`)
        );

        options.onComplete?.();
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

/**
 * Replace PPR markers with fallback content for initial render
 */
function replaceMarkersWithFallbacks(shell: StaticShell): string {
  let html = shell.html;

  for (const [id, metadata] of shell.boundaries) {
    // Remove the placeholder markers but keep the fallback div
    const startMarker = metadata.startMarker;
    const endMarker = metadata.endMarker;
    const fallbackStartMarker = PPR_FALLBACK_START(id);
    const fallbackEndMarker = PPR_FALLBACK_END(id);

    // Remove start marker
    html = html.replace(startMarker, "");
    // Remove end marker
    html = html.replace(endMarker, "");
    // Remove fallback markers but keep content between them
    html = html.replace(fallbackStartMarker, "");
    html = html.replace(fallbackEndMarker, "");
  }

  return html;
}

// ============================================================================
// Utility Functions
// ============================================================================

function isJSXElement(value: any): value is { type: any; props: any } {
  return value && typeof value === "object" && "type" in value && "props" in value;
}

function isVoidElement(tag: string): boolean {
  return /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(
    tag
  );
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
  if (!attrs) return "";

  return Object.entries(attrs)
    .filter(([key, value]) => {
      if (value == null || value === false) return false;
      if (typeof value === "function") return false;
      if (key.startsWith("__")) return false;
      return true;
    })
    .map(([key, value]) => {
      const attrName =
        key === "className" ? "class" : key === "htmlFor" ? "for" : key;
      if (typeof value === "boolean") return value ? attrName : "";
      return `${attrName}="${escapeHtml(String(value))}"`;
    })
    .filter(Boolean)
    .join(" ");
}

async function extractAssets(html: string): Promise<ShellAssets> {
  const assets: ShellAssets = {
    css: [],
    js: [],
    fonts: [],
  };

  // Extract CSS links
  const cssMatches = html.matchAll(
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*>/g
  );
  for (const match of cssMatches) {
    assets.css.push(match[1]!);
  }

  // Extract JS scripts
  const jsMatches = html.matchAll(/<script[^>]+src=["']([^"']+)["'][^>]*>/g);
  for (const match of jsMatches) {
    assets.js.push(match[1]!);
  }

  // Extract inline critical CSS
  const inlineStyleMatch = html.match(
    /<style[^>]*data-critical[^>]*>([\s\S]*?)<\/style>/
  );
  if (inlineStyleMatch && inlineStyleMatch[1] !== undefined) {
    assets.inlineCss = inlineStyleMatch[1];
  }

  return assets;
}

function generatePreloadTags(assets: ShellAssets): string {
  const tags: string[] = [];

  for (const css of assets.css) {
    tags.push(`<link rel="preload" href="${css}" as="style">`);
  }

  for (const js of assets.js) {
    tags.push(`<link rel="preload" href="${js}" as="script">`);
  }

  for (const font of assets.fonts) {
    tags.push(
      `<link rel="preload" href="${font}" as="font" type="font/woff2" crossorigin>`
    );
  }

  return tags.join("\n  ");
}

function parseCookies(cookieHeader: string): Map<string, string> {
  const cookies = new Map<string, string>();

  if (!cookieHeader) return cookies;

  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const [key, value] = pair.split("=").map((s) => s.trim());
    if (key && value) {
      cookies.set(key, decodeURIComponent(value));
    }
  }

  return cookies;
}

// ============================================================================
// Exports
// ============================================================================

export { Suspense } from "./streaming.js";
