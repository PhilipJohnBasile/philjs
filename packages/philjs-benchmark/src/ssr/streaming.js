/**
 * Streaming SSR benchmarks.
 * Tests streaming render performance and characteristics.
 */
import { jsx, Fragment } from '@philjs/core/jsx-runtime';
import { signal, memo } from '@philjs/core';
import { randomLabel, now } from '../utils.js';
/**
 * Simple streaming renderer that simulates chunk-based output.
 */
async function* renderToStream(vnode) {
    if (vnode == null || typeof vnode === 'boolean') {
        return;
    }
    if (typeof vnode === 'string' || typeof vnode === 'number') {
        yield escapeHtml(String(vnode));
        return;
    }
    if (Array.isArray(vnode)) {
        for (const child of vnode) {
            yield* renderToStream(child);
        }
        return;
    }
    if (typeof vnode === 'object' && 'type' in vnode && 'props' in vnode) {
        const { type, props } = vnode;
        if (typeof type === 'function') {
            if (type === Fragment || type.name === 'Fragment') {
                yield* renderToStream(props.children);
                return;
            }
            // Check for async component
            const result = type(props);
            if (result instanceof Promise) {
                const resolved = await result;
                yield* renderToStream(resolved);
            }
            else {
                yield* renderToStream(result);
            }
            return;
        }
        if (typeof type === 'string') {
            const { children, ...attrs } = props;
            const attrsString = renderAttrs(attrs);
            const openTag = attrsString ? `<${type} ${attrsString}>` : `<${type}>`;
            yield openTag;
            if (!isVoidElement(type)) {
                yield* renderToStream(children);
                yield `</${type}>`;
            }
        }
    }
    if (typeof vnode === 'function') {
        yield* renderToStream(vnode());
    }
}
function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function renderAttrs(attrs) {
    return Object.entries(attrs)
        .filter(([key, value]) => {
        if (value == null || value === false)
            return false;
        if (typeof value === 'function')
            return false;
        if (key.startsWith('__'))
            return false;
        return true;
    })
        .map(([key, value]) => {
        const attrName = key === 'className' ? 'class' : key === 'htmlFor' ? 'for' : key;
        if (typeof value === 'boolean')
            return value ? attrName : '';
        return `${attrName}="${escapeHtml(String(value))}"`;
    })
        .filter(Boolean)
        .join(' ');
}
function isVoidElement(tag) {
    return /^(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/.test(tag);
}
/**
 * Async data loading component.
 */
function AsyncComponent({ delay, content }) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(jsx('div', { children: content }));
        }, delay);
    });
}
/**
 * Create test rows.
 */
function createRows(count) {
    return Array.from({ length: count }, (_, i) => ({
        id: i + 1,
        label: randomLabel(),
    }));
}
/**
 * Streaming render of 1000 rows.
 */
export const stream1000Rows = {
    name: 'stream-1000-rows',
    iterations: 50,
    fn: async () => {
        const rows = createRows(1000);
        const vnode = jsx('table', {
            children: jsx('tbody', {
                children: rows.map(row => jsx('tr', {
                    key: row.id,
                    children: [
                        jsx('td', { children: String(row.id) }),
                        jsx('td', { children: row.label }),
                    ],
                })),
            }),
        });
        let totalChunks = 0;
        let totalSize = 0;
        for await (const chunk of renderToStream(vnode)) {
            totalChunks++;
            totalSize += chunk.length;
        }
    },
};
/**
 * Time to first byte simulation.
 */
export const timeToFirstByte = {
    name: 'time-to-first-byte',
    iterations: 100,
    fn: async () => {
        const rows = createRows(100);
        const vnode = jsx('html', {
            children: [
                jsx('head', {
                    children: jsx('title', { children: 'Test' }),
                }),
                jsx('body', {
                    children: jsx('table', {
                        children: jsx('tbody', {
                            children: rows.map(row => jsx('tr', {
                                key: row.id,
                                children: [
                                    jsx('td', { children: String(row.id) }),
                                    jsx('td', { children: row.label }),
                                ],
                            })),
                        }),
                    }),
                }),
            ],
        });
        const stream = renderToStream(vnode);
        const firstChunk = await stream.next();
        // Consume rest of stream
        for await (const _ of stream) {
            // Drain
        }
    },
};
/**
 * Streaming with Suspense-like boundaries.
 */
