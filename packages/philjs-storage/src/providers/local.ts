/**
 * Local Filesystem Storage Provider
 *
 * File-based storage for development, testing, and self-hosted deployments.
 * Supports all StorageClient operations with local files.
 */

import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

import {
  StorageClient,
  type LocalConfig,
  type StorageFile,
  type UploadOptions,
  type DownloadOptions,
  type ListOptions,
  type ListResult,
  type SignedUrlOptions,
  type CopyOptions,
} from '../index.js';
import { detectMimeType } from '../utils/mime.js';

/**
 * Local filesystem storage client
 */
export class LocalStorageClient extends StorageClient {
  private directory: string;
  private publicUrl?: string;
  private localConfig: LocalConfig;
  private metadataDir: string;

  constructor(config: LocalConfig) {
    super(config);
    this.localConfig = config;
    this.directory = path.resolve(config.directory);
    this.publicUrl = config.publicUrl;
    this.metadataDir = path.join(this.directory, '.metadata');

    // Ensure directories exist
    fs.mkdirSync(this.directory, { recursive: true });
    fs.mkdirSync(this.metadataDir, { recursive: true });
  }

  private getFilePath(key: string): string {
    const fullKey = this.buildKey(key);
    return path.join(this.directory, fullKey);
  }

  private getMetadataPath(key: string): string {
    const fullKey = this.buildKey(key);
    const hash = crypto.createHash('md5').update(fullKey).digest('hex');
    return path.join(this.metadataDir, `${hash}.json`);
  }

  private async saveMetadata(
    key: string,
    metadata: { contentType: string; metadata?: Record<string, string> }
  ): Promise<void> {
    const metadataPath = this.getMetadataPath(key);
    await fsp.writeFile(metadataPath, JSON.stringify(metadata));
  }

