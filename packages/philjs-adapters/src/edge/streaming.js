/**
 * PhilJS Edge Streaming - Edge-Optimized Streaming Responses
 *
 * Provides optimized streaming capabilities for edge runtimes:
 * - Server-Sent Events (SSE)
 * - Chunked transfer encoding
 * - Progressive HTML streaming
 * - Edge-Side Includes (ESI)
 */
import { detectEdgePlatform } from './edge-runtime.js';
// ============================================================================
// Stream Creation Utilities
// ============================================================================
/**
 * Create a ReadableStream with a controller for writing
 */
export function createWritableStream() {
    let controller;
    let isClosed = false;
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
        start(c) {
            controller = c;
        },
        cancel() {
            isClosed = true;
        },
    });
    const writer = {
        async write(chunk) {
            if (isClosed) {
                throw new Error('Stream is closed');
            }
            const data = typeof chunk === 'string' ? encoder.encode(chunk) : chunk;
            controller.enqueue(data);
        },
        async writeAll(chunks) {
            for (const chunk of chunks) {
                await this.write(chunk);
            }
        },
        async flush() {
            // In edge environments, flushing is typically automatic
            // This is a no-op placeholder for API compatibility
        },
        async close() {
            if (!isClosed) {
                isClosed = true;
                controller.close();
            }
        },
        get closed() {
            return isClosed;
        },
    };
    return { readable, writer };
}
/**
 * Create a streaming response with proper headers
 */
export function createStreamingResponse(readable, config = {}) {
    const headers = new Headers({
        'Content-Type': 'text/html; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
        ...config.headers,
    });
    // Disable buffering on various edge platforms
    headers.set('X-Accel-Buffering', 'no');
    return new Response(readable, {
        status: 200,
        headers,
    });
}
// ============================================================================
// Server-Sent Events (SSE)
// ============================================================================
/**
 * Create an SSE stream for real-time updates
 */
