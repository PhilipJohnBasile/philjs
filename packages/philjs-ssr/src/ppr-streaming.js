/**
 * Enhanced Streaming for Partial Prerendering (PPR)
 *
 * Provides advanced streaming capabilities for PPR, including:
 * - Priority-based boundary streaming
 * - Parallel resolution with concurrency control
 * - Progressive enhancement for slow connections
 * - Error recovery and fallback handling
 */
import { createPPRContext, renderDynamicContent, } from "./ppr.js";
// ============================================================================
// PPR Streaming Controller
// ============================================================================
/**
 * Controller for PPR streaming with advanced features
 */
export class PPRStreamController {
    shell;
    requestData;
    options;
    resolvedBoundaries = new Map();
    pendingBoundaries;
    aborted = false;
    constructor(options) {
        this.shell = options.shell;
        this.requestData = options.requestData;
        this.options = {
            shell: options.shell,
            requestData: options.requestData,
            onShellSent: options.onShellSent || (() => { }),
            onBoundaryResolved: options.onBoundaryResolved || (() => { }),
            onComplete: options.onComplete || (() => { }),
            onError: options.onError || (() => { }),
            timeout: options.timeout || 10000,
            abortOnError: options.abortOnError || false,
        };
        this.pendingBoundaries = new Set(this.shell.boundaries.keys());
    }
    /**
     * Create a streaming response
     */
    createStream() {
        const encoder = new TextEncoder();
        const controller = this;
        return new ReadableStream({
            async start(streamController) {
                try {
                    await controller.streamContent(streamController, encoder);
                }
                catch (error) {
                    controller.options.onError(error instanceof Error ? error : new Error(String(error)));
                    streamController.error(error);
                }
            },
            cancel() {
                controller.abort();
            },
        });
    }
    /**
     * Stream content with priority-based ordering
     */
    async streamContent(controller, encoder) {
        // Send HTML head and start of body
        controller.enqueue(encoder.encode(this.generateHead()));
        controller.enqueue(encoder.encode(this.generateShellHtml()));
        this.options.onShellSent();
        // Register pending boundaries in client
        controller.enqueue(encoder.encode(this.generatePendingScript()));
        // Stream dynamic boundaries by priority
        await this.streamBoundaries(controller, encoder);
        // Send closing tags
        controller.enqueue(encoder.encode(this.generateFooter()));
        this.options.onComplete();
        controller.close();
    }
    /**
     * Stream boundaries with priority ordering and concurrency
     */
    async streamBoundaries(controller, encoder) {
        // Group boundaries by priority
        const priorityGroups = this.groupByPriority();
        // Process each priority group in order (highest first)
        const priorities = Array.from(priorityGroups.keys()).sort((a, b) => b - a);
        for (const priority of priorities) {
            if (this.aborted)
                break;
            const boundaries = priorityGroups.get(priority);
            // Process boundaries in this priority group with concurrency
            await this.processBoundaryGroup(boundaries, controller, encoder);
        }
    }
    /**
     * Process a group of boundaries with controlled concurrency
     */
    async processBoundaryGroup(boundaries, controller, encoder, concurrency = 3) {
        const queue = [...boundaries];
        const inFlight = [];
        while (queue.length > 0 || inFlight.length > 0) {
            if (this.aborted)
                break;
            // Fill up to concurrency limit
            while (queue.length > 0 && inFlight.length < concurrency) {
                const boundary = queue.shift();
                const promise = this.resolveBoundary(boundary)
                    .then((resolution) => {
                    if (!this.aborted) {
                        controller.enqueue(encoder.encode(this.generateInjectionScript(resolution)));
                        this.options.onBoundaryResolved(resolution.id, resolution.html);
                    }
                })
                    .catch((error) => {
                    this.options.onError(error, boundary.id);
                    if (this.options.abortOnError) {
                        this.abort();
                    }
                    // Send error fallback
                    controller.enqueue(encoder.encode(this.generateErrorScript(boundary.id, error.message)));
                });
                inFlight.push(promise);
            }
            // Wait for at least one to complete
            if (inFlight.length > 0) {
                await Promise.race(inFlight);
                // Remove completed promises
                for (let i = inFlight.length - 1; i >= 0; i--) {
                    const promise = inFlight[i];
                    if (promise) {
                        const status = await Promise.race([
                            promise.then(() => "resolved"),
                            Promise.resolve("pending"),
                        ]);
                        if (status === "resolved") {
                            inFlight.splice(i, 1);
                        }
                    }
                }
            }
        }
    }
    /**
     * Resolve a single boundary
     */
    async resolveBoundary(metadata) {
        const ctx = createPPRContext("request", {
            requestData: this.requestData,
        });
        // Create a dummy boundary from metadata
        // In a real implementation, we'd need access to the original VNodes
        const boundary = {
            id: metadata.id,
            type: metadata.type,
            fallback: null,
            content: null, // This would come from re-rendering the component
            dataDependencies: metadata.dataDependencies,
            priority: metadata.priority,
        };
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Timeout resolving boundary ${metadata.id}`)), this.options.timeout);
        });
        const resolution = await Promise.race([
            renderDynamicContent(boundary, ctx),
            timeoutPromise,
        ]);
        this.resolvedBoundaries.set(metadata.id, resolution);
        this.pendingBoundaries.delete(metadata.id);
        return resolution;
    }
    /**
     * Group boundaries by priority
     */
    groupByPriority() {
        // ES2024: Use Map.groupBy() for cleaner grouping
        const boundaries = Array.from(this.shell.boundaries.values());
        return Map.groupBy(boundaries, (metadata) => metadata.priority);
    }
    /**
     * Generate HTML head section
     */
    generateHead() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PhilJS App</title>
  ${this.generateAssetPreloads()}
  ${this.generatePPRRuntime()}
  ${this.shell.assets.inlineCss ? `<style>${this.shell.assets.inlineCss}</style>` : ""}
</head>
<body>
`;
    }
    /**
     * Generate asset preload tags
     */
    generateAssetPreloads() {
        const tags = [];
        for (const css of this.shell.assets.css) {
            tags.push(`<link rel="preload" href="${css}" as="style">`);
            tags.push(`<link rel="stylesheet" href="${css}">`);
        }
        for (const js of this.shell.assets.js) {
            tags.push(`<link rel="modulepreload" href="${js}">`);
        }
        for (const font of this.shell.assets.fonts) {
            tags.push(`<link rel="preload" href="${font}" as="font" type="font/woff2" crossorigin>`);
        }
        return tags.join("\n  ");
    }
    /**
     * Generate PPR client runtime
     */
    generatePPRRuntime() {
        return `<script>
(function() {
  'use strict';

  window.__PPR__ = {
    version: '1.0.0',
    resolved: new Set(),
    pending: new Set(),
    callbacks: new Map(),
    errors: new Map(),

    inject: function(id, html, replace) {
      const el = document.getElementById(id);
      if (!el) {
        console.warn('[PPR] Element not found:', id);
        return false;
      }

      if (replace) {
        el.outerHTML = html;
      } else {
        el.innerHTML = html;
        el.dataset.pprResolved = 'true';
      }

      this.resolved.add(id);
      this.pending.delete(id);

      // Fire callbacks
      const callbacks = this.callbacks.get(id) || [];
      callbacks.forEach(cb => cb(html));
      this.callbacks.delete(id);

      // Dispatch event
      window.dispatchEvent(new CustomEvent('ppr:resolved', {
        detail: { id, html }
      }));

      // Check if all resolved
      if (this.pending.size === 0) {
        window.dispatchEvent(new CustomEvent('ppr:complete'));
      }

      return true;
    },

    error: function(id, message) {
      this.errors.set(id, message);
      this.pending.delete(id);

      const el = document.getElementById(id);
      if (el) {
        el.innerHTML = '<div data-ppr-error="true" class="ppr-error">Error: ' + message + '</div>';
        el.dataset.pprError = 'true';
      }

      window.dispatchEvent(new CustomEvent('ppr:error', {
        detail: { id, message }
      }));
    },

    onResolved: function(id, callback) {
      if (this.resolved.has(id)) {
        callback(document.getElementById(id)?.innerHTML || '');
        return;
      }

      if (!this.callbacks.has(id)) {
        this.callbacks.set(id, []);
      }
      this.callbacks.get(id).push(callback);
    },

    onComplete: function(callback) {
      if (this.pending.size === 0) {
        callback();
        return;
      }
      window.addEventListener('ppr:complete', callback, { once: true });
    },

    getStats: function() {
      return {
        resolved: this.resolved.size,
        pending: this.pending.size,
        errors: this.errors.size
      };
    }
  };
})();
</script>`;
    }
    /**
     * Generate shell HTML with fallbacks
     */
    generateShellHtml() {
        let html = this.shell.html;
        // Clean up PPR markers, keeping fallback content
        for (const [id, metadata] of this.shell.boundaries) {
            html = html
                .replace(metadata.startMarker, "")
                .replace(metadata.endMarker, "")
                .replace(`<!--ppr:fallback:${id}-->`, "")
                .replace(`<!--ppr:fallback-end:${id}-->`, "");
        }
        return html;
    }
    /**
     * Generate script to register pending boundaries
     */
    generatePendingScript() {
        const ids = Array.from(this.pendingBoundaries);
        if (ids.length === 0)
            return "";
        return `<script>
${ids.map((id) => `__PPR__.pending.add('${id}');`).join("\n")}
</script>\n`;
    }
    /**
     * Generate injection script for resolved boundary
     */
    generateInjectionScript(resolution) {
        const escapedHtml = this.escapeForScript(resolution.html);
        return `<script>__PPR__.inject('${resolution.id}', '${escapedHtml}');</script>\n`;
    }
    /**
     * Generate error script
     */
    generateErrorScript(id, message) {
        const escapedMessage = this.escapeForScript(message);
        return `<script>__PPR__.error('${id}', '${escapedMessage}');</script>\n`;
    }
    /**
     * Generate footer
     */
    generateFooter() {
        return `
<script>
  // Mark streaming complete
  window.__PPR__._streamComplete = true;
  window.dispatchEvent(new CustomEvent('ppr:stream-complete'));
</script>
</body>
</html>`;
    }
    /**
     * Escape string for use in JavaScript
     */
    escapeForScript(str) {
        return str
            .replace(/\\/g, "\\\\")
            .replace(/'/g, "\\'")
            .replace(/"/g, '\\"')
            .replace(/\n/g, "\\n")
            .replace(/\r/g, "\\r")
            .replace(/\t/g, "\\t")
            .replace(/<\/script>/gi, "<\\/script>");
    }
    /**
     * Abort streaming
     */
    abort() {
        this.aborted = true;
    }
    /**
     * Get current status
     */
    getStatus() {
        return {
            resolved: this.resolvedBoundaries.size,
            pending: this.pendingBoundaries.size,
            aborted: this.aborted,
        };
    }
}
// ============================================================================
// Streaming Utilities
// ============================================================================
/**
 * Create a PPR streaming response
 */
export function createPPRStream(options) {
    const controller = new PPRStreamController(options);
    return controller.createStream();
}
/**
 * Stream PPR response with progressive enhancement
 * Falls back to full page if streaming is not supported
 */
export async function streamPPRResponse(shell, vnode, request, options = {}) {
    const requestData = {
        request,
        params: extractParams(request.url),
        headers: request.headers,
        cookies: parseCookies(request.headers.get("cookie") || ""),
        timestamp: Date.now(),
    };
    // Check if client supports streaming
    const supportsStreaming = request.headers.get("accept")?.includes("text/html") &&
        !request.headers.get("x-disable-streaming");
    if (!supportsStreaming) {
        // Fall back to full render
        return await renderFullResponse(shell, vnode, requestData);
    }
    const streamOptions = {
        shell,
        requestData,
        timeout: options.timeout ?? 10000,
        abortOnError: options.abortOnError ?? false,
    };
    if (options.onShellSent) {
        streamOptions.onShellSent = options.onShellSent;
    }
    if (options.onBoundaryResolved) {
        streamOptions.onBoundaryResolved = options.onBoundaryResolved;
    }
    if (options.onComplete) {
        streamOptions.onComplete = options.onComplete;
    }
    if (options.onError) {
        streamOptions.onError = options.onError;
    }
    const stream = createPPRStream(streamOptions);
    return new Response(stream, {
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Transfer-Encoding": "chunked",
            "X-PPR-Enabled": "true",
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
    });
}
/**
 * Render full response without streaming
 */
async function renderFullResponse(shell, vnode, requestData) {
    const ctx = createPPRContext("request", { requestData });
    // Import dynamically to avoid circular dependency
    const { renderAllDynamicContent, injectDynamicContent } = await import("./ppr.js");
    const resolutions = await renderAllDynamicContent(shell, requestData, vnode);
    const html = injectDynamicContent(shell, resolutions);
    return new Response(html, {
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-PPR-Enabled": "true",
            "X-PPR-Streaming": "false",
        },
    });
}
// ============================================================================
// Helper Functions
// ============================================================================
function extractParams(url) {
    const params = {};
    try {
        const urlObj = new URL(url);
        urlObj.searchParams.forEach((value, key) => {
            params[key] = value;
        });
    }
    catch {
        // Invalid URL
    }
    return params;
}
function parseCookies(cookieHeader) {
    const cookies = new Map();
    if (!cookieHeader)
        return cookies;
    const pairs = cookieHeader.split(";");
    for (const pair of pairs) {
        const eqIndex = pair.indexOf("=");
        if (eqIndex > 0) {
            const key = pair.substring(0, eqIndex).trim();
            const value = pair.substring(eqIndex + 1).trim();
            try {
                cookies.set(key, decodeURIComponent(value));
            }
            catch {
                cookies.set(key, value);
            }
        }
    }
    return cookies;
}
//# sourceMappingURL=ppr-streaming.js.map