/**
 * Google Cloud Storage Provider
 *
 * Full-featured GCS integration with streaming, signed URLs, and multipart uploads.
 */
import { Storage, Bucket, File, } from '@google-cloud/storage';
import { StorageClient, } from '../client.js';
import { detectMimeType } from '../utils/mime.js';
/**
 * Google Cloud Storage client
 */
export class GCSStorageClient extends StorageClient {
    storage;
    bucketRef;
    gcsConfig;
    constructor(config) {
        super(config);
        this.gcsConfig = config;
        const storageOptions = {};
        if (config.projectId) {
            storageOptions.projectId = config.projectId;
        }
        if (config.keyFilename) {
            storageOptions.keyFilename = config.keyFilename;
        }
        if (config.credentials) {
            storageOptions.credentials = config.credentials;
        }
        if (config.endpoint) {
            storageOptions.apiEndpoint = config.endpoint;
        }
        this.storage = new Storage(storageOptions);
        this.bucketRef = this.storage.bucket(config.bucket);
    }
    file(key) {
        return this.bucketRef.file(this.buildKey(key));
    }
    async upload(key, data, options = {}) {
        const file = this.file(key);
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
            contentType,
            metadata: {
                cacheControl: options.cacheControl,
                contentDisposition: options.contentDisposition,
                metadata: options.metadata,
            },
            resumable: options.multipart !== false && buffer.length > 5 * 1024 * 1024,
        };
        // Handle ACL
        if (options.acl === 'public-read') {
            uploadOptions.public = true;
        }
        else if (options.acl === 'private') {
            uploadOptions.private = true;
        }
        // Create a write stream for progress tracking
        if (options.onProgress) {
            const writeStream = file.createWriteStream(uploadOptions);
            return new Promise((resolve, reject) => {
                let uploaded = 0;
                const total = buffer.length;
                writeStream.on('error', reject);
                writeStream.on('finish', async () => {
                    const metadata = await this.getMetadata(key);
                    resolve(metadata);
                });
                // Write in chunks for progress
                const chunkSize = 64 * 1024; // 64KB chunks
                let offset = 0;
                const writeChunk = () => {
                    const chunk = buffer.slice(offset, offset + chunkSize);
                    if (chunk.length === 0) {
                        writeStream.end();
                        return;
                    }
                    offset += chunk.length;
                    uploaded += chunk.length;
                    options.onProgress({
                        loaded: uploaded,
                        total,
                        percentage: Math.round((uploaded / total) * 100),
                    });
                    if (!writeStream.write(chunk)) {
                        writeStream.once('drain', writeChunk);
                    }
                    else {
                        setImmediate(writeChunk);
                    }
                };
                writeChunk();
            });
        }
        await file.save(buffer, uploadOptions);
        const metadata = await this.getMetadata(key);
        return metadata;
    }
    async download(key, options = {}) {
        const file = this.file(key);
        // Download without options for simplicity, as GCS SDK typing is complex
        const downloadResult = await file.download();
        const buffer = downloadResult[0];
        // Apply range if specified
        if (options.rangeStart !== undefined || options.rangeEnd !== undefined) {
            const start = options.rangeStart ?? 0;
            const end = options.rangeEnd ?? buffer.length;
            const rangedBuffer = buffer.subarray(start, end + 1);
            if (options.onProgress) {
                options.onProgress({
                    loaded: rangedBuffer.length,
                    total: rangedBuffer.length,
                    percentage: 100,
                });
            }
            return rangedBuffer;
        }
        if (options.onProgress) {
            options.onProgress({
                loaded: buffer.length,
                total: buffer.length,
                percentage: 100,
            });
        }
        return buffer;
    }
    async downloadStream(key, options = {}) {
        const file = this.file(key);
        const streamOptions = {};
        if (options.rangeStart !== undefined) {
            streamOptions.start = options.rangeStart;
        }
        if (options.rangeEnd !== undefined) {
            streamOptions.end = options.rangeEnd;
        }
        const nodeStream = file.createReadStream(streamOptions);
        // Convert Node.js stream to Web ReadableStream
        return new ReadableStream({
            start(controller) {
                nodeStream.on('data', (chunk) => {
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
    async delete(key) {
        const file = this.file(key);
        await file.delete({ ignoreNotFound: true });
    }
    async deleteMany(keys) {
        await Promise.all(keys.map((key) => this.delete(key)));
    }
    async list(options = {}) {
        const prefix = options.prefix ? this.buildKey(options.prefix) : this.config.basePath;
        const getFilesOptions = {
            maxResults: options.maxResults || 1000,
            autoPaginate: false,
        };
        if (prefix !== undefined) {
            getFilesOptions.prefix = prefix;
        }
        if (options.delimiter !== undefined) {
            getFilesOptions.delimiter = options.delimiter;
        }
        if (options.continuationToken !== undefined) {
            getFilesOptions.pageToken = options.continuationToken;
        }
        const [files, , apiResponse] = await this.bucketRef.getFiles(getFilesOptions);
        const storageFiles = files.map((file) => ({
            key: this.stripBasePath(file.name),
            size: parseInt(file.metadata.size, 10) || 0,
            contentType: file.metadata.contentType || 'application/octet-stream',
            lastModified: new Date(file.metadata.updated),
            etag: file.metadata.etag,
            metadata: file.metadata.metadata,
        }));
        const prefixes = (apiResponse?.prefixes || []).map((p) => this.stripBasePath(p));
        return {
            files: storageFiles,
            prefixes,
            nextToken: apiResponse?.nextPageToken,
            isTruncated: !!apiResponse?.nextPageToken,
        };
    }
    async getMetadata(key) {
        const file = this.file(key);
        try {
            const [metadata] = await file.getMetadata();
            return {
                key,
                size: parseInt(metadata.size, 10) || 0,
                contentType: metadata.contentType || 'application/octet-stream',
                lastModified: new Date(metadata.updated),
                etag: metadata.etag,
                metadata: metadata.metadata,
            };
        }
        catch (error) {
            if (error.code === 404) {
                return null;
            }
            throw error;
        }
    }
    async exists(key) {
        const file = this.file(key);
        const [exists] = await file.exists();
        return exists;
    }
    async getSignedUrl(key, options = {}) {
        const file = this.file(key);
        const expiresIn = options.expiresIn || 3600;
        const signedUrlConfig = {
            version: 'v4',
            action: options.method === 'PUT' ? 'write' : 'read',
            expires: Date.now() + expiresIn * 1000,
        };
        if (options.contentType !== undefined) {
            signedUrlConfig.contentType = options.contentType;
        }
        if (options.responseContentType !== undefined) {
            signedUrlConfig.responseType = options.responseContentType;
        }
        if (options.responseContentDisposition !== undefined) {
            signedUrlConfig.responseDisposition = options.responseContentDisposition;
        }
        const [url] = await file.getSignedUrl(signedUrlConfig);
        return url;
    }
    async copy(sourceKey, destinationKey, options = {}) {
        const sourceFile = this.file(sourceKey);
        const destBucket = options.destinationBucket
            ? this.storage.bucket(options.destinationBucket)
            : this.bucketRef;
        const destFile = destBucket.file(this.buildKey(destinationKey));
        const gcsCopyOptions = {};
        if (options.contentType !== undefined) {
            gcsCopyOptions.contentType = options.contentType;
        }
        if (options.metadata !== undefined) {
            gcsCopyOptions.metadata = options.metadata;
        }
        await sourceFile.copy(destFile, gcsCopyOptions);
        // Handle ACL after copy
        if (options.acl === 'public-read') {
            await destFile.makePublic();
        }
        else if (options.acl === 'private') {
            await destFile.makePrivate();
        }
        const metadata = await this.getMetadata(destinationKey);
        return metadata;
    }
    getPublicUrl(key) {
        const fullKey = this.buildKey(key);
        return `https://storage.googleapis.com/${this.config.bucket}/${fullKey}`;
    }
}
//# sourceMappingURL=gcs.js.map