  private async loadMetadata(
    key: string
  ): Promise<{ contentType: string; metadata?: Record<string, string> } | null> {
    try {
      const metadataPath = this.getMetadataPath(key);
      const data = await fsp.readFile(metadataPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  private async deleteMetadata(key: string): Promise<void> {
    try {
      const metadataPath = this.getMetadataPath(key);
      await fsp.unlink(metadataPath);
    } catch {
      // Ignore if metadata doesn't exist
    }
  }

  async upload(
    key: string,
    data: Buffer | Blob | ReadableStream<Uint8Array> | string,
    options: UploadOptions = {}
  ): Promise<StorageFile> {
    const filePath = this.getFilePath(key);
    const contentType = options.contentType || detectMimeType(key);

    // Ensure directory exists
    await fsp.mkdir(path.dirname(filePath), { recursive: true });

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

    // Write file with progress
    if (options.onProgress) {
      const writeStream = fs.createWriteStream(filePath);
      const chunkSize = 64 * 1024;
      let offset = 0;

      return new Promise((resolve, reject) => {
        const writeChunk = () => {
          const chunk = buffer.slice(offset, offset + chunkSize);
          if (chunk.length === 0) {
            writeStream.end(async () => {
              await this.saveMetadata(key, { contentType, metadata: options.metadata });
              const metadata = await this.getMetadata(key);
              resolve(metadata!);
            });
            return;
          }

          offset += chunk.length;
          options.onProgress!({
            loaded: offset,
            total: buffer.length,
            percentage: Math.round((offset / buffer.length) * 100),
          });

          if (!writeStream.write(chunk)) {
            writeStream.once('drain', writeChunk);
          } else {
            setImmediate(writeChunk);
          }
        };

        writeStream.on('error', reject);
        writeChunk();
      });
    }

    await fsp.writeFile(filePath, buffer);
    await this.saveMetadata(key, { contentType, metadata: options.metadata });

    const metadata = await this.getMetadata(key);
    return metadata!;
  }

  async download(key: string, options: DownloadOptions = {}): Promise<Buffer> {
    const filePath = this.getFilePath(key);

    try {
      const buffer = await fsp.readFile(filePath);

      // Handle range requests
      if (options.rangeStart !== undefined || options.rangeEnd !== undefined) {
        const start = options.rangeStart || 0;
        const end = options.rangeEnd !== undefined ? options.rangeEnd + 1 : buffer.length;
        const sliced = buffer.slice(start, end);

        if (options.onProgress) {
          options.onProgress({
            loaded: sliced.length,
            total: sliced.length,
            percentage: 100,
          });
        }

        return sliced;
      }

      if (options.onProgress) {
        options.onProgress({
          loaded: buffer.length,
          total: buffer.length,
          percentage: 100,
        });
      }

      return buffer;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${key}`);
      }
      throw error;
    }
  }

  async downloadStream(
    key: string,
    options: DownloadOptions = {}
  ): Promise<ReadableStream<Uint8Array>> {
    const filePath = this.getFilePath(key);

    const streamOptions: { start?: number; end?: number } = {};
    if (options.rangeStart !== undefined) {
      streamOptions.start = options.rangeStart;
    }
    if (options.rangeEnd !== undefined) {
      streamOptions.end = options.rangeEnd;
    }

    const nodeStream = fs.createReadStream(filePath, streamOptions);

    return new ReadableStream<Uint8Array>({
      start(controller) {
        nodeStream.on('data', (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });
        nodeStream.on('end', () => {
          controller.close();
        });
        nodeStream.on('error', (err) => {
          controller.error(err);
        });
      },
      cancel() {
        nodeStream.destroy();
      },
    });
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);

    try {
      await fsp.unlink(filePath);
      await this.deleteMetadata(key);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async deleteMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.delete(key)));
  }

  async list(options: ListOptions = {}): Promise<ListResult> {
    const prefix = options.prefix ? this.buildKey(options.prefix) : this.config.basePath || '';
    const searchDir = path.join(this.directory, prefix);

    const files: StorageFile[] = [];
    const prefixes: Set<string> = new Set();

    try {
      const entries = await this.listRecursive(searchDir, options.delimiter);

      for (const entry of entries) {
        const relativePath = path.relative(this.directory, entry.path);
        const key = this.stripBasePath(relativePath.replace(/\\/g, '/'));

        if (options.delimiter) {
          // Check if this is a "directory"
          const afterPrefix = key.slice(options.prefix?.length || 0);
          const delimiterIndex = afterPrefix.indexOf(options.delimiter);

          if (delimiterIndex !== -1) {
            // This is inside a subdirectory
            const prefixKey = (options.prefix || '') + afterPrefix.slice(0, delimiterIndex + 1);
            prefixes.add(prefixKey);
            continue;
          }
        }

        const savedMetadata = await this.loadMetadata(key);

        files.push({
          key,
          size: entry.stats.size,
          contentType: savedMetadata?.contentType || detectMimeType(key),
          lastModified: entry.stats.mtime,
          etag: crypto.createHash('md5').update(`${entry.stats.ino}-${entry.stats.mtime.getTime()}`).digest('hex'),
          metadata: savedMetadata?.metadata,
        });
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // Apply pagination (simple implementation)
    const maxResults = options.maxResults || 1000;
    const startIndex = options.continuationToken ? parseInt(options.continuationToken, 10) : 0;
    const paginatedFiles = files.slice(startIndex, startIndex + maxResults);
    const hasMore = startIndex + maxResults < files.length;

    return {
      files: paginatedFiles,
      prefixes: Array.from(prefixes),
      nextToken: hasMore ? String(startIndex + maxResults) : undefined,
      isTruncated: hasMore,
    };
  }

  private async listRecursive(
    dir: string,
    delimiter?: string
  ): Promise<Array<{ path: string; stats: fs.Stats }>> {
    const results: Array<{ path: string; stats: fs.Stats }> = [];

    try {
      const entries = await fsp.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        // Skip metadata directory
        if (entry.name === '.metadata') continue;

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          if (!delimiter) {
            // Recurse into subdirectories
            const subResults = await this.listRecursive(fullPath, delimiter);
            results.push(...subResults);
          }
        } else if (entry.isFile()) {
          const stats = await fsp.stat(fullPath);
          results.push({ path: fullPath, stats });
        }
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    return results;
  }

  async getMetadata(key: string): Promise<StorageFile | null> {
    const filePath = this.getFilePath(key);

    try {
      const stats = await fsp.stat(filePath);
      const savedMetadata = await this.loadMetadata(key);

      return {
        key,
        size: stats.size,
        contentType: savedMetadata?.contentType || detectMimeType(key),
        lastModified: stats.mtime,
        etag: crypto.createHash('md5').update(`${stats.ino}-${stats.mtime.getTime()}`).digest('hex'),
        metadata: savedMetadata?.metadata,
      };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);

    try {
      await fsp.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(key: string, options: SignedUrlOptions = {}): Promise<string> {
    // For local storage, generate a simple signed URL with expiration
    const expiresIn = options.expiresIn || 3600;
    const expires = Date.now() + expiresIn * 1000;
    const fullKey = this.buildKey(key);

    // Create a simple signature
    const signature = crypto
      .createHmac('sha256', 'local-storage-secret')
      .update(`${fullKey}:${expires}:${options.method || 'GET'}`)
      .digest('hex');

    const baseUrl = this.publicUrl || `file://${this.directory}`;
    const params = new URLSearchParams({
      expires: String(expires),
      signature,
    });

    if (options.method === 'PUT') {
      params.set('method', 'PUT');
    }

    return `${baseUrl}/${fullKey}?${params.toString()}`;
  }

  async copy(
    sourceKey: string,
    destinationKey: string,
    options: CopyOptions = {}
  ): Promise<StorageFile> {
    const sourcePath = this.getFilePath(sourceKey);
    const destPath = options.destinationBucket
      ? path.join(options.destinationBucket, this.buildKey(destinationKey))
      : this.getFilePath(destinationKey);

    // Ensure destination directory exists
    await fsp.mkdir(path.dirname(destPath), { recursive: true });

    // Copy file
    await fsp.copyFile(sourcePath, destPath);

    // Copy or update metadata
    const sourceMetadata = await this.loadMetadata(sourceKey);
    await this.saveMetadata(destinationKey, {
      contentType: options.contentType || sourceMetadata?.contentType || detectMimeType(destinationKey),
      metadata: options.metadata || sourceMetadata?.metadata,
    });

    const metadata = await this.getMetadata(destinationKey);
    return metadata!;
  }

  getPublicUrl(key: string): string {
    const fullKey = this.buildKey(key);

    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/$/, '')}/${fullKey}`;
    }

    return `file://${this.getFilePath(key)}`;
  }
}