export function createSSEStream() {
    const { readable, writer } = createWritableStream();
    const response = new Response(readable, {
        status: 200,
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
    const send = async (message) => {
        let data = '';
        if (message.id) {
            data += `id: ${message.id}\n`;
        }
        if (message.event) {
            data += `event: ${message.event}\n`;
        }
        if (message.retry) {
            data += `retry: ${message.retry}\n`;
        }
        const payload = typeof message.data === 'string'
            ? message.data
            : JSON.stringify(message.data);
        // Handle multi-line data
        for (const line of payload.split('\n')) {
            data += `data: ${line}\n`;
        }
        data += '\n';
        await writer.write(data);
    };
    const close = async () => {
        await writer.close();
    };
    return { response, send, close };
}
/**
 * Create an SSE event handler for edge runtimes
 */
export function createSSEHandler(handler) {
    return async (request) => {
        const { response, send, close } = createSSEStream();
        // Run handler in background
        const handlerPromise = handler(send, request)
            .catch((error) => {
            console.error('SSE handler error:', error);
            send({ event: 'error', data: { message: 'Internal server error' } });
        })
            .finally(() => close());
        // For edge runtimes that support waitUntil
        const platform = detectEdgePlatform();
        if (platform === 'cloudflare' || platform === 'vercel' || platform === 'netlify') {
            try {
                const ctx = globalThis.ctx || globalThis.executionContext;
                ctx?.waitUntil?.(handlerPromise);
            }
            catch {
                // Ignore errors in accessing context
            }
        }
        return response;
    };
}
/**
 * Create a progressive HTML streaming response
 */
export function createHTMLStream(options) {
    const { readable, writer } = createWritableStream();
    const response = new Response(readable, {
        status: 200,
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'X-Content-Type-Options': 'nosniff',
            'X-Accel-Buffering': 'no',
        },
    });
    // Send the shell immediately
    const shellParts = options.contentPlaceholder
        ? options.shell.split(options.contentPlaceholder)
        : [options.shell, ''];
    let initialized = false;
    const suspenseMap = new Map();
    const initStream = async () => {
        if (!initialized) {
            initialized = true;
            await writer.write(shellParts[0]);
        }
    };
    return {
        response,
        async writeChunk(html) {
            await initStream();
            await writer.write(html);
        },
        async writeSuspenseFallback(id, fallback) {
            await initStream();
            suspenseMap.set(id, false);
            await writer.write(`<template id="S:${id}"></template>${fallback}<!--/$-->`);
        },
        async resolveSuspense(id, content) {
            if (!suspenseMap.has(id)) {
                throw new Error(`Unknown suspense boundary: ${id}`);
            }
            suspenseMap.set(id, true);
            // Write the replacement script
            const script = `
<template id="R:${id}">${content}</template>
<script>
(function(){
  var template = document.getElementById('R:${id}');
  var marker = document.getElementById('S:${id}');
  if (template && marker) {
    var parent = marker.parentNode;
    var next = marker.nextSibling;
    parent.removeChild(marker);
    while (next && !(next.nodeType === 8 && next.data === '/$')) {
      var toRemove = next;
      next = next.nextSibling;
      parent.removeChild(toRemove);
    }
    if (next) parent.removeChild(next);
    var content = template.content;
    parent.insertBefore(content, next ? next.nextSibling : null);
    parent.removeChild(template);
  }
})();
</script>`;
            await writer.write(script);
        },
        async close() {
            await initStream();
            // Write any remaining shell content and footer
            if (shellParts[1] !== undefined) {
                await writer.write(shellParts[1]);
            }
            await writer.write(options.footer);
            await writer.close();
        },
    };
}
// ============================================================================
// Edge-Side Includes (ESI)
// ============================================================================
/**
 * Parse ESI tags from HTML content
 */
export function parseESITags(html) {
    const fragments = [];
    const esiRegex = /<esi:include\s+([^>]+)\s*\/?\s*>/gi;
    let match;
    while ((match = esiRegex.exec(html)) !== null) {
        const attrs = match[1] ?? '';
        const srcMatch = attrs.match(/src=["']([^"']+)["']/);
        const altMatch = attrs.match(/alt=["']([^"']+)["']/);
        const ttlMatch = attrs.match(/ttl=["'](\d+)["']/);
        if (srcMatch && srcMatch[1] !== undefined) {
            const fragment = {
                src: srcMatch[1],
                parallel: true,
            };
            if (altMatch?.[1] !== undefined) {
                fragment.alt = altMatch[1];
            }
            if (ttlMatch !== null && ttlMatch[1] !== undefined) {
                fragment.ttl = parseInt(ttlMatch[1], 10);
            }
            fragments.push(fragment);
        }
    }
    return fragments;
}
/**
 * Process ESI includes in HTML content
 */
export async function processESI(html, options = {}) {
    const { baseUrl = '', timeout = 5000, fetch: customFetch = globalThis.fetch, cache = new Map(), } = options;
    const fragments = parseESITags(html);
    if (fragments.length === 0) {
        return html;
    }
    // Fetch all fragments in parallel
    const results = await Promise.all(fragments.map(async (fragment) => {
        const url = fragment.src.startsWith('http')
            ? fragment.src
            : `${baseUrl}${fragment.src}`;
        // Check cache
        const cached = cache.get(url);
        if (cached && cached.expires > Date.now()) {
            return { fragment, content: cached.content };
        }
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            const response = await customFetch(url, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`ESI fetch failed: ${response.status}`);
            }
            const content = await response.text();
            // Cache the result
            if (fragment.ttl) {
                cache.set(url, {
                    content,
                    expires: Date.now() + fragment.ttl * 1000,
                });
            }
            return { fragment, content };
        }
        catch (error) {
            console.error(`ESI fetch error for ${url}:`, error);
            return { fragment, content: fragment.alt || '' };
        }
    }));
    // Replace ESI tags with fetched content
    let result = html;
    for (const { fragment, content } of results) {
        const esiTag = new RegExp(`<esi:include\\s+[^>]*src=["']${escapeRegExp(fragment.src)}["'][^>]*\\/?\\s*>`, 'gi');
        result = result.replace(esiTag, content);
    }
    return result;
}
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
/**
 * Create an ESI processor middleware
 */
export function createESIMiddleware(options) {
    const cache = new Map();
    const maxCacheSize = options.cacheSize || 100;
    return async (response) => {
        // Only process HTML responses
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('text/html')) {
            return response;
        }
        const html = await response.text();
        // Check if ESI tags exist
        if (!html.includes('<esi:include')) {
            return new Response(html, {
                status: response.status,
                headers: response.headers,
            });
        }
        // Limit cache size
        if (cache.size > maxCacheSize) {
            const keysToDelete = Array.from(cache.keys()).slice(0, cache.size - maxCacheSize);
            for (const key of keysToDelete) {
                cache.delete(key);
            }
        }
        const processOptions = { cache };
        if (options.baseUrl !== undefined) {
            processOptions.baseUrl = options.baseUrl;
        }
        if (options.timeout !== undefined) {
            processOptions.timeout = options.timeout;
        }
        const processed = await processESI(html, processOptions);
        return new Response(processed, {
            status: response.status,
            headers: response.headers,
        });
    };
}
// ============================================================================
// Streaming Utilities
// ============================================================================
/**
 * Stream a fetch response through to the client
 */
