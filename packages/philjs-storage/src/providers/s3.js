/**
 * AWS S3 / Cloudflare R2 Storage Provider
 *
 * Supports both AWS S3 and S3-compatible services like Cloudflare R2,
 * MinIO, DigitalOcean Spaces, etc.
 */
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command, HeadObjectCommand, CopyObjectCommand, } from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import { StorageClient, } from '../client.js';
import { detectMimeType } from '../utils/mime.js';
/**
 * AWS S3 / Cloudflare R2 storage client
 */
export class S3StorageClient extends StorageClient {
    client;
    s3Config;
    constructor(config) {
        super(config);
        this.s3Config = config;
        const clientConfig = {
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
                ...(config.sessionToken !== undefined && { sessionToken: config.sessionToken }),
            };
        }
        this.client = new S3Client(clientConfig);
    }
    async upload(key, data, options = {}) {
        const fullKey = this.buildKey(key);
        const contentType = options.contentType || detectMimeType(key);
        // Convert data to appropriate format
        let body;
        let contentLength;
        if (typeof data === 'string') {
            body = Buffer.from(data, 'utf-8');
            contentLength = body.length;
        }
        else if (data instanceof Blob) {
            body = Buffer.from(await data.arrayBuffer());
            contentLength = body.length;
        }
        else if (Buffer.isBuffer(data)) {
            body = data;
            contentLength = data.length;
        }
        else {
            // ReadableStream - use multipart upload
            body = data;
        }
        // Use multipart upload for streams or large files
        const useMultipart = options.multipart ||
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
        }
        else {
            // Simple PUT for small files
            const command = new PutObjectCommand({
                Bucket: this.config.bucket,
                Key: fullKey,
                Body: body,
                ContentType: contentType,
                ...(contentLength !== undefined && { ContentLength: contentLength }),
                ...(options.cacheControl !== undefined && { CacheControl: options.cacheControl }),
                ...(options.contentDisposition !== undefined && { ContentDisposition: options.contentDisposition }),
                ...(options.acl !== undefined && { ACL: options.acl }),
                ...(options.metadata !== undefined && { Metadata: options.metadata }),
            });
            await this.client.send(command, options.signal ? { abortSignal: options.signal } : undefined);
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
        return metadata;
    }
    async download(key, options = {}) {
        const fullKey = this.buildKey(key);
        const rangeValue = options.rangeStart !== undefined || options.rangeEnd !== undefined
            ? `bytes=${options.rangeStart || 0}-${options.rangeEnd || ''}`
            : undefined;
        const command = new GetObjectCommand({
            Bucket: this.config.bucket,
            Key: fullKey,
            ...(rangeValue !== undefined && { Range: rangeValue }),
        });
        const response = await this.client.send(command, options.signal ? { abortSignal: options.signal } : undefined);
        if (!response.Body) {
            throw new Error(`File not found: ${key}`);
        }
        // Convert stream to buffer
        const chunks = [];
        const reader = response.Body.transformToWebStream().getReader();
        let loaded = 0;
        const total = response.ContentLength || -1;
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
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
    async downloadStream(key, options = {}) {
        const fullKey = this.buildKey(key);
        const rangeValue = options.rangeStart !== undefined || options.rangeEnd !== undefined
            ? `bytes=${options.rangeStart || 0}-${options.rangeEnd || ''}`
            : undefined;
        const command = new GetObjectCommand({
            Bucket: this.config.bucket,
            Key: fullKey,
            ...(rangeValue !== undefined && { Range: rangeValue }),
        });
        const response = await this.client.send(command, options.signal ? { abortSignal: options.signal } : undefined);
        if (!response.Body) {
            throw new Error(`File not found: ${key}`);
        }
        return response.Body.transformToWebStream();
    }
    async delete(key) {
        const fullKey = this.buildKey(key);
        const command = new DeleteObjectCommand({
            Bucket: this.config.bucket,
            Key: fullKey,
        });
        await this.client.send(command);
    }
    async deleteMany(keys) {
        if (keys.length === 0)
            return;
        // S3 allows up to 1000 keys per request
        const batches = [];
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
    async list(options = {}) {
        const prefix = options.prefix ? this.buildKey(options.prefix) : this.config.basePath;
        const command = new ListObjectsV2Command({
            Bucket: this.config.bucket,
            ...(prefix !== undefined && { Prefix: prefix }),
            ...(options.delimiter !== undefined && { Delimiter: options.delimiter }),
            MaxKeys: options.maxResults || 1000,
            ...(options.continuationToken !== undefined && { ContinuationToken: options.continuationToken }),
        });
        const response = await this.client.send(command);
        const files = (response.Contents || []).map((obj) => ({
            key: this.stripBasePath(obj.Key || ''),
            size: obj.Size || 0,
            contentType: 'application/octet-stream', // S3 doesn't return content type in list
            lastModified: obj.LastModified || new Date(),
            etag: obj.ETag?.replace(/"/g, ''),
        }));
        const prefixes = (response.CommonPrefixes || []).map((p) => this.stripBasePath(p.Prefix || ''));
        return {
            files,
            prefixes,
            nextToken: response.NextContinuationToken,
            isTruncated: response.IsTruncated || false,
        };
    }
    async getMetadata(key) {
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
        }
        catch (error) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                return null;
            }
            throw error;
        }
    }
    async exists(key) {
        const metadata = await this.getMetadata(key);
        return metadata !== null;
    }
    async getSignedUrl(key, options = {}) {
        const fullKey = this.buildKey(key);
        const expiresIn = options.expiresIn || 3600;
        const command = options.method === 'PUT'
            ? new PutObjectCommand({
                Bucket: this.config.bucket,
                Key: fullKey,
                ...(options.contentType !== undefined && { ContentType: options.contentType }),
            })
            : new GetObjectCommand({
                Bucket: this.config.bucket,
                Key: fullKey,
                ...(options.responseContentType !== undefined && { ResponseContentType: options.responseContentType }),
                ...(options.responseContentDisposition !== undefined && { ResponseContentDisposition: options.responseContentDisposition }),
            });
        return awsGetSignedUrl(this.client, command, { expiresIn });
    }
    async copy(sourceKey, destinationKey, options = {}) {
        const fullSourceKey = this.buildKey(sourceKey);
        const fullDestKey = this.buildKey(destinationKey);
        const destBucket = options.destinationBucket || this.config.bucket;
        const command = new CopyObjectCommand({
            Bucket: destBucket,
            Key: fullDestKey,
            CopySource: `${this.config.bucket}/${fullSourceKey}`,
            ...(options.contentType !== undefined && { ContentType: options.contentType }),
            ...(options.metadata !== undefined && { Metadata: options.metadata }),
            MetadataDirective: options.metadata ? 'REPLACE' : 'COPY',
            ...(options.acl !== undefined && { ACL: options.acl }),
        });
        await this.client.send(command);
        // Get metadata of the copied file
        const metadata = await this.getMetadata(destinationKey);
        return metadata;
    }
    getPublicUrl(key) {
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
//# sourceMappingURL=s3.js.map