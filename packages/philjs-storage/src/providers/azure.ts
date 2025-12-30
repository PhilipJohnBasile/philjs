/**
 * Azure Blob Storage Provider
 *
 * Full-featured Azure Blob Storage integration with streaming,
 * SAS URLs, and block blob uploads.
 */

import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
} from '@azure/storage-blob';

import {
  StorageClient,
  type AzureConfig,
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
 * Azure Blob Storage client
 */
export class AzureStorageClient extends StorageClient {
  private containerClient: ContainerClient;
  private blobServiceClient: BlobServiceClient;
  private azureConfig: AzureConfig;
  private sharedKeyCredential?: StorageSharedKeyCredential;

  constructor(config: AzureConfig) {
    super(config);
    this.azureConfig = config;

    if (config.connectionString) {
      this.blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionString);
    } else if (config.accountName && config.accountKey) {
      this.sharedKeyCredential = new StorageSharedKeyCredential(
        config.accountName,
        config.accountKey
      );
      const endpoint = config.endpoint || `https://${config.accountName}.blob.core.windows.net`;
      this.blobServiceClient = new BlobServiceClient(endpoint, this.sharedKeyCredential);
    } else if (config.accountName && config.sasToken) {
      const endpoint = config.endpoint || `https://${config.accountName}.blob.core.windows.net`;
      this.blobServiceClient = new BlobServiceClient(`${endpoint}?${config.sasToken}`);
    } else {
      throw new Error(
        'Azure Storage requires connectionString, accountName+accountKey, or accountName+sasToken'
      );
    }

    this.containerClient = this.blobServiceClient.getContainerClient(config.bucket);
  }

  private getBlobClient(key: string): BlockBlobClient {
    return this.containerClient.getBlockBlobClient(this.buildKey(key));
  }

  async upload(
    key: string,
    data: Buffer | Blob | ReadableStream<Uint8Array> | string,
    options: UploadOptions = {}
  ): Promise<StorageFile> {
    const blobClient = this.getBlobClient(key);
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

    const uploadOptions: {
      blobHTTPHeaders: {
        blobContentType: string;
        blobCacheControl?: string;
        blobContentDisposition?: string;
      };
      metadata?: Record<string, string>;
      onProgress?: (progress: { loadedBytes: number }) => void;
      abortSignal?: AbortSignal;
    } = {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
    };

    if (options.cacheControl) {
      uploadOptions.blobHTTPHeaders.blobCacheControl = options.cacheControl;
    }
    if (options.contentDisposition) {
      uploadOptions.blobHTTPHeaders.blobContentDisposition = options.contentDisposition;
    }
    if (options.metadata) {
      uploadOptions.metadata = options.metadata;
    }
    if (options.onProgress) {
      uploadOptions.onProgress = (progress: { loadedBytes: number }) => {
        options.onProgress!({
          loaded: progress.loadedBytes,
          total: buffer.length,
          percentage: Math.round((progress.loadedBytes / buffer.length) * 100),
        });
      };
    }
    if (options.signal) {
      uploadOptions.abortSignal = options.signal;
    }

    // Use block blob upload for large files
    if (options.multipart || buffer.length > 4 * 1024 * 1024) {
      const blockSize = options.partSize || 4 * 1024 * 1024; // 4MB blocks
      await blobClient.uploadData(buffer, {
        ...uploadOptions,
        blockSize,
        concurrency: 4,
      });
    } else {
      await blobClient.upload(buffer, buffer.length, uploadOptions);
    }

    const metadata = await this.getMetadata(key);
    return metadata!;
  }

  async download(key: string, options: DownloadOptions = {}): Promise<Buffer> {
    const blobClient = this.getBlobClient(key);

    const downloadOptions: Parameters<typeof blobClient.download>[2] = {};

    if (options.signal) {
      downloadOptions.abortSignal = options.signal;
    }
    if (options.onProgress) {
      downloadOptions.onProgress = (progress: { loadedBytes: number }) => {
        options.onProgress!({
          loaded: progress.loadedBytes,
          total: -1,
          percentage: -1,
        });
      };
    }

    const response = await blobClient.download(
      options.rangeStart || 0,
      options.rangeEnd !== undefined ? options.rangeEnd - (options.rangeStart || 0) + 1 : undefined,
      downloadOptions
    );

    if (!response.readableStreamBody) {
      throw new Error(`File not found: ${key}`);
    }

    // Convert Node.js stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of response.readableStreamBody as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  async downloadStream(
    key: string,
    options: DownloadOptions = {}
  ): Promise<ReadableStream<Uint8Array>> {
    const blobClient = this.getBlobClient(key);

    const streamDownloadOptions: Parameters<typeof blobClient.download>[2] = {};
    if (options.signal) {
      streamDownloadOptions.abortSignal = options.signal;
    }

    const response = await blobClient.download(
      options.rangeStart || 0,
      options.rangeEnd !== undefined ? options.rangeEnd - (options.rangeStart || 0) + 1 : undefined,
      streamDownloadOptions
    );

    if (!response.readableStreamBody) {
      throw new Error(`File not found: ${key}`);
    }

    const nodeStream = response.readableStreamBody;

    // Convert Node.js stream to Web ReadableStream
    return new ReadableStream<Uint8Array>({
      async start(controller) {
        for await (const chunk of nodeStream as AsyncIterable<Buffer>) {
          controller.enqueue(new Uint8Array(chunk));
        }
        controller.close();
      },
    });
  }

  async delete(key: string): Promise<void> {
    const blobClient = this.getBlobClient(key);
    await blobClient.deleteIfExists();
  }

  async deleteMany(keys: string[]): Promise<void> {
    // Azure doesn't have batch delete in the same way as S3
    // Use parallel deletion
    await Promise.all(keys.map((key) => this.delete(key)));
  }

  async list(options: ListOptions = {}): Promise<ListResult> {
    const prefix = options.prefix ? this.buildKey(options.prefix) : this.config.basePath || '';

    const files: StorageFile[] = [];
    const prefixes: string[] = [];

    const listOptions = {
      prefix,
      includeMetadata: true,
    };

    const pageSettings: { maxPageSize: number; continuationToken?: string } = {
      maxPageSize: options.maxResults || 1000,
    };
    if (options.continuationToken) {
      pageSettings.continuationToken = options.continuationToken;
    }

    let iterator;
    if (options.delimiter) {
      iterator = this.containerClient
        .listBlobsByHierarchy(options.delimiter, listOptions)
        .byPage(pageSettings);
    } else {
      iterator = this.containerClient
        .listBlobsFlat(listOptions)
        .byPage(pageSettings);
    }

    const page = await iterator.next();
    const segment = page.value;

    if (segment.segment?.blobItems) {
      for (const blob of segment.segment.blobItems) {
        const file: StorageFile = {
          key: this.stripBasePath(blob.name),
          size: blob.properties.contentLength || 0,
          contentType: blob.properties.contentType || 'application/octet-stream',
          lastModified: blob.properties.lastModified || new Date(),
        };
        if (blob.properties.etag) {
          file.etag = blob.properties.etag.replace(/"/g, '');
        }
        if (blob.metadata) {
          file.metadata = blob.metadata;
        }
        files.push(file);
      }
    }

    if (segment.segment?.blobPrefixes) {
      for (const prefix of segment.segment.blobPrefixes) {
        prefixes.push(this.stripBasePath(prefix.name));
      }
    }

    return {
      files,
      prefixes,
      nextToken: segment.continuationToken,
      isTruncated: !!segment.continuationToken,
    };
  }

  async getMetadata(key: string): Promise<StorageFile | null> {
    const blobClient = this.getBlobClient(key);

    try {
      const properties = await blobClient.getProperties();

      const file: StorageFile = {
        key,
        size: properties.contentLength || 0,
        contentType: properties.contentType || 'application/octet-stream',
        lastModified: properties.lastModified || new Date(),
      };
      if (properties.etag) {
        file.etag = properties.etag.replace(/"/g, '');
      }
      if (properties.metadata) {
        file.metadata = properties.metadata;
      }
      return file;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    const blobClient = this.getBlobClient(key);
    return blobClient.exists();
  }

  async getSignedUrl(key: string, options: SignedUrlOptions = {}): Promise<string> {
    const blobClient = this.getBlobClient(key);
    const expiresIn = options.expiresIn || 3600;

    if (this.sharedKeyCredential) {
      // Generate SAS token with shared key
      const permissions = new BlobSASPermissions();
      if (options.method === 'PUT') {
        permissions.write = true;
        permissions.create = true;
      } else {
        permissions.read = true;
      }

      const sasOptions: {
        containerName: string;
        blobName: string;
        permissions: BlobSASPermissions;
        startsOn: Date;
        expiresOn: Date;
        contentType?: string;
        contentDisposition?: string;
        protocol: SASProtocol;
      } = {
        containerName: this.config.bucket,
        blobName: this.buildKey(key),
        permissions,
        startsOn: new Date(),
        expiresOn: new Date(Date.now() + expiresIn * 1000),
        protocol: SASProtocol.Https,
      };
      if (options.contentType) {
        sasOptions.contentType = options.contentType;
      }
      if (options.responseContentDisposition) {
        sasOptions.contentDisposition = options.responseContentDisposition;
      }

      const sasToken = generateBlobSASQueryParameters(
        sasOptions,
        this.sharedKeyCredential
      ).toString();

      return `${blobClient.url}?${sasToken}`;
    }

    // If using SAS token auth, can't generate new SAS
    // Return the blob URL (assumes it has appropriate SAS or is public)
    return blobClient.url;
  }

  async copy(
    sourceKey: string,
    destinationKey: string,
    options: CopyOptions = {}
  ): Promise<StorageFile> {
    const sourceBlobClient = this.getBlobClient(sourceKey);
    const destContainer = options.destinationBucket
      ? this.blobServiceClient.getContainerClient(options.destinationBucket)
      : this.containerClient;
    const destBlobClient = destContainer.getBlockBlobClient(this.buildKey(destinationKey));

    // Start copy operation
    const copyPoller = await destBlobClient.beginCopyFromURL(sourceBlobClient.url);
    await copyPoller.pollUntilDone();

    // Update properties if specified
    if (options.contentType || options.metadata) {
      if (options.contentType) {
        await destBlobClient.setHTTPHeaders({
          blobContentType: options.contentType,
        });
      }
      if (options.metadata) {
        await destBlobClient.setMetadata(options.metadata);
      }
    }

    const metadata = await this.getMetadata(destinationKey);
    return metadata!;
  }

  getPublicUrl(key: string): string {
    const blobClient = this.getBlobClient(key);
    return blobClient.url;
  }
}