export async function streamThrough(response, transform) {
    if (!response.body) {
        return response;
    }
    const reader = response.body.getReader();
    const { readable, writer } = createWritableStream();
    // Stream in background
    (async () => {
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                const chunk = transform ? await transform(value) : value;
                await writer.write(chunk);
            }
        }
        catch (error) {
            console.error('Stream error:', error);
        }
        finally {
            await writer.close();
        }
    })();
    return new Response(readable, {
        status: response.status,
        headers: response.headers,
    });
}
/**
 * Merge multiple streams into one
 */
export function mergeStreams(streams, options = {}) {
    const { sequential = true } = options;
    if (sequential) {
        // Sequential: one stream after another
        return new ReadableStream({
            async start(controller) {
                for (const stream of streams) {
                    const reader = stream.getReader();
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done)
                                break;
                            controller.enqueue(value);
                        }
                    }
                    finally {
                        reader.releaseLock();
                    }
                }
                controller.close();
            },
        });
    }
    else {
        // Parallel: interleave chunks as they arrive
        return new ReadableStream({
            async start(controller) {
                const readers = streams.map((s) => s.getReader());
                const activeReaders = new Set(readers);
                const readFromAll = async () => {
                    while (activeReaders.size > 0) {
                        const readPromises = Array.from(activeReaders).map(async (reader) => {
                            const result = await reader.read();
                            if (result.done) {
                                activeReaders.delete(reader);
                                reader.releaseLock();
                                return null;
                            }
                            return result.value;
                        });
                        const results = await Promise.all(readPromises);
                        for (const chunk of results) {
                            if (chunk) {
                                controller.enqueue(chunk);
                            }
                        }
                    }
                    controller.close();
                };
                readFromAll().catch((error) => controller.error(error));
            },
        });
    }
}
/**
 * Create a tee that allows streaming to multiple destinations
 */
export function createStreamTee(source, count = 2) {
    const streams = [];
    const controllers = [];
    for (let i = 0; i < count; i++) {
        streams.push(new ReadableStream({
            start(controller) {
                controllers.push(controller);
            },
        }));
    }
    // Pump source to all destinations
    (async () => {
        const reader = source.getReader();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    for (const controller of controllers) {
                        controller.close();
                    }
                    break;
                }
                for (const controller of controllers) {
                    controller.enqueue(value);
                }
            }
        }
        catch (error) {
            for (const controller of controllers) {
                controller.error(error);
            }
        }
    })();
    return streams;
}
// ============================================================================
// Exports
// ============================================================================
export default {
    createWritableStream,
    createStreamingResponse,
    createSSEStream,
    createSSEHandler,
    createHTMLStream,
    parseESITags,
    processESI,
    createESIMiddleware,
    streamThrough,
    mergeStreams,
    createStreamTee,
};
//# sourceMappingURL=streaming.js.map