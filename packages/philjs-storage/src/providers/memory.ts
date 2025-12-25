/**
 * In-Memory Storage Provider
 *
 * Memory-based storage for testing and development.
 * Data is lost when the process exits.
 */

import * as crypto from 'node:crypto';

import {
  StorageClient,
  type MemoryConfig,
  type StorageFile,
  type UploadOptions,
  type DownloadOptions,
  type ListOptions,
  type ListResult,
  type SignedUrlOptions,
  type CopyOptions,
} from '../index.js';
import { detectMimeType } from '../utils/mime.js';

interface StoredFile {
  data: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * In-memory storage client for testing
 */
export class MemoryStorageClient extends StorageClient {
  private storage: Map<string, StoredFile> = new Map();
  private memoryConfig: MemoryConfig;
  private currentSize: number = 0;

  constructor(config: MemoryConfig) {
    super(config);
    this.memoryConfig = config;
  }

  /**
   * Get current storage size in bytes
   */
  get size(): number {
    return this.currentSize;
  }

  /**
   * Clear all stored files
   */
  clear(): void {
    this.storage.clear();
    this.currentSize = 0;
  }

  /**
   * Get number of stored files
   */
  get count(): number {
    return this.storage.size;
  }

  async upload(
    key: string,
    data: Buffer | Blob | ReadableStream<Uint8Array> | string,
    options: UploadOptions = {}
  ): Promise<StorageFile> {
    const fullKey = this.buildKey(key);
    const contentType = options.contentType || detectMimeType(key);

    // Convert data to Buffer
    let buffer: Buffer;
    if (typeof data === 'string') {
      buffer = Buffer.from(data, 'utf-8');
    } else if (data instanceof Blob) {
      buffer = Buffer.from(await data.arrayBuffer());
    } else if (Buffer.isBuffer(data)) {
      buffer = data;
    } else {
      // ReadableStream - collect to buffer
      const chunks: Uint8Array[] = [];
      const reader = data.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }
      buffer = Buffer.concat(chunks);
    }

    // Check size limit
    const existingFile = this.storage.get(fullKey);
    const sizeDelta = buffer.length - (existingFile?.data.length || 0);

    if (this.memoryConfig.maxSize && this.currentSize + sizeDelta > this.memoryConfig.maxSize) {
      throw new Error(
        `Storage limit exceeded. Max: ${this.memoryConfig.maxSize}, Current: ${this.currentSize}, Requested: ${buffer.length}`
      );
    }

    // Simulate upload progress
    if (options.onProgress) {
      const chunkSize = 64 * 1024;
      for (let i = 0; i <= buffer.length; i += chunkSize) {
        options.onProgress({
          loaded: Math.min(i + chunkSize, buffer.length),
          total: buffer.length,
          percentage: Math.round((Math.min(i + chunkSize, buffer.length) / buffer.length) * 100),
        });

        // Small delay to simulate network
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }

    const now = new Date();
    this.storage.set(fullKey, {
      data: buffer,
      contentType,
      metadata: options.metadata,
      createdAt: existingFile?.createdAt || now,
      updatedAt: now,
    });

    this.currentSize += sizeDelta;

    return {
      key,
      size: buffer.length,
      contentType,
      lastModified: now,
      etag: crypto.createHash('md5').update(buffer).digest('hex'),
      metadata: options.metadata,
    };
  }

  async download(key: string, options: DownloadOptions = {}): Promise<Buffer> {
    const fullKey = this.buildKey(key);
    const file = this.storage.get(fullKey);

    if (!file) {
      throw new Error(`File not found: ${key}`);
    }

    let result = file.data;

    // Handle range requests
    if (options.rangeStart !== undefined || options.rangeEnd !== undefined) {
      const start = options.rangeStart || 0;
      const end = options.rangeEnd !== undefined ? options.rangeEnd + 1 : result.length;
      result = result.slice(start, end);
    }

    // Simulate download progress
    if (options.onProgress) {
      options.onProgress({
        loaded: result.length,
        total: result.length,
        percentage: 100,
      });
    }

    return result;
  }

