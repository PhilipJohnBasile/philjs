/**
 * Azure Blob Storage Provider
 *
 * Full-featured Azure Blob Storage integration with streaming,
 * SAS URLs, and block blob uploads.
 */
import { BlobServiceClient, ContainerClient, BlockBlobClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions, SASProtocol, } from '@azure/storage-blob';
import { StorageClient, } from '../client.js';
import { detectMimeType } from '../utils/mime.js';
/**
 * Azure Blob Storage client
 */
export class AzureStorageClient extends StorageClient {
    containerClient;
    blobServiceClient;
    azureConfig;
    sharedKeyCredential;
    constructor(config) {
        super(config);
        this.azureConfig = config;
        if (config.connectionString) {
            this.blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionString);
        }
        else if (config.accountName && config.accountKey) {
            this.sharedKeyCredential = new StorageSharedKeyCredential(config.accountName, config.accountKey);
            const endpoint = config.endpoint || `https://${config.accountName}.blob.core.windows.net`;
            this.blobServiceClient = new BlobServiceClient(endpoint, this.sharedKeyCredential);
        }
        else if (config.accountName && config.sasToken) {
            const endpoint = config.endpoint || `https://${config.accountName}.blob.core.windows.net`;
            this.blobServiceClient = new BlobServiceClient(`${endpoint}?${config.sasToken}`);
        }
        else {
            throw new Error('Azure Storage requires connectionString, accountName+accountKey, or accountName+sasToken');
        }
        this.containerClient = this.blobServiceClient.getContainerClient(config.bucket);
    }
    getBlobClient(key) {
        return this.containerClient.getBlockBlobClient(this.buildKey(key));
    }
    async upload(key, data, options = {}) {
        const blobClient = this.getBlobClient(key);
        const contentType = options.contentType || detectMimeType(key);
        // Convert data to Buffer
        let buffer;
        if (typeof data === 'string') {
            buffer = Buffer.from(data, 'utf-8');
        }
        else if (data instanceof Blob) {
            buffer = Buffer.from(await data.arrayBuffer());
        }
        else if (Buffer.isBuffer(data)) {
            buffer = data;
        }
        else {
            // ReadableStream - collect to buffer
            const chunks = [];
            const reader = data.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                chunks.push(value);
            }
            buffer = Buffer.concat(chunks);
        }
        const uploadOptions = {
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
            uploadOptions.onProgress = (progress) => {
                options.onProgress({
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
        }
        else {
            await blobClient.upload(buffer, buffer.length, uploadOptions);
        }
        const metadata = await this.getMetadata(key);
        return metadata;
    }
    async download(key, options = {}) {
        const blobClient = this.getBlobClient(key);
        const downloadOptions = {};
        if (options.signal) {
            downloadOptions.abortSignal = options.signal;
        }
        if (options.onProgress) {
            downloadOptions.onProgress = (progress) => {
                options.onProgress({
                    loaded: progress.loadedBytes,
                    total: -1,
                    percentage: -1,
                });
            };
        }
        const response = await blobClient.download(options.rangeStart || 0, options.rangeEnd !== undefined ? options.rangeEnd - (options.rangeStart || 0) + 1 : undefined, downloadOptions);
        if (!response.readableStreamBody) {
            throw new Error(`File not found: ${key}`);
        }
        // Convert Node.js stream to buffer
        const chunks = [];
        for await (const chunk of response.readableStreamBody) {
            chunks.push(chunk);
        }
        return Buffer.concat(chunks);
    }
    async downloadStream(key, options = {}) {
        const blobClient = this.getBlobClient(key);
        const streamDownloadOptions = {};
        if (options.signal) {
            streamDownloadOptions.abortSignal = options.signal;
        }
        const response = await blobClient.download(options.rangeStart || 0, options.rangeEnd !== undefined ? options.rangeEnd - (options.rangeStart || 0) + 1 : undefined, streamDownloadOptions);
        if (!response.readableStreamBody) {
            throw new Error(`File not found: ${key}`);
        }
        const nodeStream = response.readableStreamBody;
        // Convert Node.js stream to Web ReadableStream
        return new ReadableStream({
            async start(controller) {
                for await (const chunk of nodeStream) {
                    controller.enqueue(new Uint8Array(chunk));
                }
                controller.close();
            },
        });
    }
    async delete(key) {
        const blobClient = this.getBlobClient(key);
        await blobClient.deleteIfExists();
    }
    async deleteMany(keys) {
        // Azure doesn't have batch delete in the same way as S3
        // Use parallel deletion
        await Promise.all(keys.map((key) => this.delete(key)));
    }
    async list(options = {}) {
        const prefix = options.prefix ? this.buildKey(options.prefix) : this.config.basePath || '';
        const files = [];
        const prefixes = [];
        const listOptions = {
            prefix,
            includeMetadata: true,
        };
        const pageSettings = {
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
        }
        else {
            iterator = this.containerClient
                .listBlobsFlat(listOptions)
                .byPage(pageSettings);
        }
        const page = await iterator.next();
        const segment = page.value;
        if (segment.segment?.blobItems) {
            for (const blob of segment.segment.blobItems) {
                const file = {
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
    async getMetadata(key) {
        const blobClient = this.getBlobClient(key);
        try {
            const properties = await blobClient.getProperties();
            const file = {
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
        }
        catch (error) {
            if (error.statusCode === 404) {
                return null;
            }
            throw error;
        }
    }
    async exists(key) {
        const blobClient = this.getBlobClient(key);
        return blobClient.exists();
    }
    async getSignedUrl(key, options = {}) {
        const blobClient = this.getBlobClient(key);
        const expiresIn = options.expiresIn || 3600;
        if (this.sharedKeyCredential) {
            // Generate SAS token with shared key
            const permissions = new BlobSASPermissions();
            if (options.method === 'PUT') {
                permissions.write = true;
                permissions.create = true;
            }
            else {
                permissions.read = true;
            }
            const sasOptions = {
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
            const sasToken = generateBlobSASQueryParameters(sasOptions, this.sharedKeyCredential).toString();
            return `${blobClient.url}?${sasToken}`;
        }
        // If using SAS token auth, can't generate new SAS
        // Return the blob URL (assumes it has appropriate SAS or is public)
        return blobClient.url;
    }
    async copy(sourceKey, destinationKey, options = {}) {
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
        return metadata;
    }
    getPublicUrl(key) {
        const blobClient = this.getBlobClient(key);
        return blobClient.url;
    }
}
//# sourceMappingURL=azure.js.map