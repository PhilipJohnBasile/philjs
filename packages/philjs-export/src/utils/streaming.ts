/**
 * Streaming Utilities
 * Utilities for streaming large datasets during export
 */

export interface StreamOptions {
  /** Chunk size (number of items per chunk) */
  chunkSize?: number;
  /** High water mark for backpressure */
  highWaterMark?: number;
  /** Progress callback */
  onProgress?: (progress: StreamProgress) => void;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Completion callback */
  onComplete?: (stats: StreamStats) => void;
  /** Abort signal */
  signal?: AbortSignal;
}

export interface StreamProgress {
  /** Progress as a fraction (0-1) */
  progress: number;
  /** Number of items processed */
  processedItems: number;
  /** Total items (if known) */
  totalItems?: number;
  /** Bytes written */
  bytesWritten: number;
  /** Elapsed time in ms */
  elapsedMs: number;
  /** Estimated time remaining in ms */
  estimatedRemainingMs?: number;
  /** Processing rate (items per second) */
  itemsPerSecond: number;
}

export interface StreamStats {
  /** Total items processed */
  totalItems: number;
  /** Total bytes written */
  totalBytes: number;
  /** Total time in ms */
  totalTimeMs: number;
  /** Average items per second */
  averageItemsPerSecond: number;
  /** Number of chunks */
  chunks: number;
}

/**
 * Create a progress tracker for streaming operations
 */
export function createProgressTracker(
  totalItems?: number,
  onProgress?: (progress: StreamProgress) => void
): {
  update: (processedItems: number, bytesWritten: number) => void;
  complete: () => StreamStats;
} {
  const startTime = Date.now();
  let lastUpdate = startTime;
  let totalBytes = 0;
  let lastProcessedItems = 0;
  let chunks = 0;

  return {
    update: (processedItems: number, bytesWritten: number) => {
      const now = Date.now();
      const elapsedMs = now - startTime;
      totalBytes += bytesWritten;
      chunks++;

      const itemsPerSecond =
        elapsedMs > 0 ? (processedItems / elapsedMs) * 1000 : 0;

      const progress: StreamProgress = {
        progress: totalItems ? processedItems / totalItems : 0,
        processedItems,
        totalItems,
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

    complete: (): StreamStats => {
      const totalTimeMs = Date.now() - startTime;
      return {
        totalItems: lastProcessedItems,
        totalBytes,
        totalTimeMs,
        averageItemsPerSecond:
          totalTimeMs > 0 ? (lastProcessedItems / totalTimeMs) * 1000 : 0,
        chunks,
      };
    },
  };
}

/**
 * Chunk an array into smaller arrays
 */
export function* chunkArray<T>(array: T[], chunkSize: number): Generator<T[]> {
  for (let i = 0; i < array.length; i += chunkSize) {
    yield array.slice(i, i + chunkSize);
  }
}

/**
 * Chunk an async iterable into arrays
 */
export async function* chunkAsyncIterable<T>(
  iterable: AsyncIterable<T>,
  chunkSize: number
): AsyncGenerator<T[]> {
  let chunk: T[] = [];

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
export function createReadableStream<T>(
  generator: AsyncGenerator<T>,
  options: { signal?: AbortSignal } = {}
): ReadableStream<T> {
  const { signal } = options;

  return new ReadableStream<T>({
    async pull(controller) {
      if (signal?.aborted) {
        controller.close();
        return;
      }

      try {
        const { value, done } = await generator.next();

        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      } catch (error) {
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
export function createCollectorStream<T>(): {
  stream: WritableStream<T>;
  getResult: () => T[];
} {
  const chunks: T[] = [];

  const stream = new WritableStream<T>({
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
export async function* transformStream<T, U>(
  source: AsyncIterable<T>,
  transform: (chunk: T) => U | Promise<U>
): AsyncGenerator<U> {
  for await (const chunk of source) {
    yield await transform(chunk);
  }
}

/**
 * Concatenate string chunks into a single string
 */
export async function concatStringStream(
  source: AsyncIterable<string>
): Promise<string> {
  const chunks: string[] = [];

  for await (const chunk of source) {
    chunks.push(chunk);
  }

  return chunks.join('');
}

/**
 * Create a Blob from a stream of string chunks
 */
export async function streamToBlob(
  source: AsyncIterable<string>,
  mimeType: string
): Promise<Blob> {
  const chunks: string[] = [];

  for await (const chunk of source) {
    chunks.push(chunk);
  }

  return new Blob(chunks, { type: mimeType });
}

/**
 * Create a Blob from a stream of ArrayBuffer chunks
 */
export async function streamToBlobFromBuffers(
  source: AsyncIterable<ArrayBuffer>,
  mimeType: string
): Promise<Blob> {
  const chunks: ArrayBuffer[] = [];

  for await (const chunk of source) {
    chunks.push(chunk);
  }

  return new Blob(chunks, { type: mimeType });
}

/**
 * Rate limit an async generator
 */
export async function* rateLimitStream<T>(
  source: AsyncIterable<T>,
  itemsPerSecond: number
): AsyncGenerator<T> {
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
export async function* withProgress<T>(
  source: AsyncIterable<T>,
  options: {
    totalItems?: number;
    onProgress?: (progress: StreamProgress) => void;
  }
): AsyncGenerator<T> {
  const tracker = createProgressTracker(options.totalItems, options.onProgress);
  let processedItems = 0;
  let bytesWritten = 0;

  for await (const item of source) {
    processedItems++;

    // Estimate bytes (rough approximation)
    if (typeof item === 'string') {
      bytesWritten += item.length;
    } else if (item instanceof ArrayBuffer) {
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
export async function* bufferStream(
  source: AsyncIterable<string>,
  minBufferSize: number
): AsyncGenerator<string> {
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
export function createTimeoutController(timeoutMs: number): AbortController {
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