  async downloadStream(
    key: string,
    options: DownloadOptions = {}
  ): Promise<ReadableStream<Uint8Array>> {
    const buffer = await this.download(key, options);

    return new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(buffer));
        controller.close();
      },
    });
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.buildKey(key);
    const file = this.storage.get(fullKey);

    if (file) {
      this.currentSize -= file.data.length;
      this.storage.delete(fullKey);
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.delete(key);
    }
  }

  async list(options: ListOptions = {}): Promise<ListResult> {
    const prefix = options.prefix ? this.buildKey(options.prefix) : this.config.basePath || '';
    const files: StorageFile[] = [];
    const prefixSet: Set<string> = new Set();

    for (const [fullKey, file] of this.storage.entries()) {
      if (!fullKey.startsWith(prefix)) continue;

      const key = this.stripBasePath(fullKey);

      if (options.delimiter) {
        const afterPrefix = key.slice(options.prefix?.length || 0);
        const delimiterIndex = afterPrefix.indexOf(options.delimiter);

        if (delimiterIndex !== -1) {
          const prefixKey = (options.prefix || '') + afterPrefix.slice(0, delimiterIndex + 1);
          prefixSet.add(prefixKey);
          continue;
        }
      }

      files.push({
        key,
        size: file.data.length,
        contentType: file.contentType,
        lastModified: file.updatedAt,
        etag: crypto.createHash('md5').update(file.data).digest('hex'),
        metadata: file.metadata,
      });
    }

    // Sort by key
    files.sort((a, b) => a.key.localeCompare(b.key));

    // Apply pagination
    const maxResults = options.maxResults || 1000;
    const startIndex = options.continuationToken ? parseInt(options.continuationToken, 10) : 0;
    const paginatedFiles = files.slice(startIndex, startIndex + maxResults);
    const hasMore = startIndex + maxResults < files.length;

    return {
      files: paginatedFiles,
      prefixes: Array.from(prefixSet).sort(),
      nextToken: hasMore ? String(startIndex + maxResults) : undefined,
      isTruncated: hasMore,
    };
  }

  async getMetadata(key: string): Promise<StorageFile | null> {
    const fullKey = this.buildKey(key);
    const file = this.storage.get(fullKey);

    if (!file) {
      return null;
    }

    return {
      key,
      size: file.data.length,
      contentType: file.contentType,
      lastModified: file.updatedAt,
      etag: crypto.createHash('md5').update(file.data).digest('hex'),
      metadata: file.metadata,
    };
  }

  async exists(key: string): Promise<boolean> {
    const fullKey = this.buildKey(key);
    return this.storage.has(fullKey);
  }

  async getSignedUrl(key: string, options: SignedUrlOptions = {}): Promise<string> {
    const expiresIn = options.expiresIn || 3600;
    const expires = Date.now() + expiresIn * 1000;
    const fullKey = this.buildKey(key);

    const signature = crypto
      .createHmac('sha256', 'memory-storage-secret')
      .update(`${fullKey}:${expires}:${options.method || 'GET'}`)
      .digest('hex');

    const params = new URLSearchParams({
      expires: String(expires),
      signature,
    });

    if (options.method === 'PUT') {
      params.set('method', 'PUT');
    }

    return `memory://${this.config.bucket}/${fullKey}?${params.toString()}`;
  }

  async copy(
    sourceKey: string,
    destinationKey: string,
    options: CopyOptions = {}
  ): Promise<StorageFile> {
    const sourceFullKey = this.buildKey(sourceKey);
    const file = this.storage.get(sourceFullKey);

    if (!file) {
      throw new Error(`Source file not found: ${sourceKey}`);
    }

    // Copy the file
    const destFullKey = this.buildKey(destinationKey);
    const now = new Date();

    // Check size limit for new file
    if (this.memoryConfig.maxSize && this.currentSize + file.data.length > this.memoryConfig.maxSize) {
      throw new Error(
        `Storage limit exceeded. Max: ${this.memoryConfig.maxSize}, Current: ${this.currentSize}`
      );
    }

    this.storage.set(destFullKey, {
      data: Buffer.from(file.data),
      contentType: options.contentType || file.contentType,
      metadata: options.metadata || file.metadata,
      createdAt: now,
      updatedAt: now,
    });

    this.currentSize += file.data.length;

    return {
      key: destinationKey,
      size: file.data.length,
      contentType: options.contentType || file.contentType,
      lastModified: now,
      etag: crypto.createHash('md5').update(file.data).digest('hex'),
      metadata: options.metadata || file.metadata,
    };
  }

  getPublicUrl(key: string): string {
    const fullKey = this.buildKey(key);
    return `memory://${this.config.bucket}/${fullKey}`;
  }

  /**
   * Get raw file data (for testing)
   */
  getFile(key: string): StoredFile | undefined {
    const fullKey = this.buildKey(key);
    return this.storage.get(fullKey);
  }

  /**
   * Set raw file data (for testing)
   */
  setFile(key: string, file: StoredFile): void {
    const fullKey = this.buildKey(key);
    const existingFile = this.storage.get(fullKey);
    const sizeDelta = file.data.length - (existingFile?.data.length || 0);

    this.storage.set(fullKey, file);
    this.currentSize += sizeDelta;
  }
}
