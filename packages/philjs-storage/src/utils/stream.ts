/**
 * Streaming Upload Utilities
 *
 * Helpers for streaming file uploads with progress tracking,
 * chunked transfers, and abort handling.
 */

import type { UploadProgress } from '../index.js';

/**
 * Streaming upload options
 */
export interface StreamingUploadOptions {
  /** Chunk size in bytes (default: 64KB) */
  chunkSize?: number;
  /** Progress callback */
  onProgress?: (progress: UploadProgress) => void;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
  /** Total size if known (enables percentage calculation) */
  totalSize?: number;
}

/**
 * Chunked upload state
 */
export interface ChunkedUploadState {
  /** Upload ID for resumable uploads */
  uploadId: string;
  /** Uploaded parts */
  parts: UploadedPart[];
  /** Total bytes uploaded */
  uploadedBytes: number;
  /** Total size (if known) */
  totalSize?: number;
  /** Start time */
  startTime: number;
}

/**
 * Uploaded part info
 */
export interface UploadedPart {
  /** Part number (1-based) */
  partNumber: number;
  /** ETag of the uploaded part */
  etag: string;
  /** Size of the part in bytes */
  size: number;
}

/**
 * Create a streaming upload that processes data in chunks
 *
 * @param stream - Input ReadableStream
 * @param processor - Function to process each chunk
 * @param options - Upload options
 * @returns Final result from processor
 */
export async function createStreamingUpload<T>(
  stream: ReadableStream<Uint8Array>,
  processor: (chunks: AsyncGenerator<Uint8Array, void, unknown>) => Promise<T>,
  options: StreamingUploadOptions = {}
): Promise<T> {
  const chunkSize = options.chunkSize || 64 * 1024;
  let uploadedBytes = 0;
  let buffer = new Uint8Array(0);

  async function* chunkGenerator(): AsyncGenerator<Uint8Array, void, unknown> {
    const reader = stream.getReader();

    try {
      while (true) {
        if (options.signal?.aborted) {
          throw new DOMException('Upload aborted', 'AbortError');
        }

        const { done, value } = await reader.read();

        if (done) {
          // Yield any remaining buffer
          if (buffer.length > 0) {
            uploadedBytes += buffer.length;
            if (options.onProgress) {
              options.onProgress({
                loaded: uploadedBytes,
                total: options.totalSize || uploadedBytes,
                percentage: options.totalSize
                  ? Math.round((uploadedBytes / options.totalSize) * 100)
                  : -1,
              });
            }
            yield buffer;
          }
          break;
        }

        // Combine with existing buffer
        const combined = new Uint8Array(buffer.length + value.length);
        combined.set(buffer);
        combined.set(value, buffer.length);
        buffer = combined;

        // Yield full chunks
        while (buffer.length >= chunkSize) {
          const chunk = buffer.slice(0, chunkSize);
          buffer = buffer.slice(chunkSize);
          uploadedBytes += chunk.length;

          if (options.onProgress) {
            options.onProgress({
              loaded: uploadedBytes,
              total: options.totalSize || uploadedBytes,
              percentage: options.totalSize
                ? Math.round((uploadedBytes / options.totalSize) * 100)
                : -1,
            });
          }

          yield chunk;
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  return processor(chunkGenerator());
}

/**
 * Convert a ReadableStream to a Buffer
 *
 * @param stream - Input stream
 * @param options - Options with optional progress tracking
 * @returns Buffer containing all stream data
 */
export async function streamToBuffer(
  stream: ReadableStream<Uint8Array>,
  options: StreamingUploadOptions = {}
): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  await createStreamingUpload(
    stream,
    async (generator) => {
      for await (const chunk of generator) {
        chunks.push(chunk);
        totalBytes += chunk.length;
      }
    },
    options
  );

  return Buffer.concat(chunks, totalBytes);
}

/**
 * Convert a Buffer to a ReadableStream
 *
 * @param buffer - Input buffer
 * @param chunkSize - Size of each chunk (default: 64KB)
 * @returns ReadableStream of the buffer data
 */
export function bufferToStream(buffer: Buffer, chunkSize = 64 * 1024): ReadableStream<Uint8Array> {
  let offset = 0;

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= buffer.length) {
        controller.close();
        return;
      }

      const chunk = buffer.slice(offset, offset + chunkSize);
      offset += chunk.length;
      controller.enqueue(new Uint8Array(chunk));
    },
  });
}

/**
 * Create a transform stream that tracks progress
 *
 * @param options - Progress tracking options
 * @returns TransformStream that passes through data while tracking progress
 */
