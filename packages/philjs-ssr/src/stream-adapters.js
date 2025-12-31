/**
 * Adapters for converting Web Streams to Node.js streams and vice versa.
 */
import { Readable } from "stream";
/**
 * Convert a Web ReadableStream to a Node.js Readable stream.
 */
export function webStreamToNodeStream(webStream) {
    const reader = webStream.getReader();
    let reading = false;
    return new Readable({
        async read() {
            if (reading)
                return;
            reading = true;
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        this.push(null);
                        break;
                    }
                    if (value) {
                        const shouldContinue = this.push(Buffer.from(value));
                        if (!shouldContinue) {
                            break;
                        }
                    }
                }
            }
            catch (error) {
                this.destroy(error);
            }
            finally {
                reading = false;
            }
        },
        destroy(error, callback) {
            reader.cancel(error || undefined).then(() => callback(error), (err) => callback(err || error));
        },
    });
}
/**
 * Convert a Node.js Readable stream to a Web ReadableStream.
 */
export function nodeStreamToWebStream(nodeStream) {
    return new ReadableStream({
        start(controller) {
            nodeStream.on("data", (chunk) => {
                controller.enqueue(new Uint8Array(chunk));
            });
            nodeStream.on("end", () => {
                controller.close();
            });
            nodeStream.on("error", (error) => {
                controller.error(error);
            });
        },
        cancel() {
            nodeStream.destroy();
        },
    });
}
/**
 * Pipe a Web ReadableStream to a Node.js Writable stream.
 */
export async function pipeWebStreamToNode(webStream, nodeStream) {
    const reader = webStream.getReader();
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            if (value) {
                await new Promise((resolve, reject) => {
                    const canContinue = nodeStream.write(Buffer.from(value));
                    if (canContinue) {
                        resolve();
                    }
                    else {
                        nodeStream.once("drain", resolve);
                        nodeStream.once("error", reject);
                    }
                });
            }
        }
    }
    catch (error) {
        reader.cancel(error);
        throw error;
    }
    finally {
        reader.releaseLock();
    }
}
/**
 * Create a transform stream that measures throughput.
 */
export function createThroughputMeasurer() {
    let bytesWritten = 0;
    let chunksWritten = 0;
    const startTime = Date.now();
    const stream = new TransformStream({
        transform(chunk, controller) {
            bytesWritten += chunk.byteLength;
            chunksWritten++;
            controller.enqueue(chunk);
        },
    });
    return {
        stream,
        getStats: () => ({
            bytes: bytesWritten,
            chunks: chunksWritten,
            duration: Date.now() - startTime,
        }),
    };
}
/**
 * Create a transform stream that adds compression headers.
 */
export function createCompressionStream(encoding) {
    // Note: Actual compression would require a compression library
    // This is a placeholder for the compression transform
    return new TransformStream({
        start(controller) {
            // Add headers or initialization
        },
        transform(chunk, controller) {
            // In a real implementation, this would compress the chunk
            controller.enqueue(chunk);
        },
        flush(controller) {
            // Finalize compression
        },
    });
}
/**
 * Create a multiplexed stream that sends chunks to multiple destinations.
 */
export function createMultiplexStream(destinations) {
    const writers = destinations.map((dest) => dest.getWriter());
    return new WritableStream({
        async write(chunk) {
            await Promise.all(writers.map((writer) => writer.write(chunk)));
        },
        async close() {
            await Promise.all(writers.map((writer) => writer.close()));
        },
        async abort(reason) {
            await Promise.all(writers.map((writer) => writer.abort(reason)));
        },
    });
}
/**
 * Buffer stream chunks until a delimiter or size is reached.
 */
export function createBufferedStream(maxBufferSize = 8192) {
    let buffer = [];
    let bufferSize = 0;
    const flush = (controller) => {
        if (buffer.length === 0)
            return;
        // Concatenate buffer chunks
        const totalLength = buffer.reduce((sum, chunk) => sum + chunk.byteLength, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of buffer) {
            result.set(chunk, offset);
            offset += chunk.byteLength;
        }
        controller.enqueue(result);
        buffer = [];
        bufferSize = 0;
    };
    return new TransformStream({
        transform(chunk, controller) {
            buffer.push(chunk);
            bufferSize += chunk.byteLength;
            if (bufferSize >= maxBufferSize) {
                flush(controller);
            }
        },
        flush(controller) {
            flush(controller);
        },
    });
}
export function createTimingStream() {
    let index = 0;
    return new TransformStream({
        transform(chunk, controller) {
            controller.enqueue({
                chunk,
                timestamp: Date.now(),
                index: index++,
            });
        },
    });
}
/**
 * Rate limit a stream to a maximum bytes per second.
 */
export function createRateLimitedStream(bytesPerSecond) {
    let lastTime = Date.now();
    let bytesThisSecond = 0;
    return new TransformStream({
        async transform(chunk, controller) {
            const now = Date.now();
            const elapsed = now - lastTime;
            if (elapsed >= 1000) {
                // Reset counter every second
                lastTime = now;
                bytesThisSecond = 0;
            }
            bytesThisSecond += chunk.byteLength;
            if (bytesThisSecond > bytesPerSecond) {
                // Calculate delay needed
                const delay = 1000 - elapsed;
                if (delay > 0) {
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
                lastTime = Date.now();
                bytesThisSecond = chunk.byteLength;
            }
            controller.enqueue(chunk);
        },
    });
}
/**
 * Create a stream that only passes through chunks matching a predicate.
 */
export function createFilterStream(predicate) {
    return new TransformStream({
        transform(chunk, controller) {
            if (predicate(chunk)) {
                controller.enqueue(chunk);
            }
        },
    });
}
/**
 * Tee a stream into two independent streams.
 */
export function teeStream(stream) {
    return stream.tee();
}
/**
 * Merge multiple streams into one.
 */
export async function* mergeStreams(...streams) {
    const readers = streams.map((stream) => stream.getReader());
    try {
        const promises = readers.map(async (reader, index) => {
            const { done, value } = await reader.read();
            return { done, value, index };
        });
        while (promises.length > 0) {
            const result = await Promise.race(promises);
            if (!result.done && result.value !== undefined) {
                yield result.value;
                // Replace the promise for this reader
                const reader = readers[result.index];
                if (reader) {
                    promises[result.index] = reader.read().then(({ done, value }) => ({ done, value, index: result.index }));
                }
            }
            else {
                // Remove completed reader
                const reader = readers[result.index];
                if (reader) {
                    reader.releaseLock();
                }
                promises.splice(result.index, 1);
                readers.splice(result.index, 1);
            }
        }
    }
    finally {
        // Clean up any remaining readers
        readers.forEach((reader) => reader.releaseLock());
    }
}
//# sourceMappingURL=stream-adapters.js.map