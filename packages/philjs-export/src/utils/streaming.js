/**
 * Streaming Utilities
 * Utilities for streaming large datasets during export
 */
/**
 * Create a progress tracker for streaming operations
 */
export function createProgressTracker(totalItems, onProgress) {
    const startTime = Date.now();
    let lastUpdate = startTime;
    let totalBytes = 0;
    let lastProcessedItems = 0;
    let chunks = 0;
    return {
        update: (processedItems, bytesWritten) => {
            const now = Date.now();
            const elapsedMs = now - startTime;
            totalBytes += bytesWritten;
            chunks++;
            const itemsPerSecond = elapsedMs > 0 ? (processedItems / elapsedMs) * 1000 : 0;
            const progress = {
                progress: totalItems ? processedItems / totalItems : 0,
                processedItems,
                ...(totalItems !== undefined && { totalItems }),
                bytesWritten: totalBytes,
                elapsedMs,
                itemsPerSecond,
            };
            if (totalItems && itemsPerSecond > 0) {
                const remainingItems = totalItems - processedItems;
                progress.estimatedRemainingMs = (remainingItems / itemsPerSecond) * 1000;
            }
            // Throttle progress updates to avoid excessive callbacks
            if (now - lastUpdate > 100 || processedItems === totalItems) {
                onProgress?.(progress);
                lastUpdate = now;
            }
            lastProcessedItems = processedItems;
        },
        complete: () => {
            const totalTimeMs = Date.now() - startTime;
            return {
                totalItems: lastProcessedItems,
                totalBytes,
                totalTimeMs,
                averageItemsPerSecond: totalTimeMs > 0 ? (lastProcessedItems / totalTimeMs) * 1000 : 0,
                chunks,
            };
        },
    };
}
/**
 * Chunk an array into smaller arrays
 */
export function* chunkArray(array, chunkSize) {
    for (let i = 0; i < array.length; i += chunkSize) {
        yield array.slice(i, i + chunkSize);
    }
}
/**
 * Chunk an async iterable into arrays
 */
export async function* chunkAsyncIterable(iterable, chunkSize) {
    let chunk = [];
    for await (const item of iterable) {
        chunk.push(item);
        if (chunk.length >= chunkSize) {
            yield chunk;
            chunk = [];
        }
    }
    if (chunk.length > 0) {
        yield chunk;
    }
}
/**
 * Create a readable stream from an async generator
 */
export function createReadableStream(generator, options = {}) {
    const { signal } = options;
    return new ReadableStream({
        async pull(controller) {
            if (signal?.aborted) {
                controller.close();
                return;
            }
            try {
                const { value, done } = await generator.next();
                if (done) {
                    controller.close();
                }
                else {
                    controller.enqueue(value);
                }
            }
            catch (error) {
                controller.error(error);
            }
        },
        cancel() {
            generator.return(undefined);
        },
    });
}
/**
 * Create a writable stream that collects chunks
 */
export function createCollectorStream() {
    const chunks = [];
    const stream = new WritableStream({
        write(chunk) {
            chunks.push(chunk);
        },
    });
    return {
        stream,
        getResult: () => chunks,
    };
}
/**
 * Pipe an async generator through a transform function
 */
export async function* transformStream(source, transform) {
    for await (const chunk of source) {
        yield await transform(chunk);
    }
}
/**
 * Concatenate string chunks into a single string
 */
export async function concatStringStream(source) {
    const chunks = [];
    for await (const chunk of source) {
        chunks.push(chunk);
    }
    return chunks.join('');
}
/**
 * Create a Blob from a stream of string chunks
 */
export async function streamToBlob(source, mimeType) {
    const chunks = [];
    for await (const chunk of source) {
        chunks.push(chunk);
    }
    return new Blob(chunks, { type: mimeType });
}
/**
 * Create a Blob from a stream of ArrayBuffer chunks
 */
export async function streamToBlobFromBuffers(source, mimeType) {
    const chunks = [];
    for await (const chunk of source) {
        chunks.push(chunk);
    }
    return new Blob(chunks, { type: mimeType });
}
/**
 * Rate limit an async generator
 */
export async function* rateLimitStream(source, itemsPerSecond) {
    const interval = 1000 / itemsPerSecond;
    let lastYield = Date.now();
    for await (const item of source) {
        const now = Date.now();
        const elapsed = now - lastYield;
        if (elapsed < interval) {
            await new Promise(resolve => setTimeout(resolve, interval - elapsed));
        }
        yield item;
        lastYield = Date.now();
    }
}
/**
 * Add progress tracking to an async generator
 */
export async function* withProgress(source, options) {
    const tracker = createProgressTracker(options.totalItems, options.onProgress);
    let processedItems = 0;
    let bytesWritten = 0;
    for await (const item of source) {
        processedItems++;
        // Estimate bytes (rough approximation)
        if (typeof item === 'string') {
            bytesWritten += item.length;
        }
        else if (item instanceof ArrayBuffer) {
            bytesWritten += item.byteLength;
        }
        tracker.update(processedItems, bytesWritten);
        yield item;
    }
    tracker.complete();
}
/**
 * Buffer chunks until a minimum size is reached
 */
export async function* bufferStream(source, minBufferSize) {
    let buffer = '';
    for await (const chunk of source) {
        buffer += chunk;
        if (buffer.length >= minBufferSize) {
            yield buffer;
            buffer = '';
        }
    }
    if (buffer.length > 0) {
        yield buffer;
    }
}
/**
 * Create an abort controller with timeout
 */
export function createTimeoutController(timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        controller.abort(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    // Clean up timeout when signal is aborted
    controller.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
    });
    return controller;
}
//# sourceMappingURL=streaming.js.map