export function createProgressStream(
  options: StreamingUploadOptions
): TransformStream<Uint8Array, Uint8Array> {
  let totalBytes = 0;

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      if (options.signal?.aborted) {
        controller.error(new DOMException('Upload aborted', 'AbortError'));
        return;
      }

      totalBytes += chunk.length;

      if (options.onProgress) {
        options.onProgress({
          loaded: totalBytes,
          total: options.totalSize || totalBytes,
          percentage: options.totalSize
            ? Math.round((totalBytes / options.totalSize) * 100)
            : -1,
        });
      }

      controller.enqueue(chunk);
    },
  });
}

/**
 * Split a stream into fixed-size chunks for multipart uploads
 *
 * @param stream - Input stream
 * @param partSize - Size of each part in bytes
 * @returns AsyncGenerator yielding parts
 */
export async function* splitIntoParts(
  stream: ReadableStream<Uint8Array>,
  partSize: number
): AsyncGenerator<{ partNumber: number; data: Uint8Array }, void, unknown> {
  const reader = stream.getReader();
  let buffer = new Uint8Array(0);
  let partNumber = 1;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (value) {
        // Combine with existing buffer
        const combined = new Uint8Array(buffer.length + value.length);
        combined.set(buffer);
        combined.set(value, buffer.length);
        buffer = combined;
      }

      // Yield full parts
      while (buffer.length >= partSize) {
        const part = buffer.slice(0, partSize);
        buffer = buffer.slice(partSize);
        yield { partNumber: partNumber++, data: part };
      }

      if (done) {
        // Yield remaining buffer as final part
        if (buffer.length > 0) {
          yield { partNumber: partNumber++, data: buffer };
        }
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Combine multiple ReadableStreams into one
 *
 * @param streams - Array of streams to combine
 * @returns Combined stream
 */
export function combineStreams(streams: ReadableStream<Uint8Array>[]): ReadableStream<Uint8Array> {
  let currentIndex = 0;
  let currentReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      while (currentIndex < streams.length) {
        if (!currentReader) {
          currentReader = streams[currentIndex].getReader();
        }

        const { done, value } = await currentReader.read();

        if (done) {
          currentReader.releaseLock();
          currentReader = null;
          currentIndex++;
          continue;
        }

        controller.enqueue(value);
        return;
      }

      controller.close();
    },

    cancel() {
      if (currentReader) {
        currentReader.releaseLock();
      }
    },
  });
}

/**
 * Create a limited stream that only reads up to maxBytes
 *
 * @param stream - Input stream
 * @param maxBytes - Maximum bytes to read
 * @returns Limited stream
 */
export function limitStream(
  stream: ReadableStream<Uint8Array>,
  maxBytes: number
): ReadableStream<Uint8Array> {
  let bytesRead = 0;
  const reader = stream.getReader();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (bytesRead >= maxBytes) {
        controller.close();
        reader.releaseLock();
        return;
      }

      const { done, value } = await reader.read();

      if (done) {
        controller.close();
        return;
      }

      const remaining = maxBytes - bytesRead;
      if (value.length <= remaining) {
        bytesRead += value.length;
        controller.enqueue(value);
      } else {
        // Truncate the chunk
        bytesRead += remaining;
        controller.enqueue(value.slice(0, remaining));
        controller.close();
        reader.releaseLock();
      }
    },

    cancel() {
      reader.releaseLock();
    },
  });
}

/**
 * Create a tee that duplicates a stream for multiple consumers
 *
 * @param stream - Input stream
 * @returns Tuple of two streams with the same data
 */
export function teeStream(
  stream: ReadableStream<Uint8Array>
): [ReadableStream<Uint8Array>, ReadableStream<Uint8Array>] {
  return stream.tee();
}

/**
 * Calculate MD5 hash of a stream (for integrity checking)
 *
 * @param stream - Input stream
 * @returns MD5 hash as hex string
 */
export async function hashStream(stream: ReadableStream<Uint8Array>): Promise<string> {
  const crypto = await import('node:crypto');
  const hash = crypto.createHash('md5');
  const reader = stream.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      hash.update(value);
    }
  } finally {
    reader.releaseLock();
  }

  return hash.digest('hex');
}

/**
 * Estimate upload time based on current progress
 *
 * @param bytesUploaded - Bytes uploaded so far
 * @param totalBytes - Total bytes to upload
 * @param elapsedMs - Elapsed time in milliseconds
 * @returns Estimated remaining time in seconds
 */
export function estimateRemainingTime(
  bytesUploaded: number,
  totalBytes: number,
  elapsedMs: number
): number {
  if (bytesUploaded === 0 || elapsedMs === 0) {
    return -1;
  }

  const bytesPerMs = bytesUploaded / elapsedMs;
  const remainingBytes = totalBytes - bytesUploaded;
  const remainingMs = remainingBytes / bytesPerMs;

  return Math.round(remainingMs / 1000);
}

/**
 * Format bytes as human-readable string
 *
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

/**
 * Format upload speed as human-readable string
 *
 * @param bytesPerSecond - Upload speed in bytes per second
 * @returns Formatted string (e.g., "1.5 MB/s")
 */
export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}