export const streamWithSuspense = {
    name: 'stream-with-suspense',
    iterations: 20,
    fn: async () => {
        // Simulated Suspense component
        function Suspense({ fallback, children }) {
            return jsx('div', {
                'data-suspense': 'true',
                children: [
                    jsx('template', { 'data-fallback': 'true', children: fallback }),
                    children,
                ],
            });
        }
        // Async content
        async function AsyncContent() {
            await new Promise(resolve => setTimeout(resolve, 1));
            return jsx('div', { children: 'Loaded content' });
        }
        const vnode = jsx('div', {
            children: [
                jsx('header', { children: 'Header' }),
                Suspense({
                    fallback: jsx('div', { children: 'Loading...' }),
                    children: AsyncContent(),
                }),
                jsx('footer', { children: 'Footer' }),
            ],
        });
        for await (const chunk of renderToStream(vnode)) {
            // Process chunks
        }
    },
};
/**
 * Chunk size analysis.
 */
export const chunkSizeAnalysis = {
    name: 'chunk-size-analysis',
    iterations: 20,
    fn: async () => {
        const rows = createRows(1000);
        const vnode = jsx('table', {
            children: jsx('tbody', {
                children: rows.map(row => jsx('tr', {
                    key: row.id,
                    children: [
                        jsx('td', { children: String(row.id) }),
                        jsx('td', { children: row.label }),
                    ],
                })),
            }),
        });
        const chunkSizes = [];
        for await (const chunk of renderToStream(vnode)) {
            chunkSizes.push(chunk.length);
        }
        // Store analysis (not used in timing)
        globalThis.__lastChunkAnalysis = {
            totalChunks: chunkSizes.length,
            avgChunkSize: chunkSizes.reduce((a, b) => a + b, 0) / chunkSizes.length,
            minChunkSize: Math.min(...chunkSizes),
            maxChunkSize: Math.max(...chunkSizes),
            totalSize: chunkSizes.reduce((a, b) => a + b, 0),
        };
    },
};
/**
 * Streaming throughput.
 */
export const streamingThroughput = {
    name: 'streaming-throughput',
    iterations: 10,
    fn: async () => {
        const rows = createRows(10000);
        const vnode = jsx('table', {
            children: jsx('tbody', {
                children: rows.map(row => jsx('tr', {
                    key: row.id,
                    children: [
                        jsx('td', { children: String(row.id) }),
                        jsx('td', { children: row.label }),
                    ],
                })),
            }),
        });
        const start = now();
        let totalBytes = 0;
        for await (const chunk of renderToStream(vnode)) {
            totalBytes += new TextEncoder().encode(chunk).length;
        }
        const duration = now() - start;
        const throughputMBps = (totalBytes / (1024 * 1024)) / (duration / 1000);
        // Store for reporting
        globalThis.__lastThroughput = {
            bytes: totalBytes,
            durationMs: duration,
            throughputMBps,
        };
    },
};
/**
 * Partial streaming with early flush.
 */
export const partialStreaming = {
    name: 'partial-streaming-early-flush',
    iterations: 50,
    fn: async () => {
        // Shell that can be sent immediately
        const shell = jsx('html', {
            children: [
                jsx('head', {
                    children: [
                        jsx('title', { children: 'App' }),
                        jsx('link', { rel: 'stylesheet', href: '/styles.css' }),
                    ],
                }),
                jsx('body', {
                    children: [
                        jsx('div', { id: 'shell', children: 'Loading...' }),
                        jsx('script', { src: '/app.js' }),
                    ],
                }),
            ],
        });
        // Collect shell chunks
        let shellHtml = '';
        for await (const chunk of renderToStream(shell)) {
            shellHtml += chunk;
        }
        // Simulate deferred content
        const rows = createRows(100);
        const content = jsx('div', {
            id: 'content',
            children: rows.map(row => jsx('div', { key: row.id, children: row.label })),
        });
        // Stream content
        for await (const chunk of renderToStream(content)) {
            // Would be injected via script
        }
    },
};
/**
 * Out-of-order streaming simulation.
 */
export const outOfOrderStreaming = {
    name: 'out-of-order-streaming',
    iterations: 20,
    fn: async () => {
        const slots = new Map();
        const pendingSlots = new Map();
        // Simulate multiple async boundaries
        for (let i = 0; i < 5; i++) {
            const slotId = `slot-${i}`;
            const delay = Math.random() * 10;
            pendingSlots.set(slotId, new Promise(resolve => {
                setTimeout(() => {
                    const content = Array.from({ length: 20 }, (_, j) => `<div>Item ${i}-${j}</div>`).join('');
                    resolve(content);
                }, delay);
            }));
        }
        // Wait for all slots (simulating out-of-order completion)
        const results = await Promise.all(Array.from(pendingSlots.entries()).map(async ([id, promise]) => ({
            id,
            content: await promise,
        })));
        // Process in completion order
        for (const { id, content } of results) {
            slots.set(id, content);
        }
    },
};
export const streamingBenchmarks = [
    stream1000Rows,
    timeToFirstByte,
    streamWithSuspense,
    chunkSizeAnalysis,
    streamingThroughput,
    partialStreaming,
    outOfOrderStreaming,
];
export default streamingBenchmarks;
//# sourceMappingURL=streaming.js.map