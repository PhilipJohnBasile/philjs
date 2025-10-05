/**
 * SSR streaming utilities.
 */

/**
 * Stream HTML chunks as they become available.
 * @param {AsyncIterable<string>} parts - Async iterable of HTML strings
 * @returns {ReadableStream<Uint8Array>}
 */
export function streamHTML(parts) {
  const encoder = new TextEncoder();
  const iterator = parts[Symbol.asyncIterator]();

  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(value));
    }
  });
}
