/**
 * SSR streaming utilities.
 */
/**
 * Stream HTML chunks as they become available.
 * @param {AsyncIterable<string>} parts - Async iterable of HTML strings
 * @returns {ReadableStream<Uint8Array>}
 */
export declare function streamHTML(parts: AsyncIterable<string>): ReadableStream<Uint8Array>;
//# sourceMappingURL=stream.d.ts.map