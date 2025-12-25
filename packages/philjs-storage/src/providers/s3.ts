/**
 * AWS S3 / Cloudflare R2 Storage Provider
 *
 * Supports both AWS S3 and S3-compatible services like Cloudflare R2,
 * MinIO, DigitalOcean Spaces, etc.
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  CopyObjectCommand,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';

import {
  StorageClient,
  type S3Config,
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
 * AWS S3 / Cloudflare R2 storage client
 */
export class S3StorageClient extends StorageClient {
  private client: S3Client;
  private s3Config: S3Config;

  constructor(config: S3Config) {
    super(config);
    this.s3Config = config;

    const clientConfig: S3ClientConfig = {
      region: config.region || 'us-east-1',
    };

    // Custom endpoint for R2, MinIO, etc.
    if (config.endpoint) {
      clientConfig.endpoint = config.endpoint;
    }

    // Force path style for S3-compatible services
    if (config.forcePathStyle) {
      clientConfig.forcePathStyle = true;
    }

    // Explicit credentials
    if (config.accessKeyId && config.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        sessionToken: config.sessionToken,
      };
    }

    this.client = new S3Client(clientConfig);
  }

  async upload(
    key: string,
    data: Buffer | Blob | ReadableStream<Uint8Array> | string,
    options: UploadOptions = {}
  ): Promise<StorageFile> {
    const fullKey = this.buildKey(key);
    const contentType = options.contentType || detectMimeType(key);

    // Convert data to appropriate format
    let body: Buffer | ReadableStream<Uint8Array> | string;
    let contentLength: number | undefined;

    if (typeof data === 'string') {
      body = Buffer.from(data, 'utf-8');
      contentLength = (body as Buffer).length;
    } else if (data instanceof Blob) {
      body = Buffer.from(await data.arrayBuffer());
      contentLength = (body as Buffer).length;
    } else if (Buffer.isBuffer(data)) {
      body = data;
      contentLength = data.length;
    } else {
      // ReadableStream - use multipart upload
      body = data;
    }

    // Use multipart upload for streams or large files
    const useMultipart =
      options.multipart ||
      body instanceof ReadableStream ||
      (contentLength && contentLength > 5 * 1024 * 1024);

    if (useMultipart && !(body instanceof ReadableStream)) {
      // Use AWS SDK's Upload utility for multipart
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.config.bucket,
          Key: fullKey,
          Body: body,
          ContentType: contentType,
          CacheControl: options.cacheControl,
          ContentDisposition: options.contentDisposition,
          ACL: options.acl,
          Metadata: options.metadata,
        },
        partSize: options.partSize || 5 * 1024 * 1024,
        leavePartsOnError: false,
      });

      if (options.onProgress) {
        upload.on('httpUploadProgress', (progress) => {
          if (options.onProgress && progress.loaded !== undefined) {
            const total = progress.total || contentLength || 0;
            options.onProgress({
              loaded: progress.loaded,
              total,
              percentage: total > 0 ? Math.round((progress.loaded / total) * 100) : 0,
            });
          }
        });
      }

      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          upload.abort();
        });
      }

      await upload.done();
    } else {
      // Simple PUT for small files
      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: fullKey,
        Body: body as Buffer | string,
        ContentType: contentType,
        ContentLength: contentLength,
        CacheControl: options.cacheControl,
        ContentDisposition: options.contentDisposition,
        ACL: options.acl,
        Metadata: options.metadata,
      });

      await this.client.send(command, {
        abortSignal: options.signal,
      });

      if (options.onProgress && contentLength) {
        options.onProgress({
          loaded: contentLength,
          total: contentLength,
          percentage: 100,
        });
      }
    }

    // Get metadata for the uploaded file
    const metadata = await this.getMetadata(key);
    return metadata!;
  }

  async download(key: string, options: DownloadOptions = {}): Promise<Buffer> {
    const fullKey = this.buildKey(key);

    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: fullKey,
      Range:
        options.rangeStart !== undefined || options.rangeEnd !== undefined
          ? `bytes=${options.rangeStart || 0}-${options.rangeEnd || ''}`
          : undefined,
    });

    const response = await this.client.send(command, {
      abortSignal: options.signal,
    });

    if (!response.Body) {
      throw new Error(`File not found: ${key}`);
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const reader = response.Body.transformToWebStream().getReader();
    let loaded = 0;
    const total = response.ContentLength || -1;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      loaded += value.length;

      if (options.onProgress) {
        options.onProgress({
          loaded,
          total,
          percentage: total > 0 ? Math.round((loaded / total) * 100) : -1,
        });
      }
    }

    return Buffer.concat(chunks);
  }

  async downloadStream(
    key: string,
    options: DownloadOptions = {}
  ): Promise<ReadableStream<Uint8Array>> {
    const fullKey = this.buildKey(key);

    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: fullKey,
      Range:
        options.rangeStart !== undefined || options.rangeEnd !== undefined
          ? `bytes=${options.rangeStart || 0}-${options.rangeEnd || ''}`
          : undefined,
    });

    const response = await this.client.send(command, {
      abortSignal: options.signal,
    });

    if (!response.Body) {
      throw new Error(`File not found: ${key}`);
    }

    return response.Body.transformToWebStream();
  }

  async delete(key: string): Promise<void> {
    const fullKey = this.buildKey(key);

    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: fullKey,
    });

    await this.client.send(command);
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    // S3 allows up to 1000 keys per request
    const batches: string[][] = [];
    for (let i = 0; i < keys.length; i += 1000) {
      batches.push(keys.slice(i, i + 1000));
    }

    for (const batch of batches) {
      const command = new DeleteObjectsCommand({
        Bucket: this.config.bucket,
        Delete: {
          Objects: batch.map((key) => ({ Key: this.buildKey(key) })),
          Quiet: true,
        },
      });

      await this.client.send(command);
    }
  }

  async list(options: ListOptions = {}): Promise<ListResult> {
    const prefix = options.prefix ? this.buildKey(options.prefix) : this.config.basePath;

    const command = new ListObjectsV2Command({
      Bucket: this.config.bucket,
      Prefix: prefix,
      Delimiter: options.delimiter,
      MaxKeys: options.maxResults || 1000,
      ContinuationToken: options.continuationToken,
    });

    const response = await this.client.send(command);

    const files: StorageFile[] = (response.Contents || []).map((obj) => ({
      key: this.stripBasePath(obj.Key || ''),
      size: obj.Size || 0,
      contentType: 'application/octet-stream', // S3 doesn't return content type in list
      lastModified: obj.LastModified || new Date(),
      etag: obj.ETag?.replace(/"/g, ''),
    }));

    const prefixes = (response.CommonPrefixes || []).map(
      (p) => this.stripBasePath(p.Prefix || '')
    );

    return {
      files,
      prefixes,
      nextToken: response.NextContinuationToken,
      isTruncated: response.IsTruncated || false,
    };
  }

  async getMetadata(key: string): Promise<StorageFile | null> {
    const fullKey = this.buildKey(key);

    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: fullKey,
      });

      const response = await this.client.send(command);

      return {
        key,
        size: response.ContentLength || 0,
        contentType: response.ContentType || 'application/octet-stream',
        lastModified: response.LastModified || new Date(),
        etag: response.ETag?.replace(/"/g, ''),
        metadata: response.Metadata,
      };
    } catch (error: any) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    const metadata = await this.getMetadata(key);
    return metadata !== null;
  }

  async getSignedUrl(key: string, options: SignedUrlOptions = {}): Promise<string> {
    const fullKey = this.buildKey(key);
    const expiresIn = options.expiresIn || 3600;

    const command =
      options.method === 'PUT'
        ? new PutObjectCommand({
            Bucket: this.config.bucket,
            Key: fullKey,
            ContentType: options.contentType,
          })
        : new GetObjectCommand({
            Bucket: this.config.bucket,
            Key: fullKey,
            ResponseContentType: options.responseContentType,
            ResponseContentDisposition: options.responseContentDisposition,
          });

    return awsGetSignedUrl(this.client, command, { expiresIn });
  }

  async copy(
    sourceKey: string,
    destinationKey: string,
    options: CopyOptions = {}
  ): Promise<StorageFile> {
    const fullSourceKey = this.buildKey(sourceKey);
    const fullDestKey = this.buildKey(destinationKey);
    const destBucket = options.destinationBucket || this.config.bucket;

    const command = new CopyObjectCommand({
      Bucket: destBucket,
      Key: fullDestKey,
      CopySource: `${this.config.bucket}/${fullSourceKey}`,
      ContentType: options.contentType,
      Metadata: options.metadata,
      MetadataDirective: options.metadata ? 'REPLACE' : 'COPY',
      ACL: options.acl,
    });

    await this.client.send(command);

    // Get metadata of the copied file
    const metadata = await this.getMetadata(destinationKey);
    return metadata!;
  }

  getPublicUrl(key: string): string {
    const fullKey = this.buildKey(key);

    if (this.s3Config.endpoint) {
      // Custom endpoint (R2, MinIO, etc.)
      const endpoint = this.s3Config.endpoint.replace(/\/$/, '');
      if (this.s3Config.forcePathStyle) {
        return `${endpoint}/${this.config.bucket}/${fullKey}`;
      }
      return `${endpoint}/${fullKey}`;
    }

    // Standard S3 URL
    return `https://${this.config.bucket}.s3.${this.config.region || 'us-east-1'}.amazonaws.com/${fullKey}`;
  }
}
